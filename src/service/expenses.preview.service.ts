import prisma from "../prisma.js";
import getActivity from "./activities.detail.service.js";
import calculateBalances from "./balances.calculate.js";
import { validateExpense, validateContributions, type ExpenseInput, type ContributionsInput } from "./expenses.validate.js";

export default async function previewExpense(activityId: number, userId: number, input: ExpenseInput | ContributionsInput) {
    const activity = await getActivity(activityId, userId);
    const expenses = input && "aportes" in input ? validateContributions(input) : [validateExpense(input as ExpenseInput)];
    if (expenses.some((expense) => !activity.participantes.some((p) => p.usuario.id === expense.pagadorId))) throw new Error("El pagador no participa de la actividad");
    const gastos = await prisma.gasto.findMany({ where: { actividadId: activityId }, select: { monto: true, pagadorId: true } });
    const current = calculateBalances([{ participantes: activity.participantes, gastos }]);
    const draft = calculateBalances([{ participantes: activity.participantes, gastos: expenses }]);
    const next = calculateBalances([{ participantes: activity.participantes, gastos: [...gastos, ...expenses] }]);
    // El resto se reparte sobre el total de la actividad, no de cada gasto aislado.
    const shares = next.participantes.map((p) => {
        const previous = current.participantes.find((c) => c.usuario.id === p.usuario.id)!;
        const cents = BigInt(p.corresponde.replace(".", "")) - BigInt(previous.corresponde.replace(".", ""));
        return { usuario: p.usuario, corresponde: `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}` };
    });
    return { current, draft, next, shares };
}
