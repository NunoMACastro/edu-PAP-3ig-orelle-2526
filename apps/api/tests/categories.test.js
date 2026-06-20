/**
 * Testes do BK-MF0-08 / RF08.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { Category } from "../src/models/category.model.js";
import { Product } from "../src/models/product.model.js";
import {
    assignCategoriesToProduct,
    seedCategory,
} from "../src/services/category.service.js";
import { createSessionToken } from "../src/services/session.service.js";
import {
    slugify,
    validateCategoryIds,
    validateCategoryInput,
} from "../src/validators/category.validator.js";

vi.mock("../src/models/category.model.js", () => ({
    Category: {
        countDocuments: vi.fn(),
        create: vi.fn(),
        find: vi.fn(),
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

const categoryId = "66c000000000000000000001";
const productId = "66d000000000000000000001";

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
 * Gera um token de sessão para testar endpoints protegidos por role.
 *
 * @function makeToken
 * @param {string} [role=ROLES.ADMIN] - Role que ficará no token.
 * @returns {string} JWT de sessão válido para os testes.
 */
function makeToken(role = ROLES.ADMIN) {
    return createSessionToken({
        id: `${role}-1`,
        email: `${role}@orelle.test`,
        role,
    });
}

/**
 * Cria uma categoria mock com os campos usados pelos services e controllers.
 *
 * @function makeCategory
 * @param {object} [overrides={}] - Campos a sobrepor no mock.
 * @returns {object} Categoria mock.
 */
function makeCategory(overrides = {}) {
    return {
        _id: objectId(categoryId),
        name: "Limpeza",
        slug: "limpeza",
        description: "",
        isActive: true,
        ...overrides,
    };
}

describe("BK-MF0-08 / RF08 - categorias", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("cria slug estavel", () => {
        expect(slugify("Protetor Solar")).toBe("protetor-solar");
    });

    it("valida categoria", () => {
        const input = validateCategoryInput({ name: "Limpeza" });

        expect(input.slug).toBe("limpeza");
    });

    it("rejeita categoryIds invalidos", () => {
        expect(() => validateCategoryIds({ categoryIds: ["abc"] })).toThrow(
            "categoryIds contem IDs invalidos",
        );
    });

    it("lista categorias por endpoint admin", async () => {
        Category.find.mockReturnValueOnce({
            sort: vi.fn().mockResolvedValue([makeCategory()]),
        });

        const response = await request(createApp())
            .get("/api/admin/categories")
            .set("Cookie", [`orelle_session=${makeToken()}`]);

        expect(response.status).toBe(200);
        expect(response.body.categories).toHaveLength(1);
        expect(response.body.categories[0].slug).toBe("limpeza");
        expect(response.body.categories[0].isActive).toBe(true);
    });

    it("cria categoria por endpoint admin", async () => {
        Category.create.mockResolvedValueOnce(makeCategory());

        const response = await request(createApp())
            .post("/api/admin/categories")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ name: "Limpeza" });

        expect(response.status).toBe(201);
        expect(response.body.category.slug).toBe("limpeza");
        expect(response.body.category.isActive).toBe(true);
    });

    it("associa categorias existentes a produto existente", async () => {
        Category.countDocuments.mockResolvedValueOnce(1);
        Product.findByIdAndUpdate.mockResolvedValueOnce({
            _id: objectId(productId),
            name: "Gel de Limpeza Suave",
            categoryIds: [objectId(categoryId)],
        });

        const response = await request(createApp())
            .patch(`/api/admin/products/${productId}/categories`)
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ categoryIds: [categoryId] });

        expect(response.status).toBe(200);
        expect(response.body.product.categoryIds).toEqual([categoryId]);
    });

    it("rejeita associacao com categoria inexistente", async () => {
        Category.countDocuments.mockResolvedValueOnce(0);

        await expect(
            assignCategoriesToProduct(productId, [categoryId]),
        ).rejects.toThrow("Uma ou mais categorias não existem");
    });

    it("devolve 404 quando produto da associacao nao existe", async () => {
        Category.countDocuments.mockResolvedValueOnce(1);
        Product.findByIdAndUpdate.mockResolvedValueOnce(null);

        const response = await request(createApp())
            .patch(`/api/admin/products/${productId}/categories`)
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ categoryIds: [categoryId] });

        expect(response.status).toBe(404);
    });

    it("rejeita productId malformado por endpoint", async () => {
        const response = await request(createApp())
            .patch("/api/admin/products/produto-invalido/categories")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ categoryIds: [categoryId] });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBe("ID de produto invalido");
        expect(Category.countDocuments).not.toHaveBeenCalled();
        expect(Product.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("bloqueia cliente em endpoints admin de categorias", async () => {
        const response = await request(createApp())
            .get("/api/admin/categories")
            .set("Cookie", [`orelle_session=${makeToken(ROLES.CLIENTE)}`]);

        expect(response.status).toBe(403);
    });

    it("bloqueia endpoints admin de categorias sem sessão", async () => {
        const response = await request(createApp()).get(
            "/api/admin/categories",
        );

        expect(response.status).toBe(401);
    });

    it("mantem seed idempotente por slug", async () => {
        Category.findOneAndUpdate.mockResolvedValueOnce(makeCategory());

        const category = await seedCategory({
            name: "Limpeza",
            slug: "limpeza",
            description: "",
        });

        expect(category.slug).toBe("limpeza");
        expect(Category.findOneAndUpdate).toHaveBeenCalledWith(
            { slug: "limpeza" },
            {
                $setOnInsert: {
                    name: "Limpeza",
                    slug: "limpeza",
                    description: "",
                },
            },
            { upsert: true, new: true },
        );
    });
});
