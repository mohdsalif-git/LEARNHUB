import Bookmark from "../models/Bookmark.js";

const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate("resource")
      .sort({ createdAt: -1 });
    const validBookmarks = bookmarks.filter((b) => b.resource != null);
    res.json({ success: true, data: { bookmarks: validBookmarks } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addBookmark = async (req, res) => {
  try {
    const { resourceId } = req.body;
    if (!resourceId) {
      return res.status(400).json({ success: false, message: "Resource ID is required" });
    }

    const existing = await Bookmark.findOne({ user: req.user._id, resource: resourceId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Already bookmarked" });
    }

    const bookmark = await Bookmark.create({ user: req.user._id, resource: resourceId });
    res.status(201).json({ success: true, data: { bookmark } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const removeBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user._id,
      resource: req.params.resourceId,
    });
    if (!bookmark) {
      return res.status(404).json({ success: false, message: "Bookmark not found" });
    }
    res.json({ success: true, message: "Bookmark removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const { resourceId } = req.body;
    if (!resourceId) {
      return res.status(400).json({ success: false, message: "Resource ID is required" });
    }

    const existing = await Bookmark.findOne({ user: req.user._id, resource: resourceId });
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ success: true, data: { bookmarked: false } });
    }

    await Bookmark.create({ user: req.user._id, resource: resourceId });
    res.json({ success: true, data: { bookmarked: true } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getBookmarks, addBookmark, removeBookmark, toggleBookmark };
