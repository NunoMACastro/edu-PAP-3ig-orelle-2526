/**
 * Helpers de apresentação comercial para produtos públicos.
 *
 * Este módulo centraliza formatação e validação visual sem alterar os valores
 * recebidos da API nem refletir enums técnicos desconhecidos na interface.
 */
import { getSkinTypeLabel } from "./presentationLabels.js";

const SAFE_PRODUCT_COLOR = /^#[0-9A-Fa-f]{6}$/;

/** Formata um preço público guardado em cêntimos. */
export function formatProductPrice(priceCents) {
    return `${(Number(priceCents ?? 0) / 100).toFixed(2)} EUR`;
}

/** Resume os tipos de pele para a linha editorial de um card. */
export function formatProductSkinTypes(skinTypes = [], limit = 2) {
    if (!Array.isArray(skinTypes) || skinTypes.length === 0) {
        return "Catálogo";
    }

    return skinTypes.slice(0, limit).map(getSkinTypeLabel).join(" / ");
}

/** Devolve apenas cores hexadecimais completas seguras para estilos inline. */
export function getSafeProductColor(colorHex) {
    return typeof colorHex === "string" && SAFE_PRODUCT_COLOR.test(colorHex)
        ? colorHex
        : null;
}
