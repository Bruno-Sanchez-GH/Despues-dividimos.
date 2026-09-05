import type { Request, Response } from 'express';
import registerUser from "../service/register.service.js";

async function register(req: Request, res: Response) {
    const { nombre, email, password } = req.body;

    try{
        const newUser = await registerUser(nombre, email, password);
        return res.status(201).json({
        message: "Usuario registrado correctamente",
        newUser: {
            id: newUser.id,
            nombre: newUser.nombre,
            email: newUser.email,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        }
    });
    }
    catch (error) {
        return res.status(400).json({
            message: (error as Error).message
        })
    }
}

export default register;