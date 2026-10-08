import mongoose from "mongoose";
import ViewHistory from "../models/ViewHistory.js";
import Resource from "../models/Resource.js";
import Bookmark from "../models/Bookmark.js";
import User from "../models/User.js";
import { sendInternalError } from "../utils/errorResponse.js";

const getViewHistory = async (req, res) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 30));
    const skip = (pageNum - 1) * limitNum;

    // Use aggregate with $lookup to ensure we only count and return view history where resource actually exists
    const [result] = await ViewHistory.aggregate([
      { $match: { user: req.user._id } },
      {
        $lookup: {
          from: "resources",
          localField: "resource",
          foreignField: "_id",
          as: "resourceDoc",
        },
      },
      { $match: { "resourceDoc.0": { $exists: true } } },
      {
        $facet: {
          total: [{ $count: "count" }],
          history: [
            { $sort: { lastViewedAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
          ],
        },
      },
    ]);

    const total = result?.total?.[0]?.count || 0;
    const historyIds = (result?.history || []).map((h) => h._id);

    // Populate the paginated slice
    const history = await ViewHistory.find({ _id: { $in: historyIds } })
      .populate({
        path: "resource",
        populate: { path: "categoryId", select: "name slug" },
      })
      .sort({ lastViewedAt: -1 });

    res.json({
      success: true,
      data: {
        history,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch view history");
  }
};

const recordViewHistory = async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.body.resourceId;
    if (!resourceId) {
      return res.status(400).json({ success: false, message: "Resource ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ success: false, message: "Invalid resource ID" });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    const history = await ViewHistory.findOneAndUpdate(
      { user: req.user._id, resource: resourceId },
      {
        $set: { lastViewedAt: new Date() },
        $inc: { viewCount: 1 },
        $setOnInsert: { firstViewedAt: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate({
      path: "resource",
      populate: { path: "categoryId", select: "name slug" },
    });

    res.json({ success: true, data: { history } });
  } catch (error) {
    sendInternalError(res, error, "Failed to record view history");
  }
};

const removeViewHistoryItem = async (req, res) => {
  try {
    const { resourceId } = req.params;
    await ViewHistory.findOneAndDelete({
      user: req.user._id,
      resource: resourceId,
    });
    res.json({ success: true, message: "History item removed" });
  } catch (error) {
    sendInternalError(res, error, "Failed to remove history item");
  }
};

const getUserDashboardStats = async (req, res) => {
  try {
    const [savedCount, viewedCount] = await Promise.all([
      Bookmark.countDocuments({ user: req.user._id }),
      ViewHistory.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      success: true,
      data: {
        savedCount,
        viewedCount,
        memberSince: req.user.createdAt,
      },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch dashboard stats");
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.name = name.trim();
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to update profile");
  }
};

const changeUserPassword = async (req, res) => {
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

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to change password");
  }
};

export {
  getViewHistory,
  recordViewHistory,
  removeViewHistoryItem,
  getUserDashboardStats,
  updateUserProfile,
  changeUserPassword,
};
