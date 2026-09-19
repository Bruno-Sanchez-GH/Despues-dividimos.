import SettlementSummary, { SavedSettlement } from "../components/SettlementSummary";
import { useSubmission } from "../hooks/useSubmission";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { post } from "../services/api";
import type { Activity, Balance } from "../types";
import { decimalInput, money } from "../utils/format";
import { Avatar, ErrorState, FormError, Geometry, Heading, Loading, LoadingLabel } from "../components/UI";
import { contributionsSummary } from "../utils/contributions";

type Preview = { current: Balance; draft: Balance; next: Balance; shares: Pick<Balance["participantes"][number], "usuario" | "corresponde">[] };
export default function NewExpensePage() {
    const { activityId } = useParams(); const { user } = useAuth();
    const resource = useResource<{ activity: Activity }>(`/activities/${activityId}`);
    const key = `dd.payer.${user?.id}.${activityId}`;
    const [monto, setMonto] = useState(""); const [concepto, setConcepto] = useState("");
    const [payer, setPayer] = useState<number>(() => Number(localStorage.getItem(key)) || user?.id || 0);
    const [multiple, setMultiple] = useState(false);
    const [contributions, setContributions] = useState<Record<number, string>>({});
    const { busy, begin, end } = useSubmission(); const [error, setError] = useState(""); const [success, setSuccess] = useState(false);
    const [preview, setPreview] = useState<Preview | null>(null); const [previewError, setPreviewError] = useState(""); const [version, setVersion] = useState(0);
    const users = resource.data?.activity.participantes.map((p) => p.usuario) || [];
    const selected = users.some((u) => u.id === payer) ? payer : users[0]?.id;
    const guard = useUnsavedChanges(!success && Boolean(monto || concepto || Object.values(contributions).some(Boolean)));
    let amount = "";
    try { amount = decimalInput(monto); } catch { /* Validación visible al enviar. */ }
    let summary: ReturnType<typeof contributionsSummary> | null = null;
    let contributionError = "";
    if (multiple && amount) {
        try { summary = contributionsSummary(amount, users.map((u) => ({ pagadorId: u.id, monto: contributions[u.id] || "" }))); }
        catch { contributionError = "Revisá los aportes: usá montos positivos con hasta dos decimales, o dejá vacío si no puso plata."; }
    }
    const contributionBody = multiple && summary?.complete ? JSON.stringify(summary.aportes) : "";
    useEffect(() => {
        let active = true; setPreview(null); setPreviewError("");
        if (!amount || !selected || (multiple && !contributionBody)) return;
        const timer = setTimeout(() => {
            post<{ preview: Preview }>(`/activities/${activityId}/expenses/preview`, { monto: amount, concepto: "Vista previa", ...(multiple ? { aportes: JSON.parse(contributionBody) } : { pagadorId: selected }) })
                .then((data) => { if (active) setPreview(data.preview); })
                .catch((err: Error) => { if (active) setPreviewError(err.message); });
        }, 300);
        return () => { active = false; clearTimeout(timer); };
    }, [amount, selected, activityId, version, multiple, contributionBody]);
    async function submit(e: FormEvent) {
        e.preventDefault(); if (!begin()) return; setError("");
        try {
            const value = decimalInput(monto);
            if (!concepto.trim() || !selected) throw new Error("Completá el concepto y seleccioná quién pagó.");
            
            if (multiple && !summary?.complete) throw new Error("Los aportes de al menos dos personas deben sumar el total del gasto.");
            await post(`/activities/${activityId}/expenses`, { monto: value, concepto: concepto.trim(), ...(multiple ? { aportes: summary!.aportes } : { pagadorId: selected }) });
            if (!multiple) localStorage.setItem(key, String(selected));
            setSuccess(true);
        } catch (err) { setError((err as Error).message + " Tu información sigue acá."); } finally { end(); }
    }
    if (success) return <section className="success-screen dark-surface"><Geometry /><div><span className="success-check"><Check size={39} strokeWidth={1} /></span><h1>¡Listo!</h1><p>El gasto se agregó correctamente.</p><p>{multiple ? "Se guardaron todos los aportes juntos" : `Pagó ${users.find((u) => u.id === selected)?.nombre}`}. Se divide entre {users.length} personas.</p><SavedSettlement activityId={activityId || ""} /><div className="success-actions"><Link className="button button-mint" to={`/activities/${activityId}?tab=balance`}>Ver cómo quedan las cuentas<ArrowRight size={18} /></Link><Link className="button button-light-outline" to={`/activities/${activityId}`}>Ver gastos</Link><button className="text-link" onClick={() => { setMonto(""); setConcepto(""); setContributions({}); setSuccess(false); setVersion((v) => v + 1); }}>Agregar otro</button></div></div></section>;
    return <div className="page expense-form">{guard.dialog}<Heading title="Nuevo gasto" subtitle={resource.data?.activity.nombre} back={`/activities/${activityId}`} />
        {resource.loading ? <Loading /> : resource.error ? <ErrorState message={resource.error} retry={resource.reload} /> : <div className="expense-workspace"><form onSubmit={submit}><fieldset disabled={busy}>
            <label>¿Cuánto fue?<span className="amount-field"><span aria-hidden="true">$</span><input aria-label="Monto" inputMode="decimal" autoFocus required autoComplete="off" placeholder="0,00" value={monto} onChange={(e) => setMonto(e.target.value)} /></span></label>
            <label>¿Qué pagaron?<input aria-label="Concepto" required maxLength={200} placeholder="Ej: Pizza, taxi, entradas…" value={concepto} onChange={(e) => setConcepto(e.target.value)} /></label>
            <div className="concept-suggestions" aria-label="Sugerencias de concepto">{["Comida", "Bebida", "Transporte", "Alojamiento", "Compra", "Entrada", "Otro"].map((label) => <button key={label} type="button" aria-pressed={concepto === label} onClick={() => setConcepto(label)}>{label}</button>)}</div>
            <fieldset className="payer-field"><legend>¿Quién pagó?</legend><div className="filter-pills payer-mode"><button type="button" aria-pressed={!multiple} onClick={() => setMultiple(false)}>Una persona</button><button type="button" aria-pressed={multiple} onClick={() => setMultiple(true)}>Varias personas</button></div>{!multiple && <><p className="field-help">Quién puso la plata. Podés registrar lo que pagó otra persona.</p><div className="payer-options">{users.map((u) => <label className={selected === u.id ? "selected" : ""} key={u.id}><input aria-label={`${u.id === user?.id ? "Yo · " : ""}${u.nombre}`} type="radio" name="payer" value={u.id} checked={selected === u.id} onChange={() => setPayer(u.id)} /><Avatar name={u.nombre} /><span>{u.id === user?.id ? "Yo · " : ""}{u.nombre}</span></label>)}</div></>}{multiple && <div className="contribution-inputs"><p className="field-help">Indicá cuánto puso cada persona. Dejá vacío o 0 si no aportó; igual participa del reparto.</p>{users.map((u) => <label key={u.id}><span>{u.id === user?.id ? "Yo · " : ""}{u.nombre}</span><input aria-label={`Aporte de ${u.nombre}`} inputMode="decimal" autoComplete="off" placeholder="0,00" value={contributions[u.id] || ""} onChange={(e) => setContributions((values) => ({ ...values, [u.id]: e.target.value }))} /></label>)}<div className="contribution-total" aria-live="polite">{summary ? <><p>Aportes cargados: <strong>{money(summary.sum)}</strong> de {money(amount)}</p><p>{summary.complete ? "La suma coincide con el total ✓" : summary.difference.startsWith("-") ? `Sobran ${money(summary.difference.slice(1))}. Revisá los aportes.` : summary.difference !== "0.00" ? `Faltan ${money(summary.difference)} por asignar.` : "Para varios pagadores, indicá al menos dos aportes; si pagó uno, elegí Una persona."}</p></> : <p>{contributionError || "Ingresá el total y cuánto puso cada persona."}</p>}</div></div>}</fieldset>
            <p className="field-help">Los aportes indican quién puso la plata. El costo se divide en partes iguales entre todas las personas de la actividad.</p>
            {preview && (!multiple || summary?.complete) && <div className="mobile-settlement"><SettlementSummary transfers={preview.next.transferencias} preview /></div>}<div className="split-explanation"><h3>Se divide entre</h3><p>{users.map((u) => u.nombre).join(" · ")}</p><p>En partes iguales entre {users.length} personas. Quien pagó también asume su parte.</p><div className="inline-shares" aria-live="polite">{amount && preview ? preview.shares.map((p) => <p key={p.usuario.id}>{p.usuario.nombre}: <strong>{money(p.corresponde)}</strong> de este gasto</p>) : <p>{amount ? multiple && !summary?.complete ? "Completá los aportes para ver cómo quedan las cuentas." : "Calculando el reparto…" : "Ingresá el monto para ver el reparto antes de guardar."}</p>}</div></div>
            <FormError message={error} /><button className="button full-width" disabled={!selected || (multiple && !summary?.complete)} type="submit">{busy ? <LoadingLabel text="Guardando…" /> : "Guardar gasto"}<ArrowRight size={18} /></button>
        </fieldset></form>
        <aside className="expense-preview" aria-label="Reparto antes de guardar"><p className="eyebrow">ANTES DE GUARDAR</p><h2>Las cuentas, claras</h2><p className="muted">{resource.data?.activity.nombre}</p>
            {!amount || (multiple && !summary?.complete) ? <p className="preview-placeholder">{multiple ? "Cuando los aportes coincidan con el total, vas a ver quién le devuelve a quién." : "Ingresá el monto para ver cuánto le corresponde a cada persona."}</p> : previewError ? <ErrorState message={previewError} retry={() => setVersion((v) => v + 1)} /> : !preview ? <Loading /> : <>
                <SettlementSummary transfers={preview.next.transferencias} preview /><div className="preview-totals"><div><span>Total actual</span><strong>{money(preview.current.total)}</strong></div><div><span>Este gasto</span><strong>{money(preview.draft.total)}</strong></div><div><span>Nuevo total de la actividad</span><strong>{money(preview.next.total)}</strong></div></div>
                <h3>Por este gasto</h3><p className="field-help">{multiple ? "Entre todos pusieron" : `${users.find((u) => u.id === selected)?.nombre} puso`} {money(preview.draft.total)}. A cada persona se le suma:</p>
                <div className="share-list">{preview.shares.map((p) => <div key={p.usuario.id}><span>{p.usuario.nombre}</span><strong>{money(p.corresponde)}</strong></div>)}</div>
                <p className="field-help">Los centavos sobrantes se distribuyen siempre en el mismo orden.</p>
                <details><summary>Cómo quedaría toda la actividad</summary><div className="share-list">{preview.next.participantes.map((p) => <div key={p.usuario.id}><span>{p.usuario.nombre}<small>Le corresponderían {money(p.corresponde)}</small></span><strong>{p.balance.startsWith("-") ? "Debe " : p.balance === "0.00" ? "A mano " : "Recibe "}{money(p.balance.replace("-", ""))}</strong></div>)}</div></details>
                <p className="field-help">Vista previa sin guardar. Si alguien suma un gasto mientras tanto, el balance final se actualiza.</p>
            </>}
        </aside></div>}
    </div>;
}
