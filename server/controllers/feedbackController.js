import Feedback from "../models/Feedback.js";
import { sendInternalError } from "../utils/errorResponse.js";

const createFeedback = async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!name || !rating || !message) {
      return res.status(400).json({ success: false, message: "Name, rating, and message are required" });
    }
    const cleanName = String(name).trim().slice(0, 100);
    const cleanEmail = email ? String(email).trim().toLowerCase().slice(0, 255) : "";
    const cleanMessage = String(message).trim().slice(0, 2000);

    const feedback = await Feedback.create({
      name: cleanName,
      email: cleanEmail,
      rating,
      message: cleanMessage,
      user: req.user?._id,
    });
    res.status(201).json({ success: true, data: { feedback } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPublishedFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: { feedback } });
  } catch (error) {
    sendInternalError(res, error, "Failed to fetch feedback");
  }
};

const updateFeedback = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["published", "pending", "hidden"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }
    res.json({ success: true, data: { feedback } });
  } catch (error) {
    sendInternalError(res, error, "Failed to update feedback");
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }
    res.json({ success: true, message: "Feedback deleted" });
  } catch (error) {
    sendInternalError(res, error, "Failed to delete feedback");
  }
};

export { createFeedback, getPublishedFeedback, updateFeedback, deleteFeedback };
