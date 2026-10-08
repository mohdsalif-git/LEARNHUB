import mongoose from "mongoose";
import Bookmark from "../models/Bookmark.js";
import Resource from "../models/Resource.js";
import { escapeRegex } from "../utils/queryHelpers.js";
import { sendInternalError } from "../utils/errorResponse.js";

const getBookmarks = async (req, res) => {
  try {
    const { sort, category, search } = req.query;

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const bookmarkQuery = { user: req.user._id };

    // Build resource criteria to filter at DB level
    const resourceFilter = {};
    let hasResourceFilter = false;

    if (category && category !== "all") {
      hasResourceFilter = true;
      if (mongoose.Types.ObjectId.isValid(category)) {
        resourceFilter.$or = [{ categoryId: category }, { category: category }];
      } else {
        resourceFilter.category = category;
      }
    }

    if (search && search.trim()) {
      hasResourceFilter = true;
      const escaped = escapeRegex(search.trim());
      const searchOr = [
        { title: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { platform: { $regex: escaped, $options: "i" } },
      ];
      if (resourceFilter.$or) {
        resourceFilter.$and = [{ $or: resourceFilter.$or }, { $or: searchOr }];
        delete resourceFilter.$or;
      } else {
        resourceFilter.$or = searchOr;
      }
    }

    if (hasResourceFilter) {
      const matchingResources = await Resource.find(resourceFilter).select("_id");
      bookmarkQuery.resource = { $in: matchingResources.map((r) => r._id) };
    }

    const bookmarks = await Bookmark.find(bookmarkQuery)
      .populate({
        path: "resource",
        populate: { path: "categoryId", select: "name slug" },
      })
      .sort(sortOption);

    let validBookmarks = bookmarks.filter((b) => b.resource != null);

    if (sort === "rating") {
      validBookmarks.sort((a, b) => (b.resource.rating || 0) - (a.resource.rating || 0));
    } else if (sort === "title") {
      validBookmarks.sort((a, b) => (a.resource.title || "").localeCompare(b.resource.title || ""));
    }

    res.json({ success: true, data: { bookmarks: validBookmarks, total: validBookmarks.length } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch saved bookmarks");
  }
};

const addBookmark = async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.body.resourceId;
    if (!resourceId) {
      return res.status(400).json({ success: false, message: "Resource ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ success: false, message: "Invalid resource ID" });
    }

    const resourceExists = await Resource.findById(resourceId);
    if (!resourceExists) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    const existing = await Bookmark.findOne({ user: req.user._id, resource: resourceId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Already saved" });
    }

    const bookmark = await Bookmark.create({ user: req.user._id, resource: resourceId });
    const populated = await Bookmark.findById(bookmark._id).populate({
      path: "resource",
      populate: { path: "categoryId", select: "name slug" },
    });

    res.status(201).json({ success: true, data: { bookmark: populated } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const removeBookmark = async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.body.resourceId;
    if (!resourceId) {
      return res.status(400).json({ success: false, message: "Resource ID is required" });
    }

    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user._id,
      resource: resourceId,
    });

    if (!bookmark) {
      return res.status(404).json({ success: false, message: "Saved resource not found" });
    }

    res.json({ success: true, message: "Resource removed from saved collection" });
  } catch (error) {
    sendInternalError(res, error, "Failed to remove bookmark");
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const resourceId = req.params.resourceId || req.body.resourceId;
    if (!resourceId) {
      return res.status(400).json({ success: false, message: "Resource ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ success: false, message: "Invalid resource ID" });
    }

    const existing = await Bookmark.findOne({ user: req.user._id, resource: resourceId });
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ success: true, data: { bookmarked: false, message: "Resource removed" } });
    }

    const resourceExists = await Resource.findById(resourceId);
    if (!resourceExists) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    await Bookmark.create({ user: req.user._id, resource: resourceId });
    res.json({ success: true, data: { bookmarked: true, message: "Resource saved" } });
  } catch (error) {
    sendInternalError(res, error, "Failed to toggle bookmark");
  }
};

export { getBookmarks, addBookmark, removeBookmark, toggleBookmark };
