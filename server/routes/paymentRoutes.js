import express from "express";
import { createOrder, verifyPayment, handleWebhook } from "../controllers/paymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authenticate, createOrder);
router.post("/verify", authenticate, verifyPayment);
router.post("/webhook", handleWebhook);

export default router;
