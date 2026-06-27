# BK-MF7-06 - Integração de pagamentos MVP com Stripe real e PayPal/MBWay em stub funcional

## Header
- `doc_id`: `GUIA-BK-MF7-06`
- `bk_id`: `BK-MF7-06`
- `macro`: `MF7`
- `owner`: `Bruna`
- `apoio`: `Daniel Bulica`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF17`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-COM`
- `eixo_primario`: `MonetizacaoLoja`
- `kpi_primario`: `taxa_conversao_checkout`
- `kpi_secundario`: `taxa_recompra_30d`
- `proximo_bk`: `BK-MF7-07`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-06-integracao-com-gateways-de-pagamento-stripe-paypal-mbway.md`
- `last_updated`: `2026-06-27`

#### Objetivo

Neste BK vais consolidar o checkout da Orelle com Stripe real controlado e PayPal/MBWay em stub funcional. A encomenda deve nascer do carrinho autenticado, o backend deve recalcular preço e stock, o pagamento deve ficar separado do estado logístico da encomenda e o fluxo deve ter idempotência mínima para evitar encomendas duplicadas.

`CANONICO`: `RNF17` define MVP com Stripe real e fluxos stub para PayPal/MBWay. `RF27` define registo de encomendas e pagamentos a partir do carrinho.

#### Importância

Checkout é um dos fluxos de maior risco comercial da aplicação. O frontend nunca pode enviar o preço final como verdade, porque o browser é controlado pelo utilizador. O backend deve reler produtos, validar stock, criar a encomenda pendente e só depois iniciar o estado de pagamento.

PayPal/MBWay não podem fingir pagamento concluído. No MVP ficam pendentes de confirmação manual, para demonstrar o fluxo sem inventar integração externa completa nem webhooks não documentados.

Também vais tratar a falha externa da Stripe de forma recuperável. Se a chamada ao gateway falhar depois de a encomenda existir, a encomenda fica com `payment.status: "failed"` e pode ser reaproveitada numa tentativa segura, em vez de criar outra encomenda igual.

#### Scope-in

- Validar gateway `stripe`, `paypal` ou `mbway`.
- Garantir que Stripe falha de forma controlada sem chave.
- Criar sessão Stripe com `fetch` nativo.
- Criar stub funcional para PayPal/MBWay com estado pendente.
- Criar uma chave de checkout idempotente para reduzir encomendas duplicadas em retry.
- Guardar `payment.status: "failed"` quando a Stripe falha depois de existir encomenda.
- Recalcular total e stock no backend.
- Limpar carrinho apenas depois de encomenda e estado de pagamento existirem.
- Mostrar `checkoutUrl` apenas quando o provider devolver uma.
- Provar negativos de carrinho vazio, stock insuficiente, gateway inválido, Stripe sem chave e total falso vindo do frontend.

#### Scope-out

- Não confirmar pagamento recebido.
- Não criar callbacks externos de pagamento.
- Não implementar multi-gateway completo.
- Não implementar webhooks, reconciliação bancária ou idempotência distribuída entre servidores.
- Não confiar em preço enviado pelo frontend.
- Não adicionar produtos recomendados ao carrinho automaticamente.
- Não implementar cupões, faturas, webhooks, reembolsos ou reconciliação bancária.

#### Estado antes e depois

- Antes: carrinho e encomendas existem, mas o checkout ainda precisa de consolidar gateway, estado de pagamento, idempotência mínima e validação de preço/stock num fluxo único.
- Depois: o checkout autenticado cria ou reaproveita uma encomenda a partir do carrinho, valida gateway, recalcula preço/stock, associa estado de pagamento, marca falhas externas como `failed` e expõe UI acionada por clique explícito do utilizador.

#### Pre-requisitos

- `BK-MF3-02`: carrinho de compras, `Cart` e `clearCart`.
- `BK-MF3-03`: encomendas e pagamentos base.
- `BK-MF3-04`: histórico de compras.
- `BK-MF4-08`: recomendações respeitam restrições e não compram por si.
- `BK-MF7-03`: sessão autenticada com cookie HttpOnly.
- `RNF17`: Stripe real controlado e PayPal/MBWay em stub funcional.

#### Glossário

- Gateway: canal de pagamento escolhido pelo utilizador.
- Stripe real controlado: criação de sessão Stripe quando há chave configurada.
- Stub funcional: fluxo assumidamente pendente, usado para PayPal/MBWay no MVP.
- Estado logístico: estado da encomenda, como `pendente`, `enviado` ou `entregue`.
- Estado de pagamento: estado da tentativa de pagamento, como `requires_payment`, `pending_manual_confirmation`, `paid` ou `failed`.
- Snapshot de encomenda: cópia do nome, preço e quantidade no momento do checkout.
- Chave de checkout: valor interno construído pelo backend para reconhecer a mesma tentativa de checkout do mesmo carrinho, utilizador e gateway.

#### Conceitos teóricos essenciais

Carrinho, encomenda e pagamento são responsabilidades diferentes. O carrinho guarda intenção e ainda pode mudar. A encomenda guarda um snapshot persistente dos produtos, preços e quantidades revalidados. O pagamento guarda o estado da tentativa de cobrança.

O checkout não pode aceitar total do frontend. O backend relê produtos pelo id do carrinho, verifica stock e calcula `totalCents`. Assim, se alguém alterar o payload no browser para enviar `totalCents: 1`, a API ignora esse valor.

Stripe pode criar uma sessão remota quando `STRIPE_SECRET_KEY` existe. Se a chave não existir, a API deve devolver erro controlado antes de criar encomenda ou limpar carrinho. PayPal/MBWay ficam como stubs funcionais: ajudam a demonstrar escolha de gateway, mas nunca dizem que o dinheiro foi recebido.

Autenticação também faz parte do checkout. O `userId` vem da sessão HttpOnly trabalhada em `BK-MF7-03`, não do body. Isto impede que um cliente tente finalizar carrinho de outro utilizador.

Idempotência significa que a mesma tentativa de checkout não deve criar várias encomendas iguais por duplo clique, retry do browser ou timeout momentâneo. Neste BK a idempotência é mínima e server-side: o backend cria uma `checkoutKey` a partir do utilizador autenticado, do carrinho e do gateway. Se a tentativa já existir, o service reaproveita a encomenda existente em vez de criar outra.

#### Arquitetura do BK

- Model: `Order`, `ORDER_STATUS`, `PAYMENT_GATEWAYS`, `PAYMENT_STATUS`, `checkoutKey`.
- Validator: `validateCheckoutPayload`.
- Provider: `payment.provider.js` com chave idempotente enviada à Stripe.
- Service: `checkoutMyCart` com reaproveitamento de encomenda e estado `failed` em falha externa.
- Controller/route: `POST /api/orders/checkout`.
- Frontend: `CheckoutPage`.
- Testes: suite de integração de comércio em `apps/api/tests/mf3.integration.test.js`.
- Handoff: `BK-MF7-07` mantém IA separada da decisão de compra.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/order.model.js`
- EDITAR: `apps/api/src/validators/checkout.validator.js`
- EDITAR: `apps/api/src/providers/payment.provider.js`
- EDITAR: `apps/api/src/services/order.service.js`
- EDITAR: `apps/api/src/controllers/order.controller.js`
- EDITAR: `apps/api/src/routes/order.routes.js`
- EDITAR: `apps/web/src/pages/CheckoutPage.jsx`
- REVER: `apps/api/src/services/cart.service.js`
- REVER: `apps/api/src/models/product.model.js`
- REVER: `apps/api/tests/mf3.integration.test.js`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato de checkout

1. Objetivo funcional do passo no contexto da app.

Separar carrinho, encomenda e pagamento antes de escrever código.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: `RNF17`, `RF27`, `RF28`, `RF30`, `BK-MF7-06`, `CORE-COM`.

3. Instruções do que fazer.

Confirma que Stripe é real quando configurado, que PayPal/MBWay ficam pendentes no MVP e que recomendações de produtos não compram nem adicionam produtos ao carrinho automaticamente.

4. Código completo, correto e integrado com a app final.

Sem código neste passo. Este passo é documental e serve para fixar o limite funcional do checkout.

5. Explicação do código.

Sem código. O aluno precisa de perceber que checkout não é apenas criar encomenda: envolve preço, stock, gateway, sessão autenticada e estados distintos.

6. Validação do passo.

Executa `rg -n "RNF17|RF27|RF28|RF30|Stripe|PayPal|MBWay" docs/RNF.md docs/RF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.

7. Cenário negativo/erro esperado.

Se a recomendação personalizada adicionar automaticamente produto ao carrinho, isso viola a separação entre recomendação e compra.

### Passo 2 - Modelar gateways e estados de pagamento

1. Objetivo funcional do passo no contexto da app.

Ter vocabulário fechado para gateway e estado de pagamento.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/models/order.model.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Confirma que o model contém enums fechados para gateways e estados, que a encomenda pertence ao `userId` autenticado, que existe uma `checkoutKey` para idempotência mínima e que `payment.status` não substitui o estado logístico da encomenda.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/order.model.js
/**
 * Modelo de encomendas e pagamento.
 *
 * A encomenda é criada a partir do carrinho autenticado. O preço e o stock são
 * sempre revalidados no backend antes da criação. O pagamento fica separado do
 * estado logístico da encomenda. A `checkoutKey` evita duplicar encomendas
 * quando o mesmo checkout é repetido por retry ou duplo clique.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const ORDER_STATUS = Object.freeze({
    PENDENTE: "pendente",
    ENVIADO: "enviado",
    ENTREGUE: "entregue",
});

export const PAYMENT_GATEWAYS = Object.freeze({
    STRIPE: "stripe",
    PAYPAL: "paypal",
    MBWAY: "mbway",
});

export const PAYMENT_STATUS = Object.freeze({
    REQUIRES_PAYMENT: "requires_payment",
    PENDING_MANUAL_CONFIRMATION: "pending_manual_confirmation",
    PAID: "paid",
    FAILED: "failed",
});

/**
 * Confirma que a encomenda contém pelo menos um item.
 *
 * @function hasAtLeastOneOrderItem
 * @param {unknown} items - Valor recebido pelo validador Mongoose.
 * @returns {boolean} True quando o valor é um array não vazio.
 */
function hasAtLeastOneOrderItem(items) {
    return Array.isArray(items) && items.length > 0;
}

const orderItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        unitPriceCents: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        lineTotalCents: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);

const paymentSchema = new Schema(
    {
        gateway: {
            type: String,
            enum: Object.values(PAYMENT_GATEWAYS),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            required: true,
        },
        providerReference: {
            type: String,
            default: null,
        },
        checkoutUrl: {
            type: String,
            default: null,
        },
        message: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const orderSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        checkoutKey: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: hasAtLeastOneOrderItem,
                message: "Encomenda precisa de pelo menos um produto",
            },
        },
        totalCents: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(ORDER_STATUS),
            default: ORDER_STATUS.PENDENTE,
        },
        payment: {
            type: paymentSchema,
            required: true,
        },
        stockReserved: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

// Este índice acelera o histórico do próprio cliente sem expor encomendas de outros utilizadores.
orderSchema.index({ userId: 1, createdAt: -1 });
// A combinação userId + checkoutKey é a barreira mínima contra encomendas duplicadas no mesmo checkout.
orderSchema.index({ userId: 1, checkoutKey: 1 }, { unique: true });

/**
 * Modelo Mongoose de encomendas.
 *
 * @type {import("mongoose").Model}
 */
export const Order = model("Order", orderSchema);
```

5. Explicação do código.

Este ficheiro define três vocabulários: estado logístico da encomenda, gateway de pagamento e estado de pagamento. O `paymentSchema` fica dentro da encomenda para manter pagamento e encomenda ligados, mas sem confundir `payment.status` com `order.status`.

O `userId` é obrigatório porque a encomenda pertence ao cliente autenticado. A `checkoutKey` é guardada com índice único por utilizador para que o mesmo checkout não crie duas encomendas. Os itens guardam `unitPriceCents` e `lineTotalCents` para preservar o snapshot da compra, mesmo que o preço do produto mude depois.

6. Validação do passo.

Cria uma encomenda de teste com `gateway: "bitcoin"` e confirma que Mongoose rejeita o valor. Cria outra sem `items` e confirma que a validação bloqueia. Cria duas encomendas com o mesmo `userId` e a mesma `checkoutKey` e confirma que o índice único impede duplicação.

7. Cenário negativo/erro esperado.

`payment.status: "paid"` não pode ser usado por PayPal/MBWay sem confirmação real. No MVP, esses gateways começam em `pending_manual_confirmation`. Duas tentativas iguais não devem criar duas encomendas com a mesma `checkoutKey`.

### Passo 3 - Validar gateway de checkout

1. Objetivo funcional do passo no contexto da app.

Normalizar gateway vindo do frontend e recusar valores desconhecidos antes de mexer no carrinho.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/validators/checkout.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Mantém o default Stripe e a lista fechada. O validator não deve aceitar providers inventados nem campos de preço vindos do frontend.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/checkout.validator.js
/**
 * Validadores de checkout e histórico de encomendas.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { PAYMENT_GATEWAYS } from "../models/order.model.js";

/**
 * Valida gateway de checkout.
 *
 * @function validateCheckoutPayload
 * @param {Record<string, unknown>} body - Corpo HTTP enviado pelo frontend.
 * @returns {{gateway: string}} Gateway normalizado.
 * @throws {AppError} Quando o gateway não é suportado.
 */
export function validateCheckoutPayload(body) {
    const gateway = String(body?.gateway ?? PAYMENT_GATEWAYS.STRIPE)
        .trim()
        .toLowerCase();

    // A lista fechada impede que o frontend escolha providers não documentados.
    if (!Object.values(PAYMENT_GATEWAYS).includes(gateway)) {
        throw new AppError(400, "Gateway de pagamento inválido");
    }

    return { gateway };
}

/**
 * Valida parâmetro `orderId`.
 *
 * @function validateOrderIdParam
 * @param {Record<string, unknown>} params - Params Express.
 * @returns {{orderId: string}} ID normalizado.
 * @throws {AppError} Quando o ID é inválido.
 */
export function validateOrderIdParam(params) {
    const orderId = String(params?.orderId ?? "").trim();

    // Validar o ObjectId no backend evita queries ambíguas ou erros técnicos expostos.
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError(400, "Encomenda inválida");
    }

    return { orderId };
}
```

5. Explicação do código.

O frontend pode omitir gateway e cair em Stripe, mas qualquer texto fora de `stripe`, `paypal` ou `mbway` falha antes de consultar carrinho, produto ou provider externo. O validator devolve apenas `{ gateway }`; ignora `totalCents`, `items`, `userId` ou outros campos que o cliente tente enviar.

6. Validação do passo.

Testa `{ "gateway": " MBWAY " }` e espera gateway normalizado para `mbway`. Testa `{ "gateway": "bitcoin" }` e espera `400`.

7. Cenário negativo/erro esperado.

Gateway com espaços e maiúsculas deve ser normalizado. Gateway desconhecido deve falhar sem criar encomenda.

### Passo 4 - Criar provider de pagamento isolado

1. Objetivo funcional do passo no contexto da app.

Separar integração de pagamento da regra de encomenda, mantendo Stripe real controlado e stubs honestos.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/providers/payment.provider.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria um provider único para pagamento. Usa `fetch` nativo para Stripe, envia uma chave idempotente para a sessão Stripe, falha antes de persistir encomenda quando falta chave Stripe e devolve estado pendente para PayPal/MBWay.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/providers/payment.provider.js
/**
 * Provider isolado de pagamentos.
 *
 * Stripe pode operar de forma real e controlada quando `STRIPE_SECRET_KEY`
 * existe. Sem essa configuração, o provider falha antes de criar encomenda sem
 * sessão de pagamento. A chave idempotente reduz sessões duplicadas na Stripe
 * quando o mesmo pedido é repetido. PayPal e MBWay ficam em stub funcional.
 */
import { env } from "../config/env.js";
import { AppError } from "../middlewares/error.middleware.js";
import { PAYMENT_GATEWAYS, PAYMENT_STATUS } from "../models/order.model.js";

/**
 * Converte itens da encomenda para parâmetros aceites pela API Stripe.
 *
 * @function appendStripeLineItems
 * @param {URLSearchParams} params - Params `form-urlencoded` enviados à Stripe.
 * @param {Array<{name: string, quantity: number, unitPriceCents: number}>} items - Itens da encomenda revalidados pelo backend.
 * @returns {void}
 */
function appendStripeLineItems(params, items) {
    items.forEach((item, index) => {
        params.set(`line_items[${index}][quantity]`, String(item.quantity));
        params.set(`line_items[${index}][price_data][currency]`, "eur");
        params.set(
            `line_items[${index}][price_data][unit_amount]`,
            String(item.unitPriceCents),
        );
        // A Stripe recebe o nome do snapshot da encomenda, não texto livre vindo do frontend.
        params.set(`line_items[${index}][price_data][product_data][name]`, item.name);
    });
}

/**
 * Valida se o gateway pedido pode iniciar o fluxo esperado.
 *
 * Esta pré-validação corre antes da criação da encomenda para evitar que um
 * checkout Stripe sem configuração persista uma encomenda sem URL de pagamento
 * e limpe o carrinho do cliente.
 *
 * @function assertPaymentGatewayReady
 * @param {string} gateway - Gateway já validado pelo DTO.
 * @returns {void}
 * @throws {AppError} Quando Stripe não está configurado ou o gateway é inválido.
 */
export function assertPaymentGatewayReady(gateway) {
    if (gateway === PAYMENT_GATEWAYS.STRIPE && !env.stripeSecretKey) {
        throw new AppError(503, "Stripe não está configurado");
    }

    if (
        gateway === PAYMENT_GATEWAYS.STRIPE ||
        gateway === PAYMENT_GATEWAYS.PAYPAL ||
        gateway === PAYMENT_GATEWAYS.MBWAY
    ) {
        return;
    }

    throw new AppError(400, "Gateway de pagamento inválido");
}

/**
 * Cria sessão de checkout Stripe com `fetch` nativo.
 *
 * @async
 * @function createStripeCheckoutSession
 * @param {{_id: {toString: () => string}, items: Array<object>}} order - Encomenda persistida.
 * @param {string} idempotencyKey - Chave estável da tentativa de checkout.
 * @returns {Promise<object>} Estado de pagamento seguro para guardar na encomenda.
 * @throws {AppError} Quando a chave Stripe falta ou a API externa falha.
 */
async function createStripeCheckoutSession(order, idempotencyKey) {
    if (!env.stripeSecretKey) {
        throw new AppError(503, "Stripe não está configurado");
    }

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${env.clientOrigin}/checkout/success`);
    params.set("cancel_url", `${env.clientOrigin}/checkout/cancel`);
    params.set("metadata[orderId]", order._id.toString());
    appendStripeLineItems(params, order.items);

    // A chamada envia apenas dados recalculados no backend; a UI não fornece preço.
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.stripeSecretKey}`,
            "Idempotency-Key": idempotencyKey,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
    });

    // A resposta externa é normalizada antes de guardar apenas referência e URL.
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new AppError(502, "Não foi possível iniciar pagamento Stripe neste momento");
    }

    return {
        gateway: PAYMENT_GATEWAYS.STRIPE,
        status: PAYMENT_STATUS.REQUIRES_PAYMENT,
        providerReference: data.id ?? null,
        checkoutUrl: data.url ?? null,
        message: "Sessão Stripe criada. Pagamento ainda não confirmado.",
    };
}

/**
 * Cria estado stub funcional para PayPal ou MBWay.
 *
 * @function createManualGatewayStub
 * @param {string} gateway - Gateway validado.
 * @param {{_id: {toString: () => string}}} order - Encomenda persistida.
 * @returns {object} Estado pendente, sem simular pagamento recebido.
 */
function createManualGatewayStub(gateway, order) {
    return {
        gateway,
        status: PAYMENT_STATUS.PENDING_MANUAL_CONFIRMATION,
        providerReference: `${gateway}-stub-${order._id.toString()}`,
        checkoutUrl: null,
        message: "Gateway em stub funcional no MVP. Pagamento fica pendente de confirmação manual.",
    };
}

/**
 * Cria a sessão ou estado de pagamento para uma encomenda.
 *
 * @async
 * @function createPaymentSession
 * @param {object} order - Encomenda persistida.
 * @param {string} gateway - Gateway validado.
 * @param {string} idempotencyKey - Chave estável para evitar sessões duplicadas.
 * @returns {Promise<object>} Dados seguros de pagamento.
 * @throws {AppError} Quando o gateway é inválido.
 */
export async function createPaymentSession(order, gateway, idempotencyKey) {
    if (gateway === PAYMENT_GATEWAYS.STRIPE) {
        return createStripeCheckoutSession(order, idempotencyKey);
    }

    if (gateway === PAYMENT_GATEWAYS.PAYPAL || gateway === PAYMENT_GATEWAYS.MBWAY) {
        // Estes gateways não fingem confirmação: ficam pendentes para revisão manual.
        return createManualGatewayStub(gateway, order);
    }

    throw new AppError(400, "Gateway de pagamento inválido");
}
```

5. Explicação do código.

Este provider concentra a diferença entre Stripe e os stubs. `assertPaymentGatewayReady` corre antes de criar a encomenda porque Stripe sem chave é uma falha de configuração, não uma encomenda pendente. `appendStripeLineItems` transforma itens já revalidados pelo backend em parâmetros Stripe, evitando preço ou nome vindos diretamente da UI.

A `Idempotency-Key` enviada à Stripe reaproveita a mesma tentativa quando o pedido é repetido. Isto não implementa webhooks nem confirmação real de pagamento, mas reduz o risco de sessões duplicadas em retry. `createManualGatewayStub` devolve sempre `pending_manual_confirmation`, nunca `paid`.

6. Validação do passo.

Sem `STRIPE_SECRET_KEY`, checkout Stripe deve devolver `503` e não deve criar encomenda nem limpar carrinho. Com MBWay, a resposta deve devolver `pending_manual_confirmation`. Num teste de provider Stripe, confirma que o header `Idempotency-Key` recebe a `checkoutKey` calculada pelo service.

7. Cenário negativo/erro esperado.

PayPal/MBWay não podem devolver `paid`. Se a API Stripe falhar, a app deve devolver erro controlado `502` e o service deve guardar `payment.status: "failed"` na encomenda reaproveitável.

### Passo 5 - Ligar controller e rota autenticada

1. Objetivo funcional do passo no contexto da app.

Expor `POST /api/orders/checkout` sem aceitar identidade enviada pelo frontend.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/controllers/order.controller.js`
    - EDITAR: `apps/api/src/routes/order.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.

3. Instruções do que fazer.

Valida payload no controller, usa `req.user.id` vindo de `requireAuth` e monta a rota protegida.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/order.controller.js
/**
 * Controllers de encomendas.
 */
import { checkoutMyCart, listMyOrders } from "../services/order.service.js";
import { validateCheckoutPayload } from "../validators/checkout.validator.js";

/**
 * Cria encomenda e inicia pagamento a partir do carrinho.
 *
 * @async
 * @function checkoutController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 201.
 */
export async function checkoutController(req, res, next) {
    try {
        const input = validateCheckoutPayload(req.body);
        // O utilizador vem do cookie HttpOnly validado no backend, não do body.
        const order = await checkoutMyCart(req.user.id, input);

        return res.status(201).json({ order });
    } catch (err) {
        return next(err);
    }
}

/**
 * Lista histórico de encomendas do cliente autenticado.
 *
 * @async
 * @function listMyOrdersController
 * @param {import("express").Request & {user: {id: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response|void>} Resposta 200.
 */
export async function listMyOrdersController(req, res, next) {
    try {
        const orders = await listMyOrders(req.user.id);
        return res.status(200).json({ orders });
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/order.routes.js
/**
 * Rotas de checkout e histórico de encomendas.
 */
import { Router } from "express";
import {
    checkoutController,
    listMyOrdersController,
} from "../controllers/order.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

/**
 * Router Express de encomendas.
 *
 * @type {import("express").Router}
 */
export const orderRoutes = Router();

// O checkout é sempre autenticado para impedir compras em carrinho alheio.
orderRoutes.post("/orders/checkout", requireAuth, checkoutController);
orderRoutes.get("/me/orders", requireAuth, listMyOrdersController);
```

5. Explicação do código.

O controller transforma o body em DTO seguro e passa apenas `req.user.id` ao service. A rota usa `requireAuth`, logo o frontend não escolhe `userId`. Isto preserva o contrato de sessão HttpOnly de `BK-MF7-03` e impede checkout de outro utilizador.

6. Validação do passo.

Sem cookie, `POST /api/orders/checkout` deve devolver `401`. Com cookie válido e carrinho vazio, deve devolver `400`.

7. Cenário negativo/erro esperado.

Um payload com `{ "userId": "outro-utilizador", "gateway": "mbway" }` não deve alterar ownership, porque o backend ignora `userId` vindo do body.

### Passo 6 - Criar encomenda a partir do carrinho autenticado

1. Objetivo funcional do passo no contexto da app.

Recalcular preço/stock no backend, criar encomenda e iniciar pagamento.

2. Ficheiros envolvidos:
    - EDITAR: `apps/api/src/services/order.service.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Usa `Cart` e `Product` dos BKs anteriores. Valida gateway antes de criar encomenda Stripe, calcula uma `checkoutKey`, relê produtos, calcula total no backend, reaproveita encomenda existente quando a tentativa já existe, associa estado de pagamento e só depois limpa o carrinho.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/order.service.js
/**
 * Service de encomendas, histórico e checkout.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { Cart } from "../models/cart.model.js";
import { Order, ORDER_STATUS, PAYMENT_STATUS } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import {
    assertPaymentGatewayReady,
    createPaymentSession,
} from "../providers/payment.provider.js";
import { clearCart } from "./cart.service.js";

/**
 * Converte encomenda para DTO público.
 *
 * @function toOrderResponse
 * @param {object} order - Documento Mongoose ou equivalente.
 * @returns {object} Encomenda sem `userId` nem campos internos.
 */
export function toOrderResponse(order) {
    return {
        id: order._id.toString(),
        items: order.items.map((item) => ({
            productId: item.productId.toString(),
            name: item.name,
            unitPriceCents: item.unitPriceCents,
            quantity: item.quantity,
            lineTotalCents: item.lineTotalCents,
        })),
        totalCents: order.totalCents,
        status: order.status,
        payment: {
            gateway: order.payment.gateway,
            status: order.payment.status,
            providerReference: order.payment.providerReference,
            checkoutUrl: order.payment.checkoutUrl,
            message: order.payment.message,
        },
        stockReserved: order.stockReserved,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}

/**
 * Relê produtos atuais e constrói linhas de encomenda seguras.
 *
 * @async
 * @function buildOrderItemsFromCart
 * @param {Array<object>} cartItems - Itens do carrinho autenticado.
 * @returns {Promise<Array<object>>} Itens revalidados com preço e stock atuais.
 * @throws {AppError} Quando produto falta ou stock não chega.
 */
async function buildOrderItemsFromCart(cartItems) {
    const productIds = cartItems.map((item) => item.productId.toString());
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(
        products.map((product) => [product._id.toString(), product]),
    );

    return cartItems.map((item) => {
        const productId = item.productId.toString();
        const product = productsById.get(productId);

        if (!product) {
            throw new AppError(404, "Produto do carrinho não encontrado");
        }

        if (product.stock < item.quantity) {
            throw new AppError(409, `Stock insuficiente para ${product.name}`);
        }

        // O preço vem sempre do produto atual no backend, não do snapshot ou do frontend.
        return {
            productId: product._id,
            name: product.name,
            unitPriceCents: product.priceCents,
            quantity: item.quantity,
            lineTotalCents: product.priceCents * item.quantity,
        };
    });
}

/**
 * Cria chave idempotente para a tentativa atual de checkout.
 *
 * @function buildCheckoutKey
 * @param {string} userId - ID autenticado pelo cookie HttpOnly.
 * @param {object} cart - Carrinho autenticado.
 * @param {string} gateway - Gateway validado.
 * @returns {string} Chave estável para a mesma tentativa de checkout.
 */
function buildCheckoutKey(userId, cart, gateway) {
    const cartId = cart._id?.toString?.() ?? "cart";
    const cartVersion =
        cart.updatedAt instanceof Date
            ? cart.updatedAt.getTime()
            : cart.items
                  .map((item) => `${item.productId.toString()}:${item.quantity}`)
                  .join("|");

    // A chave mistura utilizador, carrinho e gateway para evitar colisões entre clientes.
    return `${userId}:${cartId}:${cartVersion}:${gateway}`;
}

/**
 * Procura uma encomenda já criada para a mesma tentativa de checkout.
 *
 * @async
 * @function findReusableCheckoutOrder
 * @param {string} userId - ID autenticado.
 * @param {string} checkoutKey - Chave idempotente calculada pelo backend.
 * @returns {Promise<object|null>} Encomenda reaproveitável ou null.
 */
async function findReusableCheckoutOrder(userId, checkoutKey) {
    return Order.findOne({
        userId,
        checkoutKey,
        "payment.status": {
            $in: [
                PAYMENT_STATUS.REQUIRES_PAYMENT,
                PAYMENT_STATUS.PENDING_MANUAL_CONFIRMATION,
                PAYMENT_STATUS.FAILED,
            ],
        },
    });
}

/**
 * Guarda falha controlada de pagamento sem marcar a encomenda como paga.
 *
 * @async
 * @function markCheckoutPaymentFailed
 * @param {object} order - Encomenda persistida.
 * @param {string} gateway - Gateway que falhou.
 * @returns {Promise<void>}
 */
async function markCheckoutPaymentFailed(order, gateway) {
    order.payment = {
        gateway,
        status: PAYMENT_STATUS.FAILED,
        providerReference: null,
        checkoutUrl: null,
        message: "Não foi possível iniciar o pagamento. Tenta novamente antes de alterar o carrinho.",
    };

    // Guardar `failed` deixa evidence operacional sem limpar o carrinho nem fingir cobrança.
    await order.save();
}

/**
 * Cria encomenda a partir do carrinho autenticado e inicia pagamento.
 *
 * @async
 * @function checkoutMyCart
 * @param {string} userId - ID autenticado pelo cookie HttpOnly.
 * @param {{gateway: string}} input - Gateway validado.
 * @returns {Promise<object>} Encomenda criada e serializada.
 * @throws {AppError} Quando o carrinho está vazio, stock falha ou gateway falha.
 */
export async function checkoutMyCart(userId, input) {
    // O `userId` vem da sessão autenticada para impedir checkout de carrinho alheio.
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
        throw new AppError(400, "Carrinho vazio");
    }

    assertPaymentGatewayReady(input.gateway);
    const checkoutKey = buildCheckoutKey(userId, cart, input.gateway);

    let order = await findReusableCheckoutOrder(userId, checkoutKey);

    if (!order) {
        const items = await buildOrderItemsFromCart(cart.items);
        const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

        order = await Order.create({
            userId,
            checkoutKey,
            items,
            totalCents,
            status: ORDER_STATUS.PENDENTE,
            payment: {
                gateway: input.gateway,
                status: PAYMENT_STATUS.REQUIRES_PAYMENT,
                providerReference: null,
                checkoutUrl: null,
                message: "Pagamento ainda não iniciado.",
            },
            stockReserved: false,
        });
    }

    try {
        // A mesma checkoutKey é enviada ao provider para reduzir sessões Stripe duplicadas.
        const payment = await createPaymentSession(order, input.gateway, checkoutKey);
        order.payment = payment;
        await order.save();
        await clearCart(userId);
    } catch (err) {
        if (err instanceof AppError && err.statusCode === 502) {
            await markCheckoutPaymentFailed(order, input.gateway);
        }

        throw err;
    }

    return toOrderResponse(order);
}

/**
 * Lista histórico de compras do cliente autenticado.
 *
 * @async
 * @function listMyOrders
 * @param {string} userId - ID autenticado.
 * @returns {Promise<object[]>} Encomendas ordenadas por data.
 */
export async function listMyOrders(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    return orders.map(toOrderResponse);
}
```

5. Explicação do código.

`checkoutMyCart` carrega o carrinho por `userId` de sessão. Depois valida se o gateway está pronto, calcula uma `checkoutKey` e procura uma encomenda reaproveitável antes de criar outra. `buildOrderItemsFromCart` relê produtos e stock, calcula `lineTotalCents` e impede que um preço enviado pela UI altere o total.

O pagamento começa como `requires_payment`, mas PayPal/MBWay passam para `pending_manual_confirmation` no provider. Se a Stripe falhar depois de a encomenda existir, `markCheckoutPaymentFailed` guarda `payment.status: "failed"` e relança o erro `502`. O carrinho só é limpo depois de `order.save()` com estado de pagamento persistido, porque a app não deve remover a intenção de compra quando o gateway falhou.

6. Validação do passo.

Carrinho vazio deve devolver `400`. Produto sem stock deve devolver `409`. Um frontend que envie `totalCents: 1` deve continuar a receber o total real calculado pelo backend. Dois pedidos iguais com a mesma `checkoutKey` devem reaproveitar a mesma encomenda, não chamar `Order.create` duas vezes.

7. Cenário negativo/erro esperado.

Se `STRIPE_SECRET_KEY` não existir, `assertPaymentGatewayReady` deve falhar antes de `Order.create`, `Product.find` e `clearCart`. Se a API Stripe falhar depois de existir encomenda, o service deve guardar `payment.status: "failed"` e não deve limpar o carrinho.

### Passo 7 - Ligar checkout à UI e fechar evidence

1. Objetivo funcional do passo no contexto da app.

Permitir escolha explícita do gateway pelo utilizador e mostrar resultado sem calcular preço na UI.

2. Ficheiros envolvidos:
    - EDITAR: `apps/web/src/pages/CheckoutPage.jsx`
    - REVER: `apps/web/src/services/apiClient.js`
    - REVER: `apps/api/tests/mf3.integration.test.js`
    - LOCALIZAÇÃO: ficheiro completo da página, `apiRequest` e testes de checkout.

3. Instruções do que fazer.

A página deve enviar apenas `{ gateway }`, mostrar `loading`, `error` e `success`, bloquear duplo clique enquanto `status === "loading"` e abrir `checkoutUrl` apenas quando existir. O `apiRequest` já usa `credentials: "include"`, por isso o cookie HttpOnly segue automaticamente.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/CheckoutPage.jsx
/**
 * Página de checkout.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Cria encomenda a partir do carrinho e inicia o gateway selecionado.
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
                // A UI envia só o gateway; preço, itens e userId ficam no backend.
                body: JSON.stringify({ gateway }),
            });

            setOrder(data.order);
            setStatus("success");
        } catch (err) {
            // A mensagem vem normalizada pela API e não expõe chave Stripe nem detalhes internos.
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
```

5. Explicação do código.

A UI não envia preço, itens ou `userId`. O botão é a ação explícita do utilizador e fica desativado durante `loading`, reduzindo duplo clique no browser. A proteção principal continua no backend, através da `checkoutKey`, porque o frontend nunca é suficiente para garantir idempotência.

Se Stripe devolver URL, a UI mostra um link. PayPal/MBWay mostram estado pendente sem fingir conclusão. `apiRequest` envia cookies por `credentials: "include"`, mantendo o contrato de sessão HttpOnly sem guardar tokens no browser.

6. Validação do passo.

Escolhe Stripe sem chave e confirma erro controlado. Escolhe MBWay e confirma estado pendente. Inspeciona o payload do pedido e confirma que contém apenas `{ gateway }`. Faz duplo clique no botão e confirma que a UI fica em `loading` e que o backend não cria encomendas duplicadas.

7. Cenário negativo/erro esperado.

Checkout não deve ser disparado automaticamente por recomendação de produto. A compra depende sempre de clique explícito do utilizador.

#### Expected results

- Carrinho vazio devolve `400`.
- Produto inexistente no carrinho devolve `404`.
- Produto sem stock devolve `409`.
- Gateway inválido devolve `400`.
- Stripe sem chave devolve `503`.
- Falha externa da Stripe devolve `502`.
- Falha externa da Stripe guarda `payment.status: "failed"` na encomenda existente.
- Retry ou duplo pedido do mesmo checkout reaproveita a encomenda pela `checkoutKey`.
- Stripe configurado devolve `requires_payment` e `checkoutUrl`.
- PayPal/MBWay devolvem `pending_manual_confirmation`.
- O frontend nunca envia preço final, itens ou `userId`.
- Recomendação de IA não adiciona produtos automaticamente ao carrinho.

#### Critérios de aceite

- Gateways fechados a `stripe`, `paypal`, `mbway`.
- Backend recalcula preço e stock.
- Checkout tem idempotência mínima por `userId + checkoutKey`.
- Pagamento fica separado do estado da encomenda.
- Falha externa da Stripe fica persistida como `failed`.
- PayPal/MBWay são stubs honestos.
- Carrinho só é limpo após estado de pagamento persistido.
- Recomendação não adiciona produtos automaticamente ao carrinho.
- Código principal tem JSDoc e comentários didáticos em validação, ownership, provider externo, persistência, estado React e cenários negativos.
- Cenários negativos concluídos: mínimo `3`.

#### Validação final

### Matriz mínima de testes por prioridade

- `P0`: integração API + build web + 3 negativos obrigatórios.
- `P1`: teste focal por camada + 2 negativos.
- `P2`: revisão manual/evidence + 1 negativo.

### Evidência de testes por camada

- Validator: `validateCheckoutPayload` aceita `stripe`, `paypal`, `mbway`, normaliza maiúsculas/espaços e rejeita `bitcoin`.
- Provider: Stripe sem `STRIPE_SECRET_KEY` devolve `503`; Stripe recebe `Idempotency-Key`; PayPal/MBWay devolvem `pending_manual_confirmation`.
- Service: `checkoutMyCart` ignora `totalCents` vindo do frontend, recalcula preço/stock, reaproveita encomenda por `checkoutKey`, marca falha Stripe como `failed` e limpa carrinho só depois de guardar pagamento.
- Controller/route: `POST /api/orders/checkout` exige cookie HttpOnly e usa `req.user.id`.
- Frontend: `CheckoutPage` envia apenas `{ gateway }`, mostra `loading`, `error`, `success` e usa `checkoutUrl` apenas se existir.
- Negativos: mínimo `3` cenários com resultado controlado.
- Segurança/comércio: stubs nunca devolvem `paid` e recomendações nunca disparam checkout automático.

### Comandos finais

- `rg -n "PAYMENT_GATEWAYS|PENDING_MANUAL_CONFIRMATION|checkoutKey|Idempotency-Key|STRIPE_SECRET_KEY" apps/api/src apps/web/src`
- Revisão dos caminhos publicados: todos os ficheiros e comandos deste BK usam apenas `apps/api` ou `apps/web`.
- `npm --prefix apps/api test`
- `npm --prefix apps/web run build`
- `git diff --check`
- `bash scripts/validate-planificacao.sh`

### Política de negativos

- Executar cenários negativos obrigatórios (mínimo 3).
- [ ] Negativos: mínimo `3` cenários com evidence.
- Se `negativos < 3`, o BK não pode ser considerado pronto para PR/defesa.

#### Evidence para PR/defesa

- Pedido checkout MBWay com `payment.status: "pending_manual_confirmation"`.
- Negativo Stripe sem chave com `503` e sem chamada a `Order.create`.
- Negativo falha externa Stripe com `502`, `payment.status: "failed"` persistido e carrinho preservado.
- Negativo retry/duplo pedido com a mesma `checkoutKey`, provando que não há duas encomendas.
- Negativo carrinho vazio com `400`.
- Negativo stock insuficiente com `409`.
- Negativo total falso enviado pela UI, provando que `totalCents` final vem do backend.
- Print ou log de DevTools mostrando payload `{ gateway }` sem preço, itens ou `userId`.
- Output de `npm --prefix apps/api test`.
- Output de `npm --prefix apps/web run build`.

#### Handoff

O `BK-MF7-07` deve manter recomendações de IA separadas do checkout: a IA pode recomendar e explicar, mas a compra depende sempre de ação explícita do utilizador.

O `BK-MF8-01` deve preservar esta separação modular em model, validator, provider, service, controller, route, página e testes. O `BK-MF8-02` pode medir erros e métricas de checkout sem expor chaves, tokens, cookies, dados pessoais ou detalhes sensíveis de pagamento.

#### Changelog

- 2026-06-27: Fechada idempotência mínima do checkout com `checkoutKey`, header Stripe `Idempotency-Key`, reaproveitamento de encomenda e estado `failed` para falha externa Stripe.
- 2026-06-27: Checkout consolidado com blocos autocontidos, JSDoc, provider completo com `appendStripeLineItems`, service completo, controller/route/UI, matriz de evidence por camada, negativos mínimos e comentários didáticos com acentuação.
- 2026-06-26: Tutorial técnico linear estruturado com gateway validado, Stripe controlado, PayPal/MBWay em stub funcional, backend como fonte de preço e negativos de checkout.
