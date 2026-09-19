import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import listInvitations from "../service/invitations.list.service.js";

async function handle(req: AuthRequest, res: Response) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
    try{
        const invitations = await listInvitations(userId);
        return res.status(200).json({ message: "Invitaciones obtenidas correctamente", invitations });
    }
    catch (error) {
        return res.status(400).json({ message: (error as Error).message });
    }
}
export default handle;
