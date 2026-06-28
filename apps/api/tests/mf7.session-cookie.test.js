import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";

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
        toString() {
            return id;
        },
    };
}

describe("BK-MF7-03 sessões HttpOnly", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("bloqueia /auth/me sem cookie", async () => {
        const response = await request(createApp()).get("/api/auth/me");

        expect(response.status).toBe(401);
    });

    it("faz login, cria cookie HttpOnly e não devolve token no body", async () => {
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

        const response = await request(createApp())
            .post("/api/auth/login")
            .send({
                email: "cliente@orelle.test",
                password: "PalavraPasse12345",
            });

        // O teste cria o utilizador em mock para não depender de seeds ou estado local.
        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"].join(";")).toContain("HttpOnly");
        expect(response.headers["set-cookie"].join(";")).toContain("SameSite=Lax");
        expect(response.body.user.email).toBe("cliente@orelle.test");
        expect(response.body.token).toBeUndefined();
    });

    it("aceita /auth/me com cookie assinado e rejeita depois do logout", async () => {
        const app = createApp();
        const agent = request.agent(app);
        const token = createSessionToken({
            id: "user-1",
            email: "cliente@orelle.test",
            role: "cliente",
        });

        const meBeforeLogout = await agent
            .get("/api/auth/me")
            .set("Cookie", [`orelle_session=${token}`]);

        // O cookie assinado é suficiente para identificar a sessão sem payload no body.
        expect(meBeforeLogout.status).toBe(200);
        expect(meBeforeLogout.body.user.email).toBe("cliente@orelle.test");

        const logout = await agent
            .post("/api/auth/logout")
            .set("Cookie", [`orelle_session=${token}`]);

        expect(logout.status).toBe(204);
        expect(logout.headers["set-cookie"].join(";")).toContain(
            "orelle_session=",
        );

        // Depois do logout, o mesmo agente já não deve conseguir ler /auth/me.
        const meAfterLogout = await agent.get("/api/auth/me");

        expect(meAfterLogout.status).toBe(401);
    });
});