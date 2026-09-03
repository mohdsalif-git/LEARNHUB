import express from "express";
import { createSupportRequest } from "../controllers/supportController.js";
import { optionalAuthenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", optionalAuthenticate, createSupportRequest);

export default router;
