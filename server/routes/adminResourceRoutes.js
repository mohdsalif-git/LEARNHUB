import express from "express";
import {
  getAdminResources,
  getAdminCategories,
  updateAdminResource,
  deleteAdminResource,
} from "../controllers/adminResourceController.js";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/resources", authenticate, authorizeAdmin, getAdminResources);
router.get("/categories", authenticate, authorizeAdmin, getAdminCategories);
router.put("/resources/:id", authenticate, authorizeAdmin, updateAdminResource);
router.delete("/resources/:id", authenticate, authorizeAdmin, deleteAdminResource);

export default router;