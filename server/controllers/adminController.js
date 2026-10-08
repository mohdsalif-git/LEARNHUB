import bcrypt from "bcryptjs";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Resource from "../models/Resource.js";
import Category from "../models/Category.js";
import Bookmark from "../models/Bookmark.js";
import Feedback from "../models/Feedback.js";
import Support from "../models/Support.js";
import ViewHistory from "../models/ViewHistory.js";
import Setting from "../models/Setting.js";
import TeamMember from "../models/TeamMember.js";
import WhyCard from "../models/WhyCard.js";
import HowStep from "../models/HowStep.js";
import { escapeRegex } from "../utils/queryHelpers.js";
import { sendInternalError } from "../utils/errorResponse.js";

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalResources,
      totalCategories,
      totalBookmarks,
      totalPayments,
      totalFeedback,
      totalSupport,
      viewStats,
    ] = await Promise.all([
      User.countDocuments(),
      Resource.countDocuments(),
      Category.countDocuments(),
      Bookmark.countDocuments(),
      Payment.countDocuments({ status: "successful" }),
      Feedback.countDocuments(),
      Support.countDocuments(),
      ViewHistory.aggregate([{ $group: { _id: null, total: { $sum: "$viewCount" } } }]),
    ]);

    const totalViews = viewStats.length > 0 ? viewStats[0].total : 0;

    const recentResources = await Resource.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("submittedBy", "name email");
    const recentPayments = await Payment.find().sort({ createdAt: -1 }).limit(5);
    const recentFeedback = await Feedback.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalResources,
          totalCategories,
          totalBookmarks,
          totalPayments,
          totalFeedback,
          totalSupport,
          totalViews,
        },
        recentResources,
        recentPayments,
        recentFeedback,
      },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch dashboard stats");
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    let startDate = new Date(0);
    const now = new Date();

    if (period === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "30d") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === "90d") {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const [
      totalUsers,
      newUsers,
      totalResources,
      newResources,
      approvedResources,
      pendingResources,
      rejectedResources,
      totalBookmarks,
      periodBookmarks,
      totalFeedback,
      feedbackRatingAgg,
      viewAggTotal,
      viewAggPeriod,
      paymentAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Resource.countDocuments(),
      Resource.countDocuments({ createdAt: { $gte: startDate } }),
      Resource.countDocuments({ status: "approved" }),
      Resource.countDocuments({ status: "pending" }),
      Resource.countDocuments({ status: "rejected" }),
      Bookmark.countDocuments(),
      Bookmark.countDocuments({ createdAt: { $gte: startDate } }),
      Feedback.countDocuments(),
      Feedback.aggregate([
        { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
      ViewHistory.aggregate([{ $group: { _id: null, total: { $sum: "$viewCount" } } }]),
      ViewHistory.aggregate([
        { $match: { lastViewedAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: "$viewCount" } } },
      ]),
      Payment.aggregate([
        { $match: { status: "successful" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalViews = viewAggTotal.length > 0 ? viewAggTotal[0].total : 0;
    const periodViews = viewAggPeriod.length > 0 ? viewAggPeriod[0].total : 0;
    const avgRating = feedbackRatingAgg.length > 0 ? Number(feedbackRatingAgg[0].avgRating.toFixed(1)) : 0;
    const totalRevenue = paymentAgg.length > 0 ? paymentAgg[0].totalRevenue : 0;
    const totalPayments = paymentAgg.length > 0 ? paymentAgg[0].count : 0;

    // Time series growth aggregations
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const resourceGrowth = await Resource.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Breakdown aggregations
    const categoryStats = await Resource.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const platformStats = await Resource.aggregate([
      { $group: { _id: "$platform", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const levelStats = await Resource.aggregate([
      { $group: { _id: "$level", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top resources by views
    const topViewed = await ViewHistory.aggregate([
      { $group: { _id: "$resource", totalViews: { $sum: "$viewCount" } } },
      { $sort: { totalViews: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "resources",
          localField: "_id",
          foreignField: "_id",
          as: "resource",
        },
      },
      { $unwind: "$resource" },
      {
        $project: {
          _id: 1,
          totalViews: 1,
          title: "$resource.title",
          platform: "$resource.platform",
          category: "$resource.category",
        },
      },
    ]);

    // Top resources by bookmarks
    const topBookmarked = await Bookmark.aggregate([
      { $group: { _id: "$resource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "resources",
          localField: "_id",
          foreignField: "_id",
          as: "resource",
        },
      },
      { $unwind: "$resource" },
      {
        $project: {
          _id: 1,
          count: 1,
          title: "$resource.title",
          platform: "$resource.platform",
          category: "$resource.category",
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalUsers,
          newUsers,
          totalResources,
          newResources,
          approvedResources,
          pendingResources,
          rejectedResources,
          totalViews,
          periodViews,
          totalBookmarks,
          periodBookmarks,
          totalFeedback,
          avgRating,
          totalPayments,
          totalRevenue,
        },
        userGrowth: userGrowth.map((item) => ({ date: item._id, count: item.count })),
        resourceGrowth: resourceGrowth.map((item) => ({ date: item._id, count: item.count })),
        categoryDistribution: categoryStats.map((item) => ({ name: item._id || "Other", count: item.count })),
        platformDistribution: platformStats.map((item) => ({ name: item._id || "Other", count: item.count })),
        levelDistribution: levelStats.map((item) => ({ name: item._id || "Unknown", count: item.count })),
        topViewed,
        topBookmarked,
      },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch analytics");
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    res.json({ success: true, data: { settings } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch settings");
  }
};

const updateSettings = async (req, res) => {
  try {
    const {
      platformName,
      platformDescription,
      supportEmail,
      buyMeACoffeeUrl,
      allowUserSubmissions,
      requireApprovalForSubmissions,
      logo,
      heroTitle,
      heroSubtitle,
      footerText,
      contactEmail,
      socialLinks,
    } = req.body;

    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({});
    }

    if (platformName !== undefined) settings.platformName = platformName.trim();
    if (platformDescription !== undefined) settings.platformDescription = platformDescription.trim();
    if (supportEmail !== undefined) settings.supportEmail = supportEmail.trim();
    if (buyMeACoffeeUrl !== undefined) settings.buyMeACoffeeUrl = buyMeACoffeeUrl.trim();
    if (allowUserSubmissions !== undefined) settings.allowUserSubmissions = Boolean(allowUserSubmissions);
    if (requireApprovalForSubmissions !== undefined) settings.requireApprovalForSubmissions = Boolean(requireApprovalForSubmissions);
    if (logo !== undefined) settings.logo = logo.trim();
    if (heroTitle !== undefined) settings.heroTitle = heroTitle.trim();
    if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle.trim();
    if (footerText !== undefined) settings.footerText = footerText.trim();
    if (contactEmail !== undefined) settings.contactEmail = contactEmail.trim();
    if (socialLinks !== undefined && typeof socialLinks === "object") {
      settings.socialLinks = { ...settings.socialLinks?.toObject?.() || settings.socialLinks, ...socialLinks };
    }

    await settings.save();
    res.json({ success: true, data: { settings }, message: "Settings updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.name = name.trim();
    if (email && email.trim() && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      user.email = email.trim().toLowerCase();
    }

    await user.save();
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to update admin profile");
  }
};

const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    sendInternalError(res, error, "Failed to change password");
  }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, sort = "createdAt", order = "desc" } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }
    if (role) query.role = role;

    const sortOption = { [sort]: order === "asc" ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query).sort(sortOption).skip(skip).limit(limitNum).select("-password"),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { users, total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch users");
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    sendInternalError(res, error, "Failed to update user role");
  }
};

const getPayments = async (req, res) => {
  try {
    const { page, limit } = req.query;
    if (page) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      const skip = (pageNum - 1) * limitNum;
      const [payments, total] = await Promise.all([
        Payment.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Payment.countDocuments(),
      ]);
      return res.json({
        success: true,
        data: { payments, total, page: pageNum, pages: Math.ceil(total / limitNum) },
      });
    }

    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 100));
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(limitNum);
    res.json({ success: true, data: { payments } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch payments");
  }
};

const getPublicSupporters = async (req, res) => {
  try {
    const supporters = await Payment.find({
      status: "successful",
      showPublicName: true,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("supporterName amount currency message createdAt");
    res.json({ success: true, data: { supporters } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch public supporters");
  }
};

const getSupportRequests = async (req, res) => {
  try {
    const { page, limit } = req.query;
    if (page) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      const skip = (pageNum - 1) * limitNum;
      const [requests, total] = await Promise.all([
        Support.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate("user", "name email"),
        Support.countDocuments(),
      ]);
      return res.json({
        success: true,
        data: { requests, total, page: pageNum, pages: Math.ceil(total / limitNum) },
      });
    }

    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 100));
    const requests = await Support.find().sort({ createdAt: -1 }).limit(limitNum).populate("user", "name email");
    res.json({ success: true, data: { requests } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch support requests");
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, sort = "createdAt", order = "desc" } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { message: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }
    if (status) query.status = status;

    const sortOption = { [sort]: order === "asc" ? 1 : -1 };

    const [feedback, total] = await Promise.all([
      Feedback.find(query).sort(sortOption).skip(skip).limit(limitNum).populate("user", "name email"),
      Feedback.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { feedback, total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch feedback");
  }
};

const claimFirstAdmin = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount > 0) {
      return res.status(403).json({ success: false, message: "Admin already exists" });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.role = "admin";
    await user.save();
    res.json({ success: true, message: "Admin role claimed", data: { user } });
  } catch (error) {
    sendInternalError(res, error, "Failed to claim admin role");
  }
};


// ─── Delete User ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Cannot delete the last admin
    if (target.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "Cannot delete the last admin account" });
      }
    }

    await User.findByIdAndDelete(id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    sendInternalError(res, error, "Failed to delete user");
  }
};

// ─── Team Members ─────────────────────────────────────────────────────────────
const getTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: { members } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch team members");
  }
};

const createTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.create(req.body);
    res.status(201).json({ success: true, data: { member } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });
    res.json({ success: true, data: { member } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: "Team member not found" });
    res.json({ success: true, message: "Team member deleted" });
  } catch (error) {
    sendInternalError(res, error, "Failed to delete team member");
  }
};

// ─── Why Cards ────────────────────────────────────────────────────────────────
const getWhyCards = async (req, res) => {
  try {
    const cards = await WhyCard.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: { cards } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch why cards");
  }
};

const getWhyCardsAdmin = async (req, res) => {
  try {
    const cards = await WhyCard.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: { cards } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch why cards");
  }
};

const createWhyCard = async (req, res) => {
  try {
    const card = await WhyCard.create(req.body);
    res.status(201).json({ success: true, data: { card } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateWhyCard = async (req, res) => {
  try {
    const card = await WhyCard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!card) return res.status(404).json({ success: false, message: "Why card not found" });
    res.json({ success: true, data: { card } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteWhyCard = async (req, res) => {
  try {
    const card = await WhyCard.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: "Why card not found" });
    res.json({ success: true, message: "Why card deleted" });
  } catch (error) {
    sendInternalError(res, error, "Failed to delete why card");
  }
};

// ─── How Steps ────────────────────────────────────────────────────────────────
const getHowSteps = async (req, res) => {
  try {
    const steps = await HowStep.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: { steps } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch how steps");
  }
};

const getHowStepsAdmin = async (req, res) => {
  try {
    const steps = await HowStep.find().sort({ displayOrder: 1, createdAt: 1 });
    res.json({ success: true, data: { steps } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch how steps");
  }
};

const createHowStep = async (req, res) => {
  try {
    const step = await HowStep.create(req.body);
    res.status(201).json({ success: true, data: { step } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateHowStep = async (req, res) => {
  try {
    const step = await HowStep.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!step) return res.status(404).json({ success: false, message: "How step not found" });
    res.json({ success: true, data: { step } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteHowStep = async (req, res) => {
  try {
    const step = await HowStep.findByIdAndDelete(req.params.id);
    if (!step) return res.status(404).json({ success: false, message: "How step not found" });
    res.json({ success: true, message: "How step deleted" });
  } catch (error) {
    sendInternalError(res, error, "Failed to delete how step");
  }
};

export {
  getDashboardStats,
  getAdminAnalytics,
  getSettings,
  updateSettings,
  updateAdminProfile,
  changeAdminPassword,
  getUsers,
  updateUserRole,
  deleteUser,
  getPayments,
  getPublicSupporters,
  getSupportRequests,
  getAllFeedback,
  claimFirstAdmin,
  // Team
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  // Why Cards
  getWhyCards,
  getWhyCardsAdmin,
  createWhyCard,
  updateWhyCard,
  deleteWhyCard,
  // How Steps
  getHowSteps,
  getHowStepsAdmin,
  createHowStep,
  updateHowStep,
  deleteHowStep,
};