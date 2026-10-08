import express from "express";
import { createOrder, verifyPayment, handleWebhook } from "../controllers/paymentController.js";
import { optionalAuthenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// BUG #5 FIX: Capture raw body buffer for Razorpay webhook signature verification.
// The webhook route uses express.raw() so the HMAC is computed over the original
// bytes — not a re-serialised JSON string which may have different key ordering.
const captureRawBody = express.raw({
  type: "application/json",
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
});

router.post("/create-order", optionalAuthenticate, createOrder);
router.post("/verify", optionalAuthenticate, verifyPayment);
router.post("/webhook", captureRawBody, handleWebhook);

export default router;
