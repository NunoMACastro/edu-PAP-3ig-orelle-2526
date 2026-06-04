import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiRequest("/auth/me")
            .then((data) => setUser(data.user))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    async function login(credentials) {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        setUser(data.user);
        return data.user;
    }

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

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth deve ser usado dentro de AuthProvider");
    }

    return context;
}