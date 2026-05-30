import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
    },
}));

describe("BK-MF0-02 / RF02 - sessao segura", () => {
    it("faz login e cria cookie HttpOnly", async () => {
        const passwordHash = await bcrypt.hash("Senha12345", 12);

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
            .send({ email: "cliente@orelle.test", password: "Senha12345" });

        expect(response.status).toBe(200);
        expect(response.headers["set-cookie"].join(";")).toContain("HttpOnly");
        expect(response.headers["set-cookie"].join(";")).toContain(
            "SameSite=Lax",
        );
    });

    it("rejeita password errada sem criar cookie", async () => {
        const passwordHash = await bcrypt.hash("Senha12345", 12);

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
        expect(response.body.error.message).toBe("Autenticacao obrigatoria");
    });
});