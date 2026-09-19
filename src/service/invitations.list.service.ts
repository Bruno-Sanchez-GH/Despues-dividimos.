import prisma from "../prisma.js";

async function listInvitations(userId: number) {
    return prisma.invitacion.findMany({
        where: { invitado_id: userId, estado: "PENDIENTE" },
        select: { id: true, createdAt: true, grupo: { select: { id: true, nombre: true } }, Invitador: { select: { id: true, nombre: true } } },
        orderBy: { id: "desc" }
    });
}
export default listInvitations;
