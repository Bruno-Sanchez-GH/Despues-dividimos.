import prisma from "../prisma.js";

export default async function recentActivities(userId: number) {
    return prisma.actividad.findMany({
        where: { grupo: { membresias: { some: { usuarioId: userId } } } },
        select: { id: true, nombre: true, startAt: true, grupoId: true, grupo: { select: { id: true, nombre: true } }, _count: { select: { participantes: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 12
    });
}
