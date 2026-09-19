export const TOKEN_KEY = "dd.session";
const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem(TOKEN_KEY);
    let response: Response;
    try {
        response = await fetch(base + path, {
            ...options,
            headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
        });
    } catch {
        throw new Error("No pudimos conectar. Revisá tu conexión e intentá de nuevo.");
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        if (response.status === 401 && token && !path.startsWith("/auth/login") && localStorage.getItem(TOKEN_KEY) === token) {
            localStorage.removeItem(TOKEN_KEY);
            window.dispatchEvent(new Event("session-expired"));
        }
        throw new Error(data?.message || ({ 401: "Tu sesión venció. Iniciá sesión otra vez.", 403: "No tenés acceso a este contenido.", 404: "No encontramos lo que buscás." }[response.status] || "Algo salió mal. Intentá nuevamente."));
    }
    return data as T;
}
export function post<T>(path: string, body: unknown) { return api<T>(path, { method: "POST", body: JSON.stringify(body) }); }
