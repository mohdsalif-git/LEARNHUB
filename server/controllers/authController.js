import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import moment from "moment";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    const expiresAt = moment().add(30, "days").toDate();
    
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user, token, expiresAt },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    const expiresAt = moment().add(30, "days").toDate();
    
    res.json({
      success: true,
      message: "Login successful",
      data: { user, token, expiresAt },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { credential, email: reqEmail, name: reqName, avatar: reqAvatar } = req.body;
    let email = reqEmail;
    let name = reqName;
    let avatar = reqAvatar || "";

    if (credential) {
      try {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || name || "Google User";
          avatar = decoded.picture || avatar;
        }
      } catch {
        // Continue with direct fields if decode fails
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required for Google login" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        avatar,
        provider: "google",
      });
    }

    const token = generateToken(user._id);
    const expiresAt = moment().add(30, "days").toDate();

    res.json({
      success: true,
      message: "Google login successful",
      data: { user, token, expiresAt },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { registerUser, loginUser, googleAuth, getMe };