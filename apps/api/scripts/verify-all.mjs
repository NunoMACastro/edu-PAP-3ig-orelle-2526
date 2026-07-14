/**
 * Gate local integral da implementação Orélle.
 *
 * O comando compõe verificações já publicadas pelos packages e falha cedo com
 * uma lista explícita quando uma categoria ainda não tem script. Não depende
 * de GitHub Actions, Docker, `.env` ou serviços remotos, pelo que pode ser
 * reutilizado mais tarde por qualquer CI sem alterar o contrato local.
 */
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
    API_ROOT,
    REPOSITORY_ROOT,
    WEB_ROOT,
    buildScrubbedE2eEnvironment,
    createE2eWorkingDirectory,
    createIsolatedViteConfig,
    removeE2eWorkingDirectory,
    runCommand,
    runIsolatedViteBuild,
    selectWebE2eScript,
} from "./e2e-runtime.core.mjs";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const PLANIFICATION_VALIDATOR = path.join(
    REPOSITORY_ROOT,
    "scripts",
    "validate-planificacao.sh",
);
const API_TEST_CATEGORIES = Object.freeze([
    "test:unit",
    "test:contracts",
    "test:integration",
]);
const REQUIRED_WEB_SCRIPTS = Object.freeze([
    "lint",
    "test:unit",
    "test:contracts",
    "build",
    "check:g6-image-budgets",
    "smoke:mf6-page-budget",
]);

/**
 * Lê JSON de package sem executar lifecycle scripts ou carregar dotenv.
 *
 * @param {string} packageRoot - Diretório absoluto do package.
 * @returns {Promise<object>} Manifest parseado.
 */
async function readPackageJson(packageRoot) {
    return JSON.parse(
        await readFile(path.join(packageRoot, "package.json"), "utf8"),
    );
}

/**
 * Enumera ficheiros de teste de browser sem seguir symlinks/dependências.
 *
 * @param {string} directory - Diretório opcional `e2e` ou `tests`.
 * @returns {Promise<string[]>} Sources existentes e ordenados.
 */
async function collectBrowserTestSources(directory) {
    const files = [];

    async function walk(currentDirectory) {
        let entries;
        try {
            entries = await readdir(currentDirectory, { withFileTypes: true });
        } catch (error) {
            if (error?.code === "ENOENT") return;
            throw error;
        }

        for (const entry of entries) {
            const entryPath = path.join(currentDirectory, entry.name);
            if (entry.isDirectory()) {
                if (!["node_modules", "dist", "test-results"].includes(entry.name)) {
                    await walk(entryPath);
                }
            } else if (
                entry.isFile() &&
                /\.(?:[cm]?[jt]sx?)$/.test(entry.name)
            ) {
                files.push(entryPath);
            }
        }
    }

    await walk(directory);
    return files.sort((left, right) => left.localeCompare(right));
}

/**
 * Confirma que acessibilidade é uma asserção real da suite Playwright.
 *
 * A mera presença da dependência não basta: pelo menos um source deve importar
 * `@axe-core/playwright` e construir/executar uma análise Axe.
 *
 * @param {object} webPackage - Manifest frontend.
 * @returns {Promise<{source: string}>} Source relativo que fornece evidência.
 */
async function assertIntegratedAccessibilityGate(webPackage) {
    const dependencies = {
        ...webPackage.dependencies,
        ...webPackage.devDependencies,
    };
    if (!dependencies["@axe-core/playwright"]) {
        throw new Error(
            "Gate accessibility ausente: falta @axe-core/playwright no package web",
        );
    }

    const sources = (
        await Promise.all([
            collectBrowserTestSources(path.join(WEB_ROOT, "e2e")),
            collectBrowserTestSources(path.join(WEB_ROOT, "tests")),
        ])
    ).flat();

    for (const source of sources) {
        const contents = await readFile(source, "utf8");
        if (
            contents.includes("@axe-core/playwright") &&
            /(?:AxeBuilder|\.analyze\s*\()/.test(contents)
        ) {
            return { source: path.relative(WEB_ROOT, source) };
        }
    }

    throw new Error(
        "Gate accessibility ausente: nenhum teste Playwright executa Axe",
    );
}

/**
 * Resolve os gates API sem executar a suite completa três vezes.
 *
 * Packages antigos podem publicar apenas `test`; nesse caso esse comando é
 * aceite como gate combinado porque a suite atual contém unit, contracts e
 * integrações. Uma publicação parcial dos três scripts especializados falha,
 * pois tornaria a cobertura ambígua.
 *
 * @param {Record<string, string>|undefined} scripts - Scripts da API.
 * @returns {{mode: "split"|"combined", scripts: string[]}} Plano de testes.
 */
export function resolveApiTestGate(scripts) {
    const specialized = API_TEST_CATEGORIES.filter(
        (name) => typeof scripts?.[name] === "string",
    );

    if (specialized.length === API_TEST_CATEGORIES.length) {
        return { mode: "split", scripts: [...API_TEST_CATEGORIES] };
    }
    if (specialized.length === 0 && typeof scripts?.test === "string") {
        return { mode: "combined", scripts: ["test"] };
    }

    const missing = API_TEST_CATEGORIES.filter(
        (name) => typeof scripts?.[name] !== "string",
    );
    throw new Error(
        `Gate API incompleto: faltam scripts ${missing.join(", ")}`,
    );
}

/**
 * Enumera todos os smokes publicados para impedir gates órfãos fora do
 * agregador integral.
 *
 * @param {Record<string, string>|undefined} scripts - Scripts do frontend.
 * @returns {string[]} Nomes `smoke:*` ordenados e sem executar comandos.
 */
export function listPublishedWebSmokeScripts(scripts) {
    return Object.keys(scripts ?? {})
        .filter((name) => name.startsWith("smoke:"))
        .sort((left, right) => left.localeCompare(right));
}

/**
 * Cria o ambiente seguro dos gates gerais sem ativar o transport E2E.
 *
 * `buildScrubbedE2eEnvironment` continua a fornecer segredos efémeros e a
 * remover credenciais herdadas, mas a fixture OpenAI pertence exclusivamente
 * ao processo `run-e2e` iniciado mais tarde.
 *
 * @returns {NodeJS.ProcessEnv} Ambiente isolado para syntax/testes/build.
 */
export function buildVerificationTestEnvironment() {
    return buildScrubbedE2eEnvironment({
        overrides: {
            ORELLE_E2E_ISOLATED: "false",
            OPENAI_TEST_FIXTURE_MODE: "false",
        },
    });
}

/**
 * Valida todos os comandos antes de iniciar uma bateria potencialmente longa.
 *
 * @returns {Promise<{apiTestGate: {mode: string, scripts: string[]}, webE2eScript: string, webSmokeScripts: string[], accessibilitySource: string}>} Plano executável.
 */
export async function resolveVerificationPlan() {
    const [apiPackage, webPackage] = await Promise.all([
        readPackageJson(API_ROOT),
        readPackageJson(WEB_ROOT),
    ]);
    const missingWebScripts = REQUIRED_WEB_SCRIPTS.filter(
        (name) => typeof webPackage.scripts?.[name] !== "string",
    );

    if (missingWebScripts.length > 0) {
        throw new Error(
            `Gate web incompleto: faltam scripts ${missingWebScripts.join(", ")}`,
        );
    }

    const webE2eScript = selectWebE2eScript(webPackage.scripts);
    const webSmokeScripts = listPublishedWebSmokeScripts(webPackage.scripts);
    const apiTestGate = resolveApiTestGate(apiPackage.scripts);
    const accessibility = await assertIntegratedAccessibilityGate(webPackage);
    await access(PLANIFICATION_VALIDATOR).catch(() => {
        throw new Error(
            "Gate planificação ausente: scripts/validate-planificacao.sh não existe",
        );
    });

    return {
        apiTestGate,
        webE2eScript,
        webSmokeScripts,
        accessibilitySource: accessibility.source,
    };
}

/**
 * Executa um passo, mede duração e imprime apenas metadados públicos.
 *
 * @param {string} label - Nome estável do gate.
 * @param {() => Promise<void>} operation - Operação sem secrets no output.
 * @returns {Promise<{label: string, durationMs: number}>} Evidência temporal.
 */
async function runStep(label, operation) {
    const startedAt = Date.now();
    console.log(`[verify:${label}] START`);
    await operation();
    const durationMs = Date.now() - startedAt;
    console.log(`[verify:${label}] PASS (${durationMs} ms)`);
    return { label, durationMs };
}

/**
 * Faz build de produção com `envDir: false` e remove a config temporária.
 *
 * @param {NodeJS.ProcessEnv} environment - Ambiente allowlist-only do build.
 * @returns {Promise<void>} Conclusão do build e da limpeza local.
 */
async function runVerificationBuild(environment) {
    const workingDirectory = await createE2eWorkingDirectory();

    try {
        const configPath = await createIsolatedViteConfig(workingDirectory);
        await runIsolatedViteBuild({ configPath, environment });
    } finally {
        await removeE2eWorkingDirectory(workingDirectory);
    }
}

/**
 * Executa syntax, lint, testes, build, browsers, budgets, audits e docs.
 *
 * @returns {Promise<{status: "passed", gates: {label: string, durationMs: number}[], apiTestMode: string, accessibilitySource: string}>} Resumo sem dados sensíveis.
 */
export async function verifyAll() {
    const plan = await resolveVerificationPlan();
    // A suite API combinada mantém fixtures unitárias sem MongoDB. Apenas o
    // processo `run-e2e` volta a ativar isolamento persistente e replica set.
    const testEnvironment = buildVerificationTestEnvironment();
    const buildEnvironment = {
        ...testEnvironment,
        NODE_ENV: "production",
        VITE_API_PROXY_TARGET: "http://127.0.0.1:3001",
    };
    const gates = [];
    const execute = async (label, operation) => {
        gates.push(await runStep(label, operation));
    };
    const npmScript = (root, script, environment = testEnvironment) =>
        runCommand({
            command: "npm",
            args: ["run", script],
            cwd: root,
            environment,
            label: `${path.basename(root)}:${script}`,
        });

    await execute("syntax", () =>
        runCommand({
            command: process.execPath,
            args: [path.join(API_ROOT, "scripts", "check-syntax.mjs")],
            cwd: API_ROOT,
            environment: testEnvironment,
            label: "Syntax",
        }),
    );
    await execute("lint", () => npmScript(WEB_ROOT, "lint"));

    for (const script of plan.apiTestGate.scripts) {
        await execute(`api-${script.replace(":", "-")}`, () =>
            npmScript(API_ROOT, script),
        );
    }
    await execute("web-unit", () => npmScript(WEB_ROOT, "test:unit"));
    await execute("contracts", () => npmScript(WEB_ROOT, "test:contracts"));
    await execute("build", () => runVerificationBuild(buildEnvironment));
    for (const smokeScript of plan.webSmokeScripts) {
        if (smokeScript === "smoke:mf6-page-budget") continue;

        await execute(`web-${smokeScript.replaceAll(":", "-")}`, () =>
            npmScript(WEB_ROOT, smokeScript, buildEnvironment),
        );
    }
    await execute("e2e", () =>
        runCommand({
            command: process.execPath,
            args: [path.join(API_ROOT, "scripts", "run-e2e.mjs")],
            cwd: API_ROOT,
            environment: {
                ...testEnvironment,
                ORELLE_E2E_SKIP_WEB_BUILD: "true",
            },
            label: `E2E integrado (${plan.webE2eScript})`,
        }),
    );
    await execute("accessibility", async () => {
        // O teste Axe corre dentro do passo E2E anterior, na mesma infraestrutura
        // e nos browsers configurados. Este passo explicita a evidência source.
        if (!plan.accessibilitySource) {
            throw new Error("Source Axe deixou de estar disponível");
        }
    });
    await execute("performance-images", () =>
        npmScript(WEB_ROOT, "check:g6-image-budgets", buildEnvironment),
    );
    await execute("performance-page", () =>
        npmScript(WEB_ROOT, "smoke:mf6-page-budget", buildEnvironment),
    );
    await execute("audit-api", () =>
        runCommand({
            command: "npm",
            args: ["audit", "--audit-level=high"],
            cwd: API_ROOT,
            environment: testEnvironment,
            label: "npm audit API",
        }),
    );
    await execute("audit-web", () =>
        runCommand({
            command: "npm",
            args: ["audit", "--audit-level=high"],
            cwd: WEB_ROOT,
            environment: testEnvironment,
            label: "npm audit web",
        }),
    );
    await execute("planificacao", () =>
        runCommand({
            command: "bash",
            args: [PLANIFICATION_VALIDATOR],
            cwd: REPOSITORY_ROOT,
            environment: testEnvironment,
            label: "Validação da planificação",
        }),
    );

    return {
        status: "passed",
        gates,
        apiTestMode: plan.apiTestGate.mode,
        accessibilitySource: plan.accessibilitySource,
    };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) {
    verifyAll()
        .then((summary) => {
            console.log(
                `verify-all OK: ${summary.gates.length} gates; API ${summary.apiTestMode}; Axe ${summary.accessibilitySource}`,
            );
        })
        .catch((error) => {
            console.error(`verify-all falhou: ${error.message}`);
            process.exitCode = 1;
        });
}
