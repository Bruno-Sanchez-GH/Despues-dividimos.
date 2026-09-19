import { ArrowDown, Check } from "lucide-react";
import type { Balance } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import { money } from "../utils/format";
import { ErrorState, Geometry, Loading } from "./UI";

export default function SettlementSummary({ transfers, preview = false }: { transfers: Balance["transferencias"]; preview?: boolean }) {
    const { user } = useAuth();
    const ordered = [...transfers].sort((a, b) => Number(b.de.id === user?.id || b.hacia.id === user?.id) - Number(a.de.id === user?.id || a.hacia.id === user?.id));
    return <section className="settlement-summary" aria-label={preview ? "Quién le devolvería a quién" : "Quién le debe a quién"}>
        <header><p className="eyebrow">{preview ? "ASÍ QUEDARÍAN LAS CUENTAS" : "EL RESULTADO"}</p><h2>Para quedar a mano</h2></header>
        {ordered.length ? <div className="transfer-list">{ordered.map((t) => <article className="settlement-card dark-surface" key={`${t.de.id}-${t.hacia.id}`}><Geometry />
            <div className="settlement-direction"><span>{t.de.id === user?.id ? "Vos" : t.de.nombre}</span><ArrowDown size={19} /><span>{t.hacia.id === user?.id ? "A vos" : `A ${t.hacia.nombre}`}</span></div>
            <p className="settlement-amount">{money(t.monto)}</p>
            <p className="settlement-explanation">{t.de.nombre} le debe a {t.hacia.nombre}</p>
            {(t.de.id === user?.id || t.hacia.id === user?.id) && <span className="settlement-personal">{t.de.id === user?.id ? "Vos tenés que devolver" : "Te tienen que devolver"}</span>}
        </article>)}</div> : <div className="settlement-zero"><Check size={26} /><h3>Todos están a mano.</h3><p>No hay nada que devolver.</p></div>}
        <p className="settlement-note">{preview ? "Vista previa de toda la actividad. Todavía no se guardó este gasto." : "Transferencias sugeridas según los gastos registrados."} La app no realiza ni confirma pagos.</p>
    </section>;
}

export function SavedSettlement({ activityId }: { activityId: string }) {
    const r = useResource<{ balance: Balance }>(`/activities/${activityId}/balance`);
    if (r.loading) return <Loading />;
    if (r.error) return <ErrorState message={r.error} retry={r.reload} />;
    return r.data ? <SettlementSummary transfers={r.data.balance.transferencias} /> : null;
}
