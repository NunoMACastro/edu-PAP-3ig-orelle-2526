/**
 * Testes do BK-MF0-07 / RF07.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { Product } from "../src/models/product.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import {
    validateProductAiMetadataInput,
    validateProductInput,
} from "../src/validators/product.validator.js";

vi.mock("../src/models/product.model.js", () => ({
    Product: {
        create: vi.fn(),
        countDocuments: vi.fn(),
        find: vi.fn(),
        findById: vi.fn(),
        findOneAndUpdate: vi.fn(),
        findByIdAndUpdate: vi.fn(),
        exists: vi.fn(),
    },
}));

/**
 * Cria um identificador mínimo com a interface usada pelos DTOs.
 *
 * @function objectId
 * @param {string} id - Valor textual a devolver por `toString`.
 * @returns {{toString: Function}} Objeto que simula um ObjectId Mongoose.
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

/** Simula a cadeia `find().sort().skip().limit()` da listagem paginada. */
function mockAdminProductQuery(result) {
    const limit = vi.fn().mockResolvedValue(result);
    const skip = vi.fn().mockReturnValue({ limit });
    const sort = vi.fn().mockReturnValue({ skip });
    Product.find.mockReturnValueOnce({ sort });
    return { sort, skip, limit };
}

/**
 * Gera um token para testar endpoints de administração de produtos.
 *
 * @function makeToken
 * @param {string} [role=ROLES.ADMIN] - Role a colocar no token.
 * @returns {string} Token opaco de sessão válido para os testes.
 */
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
            _id: objectId("product-1"),
            ...validProductPayload,
            categoryIds: [],
            createdBy: objectId("administrador-1"),
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

    it("admin lista produtos para curadoria sem pedir IDs técnicos na pesquisa", async () => {
        Product.countDocuments.mockResolvedValueOnce(1);
        mockAdminProductQuery([
            {
                _id: objectId("product-1"),
                ...validProductPayload,
                categoryIds: [],
                aiEligible: false,
                concernTags: [],
                routineSteps: [],
                inciIngredients: ["agua", "glicerina"],
                attributes: {},
                variants: [],
                createdBy: objectId("administrador-1"),
            },
        ]);

        const response = await request(createApp())
            .get("/api/admin/products")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.products[0]).toMatchObject({
            name: validProductPayload.name,
            aiEligible: false,
        });
        expect(response.body.pagination).toEqual({
            page: 1,
            pageSize: 20,
            total: 1,
            totalPages: 1,
        });
    });

    it("pagina e filtra produtos no servidor com pesquisa literal", async () => {
        Product.countDocuments.mockResolvedValueOnce(11);
        const query = mockAdminProductQuery([]);

        const response = await request(createApp())
            .get(
                "/api/admin/products?page=2&pageSize=10&search=Orélle.*&aiEligibility=ineligible&stock=empty",
            )
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.pagination).toEqual({
            page: 2,
            pageSize: 10,
            total: 11,
            totalPages: 2,
        });
        expect(query.skip).toHaveBeenCalledWith(10);
        expect(query.limit).toHaveBeenCalledWith(10);
        const mongoFilter = Product.find.mock.calls[0][0];
        expect(mongoFilter.aiEligible).toBe(false);
        expect(mongoFilter.stock).toBe(0);
        expect(mongoFilter.$or[0].name.test("Orélle.*")).toBe(true);
        expect(mongoFilter.$or[0].name.test("OrélleABC")).toBe(false);
    });

    it("rejeita paginação administrativa inválida antes de consultar MongoDB", async () => {
        const response = await request(createApp())
            .get("/api/admin/products?page=0&pageSize=101&stock=negative")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(400);
        expect(Product.find).not.toHaveBeenCalled();
        expect(Product.countDocuments).not.toHaveBeenCalled();
    });

    it("admin cura metadata IA preservando stock agregado", async () => {
        const productDocument = {
            _id: objectId("507f1f77bcf86cd799439011"),
            ...validProductPayload,
            categoryIds: [],
            aiEligible: false,
            concernTags: [],
            routineSteps: [],
            inciIngredients: ["agua", "glicerina"],
            attributes: {},
            variants: [],
            createdBy: objectId("administrador-1"),
        };
        const curatedDocument = {
            ...productDocument,
            aiEligible: true,
            concernTags: ["hydration_barrier"],
            routineSteps: ["moisturize"],
        };
        Product.findById.mockResolvedValueOnce(productDocument);
        Product.findOneAndUpdate.mockResolvedValueOnce(curatedDocument);

        const response = await request(createApp())
            .patch(
                "/api/admin/products/507f1f77bcf86cd799439011/ai-metadata",
            )
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                aiEligible: true,
                concernTags: ["hydration_barrier"],
                routineSteps: ["moisturize"],
                inciIngredients: ["aqua", "glycerin"],
                attributes: {
                    texture: "cream",
                    fragranceFree: true,
                },
                variants: [],
            });

        expect(response.status).toBe(200);
        expect(response.body.product.aiEligible).toBe(true);
        expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: "507f1f77bcf86cd799439011", stock: 10 },
            {
                $set: expect.objectContaining({
                    aiEligible: true,
                    concernTags: ["hydration_barrier"],
                }),
            },
            { new: true, runValidators: true },
        );
    });

    it("rejeita variantes cuja soma não coincide com o stock confirmado", () => {
        expect(() =>
            validateProductAiMetadataInput(
                {
                    aiEligible: false,
                    concernTags: [],
                    routineSteps: [],
                    inciIngredients: ["aqua"],
                    variants: [
                        { variantId: "claro", label: "Claro", stock: 9 },
                    ],
                },
                10,
            ),
        ).toThrow("Metadata IA do produto inválida");
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
