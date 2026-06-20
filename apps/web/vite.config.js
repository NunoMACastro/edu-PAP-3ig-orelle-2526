/**
 * Configuracao Vite do frontend real_dev.
 *
 * O plugin React garante transform JSX consistente em dev e build.
 */
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
});
