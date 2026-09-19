import type { Response } from "express";
import type{ AuthRequest} from "../types/auth-request.js";
import currentUser from "../service/auth.me.service.js";

async function handle(req: AuthRequest, res: Response) {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Usuario no autenticado" });
    try{
        const user = await currentUser(userId);
        return res.status(200).json({ message: "Usuario obtenido correctamente", user });
    }
    catch (error) {
        return res.status(400).json({ message: (error as Error).message });
    }
}
export default handle;
