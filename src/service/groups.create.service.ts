import prisma from "../prisma.js";

async function createGroup(nombre: string, userId: number){
    if(typeof nombre !== "string" || !nombre.trim() || !userId){
        throw new Error("Todos lo campos son obligatorios");
    }
    const newGroup = await prisma.grupo.create({
        data:{
            nombre: nombre.trim(),
            membresias: { create: { usuarioId: userId } }
        }
    });
    return newGroup;
}
export default createGroup;
