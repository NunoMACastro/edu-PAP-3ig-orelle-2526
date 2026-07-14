import { useCallback, useEffect, useState } from "react";

export const THEMES = Object.freeze(["light", "dark", "contrast"]);

const DEFAULT_THEME = "light";
export const THEME_STORAGE_KEY = "orelle:theme";
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
 * Calcula o tema inicial sem consultar APIs, sessoes, dados pessoais ou estado do sistema.
 *
 * @function getInitialTheme
 * @returns {"light"|"dark"|"contrast"} Tema inicial validado.
 */
export function getInitialTheme() {
    try {
        return normalizeTheme(globalThis.localStorage?.getItem(THEME_STORAGE_KEY));
    } catch {
        return DEFAULT_THEME;
    }
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

        // Só a preferência visual allowlisted é persistida. Sessão, role,
        // consentimento e dados biométricos nunca passam por Web Storage.
        root.dataset.theme = theme;
        root.style.colorScheme = theme === "dark" ? "dark" : "light";
        try {
            globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // O tema continua funcional quando storage está bloqueado/indisponível.
        }
    }, [theme]);

    const selectTheme = useCallback((nextTheme) => {
        // Valores inesperados voltam ao tema base e impedem `data-theme` arbitrario.
        setTheme(normalizeTheme(nextTheme));
    }, []);

    return { theme, themes: THEMES, selectTheme };
}
