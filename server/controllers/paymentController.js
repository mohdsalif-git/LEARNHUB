import Payment from "../models/Payment.js";
import crypto from "crypto";
import mongoose from "mongoose";
import { sendInternalError } from "../utils/errorResponse.js";

const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", supporterName, supporterEmail, message, showPublicName } = req.body;

    if (!amount || !supporterName || !supporterEmail) {
      return res.status(400).json({ success: false, message: "Amount, name, and email are required" });
    }

    // BUG #4 FIX: Validate amount is a valid number before using it
    const roundedAmount = Math.round(amount);
    if (Number.isNaN(roundedAmount)) {
      return res.status(400).json({ success: false, message: "Invalid amount: must be a number" });
    }
    if (roundedAmount < 1) {
      return res.status(400).json({ success: false, message: "Amount must be at least 1" });
    }

    const cleanSupporterName = String(supporterName).trim().slice(0, 100);
    const cleanSupporterEmail = String(supporterEmail).trim().toLowerCase().slice(0, 255);
    const cleanMessage = message ? String(message).trim().slice(0, 500) : "";

    const payment = await Payment.create({
      amount: roundedAmount,
      currency: typeof currency === "string" ? currency.trim().slice(0, 10) : "INR",
      supporterName: cleanSupporterName,
      supporterEmail: cleanSupporterEmail,
      message: cleanMessage,
      showPublicName: Boolean(showPublicName),
      status: "created",
      paymentGateway: "razorpay",
      user: req.user?._id || undefined,
    });

    let razorpayOrder = null;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      razorpayOrder = await razorpay.orders.create({
        amount: roundedAmount * 100,
        currency: payment.currency,
        receipt: payment._id.toString(),
      });

      payment.gatewayOrderId = razorpayOrder.id;
      payment.status = "pending";
      await payment.save();
    }

    res.json({
      success: true,
      data: {
        payment,
        razorpayOrder,
        keyId: process.env.RAZORPAY_KEY_ID || null,
      },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to create payment order");
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ success: false, message: "Payment gateway not configured" });
    }

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string" ||
      !razorpay_order_id.trim() ||
      !razorpay_payment_id.trim() ||
      !razorpay_signature.trim()
    ) {
      return res.status(400).json({ success: false, message: "Invalid payment verification parameters" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    let payment = null;
    if (paymentId && mongoose.Types.ObjectId.isValid(paymentId)) {
      payment = await Payment.findById(paymentId);
    }
    if (!payment && razorpay_order_id) {
      payment = await Payment.findOne({ gatewayOrderId: razorpay_order_id });
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    payment.gatewayPaymentId = razorpay_payment_id || payment.gatewayPaymentId;
    payment.gatewaySignature = razorpay_signature || payment.gatewaySignature;
    payment.status = "successful";
    await payment.save();

    res.json({ success: true, message: "Payment verified successfully", data: { payment } });
  } catch (error) {
    sendInternalError(res, error, "Failed to verify payment");
  }
};

const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-razorpay-signature"];
      // BUG #5 FIX: Use the raw body buffer for HMAC to match Razorpay's signature.
      // req.rawBody is set by express.raw() middleware on this route (see paymentRoutes.js).
      // Fallback to JSON.stringify only when raw body is unavailable (dev/testing).
      const bodyForHmac = req.rawBody || JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyForHmac)
        .digest("hex");

      if (expectedSignature !== signature) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
      }
    }

    const event = req.body;
    if (event.event === "payment.captured") {
      const paymentData = event.payload.payment.entity;
      await Payment.findOneAndUpdate(
        { gatewayOrderId: paymentData.order_id },
        {
          gatewayPaymentId: paymentData.id,
          status: "successful",
        }
      );
    } else if (event.event === "payment.failed") {
      const paymentData = event.payload.payment.entity;
      await Payment.findOneAndUpdate(
        { gatewayOrderId: paymentData.order_id },
        {
          status: "failed",
          failureReason: paymentData.error_description || "Payment failed",
        }
      );
    }

    res.json({ success: true });
  } catch (error) {
    sendInternalError(res, error, "Failed to process payment webhook");
  }
};

export { createOrder, verifyPayment, handleWebhook };
