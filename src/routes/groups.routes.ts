import { Router } from "express";
import createGroup from "../controllers/groups.create.js";
import authMiddleware from "../middleware/auth.middleware.js";
import listGroups from "../controllers/groups.list.js";

const router = Router();

router.post("/", authMiddleware, createGroup);
router.get("/", authMiddleware, listGroups);
export default router;