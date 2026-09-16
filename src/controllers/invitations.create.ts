import type { Response } from "express";
import type{ AuthRequest}  from "../types/auth-request.js";
import createInvitation from "../service/invitations.create.service.js";

async function invitation(req: AuthRequest, res: Response){
    const { grupoId, invitadoId} = req.body
    const userId = req.userId;

    if (!userId) {
    return res.status(401).json({
        message: "Usuario no autenticado"
        });
    }

    try{
        const newInvitation = await createInvitation(userId,grupoId, invitadoId)
        return res.status(201).json({
        message: "Invitacion creada correctamente",
        newInvitation: {
            id: newInvitation.id,
            invitador_id: newInvitation.invitador_id,
            invitado_id: newInvitation.invitado_id,
            grupo_id: newInvitation.grupo_id,
            estado: newInvitation.estado,
            createdAt: newInvitation.createdAt
        }
    });
    }
    catch (error) {
    return res.status(400).json({
        message: (error as Error).message
    });
    }
}
export default invitation;