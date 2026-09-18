import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import getActivity from "../service/activities.detail.service.js";

async function detail(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const activityId = Number(req.params.activityId);

    if (!userId) {
        return res.status(401).json({
            message: "Usuario no autenticado"
        });
    }
    try{
        const activity = await getActivity(activityId, userId);
        return res.status(200).json({
            message: "Actividad obtenida correctamente",
            activity
        });
    }
    catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        });
    }
}
export default detail;
