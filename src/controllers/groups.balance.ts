import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import groupBalance from "../service/groups.balance.service.js";

async function handle(req: AuthRequest, res: Response) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
    try{
        const balance = await groupBalance(Number(req.params.groupId), userId);
        return res.status(200).json({ message: "Balance obtenido correctamente", balance });
    }
    catch (error) {
        return res.status(400).json({ message: (error as Error).message });
    }
}
export default handle;
