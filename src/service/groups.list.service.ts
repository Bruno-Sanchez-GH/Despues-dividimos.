import prisma from "../prisma.js"

async function listGroups(userId: number){
    const memberships = await prisma.membresia.findMany({
        where: {
        usuarioId: userId
        },
        include: {
            grupo: true
        }
        
    });

    const grupos = memberships.map((membership) => membership.grupo);
    return grupos;
}
export default listGroups;