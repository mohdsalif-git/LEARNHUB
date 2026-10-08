import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import Category from "../models/Category.js";
import ViewHistory from "../models/ViewHistory.js";
import Setting from "../models/Setting.js";
import { escapeRegex, normalizeTags } from "../utils/queryHelpers.js";
import { sendInternalError } from "../utils/errorResponse.js";

const getResources = async (req, res) => {
  try {
    const { search, category, level, platform, featured, status, sort, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    const query = {};

    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { tags: { $regex: escaped, $options: "i" } },
      ];
    }

    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        // Move existing $or (search) into $and so neither overwrites the other
        query.$and = query.$and || [];
        if (query.$or) {
          query.$and.push({ $or: query.$or });
          delete query.$or;
        }
        query.$and.push({
          $or: [{ categoryId: category }, { category: category }],
        });
      } else {
        query.category = category;
      }
    }
    if (level) query.level = level;
    if (platform) query.platform = platform;
    if (featured === "true") query.featured = true;
    if (status) query.status = status;
    else query.status = "approved";

    let sortOption = { createdAt: -1 };
    if (sort === "rating") sortOption = { rating: -1 };
    else if (sort === "title") sortOption = { title: 1 };
    else if (sort === "oldest") sortOption = { createdAt: 1 };

    const skip = (pageNum - 1) * limitNum;
    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .populate("categoryId", "name slug");

    res.json({
      success: true,
      data: { resources, total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch resources");
  }
};

const getResourceById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    const resource = await Resource.findById(req.params.id).populate("categoryId", "name slug");
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, data: { resource } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch resource");
  }
};

const createResource = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.tags !== undefined) {
      payload.tags = normalizeTags(payload.tags);
    }
    const resource = await Resource.create(payload);
    res.status(201).json({ success: true, data: { resource } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    const payload = { ...req.body };
    if (payload.tags !== undefined) {
      payload.tags = normalizeTags(payload.tags);
    }
    const resource = await Resource.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, data: { resource } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, message: "Resource deleted" });
  } catch (error) {
    sendInternalError(res, error, "Failed to delete resource");
  }
};

const getCommunityResources = async (req, res) => {
  try {
    const { status = "approved" } = req.query;
    const resources = await Resource.find({ status })
      .sort({ createdAt: -1 })
      .populate("submittedBy", "name")
      .populate("categoryId", "name slug");
    res.json({ success: true, data: { resources } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch community resources");
  }
};

const submitCommunityResource = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    if (!settings.allowUserSubmissions) {
      return res.status(403).json({
        success: false,
        message: "Community resource submissions are currently disabled.",
      });
    }

    const payload = { ...req.body };
    if (payload.tags !== undefined) {
      payload.tags = normalizeTags(payload.tags);
    }

    const initialStatus = settings.requireApprovalForSubmissions ? "pending" : "approved";

    const resource = await Resource.create({
      ...payload,
      status: initialStatus,
      submittedBy: req.user?._id,
      submitterName: payload.submitterName || req.user?.name || "Anonymous",
    });
    res.status(201).json({ success: true, data: { resource } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const recordResourceView = async (req, res) => {
  try {
    const resourceId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ success: false, message: "Invalid resource ID" });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    if (req.user) {
      await ViewHistory.findOneAndUpdate(
        { user: req.user._id, resource: resourceId },
        {
          $set: { lastViewedAt: new Date() },
          $inc: { viewCount: 1 },
          $setOnInsert: { firstViewedAt: new Date() },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ success: true, message: "View recorded" });
  } catch (error) {
    sendInternalError(res, error, "Failed to record resource view");
  }
};

export {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getCommunityResources,
  submitCommunityResource,
  recordResourceView,
};
