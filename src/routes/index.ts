import { Router } from "express";
import authRoutes from "./auth.routes.js";
import groupRoutes from "./groups.routes.js";
import invitationRoutes from "./invitations.routes.js"
import activityRoutes from "./activities.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/groups", groupRoutes);
router.use("/invitations", invitationRoutes);
router.use("/activities", activityRoutes);

export default router;
