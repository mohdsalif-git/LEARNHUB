import mongoose from "mongoose";

const whyCardSchema = new mongoose.Schema(
  {
    icon:        { type: String, required: true, default: "zap" },
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    displayOrder:{ type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

whyCardSchema.index({ displayOrder: 1 });

export default mongoose.model("WhyCard", whyCardSchema);
