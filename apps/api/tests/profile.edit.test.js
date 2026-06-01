/**
 * Testes do BK-MF0-04 / RF04.
 *
 * Cobrem edicao HTTP do perfil e validacao da fotografia controlada, mantendo
 * upload real bloqueado neste BK.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Profile } from "../src/models/profile.model.js";
import { createSessionToken } from "../src/services/session.service.js";
import { validateProfilePhotoInput } from "../src/validators/profile-photo.validator.js";

vi.mock("../src/models/profile.model.js", async () => {
    const actual = await vi.importActual("../src/models/profile.model.js");
    return {
        ...actual,
        Profile: {
            findOneAndUpdate: vi.fn(),
        },
    };
});

function makeToken() {
    return createSessionToken({
        id: "user-1",
        email: "marta@orelle.test",
        role: "cliente",
    });
}

function makeProfile(overrides = {}) {
    return {
        _id: { toString: () => "profile-1" },
        userId: { toString: () => "user-1" },
        nome: "Marta Silva",
        idade: 19,
        tipoDePele: "mista",
        genero: "feminino",
        objetivos: ["hidratar"],
        profilePhotoUrl: "",
        profilePhotoMode: "stub_url",
        profilePhotoUpdatedAt: null,
        ...overrides,
    };
}

describe("BK-MF0-04 / RF04 - edicao de perfil", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("edita perfil autenticado", async () => {
        Profile.findOneAndUpdate.mockResolvedValueOnce(makeProfile());

        const response = await request(createApp())
            .put("/api/profile/me")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                nome: "Marta Silva",
                idade: 19,
                tipoDePele: "mista",
                genero: "feminino",
                objetivos: ["hidratar"],
            });

        expect(response.status).toBe(200);
        expect(response.body.profile.userId).toBe("user-1");
    });

    it("bloqueia edicao sem sessão", async () => {
        const response = await request(createApp())
            .put("/api/profile/me")
            .send({ nome: "Marta" });

        expect(response.status).toBe(401);
    });

    it("devolve 404 quando perfil ainda nao existe", async () => {
        Profile.findOneAndUpdate.mockResolvedValueOnce(null);

        const response = await request(createApp())
            .put("/api/profile/me")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({ nome: "Marta Silva" });

        expect(response.status).toBe(404);
    });

    it("atualiza fotografia stub por HTTP", async () => {
        Profile.findOneAndUpdate.mockResolvedValueOnce(
            makeProfile({
                profilePhotoUrl: "http://localhost/avatar-demo.png",
                profilePhotoUpdatedAt: new Date("2026-05-29T10:00:00.000Z"),
            }),
        );

        const response = await request(createApp())
            .patch("/api/profile/me/photo")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                profilePhotoMode: "stub_url",
                profilePhotoUrl: "http://localhost/avatar-demo.png",
            });

        expect(response.status).toBe(200);
        expect(response.body.profile.profilePhotoMode).toBe("stub_url");
    });

    it("bloqueia secure_upload neste BK", async () => {
        const response = await request(createApp())
            .patch("/api/profile/me/photo")
            .set("Cookie", [`orelle_session=${makeToken()}`])
            .send({
                profilePhotoMode: "secure_upload",
                profilePhotoUrl: "http://localhost/avatar-demo.png",
            });

        expect(response.status).toBe(403);
    });
});

describe("BK-MF0-04 / RF04 - fotografia segura", () => {
    it("aceita URL controlado em modo stub_url", () => {
        const input = validateProfilePhotoInput({
            profilePhotoMode: "stub_url",
            profilePhotoUrl: "http://localhost/avatar-demo.png",
        });

        expect(input.profilePhotoMode).toBe("stub_url");
    });

    it("rejeita origem externa não controlada", () => {
        expect(() =>
            validateProfilePhotoInput({
                profilePhotoMode: "stub_url",
                profilePhotoUrl: "https://site-externo.example/avatar.png",
            }),
        ).toThrow("origem controlada");
    });
});
