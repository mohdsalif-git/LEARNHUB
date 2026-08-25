import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Resource from "../models/Resource.js";
import Category from "../models/Category.js";
import Bookmark from "../models/Bookmark.js";
import Feedback from "../models/Feedback.js";
import Support from "../models/Support.js";

const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalResources, totalCategories, totalBookmarks, totalPayments, totalFeedback, totalSupport] =
      await Promise.all([
        User.countDocuments(),
        Resource.countDocuments(),
        Category.countDocuments(),
        Bookmark.countDocuments(),
        Payment.countDocuments({ status: "successful" }),
        Feedback.countDocuments(),
        Support.countDocuments(),
      ]);

    const recentResources = await Resource.find().sort({ createdAt: -1 }).limit(5).populate("submittedBy", "name email");
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
        },
        recentResources,
        recentPayments,
        recentFeedback,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password");
    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSupportRequests = async (req, res) => {
  try {
    const requests = await Support.find().sort({ createdAt: -1 }).populate("user", "name email");
    res.json({ success: true, data: { requests } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 }).populate("user", "name email");
    res.json({ success: true, data: { feedback } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getDashboardStats,
  getUsers,
  updateUserRole,
  getPayments,
  getPublicSupporters,
  getSupportRequests,
  getAllFeedback,
  claimFirstAdmin,
};
