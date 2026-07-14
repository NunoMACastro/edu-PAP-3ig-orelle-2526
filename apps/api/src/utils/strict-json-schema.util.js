/**
 * Validador local mínimo para os JSON Schemas fechados enviados à OpenAI.
 *
 * Structured Outputs reduz respostas fora do contrato, mas a fronteira de
 * confiança continua a ser o backend. Este módulo valida o subconjunto usado
 * pelos schemas da aplicação sem executar código, resolver referências ou
 * depender de mensagens devolvidas pelo provider.
 */

/** @returns {boolean} Verdadeiro apenas para objetos JSON não nulos. */
function isJsonObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** @returns {boolean} Confirma um dos tipos JSON Schema suportados. */
function matchesType(value, type) {
    if (type === "null") return value === null;
    if (type === "array") return Array.isArray(value);
    if (type === "object") return isJsonObject(value);
    if (type === "integer") return Number.isInteger(value);
    if (type === "number") return typeof value === "number" && Number.isFinite(value);
    return typeof value === type;
}

/**
 * Valida recursivamente um valor sem incluir o conteúdo sensível no erro.
 *
 * @param {unknown} value - Valor JSON já desserializado.
 * @param {Record<string, unknown>} schema - Schema fechado da operação.
 * @param {string} path - Caminho estrutural sanitizado.
 * @returns {{valid: true}|{valid: false, path: string, reason: string}} Resultado interno.
 */
function validateNode(value, schema, path) {
    if (Array.isArray(schema.anyOf)) {
        const accepted = schema.anyOf.some(
            (candidate) => validateNode(value, candidate, path).valid,
        );
        return accepted
            ? { valid: true }
            : { valid: false, path, reason: "anyOf" };
    }

    const allowedTypes = Array.isArray(schema.type)
        ? schema.type
        : schema.type
          ? [schema.type]
          : [];
    if (
        allowedTypes.length > 0 &&
        !allowedTypes.some((type) => matchesType(value, type))
    ) {
        return { valid: false, path, reason: "type" };
    }

    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
        return { valid: false, path, reason: "enum" };
    }

    if (typeof value === "string") {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            return { valid: false, path, reason: "minLength" };
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            return { valid: false, path, reason: "maxLength" };
        }
        if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) {
            return { valid: false, path, reason: "pattern" };
        }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        if (schema.minimum !== undefined && value < schema.minimum) {
            return { valid: false, path, reason: "minimum" };
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
            return { valid: false, path, reason: "maximum" };
        }
    }

    if (Array.isArray(value)) {
        if (schema.minItems !== undefined && value.length < schema.minItems) {
            return { valid: false, path, reason: "minItems" };
        }
        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            return { valid: false, path, reason: "maxItems" };
        }
        if (schema.items) {
            for (let index = 0; index < value.length; index += 1) {
                const result = validateNode(
                    value[index],
                    schema.items,
                    `${path}[${index}]`,
                );
                if (!result.valid) return result;
            }
        }
    }

    if (isJsonObject(value)) {
        const properties = schema.properties ?? {};
        for (const requiredKey of schema.required ?? []) {
            if (!Object.hasOwn(value, requiredKey)) {
                return {
                    valid: false,
                    path: `${path}.${requiredKey}`,
                    reason: "required",
                };
            }
        }
        if (schema.additionalProperties === false) {
            const unexpected = Object.keys(value).find(
                (key) => !Object.hasOwn(properties, key),
            );
            if (unexpected) {
                return {
                    valid: false,
                    path: `${path}.${unexpected}`,
                    reason: "additionalProperties",
                };
            }
        }
        for (const [key, propertySchema] of Object.entries(properties)) {
            if (!Object.hasOwn(value, key)) continue;
            const result = validateNode(value[key], propertySchema, `${path}.${key}`);
            if (!result.valid) return result;
        }
    }

    return { valid: true };
}

/**
 * Falha de forma sanitizada quando a resposta não satisfaz o schema enviado.
 *
 * @param {unknown} value - Resposta estruturada desserializada.
 * @param {Record<string, unknown>} schema - Mesmo schema enviado ao provider.
 * @returns {void}
 * @throws {TypeError} Sem copiar o valor inválido ou outros dados sensíveis.
 */
export function assertMatchesStrictJsonSchema(value, schema) {
    const result = validateNode(value, schema, "$");
    if (!result.valid) {
        const error = new TypeError(
            `Structured Output inválido em ${result.path} (${result.reason})`,
        );
        error.code = "STRICT_JSON_SCHEMA_MISMATCH";
        throw error;
    }
}
