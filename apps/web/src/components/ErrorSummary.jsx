/**
 * Sumário acessível de um erro público devolvido pela API.
 *
 * Apenas apresenta a mensagem, detalhes escalares explicitamente públicos e a
 * referência de correlação. Objetos aninhados e valores longos são ignorados
 * para não transformar a UI num visor de payloads técnicos.
 */
import { useId } from "react";

const FIELD_LABELS = Object.freeze({
    brandName: "Marca",
    description: "Descrição",
    email: "Email",
    ingredientNames: "Ingredientes",
    name: "Nome",
    password: "Palavra-passe",
    priceCents: "Preço",
    skinTypes: "Tipos de pele",
    stock: "Stock",
});
const MAX_DETAILS = 8;
const MAX_PUBLIC_TEXT_LENGTH = 240;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,100}$/;

/** Converte apenas detalhes públicos simples em linhas legíveis. */
function getPublicDetailItems(details) {
    if (!details || typeof details !== "object" || Array.isArray(details)) {
        return [];
    }

    return Object.entries(details)
        .slice(0, MAX_DETAILS)
        .flatMap(([field, value]) => {
            if (!Object.hasOwn(FIELD_LABELS, field)) return [];
            if (!["string", "number", "boolean"].includes(typeof value)) {
                return [];
            }

            const text = String(value).trim().slice(0, MAX_PUBLIC_TEXT_LENGTH);
            if (!text) return [];

            return [
                {
                    field,
                    label: FIELD_LABELS[field],
                    text,
                },
            ];
        });
}

/**
 * @param {{error?: {message?: string, details?: unknown, requestId?: string}|string|null, title?: string, id?: string}} props - Erro já minimizado pelo cliente HTTP.
 * @returns {import("react").JSX.Element|null} Sumário com anúncio assertivo.
 */
export function ErrorSummary({
    error,
    title = "Não foi possível concluir a operação",
    id,
}) {
    const generatedId = useId();
    if (!error) return null;

    const message =
        typeof error === "string"
            ? error
            : String(error.message ?? "Ocorreu um erro inesperado.");
    const details =
        typeof error === "string" ? [] : getPublicDetailItems(error.details);
    const requestId =
        typeof error !== "string" &&
        REQUEST_ID_PATTERN.test(String(error.requestId ?? ""))
            ? String(error.requestId)
            : "";
    const titleId = `${id ?? generatedId}-title`;

    return (
        <section
            className="error-summary"
            id={id}
            role="alert"
            aria-labelledby={titleId}
        >
            <h2 id={titleId}>{title}</h2>
            <p>{message}</p>
            {details.length > 0 ? (
                <ul>
                    {details.map((detail) => (
                        <li key={detail.field}>
                            <strong>{detail.label}:</strong> {detail.text}
                        </li>
                    ))}
                </ul>
            ) : null}
            {requestId ? (
                <p>
                    Referência do pedido: <code>{requestId}</code>
                </p>
            ) : null}
        </section>
    );
}
