import prisma from "../prisma.js";

async function createActivity(grupoId: number, userId: number, nombre: string, participantes: number[]) {
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
    // La escritura anidada crea la actividad y sus participantes en una transaccion.
    const newActivity = await prisma.actividad.create({
        data: {
            nombre: nombre.trim(),
            grupoId,
            creadorId: userId,
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
