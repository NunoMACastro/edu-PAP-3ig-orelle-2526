# BK-MF3-07 - Dashboard de estatísticas (vendas, produtos mais vendidos, utilizadores ativos)

## Header
- `doc_id`: `GUIA-BK-MF3-07`
- `bk_id`: `BK-MF3-07`
- `macro`: `MF3`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF3-03`
- `rf_rnf`: `RF31`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF3-08`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-07-dashboard-de-estatisticas-vendas-produtos-mais-vendidos-utilizadores-ativos.md`
- `last_updated`: `2026-06-13`

## Contexto do BK
- Entrega alvo: implementar `RF31`, dashboard administrativo com vendas, produtos mais vendidos e utilizadores ativos.
- CANONICO: o ator é `Admin`.
- DERIVADO: vendas e produtos mais vendidos são calculados a partir de `Order`; utilizadores ativos vêm de `User`.
- Este BK prepara exportação de dados em `BK-MF4-03`.

## Objetivo
Neste BK vais criar um dashboard administrativo com métricas comerciais e operacionais.

## Importância
O dashboard dá visão de negócio sem expor dados pessoais desnecessários. Também ensina agregações MongoDB e autorização por role.

## Scope-in
- Criar endpoint `GET /api/admin/dashboard/stats`.
- Exigir `administrador`.
- Calcular total de vendas, número de encomendas, produtos mais vendidos e utilizadores ativos.
- Criar página React para Admin.

## Scope-out
- Não exportar Excel/PDF.
- Não mostrar dados biométricos.
- Não permitir ações de gestão de utilizadores.
- Não fazer gráficos avançados.

## Estado antes
`CRITICO`: o guia usava código de checkout genérico e não implementava estatísticas.

## Estado depois
`OK`: dashboard tem service, controller, route, UI, role e negativos.

## Pré-requisitos
- `BK-MF3-03`: `Order`.
- `BK-MF0-05`: `requireRole` e role `administrador`.
- `BK-MF0-01`: `User`.

## Glossário
- Métrica agregada: valor calculado a partir de vários documentos.
- Produto mais vendido: produto com maior soma de quantidades vendidas.
- Utilizador ativo: utilizador com atividade recente ou sessão/atualização recente.
- Admin route: endpoint apenas para administradores.

## Conceitos teóricos
Dashboard administrativo não deve devolver listas completas de clientes. Estatística deve ser agregada e minimizada.

Role no frontend é apenas conveniência visual. A proteção real é no backend com `requireRole("administrador")`.

Agregações MongoDB permitem somar vendas e quantidades sem carregar todas as encomendas para memória.

## Arquitetura do BK
- `admin-dashboard.service.js`: calcula métricas.
- `admin-dashboard.controller.js`: devolve DTO.
- `admin-dashboard.routes.js`: protege com role.
- `AdminDashboardPage.jsx`: apresenta cartões simples.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/services/admin-dashboard.service.js`
- CRIAR: `server/src/controllers/admin-dashboard.controller.js`
- CRIAR: `server/src/routes/admin-dashboard.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/AdminDashboardPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/order.model.js`
- REVER: `server/src/models/user.model.js`

## Bloco pedagógico
### Objetivo
Criar estatísticas administrativas sem expor dados pessoais desnecessários.

### Pré-requisitos
- Saber usar role de administrador.
- Saber fazer agregações simples.
- Saber criar página protegida.

### Erros comuns
- Proteger apenas no frontend.
- Devolver emails ou perfis completos.
- Contar carrinhos como vendas.
- Contar pagamento iniciado como venda paga.

### Check de compreensao
- [ ] Sei explicar diferença entre encomendas e vendas pagas.
- [ ] Sei indicar por que não devolvemos clientes completos.
- [ ] Sei testar acesso como cliente.

### Tempo estimado
`P1`: 75-90 minutos.

## Bloco operacional
### Entrada
- Sessão autenticada de administrador.
- Encomendas existentes.
- Utilizadores existentes.

### Passos
1. Confirmar contrato.
2. Criar service.
3. Criar controller.
4. Criar route protegida.
5. Registar route.
6. Criar página React.
7. Executar cenários negativos obrigatórios (mínimo 2).

### Cenarios negativos recomendados
- Cliente autenticado recebe `403`.
- Sem sessão recebe `401`.
- Sem vendas recebe métricas a zero.

### Validacao
- [ ] Smoke: admin vê métricas.
- [ ] Negativos: mínimo `2` cenários com resultado controlado.
- [ ] Privacidade: resposta não devolve emails, nomes completos ou dados biométricos.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF3-08` usa stock e encomendas para alertas; `BK-MF4-03` poderá exportar estas métricas.

## Passos lineares

### Passo 1 - Confirmar contrato do dashboard

1. Explicação simples do objetivo: garantir que o dashboard é administrativo e agregado.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: `RF31`, `BK-MF3-07`.
3. O que fazer: confirmar que ator é Admin.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: sem código porque se define o limite de dados a expor.
6. Como validar este passo: endpoint deve começar por `/api/admin`.
7. Erros comuns ou cenário negativo: mostrar dashboard a clientes expõe dados de negócio.

### Passo 2 - Criar service de estatísticas

1. Explicação simples do objetivo: calcular métricas comerciais.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/admin-dashboard.service.js`
    - REVER: `server/src/models/order.model.js`
    - REVER: `server/src/models/user.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: agregar encomendas e utilizadores.
4. Código completo, correto e integrado.

```js
// server/src/services/admin-dashboard.service.js
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

const PAID_PAYMENT_STATUS = "paid";

/**
 * Calcula métricas agregadas para o dashboard administrativo.
 * @returns {Promise<{ orderCount: number, totalSalesCents: number, activeUsers: number, topProducts: Array<object> }>}
 */
export async function getAdminDashboardStats() {
    const [salesSummary] = await Order.aggregate([
        // Só pagamentos confirmados entram em receita.
        { $match: { "payment.status": PAID_PAYMENT_STATUS } },
        {
            $group: {
                _id: null,
                orderCount: { $sum: 1 },
                totalSalesCents: { $sum: "$totalCents" },
            },
        },
    ]);

    const topProducts = await Order.aggregate([
        // O dashboard devolve produtos agregados, nunca clientes individuais.
        { $match: { "payment.status": PAID_PAYMENT_STATUS } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                name: { $first: "$items.name" },
                unitsSold: { $sum: "$items.quantity" },
                revenueCents: { $sum: "$items.lineTotalCents" },
            },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
    ]);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: since } });

    return {
        orderCount: salesSummary?.orderCount || 0,
        totalSalesCents: salesSummary?.totalSalesCents || 0,
        activeUsers,
        topProducts: topProducts.map((product) => ({
            productId: product._id.toString(),
            name: product.name,
            unitsSold: product.unitsSold,
            revenueCents: product.revenueCents,
        })),
    };
}
```

5. Explicação do código: o service devolve apenas números e nomes de produtos. Não devolve clientes individuais. `PAID_PAYMENT_STATUS` fixa que vendas e produtos mais vendidos só contam encomendas pagas. Estados como `requires_payment` e `pending_manual_confirmation` continuam a existir, mas não entram em receita. `activeUsers` usa atividade recente como métrica simples e documentada.
6. Como validar este passo: sem encomendas pagas deve devolver zeros e `topProducts: []`; uma encomenda `requires_payment` não deve aumentar receita.
7. Erros comuns ou cenário negativo: contar carrinhos, checkouts iniciados ou pagamentos pendentes como vendas aumenta falsamente receita.

### Passo 3 - Criar controller

1. Explicação simples do objetivo: devolver estatísticas ao admin.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/admin-dashboard.controller.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: chamar service.
4. Código completo, correto e integrado.

```js
// server/src/controllers/admin-dashboard.controller.js
import { getAdminDashboardStats } from "../services/admin-dashboard.service.js";

/**
 * Handler HTTP que devolve estatísticas agregadas para administradores.
 * @param {import("express").Request} req - Pedido Express autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function getAdminDashboardStatsController(req, res, next) {
    try {
        const stats = await getAdminDashboardStats();
        return res.status(200).json({ stats });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: controller não recebe filtros livres, reduzindo risco de consultas pesadas ou exposição indevida.
6. Como validar este passo: resposta deve ter chave `stats`.
7. Erros comuns ou cenário negativo: colocar agregação complexa no controller mistura responsabilidades.

### Passo 4 - Criar route protegida

1. Explicação simples do objetivo: proteger dashboard por role.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/routes/admin-dashboard.routes.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: usar `requireAuth` e `requireRole`.
4. Código completo, correto e integrado.

```js
// server/src/routes/admin-dashboard.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { getAdminDashboardStatsController } from "../controllers/admin-dashboard.controller.js";

/**
 * Rotas administrativas protegidas por autenticação e role.
 */
export const adminDashboardRoutes = Router();

adminDashboardRoutes.get(
    "/admin/dashboard/stats",
    requireAuth,
    requireRole("administrador"),
    getAdminDashboardStatsController,
);
```

5. Explicação do código: a autorização vive no backend. Mesmo que um cliente tente chamar endpoint manualmente, recebe `403`.
6. Como validar este passo: cliente autenticado deve receber `403`.
7. Erros comuns ou cenário negativo: esconder link no menu não protege endpoint.

### Passo 5 - Registar route

1. Explicação simples do objetivo: ligar dashboard ao Express.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: imports e routes.
3. O que fazer: montar `adminDashboardRoutes`.
4. Código completo, correto e integrado.

```js
import { adminDashboardRoutes } from "./routes/admin-dashboard.routes.js";

app.use("/api", adminDashboardRoutes);
```

5. Explicação do código: o endpoint final fica `GET /api/admin/dashboard/stats`.
6. Como validar este passo: sem sessão devolve `401`.
7. Erros comuns ou cenário negativo: montar route sob `/api/me` confundiria domínio administrativo.

### Passo 6 - Criar página AdminDashboardPage

1. Explicação simples do objetivo: apresentar métricas ao administrador.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/AdminDashboardPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: ficheiro completo e registo de página.
3. O que fazer: criar UI com loading/error/success.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/AdminDashboardPage.jsx
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
 * Página administrativa que apresenta métricas agregadas da loja.
 * @returns {JSX.Element} Interface do dashboard.
 */
export function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        /**
         * Carrega estatísticas agregadas protegidas pela role no backend.
         * @returns {Promise<void>}
         */
        async function loadStats() {
            try {
                // A UI apenas consome agregados; a autorização é validada no servidor.
                const data = await apiRequest("/admin/dashboard/stats", { credentials: "include" });
                setStats(data.stats);
                setStatus("success");
            } catch (err) {
                setError(err.message || "Não foi possível carregar estatísticas.");
                setStatus("error");
            }
        }
        loadStats();
    }, []);

    if (status === "loading") return <p>A carregar estatísticas...</p>;
    if (status === "error") return <p role="alert">{error}</p>;

    return (
        <main>
            <h1>Dashboard</h1>
            <section>
                <p>Encomendas pagas: {stats.orderCount}</p>
                <p>Vendas: {euros(stats.totalSalesCents)}</p>
                <p>Utilizadores ativos: {stats.activeUsers}</p>
            </section>
            <section>
                <h2>Produtos mais vendidos</h2>
                {stats.topProducts.length === 0 ? (
                    <p>Sem vendas registadas.</p>
                ) : (
                    <ol>
                        {stats.topProducts.map((product) => (
                            <li key={product.productId}>
                                {product.name}: {product.unitsSold} unidades, {euros(product.revenueCents)}
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </main>
    );
}
```

5. Explicação do código: a página mostra agregados e usa sessão por cookie. A proteção real continua no backend.
6. Como validar este passo: admin vê métricas; cliente vê erro de autorização.
7. Erros comuns ou cenário negativo: guardar dados admin em estado global acessível a qualquer página aumenta exposição.

### Passo 7 - Validar negativos e evidence

1. Explicação simples do objetivo: provar segurança e estado vazio.
2. Ficheiros envolvidos.
    - REVER: `server/src/routes/admin-dashboard.routes.js`
    - REVER: `server/src/services/admin-dashboard.service.js`
    - LOCALIZAÇÃO: testes ou outputs.
3. O que fazer: testar sem sessão, cliente e admin.
4. Código completo, correto e integrado.

```bash
curl -i http://localhost:3000/api/admin/dashboard/stats
```

5. Explicação do código: sem cookie espera `401`. Com cliente espera `403`. Com admin espera `200`.
6. Como validar este passo: guardar outputs e screenshot do dashboard.
7. Erros comuns ou cenário negativo: considerar `topProducts` vazio como falha; sem vendas, vazio é correto.

## Expected results
- Admin autenticado recebe `200`.
- Cliente autenticado recebe `403`.
- Sem sessão recebe `401`.
- Sem vendas pagas devolve zeros.
- Encomendas com `requires_payment` ou `pending_manual_confirmation` não aumentam receita nem produtos mais vendidos.

## Critérios de aceite
- Endpoint protegido por `administrador`.
- Resposta contém métricas agregadas.
- Métricas de vendas usam apenas pagamento `paid`.
- Não devolve dados pessoais sensíveis.
- Cenários negativos concluídos: mínimo `2`.
- Evidência de testes por camada conforme prioridade (`P1`).

## Validação final
- Smoke: admin vê estatísticas.
- Segurança: cliente não acede.
- Integração: métricas usam `Order`.

## Evidence para PR/defesa
- Screenshot do dashboard.
- Output `401` sem sessão.
- Output `403` como cliente.

## Handoff
O próximo BK usa dados comerciais para alertas de stock e atualização após compra.

## Changelog
- `2026-06-13`: guia reescrito para dashboard administrativo com agregações.
