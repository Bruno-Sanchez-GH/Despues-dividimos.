import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import groupDetail from "../service/groups.detail.service.js";

async function handle(req: AuthRequest, res: Response) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
    try{
        const group = await groupDetail(Number(req.params.groupId), userId);
        return res.status(200).json({ message: "Grupo obtenido correctamente", group });
    }
    catch (error) {
        return res.status(400).json({ message: (error as Error).message });
    }
}
export default handle;
