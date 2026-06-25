/**
 * Modelo de relatório facial personalizado.
 *
 * Os campos sensíveis mantêm os mesmos nomes usados pelos services, mas ficam
 * guardados como JSON cifrado em MongoDB. O backend recebe valores decifrados
 * através dos getters do schema.
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import {
    decryptJson,
    encryptJson,
    parseEncryptionKey,
} from "../services/encryption.service.js";

const { Schema, model } = mongoose;

/**
 * Verifica se um valor textual já tem o formato cifrado esperado.
 *
 * @function isEncryptedJsonString
 * @param {unknown} value - Valor guardado no campo.
 * @returns {boolean} Verdadeiro quando o valor parece payload cifrado.
 */
function isEncryptedJsonString(value) {
    if (typeof value !== "string") return false;

    try {
        const parsed = JSON.parse(value);
        return Boolean(parsed?.encrypted && parsed?.iv && parsed?.authTag);
    } catch {
        return false;
    }
}

/**
 * Cifra qualquer valor de relatório antes de o guardar.
 *
 * @function encryptReportField
 * @param {unknown} value - Valor original do campo.
 * @returns {string|undefined} Payload cifrado serializado.
 */
function encryptReportField(value) {
    if (value === undefined || value === null) return value;
    // Updates internos podem receber um valor já cifrado; cifrar duas vezes
    // impediria os getters de devolverem o relatório ao backend autorizado.
    if (isEncryptedJsonString(value)) return value;

    const key = parseEncryptionKey(env.dataEncryptionKey);
    return JSON.stringify(encryptJson(value, key));
}

/**
 * Decifra um campo de relatório quando o backend lê o documento.
 *
 * @function decryptReportField
 * @param {unknown} value - Valor persistido em MongoDB.
 * @returns {unknown} Valor original do campo.
 */
function decryptReportField(value) {
    if (value === undefined || value === null) return value;
    // Campos antigos ou fixtures de teste podem ainda estar em claro durante a
    // migração; o getter não deve rebentar esses dados antes da correção manual.
    if (!isEncryptedJsonString(value)) return value;

    const key = parseEncryptionKey(env.dataEncryptionKey);
    return decryptJson(JSON.parse(value), key);
}

const encryptedReportField = {
    type: String,
    required: true,
    // O setter cifra antes da persistência; os services continuam a trabalhar
    // com strings e arrays legíveis sem conhecer IV, auth tag ou ciphertext.
    set: encryptReportField,
    get: decryptReportField,
};

const faceReportSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        analysisId: {
            type: Schema.Types.ObjectId,
            ref: "FaceAnalysis",
            required: true,
            index: true,
        },
        cosmeticSummary: encryptedReportField,
        routineSuggestions: encryptedReportField,
        sources: encryptedReportField,
        limitations: encryptedReportField,
        privacyStatus: {
            type: String,
            enum: ["active", "deleted", "anonymized"],
            default: "active",
            index: true,
        },
    },
    {
        timestamps: true,
        // Os getters só expõem valores decifrados depois de a query autorizada
        // carregar o documento; o MongoDB continua a guardar JSON cifrado.
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

faceReportSchema.index({ userId: 1, createdAt: -1 });

/**
 * Modelo Mongoose de relatórios faciais.
 *
 * @type {import("mongoose").Model}
 */
export const FaceReport = model("FaceReport", faceReportSchema);