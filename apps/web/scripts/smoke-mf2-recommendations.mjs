/**
 * Smoke check for the MF2 recommendations UI contract.
 *
 * The project does not currently include a browser/e2e runner in `real_dev/web`.
 * This script gives BK-MF2-02 an executable smoke check without adding
 * dependencies: it verifies that the production build exists, that the MF2
 * recommendations page is mounted, and that the frontend calls the canonical
 * backend endpoints used by the API integration tests.
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

function assertSmoke(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

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
        appSource.includes(contract),
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
