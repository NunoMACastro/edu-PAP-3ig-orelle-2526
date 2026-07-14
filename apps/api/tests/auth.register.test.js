/**
 * Testes do BK-MF0-01 / RF01.
 *
 * Cobrem registo positivo, validacao e resposta neutra para email duplicado.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        create: vi.fn(),
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

describe("BK-MF0-01 / RF01 - registo", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("cria utilizador valido sem expor password", async () => {
        User.create.mockResolvedValueOnce({
            _id: objectId("user-1"),
            email: "cliente@orelle.test",
            role: "cliente",
            createdAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const response = await request(createApp())
            .post("/api/auth/register")
            .send({
                email: "cliente@orelle.test",
                password: "PalavraPasse12345",
            });

        expect(response.status).toBe(202);
        expect(response.body).toEqual({
            message:
                "Pedido de registo recebido. Se este email estiver disponível, a conta será criada.",
        });
        expect(response.body.user).toBeUndefined();
    });

    it("rejeita email invalido", async () => {
        const response = await request(createApp())
            .post("/api/auth/register")
            .send({ email: "email-invalido", password: "PalavraPasse12345" });

        expect(response.status).toBe(400);
        expect(response.body.error.details.email).toBe("Email invalido");
    });

    it("rejeita password fraca", async () => {
        const response = await request(createApp())
            .post("/api/auth/register")
            .send({ email: "cliente@orelle.test", password: "curta" });

        expect(response.status).toBe(400);
        expect(response.body.error.details.password).toBeDefined();
    });

    it("nao revela email duplicado na resposta", async () => {
        User.create.mockRejectedValueOnce(
            Object.assign(new Error("E11000 duplicate key"), {
                code: 11000,
                keyPattern: { email: 1 },
            }),
        );

        const response = await request(createApp())
            .post("/api/auth/register")
            .send({
                email: "cliente@orelle.test",
                password: "PalavraPasse12345",
            });

        expect(response.status).toBe(202);
        expect(response.body).toEqual({
            message:
                "Pedido de registo recebido. Se este email estiver disponível, a conta será criada.",
        });
    });
});
