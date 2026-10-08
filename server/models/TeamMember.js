import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    bio:  { type: String, default: "", trim: true },
    photo: { type: String, default: "" },
    initials: { type: String, default: "" },
    color: { type: String, default: "oklch(0.55 0.22 285)" },
    socialLinks: {
      github:   { type: String, default: "" },
      twitter:  { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website:  { type: String, default: "" },
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teamMemberSchema.index({ displayOrder: 1 });

export default mongoose.model("TeamMember", teamMemberSchema);
