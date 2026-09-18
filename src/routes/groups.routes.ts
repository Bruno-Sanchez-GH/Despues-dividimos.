import { Router } from "express";
import createGroup from "../controllers/groups.create.js";
import authMiddleware from "../middleware/auth.middleware.js";
import listGroups from "../controllers/groups.list.js";
import createActivity from "../controllers/activities.create.js";
import listActivities from "../controllers/activities.list.js";

const router = Router();

router.post("/", authMiddleware, createGroup);
router.get("/", authMiddleware, listGroups);
router.post("/:groupId/activities", authMiddleware, createActivity);
router.get("/:groupId/activities", authMiddleware, listActivities);
export default router;
