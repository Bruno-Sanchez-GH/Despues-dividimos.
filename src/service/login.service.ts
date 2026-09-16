import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function loginUser(email:string, password: string){
        if(!email || !password){
        throw new Error("todos los campos son obligatorios");
        
    }
    const userEmailExists = await prisma.usuario.findUnique({
        where: {
            email : email
        }
    });
    
    if(!userEmailExists){
        throw new Error("el email no esta registrado");
    }
    const passwordMatch = await bcrypt.compare(password, userEmailExists.passwordHash);
    if(!passwordMatch){
        throw new Error("La contraseña es incorrecta");
    }
    const jwtSecretExists = process.env.JWT_SECRET;
    if(!jwtSecretExists){
        throw new Error("JWT_SECRET no esta definido en el archivo .env");
    }
    const token = jwt.sign({ id: userEmailExists.id }, jwtSecretExists , { expiresIn: "1h" });
    return token;
}

export default loginUser;
