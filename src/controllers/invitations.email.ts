import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import inviteByEmail from "../service/invitations.email.service.js";

async function handle(req: AuthRequest, res: Response) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
    try{
        const invitation = await inviteByEmail(Number(req.params.groupId), userId, req.body?.email);
        return res.status(201).json({ message: "Invitacion enviada correctamente", invitation });
    }
    catch (error) {
        return res.status(400).json({ message: (error as Error).message });
    }
}
export default handle;
