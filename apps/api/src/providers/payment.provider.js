import Stripe from "stripe";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Cria o cliente Stripe a partir da chave configurada no ambiente.
 * @returns {Stripe} Cliente oficial do SDK Stripe.
 * @throws {AppError} Quando a chave não está configurada.
 */
function createStripeClient() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        throw new AppError(503, "Stripe não está configurado");
    }

    return new Stripe(stripeSecretKey, {
        apiVersion: "2024-06-20",
    });
}

/**
 * Devolve o URL público usado nos redirects do checkout.
 * @returns {string} URL público da aplicação.
 */
function getPublicAppUrl() {
    return process.env.APP_PUBLIC_URL || "http://localhost:5173";
}

/**
 * Converte itens da encomenda em linhas compatíveis com Stripe Checkout.
 * @param {{ items: Array<{ quantity: number, unitPriceCents: number, name: string }> }} order - Encomenda local.
 * @returns {Array<object>} Linhas de pagamento para o Stripe.
 */
function buildStripeLineItems(order) {
    return order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
            currency: "eur",
            unit_amount: item.unitPriceCents,
            product_data: {
                name: item.name,
            },
        },
    }));
}

/**
 * Cria a sessão de pagamento para o método escolhido.
 * @param {{ method: "stripe" | "paypal" | "mbway", order: object }} input - Método e encomenda local.
 * @returns {Promise<{ method: string, status: string, providerReference: string, checkoutUrl: string | null }>}
 * @throws {AppError} Quando o método é inválido ou o provider falha.
 */
export async function createPaymentSession({ method, order }) {
    if (method === "stripe") {
        const stripe = createStripeClient();
        const appUrl = getPublicAppUrl();

        try {
            const session = await stripe.checkout.sessions.create({
                mode: "payment",
                line_items: buildStripeLineItems(order),
                client_reference_id: order._id.toString(),
                metadata: {
                    orderId: order._id.toString(),
                },
                success_url: `${appUrl}/checkout/success?orderId=${order._id.toString()}`,
                cancel_url: `${appUrl}/checkout/cancel?orderId=${order._id.toString()}`,
            });

            if (!session.url) {
                throw new AppError(502, "Stripe não devolveu URL de checkout");
            }

            return {
                method: "stripe",
                status: "requires_payment",
                providerReference: session.id,
                checkoutUrl: session.url,
            };
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(502, "Não foi possível iniciar checkout Stripe");
        }
    }

    if (method === "paypal" || method === "mbway") {
        // Estes métodos ficam pendentes: não simulam pagamento concluído.
        return {
            method,
            status: "pending_manual_confirmation",
            providerReference: `${method}_demo_${order._id.toString()}`,
            checkoutUrl: null,
        };
    }

    throw new AppError(400, "Método de pagamento inválido");
}