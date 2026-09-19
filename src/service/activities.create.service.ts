import prisma from "../prisma.js";
import { validateExpense, type ExpenseInput } from "./expenses.validate.js";

async function createActivity(grupoId: number, userId: number, nombre: string, participantes: number[], startAt?: string, initialExpense?: ExpenseInput) {
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
    if (typeof nombre !== "string" || !nombre.trim()) {
        throw new Error("El nombre de la actividad es obligatorio");
    }
    if (!Array.isArray(participantes) || participantes.length === 0) {
        throw new Error("Debe seleccionar al menos un participante");
    }
    if (participantes.some((id) => !Number.isInteger(id) || id <= 0 || id > 2147483647)) {
        throw new Error("Los participantes deben ser IDs enteros positivos validos");
    }
    if (new Set(participantes).size !== participantes.length) {
        throw new Error("No puede repetir participantes en la actividad");
    }
    let fechaInicio: Date | undefined;
    if (startAt !== undefined) {
        const parts = typeof startAt === "string"
            ? /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(startAt)
            : null;
        if (!parts) {
            throw new Error("startAt debe ser una fecha ISO 8601 valida con hora y zona horaria");
        }
        const year = Number(parts[1]);
        const month = Number(parts[2]);
        const day = Number(parts[3]);
        const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        fechaInicio = new Date(startAt);
        // Date normaliza dias inexistentes, por eso se comprueba tambien el calendario.
        if (year === 0 || day > (daysInMonth[month - 1] ?? 0) || Number.isNaN(fechaInicio.getTime())) {
            throw new Error("startAt debe ser una fecha ISO 8601 valida con hora y zona horaria");
        }
    }
    const users = await prisma.usuario.findMany({
        where: { id: { in: participantes } },
        select: { id: true }
    });
    if (users.length !== participantes.length) {
        throw new Error("Uno o mas participantes no existen");
    }
    const memberships = await prisma.membresia.findMany({
        where: { grupoId, usuarioId: { in: participantes } },
        select: { usuarioId: true }
    });
    if (memberships.length !== participantes.length) {
        throw new Error("Todos los participantes deben pertenecer al grupo");
    }
    const expense = initialExpense === undefined ? undefined : validateExpense(initialExpense);
    if (expense && !participantes.includes(expense.pagadorId)) throw new Error("El pagador no participa de la actividad");
    // Una única escritura anidada: actividad, participantes y gasto inicial se guardan juntos.
    const newActivity = await prisma.actividad.create({
        data: {
            nombre: nombre.trim(),
            startAt: fechaInicio ?? new Date(),
            grupoId,
            creadorId: userId,
            ...(expense ? { gastos: { create: expense } } : {}),
            participantes: {
                create: participantes.map((usuarioId) => ({ usuarioId }))
            }
        },
        include: {
            grupo: { select: { id: true, nombre: true } },
            creador: { select: { id: true, nombre: true } },
            participantes: {
                select: { usuario: { select: { id: true, nombre: true } } },
                orderBy: { usuarioId: "asc" }
            }
        }
    });
    return newActivity;
}
export default createActivity;
