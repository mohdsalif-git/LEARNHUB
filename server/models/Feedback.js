import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["published", "pending", "hidden"],
      default: "published",
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1 });

export default mongoose.model("Feedback", feedbackSchema);
