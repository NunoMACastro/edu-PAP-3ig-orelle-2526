/**
 * Validadores de exportação administrativa.
 */
import { AppError } from "../middlewares/error.middleware.js";

export const EXPORT_DATASETS = Object.freeze(["sales", "users", "ai-reports"]);
export const EXPORT_FORMATS = Object.freeze(["csv", "pdf"]);

/**
 * Valida dataset e formato de exportação.
 *
 * @function validateAdminExportRequest
 * @param {Record<string, unknown>} params - Parâmetros da rota.
 * @param {Record<string, unknown>} query - Query string.
 * @returns {{dataset: string, format: string}} Pedido normalizado.
 * @throws {AppError} Quando dataset ou formato não são suportados.
 */
export function validateAdminExportRequest(params, query) {
    const dataset = String(params?.dataset ?? "").trim();
    const format = String(query?.format ?? "csv").trim().toLowerCase();
    const errors = {};

    // A lista fechada impede que o cliente escolha nomes livres de coleções.
    if (!EXPORT_DATASETS.includes(dataset)) {
        errors.dataset = `Dataset deve ser um destes: ${EXPORT_DATASETS.join(", ")}`;
    }

    // O formato fechado evita respostas HTML/JSON inesperadas neste endpoint de ficheiros.
    if (!EXPORT_FORMATS.includes(format)) {
        errors.format = `Formato deve ser um destes: ${EXPORT_FORMATS.join(", ")}`;
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Pedido de exportação inválido", errors);
    }

    return { dataset, format };
}