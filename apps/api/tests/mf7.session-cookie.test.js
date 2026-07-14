/**
 * Testes do BK-MF7-03 / RNF14.
 *
 * A MF7 consolida a sessão por cookie HttpOnly como fronteira transversal para
 * consentimento, dados biométricos, exports e checkout. Estes testes provam o
 * contrato de login, `/auth/me`, cookie inválido e logout sem depender de seeds.
 */
import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";
import {
    createSessionToken,
    SESSION_COOKIE_NAME,
} from "../src/services/session.service.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
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

/**
 * Cria um utilizador mockado com hash bcrypt real.
 *
 * @async
 * @function mockLoginUser
 * @returns {Promise<void>}
 */
async function mockLoginUser() {
    const passwordHash = await bcrypt.hash("PalavraPasse12345", 12);

    User.findOne.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue({
            _id: objectId("user-1"),
            email: "cliente@orelle.test",
            role: "cliente",
            passwordHash,
            createdAt: new Date("2026-05-29T10:00:00.000Z"),
        }),
    });
}

/**
 * Cria um cookie de sessão assinado para pedidos autenticados.
 *
 * @function makeSessionCookie
 * @returns {string[]} Header Cookie compatível com Supertest.
 */
function makeSessionCookie() {
    const token = createSessionToken({
        id: "user-1",
        email: "cliente@orelle.test",
        role: "cliente",
    });

    return [`${SESSION_COOKIE_NAME}=${token}`];
}

describe("BK-MF7-03 / RNF14 - cookies HttpOnly", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("bloqueia /auth/me sem cookie de sessão", async () => {
        const response = await request(createApp()).get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Autenticação obrigatória");
    });

    it("faz login, cria cookie HttpOnly e não devolve token no body", async () => {
        await mockLoginUser();

        const response = await request(createApp())
            .post("/api/auth/login")
            .send({
                email: "cliente@orelle.test",
                password: "PalavraPasse12345",
            });

        const setCookie = response.headers["set-cookie"].join(";");

        expect(response.status).toBe(200);
        expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
        expect(setCookie).toContain("HttpOnly");
        expect(setCookie).toContain("SameSite=Lax");
        expect(response.body.user.email).toBe("cliente@orelle.test");
        expect(response.body.token).toBeUndefined();
    });

    it("aceita /auth/me com cookie assinado", async () => {
        const response = await request(createApp())
            .get("/api/auth/me")
            .set("Cookie", makeSessionCookie());

        expect(response.status).toBe(200);
        expect(response.body.user).toEqual({
            id: "user-1",
            email: "cliente@orelle.test",
            role: "cliente",
        });
    });

    it("rejeita cookie inválido ou assinado com segredo errado", async () => {
        const response = await request(createApp())
            .get("/api/auth/me")
            .set("Cookie", [`${SESSION_COOKIE_NAME}=token-alterado`]);

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Sessão inválida ou expirada");
    });

    it("limpa cookie no logout e bloqueia /auth/me no mesmo agente", async () => {
        const app = createApp();
        const agent = request.agent(app);
        const cookie = makeSessionCookie();

        const meBeforeLogout = await agent
            .get("/api/auth/me")
            .set("Cookie", cookie);

        expect(meBeforeLogout.status).toBe(200);

        const logout = await agent
            .post("/api/auth/logout")
            .set("Cookie", cookie);

        expect(logout.status).toBe(204);
        expect(logout.headers["set-cookie"].join(";")).toContain(
            `${SESSION_COOKIE_NAME}=`,
        );

        const meAfterLogout = await agent.get("/api/auth/me");

        expect(meAfterLogout.status).toBe(401);
    });
});
