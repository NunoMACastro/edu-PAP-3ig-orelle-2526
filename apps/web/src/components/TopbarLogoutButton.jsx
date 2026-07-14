/** Ação de logout reutilizável nas topbars públicas com sessão iniciada. */
import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { NavIcon } from "./NavIcon.jsx";

/**
 * Termina apenas a sessão atual e mantém a ação sempre visível no header.
 * Um latch síncrono impede pedidos duplicados antes do primeiro render de loading.
 */
export function TopbarLogoutButton() {
    const { logout } = useAuth();
    const inFlightRef = useRef(false);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function handleLogout() {
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setStatus("loading");
        setError("");

        try {
            await logout();
        } catch (logoutError) {
            setStatus("error");
            setError(
                logoutError?.message ??
                    "Não foi possível terminar a sessão. Tenta novamente.",
            );
        } finally {
            inFlightRef.current = false;
        }
    }

    return (
        <span className="topbar-logout">
            <button
                className="mockup-nav-link topbar-logout__button"
                type="button"
                aria-label="Terminar sessão"
                aria-busy={status === "loading"}
                disabled={status === "loading"}
                onClick={handleLogout}
            >
                <span className="mockup-nav-icon">
                    <NavIcon name="logout" />
                </span>
                <span className="mockup-nav-label">
                    {status === "loading" ? "A sair…" : "Sair"}
                </span>
            </button>
            {error ? (
                <span className="topbar-logout__error" role="alert">
                    {error}
                </span>
            ) : null}
        </span>
    );
}
