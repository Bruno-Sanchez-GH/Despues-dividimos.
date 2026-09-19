import prisma from "../prisma.js";

async function listActivityHistory(grupoId: number, userId: number) {
    if (!Number.isInteger(grupoId) || grupoId <= 0 || grupoId > 2147483647) {
        throw new Error("El groupId debe ser un entero positivo valido");
    }
    const group = await prisma.grupo.findUnique({
        where: { id: grupoId }
    });
    if (!group) {
        throw new Error("El grupo no existe");
    }
    const membership = await prisma.membresia.findUnique({
        where: {
            usuarioId_grupoId: { usuarioId: userId, grupoId }
        }
    });
    if (!membership) {
        throw new Error("El usuario no pertenece al grupo");
    }
    const now = new Date();
    const activities = await prisma.actividad.findMany({
        where: { grupoId, startAt: { lte: now } },
        include: {
            creador: { select: { id: true, nombre: true } },
            participantes: {
                select: { usuario: { select: { id: true, nombre: true } } },
                orderBy: { usuarioId: "asc" }
            }
        },
        orderBy: [{ startAt: "desc" }, { id: "desc" }]
    });
    return activities;
}
export default listActivityHistory;
