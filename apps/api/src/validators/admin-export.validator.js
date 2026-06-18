import { AppError } from "../middlewares/error.middleware.js";

const DATASETS = ["sales", "ai-reports", "users"];
const FORMATS = ["csv", "pdf"];

/**
 * Valida pedido de exportação administrativa.
 *
 * @function validateAdminExportRequest
 * @param {Record<string, string>} params - Params da route.
 * @param {Record<string, unknown>} query - Query string.
 * @returns {{dataset: "sales"|"ai-reports"|"users", format: "csv"|"pdf"}} Pedido normalizado.
 * @throws {AppError} Quando dataset ou formato não são suportados.
 */
export function validateAdminExportRequest(params, query) {
    const dataset = String(params.dataset ?? "").trim();
    const format = String(query.format ?? "csv").trim();

    if (!DATASETS.includes(dataset)) {
        throw new AppError(400, "Dataset de exportação invalido");
    }

    if (!FORMATS.includes(format)) {
        throw new AppError(400, "Formato de exportação invalido");
    }

    return { dataset, format };
}