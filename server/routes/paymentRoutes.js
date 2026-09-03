import express from "express";
import { createOrder, verifyPayment, handleWebhook } from "../controllers/paymentController.js";
import { optionalAuthenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", optionalAuthenticate, createOrder);
router.post("/verify", optionalAuthenticate, verifyPayment);
router.post("/webhook", handleWebhook);

export default router;
