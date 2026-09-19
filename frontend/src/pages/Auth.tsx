import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { useSubmission } from "../hooks/useSubmission";
import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { post } from "../services/api";
import { Brand, FormError, Geometry, LoadingLabel } from "../components/UI";

export function Welcome() {
    const { user } = useAuth();
    if (user) return <Navigate to="/home" replace />;
    return <main className="welcome dark-surface"><Geometry /><div className="welcome-inner"><Brand /><p className="eyebrow welcome-eyebrow">ORGANIZÁ TUS VIAJES,<br />JUNTADAS Y GASTOS EN GRUPO.</p><div className="welcome-copy"><span className="short-line" /><h1>Después<br /><span>Dividimos</span></h1><h2>Más experiencias.<br />Menos cuentas.</h2><p>Disfrutá el momento con los tuyos.<br />Las cuentas, las hacemos después.</p></div><div className="welcome-actions"><Link className="button button-mint" to="/register">Crear cuenta<ArrowRight size={21} /></Link><Link className="button button-light-outline" to="/login">Iniciar sesión</Link></div><p className="welcome-footer">VIAJÁ <span>·</span> COMPARTÍ <span>·</span> DISFRUTÁ</p></div><div className="welcome-note" aria-hidden="true"><span className="brand-icon">$</span><p>Los mejores planes<br />se comparten.</p><span>Y las cuentas también.</span></div></main>;
}
export function AuthPage({ register = false }: { register?: boolean }) {
    const auth = useAuth(); const navigate = useNavigate(); const location = useLocation();
    const [nombre, setNombre] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
    const [visible, setVisible] = useState(false); const { busy, begin, end } = useSubmission(); const [error, setError] = useState("");
    const guard = useUnsavedChanges(Boolean(nombre || email || password));
    if (auth.user) return <Navigate to="/home" replace />;
    async function submit(event: FormEvent) {
        event.preventDefault(); if (!begin()) return;  setError("");
        try {
            if (register) await post("/auth/register", { nombre: nombre.trim(), email: email.trim(), password });
            await auth.login(email.trim(), password);
            guard.allow();
            const from = (location.state as { from?: string } | null)?.from;
            navigate(from?.startsWith("/") && !from.startsWith("//") ? from : "/home", { replace: true });
        } catch (err) { setError((err as Error).message); } finally { end(); }
    }
    return <main className="auth-screen">{guard.dialog}<section className="auth-art dark-surface"><Geometry /><Brand /><h1>Los planes son<br />con amigos.<br /><span>Las cuentas,<br />sin vueltas.</span></h1></section><section className="auth-form"><Link to="/" className="text-link"><ArrowLeft size={18} />Volver</Link><p className="eyebrow">DESPUÉS DIVIDIMOS</p><h1>{register ? "Hagamos planes." : "Qué bueno verte."}</h1><p className="muted">{register ? "Creá tu cuenta y empezá a compartir." : "Ingresá para seguir con tus grupos."}</p><form onSubmit={submit}><fieldset disabled={busy}>{register && <label>Tu nombre<input autoComplete="name" required maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} /></label>}<label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Contraseña<span className="password-field"><input type={visible ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={20} /> : <Eye size={20} />}</button></span></label><FormError message={error} /><button className="button full-width" type="submit">{busy ? <LoadingLabel text="Un momento…" /> : register ? "Crear cuenta" : "Iniciar sesión"}<ArrowRight size={18} /></button></fieldset></form><p className="auth-switch">{register ? "¿Ya tenés cuenta?" : "¿Primera vez por acá?"} <Link to={register ? "/login" : "/register"}>{register ? "Iniciá sesión" : "Creá tu cuenta"}</Link></p></section></main>;
}
