import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { AppError } from "../middlewares/error.middleware.js";

export const DATA_ENCRYPTION_ALGORITHM = "aes-256-gcm";

const IV_BYTES = 12;
const KEY_BYTES = 32;

/**
 * Converte a chave base64 de ambiente em Buffer.
 *
 * @function parseEncryptionKey
 * @param {string|undefined} rawKey - Chave em base64.
 * @returns {Buffer} Chave binária de 32 bytes.
 * @throws {AppError} Quando a chave está ausente ou tem tamanho inválido.
 */
export function parseEncryptionKey(rawKey) {
    const key = Buffer.from(String(rawKey ?? ""), "base64");

    if (key.length !== KEY_BYTES) {
        throw new AppError(500, "Chave de encriptação inválida.");
    }

    return key;
}

/**
 * Encripta um Buffer com AES-256-GCM.
 *
 * @function encryptBuffer
 * @param {Buffer} plainBuffer - Conteúdo sensível original.
 * @param {Buffer} key - Chave validada.
 * @returns {{algorithm: string, iv: string, authTag: string, encrypted: Buffer}} Conteúdo cifrado.
 */
export function encryptBuffer(plainBuffer, key) {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(DATA_ENCRYPTION_ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);

    // A tag de GCM permite detetar se alguém alterou o conteúdo guardado.
    return {
        algorithm: DATA_ENCRYPTION_ALGORITHM,
        iv: iv.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64"),
        encrypted,
    };
}

/**
 * Decifra um Buffer protegido por AES-256-GCM.
 *
 * @function decryptBuffer
 * @param {{algorithm?: string, iv: string, authTag: string, encrypted: Buffer, key: Buffer}} input - Dados cifrados.
 * @returns {Buffer} Conteúdo original.
 * @throws {AppError} Quando o conteúdo foi alterado ou a chave não corresponde.
 */
export function decryptBuffer({ algorithm, iv, authTag, encrypted, key }) {
    if (algorithm && algorithm !== DATA_ENCRYPTION_ALGORITHM) {
        throw new AppError(500, "Algoritmo de encriptação não suportado.");
    }

    try {
        const decipher = createDecipheriv(
            DATA_ENCRYPTION_ALGORITHM,
            key,
            Buffer.from(iv, "base64"),
        );
        decipher.setAuthTag(Buffer.from(authTag, "base64"));

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } catch {
        throw new AppError(500, "Conteúdo sensível não pode ser decifrado.");
    }
}

/**
 * Encripta um valor JSON sem perder a estrutura original.
 *
 * @function encryptJson
 * @param {unknown} value - Valor sensível a guardar.
 * @param {Buffer} key - Chave validada.
 * @returns {{algorithm: string, iv: string, authTag: string, encrypted: string}} Payload cifrado serializável.
 */
export function encryptJson(value, key) {
    const plainBuffer = Buffer.from(JSON.stringify(value), "utf8");
    const encryptedPayload = encryptBuffer(plainBuffer, key);

    return {
        algorithm: encryptedPayload.algorithm,
        iv: encryptedPayload.iv,
        authTag: encryptedPayload.authTag,
        encrypted: encryptedPayload.encrypted.toString("base64"),
    };
}

/**
 * Decifra um payload JSON criado por `encryptJson`.
 *
 * @function decryptJson
 * @param {{algorithm: string, iv: string, authTag: string, encrypted: string}} payload - Payload persistido.
 * @param {Buffer} key - Chave validada.
 * @returns {unknown} Valor original.
 */
export function decryptJson(payload, key) {
    const plainBuffer = decryptBuffer({
        algorithm: payload.algorithm,
        iv: payload.iv,
        authTag: payload.authTag,
        encrypted: Buffer.from(payload.encrypted, "base64"),
        key,
    });

    return JSON.parse(plainBuffer.toString("utf8"));
}