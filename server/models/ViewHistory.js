import mongoose from "mongoose";

const viewHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
      index: true,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    firstViewedAt: {
      type: Date,
      default: Date.now,
    },
    viewCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

viewHistorySchema.index({ user: 1, resource: 1 }, { unique: true });
viewHistorySchema.index({ user: 1, lastViewedAt: -1 });

export default mongoose.model("ViewHistory", viewHistorySchema);
