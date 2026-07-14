/**
 * Página administrativa de moderação de avaliações.
 */
import { useEffect, useState } from "react";
import { AdminIconButton, AdminPageHeader, AdminStatusBadge } from "../components/AdminUi.jsx";
import { EmptyState, Skeleton } from "../components/OrelleUi.jsx";
import { collectionResourceStatus } from "../hooks/asyncOperation.js";
import { useAsyncAction } from "../hooks/useAsyncAction.js";
import { useAsyncResource } from "../hooks/useAsyncResource.js";
import { apiRequest } from "../services/apiClient.js";
import { getProductReviewStatusLabel } from "../services/presentationLabels.js";

/**
 * Mostra reviews e permite ocultar/republicar sem editar conteudo.
 *
 * @function AdminReviewsPage
 * @returns {JSX.Element} UI de moderacao.
 */
export function AdminReviewsPage() {
    const [reason, setReason] = useState("Conteúdo fora das regras da comunidade.");
    const [message, setMessage] = useState("");
    const reviewsResource = useAsyncResource(
        async ({ signal }) => {
            const data = await apiRequest("/admin/reviews", { signal });
            return Array.isArray(data.reviews) ? data.reviews : [];
        },
        {
            initialData: [],
            statusFromData: collectionResourceStatus,
        },
    );
    const moderationAction = useAsyncAction(
        async ({ signal }, { reviewId, nextStatus, moderationReason }) => {
            const data = await apiRequest(`/admin/reviews/${reviewId}`, {
                method: "PATCH",
                signal,
                body: JSON.stringify({
                    status: nextStatus,
                    moderationReason,
                }),
            });
            return data.review;
        },
    );
    const reviews = reviewsResource.data;
    const loadReviewsResource = reviewsResource.load;
    useEffect(() => { void loadReviewsResource(); }, [loadReviewsResource]);

    /**
     * Carrega as reviews disponiveis para moderacao administrativa.
     *
     * @async
     * @function loadReviews
     * @returns {Promise<void>}
     */
    async function loadReviews() {
        setMessage("");
        await reviewsResource.load();
    }

    /**
     * Envia a decisao de moderacao e substitui localmente a review atualizada.
     *
     * @async
     * @function moderate
     * @param {string} reviewId - Review alvo da decisao.
     * @param {string} nextStatus - Estado de moderacao pretendido.
     * @returns {Promise<void>}
     */
    async function moderate(reviewId, nextStatus) {
        setMessage("");
        const result = await moderationAction.run({
            reviewId,
            nextStatus,
            moderationReason: nextStatus === "hidden" ? reason : "",
        });

        if (!result.ok) return;

        reviewsResource.setData((items) =>
            items.map((item) =>
                item.id === reviewId ? result.data : item,
            ),
        );
        setMessage("Avaliação moderada.");
    }

    return (
        <section className="admin-page admin-reviews-page">
            <AdminPageHeader eyebrow="Operações" title="Avaliações" description="Modera comentários sem editar o conteúdo publicado pelos clientes." actions={<AdminIconButton icon="refresh" label="Atualizar avaliações" onClick={loadReviews} disabled={reviewsResource.status === "loading"} />} />
            <label className="admin-panel admin-review-reason">
                Motivo para ocultar
                <input value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
            {reviewsResource.status === "loading" && reviews.length === 0 ? <Skeleton lines={4} /> : null}
            {reviewsResource.status === "error" ? (
                <p role="alert">{reviewsResource.error.message}</p>
            ) : null}
            {moderationAction.status === "error" ? (
                <p role="alert">{moderationAction.error.message}</p>
            ) : null}
            {reviewsResource.status === "empty" ? (
                <EmptyState title="Sem avaliações para moderar" description="As novas avaliações surgem automaticamente nesta página." />
            ) : null}
            {message ? <p role="status">{message}</p> : null}
            {reviews.length > 0 ? (
                <ul className="admin-review-list" aria-busy={reviewsResource.status === "loading"}>
                    {reviews.map((review) => (
                        <li key={review.id}>
                            <article className="admin-review-row">
                                <div><strong>{review.rating}/5</strong><AdminStatusBadge tone={review.status === "published" ? "success" : "neutral"}>{getProductReviewStatusLabel(review.status)}</AdminStatusBadge></div>
                                <blockquote>{review.comment}</blockquote>
                                <div className="admin-review-row__actions">
                                <button
                                    type="button"
                                    onClick={() => moderate(review.id, "hidden")}
                                    disabled={moderationAction.status === "loading"}
                                >
                                    Ocultar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moderate(review.id, "published")}
                                    disabled={moderationAction.status === "loading"}
                                >
                                    Republicar
                                </button>
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}
