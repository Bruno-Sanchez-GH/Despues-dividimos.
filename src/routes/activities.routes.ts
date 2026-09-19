import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import detail from "../controllers/activities.detail.js";
import createExpense from "../controllers/expenses.create.js";
import listExpenses from "../controllers/expenses.list.js";

const router = Router();

router.get("/:activityId", authMiddleware, detail);
router.post("/:activityId/expenses", authMiddleware, createExpense);
router.get("/:activityId/expenses", authMiddleware, listExpenses);

export default router;
