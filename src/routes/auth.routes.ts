import { Router } from "express";
import register from "../controllers/auth.register.js"
import login from "../controllers/auth.login.js"
import me from "../controllers/auth.me.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, me);

export default router;
