# BK-MF3-02 - Adicionar/remover produtos do carrinho de compras

## Header
- `doc_id`: `GUIA-BK-MF3-02`
- `bk_id`: `BK-MF3-02`
- `macro`: `MF3`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-07`
- `rf_rnf`: `RF26`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF3-03`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-02-adicionar-remover-produtos-do-carrinho-de-compras.md`
- `last_updated`: `2026-06-13`

## Contexto do BK
- Entrega alvo: implementar `RF26`, permitindo ao cliente adicionar, consultar, atualizar e remover produtos do carrinho.
- CANONICO: o produto vem de `RF07` e inclui preço e stock.
- DERIVADO: o carrinho fica associado ao utilizador autenticado e guarda uma cópia do preço em cêntimos no momento em que o produto entra no carrinho.
- Este BK inicia o fluxo comercial da MF3 e prepara `BK-MF3-03`.

## Objetivo
Neste BK vais implementar o carrinho de compras autenticado da Orélle.

## Importância
O carrinho é a ponte entre catálogo e checkout. Sem ele, a encomenda não consegue calcular total, validar stock nem separar compra de pagamento.

## Scope-in
- Criar modelo `Cart`.
- Criar validação para adicionar e atualizar item.
- Criar endpoints `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId` e `DELETE /api/cart/items/:productId`.
- Validar stock e produto ativo no backend.
- Criar página React com estados `loading`, `error`, `empty` e `success`.

## Scope-out
- Não criar encomenda.
- Não criar pagamento.
- Não alterar stock neste BK.
- Não aceitar preço enviado pelo frontend.
- Não guardar token no browser.

## Estado antes
`CRITICO`: o guia tinha passos genéricos e código de checkout que não implementava carrinho.

## Estado depois
`OK`: o guia define modelo, validação, service, controller, routes, UI, negativos e handoff para encomenda.

## Pré-requisitos
- `BK-MF0-02`: sessão com cookie `HttpOnly` e `requireAuth`.
- `BK-MF0-07`: modelo `Product` com `priceCents` e `stock`.
- `BK-MF1-01` ou `BK-MF1-02`: página de catálogo/detalhe com ação para adicionar produto.

## Glossário
- Carrinho: lista temporária de produtos que o cliente pretende comprar.
- Item do carrinho: produto, quantidade e preço capturado.
- `priceSnapshotCents`: preço guardado no carrinho no momento de adição.
- Ownership: regra que obriga o backend a usar `req.user.id`, não `userId` enviado pelo cliente.
- Stock: quantidade disponível para venda.

## Conceitos teóricos
Carrinho não é encomenda. O carrinho é editável e pode ficar vazio; a encomenda é um registo fechado criado no checkout.

O backend calcula preços e valida stock porque o frontend pode ser alterado pelo utilizador. Se o browser enviasse `priceCents`, alguém podia comprar produtos por valores falsos.

O `priceSnapshotCents` existe para o cliente perceber o total atual do carrinho. No checkout, o backend volta a ler os produtos e confirma preço e stock antes de criar encomenda.

`credentials: "include"` envia o cookie de sessão para a API. A app não deve guardar tokens no `localStorage`, porque cookies `HttpOnly` reduzem exposição a XSS.

## Arquitetura do BK
- `cart.model.js`: guarda carrinho por utilizador.
- `cart.validator.js`: valida `productId` e `quantity`.
- `cart.service.js`: concentra regras de stock, preço e ownership.
- `cart.controller.js`: traduz HTTP para service.
- `cart.routes.js`: protege endpoints com `requireAuth`.
- `CartPage.jsx`: permite consultar, atualizar e remover itens.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/cart.model.js`
- CRIAR: `server/src/validators/cart.validator.js`
- CRIAR: `server/src/services/cart.service.js`
- CRIAR: `server/src/controllers/cart.controller.js`
- CRIAR: `server/src/routes/cart.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/CartPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/product.model.js`
- REVER: `client/src/services/apiClient.js`

## Bloco pedagógico
### Objetivo
Construir um carrinho por cliente, com dados controlados no backend.

### Pré-requisitos
- Saber obter o utilizador autenticado em `req.user.id`.
- Saber consultar `Product` por `_id`.
- Saber fazer chamadas frontend com `credentials: "include"`.

### Erros comuns
- Aceitar `userId` ou preço vindo do frontend.
- Reduzir stock ao adicionar ao carrinho.
- Criar carrinho partilhado entre utilizadores.
- Devolver campos internos do produto sem necessidade.

### Check de compreensao
- [ ] Sei explicar a diferença entre carrinho e encomenda.
- [ ] Sei justificar porque o preço vem do backend.
- [ ] Sei testar que um cliente não vê o carrinho de outro.

### Tempo estimado
`P0`: 90-120 minutos, incluindo negativos e UI.

## Bloco operacional
### Entrada
- Sessão autenticada.
- `productId` e `quantity`.
- Produto existente com stock suficiente.

### Passos
1. Confirmar contrato funcional.
2. Criar modelo `Cart`.
3. Criar validator.
4. Criar service.
5. Criar controller e routes.
6. Registar routes.
7. Criar página React.
8. Executar cenários negativos obrigatórios (mínimo 3).

### Cenarios negativos recomendados
- Pedido sem sessão devolve `401`.
- Produto inexistente devolve `404`.
- Quantidade maior que stock devolve `409`.
- Quantidade inválida devolve `400`.

### Validacao
- [ ] Smoke: cliente adiciona produto válido e vê total atualizado.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Técnico: frontend não envia preço nem `userId`.
- [ ] Segurança: backend usa `req.user.id`.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF3-03` deve criar encomenda a partir do carrinho autenticado e voltar a validar preço e stock antes de iniciar pagamento.

## Passos lineares

### Passo 1 - Confirmar contrato do carrinho

1. Explicação simples do objetivo: garantir que o carrinho pertence ao cliente autenticado e não altera stock.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: `RF26`, `RF27`, `BK-MF3-02` e `BK-MF3-03`.
3. O que fazer: confirma que `RF26` termina no carrinho e que pagamento fica para `RF27`.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: não há código porque o passo define limites. Separar carrinho de pagamento evita criar encomendas antes de o cliente confirmar checkout.
6. Como validar este passo: a lista de endpoints deste BK não deve conter `/orders` nem `/payments`.
7. Erros comuns ou cenário negativo: remover stock ao adicionar ao carrinho bloqueia produtos sem compra confirmada.

### Passo 2 - Criar modelo Cart

1. Explicação simples do objetivo: guardar um carrinho por utilizador.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/cart.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria schema com `userId`, itens e timestamps.
4. Código completo, correto e integrado.

```js
// server/src/models/cart.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Define um item guardado no carrinho de um cliente.
 * O preço e o nome ficam como snapshot para a UI, mas o checkout volta a validar o produto.
 */
const cartItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, min: 1, max: 99 },
        priceSnapshotCents: { type: Number, required: true, min: 0 },
        productNameSnapshot: { type: String, required: true },
    },
    { _id: false },
);

/**
 * Guarda o carrinho ativo de um utilizador autenticado.
 * O índice único em userId impede a criação de vários carrinhos ativos para a mesma conta.
 */
const cartSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
        items: { type: [cartItemSchema], default: [] },
    },
    { timestamps: true },
);

/**
 * Modelo MongoDB usado para consultar e persistir carrinhos.
 */
export const Cart = model("Cart", cartSchema);
```

5. Explicação do código: `userId` é único para existir apenas um carrinho ativo por cliente. Cada item guarda o produto e quantidade. Os campos `priceSnapshotCents` e `productNameSnapshot` ajudam a apresentar o carrinho sem confiar no frontend.
6. Como validar este passo: criar dois carrinhos com o mesmo `userId` deve falhar por índice único.
7. Erros comuns ou cenário negativo: guardar só uma lista de IDs sem quantidade impede checkout correto.

### Passo 3 - Criar validator do carrinho

1. Explicação simples do objetivo: validar entrada antes do service.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/cart.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: valida `productId` e `quantity`.
4. Código completo, correto e integrado.

```js
// server/src/validators/cart.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o payload usado para adicionar um produto ao carrinho.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ productId: string, quantity: number }} Produto e quantidade normalizados.
 * @throws {AppError} Quando o produto ou a quantidade não são válidos.
 */
export function validateCartItemPayload(body) {
    const productId = String(body?.productId || "").trim();
    const quantity = Number(body?.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(400, "Produto inválido");
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new AppError(400, "Quantidade deve ser um número inteiro entre 1 e 99");
    }

    return { productId, quantity };
}

/**
 * Valida o payload usado para alterar a quantidade de um item existente.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ quantity: number }} Quantidade validada.
 * @throws {AppError} Quando a quantidade não é um inteiro entre 1 e 99.
 */
export function validateCartQuantityPayload(body) {
    const quantity = Number(body?.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new AppError(400, "Quantidade deve ser um número inteiro entre 1 e 99");
    }

    return { quantity };
}

/**
 * Valida o productId recebido nos params das routes PATCH e DELETE.
 * @param {unknown} params - Parâmetros da route Express.
 * @returns {{ productId: string }} ID do produto validado.
 * @throws {AppError} Quando o ID não tem formato MongoDB válido.
 */
export function validateCartProductParam(params) {
    const productId = String(params?.productId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(400, "Produto inválido");
    }

    return { productId };
}
```

5. Explicação do código: o validator impede IDs inválidos e quantidades fora do limite antes de tocar na base de dados. `validateCartProductParam` existe porque `PATCH` e `DELETE` recebem `productId` na URL, não no body. O preço não entra no payload porque será lido do produto.
6. Como validar este passo: enviar `quantity: 0`, `quantity: 100`, `productId: "abc"` no body ou `/api/cart/items/abc` na URL deve devolver `400`.
7. Erros comuns ou cenário negativo: validar só o body deixa params inválidos dependentes de erro interno do Mongoose.

### Passo 4 - Criar service do carrinho

1. Explicação simples do objetivo: concentrar regras de negócio do carrinho.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/cart.service.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: implementar listagem, adição, atualização e remoção.
4. Código completo, correto e integrado.

```js
// server/src/services/cart.service.js
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Converte um documento Cart num DTO seguro para a UI.
 * @param {{ _id: object, items: Array<object>, updatedAt: Date }} cart - Documento de carrinho.
 * @returns {{ id: string, items: Array<object>, totalItems: number, totalCents: number, updatedAt: Date }}
 */
function serializeCart(cart) {
    const items = cart.items.map((item) => ({
        productId: item.productId.toString(),
        name: item.productNameSnapshot,
        quantity: item.quantity,
        unitPriceCents: item.priceSnapshotCents,
        lineTotalCents: item.quantity * item.priceSnapshotCents,
    }));

    return {
        id: cart._id.toString(),
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalCents: items.reduce((sum, item) => sum + item.lineTotalCents, 0),
        updatedAt: cart.updatedAt,
    };
}

/**
 * Obtém o carrinho ativo do cliente ou cria um carrinho vazio.
 * @param {string} userId - ID do utilizador autenticado.
 * @returns {Promise<object>} Documento de carrinho.
 */
async function getOrCreateCart(userId) {
    return Cart.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId, items: [] } },
        { new: true, upsert: true },
    );
}

/**
 * Procura um produto que pode ser comprado pelo cliente.
 * @param {string} productId - ID do produto a consultar.
 * @returns {Promise<object>} Produto ativo com preço e stock.
 * @throws {AppError} Quando o produto não existe ou está inativo.
 */
async function findPurchasableProduct(productId) {
    const product = await Product.findById(productId).select("name priceCents stock isActive");

    if (!product || product.isActive === false) {
        throw new AppError(404, "Produto não encontrado");
    }

    return product;
}

/**
 * Devolve o carrinho do cliente autenticado.
 * @param {string} userId - ID vindo da sessão.
 * @returns {Promise<object>} DTO do carrinho.
 */
export async function getMyCart(userId) {
    const cart = await getOrCreateCart(userId);
    return serializeCart(cart);
}

/**
 * Adiciona um produto ao carrinho, somando quantidades se o item já existir.
 * @param {string} userId - ID vindo da sessão.
 * @param {{ productId: string, quantity: number }} payload - Produto e quantidade pretendidos.
 * @returns {Promise<object>} DTO atualizado do carrinho.
 * @throws {AppError} Quando o produto não existe ou não há stock suficiente.
 */
export async function addItemToCart(userId, { productId, quantity }) {
    const product = await findPurchasableProduct(productId);

    if (product.stock < quantity) {
        throw new AppError(409, "Stock insuficiente para a quantidade pedida");
    }

    const cart = await getOrCreateCart(userId);
    const existing = cart.items.find((item) => item.productId.toString() === productId);

    if (existing) {
        const nextQuantity = existing.quantity + quantity;
        if (product.stock < nextQuantity) {
            throw new AppError(409, "Stock insuficiente para atualizar o carrinho");
        }
        // O preço é sempre atualizado a partir da base de dados, nunca do browser.
        existing.quantity = nextQuantity;
        existing.priceSnapshotCents = product.priceCents;
        existing.productNameSnapshot = product.name;
    } else {
        cart.items.push({
            productId: product._id,
            quantity,
            priceSnapshotCents: product.priceCents,
            productNameSnapshot: product.name,
        });
    }

    await cart.save();
    return serializeCart(cart);
}

/**
 * Atualiza a quantidade de um produto já presente no carrinho.
 * @param {string} userId - ID vindo da sessão.
 * @param {string} productId - ID do produto a alterar.
 * @param {{ quantity: number }} payload - Nova quantidade.
 * @returns {Promise<object>} DTO atualizado do carrinho.
 * @throws {AppError} Quando o item não existe no carrinho ou não há stock suficiente.
 */
export async function updateCartItemQuantity(userId, productId, { quantity }) {
    const product = await findPurchasableProduct(productId);

    if (product.stock < quantity) {
        throw new AppError(409, "Stock insuficiente para atualizar o carrinho");
    }

    const cart = await getOrCreateCart(userId);
    const item = cart.items.find((cartItem) => cartItem.productId.toString() === productId);

    if (!item) {
        throw new AppError(404, "Produto não está no carrinho");
    }

    item.quantity = quantity;
    item.priceSnapshotCents = product.priceCents;
    item.productNameSnapshot = product.name;

    await cart.save();
    return serializeCart(cart);
}

/**
 * Remove um produto do carrinho do cliente.
 * @param {string} userId - ID vindo da sessão.
 * @param {string} productId - ID do produto a remover.
 * @returns {Promise<object>} DTO atualizado do carrinho.
 */
export async function removeCartItem(userId, productId) {
    const cart = await getOrCreateCart(userId);
    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    await cart.save();
    return serializeCart(cart);
}

/**
 * Esvazia o carrinho do cliente após o checkout criar a encomenda.
 * @param {string} userId - ID vindo da sessão.
 * @returns {Promise<object>} DTO do carrinho vazio.
 */
export async function clearCart(userId) {
    const cart = await getOrCreateCart(userId);
    cart.items = [];
    await cart.save();
    return serializeCart(cart);
}
```

5. Explicação do código: todas as operações recebem `userId` da sessão. O service lê produto, valida stock, calcula total e devolve DTO sem campos internos. `clearCart` prepara `BK-MF3-03`, que vai esvaziar carrinho após criar encomenda confirmada.
6. Como validar este passo: adicionar o mesmo produto duas vezes deve somar quantidades; tentar ultrapassar stock deve devolver `409`.
7. Erros comuns ou cenário negativo: usar preço enviado pelo frontend permite manipulação comercial.

### Passo 5 - Criar controller e routes

1. Explicação simples do objetivo: expor o carrinho por HTTP.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/cart.controller.js`
    - CRIAR: `server/src/routes/cart.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: criar controllers e proteger routes.
4. Código completo, correto e integrado.

```js
// server/src/controllers/cart.controller.js
import {
    addItemToCart,
    getMyCart,
    removeCartItem,
    updateCartItemQuantity,
} from "../services/cart.service.js";
import {
    validateCartItemPayload,
    validateCartProductParam,
    validateCartQuantityPayload,
} from "../validators/cart.validator.js";

/**
 * Handler HTTP que devolve o carrinho do utilizador autenticado.
 */
export async function getMyCartController(req, res, next) {
    try {
        const cart = await getMyCart(req.user.id);
        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}

/**
 * Handler HTTP que adiciona um item ao carrinho do utilizador autenticado.
 */
export async function addCartItemController(req, res, next) {
    try {
        const payload = validateCartItemPayload(req.body);
        const cart = await addItemToCart(req.user.id, payload);
        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}

/**
 * Handler HTTP que atualiza a quantidade de um item no carrinho.
 */
export async function updateCartItemController(req, res, next) {
    try {
        const { productId } = validateCartProductParam(req.params);
        const payload = validateCartQuantityPayload(req.body);
        const cart = await updateCartItemQuantity(req.user.id, productId, payload);
        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}

/**
 * Handler HTTP que remove um item do carrinho.
 */
export async function removeCartItemController(req, res, next) {
    try {
        const { productId } = validateCartProductParam(req.params);
        const cart = await removeCartItem(req.user.id, productId);
        return res.status(200).json({ cart });
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/cart.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    addCartItemController,
    getMyCartController,
    removeCartItemController,
    updateCartItemController,
} from "../controllers/cart.controller.js";

/**
 * Rotas autenticadas de gestão do carrinho pessoal.
 */
export const cartRoutes = Router();

cartRoutes.get("/cart", requireAuth, getMyCartController);
cartRoutes.post("/cart/items", requireAuth, addCartItemController);
cartRoutes.patch("/cart/items/:productId", requireAuth, updateCartItemController);
cartRoutes.delete("/cart/items/:productId", requireAuth, removeCartItemController);
```

5. Explicação do código: o controller nunca lê `userId` do body. As routes usam `requireAuth` para garantir sessão antes do service. `PATCH` e `DELETE` validam `productId` antes de chamar o service, por isso IDs mal formados devolvem `400` de forma previsível. Cada operação devolve o carrinho completo para a UI atualizar sem pedido extra.
6. Como validar este passo: chamar `GET /api/cart` sem sessão deve devolver `401`; chamar `PATCH /api/cart/items/abc` deve devolver `400`; chamar `PATCH` com ObjectId válido que não está no carrinho deve devolver `404`.
7. Erros comuns ou cenário negativo: criar endpoint `/cart/:userId` expõe carrinhos de terceiros; esquecer validator de params cria erros técnicos difíceis de explicar ao utilizador.

### Passo 6 - Registar routes na app

1. Explicação simples do objetivo: ligar as routes ao Express.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: zona de imports e zona onde a app monta routes.
3. O que fazer: importar e montar `cartRoutes`.
4. Código completo, correto e integrado.

```js
import { cartRoutes } from "./routes/cart.routes.js";

app.use("/api", cartRoutes);
```

5. Explicação do código: com o prefixo `/api`, os endpoints finais ficam `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:productId` e `DELETE /api/cart/items/:productId`.
6. Como validar este passo: arrancar backend e confirmar que `/api/cart` responde com `401` sem sessão.
7. Erros comuns ou cenário negativo: montar route sem prefixo cria caminhos diferentes dos usados pelo frontend.

### Passo 7 - Criar página React do carrinho

1. Explicação simples do objetivo: permitir ao cliente ver e gerir o carrinho.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/CartPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo e registo de rota/página no `App`.
3. O que fazer: criar página com estados e chamadas à API.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/CartPage.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata valores guardados em cêntimos para euro em pt-PT.
 * @param {number} cents - Valor em cêntimos.
 * @returns {string} Valor formatado como moeda.
 */
function formatPrice(cents) {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Página que permite consultar, atualizar e remover itens do carrinho.
 * @returns {JSX.Element} Interface do carrinho autenticado.
 */
export function CartPage() {
    const [cart, setCart] = useState(null);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    /**
     * Carrega o carrinho do utilizador autenticado.
     * @returns {Promise<void>}
     */
    async function loadCart() {
        setStatus("loading");
        setError("");
        try {
            // A sessão via cookie identifica o cliente; a UI não envia userId.
            const data = await apiRequest("/cart", { credentials: "include" });
            setCart(data.cart);
            setStatus("success");
        } catch (err) {
            setError(err.message || "Não foi possível carregar o carrinho.");
            setStatus("error");
        }
    }

    /**
     * Atualiza a quantidade de um produto no carrinho.
     * @param {string} productId - Produto a atualizar.
     * @param {number} quantity - Nova quantidade pretendida.
     * @returns {Promise<void>}
     */
    async function updateQuantity(productId, quantity) {
        setError("");
        try {
            const data = await apiRequest(`/cart/items/${productId}`, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ quantity }),
            });
            setCart(data.cart);
        } catch (err) {
            setError(err.message || "Não foi possível atualizar a quantidade.");
        }
    }

    /**
     * Remove um produto do carrinho.
     * @param {string} productId - Produto a remover.
     * @returns {Promise<void>}
     */
    async function removeItem(productId) {
        setError("");
        try {
            const data = await apiRequest(`/cart/items/${productId}`, {
                method: "DELETE",
                credentials: "include",
            });
            setCart(data.cart);
        } catch (err) {
            setError(err.message || "Não foi possível remover o produto.");
        }
    }

    useEffect(() => {
        loadCart();
    }, []);

    if (status === "loading") return <p>A carregar carrinho...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    const items = cart?.items || [];

    return (
        <main>
            <h1>Carrinho</h1>
            {error ? <p role="alert">{error}</p> : null}
            {items.length === 0 ? (
                <p>O carrinho está vazio.</p>
            ) : (
                <section>
                    {items.map((item) => (
                        <article key={item.productId}>
                            <h2>{item.name}</h2>
                            <p>Preço unitário: {formatPrice(item.unitPriceCents)}</p>
                            <label>
                                Quantidade
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={item.quantity}
                                    onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                                />
                            </label>
                            <p>Total da linha: {formatPrice(item.lineTotalCents)}</p>
                            <button type="button" onClick={() => removeItem(item.productId)}>
                                Remover
                            </button>
                        </article>
                    ))}
                    <strong>Total: {formatPrice(cart.totalCents)}</strong>
                </section>
            )}
        </main>
    );
}
```

5. Explicação do código: a página carrega o carrinho com sessão, mostra estado vazio e permite atualizar/remover. A UI não envia preço nem `userId`; envia apenas quantidade. `credentials: "include"` mantém a sessão via cookie.
6. Como validar este passo: adicionar produto noutro ecrã, abrir carrinho e confirmar total. Remover último item deve mostrar estado vazio.
7. Erros comuns ou cenário negativo: guardar token no `localStorage` para chamar carrinho quebra a política de sessão segura.

### Passo 8 - Validar negativos e evidence

1. Explicação simples do objetivo: provar que o carrinho é seguro e funcional.
2. Ficheiros envolvidos.
    - REVER: `server/src/routes/cart.routes.js`
    - REVER: `server/src/services/cart.service.js`
    - LOCALIZAÇÃO: testes de integração da API ou registos de execução.
3. O que fazer: executar smoke e negativos.
4. Código completo, correto e integrado.

```bash
curl -i http://localhost:3000/api/cart
curl -i -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"invalid","quantity":1}'
curl -i -X PATCH http://localhost:3000/api/cart/items/invalid \
  -H "Content-Type: application/json" \
  -d '{"quantity":2}'
```

5. Explicação do código: o primeiro comando deve falhar sem sessão; o segundo valida `productId` no body; o terceiro valida `productId` na URL. Estes testes provam autenticação e validação mínima.
6. Como validar este passo: regista `401`, `400`, `404` e `409` nos negativos; regista também um caso válido com `200`.
7. Erros comuns ou cenário negativo: validar só no frontend deixa a API vulnerável a pedidos diretos.

## Expected results
- `GET /api/cart` autenticado devolve `200` com `{ cart }`.
- `POST /api/cart/items` válido devolve `200` e total atualizado.
- `PATCH /api/cart/items/:productId` com ID mal formado devolve `400`.
- Produto inexistente devolve `404`.
- Stock insuficiente devolve `409`.
- Sem sessão devolve `401`.

## Critérios de aceite
- O carrinho pertence ao utilizador autenticado.
- O backend calcula preço e total.
- O frontend não envia preço nem `userId`.
- A app não reduz stock antes de checkout.
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada conforme prioridade (`P0`).

## Validação final
- Smoke: adicionar, atualizar e remover produto.
- Segurança: `requireAuth` ativo em todas as routes.
- Integração: `BK-MF3-03` consegue importar `getMyCart` e `clearCart`.

## Evidence para PR/defesa
- Mostrar carrinho vazio.
- Mostrar produto adicionado com total.
- Mostrar erro de stock insuficiente.
- Anexar outputs dos endpoints `401`, `400`, `409` e sucesso `200`.

## Handoff
O próximo BK deve criar encomenda a partir deste carrinho e nunca confiar apenas nos totais guardados no carrinho.

## Changelog
- `2026-06-13`: guia reescrito para implementação completa de carrinho autenticado.
