import type { Response } from "express";
import type { AuthRequest } from "../types/auth-request.js";
import previewExpense from "../service/expenses.preview.service.js";

export default async function preview(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ message: "Usuario no autenticado" });
    try {
        const preview = await previewExpense(Number(req.params.activityId), req.userId, req.body);
        return res.json({ preview });
    } catch (error) {
        return res.status(400).json({ message: (error as Error).message });
    }
}
