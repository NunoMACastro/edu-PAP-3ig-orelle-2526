/**
 * Página de checkout com pagamento exclusivamente simulado em dois passos.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ErrorSummary } from "../components/ErrorSummary.jsx";
import { FeedbackMessage } from "../components/FeedbackMessage.jsx";
import { PageHero } from "../components/OrelleUi.jsx";
import { useCart } from "../context/CartContext.jsx";
import { apiRequest } from "../services/apiClient.js";
import {
    getOrderStatusLabel,
    getVoucherStatusLabel,
} from "../services/presentationLabels.js";
import {
    assertSimulatedOrder,
    canSimulatePayment,
    createSimulationIdempotencyKey,
    getIdempotencyKeyAfterSimulationResponse,
    getSimulatedPaymentStatusLabel,
    SIMULATED_PAYMENT_NOTICE,
} from "../services/simulatedCheckout.js";

/**
 * Formata valores monetários guardados em cêntimos.
 *
 * @function formatPrice
 * @param {number} priceCents - Valor em cêntimos.
 * @returns {string} Valor legível em euros.
 */
function formatPrice(priceCents) {
    return new Intl.NumberFormat("pt-PT", {
        style: "currency",
        currency: "EUR",
    }).format(Number(priceCents ?? 0) / 100);
}

/**
 * Formata a data da simulação quando a API devolve um instante válido.
 *
 * @function formatSimulatedAt
 * @param {string|null|undefined} value - Data ISO devolvida pela API.
 * @returns {string|null} Data legível ou null quando indisponível.
 */
function formatSimulatedAt(value) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

/**
 * Cria um resumo pendente e, apenas por ação explícita, simula o pagamento.
 *
 * Stock, voucher e carrinho só são alterados pelo backend no segundo passo.
 * Uma falha conserva sempre o resumo e os vouchers já carregados no ecrã.
 *
 * @function CheckoutPage
 * @returns {JSX.Element} UI de checkout académico.
 */
export function CheckoutPage() {
    const {
        refreshCart,
        voucherCode = "",
        setVoucherCode = () => undefined,
    } = useCart();
    const [order, setOrder] = useState(null);
    const [paymentAttemptKey, setPaymentAttemptKey] = useState("");
    const [vouchers, setVouchers] = useState([]);
    const [checkoutState, setCheckoutState] = useState({
        status: "idle",
        error: null,
    });
    const [paymentState, setPaymentState] = useState({
        status: "idle",
        error: null,
    });
    const [voucherState, setVoucherState] = useState({
        status: "idle",
        error: null,
    });

    /**
     * Cria ou reutiliza a encomenda pendente sem enviar dados de pagamento.
     *
     * @async
     * @function handleCheckout
     * @returns {Promise<void>}
     */
    async function handleCheckout() {
        setCheckoutState({ status: "loading", error: null });

        try {
            const data = await apiRequest("/orders/checkout", {
                method: "POST",
                body: JSON.stringify(
                    voucherCode.trim() ? { voucherCode: voucherCode.trim() } : {},
                ),
            });
            const nextOrder = assertSimulatedOrder(data?.order);
            const nextAttemptKey = createSimulationIdempotencyKey(nextOrder.id);

            setOrder(nextOrder);
            setPaymentAttemptKey(nextAttemptKey);
            setCheckoutState({ status: "success", error: null });
            setPaymentState({ status: "idle", error: null });
        } catch (error) {
            setCheckoutState({
                status: "error",
                error,
            });
        }
    }

    /**
     * Executa o segundo passo com uma chave idempotente estável em retries.
     *
     * @async
     * @function handleSimulatePayment
     * @returns {Promise<void>}
     */
    async function handleSimulatePayment() {
        if (!order?.id || !paymentAttemptKey) return;

        setPaymentState({ status: "loading", error: null });

        try {
            const data = await apiRequest(
                `/orders/${encodeURIComponent(order.id)}/payments/simulate`,
                {
                    method: "POST",
                    headers: {
                        "Idempotency-Key": paymentAttemptKey,
                    },
                },
            );
            const nextOrder = assertSimulatedOrder(data?.order);

            if (nextOrder.payment?.status === "simulated_paid") {
                await refreshCart().catch(() => undefined);
            }

            setOrder(nextOrder);
            setPaymentAttemptKey(
                getIdempotencyKeyAfterSimulationResponse(
                    nextOrder,
                    paymentAttemptKey,
                ),
            );
            setPaymentState({ status: "success", error: null });
        } catch (error) {
            // O resumo permanece visível e a chave é reutilizada no retry.
            setPaymentState({
                status: "error",
                error,
            });
        }
    }

    /**
     * Carrega os vouchers académicos sem interferir com o estado do checkout.
     *
     * @async
     * @function loadVouchers
     * @returns {Promise<void>}
     */
    async function loadVouchers() {
        setVoucherState({ status: "loading", error: null });

        try {
            const data = await apiRequest("/me/vouchers");
            const nextVouchers = Array.isArray(data?.vouchers)
                ? data.vouchers
                : [];

            setVouchers(nextVouchers);
            setVoucherState({
                status: nextVouchers.length === 0 ? "empty" : "success",
                error: null,
            });
        } catch (error) {
            // Uma falha de refresh não apaga a lista anteriormente carregada.
            setVoucherState({
                status: "error",
                error,
            });
        }
    }

    const isCheckoutMutationBusy =
        checkoutState.status === "loading" || paymentState.status === "loading";
    const paymentCanBeSimulated =
        canSimulatePayment(order) && Boolean(paymentAttemptKey);
    const simulatedAt = formatSimulatedAt(order?.payment?.simulatedAt);
    const simulationFailed = order?.payment?.status === "simulated_failed";
    const simulationCompleted = order?.payment?.status === "simulated_paid";

    return (
        <section className="checkout-page">
            <PageHero eyebrow="Checkout" title="Confirmar encomenda" description="Revê o resumo e confirma os valores da tua encomenda." />
            <ol className="checkout-stepper" aria-label="Etapas do checkout"><li className="checkout-stepper__active">1. Rever</li><li className={order ? "checkout-stepper__active" : ""}>2. Confirmar</li><li className={simulationCompleted ? "checkout-stepper__active" : ""}>3. Concluído</li></ol>
            <FeedbackMessage type="warning">
                {SIMULATED_PAYMENT_NOTICE}
            </FeedbackMessage>
            <p>
                Primeiro cria o resumo da encomenda. O carrinho, o voucher e o
                stock só são atualizados quando confirmares a encomenda.
            </p>
            {voucherCode ? (
                <p className="checkout-page__selected-voucher" role="status">
                    Voucher escolhido: <strong>{voucherCode}</strong>{" "}
                    <button type="button" className="text-link" onClick={() => setVoucherCode("")}>
                        Remover
                    </button>
                </p>
            ) : null}

            <div className="flow-actions">
                <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isCheckoutMutationBusy}
                    aria-busy={checkoutState.status === "loading"}
                >
                    {checkoutState.status === "loading"
                        ? "A criar resumo..."
                        : "Criar resumo da encomenda"}
                </button>
                <button
                    type="button"
                    onClick={loadVouchers}
                    disabled={voucherState.status === "loading"}
                    aria-busy={voucherState.status === "loading"}
                >
                    {voucherState.status === "loading"
                        ? "A carregar vouchers..."
                        : "Ver vouchers"}
                </button>
            </div>

            <ErrorSummary error={checkoutState.error} id="checkout-error" />
            <ErrorSummary error={voucherState.error} id="voucher-load-error" />
            {checkoutState.status === "success" && (
                <FeedbackMessage type="success">
                    Resumo criado. Confirma os valores antes de continuar.
                </FeedbackMessage>
            )}
            {voucherState.status === "empty" && (
                <FeedbackMessage type="info">
                    Não existem vouchers disponíveis.
                </FeedbackMessage>
            )}

            {vouchers.length > 0 && (
                <section aria-labelledby="available-vouchers-heading">
                    <h2 id="available-vouchers-heading">Vouchers disponíveis</h2>
                    <ul>
                        {vouchers.map((voucher) => (
                            <li key={voucher.id}>
                                {voucher.code}: {formatPrice(voucher.remainingCents)}
                                {" · "}
                                {getVoucherStatusLabel(voucher.status)}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {order && (
                <article aria-labelledby="checkout-summary-heading">
                    <h2 id="checkout-summary-heading">Resumo da encomenda</h2>
                    <p>
                        Estado da encomenda: {getOrderStatusLabel(order.status)}
                    </p>
                    <p>Subtotal: {formatPrice(order.subtotalCents)}</p>
                    <p>Voucher: -{formatPrice(order.discountCents)}</p>
                    <p>Total: {formatPrice(order.totalCents)}</p>
                    {order.voucher && (
                        <p>
                            Voucher previsto: {order.voucher.code} ·{" "}
                            {formatPrice(order.voucher.amountCents)}
                        </p>
                    )}

                    <h3>Confirmação da encomenda</h3>
                    <p>
                        Estado: {getSimulatedPaymentStatusLabel(order.payment.status)}
                    </p>
                    <p>{order.payment.message}</p>
                    {order.payment.simulationReference && (
                        <p>
                            Referência da encomenda:{" "}
                            <code>{order.payment.simulationReference}</code>
                        </p>
                    )}
                    {simulatedAt && <p>Confirmada em: {simulatedAt}</p>}

                    {paymentCanBeSimulated && (
                        <button
                            type="button"
                            onClick={handleSimulatePayment}
                            disabled={isCheckoutMutationBusy}
                            aria-busy={paymentState.status === "loading"}
                        >
                            {paymentState.status === "loading"
                                ? "A confirmar encomenda..."
                                : simulationFailed
                                  ? "Tentar confirmar novamente"
                                  : "Confirmar encomenda"}
                        </button>
                    )}

                    <ErrorSummary
                        error={paymentState.error}
                        id="payment-simulation-error"
                    />
                    {paymentState.status === "success" && simulationFailed && (
                        <FeedbackMessage type="warning">
                            A confirmação não foi concluída. Não houve alteração
                            de stock, voucher ou carrinho.
                        </FeedbackMessage>
                    )}
                    {paymentState.status === "success" && simulationCompleted && (
                        <FeedbackMessage type="success">
                            Encomenda confirmada. Não foi efetuada qualquer cobrança.
                        </FeedbackMessage>
                    )}

                    <div className="flow-actions">
                        <Link className="text-link" to="/compras">
                            Ver histórico de compras
                        </Link>
                        <Link className="text-link" to="/produtos">
                            Continuar a comprar
                        </Link>
                    </div>
                </article>
            )}
        </section>
    );
}
