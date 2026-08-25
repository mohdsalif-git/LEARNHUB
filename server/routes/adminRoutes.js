import express from "express";
import {
  getDashboardStats,
  getUsers,
  updateUserRole,
  getPayments,
  getPublicSupporters,
  getSupportRequests,
  getAllFeedback,
  claimFirstAdmin,
} from "../controllers/adminController.js";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", authenticate, authorizeAdmin, getDashboardStats);
router.get("/users", authenticate, authorizeAdmin, getUsers);
router.put("/users/:id/role", authenticate, authorizeAdmin, updateUserRole);
router.get("/payments", authenticate, authorizeAdmin, getPayments);
router.get("/supporters", getPublicSupporters);
router.get("/support", authenticate, authorizeAdmin, getSupportRequests);
router.get("/feedback", authenticate, authorizeAdmin, getAllFeedback);
router.post("/claim-admin", authenticate, claimFirstAdmin);

export default router;
