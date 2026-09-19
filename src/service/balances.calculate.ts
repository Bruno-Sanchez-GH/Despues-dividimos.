import type { Prisma } from "../generated/prisma/client.js";

type User = { id: number; nombre: string };
type Activity = {
    participantes: { usuario: User }[];
    gastos: { pagadorId: number; monto: Prisma.Decimal }[];
};

function money(cents: bigint) {
    const absolute = cents < 0n ? -cents : cents;
    return `${cents < 0n ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}

function calculateBalances(activities: Activity[], members: User[] = []) {
    const people = new Map<number, { usuario: User; pagado: bigint; corresponde: bigint }>();
    for (const usuario of members) people.set(usuario.id, { usuario, pagado: 0n, corresponde: 0n });
    let total = 0n;
    let cantidadGastos = 0;
    for (const activity of activities) {
        const users = activity.participantes.map((p) => p.usuario).sort((a, b) => a.id - b.id);
        if (!users.length && activity.gastos.length) throw new Error("La actividad tiene gastos sin participantes");
        for (const usuario of users) {
            if (!people.has(usuario.id)) people.set(usuario.id, { usuario, pagado: 0n, corresponde: 0n });
        }
        const ids = new Set(users.map((u) => u.id));
        let subtotal = 0n;
        for (const expense of activity.gastos) {
            if (!ids.has(expense.pagadorId)) throw new Error("Un pagador no participa de la actividad");
            const amount = BigInt(expense.monto.toFixed(2).replace(".", ""));
            if (amount < 0n) throw new Error("El gasto tiene un monto invalido");
            subtotal += amount;
            people.get(expense.pagadorId)!.pagado += amount;
        }
        total += subtotal;
        cantidadGastos += activity.gastos.length;
        if (users.length) {
            const share = subtotal / BigInt(users.length);
            const remainder = subtotal % BigInt(users.length);
            users.forEach((user, index) => {
                people.get(user.id)!.corresponde += share + (BigInt(index) < remainder ? 1n : 0n);
            });
        }
    }
    const entries = [...people.values()].sort((a, b) => a.usuario.id - b.usuario.id);
    const debtors = entries.filter((p) => p.pagado < p.corresponde).map((p) => ({ usuario: p.usuario, restante: p.corresponde - p.pagado }));
    const creditors = entries.filter((p) => p.pagado > p.corresponde).map((p) => ({ usuario: p.usuario, restante: p.pagado - p.corresponde }));
    const transferencias: { de: User; hacia: User; monto: string }[] = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i]!;
        const creditor = creditors[j]!;
        const amount = debtor.restante < creditor.restante ? debtor.restante : creditor.restante;
        transferencias.push({ de: debtor.usuario, hacia: creditor.usuario, monto: money(amount) });
        debtor.restante -= amount;
        creditor.restante -= amount;
        if (debtor.restante === 0n) i++;
        if (creditor.restante === 0n) j++;
    }
    return {
        total: money(total),
        cantidadGastos,
        participantes: entries.map((p) => ({
            usuario: p.usuario,
            pagado: money(p.pagado),
            corresponde: money(p.corresponde),
            balance: money(p.pagado - p.corresponde)
        })),
        transferencias
    };
}
export default calculateBalances;
