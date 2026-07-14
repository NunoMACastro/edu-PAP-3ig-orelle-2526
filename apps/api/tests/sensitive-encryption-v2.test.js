/**
 * Contratos criptográficos puros do envelope contextual v2.
 * Não usa rede, ficheiros nem base remota.
 */
import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import {
    decryptJsonForMigration,
    decryptJsonWithContext,
    encryptJson,
    encryptJsonWithContext,
    isContextualEncryptedPayload,
} from "../src/utils/encryption.util.js";

function context(owner, field = "findings") {
    return { collection: "faceanalyses", owner, field };
}

describe("AES-GCM contextual v2", () => {
    it("autentica coleção, owner e campo sem expor o valor no envelope", () => {
        const owner = new mongoose.Types.ObjectId();
        const logicalValue = { category: "private-fixture", level: 3 };
        const payload = encryptJsonWithContext(logicalValue, context(owner));

        expect(isContextualEncryptedPayload(payload)).toBe(true);
        expect(payload).toMatchObject({
            encrypted: true,
            algorithm: "aes-256-gcm",
            keyVersion: 2,
            aadHash: expect.any(String),
        });
        expect(JSON.stringify(payload)).not.toContain("private-fixture");
        expect(decryptJsonWithContext(payload, context(owner))).toEqual(logicalValue);
    });

    it("recusa troca de owner, campo e adulteração do payload", () => {
        const owner = new mongoose.Types.ObjectId();
        const otherOwner = new mongoose.Types.ObjectId();
        const payload = encryptJsonWithContext(["private-fixture"], context(owner));
        const tampered = {
            ...payload,
            ciphertext: `${payload.ciphertext.slice(0, -2)}AA`,
        };

        expect(() => decryptJsonWithContext(payload, context(otherOwner))).toThrow(
            "Conteúdo contextual encriptado inválido",
        );
        expect(() =>
            decryptJsonWithContext(payload, context(owner, "limitations")),
        ).toThrow("Conteúdo contextual encriptado inválido");
        expect(() => decryptJsonWithContext(tampered, context(owner))).toThrow(
            "Conteúdo contextual encriptado inválido",
        );
    });

    it("isola compatibilidade v1 na função exclusiva de migração", () => {
        const owner = new mongoose.Types.ObjectId();
        const legacy = encryptJson({ category: "private-fixture" });

        expect(() => decryptJsonWithContext(legacy, context(owner))).toThrow(
            "Payload contextual de encriptação inválido",
        );
        expect(decryptJsonForMigration(legacy, context(owner))).toEqual({
            category: "private-fixture",
        });
    });
});
