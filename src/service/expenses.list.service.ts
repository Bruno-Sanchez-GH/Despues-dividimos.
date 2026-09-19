import prisma from "../prisma.js";

async function listExpenses(activityId: number, userId: number) {
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
    const expenses = await prisma.gasto.findMany({
        where: { actividadId: activityId },
        include: {
            pagador: { select: { id: true, nombre: true } }
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    return expenses;
}
export default listExpenses;
