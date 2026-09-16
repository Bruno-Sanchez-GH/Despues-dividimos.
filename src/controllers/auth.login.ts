import type { Request, Response} from "express";
import loginUser from "../service/login.service.js";

async function login(req: Request, res: Response) {
    const { email, password} = req.body;

    try{
        const token = await loginUser(email, password);
        return res.status(200).json({
            message: "Usuario logueado correctamente",
            token: token
        })
    }
    catch(error){
        return res.status(400).json({
            message: (error as Error).message
        })

    }
}

export default login;