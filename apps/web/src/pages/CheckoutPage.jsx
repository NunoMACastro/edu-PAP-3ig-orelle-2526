/**
 * Pagina de checkout da MF3.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Cria encomenda a partir do carrinho e inicia gateway selecionado.
 *
 * @function CheckoutPage
 * @returns {JSX.Element} UI de checkout.
 */
export function CheckoutPage() {
    const [gateway, setGateway] = useState("stripe");
    const [order, setOrder] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Submete checkout ao backend.
     *
     * @async
     * @function handleCheckout
     * @returns {Promise<void>}
     */
    async function handleCheckout() {
        setStatus("loading");
        setError("");
        setOrder(null);

        try {
            const data = await apiRequest("/orders/checkout", {
                method: "POST",
                body: JSON.stringify({ gateway }),
            });
            setOrder(data.order);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Checkout</h1>
            <label>
                Gateway
                <select
                    value={gateway}
                    onChange={(event) => setGateway(event.target.value)}
                >
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="mbway">MBWay</option>
                </select>
            </label>
            <button onClick={handleCheckout} disabled={status === "loading"}>
                {status === "loading" ? "A criar encomenda..." : "Finalizar checkout"}
            </button>

            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && order && (
                <article>
                    <h2>Encomenda criada</h2>
                    <p>Estado: {order.status}</p>
                    <p>Total: {(order.totalCents / 100).toFixed(2)} EUR</p>
                    <p>
                        Pagamento: {order.payment.gateway} - {order.payment.status}
                    </p>
                    <p>{order.payment.message}</p>
                    {order.payment.checkoutUrl && (
                        <a href={order.payment.checkoutUrl}>Abrir pagamento</a>
                    )}
                </article>
            )}
        </section>
    );
}
