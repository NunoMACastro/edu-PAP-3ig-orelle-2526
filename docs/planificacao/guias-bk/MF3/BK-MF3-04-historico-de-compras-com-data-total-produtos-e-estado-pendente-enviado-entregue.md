# BK-MF3-04 - Histórico de compras com data, total, produtos e estado (pendente, enviado, entregue)

## Header
- `doc_id`: `GUIA-BK-MF3-04`
- `bk_id`: `BK-MF3-04`
- `macro`: `MF3`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF3-03`
- `rf_rnf`: `RF28`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF3-06`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-04-historico-de-compras-com-data-total-produtos-e-estado-pendente-enviado-entregue.md`
- `last_updated`: `2026-06-13`

## Contexto do BK
- Entrega alvo: implementar `RF28`, permitindo ao cliente consultar compras com data, total, produtos e estado.
- CANONICO: os estados mínimos são `pendente`, `enviado` e `entregue`.
- DERIVADO: o histórico usa `Order` criado em `BK-MF3-03`.
- Este BK prepara recompra em `BK-MF3-06`.

## Objetivo
Neste BK vais criar o histórico pessoal de compras do cliente autenticado.

## Importância
Histórico de compras dá transparência ao cliente e fornece a base para recompra, estatísticas e notificações de estado.

## Scope-in
- Criar endpoint `GET /api/me/orders`.
- Listar apenas encomendas do utilizador autenticado.
- Devolver data, total, produtos e estado.
- Criar página React de histórico.

## Scope-out
- Não criar checkout.
- Não alterar estados administrativos.
- Não exportar dados.
- Não permitir consulta por `userId` enviado no frontend.

## Estado antes
`CRITICO`: o guia falava de análise IA e não implementava histórico de compras.

## Estado depois
`OK`: o guia define endpoint, controller, route, UI e negativos de ownership.

## Pré-requisitos
- `BK-MF3-03`: modelo `Order` e `listMyOrders`.
- `BK-MF0-02`: `requireAuth`.

## Glossário
- Histórico de compras: lista das encomendas do cliente.
- Estado da encomenda: fase logística da compra.
- Snapshot de produto: nome e preço guardados na encomenda.
- Ownership: consulta limitada ao próprio utilizador.

## Conceitos teóricos
Histórico de compras não deve aceitar `userId` por query ou params. A rota `/api/me/orders` usa a sessão para evitar que um cliente consulte compras de outro.

O histórico mostra snapshots guardados na encomenda. Assim, se o produto mudar de nome ou preço no catálogo, a compra antiga continua fiel ao momento em que foi feita.

Estado da encomenda não é estado do pagamento. Uma encomenda pode estar `pendente` enquanto o pagamento aguarda confirmação.

## Arquitetura do BK
- `order.service.js`: reutiliza `listMyOrders`.
- `order-history.controller.js`: devolve histórico.
- `order-history.routes.js`: protege rota com `requireAuth`.
- `PurchaseHistoryPage.jsx`: mostra compras.

## Ficheiros a criar/editar/rever
- EDITAR: `server/src/services/order.service.js`
- CRIAR: `server/src/controllers/order-history.controller.js`
- CRIAR: `server/src/routes/order-history.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/PurchaseHistoryPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/order.model.js`

## Bloco pedagógico
### Objetivo
Listar compras do próprio cliente sem acesso cruzado.

### Pré-requisitos
- Ter encomendas criadas.
- Ter sessão autenticada.
- Saber formatar valores monetários no frontend.

### Erros comuns
- Criar `/api/users/:userId/orders` para clientes.
- Devolver documentos completos da base de dados.
- Misturar estado de pagamento com estado de envio.

### Check de compreensao
- [ ] Sei explicar porque a rota usa `/me`.
- [ ] Sei indicar que campos aparecem no histórico.
- [ ] Sei testar tentativa de manipular `userId`.

### Tempo estimado
`P0`: 90 minutos, incluindo negativos.

## Bloco operacional
### Entrada
- Sessão autenticada.
- Encomendas existentes do próprio utilizador.

### Passos
1. Confirmar contrato.
2. Garantir DTO no service.
3. Criar controller.
4. Criar route.
5. Registar route.
6. Criar página React.
7. Validar ownership.
8. Executar cenários negativos obrigatórios (mínimo 3).

### Cenarios negativos recomendados
- Pedido sem sessão devolve `401`.
- Utilizador sem compras recebe lista vazia.
- Tentativa de passar `userId` é ignorada.

### Validacao
- [ ] Smoke: cliente vê compras ordenadas por data.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Segurança: nenhum campo interno desnecessário é devolvido.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF3-06` deve usar os IDs das encomendas do próprio cliente para recompra.

## Passos lineares

### Passo 1 - Confirmar contrato do histórico

1. Explicação simples do objetivo: garantir que `RF28` usa encomendas reais.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: `RF28`, `RF30`, `BK-MF3-04` e `BK-MF3-06`.
3. O que fazer: confirmar campos obrigatórios do histórico.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: o passo define que histórico vem de `Order`, não de carrinho.
6. Como validar este passo: o endpoint definido deve ser `GET /api/me/orders`.
7. Erros comuns ou cenário negativo: listar carrinhos antigos não prova compra.

### Passo 2 - Garantir DTO no service

1. Explicação simples do objetivo: devolver apenas os campos necessários.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/services/order.service.js`
    - LOCALIZAÇÃO: função `serializeOrder` e `listMyOrders`.
3. O que fazer: garantir DTO com data, total, produtos e estado.
4. Código completo, correto e integrado.

```js
/**
 * Lista o histórico de encomendas do cliente autenticado com um DTO minimizado.
 * @param {string} userId - ID vindo da sessão autenticada.
 * @returns {Promise<Array<{ id: string, createdAt: Date, totalCents: number, orderStatus: string, paymentStatus: string, items: Array<object> }>>}
 */
export async function listMyOrders(userId) {
    // O filtro por userId garante que cada cliente vê apenas as suas encomendas.
    const orders = await Order.find({ userId })
        .select("items totalCents orderStatus payment.status createdAt")
        .sort({ createdAt: -1 })
        .limit(50);

    return orders.map((order) => ({
        id: order._id.toString(),
        createdAt: order.createdAt,
        totalCents: order.totalCents,
        orderStatus: order.orderStatus,
        paymentStatus: order.payment.status,
        items: order.items.map((item) => ({
            productId: item.productId.toString(),
            name: item.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
        })),
    }));
}
```

5. Explicação do código: o filtro `{ userId }` aplica ownership. O `.select(...)` limita a resposta e evita devolver campos internos.
6. Como validar este passo: criar encomendas para dois utilizadores e confirmar que cada sessão vê apenas as suas.
7. Erros comuns ou cenário negativo: usar `Order.find()` sem filtro expõe histórico global.

### Passo 3 - Criar controller

1. Explicação simples do objetivo: transformar service em resposta HTTP.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/order-history.controller.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: chamar `listMyOrders`.
4. Código completo, correto e integrado.

```js
// server/src/controllers/order-history.controller.js
import { listMyOrders } from "../services/order.service.js";

/**
 * Handler HTTP que devolve o histórico do utilizador autenticado.
 * @param {import("express").Request} req - Pedido Express com sessão em `req.user`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
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

5. Explicação do código: `req.user.id` vem da sessão e substitui qualquer ID enviado pelo browser.
6. Como validar este passo: pedido autenticado recebe `200`.
7. Erros comuns ou cenário negativo: ler `req.query.userId` quebraria privacidade.

### Passo 4 - Criar route

1. Explicação simples do objetivo: proteger o endpoint de histórico.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/routes/order-history.routes.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar `GET /me/orders`.
4. Código completo, correto e integrado.

```js
// server/src/routes/order-history.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { listMyOrdersController } from "../controllers/order-history.controller.js";

/**
 * Rotas autenticadas para histórico pessoal de compras.
 */
export const orderHistoryRoutes = Router();

orderHistoryRoutes.get("/me/orders", requireAuth, listMyOrdersController);
```

5. Explicação do código: `requireAuth` bloqueia utilizadores sem sessão. `/me` comunica que a rota é pessoal.
6. Como validar este passo: sem sessão, espera `401`.
7. Erros comuns ou cenário negativo: esconder rota no frontend sem `requireAuth` não protege dados.

### Passo 5 - Registar route

1. Explicação simples do objetivo: ligar a route à app.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: imports e routes.
3. O que fazer: montar `orderHistoryRoutes`.
4. Código completo, correto e integrado.

```js
import { orderHistoryRoutes } from "./routes/order-history.routes.js";

app.use("/api", orderHistoryRoutes);
```

5. Explicação do código: o endpoint final fica `GET /api/me/orders`.
6. Como validar este passo: chamar endpoint e verificar `401` sem sessão.
7. Erros comuns ou cenário negativo: usar prefixo diferente quebra o frontend.

### Passo 6 - Criar página de histórico

1. Explicação simples do objetivo: mostrar compras ao cliente.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/PurchaseHistoryPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: ficheiro completo e registo de página.
3. O que fazer: criar UI com estados.
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
 * Página que mostra o histórico de compras do cliente autenticado.
 * @returns {JSX.Element} Interface do histórico pessoal.
 */
export function PurchaseHistoryPage() {
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        /**
         * Carrega encomendas pessoais sem enviar userId no pedido.
         * @returns {Promise<void>}
         */
        async function loadOrders() {
            try {
                // A rota /me usa a sessão; não há seleção de utilizador no browser.
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

    if (status === "loading") return <p>A carregar histórico...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    return (
        <main>
            <h1>Histórico de compras</h1>
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
                    </article>
                ))
            )}
        </main>
    );
}
```

5. Explicação do código: a página chama endpoint pessoal com cookie de sessão, mostra vazio, erro e sucesso. Não envia `userId`.
6. Como validar este passo: utilizador sem compras vê estado vazio; utilizador com compras vê lista.
7. Erros comuns ou cenário negativo: tentar filtrar histórico no frontend não substitui filtro no backend.

### Passo 7 - Validar ownership

1. Explicação simples do objetivo: provar isolamento entre clientes.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/order.service.js`
    - LOCALIZAÇÃO: testes de integração.
3. O que fazer: criar encomendas para dois utilizadores e testar sessões.
4. Código completo, correto e integrado.

```js
expect(response.body.orders.every((order) => order.userId === undefined)).toBe(true);
expect(response.body.orders).toHaveLength(1);
```

5. Explicação do código: o teste confirma que o DTO não devolve `userId` e que o filtro de sessão limita resultados.
6. Como validar este passo: sessão A não vê encomendas de B.
7. Erros comuns ou cenário negativo: devolver `userId` no DTO incentiva lógica insegura no frontend.

### Passo 8 - Validar negativos e evidence

1. Explicação simples do objetivo: fechar o BK com provas objetivas.
2. Ficheiros envolvidos.
    - REVER: `server/src/routes/order-history.routes.js`
    - REVER: `client/src/pages/PurchaseHistoryPage.jsx`
    - LOCALIZAÇÃO: outputs de API e screenshots.
3. O que fazer: registar smoke e negativos.
4. Código completo, correto e integrado.

```bash
curl -i http://localhost:3000/api/me/orders
curl -i "http://localhost:3000/api/me/orders?userId=outro"
```

5. Explicação do código: sem sessão espera `401`. Com sessão, query `userId` não deve alterar resultado.
6. Como validar este passo: guardar outputs `401`, `200` vazio e `200` com compras.
7. Erros comuns ou cenário negativo: considerar lista vazia como erro; para utilizador sem compras, lista vazia é sucesso.

## Expected results
- `GET /api/me/orders` autenticado devolve `200`.
- Sem sessão devolve `401`.
- Sem compras devolve `200` com lista vazia.
- Query `userId` é ignorada.

## Critérios de aceite
- Histórico mostra data, total, produtos e estado.
- Backend filtra por sessão.
- DTO não expõe dados internos.
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada conforme prioridade (`P0`).

## Validação final
- Smoke: listar compras reais.
- Segurança: sessão A não vê compras de B.
- Integração: `BK-MF3-06` consegue reutilizar `Order`.

## Evidence para PR/defesa
- Screenshot de lista vazia.
- Screenshot de lista com compras.
- Outputs `401` e query `userId` ignorada.

## Handoff
O próximo BK deve criar recompra a partir de encomenda pertencente ao próprio utilizador.

## Changelog
- `2026-06-13`: guia reescrito para histórico de compras autenticado.
