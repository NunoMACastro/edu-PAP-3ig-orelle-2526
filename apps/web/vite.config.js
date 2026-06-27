/**
 * Configuracao Vite do frontend real_dev.
 *
 * O plugin React garante transform JSX consistente em dev e build.
 */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Confirma se uma URL HTTP aponta apenas para ambiente local.
 *
 * @function isLocalHttpUrl
 * @param {string} value - URL candidata.
 * @returns {boolean} Verdadeiro quando o host e local.
 */
function isLocalHttpUrl(value) {
    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" &&
            ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
        );
    } catch {
        return false;
    }
}

/**
 * Bloqueia builds publicados que apontem para API HTTP publica.
 *
 * @function validatePublishedApiBaseUrl
 * @param {string} mode - Modo Vite.
 * @returns {void}
 */
function validatePublishedApiBaseUrl(mode) {
    const apiBaseUrl = process.env.VITE_API_BASE_URL;

    if (
        mode === "production" &&
        apiBaseUrl?.startsWith("http://") &&
        !isLocalHttpUrl(apiBaseUrl)
    ) {
        throw new Error("VITE_API_BASE_URL deve usar HTTPS em produção.");
    }
}

export default defineConfig(({ mode }) => {
    validatePublishedApiBaseUrl(mode);

    return {
        plugins: [react()],
    };
});
