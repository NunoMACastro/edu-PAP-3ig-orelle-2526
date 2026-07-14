/**
 * Guardrails puros para texto cosmético publicado ao cliente.
 *
 * O helper é partilhado pelo output do provider e pelos ajustes do consultor,
 * garantindo o mesmo bloqueio de identificadores internos, diagnósticos e
 * promessas independentemente da origem da redação.
 */
const PUBLIC_TECHNICAL_TOKEN_PATTERN =
    /\b(?:variantId|productId|recommendationId|schemaVersion|reportId|analysisId|userId|requestId|promptVersion|providerMetadata)\b/iu;
const UNSAFE_PROMISE_PATTERN =
    /\b(?:cura|diagn[óo]stico|resultado garantido|garantia de resultado|tratamento definitivo)\b/iu;
const SAFE_DIAGNOSTIC_DISCLAIMER_PATTERN =
    /(?:n[aã]o\s+(?:constitui|[ée]|representa)\s+(?:um\s+)?diagn[óo]stico|sem\s+finalidade\s+cl[ií]nica\s+ou\s+diagn[óo]stico)/giu;

/** Valida uma coleção de strings públicas. */
export function assertSafeCosmeticPublicStrings(values) {
    const strings = (Array.isArray(values) ? values : []).filter(
        (entry) => typeof entry === "string",
    );
    if (strings.some((entry) => PUBLIC_TECHNICAL_TOKEN_PATTERN.test(entry))) {
        throw new TypeError("Texto público contém identificadores internos");
    }
    if (
        strings.some((entry) =>
            UNSAFE_PROMISE_PATTERN.test(
                entry.replace(SAFE_DIAGNOSTIC_DISCLAIMER_PATTERN, ""),
            ),
        )
    ) {
        throw new TypeError("Texto público contém promessa ou diagnóstico");
    }
}

/** Extrai os campos redigidos do relatório v6 e aplica os guardrails comuns. */
export function assertSafeCosmeticPublicCopy(value) {
    assertSafeCosmeticPublicStrings([
        ...(value?.observations ?? []),
        value?.answerSummary,
        value?.assessment,
        ...(value?.routine ?? []).flatMap((step) => [
            step?.title,
            step?.reason,
            step?.instructions,
            ...(step?.cautions ?? []),
        ]),
        ...(value?.recommendations ?? []).flatMap((recommendation) => [
            recommendation?.explanation,
            recommendation?.usage,
            ...(recommendation?.cautions ?? []),
        ]),
        ...(value?.limitations ?? []),
    ]);
}
