import prisma from "../prisma.js";
import calculateBalances from "./balances.calculate.js";

async function groupBalance(groupId: number, userId: number) {
    if (!Number.isInteger(groupId) || groupId <= 0 || groupId > 2147483647) throw new Error("El groupId debe ser un entero positivo valido");
    const group = await prisma.grupo.findUnique({ where: { id: groupId } });
    if (!group) throw new Error("El grupo no existe");
    const member = await prisma.membresia.findUnique({ where: { usuarioId_grupoId: { usuarioId: userId, grupoId: groupId } } });
    if (!member) throw new Error("El usuario no pertenece al grupo");
    const data = await prisma.grupo.findUniqueOrThrow({
        where: { id: groupId },
        include: {
            membresias: { select: { usuario: { select: { id: true, nombre: true } } } },
            actividades: { include: {
                participantes: { select: { usuario: { select: { id: true, nombre: true } } } },
                gastos: { select: { pagadorId: true, monto: true } }
            } }
        }
    });
    return calculateBalances(data.actividades, data.membresias.map((m) => m.usuario));
}
export default groupBalance;
