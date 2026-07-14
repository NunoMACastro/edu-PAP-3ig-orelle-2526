import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = path.resolve(process.cwd(), "src");

const REQUIRED_DIRECTORIES = [
    "controllers",
    "services",
    "models",
    "routes",
    "validators",
    "middlewares",
];

const LAYER_RULES = [
    {
        layer: "controllers",
        forbiddenImports: ["../models/", "../routes/"],
        reason: "controllers devem orquestrar request/response e delegar regras em services",
    },
    {
        layer: "routes",
        forbiddenImports: ["../models/", "../services/"],
        reason: "routes devem ligar middleware e controller sem conter regras de dominio",
    },
    {
        layer: "models",
        forbiddenImports: ["../controllers/", "../services/", "../routes/"],
        reason: "models representam persistencia e nao devem depender das camadas HTTP",
    },
    {
        layer: "validators",
        forbiddenImports: ["../controllers/", "../services/", "../models/"],
        reason: "validators validam input sem executar regras de negocio ou persistencia",
    },
];

const DOMAIN_CONSTANT_NAMES = new Set([
    "SKIN_TYPES",
    "GENDERS",
    "BIOMETRIC_REQUEST_ACTIONS",
    "BIOMETRIC_REQUEST_RESOURCES",
    "BIOMETRIC_REQUEST_STATUSES",
    "ORDER_STATUS",
    "PAYMENT_GATEWAYS",
    "PAYMENT_STATUS",
    "NOTIFICATION_TYPES",
    "NOTIFICATION_TYPE_VALUES",
]);

const FUNCTION_OR_CLASS_PATTERNS = [
    /export\s+async\s+function\s+([A-Za-z0-9_]+)/g,
    /export\s+function\s+([A-Za-z0-9_]+)/g,
    /export\s+class\s+([A-Za-z0-9_]+)/g,
];

const ROUTER_OR_MODEL_PATTERNS = [
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*Router\s*\(/g,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*model\s*\(/g,
];

/**
 * Lista todos os ficheiros JavaScript dentro de uma camada da API.
 *
 * @param {string} relativeDirectory - Diretoria relativa a `src`.
 * @returns {string[]} Caminhos relativos dos ficheiros `.js` encontrados.
 */
function listJavaScriptFiles(relativeDirectory) {
    const absoluteDirectory = path.join(SRC_ROOT, relativeDirectory);

    if (!existsSync(absoluteDirectory)) {
        return [];
    }

    return readdirSync(absoluteDirectory)
        .flatMap((entry) => {
            const absoluteEntry = path.join(absoluteDirectory, entry);
            const relativeEntry = path.join(relativeDirectory, entry);

            if (statSync(absoluteEntry).isDirectory()) {
                return listJavaScriptFiles(relativeEntry);
            }

            return entry.endsWith(".js") ? [relativeEntry] : [];
        })
        .sort();
}

/**
 * Le um ficheiro de `src` como texto UTF-8.
 *
 * @param {string} relativeFile - Caminho relativo a `src`.
 * @returns {string} Conteudo do ficheiro.
 */
function readSourceFile(relativeFile) {
    return readFileSync(path.join(SRC_ROOT, relativeFile), "utf8");
}

/**
 * Confirma que existe um bloco JSDoc junto de um export publico.
 *
 * @param {string} source - Codigo fonte completo.
 * @param {number} exportIndex - Indice onde comeca o `export`.
 * @returns {boolean} `true` quando o export esta documentado.
 */
function hasJsDocBeforeExport(source, exportIndex) {
    const nearbySource = source.slice(Math.max(0, exportIndex - 700), exportIndex);

    return /\/\*\*[\s\S]*?\*\/\s*$/.test(nearbySource);
}

/**
 * Confirma se o ficheiro tem JSDoc de modulo no topo.
 *
 * @param {string} source - Codigo fonte completo.
 * @returns {boolean} `true` quando o ficheiro comeca com documentacao tecnica.
 */
function hasFileLevelJsDoc(source) {
    return /^\s*\/\*\*[\s\S]*?\*\//.test(source);
}

/**
 * Deteta constantes de dominio que ainda estao publicadas a partir de models.
 *
 * @returns {{ file: string, constantName: string, reason: string }[]} Violacoes encontradas.
 */
function collectModelConstantExports() {
    return listJavaScriptFiles("models").flatMap((relativeFile) => {
        const source = readSourceFile(relativeFile);

        return [...DOMAIN_CONSTANT_NAMES]
            .filter((constantName) => {
                const exportPattern = new RegExp(`export\\s+const\\s+${constantName}\\b`);
                return exportPattern.test(source);
            })
            .map((constantName) => ({
                file: relativeFile,
                constantName,
                reason: "constantes de dominio partilhadas pertencem a constants/domain.constants.js",
            }));
    });
}

/**
 * Deteta imports de constantes de dominio a partir de models.
 *
 * @returns {{ file: string, constantName: string, from: string, reason: string }[]} Violacoes encontradas.
 */
function collectModelConstantImports() {
    const filesToInspect = [
        ...listJavaScriptFiles("models"),
        ...listJavaScriptFiles("validators"),
        ...listJavaScriptFiles("services"),
        ...listJavaScriptFiles("providers"),
    ];

    return filesToInspect.flatMap((relativeFile) => {
        const source = readSourceFile(relativeFile);
        const violations = [];
        const importPathPattern = String.raw`([^"']*model\.js)`;
        const importPattern = new RegExp(
            String.raw`import\s*\{([^}]+)\}\s*from\s*["']` +
                importPathPattern +
                String.raw`["'];?`,
            "g",
        );

        for (const match of source.matchAll(importPattern)) {
            const importedNames = match[1]
                .split(",")
                .map((name) => name.trim().split(/\s+as\s+/)[0])
                .filter(Boolean);

            for (const constantName of importedNames) {
                if (DOMAIN_CONSTANT_NAMES.has(constantName)) {
                    violations.push({
                        file: relativeFile,
                        constantName,
                        from: match[2],
                        reason: "constantes de dominio devem vir de constants/domain.constants.js",
                    });
                }
            }
        }

        return violations;
    });
}

/**
 * Recolhe funcoes, classes, routers e models publicos que precisam de documentacao.
 *
 * @param {string} relativeFile - Caminho relativo a `src`.
 * @returns {{ file: string, name: string, documented: boolean }[]} Unidades publicas encontradas.
 */
function collectPublicUnits(relativeFile) {
    const source = readSourceFile(relativeFile);
    const units = [];

    for (const pattern of FUNCTION_OR_CLASS_PATTERNS) {
        pattern.lastIndex = 0;

        for (const match of source.matchAll(pattern)) {
            units.push({
                file: relativeFile,
                name: match[1],
                documented: hasJsDocBeforeExport(source, match.index),
            });
        }
    }

    for (const pattern of ROUTER_OR_MODEL_PATTERNS) {
        pattern.lastIndex = 0;

        for (const match of source.matchAll(pattern)) {
            units.push({
                file: relativeFile,
                name: match[1],
                documented:
                    hasJsDocBeforeExport(source, match.index) ||
                    hasFileLevelJsDoc(source),
            });
        }
    }

    return units;
}

describe("BK-MF8-01 modularidade MVC e JSDoc", () => {
    it("mantem as diretorias tecnicas esperadas para RNF19", () => {
        const missingDirectories = REQUIRED_DIRECTORIES.filter((directory) => {
            return !existsSync(path.join(SRC_ROOT, directory));
        });

        expect(missingDirectories).toEqual([]);
    });

    it("mantem app.js como ponto de composicao da API", () => {
        const appSource = readSourceFile("app.js");

        // O bootstrap compõe middlewares e rotas, sem esconder regras de dominio.
        expect(appSource).toContain("createApp");
        expect(appSource).toContain("app.use");
        expect(appSource).toMatch(/routes?/i);
        expect(appSource).toContain("errorMiddleware");
    });

    it("mantem fronteiras entre routes, controllers, services, validators e models", () => {
        const violations = LAYER_RULES.flatMap(({ layer, forbiddenImports, reason }) => {
            return listJavaScriptFiles(layer).flatMap((relativeFile) => {
                const source = readSourceFile(relativeFile);

                // Cada regra impede saltos diretos de camada que tornam a manutencao insegura.
                return forbiddenImports
                    .filter((forbiddenImport) => source.includes(forbiddenImport))
                    .map((forbiddenImport) => ({
                        file: relativeFile,
                        forbiddenImport,
                        reason,
                    }));
            });
        });

        expect(violations).toEqual([]);
    });

    it("mantem constantes de dominio fora dos models", () => {
        expect([
            ...collectModelConstantExports(),
            ...collectModelConstantImports(),
        ]).toEqual([]);
    });

    it("documenta unidades publicas criticas com JSDoc ou documentacao de modulo", () => {
        const filesToInspect = [
            ...listJavaScriptFiles("controllers"),
            ...listJavaScriptFiles("services"),
            ...listJavaScriptFiles("models"),
            ...listJavaScriptFiles("routes"),
            ...listJavaScriptFiles("validators"),
            ...listJavaScriptFiles("middlewares"),
        ];

        const undocumentedUnits = filesToInspect
            .flatMap((relativeFile) => collectPublicUnits(relativeFile))
            .filter((unit) => !unit.documented);

        expect(undocumentedUnits).toEqual([]);
    });
});
