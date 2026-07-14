/**
 * Configuração dos testes comportamentais React.
 *
 * Os contratos Node históricos continuam num script separado. Esta suite usa
 * jsdom apenas para componentes e hooks que dependem do lifecycle do browser.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./tests/setupTests.js"],
        include: ["tests/unit/**/*.test.jsx"],
        clearMocks: true,
        restoreMocks: true,
    },
});
