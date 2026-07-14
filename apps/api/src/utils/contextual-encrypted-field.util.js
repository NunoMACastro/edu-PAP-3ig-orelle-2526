/**
 * Integração Mongoose para campos JSON cifrados com AAD contextual v2.
 *
 * Ownership e estados permanecem em campos normais pesquisáveis. Apenas o
 * conteúdo sensível é convertido num `Mixed` opaco; o getter só o devolve em
 * claro depois de autenticar coleção, owner e nome do campo.
 */
import mongoose from "mongoose";
import {
    decryptJsonWithContext,
    encryptJsonWithContext,
} from "./encryption.util.js";
import { AppError } from "../middlewares/error.middleware.js";

const { Schema } = mongoose;

/** Contrato canónico partilhado pelos models e pela migração 005. */
export const SENSITIVE_FIELD_ENCRYPTION_SPECS = Object.freeze([
    Object.freeze({
        collection: "faceanalyses",
        ownerField: "userId",
        fields: Object.freeze(["findings"]),
    }),
    Object.freeze({
        collection: "facereports",
        ownerField: "userId",
        fields: Object.freeze([
            "cosmeticSummary",
            "routineSuggestions",
            "sources",
            "limitations",
        ]),
    }),
    Object.freeze({
        collection: "profiles",
        ownerField: "userId",
        fields: Object.freeze([
            "allergies",
            "avoidIngredients",
            "lightMedicalRestrictions",
        ]),
    }),
    Object.freeze({
        collection: "aiconsultationsessions",
        ownerField: "userId",
        fields: Object.freeze(["answers"]),
    }),
    Object.freeze({
        collection: "productrecommendations",
        ownerField: "userId",
        fields: Object.freeze(["consultantNote", "humanOverride"]),
    }),
    Object.freeze({
        collection: "aiconsultationreviews",
        ownerField: "userId",
        fields: Object.freeze(["publicInsight", "internalNote", "humanOverride"]),
    }),
    Object.freeze({
        collection: "aiinteractionhistories",
        ownerField: "userId",
        fields: Object.freeze(["safeSummary", "safeSignals"]),
    }),
]);

/**
 * Campos derivados descobertos depois da migração 005.
 *
 * Esta lista é deliberadamente separada do contrato 005: instalações que já
 * registaram o checksum dessa versão não podem depender de uma alteração
 * retroativa. A migração 008 consome exclusivamente estes specs append-only.
 */
export const SENSITIVE_DERIVATIVE_ENCRYPTION_SPECS = Object.freeze([
    Object.freeze({
        collection: "faceanalyses",
        ownerField: "userId",
        fields: Object.freeze(["sources", "limitations"]),
    }),
    Object.freeze({
        collection: "productrecommendations",
        ownerField: "userId",
        fields: Object.freeze([
            "reasonCodes",
            "explanation",
            "sourceSignals",
            "limitations",
            "machineResult",
        ]),
    }),
    Object.freeze({
        collection: "aiconsultationreviews",
        ownerField: "userId",
        fields: Object.freeze([
            "summary",
            "sourceLabels",
            "limitations",
            "machineResult",
        ]),
    }),
    Object.freeze({
        collection: "recommendationreviews",
        ownerField: "clientUserId",
        fields: Object.freeze(["note", "adjustedExplanation"]),
    }),
    Object.freeze({
        collection: "skincomparisons",
        ownerField: "userId",
        fields: Object.freeze(["metricDeltas", "summary", "limitations"]),
    }),
]);

/** Extrai um owner exato de documento ou filtro Mongoose. */
function resolveOwnerCandidate(candidate) {
    if (
        candidate &&
        typeof candidate === "object" &&
        !(candidate instanceof mongoose.Types.ObjectId) &&
        Object.hasOwn(candidate, "$eq")
    ) {
        return candidate.$eq;
    }

    return candidate;
}

/**
 * Resolve o owner sem aceitar filtros amplos (`$in`, `$ne`, etc.).
 *
 * @param {object} receiver - Documento ou Query Mongoose.
 * @param {string} ownerField - Campo de ownership pesquisável.
 * @returns {unknown} ObjectId do owner.
 */
function resolveEncryptionOwner(receiver, ownerField) {
    let candidate;

    if (receiver?.$__ && typeof receiver.get === "function") {
        candidate = receiver.get(ownerField, null, { getters: false });
    } else if (typeof receiver?.getFilter === "function") {
        candidate = receiver.getFilter()?.[ownerField];
    }

    const owner = resolveOwnerCandidate(candidate);
    if (!owner || !mongoose.isValidObjectId(owner)) {
        throw new AppError(
            500,
            `Operação em campo sensível exige filtro exato por ${ownerField}.`,
        );
    }

    return owner;
}

/**
 * Cria o contexto criptográfico de um campo canónico.
 *
 * @param {{collection: string, owner: unknown, field: string}} input - Identidade do campo.
 * @returns {{collection: string, owner: unknown, field: string}} Contexto para AES-GCM.
 */
export function getSensitiveFieldEncryptionContext(input) {
    return {
        collection: input.collection,
        owner: input.owner,
        field: input.field,
    };
}

/**
 * Cria uma definição `Schema.Types.Mixed` com setter/getter contextual estrito.
 * O setter também corre no casting de updates Mongoose e exige que o filtro
 * contenha o owner exato, evitando cifrar dados no contexto errado.
 *
 * @param {object} options - Metadados e opções do campo.
 * @param {string} options.collection - Nome físico da coleção MongoDB.
 * @param {string} options.field - Nome físico do campo.
 * @param {string} [options.ownerField="userId"] - Campo de ownership.
 * @param {unknown|Function} [options.defaultValue] - Default lógico.
 * @param {boolean} [options.required=false] - Obrigatoriedade Mongoose.
 * @returns {object} Definição pronta para um schema.
 */
export function contextualEncryptedField({
    collection,
    field,
    ownerField = "userId",
    defaultValue,
    required = false,
}) {
    const definition = {
        type: Schema.Types.Mixed,
        required,
        set(value) {
            if (value === null || value === undefined) return value;
            const owner = resolveEncryptionOwner(this, ownerField);
            return encryptJsonWithContext(
                value,
                getSensitiveFieldEncryptionContext({ collection, owner, field }),
            );
        },
        get(value) {
            if (value === null || value === undefined) return value;
            const owner = resolveEncryptionOwner(this, ownerField);
            return decryptJsonWithContext(
                value,
                getSensitiveFieldEncryptionContext({ collection, owner, field }),
            );
        },
    };

    if (defaultValue !== undefined) definition.default = defaultValue;
    return definition;
}
