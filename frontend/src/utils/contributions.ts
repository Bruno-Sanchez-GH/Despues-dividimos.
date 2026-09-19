import { decimalInput } from "./format.ts";
import { centsString } from "./quickSplit.ts";

export function contributionsSummary(total: string, entries: { pagadorId: number; monto: string }[]) {
    const cents = (value: string) => { const [whole, decimal = ""] = value.split("."); return BigInt(whole + decimal.padEnd(2, "0")); };
    const aportes = entries.filter((e) => e.monto.trim() && !/^0(?:[.,]0{1,2})?$/.test(e.monto.trim()))
        .map((e) => ({ pagadorId: e.pagadorId, monto: decimalInput(e.monto) }));
    const sum = aportes.reduce((value, e) => value + cents(e.monto), 0n);
    const difference = cents(decimalInput(total)) - sum;
    return { aportes, sum: centsString(sum), difference: `${difference < 0n ? "-" : ""}${centsString(difference < 0n ? -difference : difference)}`, complete: difference === 0n && aportes.length >= 2 };
}
