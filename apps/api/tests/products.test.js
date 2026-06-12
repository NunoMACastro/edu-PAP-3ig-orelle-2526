/**
 * Testes do BK-MF0-07 / RF07.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { Product } from "../src/models/product.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import { validateProductInput } from "../src/validators/product.validator.js";

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        create: vi.fn(),
        findByIdAndUpdate: vi.fn(),
    },
}));

function makeToken(role = ROLES.ADMIN) {
    return createSessionToken({
        id: `${role}-1`,
        email: `${role}@orelle.test`,
        role,
    });
}

const validProductPayload = {
    name: "Gel de Limpeza Suave",
    brandName: "Orelle",
    description:
        "Gel cosmetico de limpeza diaria para pele mista, sem promessa clinica.",
    ingredientNames: ["agua", "glicerina"],
    skinTypes: ["mista"],
    imageUrl: "https://images.orelle.local/gel.png",
    priceCents: 1290,
    stock: 10,
};

describe("BK-MF0-07 / RF07 - produtos", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("aceita produto valido", () => {
        const input = validateProductInput(validProductPayload);

        expect(input.priceCents).toBe(1290);
    });

    it("admin cria produto por endpoint", async () => {
        Product.create.mockResolvedValueOnce({
            _id: { toString: () => "product-1" },
            ...validProductPayload,
            categoryIds: [],
            createdBy: { toString: () => "administrador-1" },
            createdAt: new Date("2026-05-29T10:00:00.000Z"),
            updatedAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const response = await request(createApp())
            .post("/api/admin/products")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send(validProductPayload);

        expect(response.status).toBe(201);
        expect(response.body.product.name).toBe(validProductPayload.name);
    });

    it("cliente nao cria produto", async () => {
        const response = await request(createApp())
            .post("/api/admin/products")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE)}`])
            .send(validProductPayload);

        expect(response.status).toBe(403);
    });

    it("sem sessao nao cria produto", async () => {
        const response = await request(createApp())
            .post("/api/admin/products")
            .send(validProductPayload);

        expect(response.status).toBe(401);
    });

    it("rejeita preço negativo", () => {
        expect(() =>
            validateProductInput({
                name: "Produto Teste",
                brandName: "Orelle",
                description:
                    "Descrição cosmética sem claims médicos para teste.",
                ingredientNames: ["agua"],
                skinTypes: ["mista"],
                imageUrl: "https://images.orelle.local/produto.png",
                priceCents: -1,
                stock: 10,
            }),
        ).toThrow("Produto invalido");
    });

    it("endpoint rejeita stock negativo", async () => {
        const response = await request(createApp())
            .post("/api/admin/products")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ ...validProductPayload, stock: -1 });

        expect(response.status).toBe(400);
    });

    it("endpoint rejeita campos obrigatorios em falta", async () => {
        const response = await request(createApp())
            .post("/api/admin/products")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ ...validProductPayload, name: "" });

        expect(response.status).toBe(400);
    });

    it("rejeita claim medico", () => {
        expect(() =>
            validateProductInput({
                name: "Produto Teste",
                brandName: "Orelle",
                description: "Este produto cura acne e remove rugas.",
                ingredientNames: ["agua"],
                skinTypes: ["mista"],
                imageUrl: "https://images.orelle.local/produto.png",
                priceCents: 1000,
                stock: 10,
            }),
        ).toThrow("Produto invalido");
    });
});
