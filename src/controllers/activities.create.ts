import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import createActivity from "../service/activities.create.service.js";

async function create(req: AuthRequest, res: Response) {
    const userId = req.userId;
    const grupoId = Number(req.params.groupId);

    if (!userId) {
        return res.status(401).json({
            message: "Usuario no autenticado"
        });
    }
    try{
        const { nombre, participantes, startAt, initialExpense } = req.body ?? {};
        const newActivity = await createActivity(grupoId, userId, nombre, participantes, startAt, initialExpense);
        return res.status(201).json({
            message: "Actividad creada correctamente",
            newActivity
        });
    }
    catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        });
    }
}
export default create;
