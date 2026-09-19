import prisma from "../prisma.js";
import { validateExpense } from "./expenses.validate.js";

async function createExpense(activityId: number, userId: number, concepto: string, monto: string, pagadorId: number) {
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
    const validated = validateExpense({ concepto, monto, pagadorId });
    const payer = await prisma.usuario.findUnique({
        where: { id: pagadorId },
        select: { id: true }
    });
    if (!payer) {
        throw new Error("El pagador no existe");
    }
    const participant = await prisma.participante.findUnique({
        where: {
            usuarioId_actividadId: { usuarioId: pagadorId, actividadId: activityId }
        }
    });
    if (!participant) {
        throw new Error("El pagador no participa de la actividad");
    }
    const newExpense = await prisma.gasto.create({
        data: {
            actividadId: activityId,
            pagadorId,
            concepto: concepto.trim(),
            monto: validated.monto
        },
        include: {
            pagador: { select: { id: true, nombre: true } }
        }
    });
    return newExpense;
}
export default createExpense;
