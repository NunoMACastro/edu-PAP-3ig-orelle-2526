/**
 * Testes unitários da confirmação irreversível de eliminação da conta.
 */
import { describe, expect, it } from "vitest";
import {
    ACCOUNT_ERASURE_CONFIRMATION,
    validateAccountErasureInput,
} from "../src/validators/account-erasure.validator.js";

describe("ORELLE-AUD-P1-004 - validação da eliminação da conta", () => {
    it("aceita apenas a confirmação literal e passwords entre 8 e 72 bytes", () => {
        const minimum = "Abcdefg1";
        const maximum = `A1${"x".repeat(70)}`;

        expect(
            validateAccountErasureInput({
                password: minimum,
                confirmation: ACCOUNT_ERASURE_CONFIRMATION,
            }),
        ).toEqual({ password: minimum, confirmation: "ELIMINAR" });
        expect(
            validateAccountErasureInput({
                password: maximum,
                confirmation: ACCOUNT_ERASURE_CONFIRMATION,
            }),
        ).toEqual({ password: maximum, confirmation: "ELIMINAR" });
    });

    it("não normaliza variantes visuais da confirmação destrutiva", () => {
        for (const confirmation of [
            "eliminar",
            " ELIMINAR",
            "ELIMINAR ",
            "Eliminar",
            undefined,
        ]) {
            expect(() =>
                validateAccountErasureInput({
                    password: "PalavraPasse123",
                    confirmation,
                }),
            ).toThrowError(
                expect.objectContaining({
                    statusCode: 400,
                    details: expect.objectContaining({
                        confirmation: expect.stringContaining("ELIMINAR"),
                    }),
                }),
            );
        }
    });

    it("mede UTF-8 e rejeita password ausente, curta ou acima de 72 bytes", () => {
        for (const password of [undefined, 12345678, "Abcde12", `A1${"á".repeat(36)}`]) {
            expect(() =>
                validateAccountErasureInput({
                    password,
                    confirmation: "ELIMINAR",
                }),
            ).toThrowError(
                expect.objectContaining({
                    statusCode: 400,
                    details: expect.objectContaining({
                        password: expect.stringContaining("72 bytes"),
                    }),
                }),
            );
        }
    });
});
