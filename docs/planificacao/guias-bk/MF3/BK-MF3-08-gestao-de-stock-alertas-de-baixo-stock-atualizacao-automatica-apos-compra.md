# BK-MF3-08 - Gestão de stock (alertas de baixo stock, atualização automática após compra)

## Header
- `doc_id`: `GUIA-BK-MF3-08`
- `bk_id`: `BK-MF3-08`
- `macro`: `MF3`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF3-03`
- `rf_rnf`: `RF32`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF4-01`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-08-gestao-de-stock-alertas-de-baixo-stock-atualizacao-automatica-apos-compra.md`
- `last_updated`: `2026-06-13`

## Contexto do BK
- Entrega alvo: implementar `RF32`, gestão de stock com alertas e atualização automática após compra.
- CANONICO: alerta quando produto tem menos de 5 unidades.
- DERIVADO: a atualização automática acontece quando uma encomenda passa para pagamento confirmado ou confirmação manual equivalente.
- Este BK fecha a cadeia carrinho -> encomenda -> stock.

## Objetivo
Neste BK vais criar gestão administrativa de stock e uma função segura para reduzir stock após compra confirmada.

## Importância
Stock incorreto gera vendas impossíveis e má experiência do cliente. A atualização deve ser centralizada no backend.

## Scope-in
- Criar service de stock.
- Criar endpoint admin `GET /api/admin/stock/alerts`.
- Criar endpoint admin `PATCH /api/admin/products/:productId/stock`.
- Criar função `applyOrderStockUpdate(orderId)`.
- Criar página React de alertas e ajuste de stock.

## Scope-out
- Não criar fornecedores.
- Não criar armazéns múltiplos.
- Não reduzir stock no carrinho.
- Não implementar notificações automáticas externas.

## Estado antes
`CRITICO`: o guia tinha código de checkout genérico e não implementava stock.

## Estado depois
`OK`: stock tem service, endpoints admin, atualização pós-compra e negativos.

## Pré-requisitos
- `BK-MF0-07`: `Product` com `stock`.
- `BK-MF3-03`: `Order` com `stockReserved`.
- `BK-MF0-05`: role `administrador`.

## Glossário
- Baixo stock: produto com menos de 5 unidades.
- Atualização automática: redução de stock feita pelo backend após compra confirmada.
- `stockReserved`: marca que impede reduzir o mesmo stock duas vezes.
- Operação atómica: atualização que valida condição e altera valor numa só operação.

## Conceitos teóricos
Stock deve ser validado e atualizado no backend. O frontend pode mostrar alertas, mas não decide se uma venda é possível.

Reduzir stock duas vezes é um erro crítico. O campo `stockReserved` na encomenda impede duplicação quando o mesmo evento é processado mais de uma vez.

A operação de redução deve confirmar que há stock suficiente. Se outro cliente comprou primeiro, a atualização falha com erro controlado.

## Arquitetura do BK
- `stock.service.js`: alertas, ajuste manual e redução pós-compra.
- `stock.validator.js`: valida params e payload do ajuste manual.
- `stock.controller.js`: endpoints admin.
- `stock.routes.js`: routes protegidas.
- `StockAdminPage.jsx`: UI administrativa.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/services/stock.service.js`
- CRIAR: `server/src/validators/stock.validator.js`
- CRIAR: `server/src/controllers/stock.controller.js`
- CRIAR: `server/src/routes/stock.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/StockAdminPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/product.model.js`
- REVER: `server/src/models/order.model.js`

## Bloco pedagógico
### Objetivo
Controlar stock com alertas e atualização segura após compra.

### Pré-requisitos
- Saber atualizar documentos MongoDB.
- Saber proteger routes administrativas.
- Saber distinguir carrinho de compra confirmada.

### Erros comuns
- Reduzir stock ao adicionar ao carrinho.
- Permitir stock negativo.
- Reduzir duas vezes a mesma encomenda.
- Permitir cliente alterar stock.

### Check de compreensao
- [ ] Sei explicar quando o stock é reduzido.
- [ ] Sei justificar `stockReserved`.
- [ ] Sei testar produto com stock insuficiente.

### Tempo estimado
`P0`: 100-120 minutos.

## Bloco operacional
### Entrada
- Admin autenticado para gestão manual.
- Encomenda confirmada para atualização automática.
- Produto com stock atual.

### Passos
1. Confirmar contrato.
2. Criar service de alertas.
3. Criar ajuste manual.
4. Criar atualização automática por encomenda.
5. Criar controller.
6. Criar routes.
7. Criar página React.
8. Executar cenários negativos obrigatórios (mínimo 3).

### Cenarios negativos recomendados
- Cliente tenta alterar stock e recebe `403`.
- Stock negativo devolve `400`.
- Atualização duplicada de encomenda não reduz stock duas vezes.
- Stock insuficiente devolve `409`.

### Validacao
- [ ] Smoke: admin vê produtos com baixo stock.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Comércio: stock só reduz após compra confirmada.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF4-01` pode gerir utilizadores sem tocar no módulo de stock. `BK-MF4-04` pode usar alertas para notificações futuras.

## Passos lineares

### Passo 1 - Confirmar contrato de stock

1. Explicação simples do objetivo: separar stock de carrinho e checkout.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: `RF32`, `RF26`, `RF27`.
3. O que fazer: confirmar que stock é gestão admin e atualização pós-compra.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: sem código porque se define a fronteira funcional. Carrinho não altera stock.
6. Como validar este passo: procurar no BK-MF3-02 e confirmar que não há redução de stock.
7. Erros comuns ou cenário negativo: reduzir stock no carrinho bloqueia produtos sem venda confirmada.

### Passo 2 - Criar service de alertas

1. Explicação simples do objetivo: listar produtos com baixo stock.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/stock.service.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: início do ficheiro.
3. O que fazer: criar função de alertas.
4. Código completo, correto e integrado.

```js
// server/src/services/stock.service.js
import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { AppError } from "../middlewares/error.middleware.js";

const LOW_STOCK_THRESHOLD = 5;
const STOCK_ELIGIBLE_PAYMENT_STATUS = "paid";

/**
 * Lista produtos com stock abaixo do limite definido por RF32.
 * @returns {Promise<Array<{ productId: string, name: string, stock: number, priceCents: number, threshold: number }>>}
 */
export async function listLowStockProducts() {
    const products = await Product.find({ stock: { $lt: LOW_STOCK_THRESHOLD } })
        .select("name stock priceCents")
        .sort({ stock: 1, name: 1 });

    return products.map((product) => ({
        productId: product._id.toString(),
        name: product.name,
        stock: product.stock,
        priceCents: product.priceCents,
        threshold: LOW_STOCK_THRESHOLD,
    }));
}
```

5. Explicação do código: a função devolve apenas dados necessários para gestão de stock. O limite `<5` vem dos critérios de aceitação de `RF32`.
6. Como validar este passo: produto com stock `4` aparece; stock `5` não aparece.
7. Erros comuns ou cenário negativo: usar `<=5` altera regra definida.

### Passo 3 - Criar ajuste manual de stock

1. Explicação simples do objetivo: permitir ao admin corrigir stock.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/services/stock.service.js`
    - LOCALIZAÇÃO: após `listLowStockProducts`.
3. O que fazer: criar `setProductStock`.
4. Código completo, correto e integrado.

```js
/**
 * Define manualmente o stock de um produto.
 * @param {string} productId - ID do produto a atualizar.
 * @param {number} stock - Novo stock inteiro e não negativo.
 * @returns {Promise<{ productId: string, name: string, stock: number, priceCents: number }>}
 * @throws {AppError} Quando o stock é inválido ou o produto não existe.
 */
export async function setProductStock(productId, stock) {
    if (!Number.isInteger(stock) || stock < 0) {
        throw new AppError(400, "Stock deve ser um número inteiro não negativo");
    }

    const product = await Product.findByIdAndUpdate(
        productId,
        { $set: { stock } },
        { new: true, runValidators: true },
    ).select("name stock priceCents");

    if (!product) {
        throw new AppError(404, "Produto não encontrado");
    }

    return {
        productId: product._id.toString(),
        name: product.name,
        stock: product.stock,
        priceCents: product.priceCents,
    };
}
```

5. Explicação do código: o service valida stock antes de atualizar. `runValidators` reforça regras do schema.
6. Como validar este passo: stock `-1` devolve `400`; produto inexistente devolve `404`.
7. Erros comuns ou cenário negativo: permitir decimal em stock cria inventário impossível.

### Passo 4 - Criar atualização automática após compra

1. Explicação simples do objetivo: reduzir stock uma vez por encomenda confirmada.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/services/stock.service.js`
    - LOCALIZAÇÃO: fim do ficheiro.
3. O que fazer: criar `applyOrderStockUpdate`.
4. Código completo, correto e integrado.

```js
/**
 * Reduz stock dos produtos de uma encomenda paga, uma única vez.
 * @param {string} orderId - ID da encomenda paga.
 * @returns {Promise<{ updated: boolean, reason?: string }>} Resultado da atualização.
 * @throws {AppError} Quando a encomenda não existe, não está paga ou não há stock suficiente.
 */
export async function applyOrderStockUpdate(orderId) {
    const session = await mongoose.startSession();

    try {
        let result = { updated: false };

        await session.withTransaction(async () => {
            const order = await Order.findById(orderId).session(session);

            if (!order) {
                throw new AppError(404, "Encomenda não encontrada");
            }

            if (order.stockReserved) {
                result = { updated: false, reason: "Stock já atualizado para esta encomenda" };
                return;
            }

            if (order.payment?.status !== STOCK_ELIGIBLE_PAYMENT_STATUS) {
                throw new AppError(409, "Stock só pode ser atualizado depois de pagamento confirmado");
            }

            // Agrupar evita reduzir o mesmo produto em linhas separadas de forma inconsistente.
            const quantitiesByProduct = new Map();
            for (const item of order.items) {
                const productId = item.productId.toString();
                const current = quantitiesByProduct.get(productId) || {
                    productId: item.productId,
                    name: item.name,
                    quantity: 0,
                };
                current.quantity += item.quantity;
                quantitiesByProduct.set(productId, current);
            }

            const groupedItems = Array.from(quantitiesByProduct.values());
            const products = await Product.find({
                _id: { $in: groupedItems.map((item) => item.productId) },
            })
                .select("name stock")
                .session(session);
            const productsById = new Map(products.map((product) => [product._id.toString(), product]));

            // Preflight: se algum produto falhar, nenhum stock é reduzido.
            for (const item of groupedItems) {
                const product = productsById.get(item.productId.toString());
                if (!product || product.stock < item.quantity) {
                    throw new AppError(409, `Stock insuficiente para ${item.name}`);
                }
            }

            for (const item of groupedItems) {
                // A condição stock >= quantidade protege contra concorrência durante a transação.
                const updateResult = await Product.updateOne(
                    { _id: item.productId, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { session },
                );

                if (updateResult.modifiedCount !== 1) {
                    throw new AppError(409, `Stock insuficiente para ${item.name}`);
                }
            }

            order.stockReserved = true;
            await order.save({ session });
            result = { updated: true };
        });

        return result;
    } finally {
        await session.endSession();
    }
}
```

5. Explicação do código: a função abre uma sessão MongoDB e usa transação para que todas as reduções aconteçam juntas ou nenhuma aconteça. Antes de reduzir, confirma que a encomenda existe, que ainda não atualizou stock e que `payment.status` é `paid`. O agrupamento por produto evita erro quando a mesma encomenda contém o mesmo produto em mais do que uma linha. O preflight confirma stock para todos os produtos; depois cada `updateOne` mantém a condição `stock: { $gte: quantidade }` para proteger contra concorrência.
6. Como validar este passo: encomenda com pagamento pendente devolve `409`; stock insuficiente devolve `409` sem reduzir produtos anteriores; chamar duas vezes com a mesma encomenda reduz stock só uma vez.
7. Erros comuns ou cenário negativo: reduzir stock fora de transação pode deixar inventário parcialmente reduzido; reduzir antes de pagamento confirmado bloqueia produto sem venda real.

### Passo 5 - Criar controller

1. Explicação simples do objetivo: validar entrada HTTP e expor alertas e ajuste manual.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/stock.validator.js`
    - CRIAR: `server/src/controllers/stock.controller.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: criar validators e handlers.
4. Código completo, correto e integrado.

```js
// server/src/validators/stock.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o productId recebido nas routes administrativas de stock.
 * @param {unknown} params - Parâmetros Express.
 * @returns {{ productId: string }} ID do produto validado.
 * @throws {AppError} Quando o ID não tem formato MongoDB válido.
 */
export function validateProductStockParams(params) {
    const productId = String(params?.productId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new AppError(400, "Produto inválido");
    }

    return { productId };
}

/**
 * Valida o payload de alteração manual de stock.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ stock: number }} Stock validado.
 * @throws {AppError} Quando o stock não é inteiro ou é negativo.
 */
export function validateStockPayload(body) {
    const stock = Number(body?.stock);

    if (!Number.isInteger(stock) || stock < 0) {
        throw new AppError(400, "Stock deve ser um número inteiro não negativo");
    }

    return { stock };
}
```

```js
// server/src/controllers/stock.controller.js
import { listLowStockProducts, setProductStock } from "../services/stock.service.js";
import { validateProductStockParams, validateStockPayload } from "../validators/stock.validator.js";

/**
 * Handler HTTP que devolve produtos com baixo stock.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function listLowStockProductsController(req, res, next) {
    try {
        const products = await listLowStockProducts();
        return res.status(200).json({ products });
    } catch (err) {
        return next(err);
    }
}

/**
 * Handler HTTP que atualiza manualmente o stock de um produto.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function updateProductStockController(req, res, next) {
    try {
        const { productId } = validateProductStockParams(req.params);
        const { stock } = validateStockPayload(req.body);
        const product = await setProductStock(productId, stock);
        return res.status(200).json({ product });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: o validator separa erro de URL (`productId` inválido) de erro de payload (`stock` inválido), ambos com `400`. O service mantém validação de stock para proteger chamadas internas. O controller só coordena pedido HTTP e resposta.
6. Como validar este passo: `PATCH /api/admin/products/abc/stock` devolve `400`; stock `-1` devolve `400`; produto válido inexistente devolve `404`.
7. Erros comuns ou cenário negativo: validar só no controller e deixar outras chamadas internas sem validação enfraquece o domínio; validar só no service pode transformar params inválidos em erros técnicos.

### Passo 6 - Criar routes admin

1. Explicação simples do objetivo: proteger gestão de stock.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/routes/stock.routes.js`
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: ficheiro completo e registo na app.
3. O que fazer: criar e montar routes.
4. Código completo, correto e integrado.

```js
// server/src/routes/stock.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    listLowStockProductsController,
    updateProductStockController,
} from "../controllers/stock.controller.js";

/**
 * Rotas administrativas de alertas e ajuste manual de stock.
 */
export const stockRoutes = Router();

stockRoutes.get("/admin/stock/alerts", requireAuth, requireRole("administrador"), listLowStockProductsController);
stockRoutes.patch("/admin/products/:productId/stock", requireAuth, requireRole("administrador"), updateProductStockController);
```

```js
import { stockRoutes } from "./routes/stock.routes.js";

app.use("/api", stockRoutes);
```

5. Explicação do código: só administradores podem ver alertas e alterar stock. A proteção não depende da UI.
6. Como validar este passo: cliente recebe `403`.
7. Erros comuns ou cenário negativo: permitir alteração de stock por cliente compromete vendas.

### Passo 7 - Criar página StockAdminPage

1. Explicação simples do objetivo: dar interface ao admin.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/StockAdminPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: ficheiro completo e rota no App.
3. O que fazer: listar alertas e atualizar stock.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/StockAdminPage.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Página administrativa para consultar alertas e atualizar stock.
 * @returns {JSX.Element} Interface de gestão de stock.
 */
export function StockAdminPage() {
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    /**
     * Carrega produtos abaixo do limite de stock.
     * @returns {Promise<void>}
     */
    async function loadAlerts() {
        setStatus("loading");
        try {
            // A role administrativa é validada no backend; a UI não decide permissões.
            const data = await apiRequest("/admin/stock/alerts", { credentials: "include" });
            setProducts(data.products);
            setStatus("success");
        } catch (err) {
            setError(err.message || "Não foi possível carregar stock.");
            setStatus("error");
        }
    }

    /**
     * Atualiza manualmente o stock e recarrega a lista de alertas.
     * @param {string} productId - Produto a atualizar.
     * @param {number} stock - Novo stock pretendido.
     * @returns {Promise<void>}
     */
    async function updateStock(productId, stock) {
        setError("");
        try {
            await apiRequest(`/admin/products/${productId}/stock`, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ stock }),
            });
            await loadAlerts();
        } catch (err) {
            setError(err.message || "Não foi possível atualizar stock.");
        }
    }

    useEffect(() => {
        loadAlerts();
    }, []);

    if (status === "loading") return <p>A carregar alertas...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    return (
        <main>
            <h1>Gestão de stock</h1>
            {error ? <p role="alert">{error}</p> : null}
            {products.length === 0 ? (
                <p>Não existem alertas de baixo stock.</p>
            ) : (
                products.map((product) => (
                    <article key={product.productId}>
                        <h2>{product.name}</h2>
                        <p>Stock atual: {product.stock}</p>
                        <label>
                            Novo stock
                            <input
                                type="number"
                                min="0"
                                defaultValue={product.stock}
                                onBlur={(event) => updateStock(product.productId, Number(event.target.value))}
                            />
                        </label>
                    </article>
                ))
            )}
        </main>
    );
}
```

5. Explicação do código: a página usa endpoints admin com sessão. O backend continua responsável por role e validação.
6. Como validar este passo: alterar stock para `5` remove produto dos alertas.
7. Erros comuns ou cenário negativo: confiar no `min="0"` do input sem validar no backend.

### Passo 8 - Validar negativos e evidence

1. Explicação simples do objetivo: provar que stock é robusto.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/stock.service.js`
    - REVER: `server/src/routes/stock.routes.js`
    - LOCALIZAÇÃO: testes ou outputs.
3. O que fazer: testar permissões, `productId` inválido, stock negativo, pagamento pendente, stock insuficiente e duplicação.
4. Código completo, correto e integrado.

```bash
curl -i http://localhost:3000/api/admin/stock/alerts
curl -i -X PATCH http://localhost:3000/api/admin/products/PRODUCT_ID/stock \
  -H "Content-Type: application/json" \
  -d '{"stock":-1}'
curl -i -X PATCH http://localhost:3000/api/admin/products/invalid/stock \
  -H "Content-Type: application/json" \
  -d '{"stock":5}'
```

5. Explicação do código: os comandos demonstram autorização e validação. Sem sessão espera `401`; com stock negativo ou `productId` inválido espera `400`. A função `applyOrderStockUpdate` deve ser testada em integração para confirmar que pagamento pendente não reduz stock e que falha parcial faz rollback.
6. Como validar este passo: registar `401`, `403`, `400`, `409` e sucesso `200`.
7. Erros comuns ou cenário negativo: não testar dupla execução de `applyOrderStockUpdate` deixa risco de stock duplicado.

## Expected results
- Admin vê alertas com `200`.
- Cliente recebe `403`.
- `productId` mal formado devolve `400`.
- Stock negativo devolve `400`.
- Encomenda sem pagamento `paid` devolve `409` e não reduz stock.
- Stock insuficiente ao aplicar encomenda devolve `409`.
- Segunda execução da mesma encomenda não reduz stock novamente.

## Critérios de aceite
- Baixo stock usa limite `<5`.
- Só admin altera stock manualmente.
- Stock automático não duplica redução.
- Stock automático só reduz encomendas com pagamento `paid`.
- Falhas de stock usam transação para não deixar reduções parciais.
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada conforme prioridade (`P0`).

## Validação final
- Smoke: produto com stock `4` aparece no alerta.
- Segurança: cliente não acede.
- Comércio: stock não fica negativo.
- Integração: `Order.stockReserved` evita duplicação.

## Evidence para PR/defesa
- Screenshot de alertas.
- Output de cliente `403`.
- Output de stock negativo `400`.
- Prova de chamada dupla sem dupla redução.

## Handoff
MF4 pode continuar com gestão de utilizadores e notificações sem alterar o contrato de stock criado aqui.

## Changelog
- `2026-06-13`: guia reescrito para gestão de stock e atualização segura após compra.
