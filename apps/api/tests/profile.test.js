/**
 * Testes do BK-MF0-03 / RF03.
 *
 * Validam criacao de perfil autenticado e negativos principais.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Profile } from "../src/models/profile.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/profile.model.js", async () => {
    const actual = await vi.importActual("../src/models/profile.model.js");
    return {
        ...actual,
        Profile: {
            findOne: vi.fn(),
            create: vi.fn(),
        },
    };
});

describe("BK-MF0-03 / RF03 - perfil", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("cria perfil autenticado", async () => {
        Profile.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue(null),
        });
        Profile.create.mockResolvedValueOnce({
            _id: { toString: () => "profile-1" },
            userId: { toString: () => "user-1" },
            nome: "Marta Silva",
            idade: 18,
            tipoDePele: "mista",
            genero: "feminino",
            objetivos: ["hidratar"],
        });

        const token = createSessionToken({
            id: "user-1",
            email: "marta@orelle.test",
            role: "cliente",
        });

        const response = await request(createApp())
            .post("/api/profile/me")
            .set("Cookie", [`orelle_session=${token}`])
            .send({
                nome: "Marta Silva",
                idade: 18,
                tipoDePele: "mista",
                genero: "feminino",
                objetivos: ["hidratar"],
            });

        expect(response.status).toBe(201);
        expect(response.body.profile.userId).toBe("user-1");
    });

    it("bloqueia pedido sem sessão", async () => {
        const response = await request(createApp())
            .post("/api/profile/me")
            .send({});

        expect(response.status).toBe(401);
    });

    it("consulta perfil autenticado", async () => {
        Profile.findOne.mockResolvedValueOnce({
            _id: { toString: () => "profile-1" },
            userId: { toString: () => "user-1" },
            nome: "Marta Silva",
            idade: 18,
            tipoDePele: "mista",
            genero: "feminino",
            objetivos: ["hidratar"],
        });

        const token = createSessionToken({
            id: "user-1",
            email: "marta@orelle.test",
            role: "cliente",
        });

        const response = await request(createApp())
            .get("/api/profile/me")
            .set("Cookie", [`orelle_session=${token}`]);

        expect(response.status).toBe(200);
        expect(response.body.profile.userId).toBe("user-1");
    });

    it("rejeita segundo perfil para o mesmo utilizador", async () => {
        Profile.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({ _id: "profile-1" }),
        });

        const token = createSessionToken({
            id: "user-1",
            email: "marta@orelle.test",
            role: "cliente",
        });

        const response = await request(createApp())
            .post("/api/profile/me")
            .set("Cookie", [`orelle_session=${token}`])
            .send({
                nome: "Marta Silva",
                idade: 18,
                tipoDePele: "mista",
                genero: "feminino",
                objetivos: ["hidratar"],
            });

        expect(response.status).toBe(409);
    });

    it("rejeita tipo de pele invalido", async () => {
        const token = createSessionToken({
            id: "user-1",
            email: "marta@orelle.test",
            role: "cliente",
        });

        const response = await request(createApp())
            .post("/api/profile/me")
            .set("Cookie", [`orelle_session=${token}`])
            .send({
                nome: "Marta Silva",
                idade: 18,
                tipoDePele: "diagnóstico-medico",
                genero: "feminino",
                objetivos: ["hidratar"],
            });

        expect(response.status).toBe(400);
    });
});
