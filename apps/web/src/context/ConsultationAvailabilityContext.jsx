/** Disponibilidade partilhada da consulta, carregada uma vez por sessão. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getConsultationCapabilities } from "../features/consultation/consultationApi.js";
import { useAuth } from "./AuthContext.jsx";

const INITIAL_VALUE = Object.freeze({ available: false, status: "idle", reason: null, capability: null, error: null, refresh: async () => {} });
// Componentes montados isoladamente em testes mantêm o contrato anterior. Na
// aplicação real o provider substitui imediatamente este fallback.
const FALLBACK_VALUE = Object.freeze({ ...INITIAL_VALUE, available: true, status: "success" });
const ConsultationAvailabilityContext = createContext(FALLBACK_VALUE);

/** Mantém a capability OpenAI interna e publica apenas um estado de produto. */
export function ConsultationAvailabilityProvider({ children }) {
    const { user } = useAuth();
    const [state, setState] = useState(INITIAL_VALUE);

    const refresh = useCallback(async ({ signal } = {}) => {
        if (user?.role !== "cliente") {
            setState(INITIAL_VALUE);
            return;
        }
        setState((current) => ({ ...current, status: "loading", error: null }));
        try {
            const capability = await getConsultationCapabilities({ signal });
            setState({ available: capability?.available === true, status: "success", reason: capability?.reason ?? null, capability, error: null });
        } catch (error) {
            if (error?.code === "REQUEST_ABORTED") return;
            setState({ available: false, status: "error", reason: error?.code ?? "CAPABILITY_UNAVAILABLE", capability: null, error });
        }
    }, [user?.role]);

    useEffect(() => {
        const controller = new AbortController();
        void refresh({ signal: controller.signal });
        return () => controller.abort();
    }, [refresh]);

    const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
    return <ConsultationAvailabilityContext.Provider value={value}>{children}</ConsultationAvailabilityContext.Provider>;
}

/** Lê o estado de disponibilidade sem obrigar páginas isoladas a montar o provider. */
// O hook vive junto do provider para manter o contrato público num único módulo.
// eslint-disable-next-line react-refresh/only-export-components
export function useConsultationAvailability() {
    return useContext(ConsultationAvailabilityContext);
}
