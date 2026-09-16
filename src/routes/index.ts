import { Router } from "express";
import authRoutes from "./auth.routes.js";
import groupRoutes from "./groups.routes.js";
import invitationRoutes from "./invitations.routes.js"

const router = Router();

router.use("/auth", authRoutes);
router.use("/groups", groupRoutes);
router.use("/invitations", invitationRoutes);

export default router;