import mongoose from "mongoose";

const howStepSchema = new mongoose.Schema(
  {
    number:      { type: String, required: true, default: "01" },
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    displayOrder:{ type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

howStepSchema.index({ displayOrder: 1 });

export default mongoose.model("HowStep", howStepSchema);
