import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    supporterName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    supporterEmail: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 1,
    },
    currency: {
      type: String,
      default: "INR",
    },
    message: {
      type: String,
      default: "",
    },
    showPublicName: {
      type: Boolean,
      default: false,
    },
    paymentGateway: {
      type: String,
      default: "razorpay",
    },
    gatewayOrderId: {
      type: String,
    },
    gatewayPaymentId: {
      type: String,
    },
    gatewaySignature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["created", "pending", "successful", "failed", "refunded"],
      default: "created",
    },
    failureReason: {
      type: String,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1 });
paymentSchema.index({ user: 1 });

export default mongoose.model("Payment", paymentSchema);
