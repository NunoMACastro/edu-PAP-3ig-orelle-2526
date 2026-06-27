import { describe, expect, it } from "vitest";
import { validateFaceConsentInput } from "../src/validators/face-photo.validator.js";

describe("BK-MF7-01 consentimento facial", () => {
    it("aceita apenas consentimento afirmativo", () => {
        expect(validateFaceConsentInput({ accepted: true })).toEqual({
            version: "face-analysis-v1",
        });
    });

    it("recusa ausência de consentimento explícito", () => {
        // Este negativo prova que a API não depende apenas da checkbox visual.
        expect(() => validateFaceConsentInput({ accepted: false })).toThrow(
            "Consentimento facial obrigatório",
        );
    });
});