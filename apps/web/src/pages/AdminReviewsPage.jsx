// apps/web/src/pages/AdminReviewsPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Painel de moderação de reviews.
 *
 * @function AdminReviewsPage
 * @returns {JSX.Element} UI admin para ocultar ou repor reviews.
 */
export function AdminReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [reasonById, setReasonById] = useState({});
    const [message, setMessage] = useState("");

    /**
     * Carrega reviews administrativas.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function loadReviews() {
        const data = await apiRequest("/admin/reviews");
        setReviews(data.reviews);
    }

    /**
     * Envia decisão de moderação.
     *
     * @async
     * @param {string} reviewId - Review alvo.
     * @param {"published"|"hidden"} status - Estado pretendido.
     * @returns {Promise<void>}
     */
    async function moderate(reviewId, status) {
        try {
            // O frontend envia apenas a decisão e o motivo.
            // O backend decide permissões, valida status e preserva rating/comment.
            await apiRequest(`/admin/reviews/${reviewId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    status,
                    moderationReason: reasonById[reviewId] ?? "",
                }),
            });
            setMessage("Review atualizada.");
            await loadReviews();
        } catch (err) {
            setMessage(err.message);
        }
    }

    useEffect(() => {
        loadReviews().catch((err) => setMessage(err.message));
    }, []);

    return (
        <section className="page-section">
            <h2>Moderação de avaliações</h2>
            {message && <p role="alert">{message}</p>}
            <ul>
                {reviews.map((review) => (
                    <li key={review.id}>
                        <strong>{review.productName}</strong>
                        <span> Nota {review.rating} - {review.status}</span>
                        <p>{review.comment}</p>
                        <input
                            aria-label="Motivo para ocultar"
                            value={reasonById[review.id] ?? ""}
                            // Guardamos motivos por ID para o admin poder preparar
                            // decisões diferentes em várias reviews antes de enviar.
                            onChange={(event) =>
                                setReasonById((current) => ({
                                    ...current,
                                    [review.id]: event.target.value,
                                }))
                            }
                        />
                        <button type="button" onClick={() => moderate(review.id, "hidden")}>
                            Ocultar
                        </button>
                        <button type="button" onClick={() => moderate(review.id, "published")}>
                            Publicar
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}