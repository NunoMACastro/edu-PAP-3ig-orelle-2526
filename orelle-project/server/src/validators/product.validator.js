import { AppError } from "../middlewares/error.middleware.js";
import { SKIN_TYPES } from "../models/profile.model.js";

const BLOCKED_CLAIM_WORDS = [
    "cura",
    "curar",
    "tratamento medico",
    "tratamento clinico",
    "elimina acne",
    "remove rugas",
    "doenca",
    "medicamento",
];

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

function normalizeList(value) {
    if (!Array.isArray(value)) return [];
    return [
        ...new Set(
            value
                .map((item) => normalizeText(item).toLowerCase())
                .filter(Boolean),
        ),
    ];
}

function assertControlledImageUrl(value, errors) {
    try {
        const url = new URL(String(value ?? "").trim());
        if (!["http:", "https:"].includes(url.protocol)) {
            errors.imageUrl = "Imagem deve ser URL http/https";
        }
        return url.toString();
    } catch {
        errors.imageUrl = "Imagem deve ser URL valido";
        return "";
    }
}

function hasBlockedClaims(description) {
    const normalized = description.toLowerCase();
    return BLOCKED_CLAIM_WORDS.some((word) => normalized.includes(word));
}

export function validateProductInput(body) {
    const input = {
        name: normalizeText(body.name),
        brandName: normalizeText(body.brandName),
        description: normalizeText(body.description),
        ingredientNames: normalizeList(body.ingredientNames),
        skinTypes: normalizeList(body.skinTypes),
        imageUrl: "",
        priceCents: Number(body.priceCents),
        stock: Number(body.stock),
    };

    const errors = {};
    input.imageUrl = assertControlledImageUrl(body.imageUrl, errors);

    if (input.name.length < 2 || input.name.length > 120) {
        errors.name = "Nome deve ter entre 2 e 120 caracteres";
    }

    if (input.brandName.length < 2 || input.brandName.length > 80) {
        errors.brandName = "Marca deve ter entre 2 e 80 caracteres";
    }

    if (input.description.length < 20 || input.description.length > 1000) {
        errors.description = "Descricao deve ter entre 20 e 1000 caracteres";
    }

    if (hasBlockedClaims(input.description)) {
        errors.description =
            "Descricao nao pode conter claims clinicos ou medicos nao documentados";
    }

    if (input.ingredientNames.length === 0) {
        errors.ingredientNames = "Indica pelo menos um ingrediente";
    }

    if (
        input.skinTypes.length === 0 ||
        input.skinTypes.some((type) => !SKIN_TYPES.includes(type))
    ) {
        errors.skinTypes = `Tipos de pele devem ser: ${SKIN_TYPES.join(", ")}`;
    }

    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
        errors.priceCents =
            "Preco deve ser inteiro em centimos e maior ou igual a zero";
    }

    if (!Number.isInteger(input.stock) || input.stock < 0) {
        errors.stock = "Stock deve ser inteiro maior ou igual a zero";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Produto invalido", errors);
    }

    return input;
}