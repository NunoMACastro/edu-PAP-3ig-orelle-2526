/**
 * Testes do BK-MF0-02 / RF02.
 *
 * Confirmam cookie HttpOnly, erro de password e bloqueio sem sessao.
 */
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
    },
}));

describe("BK-MF0-02 / RF02 - sessão segura", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("faz login e cria cookie HttpOnly", async () => {
        const passwordHash = await bcrypt.hash("PalavraPasse12345", 12);

        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                _id: { toString: () => "user-1" },
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

        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"].join(";")).toContain("HttpOnly");
        expect(response.headers["set-cookie"].join(";")).toContain(
            "SameSite=Lax",
        );
    });

    it("rejeita password errada sem criar cookie", async () => {
        const passwordHash = await bcrypt.hash("PalavraPasse12345", 12);

        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({
                _id: { toString: () => "user-1" },
                email: "cliente@orelle.test",
                role: "cliente",
                passwordHash,
            }),
        });

        const response = await request(createApp())
            .post("/api/auth/login")
            .send({ email: "cliente@orelle.test", password: "Errada123" });

        expect(response.status).toBe(401);
        expect(response.headers["set-cookie"]).toBeUndefined();
    });

    it("bloqueia /me sem cookie", async () => {
        const response = await request(createApp()).get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(response.body.error.message).toBe("Autenticação obrigatória");
    });

    it("logout limpa cookie e pedido seguinte fica sem sessão", async () => {
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

        expect(meBeforeLogout.status).toBe(200);

        const logout = await agent
            .post("/api/auth/logout")
            .set("Cookie", [`orelle_session=${token}`]);

        expect(logout.status).toBe(204);
        expect(logout.headers["set-cookie"].join(";")).toContain(
            "orelle_session=",
        );

        const meAfterLogout = await agent.get("/api/auth/me");

        expect(meAfterLogout.status).toBe(401);
    });
});
