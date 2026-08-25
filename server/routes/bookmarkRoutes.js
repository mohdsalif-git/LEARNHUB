import express from "express";
import { getBookmarks, addBookmark, removeBookmark, toggleBookmark } from "../controllers/bookmarkController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getBookmarks);
router.post("/", authenticate, addBookmark);
router.post("/toggle", authenticate, toggleBookmark);
router.delete("/:resourceId", authenticate, removeBookmark);

export default router;
