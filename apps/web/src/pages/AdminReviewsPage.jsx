/**
 * Pagina administrativa de moderacao de reviews.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Mostra reviews e permite ocultar/republicar sem editar conteudo.
 *
 * @function AdminReviewsPage
 * @returns {JSX.Element} UI de moderacao.
 */
export function AdminReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [reason, setReason] = useState("Conteúdo fora das regras da comunidade.");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    async function loadReviews() {
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/admin/reviews");
            setReviews(data.reviews);
            setStatus(data.reviews.length === 0 ? "empty" : "success");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    async function moderate(reviewId, nextStatus) {
        try {
            const data = await apiRequest(`/admin/reviews/${reviewId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: nextStatus,
                    moderationReason: nextStatus === "hidden" ? reason : "",
                }),
            });
            setReviews((items) =>
                items.map((item) => (item.id === reviewId ? data.review : item)),
            );
            setMessage("Review moderada.");
        } catch (err) {
            setMessage(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Moderação de avaliações</h1>
            <button onClick={loadReviews} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver avaliações"}
            </button>
            <label>
                Motivo para ocultar
                <input value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
            {status === "error" && <p role="alert">{message}</p>}
            {status === "empty" && <p>Sem avaliações para moderar.</p>}
            {message && status !== "error" && <p role="status">{message}</p>}
            {status === "success" && (
                <ul>
                    {reviews.map((review) => (
                        <li key={review.id}>
                            <article>
                                <p>
                                    {review.rating}/5 · {review.status}
                                </p>
                                <p>{review.comment}</p>
                                <button onClick={() => moderate(review.id, "hidden")}>
                                    Ocultar
                                </button>
                                <button onClick={() => moderate(review.id, "published")}>
                                    Republicar
                                </button>
                            </article>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
