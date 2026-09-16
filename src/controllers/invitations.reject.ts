import type { Response } from "express";
import type{ AuthRequest}  from "../types/auth-request.js";
import rejectInvitation from "../service/invitations.reject.service.js";

async function reject(req: AuthRequest, res: Response){
    const userId = req.userId;
    const invitationId = Number(req.params.id);

    if (!userId) {
    return res.status(401).json({
        message: "Usuario no autenticado"
        });
    }

    try{
        await rejectInvitation(invitationId, userId);
        return res.status(200).json({
        message: "Invitacion rechazada correctamente",
        });
    }

    catch (error) {
    return res.status(400).json({
        message: (error as Error).message
    });
    }
}
export default reject;
