import SettlementSummary from "./SettlementSummary";
import { ReceiptText } from "lucide-react";
import { useResource } from "../hooks/useResource";
import { useAuth } from "../hooks/useAuth";
import type { Balance } from "../types";
import { money } from "../utils/format";
import { Avatar, ErrorState, Geometry, Loading } from "./UI";

function balanceText(value: string) { return value === "0.00" ? "Estás a mano" : value.startsWith("-") ? "Tenés que pagar" : "Te tienen que devolver"; }
export default function BalancePanel({ path }: { path: string }) {
    const { data, loading, error, reload } = useResource<{ balance: Balance }>(path);
    const { user } = useAuth();
    if (loading) return <Loading variant="balance" />;
    if (error) return <ErrorState message={error} retry={reload} />;
    if (!data) return null;
    const balance = data.balance;
    const mine = balance.participantes.find((p) => p.usuario.id === user?.id);
    return <div className="balance-grid"><SettlementSummary transfers={balance.transferencias} /><section className="balance-card dark-surface"><Geometry /><div className="balance-content"><p className="eyebrow">TOTAL GASTADO</p><p className="total-money">{money(balance.total)}</p><p className="balance-meta">{balance.participantes.length} personas <span>·</span> {balance.cantidadGastos} gastos</p>{mine && <div className="my-balance"><span>Tu balance</span><strong className={mine.balance.startsWith("-") ? "negative" : ""}>{mine.balance !== "0.00" && !mine.balance.startsWith("-") ? "+ " : ""}{money(mine.balance)}</strong><small>{balanceText(mine.balance)}</small></div>}<h3>Resumen por persona</h3><div className="person-balances">{balance.participantes.map((p) => <div className="person-balance" key={p.usuario.id}><Avatar name={p.usuario.nombre} /><div><strong>{p.usuario.nombre}{p.usuario.id === user?.id ? " (vos)" : ""}</strong><small>Pagó {money(p.pagado)}</small><small>Le corresponden {money(p.corresponde)}</small></div><div className={"person-net " + (p.balance.startsWith("-") ? "negative" : "positive")}><strong>{p.balance !== "0.00" && !p.balance.startsWith("-") ? "+ " : ""}{money(p.balance)}</strong><small>{p.balance === "0.00" ? "A mano" : p.balance.startsWith("-") ? "Debe pagar" : "Debe recibir"}</small></div></div>)}</div>{!balance.cantidadGastos && <p className="balance-empty"><ReceiptText size={18} />Todavía no hay gastos registrados.</p>}</div></section></div>;
}
