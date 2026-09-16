import prisma from "../prisma.js"

async function createInvitation( invitadorId: number, grupoId: number, invitadoId: number ) {
    if(!invitadorId || !grupoId || !invitadoId){
        throw new Error("Todos los campos son obligatorios")
    }

    const invitadorGrupo = await prisma.membresia.findUnique({
        where: {
            usuarioId_grupoId: {
            usuarioId: invitadorId,
            grupoId: grupoId
    }
        }
    });
    if(invitadorGrupo == null){
        throw new Error("El usuario no pertenece al grupo");
    }

    const invitadoGrupo = await prisma.usuario.findUnique({
        where: {
            id: invitadoId
        }
    });
    if(invitadoGrupo == null){
        throw new Error("El usuario invitado no existe");
    }

    const invitacion = await prisma.invitacion.create({
        data: {
            invitador_id : invitadorId,
            invitado_id  : invitadoId,
            grupo_id     : grupoId
        }
    });
    return invitacion;
}
export default createInvitation;