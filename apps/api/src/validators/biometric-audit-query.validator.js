/**
 * Valida a paginação por cursor dos eventos administrativos de auditoria.
 *
 * O cursor é opaco para o cliente, mas é sempre validado antes de chegar ao
 * MongoDB para impedir limites excessivos ou operadores injetados por query.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/** Descodifica um cursor base64url com data e ID de desempate. */
function decodeCursor(value, errors) {
    if (value === undefined || value === null || value === "") return null;

    const cursor = String(value);
    if (!/^[A-Za-z0-9_-]{1,512}$/.test(cursor)) {
        errors.cursor = "cursor de auditoria inválido";
        return null;
    }

    try {
        const payload = JSON.parse(
            Buffer.from(cursor, "base64url").toString("utf8"),
        );
        const createdAt = new Date(payload?.createdAt);
        const id = String(payload?.id ?? "");

        if (
            Number.isNaN(createdAt.getTime()) ||
            !mongoose.isValidObjectId(id)
        ) {
            errors.cursor = "cursor de auditoria inválido";
            return null;
        }

        return { createdAt, id };
    } catch {
        errors.cursor = "cursor de auditoria inválido";
        return null;
    }
}

/**
 * Normaliza `cursor` e `limit` para uma coleção de auditoria.
 *
 * @param {Record<string, unknown>} query - Query string do pedido Express.
 * @param {{defaultLimit: number}} options - Limite específico da coleção.
 * @returns {{cursor: {createdAt: Date, id: string}|null, limit: number}} Paginação validada.
 * @throws {AppError} Quando o cursor ou limite são inválidos.
 */
export function validateBiometricAuditQuery(
    query = {},
    { defaultLimit },
) {
    const errors = {};
    const limitValue = query.limit ?? defaultLimit;
    const limit = Number(limitValue);

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        errors.limit = "limit deve ser um inteiro entre 1 e 50";
    }

    const cursor = decodeCursor(query.cursor, errors);
    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Paginação de auditoria inválida", errors);
    }

    return { cursor, limit };
}
