import prisma from "../prisma.js"

async function rejectInvitation(invitationId: number, userId: number) {
    const invitation = await prisma.invitacion.findUnique({
        where : {
            id : invitationId
        }
    });
    if(!invitation){
        throw new Error("La invitacion no existe.")
    }
    if (invitation.invitado_id !== userId) {
    throw new Error("Esta invitacion no pertenece al usuario");
    }
    if (invitation.estado !== "PENDIENTE") {
    throw new Error("La invitacion ya fue respondida");
    }
    const newEstado = await prisma.invitacion.update({
    where: {
        id: invitationId,
        invitado_id: userId,
        estado: "PENDIENTE"
    },
    data: {
        estado: "RECHAZADA"
    }
    });
    return newEstado;
}
export default rejectInvitation;
