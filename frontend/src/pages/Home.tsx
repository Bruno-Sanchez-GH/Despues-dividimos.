import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Luggage, UsersRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useResource } from "../hooks/useResource";
import type { Group } from "../types";
import { Avatar, ErrorState, Geometry, Heading, Loading } from "../components/UI";
import { dateLabel } from "../utils/format";

export default function HomePage() {
    const { user } = useAuth();
    const resource = useResource<{ groups: Group[] }>("/groups");
    const recent = useResource<{ activities: { id: number; nombre: string; startAt: string; grupo: { nombre: string }; _count: { participantes: number } }[] }>("/activities");
    return <div className="page home-page">
        <div className="mobile-brand"><span>Después Dividimos</span><Link to="/profile" aria-label="Mi perfil"><Avatar name={user?.nombre || ""} /></Link></div>
        <p className="greeting">Buenas, {user?.nombre}.</p>
        <Heading title="¿Qué hacemos?" subtitle="Compartí el momento. Repartí las cuentas." />
        <div className="intent-grid">
            <Link className="intent-card dark-surface" to="/groups/new?mode=trip"><Geometry /><Luggage /><h2>Viaje</h2><p>Varios días, actividades y gastos.</p><span>Organizar un viaje <ArrowRight size={17} /></span></Link>
            <Link className="intent-card light-surface" to="/plans/new"><CalendarDays /><h2>Plan</h2><p>Cena, salida, asado o actividad corta.</p><span>Crear un plan <ArrowRight size={17} /></span></Link>
            <Link className="intent-card quick-intent" to="/quick"><span className="quick-dollar">$</span><h2>Dividir</h2><p>Resolver una cuenta rápidamente.</p><span>Dividir algo ahora <ArrowRight size={17} /></span></Link>
        </div>
        <div className="section-toolbar"><h2>Tus cosas</h2><Link className="text-link" to="/groups">Ver grupos <ArrowRight size={16} /></Link></div>
        {resource.loading ? <Loading /> : resource.error ? <ErrorState message={resource.error} retry={resource.reload} /> : !resource.data?.groups.length ? <div className="home-empty"><UsersRound /><h3>Todavía no compartiste ningún gasto.</h3><p>Organizá un viaje, creá un plan o dividí algo ahora con las opciones de arriba.</p></div> : <div className="group-grid">{resource.data.groups.map((g) => <Link className="home-group" to={`/groups/${g.id}`} key={g.id}><span className="list-icon"><UsersRound /></span><div><h3>{g.nombre}</h3><p>{g._count ? `Grupo · ${g._count.membresias} personas` : "Grupo"}</p></div><ArrowRight size={19} /></Link>)}</div>}
        {recent.error ? <ErrorState message={recent.error} retry={recent.reload} /> : recent.loading ? <Loading /> : Boolean(recent.data?.activities.length) && <section className="recent-plans"><h2>Planes y actividades recientes</h2>{recent.data?.activities.map((a) => <Link className="home-group" key={a.id} to={`/activities/${a.id}`}><span className="list-icon"><CalendarDays /></span><div><h3>{a.nombre}</h3><p>{a.grupo.nombre} · {a._count.participantes} personas · {dateLabel(a.startAt)}</p></div><ArrowRight size={18} /></Link>)}</section>}
    </div>;
}

export function MoneyActionsPage() {
    return <div className="page narrow"><Heading title="¿Qué querés hacer?" back="/home" /><div className="action-choices"><Link className="intent-card light-surface" to="/groups?choose=expense"><h2>Registrar un gasto</h2><p>Elegí el grupo y la actividad donde alguien pagó.</p><ArrowRight /></Link><Link className="intent-card dark-surface" to="/quick"><h2>Dividir un pago rápido</h2><p>Calculá una cuenta ahora, sin crear un grupo.</p><ArrowRight /></Link></div></div>;
}
