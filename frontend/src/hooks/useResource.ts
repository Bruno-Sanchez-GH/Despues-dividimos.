import { useEffect, useState } from "react";
import { api } from "../services/api";

export function useResource<T>(path: string) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true); setError(""); setData(null);
        api<T>(path).then((result) => { if (active) setData(result); })
            .catch((err: Error) => { if (active) setError(err.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [path, version]);
    return { data, error, loading, reload: () => setVersion((v) => v + 1) };
}
