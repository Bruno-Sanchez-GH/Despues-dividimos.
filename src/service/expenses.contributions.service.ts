import prisma from "../prisma.js";
import getActivity from "./activities.detail.service.js";
import { validateContributions, type ContributionsInput } from "./expenses.validate.js";

export default async function createContributions(activityId: number, userId: number, input: ContributionsInput) {
    const activity = await getActivity(activityId, userId);
    const expenses = validateContributions(input);
    const participants = new Set(activity.participantes.map((p) => p.usuario.id));
    if (expenses.some((e) => !participants.has(e.pagadorId))) throw new Error("Todos los pagadores deben participar de la actividad");
    // Un único INSERT: todos los aportes se guardan o ninguno. No se duplica el total.
    return prisma.gasto.createManyAndReturn({
        data: expenses.map((expense) => ({ ...expense, actividadId: activityId }))
    });
}
