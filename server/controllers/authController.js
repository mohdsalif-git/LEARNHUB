import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { sendInternalError } from "../utils/errorResponse.js";

const getGoogleClient = () => new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    if (cleanName.length > 100) {
      return res.status(400).json({ success: false, message: "Name must not exceed 100 characters" });
    }

    if (cleanEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    if (cleanPassword.length < 6 || cleanPassword.length > 128) {
      return res.status(400).json({ success: false, message: "Password must be between 6 and 128 characters" });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name: cleanName, email: cleanEmail, password: cleanPassword });
    const token = generateToken(user._id);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user, token, expiresAt },
    });
  } catch (error) {
    sendInternalError(res, error, "Registration failed");
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Reject Google-only accounts trying to use password login
    if (user.authProvider === "google" && !user.password) {
      return res.status(401).json({ success: false, message: "This account uses Google sign-in. Please continue with Google." });
    }

    if (!user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    res.json({
      success: true,
      message: "Login successful",
      data: { user, token, expiresAt },
    });
  } catch (error) {
    sendInternalError(res, error, "Login failed");
  }
};


const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // BUG #8 FIX: Return expiresAt so AuthContext can schedule token refresh.
    // We read expiresAt from the token in the Authorization header rather than
    // relying on a stored value, ensuring it matches the real token lifetime.
    let expiresAt = null;
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (token) {
        const decoded = jwt.decode(token);
        if (decoded?.exp) {
          expiresAt = new Date(decoded.exp * 1000).toISOString();
        }
      }
    } catch {
      // Non-fatal — expiresAt will remain null
    }
    res.json({ success: true, data: { user, expiresAt } });
  } catch (error) {
    sendInternalError(res, error, "Failed to retrieve user profile");
  }
};

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ success: false, message: "Google authentication is not configured on this server" });
    }

    // Verify the ID token server-side — never trust the frontend
    let payload;
    try {
      const client = getGoogleClient();
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired Google token. Please try signing in again." });
    }

    // Reject unverified email addresses
    if (!payload.email_verified) {
      return res.status(401).json({ success: false, message: "Your Google account email is not verified. Please verify your email with Google and try again." });
    }

    const { sub: googleId, email, name, picture } = payload;
    const cleanEmail = email.toLowerCase();

    // Look up user by googleId first, then by email (for linking)
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if a local account exists with the same verified email
      user = await User.findOne({ email: cleanEmail });

      if (user) {
        // Link the existing local account to the Google account
        user.googleId = googleId;
        if (!user.avatar) {
          user.avatar = picture || "";
        }
        await user.save();
      } else {
        // Create a brand-new Google account
        user = await User.create({
          name: name || cleanEmail,
          email: cleanEmail,
          googleId,
          authProvider: "google",
          avatar: picture || "",
        });
      }
    }

    const token = generateToken(user._id);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    res.json({
      success: true,
      message: "Google sign-in successful",
      data: { user, token, expiresAt },
    });
  } catch (error) {
    sendInternalError(res, error, "Google authentication failed");
  }
};

export { registerUser, loginUser, getMe, googleAuth };