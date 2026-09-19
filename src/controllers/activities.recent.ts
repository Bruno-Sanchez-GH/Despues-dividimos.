import type { Response } from "express";
import type { AuthRequest } from "../types/auth-request.js";
import recentActivities from "../service/activities.recent.service.js";

export default async function recent(req: AuthRequest, res: Response) {
    if (!req.userId) return res.status(401).json({ message: "Usuario no autenticado" });
    try { return res.json({ activities: await recentActivities(req.userId) }); }
    catch (error) { return res.status(400).json({ message: (error as Error).message }); }
}
