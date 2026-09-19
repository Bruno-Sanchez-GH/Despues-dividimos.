import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { House, Mail, UserRound, Plus, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Brand, ErrorState, Loading } from "./UI";

export function Protected() {
    const auth = useAuth();
    const location = useLocation();
    if (auth.loading) return <main className="auth-loading"><Loading /></main>;
    if (!auth.user && auth.error && localStorage.getItem("dd.session")) return <main className="auth-loading"><ErrorState message={auth.error} retry={auth.retry} /><button className="button" onClick={auth.logout}>Volver al inicio</button></main>;
    if (!auth.user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    return <Outlet />;
}
export function Layout() {
    const location = useLocation();
    useEffect(() => { window.scrollTo(0, 0); document.getElementById("main-content")?.focus(); }, [location.pathname]);
    return <div className="app-shell"><a className="skip-link" href="#main-content">Ir al contenido</a><aside className="sidebar"><Brand /><p className="sidebar-caption">Disfrutá ahora.<br />Después dividimos.</p><nav aria-label="Navegación principal">
        <NavLink to="/home"><House size={21} /><span>Inicio</span></NavLink><NavLink to="/groups"><UsersRound size={21} /><span>Grupos</span></NavLink><NavLink to="/money" className="money-nav"><span className="nav-dollar">$</span><span>Dividir</span></NavLink>
        <NavLink to="/invitations"><Mail size={21} /><span>Invitaciones</span></NavLink>
        <NavLink to="/profile"><UserRound size={21} /><span>Mi perfil</span></NavLink>
    </nav><Link to="/groups/new" className="sidebar-create button"><Plus size={19} />Nuevo grupo</Link><span className="sidebar-foot">VIAJÁ · COMPARTÍ · DISFRUTÁ</span></aside><main id="main-content" className="app-main" tabIndex={-1}><Outlet /></main></div>;
}
