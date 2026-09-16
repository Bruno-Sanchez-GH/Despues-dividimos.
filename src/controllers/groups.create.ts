import type { Response } from "express";
import type{ AuthRequest}  from "../types/auth-request.js";
import newGroup from "../service/groups.create.service.js";


async function createGroup(req: AuthRequest, res: Response){
    const { nombre } = req.body;
    const userId  = req.userId;

    if (!userId) {
    return res.status(401).json({
        message: "Usuario no autenticado"
    });
}   
    
    try{
        const group = await newGroup(nombre, userId);
        return res.status(201).json({
        message: "Grupo creado correctamente",
        newGroup: {
            id : group.id,
            nombre : group.nombre,
            createdAt: group.createdAt,
            updatedAt : group.updatedAt
        }
        });
    }
    catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}
export default createGroup;