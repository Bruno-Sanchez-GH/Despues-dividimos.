import { Link, Route, Routes } from "react-router-dom";
import { Layout, Protected } from "./components/Layout";
import { Welcome, AuthPage } from "./pages/Auth";
import { GroupPage, GroupsPage, InvitePage, NewGroupPage } from "./pages/Groups";
import { ActivityPage, NewActivityPage } from "./pages/Activities";
import NewExpensePage from "./pages/Expenses";
import { InvitationsPage, ProfilePage } from "./pages/Account";
import { Empty } from "./components/UI";
import HomePage, { MoneyActionsPage } from "./pages/Home";
import QuickPage from "./pages/Quick";
import NewPlanPage from "./pages/Plan";

export default function App() {
    return <Routes><Route path="/" element={<Welcome />} /><Route path="/login" element={<AuthPage />} /><Route path="/register" element={<AuthPage register />} /><Route element={<Protected />}><Route element={<Layout />}>
        <Route path="/home" element={<HomePage />} /><Route path="/money" element={<MoneyActionsPage />} /><Route path="/quick" element={<QuickPage />} /><Route path="/plans/new" element={<NewPlanPage />} />
        <Route path="/groups" element={<GroupsPage />} /><Route path="/groups/new" element={<NewGroupPage />} /><Route path="/groups/:groupId" element={<GroupPage />} /><Route path="/groups/:groupId/invite" element={<InvitePage />} /><Route path="/groups/:groupId/activities/new" element={<NewActivityPage />} /><Route path="/activities/:activityId" element={<ActivityPage />} /><Route path="/activities/:activityId/expenses/new" element={<NewExpensePage />} /><Route path="/invitations" element={<InvitationsPage />} /><Route path="/profile" element={<ProfilePage />} />
    </Route></Route><Route path="*" element={<main className="page narrow"><Empty title="Este plan no está por acá." text="La página que buscás no existe."><Link className="button" to="/groups">Volver a mis grupos</Link></Empty></main>} /></Routes>;
}
