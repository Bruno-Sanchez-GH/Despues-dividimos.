export function money(value: string) {
    const negative = value.startsWith("-");
    const [whole = "0", fraction = "00"] = value.replace(/^-/, "").split(".");
    return `${negative ? "− " : ""}$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction.padEnd(2, "0")}`;
}
export function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
export function dateLabel(value: string) {
    const date = new Date(value);
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const prefix = date.toDateString() === now.toDateString() ? "Hoy · " : date.toDateString() === tomorrow.toDateString() ? "Mañana · " : "";
    return prefix + new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}) }).format(date);
}
export function timeLabel(value: string) { return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
export function decimalInput(value: string) {
    const normalized = value.trim().replace(",", ".");
    if (!/^(0|[1-9]\d{0,11})(\.\d{1,2})?$/.test(normalized) || /^0(?:\.0{1,2})?$/.test(normalized)) throw new Error("Ingresá un monto mayor a cero, con hasta dos decimales.");
    return normalized;
}
