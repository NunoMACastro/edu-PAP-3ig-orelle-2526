/**
 * Núcleo reutilizável do runtime E2E local da Orélle.
 *
 * Este módulo não importa a configuração da aplicação no top-level. Essa
 * separação é deliberada: o orquestrador instala primeiro um ambiente de teste
 * allowlist-only e só depois carrega `env.js`, impedindo que um `.env` local ou
 * credenciais herdadas sejam observados pela API.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import {
    createServer as createHttpServer,
    request as createHttpRequest,
} from "node:http";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
export const API_ROOT = path.resolve(path.dirname(SCRIPT_FILE), "..");
export const IMPLEMENTATION_ROOT = path.resolve(API_ROOT, "..");
export const WEB_ROOT = path.join(IMPLEMENTATION_ROOT, "web");
export const REPOSITORY_ROOT = path.resolve(IMPLEMENTATION_ROOT, "..");
export const E2E_DATABASE_NAME = "orelle_e2e_test";
export const LOOPBACK_HOST = "127.0.0.1";
export const DEFAULT_STARTUP_TIMEOUT_MS = 30_000;

const E2E_REPLICA_SET_NAME = "orelle-e2e-rs";
const SAFE_INHERITED_ENVIRONMENT_KEYS = Object.freeze([
    "PATH",
    "HOME",
    "USER",
    "LOGNAME",
    "SHELL",
    "TMPDIR",
    "TEMP",
    "TMP",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "TERM",
    "COLORTERM",
    "CI",
    "NO_COLOR",
    "FORCE_COLOR",
    "npm_config_cache",
]);

const E2E_USERS = Object.freeze([
    Object.freeze({
        role: "cliente",
        email: "cliente.e2e@orelle.test",
        emailEnv: "ORELLE_E2E_CLIENT_EMAIL",
        passwordEnv: "ORELLE_E2E_CLIENT_PASSWORD",
    }),
    Object.freeze({
        role: "cliente",
        email: "cliente.existente.e2e@orelle.test",
        emailEnv: "ORELLE_E2E_EXISTING_CLIENT_EMAIL",
        passwordEnv: "ORELLE_E2E_EXISTING_CLIENT_PASSWORD",
    }),
    Object.freeze({
        role: "cliente",
        email: "cliente.eliminar.e2e@orelle.test",
        emailEnv: "ORELLE_E2E_DELETE_CLIENT_EMAIL",
        passwordEnv: "ORELLE_E2E_DELETE_CLIENT_PASSWORD",
    }),
    Object.freeze({
        role: "consultor",
        email: "consultor.e2e@orelle.test",
        emailEnv: "ORELLE_E2E_CONSULTANT_EMAIL",
        passwordEnv: "ORELLE_E2E_CONSULTANT_PASSWORD",
    }),
    Object.freeze({
        role: "administrador",
        email: "admin.e2e@orelle.test",
        emailEnv: "ORELLE_E2E_ADMIN_EMAIL",
        passwordEnv: "ORELLE_E2E_ADMIN_PASSWORD",
    }),
]);

const E2E_PRODUCTS = Object.freeze([
    Object.freeze({
        name: "Gel de limpeza suave E2E",
        brandName: "Orélle Test",
        description: "Produto isolado para validar o catálogo E2E.",
        ingredientNames: ["glicerina", "pantenol"],
        inciIngredients: ["glicerina", "pantenol"],
        skinTypes: ["normal", "mista", "sensivel"],
        imageUrl: "/products/gel-de-limpeza-suave.png",
        priceCents: 1299,
        stock: 50,
        aiEligible: true,
        concernTags: [
            "acne_imperfections",
            "hydration_barrier",
            "sensitivity_redness",
        ],
        routineSteps: ["cleanse"],
    }),
    Object.freeze({
        name: "Sérum niacinamida E2E",
        brandName: "Orélle Test",
        description: "Sérum de teste para carrinho e recomendações.",
        ingredientNames: ["niacinamida", "zinco"],
        inciIngredients: ["niacinamida", "zinco"],
        skinTypes: ["oleosa", "mista"],
        imageUrl: "/products/serum-niacinamida-10-zinco-1.png",
        priceCents: 1899,
        stock: 50,
        aiEligible: true,
        concernTags: [
            "acne_imperfections",
            "oil_control",
            "spots_tone_luminosity",
        ],
        routineSteps: ["treat"],
    }),
    Object.freeze({
        name: "Protetor solar E2E",
        brandName: "Orélle Test",
        description: "Proteção solar de teste sem qualquer pagamento real.",
        ingredientNames: ["filtros uv", "vitamina e"],
        inciIngredients: ["filtros uv", "vitamina e"],
        skinTypes: ["oleosa", "seca", "mista", "normal", "sensivel"],
        imageUrl: "/products/protetor-solar-fluido-fps-50.png",
        priceCents: 2199,
        stock: 50,
        aiEligible: true,
        concernTags: ["acne_imperfections", "sun_protection"],
        routineSteps: ["protect"],
        attributes: {
            texture: "fluid",
            spf: 50,
            uvaRating: "broad_spectrum",
        },
    }),
]);

/**
 * Gera um segredo efémero marcado inequivocamente como valor de teste.
 *
 * @param {string} purpose - Prefixo funcional, nunca um segredo recebido.
 * @param {number} [entropyBytes=32] - Entropia em bytes antes da codificação hex.
 * @returns {string} Segredo aleatório que não deve ser registado em logs.
 */
function createTestSecret(purpose, entropyBytes = 32) {
    return `test-${purpose}-${randomBytes(entropyBytes).toString("hex")}`;
}

/**
 * Constrói um ambiente allowlist-only para o processo e respetivos filhos.
 *
 * Apenas variáveis operacionais não sensíveis são herdadas. Todas as variáveis
 * da aplicação, providers, MongoDB e npm tokens são descartadas, mesmo que
 * existam no shell do utilizador. Os valores funcionais são depois definidos
 * explicitamente como dados efémeros de teste.
 *
 * @param {object} [options] - Fontes injetáveis para testes unitários.
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} [options.source] - Ambiente original.
 * @param {Record<string, string|number|boolean|undefined>} [options.overrides] - Valores locais já validados.
 * @returns {NodeJS.ProcessEnv} Ambiente novo sem referências ao objeto original.
 */
export function buildScrubbedE2eEnvironment({
    source = process.env,
    overrides = {},
} = {}) {
    const environment = {};

    for (const key of SAFE_INHERITED_ENVIRONMENT_KEYS) {
        const value = source[key];
        if (typeof value === "string" && value) environment[key] = value;
    }

    Object.assign(environment, {
        DOTENV_CONFIG_PATH: "/dev/null",
        NODE_ENV: "test",
        ORELLE_E2E_ISOLATED: "true",
        OPENAI_TEST_FIXTURE_MODE: "true",
        SESSION_SECRET: createTestSecret("session"),
        DATA_ENCRYPTION_KEY: createTestSecret("data"),
        FORCE_HTTPS: "false",
        // O único proxy do E2E é o Vite local iniciado pelo orquestrador.
        // Isto permite representar clientes distintos sem desativar o limiter.
        TRUSTED_PROXY_CIDRS: "127.0.0.1/32",
        npm_config_update_notifier: "false",
        npm_config_fund: "false",
        npm_config_userconfig: "/dev/null",
    });

    for (const [key, value] of Object.entries(overrides)) {
        if (value !== undefined) environment[key] = String(value);
    }

    return environment;
}

/**
 * Substitui o ambiente do processo pelo mapa scrubbed e devolve restore.
 *
 * O runtime E2E corre num processo dedicado, mas o restore permite testar e
 * reutilizar a função sem deixar estado global contaminado.
 *
 * @param {NodeJS.ProcessEnv|Record<string, string|undefined>} nextEnvironment - Ambiente seguro.
 * @returns {() => void} Função idempotente que restaura o ambiente anterior.
 */
export function installProcessEnvironment(nextEnvironment) {
    const previousEnvironment = { ...process.env };
    let restored = false;

    for (const key of Object.keys(process.env)) delete process.env[key];
    for (const [key, value] of Object.entries(nextEnvironment)) {
        if (value !== undefined) process.env[key] = String(value);
    }

    return () => {
        if (restored) return;
        restored = true;
        for (const key of Object.keys(process.env)) delete process.env[key];
        Object.assign(process.env, previousEnvironment);
    };
}

/**
 * Valida a barreira mais importante do E2E: replica set local e base exata.
 *
 * A função rejeita SRV, credenciais, hostnames remotos, bases semelhantes e
 * URIs standalone. Assim nenhuma configuração externa pode ser promovida por
 * engano para o runtime automatizado.
 *
 * @param {string} rawUri - URI devolvida por `MongoMemoryReplSet`.
 * @returns {{uri: string, databaseName: string, replicaSet: string}} Resumo seguro.
 * @throws {Error} Quando a URI não cumpre isolamento estrito.
 */
export function assertStrictE2eMongoUri(rawUri) {
    const uri = String(rawUri ?? "").trim();

    if (!uri.startsWith("mongodb://") || uri.includes("@")) {
        throw new Error("E2E exige URI MongoDB local sem credenciais ou SRV");
    }

    let parsed;
    try {
        parsed = new URL(uri);
    } catch {
        throw new Error("URI MongoDB E2E inválida");
    }

    const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    const replicaSet = parsed.searchParams.get("replicaSet") ?? "";

    if (parsed.hostname !== LOOPBACK_HOST) {
        throw new Error("MongoDB E2E só pode escutar em 127.0.0.1");
    }
    if (!/^\d{1,5}$/.test(parsed.port)) {
        throw new Error("MongoDB E2E exige uma porta loopback efémera explícita");
    }
    if (databaseName !== E2E_DATABASE_NAME) {
        throw new Error(`MongoDB E2E deve usar exatamente ${E2E_DATABASE_NAME}`);
    }
    if (!replicaSet || replicaSet !== E2E_REPLICA_SET_NAME) {
        throw new Error("MongoDB E2E exige o replica set efémero dedicado");
    }
    if (parsed.username || parsed.password || parsed.hash) {
        throw new Error("URI MongoDB E2E contém componentes não permitidos");
    }

    return { uri, databaseName, replicaSet };
}

/**
 * Seleciona o comando Playwright publicado pelo frontend.
 *
 * @param {Record<string, string>|undefined} scripts - Scripts do package web.
 * @returns {"test:e2e"|"test:e2e:browser"} Script preferido.
 * @throws {Error} Quando o frontend ainda não publicou um comando E2E.
 */
export function selectWebE2eScript(scripts) {
    if (typeof scripts?.["test:e2e"] === "string") return "test:e2e";
    if (typeof scripts?.["test:e2e:browser"] === "string") {
        return "test:e2e:browser";
    }

    throw new Error(
        "Falta o script Playwright `test:e2e` em real_dev/web/package.json",
    );
}

/**
 * Lê o package web e confirma o contrato Playwright antes de abrir recursos.
 *
 * @returns {Promise<"test:e2e"|"test:e2e:browser">} Nome do script existente.
 */
export async function readWebE2eScript() {
    const packagePath = path.join(WEB_ROOT, "package.json");
    const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
    return selectWebE2eScript(packageJson.scripts);
}

/**
 * Reserva momentaneamente uma porta loopback atribuída pelo sistema operativo.
 *
 * A porta é libertada de imediato para o processo que a vai consumir. Todos os
 * servidores finais continuam a usar `exclusive: true` e falham se houver uma
 * corrida, em vez de escolherem silenciosamente outra porta.
 *
 * @returns {Promise<number>} Porta efémera disponível em 127.0.0.1.
 */
export async function reserveLoopbackPort() {
    const server = createNetServer();

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen({ host: LOOPBACK_HOST, port: 0, exclusive: true }, resolve);
    });

    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
    );

    if (!Number.isInteger(port) || port < 1) {
        throw new Error("Não foi possível reservar uma porta E2E loopback");
    }

    return port;
}

/**
 * Inicia um `MongoMemoryReplSet` de um nó, em loopback e com WiredTiger.
 *
 * @returns {Promise<{replSet: import("mongodb-memory-server").MongoMemoryReplSet, mongo: {uri: string, databaseName: string, replicaSet: string}}>} Runtime Mongo local.
 */
export async function startE2eReplicaSet() {
    const port = await reserveLoopbackPort();
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    const replSet = await MongoMemoryReplSet.create({
        // A porta é reservada em 127.0.0.1 antes de chegar à biblioteca. Isto
        // evita o probe genérico em 0.0.0.0 que o allocator interno faria.
        instanceOpts: [{ ip: LOOPBACK_HOST, port }],
        replSet: {
            count: 1,
            dbName: E2E_DATABASE_NAME,
            ip: LOOPBACK_HOST,
            name: E2E_REPLICA_SET_NAME,
            storageEngine: "wiredTiger",
        },
    });

    try {
        const mongo = assertStrictE2eMongoUri(
            replSet.getUri(E2E_DATABASE_NAME, LOOPBACK_HOST),
        );
        return { replSet, mongo };
    } catch (error) {
        await replSet.stop().catch(() => undefined);
        throw error;
    }
}

/**
 * Confirma que todas as imagens declaradas pelo seed existem no frontend.
 *
 * @returns {Promise<void>} Resolve apenas quando os três fallbacks estão presentes.
 */
async function assertSeedImagesExist() {
    await Promise.all(
        E2E_PRODUCTS.map((product) =>
            access(path.join(WEB_ROOT, "public", product.imageUrl)),
        ),
    );
}

/**
 * Aplica o registo canónico de migrações e cria o dataset mínimo E2E.
 *
 * A função pressupõe que o ambiente scrubbed já foi instalado. As passwords
 * são cifradas com bcrypt uma única vez e nunca entram no resumo ou nos logs.
 * As credenciais só são devolvidas num mapa destinado ao processo Playwright.
 *
 * @param {{mongoUri: string}} options - URI estritamente validada do replica set.
 * @returns {Promise<{mongoose: import("mongoose"), summary: {migrationCount: number, userCount: number, productCount: number, imageCount: number}, credentialEnvironment: Record<string, string>}>} Ligação e seed E2E.
 */
export async function prepareE2eDatabase({ mongoUri }) {
    assertStrictE2eMongoUri(mongoUri);
    await assertSeedImagesExist();

    const [
        { default: mongoose },
        { default: bcrypt },
        migrationModule,
        migrationRegistry,
    ] =
        await Promise.all([
            import("mongoose"),
            import("bcryptjs"),
            import("../src/migrations/migration-runner.js"),
            import("../src/migrations/index.js"),
        ]);

    await mongoose.connect(mongoUri);

    try {
        const migrationResults = await migrationModule.runMigrations({
            client: mongoose.connection.getClient(),
            db: mongoose.connection.db,
        });
        const appliedVersions = migrationResults.map(({ version }) => version);
        const expectedVersions = migrationRegistry.MIGRATIONS.map(
            ({ version }) => version,
        );

        if (
            appliedVersions.length !== expectedVersions.length ||
            appliedVersions.some(
                (version, index) =>
                    version !== expectedVersions[index],
            )
        ) {
            throw new Error(
                "O bootstrap E2E divergiu do registo canónico de migrações",
            );
        }

        const [
            { User },
            { Category },
            { Product },
            { Profile },
            { FaceAnalysis },
            { FaceReport },
            { ReportUnlock },
            { BiometricDataRequest },
        ] = await Promise.all([
            import("../src/models/user.model.js"),
            import("../src/models/category.model.js"),
            import("../src/models/product.model.js"),
            import("../src/models/profile.model.js"),
            import("../src/models/face-analysis.model.js"),
            import("../src/models/face-report.model.js"),
            import("../src/models/report-unlock.model.js"),
            import("../src/models/biometric-data-request.model.js"),
        ]);

        await Promise.all([
            User.init(),
            Category.init(),
            Product.init(),
            Profile.init(),
            FaceAnalysis.init(),
            FaceReport.init(),
            ReportUnlock.init(),
            BiometricDataRequest.init(),
        ]);
        // 20 bytes mantêm entropia test-only e o valor completo abaixo do
        // limite público bcrypt de 72 bytes validado pelo próprio login.
        const userPassword = createTestSecret("user-password", 20);
        const passwordHash = await bcrypt.hash(userPassword, 12);
        const users = await User.insertMany(
            E2E_USERS.map(({ email, role }) => ({
                email,
                role,
                passwordHash,
                isActive: true,
                accountStatus: "active",
            })),
        );
        const adminUser = users.find((user) => user.role === "administrador");
        const category = await Category.create({
            name: "Catálogo E2E",
            slug: "catalogo-e2e",
            description: "Categoria efémera exclusiva da bateria automatizada.",
            isActive: true,
        });
        const products = await Product.insertMany(
            E2E_PRODUCTS.map((product) => ({
                ...product,
                categoryIds: [category._id],
                createdBy: adminUser._id,
            })),
        );
        const existingClient = users.find(
            (user) => user.email === "cliente.existente.e2e@orelle.test",
        );
        await Profile.create({
            userId: existingClient._id,
            nome: "Cliente Existente E2E",
            idade: 30,
            tipoDePele: "mista",
            genero: "prefiro_nao_dizer",
            objetivos: ["hidratar"],
            allergies: [],
            avoidIngredients: [],
            lightMedicalRestrictions: [],
        });
        const analysis = await FaceAnalysis.create({
            schemaVersion: 2,
            userId: existingClient._id,
            photoIds: [
                new mongoose.Types.ObjectId(),
                new mongoose.Types.ObjectId(),
            ],
            consentId: new mongoose.Types.ObjectId(),
            providerName: "openai",
            providerVersion: "gpt-5.4-mini",
            mode: "openai",
            isDemo: false,
            findings: {
                skinType: {
                    label: "mista",
                    confidence: 0.8,
                    explanation: "Estimativa cosmética E2E.",
                },
                acne: {
                    label: "baixo",
                    confidence: 0.7,
                    explanation: "Estimativa cosmética E2E.",
                },
                manchas: {
                    label: "baixo",
                    confidence: 0.7,
                    explanation: "Estimativa cosmética E2E.",
                },
                rugas: {
                    label: "baixo",
                    confidence: 0.7,
                    explanation: "Estimativa cosmética E2E.",
                },
                oleosidade: {
                    label: "moderada",
                    confidence: 0.8,
                    explanation: "Estimativa cosmética E2E.",
                },
            },
            photoQuality: {
                status: "pass",
                warnings: [],
                profileVersion: "face-photo-quality-v1",
            },
            sources: ["fotografia_frontal", "fotografia_perfil"],
            limitations: ["Sem finalidade médica."],
            safetyFlags: [],
            provenance: {
                requestedModel: "gpt-5.4-mini",
                effectiveModel: "gpt-5.4-mini",
                requestId: "e2e-seed-openai-fixture",
                promptVersion: "cosmetic-consultation-v2",
                schemaVersion: "cosmetic-consultation-v2",
            },
            status: "completed",
        });
        const report = await FaceReport.create({
            schemaVersion: 2,
            version: 1,
            userId: existingClient._id,
            analysisId: analysis._id,
            lifecycleStatus: "unlocked",
            objectives: [
                { code: "hydration_barrier", priority: "primary" },
            ],
            analysisMode: "openai",
            analysisIsDemo: false,
            analysisProviderVersion: "gpt-5.4-mini",
            cosmeticSummary: "Resumo cosmético académico E2E.",
            routineSuggestions: [
                {
                    period: "manha",
                    title: "Rotina E2E",
                    reason: "Preservar a barreira cutânea.",
                    instructions: "Aplicar sobre a pele limpa.",
                    cautions: [],
                },
            ],
            sources: ["fotografia_frontal", "fotografia_perfil"],
            limitations: ["Sem finalidade médica."],
            photoQuality: analysis.photoQuality,
            answerSummary: "Consulta fixture sem dados identificativos.",
            machineResult: {
                observations: ["Fixture cosmética E2E."],
                answerSummary: "Consulta fixture sem dados identificativos.",
                objectivesAssessment: "Avaliação cosmética E2E.",
                routine: [
                    {
                        period: "manha",
                        title: "Rotina E2E",
                        reason: "Preservar a barreira cutânea.",
                        instructions: "Aplicar sobre a pele limpa.",
                        cautions: [],
                    },
                ],
                recommendations: [],
                limitations: ["Sem finalidade médica."],
                safetyFlags: [],
            },
            simulationSpec: {
                enabled: false,
                regions: [],
                lookDescription: null,
                preserve: [],
            },
            providerMetadata: {
                provider: "openai",
                requestedModel: "gpt-5.4-mini",
                effectiveModel: "gpt-5.4-mini",
                requestId: "e2e-seed-openai-fixture",
                promptVersion: "cosmetic-consultation-v2",
                responseSchemaVersion: "cosmetic-report-v2",
                generatedAt: new Date(),
            },
            finalRecommendationIds: [],
            contentHash: "e".repeat(64),
            frozenAt: new Date(),
            privacyStatus: "active",
        });
        await ReportUnlock.create({
            schemaVersion: 2,
            reportVersion: 1,
            userId: existingClient._id,
            analysisId: analysis._id,
            reportId: report._id,
            recommendationIds: [],
            recommendedTotalCents: 0,
            depositCents: 0,
            availableRecommendationCount: 0,
            status: "unlocked",
            simulatedPayment: {
                status: "not_required",
                amountCents: 0,
                confirmedAt: new Date(),
                reference: null,
            },
            unlockedAt: new Date(),
            frozenAt: report.frozenAt,
            contentHash: "e".repeat(64),
            zeroFeeReason: "no_available_recommendations",
        });
        const privacyFailureAt = new Date();
        await BiometricDataRequest.create({
            requesterId: existingClient._id,
            action: "delete",
            resources: ["reports"],
            status: "failed",
            reviewerId: adminUser._id,
            decisionError:
                "Falha operacional ao aplicar pedido de privacidade. Pode ser reprocessado.",
            attempts: 1,
            reviewedAt: privacyFailureAt,
            lastAttemptAt: privacyFailureAt,
        });
        const credentialEnvironment = {
            ...Object.fromEntries(
                E2E_USERS.flatMap((user) => [
                    [user.emailEnv, user.email],
                    [user.passwordEnv, userPassword],
                ]),
            ),
            // Referência efémera usada apenas para confirmar, via API com
            // ownership, que o relatório deixou fisicamente de existir.
            ORELLE_E2E_PRIVACY_REPORT_ID: report._id.toString(),
        };

        return {
            mongoose,
            summary: {
                migrationCount: migrationResults.length,
                userCount: users.length,
                productCount: products.length,
                imageCount: E2E_PRODUCTS.length,
            },
            credentialEnvironment,
        };
    } catch (error) {
        await mongoose.disconnect().catch(() => undefined);
        throw error;
    }
}

/**
 * Abre a aplicação Express numa porta atribuída pelo SO e apenas em loopback.
 *
 * @returns {Promise<{server: import("node:http").Server, origin: string, worker: {stop: () => Promise<void>}, privateFileWorker: {stop: () => Promise<void>}}>} Servidor API local e workers duráveis.
 */
export async function startE2eApiServer() {
    const [
        { createApp },
        { startAiRuntimeWorker },
        { startPrivateFileRuntimeWorker },
    ] = await Promise.all([
        import("../src/app.js"),
        import("../src/services/ai-worker-runtime.service.js"),
        import("../src/services/private-file-runtime.service.js"),
    ]);
    const server = createHttpServer(createApp());
    let worker;
    let privateFileWorker;

    try {
        await new Promise((resolve, reject) => {
            server.once("error", reject);
            server.listen(
                { host: LOOPBACK_HOST, port: 0, exclusive: true },
                resolve,
            );
        });

        worker = startAiRuntimeWorker();
        privateFileWorker = startPrivateFileRuntimeWorker();
        if (
            typeof worker?.stop !== "function" ||
            typeof privateFileWorker?.stop !== "function"
        ) {
            throw new Error("Workers E2E sem contrato de shutdown");
        }
    } catch (error) {
        await Promise.allSettled([
            worker?.stop?.(),
            privateFileWorker?.stop?.(),
        ]);
        await closeHttpServer(server).catch(() => undefined);
        throw error;
    }

    const address = server.address();
    if (!address || typeof address === "string") {
        await closeHttpServer(server);
        throw new Error("A API E2E não publicou uma porta TCP válida");
    }

    return {
        server,
        origin: `http://${LOOPBACK_HOST}:${address.port}`,
        worker,
        privateFileWorker,
    };
}

/**
 * Executa um comando finito sem shell e propaga o respetivo exit code.
 *
 * @param {object} options - Processo filho a executar.
 * @param {string} options.command - Executável resolvido por PATH.
 * @param {string[]} [options.args] - Argumentos literais, sem shell expansion.
 * @param {string} options.cwd - Diretório de trabalho explícito.
 * @param {NodeJS.ProcessEnv} options.environment - Ambiente scrubbed.
 * @param {string} options.label - Identificador público sem dados sensíveis.
 * @returns {Promise<void>} Resolve apenas com exit code zero.
 */
export async function runCommand({
    command,
    args = [],
    cwd,
    environment,
    label,
}) {
    await new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            env: environment,
            shell: false,
            stdio: "inherit",
        });

        child.once("error", reject);
        child.once("exit", (code, signal) => {
            if (code === 0) return resolve();
            reject(
                new Error(
                    `${label} falhou (${signal ? `signal ${signal}` : `exit ${code}`})`,
                ),
            );
        });
    });
}

/**
 * Espera por uma resposta HTTP local sem incluir bodies ou headers nos erros.
 *
 * @param {string} url - Endpoint de readiness loopback.
 * @param {object} [options] - Limites de espera.
 * @param {number} [options.timeoutMs] - Limite total.
 * @param {(status: number) => boolean} [options.acceptStatus] - Critério HTTP.
 * @returns {Promise<void>} Resolve quando o endpoint fica disponível.
 */
export async function waitForHttpReady(
    url,
    {
        timeoutMs = DEFAULT_STARTUP_TIMEOUT_MS,
        acceptStatus = (status) => status >= 200 && status < 500,
    } = {},
) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(url, {
                redirect: "manual",
                signal: AbortSignal.timeout(1_000),
            });
            await response.body?.cancel().catch(() => undefined);
            if (acceptStatus(response.status)) return;
        } catch {
            // O processo pode ainda estar a abrir a porta. O erro é resumido
            // apenas se o deadline terminar, evitando expor detalhes de rede.
        }
        await delay(100);
    }

    throw new Error("Timeout ao aguardar um serviço HTTP E2E local");
}

/**
 * Cria uma configuração Vite temporária que desativa totalmente `.env`.
 *
 * O wrapper reutiliza plugins e opções do projeto, fixa a raiz do frontend e
 * força `envDir: false`. Nem o conteúdo nem o path do `.env` são lidos; apenas
 * variáveis explicitamente presentes no ambiente scrubbed chegam ao Vite.
 *
 * @param {string} workingDirectory - Diretoria privada criada pelo runtime.
 * @returns {Promise<string>} Caminho absoluto da configuração efémera.
 */
export async function createIsolatedViteConfig(workingDirectory) {
    const configPath = path.join(workingDirectory, "vite.e2e.config.mjs");
    const baseConfigUrl = pathToFileURL(
        path.join(WEB_ROOT, "vite.config.js"),
    ).href;
    const source = [
        `import baseConfig from ${JSON.stringify(baseConfigUrl)};`,
        "export default async function isolatedE2eConfig(configEnvironment) {",
        "    const resolvedBase = typeof baseConfig === \"function\"",
        "        ? await baseConfig(configEnvironment)",
        "        : baseConfig;",
        "    return {",
        "        ...resolvedBase,",
        `        root: ${JSON.stringify(WEB_ROOT)},`,
        "        envDir: false,",
        "    };",
        "}",
        "",
    ].join("\n");

    await writeFile(configPath, source, { encoding: "utf8", mode: 0o600 });
    return configPath;
}

/**
 * Executa o build Vite de produção sem carregar ficheiros `.env`.
 *
 * @param {{configPath: string, environment: NodeJS.ProcessEnv}} options - Config efémera e ambiente scrubbed.
 * @returns {Promise<void>} Resolve apenas quando o build termina com exit zero.
 */
export async function runIsolatedViteBuild({ configPath, environment }) {
    const viteEntrypoint = path.join(
        WEB_ROOT,
        "node_modules",
        "vite",
        "bin",
        "vite.js",
    );
    await runCommand({
        command: process.execPath,
        args: [viteEntrypoint, "build", "--config", configPath],
        cwd: WEB_ROOT,
        environment,
        label: "Build Vite isolado",
    });
}

/**
 * Inicia `vite preview` num filho sem shell e confirma readiness HTTP.
 *
 * @param {{port: number, environment: NodeJS.ProcessEnv, configPath: string}} options - Porta, ambiente e config seguros.
 * @returns {Promise<{child: import("node:child_process").ChildProcess, origin: string}>} Processo Vite.
 */
export async function startVitePreview({ port, environment, configPath }) {
    const origin = `http://${LOOPBACK_HOST}:${port}`;
    const viteEntrypoint = path.join(
        WEB_ROOT,
        "node_modules",
        "vite",
        "bin",
        "vite.js",
    );
    const child = spawn(
        process.execPath,
        [
            viteEntrypoint,
            "preview",
            "--host",
            LOOPBACK_HOST,
            "--port",
            String(port),
            "--strictPort",
            "--config",
            configPath,
        ],
        {
            cwd: WEB_ROOT,
            env: environment,
            shell: false,
            stdio: ["ignore", "pipe", "pipe"],
        },
    );
    child.stdout?.on("data", (chunk) => process.stdout.write(`[vite] ${chunk}`));
    child.stderr?.on("data", (chunk) => process.stderr.write(`[vite] ${chunk}`));

    const exited = new Promise((resolve) => {
        child.once("error", (error) => resolve({ type: "error", error }));
        child.once("exit", (code, signal) =>
            resolve({ type: "exit", code, signal }),
        );
    });
    const ready = waitForHttpReady(origin).then(() => ({ type: "ready" }));
    try {
        const result = await Promise.race([ready, exited]);

        if (result.type !== "ready") {
            throw result.error ?? new Error(
                `Vite preview terminou antes da readiness (${result.signal ?? result.code})`,
            );
        }

        return { child, origin };
    } catch (error) {
        await stopChildProcess(child).catch(() => undefined);
        throw error;
    }
}

/**
 * Encaminha um pedido HTTP para uma origin local preservando método e stream.
 *
 * @param {import("node:http").IncomingMessage} incoming - Pedido no gateway.
 * @param {import("node:http").ServerResponse} outgoing - Resposta ao browser.
 * @param {URL} targetOrigin - API ou preview local.
 * @returns {void}
 */
function proxyRequest(incoming, outgoing, targetOrigin) {
    const target = createHttpRequest(
        {
            protocol: targetOrigin.protocol,
            hostname: targetOrigin.hostname,
            port: targetOrigin.port,
            method: incoming.method,
            path: incoming.url,
            headers: { ...incoming.headers },
        },
        (response) => {
            outgoing.writeHead(response.statusCode ?? 502, response.headers);
            response.pipe(outgoing);
        },
    );

    target.once("error", () => {
        if (!outgoing.headersSent) {
            outgoing.writeHead(502, { "content-type": "application/json" });
        }
        outgoing.end('{"error":{"code":"E2E_GATEWAY_UNAVAILABLE"}}');
    });
    incoming.once("aborted", () => target.destroy());
    incoming.pipe(target);
}

/**
 * Cria uma origem única para browser, cookies e CSRF.
 *
 * `/api` segue para Express; os restantes pedidos seguem para o Vite Preview.
 * O gateway só escuta em loopback e não cria qualquer endpoint próprio.
 *
 * @param {{apiOrigin: string, webOrigin: string, port: number}} options - Targets locais e porta reservada.
 * @returns {Promise<{server: import("node:http").Server, origin: string}>} Gateway same-origin.
 */
export async function startE2eGateway({ apiOrigin, webOrigin, port }) {
    const apiTarget = new URL(apiOrigin);
    const webTarget = new URL(webOrigin);
    const server = createHttpServer((request, response) => {
        const pathname = new URL(request.url ?? "/", "http://e2e.invalid").pathname;
        const target = pathname === "/api" || pathname.startsWith("/api/")
            ? apiTarget
            : webTarget;
        proxyRequest(request, response, target);
    });

    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(
            { host: LOOPBACK_HOST, port, exclusive: true },
            resolve,
        );
    });

    return { server, origin: `http://${LOOPBACK_HOST}:${port}` };
}

/**
 * Fecha um servidor HTTP e força apenas ligações que excederam o grace period.
 *
 * @param {import("node:http").Server|undefined} server - Servidor opcional.
 * @returns {Promise<void>} Conclusão idempotente do fecho.
 */
export async function closeHttpServer(server) {
    if (!server?.listening) return;

    const closed = new Promise((resolve) => {
        server.close(() => resolve());
    });
    const timedOut = delay(5_000, "timeout", { ref: false });
    const result = await Promise.race([closed.then(() => "closed"), timedOut]);

    if (result === "timeout") {
        server.closeAllConnections?.();
        await closed;
    }
}

/**
 * Termina um processo filho com grace period e fallback SIGKILL.
 *
 * @param {import("node:child_process").ChildProcess|undefined} child - Processo a terminar.
 * @returns {Promise<void>} Resolve quando o processo deixou de correr.
 */
export async function stopChildProcess(child) {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;

    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill("SIGTERM");
    const result = await Promise.race([
        exited.then(() => "exited"),
        delay(5_000, "timeout", { ref: false }),
    ]);

    if (result === "timeout") {
        child.kill("SIGKILL");
        await exited;
    }
}

/**
 * Cria uma diretoria privada e descartável para uploads E2E.
 *
 * @returns {Promise<string>} Diretoria que deve ser removida no teardown.
 */
export async function createE2eWorkingDirectory() {
    return mkdtemp(path.join(tmpdir(), "orelle-e2e-"));
}

/**
 * Remove a diretoria E2E sem seguir qualquer caminho recebido do utilizador.
 *
 * @param {string|undefined} directory - Caminho criado por `mkdtemp`.
 * @returns {Promise<void>} Conclusão da limpeza.
 */
export async function removeE2eWorkingDirectory(directory) {
    if (!directory) return;
    const expectedPrefix = path.join(tmpdir(), "orelle-e2e-");
    if (!path.resolve(directory).startsWith(expectedPrefix)) {
        throw new Error("Recusada limpeza fora da diretoria temporária E2E");
    }
    await rm(directory, { recursive: true, force: true });
}
