// Solo para cuentas todavía no guardadas. Los balances persistidos vienen de la API.
export function centsString(cents: bigint): string {
    return `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}`;
}
export function quickSplit(amount: string, count: number) {
    if (!/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(amount) || !Number.isInteger(count) || count < 1 || count > 100) throw new Error("Revisá el monto y la cantidad de personas (1 a 100).");
    const [whole, fraction = ""] = amount.split(".");
    const total = BigInt(whole + fraction.padEnd(2, "0"));
    if (total <= 0n) throw new Error("El monto debe ser mayor a cero.");
    const base = total / BigInt(count), remainder = total % BigInt(count);
    return Array.from({ length: count }, (_, i) => centsString(base + (BigInt(i) < remainder ? 1n : 0n)));
}
