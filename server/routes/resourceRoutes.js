import express from "express";
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getCommunityResources,
  submitCommunityResource,
  recordResourceView,
} from "../controllers/resourceController.js";
import { authenticate, optionalAuthenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Static routes MUST be registered before dynamic /:id to avoid Express swallowing them
router.get("/", getResources);
router.get("/community", getCommunityResources);
router.post("/submit", optionalAuthenticate, submitCommunityResource);
router.post("/", authenticate, authorizeAdmin, createResource);

// Dynamic param routes come after all static paths
router.get("/:id", getResourceById);
router.post("/:id/view", optionalAuthenticate, recordResourceView);
router.put("/:id", authenticate, authorizeAdmin, updateResource);
router.delete("/:id", authenticate, authorizeAdmin, deleteResource);

export default router;
