import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import invitation from "../controllers/invitations.create.js";
import accept from "../controllers/invitations.accept.js";
import reject from "../controllers/invitations.reject.js";
import list from "../controllers/invitations.list.js";

const router = Router();

router.post("/" , authMiddleware, invitation);
router.get("/", authMiddleware, list);
router.patch("/:id/accept",authMiddleware, accept);
router.patch("/:id/reject", authMiddleware, reject);

export default router;
