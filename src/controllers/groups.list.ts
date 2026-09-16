import grupos from "../service/groups.list.service.js"
import type { Response } from "express";
import type{ AuthRequest}  from "../types/auth-request.js";

async function listGroups(req: AuthRequest, res: Response) {
    const userId = req.userId;

    if (!userId) {
    return res.status(401).json({
        message: "Usuario no autenticado"
    });
}   
    try{
        const list = await grupos(userId);
        return res.status(200).json({
        message: "Grupos obtenidos correctamente",
        groups: list
});
    }

    catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}
export default listGroups;
