import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, RefreshCw, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { initials } from "../utils/format";

export function Geometry() { return <div className="geometry pointer-events-none" aria-hidden="true"><i /><i /><i /></div>; }
export function Brand({ large = false }: { large?: boolean }) { return <Link to="/" className={"brand " + (large ? "brand-large" : "")} aria-label="Después Dividimos, inicio"><span className="brand-icon">$</span><span>Después<br />Dividimos</span></Link>; }
export function Avatar({ name, small = false }: { name: string; small?: boolean }) { return <span className={"avatar " + (small ? "avatar-small" : "")} title={name}>{initials(name)}</span>; }
export function Heading({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: ReactNode }) {
    return <header className="page-heading">{back && <Link className="icon-button back-button" to={back} aria-label="Volver"><ArrowLeft size={22} /></Link>}<div><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>{action}</header>;
}
export function LoadingLabel({ text = "Cargando…" }: { text?: string }) { return <span className="loading-label"><span className="loading-dot" aria-hidden="true" />{text}</span>; }
export function Loading({ variant = "list" }: { variant?: "list" | "balance" | "form" }) { return <div className={`skeletons skeleton-${variant}`} role="status" aria-label="Cargando"><LoadingLabel /><div /><div />{variant !== "balance" && <div />}</div>; }
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) { return <div className="error-state" role="alert"><CircleAlert size={22} /><p>{message}</p>{retry && <button className="button button-outline" onClick={retry}><RefreshCw size={16} />Reintentar</button>}</div>; }
export function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) { return <div className="empty-state"><span className="empty-icon"><UsersRound size={27} strokeWidth={1.4} /></span><h2>{title}</h2><p>{text}</p>{children}</div>; }
export function FormError({ message }: { message: string }) { return message ? <p className="form-error" role="alert">{message}</p> : null; }
export function ActionLink({ to, children }: { to: string; children: ReactNode }) { return <Link className="button" to={to}>{children}<ArrowRight size={18} /></Link>; }
