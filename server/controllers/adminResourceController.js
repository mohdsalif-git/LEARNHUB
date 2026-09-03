import mongoose from "mongoose";
import Resource from "../models/Resource.js";
import Category from "../models/Category.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const getAdminResources = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, category, sort = "createdAt", order = "desc" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { tags: { $in: [new RegExp(escaped, "i")] } },
      ];
    }
    if (status) query.status = status;
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.$or = query.$or || [];
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
        .limit(parseInt(limit))
        .populate("categoryId", "name slug")
        .populate("submittedBy", "name email"),
      Resource.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { resources, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAdminResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getAdminResources,
  getAdminCategories,
  updateAdminResource,
  deleteAdminResource,
};