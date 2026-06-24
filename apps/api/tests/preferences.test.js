/**
 * Testes do BK-MF0-06 / RF06.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Preference } from "../src/models/preference.model.js";
import { Product } from "../src/models/product.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import { validatePreferencesInput } from "../src/validators/preferences.validator.js";

vi.mock("../src/models/preference.model.js", () => ({
    Preference: {
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        countDocuments: vi.fn(),
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

const userId = "66a000000000000000000001";
const productId = "66c000000000000000000001";

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
 */
function objectId(id) {
    return {
        toString() {
            return id;
        },
    };
}

/**
 * Gera um token de cliente para endpoints autenticados de preferências.
 *
 * @function makeToken
 * @returns {string} JWT de sessão válido para os testes.
 */
function makeToken() {
    return createSessionToken({
        id: userId,
        email: "cliente@orelle.test",
        role: "cliente",
    });
}

/**
 * Cria preferências mock com valores base reutilizáveis nos testes.
 *
 * @function makePreference
 * @param {object} [overrides={}] - Campos a sobrepor nas preferências base.
 * @returns {object} Preferências mock.
 */
function makePreference(overrides = {}) {
    return {
        _id: objectId("pref-1"),
        userId: objectId(userId),
        favoriteBrandNames: ["Orelle"],
        favoriteProductIds: [],
        updatedAt: new Date("2026-05-29T10:00:00.000Z"),
        ...overrides,
    };
}

describe("BK-MF0-06 / RF06 - preferencias", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("normaliza marcas favoritas", () => {
        const input = validatePreferencesInput({
            favoriteBrandNames: [" Orelle ", "Orelle", "The Ordinary"],
            favoriteProductIds: [],
        });

        expect(input.favoriteBrandNames).toEqual(["Orelle", "The Ordinary"]);
    });

    it("aceita IDs de produtos favoritos com formato ObjectId", () => {
        const input = validatePreferencesInput({
            favoriteBrandNames: ["Orelle"],
            favoriteProductIds: [productId, productId],
        });

        expect(input.favoriteProductIds).toEqual([productId]);
    });

    it("rejeita IDs de produtos favoritos com formato invalido", () => {
        expect(() =>
            validatePreferencesInput({
                favoriteBrandNames: ["Orelle"],
                favoriteProductIds: ["produto-1"],
            }),
        ).toThrow("Preferencias invalidas");
    });

    it("limita excesso de marcas", () => {
        expect(() =>
            validatePreferencesInput({
                favoriteBrandNames: Array.from(
                    { length: 11 },
                    (_, index) => `Marca ${index}`,
                ),
            }),
        ).toThrow("Preferencias invalidas");
    });

    it("consulta preferencias autenticadas", async () => {
        Preference.findOneAndUpdate.mockResolvedValueOnce(makePreference());

        const response = await request(createApp())
            .get("/api/preferences/me")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.preferences.userId).toBe(userId);
    });

    it("atualiza preferencias com produto favorito existente", async () => {
        Product.countDocuments.mockResolvedValueOnce(1);
        Preference.findOneAndUpdate.mockResolvedValueOnce(
            makePreference({
                favoriteProductIds: [objectId(productId)],
            }),
        );

        const response = await request(createApp())
            .put("/api/preferences/me")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                favoriteBrandNames: ["Orelle"],
                favoriteProductIds: [productId],
            });

        expect(response.status).toBe(200);
        expect(response.body.preferences.favoriteProductIds).toEqual([
            productId,
        ]);
    });

    it("bloqueia preferencias sem sessão", async () => {
        const response = await request(createApp())
            .put("/api/preferences/me")
            .send({ favoriteBrandNames: ["Orelle"] });

        expect(response.status).toBe(401);
    });

    it("rejeita produto favorito com ID invalido por HTTP", async () => {
        const response = await request(createApp())
            .put("/api/preferences/me")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                favoriteBrandNames: ["Orelle"],
                favoriteProductIds: ["produto-1"],
            });

        expect(response.status).toBe(400);
    });

    it("rejeita produto favorito inexistente", async () => {
        Product.countDocuments.mockResolvedValueOnce(0);

        const response = await request(createApp())
            .put("/api/preferences/me")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                favoriteBrandNames: ["Orelle"],
                favoriteProductIds: [productId],
            });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe(
            "Um ou mais produtos favoritos não existem",
        );
    });
});
