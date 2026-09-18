import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import detail from "../controllers/activities.detail.js";

const router = Router();

router.get("/:activityId", authMiddleware, detail);

export default router;
