import { AppError } from "../middlewares/error.middleware.js";
const PUBLIC_LABELS = {
    baixo: "baixo",
    baixa: "baixa",
    moderado: "moderado",
    moderada: "moderada",
    alto: "alto",
    alta: "alta",
    mista: "mista",
    oleosa: "oleosa",
    seca: "seca",
    sensivel: "sensível",
    normal: "normal",
    nao_conclusivo: "não conclusivo",
};

const COMMERCIAL_REASON_CODES = new Set(["stock_available"]);
const SIGNAL_LABELS = {
    skinType: "tipo de pele",
    acne: "acne",
    manchas: "manchas",
    rugas: "rugas",
    oleosidade: "oleosidade",
};

function normalizeLabel(value) {
    return String(value ?? "nao_conclusivo")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function publicLabel(value) {
    const key = normalizeLabel(value);
    return PUBLIC_LABELS[key] ?? key.replaceAll("_", " ");
}

function findingLabel(analysis, key) {
    return normalizeLabel(analysis.findings?.[key]?.label);
}

function uniqueStrings(values) {
    return Array.from(new Set((values ?? []).filter(Boolean)));
}

function buildReasonCodes(ranking) {
    const codes = uniqueStrings(ranking.reasonCodes);
    const cosmeticCodes = codes.filter((code) => !COMMERCIAL_REASON_CODES.has(code));

    if (cosmeticCodes.length === 0) {
        throw new AppError(400, "A recomendação precisa de pelo menos um motivo cosmético");
    }

    return cosmeticCodes;
}

function buildSourceSignals(ranking) {
    const sourceSignals = uniqueStrings(ranking.sourceSignals);

    if (sourceSignals.length === 0) {
        throw new AppError(400, "A recomendação precisa de pelo menos uma fonte verificável");
    }

    return sourceSignals;
}

function buildSignalText(sourceSignals) {
    return sourceSignals.map((signal) => SIGNAL_LABELS[signal] ?? signal).join(", ");
}

export function buildRecommendationReason({ analysis, product, ranking }) {
    const skinType = publicLabel(findingLabel(analysis, "skinType"));
    const reasonCodes = buildReasonCodes(ranking);
    const sourceSignals = buildSourceSignals(ranking);
    const signalText = buildSignalText(sourceSignals);

    return {
        reasonCodes,
        sourceSignals,
        explanation: [
            `${product.name} foi recomendado porque o ranking encontrou compatibilidade entre o produto e ${signalText}.`,
            `A análise registou pele ${skinType}; a explicação usa sinais do relatório e do catálogo, não uma decisão do frontend.`,
            "A sugestão é informativa, não é diagnóstico médico e não cria compra automática.",
        ].join(" "),
    };
}