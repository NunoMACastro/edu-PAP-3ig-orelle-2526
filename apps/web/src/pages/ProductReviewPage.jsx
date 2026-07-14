/**
 * Pagina de criacao de review por cliente autenticado.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHero, SectionCard } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formulário de avaliação de produto.
 *
 * @function ProductReviewPage
 * @returns {JSX.Element} Formulario de rating e comentario.
 */
export function ProductReviewPage() {
    const { productId } = useParams();
    const [rating, setRating] = useState("5");
    const [comment, setComment] = useState("");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    /**
     * Submete review sem enviar userId.
     *
     * @async
     * @function handleSubmit
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulario.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            await apiRequest(
                `/catalog/products/${productId}/reviews`,
                {
                    method: "POST",
                    body: JSON.stringify({ rating: Number(rating), comment }),
                },
            );
            setStatus("success");
            setMessage("Avaliação registada com sucesso.");
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    return (
        <section className="product-review-page">
            <PageHero eyebrow="A tua experiência" title="Avaliar produto" description="Partilha uma opinião honesta para ajudar outras pessoas a escolher com confiança." />
            <p>
                <Link to={`/produtos/${productId}`}>Voltar ao detalhe</Link>
            </p>
            <SectionCard title="A tua avaliação"><form onSubmit={handleSubmit}>
                <fieldset className="rating-fieldset"><legend>Classificação</legend><div role="radiogroup" aria-label="Classificação de uma a cinco estrelas">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <label key={value} className={Number(rating) === value ? "rating-option--selected" : ""}><input type="radio" name="rating" value={value} checked={Number(rating) === value} onChange={(event) => setRating(event.target.value)} /><span aria-hidden="true">★</span><span className="visually-hidden">{value} {value === 1 ? "estrela" : "estrelas"}</span></label>
                        ))}
                    </div></fieldset>
                <label>
                    Comentário
                    <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A enviar..." : "Enviar avaliação"}
                </button>
            </form></SectionCard>
            {message && (
                <p role={status === "error" ? "alert" : "status"}>
                    {message}
                </p>
            )}
        </section>
    );
}
