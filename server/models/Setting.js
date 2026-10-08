import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: "LearnHub",
      trim: true,
    },
    platformDescription: {
      type: String,
      default: "One Search. All Knowledge. Zero Cost. Built for learners. Powered by community.",
      trim: true,
    },
    supportEmail: {
      type: String,
      default: "support@learnhub.dev",
      trim: true,
    },
    buyMeACoffeeUrl: {
      type: String,
      default: "https://buymeacoffee.com/learnhub",
      trim: true,
    },
    allowUserSubmissions: {
      type: Boolean,
      default: true,
    },
    requireApprovalForSubmissions: {
      type: Boolean,
      default: true,
    },
    logo: {
      type: String,
      default: "",
      trim: true,
    },
    heroTitle: {
      type: String,
      default: "Find the Best Free Learning Resources in One Place",
      trim: true,
    },
    heroSubtitle: {
      type: String,
      default: "Search free videos, tutorials and courses from YouTube, Edureka, Google, freeCodeCamp and more — organized for faster learning.",
      trim: true,
    },
    footerText: {
      type: String,
      default: "LearnHub is a community-driven curated directory of high quality free learning resources.",
      trim: true,
    },
    contactEmail: {
      type: String,
      default: "contact@learnhub.dev",
      trim: true,
    },
    socialLinks: {
      github: { type: String, default: "https://github.com" },
      twitter: { type: String, default: "https://twitter.com" },
      discord: { type: String, default: "https://discord.com" },
      linkedin: { type: String, default: "https://linkedin.com" },
      youtube: { type: String, default: "https://youtube.com" },
    },
  },
  { timestamps: true }
);

settingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model("Setting", settingSchema);
