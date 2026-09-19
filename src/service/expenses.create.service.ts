import prisma from "../prisma.js";
import { Prisma } from "../generated/prisma/client.js";

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
    if (typeof concepto !== "string" || !concepto.trim()) {
        throw new Error("El concepto del gasto es obligatorio");
    }
    // Se recibe texto decimal para no perder precision ni redondear centavos.
    if (typeof monto !== "string" || !/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(monto)) {
        throw new Error("El monto debe ser un string decimal con hasta 12 enteros y 2 decimales");
    }
    const amount = new Prisma.Decimal(monto);
    if (!amount.greaterThan(0)) {
        throw new Error("El monto debe ser mayor a cero");
    }
    if (!Number.isInteger(pagadorId) || pagadorId <= 0 || pagadorId > 2147483647) {
        throw new Error("El pagadorId debe ser un entero positivo valido");
    }
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
            monto: amount
        },
        include: {
            pagador: { select: { id: true, nombre: true } }
        }
    });
    return newExpense;
}
export default createExpense;
