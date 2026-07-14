/**
 * Configuração flat de lint para o frontend Orélle.
 *
 * O lint cobre runtime React, testes e scripts locais sem assumir globals de
 * browser em processos Node. Artefactos gerados e relatórios ficam excluídos.
 */
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "playwright-report/**",
            "test-results/**",
            "public/products/**",
        ],
    },
    js.configs.recommended,
    {
        files: ["src/**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: globals.browser,
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
        },
    },
    {
        // Estes módulos expõem deliberadamente o componente e o respetivo
        // contrato partilhado (roles ou hook de contexto) no mesmo boundary.
        files: [
            "src/components/AppLayouts.jsx",
            "src/context/AuthContext.jsx",
        ],
        rules: {
            "react-refresh/only-export-components": "off",
        },
    },
    {
        files: [
            "scripts/**/*.mjs",
            "tests/**/*.{js,mjs,jsx}",
            "vite.config.js",
            "vitest.config.js",
        ],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.node,
                ...globals.browser,
            },
        },
    },
];
