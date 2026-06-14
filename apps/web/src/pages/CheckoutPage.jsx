import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Página que inicia o checkout do carrinho autenticado.
 * @returns {JSX.Element} Interface de seleção do método de pagamento.
 */
export function CheckoutPage() {
    const [paymentMethod, setPaymentMethod] = useState("stripe");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [order, setOrder] = useState(null);

    /**
     * Submete o método de pagamento e cria a encomenda no backend.
     * @param {React.FormEvent<HTMLFormElement>} event - Evento de submissão do formulário.
     * @returns {Promise<void>}
     */
    async function submitCheckout(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/orders/checkout", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ paymentMethod }),
            });
            setOrder(data.order);
            setStatus("success");

            if (data.order.payment.checkoutUrl) {
                // Só Stripe redireciona para checkout externo; PayPal/MBWay ficam pendentes.
                window.location.assign(data.order.payment.checkoutUrl);
            }
        } catch (err) {
            setError(err.message || "Não foi possível iniciar o pagamento.");
            setStatus("error");
        }
    }

    return (
        <main>
            <h1>Checkout</h1>
            <form onSubmit={submitCheckout}>
                <label>
                    Método de pagamento
                    <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="mbway">MBWay</option>
                    </select>
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A iniciar..." : "Confirmar encomenda"}
                </button>
            </form>
            {error ? <p role="alert">{error}</p> : null}
            {order ? (
                <section>
                    <h2>Encomenda criada</h2>
                    <p>Estado: {order.orderStatus}</p>
                    <p>Pagamento: {order.payment.status}</p>
                    {order.payment.checkoutUrl ? (
                        <a href={order.payment.checkoutUrl}>Abrir pagamento Stripe</a>
                    ) : (
                        <p>Este método fica pendente de confirmação manual.</p>
                    )}
                </section>
            ) : null}
        </main>
    );
}