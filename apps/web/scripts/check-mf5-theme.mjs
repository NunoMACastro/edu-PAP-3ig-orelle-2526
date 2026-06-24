import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..");

/**
 * Le um ficheiro do frontend a partir da raiz `real_dev/web`.
 *
 * @param {string} relativePath - Caminho relativo a `real_dev/web`.
 * @returns {Promise<string>} Conteudo UTF-8 do ficheiro.
 */
async function readWebFile(relativePath) {
    return readFile(resolve(webRoot, relativePath), "utf8");
}

/**
 * Falha o smoke com uma mensagem curta e rastreavel.
 *
 * @param {boolean} condition - Resultado esperado.
 * @param {string} message - Erro a apresentar quando a condicao falha.
 * @returns {void}
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

const [app, styles, controls, hook] = await Promise.all([
    readWebFile("src/App.jsx"),
    readWebFile("src/styles.css"),
    readWebFile("src/components/ThemeControls.jsx"),
    readWebFile("src/hooks/useThemePreference.js"),
]);

const { normalizeTheme, THEMES } = await import(
    pathToFileURL(resolve(webRoot, "src/hooks/useThemePreference.js")).href
);

assert(THEMES.includes("light"), "THEMES deve incluir light.");
assert(THEMES.includes("dark"), "THEMES deve incluir dark.");
assert(THEMES.includes("contrast"), "THEMES deve incluir contrast.");
assert(
    normalizeTheme("danger") === "light",
    "Tema invalido deve normalizar para light.",
);
assert(
    normalizeTheme("contrast") === "contrast",
    "Tema contrast deve ser aceite explicitamente.",
);
assert(
    hook.includes("root.dataset.theme = theme"),
    "useThemePreference deve aplicar data-theme no elemento raiz.",
);
assert(
    hook.includes("root.style.colorScheme"),
    "useThemePreference deve sincronizar colorScheme.",
);
assert(
    !hook.includes("localStorage") && !hook.includes("sessionStorage"),
    "Preferencia visual nao deve usar localStorage/sessionStorage.",
);
assert(
    controls.includes('role="group"') && controls.includes("aria-pressed"),
    "ThemeControls deve expor grupo acessivel e aria-pressed.",
);
assert(
    app.includes("ThemeControls") && app.includes("app-header__actions"),
    "App deve integrar ThemeControls no header.",
);
assert(
    styles.includes(':root[data-theme="dark"]') &&
        styles.includes(':root[data-theme="contrast"]'),
    "styles.css deve definir tokens para dark e contrast.",
);
assert(
    styles.includes(".theme-controls__button[aria-pressed=\"true\"]"),
    "CSS deve estilizar o botao de tema ativo por aria-pressed.",
);

console.log(
    "MF5 theme smoke passed: light/dark/contrast, aria-pressed e negativo invalido validados.",
);
