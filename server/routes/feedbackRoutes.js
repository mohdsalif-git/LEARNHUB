import express from "express";
import { createFeedback, getPublishedFeedback, updateFeedback, deleteFeedback } from "../controllers/feedbackController.js";
import { authenticate, optionalAuthenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPublishedFeedback);
router.post("/", optionalAuthenticate, createFeedback);
router.put("/:id", authenticate, authorizeAdmin, updateFeedback);
router.delete("/:id", authenticate, authorizeAdmin, deleteFeedback);

export default router;
