/**
 * Smoke check do contrato de UI das recomendações da MF2.
 *
 * O projeto ainda não inclui um runner browser/e2e em `real_dev/web`. Este
 * script dá ao BK-MF2-02 uma verificação executável sem acrescentar
 * dependências: confirma que o build de produção existe, que a página de
 * recomendações MF2 está montada e que o frontend chama os endpoints canónicos
 * usados pelos testes de integração da API.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

const files = {
    app: path.join(projectRoot, "src", "App.jsx"),
    recommendationsPage: path.join(
        projectRoot,
        "src",
        "pages",
        "ProductRecommendationsPage.jsx",
    ),
    makeupSimulationPage: path.join(
        projectRoot,
        "src",
        "pages",
        "MakeupSimulationPage.jsx",
    ),
    beforeAfterPage: path.join(
        projectRoot,
        "src",
        "pages",
        "BeforeAfterVisualizationPage.jsx",
    ),
    distIndex: path.join(projectRoot, "dist", "index.html"),
};

/**
 * Falha explicitamente quando um contrato esperado não está presente.
 *
 * @function assertSmoke
 * @param {boolean} condition - Condição que deve ser verdadeira.
 * @param {string} message - Mensagem de erro usada quando a condição falha.
 * @returns {void}
 */
function assertSmoke(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

/**
 * Normaliza whitespace para validar JSX independentemente da formatação.
 *
 * @function compactWhitespace
 * @param {string} source - Código fonte a verificar.
 * @returns {string} Fonte numa só linha lógica.
 */
function compactWhitespace(source) {
    return source.replace(/\s+/g, " ").trim();
}

/**
 * Lê um ficheiro obrigatório depois de confirmar que ele existe.
 *
 * @async
 * @function readRequiredFile
 * @param {string} filePath - Caminho absoluto do ficheiro esperado.
 * @returns {Promise<string>} Conteúdo UTF-8 do ficheiro.
 */
async function readRequiredFile(filePath) {
    assertSmoke(existsSync(filePath), `Missing required file: ${filePath}`);
    return readFile(filePath, "utf8");
}

const [
    appSource,
    recommendationsSource,
    makeupSimulationSource,
    beforeAfterSource,
    distIndex,
] = await Promise.all([
    readRequiredFile(files.app),
    readRequiredFile(files.recommendationsPage),
    readRequiredFile(files.makeupSimulationPage),
    readRequiredFile(files.beforeAfterPage),
    readRequiredFile(files.distIndex),
]);
const compactAppSource = compactWhitespace(appSource);

const requiredAppContracts = [
    "ProductRecommendationsPage",
    "<ProductRecommendationsPage onRecommendationsChange={setRecommendations} />",
    "<ConsultantRecommendationReviewPage recommendations={recommendations} />",
    "<MakeupSimulationPage onSimulationCreated={setLatestMakeupSimulation} />",
    "<BeforeAfterVisualizationPage simulation={latestMakeupSimulation} />",
    "DailyRoutinePage",
];

const requiredRecommendationContracts = [
    'apiRequest("/recommendations/generate"',
    'apiRequest("/recommendations")',
    "`/recommendations/${recommendationId}/feedback`",
    'JSON.stringify({ value: feedback })',
    'submitFeedback(recommendation.id, "util")',
    'submitFeedback(recommendation.id, "nao_relevante")',
    "recommendation.explanation",
    "recommendation.reasonCodes.join",
];

const requiredVisualContracts = [
    {
        source: makeupSimulationSource,
        label: "Makeup simulation UI",
        contracts: [
            "simulation.preview.visual?.beforeImageUrl",
            "simulation.preview.visual?.afterImageUrl",
            "simulation.preview.visual.altText",
        ],
    },
    {
        source: beforeAfterSource,
        label: "Before/after UI",
        contracts: [
            "visualization.visualComparison?.beforeImageUrl",
            "visualization.visualComparison?.afterImageUrl",
            "visualization.visualComparison.altText",
        ],
    },
];

const requiredBuildContracts = [
    '<div id="root"></div>',
    'type="module"',
    "/assets/",
];

for (const contract of requiredAppContracts) {
    assertSmoke(
        compactAppSource.includes(contract),
        `App contract missing for MF2 recommendations smoke: ${contract}`,
    );
}

for (const contract of requiredRecommendationContracts) {
    assertSmoke(
        recommendationsSource.includes(contract),
        `Recommendations UI contract missing: ${contract}`,
    );
}

for (const group of requiredVisualContracts) {
    for (const contract of group.contracts) {
        assertSmoke(
            group.source.includes(contract),
            `${group.label} visual contract missing: ${contract}`,
        );
    }
}

for (const contract of requiredBuildContracts) {
    assertSmoke(
        distIndex.includes(contract),
        `Production build contract missing: ${contract}`,
    );
}

console.log(
    "MF2 recommendations smoke passed: build, mounting and API contracts are present.",
);
