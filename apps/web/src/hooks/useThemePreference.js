import { useCallback, useEffect, useState } from "react";

export const THEMES = Object.freeze(["light", "dark", "contrast"]);

const DEFAULT_THEME = "light";
const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

/**
 * Confirma se o browser suporta consulta de preferência escura.
 *
 * @function canReadSystemTheme
 * @returns {boolean} True quando window.matchMedia está disponível.
 */
function canReadSystemTheme() {
    return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/**
 * Normaliza valores externos para um tema conhecido.
 *
 * @function normalizeTheme
 * @param {string} candidate - Valor recebido da UI.
 * @returns {"light"|"dark"|"contrast"} Tema seguro para aplicar no DOM.
 */
export function normalizeTheme(candidate) {
    return THEMES.includes(candidate) ? candidate : DEFAULT_THEME;
}

/**
 * Obtém o tema inicial a partir da preferência visual do sistema.
 *
 * @function getInitialTheme
 * @returns {"light"|"dark"|"contrast"} Tema inicial seguro.
 */
export function getInitialTheme() {
    if (canReadSystemTheme() && window.matchMedia(DARK_THEME_QUERY).matches) {
        return "dark";
    }

    return DEFAULT_THEME;
}

/**
 * Gere o tema visual da aplicação.
 *
 * @function useThemePreference
 * @returns {{theme: string, themes: readonly string[], selectTheme: (theme: string) => void}} Estado e ação de tema.
 */
export function useThemePreference() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;

        // O tema fica limitado ao DOM; não transporta sessão, role, token ou dados pessoais.
        root.dataset.theme = theme;
        root.style.colorScheme = theme === "dark" ? "dark" : "light";
    }, [theme]);

    useEffect(() => {
        if (!canReadSystemTheme()) {
            return undefined;
        }

        const mediaQuery = window.matchMedia(DARK_THEME_QUERY);

        /**
         * Sincroniza a preferência do sistema enquanto o utilizador não escolhe contraste.
         *
         * @param {MediaQueryListEvent} event - Alteração da preferência visual do sistema.
         * @returns {void}
         */
        function handleSystemThemeChange(event) {
            // O modo de contraste é uma escolha explícita e não deve ser substituído pelo sistema.
            setTheme((currentTheme) => {
                if (currentTheme === "contrast") {
                    return currentTheme;
                }

                return event.matches ? "dark" : "light";
            });
        }

        mediaQuery.addEventListener("change", handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener("change", handleSystemThemeChange);
        };
    }, []);

    const selectTheme = useCallback((nextTheme) => {
        // Valores fora da lista voltam ao tema base para impedir data-theme arbitrário.
        setTheme(normalizeTheme(nextTheme));
    }, []);

    return { theme, themes: THEMES, selectTheme };
}