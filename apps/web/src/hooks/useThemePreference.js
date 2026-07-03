import { useCallback, useEffect, useState } from "react";

export const THEMES = Object.freeze(["light", "dark", "contrast"]);

const DEFAULT_THEME = "light";
const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

/**
 * Confirma se o browser permite ler a preferencia visual do sistema.
 *
 * @function canReadSystemTheme
 * @returns {boolean} True quando `matchMedia` esta disponivel no runtime.
 */
function canReadSystemTheme() {
    return (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function"
    );
}

/**
 * Normaliza qualquer valor externo para um tema permitido pela aplicacao.
 *
 * @function normalizeTheme
 * @param {string} candidate - Valor recebido da UI ou de um teste negativo.
 * @returns {"light"|"dark"|"contrast"} Tema seguro para aplicar no DOM.
 */
export function normalizeTheme(candidate) {
    return THEMES.includes(candidate) ? candidate : DEFAULT_THEME;
}

/**
 * Calcula o tema inicial sem consultar APIs, sessoes ou dados pessoais.
 *
 * @function getInitialTheme
 * @returns {"light"|"dark"|"contrast"} Tema inicial validado.
 */
export function getInitialTheme() {
    if (canReadSystemTheme() && window.matchMedia(DARK_THEME_QUERY).matches) {
        return "dark";
    }

    return DEFAULT_THEME;
}

/**
 * Gere a preferencia visual local da Orélle.
 *
 * @function useThemePreference
 * @returns {{theme: string, themes: readonly string[], selectTheme: (theme: string) => void}}
 * Estado ativo, opcoes permitidas e acao de selecao.
 */
export function useThemePreference() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;

        // O tema fica restrito ao DOM: nao transporta sessao, role, token,
        // consentimento ou biometria.
        root.dataset.theme = theme;
        root.style.colorScheme = theme === "dark" ? "dark" : "light";
    }, [theme]);

    useEffect(() => {
        if (!canReadSystemTheme()) {
            return undefined;
        }

        const mediaQuery = window.matchMedia(DARK_THEME_QUERY);

        /**
         * Sincroniza claro/escuro com o sistema sem substituir a escolha explicita de contraste.
         *
         * @param {MediaQueryListEvent} event - Alteracao da preferencia visual do sistema.
         * @returns {void}
         */
        function handleSystemThemeChange(event) {
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
        // Valores inesperados voltam ao tema base e impedem `data-theme` arbitrario.
        setTheme(normalizeTheme(nextTheme));
    }, []);

    return { theme, themes: THEMES, selectTheme };
}
