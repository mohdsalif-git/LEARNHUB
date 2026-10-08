import express from "express";
import {
  getDashboardStats,
  getAdminAnalytics,
  getSettings,
  updateSettings,
  updateAdminProfile,
  changeAdminPassword,
  getUsers,
  updateUserRole,
  deleteUser,
  getPayments,
  getPublicSupporters,
  getSupportRequests,
  getAllFeedback,
  claimFirstAdmin,
  // Team
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  // Why Cards
  getWhyCards,
  getWhyCardsAdmin,
  createWhyCard,
  updateWhyCard,
  deleteWhyCard,
  // How Steps
  getHowSteps,
  getHowStepsAdmin,
  createHowStep,
  updateHowStep,
  deleteHowStep,
} from "../controllers/adminController.js";
import { updateFeedback, deleteFeedback } from "../controllers/feedbackController.js";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Dashboard & Analytics
router.get("/dashboard", authenticate, authorizeAdmin, getDashboardStats);
router.get("/analytics", authenticate, authorizeAdmin, getAdminAnalytics);

// Settings
router.get("/settings", authenticate, authorizeAdmin, getSettings);
router.put("/settings", authenticate, authorizeAdmin, updateSettings);
router.put("/profile", authenticate, authorizeAdmin, updateAdminProfile);
router.put("/password", authenticate, authorizeAdmin, changeAdminPassword);

// Users
router.get("/users", authenticate, authorizeAdmin, getUsers);
router.put("/users/:id/role", authenticate, authorizeAdmin, updateUserRole);
router.delete("/users/:id", authenticate, authorizeAdmin, deleteUser);

// Payments & Support
router.get("/payments", authenticate, authorizeAdmin, getPayments);
router.get("/supporters", getPublicSupporters);
router.get("/support", authenticate, authorizeAdmin, getSupportRequests);

// Feedback
router.get("/feedback", authenticate, authorizeAdmin, getAllFeedback);
router.put("/feedback/:id", authenticate, authorizeAdmin, updateFeedback);
router.delete("/feedback/:id", authenticate, authorizeAdmin, deleteFeedback);

// Claim first admin
router.post("/claim-admin", authenticate, claimFirstAdmin);

// ── Team Members ──
router.get("/team", authenticate, authorizeAdmin, getTeamMembers);
router.post("/team", authenticate, authorizeAdmin, createTeamMember);
router.put("/team/:id", authenticate, authorizeAdmin, updateTeamMember);
router.delete("/team/:id", authenticate, authorizeAdmin, deleteTeamMember);

// ── Why Cards (public GET so homepage can read) ──
router.get("/why-cards", getWhyCards);
router.get("/why-cards/all", authenticate, authorizeAdmin, getWhyCardsAdmin);
router.post("/why-cards", authenticate, authorizeAdmin, createWhyCard);
router.put("/why-cards/:id", authenticate, authorizeAdmin, updateWhyCard);
router.delete("/why-cards/:id", authenticate, authorizeAdmin, deleteWhyCard);

// ── How Steps (public GET so homepage can read) ──
router.get("/how-steps", getHowSteps);
router.get("/how-steps/all", authenticate, authorizeAdmin, getHowStepsAdmin);
router.post("/how-steps", authenticate, authorizeAdmin, createHowStep);
router.put("/how-steps/:id", authenticate, authorizeAdmin, updateHowStep);
router.delete("/how-steps/:id", authenticate, authorizeAdmin, deleteHowStep);

export default router;

