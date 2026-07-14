/**
 * Validação da pesquisa paginada do catálogo administrativo.
 *
 * Mantém limites conservadores para impedir queries excessivas e normaliza os
 * filtros antes de estes chegarem ao service MongoDB.
 */
import { AppError } from "../middlewares/error.middleware.js";

const AI_ELIGIBILITY_FILTERS = new Set(["all", "eligible", "ineligible"]);
const STOCK_FILTERS = new Set(["all", "available", "empty"]);

/** Converte um inteiro positivo de query ou regista um erro seguro. */
function parsePositiveInteger(value, fallback, field, maximum, errors) {
    if (value === undefined || value === null || value === "") return fallback;

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
        errors[field] = `${field} deve ser um inteiro entre 1 e ${maximum}`;
        return fallback;
    }

    return parsed;
}

/** Normaliza texto de pesquisa sem permitir payloads desnecessariamente longos. */
function normalizeSearch(value, errors) {
    const search = String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");

    if (search.length > 120) {
        errors.search = "search não pode exceder 120 caracteres";
    }

    return search;
}

/**
 * Valida paginação e filtros aceites por `GET /api/admin/products`.
 *
 * @param {Record<string, unknown>} query - Query string recebida pelo Express.
 * @returns {{page: number, pageSize: number, search: string, aiEligibility: string, stock: string}} Filtros normalizados.
 * @throws {AppError} Quando um valor não pertence ao contrato público.
 */
export function validateAdminProductsQuery(query = {}) {
    const errors = {};
    const page = parsePositiveInteger(query.page, 1, "page", 100_000, errors);
    const pageSize = parsePositiveInteger(
        query.pageSize,
        20,
        "pageSize",
        100,
        errors,
    );
    const search = normalizeSearch(query.search, errors);
    const aiEligibility = String(query.aiEligibility ?? "all").trim();
    const stock = String(query.stock ?? "all").trim();

    if (!AI_ELIGIBILITY_FILTERS.has(aiEligibility)) {
        errors.aiEligibility =
            "aiEligibility deve ser all, eligible ou ineligible";
    }
    if (!STOCK_FILTERS.has(stock)) {
        errors.stock = "stock deve ser all, available ou empty";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Filtros administrativos inválidos", errors);
    }

    return { page, pageSize, search, aiEligibility, stock };
}
