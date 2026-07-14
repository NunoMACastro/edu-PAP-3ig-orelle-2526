/**
 * Contexto de autenticacao do frontend.
 *
 * O estado do utilizador vem de `/api/auth/me`, usando o cookie HttpOnly. O
 * frontend guarda apenas o utilizador seguro devolvido pela API, nunca o token.
 */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    apiRequest,
    AUTH_SESSION_EXPIRED_EVENT,
    clearCsrfTokenCache,
} from "../services/apiClient.js";

const AuthContext = createContext(null);

/**
 * Provider de autenticacao para a app React.
 *
 * @function AuthProvider
 * @param {{children: import("react").ReactNode}} props - Conteudo da aplicacao.
 * @returns {JSX.Element} Provider com user, loading, login e logout.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializationError, setInitializationError] = useState("");
    const [postSessionNotice, setPostSessionNotice] = useState("");

    useEffect(() => {
        const clearExpiredSession = () => {
            setUser(null);
            setInitializationError("");
        };

        window.addEventListener(
            AUTH_SESSION_EXPIRED_EVENT,
            clearExpiredSession,
        );

        return () => {
            window.removeEventListener(
                AUTH_SESSION_EXPIRED_EVENT,
                clearExpiredSession,
            );
        };
    }, []);

    /**
     * Revalida a sessão sem confundir indisponibilidade de rede com logout.
     *
     * @param {{signal?: AbortSignal}} [options] - Cancelamento do bootstrap.
     * @returns {Promise<void>} Termina quando o estado fica explícito.
     */
    const retrySession = useCallback(async ({ signal } = {}) => {
        setLoading(true);
        setInitializationError("");
        try {
            const data = await apiRequest("/auth/me", { signal });
            setUser(data.user);
        } catch (err) {
            if (err.code === "REQUEST_ABORTED") return;
            if (err.status === 401) {
                setUser(null);
                return;
            }

            setInitializationError(
                "Não foi possível confirmar a sessão. Verifica a ligação e tenta novamente.",
            );
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        retrySession({ signal: controller.signal });
        return () => controller.abort();
    }, [retrySession]);

    /**
     * Envia credenciais para a API e atualiza o utilizador autenticado.
     *
     * @async
     * @function login
     * @param {{email: string, password: string}} credentials - Credenciais do formulario.
     * @returns {Promise<object>} Utilizador autenticado.
     */
    const login = useCallback(async (credentials) => {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        setUser(data.user);
        setInitializationError("");
        setPostSessionNotice("");
        return data.user;
    }, []);

    /**
     * Termina a sessao no backend e limpa o utilizador local.
     *
     * @async
     * @function logout
     * @returns {Promise<void>}
     */
    const logout = useCallback(async () => {
        await apiRequest("/auth/logout", { method: "POST" });
        setUser(null);
        setInitializationError("");
        setPostSessionNotice("");
    }, []);

    /**
     * Revoga todas as sessões persistidas da conta antes de limpar a identidade
     * local. Uma falha é propagada para a UI, que mantém a sessão atual visível
     * e oferece feedback em vez de declarar um logout que não foi confirmado.
     *
     * @returns {Promise<void>} Termina quando todas as sessões foram revogadas.
     */
    const logoutAll = useCallback(async () => {
        await apiRequest("/auth/logout-all", { method: "POST" });
        setUser(null);
        setInitializationError("");
        setPostSessionNotice("");
    }, []);

    /**
     * Esquece imediatamente a identidade local depois de uma operação que já
     * revogou a sessão no servidor, como a eliminação terminal da conta.
     *
     * Não chama logout porque a API de eliminação já removeu todas as sessões e
     * limpou o cookie. Também elimina o CSRF ligado à sessão extinta.
     *
     * @param {string} [notice=""] - Confirmação pública a apresentar depois do redirect.
     * @returns {void}
     */
    const forgetSession = useCallback((notice = "") => {
        clearCsrfTokenCache();
        setUser(null);
        setInitializationError("");
        setPostSessionNotice(typeof notice === "string" ? notice : "");
    }, []);

    /**
     * Consome o aviso efémero depois de a rota pública o materializar.
     *
     * @returns {void}
     */
    const clearPostSessionNotice = useCallback(() => {
        setPostSessionNotice("");
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
            initializationError,
            retrySession,
            login,
            logout,
            logoutAll,
            forgetSession,
            postSessionNotice,
            clearPostSessionNotice,
        }),
        [
            user,
            loading,
            initializationError,
            retrySession,
            login,
            logout,
            logoutAll,
            forgetSession,
            postSessionNotice,
            clearPostSessionNotice,
        ],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

/**
 * Hook para ler o contexto de autenticacao.
 *
 * @function useAuth
 * @returns {{user: object|null, loading: boolean, initializationError: string, retrySession: Function, login: Function, logout: Function, logoutAll: Function, forgetSession: Function, postSessionNotice: string, clearPostSessionNotice: Function}} Estado e acoes de autenticacao.
 * @throws {Error} Quando usado fora de `AuthProvider`.
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth deve ser usado dentro de AuthProvider");
    }

    return context;
}
