import prisma from "../prisma.js";
import createInvitation from "./invitations.create.service.js";

async function inviteByEmail(groupId: number, userId: number, email: string) {
    if (!Number.isInteger(groupId) || groupId <= 0 || groupId > 2147483647) throw new Error("El groupId debe ser un entero positivo valido");
    const member = await prisma.membresia.findUnique({ where: { usuarioId_grupoId: { usuarioId: userId, grupoId: groupId } } });
    if (!member) throw new Error("El usuario no pertenece al grupo");
    if (typeof email !== "string" || !email.trim()) throw new Error("El email es obligatorio");
    const user = await prisma.usuario.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } }, select: { id: true } });
    if (!user) throw new Error("No encontramos una cuenta con ese email");
    if (await prisma.membresia.findUnique({ where: { usuarioId_grupoId: { usuarioId: user.id, grupoId: groupId } } })) throw new Error("El usuario ya pertenece al grupo");
    if (await prisma.invitacion.findFirst({ where: { grupo_id: groupId, invitado_id: user.id, estado: "PENDIENTE" } })) throw new Error("Ya existe una invitacion pendiente para ese usuario");
    const invitation = await createInvitation(userId, groupId, user.id);
    return { id: invitation.id, estado: invitation.estado };
}
export default inviteByEmail;
