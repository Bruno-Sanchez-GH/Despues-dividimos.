import prisma from "../prisma.js";

async function groupDetail(groupId: number, userId: number) {
    if (!Number.isInteger(groupId) || groupId <= 0 || groupId > 2147483647) throw new Error("El groupId debe ser un entero positivo valido");
    const member = await prisma.membresia.findUnique({ where: { usuarioId_grupoId: { usuarioId: userId, grupoId: groupId } } });
    if (!member) throw new Error("El usuario no pertenece al grupo");
    const group = await prisma.grupo.findUniqueOrThrow({
        where: { id: groupId },
        include: { membresias: { select: { usuario: { select: { id: true, nombre: true } } }, orderBy: { usuarioId: "asc" } } }
    });
    return { id: group.id, nombre: group.nombre, createdAt: group.createdAt, miembros: group.membresias.map((m) => m.usuario) };
}
export default groupDetail;
