import prisma from "../prisma.js";

async function getActivity(activityId: number, userId: number) {
    if (!Number.isInteger(activityId) || activityId <= 0 || activityId > 2147483647) {
        throw new Error("El activityId debe ser un entero positivo valido");
    }
    const activity = await prisma.actividad.findUnique({
        where: { id: activityId },
        select: { grupoId: true }
    });
    if (!activity) {
        throw new Error("La actividad no existe");
    }
    const membership = await prisma.membresia.findUnique({
        where: {
            usuarioId_grupoId: { usuarioId: userId, grupoId: activity.grupoId }
        }
    });
    if (!membership) {
        throw new Error("El usuario no pertenece al grupo");
    }
    const detail = await prisma.actividad.findUnique({
        where: { id: activityId },
        include: {
            grupo: { select: { id: true, nombre: true } },
            creador: { select: { id: true, nombre: true } },
            participantes: {
                select: { usuario: { select: { id: true, nombre: true } } },
                orderBy: { usuarioId: "asc" }
            }
        }
    });
    if (!detail) {
        throw new Error("La actividad no existe");
    }
    return detail;
}
export default getActivity;
