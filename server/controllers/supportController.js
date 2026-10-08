import Support from "../models/Support.js";
import { sendInternalError } from "../utils/errorResponse.js";

const createSupportRequest = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSubject = String(subject).trim();
    const cleanMessage = String(message).trim();

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (cleanName.length > 100) {
      return res.status(400).json({ success: false, message: "Name must not exceed 100 characters" });
    }
    if (cleanEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }
    if (cleanSubject.length > 200) {
      return res.status(400).json({ success: false, message: "Subject must not exceed 200 characters" });
    }
    if (cleanMessage.length > 2000) {
      return res.status(400).json({ success: false, message: "Message must not exceed 2000 characters" });
    }

    const support = await Support.create({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
      user: req.user?._id,
    });
    res.status(201).json({ success: true, data: { support } });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    sendInternalError(res, error, "Failed to submit support request");
  }
};

export { createSupportRequest };
