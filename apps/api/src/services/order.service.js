/**
 * Service de encomendas, histórico e pagamento exclusivamente simulado.
 *
 * O checkout cria apenas um snapshot pendente. Stock, voucher e carrinho só
 * mudam no endpoint explícito de simulação, dentro da mesma transação MongoDB.
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/domain.constants.js";
import { AppError } from "../middlewares/error.middleware.js";
import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import {
    createAwaitingSimulationPayment,
    createSuccessfulSimulationPayment,
} from "../providers/payment.provider.js";
import {
    consumeVoucherDiscount,
    previewBestVoucherDiscount,
} from "./voucher.service.js";
import {
    buildProductVariantKey,
    buildVariantSnapshot,
    resolveProductVariant,
    resolveVariantPriceCents,
    resolveVariantStock,
} from "./product-variant.service.js";

const TRANSACTION_OPTIONS = Object.freeze({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary",
    maxCommitTimeMS: 10_000,
});
const REFRESHABLE_CHECKOUT_PAYMENT_STATUSES = Object.freeze([
    PAYMENT_STATUS.AWAITING_SIMULATION,
    PAYMENT_STATUS.SIMULATED_FAILED,
]);

/** Falha dentro da transação quando o pedido HTTP já foi cancelado/expirou. */
function assertRequestActive(signal) {
    if (!signal?.aborted) return;

    if (signal.reason instanceof Error) throw signal.reason;
    throw new AppError(503, "Pedido cancelado antes de concluir.");
}

/**
 * Converte encomenda para DTO público. O objeto `payment` expõe apenas o
 * contrato académico de simulação e nunca metadados internos de idempotência.
 *
 * @param {object} order - Documento Mongoose ou mock equivalente.
 * @returns {object} Encomenda sem userId, checkoutKey ou hashes internos.
 */
export function toOrderResponse(order) {
    const subtotalCents = order.subtotalCents ?? order.totalCents;
    const discountCents = order.discountCents ?? 0;

    return {
        id: order._id.toString(),
        items: order.items.map((item) => ({
            productId: item.productId.toString(),
            variantId: item.variantId ?? null,
            variant: item.variantId
                ? {
                      variantId:
                          item.variantSnapshot?.variantId ?? item.variantId,
                      label: item.variantSnapshot?.label ?? null,
                      colorHex: item.variantSnapshot?.colorHex ?? null,
                      undertone: item.variantSnapshot?.undertone ?? null,
                      finish: item.variantSnapshot?.finish ?? null,
                      coverage: item.variantSnapshot?.coverage ?? null,
                      imageUrl: item.variantSnapshot?.imageUrl ?? null,
                  }
                : null,
            name: item.name,
            unitPriceCents: item.unitPriceCents,
            quantity: item.quantity,
            lineTotalCents: item.lineTotalCents,
        })),
        subtotalCents,
        discountCents,
        totalCents: order.totalCents,
        voucher: order.voucher?.voucherId
            ? {
                  id: order.voucher.voucherId.toString(),
                  code: order.voucher.code,
                  amountCents: order.voucher.amountCents,
              }
            : null,
        status: order.status,
        payment: {
            mode: order.payment.mode,
            status: order.payment.status,
            simulationReference: order.payment.simulationReference ?? null,
            simulatedAt: order.payment.simulatedAt ?? null,
            message: order.payment.message,
        },
        stockReserved: order.stockReserved,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}

/**
 * Liga uma query Mongoose à sessão apenas quando ela existe.
 *
 * @param {import("mongoose").Query} query - Query ainda não executada.
 * @param {import("mongoose").ClientSession|undefined} session - Sessão opcional.
 * @returns {import("mongoose").Query} Query pronta a aguardar.
 */
function withOptionalSession(query, session) {
    return session ? query.session(session) : query;
}

/**
 * Recarrega produtos atuais e constrói linhas seguras de encomenda.
 *
 * @param {Array<object>} cartItems - Itens do carrinho autenticado.
 * @param {import("mongoose").ClientSession} [session] - Sessão transacional.
 * @param {string|null} [voucherCode] - Voucher explicitamente escolhido.
 * @returns {Promise<Array<object>>} Itens com preço e stock revalidados.
 * @throws {AppError} Quando um produto falta ou o stock é insuficiente.
 */
async function buildOrderItemsFromCart(cartItems, session = undefined) {
    const productIds = cartItems.map((item) => item.productId.toString());
    const query = Product.find({ _id: { $in: productIds } });
    const products = await withOptionalSession(query, session);
    const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    return cartItems.map((item) => {
        const productId = item.productId.toString();
        const product = productsById.get(productId);

        if (!product) {
            throw new AppError(404, "Produto do carrinho não encontrado");
        }

        // Carrinhos antigos de um produto que entretanto ganhou variantes
        // devem regressar à seleção; reduzir apenas o agregado quebraria a
        // igualdade `stock === soma(variants.stock)`.
        const variant = resolveProductVariant(product, item.variantId);
        const availableStock = resolveVariantStock(product, variant);

        if (availableStock < item.quantity) {
            throw new AppError(409, `Stock insuficiente para ${product.name}`);
        }

        const unitPriceCents = resolveVariantPriceCents(product, variant);

        return {
            productId: product._id,
            variantId: variant?.variantId ?? null,
            variantSnapshot: buildVariantSnapshot(variant),
            name: product.name,
            unitPriceCents,
            quantity: item.quantity,
            lineTotalCents: unitPriceCents * item.quantity,
        };
    });
}

/**
 * Cria uma assinatura canónica dos produtos e quantidades.
 *
 * @param {Array<object>} items - Itens de carrinho ou encomenda.
 * @returns {string} Assinatura ordenada independente da ordem do array.
 */
function buildItemsSignature(items) {
    return items
        .map((item) =>
            item.variantId
                ? `${buildProductVariantKey(item.productId, item.variantId)}:${item.quantity}`
                : `${item.productId.toString()}:${item.quantity}`,
        )
        .sort()
        .join("|");
}

/**
 * Cria uma chave opaca e estável para o mesmo carrinho.
 * Um carrinho novo recebe outro `_id`, permitindo repetir uma compra idêntica.
 *
 * @param {string} userId - ID autenticado.
 * @param {object} cart - Carrinho atual.
 * @returns {string} SHA-256 do contexto do checkout.
 */
function buildCheckoutKey(userId, cart) {
    const cartId = cart._id?.toString?.() ?? "cart";
    const material = `${userId}:${cartId}:${buildItemsSignature(cart.items)}`;
    return createHash("sha256").update(material).digest("hex");
}

/**
 * Constrói o snapshot comercial calculado exclusivamente no backend.
 *
 * @param {string} userId - Utilizador autenticado.
 * @param {Array<object>} items - Linhas revalidadas.
 * @param {import("mongoose").ClientSession} [session] - Sessão transacional.
 * @returns {Promise<object>} Totais e voucher aplicável no momento.
 */
async function buildCommercialSnapshot(
    userId,
    items,
    session = undefined,
    voucherCode = null,
) {
    const subtotalCents = items.reduce(
        (sum, item) => sum + item.lineTotalCents,
        0,
    );
    const voucherPreview = await previewBestVoucherDiscount(
        userId,
        subtotalCents,
        { session, voucherCode },
    );

    return {
        items,
        subtotalCents,
        discountCents: voucherPreview.discountCents,
        totalCents: voucherPreview.finalTotalCents,
        voucherDocument: voucherPreview.voucher,
        voucher: voucherPreview.voucher
            ? {
                  voucherId: voucherPreview.voucher._id,
                  code: voucherPreview.voucher.code,
                  amountCents: voucherPreview.discountCents,
              }
            : {
                  voucherId: null,
                  code: null,
                  amountCents: 0,
              },
    };
}

/**
 * Copia o snapshot comercial validado para uma encomenda.
 *
 * @param {object} order - Documento a atualizar.
 * @param {object} snapshot - Snapshot calculado pelo backend.
 * @returns {void}
 */
function applyCommercialSnapshot(order, snapshot) {
    order.items = snapshot.items;
    order.subtotalCents = snapshot.subtotalCents;
    order.discountCents = snapshot.discountCents;
    order.totalCents = snapshot.totalCents;
    order.voucher = snapshot.voucher;
}

/**
 * Classifica uma encomenda encontrada depois de um CAS de checkout perdido.
 *
 * Um pagamento confirmado é monotónico e deve ser devolvido sem alteração.
 * Estados ainda pendentes podem resultar de outra criação/atualização
 * concorrente. Qualquer outra combinação é recusada para não mascarar dados
 * parcialmente migrados ou um estado terminal incompatível.
 *
 * @param {object|null} order - Encomenda atual recarregada por owner/chave.
 * @returns {object|null} Encomenda segura ou null quando ainda não existe.
 * @throws {AppError} Quando o estado atual não pode ser reutilizado.
 */
function classifyCheckoutAfterLostRace(order) {
    if (!order) return null;

    if (order.payment?.status === PAYMENT_STATUS.SIMULATED_PAID) {
        return order;
    }

    if (
        order.status === ORDER_STATUS.PENDENTE &&
        order.stockReserved === false &&
        REFRESHABLE_CHECKOUT_PAYMENT_STATUSES.includes(order.payment?.status)
    ) {
        return order;
    }

    throw new AppError(
        409,
        "A encomenda já não pode ser atualizada por este checkout",
    );
}

/**
 * Cria ou reutiliza o checkout pendente do carrinho atual.
 * Esta operação nunca altera stock, voucher ou carrinho.
 *
 * @param {string} userId - Utilizador autenticado.
 * @param {{voucherCode?: string|null}} [options] - Preferência opcional validada no boundary HTTP.
 * @returns {Promise<object>} Encomenda pendente pública.
 */
export async function checkoutMyCart(userId, { voucherCode = null } = {}) {
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
        throw new AppError(400, "Carrinho vazio");
    }

    const checkoutKey = buildCheckoutKey(userId, cart);
    const items = await buildOrderItemsFromCart(cart.items);
    const snapshot = await buildCommercialSnapshot(
        userId,
        items,
        undefined,
        voucherCode,
    );
    let order = await Order.findOneAndUpdate(
        {
            userId,
            checkoutKey,
            status: ORDER_STATUS.PENDENTE,
            stockReserved: false,
            "payment.status": {
                $in: REFRESHABLE_CHECKOUT_PAYMENT_STATUSES,
            },
        },
        {
            $set: {
                items: snapshot.items,
                subtotalCents: snapshot.subtotalCents,
                discountCents: snapshot.discountCents,
                totalCents: snapshot.totalCents,
                voucher: snapshot.voucher,
                payment: createAwaitingSimulationPayment(),
                stockReserved: false,
            },
        },
        { new: true, runValidators: true },
    );

    if (order) {
        return toOrderResponse(order);
    }

    // O CAS pode perder para o commit de um pagamento. Recarregar impede que
    // um checkout obsoleto volte a gravar `awaiting_simulation` sobre o estado
    // terminal ou tente criar uma segunda encomenda com a mesma chave.
    order = classifyCheckoutAfterLostRace(
        await Order.findOne({ userId, checkoutKey }),
    );
    if (order) return toOrderResponse(order);

    try {
        order = await Order.create({
            userId,
            checkoutKey,
            items: snapshot.items,
            subtotalCents: snapshot.subtotalCents,
            discountCents: snapshot.discountCents,
            totalCents: snapshot.totalCents,
            voucher: snapshot.voucher,
            status: ORDER_STATUS.PENDENTE,
            payment: createAwaitingSimulationPayment(),
            stockReserved: false,
        });
    } catch (error) {
        if (error?.code !== 11000) throw error;

        order = classifyCheckoutAfterLostRace(
            await Order.findOne({ userId, checkoutKey }),
        );
        if (!order) throw error;
    }

    return toOrderResponse(order);
}

/**
 * Confirma que carrinho e encomenda continuam a representar os mesmos itens.
 *
 * @param {object} cart - Carrinho carregado na transação.
 * @param {object} order - Encomenda do proprietário.
 * @returns {void}
 * @throws {AppError} Quando o carrinho mudou depois do checkout.
 */
function assertCartMatchesOrder(cart, order) {
    if (buildItemsSignature(cart.items) !== buildItemsSignature(order.items)) {
        throw new AppError(
            409,
            "O carrinho mudou depois do checkout. Revê o resumo antes de simular.",
        );
    }
}

/**
 * Confirma que os preços apresentados no checkout não mudaram entretanto.
 *
 * @param {object} order - Snapshot apresentado ao cliente.
 * @param {Array<object>} currentItems - Produtos atuais revalidados.
 * @returns {void}
 * @throws {AppError} Quando algum preço mudou.
 */
function assertPricesUnchanged(order, currentItems) {
    const pricesByProduct = new Map(
        order.items.map((item) => [
            buildProductVariantKey(item.productId, item.variantId),
            item.unitPriceCents,
        ]),
    );
    const changed = currentItems.some(
        (item) =>
            pricesByProduct.get(
                buildProductVariantKey(item.productId, item.variantId),
            ) !==
            item.unitPriceCents,
    );

    if (changed) {
        throw new AppError(
            409,
            "Os preços mudaram depois do checkout. Cria um novo resumo antes de simular.",
        );
    }
}

/**
 * Reduz stock com compare-and-set dentro da transação.
 *
 * @param {Array<object>} items - Linhas já revalidadas.
 * @param {import("mongoose").ClientSession} session - Sessão ativa.
 * @returns {Promise<void>}
 */
async function decrementStock(items, session) {
    for (const item of items) {
        const result = item.variantId
            ? await Product.updateOne(
                  {
                      _id: item.productId,
                      stock: { $gte: item.quantity },
                      variants: {
                          $elemMatch: {
                              variantId: item.variantId,
                              stock: { $gte: item.quantity },
                          },
                      },
                  },
                  {
                      $inc: {
                          stock: -item.quantity,
                          "variants.$.stock": -item.quantity,
                      },
                  },
                  { session },
              )
            : await Product.updateOne(
                  {
                      _id: item.productId,
                      priceCents: item.unitPriceCents,
                      stock: { $gte: item.quantity },
                  },
                  { $inc: { stock: -item.quantity } },
                  { session },
              );

        if (result.modifiedCount !== 1) {
            throw new AppError(409, `Stock insuficiente para ${item.name}`);
        }
    }
}

/**
 * Garante que um provider injetado não consegue alargar o contrato público.
 *
 * @param {object} result - Resultado do provider local.
 * @returns {object} Resultado normalizado.
 */
function normalizeSimulationResult(result) {
    const allowedStatuses = [
        PAYMENT_STATUS.SIMULATED_PAID,
        PAYMENT_STATUS.SIMULATED_FAILED,
    ];

    if (
        !result ||
        result.mode !== "simulated" ||
        !allowedStatuses.includes(result.status) ||
        typeof result.simulationReference !== "string" ||
        result.simulationReference.length < 16 ||
        !(result.simulatedAt instanceof Date) ||
        Number.isNaN(result.simulatedAt.getTime())
    ) {
        throw new AppError(500, "Resultado interno de simulação inválido");
    }

    return {
        mode: result.mode,
        status: result.status,
        simulationReference: result.simulationReference,
        simulatedAt: result.simulatedAt,
        message: String(result.message ?? "Simulação académica."),
    };
}

/**
 * Procura uma resposta previamente persistida para a chave recebida.
 *
 * @param {object} order - Encomenda carregada com `paymentAttempts`.
 * @param {string} idempotencyKeyHash - SHA-256 da chave HTTP.
 * @returns {object|null} Snapshot defensivamente clonado ou null.
 */
function findPaymentAttemptResponse(order, idempotencyKeyHash) {
    const attempt = (order.paymentAttempts ?? []).find(
        (candidate) =>
            candidate.idempotencyKeyHash === idempotencyKeyHash,
    );

    if (!attempt?.responseSnapshot) return null;

    const snapshot = attempt.responseSnapshot?.toObject
        ? attempt.responseSnapshot.toObject()
        : attempt.responseSnapshot;
    return structuredClone(snapshot);
}

/**
 * Acrescenta uma tentativa terminal e o respetivo DTO público ao histórico
 * interno. A segunda gravação não altera timestamps, garantindo que o snapshot
 * guardado é exatamente o snapshot devolvido ao primeiro pedido.
 *
 * @param {object} order - Documento de encomenda já guardado no estado final.
 * @param {string} idempotencyKeyHash - SHA-256 da chave HTTP.
 * @param {import("mongoose").ClientSession} session - Sessão transacional.
 * @returns {Promise<object>} Snapshot público persistido.
 */
async function persistPaymentAttempt(order, idempotencyKeyHash, session) {
    const responseSnapshot = toOrderResponse(order);

    order.paymentAttempts ??= [];
    order.paymentAttempts.push({
        idempotencyKeyHash,
        status: order.payment.status,
        simulationReference: order.payment.simulationReference,
        simulatedAt: order.payment.simulatedAt,
        responseSnapshot,
    });
    await order.save({ session, timestamps: false });

    return structuredClone(responseSnapshot);
}

/**
 * Preserva uma tentativa terminal criada antes da introdução do histórico.
 * Esta compatibilidade evita perder o replay da última chave quando uma nova
 * tentativa válida substitui o campo `payment` legado.
 *
 * @param {object} order - Documento carregado com o hash interno de pagamento.
 * @returns {void}
 */
function preserveLegacyPaymentAttempt(order) {
    const idempotencyKeyHash = order.payment?.idempotencyKeyHash;
    const terminalStatuses = [
        PAYMENT_STATUS.SIMULATED_PAID,
        PAYMENT_STATUS.SIMULATED_FAILED,
    ];

    if (
        !idempotencyKeyHash ||
        !terminalStatuses.includes(order.payment.status) ||
        (order.paymentAttempts ?? []).some(
            (attempt) =>
                attempt.idempotencyKeyHash === idempotencyKeyHash,
        )
    ) {
        return;
    }

    order.paymentAttempts ??= [];
    order.paymentAttempts.push({
        idempotencyKeyHash,
        status: order.payment.status,
        simulationReference: order.payment.simulationReference,
        simulatedAt: order.payment.simulatedAt,
        responseSnapshot: toOrderResponse(order),
    });
}

/**
 * Executa o pagamento simulado de forma atómica e idempotente.
 *
 * `failureInjector` existe apenas para testes de rollback e nunca recebe dados
 * HTTP. Pode lançar depois de cada passo para provar atomicidade.
 *
 * @param {string} userId - Proprietário autenticado.
 * @param {string} orderId - Encomenda pendente.
 * @param {string} idempotencyKey - Chave validada no boundary HTTP.
 * @param {{paymentResultFactory?: Function, failureInjector?: Function, signal?: AbortSignal}} [options] - Dependências de teste/cancelamento.
 * @returns {Promise<object>} Encomenda final ou replay da mesma encomenda.
 */
export async function simulateOrderPayment(
    userId,
    orderId,
    idempotencyKey,
    {
        paymentResultFactory = createSuccessfulSimulationPayment,
        failureInjector = async () => undefined,
        signal,
    } = {},
) {
    assertRequestActive(signal);
    const idempotencyKeyHash = createHash("sha256")
        .update(idempotencyKey)
        .digest("hex");
    const session = await mongoose.startSession();
    let response = null;

    try {
        await session.withTransaction(async () => {
            assertRequestActive(signal);
            const order = await Order.findOne({ _id: orderId, userId })
                .select("+payment.idempotencyKeyHash +paymentAttempts")
                .session(session);

            if (!order) {
                throw new AppError(404, "Encomenda não encontrada");
            }

            const replay = findPaymentAttemptResponse(
                order,
                idempotencyKeyHash,
            );
            if (replay) {
                response = replay;
                return;
            }

            // Compatibilidade com encomendas persistidas antes de existir o
            // histórico de tentativas.
            if (
                order.payment.idempotencyKeyHash === idempotencyKeyHash &&
                [
                    PAYMENT_STATUS.SIMULATED_PAID,
                    PAYMENT_STATUS.SIMULATED_FAILED,
                ].includes(order.payment.status)
            ) {
                response = toOrderResponse(order);
                return;
            }

            if (order.payment.status === PAYMENT_STATUS.SIMULATED_PAID) {
                throw new AppError(
                    409,
                    "A encomenda já tem um pagamento simulado concluído",
                );
            }

            if (order.status !== ORDER_STATUS.PENDENTE) {
                throw new AppError(409, "A encomenda já não pode ser simulada");
            }

            if (
                ![
                    PAYMENT_STATUS.AWAITING_SIMULATION,
                    PAYMENT_STATUS.SIMULATED_FAILED,
                ].includes(order.payment.status)
            ) {
                throw new AppError(409, "Estado de pagamento incompatível");
            }

            const cart = await Cart.findOne({ userId }).session(session);
            if (!cart || cart.items.length === 0) {
                throw new AppError(409, "O carrinho do checkout já não existe");
            }

            assertCartMatchesOrder(cart, order);
            const currentItems = await buildOrderItemsFromCart(cart.items, session);
            assertPricesUnchanged(order, currentItems);
            const snapshot = await buildCommercialSnapshot(
                userId,
                currentItems,
                session,
            );
            const payment = normalizeSimulationResult(
                await paymentResultFactory(order),
            );

            preserveLegacyPaymentAttempt(order);
            applyCommercialSnapshot(order, snapshot);
            order.payment = { ...payment, idempotencyKeyHash };

            if (payment.status === PAYMENT_STATUS.SIMULATED_FAILED) {
                order.stockReserved = false;
                await order.save({ session });
                await failureInjector("after_failed_state");
                assertRequestActive(signal);
                response = await persistPaymentAttempt(
                    order,
                    idempotencyKeyHash,
                    session,
                );
                assertRequestActive(signal);
                return;
            }

            await consumeVoucherDiscount(
                snapshot.voucherDocument,
                snapshot.discountCents,
                order._id,
                { session, requireSuccess: true },
            );
            await failureInjector("after_voucher");
            assertRequestActive(signal);

            await decrementStock(currentItems, session);
            await failureInjector("after_stock");
            assertRequestActive(signal);

            order.stockReserved = true;
            await order.save({ session });
            await failureInjector("after_order");
            assertRequestActive(signal);

            const cleared = await Cart.deleteOne(
                { _id: cart._id, userId },
                { session },
            );
            if (cleared.deletedCount !== 1) {
                throw new AppError(409, "O carrinho mudou durante a simulação");
            }
            await failureInjector("after_cart");
            assertRequestActive(signal);

            response = await persistPaymentAttempt(
                order,
                idempotencyKeyHash,
                session,
            );
            // Esta barreira impede que uma operação cooperativa já expirada
            // saia do callback e seja confirmada pelo `withTransaction`.
            assertRequestActive(signal);
        }, TRANSACTION_OPTIONS);

        return response;
    } finally {
        await session.endSession();
    }
}

/**
 * Lista histórico de compras do cliente autenticado.
 *
 * @param {string} userId - ID autenticado.
 * @returns {Promise<object[]>} Encomendas ordenadas por data.
 */
export async function listMyOrders(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return orders.map(toOrderResponse);
}
