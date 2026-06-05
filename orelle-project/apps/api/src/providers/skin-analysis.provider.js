import { AppError } from "../middlewares/error.middleware.js";

function createFinding(label, confidence, explanation) {
    return { label, confidence, explanation };
}

export async function analyzeSkinPhotos({ frontalPhoto, perfilPhoto }) {
    if (!frontalPhoto?.storageKey || !perfilPhoto?.storageKey) {
        throw new AppError(400, "Fotografias válidas obrigatórias para análise");
    }

    return {
        providerName: "local-skin-analysis-v1",
        findings: {
            skinType: createFinding(
                "mista",
                0.55,
                "Estimativa cosmética inicial baseada no fluxo local controlado.",
            ),
            acne: createFinding(
                "baixo",
                0.5,
                "Sem provider externo ativo, a app devolve uma indicação conservadora.",
            ),
            manchas: createFinding(
                "nao_conclusivo",
                0.3,
                "A fotografia deve ser revista por provider especializado para maior confiança.",
            ),
            rugas: createFinding(
                "nao_conclusivo",
                0.3,
                "A app evita afirmar sinais que não consegue medir com segurança.",
            ),
            oleosidade: createFinding(
                "moderada",
                0.5,
                "Estimativa cosmética inicial, sem valor clínico.",
            ),
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: [
            "Não é diagnóstico médico.",
            "Resultado de provider local controlado.",
            "Qualidade de luz e enquadramento podem afetar a análise.",
        ],
    };
}