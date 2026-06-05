import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ProductReviewPage() {
    const [productId, setProductId] = useState("");
    const [rating, setRating] = useState("5");
    const [comment, setComment] = useState("");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest(
                `/catalog/products/${productId}/reviews`,
                {
                    method: "POST",
                    body: JSON.stringify({ rating: Number(rating), comment }),
                },
            );
            setStatus("success");
            setMessage(`Avaliação registada com ID ${data.review.id}`);
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    return (
        <section>
            <h1>Avaliar produto</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <label>
                    Estrelas
                    <select
                        value={rating}
                        onChange={(event) => setRating(event.target.value)}
                    >
                        {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </label>
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
            </form>
            {message && <p role={status === "error" ? "alert" : undefined}>{message}</p>}
        </section>
    );
}