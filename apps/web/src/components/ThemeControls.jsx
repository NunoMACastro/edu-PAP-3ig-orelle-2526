import { useThemePreference } from "../hooks/useThemePreference.js";

const THEME_LABELS = Object.freeze({
    light: "Claro",
    dark: "Escuro",
    contrast: "Contraste",
});

/**
 * Controlos acessíveis para alternar o tema visual da Orélle.
 *
 * @function ThemeControls
 * @returns {JSX.Element} Grupo de botões para claro, escuro e contraste.
 */
export function ThemeControls() {
    const { theme, themes, selectTheme } = useThemePreference();

    return (
        <div className="theme-controls" aria-label="Escolher tema visual">
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
                        {/* A label textual evita depender apenas da cor do botão ativo. */}
                        <span>{THEME_LABELS[themeOption]}</span>
                    </button>
                );
            })}
        </div>
    );
}