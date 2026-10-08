import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import Category from "../models/Category.js";
import { escapeRegex, normalizeTags } from "../utils/queryHelpers.js";
import { sendInternalError } from "../utils/errorResponse.js";

const getAdminResources = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, category, sort = "createdAt", order = "desc" } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { tags: { $regex: escaped, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        // If a search $or already exists, move it into $and to avoid overwrite
        if (query.$or) {
          query.$and = query.$and || [];
          query.$and.push({ $or: query.$or });
          delete query.$or;
        }
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ categoryId: category }, { category: category }],
        });
      } else {
        query.category = category;
      }
    }

    const sortOption = { [sort]: order === "asc" ? 1 : -1 };

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate("categoryId", "name slug")
        .populate("submittedBy", "name email"),
      Resource.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { resources, total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch admin resources");
  }
};

const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch categories");
  }
};

const updateAdminResource = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.tags !== undefined) {
      payload.tags = normalizeTags(payload.tags);
    }
    const resource = await Resource.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    }).populate("categoryId", "name slug");
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, data: { resource } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteAdminResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }
    res.json({ success: true, message: "Resource deleted" });
  } catch (error) {
    sendInternalError(res, error, "Failed to delete resource");
  }
};

export {
  getAdminResources,
  getAdminCategories,
  updateAdminResource,
  deleteAdminResource,
};