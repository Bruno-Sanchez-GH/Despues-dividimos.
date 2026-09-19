import { Prisma } from "../generated/prisma/client.js";

export type ExpenseInput = { concepto: string; monto: string; pagadorId: number };
export type ContributionsInput = { concepto: string; monto: string; aportes: { pagadorId: number; monto: string }[]; pagadorId?: never };

export function validateContributions(input: ContributionsInput) {
    if (!input || !Array.isArray(input.aportes) || input.aportes.length < 2) throw new Error("Indicá los aportes de al menos dos personas");
    if (input.pagadorId !== undefined) throw new Error("Elegí un pagador o varios aportes, no ambos");
    const total = validateExpense({ concepto: input.concepto, monto: input.monto, pagadorId: input.aportes[0]?.pagadorId ?? 0 });
    const expenses = input.aportes.map((aporte) => validateExpense({ concepto: input.concepto, monto: aporte?.monto, pagadorId: aporte?.pagadorId }));
    if (new Set(expenses.map((e) => e.pagadorId)).size !== expenses.length) throw new Error("No puede repetir personas en los aportes");
    const sum = expenses.reduce((cents, e) => cents + BigInt(e.monto.toFixed(2).replace(".", "")), 0n);
    if (sum !== BigInt(total.monto.toFixed(2).replace(".", ""))) throw new Error("La suma de los aportes debe coincidir con el total del gasto");
    return expenses;
}

export function validateExpense(input: ExpenseInput) {
    if (!input || typeof input.concepto !== "string" || !input.concepto.trim()) throw new Error("El concepto del gasto es obligatorio");
    if (typeof input.monto !== "string" || !/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(input.monto)) throw new Error("El monto debe ser un string decimal con hasta 12 enteros y 2 decimales");
    const monto = new Prisma.Decimal(input.monto);
    if (!monto.greaterThan(0)) throw new Error("El monto debe ser mayor a cero");
    if (!Number.isInteger(input.pagadorId) || input.pagadorId <= 0 || input.pagadorId > 2147483647) throw new Error("El pagadorId debe ser un entero positivo valido");
    return { concepto: input.concepto.trim(), monto, pagadorId: input.pagadorId };
}
