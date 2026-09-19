import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import listUpcomingActivities from "../service/activities.upcoming.service.js";

async function upcoming(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const grupoId = Number(req.params.groupId);

    if (!userId) {
        return res.status(401).json({
            message: "Usuario no autenticado"
        });
    }
    try{
        const activities = await listUpcomingActivities(grupoId, userId);
        return res.status(200).json({
            message: "Proximas actividades obtenidas correctamente",
            activities
        });
    }
    catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        });
    }
}
export default upcoming;
