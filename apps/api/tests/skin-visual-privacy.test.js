/**
 * Contratos de privacidade e seleção temporal da comparação de pele.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceConsent } from "../src/models/face-consent.model.js";
import { FacePhoto } from "../src/models/face-photo.model.js";
import { ReportUnlock } from "../src/models/report-unlock.model.js";
import { SkinComparison } from "../src/models/skin-comparison.model.js";
import { readEncryptedFacePhotoFile } from "../src/services/face-secure-storage.service.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: { find: vi.fn(), findOne: vi.fn() },
}));

vi.mock("../src/models/face-consent.model.js", () => ({
    FaceConsent: { find: vi.fn(), findOne: vi.fn() },
}));

vi.mock("../src/models/face-photo.model.js", () => ({
    FacePhoto: { find: vi.fn(), findOne: vi.fn() },
}));

vi.mock("../src/models/skin-comparison.model.js", () => ({
    SkinComparison: { findOneAndUpdate: vi.fn() },
}));

vi.mock("../src/models/report-unlock.model.js", () => ({
    REPORT_UNLOCK_STATUS: { LOCKED: "locked", UNLOCKED: "unlocked" },
    ReportUnlock: { find: vi.fn() },
}));

vi.mock("../src/services/face-secure-storage.service.js", () => ({
    readEncryptedFacePhotoFile: vi.fn(),
}));

const userId = "66c000000000000000000510";
const otherUserId = "66c000000000000000000511";
const baselineAnalysisId = "66c000000000000000000520";
const followUpAnalysisId = "66c000000000000000000521";
const consentId = "66c000000000000000000530";
const frontalPhotoId = "66c000000000000000000540";
const comparisonId = "66c000000000000000000550";
const baselineDate = "2026-04-01T10:00:00.000Z";
const followUpDate = "2026-05-08T10:00:00.000Z";

/**
 * Cria um ObjectId mínimo compatível com os DTOs.
 *
 * @param {string} value - Texto do identificador.
 * @returns {{toString: () => string}} Identificador mock.
 */
function objectId(value) {
    return { toString: () => value };
}

/**
 * Cria uma sessão opaca isolada para um titular.
 *
 * @param {string} [id=userId] - Titular da sessão.
 * @returns {string} Token test-only.
 */
function makeToken(id = userId) {
    return createSessionToken({
        id,
        email: `${id}@orelle.test`,
        role: ROLES.CLIENTE,
    });
}

/**
 * Cria uma análise concluída com as métricas necessárias à comparação.
 *
 * @param {string} id - Identificador interno.
 * @param {string} createdAt - Data ISO.
 * @param {object} [overrides={}] - Valores opcionais.
 * @returns {object} Documento mock.
 */
function makeAnalysis(id, createdAt, overrides = {}) {
    return {
        _id: objectId(id),
        userId: objectId(userId),
        photoIds: [objectId(frontalPhotoId)],
        consentId: objectId(consentId),
        createdAt: new Date(createdAt),
        findings: {
            skinType: { label: "mista" },
            acne: { label: "moderado" },
            manchas: { label: "baixo" },
            rugas: { label: "baixo" },
            oleosidade: { label: "moderada" },
        },
        ...overrides,
    };
}

/**
 * Cria uma query encadeável terminada em select.
 *
 * @param {unknown} result - Resultado da query.
 * @returns {{select: ReturnType<typeof vi.fn>}} Query mock.
 */
function queryWithSelect(result) {
    return { select: vi.fn().mockResolvedValue(result) };
}

function unlockedAnalysisQuery(result) {
    const query = {
        select: vi.fn(),
        lean: vi.fn().mockResolvedValue(result),
    };
    query.select.mockReturnValue(query);
    return query;
}

describe("P2-009 - imagem própria e comparação por datas", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        ReportUnlock.find.mockReturnValue(
            unlockedAnalysisQuery([
                { analysisId: objectId(baselineAnalysisId) },
                { analysisId: objectId(followUpAnalysisId) },
            ]),
        );
    });

    it("entrega bytes existentes ao titular mesmo após revogação, sem cache nem paths", async () => {
        const analysis = makeAnalysis(baselineAnalysisId, baselineDate);
        FaceAnalysis.findOne.mockReturnValueOnce(queryWithSelect(analysis));
        FaceConsent.findOne.mockReturnValueOnce(
            queryWithSelect({
                _id: objectId(consentId),
                revokedAt: new Date("2026-05-10T10:00:00.000Z"),
            }),
        );
        FacePhoto.findOne.mockReturnValueOnce(
            queryWithSelect({
                _id: objectId(frontalPhotoId),
                mimeType: "image/webp",
                storageKey: "/private/never-public.enc",
                encryption: { algorithm: "aes-256-gcm" },
            }),
        );
        readEncryptedFacePhotoFile.mockResolvedValueOnce(
            Buffer.from("authorized-image-bytes"),
        );

        const response = await request(createApp())
            .get(`/api/me/skin-analyses/${baselineAnalysisId}/image`)
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.headers["cache-control"]).toContain("no-store");
        expect(response.headers["content-type"]).toContain("image/webp");
        expect(response.headers["x-content-type-options"]).toBe("nosniff");
        expect(response.body).toEqual(Buffer.from("authorized-image-bytes"));
        expect(FaceAnalysis.findOne).toHaveBeenCalledWith({
            _id: baselineAnalysisId,
            userId,
            status: "completed",
        });
        expect(FaceConsent.findOne).toHaveBeenCalledWith({
            _id: analysis.consentId,
            userId,
            purpose: "analise_facial_cosmetica",
        });
        expect(FacePhoto.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                userId,
                consentId: expect.objectContaining({
                    toString: expect.any(Function),
                }),
                kind: "frontal",
                status: "active",
            }),
        );
        expect(JSON.stringify(response.headers)).not.toContain("never-public");
    });

    it("entrega a vista de perfil apenas quando pertence à mesma análise e titular", async () => {
        const analysis = makeAnalysis(baselineAnalysisId, baselineDate, {
            photoIds: [
                objectId(frontalPhotoId),
                objectId("66c000000000000000000541"),
            ],
        });
        FaceAnalysis.findOne.mockReturnValueOnce(queryWithSelect(analysis));
        FaceConsent.findOne.mockReturnValueOnce(
            queryWithSelect({ _id: objectId(consentId) }),
        );
        FacePhoto.findOne.mockReturnValueOnce(
            queryWithSelect({
                _id: objectId("66c000000000000000000541"),
                mimeType: "image/jpeg",
                storageKey: "/private/profile.enc",
                encryption: { algorithm: "aes-256-gcm" },
            }),
        );
        readEncryptedFacePhotoFile.mockResolvedValueOnce(
            Buffer.from("profile-image-bytes"),
        );

        const response = await request(createApp())
            .get(`/api/me/skin-analyses/${baselineAnalysisId}/image/perfil`)
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.headers["cache-control"]).toContain("no-store");
        expect(response.headers["content-type"]).toContain("image/jpeg");
        expect(response.body).toEqual(Buffer.from("profile-image-bytes"));
        expect(FacePhoto.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: { $in: analysis.photoIds },
                userId,
                kind: "perfil",
                status: "active",
            }),
        );
    });

    it("rejeita vistas desconhecidas antes de consultar dados biométricos", async () => {
        const response = await request(createApp())
            .get(`/api/me/skin-analyses/${baselineAnalysisId}/image/lateral`)
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(400);
        expect(FaceAnalysis.findOne).not.toHaveBeenCalled();
        expect(FacePhoto.findOne).not.toHaveBeenCalled();
        expect(readEncryptedFacePhotoFile).not.toHaveBeenCalled();
    });

    it("não entrega bytes quando falta o consentimento aplicável à análise", async () => {
        FaceAnalysis.findOne.mockReturnValueOnce(
            queryWithSelect(makeAnalysis(baselineAnalysisId, baselineDate)),
        );
        FaceConsent.findOne.mockReturnValueOnce(queryWithSelect(null));

        const response = await request(createApp())
            .get(`/api/me/skin-analyses/${baselineAnalysisId}/image`)
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(404);
        expect(FacePhoto.findOne).not.toHaveBeenCalled();
        expect(readEncryptedFacePhotoFile).not.toHaveBeenCalled();
    });

    it("responde 404 sem revelar se a análise pertence a outro utilizador", async () => {
        FaceAnalysis.findOne.mockReturnValueOnce(queryWithSelect(null));

        const response = await request(createApp())
            .get(`/api/me/skin-analyses/${baselineAnalysisId}/image`)
            .set("Cookie", [`orelle_session=${makeToken(otherUserId)}`]);

        expect(response.status).toBe(404);
        expect(FaceAnalysis.findOne).toHaveBeenCalledWith({
            _id: baselineAnalysisId,
            userId: otherUserId,
            status: "completed",
        });
        expect(FaceConsent.findOne).not.toHaveBeenCalled();
        expect(readEncryptedFacePhotoFile).not.toHaveBeenCalled();
    });

    it("bloqueia imagem sem sessão e sem consultar dados", async () => {
        const response = await request(createApp()).get(
            `/api/me/skin-analyses/${baselineAnalysisId}/image`,
        );

        expect(response.status).toBe(401);
        expect(FaceAnalysis.findOne).not.toHaveBeenCalled();
    });

    it("lista momentos próprios por data e só anuncia imagem autorizada", async () => {
        const analyses = [
            makeAnalysis(baselineAnalysisId, baselineDate),
            makeAnalysis(followUpAnalysisId, followUpDate, {
                photoIds: [objectId("66c000000000000000000541")],
            }),
        ];
        FaceAnalysis.find.mockReturnValueOnce({
            select: vi.fn().mockReturnThis(),
            sort: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue(analyses),
        });
        FaceConsent.find.mockReturnValueOnce(
            queryWithSelect([{ _id: objectId(consentId) }]),
        );
        FacePhoto.find.mockReturnValueOnce(
            queryWithSelect([{ _id: objectId(frontalPhotoId) }]),
        );

        const response = await request(createApp())
            .get("/api/me/skin-analyses/comparison-options")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.headers["cache-control"]).toContain("no-store");
        expect(response.body.analyses).toEqual([
            {
                selectionKey: baselineAnalysisId,
                date: baselineDate,
                skinType: "mista",
                imageUrl: `/api/me/skin-analyses/${baselineAnalysisId}/image`,
            },
            {
                selectionKey: followUpAnalysisId,
                date: followUpDate,
                skinType: "mista",
                imageUrl: null,
            },
        ]);
        expect(response.body.analyses[0].analysisId).toBeUndefined();
        expect(JSON.stringify(response.body)).not.toContain("storageKey");
    });

    it("resolve opções datadas no backend e compara apenas análises do titular", async () => {
        const baseline = makeAnalysis(baselineAnalysisId, baselineDate);
        const followUp = makeAnalysis(followUpAnalysisId, followUpDate, {
            findings: {
                ...makeAnalysis(followUpAnalysisId, followUpDate).findings,
                acne: { label: "baixo" },
            },
        });
        FaceAnalysis.findOne
            .mockResolvedValueOnce(baseline)
            .mockResolvedValueOnce(followUp);
        SkinComparison.findOneAndUpdate.mockResolvedValueOnce({
            _id: objectId(comparisonId),
            daysBetween: 37,
            metricDeltas: [
                {
                    metric: "Acne",
                    baselineValue: "moderado",
                    followUpValue: "baixo",
                    changeLabel: "alterou de moderado para baixo",
                },
            ],
            summary: "1 métrica cosmética teve alteração observável.",
            limitations: ["Comparação cosmética."],
            createdAt: new Date(followUpDate),
            updatedAt: new Date(followUpDate),
        });

        const response = await request(createApp())
            .post("/api/me/skin-comparisons")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                baselineSelection: baselineAnalysisId,
                followUpSelection: followUpAnalysisId,
            });

        expect(response.status).toBe(201);
        expect(FaceAnalysis.findOne).toHaveBeenNthCalledWith(1, {
            _id: baselineAnalysisId,
            userId,
            status: "completed",
        });
        expect(FaceAnalysis.findOne).toHaveBeenNthCalledWith(2, {
            _id: followUpAnalysisId,
            userId,
            status: "completed",
        });
        expect(response.body.comparison.baselineDate).toBe(baselineDate);
        expect(response.body.comparison.followUpDate).toBe(followUpDate);
        expect(response.body.comparison.baselineAnalysisId).toBeUndefined();
        expect(response.body.comparison.followUpAnalysisId).toBeUndefined();
    });

    it("rejeita a ordem temporal invertida antes de persistir", async () => {
        FaceAnalysis.findOne
            .mockResolvedValueOnce(
                makeAnalysis(followUpAnalysisId, followUpDate),
            )
            .mockResolvedValueOnce(
                makeAnalysis(baselineAnalysisId, baselineDate),
            );

        const response = await request(createApp())
            .post("/api/me/skin-comparisons")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                baselineSelection: followUpAnalysisId,
                followUpSelection: baselineAnalysisId,
            });

        expect(response.status).toBe(400);
        expect(FaceAnalysis.findOne).toHaveBeenCalledTimes(2);
        expect(SkinComparison.findOneAndUpdate).not.toHaveBeenCalled();
    });
});
