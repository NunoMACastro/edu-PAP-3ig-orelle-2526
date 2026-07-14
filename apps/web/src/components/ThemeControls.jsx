import { useThemePreference } from "../hooks/useThemePreference.js";
import { NavIcon } from "./NavIcon.jsx";

const THEME_LABELS = Object.freeze({
    light: "Claro",
    dark: "Escuro",
    contrast: "Contraste",
});

const THEME_ICONS = Object.freeze({
    light: "sun",
    dark: "moon",
    contrast: "contrast",
});

/**
 * Apresenta controlos acessiveis para alternar o tema visual da aplicacao.
 *
 * @function ThemeControls
 * @returns {JSX.Element} Grupo de botoes para tema claro, escuro e contraste.
 */
export function ThemeControls() {
    const { theme, themes, selectTheme } = useThemePreference();

    return (
        <div
            className="theme-controls"
            role="group"
            aria-label="Escolher tema visual"
        >
            {themes.map((themeOption) => {
                const isSelected = themeOption === theme;

                return (
                    <button
                        key={themeOption}
                        type="button"
                        className="theme-controls__button"
                        aria-label={`Tema ${THEME_LABELS[themeOption]}`}
                        aria-pressed={isSelected}
                        title={THEME_LABELS[themeOption]}
                        onClick={() => selectTheme(themeOption)}
                    >
                        <NavIcon name={THEME_ICONS[themeOption]} />
                        <span className="theme-controls__label">
                            {THEME_LABELS[themeOption]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
