import prisma from "../prisma.js";

async function createGroup(nombre: string, userId: number){
    if(!nombre || !userId){
        throw new Error("Todos lo campos son obligatorios");
    }
    const newGroup = await prisma.grupo.create({
        data:{
            nombre
        }
    });
    const newMembresia = await prisma.membresia.create({
        data:{
        usuarioId: userId,
        grupoId:newGroup.id
        }
    });
    return newGroup;
}
export default createGroup;