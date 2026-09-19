import { Router } from "express";
import createGroup from "../controllers/groups.create.js";
import authMiddleware from "../middleware/auth.middleware.js";
import listGroups from "../controllers/groups.list.js";
import createActivity from "../controllers/activities.create.js";
import listActivities from "../controllers/activities.list.js";
import upcomingActivities from "../controllers/activities.upcoming.js";
import historyActivities from "../controllers/activities.history.js";

const router = Router();

router.post("/", authMiddleware, createGroup);
router.get("/", authMiddleware, listGroups);
router.post("/:groupId/activities", authMiddleware, createActivity);
router.get("/:groupId/activities", authMiddleware, listActivities);
router.get("/:groupId/activities/upcoming", authMiddleware, upcomingActivities);
router.get("/:groupId/activities/history", authMiddleware, historyActivities);
export default router;
