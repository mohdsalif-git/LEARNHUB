import express from "express";
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getCommunityResources,
  submitCommunityResource,
} from "../controllers/resourceController.js";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getResources);
router.get("/community", getCommunityResources);
router.get("/:id", getResourceById);
router.post("/", authenticate, authorizeAdmin, createResource);
router.put("/:id", authenticate, authorizeAdmin, updateResource);
router.delete("/:id", authenticate, authorizeAdmin, deleteResource);
router.post("/submit", authenticate, submitCommunityResource);

export default router;
