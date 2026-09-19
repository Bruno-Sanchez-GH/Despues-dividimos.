import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { FormError, Heading } from "../components/UI";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { decimalInput, money } from "../utils/format";
import { centsString, quickSplit } from "../utils/quickSplit";

export default function QuickPage() {
    const [amount, setAmount] = useState("");
    const [count, setCount] = useState(2);
    const [payer, setPayer] = useState("me");
    const [error, setError] = useState("");
    const [result, setResult] = useState<{ amount: string; shares: string[]; payer: string } | null>(null);
    const guard = useUnsavedChanges(Boolean(amount) && !result);
    function submit(e: FormEvent) {
        e.preventDefault(); setError("");
        try { const value = decimalInput(amount); setResult({ amount: value, shares: quickSplit(value, count), payer }); }
        catch (err) { setError((err as Error).message); }
    }
    const returned = result ? centsString(result.shares.slice(1).reduce((sum, s) => sum + BigInt(s.replace(".", "")), 0n)) : "0.00";
    return <div className="page narrow">{guard.dialog}<Heading title="Dividir un pago" subtitle="Una cuenta, sin vueltas. Todavía no se guarda nada." back="/home" />
        {!result ? <form onSubmit={submit}><label>¿Cuánto fue?<span className="amount-field"><span>$</span><input required autoFocus aria-label="¿Cuánto fue?" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} /></span></label>
            <fieldset><legend>¿Entre cuántos?</legend><div className="stepper"><button type="button" aria-label="Una persona menos" disabled={count <= 1} onClick={() => setCount(count - 1)}><Minus /></button><output aria-live="polite">{count}</output><button type="button" aria-label="Una persona más" disabled={count >= 100} onClick={() => setCount(count + 1)}><Plus /></button></div><p className="field-help">Incluye a la persona que pagó.</p></fieldset>
            <fieldset className="quick-payer"><legend>¿Quién pagó?</legend><label><input type="radio" name="quick-payer" checked={payer === "me"} onChange={() => setPayer("me")} />Yo</label><label><input type="radio" name="quick-payer" checked={payer === "other"} onChange={() => setPayer("other")} />Otra persona</label></fieldset>
            <FormError message={error} /><button className="button full-width">Dividir</button></form> : <div className="quick-result">
            <section className="quick-total dark-surface"><p>TOTAL</p><h2>{money(result.amount)}</h2><p>{result.shares.length} personas</p><strong>{result.payer === "me" ? "Vos pagaste" : "Otra persona pagó"} {money(result.amount)}</strong><div className="quick-return"><p>{result.payer === "me" ? "Te tienen que devolver" : "Le tienen que devolver"}</p><h2>{money(returned)}</h2><p>Entre las otras personas de la cuenta</p></div></section>
            <h2>Así se divide</h2><p className="field-help">Partes iguales. Si sobran centavos, los primeros lugares reciben uno más. Al guardar, el orden se define por las personas elegidas.</p>
            <div className="share-list">{result.shares.map((share, i) => <div key={i}><span>{i === 0 ? result.payer === "me" ? "Vos · pagaste" : "Quien pagó" : `Persona ${i + 1}`}</span><strong>{money(share)}</strong></div>)}</div>
            <p className="field-help">Quien pagó ya cubrió su parte. Cada otra persona le devuelve el importe que figura arriba. Este cálculo no registra pagos.</p>
            <Link className="button full-width" to={`/plans/new?amount=${encodeURIComponent(result.amount)}&count=${result.shares.length}&payer=${result.payer}`}>Guardar como plan</Link>
            <Link className="button button-outline full-width" to="/home">Listo</Link><button className="text-link" onClick={() => setResult(null)}>Cambiar cuenta</button>
        </div>}
    </div>;
}
