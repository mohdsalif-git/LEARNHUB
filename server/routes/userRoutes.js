import express from "express";
import {
  getViewHistory,
  recordViewHistory,
  removeViewHistoryItem,
  getUserDashboardStats,
  updateUserProfile,
  changeUserPassword,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me/view-history", authenticate, getViewHistory);
router.post("/me/view-history", authenticate, recordViewHistory);
router.post("/me/view-history/:resourceId", authenticate, recordViewHistory);
router.delete("/me/view-history/:resourceId", authenticate, removeViewHistoryItem);
router.get("/me/stats", authenticate, getUserDashboardStats);
router.put("/me/profile", authenticate, updateUserProfile);
router.put("/me/password", authenticate, changeUserPassword);

export default router;
