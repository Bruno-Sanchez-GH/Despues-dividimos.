import prisma from "../prisma.js";

async function currentUser(userId: number) {
    const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { id: true, nombre: true, email: true } });
    if (!user) throw new Error("El usuario no existe");
    return user;
}
export default currentUser;
