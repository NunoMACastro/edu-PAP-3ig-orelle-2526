/**
 * Contexto de autenticacao do frontend.
 *
 * O estado do utilizador vem de `/api/auth/me`, usando o cookie HttpOnly. O
 * frontend guarda apenas o utilizador seguro devolvido pela API, nunca o token.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

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

    useEffect(() => {
        apiRequest("/auth/me")
            .then((data) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    /**
     * Envia credenciais para a API e atualiza o utilizador autenticado.
     *
     * @async
     * @function login
     * @param {{email: string, password: string}} credentials - Credenciais do formulario.
     * @returns {Promise<object>} Utilizador autenticado.
     */
    async function login(credentials) {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        setUser(data.user);
        return data.user;
    }

    /**
     * Termina a sessao no backend e limpa o utilizador local.
     *
     * @async
     * @function logout
     * @returns {Promise<void>}
     */
    async function logout() {
        await apiRequest("/auth/logout", { method: "POST" });
        setUser(null);
    }

    const value = useMemo(
        () => ({ user, loading, login, logout }),
        [user, loading],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

/**
 * Hook para ler o contexto de autenticacao.
 *
 * @function useAuth
 * @returns {{user: object|null, loading: boolean, login: Function, logout: Function}} Estado e acoes de autenticacao.
 * @throws {Error} Quando usado fora de `AuthProvider`.
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth deve ser usado dentro de AuthProvider");
    }

    return context;
}
