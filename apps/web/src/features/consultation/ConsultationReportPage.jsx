/** Relatório: teaser, revisão, recomendações e visualização cosmética. */
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Link,
    NavLink,
    useLocation,
    useNavigate,
    useParams,
    useSearchParams,
} from "react-router-dom";
import { ErrorSummary } from "../../components/ErrorSummary.jsx";
import { NavIcon } from "../../components/NavIcon.jsx";
import { OptimizedImage } from "../../components/OptimizedImage.jsx";
import { useCart } from "../../context/CartContext.jsx";
import {
    OrelleButton,
    PageHero,
    Skeleton,
} from "../../components/OrelleUi.jsx";
import { useAsyncAction } from "../../hooks/useAsyncAction.js";
import { useAsyncResource } from "../../hooks/useAsyncResource.js";
import {
    createCosmeticVisualization,
    createPaymentIdempotencyKey,
    downloadAuthenticatedReportImage,
    downloadCosmeticVisualizationImage,
    finalizeConsultationReport,
    getConsultationReport,
    getCosmeticVisualization,
    requestConsultationReportReview,
    revokeConsultationReviewPhotoAccess,
    revokeCosmeticVisualizationConsent,
    submitConsultationRecommendationFeedback,
    submitCosmeticVisualizationFeedback,
    unlockConsultationReport,
    withdrawConsultationReportReview,
} from "./consultationApi.js";
import {
    CONSULTATION_GOAL_FALLBACKS,
    formatCents,
    getReportPhase,
    isReportUnlocked,
    isReviewPending,
} from "./consultationModel.js";

const PHOTO_QUALITY_LABELS = Object.freeze({
    pass: "Qualidade confirmada",
    warning: "Qualidade aceite com avisos",
    inconclusive: "Qualidade inconclusiva",
    fail: "Qualidade insuficiente",
});

const SOURCE_LABELS = Object.freeze({
    fotografia_frontal: "Fotografia frontal autorizada",
    fotografia_perfil: "Fotografia de perfil autorizada",
});

const REPORT_PHASE_LABELS = Object.freeze({
    draft_ready: "Rascunho pronto",
    review_pending: "Revisão humana pendente",
    needs_clarification: "Esclarecimento necessário",
    frozen_locked: "Versão final bloqueada",
    unlocked: "Relatório desbloqueado",
    completed: "Relatório concluído",
});

const REPORT_REVIEW_STATUS_LABELS = Object.freeze({
    pending: "Pendente",
    approved: "Aprovada",
    adjusted: "Ajustada",
    needs_clarification: "A aguardar esclarecimento",
    withdrawn: "Retirada",
});

const MAKEUP_STATUS_MESSAGES = Object.freeze({
    queued: "Pedido registado. Aguardamos o início da edição.",
    completed: "Pré-visualização pronta.",
    failed_retryable: "A edição foi interrompida. Podes tentar novamente.",
    failed_terminal: "Não foi possível criar esta pré-visualização.",
    consent_revoked: "A edição foi interrompida após revogares o consentimento.",
    cancelled: "A edição foi cancelada.",
    expired: "A pré-visualização expirou.",
});

const ACTIVE_VISUALIZATION_STATUSES = new Set(["queued", "processing"]);
const VISUALIZATION_POLL_INTERVAL_MS = 2_000;
const VISUALIZATION_POLL_MAX_BACKOFF_MS = 10_000;

/** Formata a duração operacional sem depender do locale do browser. */
function formatVisualizationElapsed(seconds) {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;
    return `${minutes} min ${String(remainingSeconds).padStart(2, "0")} s`;
}

/**
 * Compõe o estado da geração em blocos curtos sem prometer um tempo exato de
 * conclusão nem criar uma frase horizontal impossível de ler.
 */
function getVisualizationStatusPresentation(visualization, now = Date.now()) {
    if (visualization?.status !== "processing") {
        return {
            title:
                MAKEUP_STATUS_MESSAGES[visualization?.status] ??
                "Estado da pré-visualização indisponível.",
            description: "",
            elapsed: "",
        };
    }
    const startedAt = Date.parse(
        visualization.updatedAt ?? visualization.createdAt ?? "",
    );
    const elapsedSeconds = Number.isFinite(startedAt)
        ? Math.max(0, Math.floor((now - startedAt) / 1_000))
        : 0;
    const elapsed = formatVisualizationElapsed(elapsedSeconds);
    if (elapsedSeconds >= 180) {
        return {
            title: "A geração está a demorar mais do que o habitual",
            description:
                "Continuamos a acompanhar o pedido automaticamente até ao limite seguro.",
            elapsed,
        };
    }
    return {
        title: "A criar a tua pré-visualização",
        description:
            "O pedido já foi enviado. Uma edição complexa em alta qualidade pode demorar cerca de 2 minutos.",
        elapsed,
    };
}

/** Limita retries automáticos de polling a falhas transitórias. */
function isRetryableVisualizationPollError(error) {
    const status = Number(error?.status ?? 0);
    return (
        status === 0 ||
        status === 408 ||
        status === 429 ||
        status >= 500 ||
        ["NETWORK_ERROR", "REQUEST_TIMEOUT"].includes(error?.code)
    );
}

const VISUAL_INTENSITY_OPTIONS = Object.freeze([
    Object.freeze({ value: "subtle", label: "Subtil", description: "Leve, mas observável a 100%." }),
    Object.freeze({ value: "balanced", label: "Equilibrada", description: "Moderada, realista e com textura preservada." }),
    Object.freeze({ value: "marked", label: "Marcada", description: "Pronunciada, sem apagar identidade ou microtextura." }),
]);

const VISUAL_EFFECT_LABELS = Object.freeze({
    reduce_visible_superficial_imperfections: "Suavizar imperfeições superficiais visíveis",
    reduce_visible_dryness_and_flaking: "Reduzir secura e descamação visíveis",
    reduce_excess_specular_shine: "Reduzir brilho especular excessivo",
    reduce_visible_diffuse_redness: "Reduzir vermelhidão difusa visível",
    reduce_visible_spot_contrast: "Reduzir o contraste de manchas visíveis",
    reduce_recent_mark_contrast: "Reduzir o contraste de marcas recentes visíveis",
    improve_local_luminosity_without_exposure_change: "Melhorar subtilmente a luminosidade",
    improve_local_tone_uniformity: "Melhorar a uniformidade aparente",
    add_subtle_hydrated_finish: "Acrescentar um acabamento hidratado subtil",
    apply_sheer_tinted_complexion_coverage: "Aplicar cobertura com cor muito leve",
    apply_confirmed_catalog_makeup: "Aplicar a maquilhagem confirmada",
});

const VISUAL_ROLE_LABELS = Object.freeze({
    complexion: "Pele do rosto",
    cheeks: "Bochechas",
    eyes: "Olhos",
    brows: "Sobrancelhas",
    lips: "Lábios",
});

const MAKEUP_FUNCTION_LABELS = Object.freeze({
    primer: "Primer",
    skin_tint: "Skin tint",
    foundation: "Base",
    color_corrector: "Corretor de cor",
    concealer: "Corretor",
    setting_powder: "Pó fixador",
    blush: "Blush",
    bronzer: "Bronzer",
    contour: "Contorno",
    highlighter: "Iluminador",
    eyeshadow: "Sombra",
    eyeliner: "Eyeliner",
    mascara: "Máscara de pestanas",
    brow_product: "Sobrancelhas",
    lip_liner: "Lápis de lábios",
    lipstick: "Batom",
    lip_gloss: "Gloss ou óleo labial",
    setting_spray: "Spray fixador",
});

const MAKEUP_STYLE_LABELS = Object.freeze({
    natural_everyday: "Natural quotidiano",
    soft_classic: "Clássico suave",
    soft_glam: "Soft glam",
    gala_evening: "Gala ou noite",
    modern_editorial: "Moderno editorial",
    no_preference: "Sem estilo fechado",
});

/**
 * Agrupa limitações visuais repetitivas e remove códigos internos da UI.
 *
 * @param {unknown[]} limitations - Limitações do plano visual congelado.
 * @returns {Array<{title: string, description: string}>} Resumo público compacto.
 */
function summarizeVisualLimitations(limitations = []) {
    const unavailableFunctions = [];
    const unavailableRegions = [];
    const summaries = [];

    for (const limitation of Array.isArray(limitations) ? limitations : []) {
        const text = String(limitation ?? "").trim();
        const functionMatch = text.match(
            /^A função ([a-z_]+) foi omitida porque não existe um produto recomendado que a suporte\.?$/iu,
        );
        if (functionMatch) {
            unavailableFunctions.push(
                MAKEUP_FUNCTION_LABELS[functionMatch[1]] ?? "Produto de maquilhagem",
            );
            continue;
        }

        const regionMatch = text.match(
            /^A região ([a-z_]+) foi omitida porque não existe um produto recomendado que a suporte\.?$/iu,
        );
        if (regionMatch) {
            unavailableRegions.push(
                VISUAL_ROLE_LABELS[regionMatch[1]] ?? "Área da maquilhagem",
            );
            continue;
        }

        if (/proteção solar invisível|sem acabamento escolhido/iu.test(text)) {
            summaries.push({
                title: "Proteção solar sem efeito visível",
                description: "Uma opção invisível não produz uma alteração credível na fotografia.",
            });
            continue;
        }

        summaries.push({
            title: "Limitação do plano",
            description: toDisplayText(text, "Este efeito não pode ser representado com fidelidade."),
        });
    }

    const listFormatter = new Intl.ListFormat("pt-PT", {
        style: "long",
        type: "conjunction",
    });
    if (unavailableFunctions.length > 0) {
        summaries.unshift({
            title: "Sem produto compatível",
            description: listFormatter.format([...new Set(unavailableFunctions)]),
        });
    }
    if (unavailableRegions.length > 0) {
        summaries.unshift({
            title: "Áreas não cobertas",
            description: listFormatter.format([...new Set(unavailableRegions)]),
        });
    }

    return summaries;
}

const VISUAL_FEEDBACK_REASONS = Object.freeze([
    ["identity_or_geometry_changed", "A identidade ou geometria mudou"],
    ["wrong_area", "O efeito foi aplicado na área errada"],
    ["effect_too_weak", "O efeito ficou demasiado fraco"],
    ["effect_too_strong", "O efeito ficou demasiado forte"],
    ["wrong_color_or_finish", "A cor ou acabamento não corresponde"],
    ["lost_skin_texture", "Perdeu textura natural da pele"],
    ["other", "Outro problema de fidelidade"],
]);

const ROUTINE_PERIODS = Object.freeze([
    Object.freeze({ code: "manha", label: "Manhã" }),
    Object.freeze({ code: "noite", label: "Noite" }),
    Object.freeze({ code: "ocasional", label: "Quando necessário" }),
]);

const ROUTINE_PRIORITY_LABELS = Object.freeze({
    essential: "Essencial",
    recommended: "Recomendado",
    optional: "Opcional",
});

const INTERNAL_PUBLIC_COPY_REPLACEMENTS = Object.freeze([
    [/(?:\bvariantId\b)/giu, "uma variante compatível"],
    [/(?:\bproductId\b)/giu, "um produto compatível"],
    [/(?:\bschemaVersion\b)/giu, "a versão atual"],
    [/(?:\breportId\b|\banalysisId\b)/giu, "a referência interna"],
]);

/** Remove nomes técnicos que possam existir em relatórios legados. */
function sanitizePublicCopy(value) {
    if (typeof value !== "string") return value;
    return INTERNAL_PUBLIC_COPY_REPLACEMENTS.reduce(
        (text, [pattern, replacement]) => text.replace(pattern, replacement),
        value,
    );
}

/** Lista de texto segura que ignora estruturas inesperadas. */
function TextList({ items = [] }) {
    const values = Array.isArray(items)
        ? items.filter((item) => item !== null && item !== undefined)
        : [];
    if (values.length === 0) return null;
    return (
        <ul>
            {values.map((item, index) => (
                <li
                    key={
                        (typeof item === "object" &&
                            (item.id ?? item.code)) ||
                        `${String(item)}-${index}`
                    }
                >
                    {toDisplayText(
                        typeof item === "string"
                            ? item
                            : item.label ??
                                  item.title ??
                                  item.reason ??
                                  item.summary ??
                                  item.description,
                        "Informação cosmética",
                    )}
                </li>
            ))}
        </ul>
    );
}

/** Apresenta apenas os sete objetivos conhecidos e a respetiva prioridade. */
function ReportObjectiveList({ objectives = [] }) {
    const values = Array.isArray(objectives) ? objectives : [];
    if (values.length === 0) return <p>Objetivos indisponíveis.</p>;
    return (
        <ul>
            {values.map((objective, index) => {
                const code = String(objective?.code ?? objective ?? "");
                const label = CONSULTATION_GOAL_FALLBACKS[code]?.label;
                if (!label) return null;
                return (
                    <li key={`${code}-${index}`}>
                        {label}
                        {objective?.priority === "primary"
                            ? " — principal"
                            : objective?.priority === "secondary"
                              ? " — secundário"
                              : ""}
                    </li>
                );
            })}
        </ul>
    );
}

/** Extrai copy pública sem tentar refletir objetos internos no JSX. */
function toDisplayText(value, fallback = "Informação não disponível.") {
    if (typeof value === "string" && value.trim()) {
        return sanitizePublicCopy(value.trim());
    }
    if (Array.isArray(value)) {
        const text = value
            .filter((item) => typeof item === "string")
            .map(sanitizePublicCopy)
            .join(" ");
        return text || fallback;
    }
    if (value && typeof value === "object") {
        return toDisplayText(
            value.summary ?? value.description ?? value.label ?? value.text,
            fallback,
        );
    }
    return fallback;
}

/** Converte apenas o alias de leitura v2 num plano seguro para a UI nova. */
function normalizePublicVisualizationSpec(report) {
    const raw = report?.visualizationSpec ?? report?.simulationSpec;
    if (!raw || raw.enabled !== true) return raw ?? null;
    if (Array.isArray(raw.objectives)) return raw;
    const regions = Array.isArray(raw.regions) ? raw.regions : [];
    return {
        ...raw,
        objectives: [
            {
                code: "makeup",
                priority: "primary",
                effect: "apply_confirmed_catalog_makeup",
                regions,
            },
        ],
        makeup: {
            requestedRegions: regions,
            effectiveRegions: regions,
            requiresVariantConfirmation: false,
        },
        variantRecommendationIds: [],
        visualRecommendationIds: [],
        limitations: [],
    };
}

/** Produz uma entrada editorial curta sem descartar a leitura integral. */
function getAssessmentPreview(value) {
    const text = toDisplayText(value);
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [text];
    const preview = sentences.slice(0, 2).join(" ").trim();
    return {
        full: text,
        preview,
        hasMore: preview.length < text.length,
    };
}

/** Agrupa a rotina por momento do dia e preserva a ordem global dos passos. */
function groupRoutineSteps(steps) {
    const normalized = Array.isArray(steps)
        ? steps.map((step, index) => ({ step, index }))
        : [];
    return ROUTINE_PERIODS.map((period) => ({
        ...period,
        items: normalized.filter(({ step }) => step?.period === period.code),
    })).filter(({ items }) => items.length > 0);
}

/** Lista as prioridades escolhidas no início da consulta. */
function AssessmentPriorities({ objectives = [] }) {
    const knownObjectives = (Array.isArray(objectives) ? objectives : [])
        .map((objective) => {
            const code = String(objective?.code ?? objective ?? "");
            const fallback = CONSULTATION_GOAL_FALLBACKS[code];
            if (!fallback) return null;
            return { ...fallback, priority: objective?.priority };
        })
        .filter(Boolean);
    if (knownObjectives.length === 0) return null;

    return (
        <div className="consultation-report-assessment__priorities">
            <h3>Prioridades do teu plano</h3>
            <div>
                {knownObjectives.map((objective) => (
                    <article key={objective.code}>
                        <span>
                            {objective.priority === "primary"
                                ? "Prioridade principal"
                                : "Objetivo complementar"}
                        </span>
                        <h4>{objective.label}</h4>
                        <p>{objective.description}</p>
                    </article>
                ))}
            </div>
        </div>
    );
}

/** Grelha numerada de observações cosméticas. */
function ObservationGrid({ items = [], startIndex = 0 }) {
    if (items.length === 0) return null;
    return (
        <div className="consultation-report__cue-grid">
            {items.map((observation, index) => (
                <article key={`${observation}-${startIndex + index}`}>
                    <span>{String(startIndex + index + 1).padStart(2, "0")}</span>
                    <p>{toDisplayText(observation)}</p>
                </article>
            ))}
        </div>
    );
}

/** Cabeçalho visual reutilizado nas áreas extensas do relatório. */
function ReportSectionHeading({ icon, eyebrow, title, description }) {
    return (
        <header className="consultation-report-section__heading">
            <span className="consultation-report-section__icon">
                <NavIcon name={icon} />
            </span>
            <div>
                {eyebrow ? <p className="app-kicker">{eyebrow}</p> : null}
                <h2>{title}</h2>
                {description ? <p>{description}</p> : null}
            </div>
        </header>
    );
}

/**
 * Apresenta uma recomendação como produto editorial, preservando o snapshot
 * histórico e distinguindo-o da disponibilidade atual do catálogo.
 */
function _LegacyReportRecommendationCard({
    recommendation,
    selectedVariantId,
    onSelectVariant,
    onFeedback,
    feedbackBusy,
}) {
    const product = recommendation.product ?? {};
    const availability = recommendation.currentAvailability ?? {};
    const productName =
        product.name ??
        recommendation.productName ??
        recommendation.name ??
        "Produto recomendado";
    const productId = product.productId;
    const selectedVariant = recommendation.availableVariants?.find(
        ({ variantId }) => variantId === selectedVariantId,
    );
    const isAvailable =
        Boolean(productId) &&
        (selectedVariant
            ? selectedVariant.available === true
            : availability.available === true);
    const currentPriceCents =
        selectedVariant?.priceCents ?? availability.priceCents ?? product.priceCents;
    const priceChanged =
        Number.isInteger(product.priceCents) &&
        Number.isInteger(availability.priceCents) &&
        product.priceCents !== availability.priceCents;
    const productLocationVariantId =
        selectedVariantId || product.variant?.variantId || "";
    const productLocation = productId
        ? {
              pathname: `/produtos/${encodeURIComponent(productId)}`,
              search: productLocationVariantId
                  ? `?variant=${encodeURIComponent(productLocationVariantId)}`
                  : "",
          }
        : null;
    const makeupFunctions = (product.makeup?.functions ?? [])
        .map((value) => MAKEUP_FUNCTION_LABELS[value])
        .filter(Boolean);

    return (
        <li className="consultation-recommendation-card">
            <div className="consultation-recommendation-card__media">
                <OptimizedImage
                    src={product.imageUrl}
                    alt=""
                    width={720}
                    height={440}
                    sizes="(max-width: 760px) calc(100vw - 3rem), (max-width: 1200px) 40vw, 520px"
                />
                <span
                    className={`consultation-recommendation-card__availability ${
                        isAvailable
                            ? ""
                            : "consultation-recommendation-card__availability--unavailable"
                    }`.trim()}
                >
                    {isAvailable ? "Disponível" : "Temporariamente indisponível"}
                </span>
            </div>
            <div className="consultation-recommendation-card__body">
                <header className="consultation-recommendation-card__heading">
                    <div>
                        <p className="consultation-recommendation-card__brand">
                            {product.brandName ?? "Seleção Orélle"}
                        </p>
                        <h3>{productName}</h3>
                    </div>
                    <strong className="consultation-recommendation-card__price">
                        {formatCents(currentPriceCents)}
                    </strong>
                </header>

                {makeupFunctions.length > 0 ? (
                    <p className="consultation-recommendation-card__variant">
                        Função no plano: <strong>{makeupFunctions.join(" · ")}</strong>
                    </p>
                ) : null}

                {recommendation.availableVariants?.length > 0 ? (
                    <label className="consultation-recommendation-card__variant-picker">
                        <span>Confirma a variante</span>
                        <select
                            value={selectedVariantId ?? ""}
                            onChange={(event) =>
                                onSelectVariant(
                                    recommendation.id,
                                    event.target.value,
                                )
                            }
                        >
                            <option value="">Escolher variante</option>
                            {recommendation.availableVariants.map((variant) => (
                                <option
                                    key={variant.variantId}
                                    value={variant.variantId}
                                >
                                    {variant.label} · {formatCents(variant.priceCents)}
                                </option>
                            ))}
                        </select>
                        {product.variant?.label ? (
                            <small>
                                Sugestão inicial: {product.variant.label}. Confirma-a
                                antes de continuar.
                            </small>
                        ) : null}
                    </label>
                ) : product.variant?.label ? (
                    <p className="consultation-recommendation-card__variant">
                        Variante recomendada: <strong>{product.variant.label}</strong>
                    </p>
                ) : null}

                <p className="consultation-recommendation-card__reason">
                    {recommendation.explanation ?? recommendation.reason}
                </p>
                {recommendation.sourceLabels?.length > 0 ? (
                    <details className="consultation-recommendation-card__details">
                        <summary>Porque foi selecionado</summary>
                        <TextList items={recommendation.sourceLabels} />
                    </details>
                ) : null}

                {recommendation.usage ? (
                    <div className="consultation-recommendation-card__usage">
                        <NavIcon name="sparkles" />
                        <p>
                            <strong>Como usar</strong>
                            <span>{recommendation.usage}</span>
                        </p>
                    </div>
                ) : null}

                {recommendation.cautions?.length > 0 ||
                recommendation.limitations?.length > 0 ? (
                    <details className="consultation-recommendation-card__details">
                        <summary>Cuidados e limitações</summary>
                        <TextList items={recommendation.cautions} />
                        <TextList items={recommendation.limitations} />
                    </details>
                ) : null}

                <footer className="consultation-recommendation-card__footer">
                    <div>
                        <strong>
                            {isAvailable
                                ? `${selectedVariant?.stock ?? availability.stock ?? 0} unidades disponíveis`
                                : "Sem stock atual"}
                        </strong>
                        {priceChanged ? (
                            <span>
                                Preço no momento da consulta: {formatCents(product.priceCents)}
                            </span>
                        ) : null}
                    </div>
                    {isAvailable ? (
                        <Link className="text-link" to={productLocation}>
                            Ver produto disponível
                            <NavIcon name="arrow-right" />
                        </Link>
                    ) : (
                        <p className="consultation-restock-alert" role="status">
                            Produto temporariamente indisponível. Volta a consultar
                            a disponibilidade mais tarde.
                        </p>
                    )}
                </footer>
                <div className="consultation-recommendation-card__feedback">
                    <span>Esta recomendação foi útil?</span>
                    <button
                        type="button"
                        onClick={() => onFeedback(recommendation.id, "util")}
                        disabled={feedbackBusy}
                        aria-pressed={recommendation.feedback?.value === "util"}
                    >
                        Útil
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            onFeedback(recommendation.id, "nao_relevante")
                        }
                        disabled={feedbackBusy}
                        aria-pressed={
                            recommendation.feedback?.value === "nao_relevante"
                        }
                    >
                        Não relevante
                    </button>
                </div>
            </div>
        </li>
    );
}

/** Conteúdo completo, montado apenas depois de desbloqueio confirmado. */
function _LegacyUnlockedReportContent({
    report,
    cartAction,
    onAddToCart,
    selectedVariants,
    variantsConfirmed,
    onSelectVariant,
    onConfirmVariants,
    onRecommendationFeedback,
    feedbackBusy,
}) {
    const content =
        report.content && typeof report.content === "object"
            ? report.content
            : {};
    const recommendations = Array.isArray(report.recommendations)
        ? report.recommendations
        : Array.isArray(report.finalRecommendations)
          ? report.finalRecommendations
          : [];
    const routine = Array.isArray(content.routine)
        ? content.routine
        : Array.isArray(report.routineSuggestions)
          ? report.routineSuggestions
          : Array.isArray(report.routine)
            ? report.routine
            : [];
    const objectives = Array.isArray(report.objectives) ? report.objectives : [];
    const photoQuality = content.photoQuality ?? report.photoQuality ?? null;
    const provenance = report.provenance ?? {};
    const sources = (Array.isArray(report.sources) ? report.sources : [])
        .map((source) => SOURCE_LABELS[source])
        .filter(Boolean);
    const availableRecommendations = recommendations.filter((recommendation) => {
        const selectedVariantId = selectedVariants[recommendation.id];
        const selectedVariant = recommendation.availableVariants?.find(
            ({ variantId }) => variantId === selectedVariantId,
        );
        return (
            Boolean(recommendation.product?.productId) &&
            (selectedVariant
                ? selectedVariant.available === true
                : recommendation.currentAvailability?.available === true)
        );
    });
    const cartBusy = cartAction.status === "loading";
    const recommendationsWithVariants = recommendations.filter(
        ({ availableVariants }) => availableVariants?.length > 0,
    );
    const allVariantsSelected = recommendationsWithVariants.every(
        ({ id }) => Boolean(selectedVariants[id]),
    );
    const assessment = getAssessmentPreview(
        content.objectivesAssessment ??
            content.assessment ??
            content.summary ??
            report.cosmeticSummary ??
            report.summary,
    );
    const observations = Array.isArray(content.observations)
        ? content.observations
        : [];
    const visibleObservations = observations.slice(0, 3);
    const additionalObservations = observations.slice(3);
    const safetyFlags = Array.isArray(content.safetyFlags)
        ? content.safetyFlags
        : [];
    const routineGroups = groupRoutineSteps(routine);

    return (
        <div className="consultation-report__content">
            <nav className="consultation-report__jump-nav" aria-label="Conteúdo do relatório">
                <a href="#report-summary"><NavIcon name="dashboard" />Resumo</a>
                <a href="#report-assessment"><NavIcon name="face" />Avaliação</a>
                <a href="#report-routine"><NavIcon name="calendar" />Rotina</a>
                <a href="#report-products"><NavIcon name="bag" />Produtos</a>
            </nav>

            <section id="report-summary" className="consultation-report-section consultation-report-summary">
                <ReportSectionHeading
                    icon="dashboard"
                    eyebrow="Começa por aqui"
                    title="O essencial da tua consulta"
                    description="Uma leitura rápida antes de explorares o plano em detalhe."
                />
                <div className="consultation-report-summary__lead">
                    <h3>Resumo das respostas</h3>
                    <p>{toDisplayText(content.answerSummary ?? report.answerSummary)}</p>
                </div>
                <div className="consultation-report-summary__signals">
                    <article>
                        <span><NavIcon name="sparkles" /></span>
                        <div>
                            <h3>Objetivos da consulta</h3>
                            <ReportObjectiveList objectives={objectives} />
                        </div>
                    </article>
                    <article>
                        <span><NavIcon name="face" /></span>
                        <div>
                            <h3>Qualidade das fotografias</h3>
                            <p className="consultation-report__quality">
                                {PHOTO_QUALITY_LABELS[photoQuality?.status] ??
                                    "Qualidade não indicada"}
                            </p>
                            <TextList items={photoQuality?.reasons} />
                            <TextList items={photoQuality?.warnings} />
                        </div>
                    </article>
                </div>
            </section>

            <section id="report-assessment" className="consultation-report-section">
                <ReportSectionHeading
                    icon="face"
                    eyebrow="Leitura personalizada"
                    title="Avaliação cosmética"
                    description="Os sinais observados e o que significam para o teu plano."
                />
                <div className="consultation-report-assessment__overview">
                    <div>
                        <p className="app-kicker">Leitura principal</p>
                        <p className="consultation-report-section__lead">
                            {assessment.preview}
                        </p>
                        {assessment.hasMore ? (
                            <details className="consultation-report-disclosure">
                                <summary>Consultar leitura completa</summary>
                                <p>{assessment.full}</p>
                            </details>
                        ) : null}
                    </div>
                    <AssessmentPriorities objectives={objectives} />
                </div>

                {observations.length > 0 ? (
                    <div className="consultation-report-assessment__observations">
                        <h3>O que observámos</h3>
                        <ObservationGrid items={visibleObservations} />
                        {additionalObservations.length > 0 ? (
                            <details className="consultation-report-disclosure consultation-report-disclosure--observations">
                                <summary>
                                    Ver mais {additionalObservations.length}{" "}
                                    {additionalObservations.length === 1
                                        ? "observação"
                                        : "observações"}
                                </summary>
                                <ObservationGrid
                                    items={additionalObservations}
                                    startIndex={visibleObservations.length}
                                />
                            </details>
                        ) : null}
                    </div>
                ) : null}

                {safetyFlags.length > 0 ? (
                    <aside className="consultation-report-assessment__cautions">
                        <span><NavIcon name="shield" /></span>
                        <div>
                            <h3>Cuidados importantes</h3>
                            <TextList items={safetyFlags} />
                        </div>
                    </aside>
                ) : null}
            </section>

            <section id="report-routine" className="consultation-report-section">
                <ReportSectionHeading
                    icon="calendar"
                    eyebrow="Plano de ação"
                    title="Rotina sugerida"
                    description="Segue os passos por ordem e consulta as cautelas sempre que precisares."
                />
                {routine.length === 0 ? (
                    <p>Não existem passos de rotina disponíveis.</p>
                ) : (
                    <div className="consultation-report-routine__groups">
                        {routineGroups.map((group) => (
                            <section
                                className="consultation-report-routine__group"
                                key={group.code}
                                aria-labelledby={`routine-${group.code}`}
                            >
                                <header>
                                    <div>
                                        <p className="app-kicker">Momento do dia</p>
                                        <h3 id={`routine-${group.code}`}>
                                            {group.label}
                                        </h3>
                                    </div>
                                    <span>
                                        {group.items.length}{" "}
                                        {group.items.length === 1 ? "passo" : "passos"}
                                    </span>
                                </header>
                                <ol className="consultation-report__routine">
                                    {group.items.map(({ step, index }) => {
                                        const priority =
                                            ROUTINE_PRIORITY_LABELS[step.priority] ??
                                            (step.period === "ocasional"
                                                ? ROUTINE_PRIORITY_LABELS.optional
                                                : null);
                                        const hasDetails =
                                            Boolean(step.instructions) ||
                                            (Array.isArray(step.cautions) &&
                                                step.cautions.length > 0);
                                        return (
                                            <li
                                                key={
                                                    step.id ??
                                                    `${step.title ?? "step"}-${index}`
                                                }
                                            >
                                                <span>
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>
                                                <div>
                                                    <header>
                                                        <h4>
                                                            {toDisplayText(
                                                                step.title ?? group.label,
                                                            )}
                                                        </h4>
                                                        {priority ? (
                                                            <span className={`consultation-report-routine__priority consultation-report-routine__priority--${step.priority ?? "optional"}`}>
                                                                {priority}
                                                            </span>
                                                        ) : null}
                                                    </header>
                                                    <p>
                                                        {toDisplayText(
                                                            step.reason ?? step.description,
                                                        )}
                                                    </p>
                                                    {hasDetails ? (
                                                        <details className="consultation-report-disclosure consultation-report-routine__details">
                                                            <summary>
                                                                {step.instructions &&
                                                                step.cautions?.length
                                                                    ? "Como usar e cuidados"
                                                                    : step.instructions
                                                                      ? "Como usar"
                                                                      : "Cuidados"}
                                                            </summary>
                                                            <div>
                                                                {step.instructions ? (
                                                                    <p>
                                                                        <strong>
                                                                            Como usar:
                                                                        </strong>{" "}
                                                                        {toDisplayText(
                                                                            step.instructions,
                                                                        )}
                                                                    </p>
                                                                ) : null}
                                                                <TextList
                                                                    items={step.cautions}
                                                                />
                                                            </div>
                                                        </details>
                                                    ) : null}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </section>
                        ))}
                    </div>
                )}
            </section>

            <section id="report-products" className="consultation-report-section consultation-report-products">
                <ReportSectionHeading
                    icon="bag"
                    eyebrow="Seleção Orélle"
                    title="Produtos recomendados"
                    description="A seleção respeita os objetivos, as restrições e o orçamento indicado."
                />
                {availableRecommendations.length > 0 ? (
                    <div className="consultation-report-products__cart">
                        <div>
                            <strong>{availableRecommendations.length} produtos disponíveis</strong>
                            <span>Podes adicioná-los de uma vez e rever o carrinho antes de continuar.</span>
                        </div>
                        <OrelleButton
                            type="button"
                            onClick={() => onAddToCart(availableRecommendations)}
                            disabled={cartBusy || !variantsConfirmed}
                        >
                            <NavIcon name="cart" />
                            {cartBusy ? "A adicionar…" : "Adicionar sugestões ao carrinho"}
                        </OrelleButton>
                    </div>
                ) : null}
                {recommendationsWithVariants.length > 0 ? (
                    <div className="consultation-variant-confirmation">
                        <p>
                            As variantes são sugestões iniciais; confirma-as para
                            adicionar o conjunto ao carrinho ou gerar a imagem.
                        </p>
                        <OrelleButton
                            type="button"
                            variant="secondary"
                            onClick={onConfirmVariants}
                            disabled={!allVariantsSelected || variantsConfirmed}
                        >
                            {variantsConfirmed
                                ? "Variantes confirmadas"
                                : "Confirmar variantes"}
                        </OrelleButton>
                    </div>
                ) : null}
                <ErrorSummary error={cartAction.error} id="report-cart-error" />
                {cartAction.result?.addedCount > 0 ? (
                    <p className="consultation-report-products__success" role="status">
                        {cartAction.result.addedCount}{" "}
                        {cartAction.result.addedCount === 1
                            ? "produto adicionado"
                            : "produtos adicionados"}.{" "}
                        O carrinho pode ser revisto através do acesso global.
                    </p>
                ) : null}
                {recommendations.length === 0 ? (
                    <p>Não existem produtos elegíveis disponíveis neste momento.</p>
                ) : (
                    <ul className="consultation-recommendations">
                        {recommendations.map((recommendation, index) => (
                            <_LegacyReportRecommendationCard
                                key={
                                    recommendation.id ??
                                    `${recommendation.productId}-${index}`
                                }
                                recommendation={recommendation}
                                selectedVariantId={
                                    selectedVariants[recommendation.id] ?? ""
                                }
                                onSelectVariant={onSelectVariant}
                                onFeedback={onRecommendationFeedback}
                                feedbackBusy={feedbackBusy}
                            />
                        ))}
                    </ul>
                )}
            </section>
            <details className="consultation-report-methodology">
                <summary>Fontes, limitações e metodologia</summary>
                <div>
                    <section>
                        <h2>Fontes e limitações</h2>
                        <TextList items={sources} />
                        <TextList items={report.limitations} />
                    </section>
                    <section>
                        <h2>Como foi criada esta análise</h2>
                        <dl className="consultation-product-snapshot">
                            <div>
                                <dt>Tecnologia</dt>
                                <dd>
                                    {provenance.provider === "openai"
                                        ? "Análise assistida por OpenAI"
                                        : "Indisponível"}
                                </dd>
                            </div>
                            <div>
                                <dt>Revisão humana</dt>
                                <dd>
                                    {REPORT_REVIEW_STATUS_LABELS[
                                        report.review?.status
                                    ] ??
                                        (report.review ? "Concluída" : "Sem revisão")}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>
            </details>
        </div>
    );
}

const REPORT_WORKSPACE_SECTIONS = Object.freeze([
    { code: "resumo", label: "Resumo", icon: "dashboard" },
    { code: "plano", label: "Plano", icon: "calendar" },
    { code: "produtos", label: "Produtos", icon: "bag" },
    {
        code: "pre-visualizacao",
        label: "Pré-visualização",
        icon: "sparkles",
        visualizationOnly: true,
    },
    { code: "evidencias", label: "Evidências", icon: "shield" },
]);

const REPORT_SECTION_CODES = new Set(
    REPORT_WORKSPACE_SECTIONS.map(({ code }) => code),
);

const PRODUCT_CATEGORY_OPTIONS = Object.freeze([
    ["todos", "Todos", []],
    ["preparacao", "Preparação", ["cleanse", "tone_exfoliate", "moisturize", "protect", "prime", "primer"]],
    ["tratamento", "Tratamento", ["treat"]],
    ["complexion", "Complexion", ["skin_tint", "foundation", "color_corrector", "concealer", "complexion", "setting_powder"]],
    ["rosto", "Rosto", ["blush", "bronzer", "contour", "highlighter", "cheeks"]],
    ["olhos", "Olhos", ["eyeshadow", "eyeliner", "mascara", "eyes"]],
    ["sobrancelhas", "Sobrancelhas", ["brow_product", "brows"]],
    ["labios", "Lábios", ["lip_liner", "lipstick", "lip_gloss", "lips"]],
    ["fixacao", "Fixação", ["setting_spray", "set"]],
]);

const PRODUCT_CATEGORY_MAP = new Map(
    PRODUCT_CATEGORY_OPTIONS.map(([code, label, slots]) => [
        code,
        { code, label, slots: new Set(slots) },
    ]),
);

/** Resolve a área sem aceitar segmentos arbitrários no estado público. */
function getActiveReportSection(pathname, reportId) {
    const prefix = `/consulta/relatorios/${encodeURIComponent(reportId)}/`;
    const section = pathname.startsWith(prefix)
        ? pathname.slice(prefix.length).split("/")[0]
        : "";
    return REPORT_SECTION_CODES.has(section) ? section : "";
}

function buildReportSectionLocation(reportId, section, search = "") {
    return {
        pathname: `/consulta/relatorios/${encodeURIComponent(reportId)}/${section}`,
        search,
    };
}

/** Navegação persistente entre as áreas do relatório. */
function ReportWorkspaceNavigation({
    reportId,
    activeSection,
    visualizationEnabled,
    visualizationStatus,
}) {
    return (
        <div className="consultation-report-workspace__toolbar">
            <nav aria-label="Áreas do relatório">
                {REPORT_WORKSPACE_SECTIONS.filter(
                    ({ visualizationOnly }) =>
                        !visualizationOnly || visualizationEnabled,
                ).map(({ code, label, icon }) => {
                    const visualizationInProgress =
                        code === "pre-visualizacao" &&
                        ACTIVE_VISUALIZATION_STATUSES.has(visualizationStatus);

                    return (
                        <NavLink
                            key={code}
                            to={buildReportSectionLocation(
                                reportId,
                                code,
                            )}
                            aria-label={`${label}${visualizationInProgress ? " — em curso" : ""}`}
                            aria-current={
                                activeSection === code ? "page" : undefined
                            }
                        >
                            <NavIcon name={icon} />
                            <span>{label}</span>
                            {visualizationInProgress ? (
                                <span className="consultation-report-workspace__live-dot">
                                    Em curso
                                </span>
                            ) : null}
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}

function ReportSummaryArea({
    report,
    voucher,
    variantsConfirmed,
    visualizationSpec,
    visualization,
}) {
    const content = report.content ?? {};
    const routine = Array.isArray(report.routine) ? report.routine : [];
    const recommendations = Array.isArray(report.recommendations)
        ? report.recommendations
        : [];
    const objectives = Array.isArray(report.objectives) ? report.objectives : [];
    const primaryGoal = objectives.find(
        ({ priority }) => priority === "primary",
    );
    const primaryLabel =
        CONSULTATION_GOAL_FALLBACKS[primaryGoal?.code]?.label ??
        "Plano cosmético personalizado";
    const safetyFlags = Array.isArray(content.safetyFlags)
        ? content.safetyFlags
        : [];
    const requiresVariants = recommendations.some(
        ({ availableVariants }) => availableVariants?.length > 0,
    );
    const nextAction = requiresVariants && !variantsConfirmed
        ? {
              title: "Confirmar produtos e variantes",
              description:
                  "Revê as sugestões iniciais antes de adicionares o conjunto ao carrinho ou criares a imagem.",
              section: "produtos",
              label: "Rever produtos",
          }
        : visualizationSpec?.enabled && !visualization
          ? {
                title: "Preparar a pré-visualização",
                description:
                    "Confirma a intensidade, as variantes visuais e o consentimento para gerar a imagem.",
                section: "pre-visualizacao",
                label: "Preparar imagem",
            }
          : {
                title: "Explorar o plano por ordem",
                description:
                    "Consulta a sequência proposta e os produtos associados a cada passo.",
                section: "plano",
                label: "Abrir o plano",
            };

    return (
        <section className="consultation-report-area consultation-report-overview">
            <header className="consultation-report-overview__hero">
                <div>
                    <p className="app-kicker">A tua prioridade</p>
                    <h2>{primaryLabel}</h2>
                    <p>{toDisplayText(content.answerSummary ?? report.answerSummary)}</p>
                </div>
                <div className="consultation-report-overview__objectives">
                    <strong>Objetivos considerados</strong>
                    <ReportObjectiveList objectives={objectives} />
                </div>
            </header>

            {safetyFlags.length > 0 ? (
                <aside className="consultation-report-overview__safety" role="alert">
                    <NavIcon name="shield" />
                    <div>
                        <h3>Cuidados importantes</h3>
                        <TextList items={safetyFlags} />
                    </div>
                </aside>
            ) : null}

            <dl className="consultation-report-overview__metrics">
                <div><dt>Passos no plano</dt><dd>{routine.length}</dd></div>
                <div><dt>Produtos sugeridos</dt><dd>{recommendations.length}</dd></div>
                <div><dt>Total recomendado</dt><dd>{formatCents(report.access?.recommendedTotalCents)}</dd></div>
                <div>
                    <dt>Pré-visualização</dt>
                    <dd>{visualization ? MAKEUP_STATUS_MESSAGES[visualization.status] ?? "Disponível" : visualizationSpec?.enabled ? "Por criar" : "Não aplicável"}</dd>
                </div>
            </dl>

            <div className="consultation-report-overview__next">
                <span><NavIcon name="arrow-right" /></span>
                <div>
                    <p className="app-kicker">Próxima ação recomendada</p>
                    <h3>{nextAction.title}</h3>
                    <p>{nextAction.description}</p>
                </div>
                <Link
                    className="button-link"
                    to={buildReportSectionLocation(report.id, nextAction.section)}
                >
                    {nextAction.label}
                </Link>
            </div>

            <div className="consultation-report-overview__supporting">
                <article className="consultation-report-overview__photo-quality">
                    <h3>Fotografias</h3>
                    <strong className="status-chip">
                        {PHOTO_QUALITY_LABELS[content.photoQuality?.status] ??
                            "Qualidade não indicada"}
                    </strong>
                    <TextList items={content.photoQuality?.warnings} />
                </article>
                {voucher ? (
                    <article className="consultation-report-overview__voucher" role="status">
                        <h3>Voucher da simulação</h3>
                        <strong>{voucher.code}</strong>
                        <p>{formatCents(voucher.amountCents ?? voucher.valueCents)}</p>
                    </article>
                ) : null}
                {!visualizationSpec?.enabled && visualizationSpec?.limitations?.length ? (
                    <article>
                        <h3>Pré-visualização indisponível</h3>
                        <TextList items={visualizationSpec.limitations} />
                    </article>
                ) : null}
            </div>
        </section>
    );
}

function ReportPlanArea({ report, searchParams, setSearchParams }) {
    const routine = Array.isArray(report.routine) ? report.routine : [];
    const recommendations = Array.isArray(report.recommendations)
        ? report.recommendations
        : [];
    const recommendationMap = new Map(
        recommendations.map((recommendation) => [recommendation.id, recommendation]),
    );
    const availablePeriods = ROUTINE_PERIODS.filter(({ code }) =>
        routine.some(({ period }) => period === code),
    );
    const requestedPeriod = searchParams.get("periodo");
    const activePeriod = availablePeriods.some(
        ({ code }) => code === requestedPeriod,
    )
        ? requestedPeriod
        : availablePeriods[0]?.code;
    const visibleSteps = routine.filter(({ period }) => period === activePeriod);
    const safetyFlags = report.content?.safetyFlags ?? [];
    const hasStructuredAssociations = routine.some(({ routineSlotCode }) =>
        Boolean(routineSlotCode),
    );

    function selectPeriod(period) {
        const next = new URLSearchParams(searchParams);
        next.set("periodo", period);
        setSearchParams(next, { replace: true });
    }

    return (
        <section className="consultation-report-area consultation-report-plan">
            <ReportSectionHeading
                icon="calendar"
                eyebrow="Plano de ação"
                title="A tua rotina, passo a passo"
                description="Cada fase aparece na ordem certa e, nos relatórios mais recentes, ligada diretamente aos produtos correspondentes."
            />
            {safetyFlags.length > 0 ? (
                <aside className="consultation-report-plan__safety">
                    <strong>Cuidados que se aplicam a todo o plano</strong>
                    <TextList items={safetyFlags} />
                </aside>
            ) : null}
            {availablePeriods.length > 0 ? (
                <div className="consultation-report-plan__periods" role="group" aria-label="Momento da rotina">
                    {availablePeriods.map(({ code, label }) => (
                        <button
                            key={code}
                            type="button"
                            aria-pressed={activePeriod === code}
                            onClick={() => selectPeriod(code)}
                        >
                            {label}
                            <span>{routine.filter(({ period }) => period === code).length}</span>
                        </button>
                    ))}
                </div>
            ) : null}
            {visibleSteps.length === 0 ? (
                <p>Não existem passos disponíveis para este momento.</p>
            ) : (
                <ol className="consultation-report-plan__timeline">
                    {visibleSteps.map((step, index) => {
                        const relatedProducts = (step.recommendationIds ?? [])
                            .map((id) => recommendationMap.get(id))
                            .filter(Boolean);
                        return (
                            <li key={`${step.period}-${step.routineSlotCode ?? step.title}-${index}`}>
                                <span className="consultation-report-plan__number">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <article>
                                    <header>
                                        <div><h3>{toDisplayText(step.title)}</h3><p>{toDisplayText(step.reason)}</p></div>
                                        <span className={`consultation-report-routine__priority consultation-report-routine__priority--${step.priority ?? "optional"}`}>
                                            {ROUTINE_PRIORITY_LABELS[step.priority] ?? "Plano"}
                                        </span>
                                    </header>
                                    {relatedProducts.length > 0 ? (
                                        <div className="consultation-report-plan__products" aria-label="Produtos associados">
                                            {relatedProducts.map((recommendation) => (
                                                <Link
                                                    key={recommendation.id}
                                                    to={{
                                                        pathname: `/consulta/relatorios/${encodeURIComponent(report.id)}/produtos`,
                                                        search: `?produto=${encodeURIComponent(recommendation.id)}`,
                                                    }}
                                                >
                                                    {recommendation.product?.name ?? "Produto recomendado"}
                                                </Link>
                                            ))}
                                        </div>
                                    ) : hasStructuredAssociations ? (
                                        <p className="consultation-report-plan__unlinked">Passo educativo sem produto comercial associado.</p>
                                    ) : (
                                        <Link className="text-link" to={`/consulta/relatorios/${encodeURIComponent(report.id)}/produtos`}>
                                            Consultar os produtos deste relatório
                                        </Link>
                                    )}
                                    {step.instructions || step.cautions?.length ? (
                                        <details className="consultation-report-disclosure">
                                            <summary>Como usar e cuidados</summary>
                                            {step.instructions ? <p>{toDisplayText(step.instructions)}</p> : null}
                                            <TextList items={step.cautions} />
                                        </details>
                                    ) : null}
                                </article>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}

function getRecommendationAvailability(recommendation, selectedVariantId) {
    const selectedVariant = recommendation.availableVariants?.find(
        ({ variantId }) => variantId === selectedVariantId,
    );
    return {
        selectedVariant,
        available: selectedVariant
            ? selectedVariant.available === true
            : recommendation.currentAvailability?.available === true,
        priceCents:
            selectedVariant?.priceCents ??
            recommendation.currentAvailability?.priceCents ??
            recommendation.product?.priceCents,
        stock:
            selectedVariant?.stock ?? recommendation.currentAvailability?.stock ?? 0,
    };
}

function ReportProductCompactCard({
    recommendation,
    selectedVariantId,
    onSelectVariant,
    onOpen,
}) {
    const product = recommendation.product ?? {};
    const availability = getRecommendationAvailability(
        recommendation,
        selectedVariantId,
    );
    const functions = (product.makeup?.functions ?? [])
        .map((code) => MAKEUP_FUNCTION_LABELS[code])
        .filter(Boolean);
    return (
        <li className="consultation-report-product-card">
            <OptimizedImage
                src={product.imageUrl}
                alt=""
                width={360}
                height={240}
                sizes="(max-width: 720px) 40vw, 220px"
            />
            <div>
                <header>
                    <div><span>{product.brandName ?? "Seleção Orélle"}</span><h3>{product.name ?? "Produto recomendado"}</h3></div>
                    <strong>{formatCents(availability.priceCents)}</strong>
                </header>
                <p
                    className="consultation-report-product-card__availability"
                    role={availability.available ? undefined : "status"}
                >
                    {availability.available ? `${availability.stock} unidades disponíveis` : "Produto temporariamente indisponível"}
                </p>
                {Number.isInteger(product.priceCents) &&
                Number.isInteger(availability.priceCents) &&
                product.priceCents !== availability.priceCents ? (
                    <p className="consultation-report-product-card__availability">
                        Preço no momento da consulta: {formatCents(product.priceCents)}
                    </p>
                ) : null}
                {functions.length > 0 ? <p>Função: <strong>{functions.join(" · ")}</strong></p> : null}
                <p>{toDisplayText(recommendation.explanation ?? recommendation.reason)}</p>
                {recommendation.availableVariants?.length > 0 ? (
                    <label>
                        <span>Variante</span>
                        <select
                            value={selectedVariantId ?? ""}
                            onChange={(event) =>
                                onSelectVariant(recommendation.id, event.target.value)
                            }
                        >
                            <option value="">Escolher variante</option>
                            {recommendation.availableVariants.map((variant) => (
                                <option key={variant.variantId} value={variant.variantId}>
                                    {variant.label} · {formatCents(variant.priceCents)}
                                </option>
                            ))}
                        </select>
                    </label>
                ) : null}
                <button type="button" className="text-link" onClick={onOpen}>
                    Ver detalhe completo
                    <NavIcon name="arrow-right" />
                </button>
            </div>
        </li>
    );
}

/**
 * Separa uma evidência pública no respetivo contexto e valor para evitar uma
 * grelha de frases corridas difícil de percorrer visualmente.
 *
 * @param {unknown} sourceLabel - Evidência pública já autorizada pelo backend.
 * @returns {{context: string, value: string}} Partes seguras para apresentação.
 */
function formatProductEvidence(sourceLabel) {
    const text = toDisplayText(sourceLabel, "Informação cosmética");
    const separatorIndex = text.indexOf(":");

    if (separatorIndex < 0) {
        return { context: "Evidência", value: text };
    }

    const context = text.slice(0, separatorIndex).trim();
    const value = text.slice(separatorIndex + 1).trim();
    return {
        context: context
            ? `${context.charAt(0).toLocaleUpperCase("pt")}${context.slice(1)}`
            : "Evidência",
        value: value || "Informação confirmada",
    };
}

/** Lista editorial das razões determinísticas da recomendação. */
function ReportProductEvidenceList({ items = [] }) {
    const evidence = Array.isArray(items)
        ? items
              .filter((item) => item !== null && item !== undefined)
              .map(formatProductEvidence)
        : [];

    if (evidence.length === 0) return null;

    return (
        <ul className="consultation-report-product-drawer__evidence-list">
            {evidence.map(({ context, value }, index) => (
                <li key={`${context}-${value}-${index}`}>
                    <span>{context}</span>
                    <strong>{value}</strong>
                </li>
            ))}
        </ul>
    );
}

function ReportProductDetail({
    recommendation,
    selectedVariantId,
    onFeedback,
    feedbackBusy,
}) {
    if (!recommendation) return null;
    const product = recommendation.product ?? {};
    const productName = product.name ?? "Produto recomendado";
    const effectiveVariantId =
        selectedVariantId || product.variant?.variantId || "";
    const availability = getRecommendationAvailability(
        recommendation,
        effectiveVariantId,
    );
    const productLocation = product.productId
        ? `/produtos/${encodeURIComponent(product.productId)}${effectiveVariantId ? `?variant=${encodeURIComponent(effectiveVariantId)}` : ""}`
        : null;
    const priceChanged =
        Number.isInteger(product.priceCents) &&
        Number.isInteger(availability.priceCents) &&
        product.priceCents !== availability.priceCents;
    const cautions = Array.isArray(recommendation.cautions)
        ? recommendation.cautions
        : [];
    const limitations = Array.isArray(recommendation.limitations)
        ? recommendation.limitations
        : [];
    return (
        <div className="consultation-report-product-drawer__content">
            <div className="consultation-report-product-drawer__media">
                <OptimizedImage
                    src={product.imageUrl}
                    alt={`Apresentação de ${productName}`}
                    width={720}
                    height={540}
                    sizes="(max-width: 720px) 100vw, 640px"
                    className="consultation-report-product-drawer__image"
                />
            </div>
            <div className="consultation-report-product-drawer__summary">
                <div className="consultation-report-product-drawer__meta">
                    <span>{product.brandName ?? "Seleção Orélle"}</span>
                    <strong>{formatCents(availability.priceCents)}</strong>
                </div>
                <p
                    className="consultation-report-product-drawer__availability"
                    role={availability.available ? undefined : "status"}
                >
                    {availability.available
                        ? `${availability.stock} unidades disponíveis`
                        : "Produto temporariamente indisponível"}
                </p>
                {priceChanged ? (
                    <p className="consultation-report-product-drawer__historic-price">
                        Preço no momento da consulta: {formatCents(product.priceCents)}
                    </p>
                ) : null}
                <p className="consultation-report-product-drawer__description">
                    {toDisplayText(
                        recommendation.explanation ?? recommendation.reason,
                    )}
                </p>
            </div>
            {recommendation.sourceLabels?.length > 0 ? (
                <section className="consultation-report-product-drawer__section">
                    <h3>Porque foi selecionado</h3>
                    <ReportProductEvidenceList items={recommendation.sourceLabels} />
                </section>
            ) : null}
            {recommendation.usage ? (
                <section className="consultation-report-product-drawer__section">
                    <h3>Como usar</h3>
                    <p>{recommendation.usage}</p>
                </section>
            ) : null}
            {cautions.length > 0 || limitations.length > 0 ? (
                <section className="consultation-report-product-drawer__section consultation-report-product-drawer__section--cautions">
                    <h3>Cuidados e limitações</h3>
                    <TextList items={cautions} />
                    <TextList items={limitations} />
                </section>
            ) : null}
            <div className="consultation-report-product-drawer__actions">
                {productLocation && availability.available ? (
                    <Link className="button-link" to={productLocation}>
                        Ver produto disponível
                    </Link>
                ) : (
                    <p>
                        O registo histórico continua disponível, mas este produto não
                        pode ser adicionado ao carrinho neste momento.
                    </p>
                )}
            </div>
            <div className="consultation-recommendation-card__feedback consultation-report-product-drawer__feedback">
                <span>Esta recomendação foi útil?</span>
                <button type="button" onClick={() => onFeedback(recommendation.id, "util")} disabled={feedbackBusy} aria-pressed={recommendation.feedback?.value === "util"}>Útil</button>
                <button type="button" onClick={() => onFeedback(recommendation.id, "nao_relevante")} disabled={feedbackBusy} aria-pressed={recommendation.feedback?.value === "nao_relevante"}>Não relevante</button>
            </div>
        </div>
    );
}

function ReportProductsArea({
    report,
    searchParams,
    setSearchParams,
    selectedVariants,
    variantsConfirmed,
    onSelectVariant,
    onConfirmVariants,
    cartBusy,
    onAddToCart,
    onRecommendationFeedback,
    feedbackBusy,
}) {
    const dialogRef = useRef(null);
    const recommendations = Array.isArray(report.recommendations)
        ? report.recommendations
        : [];
    const query = String(searchParams.get("q") ?? "").trim().toLocaleLowerCase("pt");
    const categoryCode = PRODUCT_CATEGORY_MAP.has(searchParams.get("categoria"))
        ? searchParams.get("categoria")
        : "todos";
    const category = PRODUCT_CATEGORY_MAP.get(categoryCode);
    const requestedPage = Math.max(1, Number.parseInt(searchParams.get("pagina") ?? "1", 10) || 1);
    const selectedProductId = searchParams.get("produto") ?? "";
    const selectedRecommendation = recommendations.find(
        ({ id }) => id === selectedProductId,
    );
    const productDrawerTitleId = selectedRecommendation
        ? `recommendation-product-${selectedRecommendation.id}`
        : "recommendation-product-detail";
    const filtered = recommendations.filter((recommendation) => {
        const slots = recommendation.routineSlotCodes ?? [];
        const matchesCategory =
            category.code === "todos" || slots.some((slot) => category.slots.has(slot));
        const haystack = `${recommendation.product?.name ?? ""} ${recommendation.product?.brandName ?? ""}`.toLocaleLowerCase("pt");
        return matchesCategory && (!query || haystack.includes(query));
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / 6));
    const page = Math.min(requestedPage, totalPages);
    const visible = filtered.slice((page - 1) * 6, page * 6);
    const recommendationsWithVariants = recommendations.filter(
        ({ availableVariants }) => availableVariants?.length > 0,
    );
    const allVariantsSelected = recommendationsWithVariants.every(
        ({ id }) => Boolean(selectedVariants[id]),
    );
    const availableRecommendations = recommendations.filter((recommendation) =>
        getRecommendationAvailability(
            recommendation,
            selectedVariants[recommendation.id],
        ).available,
    );
    const availableTotal = availableRecommendations.reduce(
        (sum, recommendation) =>
            sum +
            Number(
                getRecommendationAvailability(
                    recommendation,
                    selectedVariants[recommendation.id],
                ).priceCents ?? 0,
            ),
        0,
    );

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (selectedRecommendation && !dialog.open) {
            if (typeof dialog.showModal === "function") dialog.showModal();
            else dialog.setAttribute("open", "");
        }
        if (!selectedRecommendation && dialog.open) {
            if (typeof dialog.close === "function") dialog.close();
            else dialog.removeAttribute("open");
        }
    }, [selectedRecommendation]);

    function updateQuery(values, { replace = true } = {}) {
        const next = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(values)) {
            if (value === null || value === undefined || value === "") next.delete(key);
            else next.set(key, String(value));
        }
        setSearchParams(next, { replace });
    }

    function closeProductDetail() {
        const dialog = dialogRef.current;
        if (typeof dialog?.close === "function") dialog.close();
        else dialog?.removeAttribute("open");
        updateQuery({ produto: null }, { replace: false });
    }

    return (
        <section className="consultation-report-area consultation-report-products-workspace">
            <ReportSectionHeading icon="bag" eyebrow="Seleção Orélle" title="Produtos recomendados" description="Filtra a proposta, confirma variantes e abre apenas o detalhe de que precisas." />
            <div className="consultation-report-products-workspace__controls">
                <label>
                    <span>Pesquisar produto ou marca</span>
                    <input type="search" value={searchParams.get("q") ?? ""} onChange={(event) => updateQuery({ q: event.target.value, pagina: 1, produto: null })} />
                </label>
                <div className="consultation-report-products-workspace__filters" role="group" aria-label="Filtrar por função">
                    {PRODUCT_CATEGORY_OPTIONS.map(([code, label]) => (
                        <button key={code} type="button" aria-pressed={categoryCode === code} onClick={() => updateQuery({ categoria: code === "todos" ? null : code, pagina: 1, produto: null })}>{label}</button>
                    ))}
                </div>
            </div>
            <p className="consultation-report-products-workspace__count">{filtered.length} {filtered.length === 1 ? "produto" : "produtos"}</p>
            {recommendationsWithVariants.length > 0 ? (
                <p className="consultation-report-products-workspace__variant-help">
                    <strong>O que é uma variante?</strong> É a versão do produto, como a cor, a cobertura ou o acabamento.
                </p>
            ) : null}
            {visible.length > 0 ? (
                <ul className="consultation-report-products-workspace__grid">
                    {visible.map((recommendation) => (
                        <ReportProductCompactCard
                            key={recommendation.id}
                            recommendation={recommendation}
                            selectedVariantId={selectedVariants[recommendation.id] ?? ""}
                            onSelectVariant={onSelectVariant}
                            onOpen={() => updateQuery({ produto: recommendation.id }, { replace: false })}
                        />
                    ))}
                </ul>
            ) : <p>Não existem produtos para este filtro.</p>}
            {totalPages > 1 ? (
                <nav className="consultation-report-products-workspace__pagination" aria-label="Páginas de produtos">
                    <button type="button" disabled={page === 1} onClick={() => updateQuery({ pagina: page - 1, produto: null })}>Anterior</button>
                    <span>Página {page} de {totalPages}</span>
                    <button type="button" disabled={page === totalPages} onClick={() => updateQuery({ pagina: page + 1, produto: null })}>Seguinte</button>
                </nav>
            ) : null}
            <div className="consultation-report-products-workspace__bulk">
                <div><strong>{availableRecommendations.length} disponíveis · {formatCents(availableTotal)}</strong><span>{recommendationsWithVariants.length > 0 ? variantsConfirmed ? "Variantes confirmadas" : "Confirma as variantes antes de continuar" : "Sem variantes por confirmar"}</span></div>
                {recommendationsWithVariants.length > 0 ? <OrelleButton type="button" variant="secondary" onClick={onConfirmVariants} disabled={!allVariantsSelected || variantsConfirmed}>{variantsConfirmed ? "Variantes confirmadas" : "Confirmar variantes"}</OrelleButton> : null}
                <OrelleButton type="button" onClick={() => onAddToCart(availableRecommendations)} disabled={cartBusy || !variantsConfirmed}>{cartBusy ? "A adicionar…" : "Adicionar ao carrinho"}</OrelleButton>
            </div>
            <dialog
                ref={dialogRef}
                className="consultation-report-product-drawer"
                aria-labelledby={productDrawerTitleId}
                onCancel={(event) => {
                    event.preventDefault();
                    closeProductDetail();
                }}
                onPointerDown={(event) => {
                    if (event.target === event.currentTarget) closeProductDetail();
                }}
                onClose={() => selectedProductId && updateQuery({ produto: null }, { replace: false })}
            >
                <header className="consultation-report-product-drawer__header">
                    <div>
                        <p className="app-kicker">Detalhe da recomendação</p>
                        <h2 id={productDrawerTitleId}>
                            {selectedRecommendation?.product?.name ?? "Produto recomendado"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        className="consultation-report-product-drawer__close"
                        onClick={closeProductDetail}
                        aria-label="Fechar"
                    >
                        Fechar
                    </button>
                </header>
                <ReportProductDetail recommendation={selectedRecommendation} selectedVariantId={selectedRecommendation ? selectedVariants[selectedRecommendation.id] : ""} onFeedback={onRecommendationFeedback} feedbackBusy={feedbackBusy} />
            </dialog>
        </section>
    );
}

function ReportEvidenceArea({ report }) {
    const content = report.content ?? {};
    const observations = Array.isArray(content.observations)
        ? content.observations
        : [];
    const assessment = toDisplayText(
        content.objectivesAssessment ?? content.assessment ?? report.cosmeticSummary,
    );
    const sources = (Array.isArray(report.sources) ? report.sources : [])
        .map((source) => SOURCE_LABELS[source])
        .filter(Boolean);
    const provenance = report.provenance ?? {};
    return (
        <section className="consultation-report-area consultation-report-evidence">
            <ReportSectionHeading icon="shield" eyebrow="Transparência" title="Evidências e limitações" description="A leitura completa, as fontes autorizadas e os limites que enquadram este plano." />
            <article><h3>Avaliação cosmética completa</h3><p>{assessment}</p></article>
            <article><h3>Observações</h3><ObservationGrid items={observations} /></article>
            <div className="consultation-report-evidence__grid">
                <article><h3>Qualidade das fotografias</h3><p>{PHOTO_QUALITY_LABELS[content.photoQuality?.status] ?? "Não indicada"}</p><TextList items={content.photoQuality?.reasons} /><TextList items={content.photoQuality?.warnings} /></article>
                <article><h3>Cuidados importantes</h3><TextList items={content.safetyFlags} /></article>
                <article><h3>Fontes autorizadas</h3><TextList items={sources} /></article>
                <article><h3>Limitações</h3><TextList items={report.limitations} /></article>
                <article><h3>Criação e revisão</h3><dl><div><dt>Tecnologia</dt><dd>{provenance.provider === "openai" ? "Análise assistida por OpenAI" : "Indisponível"}</dd></div><div><dt>Revisão humana</dt><dd>{REPORT_REVIEW_STATUS_LABELS[report.review?.status] ?? (report.review ? "Concluída" : "Sem revisão")}</dd></div></dl></article>
            </div>
        </section>
    );
}

/**
 * Mantém conteúdo bloqueado fora da árvore DOM; o ramo teaser nunca recebe o
 * relatório completo como texto escondido.
 */
export function ConsultationReportPage() {
    const { addLines, actionStatus: cartActionStatus } = useCart();
    const { reportId = "" } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeSection = getActiveReportSection(location.pathname, reportId);
    const paymentKey = useMemo(
        () => createPaymentIdempotencyKey(reportId),
        [reportId],
    );
    const [sharePhotos, setSharePhotos] = useState(false);
    const [voucher, setVoucher] = useState(null);
    const [makeupSimulation, setMakeupSimulation] = useState(null);
    const [makeupImageUrl, setMakeupImageUrl] = useState("");
    const [makeupSourceImageUrl, setMakeupSourceImageUrl] = useState("");
    const [makeupImageError, setMakeupImageError] = useState(null);
    const [makeupPollingError, setMakeupPollingError] = useState(null);
    const [visualizationClock, setVisualizationClock] = useState(() => Date.now());
    const [makeupConsentAccepted, setMakeupConsentAccepted] = useState(false);
    const [makeupConsentRevoked, setMakeupConsentRevoked] = useState(false);
    const [photoAccessGranted, setPhotoAccessGranted] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState({});
    const [variantsConfirmed, setVariantsConfirmed] = useState(false);
    const [visualIntensity, setVisualIntensity] = useState("balanced");
    const [comparisonMode, setComparisonMode] = useState("result");
    const [visualFeedbackReasons, setVisualFeedbackReasons] = useState([]);
    const zoomDialogRef = useRef(null);
    const variantsInitializedForReportRef = useRef(null);
    useEffect(() => {
        if (!searchParams.has("nivel")) return;
        const next = new URLSearchParams(searchParams);
        next.delete("nivel");
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);
    const reportResource = useAsyncResource(
        ({ signal }) => getConsultationReport(reportId, { signal }),
        { initialData: null },
    );
    const reportAction = useAsyncAction(
        async ({ signal }, operation, input = undefined) => {
            if (operation === "review") {
                return requestConsultationReportReview(
                    reportId,
                    input,
                    { signal },
                );
            }
            if (operation === "revoke-review-photos") {
                return revokeConsultationReviewPhotoAccess(reportId, { signal });
            }
            if (operation === "withdraw-review") {
                return withdrawConsultationReportReview(reportId, { signal });
            }
            if (operation === "finalize") {
                return finalizeConsultationReport(reportId, { signal });
            }
            if (operation === "unlock") {
                return unlockConsultationReport(
                    reportId,
                    paymentKey,
                    { signal },
                );
            }
            if (operation === "visualization") {
                return createCosmeticVisualization(reportId, input, { signal });
            }
            if (operation === "revoke-visualization-consent") {
                return revokeCosmeticVisualizationConsent(input, { signal });
            }
            throw new Error("Operação de relatório inválida.");
        },
    );
    const recommendationFeedbackAction = useAsyncAction(
        async ({ signal }, recommendationId, value) =>
            submitConsultationRecommendationFeedback(
                recommendationId,
                value,
                { signal },
            ),
    );
    const visualFeedbackAction = useAsyncAction(
        async ({ signal }, visualizationId, feedback) =>
            submitCosmeticVisualizationFeedback(
                visualizationId,
                feedback,
                { signal },
            ),
    );
    const loadReport = reportResource.load;
    const setReportData = reportResource.setData;

    useEffect(() => {
        setReportData(null);
        setVoucher(null);
        setMakeupSimulation(null);
        setMakeupPollingError(null);
        setMakeupConsentAccepted(false);
        setMakeupConsentRevoked(false);
        setSelectedVariants({});
        setVariantsConfirmed(false);
        variantsInitializedForReportRef.current = null;
        void loadReport();
    }, [loadReport, reportId, setReportData]);

    useEffect(() => {
        const simulationId = makeupSimulation?.id;
        const status = makeupSimulation?.status;
        if (!simulationId || !ACTIVE_VISUALIZATION_STATUSES.has(status)) {
            return undefined;
        }
        const controller = new AbortController();
        let timer = null;
        let failedPolls = 0;

        const schedulePoll = (delayMs) => {
            timer = window.setTimeout(poll, delayMs);
        };
        const poll = async () => {
            try {
                const visualization = await getCosmeticVisualization(
                    simulationId,
                    { signal: controller.signal },
                );
                if (controller.signal.aborted) return;
                failedPolls = 0;
                setMakeupPollingError(null);
                setMakeupSimulation(visualization);
            } catch (error) {
                if (controller.signal.aborted) return;
                setMakeupPollingError(error);
                if (!isRetryableVisualizationPollError(error)) return;
                failedPolls += 1;
            }
            if (!controller.signal.aborted) {
                schedulePoll(
                    Math.min(
                        VISUALIZATION_POLL_MAX_BACKOFF_MS,
                        VISUALIZATION_POLL_INTERVAL_MS * 2 ** failedPolls,
                    ),
                );
            }
        };

        schedulePoll(VISUALIZATION_POLL_INTERVAL_MS);
        return () => {
            controller.abort();
            if (timer !== null) window.clearTimeout(timer);
        };
    }, [makeupSimulation?.id, makeupSimulation?.status]);

    useEffect(() => {
        if (!ACTIVE_VISUALIZATION_STATUSES.has(makeupSimulation?.status)) {
            return undefined;
        }
        setVisualizationClock(Date.now());
        const timer = window.setInterval(
            () => setVisualizationClock(Date.now()),
            1_000,
        );
        return () => window.clearInterval(timer);
    }, [makeupSimulation?.status]);

    useEffect(() => {
        if (
            activeSection !== "pre-visualizacao" ||
            makeupSimulation?.status !== "completed" ||
            !makeupSimulation?.id ||
            !reportResource.data?.sourceImageUrl
        ) {
            setMakeupImageUrl("");
            setMakeupSourceImageUrl("");
            return undefined;
        }
        const controller = new AbortController();
        let outputObjectUrl = "";
        let sourceObjectUrl = "";
        setMakeupImageError(null);
        Promise.all([
            downloadCosmeticVisualizationImage(makeupSimulation.id, {
                signal: controller.signal,
            }),
            downloadAuthenticatedReportImage(
                reportResource.data.sourceImageUrl,
                { signal: controller.signal },
            ),
        ])
            .then(([outputBlob, sourceBlob]) => {
                outputObjectUrl = URL.createObjectURL(outputBlob);
                sourceObjectUrl = URL.createObjectURL(sourceBlob);
                setMakeupImageUrl(outputObjectUrl);
                setMakeupSourceImageUrl(sourceObjectUrl);
            })
            .catch((error) => {
                if (!controller.signal.aborted) setMakeupImageError(error);
            });
        return () => {
            controller.abort();
            if (outputObjectUrl) URL.revokeObjectURL(outputObjectUrl);
            if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
        };
    }, [
        makeupSimulation?.id,
        makeupSimulation?.status,
        reportResource.data?.sourceImageUrl,
        activeSection,
    ]);

    const report = reportResource.data;
    useEffect(() => {
        if (!report || !Object.hasOwn(report, "voucher")) return;
        setVoucher(report.voucher ?? null);
    }, [report]);

    useEffect(() => {
        if (
            !report ||
            (!Object.hasOwn(report, "visualization") &&
                !Object.hasOwn(report, "makeupSimulation"))
        ) {
            return;
        }
        const latestSimulation =
            report.visualization ?? report.makeupSimulation ?? null;
        setMakeupSimulation(latestSimulation);
        setMakeupConsentRevoked(
            ["consent_revoked", "cancelled"].includes(
                latestSimulation?.status,
            ),
        );
    }, [report]);

    useEffect(() => {
        if (!Array.isArray(report?.recommendations)) return;
        if (variantsInitializedForReportRef.current === report.id) return;
        const initial = Object.fromEntries(
            report.recommendations
                .filter(({ availableVariants }) => availableVariants?.length > 0)
                .map((recommendation) => {
                    const suggested =
                        recommendation.variantId ??
                        recommendation.product?.variant?.variantId ??
                        "";
                    return [
                        recommendation.id,
                        recommendation.availableVariants.some(
                            ({ variantId }) => variantId === suggested,
                        )
                            ? suggested
                            : "",
                    ];
                }),
        );
        setSelectedVariants(initial);
        setVariantsConfirmed(Object.keys(initial).length === 0);
        variantsInitializedForReportRef.current = report.id;
    }, [report?.id, report?.recommendations]);

    useEffect(() => {
        setPhotoAccessGranted(report?.review?.photoAccess?.granted === true);
    }, [report?.review?.photoAccess?.granted]);
    const phase = getReportPhase(report);
    const unlocked = isReportUnlocked(report);
    useEffect(() => {
        if (!report || !unlocked || activeSection) return;
        navigate(
            buildReportSectionLocation(
                reportId,
                "resumo",
            ),
            { replace: true },
        );
    }, [activeSection, navigate, report, reportId, unlocked]);
    const busy = reportAction.status === "loading";
    const teaser = report?.teaser ?? {};
    const access = report?.access ?? teaser.access ?? {};
    const depositCents =
        access.depositCents ?? teaser.depositCents ?? report?.depositCents;
    const recommendedTotalCents =
        access.recommendedTotalCents ??
        teaser.recommendedTotalCents ??
        report?.recommendedTotalCents;
    const recommendationCount =
        access.recommendationCount ??
        teaser.recommendationCount ??
        report?.recommendationCount ??
        0;
    const availableRecommendationCount =
        access.availableRecommendationCount ??
        teaser.availableRecommendationCount ??
        report?.availableRecommendationCount ??
        0;
    const canRequestMakeupPreview =
        !makeupSimulation ||
        ["failed_retryable", "failed_terminal", "expired", "cancelled"].includes(
            makeupSimulation.status,
        );
    const visualizationSpec = normalizePublicVisualizationSpec(report);
    useEffect(() => {
        if (
            !report ||
            !unlocked ||
            activeSection !== "pre-visualizacao" ||
            visualizationSpec?.enabled === true
        ) {
            return;
        }
        navigate(
            buildReportSectionLocation(
                reportId,
                "resumo",
            ),
            { replace: true },
        );
    }, [
        activeSection,
        navigate,
        report,
        reportId,
        unlocked,
        visualizationSpec?.enabled,
    ]);
    const requiredVariantRecommendationIds =
        visualizationSpec?.variantRecommendationIds ?? [];
    const visualRecommendationIds =
        visualizationSpec?.visualRecommendationIds ??
        requiredVariantRecommendationIds;
    const requiredVariantSelections = requiredVariantRecommendationIds
        .map((recommendationId) => ({
            recommendationId,
            variantId: selectedVariants[recommendationId],
        }))
        .filter(({ variantId }) => Boolean(variantId));
    const allRequiredVariantsSelected = requiredVariantRecommendationIds.every(
        (recommendationId) => Boolean(selectedVariants[recommendationId]),
    );
    const visualizationRecommendations = visualRecommendationIds
        .map((recommendationId) =>
            (report?.recommendations ?? []).find(
                ({ id }) => String(id) === String(recommendationId),
            ),
        )
        .filter(Boolean);
    const visualizationStatusPresentation = makeupSimulation
        ? getVisualizationStatusPresentation(
              makeupSimulation,
              visualizationClock,
          )
        : null;
    const makeupIsPrimary = (report?.objectives ?? []).some(
        ({ code, priority }) => code === "makeup" && priority === "primary",
    );
    const primaryMakeupVisualizationBlocked =
        makeupIsPrimary &&
        (!visualizationSpec?.objectives?.some(
            ({ code, effect }) =>
                code === "makeup" &&
                effect === "apply_confirmed_catalog_makeup",
        ) ||
            !visualizationSpec?.makeup?.effectiveRegions?.length ||
            visualRecommendationIds.length === 0 ||
            visualizationRecommendations.length === 0);

    async function runReportAction(operation, input = undefined) {
        const result = await reportAction.run(operation, input);
        if (!result.ok || !result.data) return;

        if (operation === "unlock") {
            setReportData(result.data.report);
            setVoucher(result.data.voucher);
            return;
        }
        if (operation === "visualization") {
            setMakeupSimulation(result.data);
            setMakeupPollingError(null);
            setVisualizationClock(Date.now());
            setMakeupConsentRevoked(false);
            setMakeupConsentAccepted(false);
            return;
        }
        if (operation === "revoke-visualization-consent") {
            setMakeupPollingError(null);
            setMakeupConsentRevoked(true);
            setMakeupConsentAccepted(false);
            setMakeupSimulation((current) =>
                current ? { ...current, status: "consent_revoked" } : current,
            );
            return;
        }
        if (operation === "review") {
            setPhotoAccessGranted(input?.grantPhotoAccess === true);
        }
        if (
            operation === "revoke-review-photos" ||
            operation === "withdraw-review"
        ) {
            setPhotoAccessGranted(false);
        }
        if (operation === "revoke-review-photos") {
            setSharePhotos(false);
            setReportData(result.data);
            return;
        }
        setReportData(result.data);
    }

    function selectVariant(recommendationId, variantId) {
        setSelectedVariants((current) => ({
            ...current,
            [recommendationId]: variantId,
        }));
        setVariantsConfirmed(false);
    }

    async function sendRecommendationFeedback(recommendationId, value) {
        const result = await recommendationFeedbackAction.run(
            recommendationId,
            value,
        );
        if (!result.ok) return;
        setReportData((current) => ({
            ...current,
            recommendations: current.recommendations.map((recommendation) =>
                recommendation.id === recommendationId
                    ? {
                          ...recommendation,
                          feedback: { value },
                          status:
                              value === "util" ? "accepted" : "dismissed",
                      }
                    : recommendation,
            ),
        }));
    }

    async function sendVisualFeedback(value) {
        if (!makeupSimulation?.id) return;
        const result = await visualFeedbackAction.run(
            makeupSimulation.id,
            {
                value,
                reasons: value === "fiel" ? [] : visualFeedbackReasons,
            },
        );
        if (result.ok) setMakeupSimulation(result.data);
    }

    if (reportResource.status === "loading" && !report) {
        return (
            <section className="consultation-flow" aria-busy="true">
                <PageHero eyebrow="Relatório da consulta" title="A preparar o teu plano cosmético" description="Estamos a organizar o conteúdo e as recomendações." />
                <Skeleton lines={5} />
            </section>
        );
    }

    return (
        <section className="consultation-flow consultation-report">
            <PageHero eyebrow="Relatório da consulta" title={teaser.title ?? report?.title ?? "O teu plano cosmético"} description="Um resumo claro da consulta, das recomendações e dos próximos passos.">
                {report ? <p className="consultation-status-pill">
                        {REPORT_PHASE_LABELS[phase] ?? "Estado em atualização"}
                    </p> : null}
            </PageHero>

            <ErrorSummary
                error={reportResource.error ?? reportAction.error}
                id="consultation-report-error"
            />

            {!report && reportResource.status !== "loading" && (
                <section className="consultation-notice">
                    <h2>Relatório indisponível</h2>
                    <Link className="text-link" to="/consulta/historico">
                        Voltar ao histórico
                    </Link>
                </section>
            )}

            {report && !unlocked && (
                <>
                    <section className="consultation-report__teaser">
                        <ReportSectionHeading
                            icon="sparkles"
                            eyebrow="Análise concluída"
                            title="O teu plano está pronto para finalizar"
                            description={
                                teaser.summary ??
                                "A consulta terminou e a versão final pode ser preparada."
                            }
                        />
                        <dl>
                            <div>
                                <dt>Produtos recomendados</dt>
                                <dd>{recommendationCount}</dd>
                            </div>
                            <div>
                                <dt>Disponíveis no cálculo</dt>
                                <dd>{availableRecommendationCount}</dd>
                            </div>
                            <div>
                                <dt>Total recomendado</dt>
                                <dd>{formatCents(recommendedTotalCents)}</dd>
                            </div>
                            <div>
                                <dt>Voucher da simulação</dt>
                                <dd>{formatCents(depositCents)}</dd>
                            </div>
                        </dl>
                        <div className="consultation-report__teaser-objectives">
                            <h3>Objetivos considerados</h3>
                            <ReportObjectiveList
                                objectives={teaser.objectives ?? report.objectives}
                            />
                        </div>
                    </section>

                    {phase === "draft_ready" && (
                        <section className="consultation-report-review">
                            <ReportSectionHeading
                                icon="review"
                                eyebrow="Tu decides"
                                title="Queres uma segunda opinião?"
                                description="A revisão humana é opcional. Também podes finalizar já o plano criado para ti."
                            />
                            <label className="consultation-report-review__consent">
                                <input
                                    type="checkbox"
                                    checked={sharePhotos}
                                    onChange={(event) =>
                                        setSharePhotos(event.target.checked)
                                    }
                                    disabled={busy}
                                />
                                <span>
                                    <strong>Permitir acesso temporário às fotografias</strong>
                                    <small>O consultor poderá vê-las apenas durante esta revisão, por um máximo de sete dias.</small>
                                </span>
                            </label>
                            <div className="consultation-report-review__actions">
                                <OrelleButton
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        void runReportAction("review", {
                                            grantPhotoAccess: sharePhotos,
                                            photoAccessNoticeVersion: sharePhotos
                                                ? report.consentNotices
                                                      ?.consultantPhotoAccess
                                                : undefined,
                                        })
                                    }
                                    disabled={
                                        busy ||
                                        (sharePhotos &&
                                            !report.consentNotices
                                                ?.consultantPhotoAccess)
                                    }
                                >
                                    {busy ? "A enviar…" : "Pedir revisão humana"}
                                </OrelleButton>
                                <OrelleButton
                                    type="button"
                                    onClick={() => void runReportAction("finalize")}
                                    disabled={busy}
                                >
                                    {busy ? "A finalizar…" : "Finalizar o meu plano"}
                                </OrelleButton>
                            </div>
                        </section>
                    )}

                    {isReviewPending(report) && (
                        <section>
                            <h2>Revisão pedida</h2>
                            <p>Podes retirar o pedido enquanto não existir uma decisão.</p>
                            {!photoAccessGranted &&
                                !report.review?.photoAccess?.granted && (
                                    <div className="consultation-photo-grant">
                                        <p>
                                            Esta revisão não herdou acesso a
                                            fotografias de versões anteriores. Podes
                                            concedê-lo explicitamente apenas para este
                                            relatório e por um máximo de sete dias.
                                        </p>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={sharePhotos}
                                                onChange={(event) =>
                                                    setSharePhotos(
                                                        event.target.checked,
                                                    )
                                                }
                                                disabled={busy}
                                            />
                                            Autorizo o consultor a ver as fotografias
                                            deste relatório durante a revisão
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void runReportAction("review", {
                                                    grantPhotoAccess: true,
                                                    photoAccessNoticeVersion:
                                                        report.consentNotices
                                                            ?.consultantPhotoAccess,
                                                })
                                            }
                                            disabled={
                                                busy ||
                                                !sharePhotos ||
                                                !report.consentNotices
                                                    ?.consultantPhotoAccess
                                            }
                                        >
                                            Conceder acesso às fotografias
                                        </button>
                                    </div>
                                )}
                            <button
                                type="button"
                                onClick={() => void runReportAction("withdraw-review")}
                                disabled={busy}
                            >
                                Retirar pedido de revisão
                            </button>
                            {(photoAccessGranted ||
                                report.review?.photoAccess?.granted) && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        void runReportAction(
                                            "revoke-review-photos",
                                        )
                                    }
                                    disabled={busy}
                                >
                                    Revogar apenas acesso às fotografias
                                </button>
                            )}
                        </section>
                    )}

                    {phase === "needs_clarification" && (
                        <section className="consultation-notice">
                            <h2>O consultor pediu um esclarecimento</h2>
                            <p>
                                {report.review?.clarificationQuestion ??
                                    "Responde à pergunta adicional para retomar a revisão."}
                            </p>
                            <Link className="button-link" to="/consulta/ativa">
                                Responder na consulta
                            </Link>
                        </section>
                    )}

                    {phase === "frozen_locked" && (
                        <section className="consultation-payment">
                            <ReportSectionHeading
                                icon="cart"
                                eyebrow="Último passo"
                                title="Simulação de pagamento"
                                description="Confirma a simulação para desbloquear o relatório completo."
                            />
                            {Number(depositCents) > 0 ? (
                                <p>
                                    Valor simulado (10%): <strong>{formatCents(depositCents)}</strong>.
                                    Ao confirmares, criamos automaticamente um voucher simulado do mesmo valor.
                                </p>
                            ) : (
                                <p>
                                    Não há produtos disponíveis, por isso o relatório é
                                    desbloqueado sem pagamento e sem voucher de valor zero.
                                </p>
                            )}
                            <div className="consultation-payment__actions">
                                <OrelleButton
                                    type="button"
                                    onClick={() => void runReportAction("unlock")}
                                    disabled={busy}
                                >
                                    {busy
                                        ? "A confirmar…"
                                        : Number(depositCents) > 0
                                          ? "Simular pagamento e desbloquear"
                                          : "Desbloquear relatório"}
                                </OrelleButton>
                            </div>
                        </section>
                    )}
                </>
            )}

            {report && unlocked && (
                <>
                    <ReportWorkspaceNavigation
                        reportId={report.id}
                        activeSection={activeSection || "resumo"}
                        visualizationEnabled={visualizationSpec?.enabled === true}
                        visualizationStatus={makeupSimulation?.status}
                    />
                    {(activeSection || "resumo") === "resumo" ? (
                        <ReportSummaryArea
                            report={report}
                            voucher={voucher}
                            variantsConfirmed={variantsConfirmed}
                            visualizationSpec={visualizationSpec}
                            visualization={makeupSimulation}
                        />
                    ) : null}
                    {activeSection === "plano" ? (
                        <ReportPlanArea
                            report={report}
                            searchParams={searchParams}
                            setSearchParams={setSearchParams}
                        />
                    ) : null}
                    {activeSection === "produtos" ? (
                        <ReportProductsArea
                            report={report}
                            searchParams={searchParams}
                            setSearchParams={setSearchParams}
                            selectedVariants={selectedVariants}
                            variantsConfirmed={variantsConfirmed}
                            onSelectVariant={selectVariant}
                            onConfirmVariants={() => setVariantsConfirmed(true)}
                            cartBusy={cartActionStatus === "loading"}
                            onAddToCart={(recommendations) => {
                                const lines = recommendations.map(
                                    (recommendation) => ({
                                        productId:
                                            recommendation.product?.productId,
                                        variantId:
                                            selectedVariants[recommendation.id] ??
                                            recommendation.product?.variant
                                                ?.variantId,
                                        quantity: 1,
                                    }),
                                );
                                void addLines(lines).catch(() => undefined);
                            }}
                            onRecommendationFeedback={sendRecommendationFeedback}
                            feedbackBusy={
                                recommendationFeedbackAction.status === "loading"
                            }
                        />
                    ) : null}
                    {activeSection === "evidencias" ? (
                        <ReportEvidenceArea report={report} />
                    ) : null}
                    {activeSection === "pre-visualizacao" &&
                    visualizationSpec?.enabled === true ? (
                        <section className="consultation-makeup-section">
                            <header>
                                <div>
                                    <p className="app-kicker">Observa as diferenças</p>
                                    <h2>Pré-visualização cosmética</h2>
                                </div>
                                <span />
                            </header>
                            <p className="consultation-makeup-section__intro">
                                Mostramos apenas efeitos compatíveis com o plano. A imagem
                                preserva identidade e textura e não representa uma previsão.
                            </p>
                            <div className="consultation-visual-intent">
                                <div>
                                    <h3>Efeitos previstos</h3>
                                    <ul className="consultation-visual-intent__list">
                                        {visualizationSpec.objectives.map((objective) => (
                                            <li key={`${objective.code}-${objective.effect}`}>
                                                {VISUAL_EFFECT_LABELS[objective.effect] ??
                                                    "Efeito cosmético localizado"}
                                                {objective.priority === "primary"
                                                    ? " — principal"
                                                    : ""}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {visualizationSpec.limitations?.length > 0 ? (
                                    <div>
                                        <h3>Não incluído</h3>
                                        <ul className="consultation-visual-intent__list consultation-visual-intent__list--limitations">
                                            {summarizeVisualLimitations(
                                                visualizationSpec.limitations,
                                            ).map((limitation, index) => (
                                                <li key={`${limitation.title}-${index}`}>
                                                    <strong>{limitation.title}</strong>
                                                    <span>{limitation.description}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                            {canRequestMakeupPreview && !makeupConsentRevoked && (
                                <div className="consultation-makeup-request">
                                    {primaryMakeupVisualizationBlocked ? (
                                        <div
                                            className="consultation-visual-blocked"
                                            role="alert"
                                        >
                                            <strong>
                                                Esta consulta não recolheu uma combinação
                                                de regiões e variantes de maquilhagem.
                                            </strong>
                                            <p>
                                                Para evitar uma imagem sem maquilhagem e
                                                custos desnecessários, a geração foi
                                                bloqueada neste relatório.
                                            </p>
                                            <Link className="button-link" to="/consulta/nova">
                                                Iniciar nova consulta
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            {visualizationRecommendations.length > 0 ? (
                                                <section className="consultation-visual-variants">
                                                    <header>
                                                        <div>
                                                            <h3>
                                                                Produtos e variantes usados
                                                                na imagem
                                                            </h3>
                                                            <p>
                                                                Confirma a cor ou o acabamento de
                                                                cada produto antes de gerar.
                                                                {visualizationSpec.makeup?.style
                                                                    ? ` Estilo: ${MAKEUP_STYLE_LABELS[visualizationSpec.makeup.style] ?? "personalizado"}.`
                                                                    : ""}
                                                            </p>
                                                        </div>
                                                        <span>
                                                            {
                                                                visualizationRecommendations.length
                                                            } {visualizationRecommendations.length === 1 ? "produto" : "produtos"}
                                                        </span>
                                                    </header>
                                                    <ul>
                                                        {visualizationRecommendations.map(
                                                            (recommendation) => {
                                                                const productName =
                                                                    recommendation.product
                                                                        ?.name ??
                                                                    "Produto de maquilhagem";
                                                                const roles = (
                                                                    recommendation.visualRoles ??
                                                                    []
                                                                )
                                                                    .map(
                                                                        (role) =>
                                                                            VISUAL_ROLE_LABELS[
                                                                                role
                                                                            ],
                                                                    )
                                                                    .filter(Boolean);
                                                                const functions = (
                                                                    recommendation.visualFunctions ??
                                                                    recommendation.product?.makeup
                                                                        ?.functions ??
                                                                    []
                                                                )
                                                                    .map(
                                                                        (value) =>
                                                                            MAKEUP_FUNCTION_LABELS[
                                                                                value
                                                                            ],
                                                                    )
                                                                    .filter(Boolean);
                                                                const requiresVariant =
                                                                    requiredVariantRecommendationIds.includes(
                                                                        recommendation.id,
                                                                    );
                                                                return (
                                                                    <li
                                                                        key={
                                                                            recommendation.id
                                                                        }
                                                                    >
                                                                        <div>
                                                                            <strong>
                                                                                {productName}
                                                                            </strong>
                                                                            <small>
                                                                                {[
                                                                                    ...functions,
                                                                                    ...roles,
                                                                                ].join(" · ") ||
                                                                                    "Camada cosmética confirmada"}
                                                                            </small>
                                                                        </div>
                                                                        {requiresVariant ? (
                                                                            <label>
                                                                                <span>
                                                                                    Variante para a
                                                                                    imagem
                                                                                </span>
                                                                                <select
                                                                                    aria-label={`Variante para ${productName}`}
                                                                                    value={
                                                                                        selectedVariants[
                                                                                            recommendation
                                                                                                .id
                                                                                        ] ?? ""
                                                                                    }
                                                                                    onChange={(event) =>
                                                                                        selectVariant(
                                                                                            recommendation.id,
                                                                                            event.target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                    disabled={busy}
                                                                                >
                                                                                    <option value="">
                                                                                        Escolher
                                                                                        variante
                                                                                    </option>
                                                                                    {recommendation.availableVariants?.map(
                                                                                        (
                                                                                            variant,
                                                                                        ) => (
                                                                                            <option
                                                                                                key={
                                                                                                    variant.variantId
                                                                                                }
                                                                                                value={
                                                                                                    variant.variantId
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    variant.label
                                                                                                }{" "}
                                                                                                ·{" "}
                                                                                                {formatCents(
                                                                                                    variant.priceCents,
                                                                                                )}
                                                                                            </option>
                                                                                        ),
                                                                                    )}
                                                                                </select>
                                                                            </label>
                                                                        ) : (
                                                                            <span className="consultation-visual-variants__not-required">
                                                                                Sem variante de cor
                                                                                necessária
                                                                            </span>
                                                                        )}
                                                                    </li>
                                                                );
                                                            },
                                                        )}
                                                    </ul>
                                                    {requiredVariantRecommendationIds.length > 0 ? <OrelleButton
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={() =>
                                                            setVariantsConfirmed(true)
                                                        }
                                                        disabled={
                                                            busy ||
                                                            !allRequiredVariantsSelected ||
                                                            variantsConfirmed
                                                        }
                                                    >
                                                        {variantsConfirmed
                                                            ? "Variantes da imagem confirmadas"
                                                            : "Confirmar variantes da imagem"}
                                                    </OrelleButton> : null}
                                                </section>
                                            ) : null}
                                            <fieldset className="consultation-visual-intensity">
                                                <legend>
                                                    Intensidade dos efeitos de pele
                                                </legend>
                                                {VISUAL_INTENSITY_OPTIONS.map(
                                                    (option) => (
                                                        <label key={option.value}>
                                                            <input
                                                                type="radio"
                                                                name="visual-intensity"
                                                                value={option.value}
                                                                checked={
                                                                    visualIntensity ===
                                                                    option.value
                                                                }
                                                                onChange={() =>
                                                                    setVisualIntensity(
                                                                        option.value,
                                                                    )
                                                                }
                                                                disabled={busy}
                                                            />
                                                            <span>
                                                                <strong>
                                                                    {option.label}
                                                                </strong>
                                                                <small>
                                                                    {option.description}
                                                                </small>
                                                            </span>
                                                        </label>
                                                    ),
                                                )}
                                            </fieldset>
                                            <label className="consultation-makeup-consent">
                                                <input
                                                    type="checkbox"
                                                    checked={makeupConsentAccepted}
                                                    onChange={(event) =>
                                                        setMakeupConsentAccepted(
                                                            event.target.checked,
                                                        )
                                                    }
                                                    disabled={busy}
                                                />
                                                <span>
                                                    <strong>
                                                        Autorizo esta edição cosmética
                                                        temporária
                                                    </strong>
                                                    <small>
                                                        A fotografia frontal é usada apenas
                                                        para criar esta pré-visualização e
                                                        não autoriza treino do modelo.
                                                    </small>
                                                </span>
                                            </label>
                                            <OrelleButton
                                                type="button"
                                                onClick={() =>
                                                    void runReportAction(
                                                        "visualization",
                                                        {
                                                            generativeEditAccepted:
                                                                makeupConsentAccepted,
                                                            generativeEditNoticeVersion:
                                                                report.consentNotices
                                                                    ?.generativeCosmeticVisualization,
                                                            intensity: visualIntensity,
                                                            variantSelections:
                                                                requiredVariantSelections,
                                                        },
                                                    )
                                                }
                                                disabled={
                                                    busy ||
                                                    !makeupConsentAccepted ||
                                                    !report.consentNotices
                                                        ?.generativeCosmeticVisualization ||
                                                    !allRequiredVariantsSelected ||
                                                    (requiredVariantRecommendationIds.length >
                                                        0 &&
                                                        !variantsConfirmed)
                                                }
                                            >
                                                {busy
                                                    ? "A pedir…"
                                                    : makeupSimulation?.status ===
                                                        "failed_retryable"
                                                      ? "Tentar novamente"
                                                      : "Criar pré-visualização em PNG"}
                                            </OrelleButton>
                                            {requiredVariantRecommendationIds.length > 0 &&
                                            !variantsConfirmed ? (
                                                <p role="status">
                                                    Confirma as variantes acima antes de
                                                    gerar a imagem.
                                                </p>
                                            ) : null}
                                        </>
                                    )}
                                </div>
                            )}
                            {makeupSimulation && visualizationStatusPresentation ? (
                                <aside
                                    className={`consultation-makeup-status consultation-makeup-status--${makeupSimulation.status}`}
                                    role="status"
                                    aria-live="polite"
                                >
                                    <span
                                        className="consultation-makeup-status__indicator"
                                    />
                                    <div className="consultation-makeup-status__copy">
                                        <strong>
                                            {visualizationStatusPresentation.title}
                                        </strong>
                                        {visualizationStatusPresentation.description ? (
                                            <p>
                                                {
                                                    visualizationStatusPresentation.description
                                                }
                                            </p>
                                        ) : null}
                                    </div>
                                    {visualizationStatusPresentation.elapsed ? (
                                        <div className="consultation-makeup-status__elapsed">
                                            <span>Tempo decorrido:</span>
                                            <strong>
                                                {visualizationStatusPresentation.elapsed}
                                            </strong>
                                        </div>
                                    ) : null}
                                </aside>
                            ) : null}
                            {makeupPollingError &&
                            ACTIVE_VISUALIZATION_STATUSES.has(
                                makeupSimulation?.status,
                            ) ? (
                                <p
                                    className="consultation-visual-poll-warning"
                                    role="alert"
                                >
                                    {isRetryableVisualizationPollError(
                                        makeupPollingError,
                                    )
                                        ? "Não foi possível atualizar o estado agora. Vamos tentar novamente automaticamente."
                                        : "Não foi possível voltar a localizar esta edição. Atualiza a página para sincronizar o relatório."}
                                </p>
                            ) : null}
                            {makeupSimulation?.id && !makeupConsentRevoked && (
                                <OrelleButton
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                        void runReportAction(
                                            "revoke-visualization-consent",
                                            makeupSimulation.id,
                                        )
                                    }
                                    disabled={busy}
                                >
                                    Revogar consentimento desta edição
                                </OrelleButton>
                            )}
                            {makeupConsentRevoked && (
                                <p role="status">
                                    Consentimento revogado. Nenhuma edição futura será
                                    publicada para este pedido.
                                </p>
                            )}
                            <ErrorSummary
                                error={makeupImageError}
                                id="makeup-image-error"
                            />
                            {makeupImageUrl && makeupSourceImageUrl && (
                                <div className="consultation-visual-result">
                                    <div className="consultation-makeup-comparison">
                                        <figure className="consultation-makeup-preview">
                                            <img
                                                src={makeupSourceImageUrl}
                                                alt="Fotografia original usada nesta pré-visualização"
                                            />
                                            <figcaption>Original autorizado</figcaption>
                                        </figure>
                                        <figure className="consultation-makeup-preview">
                                            <img
                                                src={makeupImageUrl}
                                                alt="Pré-visualização cosmética gerada para esta consulta"
                                            />
                                            <figcaption>
                                                Resultado ilustrativo gerado por IA.
                                            </figcaption>
                                        </figure>
                                    </div>
                                    <section className="consultation-visual-inspector">
                                        <header>
                                            <h3>Inspeção na mesma área</h3>
                                            <div role="group" aria-label="Imagem a observar">
                                                {[
                                                    ["original", "Original"],
                                                    ["result", "Resultado"],
                                                ].map(([value, label]) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => setComparisonMode(value)}
                                                        aria-pressed={comparisonMode === value}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </header>
                                        <button
                                            type="button"
                                            className="consultation-visual-inspector__image"
                                            onClick={() => zoomDialogRef.current?.showModal()}
                                        >
                                            <img
                                                src={
                                                    comparisonMode === "original"
                                                        ? makeupSourceImageUrl
                                                        : makeupImageUrl
                                                }
                                                alt={`${
                                                    comparisonMode === "original"
                                                        ? "Original"
                                                        : "Resultado"
                                                } — selecionar para ampliar a 100%`}
                                            />
                                            <span>Ampliar a 100%</span>
                                        </button>
                                    </section>
                                    <dialog
                                        ref={zoomDialogRef}
                                        className="consultation-visual-dialog"
                                        aria-label="Imagem cosmética ampliada a 100%"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => zoomDialogRef.current?.close()}
                                        >
                                            Fechar
                                        </button>
                                        <div>
                                            <img
                                                src={
                                                    comparisonMode === "original"
                                                        ? makeupSourceImageUrl
                                                        : makeupImageUrl
                                                }
                                                alt={
                                                    comparisonMode === "original"
                                                        ? "Fotografia original a 100%"
                                                        : "Resultado cosmético a 100%"
                                                }
                                            />
                                        </div>
                                    </dialog>
                                    <section className="consultation-visual-feedback">
                                        <h3>O resultado é fiel ao objetivo?</h3>
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => void sendVisualFeedback("fiel")}
                                                disabled={
                                                    visualFeedbackAction.status === "loading"
                                                }
                                            >
                                                Sim, é fiel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void sendVisualFeedback("pouco_fiel")
                                                }
                                                disabled={
                                                    visualFeedbackAction.status === "loading" ||
                                                    visualFeedbackReasons.length === 0
                                                }
                                            >
                                                Pouco fiel
                                            </button>
                                        </div>
                                        <fieldset>
                                            <legend>
                                                Se foi pouco fiel, escolhe até três razões
                                            </legend>
                                            {VISUAL_FEEDBACK_REASONS.map(([value, label]) => (
                                                <label key={value}>
                                                    <input
                                                        type="checkbox"
                                                        checked={visualFeedbackReasons.includes(
                                                            value,
                                                        )}
                                                        disabled={
                                                            !visualFeedbackReasons.includes(value) &&
                                                            visualFeedbackReasons.length >= 3
                                                        }
                                                        onChange={(event) =>
                                                            setVisualFeedbackReasons((current) =>
                                                                event.target.checked
                                                                    ? [...current, value]
                                                                    : current.filter(
                                                                          (reason) =>
                                                                              reason !== value,
                                                                      ),
                                                            )
                                                        }
                                                    />
                                                    {label}
                                                </label>
                                            ))}
                                        </fieldset>
                                    </section>
                                </div>
                            )}
                        </section>
                    ) : null}
                </>
            )}

            <aside className="consultation-disclaimer">
                Este relatório é cosmético e não constitui diagnóstico médico.
            </aside>
        </section>
    );
}
