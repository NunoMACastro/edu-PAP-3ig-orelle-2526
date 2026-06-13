# BK-MF3-03 - Registar encomendas e pagamentos (Stripe real no MVP + PayPal/MBWay em stub funcional)

## Header
- `doc_id`: `GUIA-BK-MF3-03`
- `bk_id`: `BK-MF3-03`
- `macro`: `MF3`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF3-02`
- `rf_rnf`: `RF27`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF3-04`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-03-registar-encomendas-e-pagamentos-gateway-stripe-paypal-mbway.md`
- `last_updated`: `2026-06-13`

## Contexto do BK
- Entrega alvo: implementar `RF27`, criando encomendas e início de pagamento.
- CANONICO: `Stripe` é real no MVP; `PayPal/MBWay` ficam em stub funcional.
- DERIVADO: a encomenda nasce do carrinho autenticado, com snapshot de produtos e estado inicial `pendente`.
- Este BK prepara histórico de compras, estatísticas, stock automático e notificações.

## Objetivo
Neste BK vais transformar o carrinho num pedido de encomenda e criar uma sessão de pagamento controlada.

## Importância
Checkout é uma fronteira crítica: valida preço, stock e identidade. Não pode confiar no frontend, porque dinheiro e stock são dados de negócio sensíveis.

## Scope-in
- Criar modelo `Order`.
- Criar provider de pagamentos.
- Criar endpoint `POST /api/orders/checkout`.
- Criar encomenda a partir do carrinho.
- Validar stock e preço no backend.
- Esvaziar carrinho após criar encomenda válida.
- Criar página React de checkout.

## Scope-out
- Não marcar encomenda como enviada ou entregue.
- Não implementar webhooks completos.
- Não criar multi-gateway real para PayPal/MBWay.
- Não fazer descontos, cupões ou faturas.

## Estado antes
`CRITICO`: o guia tinha código genérico de checkout e não criava encomenda, provider, stock, ownership nem separação entre gateways.

## Estado depois
`OK`: o guia fecha encomenda e pagamento inicial com contratos claros, negativos e handoff.

## Pré-requisitos
- `BK-MF3-02`: `Cart`, `getMyCart` e `clearCart`.
- `BK-MF0-07`: `Product` com preço e stock.
- `BK-MF0-02`: sessão segura.
- `RNF17`: pagamentos com `Stripe` real controlado e PayPal/MBWay em stub funcional.

## Glossário
- Checkout: ato de confirmar carrinho e iniciar pagamento.
- Encomenda: registo persistente da compra.
- Pagamento: tentativa de cobrança associada à encomenda.
- Gateway: serviço externo ou fluxo controlado que processa pagamento.
- Idempotência mínima: impedir que pedidos repetidos criem encomendas duplicadas sem controlo.

## Conceitos teóricos
Carrinho e encomenda têm responsabilidades diferentes. O carrinho é editável; a encomenda é a fotografia da compra no momento de checkout.

O frontend não envia total, preço ou stock. O backend lê o carrinho, volta a consultar produtos e calcula total. Isto evita manipulação de valores no browser.

`Stripe` deve ser configurado por variável de ambiente. Se a chave não existir, o provider deve falhar de forma controlada e nunca inventar pagamento concluído.

PayPal/MBWay ficam em stub funcional: a API responde com estado `pending_manual_confirmation`, permitindo demonstrar fluxo sem cobrar dinheiro real.

## Arquitetura do BK
- `order.model.js`: guarda encomendas.
- `payment.provider.js`: isola Stripe real e os fluxos pendentes de PayPal/MBWay.
- `checkout.validator.js`: valida método de pagamento.
- `order.service.js`: cria encomenda, valida stock e chama provider.
- `order.controller.js`: expõe checkout.
- `order.routes.js`: protege endpoint.
- `CheckoutPage.jsx`: mostra resumo do carrinho e inicia pagamento.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/order.model.js`
- EDITAR: `server/package.json`
- CRIAR: `server/src/providers/payment.provider.js`
- CRIAR: `server/src/validators/checkout.validator.js`
- CRIAR: `server/src/services/order.service.js`
- CRIAR: `server/src/controllers/order.controller.js`
- CRIAR: `server/src/routes/order.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/CheckoutPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/services/cart.service.js`
- REVER: `server/src/models/product.model.js`

## Bloco pedagógico
### Objetivo
Criar checkout seguro com encomenda persistida e pagamento inicial.

### Pré-requisitos
- Saber ler carrinho autenticado.
- Saber usar variáveis de ambiente no backend.
- Saber separar service de provider externo.

### Erros comuns
- Aceitar total enviado pelo frontend.
- Marcar pagamento como concluído sem confirmação.
- Criar encomenda para carrinho vazio.
- Esquecer stock insuficiente.

### Check de compreensao
- [ ] Sei explicar por que o total é calculado no backend.
- [ ] Sei distinguir `orderStatus` de `paymentStatus`.
- [ ] Sei indicar o que acontece sem chave Stripe.

### Tempo estimado
`P0`: 120 minutos, incluindo negativos.

## Bloco operacional
### Entrada
- Sessão autenticada.
- Carrinho com itens.
- Método de pagamento: `stripe`, `paypal` ou `mbway`.

### Passos
1. Confirmar contrato de checkout.
2. Criar modelo `Order`.
3. Criar provider de pagamentos.
4. Criar validator.
5. Criar service de checkout.
6. Criar controller e routes.
7. Registar route e página.
8. Executar cenários negativos obrigatórios (mínimo 3).

### Cenarios negativos recomendados
- Carrinho vazio devolve `400`.
- Stock insuficiente devolve `409`.
- Gateway inválido devolve `400`.
- Stripe sem configuração devolve `503`.

### Validacao
- [ ] Smoke: checkout com carrinho válido cria encomenda `pendente`.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Segurança: backend calcula total.
- [ ] Comércio: PayPal/MBWay não são apresentados como pagamento real concluído.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF3-04` usa `Order` para histórico de compras. `BK-MF3-08` usa encomenda paga para reduzir stock.

## Passos lineares

### Passo 1 - Confirmar contrato de checkout

1. Explicação simples do objetivo: separar encomenda, pagamento e stock.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - LOCALIZAÇÃO: `RF27`, `RF28`, `RF32` e `RNF17`.
3. O que fazer: confirma que `RF27` cria encomenda/pagamento e que stock automático fica preparado para `RF32`.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: não há código porque este passo define o limite funcional. O stock não deve ser reduzido apenas por iniciar pagamento.
6. Como validar este passo: o modelo deve ter `orderStatus` e `paymentStatus` separados.
7. Erros comuns ou cenário negativo: confundir pagamento iniciado com compra entregue gera histórico falso.

### Passo 2 - Criar modelo Order

1. Explicação simples do objetivo: guardar encomenda com snapshot de compra.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/order.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar schema de encomenda.
4. Código completo, correto e integrado.

```js
// server/src/models/order.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Representa uma linha imutável da encomenda.
 * O preço fica gravado para preservar o histórico mesmo que o produto mude depois.
 */
const orderItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPriceCents: { type: Number, required: true, min: 0 },
        lineTotalCents: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);

/**
 * Representa o estado de pagamento associado à encomenda.
 * `payment.status` é separado de `orderStatus` para não confundir logística com cobrança.
 */
const paymentSchema = new Schema(
    {
        method: { type: String, enum: ["stripe", "paypal", "mbway"], required: true },
        status: {
            type: String,
            enum: ["requires_payment", "pending_manual_confirmation", "paid", "failed"],
            required: true,
        },
        providerReference: { type: String, default: null },
        checkoutUrl: { type: String, default: null },
    },
    { _id: false },
);

/**
 * Guarda uma encomenda criada a partir do carrinho de um cliente.
 * O campo stockReserved permite reduzir stock uma única vez num BK posterior.
 */
const orderSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        items: { type: [orderItemSchema], required: true },
        totalCents: { type: Number, required: true, min: 1 },
        orderStatus: {
            type: String,
            enum: ["pendente", "enviado", "entregue", "cancelado"],
            default: "pendente",
            index: true,
        },
        payment: { type: paymentSchema, required: true },
        stockReserved: { type: Boolean, default: false },
    },
    { timestamps: true },
);

/**
 * Modelo MongoDB usado para encomendas, histórico e estatísticas comerciais.
 */
export const Order = model("Order", orderSchema);
```

5. Explicação do código: a encomenda guarda itens e total para histórico. `payment.status` fica separado de `orderStatus`. `stockReserved` prepara a atualização automática do stock no BK-MF3-08.
6. Como validar este passo: criar encomenda sem itens ou total positivo deve falhar.
7. Erros comuns ou cenário negativo: guardar só referência ao carrinho perde o histórico se o carrinho for alterado.

### Passo 3 - Criar provider de pagamentos

1. Explicação simples do objetivo: isolar Stripe real controlado e fluxos pendentes limitados.
2. Ficheiros envolvidos.
    - EDITAR: `server/package.json`
    - CRIAR: `server/src/providers/payment.provider.js`
    - LOCALIZAÇÃO: dependência `stripe` e ficheiro completo.
3. O que fazer: instalar o SDK oficial `stripe` e criar provider com `stripe`, `paypal` e `mbway`.
4. Código completo, correto e integrado.

```bash
npm install stripe
```

```js
// server/src/providers/payment.provider.js
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
```

5. Explicação do código: o SDK oficial `stripe` é a dependência mínima para cumprir `RNF17`. `createStripeClient` falha com `503` sem chave, em vez de criar uma referência falsa. `buildStripeLineItems` transforma os itens da encomenda em linhas Stripe usando preço calculado no backend. `createPaymentSession` guarda `session.id` como referência do provider e devolve `session.url` para o frontend abrir o checkout. PayPal/MBWay não fingem cobrança; devolvem estado pendente controlado.
6. Como validar este passo: remover `STRIPE_SECRET_KEY` e pedir checkout Stripe deve devolver `503`; com chave de teste válida, a resposta deve trazer `providerReference` com formato de sessão Stripe e `checkoutUrl` externo.
7. Erros comuns ou cenário negativo: devolver `paid` sem confirmação real cria fraude contabilística; criar URL local para Stripe não cumpre Stripe real.

### Passo 4 - Criar validator de checkout

1. Explicação simples do objetivo: aceitar apenas gateways previstos.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/checkout.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: validar método.
4. Código completo, correto e integrado.

```js
// server/src/validators/checkout.validator.js
import { AppError } from "../middlewares/error.middleware.js";

const PAYMENT_METHODS = new Set(["stripe", "paypal", "mbway"]);

/**
 * Valida o método de pagamento pedido no checkout.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ paymentMethod: "stripe" | "paypal" | "mbway" }} Método normalizado.
 * @throws {AppError} Quando o método não pertence ao conjunto permitido.
 */
export function validateCheckoutPayload(body) {
    const paymentMethod = String(body?.paymentMethod || "").trim().toLowerCase();

    if (!PAYMENT_METHODS.has(paymentMethod)) {
        throw new AppError(400, "Método de pagamento inválido");
    }

    return { paymentMethod };
}
```

5. Explicação do código: a validação reduz a entrada a um enum conhecido. Não aceita total nem produtos porque esses dados vêm do carrinho e da base de dados.
6. Como validar este passo: enviar `paymentMethod: "crypto"` deve devolver `400`.
7. Erros comuns ou cenário negativo: aceitar método livre abre fluxos impossíveis de auditar.

### Passo 5 - Criar service de checkout

1. Explicação simples do objetivo: criar encomenda segura a partir do carrinho.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/order.service.js`
    - REVER: `server/src/services/cart.service.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: validar carrinho, stock, preço e criar pagamento.
4. Código completo, correto e integrado.

```js
// server/src/services/order.service.js
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { clearCart, getMyCart } from "./cart.service.js";
import { createPaymentSession } from "../providers/payment.provider.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Constrói as linhas da encomenda a partir do carrinho validando produtos atuais.
 * @param {Array<{ productId: string, quantity: number }>} cartItems - Itens do carrinho autenticado.
 * @returns {Promise<Array<object>>} Itens prontos para gravar na encomenda.
 * @throws {AppError} Quando um produto está inativo ou sem stock suficiente.
 */
async function buildOrderItems(cartItems) {
    const items = [];

    for (const item of cartItems) {
        // Preço e stock são lidos da base de dados para impedir manipulação no frontend.
        const product = await Product.findById(item.productId).select("name priceCents stock isActive");
        if (!product || product.isActive === false) {
            throw new AppError(404, `Produto ${item.productId} não está disponível`);
        }
        if (product.stock < item.quantity) {
            throw new AppError(409, `Stock insuficiente para ${product.name}`);
        }

        items.push({
            productId: product._id,
            name: product.name,
            quantity: item.quantity,
            unitPriceCents: product.priceCents,
            lineTotalCents: product.priceCents * item.quantity,
        });
    }

    return items;
}

/**
 * Converte uma encomenda num DTO seguro para a API.
 * @param {object} order - Documento Order persistido.
 * @returns {{ id: string, items: Array<object>, totalCents: number, orderStatus: string, payment: object, createdAt: Date }}
 */
function serializeOrder(order) {
    return {
        id: order._id.toString(),
        items: order.items,
        totalCents: order.totalCents,
        orderStatus: order.orderStatus,
        payment: order.payment,
        createdAt: order.createdAt,
    };
}

/**
 * Cria uma encomenda a partir do carrinho do cliente e inicia o pagamento.
 * @param {string} userId - ID vindo da sessão autenticada.
 * @param {{ paymentMethod: "stripe" | "paypal" | "mbway" }} payload - Método escolhido.
 * @returns {Promise<object>} Encomenda criada com dados de pagamento.
 * @throws {AppError} Quando o carrinho está vazio, há stock insuficiente ou o provider falha.
 */
export async function checkoutMyCart(userId, { paymentMethod }) {
    const cart = await getMyCart(userId);

    if (cart.items.length === 0) {
        throw new AppError(400, "Carrinho vazio");
    }

    const items = await buildOrderItems(cart.items);
    const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

    // A encomenda nasce do carrinho validado; o cliente não envia total nem lista de produtos.
    const order = new Order({
        userId,
        items,
        totalCents,
        payment: {
            method: paymentMethod,
            status: "requires_payment",
        },
    });

    const payment = await createPaymentSession({ method: paymentMethod, order });
    order.payment = payment;
    await order.save();
    // O carrinho só é limpo depois de a encomenda estar gravada.
    await clearCart(userId);

    return serializeOrder(order);
}

/**
 * Lista as encomendas do cliente autenticado para histórico pessoal.
 * @param {string} userId - ID vindo da sessão autenticada.
 * @returns {Promise<Array<object>>} Encomendas ordenadas da mais recente para a mais antiga.
 */
export async function listMyOrders(userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return orders.map(serializeOrder);
}
```

5. Explicação do código: o service lê o carrinho do próprio utilizador, consulta produtos atuais e calcula total. Só depois cria a encomenda e pede uma sessão de pagamento ao provider. `listMyOrders` prepara `BK-MF3-04`.
6. Como validar este passo: alterar preço no frontend não altera total; o total vem do produto na base de dados.
7. Erros comuns ou cenário negativo: limpar carrinho antes de guardar encomenda pode perder compra se ocorrer erro.

### Passo 6 - Criar controller e routes

1. Explicação simples do objetivo: expor checkout autenticado.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/order.controller.js`
    - CRIAR: `server/src/routes/order.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: criar endpoint `POST /api/orders/checkout`.
4. Código completo, correto e integrado.

```js
// server/src/controllers/order.controller.js
import { checkoutMyCart } from "../services/order.service.js";
import { validateCheckoutPayload } from "../validators/checkout.validator.js";

/**
 * Handler HTTP que cria uma encomenda e inicia o fluxo de pagamento.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function checkoutController(req, res, next) {
    try {
        const payload = validateCheckoutPayload(req.body);
        const order = await checkoutMyCart(req.user.id, payload);
        return res.status(201).json({ order });
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/order.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { checkoutController } from "../controllers/order.controller.js";

/**
 * Rotas autenticadas para checkout de encomendas.
 */
export const orderRoutes = Router();

orderRoutes.post("/orders/checkout", requireAuth, checkoutController);
```

5. Explicação do código: o endpoint usa sessão e não aceita `userId`. O controller devolve `201` porque cria uma encomenda.
6. Como validar este passo: sem sessão deve devolver `401`; com carrinho válido deve devolver `201`.
7. Erros comuns ou cenário negativo: criar `POST /orders` com body de itens duplica a responsabilidade do carrinho.

### Passo 7 - Registar route e página

1. Explicação simples do objetivo: ligar backend e frontend.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - CRIAR: `client/src/pages/CheckoutPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: imports, routes e ficheiro completo.
3. O que fazer: montar API e criar UI.
4. Código completo, correto e integrado.

```js
import { orderRoutes } from "./routes/order.routes.js";

app.use("/api", orderRoutes);
```

```jsx
// client/src/pages/CheckoutPage.jsx
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
```

5. Explicação do código: a página envia só o método. A sessão vai por cookie. Se o backend devolver `checkoutUrl`, o cliente é enviado para a página real da Stripe. Se não existir URL, a UI explica que o método ficou pendente. A resposta mostra estados sem prometer pagamento concluído.
6. Como validar este passo: fazer checkout Stripe com carrinho válido deve redirecionar para Stripe; fazer checkout PayPal/MBWay deve mostrar pendência sem URL.
7. Erros comuns ou cenário negativo: mostrar “pago” para PayPal/MBWay neste BK é incorreto.

### Passo 8 - Validar negativos e evidence

1. Explicação simples do objetivo: provar que checkout falha de forma controlada.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/order.service.js`
    - REVER: `server/src/providers/payment.provider.js`
    - LOCALIZAÇÃO: testes de integração ou outputs `curl`.
3. O que fazer: testar carrinho vazio, gateway inválido, Stripe sem configuração e Stripe configurado com chave de teste.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"stripe"}'

curl -i -X POST http://localhost:3000/api/orders/checkout \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"crypto"}'
```

5. Explicação do código: os comandos demonstram falhas controladas. Sem sessão, o resultado esperado é `401`; com gateway inválido, `400`; com Stripe sem chave, `503`; com chave de teste, a resposta deve trazer uma URL de checkout Stripe, não uma URL inventada pela app.
6. Como validar este passo: registar `401`, `400`, `409`, `503` e um sucesso `201` com `payment.checkoutUrl`.
7. Erros comuns ou cenário negativo: esconder erro de gateway como sucesso confunde aluno e utilizador.

## Expected results
- `POST /api/orders/checkout` com carrinho válido devolve `201`.
- Carrinho vazio devolve `400`.
- Stock insuficiente devolve `409`.
- Gateway inválido devolve `400`.
- Stripe sem chave devolve `503`.
- Stripe com chave de teste devolve `payment.checkoutUrl` da Stripe e `payment.providerReference` com o ID da sessão.
- PayPal/MBWay devolvem `pending_manual_confirmation` e `checkoutUrl: null`.

## Critérios de aceite
- Encomenda nasce do carrinho autenticado.
- Backend calcula total.
- `orderStatus` e `payment.status` ficam separados.
- PayPal/MBWay ficam pendentes, não pagos.
- Stripe usa SDK oficial e cria sessão de checkout real em modo de teste/controlado.
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada conforme prioridade (`P0`).

## Validação final
- Smoke: carrinho válido cria encomenda.
- Segurança: nenhum endpoint aceita `userId`.
- Comércio: total é calculado no backend.
- Integração: `BK-MF3-04`, `BK-MF3-07` e `BK-MF3-08` conseguem usar `Order`.

## Evidence para PR/defesa
- Output de checkout válido.
- Output de carrinho vazio.
- Output de gateway inválido.
- Output de Stripe sem configuração.

## Handoff
O próximo BK deve listar encomendas do próprio utilizador a partir do modelo `Order`, sem expor dados de outros clientes.

## Changelog
- `2026-06-13`: guia reescrito para encomendas e pagamentos com separação segura de responsabilidades.
