/**
 * Validadores de exportacao administrativa.
 */
import { AppError } from "../middlewares/error.middleware.js";

export const EXPORT_DATASETS = Object.freeze(["sales", "users", "ai-reports"]);
export const EXPORT_FORMATS = Object.freeze(["csv", "pdf"]);

/**
 * Valida dataset e formato de exportacao.
 *
 * @function validateAdminExportRequest
 * @param {Record<string, unknown>} params - Parametros da rota.
 * @param {Record<string, unknown>} query - Query string.
 * @returns {{dataset: string, format: string}} Pedido normalizado.
 * @throws {AppError} Quando dataset ou formato nao sao suportados.
 */
export function validateAdminExportRequest(params, query) {
    const dataset = String(params?.dataset ?? "").trim();
    const format = String(query?.format ?? "csv").trim().toLowerCase();
    const errors = {};

    if (!EXPORT_DATASETS.includes(dataset)) {
        errors.dataset = `Dataset deve ser um destes: ${EXPORT_DATASETS.join(", ")}`;
    }

    if (!EXPORT_FORMATS.includes(format)) {
        errors.format = `Formato deve ser um destes: ${EXPORT_FORMATS.join(", ")}`;
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Pedido de exportacao invalido", errors);
    }

    return { dataset, format };
}
