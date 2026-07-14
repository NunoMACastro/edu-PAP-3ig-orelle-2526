/**
 * Testes focais do ciclo de vida do consentimento facial.
 *
 * Cobrem ownership pela sessao, DTO minimizado, revogacao idempotente,
 * reaceitacao explicita e bloqueio de novo processamento depois de revogar.
 * As mutacoes usam uma sessao com protecao CSRF ativa e uma origem allowlisted.
 */
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import {
    createSessionToken,
    resetTestSessions,
} from "../src/services/session.service.js";
import { validateFaceConsentInput } from "../src/validators/face-photo.validator.js";

vi.mock("../src/models/face-consent.model.js", () => ({
    FaceConsent: {
        findOne: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: {
        find: vi.fn(),
        insertMany: vi.fn(),
        updateMany: vi.fn(),
    },
}));

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        create: vi.fn(),
        find: vi.fn(),
    },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: { LOCKED: "locked", UNLOCKED: "unlocked" },
    ReportUnlock: { find: vi.fn() },
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PerformanceMetric: {
        create: vi.fn().mockResolvedValue({}),
    },
}));

const LOCAL_ORIGIN = "http://127.0.0.1:5173";
const userId = "66a000000000000000000001";
const otherUserId = "66a000000000000000000002";
const consentId = "66b000000000000000000001";
const acceptedAt = new Date("2026-07-10T09:00:00.000Z");
let storedConsent = null;
const originalEnv = { ...env };

/**
 * Cria um consentimento persistido simulado.
 *
 * @function makeConsent
 * @param {object} [overrides={}] - Campos a sobrepor.
 * @returns {object} Documento de consentimento simulado.
 */
function makeConsent(overrides = {}) {
    return {
        _id: consentId,
        userId,
        version: "face-analysis-v2",
        purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        acceptedAt,
        revokedAt: null,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: env.openAiNoticeVersion,
            acceptedAt,
            revokedAt: null,
        },
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
        ...overrides,
    };
}

/**
 * Cria uma sessao opaca test-only que exige Origin e CSRF nas mutacoes.
 *
 * @function makeProtectedSession
 * @returns {string} Token destinado exclusivamente ao cookie do teste.
 */
function makeProtectedSession() {
    return createSessionToken(
        {
            id: userId,
            email: "titular-consentimento@orelle.test",
            role: ROLES.CLIENTE,
        },
        { enforceCsrf: true },
    );
}

/**
 * Emite um token CSRF real ligado a sessao de teste.
 *
 * @async
 * @function fetchCsrfToken
 * @param {import("express").Express} app - Aplicacao isolada.
 * @param {string} sessionToken - Cookie opaco da sessao.
 * @returns {Promise<string>} Token CSRF devolvido pelo endpoint canonico.
 */
async function fetchCsrfToken(app, sessionToken) {
    const response = await request(app)
        .get("/api/auth/csrf")
        .set("Cookie", [`orelle_session=${sessionToken}`]);

    expect(response.status).toBe(200);
    return response.body.csrfToken;
}

/**
 * Aplica os headers de autenticacao e CSRF a uma mutacao Supertest.
 *
 * @function protectMutation
 * @param {import("supertest").Test} testRequest - Pedido em construcao.
 * @param {string} sessionToken - Cookie opaco da sessao.
 * @param {string} csrfToken - Token CSRF da mesma sessao.
 * @returns {import("supertest").Test} Pedido pronto a enviar.
 */
function protectMutation(testRequest, sessionToken, csrfToken) {
    return testRequest
        .set("Cookie", [`orelle_session=${sessionToken}`])
        .set("Origin", LOCAL_ORIGIN)
        .set("X-CSRF-Token", csrfToken);
}

/**
 * Cria uma query Mongoose encadeavel que resolve uma lista controlada.
 *
 * @function makeHistoryQuery
 * @param {object[]} items - Documentos devolvidos no limite final.
 * @returns {object} Mock com select, sort e limit.
 */
function makeHistoryQuery(items) {
    const query = {
        select: vi.fn(),
        sort: vi.fn(),
        limit: vi.fn().mockResolvedValue(items),
    };
    query.select.mockReturnValue(query);
    query.sort.mockReturnValue(query);
    return query;
}

function makeUnlockQuery(items = []) {
    const query = {
        select: vi.fn(),
        lean: vi.fn().mockResolvedValue(items),
    };
    query.select.mockReturnValue(query);
    return query;
}

/**
 * Instala um repositorio de consentimento em memoria com semantica equivalente
 * aos dois compare-and-set usados pelo service.
 *
 * @returns {void}
 */
function installConsentRepositoryMock() {
    FaceConsent.findOne.mockImplementation(async (filter) => {
        if (
            !storedConsent ||
            String(filter?.userId) !== userId ||
            filter?.purpose !== FACE_ANALYSIS_CONSENT_PURPOSE
        ) {
            return null;
        }

        if (filter.revokedAt === null && storedConsent.revokedAt) return null;

        return { ...storedConsent };
    });

    FaceConsent.findOneAndUpdate.mockImplementation(
        async (filter, update, options) => {
            const isRevocation = filter?.revokedAt === null;

            if (isRevocation) {
                if (
                    !storedConsent ||
                    storedConsent.revokedAt ||
                    String(filter.userId) !== userId ||
                    filter.purpose !== FACE_ANALYSIS_CONSENT_PURPOSE
                ) {
                    return null;
                }

                const revokedAt = Array.isArray(update)
                    ? update[0].$set.revokedAt
                    : update.$set.revokedAt;
                storedConsent = {
                    ...storedConsent,
                    revokedAt,
                    externalProviderConsent: storedConsent.externalProviderConsent
                        ? {
                              ...storedConsent.externalProviderConsent,
                              revokedAt,
                          }
                        : null,
                };
                return { ...storedConsent };
            }

            if (String(filter?.userId) !== userId || options?.upsert !== true) {
                return null;
            }

            storedConsent = {
                ...(storedConsent ?? makeConsent()),
                ...update.$set,
            };
            return { ...storedConsent };
        },
    );
}

describe("ORELLE-AUD-P1-004 - ciclo de consentimento facial", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        resetTestSessions();
        storedConsent = null;
        installConsentRepositoryMock();
        ReportUnlock.find.mockReturnValue(makeUnlockQuery([]));
    });

    afterEach(() => {
        Object.assign(env, originalEnv);
    });

    it("rejeita versoes de aviso ausentes do contrato canonico", () => {
        expect(() =>
            validateFaceConsentInput({ accepted: true, version: 2 }),
        ).toThrow("Versao de consentimento facial invalida");
        expect(() =>
            validateFaceConsentInput({
                accepted: true,
                version: "../../aviso",
            }),
        ).toThrow("Versao de consentimento facial invalida");
    });

    it("exige sessao para consultar ou revogar consentimento", async () => {
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const getResponse = await request(app).get("/api/face-consent");
        const deleteResponse = await request(app).delete("/api/face-consent");

        expect(getResponse.status).toBe(401);
        expect(deleteResponse.status).toBe(401);
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
        expect(FaceConsent.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("devolve consent null quando o titular nunca decidiu", async () => {
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const response = await request(app)
            .get("/api/face-consent")
            .set("Cookie", [`orelle_session=${sessionToken}`]);

        expect(response.status).toBe(200);
        expect(response.headers["cache-control"]).toBe("no-store");
        expect(response.body).toEqual({
            consent: null,
            providerConsentRequirement: {
                required: true,
                provider: "openai",
                noticeVersion: env.openAiNoticeVersion,
                consentVersion: "face-analysis-v2",
            },
        });
    });

    it("consulta apenas o titular e devolve DTO ativo sem IDs ou PII", async () => {
        storedConsent = makeConsent();
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const response = await request(app)
            .get(`/api/face-consent?userId=${otherUserId}`)
            .set("Cookie", [`orelle_session=${sessionToken}`]);

        expect(response.status).toBe(200);
        expect(response.headers["cache-control"]).toBe("no-store");
        expect(response.body.consent).toEqual({
            status: "active",
            version: "face-analysis-v2",
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            acceptedAt: acceptedAt.toISOString(),
            revokedAt: null,
            externalProviderConsent: {
                status: "active",
                provider: "openai",
                noticeVersion: env.openAiNoticeVersion,
                acceptedAt: acceptedAt.toISOString(),
                revokedAt: null,
            },
            purposes: {
                openAiAnalysis: true,
                generativeEdit: false,
                consultantPhotoAccess: false,
            },
        });
        expect(response.body.consent.id).toBeUndefined();
        expect(response.body.consent.userId).toBeUndefined();
        expect(response.body.providerConsentRequirement.required).toBe(true);
        expect(FaceConsent.findOne).toHaveBeenCalledWith({
            userId,
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
        });
    });

    it("revoga com CSRF real e preserva revokedAt em replays", async () => {
        storedConsent = makeConsent();
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const csrfToken = await fetchCsrfToken(app, sessionToken);
        const firstResponse = await protectMutation(
            request(app).delete("/api/face-consent"),
            sessionToken,
            csrfToken,
        );
        const secondResponse = await protectMutation(
            request(app).delete("/api/face-consent"),
            sessionToken,
            csrfToken,
        );

        expect(firstResponse.status).toBe(200);
        expect(secondResponse.status).toBe(200);
        expect(firstResponse.headers["cache-control"]).toBe("no-store");
        expect(firstResponse.body.consent.status).toBe("revoked");
        expect(firstResponse.body.consent.revokedAt).toEqual(
            secondResponse.body.consent.revokedAt,
        );
        expect(firstResponse.body.consent.id).toBeUndefined();
        expect(firstResponse.body.consent.userId).toBeUndefined();

        const getAfterRevocation = await request(app)
            .get("/api/face-consent")
            .set("Cookie", [`orelle_session=${sessionToken}`]);

        expect(getAfterRevocation.status).toBe(200);
        expect(getAfterRevocation.body.consent.status).toBe("revoked");
        expect(getAfterRevocation.body.consent.revokedAt).toBe(
            firstResponse.body.consent.revokedAt,
        );
    });

    it("permite reaceitacao explicita depois de revogar", async () => {
        const originalRevokedAt = new Date("2026-07-09T10:00:00.000Z");
        storedConsent = makeConsent({ revokedAt: originalRevokedAt });
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const csrfToken = await fetchCsrfToken(app, sessionToken);
        const response = await protectMutation(
            request(app)
                .post("/api/face-consent")
                .send({
                    accepted: true,
                    version: "face-analysis-v2",
                    providerConsentAccepted: true,
                    provider: "openai",
                    noticeVersion: env.openAiNoticeVersion,
                }),
            sessionToken,
            csrfToken,
        );

        expect(response.status).toBe(200);
        expect(response.body.consent).toEqual(
            expect.objectContaining({
                status: "active",
                version: "face-analysis-v2",
                purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                revokedAt: null,
            }),
        );
        expect(response.body.consent.id).toBeUndefined();
        expect(storedConsent.revokedAt).toBeNull();
        expect(storedConsent.acceptedAt.getTime()).toBeGreaterThan(
            originalRevokedAt.getTime(),
        );
    });

    it("exige consentimento específico e versionado em modo OpenAI", async () => {
        env.openAiNoticeVersion = "provider-notice-v3";
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const csrfToken = await fetchCsrfToken(app, sessionToken);

        const requirementResponse = await request(app)
            .get("/api/face-consent")
            .set("Cookie", [`orelle_session=${sessionToken}`]);
        expect(requirementResponse.body.providerConsentRequirement).toEqual({
            required: true,
            provider: "openai",
            noticeVersion: "provider-notice-v3",
            consentVersion: "face-analysis-v2",
        });

        const missingResponse = await protectMutation(
            request(app)
                .post("/api/face-consent")
                .send({ accepted: true, version: "face-analysis-v2" }),
            sessionToken,
            csrfToken,
        );
        expect(missingResponse.status).toBe(400);
        expect(storedConsent).toBeNull();

        const acceptedResponse = await protectMutation(
            request(app).post("/api/face-consent").send({
                accepted: true,
                version: "face-analysis-v2",
                providerConsentAccepted: true,
                provider: "openai",
                noticeVersion: "provider-notice-v3",
            }),
            sessionToken,
            csrfToken,
        );

        expect(acceptedResponse.status).toBe(200);
        expect(acceptedResponse.body.consent.externalProviderConsent).toEqual(
            expect.objectContaining({
                status: "active",
                provider: "openai",
                noticeVersion: "provider-notice-v3",
                revokedAt: null,
            }),
        );
        expect(JSON.stringify(acceptedResponse.body)).not.toContain("API_KEY");
        expect(JSON.stringify(acceptedResponse.body)).not.toContain("https://");
    });

    it("revoga o consentimento geral e o específico com o mesmo instante", async () => {
        const providerAcceptedAt = new Date("2026-07-10T08:00:00.000Z");
        storedConsent = makeConsent({
            externalProviderConsent: {
                provider: "openai",
                noticeVersion: "notice-v2",
                acceptedAt: providerAcceptedAt,
                revokedAt: null,
            },
        });
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const csrfToken = await fetchCsrfToken(app, sessionToken);
        const response = await protectMutation(
            request(app).delete("/api/face-consent"),
            sessionToken,
            csrfToken,
        );

        expect(response.status).toBe(200);
        expect(response.body.consent.status).toBe("revoked");
        expect(response.body.consent.externalProviderConsent.status).toBe(
            "revoked",
        );
        expect(response.body.consent.externalProviderConsent.revokedAt).toBe(
            response.body.consent.revokedAt,
        );
    });

    it("remove o endpoint direto antigo de análise", async () => {
        storedConsent = makeConsent({ externalProviderConsent: null });
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const csrfToken = await fetchCsrfToken(app, sessionToken);
        const response = await protectMutation(
            request(app).post("/api/face-analyses"),
            sessionToken,
            csrfToken,
        );

        expect(response.status).toBe(404);
        expect(FacePhoto.find).not.toHaveBeenCalled();
        expect(FaceAnalysis.create).not.toHaveBeenCalled();
    });

    it("bloqueia novo upload e nova analise depois da revogacao", async () => {
        storedConsent = makeConsent({
            revokedAt: new Date("2026-07-10T10:00:00.000Z"),
        });
        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const csrfToken = await fetchCsrfToken(app, sessionToken);
        const uploadResponse = await protectMutation(
            request(app)
                .post("/api/face-photos")
                .attach("frontal", Buffer.from("not-written"), {
                    filename: "frontal.png",
                    contentType: "image/png",
                })
                .attach("perfil", Buffer.from("not-written"), {
                    filename: "perfil.png",
                    contentType: "image/png",
                }),
            sessionToken,
            csrfToken,
        );
        const analysisResponse = await protectMutation(
            request(app).post("/api/face-analyses"),
            sessionToken,
            csrfToken,
        );

        expect(uploadResponse.status).toBe(403);
        expect(analysisResponse.status).toBe(404);
        expect(uploadResponse.body.error.message).toBe(
            "Consentimento facial em falta",
        );
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
        expect(FacePhoto.find).not.toHaveBeenCalled();
        expect(FaceAnalysis.create).not.toHaveBeenCalled();
    });

    it("mantem o historico proprio legivel depois da revogacao", async () => {
        storedConsent = makeConsent({
            revokedAt: new Date("2026-07-09T10:00:00.000Z"),
        });
        const analysisId = "66c000000000000000000001";
        FaceAnalysis.find.mockReturnValue(
            makeHistoryQuery([
                {
                    _id: analysisId,
                    createdAt: acceptedAt,
                    mode: "openai",
                    isDemo: false,
                    providerName: "openai",
                    providerVersion: "gpt-5.4-mini",
                    findings: { skinType: { label: "mista" } },
                    limitations: ["Demonstracao academica"],
                },
            ]),
        );
        FaceReport.find.mockReturnValue(makeHistoryQuery([]));

        const app = createApp({ allowedOrigins: [LOCAL_ORIGIN] });
        const sessionToken = makeProtectedSession();
        const response = await request(app)
            .get(`/api/me/skin-history?userId=${otherUserId}`)
            .set("Cookie", [`orelle_session=${sessionToken}`]);

        expect(response.status).toBe(200);
        expect(response.body.history).toEqual([
            expect.objectContaining({
                id: analysisId,
                type: "analysis",
                mode: "openai",
                isDemo: false,
            }),
        ]);
        expect(FaceAnalysis.find).toHaveBeenCalledWith({ userId });
        expect(FaceReport.find).toHaveBeenCalledWith({
            userId,
            privacyStatus: "active",
        });
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
    });
});
