import prisma from "../prisma.js";
import calculateBalances from "./balances.calculate.js";

async function activityBalance(activityId: number, userId: number) {
    if (!Number.isInteger(activityId) || activityId <= 0 || activityId > 2147483647) throw new Error("El activityId debe ser un entero positivo valido");
    const activity = await prisma.actividad.findUnique({ where: { id: activityId }, select: { grupoId: true } });
    if (!activity) throw new Error("La actividad no existe");
    const member = await prisma.membresia.findUnique({ where: { usuarioId_grupoId: { usuarioId: userId, grupoId: activity.grupoId } } });
    if (!member) throw new Error("El usuario no pertenece al grupo");
    const data = await prisma.actividad.findUniqueOrThrow({
        where: { id: activityId },
        include: {
            participantes: { select: { usuario: { select: { id: true, nombre: true } } } },
            gastos: { select: { pagadorId: true, monto: true } }
        }
    });
    return calculateBalances([data]);
}
export default activityBalance;
