/**
 * Normalização pura da identidade comercial de variantes.
 *
 * O helper fica fora da camada de serviços para poder ser reutilizado pelos
 * validadores HTTP sem criar uma dependência inversa entre camadas.
 */
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Normaliza um identificador opcional sem aceitar valores ambíguos.
 *
 * @param {unknown} value - Identificador recebido.
 * @param {{required?: boolean}} [options] - Exigência do identificador.
 * @returns {string|null} Identificador normalizado ou `null`.
 * @throws {AppError} Quando o valor viola o formato público.
 */
export function normalizeVariantId(value, { required = false } = {}) {
    const variantId = String(value ?? "").trim().toLowerCase();

    if (!variantId && !required) return null;
    if (
        !variantId ||
        variantId.length > 64 ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variantId)
    ) {
        throw new AppError(400, "Variante inválida");
    }

    return variantId;
}
