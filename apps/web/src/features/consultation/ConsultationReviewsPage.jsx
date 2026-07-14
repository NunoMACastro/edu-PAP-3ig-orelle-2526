/** Fila canónica de revisão humana para consultores e administradores. */
import { useEffect, useRef, useState } from "react";
import { ErrorSummary } from "../../components/ErrorSummary.jsx";
import {
    EmptyState,
    OrelleButton,
    PageHero,
    SectionCard,
    Skeleton,
    StatusBanner,
} from "../../components/OrelleUi.jsx";
import { collectionResourceStatus } from "../../hooks/asyncOperation.js";
import { useAsyncAction } from "../../hooks/useAsyncAction.js";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import {
    decideConsultationReview,
    downloadConsultationReviewPhoto,
    getConsultationReview,
    listConsultationReviews,
} from "./consultationApi.js";
import { CONSULTATION_GOAL_FALLBACKS } from "./consultationModel.js";

const REVIEW_STATUS_LABELS = Object.freeze({
    pending: "Pendente",
    approved: "Aprovada",
    adjusted: "Ajustada",
    needs_clarification: "Requer esclarecimento",
    withdrawn: "Retirada",
});

const REVIEW_STATUS_TONES = Object.freeze({
    pending: "warning",
    approved: "success",
    adjusted: "info",
    needs_clarification: "warning",
    withdrawn: "neutral",
});

const PHOTO_QUALITY_LABELS = Object.freeze({
    pass: "Qualidade confirmada",
    warning: "Qualidade aceite com avisos",
    inconclusive: "Qualidade inconclusiva",
    fail: "Qualidade insuficiente",
});

const ROUTINE_PRIORITY_OPTIONS = Object.freeze([
    ["essential", "Essencial"],
    ["recommended", "Recomendado"],
    ["optional", "Opcional"],
]);

const ROUTINE_SLOT_OPTIONS = Object.freeze([
    ["general", "Passo geral"],
    ["cleanse", "Limpeza"],
    ["tone_exfoliate", "Tonificação ou esfoliação"],
    ["treat", "Tratamento"],
    ["moisturize", "Hidratação"],
    ["protect", "Proteção solar"],
    ["prime", "Preparação"],
    ["primer", "Primer"],
    ["skin_tint", "Skin tint"],
    ["foundation", "Base"],
    ["color_corrector", "Corretor de cor"],
    ["concealer", "Corretor"],
    ["setting_powder", "Pó fixador"],
    ["blush", "Blush"],
    ["bronzer", "Bronzer"],
    ["contour", "Contorno"],
    ["highlighter", "Iluminador"],
    ["eyeshadow", "Sombra"],
    ["eyeliner", "Eyeliner"],
    ["mascara", "Máscara"],
    ["brow_product", "Sobrancelhas"],
    ["lip_liner", "Contorno labial"],
    ["lipstick", "Batom"],
    ["lip_gloss", "Gloss"],
    ["setting_spray", "Spray fixador"],
    ["set", "Fixação"],
    ["complexion", "Complexion"],
    ["cheeks", "Rosto"],
    ["eyes", "Olhos"],
    ["brows", "Sobrancelhas — legacy"],
    ["lips", "Lábios — legacy"],
]);

/** Badge semântico que mantém o estado legível em todos os temas. */
function ReviewStatusBadge({ status }) {
    return (
        <span
            className={`consultant-status-badge consultant-status-badge--${REVIEW_STATUS_TONES[status] ?? "neutral"}`}
        >
            {REVIEW_STATUS_LABELS[status] ?? "Estado indisponível"}
        </span>
    );
}

/** Botão de fila com estado selecionado e nome acessível completo. */
function ReviewQueueButton({ item, selected, onSelect }) {
    const summary = item.summary ?? "Consulta para revisão";

    return (
        <button
            type="button"
            aria-pressed={selected}
            aria-label={`${summary}: ${REVIEW_STATUS_LABELS[item.status] ?? "estado indisponível"}`}
            onClick={onSelect}
        >
            <strong>{summary}</strong>
            <ReviewStatusBadge status={item.status} />
        </button>
    );
}

/** Lista segura de strings para o detalhe minimizado da revisão. */
function ReviewTextList({ items = [] }) {
    const values = Array.isArray(items)
        ? items.filter((item) => typeof item === "string" && item.trim())
        : [];
    if (values.length === 0) return null;
    return (
        <ul>
            {values.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

/** Normaliza o editor multiline sem apagar cautelas existentes. */
function parseRoutineCautions(value) {
    return String(value ?? "")
        .split(/\r?\n/)
        .map((caution) => caution.trim())
        .filter(Boolean);
}

/** Formata valores históricos e atuais sem introduzir qualquer ação comercial. */
function formatPrice(priceCents) {
    return Number.isFinite(Number(priceCents))
        ? new Intl.NumberFormat("pt-PT", {
              style: "currency",
              currency: "EUR",
          }).format(Number(priceCents) / 100)
        : "Indisponível";
}

/** Converte a orientação editável no contrato canónico v6. */
function toAdjustedRecommendationPayload(
    recommendations,
    selectedIds,
    guidanceById,
) {
    const selected = new Set(selectedIds.map(String));
    return recommendations
        .filter(({ id }) => selected.has(String(id)))
        .map((recommendation) => {
            const guidance = guidanceById[recommendation.id] ?? {};
            return {
                recommendationId: recommendation.id,
                explanation: String(guidance.explanation ?? "").trim(),
                usage: String(guidance.usage ?? "").trim(),
                cautions: parseRoutineCautions(guidance.cautionsText),
            };
        });
}

/** Converte o estado do editor no contrato normalizado da API. */
function toAdjustedRoutinePayload(routine) {
    return routine.map((step) => ({
        ...(step.routineSlotCode
            ? { routineSlotCode: step.routineSlotCode }
            : {}),
        period: step.period,
        ...(step.priority ? { priority: step.priority } : {}),
        title: String(step.title ?? "").trim(),
        reason: String(step.reason ?? "").trim(),
        instructions: String(step.instructions ?? "").trim(),
        cautions: parseRoutineCautions(step.cautionsText ?? step.cautions),
    }));
}

/** Normaliza IDs como conjunto ordenado, sem depender da ordem visual. */
function normalizeRecommendationSelection(values = []) {
    return [...new Set(values.map(String).filter(Boolean))].sort();
}

/** Normaliza uma rotina recebida da API para comparação semântica. */
function normalizeRoutineForComparison(routine = []) {
    return (Array.isArray(routine) ? routine : []).map((step) => ({
        routineSlotCode: String(step?.routineSlotCode ?? ""),
        period: String(step?.period ?? ""),
        priority: String(step?.priority ?? ""),
        title: String(step?.title ?? "").trim(),
        reason: String(step?.reason ?? step?.description ?? "").trim(),
        instructions: String(step?.instructions ?? "").trim(),
        cautions: (Array.isArray(step?.cautions) ? step.cautions : []).map(
            (caution) => String(caution).trim(),
        ),
    }));
}

/** Fila e detalhe separados para preservar a lista se o detalhe falhar. */
export function ConsultationReviewsPage() {
    const detailHeadingRef = useRef(null);
    const queueHeadingRef = useRef(null);
    const [selectedReviewId, setSelectedReviewId] = useState("");
    const [decision, setDecision] = useState("approved");
    const [publicNote, setPublicNote] = useState("");
    const [internalNote, setInternalNote] = useState("");
    const [adjustedRecommendationIds, setAdjustedRecommendationIds] = useState([]);
    const [adjustedAssessment, setAdjustedAssessment] = useState("");
    const [adjustedRoutine, setAdjustedRoutine] = useState([]);
    const [adjustedGuidanceById, setAdjustedGuidanceById] = useState({});
    const [photoUrls, setPhotoUrls] = useState(null);
    const [completionMessage, setCompletionMessage] = useState("");
    const reviewsResource = useAsyncResource(
        ({ signal }) => listConsultationReviews({ signal }),
        { initialData: [], statusFromData: collectionResourceStatus },
    );
    const detailResource = useAsyncResource(
        ({ signal }, reviewId) => getConsultationReview(reviewId, { signal }),
        { initialData: null },
    );
    const decisionAction = useAsyncAction(
        ({ signal }, reviewId, input) =>
            decideConsultationReview(reviewId, input, { signal }),
    );
    const photoAction = useAsyncAction(async ({ signal }, reviewId) => {
        const [frontal, perfil] = await Promise.all([
            downloadConsultationReviewPhoto(reviewId, "frontal", { signal }),
            downloadConsultationReviewPhoto(reviewId, "perfil", { signal }),
        ]);
        return { frontal, perfil };
    });
    const loadReviews = reviewsResource.load;
    const loadDetail = detailResource.load;
    const setDetail = detailResource.setData;

    useEffect(() => {
        void loadReviews();
    }, [loadReviews]);

    useEffect(
        () => () => {
            if (photoUrls?.frontal) URL.revokeObjectURL(photoUrls.frontal);
            if (photoUrls?.perfil) URL.revokeObjectURL(photoUrls.perfil);
        },
        [photoUrls],
    );

    useEffect(() => {
        if (!completionMessage) return undefined;
        const timeoutId = window.setTimeout(
            () => setCompletionMessage(""),
            5_000,
        );
        return () => window.clearTimeout(timeoutId);
    }, [completionMessage]);

    async function openReview(reviewId) {
        setSelectedReviewId(reviewId);
        setDecision("approved");
        setPublicNote("");
        setInternalNote("");
        setAdjustedRecommendationIds([]);
        setAdjustedAssessment("");
        setAdjustedRoutine([]);
        setAdjustedGuidanceById({});
        setPhotoUrls(null);
        setCompletionMessage("");
        setDetail(null);
        const result = await loadDetail(reviewId);
        if (result.ok) {
            const detail = result.data;
            setAdjustedRecommendationIds(
                (detail?.recommendations ?? [])
                    .map((recommendation) => String(recommendation.id ?? ""))
                    .filter(Boolean),
            );
            setAdjustedGuidanceById(
                Object.fromEntries(
                    (detail?.recommendations ?? []).map((recommendation) => [
                        recommendation.id,
                        {
                            explanation: recommendation.explanation ?? "",
                            usage: recommendation.usage ?? "",
                            cautionsText: (
                                Array.isArray(recommendation.cautions)
                                    ? recommendation.cautions
                                    : []
                            ).join("\n"),
                        },
                    ]),
                ),
            );
            const assessment =
                detail?.report?.content?.assessment ??
                detail?.report?.content?.objectivesAssessment;
            setAdjustedAssessment(
                typeof assessment === "string" ? assessment : "",
            );
            const routine =
                detail?.report?.content?.routine ?? detail?.report?.routine ?? [];
            setAdjustedRoutine(
                (Array.isArray(routine) ? routine : []).map((step) => ({
                    routineSlotCode: String(step?.routineSlotCode ?? ""),
                    period: ["manha", "noite", "ocasional"].includes(
                        step?.period,
                    )
                        ? step.period
                        : "ocasional",
                    priority: ["essential", "recommended", "optional"].includes(
                        step?.priority,
                    )
                        ? step.priority
                        : "",
                    title: String(step?.title ?? ""),
                    reason: String(step?.reason ?? step?.description ?? ""),
                    instructions: String(step?.instructions ?? ""),
                    cautionsText: (Array.isArray(step?.cautions)
                        ? step.cautions
                        : []
                    ).join("\n"),
                })),
            );
            window.requestAnimationFrame(() => {
                detailHeadingRef.current?.focus();
            });
        }
    }

    /** Regressa à fila móvel e devolve o foco ao respetivo título. */
    function returnToQueue() {
        setSelectedReviewId("");
        setDetail(null);
        setPhotoUrls(null);
        window.requestAnimationFrame(() => queueHeadingRef.current?.focus());
    }

    /** Mantém um subset explícito das recomendações pertencentes à revisão. */
    function toggleAdjustedRecommendation(recommendationId, selected) {
        setAdjustedRecommendationIds((current) =>
            selected
                ? [...new Set([...current, recommendationId])]
                : current.filter((id) => id !== recommendationId),
        );
    }

    /** Atualiza um único campo de um passo sem misturar estado entre linhas. */
    function updateAdjustedRoutineStep(index, field, value) {
        setAdjustedRoutine((current) =>
            current.map((step, stepIndex) =>
                stepIndex === index ? { ...step, [field]: value } : step,
            ),
        );
    }

    /** Atualiza apenas a orientação do produto identificado. */
    function updateAdjustedGuidance(recommendationId, field, value) {
        setAdjustedGuidanceById((current) => ({
            ...current,
            [recommendationId]: {
                ...current[recommendationId],
                [field]: value,
            },
        }));
    }

    async function submitDecision(event) {
        event.preventDefault();
        const adjusted = decision === "adjusted";
        const result = await decisionAction.run(selectedReviewId, {
            decision,
            publicNote,
            ...(internalNote.trim() ? { internalNote } : {}),
            ...(adjusted
                ? {
                      adjustedRecommendationIds,
                      adjustedContent: {
                          assessment: adjustedAssessment.trim() || undefined,
                          routine:
                              adjustedRoutine.length > 0
                                  ? toAdjustedRoutinePayload(adjustedRoutine)
                                  : undefined,
                          recommendations: toAdjustedRecommendationPayload(
                              review?.recommendations ?? [],
                              adjustedRecommendationIds,
                              adjustedGuidanceById,
                          ),
                      },
                  }
                : {}),
        });
        if (!result.ok) return;
        if (["approved", "adjusted"].includes(result.data?.status)) {
            setCompletionMessage(
                result.data.status === "approved"
                    ? "Revisão aprovada e retirada da fila."
                    : "Revisão ajustada e retirada da fila.",
            );
            setSelectedReviewId("");
            setDetail(null);
            setPhotoUrls(null);
        } else {
            setDetail((current) => ({ ...current, ...result.data }));
        }
        await loadReviews();
    }

    async function loadAuthorizedPhotos() {
        const result = await photoAction.run(selectedReviewId);
        if (!result.ok) return;
        setPhotoUrls({
            frontal: URL.createObjectURL(result.data.frontal),
            perfil: URL.createObjectURL(result.data.perfil),
        });
    }

    const review = detailResource.data;
    const busy = decisionAction.status === "loading";
    const adjustedRoutinePayload = toAdjustedRoutinePayload(adjustedRoutine);
    const adjustedRoutineValid = adjustedRoutine.every((step) => {
        const cautions = parseRoutineCautions(step.cautionsText);
        return (
            ["manha", "noite", "ocasional"].includes(step.period) &&
            step.title.trim().length >= 2 &&
            step.title.trim().length <= 120 &&
            step.reason.trim().length >= 8 &&
            step.reason.trim().length <= 500 &&
            step.instructions.trim().length >= 4 &&
            step.instructions.trim().length <= 600 &&
            cautions.length <= 5 &&
            cautions.every((caution) => caution.length <= 300)
        );
    });
    const adjustedAssessmentValue = adjustedAssessment.trim();
    const adjustedAssessmentValid =
        adjustedAssessmentValue.length === 0 ||
        (adjustedAssessmentValue.length >= 20 &&
            adjustedAssessmentValue.length <= 2_400);
    const originalRecommendationIds = normalizeRecommendationSelection(
        (review?.recommendations ?? []).map((recommendation) =>
            String(recommendation.id ?? ""),
        ),
    );
    const productsChanged =
        JSON.stringify(
            normalizeRecommendationSelection(adjustedRecommendationIds),
        ) !== JSON.stringify(originalRecommendationIds);
    const originalAssessment = String(
        review?.report?.content?.assessment ??
            review?.report?.content?.objectivesAssessment ??
            "",
    ).trim();
    const assessmentChanged =
        adjustedAssessmentValue.length > 0 &&
        adjustedAssessmentValue !== originalAssessment;
    const originalRoutine =
        review?.report?.content?.routine ?? review?.report?.routine ?? [];
    const routineChanged =
        adjustedRoutinePayload.length > 0 &&
        JSON.stringify(
            normalizeRoutineForComparison(adjustedRoutinePayload),
        ) !==
            JSON.stringify(normalizeRoutineForComparison(originalRoutine));
    const adjustedRecommendationsPayload = toAdjustedRecommendationPayload(
        review?.recommendations ?? [],
        adjustedRecommendationIds,
        adjustedGuidanceById,
    );
    const originalGuidanceById = new Map(
        (review?.recommendations ?? []).map((recommendation) => [
            recommendation.id,
            {
                explanation: String(recommendation.explanation ?? "").trim(),
                usage: String(recommendation.usage ?? "").trim(),
                cautions: recommendation.cautions ?? [],
            },
        ]),
    );
    const guidanceChanged = adjustedRecommendationsPayload.some(
        (guidance) =>
            JSON.stringify({
                explanation: guidance.explanation,
                usage: guidance.usage,
                cautions: guidance.cautions,
            }) !== JSON.stringify(originalGuidanceById.get(guidance.recommendationId)),
    );
    const adjustedGuidanceValid = adjustedRecommendationsPayload.every(
        ({ explanation, usage, cautions }) =>
            explanation.length >= 8 &&
            explanation.length <= 500 &&
            usage.length >= 4 &&
            usage.length <= 600 &&
            cautions.length <= 5 &&
            cautions.every(
                (caution) => caution.length >= 1 && caution.length <= 300,
            ),
    );
    const hasMaterialAdjustment =
        productsChanged || assessmentChanged || routineChanged || guidanceChanged;
    const canUseV6Editors = Number(review?.report?.schemaVersion) >= 2;
    const isReviewStale =
        decisionAction.error?.details?.code === "REVIEW_STALE";

    return (
        <section className="consultation-flow consultation-reviews consultant-page">
            <PageHero
                eyebrow="Consultoria"
                title="Revisões de consultas"
                description="Revê apenas o relatório pedido. Fotografias só ficam disponíveis quando existe um grant explícito e válido."
                className="consultant-page-hero"
            />

            <ErrorSummary
                error={
                    reviewsResource.error ??
                    detailResource.error ??
                    decisionAction.error ??
                    photoAction.error
                }
                id="consultation-reviews-error"
            />
            {completionMessage && (
                <StatusBanner tone="success" title="Decisão concluída">
                    {completionMessage}
                </StatusBanner>
            )}
            {isReviewStale && (
                <StatusBanner tone="warning" title="Revisão desatualizada">
                    O catálogo ou o perfil mudou. O formulário foi preservado;
                    pede um esclarecimento ao cliente antes de voltar a decidir.
                </StatusBanner>
            )}

            <div
                className="consultation-reviews__layout"
                data-detail-open={Boolean(selectedReviewId)}
            >
                <SectionCard
                    title="Fila"
                    titleId="review-queue-title"
                    titleRef={queueHeadingRef}
                    description="Consultas que aguardam validação humana."
                    className="consultant-review-queue"
                >
                    {reviewsResource.status === "loading" && (
                        <Skeleton lines={4} label="A atualizar a fila" />
                    )}
                    {reviewsResource.status === "empty" && (
                        <EmptyState
                            title="Fila concluída"
                            description="Não existem revisões pendentes."
                        />
                    )}
                    <ul className="consultation-review-list">
                        {reviewsResource.data.map((item) => (
                            <li key={item.id}>
                                <ReviewQueueButton
                                    item={item}
                                    selected={selectedReviewId === item.id}
                                    onSelect={() => void openReview(item.id)}
                                />
                            </li>
                        ))}
                    </ul>
                </SectionCard>

                <SectionCard
                    title="Detalhe da revisão"
                    titleId="review-detail-title"
                    titleRef={detailHeadingRef}
                    description="Confirma a análise, os produtos e a rotina antes de decidir."
                    actions={
                        selectedReviewId ? (
                            <OrelleButton
                                type="button"
                                variant="ghost"
                                className="consultant-mobile-back"
                                onClick={returnToQueue}
                            >
                                Voltar à fila
                            </OrelleButton>
                        ) : null
                    }
                    className="consultant-review-detail"
                >
                    {detailResource.status === "loading" && (
                        <Skeleton lines={6} label="A carregar o detalhe" />
                    )}
                    {!review && detailResource.status !== "loading" && (
                        <EmptyState
                            title="Seleciona uma revisão"
                            description="Escolhe um item da fila para consultar o detalhe minimizado."
                        />
                    )}
                    {review && (
                        <>
                            <header className="consultant-review-detail__summary">
                                <div>
                                    <p>{review.summary}</p>
                                    <p>
                                        Relatório v{review.reportVersion ?? "—"}
                                        {review.report?.generatedAt
                                            ? ` · gerado em ${new Date(
                                                  review.report.generatedAt,
                                              ).toLocaleString("pt-PT")}`
                                            : ""}
                                        {review.requestedAt
                                            ? ` · pedido em ${new Date(
                                                  review.requestedAt,
                                              ).toLocaleString("pt-PT")}`
                                            : ""}
                                    </p>
                                </div>
                                <ReviewStatusBadge status={review.status} />
                            </header>
                            {(review.sourceLabels ?? []).length > 0 && (
                                <ul className="consultant-review-sources">
                                    {review.sourceLabels.map((source) => (
                                        <li key={source}>{source}</li>
                                    ))}
                                </ul>
                            )}
                            {review.report && (
                                <section
                                    className="consultant-review-block"
                                    aria-labelledby="review-report-title"
                                >
                                    <h3 id="review-report-title">
                                        Conteúdo do relatório
                                    </h3>
                                    <h4>Objetivos</h4>
                                    <ul>
                                        {(review.report.objectives ?? []).map(
                                            (objective, index) => (
                                                <li
                                                    key={`${objective.code ?? "objective"}-${index}`}
                                                >
                                                    {CONSULTATION_GOAL_FALLBACKS[
                                                        objective.code
                                                    ]?.label ??
                                                        "Objetivo cosmético"}
                                                    {objective.priority
                                                        ? ` — ${
                                                              objective.priority ===
                                                              "primary"
                                                                  ? "prioritário"
                                                                  : "secundário"
                                                          }`
                                                        : ""}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                    <h4>Qualidade das fotografias</h4>
                                    <p>
                                        {PHOTO_QUALITY_LABELS[
                                            review.report.content?.photoQuality
                                                ?.status
                                        ] ?? "Qualidade não indicada"}
                                    </p>
                                    <ReviewTextList
                                        items={
                                            review.report.content?.photoQuality
                                                ?.reasons
                                        }
                                    />
                                    <ReviewTextList
                                        items={
                                            review.report.content?.photoQuality
                                                ?.warnings
                                        }
                                    />
                                    <h4>Resumo das respostas</h4>
                                    <p>
                                        {review.report.content?.answerSummary ??
                                            "Resumo indisponível."}
                                    </p>
                                    <h4>Avaliação cosmética</h4>
                                    <p>
                                        {review.report.content
                                            ?.objectivesAssessment ??
                                            review.report.content?.assessment ??
                                            "Avaliação indisponível."}
                                    </p>
                                    <ReviewTextList
                                        items={
                                            review.report.content?.observations
                                        }
                                    />
                                    <ReviewTextList
                                        items={
                                            review.report.content?.safetyFlags
                                        }
                                    />
                                    <h4>Rotina proposta</h4>
                                    <ol>
                                        {(
                                            review.report.content?.routine ??
                                            review.report.routine ??
                                            []
                                        ).map((step, index) => (
                                            <li
                                                key={`${step.title ?? "step"}-${index}`}
                                            >
                                                <strong>{step.title}</strong>
                                                <p>{step.reason}</p>
                                                {step.instructions && (
                                                    <p>
                                                        Como usar: {step.instructions}
                                                    </p>
                                                )}
                                                <ReviewTextList
                                                    items={step.cautions}
                                                />
                                                {(step.recommendationIds ?? [])
                                                    .length > 0 && (
                                                    <p>
                                                        Produtos associados:{" "}
                                                        {step.recommendationIds
                                                            .map(
                                                                (recommendationId) =>
                                                                    review.recommendations?.find(
                                                                        ({ id }) =>
                                                                            id ===
                                                                            recommendationId,
                                                                    )?.product
                                                                        ?.name,
                                                            )
                                                            .filter(Boolean)
                                                            .join(", ") ||
                                                            "associação indisponível"}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                    <h4>Limitações</h4>
                                    <ReviewTextList
                                        items={review.report.limitations}
                                    />
                                    <h4>Fontes do relatório</h4>
                                    <ReviewTextList
                                        items={review.report.sourceLabels}
                                    />
                                    <h4>Origem da análise</h4>
                                    <dl className="consultation-product-snapshot">
                                        <div>
                                            <dt>Tecnologia</dt>
                                            <dd>
                                                {review.report.provenance
                                                    ?.provider === "openai"
                                                    ? "Análise assistida por OpenAI"
                                                    : "Indisponível"}
                                            </dd>
                                        </div>
                                    </dl>
                                </section>
                            )}
                            {(review.recommendations ?? []).length > 0 && (
                                <section
                                    className="consultant-review-block"
                                    aria-labelledby="review-recommendations-title"
                                >
                                    <h3 id="review-recommendations-title">
                                        Recomendações propostas
                                    </h3>
                                    <ul className="consultation-recommendations">
                                        {review.recommendations.map(
                                            (recommendation) => (
                                                <li key={recommendation.id}>
                                                    <strong>
                                                        {recommendation.product?.name ??
                                                            "Produto recomendado"}
                                                    </strong>
                                                    {recommendation.product
                                                        ?.brandName && (
                                                        <p>
                                                            {
                                                                recommendation
                                                                    .product
                                                                    .brandName
                                                            }
                                                        </p>
                                                    )}
                                                    <dl className="consultation-product-snapshot">
                                                        <div>
                                                            <dt>Variante</dt>
                                                            <dd>
                                                                {recommendation
                                                                    .product
                                                                    ?.variant
                                                                    ?.label ??
                                                                    "Sem variante específica"}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt>
                                                                Preço histórico
                                                            </dt>
                                                            <dd>
                                                                {formatPrice(
                                                                    recommendation
                                                                        .product
                                                                        ?.priceCents,
                                                                )}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt>
                                                                Stock histórico
                                                            </dt>
                                                            <dd>
                                                                {recommendation
                                                                    .product
                                                                    ?.stock ??
                                                                    "—"}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt>Preço atual</dt>
                                                            <dd>
                                                                {formatPrice(
                                                                    recommendation
                                                                        .currentAvailability
                                                                        ?.priceCents,
                                                                )}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt>Stock atual</dt>
                                                            <dd>
                                                                {recommendation
                                                                    .currentAvailability
                                                                    ?.stock ?? 0}
                                                                {recommendation
                                                                    .currentAvailability
                                                                    ?.available
                                                                    ? " — disponível"
                                                                    : " — indisponível"}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt>Avaliação</dt>
                                                            <dd>
                                                                {Math.round(
                                                                    Number(
                                                                        recommendation.score ??
                                                                            0,
                                                                    ) * 100,
                                                                )}
                                                                %
                                                            </dd>
                                                        </div>
                                                    </dl>
                                                    <p>
                                                        {recommendation.explanation ??
                                                            "Explicação indisponível."}
                                                    </p>
                                                    <p>
                                                        Utilização:{" "}
                                                        {recommendation.usage ??
                                                            "Indisponível."}
                                                    </p>
                                                    <ReviewTextList
                                                        items={
                                                            recommendation.cautions
                                                        }
                                                    />
                                                    <h4>Evidências</h4>
                                                    <ReviewTextList
                                                        items={
                                                            recommendation.sourceLabels
                                                        }
                                                    />
                                                    <ReviewTextList
                                                        items={
                                                            recommendation.limitations
                                                        }
                                                    />
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </section>
                            )}
                            <section
                                className="consultant-review-block consultant-review-access"
                                aria-labelledby="review-photo-access-title"
                            >
                                <h3 id="review-photo-access-title">Fotografias</h3>
                                {review.photoAccess?.granted ? (
                                    <div>
                                    <p role="status">
                                        Grant de fotografias ativo até{" "}
                                        {new Date(
                                            review.photoAccess.expiresAt,
                                        ).toLocaleString("pt-PT")}.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void loadAuthorizedPhotos()}
                                        disabled={photoAction.status === "loading"}
                                    >
                                        {photoAction.status === "loading"
                                            ? "A abrir fotografias…"
                                            : "Ver fotografias autorizadas"}
                                    </button>
                                    {photoUrls && (
                                        <div className="consultation-review-photos">
                                            <figure>
                                                <img
                                                    src={photoUrls.frontal}
                                                    alt="Fotografia frontal autorizada para esta revisão"
                                                />
                                                <figcaption>Frontal</figcaption>
                                            </figure>
                                            <figure>
                                                <img
                                                    src={photoUrls.perfil}
                                                    alt="Fotografia de perfil autorizada para esta revisão"
                                                />
                                                <figcaption>Perfil</figcaption>
                                            </figure>
                                        </div>
                                    )}
                                    </div>
                                ) : (
                                    <p>Esta revisão não permite acesso às fotografias.</p>
                                )}
                            </section>
                            {review.status === "needs_clarification" && (
                                <StatusBanner
                                    tone="info"
                                    title="A aguardar esclarecimento"
                                >
                                    A aguardar a resposta do cliente ao esclarecimento.
                                </StatusBanner>
                            )}
                            {review.status === "pending" && (
                            <form
                                className="consultant-review-decision"
                                onSubmit={submitDecision}
                            >
                                <h3>Decisão do consultor</h3>
                                <label>
                                    Decisão
                                    <select
                                        value={decision}
                                        onChange={(event) =>
                                            setDecision(event.target.value)
                                        }
                                        disabled={busy}
                                    >
                                        <option value="approved">Aprovar</option>
                                        <option
                                            value="adjusted"
                                            disabled={!canUseV6Editors}
                                        >
                                            Ajustar
                                        </option>
                                        <option value="needs_clarification">
                                            Pedir esclarecimento
                                        </option>
                                    </select>
                                </label>
                                {!canUseV6Editors && (
                                    <p role="status">
                                        Os editores v6 não estão disponíveis
                                        nesta revisão legacy.
                                    </p>
                                )}
                                {decision === "adjusted" && (
                                    <div className="consultation-review-adjustment">
                                        <fieldset>
                                            <legend>Produtos mantidos no ajuste</legend>
                                            {(review.recommendations ?? []).length > 0 ? (
                                                <p>
                                                    Mantém selecionados apenas os produtos
                                                    que devem permanecer no relatório.
                                                </p>
                                            ) : (
                                                <p>
                                                    Este relatório não contém produtos. O
                                                    ajuste pode alterar a avaliação ou a
                                                    rotina.
                                                </p>
                                            )}
                                            {(review.recommendations ?? []).map(
                                                (recommendation) => (
                                                    <label key={recommendation.id}>
                                                        <input
                                                            type="checkbox"
                                                            checked={adjustedRecommendationIds.includes(
                                                                recommendation.id,
                                                            )}
                                                            onChange={(event) =>
                                                                toggleAdjustedRecommendation(
                                                                    recommendation.id,
                                                                    event.target.checked,
                                                                )
                                                            }
                                                            disabled={busy}
                                                        />
                                                        {recommendation.product?.name ??
                                                            "Produto recomendado"}
                                                    </label>
                                                ),
                                            )}
                                        </fieldset>
                                        <StatusBanner
                                            tone={
                                                adjustedRecommendationIds.length <
                                                originalRecommendationIds.length
                                                    ? "warning"
                                                    : "info"
                                            }
                                            title="Impacto da seleção final"
                                        >
                                            {adjustedRecommendationIds.length} de{" "}
                                            {originalRecommendationIds.length} produtos
                                            serão publicados. Os restantes deixam de
                                            aparecer no relatório, nos insights e na
                                            pré-visualização associada.
                                        </StatusBanner>
                                        {(review.recommendations ?? [])
                                            .filter(({ id }) =>
                                                adjustedRecommendationIds.includes(id),
                                            )
                                            .map((recommendation) => {
                                                const guidance =
                                                    adjustedGuidanceById[
                                                        recommendation.id
                                                    ] ?? {};
                                                const productName =
                                                    recommendation.product?.name ??
                                                    "Produto recomendado";
                                                return (
                                                    <fieldset key={recommendation.id}>
                                                        <legend>
                                                            Orientação — {productName}
                                                        </legend>
                                                        <label>
                                                            Explicação ajustada —{" "}
                                                            {productName}
                                                            <textarea
                                                                value={
                                                                    guidance.explanation ??
                                                                    ""
                                                                }
                                                                onChange={(event) =>
                                                                    updateAdjustedGuidance(
                                                                        recommendation.id,
                                                                        "explanation",
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                minLength={8}
                                                                maxLength={500}
                                                                required
                                                                disabled={busy}
                                                            />
                                                        </label>
                                                        <label>
                                                            Utilização ajustada —{" "}
                                                            {productName}
                                                            <textarea
                                                                value={
                                                                    guidance.usage ?? ""
                                                                }
                                                                onChange={(event) =>
                                                                    updateAdjustedGuidance(
                                                                        recommendation.id,
                                                                        "usage",
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                minLength={4}
                                                                maxLength={600}
                                                                required
                                                                disabled={busy}
                                                            />
                                                        </label>
                                                        <label>
                                                            Cautelas ajustadas —{" "}
                                                            {productName}
                                                            <textarea
                                                                value={
                                                                    guidance.cautionsText ??
                                                                    ""
                                                                }
                                                                onChange={(event) =>
                                                                    updateAdjustedGuidance(
                                                                        recommendation.id,
                                                                        "cautionsText",
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                maxLength={1_504}
                                                                disabled={busy}
                                                            />
                                                            <small>
                                                                Uma por linha;{" "}
                                                                {
                                                                    parseRoutineCautions(
                                                                        guidance.cautionsText,
                                                                    ).length
                                                                }
                                                                /5 cautelas.
                                                            </small>
                                                        </label>
                                                    </fieldset>
                                                );
                                            })}
                                        <label>
                                            Avaliação ajustada
                                            <textarea
                                                value={adjustedAssessment}
                                                onChange={(event) =>
                                                    setAdjustedAssessment(
                                                        event.target.value,
                                                    )
                                                }
                                                minLength={20}
                                                maxLength={2_400}
                                                disabled={busy}
                                            />
                                        </label>
                                        <fieldset>
                                            <legend>Rotina ajustada</legend>
                                            {adjustedRoutine.map((step, index) => (
                                                <div
                                                    className="consultation-routine-editor"
                                                    key={`routine-step-${index + 1}`}
                                                >
                                                    <h4>Passo {index + 1}</h4>
                                                    <p>
                                                        Produtos associados:{" "}
                                                        {(review.recommendations ?? [])
                                                            .filter(
                                                                (recommendation) =>
                                                                    adjustedRecommendationIds.includes(
                                                                        recommendation.id,
                                                                    ) &&
                                                                    (
                                                                        recommendation.routineSlotCodes ??
                                                                        []
                                                                    ).includes(
                                                                        step.routineSlotCode,
                                                                    ),
                                                            )
                                                            .map(
                                                                (recommendation) =>
                                                                    recommendation.product
                                                                        ?.name,
                                                            )
                                                            .filter(Boolean)
                                                            .join(", ") ||
                                                            "nenhum produto mantido"}
                                                    </p>
                                                    <label>
                                                        Função do passo {index + 1}
                                                        <select
                                                            value={step.routineSlotCode}
                                                            onChange={(event) =>
                                                                updateAdjustedRoutineStep(
                                                                    index,
                                                                    "routineSlotCode",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            disabled={busy}
                                                        >
                                                            <option value="">
                                                                Sem associação — relatório legacy
                                                            </option>
                                                            {ROUTINE_SLOT_OPTIONS.map(
                                                                ([value, label]) => (
                                                                    <option key={value} value={value}>
                                                                        {label}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </label>
                                                    <label>
                                                        Período do passo {index + 1}
                                                        <select
                                                            value={step.period}
                                                            onChange={(event) =>
                                                                updateAdjustedRoutineStep(
                                                                    index,
                                                                    "period",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            disabled={busy}
                                                        >
                                                            <option value="manha">Manhã</option>
                                                            <option value="noite">Noite</option>
                                                            <option value="ocasional">
                                                                Ocasional
                                                            </option>
                                                        </select>
                                                    </label>
                                                    <label>
                                                        Prioridade do passo {index + 1}
                                                        <select
                                                            value={step.priority}
                                                            onChange={(event) =>
                                                                updateAdjustedRoutineStep(
                                                                    index,
                                                                    "priority",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            disabled={busy}
                                                        >
                                                            <option value="">
                                                                Sem prioridade — relatório legacy
                                                            </option>
                                                            {ROUTINE_PRIORITY_OPTIONS.map(
                                                                ([value, label]) => (
                                                                    <option key={value} value={value}>
                                                                        {label}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </label>
                                                    <label>
                                                        Título do passo {index + 1}
                                                        <input
                                                            value={step.title}
                                                            onChange={(event) =>
                                                                updateAdjustedRoutineStep(
                                                                    index,
                                                                    "title",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            minLength={2}
                                                            maxLength={120}
                                                            required
                                                            disabled={busy}
                                                        />
                                                    </label>
                                                    <label>
                                                        Motivo do passo {index + 1}
                                                        <textarea
                                                            value={step.reason}
                                                            onChange={(event) =>
                                                                updateAdjustedRoutineStep(
                                                                    index,
                                                                    "reason",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            minLength={8}
                                                            maxLength={500}
                                                            required
                                                            disabled={busy}
                                                        />
                                                    </label>
                                                    <label>
                                                        Instruções do passo {index + 1}
                                                        <textarea
                                                            value={step.instructions}
                                                            onChange={(event) =>
                                                                updateAdjustedRoutineStep(
                                                                    index,
                                                                    "instructions",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            minLength={4}
                                                            maxLength={600}
                                                            required
                                                            disabled={busy}
                                                        />
                                                    </label>
                                                    <label>
                                                        Cautelas do passo {index + 1}
                                                        <textarea
                                                            value={step.cautionsText}
                                                            onChange={(event) =>
                                                                updateAdjustedRoutineStep(
                                                                    index,
                                                                    "cautionsText",
                                                                    event.target.value,
                                                                )
                                                            }
                                                            maxLength={1_504}
                                                            disabled={busy}
                                                        />
                                                        <small>
                                                            Uma por linha; {parseRoutineCautions(
                                                                step.cautionsText,
                                                            ).length}
                                                            /5 cautelas.
                                                        </small>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setAdjustedRoutine(
                                                                (current) =>
                                                                    current.filter(
                                                                        (_, stepIndex) =>
                                                                            stepIndex !==
                                                                            index,
                                                                    ),
                                                            )
                                                        }
                                                        disabled={busy}
                                                    >
                                                        Remover passo {index + 1}
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAdjustedRoutine((current) => [
                                                        ...current,
                                                        {
                                                            routineSlotCode: "general",
                                                            period: "manha",
                                                            priority: "recommended",
                                                            title: "",
                                                            reason: "",
                                                            instructions: "",
                                                            cautionsText: "",
                                                        },
                                                    ])
                                                }
                                                disabled={
                                                    busy || adjustedRoutine.length >= 30
                                                }
                                            >
                                                Adicionar passo
                                            </button>
                                        </fieldset>
                                        {!hasMaterialAdjustment && (
                                            <p role="status">
                                                Altera pelo menos a avaliação, a rotina, a
                                                seleção ou a orientação de um produto para
                                                guardar como ajustada.
                                            </p>
                                        )}
                                    </div>
                                )}
                                <label>
                                    Nota para o cliente
                                    <textarea
                                        value={publicNote}
                                        onChange={(event) =>
                                            setPublicNote(event.target.value)
                                        }
                                        maxLength={800}
                                        minLength={8}
                                        required
                                        disabled={busy}
                                    />
                                </label>
                                <label>
                                    Nota interna
                                    <textarea
                                        value={internalNote}
                                        onChange={(event) =>
                                            setInternalNote(event.target.value)
                                        }
                                        maxLength={1_000}
                                        disabled={busy}
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={
                                        busy ||
                                        (decision === "adjusted" &&
                                            (!hasMaterialAdjustment ||
                                                !adjustedAssessmentValid ||
                                                !adjustedRoutineValid ||
                                                !adjustedGuidanceValid))
                                    }
                                >
                                    {busy ? "A guardar…" : "Guardar decisão"}
                                </button>
                            </form>
                            )}
                        </>
                    )}
                </SectionCard>
            </div>
        </section>
    );
}
