import prisma  from "../prisma.js";
import bcrypt  from "bcrypt";


async function registerUser(nombre: string, email: string, password: string) {
    if (!nombre || !email || !password) {
        throw new Error("todos los campos son obligatorios");
    }
    const emailExists = await prisma.usuario.findUnique({
        where: {
            email : email
        }
    });
    if (emailExists) {
        throw new Error("el email ya esta registrado");
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.usuario.create({
        data: {
            nombre,
            email,
            passwordHash,
        }
    });
    return newUser;
}

export default registerUser;