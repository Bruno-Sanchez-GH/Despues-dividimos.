import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, post, TOKEN_KEY } from "../services/api";
import type { User } from "../types";

type Auth = { user: User | null; loading: boolean; error: string; login: (email: string, password: string) => Promise<void>; logout: () => void; retry: () => void };
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        setError(""); setLoading(true);
        if (!localStorage.getItem(TOKEN_KEY)) { setUser(null); setLoading(false); return; }
        try { const data = await api<{ user: User }>("/auth/me"); setUser(data.user); }
        catch (err) { setError((err as Error).message); setUser(null); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => {
        void load();
        const expired = () => { setUser(null); setError(""); setLoading(false); };
        const sync = (event: StorageEvent) => { if (event.key === TOKEN_KEY) void load(); };
        window.addEventListener("session-expired", expired); window.addEventListener("storage", sync);
        return () => { window.removeEventListener("session-expired", expired); window.removeEventListener("storage", sync); };
    }, [load]);
    async function login(email: string, password: string) {
        const { token } = await post<{ token: string }>("/auth/login", { email, password });
        localStorage.setItem(TOKEN_KEY, token);
        const data = await api<{ user: User }>("/auth/me");
        setUser(data.user); setError("");
    }
    function logout() { localStorage.removeItem(TOKEN_KEY); setUser(null); setError(""); }
    return <Context.Provider value={{ user, loading, error, login, logout, retry: () => void load() }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error("AuthProvider requerido"); return value; }
