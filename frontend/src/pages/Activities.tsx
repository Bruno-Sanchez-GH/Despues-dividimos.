import SettlementSummary from "../components/SettlementSummary";
import { useSubmission } from "../hooks/useSubmission";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, ReceiptText } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import { post } from "../services/api";
import type { Activity, Expense, Group, Balance } from "../types";
import { dateLabel, timeLabel, money } from "../utils/format";
import { Avatar, Empty, ErrorState, FormError, Geometry, Heading, Loading, LoadingLabel } from "../components/UI";
import BalancePanel from "../components/BalancePanel";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";

export function NewActivityPage() {
    const { groupId } = useParams(); const { user } = useAuth(); const navigate = useNavigate();
    const resource = useResource<{ group: Group }>(`/groups/${groupId}`);
    const [nombre, setNombre] = useState(""); const [selected, setSelected] = useState<number[]>(user ? [user.id] : []);
    const [scheduled, setScheduled] = useState(false); const [startAt, setStartAt] = useState(""); const { busy, begin, end } = useSubmission(); const [error, setError] = useState("");
    const guard = useUnsavedChanges(Boolean(nombre || startAt || selected.length > 1));
    async function submit(e: FormEvent) {
        e.preventDefault(); if (!begin()) return; setError("");
        if (!nombre.trim() || !selected.length) { setError("Completá el nombre y elegí al menos un participante."); end(); return; }
        
        try { const data = await post<{ newActivity: Activity }>(`/groups/${groupId}/activities`, { nombre: nombre.trim(), participantes: selected, ...(scheduled ? { startAt: new Date(startAt).toISOString() } : {}) }); guard.allow(); navigate(`/activities/${data.newActivity.id}`); } catch (err) { setError((err as Error).message); } finally { end(); }
    }
    return <div className="page narrow">{guard.dialog}<Heading title="Nueva actividad" back={`/groups/${groupId}`} subtitle={resource.data?.group.nombre} />{resource.loading ? <Loading /> : resource.error ? <ErrorState message={resource.error} retry={resource.reload} /> : <form onSubmit={submit}><fieldset disabled={busy}><label>¿Cuál es el plan?<input required autoFocus maxLength={120} value={nombre} placeholder="Ej: Cena frente al mar" onChange={(e) => setNombre(e.target.value)} /></label><div className="suggestions">{["Asado", "Salida a comer", "Viaje", "Supermercado", "Cine"].map((name) => <button key={name} type="button" onClick={() => setNombre(name)}>{name}</button>)}</div><fieldset className="participants-field"><legend>¿Quiénes participan?</legend><p className="field-help">Seleccioná solamente quienes forman parte de esta actividad. Los gastos se dividirán en partes iguales entre ellos.</p><div className="participant-options">{resource.data?.group.miembros?.map((m) => <label className={"participant-option " + (selected.includes(m.id) ? "selected" : "")} key={m.id}><input type="checkbox" aria-label={m.nombre} checked={selected.includes(m.id)} onChange={() => setSelected((ids) => ids.includes(m.id) ? ids.filter((id) => id !== m.id) : [...ids, m.id])} /><Avatar name={m.nombre} /><span>{m.nombre}{m.id === user?.id ? " (vos)" : ""}</span>{selected.includes(m.id) && <Check size={17} />}</label>)}</div></fieldset><label className="switch-label"><CalendarDays size={21} /><span>Programar fecha y hora<small>Sin programar, la actividad empieza ahora.</small></span><input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} /></label>{scheduled && <label>Fecha y hora local<input type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} /></label>}<FormError message={error} /><button className="button full-width">{busy ? <LoadingLabel text="Creando…" /> : "Crear actividad"}<ArrowRight size={18} /></button></fieldset></form>}</div>;
}
function Expenses({ activityId }: { activityId: string }) {
    const resource = useResource<{ expenses: Expense[] }>(`/activities/${activityId}/expenses`);
    if (resource.loading) return <Loading />;
    if (resource.error) return <ErrorState message={resource.error} retry={resource.reload} />;
    return <>{!resource.data?.expenses.length ? <Empty title="Todavía no gastaron nada acá." text="Cuando alguien pague algo, registralo. Podés anotar lo que pagaste vos o lo que puso otra persona."><Link className="button" to={`/activities/${activityId}/expenses/new`}><span className="cta-dollar">$</span>Nuevo gasto</Link></Empty> : <div className="expense-list">{resource.data.expenses.map((expense) => <article key={expense.id} className="expense-card"><span className="list-icon"><ReceiptText size={22} strokeWidth={1.5} /></span><div className="list-body"><h3>{expense.concepto}</h3><p>Pagó {expense.pagador.nombre}</p><small>{dateLabel(expense.createdAt)} · {timeLabel(expense.createdAt)}</small></div><strong className="expense-amount">{money(expense.monto)}</strong></article>)}</div>}<Link className="floating-action" to={`/activities/${activityId}/expenses/new`}><span className="cta-dollar">$</span>Nuevo gasto</Link></>;
}
export function ActivityPage() {
    const { activityId = "" } = useParams(); const [search, setSearch] = useSearchParams(); const tab = search.get("tab") === "balance" ? "balance" : "expenses";
    const resource = useResource<{ activity: Activity }>(`/activities/${activityId}`);
    if (resource.loading) return <div className="page"><Loading /></div>;
    if (resource.error) return <div className="page"><Heading title="Actividad" back="/groups" /><ErrorState message={resource.error} retry={resource.reload} /></div>;
    if (!resource.data) return null; const activity = resource.data.activity;
    return <div className="context-page"><section className="activity-hero dark-surface"><Geometry /><Heading title={activity.nombre} subtitle={activity.grupo?.nombre} back={`/groups/${activity.grupoId}`} /><p className="activity-date"><CalendarDays size={18} />{dateLabel(activity.startAt)} · {timeLabel(activity.startAt)}</p><div className="activity-members">{activity.participantes.map((p) => <span key={p.usuario.id}><Avatar small name={p.usuario.nombre} />{p.usuario.nombre}</span>)}</div></section><section className="context-body"><div className="tabs"><button aria-pressed={tab === "expenses"} onClick={() => setSearch({})}>Gastos</button><button aria-pressed={tab === "balance"} onClick={() => setSearch({ tab: "balance" })}>Balance de la actividad</button></div><div className="context-content">{tab === "balance" ? <BalancePanel path={`/activities/${activityId}/balance`} /> : <><ActivitySummary activityId={activityId} /><Expenses activityId={activityId} /></>}</div></section></div>;
}

function ActivitySummary({ activityId }: { activityId: string }) {
    const r = useResource<{ balance: Balance }>(`/activities/${activityId}/balance`);
    if (r.loading) return <Loading />;
    if (r.error) return <ErrorState message={r.error} retry={r.reload} />;
    if (!r.data) return null;
    const b = r.data.balance; const equal = b.participantes.every((p) => p.corresponde === b.participantes[0]?.corresponde);
    return <><SettlementSummary transfers={b.transferencias} /><section className="activity-summary"><div><p className="eyebrow">GASTAMOS</p><h2>{money(b.total)}</h2><p>{b.participantes.length} personas · división igualitaria</p></div><div>{equal ? <strong>{money(b.participantes[0]?.corresponde || "0.00")} por persona</strong> : b.participantes.map((p) => <p key={p.usuario.id}>{p.usuario.nombre}: {money(p.corresponde)}</p>)}<p className="field-help">Es lo que les corresponde asumir, sin importar quién pagó.</p></div></section></>;
}
