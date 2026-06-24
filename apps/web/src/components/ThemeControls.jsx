import { useThemePreference } from "../hooks/useThemePreference.js";

const THEME_LABELS = Object.freeze({
    light: "Claro",
    dark: "Escuro",
    contrast: "Contraste",
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
                        aria-pressed={isSelected}
                        onClick={() => selectTheme(themeOption)}
                    >
                        {/* A label textual evita que o estado dependa apenas da cor. */}
                        <span>{THEME_LABELS[themeOption]}</span>
                    </button>
                );
            })}
        </div>
    );
}
