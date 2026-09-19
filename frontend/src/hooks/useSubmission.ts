import { useRef, useState } from "react";

// El ref bloquea dos eventos del mismo tick, antes del siguiente render de React.
export function useSubmission() {
    const running = useRef(false);
    const [busy, setBusy] = useState(false);
    return {
        busy,
        begin() { if (running.current) return false; running.current = true; setBusy(true); return true; },
        end() { running.current = false; setBusy(false); }
    };
}
