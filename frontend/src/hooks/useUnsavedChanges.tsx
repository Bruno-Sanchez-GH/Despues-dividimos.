import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

export function useUnsavedChanges(dirty: boolean) {
    const allowed = useRef(false);
    const dialog = useRef<HTMLDialogElement>(null);
    const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !allowed.current && currentLocation.pathname !== nextLocation.pathname);
    useEffect(() => {
        const unload = (event: BeforeUnloadEvent) => { if (dirty && !allowed.current) { event.preventDefault(); event.returnValue = ""; } };
        window.addEventListener("beforeunload", unload);
        return () => window.removeEventListener("beforeunload", unload);
    }, [dirty]);
    useEffect(() => {
        if (blocker.state === "blocked") dialog.current?.showModal();
        else dialog.current?.close();
    }, [blocker.state]);
    return {
        allow: () => { allowed.current = true; },
        dialog: <dialog className="discard-dialog" ref={dialog} aria-labelledby="discard-title" onCancel={() => blocker.state === "blocked" && blocker.reset()}>
            <h2 id="discard-title">¿Salir sin guardar?</h2><p>Los datos de este formulario se van a perder.</p>
            <div><button autoFocus className="button" onClick={() => blocker.state === "blocked" && blocker.reset()}>Seguir editando</button><button className="button button-outline" onClick={() => blocker.state === "blocked" && blocker.proceed()}>Descartar y salir</button></div>
        </dialog>
    };
}
