import express from "express";
import { createFeedback, getPublishedFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.get("/", getPublishedFeedback);
router.post("/", createFeedback);

export default router;
