/**
 * Guard etico de recomendacoes para RNF24.
 *
 * Este service aplica controlos estruturais para excluir genero, idade e tom
 * de pele das fontes de ranking e rejeitar linguagem publica discriminatoria.
 */
import { AppError } from "../middlewares/error.middleware.js";

const PROTECTED_ATTRIBUTES = Object.freeze(["genero", "idade", "tom_de_pele"]);

const FAIRNESS_POLICY_VERSION = "fair-ranking-v2";

const FAIRNESS_LIMITATIONS = Object.freeze([
    "A verificação cobre apenas os campos e sinais usados pelo ranking; não prova ausência total de enviesamento.",
    "Providers reais podem refletir limitações dos respetivos dados e modelos.",
]);

const ALLOWED_MAIN_GOAL_VALUES = new Set([
    "hidratar",
    "mais conforto e hidratacao",
    "reduzir_oleosidade",
    "reduzir oleosidade",
    "acalmar_sensibilidade",
    "acalmar sensibilidade",
    "equilibrar_rotina",
    "equilibrar a rotina",
]);

const ALLOWED_USAGE_PREFERENCE_VALUES = new Set([
    "textura_leve",
    "textura leve",
    "sem_perfume",
    "sem perfume",
    "rotina_curta",
    "rotina curta",
    "produto_pratico",
    "produto pratico",
]);

const GUIDED_RANKING_LABELS = Object.freeze({
    main_goal: "Objetivo cosmético principal",
    skin_comfort: "Conforto da pele",
    usage_preferences: "Preferências cosméticas estruturadas",
});

const SENSITIVE_REASON_CODES = Object.freeze([
    "gender_match",
    "genero_match",
    "age_match",
    "idade_match",
    "skin_tone_match",
    "tom_pele_match",
]);

const SENSITIVE_SOURCE_PREFIXES = Object.freeze([
    "gender",
    "genero",
    "age",
    "idade",
    "skinTone",
    "skin_tone",
    "tomPele",
    "tom_pele",
    "tomDePele",
]);

const DISCRIMINATORY_TEXT_PATTERNS = Object.freeze([
    {
        pattern:
            /\b(mulheres|homens|raparigas|rapazes).{0,32}(nao devem|nao podem|sao incapazes|sao inadequad)/u,
        message: "Texto público discrimina por género",
    },
    {
        pattern:
            /\b(idosos|idosas|jovens|idade).{0,32}(nao devem|nao podem|incapaz|inadequad|pior)/u,
        message: "Texto público discrimina por idade",
    },
    {
        pattern:
            /\b(pele escura|pele clara|tom de pele).{0,36}(inferior|superior|inadequad|nao deve|nao pode)/u,
        message: "Texto público discrimina por tom de pele",
    },
]);

/**
 * Normaliza texto para comparacao de politica sem depender de acentos.
 *
 * @function normalizePolicyText
 * @param {unknown} value - Valor textual recebido pelo guard.
 * @returns {string} Texto normalizado para pesquisa interna.
 */
function normalizePolicyText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/**
 * Converte um valor desconhecido numa lista de strings limpas.
 *
 * @function toCleanStringList
 * @param {unknown} value - Valor que deve representar uma lista.
 * @returns {string[]} Lista segura para validacoes.
 */
function toCleanStringList(value) {
    return (Array.isArray(value) ? value : [])
        .map((item) => String(item ?? "").trim())
        .filter(Boolean);
}

/**
 * Valida um sinal guiado contra o contrato cosmético fechado do ranking.
 *
 * A allowlist usa apenas perguntas com valores estruturados. Respostas livres
 * como rotina atual ou ingredientes a evitar continuam guardadas para a
 * consulta, mas não são transformadas em keywords de ranking.
 *
 * @function isAllowedGuidedRankingSignal
 * @param {{key?: unknown, value?: unknown}} signal - Sinal minimizado da consulta.
 * @returns {boolean} `true` apenas quando chave e valor pertencem ao contrato.
 */
function isAllowedGuidedRankingSignal(signal) {
    const key = normalizePolicyText(signal?.key);
    const value = normalizePolicyText(signal?.value);

    if (key === "main_goal") {
        return ALLOWED_MAIN_GOAL_VALUES.has(value);
    }

    if (key === "skin_comfort") {
        return /^[1-5]\/5$/u.test(value);
    }

    if (key === "usage_preferences") {
        const preferences = value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        return (
            preferences.length > 0 &&
            preferences.every((item) =>
                ALLOWED_USAGE_PREFERENCE_VALUES.has(item),
            )
        );
    }

    return false;
}

/**
 * Constrói a única fronteira de dados permitida ao ranking.
 *
 * Campos de perfil protegidos são removidos por construção. Alergias e
 * ingredientes a evitar são preservados apenas para exclusão de segurança,
 * nunca para aumentar score. O contexto guiado fica limitado a respostas
 * estruturadas e cosméticas com valores conhecidos.
 *
 * @function buildFairnessSafeRankingInputs
 * @param {{profile?: object|null, historyContext?: object[]}} input - Dados internos antes do ranking.
 * @returns {{restrictionProfile: {allergies: string[], avoidIngredients: string[]}, historyContext: {safeSignals: {key: string, label: string, value: string}[]}[]}} Contexto mínimo permitido.
 */
export function buildFairnessSafeRankingInputs({
    profile = null,
    historyContext = [],
} = {}) {
    const restrictionProfile = {
        allergies: toCleanStringList(profile?.allergies),
        avoidIngredients: toCleanStringList(profile?.avoidIngredients),
    };
    const safeHistoryContext = (Array.isArray(historyContext)
        ? historyContext
        : []
    )
        .map((historyItem) => ({
            safeSignals: (Array.isArray(historyItem?.safeSignals)
                ? historyItem.safeSignals
                : []
            )
                .filter(isAllowedGuidedRankingSignal)
                .map((signal) => ({
                    key: String(signal.key).trim(),
                    label:
                        GUIDED_RANKING_LABELS[
                            normalizePolicyText(signal.key)
                        ],
                    value: String(signal.value).trim(),
                })),
        }))
        .filter((historyItem) => historyItem.safeSignals.length > 0);

    return {
        restrictionProfile,
        historyContext: safeHistoryContext,
    };
}

/**
 * Encontra fontes tecnicas que usam atributos sensiveis.
 *
 * @function findSensitiveSourceSignals
 * @param {string[]} sourceSignals - Fontes tecnicas da recomendacao.
 * @returns {string[]} Fontes bloqueadas por RNF24.
 */
function findSensitiveSourceSignals(sourceSignals) {
    const sensitivePrefixes = new Set(
        SENSITIVE_SOURCE_PREFIXES.map(normalizePolicyText),
    );

    return toCleanStringList(sourceSignals).filter((signal) => {
        const [prefix] = signal.split(":");
        return sensitivePrefixes.has(normalizePolicyText(prefix));
    });
}

/**
 * Valida texto publico contra padroes discriminatorios.
 *
 * @function assertRespectfulPublicText
 * @param {string} text - Texto devolvido ao frontend.
 * @returns {void}
 * @throws {AppError} Quando o texto discrimina por atributo sensivel.
 */
export function assertRespectfulPublicText(text) {
    const normalizedText = normalizePolicyText(text);
    const match = DISCRIMINATORY_TEXT_PATTERNS.find(({ pattern }) =>
        pattern.test(normalizedText),
    );

    if (match) {
        throw new AppError(400, match.message);
    }
}

/**
 * Valida uma recomendacao explicavel contra RNF24.
 *
 * @function assertRecommendationFairness
 * @param {{reasonCodes?: string[], sourceSignals?: string[], explanation?: string, limitations?: string[]}} recommendation - Dados antes do DTO publico.
 * @returns {{status: "checked", policyVersion: string, protectedAttributes: string[], limitations: string[]}} Resultado publico com âmbito explícito.
 * @throws {AppError} Quando a recomendacao usa atributos sensiveis indevidamente.
 */
export function assertRecommendationFairness(recommendation) {
    const reasonCodes = toCleanStringList(recommendation?.reasonCodes);
    const sourceSignals = toCleanStringList(recommendation?.sourceSignals);
    const limitations = toCleanStringList(recommendation?.limitations);
    const sensitiveReasonCodes = new Set(
        SENSITIVE_REASON_CODES.map(normalizePolicyText),
    );
    const invalidReasonCodes = reasonCodes.filter((code) =>
        sensitiveReasonCodes.has(normalizePolicyText(code)),
    );
    const invalidSourceSignals = findSensitiveSourceSignals(sourceSignals);

    if (reasonCodes.length === 0 || sourceSignals.length === 0) {
        // Sem motivos e fontes nao existe evidence suficiente para provar que a recomendacao e cosmetica.
        throw new AppError(
            400,
            "Fairness exige motivos e fontes cosméticas verificáveis",
        );
    }

    if (invalidReasonCodes.length > 0) {
        throw new AppError(400, "Recomendação usa atributo sensível como motivo");
    }

    if (invalidSourceSignals.length > 0) {
        throw new AppError(400, "Recomendação usa atributo sensível como fonte");
    }

    // Explicacao e limitacoes sao texto publico; ambas precisam de passar pelo mesmo limite etico.
    [recommendation?.explanation, ...limitations].forEach(
        assertRespectfulPublicText,
    );

    return {
        status: "checked",
        policyVersion: FAIRNESS_POLICY_VERSION,
        protectedAttributes: [...PROTECTED_ATTRIBUTES],
        limitations: [...FAIRNESS_LIMITATIONS],
    };
}
