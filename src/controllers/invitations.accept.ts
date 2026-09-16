import type { Response } from "express";
import type{ AuthRequest}  from "../types/auth-request.js";
import acceptInvitation from "../service/invitations.accept.service.js";

async function accept(req: AuthRequest, res: Response){
    const userId = req.userId;
    const invitationId = Number(req.params.id);

    if (!userId) {
    return res.status(401).json({
        message: "Usuario no autenticado"
        });
    }

    try{
        const invitation = await acceptInvitation(invitationId , userId)
        return res.status(200).json({
        message: "Invitacion aceptada correctamente",
        });
    }

    catch (error) {
    return res.status(400).json({
        message: (error as Error).message
    });
    }
}
export default accept;