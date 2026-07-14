/**
 * Testes do BK-MF7-01 para consentimento facial explicito.
 *
 * Cobrem o contrato RGPD minimo: sessao obrigatoria, aceitacao afirmativa e
 * finalidade correta antes de qualquer tratamento facial sensivel.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { FACE_ANALYSIS_CONSENT_PURPOSE } from "../src/constants/face-consent.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { BeforeAfterVisualization } from "../src/models/before-after-visualization.model.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { MakeupSimulation } from "../src/models/makeup-simulation.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { createSessionToken } from "../src/services/session.service.js";
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
    },
}));

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: {
        create: vi.fn(),
    },
}));

vi.mock("../src/models/makeup-simulation.model.js", () => ({
    MAKEUP_SIMULATION_STATUSES: {
        QUEUED: "queued",
        PROCESSING: "processing",
        COMPLETED: "completed",
        FAILED_RETRYABLE: "failed_retryable",
        FAILED_TERMINAL: "failed_terminal",
        EXPIRED: "expired",
        CANCELLED: "cancelled",
    },
    MakeupSimulation: {
        findOne: vi.fn(),
        updateMany: vi.fn(),
    },
}));

vi.mock("../src/models/product-recommendation.model.js", () => ({
    ProductRecommendation: {
        find: vi.fn(),
    },
}));

vi.mock("../src/models/before-after-visualization.model.js", () => ({
    BeforeAfterVisualization: {
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/performance-metric.model.js", () => ({
    PerformanceMetric: {
        create: vi.fn().mockResolvedValue({}),
    },
}));

const userId = "66d000000000000000000001";
const consentId = "66d000000000000000000002";
const simulationId = "66d000000000000000000003";

/**
 * Cria um identificador minimo com `toString`.
 *
 * @function objectId
 * @param {string} id - Valor textual do identificador.
 * @returns {{toString: Function}} Identificador simulado.
 */
function objectId(id) {
    return {
        /**
         * Devolve o valor textual do ObjectId simulado.
         *
         * @function toString
         * @returns {string} Identificador textual usado no teste.
         */
        toString() {
            return id;
        },
    };
}

/**
 * Gera cookie de sessao de cliente.
 *
 * @function makeToken
 * @returns {string} Token de sessao assinado.
 */
function makeToken() {
    return createSessionToken({
        id: userId,
        email: "cliente-mf7@orelle.test",
        role: ROLES.CLIENTE,
    });
}

/**
 * Cria consentimento mock para a finalidade indicada.
 *
 * @function makeConsent
 * @param {string} [purpose=FACE_ANALYSIS_CONSENT_PURPOSE] - Finalidade do consentimento.
 * @returns {object} Consentimento mock.
 */
function makeConsent(purpose = FACE_ANALYSIS_CONSENT_PURPOSE) {
    return {
        _id: objectId(consentId),
        userId,
        acceptedAt: new Date("2026-06-29T10:00:00.000Z"),
        version: "face-analysis-v2",
        purpose,
        revokedAt: null,
        externalProviderConsent: {
            provider: "openai",
            noticeVersion: env.openAiNoticeVersion,
            acceptedAt: new Date("2026-06-29T10:00:00.000Z"),
            revokedAt: null,
        },
        purposes: {
            openAiAnalysis: true,
            generativeEdit: false,
            consultantPhotoAccess: false,
        },
    };
}

/**
 * Simula um repositorio onde existe apenas consentimento para outra finalidade.
 *
 * @async
 * @function findOnlyWrongPurposeConsent
 * @param {object} query - Query recebida pelo service/middleware.
 * @returns {Promise<object|null>} Consentimento errado quando a query nao exige finalidade.
 */
async function findOnlyWrongPurposeConsent(query) {
    if (query?.purpose === FACE_ANALYSIS_CONSENT_PURPOSE) {
        return null;
    }

    return makeConsent("marketing_cosmetico");
}

describe("BK-MF7-01 - consentimento facial explicito", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("valida apenas aceitacao afirmativa booleana", () => {
        expect(validateFaceConsentInput({ accepted: true })).toEqual({
            version: "face-analysis-v2",
            providerConsentAccepted: false,
            provider: undefined,
            noticeVersion: undefined,
            generativeEditAccepted: false,
            consultantPhotoAccessAccepted: false,
        });

        expect(() => validateFaceConsentInput({ accepted: "true" })).toThrow(
            "Consentimento facial obrigatorio",
        );
        expect(() => validateFaceConsentInput(undefined)).toThrow(
            "Consentimento facial obrigatorio",
        );
    });

    it("bloqueia criacao de consentimento sem sessao", async () => {
        const response = await request(createApp())
            .post("/api/face-consent")
            .send({ accepted: true, version: "face-analysis-v2" });

        expect(response.status).toBe(401);
        expect(FaceConsent.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("recusa body sem consentimento explicito no endpoint", async () => {
        const response = await request(createApp())
            .post("/api/face-consent")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ accepted: false, version: "face-analysis-v2" });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe(
            "Consentimento facial obrigatorio",
        );
        expect(FaceConsent.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("persiste consentimento minimo com finalidade facial cosmetica", async () => {
        FaceConsent.findOneAndUpdate.mockResolvedValueOnce(makeConsent());

        const response = await request(createApp())
            .post("/api/face-consent")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                accepted: true,
                version: "face-analysis-v2",
                providerConsentAccepted: true,
                provider: "openai",
                noticeVersion: env.openAiNoticeVersion,
            });

        expect(response.status).toBe(200);
        expect(response.body.consent).toEqual(
            expect.objectContaining({
                status: "active",
                version: "face-analysis-v2",
                purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                revokedAt: null,
                externalProviderConsent: expect.objectContaining({
                    status: "active",
                    provider: "openai",
                    noticeVersion: env.openAiNoticeVersion,
                }),
            }),
        );
        expect(response.body.consent.id).toBeUndefined();
        expect(response.body.consent.userId).toBeUndefined();
        expect(FaceConsent.findOneAndUpdate).toHaveBeenCalledWith(
            { userId },
            expect.objectContaining({
                $set: expect.objectContaining({
                    purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
                    revokedAt: null,
                }),
            }),
            expect.objectContaining({ upsert: true, new: true }),
        );
    });

    it("bloqueia upload direto quando so existe consentimento de outra finalidade", async () => {
        FaceConsent.findOne.mockImplementation(findOnlyWrongPurposeConsent);

        const response = await request(createApp())
            .post("/api/face-photos")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .attach("frontal", Buffer.from("not an image"), {
                filename: "frontal.png",
                contentType: "image/png",
            })
            .attach("perfil", Buffer.from("not an image"), {
                filename: "perfil.png",
                contentType: "image/png",
            });

        expect(response.status).toBe(403);
        expect(response.body.error.message).toBe("Consentimento facial em falta");
        expect(FaceConsent.findOne).toHaveBeenCalledWith({
            userId,
            purpose: FACE_ANALYSIS_CONSENT_PURPOSE,
            version: "face-analysis-v2",
            revokedAt: null,
        });
        expect(FacePhoto.insertMany).not.toHaveBeenCalled();
    });

    it("remove a geração direta antiga de análise", async () => {
        FaceConsent.findOne.mockImplementation(findOnlyWrongPurposeConsent);

        const response = await request(createApp())
            .post("/api/face-analyses")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
        expect(FacePhoto.find).not.toHaveBeenCalled();
        expect(FaceAnalysis.create).not.toHaveBeenCalled();
    });

    it("remove a visualização conceptual antiga", async () => {
        FaceConsent.findOne.mockImplementation(findOnlyWrongPurposeConsent);

        const response = await request(createApp())
            .post("/api/before-after-visualizations")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ simulationId });

        expect(response.status).toBe(404);
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
        expect(MakeupSimulation.findOne).not.toHaveBeenCalled();
        expect(ProductRecommendation.find).not.toHaveBeenCalled();
        expect(BeforeAfterVisualization.findOneAndUpdate).not.toHaveBeenCalled();
    });
});
