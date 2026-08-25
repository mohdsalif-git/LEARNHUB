import Support from "../models/Support.js";

const createSupportRequest = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    const support = await Support.create({
      name,
      email,
      subject,
      message,
      user: req.user?._id,
    });
    res.status(201).json({ success: true, data: { support } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export { createSupportRequest };
