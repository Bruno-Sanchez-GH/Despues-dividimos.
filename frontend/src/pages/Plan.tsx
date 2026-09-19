import { useSubmission } from "../hooks/useSubmission";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { post } from "../services/api";
import type { Activity, Group } from "../types";
import { Avatar, Empty, ErrorState, FormError, Heading, Loading, LoadingLabel } from "../components/UI";
import { decimalInput, money } from "../utils/format";

export default function NewPlanPage() {
    const groups = useResource<{ groups: Group[] }>("/groups");
    const [search] = useSearchParams();
    const [groupId, setGroupId] = useState(search.get("group") || "");
    return <div className="page narrow"><Heading title="Nuevo plan" subtitle="Algo corto. Las personas, los gastos y las cuentas en un solo lugar." back="/home" />
        {groups.loading ? <Loading /> : groups.error ? <ErrorState message={groups.error} retry={groups.reload} /> : !groups.data?.groups.length ? <Empty title="¿Con quién compartís?" text="Para guardar un plan necesitamos personas reales. Creá el grupo e invitá a quienes van a compartir. Si solo querés calcular, podés dividir ahora."><Link className="button" to="/groups/new?mode=plan">Reunir a las personas</Link><Link className="text-link" to="/quick">Dividir sin guardar</Link></Empty> : <>
            <label>¿Con quién compartís?<select aria-label="¿Con quién compartís?" disabled={Boolean(groupId)} value={groupId} onChange={(e) => setGroupId(e.target.value)}><option value="">Elegí un grupo</option>{groups.data.groups.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}</select></label>
            <p className="field-help">Usamos tus grupos para elegir personas que ya aceptaron compartir con vos. <Link to="/groups/new?mode=plan">Crear otro grupo</Link>.</p>
            {groupId && <PlanForm key={groupId} groupId={groupId} amount={search.get("amount") || ""} count={search.get("count") || ""} other={search.get("payer") === "other"} />}
        </>}
    </div>;
}

function PlanForm({ groupId, amount, count, other }: { groupId: string; amount: string; count: string; other: boolean }) {
    const { user } = useAuth(); const navigate = useNavigate();
    const resource = useResource<{ group: Group }>(`/groups/${groupId}`);
    const [name, setName] = useState(""); const [selected, setSelected] = useState<number[]>(user ? [user.id] : []);
    const [scheduled, setScheduled] = useState(false); const [date, setDate] = useState("");
    const [payer, setPayer] = useState(other ? 0 : user?.id || 0);
    const { busy, begin, end } = useSubmission(); const [error, setError] = useState("");
    const guard = useUnsavedChanges(Boolean(name || date || amount || selected.length > 1));
    async function submit(e: FormEvent) {
        e.preventDefault(); if (!begin()) return; setError("");
        if (!selected.length) { setError("Elegí al menos una persona."); end(); return; }
        if (amount && (!/^[1-9]\d?$|^100$/.test(count) || selected.length !== Number(count))) { setError(`Elegí las ${count} personas de la cuenta rápida para conservar el reparto.`); end(); return; }
        if (amount && !selected.includes(payer)) { setError("Elegí quién puso la plata entre las personas seleccionadas."); end(); return; }
        
        try {
            const body = { nombre: name.trim(), participantes: selected, ...(scheduled ? { startAt: new Date(date).toISOString() } : {}), ...(amount ? { initialExpense: { concepto: name.trim(), monto: decimalInput(amount), pagadorId: payer } } : {}) };
            const { newActivity } = await post<{ newActivity: Activity }>(`/groups/${groupId}/activities`, body);
            guard.allow(); navigate(`/activities/${newActivity.id}${amount ? "?tab=balance" : ""}`);
        } catch (err) { setError((err as Error).message); } finally { end(); }
    }
    if (resource.loading) return <Loading />;
    if (resource.error) return <ErrorState message={resource.error} retry={resource.reload} />;
    return <form onSubmit={submit}>{guard.dialog}<fieldset disabled={busy}>
        <label>Nombre del plan<input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cena del viernes" /></label>
        <fieldset className="participants-field"><legend>¿Quiénes participan?</legend><p className="field-help">Seleccioná solamente quienes forman parte del plan. Los gastos se dividen en partes iguales entre ellos.</p><div className="participant-options">{resource.data?.group.miembros?.map((u) => <label key={u.id} className={"participant-option " + (selected.includes(u.id) ? "selected" : "")}><input type="checkbox" aria-label={u.nombre} checked={selected.includes(u.id)} onChange={() => setSelected((ids) => ids.includes(u.id) ? ids.filter((id) => id !== u.id) : [...ids, u.id])} /><Avatar name={u.nombre} /><span>{u.nombre}</span></label>)}</div></fieldset>
        <Link className="text-link" to={`/groups/${groupId}/invite`}>¿Falta alguien? Invitar al grupo</Link>
        <label className="switch-label"><span>Programar fecha y hora<small>Si no, el plan empieza ahora.</small></span><input type="checkbox" checked={scheduled} onChange={(e) => setScheduled(e.target.checked)} /></label>
        {scheduled && <label>Fecha y hora local<input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} /></label>}
        {amount && <section className="plan-import"><h3>Tu cuenta rápida: {money(amount)}</h3><p>Elegí exactamente {count} personas y quién pagó. Se guardan el plan y este gasto juntos.</p><label>¿Quién puso la plata?<select aria-label="¿Quién puso la plata?" required value={payer} onChange={(e) => setPayer(Number(e.target.value))}><option value={0}>Elegí quién pagó</option>{resource.data?.group.miembros?.filter((u) => selected.includes(u.id)).map((u) => <option value={u.id} key={u.id}>{u.id === user?.id ? "Yo · " : ""}{u.nombre}</option>)}</select></label></section>}
        <FormError message={error} /><button className="button full-width">{busy ? <LoadingLabel text="Creando plan…" /> : amount ? "Guardar plan y gasto" : "Crear plan"}</button>
    </fieldset></form>;
}
