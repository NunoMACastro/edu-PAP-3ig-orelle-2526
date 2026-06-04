import { describe, expect, it } from "vitest";
import { validateProfilePhotoInput } from "../src/validators/profile-photo.validator.js";

describe("BK-MF0-04 / RF04 - fotografia segura", () => {
    it("aceita URL controlado em modo stub_url", () => {
        const input = validateProfilePhotoInput({
            profilePhotoMode: "stub_url",
            profilePhotoUrl: "http://localhost/avatar-demo.png",
        });

        expect(input.profilePhotoMode).toBe("stub_url");
    });

    it("bloqueia secure_upload neste BK", () => {
        expect(() =>
            validateProfilePhotoInput({
                profilePhotoMode: "secure_upload",
                profilePhotoUrl: "http://localhost/avatar-demo.png",
            }),
        ).toThrow("Upload real de fotografia bloqueado");
    });

    it("rejeita origem externa nao controlada", () => {
        expect(() =>
            validateProfilePhotoInput({
                profilePhotoMode: "stub_url",
                profilePhotoUrl: "https://site-externo.example/avatar.png",
            }),
        ).toThrow("origem controlada");
    });
});