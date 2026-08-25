import express from "express";
import { createSupportRequest } from "../controllers/supportController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, createSupportRequest);

export default router;
