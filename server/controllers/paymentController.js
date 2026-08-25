import Payment from "../models/Payment.js";
import crypto from "crypto";

const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", supporterName, supporterEmail, message, showPublicName } = req.body;

    if (!amount || !supporterName || !supporterEmail) {
      return res.status(400).json({ success: false, message: "Amount, name, and email are required" });
    }

    const payment = await Payment.create({
      amount: Math.round(amount),
      currency,
      supporterName,
      supporterEmail,
      message: message || "",
      showPublicName: showPublicName || false,
      status: "created",
      paymentGateway: "razorpay",
    });

    let razorpayOrder = null;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const Razorpay = (await import("razorpay")).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount) * 100,
        currency,
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
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;

    if (process.env.RAZORPAY_KEY_SECRET) {
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    payment.gatewayPaymentId = razorpay_payment_id;
    payment.gatewaySignature = razorpay_signature;
    payment.status = "successful";
    await payment.save();

    res.json({ success: true, message: "Payment verified successfully", data: { payment } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-razorpay-signature"];
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
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
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createOrder, verifyPayment, handleWebhook };
