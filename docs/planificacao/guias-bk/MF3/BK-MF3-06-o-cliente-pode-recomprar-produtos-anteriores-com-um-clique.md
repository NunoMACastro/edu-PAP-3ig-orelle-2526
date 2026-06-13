# BK-MF3-06 - O cliente pode recomprar produtos anteriores com um clique

## Header
- `doc_id`: `GUIA-BK-MF3-06`
- `bk_id`: `BK-MF3-06`
- `macro`: `MF3`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF3-04`
- `rf_rnf`: `RF30`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF3-07`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-06-o-cliente-pode-recomprar-produtos-anteriores-com-um-clique.md`
- `last_updated`: `2026-06-13`

## Contexto do BK
- Entrega alvo: implementar `RF30`, permitindo ao cliente recomprar produtos anteriores.
- CANONICO: recompra depende do histórico de compras (`RF28`).
- DERIVADO: recompra adiciona produtos disponíveis ao carrinho, sem criar encomenda automática.
- Este BK reforça o funil comercial sem contornar checkout.

## Objetivo
Neste BK vais criar uma ação de recompra a partir de uma encomenda anterior do próprio cliente.

## Importância
Recompra reduz fricção, mas deve respeitar stock, preço atual e decisão final do cliente no checkout.

## Scope-in
- Criar endpoint `POST /api/me/orders/:orderId/reorder`.
- Validar `orderId` recebido na URL.
- Validar ownership da encomenda.
- Validar disponibilidade atual dos produtos.
- Adicionar produtos disponíveis ao carrinho.
- Mostrar ação na página de histórico.

## Scope-out
- Não criar pagamento automático.
- Não criar encomenda automática.
- Não forçar produtos indisponíveis.
- Não aplicar preço antigo sem validação atual.

## Estado antes
`CRITICO`: o guia tinha código de checkout genérico e não tratava histórico, stock nem ownership.

## Estado depois
`OK`: recompra passa a ser uma ação segura que usa encomenda própria e carrinho.

## Pré-requisitos
- `BK-MF3-04`: histórico com `Order`.
- `BK-MF3-02`: `addItemToCart`.
- `BK-MF0-07`: `Product` com stock e preço.

## Glossário
- Recompra: voltar a colocar produtos de uma encomenda anterior no carrinho.
- Encomenda de origem: compra anterior usada como referência.
- Produto indisponível: produto inexistente, inativo ou sem stock suficiente.

## Conceitos teóricos
Recompra não deve saltar o checkout. O cliente precisa ver o carrinho atualizado e confirmar a nova compra, porque preços e stock podem ter mudado.

O backend confirma que a encomenda pertence ao utilizador da sessão. O frontend pode mostrar só botões do próprio histórico, mas a autorização real acontece no service.

Produtos indisponíveis devem ser comunicados. O fluxo pode adicionar os produtos válidos e devolver avisos sobre os restantes, sem inventar substitutos.

## Arquitetura do BK
- `reorder.service.js`: valida encomenda e adiciona itens ao carrinho.
- `reorder.validator.js`: valida `orderId` antes de chamar a base de dados.
- `reorder.controller.js`: expõe ação.
- `reorder.routes.js`: protege route.
- `PurchaseHistoryPage.jsx`: adiciona botão de recompra.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/services/reorder.service.js`
- CRIAR: `server/src/validators/reorder.validator.js`
- CRIAR: `server/src/controllers/reorder.controller.js`
- CRIAR: `server/src/routes/reorder.routes.js`
- EDITAR: `server/src/app.js`
- EDITAR: `client/src/pages/PurchaseHistoryPage.jsx`
- REVER: `server/src/models/order.model.js`
- REVER: `server/src/services/cart.service.js`

## Bloco pedagógico
### Objetivo
Permitir recompra sem quebrar stock, ownership ou checkout.

### Pré-requisitos
- Saber consultar encomenda por `userId`.
- Saber adicionar produtos ao carrinho.
- Saber mostrar feedback parcial ao cliente.

### Erros comuns
- Criar encomenda diretamente.
- Usar preço antigo como preço final.
- Ignorar produtos sem stock.
- Permitir recompra de encomenda de outro utilizador.

### Check de compreensao
- [ ] Sei explicar porque recompra volta ao carrinho.
- [ ] Sei testar encomenda de outro utilizador.
- [ ] Sei explicar o que acontece se um produto já não existir.

### Tempo estimado
`P1`: 75-90 minutos, incluindo negativos.

## Bloco operacional
### Entrada
- Sessão autenticada.
- `orderId` de encomenda anterior.

### Passos
1. Confirmar contrato.
2. Criar service.
3. Criar controller.
4. Criar route.
5. Registar route.
6. Atualizar UI.
7. Executar cenários negativos obrigatórios (mínimo 2).

### Cenarios negativos recomendados
- Encomenda inexistente ou de outro utilizador devolve `404`.
- Produto sem stock devolve aviso e não é adicionado.
- Pedido sem sessão devolve `401`.

### Validacao
- [ ] Smoke: recompra adiciona itens disponíveis ao carrinho.
- [ ] Negativos: mínimo `2` cenários com resultado controlado.
- [ ] Comércio: cliente ainda precisa confirmar checkout.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF3-07` pode contar recompras nas estatísticas comerciais usando encomendas criadas depois do checkout, não cliques de recompra.

## Passos lineares

### Passo 1 - Confirmar contrato da recompra

1. Explicação simples do objetivo: garantir que recompra usa histórico e volta ao carrinho.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: `RF30`, `RF28` e `RF26`.
3. O que fazer: confirmar dependências e limite do fluxo.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: este passo impede que recompra crie pagamento automático sem ação final do cliente.
6. Como validar este passo: o endpoint deve terminar com carrinho atualizado.
7. Erros comuns ou cenário negativo: criar encomenda nova diretamente duplica compras acidentais.

### Passo 2 - Criar service de recompra

1. Explicação simples do objetivo: adicionar produtos de encomenda anterior ao carrinho.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/reorder.service.js`
    - REVER: `server/src/models/order.model.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: validar encomenda, produto e stock.
4. Código completo, correto e integrado.

```js
// server/src/services/reorder.service.js
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { addItemToCart, getMyCart } from "./cart.service.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Recria no carrinho os produtos disponíveis de uma encomenda antiga do cliente.
 * @param {string} userId - ID vindo da sessão autenticada.
 * @param {string} orderId - ID da encomenda a recomprar.
 * @returns {Promise<{ cart: object, skipped: Array<{ productId: string, reason: string }> }>}
 * @throws {AppError} Quando a encomenda não pertence ao cliente ou não existe.
 */
export async function reorderFromOrder(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, userId }).select("items");

    if (!order) {
        throw new AppError(404, "Encomenda não encontrada");
    }

    const skipped = [];

    for (const item of order.items) {
        // A recompra usa o catálogo atual: preço e disponibilidade podem ter mudado.
        const product = await Product.findById(item.productId).select("name stock isActive");
        if (!product || product.isActive === false) {
            skipped.push({ productId: item.productId.toString(), reason: "Produto indisponível" });
            continue;
        }
        if (product.stock < item.quantity) {
            skipped.push({ productId: item.productId.toString(), reason: "Stock insuficiente" });
            continue;
        }

        await addItemToCart(userId, {
            productId: item.productId.toString(),
            quantity: item.quantity,
        });
    }

    const cart = await getMyCart(userId);
    return { cart, skipped };
}
```

5. Explicação do código: `Order.findOne({ _id, userId })` aplica ownership. Cada produto é revalidado no catálogo atual. O preço atual será usado por `addItemToCart`.
6. Como validar este passo: recompra com produto sem stock deve devolver esse item em `skipped`.
7. Erros comuns ou cenário negativo: usar o preço da encomenda antiga no carrinho esconde alterações atuais.

### Passo 3 - Criar validator e controller

1. Explicação simples do objetivo: validar o ID da encomenda e ligar route ao service.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/reorder.validator.js`
    - CRIAR: `server/src/controllers/reorder.controller.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: criar validator de params e chamar `reorderFromOrder`.
4. Código completo, correto e integrado.

```js
// server/src/validators/reorder.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o ID da encomenda recebido na route de recompra.
 * @param {unknown} params - Parâmetros Express.
 * @returns {{ orderId: string }} ID validado da encomenda.
 * @throws {AppError} Quando o ID não tem formato MongoDB válido.
 */
export function validateReorderParams(params) {
    const orderId = String(params?.orderId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new AppError(400, "Encomenda inválida");
    }

    return { orderId };
}
```

```js
// server/src/controllers/reorder.controller.js
import { reorderFromOrder } from "../services/reorder.service.js";
import { validateReorderParams } from "../validators/reorder.validator.js";

/**
 * Handler HTTP que adiciona ao carrinho os produtos disponíveis de uma encomenda anterior.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function reorderController(req, res, next) {
    try {
        const { orderId } = validateReorderParams(req.params);
        const result = await reorderFromOrder(req.user.id, orderId);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: `validateReorderParams` devolve `400` quando o ID não tem formato MongoDB válido. O controller usa `req.user.id` e o `orderId` validado. Não aceita lista de produtos enviada no body, porque a recompra nasce da encomenda guardada.
6. Como validar este passo: `/api/me/orders/abc/reorder` devolve `400`; uma encomenda válida do próprio utilizador devolve resposta com `cart` e `skipped`.
7. Erros comuns ou cenário negativo: aceitar produtos no body transforma recompra num carrinho alternativo inseguro; passar params diretamente ao Mongoose pode gerar erro técnico em vez de resposta clara.

### Passo 4 - Criar route

1. Explicação simples do objetivo: expor ação de recompra.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/routes/reorder.routes.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: proteger endpoint.
4. Código completo, correto e integrado.

```js
// server/src/routes/reorder.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { reorderController } from "../controllers/reorder.controller.js";

/**
 * Rotas autenticadas para recompra de encomendas pessoais.
 */
export const reorderRoutes = Router();

reorderRoutes.post("/me/orders/:orderId/reorder", requireAuth, reorderController);
```

5. Explicação do código: a route fica dentro de `/me` porque a ação só existe para compras do próprio cliente.
6. Como validar este passo: pedido sem sessão devolve `401`.
7. Erros comuns ou cenário negativo: criar endpoint administrativo de recompra sem necessidade aumenta risco.

### Passo 5 - Registar route

1. Explicação simples do objetivo: ligar recompra ao Express.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: imports e routes.
3. O que fazer: montar `reorderRoutes`.
4. Código completo, correto e integrado.

```js
import { reorderRoutes } from "./routes/reorder.routes.js";

app.use("/api", reorderRoutes);
```

5. Explicação do código: o endpoint final fica `POST /api/me/orders/:orderId/reorder`.
6. Como validar este passo: endpoint responde `401` sem sessão.
7. Erros comuns ou cenário negativo: montar antes do middleware de parsing JSON não afeta esta route, mas manter ordem consistente facilita manutenção.

### Passo 6 - Atualizar página de histórico

1. Explicação simples do objetivo: criar botão de recompra com feedback visível.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/pages/PurchaseHistoryPage.jsx`
    - LOCALIZAÇÃO: ficheiro completo atualizado a partir do `BK-MF3-04`.
3. O que fazer: chamar endpoint de recompra, mostrar avisos e bloquear clique duplicado enquanto o pedido está em curso.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/PurchaseHistoryPage.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Formata valores em cêntimos para moeda euro.
 * @param {number} cents - Valor em cêntimos.
 * @returns {string} Valor formatado em pt-PT.
 */
function euros(cents) {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/**
 * Página de histórico com ação de recompra para adicionar produtos ao carrinho.
 * @returns {JSX.Element} Interface de histórico e recompra.
 */
export function PurchaseHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState("loading");
    const [reorderingOrderId, setReorderingOrderId] = useState("");
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        /**
         * Carrega as encomendas do próprio cliente.
         * @returns {Promise<void>}
         */
        async function loadOrders() {
            try {
                const data = await apiRequest("/me/orders", { credentials: "include" });
                setOrders(data.orders);
                setStatus("success");
            } catch (err) {
                setError(err.message || "Não foi possível carregar o histórico.");
                setStatus("error");
            }
        }

        loadOrders();
    }, []);

    /**
     * Pede ao backend para recriar no carrinho os produtos disponíveis da encomenda.
     * @param {string} orderId - Encomenda antiga do cliente.
     * @returns {Promise<void>}
     */
    async function reorder(orderId) {
        setError("");
        setNotice("");
        setReorderingOrderId(orderId);

        try {
            // Esta ação não paga nem cria encomenda; apenas atualiza o carrinho.
            const data = await apiRequest(`/me/orders/${orderId}/reorder`, {
                method: "POST",
                credentials: "include",
            });
            const skippedCount = Array.isArray(data.skipped) ? data.skipped.length : 0;
            setNotice(
                skippedCount === 0
                    ? "Produtos adicionados ao carrinho."
                    : `Produtos disponíveis adicionados. ${skippedCount} produto(s) não foram adicionados.`,
            );
        } catch (err) {
            setError(err.message || "Não foi possível recomprar.");
        } finally {
            setReorderingOrderId("");
        }
    }

    if (status === "loading") return <p>A carregar histórico...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    return (
        <main>
            <h1>Histórico de compras</h1>
            {notice ? <p>{notice}</p> : null}
            {error ? <p role="alert">{error}</p> : null}
            {orders.length === 0 ? (
                <p>Ainda não existem compras.</p>
            ) : (
                orders.map((order) => (
                    <article key={order.id}>
                        <h2>{new Date(order.createdAt).toLocaleDateString("pt-PT")}</h2>
                        <p>Estado: {order.orderStatus}</p>
                        <p>Total: {euros(order.totalCents)}</p>
                        <ul>
                            {order.items.map((item) => (
                                <li key={item.productId}>
                                    {item.quantity} x {item.name} - {euros(item.lineTotalCents)}
                                </li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            onClick={() => reorder(order.id)}
                            disabled={reorderingOrderId === order.id}
                        >
                            {reorderingOrderId === order.id ? "A adicionar..." : "Recomprar"}
                        </button>
                    </article>
                ))
            )}
        </main>
    );
}
```

5. Explicação do código: o frontend mantém o histórico do `BK-MF3-04` e acrescenta a ação de recompra junto de cada encomenda. Envia apenas o ID da encomenda na URL; não envia produtos, quantidades, preços nem `userId`. `notice` comunica sucesso total ou parcial; `reorderingOrderId` evita cliques repetidos na mesma encomenda enquanto o pedido está em curso.
6. Como validar este passo: clicar em recomprar deve atualizar carrinho e mostrar aviso parcial se existir produto indisponível.
7. Erros comuns ou cenário negativo: o frontend não deve montar payload com produtos, quantidades e preços; sem `notice`, o utilizador não percebe se a recompra foi total ou parcial.

### Passo 7 - Validar negativos e evidence

1. Explicação simples do objetivo: provar que recompra é segura.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/reorder.service.js`
    - REVER: `server/src/routes/reorder.routes.js`
    - LOCALIZAÇÃO: testes ou outputs.
3. O que fazer: testar sem sessão, ID inválido, encomenda de outro utilizador e produto sem stock.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3000/api/me/orders/ORDER_ID/reorder
curl -i -X POST http://localhost:3000/api/me/orders/invalid/reorder
```

5. Explicação do código: sem sessão espera `401`; com ID mal formado espera `400`; com `ORDER_ID` de outro utilizador espera `404`.
6. Como validar este passo: registar sucesso `200`, `400`, `401`, `404` e caso com `skipped`.
7. Erros comuns ou cenário negativo: devolver `403` para encomenda de outro utilizador confirma que o ID existe; `404` minimiza exposição.

## Expected results
- Recompra válida devolve `200` com carrinho atualizado.
- `orderId` mal formado devolve `400`.
- Encomenda de outro utilizador devolve `404`.
- Sem sessão devolve `401`.
- Produto indisponível aparece em `skipped`.

## Critérios de aceite
- Recompra adiciona ao carrinho, não cria encomenda.
- Backend valida ownership e stock.
- Frontend não envia produtos nem preço.
- Cenários negativos concluídos: mínimo `2`.
- Evidência de testes por camada conforme prioridade (`P1`).

## Validação final
- Smoke: encomenda antiga adiciona itens disponíveis ao carrinho.
- Segurança: encomenda de outro utilizador não é acessível.
- Integração: checkout continua obrigatório.

## Evidence para PR/defesa
- Screenshot do botão de recompra.
- Screenshot do carrinho após recompra.
- Output `404` para encomenda de outro utilizador.

## Handoff
O próximo BK deve usar encomendas concluídas para estatísticas, não cliques de recompra.

## Changelog
- `2026-06-13`: guia reescrito para recompra segura via carrinho.
