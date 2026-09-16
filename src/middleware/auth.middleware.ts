import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

interface JwtPayload {
    id: number;
}

interface AuthRequest extends Request {
    userId?: number;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.get("authorization");
    if (!authHeader){
        return res.status(401).json({
            message: "No se proporciono un token"
        });
    }
    const Bearer = authHeader.split(" ");
    const token = Bearer[1];

    if (Bearer[0] !=="Bearer" || !token){
        return res.status(401).json({
            message: "Debe mandar authorization como Bearer: token"
        });
    }
    const jwtSecretExists = process.env.JWT_SECRET;
    if(!jwtSecretExists){
        return res.status(500).json({
            message: "JWT_SECRET no esta definido en el archivo .env"
        });
    }
    try{
        const decoded = jwt.verify(token, jwtSecretExists) as JwtPayload;
        req.userId = decoded.id;
        next();

    }
    catch{
        return res.status(401).json({
            message: "token invalido"
        });
    }
}

export default authMiddleware;