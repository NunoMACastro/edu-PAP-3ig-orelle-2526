/**
 * Provider isolado de pagamentos da MF3.
 *
 * Stripe pode operar de forma real e controlada quando `STRIPE_SECRET_KEY`
 * existe. Sem essa configuracao, o provider falha de forma controlada antes de
 * criar uma encomenda sem sessao de pagamento. PayPal e MBWay ficam em stub
 * funcional conforme contrato MVP.
 */
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";
import { PAYMENT_GATEWAYS, PAYMENT_STATUS } from "../models/order.model.js";

/**
 * Converte itens da encomenda para parametros aceites pela API Stripe.
 *
 * @function appendStripeLineItems
 * @param {URLSearchParams} params - Params form-urlencoded.
 * @param {Array<object>} items - Itens da encomenda.
 * @returns {void}
 */
function appendStripeLineItems(params, items) {
    items.forEach((item, index) => {
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
        params.set(
            `line_items[${index}][price_data][currency]`,
            "eur",
        );
        params.set(
            `line_items[${index}][price_data][unit_amount]`,
            String(item.unitPriceCents),
        );
        params.set(
            `line_items[${index}][price_data][product_data][name]`,
            item.name,
        );
    });
}

/**
 * Valida se o gateway pedido pode iniciar o fluxo esperado.
 *
 * Esta pre-validacao corre antes da criacao da encomenda para evitar que um
 * checkout Stripe sem configuracao persista uma encomenda sem URL de pagamento
 * e limpe o carrinho do cliente.
 *
 * @function assertPaymentGatewayReady
 * @param {string} gateway - Gateway ja validado pelo DTO.
 * @returns {void}
 * @throws {AppError} Quando Stripe nao esta configurado ou o gateway e invalido.
 */
export function assertPaymentGatewayReady(gateway) {
    if (gateway === PAYMENT_GATEWAYS.STRIPE && !env.stripeSecretKey) {
        throw new AppError(503, "Stripe nao esta configurado");
    }

    if (
        gateway === PAYMENT_GATEWAYS.STRIPE ||
        gateway === PAYMENT_GATEWAYS.PAYPAL ||
        gateway === PAYMENT_GATEWAYS.MBWAY
    ) {
        return;
    }

    throw new AppError(400, "Gateway de pagamento invalido");
}

/**
 * Cria sessao de checkout Stripe com fetch nativo.
 *
 * @async
 * @function createStripeCheckoutSession
 * @param {object} order - Encomenda persistida.
 * @returns {Promise<object>} Estado de pagamento.
 */
async function createStripeCheckoutSession(order) {
    if (!env.stripeSecretKey) {
        throw new AppError(503, "Stripe nao esta configurado");
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${env.clientOrigin}/checkout/success`);
    params.set("cancel_url", `${env.clientOrigin}/checkout/cancel`);
    params.set("metadata[orderId]", order._id.toString());
    appendStripeLineItems(params, order.items);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new AppError(
            502,
            "Nao foi possivel iniciar pagamento Stripe neste momento",
        );
    }

    return {
        gateway: PAYMENT_GATEWAYS.STRIPE,
        status: PAYMENT_STATUS.REQUIRES_PAYMENT,
        providerReference: data.id ?? null,
        checkoutUrl: data.url ?? null,
        message: "Sessao Stripe criada. Pagamento ainda nao confirmado.",
    };
}

/**
 * Cria estado stub funcional para PayPal ou MBWay.
 *
 * @function createManualGatewayStub
 * @param {string} gateway - Gateway validado.
 * @param {object} order - Encomenda persistida.
 * @returns {object} Estado pendente.
 */
function createManualGatewayStub(gateway, order) {
    return {
        gateway,
        status: PAYMENT_STATUS.PENDING_MANUAL_CONFIRMATION,
        providerReference: `${gateway}-stub-${order._id.toString()}`,
        checkoutUrl: null,
        message:
            "Gateway em stub funcional no MVP. Pagamento fica pendente de confirmacao manual.",
    };
}

/**
 * Cria a sessao/estado de pagamento para uma encomenda.
 *
 * @async
 * @function createPaymentSession
 * @param {object} order - Encomenda persistida.
 * @param {string} gateway - Gateway validado.
 * @returns {Promise<object>} Dados seguros de pagamento.
 */
export async function createPaymentSession(order, gateway) {
    if (gateway === PAYMENT_GATEWAYS.STRIPE) {
        return createStripeCheckoutSession(order);
    }

    if (
        gateway === PAYMENT_GATEWAYS.PAYPAL ||
        gateway === PAYMENT_GATEWAYS.MBWAY
    ) {
        return createManualGatewayStub(gateway, order);
    }

    throw new AppError(400, "Gateway de pagamento invalido");
}
