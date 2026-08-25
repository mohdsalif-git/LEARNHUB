import Feedback from "../models/Feedback.js";

const createFeedback = async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    if (!name || !rating || !message) {
      return res.status(400).json({ success: false, message: "Name, rating, and message are required" });
    }
    const feedback = await Feedback.create({
      name,
      email,
      rating,
      message,
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
    res.status(500).json({ success: false, message: error.message });
  }
};

export { createFeedback, getPublishedFeedback };
