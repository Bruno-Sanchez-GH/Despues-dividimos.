import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import detail from "../controllers/activities.detail.js";
import createExpense from "../controllers/expenses.create.js";
import listExpenses from "../controllers/expenses.list.js";
import balance from "../controllers/activities.balance.js";
import preview from "../controllers/expenses.preview.js";
import recent from "../controllers/activities.recent.js";

const router = Router();
router.get("/", authMiddleware, recent);

router.get("/:activityId", authMiddleware, detail);
router.post("/:activityId/expenses", authMiddleware, createExpense);
router.get("/:activityId/expenses", authMiddleware, listExpenses);
router.get("/:activityId/balance", authMiddleware, balance);
router.post("/:activityId/expenses/preview", authMiddleware, preview);

export default router;
