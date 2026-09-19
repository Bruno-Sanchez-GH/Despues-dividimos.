import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, LogOut, Mail, UsersRound, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import { api } from "../services/api";
import type { Invitation } from "../types";
import { Avatar, Empty, ErrorState, Geometry, Heading, Loading, LoadingLabel } from "../components/UI";

export function InvitationsPage() {
    const resource = useResource<{ invitations: Invitation[] }>("/invitations");
    const submitting = useRef(false); const [busy, setBusy] = useState<number | null>(null); const [error, setError] = useState(""); const [success, setSuccess] = useState<{ text: string; group?: number } | null>(null);
    async function respond(invitation: Invitation, action: "accept" | "reject") {
        if (submitting.current) return; submitting.current = true; setBusy(invitation.id); setError(""); setSuccess(null);
        try { await api(`/invitations/${invitation.id}/${action}`, { method: "PATCH" }); setSuccess({ text: action === "accept" ? "Ya sos parte del grupo." : "Invitación rechazada.", ...(action === "accept" ? { group: invitation.grupo.id } : {}) }); resource.reload(); }
        catch (err) { setError((err as Error).message); } finally { submitting.current = false; setBusy(null); }
    }
    return <div className="page"><Heading title="Invitaciones" subtitle="Siempre hay lugar para un plan más." />{success && <p className="success-note" role="status">{success.text} {success.group && <Link to={`/groups/${success.group}`}>Ver grupo →</Link>}</p>}{error && <ErrorState message={error} />}{resource.loading ? <Loading /> : resource.error ? <ErrorState message={resource.error} retry={resource.reload} /> : !resource.data?.invitations.length ? <Empty title="Estás al día." text="Cuando alguien te invite a un grupo, lo vas a encontrar acá." /> : <div className="invitation-grid">{resource.data.invitations.map((invitation) => <article className="invitation-card" key={invitation.id}><span className="list-icon"><Mail size={23} /></span><h2>{invitation.grupo.nombre}</h2><p><strong>{invitation.Invitador.nombre}</strong> te invitó a compartir este grupo.</p><div><button className="button" disabled={busy !== null} onClick={() => void respond(invitation, "accept")}><Check size={18} />{busy === invitation.id ? <LoadingLabel text="Procesando…" /> : "Aceptar"}</button><button className="button button-outline" disabled={busy !== null} onClick={() => void respond(invitation, "reject")}><X size={18} />Rechazar</button></div></article>)}</div>}</div>;
}
export function ProfilePage() {
    const { user, logout } = useAuth();
    return <section className="profile-screen dark-surface"><Geometry /><div className="profile-inner"><h1>Mi perfil</h1><div className="profile-person"><Avatar name={user?.nombre || ""} /><h2>{user?.nombre}</h2><p>{user?.email}</p></div><div className="profile-links"><Link to="/groups"><UsersRound size={21} />Mis grupos<ChevronRight size={18} /></Link><Link to="/invitations"><Mail size={21} />Invitaciones<ChevronRight size={18} /></Link><button onClick={logout}><LogOut size={21} />Cerrar sesión<ChevronRight size={18} /></button></div><p className="profile-tagline">Más experiencias.<br /><strong>Menos cuentas.</strong></p></div></section>;
}
