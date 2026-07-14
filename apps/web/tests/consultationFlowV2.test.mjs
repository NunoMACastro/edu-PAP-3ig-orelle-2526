/** Contratos puros e estáticos do fluxo canónico de consulta v2. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
    CONSULTATION_GOAL_CODES,
    getConsultationPollDelay,
    getCurrentQuestion,
    getSessionDestination,
    normalizeGoalsPayload,
    normalizeQuestion,
    normalizeSession,
    shouldPollConsultation,
    toCanonicalQuestionValue,
    toQuestionDisplayValue,
    unwrapApiEnvelope,
} from "../src/features/consultation/consultationModel.js";
import {
    MAX_PHOTO_BYTES,
    MIN_PHOTO_SIDE,
    validatePhotoMetadata,
    validatePhotoSignals,
} from "../src/features/consultation/photoPreflight.js";
import {
    assessFaceLandmarkerResult,
    inspectFaceWithMediaPipe,
} from "../src/features/consultation/mediapipeFacePreflight.js";
import {
    createPaymentIdempotencyKey,
    normalizeReport,
} from "../src/features/consultation/consultationApi.js";
import {
    getPublicPhotoWarnings,
    hasMatchingFaceAnalysisConsent,
} from "../src/features/consultation/consultationPresentation.js";

/** Cria landmarks sintéticos suficientes para testar geometria sem WASM. */
function createFaceLandmarks({
    centerX = 0.5,
    centerY = 0.48,
    width = 0.6,
    height = 0.6,
    absoluteYawDegrees = 0,
} = {}) {
    const landmarks = Array.from({ length: 264 }, () => ({
        x: centerX,
        y: centerY,
        z: 0,
    }));
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const eyeHalfDistance = Math.min(0.15, width / 3);
    const leftEyeX = centerX - eyeHalfDistance;
    const rightEyeX = centerX + eyeHalfDistance;
    const ratio = 1 - absoluteYawDegrees / 90;
    const smallerEyeDistance = (eyeHalfDistance * 2 * ratio) / (1 + ratio);

    landmarks[10] = { x: centerX, y: centerY - halfHeight, z: 0 };
    landmarks[152] = { x: centerX, y: centerY + halfHeight, z: 0 };
    landmarks[200] = { x: centerX - halfWidth, y: centerY, z: 0 };
    landmarks[201] = { x: centerX + halfWidth, y: centerY, z: 0 };
    landmarks[33] = { x: leftEyeX, y: centerY - 0.05, z: 0 };
    landmarks[263] = { x: rightEyeX, y: centerY - 0.05, z: 0 };
    landmarks[1] = {
        x: leftEyeX + smallerEyeDistance,
        y: centerY,
        z: 0,
    };
    return landmarks;
}

function createFaceResult(options) {
    return { faceLandmarks: [createFaceLandmarks(options)] };
}

const [appSource, apiSource, activeSource, reportSource, newSource, historySource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(
        new URL(
            "../src/features/consultation/consultationApi.js",
            import.meta.url,
        ),
        "utf8",
    ),
    readFile(
        new URL(
            "../src/features/consultation/ActiveConsultationPage.jsx",
            import.meta.url,
        ),
        "utf8",
    ),
    readFile(
        new URL(
            "../src/features/consultation/ConsultationReportPage.jsx",
            import.meta.url,
        ),
        "utf8",
    ),
    readFile(
        new URL(
            "../src/features/consultation/NewConsultationPage.jsx",
            import.meta.url,
        ),
        "utf8",
    ),
    readFile(
        new URL(
            "../src/features/consultation/ConsultationHistoryPage.jsx",
            import.meta.url,
        ),
        "utf8",
    ),
]);

test("normaliza envelopes e preserva os sete objetivos canónicos", () => {
    assert.deepEqual(unwrapApiEnvelope({ data: { result: { ok: true } } }), {
        ok: true,
    });
    const catalog = normalizeGoalsPayload({
        data: {
            goals: [
                {
                    code: "makeup",
                    label: "Maquilhagem do servidor",
                    description: "Descrição versionada",
                },
            ],
        },
    });

    assert.deepEqual(
        catalog.goals.map((goal) => goal.code),
        CONSULTATION_GOAL_CODES,
    );
    assert.equal(catalog.goals.at(-1).label, "Maquilhagem do servidor");
    assert.equal(catalog.selection.secondaryMax, 2);
    assert.deepEqual(catalog.questions, { min: 10, max: 17 });
});

test("GET do relatório preserva totals, sources, voucher e último job", () => {
    const report = normalizeReport({
        report: {
            id: "report-public",
            locked: false,
            sources: ["fotografia_frontal", "fotografia_perfil"],
            access: {
                recommendationCount: 4,
                availableRecommendationCount: 3,
                recommendedTotalCents: 8_000,
                depositCents: 800,
            },
            voucher: { code: "VOUCHER-PUBLIC", amountCents: 800 },
            makeupSimulation: {
                id: "simulation-public",
                status: "processing",
            },
        },
    });

    assert.deepEqual(report.sources, [
        "fotografia_frontal",
        "fotografia_perfil",
    ]);
    assert.equal(report.access.availableRecommendationCount, 3);
    assert.equal(report.voucher.amountCents, 800);
    assert.equal(report.makeupSimulation.status, "processing");
});

test("sessão tolera DTO aninhado, cinco tipos e navegação pelo estado remoto", () => {
    const session = normalizeSession({
        data: {
            session: {
                id: "session-public",
                flowState: "asking_questions",
                conversation: {
                    currentQuestion: {
                        id: "budget",
                        revision: 4,
                        label: "Orçamento?",
                        type: "number",
                        min: 0,
                        max: 100,
                    },
                },
            },
        },
    });

    assert.equal(getCurrentQuestion(session).type, "number");
    assert.equal(getCurrentQuestion(session).revision, 4);
    assert.equal(getSessionDestination(session), "/consulta/ativa");
    assert.equal(
        getSessionDestination({ flowState: "draft_ready", reportId: "report-1" }),
        "/consulta/relatorios/report-1",
    );
    assert.equal(
        getSessionDestination({
            flowState: "needs_clarification",
            reportId: "report-1",
        }),
        "/consulta/ativa",
    );
    assert.equal(
        getSessionDestination({ flowState: "collecting_goal" }),
        "/consulta/nova",
    );
    assert.equal(
        getSessionDestination({ flowState: "collecting_photos" }),
        "/consulta/nova",
    );
});

test("opções legacy não refletem inglês e orçamento converte euros em cêntimos", () => {
    const legacy = normalizeQuestion({
        id: "legacy-context",
        type: "single_select",
        label: "Contexto",
        options: ["daily", "work_school"],
    });
    assert.deepEqual(
        legacy.options.map(({ label }) => label),
        ["Opção 1", "Opção 2"],
    );
    const budget = normalizeQuestion({
        id: "budget",
        type: "number",
        min: 0,
        max: 100_000,
        presentation: { control: "currency", scale: 100 },
    });
    assert.equal(toQuestionDisplayValue(budget, 5000), 50);
    assert.equal(toCanonicalQuestionValue(budget, "50.25"), 5025);
});

test("normaliza avisos externos e valida consentimento exato sem refletir texto livre", () => {
    const warnings = getPublicPhotoWarnings({
        status: "warning",
        warnings: [
            "Only one usable frontal-view image appears to be provided",
            "Lighting is somewhat uneven",
            "provider-secret-unmapped-reason",
        ],
    });

    assert.deepEqual(warnings, [
        "Confirma que a fotografia de perfil mostra claramente o rosto de lado.",
        "Procura luz frontal uniforme, sem sombras fortes.",
        "A análise detetou limitações de enquadramento ou iluminação.",
    ]);
    assert.doesNotMatch(warnings.join(" "), /provider-secret|Only one usable/i);
    assert.equal(
        hasMatchingFaceAnalysisConsent({
            consent: {
                status: "active",
                version: "face-analysis-v2",
                purposes: { openAiAnalysis: true },
                externalProviderConsent: {
                    status: "active",
                    provider: "openai",
                    noticeVersion: "openai-v2",
                },
            },
            providerConsentRequirement: {
                required: true,
                provider: "openai",
                noticeVersion: "openai-v2",
                consentVersion: "face-analysis-v2",
            },
        }),
        true,
    );
});

test("polling fica limitado a trabalho remoto declarado", () => {
    assert.equal(
        shouldPollConsultation({
            flowState: "asking_questions",
            conversation: { currentQuestion: null },
        }),
        false,
    );
    assert.equal(
        shouldPollConsultation({
            flowState: "asking_questions",
            conversation: { currentQuestion: { id: "q", type: "short_text" } },
        }),
        false,
    );
    assert.equal(
        shouldPollConsultation({ operation: { status: "processing" } }),
        true,
    );
    assert.deepEqual(
        [0, 1, 2, 3, 8].map(getConsultationPollDelay),
        [2_000, 4_000, 8_000, 10_000, 10_000],
    );
});

test("preflight aplica 10 MiB e lado mais curto de 720 píxeis", () => {
    assert.equal(MAX_PHOTO_BYTES, 10 * 1024 * 1024);
    assert.equal(MIN_PHOTO_SIDE, 720);
    assert.equal(
        validatePhotoMetadata({
            type: "image/jpeg",
            size: MAX_PHOTO_BYTES,
            width: 1_080,
            height: 720,
        }).ok,
        true,
    );
    assert.equal(
        validatePhotoMetadata({
            type: "image/jpeg",
            size: 1_000,
            width: 719,
            height: 1_080,
        }).ok,
        false,
    );
    assert.equal(
        validatePhotoSignals({
            lumaMean: 120,
            darkClippedRatio: 0.01,
            lightClippedRatio: 0.01,
            blurVariance: 45,
        }).ok,
        true,
    );
    assert.equal(
        validatePhotoSignals({
            lumaMean: 30,
            darkClippedRatio: 0.3,
            lightClippedRatio: 0,
            blurVariance: 10,
        }).ok,
        false,
    );
});

test("FaceLandmarker exige exatamente um rosto e framing entre 30% e 85%", () => {
    assert.equal(
        assessFaceLandmarkerResult({ faceLandmarks: [] }, "frontal").ok,
        false,
    );
    assert.equal(
        assessFaceLandmarkerResult(
            {
                faceLandmarks: [
                    createFaceLandmarks(),
                    createFaceLandmarks(),
                ],
            },
            "frontal",
        ).ok,
        false,
    );

    for (const height of [0.3, 0.85]) {
        const result = assessFaceLandmarkerResult(
            createFaceResult({ height }),
            "frontal",
        );
        assert.equal(result.ok, true, `height ${height} deveria ser aceite`);
        assert.equal(result.metrics.confidenceFloor, 0.7);
    }
    for (const height of [0.299, 0.851]) {
        assert.equal(
            assessFaceLandmarkerResult(createFaceResult({ height }), "frontal")
                .ok,
            false,
            `height ${height} deveria ser rejeitada`,
        );
    }
});

test("FaceLandmarker limita centro a 20% e aplica os gates de yaw inclusivos", () => {
    assert.equal(
        assessFaceLandmarkerResult(
            createFaceResult({ centerX: 0.7, width: 0.28 }),
            "frontal",
        ).ok,
        true,
    );
    assert.equal(
        assessFaceLandmarkerResult(
            createFaceResult({ centerX: 0.701, width: 0.28 }),
            "frontal",
        ).ok,
        false,
    );

    assert.equal(
        assessFaceLandmarkerResult(
            createFaceResult({ absoluteYawDegrees: 20 }),
            "frontal",
        ).ok,
        true,
    );
    assert.equal(
        assessFaceLandmarkerResult(
            createFaceResult({ absoluteYawDegrees: 20.1 }),
            "frontal",
        ).ok,
        false,
    );
    for (const yaw of [35, 75]) {
        assert.equal(
            assessFaceLandmarkerResult(
                createFaceResult({ absoluteYawDegrees: yaw }),
                "perfil",
            ).ok,
            true,
            `yaw ${yaw} deveria ser aceite em perfil`,
        );
    }
    for (const yaw of [34.9, 75.1]) {
        assert.equal(
            assessFaceLandmarkerResult(
                createFaceResult({ absoluteYawDegrees: yaw }),
                "perfil",
            ).ok,
            false,
            `yaw ${yaw} deveria ser rejeitado em perfil`,
        );
    }
});

test("falha de inicialização MediaPipe degrada para aviso não bloqueante", async () => {
    const result = await inspectFaceWithMediaPipe({}, "frontal");
    assert.equal(result.status, "unavailable");
    assert.equal(result.ok, true);
    assert.equal(result.errors.length, 0);
    assert.match(result.warnings[0], /verificação automática/i);
    assert.doesNotMatch(result.warnings[0], /servidor|gates locais/i);
});

test("router expõe rotas canónicas e redirects legacy sem montar páginas antigas", () => {
    for (const path of [
        "/consulta",
        "/consulta/nova",
        "/consulta/ativa",
        "/consulta/relatorios/:reportId/*",
        "/consulta/historico",
        "/consultoria/revisoes",
    ]) {
        const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.match(appSource, new RegExp(`path="${escapedPath}"`));
    }
    assert.match(appSource, /path="\/pele\/fotografias"[\s\S]*?to="\/consulta\/nova"/);
    assert.match(appSource, /path="\/pele\/analise"[\s\S]*?to="\/consulta\/ativa"/);
    assert.doesNotMatch(appSource, /pages\/Face(?:PhotoUpload|Analysis|Report)Page/);
});

test("adapter usa os endpoints canónicos e o relatório bloqueado tem ramo próprio", () => {
    for (const contract of [
        "/ai-consultation/capabilities",
        "/ai-consultation/goals",
        "/ai-consultation/sessions/current",
        "/analysis",
        "/answers",
        "/submit",
        "/retry",
        "/review-request",
        "/unlock/simulate-payment",
        "/makeup-simulations",
        "/cosmetic-visualizations",
    ]) {
        assert.ok(apiSource.includes(contract), contract);
    }
    for (const type of [
        "single_select",
        "multi_select",
        "scale",
        "number",
        "short_text",
    ]) {
        assert.ok(activeSource.includes(type), type);
    }
    assert.match(reportSource, /report && !unlocked/);
    assert.match(reportSource, /report && unlocked/);
    assert.match(reportSource, /photoAccessNoticeVersion/);
    assert.match(reportSource, /generativeEditNoticeVersion/);
    assert.match(reportSource, /revoke-review-photos/);
    assert.match(reportSource, /revoke-visualization-consent/);
    assert.match(reportSource, /content\.answerSummary/);
    assert.match(reportSource, /content\.objectivesAssessment/);
    assert.match(reportSource, /step\.instructions/);
    assert.match(reportSource, /recommendation\.usage/);
    assert.match(reportSource, /Análise assistida por OpenAI/);
    assert.doesNotMatch(reportSource, /Versão do prompt|Versão do esquema/);
    assert.match(apiSource, /acknowledgePhotoWarnings/);
    assert.match(
        apiSource,
        /body: formData,[\s\S]*?timeoutMs: FILE_REQUEST_TIMEOUT_MS/,
    );
    assert.match(apiSource, /report: normalizeReport\(payload\)/);
    assert.match(newSource, /requiresPhotoWarningAcknowledgement/);
    assert.match(newSource, /Antes de continuares/);
    assert.match(newSource, /photoWarningsAcknowledged/);
    assert.match(apiSource, /ai-consultation\/sessions\?limit=20/);
    assert.match(historySource, /event\.reportId/);
    assert.match(historySource, /event\.isOpen === true/);
    assert.doesNotMatch(reportSource, /display:\s*none|hidden=/);
});

test("pagamento simulado exige entropia segura e mantém uma chave opaca", () => {
    assert.equal(
        createPaymentIdempotencyKey(
            "report-public",
            () => "123e4567-e89b-12d3-a456-426614174000",
        ),
        "report.report-public.123e4567-e89b-12d3-a456-426614174000",
    );
    assert.throws(() => createPaymentIdempotencyKey("", () => "uuid"));
    assert.throws(() => createPaymentIdempotencyKey("report-public", null));
});
