import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "URL is required"],
      trim: true,
    },
    platform: {
      type: String,
      enum: ["YouTube", "freeCodeCamp", "Edureka", "Google", "MDN", "Coursera", "Khan Academy", "GitHub", "Other"],
      default: "Other",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    duration: {
      type: String,
      default: "Self-paced",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    tags: [{ type: String, trim: true }],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    submitterName: {
      type: String,
      default: "",
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ title: "text", description: "text", tags: "text" });
resourceSchema.index({ category: 1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ featured: 1 });

export default mongoose.model("Resource", resourceSchema);
