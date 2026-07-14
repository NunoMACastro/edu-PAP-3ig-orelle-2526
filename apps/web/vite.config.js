/**
 * Configuracao Vite do frontend real_dev.
 *
 * O plugin React garante transform JSX consistente em dev e build.
 */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const DEFAULT_LOCAL_API_PROXY_TARGET = "http://127.0.0.1:3001";

/**
 * Resolve o target do proxy exclusivamente para loopback local.
 *
 * A variável existe para testes/ports locais dinâmicos e só é lida pelo
 * servidor Vite; nunca é exposta ao bundle da aplicação.
 *
 * @returns {string} Origin HTTP local validada.
 */
function getLocalApiProxyTarget() {
    const configuredTarget =
        process.env.VITE_API_PROXY_TARGET ?? DEFAULT_LOCAL_API_PROXY_TARGET;
    const target = new URL(configuredTarget);
    const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);

    if (
        target.protocol !== "http:" ||
        !loopbackHosts.has(target.hostname) ||
        target.username ||
        target.password ||
        target.pathname !== "/" ||
        target.search ||
        target.hash
    ) {
        throw new Error(
            "VITE_API_PROXY_TARGET deve ser uma origin HTTP loopback sem credenciais",
        );
    }

    return target.origin;
}

const LOCAL_API_PROXY_TARGET = getLocalApiProxyTarget();

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: LOCAL_API_PROXY_TARGET,
                changeOrigin: false,
            },
        },
    },
});
