# BK-MF8-12 — Insights e correções do consultor visíveis para o cliente

## Header

- `doc_id`: `GUIA-BK-MF8-12`
- `bk_id`: `BK-MF8-12`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Aline`
- `prioridade`: `P1`
- `estado`: `CORRIGIDO`
- `esforco`: `S`
- `dependencias`: `BK-MF8-09, BK-MF8-10, BK-MF8-11`
- `rf_rnf`: `RF46`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF8-13`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md`
- `last_updated`: `2026-07-02`

#### Objetivo

Implementar o fluxo completo que permite ao cliente autenticado consultar os insights públicos e correções publicados pelo consultor sobre as suas sessões de IA.

No final deste BK, a aplicação deve ter:

1. Um endpoint autenticado de cliente em `apps/api` para listar insights publicados pelo consultor.
2. Uma validação explícita do filtro opcional `consultationSessionId`.
3. Um DTO público que reutiliza a fronteira criada no BK-MF8-11 e não expõe dados internos da revisão.
4. Uma página em `apps/web` onde o cliente vê estados de carregamento, vazio, erro e sucesso.
5. Testes de API que provam autorização, ownership, filtragem por sessão e ausência de campos internos.

#### Importância

O RF46 fecha o ciclo de confiança entre IA, consultor e cliente. Os BKs anteriores desta MF já permitem gerar recomendações com IA, apresentar recomendações ao cliente e colocar o consultor a rever essas recomendações. Este BK torna visível para o cliente a parte humana desse processo.

Sem este BK, o cliente vê recomendações, mas não percebe se houve validação humana, que alterações foram feitas ou qual foi a nota pública do consultor. Isso enfraquece a rastreabilidade funcional da MF8 e deixa a cadeia BK-MF8-11 → BK-MF8-12 → BK-MF8-13 incompleta.

Este BK também é importante por segurança. O consultor pode ter notas internas, metadados de revisão e contexto técnico que não pertencem ao cliente. A implementação deve publicar apenas o DTO seguro definido para cliente.

#### Scope-in

Este BK inclui:

1. Reutilizar o modelo e o DTO público de revisão criados no BK-MF8-11.
2. Acrescentar ao serviço de reviews uma função de listagem de insights publicados para o cliente autenticado.
3. Criar o validador `apps/api/src/validators/client-ai-insight.validator.js`.
4. Criar o controller `apps/api/src/controllers/client-ai-insight.controller.js`.
5. Criar a rota `apps/api/src/routes/client-ai-insight.routes.js`.
6. Registar a rota em `apps/api/src/app.js`.
7. Criar a página `apps/web/src/pages/ClientAiInsightsPage.jsx`.
8. Integrar a página em `apps/web/src/App.jsx`.
9. Criar testes de API em `apps/api/tests/mf8.client-insights.test.js`.
10. Validar que a resposta pública não devolve notas internas, fotografias, chaves de ficheiros, prompts, consentimentos internos ou campos de controlo do consultor.

#### Scope-out

Este BK não inclui:

1. Criar ou alterar o fluxo onde o consultor decide a revisão; isso pertence ao BK-MF8-11.
2. Permitir ao cliente editar insights publicados pelo consultor.
3. Expor notas internas do consultor.
4. Expor fotografias, chaves de armazenamento, consentimentos internos, prompts ou metadados técnicos de IA.
5. Criar carrinho, checkout, compra ou recomendação comercial final.
6. Implementar notificações em tempo real.
7. Alterar o motor que gera recomendações cosméticas com IA.
8. Alterar autenticação global da aplicação.

#### Estado antes e depois

Antes deste BK:

1. O cliente consegue consultar recomendações associadas à sua sessão de IA.
2. O consultor consegue rever recomendações e guardar uma decisão humana.
3. A revisão do consultor ainda não tem uma superfície própria para o cliente final consultar os insights publicados.

Depois deste BK:

1. O cliente autenticado consegue abrir uma página de insights do consultor.
2. A API devolve apenas reviews finalizadas, com `publicInsight` publicado e pertencentes ao cliente autenticado.
3. O cliente pode filtrar os insights por `consultationSessionId`.
4. A resposta usa um DTO público, sem dados internos de revisão.
5. Os testes demonstram que utilizadores sem sessão não acedem aos insights e que o cliente não recebe campos sensíveis.

#### Pre-requisitos

Antes de iniciar, confirma que os seguintes pontos estão implementados:

1. BK-MF8-09 concluiu a página de recomendações do cliente.
2. BK-MF8-10 concluiu o histórico de sessões de consulta com IA.
3. BK-MF8-11 criou a revisão assistida pelo consultor e exporta `toPublishedConsultantInsightDto`.
4. O backend usa cookies de sessão com `requireAuth`.
5. O modelo de review do BK-MF8-11 tem `userId`, `consultationSessionId`, `status`, `publicInsight`, `recommendationIds`, `reviewedAt` e `updatedAt`.
6. O frontend já usa `apiRequest` em `apps/web/src/services/apiClient.js`.
7. Os papéis da aplicação continuam definidos em `apps/api/src/constants/roles.js`.

#### Glossário

| Termo | Significado |
| --- | --- |
| Insight público | Nota curta e segura que o consultor decidiu mostrar ao cliente. |
| Review finalizada | Revisão do consultor com estado final, por exemplo aprovada, ajustada ou rejeitada. |
| DTO público | Objeto devolvido pela API com apenas os campos que podem ser vistos pelo cliente. |
| Ownership | Garantia de que um utilizador só consulta dados associados ao seu próprio `userId`. |
| `consultationSessionId` | Identificador da sessão de IA que originou as recomendações revistas. |
| Campo interno | Campo usado pela equipa ou pelo consultor que não deve aparecer na interface do cliente. |

#### Conceitos teóricos essenciais

O ponto central deste BK é separar a revisão humana em duas camadas.

A primeira camada é privada e pertence ao consultor. Nela podem existir notas internas, justificações de decisão, informação operacional e dados necessários para auditoria.

A segunda camada é pública para o cliente. Nela só entram campos aprovados para leitura pelo próprio cliente: estado da revisão, nota pública, datas relevantes e recomendações afetadas em formato seguro.

Esta separação é feita com um DTO. O DTO funciona como uma fronteira de segurança: mesmo que o documento da base de dados tenha muitos campos, a API só serializa os campos permitidos.

Também é essencial que o backend não confie em identificadores enviados pelo browser para decidir ownership. O `userId` usado na query vem sempre da sessão autenticada (`req.user.id`). O filtro `consultationSessionId` apenas restringe a listagem dentro dos dados desse mesmo cliente.

#### Arquitetura do BK

Fluxo funcional:

1. O cliente autenticado abre a página de insights do consultor.
2. O frontend chama `GET /api/me/ai-consultation-insights`.
3. O backend valida a sessão com `requireAuth`.
4. O controller valida o filtro opcional `consultationSessionId`.
5. O service procura reviews finalizadas, com `publicInsight` e pertencentes ao `userId` autenticado.
6. O service converte cada review com `toPublishedConsultantInsightDto`.
7. O frontend renderiza a lista de insights, recomendações afetadas e estados de interface.

Decisões canónicas:

1. O RF46 exige que o cliente consiga consultar insights e correções associados às suas recomendações.
2. O RNF31 exige acesso autenticado, autorizado, auditável e com DTO seguro.
3. O BK-MF8-11 é a dependência direta porque cria a revisão do consultor e o DTO público.
4. O BK-MF8-13 depende deste BK para reutilizar os estados públicos de revisão na experiência seguinte do cliente.

Decisões derivadas:

1. O endpoint fica em `GET /api/me/ai-consultation-insights`, porque representa dados do próprio cliente autenticado.
2. O filtro `consultationSessionId` é query string opcional, porque a página pode listar todos os insights ou focar uma sessão concreta.
3. A página chama-se `ClientAiInsightsPage`, para deixar claro que é uma superfície do cliente e não do consultor.
4. Os ficheiros de backend usam o prefixo `client-ai-insight`, para separar esta leitura pública da revisão privada feita pelo consultor.

#### Ficheiros a criar/editar/rever

| Ação | Caminho | Motivo |
| --- | --- | --- |
| Editar | `apps/api/src/services/ai-consultation-review.service.js` | Adicionar listagem pública por cliente e reforçar o DTO público. |
| Criar | `apps/api/src/validators/client-ai-insight.validator.js` | Validar o filtro opcional `consultationSessionId`. |
| Criar | `apps/api/src/controllers/client-ai-insight.controller.js` | Expor a listagem pública ao cliente autenticado. |
| Criar | `apps/api/src/routes/client-ai-insight.routes.js` | Definir o endpoint `GET /api/me/ai-consultation-insights`. |
| Editar | `apps/api/src/app.js` | Registar a nova rota sob `/api`. |
| Criar | `apps/web/src/pages/ClientAiInsightsPage.jsx` | Mostrar os insights publicados pelo consultor ao cliente. |
| Editar | `apps/web/src/App.jsx` | Integrar a página na área autenticada do cliente. |
| Criar | `apps/api/tests/mf8.client-insights.test.js` | Validar autorização, filtros, ownership e DTO seguro. |
| Rever | `docs/RF.md` | Confirmar RF46 antes da implementação. |
| Rever | `docs/RNF.md` | Confirmar RNF31 antes da validação. |

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato funcional e fronteiras de segurança

1. **Objetivo do passo:** Confirmar o contrato de RF46 antes de escrever código.

2. **Ficheiros/pastas envolvidos:** `docs/RF.md`, `docs/RNF.md`, `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`, `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`, `docs/planificacao/guias-bk/MF8/BK-MF8-11-revisao-humana-de-sessoes-ia-por-consultores.md`.

3. **Instruções de implementação:** Lê os documentos acima e confirma estes pontos:

   1. RF46 está associado ao BK-MF8-12.
   2. RNF31 exige autenticação, autorização e DTO seguro.
   3. BK-MF8-11 já criou a revisão do consultor.
   4. O cliente deve ver apenas insights públicos e correções associadas às suas próprias sessões.
   5. O próximo BK, BK-MF8-13, depende de estados públicos consistentes.

4. **Código completo do passo:** Sem código neste passo. Este passo existe para fixar o contrato antes de alterar ficheiros.

5. **Explicação do código:** Não há código para explicar porque a decisão principal é de fronteira funcional: o cliente lê dados publicados, mas não acede à área privada do consultor.

6. **Erros comuns a evitar:**

   1. Criar um endpoint que aceita `userId` vindo do browser.
   2. Mostrar notas internas do consultor na resposta do cliente.
   3. Misturar a página do consultor com a página do cliente.
   4. Listar reviews sem confirmar que têm `publicInsight`.
   5. Ignorar a dependência do BK-MF8-11 e duplicar lógica de DTO.

7. **Como validar o passo:** Regista no teu PR ou relatório que RF46, RNF31, BK-MF8-11 e BK-MF8-13 foram lidos antes da implementação.

### Passo 2 - Reforçar o DTO público e criar a listagem por cliente no service

1. **Objetivo do passo:** Adicionar a função de service que devolve apenas insights publicados pertencentes ao cliente autenticado.

2. **Ficheiros/pastas envolvidos:** `apps/api/src/services/ai-consultation-review.service.js`.

3. **Instruções de implementação:** Abre o service criado no BK-MF8-11. Mantém as funções do consultor e acrescenta a constante `CLIENT_INSIGHT_LIMIT`, o DTO público reforçado e a função `listPublishedConsultantInsightsForClient`.

4. **Código completo do passo:**

```js
const CLIENT_INSIGHT_LIMIT = 20;

/**
 * Converte uma review finalizada num DTO seguro para leitura pelo cliente.
 *
 * Este DTO é a fronteira pública da revisão: se um campo não estiver aqui,
 * não deve aparecer na página do cliente.
 *
 * @param {object} review Review de IA guardada na base de dados.
 * @returns {object | null} Insight público ou null quando não há nota publicada.
 */
export function toPublishedConsultantInsightDto(review) {
    if (!review?.publicInsight) {
        return null;
    }

    return {
        id: review._id.toString(),
        consultationSessionId: review.consultationSessionId.toString(),
        status: review.status,
        note: review.publicInsight.note,
        publishedAt: review.publicInsight.publishedAt,
        reviewedAt: review.reviewedAt,
        recommendations: (review.recommendationIds ?? [])
            .map((recommendation) => toRecommendationDto(recommendation))
            .filter(Boolean),
    };
}

/**
 * Lista insights publicados para o cliente autenticado.
 *
 * O userId vem sempre da sessão validada pelo middleware requireAuth. O browser
 * pode pedir uma sessão específica, mas nunca decide a que cliente os dados
 * pertencem.
 *
 * @param {string} clientUserId Identificador do cliente autenticado.
 * @param {{ consultationSessionId?: string | null }} options Filtros opcionais.
 * @returns {Promise<object[]>} Lista de insights públicos do consultor.
 */
export async function listPublishedConsultantInsightsForClient(clientUserId, options = {}) {
    const query = {
        userId: clientUserId,
        status: { $in: [...FINAL_STATUSES] },
        publicInsight: { $ne: null },
    };

    if (options.consultationSessionId) {
        query.consultationSessionId = options.consultationSessionId;
    }

    const reviews = await AiConsultationReview.find(query)
        .populate({
            path: "recommendationIds",
            select: "productId score status reasonCodes explanation sourceSignals limitations",
            populate: {
                path: "productId",
                select: PRODUCT_SELECT,
            },
        })
        .sort({ reviewedAt: -1, updatedAt: -1 })
        .limit(CLIENT_INSIGHT_LIMIT)
        .exec();

    return reviews
        .map((review) => toPublishedConsultantInsightDto(review))
        .filter(Boolean);
}
```

5. **Explicação do código:** A query combina três proteções. Primeiro, filtra por `userId` recebido da sessão autenticada. Segundo, limita a reviews com estado final. Terceiro, exige `publicInsight`, impedindo que uma review ainda privada apareça na página do cliente. O DTO usa `toRecommendationDto` para manter a mesma forma pública das recomendações já apresentada ao cliente.

6. **Erros comuns a evitar:**

   1. Usar `req.query.userId` ou `req.body.userId` para filtrar dados do cliente.
   2. Devolver diretamente o documento de MongoDB.
   3. Remover o `.filter(Boolean)` e deixar entradas nulas na resposta.
   4. Expor `internalNote`, `reviewerId`, metadados de prompt ou campos de consentimento interno.
   5. Listar reviews sem `status` final.

7. **Como validar o passo:** Confirma que a função exportada compila e que nenhuma resposta pública contém campos fora do DTO.

### Passo 3 - Criar validator, controller, rota e registo no backend

1. **Objetivo do passo:** Expor a listagem pública através de um endpoint autenticado.

2. **Ficheiros/pastas envolvidos:** `apps/api/src/validators/client-ai-insight.validator.js`, `apps/api/src/controllers/client-ai-insight.controller.js`, `apps/api/src/routes/client-ai-insight.routes.js`, `apps/api/src/app.js`.

3. **Instruções de implementação:** Cria os três ficheiros novos e depois regista a rota em `app.js`, junto das rotas de recomendações e IA. Mantém o endpoint debaixo de `/api` e usa `requireAuth`.

4. **Código completo do passo:**

```js
// apps/api/src/validators/client-ai-insight.validator.js
import mongoose from "mongoose";

import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida os filtros aceites pela listagem pública de insights do consultor.
 *
 * @param {object} query Query string recebida pelo Express.
 * @returns {{ consultationSessionId: string | null }} Filtros normalizados.
 */
export function validateClientInsightQuery(query) {
    const consultationSessionId = String(query?.consultationSessionId ?? "").trim();

    if (!consultationSessionId) {
        return { consultationSessionId: null };
    }

    if (!mongoose.isValidObjectId(consultationSessionId)) {
        throw new AppError(400, "Sessão de consulta inválida");
    }

    return { consultationSessionId };
}
```

```js
// apps/api/src/controllers/client-ai-insight.controller.js
import { listPublishedConsultantInsightsForClient } from "../services/ai-consultation-review.service.js";
import { validateClientInsightQuery } from "../validators/client-ai-insight.validator.js";

/**
 * Lista os insights publicados pelo consultor para o cliente autenticado.
 *
 * @param {import("express").Request} req Pedido HTTP autenticado.
 * @param {import("express").Response} res Resposta HTTP.
 * @param {import("express").NextFunction} next Encaminhador de erros.
 * @returns {Promise<void>}
 */
export async function listMyClientAiInsightsController(req, res, next) {
    try {
        const filters = validateClientInsightQuery(req.query);
        const insights = await listPublishedConsultantInsightsForClient(req.user.id, filters);

        res.status(200).json({ insights });
    } catch (error) {
        next(error);
    }
}
```

```js
// apps/api/src/routes/client-ai-insight.routes.js
import { Router } from "express";

import { listMyClientAiInsightsController } from "../controllers/client-ai-insight.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const clientAiInsightRoutes = Router();

clientAiInsightRoutes.get(
    "/me/ai-consultation-insights",
    requireAuth,
    listMyClientAiInsightsController,
);
```

```js
// apps/api/src/app.js
import { clientAiInsightRoutes } from "./routes/client-ai-insight.routes.js";

// Mantém este registo junto das rotas de recomendações e IA.
app.use("/api", clientAiInsightRoutes);
```

5. **Explicação do código:** O validator só aceita um identificador de sessão válido ou ausência de filtro. O controller usa `req.user.id`, preenchido por `requireAuth`, para garantir ownership. A rota não recebe papel de consultor, porque esta leitura pertence ao cliente autenticado.

6. **Erros comuns a evitar:**

   1. Montar a rota sem `requireAuth`.
   2. Validar `consultationSessionId` apenas no frontend.
   3. Criar o endpoint em `/consultant/...`, o que confundiria a fronteira entre cliente e consultor.
   4. Responder com `res.json(reviews)` diretamente.
   5. Engolir erros de validação em vez de os enviar para o middleware de erro.

7. **Como validar o passo:** Faz um pedido autenticado a `GET /api/me/ai-consultation-insights` e confirma resposta `200` com `{ "insights": [] }` quando ainda não há insights publicados.

### Passo 4 - Criar a página de cliente para consultar insights do consultor

1. **Objetivo do passo:** Mostrar os insights publicados ao cliente com estados de interface completos.

2. **Ficheiros/pastas envolvidos:** `apps/web/src/pages/ClientAiInsightsPage.jsx`.

3. **Instruções de implementação:** Cria a página abaixo. Usa `apiRequest`, não guardes tokens no browser e mostra estados de carregamento, erro, vazio e sucesso.

4. **Código completo do passo:**

```jsx
// apps/web/src/pages/ClientAiInsightsPage.jsx
import { useEffect, useState } from "react";

import { apiRequest } from "../services/apiClient.js";

/**
 * Formata datas recebidas da API para leitura curta em português.
 *
 * @param {string | Date | null | undefined} value Data recebida da API.
 * @returns {string} Data formatada ou travessão visual.
 */
function formatDatePt(value) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

/**
 * Mostra ao cliente os insights públicos publicados pelo consultor.
 *
 * A autenticação é feita pelo cookie de sessão enviado pelo apiRequest. A página
 * apenas consome o DTO público recebido da API.
 *
 * @returns {JSX.Element} Página de insights do consultor.
 */
export function ClientAiInsightsPage() {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let isMounted = true;

        async function loadInsights() {
            try {
                setIsLoading(true);
                setErrorMessage("");

                const data = await apiRequest("/me/ai-consultation-insights");

                if (isMounted) {
                    setInsights(Array.isArray(data?.insights) ? data.insights : []);
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(
                        error?.message ?? "Não foi possível carregar os insights do consultor.",
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadInsights();

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading) {
        return (
            <section className="page-section" aria-busy="true">
                <h2>Insights do consultor</h2>
                <p>A carregar insights publicados...</p>
            </section>
        );
    }

    return (
        <section className="page-section" aria-labelledby="client-ai-insights-title">
            <header className="page-section__header">
                <h2 id="client-ai-insights-title">Insights do consultor</h2>
                <p>
                    Consulta as notas públicas que o consultor associou às tuas
                    recomendações de IA.
                </p>
            </header>

            {errorMessage ? (
                <p role="alert" className="form-error">
                    {errorMessage}
                </p>
            ) : null}

            {!errorMessage && insights.length === 0 ? (
                <p className="empty-state">
                    Ainda não existem insights publicados pelo consultor para as tuas sessões.
                </p>
            ) : null}

            {!errorMessage && insights.length > 0 ? (
                <div className="insight-list">
                    {insights.map((insight) => (
                        <article className="insight-card" key={insight.id}>
                            <header className="insight-card__header">
                                <div>
                                    <h3>Sessão {insight.consultationSessionId}</h3>
                                    <p>Estado da revisão: {insight.status}</p>
                                </div>
                                <time dateTime={insight.publishedAt}>
                                    Publicado em {formatDatePt(insight.publishedAt)}
                                </time>
                            </header>

                            <p>{insight.note}</p>

                            <dl className="insight-card__meta">
                                <div>
                                    <dt>Revisto em</dt>
                                    <dd>{formatDatePt(insight.reviewedAt)}</dd>
                                </div>
                                <div>
                                    <dt>Recomendações afetadas</dt>
                                    <dd>{insight.recommendations?.length ?? 0}</dd>
                                </div>
                            </dl>

                            {insight.recommendations?.length ? (
                                <ul className="recommendation-summary-list">
                                    {insight.recommendations.map((recommendation) => (
                                        <li key={recommendation.id}>
                                            <strong>{recommendation.product?.name}</strong>
                                            <span>
                                                Score {recommendation.score} · {recommendation.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : null}
                        </article>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
```

5. **Explicação do código:** A página carrega os insights no arranque, guarda o resultado em estado local e renderiza cada estado de forma explícita. A variável `isMounted` evita alterar estado depois de o componente ser desmontado. O frontend não decide ownership e não guarda credenciais: apenas chama a API autenticada pelo cookie.

6. **Erros comuns a evitar:**

   1. Guardar tokens manualmente no browser.
   2. Mostrar campos que não existem no DTO público.
   3. Assumir que `recommendations` existe sempre.
   4. Fazer o filtro de ownership no React.
   5. Esconder erros de API sem mensagem para o utilizador.

7. **Como validar o passo:** Abre a aplicação autenticada como cliente e confirma os quatro estados: carregamento, lista vazia, erro e lista com pelo menos um insight publicado.

### Passo 5 - Integrar a página na aplicação autenticada

1. **Objetivo do passo:** Tornar a página acessível a partir da área do cliente.

2. **Ficheiros/pastas envolvidos:** `apps/web/src/App.jsx`.

3. **Instruções de implementação:** Importa a página e adiciona-a ao grupo de secções autenticadas do cliente, perto da página de recomendações.

4. **Código completo do passo:**

```jsx
// apps/web/src/App.jsx
import { ClientAiInsightsPage } from "./pages/ClientAiInsightsPage.jsx";
```

```jsx
<MeasuredPageSection pageKey="product-recommendations" label="Recomendações">
    <ProductRecommendationsPage />
</MeasuredPageSection>

<MeasuredPageSection pageKey="client-ai-insights" label="Insights do consultor">
    <ClientAiInsightsPage />
</MeasuredPageSection>
```

5. **Explicação do código:** A página fica junto das recomendações porque o cliente usa os insights para interpretar correções humanas associadas a essas recomendações. A integração não precisa de novo papel, porque o endpoint já valida a sessão e devolve apenas dados do próprio cliente.

6. **Erros comuns a evitar:**

   1. Colocar a página dentro da área do consultor.
   2. Criar navegação duplicada sem seguir o padrão existente em `App.jsx`.
   3. Importar a página com caminho diferente do ficheiro criado.
   4. Tornar a página pública para utilizadores sem sessão.
   5. Alterar outras páginas da MF8 sem necessidade.

7. **Como validar o passo:** Executa o frontend, entra como cliente e confirma que a secção "Insights do consultor" aparece junto das recomendações.

### Passo 6 - Criar testes de API para autorização, filtro e DTO seguro

1. **Objetivo do passo:** Provar que o endpoint só devolve insights publicados do cliente autenticado.

2. **Ficheiros/pastas envolvidos:** `apps/api/tests/mf8.client-insights.test.js`.

3. **Instruções de implementação:** Cria testes com Vitest e Supertest, seguindo o padrão dos testes existentes. Os testes devem cobrir sucesso, filtro por sessão, ausência de sessão, validação de query e ausência de campos internos.

4. **Código completo do passo:**

```js
// apps/api/tests/mf8.client-insights.test.js
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/ai-consultation-review.model.js", () => ({
    AiConsultationReview: {
        find: vi.fn(),
    },
}));

const clientUserId = "668000000000000000000001";
const consultationSessionId = "668000000000000000000002";
const reviewId = "668000000000000000000003";

/**
 * Cria um valor mínimo com comportamento de ObjectId para os DTOs.
 *
 * @param {string} value Identificador em string.
 * @returns {{ toString: () => string }} Objeto com toString.
 */
function objectId(value) {
    return {
        toString() {
            return value;
        },
    };
}

/**
 * Cria uma chain compatível com as chamadas feitas pelo service.
 *
 * @param {object[]} result Resultado devolvido no exec.
 * @returns {object} Query chain usada pelo teste.
 */
function createReviewQuery(result) {
    return {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(result),
    };
}

/**
 * Cria cookie de sessão para o utilizador autenticado.
 *
 * @param {string} role Papel do utilizador.
 * @returns {string} Header Cookie.
 */
function createCookie(role = ROLES.CLIENTE) {
    const token = createSessionToken({
        id: clientUserId,
        email: "cliente@orelle.test",
        role,
    });

    return `orelle_session=${token}`;
}

/**
 * Review finalizada com nota pública para o cliente.
 *
 * @param {object} overrides Campos a substituir no teste.
 * @returns {object} Documento mínimo de review.
 */
function createPublishedReview(overrides = {}) {
    return {
        _id: objectId(reviewId),
        userId: objectId(clientUserId),
        consultationSessionId: objectId(consultationSessionId),
        status: "adjusted",
        reviewedAt: new Date("2026-07-02T10:00:00.000Z"),
        updatedAt: new Date("2026-07-02T10:05:00.000Z"),
        publicInsight: {
            note: "O consultor ajustou a rotina para reduzir produtos incompatíveis.",
            publishedAt: new Date("2026-07-02T10:06:00.000Z"),
        },
        internalNote: "Nota privada do consultor que não pode sair na API.",
        recommendationIds: [],
        ...overrides,
    };
}

describe("MF8 client consultant insights", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("lista insights publicados do cliente autenticado", async () => {
        AiConsultationReview.find.mockReturnValue(
            createReviewQuery([createPublishedReview()]),
        );

        const response = await request(createApp())
            .get("/api/me/ai-consultation-insights")
            .set("Cookie", [createCookie()])
            .expect(200);

        expect(AiConsultationReview.find).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: clientUserId,
                publicInsight: { $ne: null },
            }),
        );
        expect(response.body.insights).toHaveLength(1);
        expect(response.body.insights[0]).toMatchObject({
            id: reviewId,
            consultationSessionId,
            status: "adjusted",
            note: "O consultor ajustou a rotina para reduzir produtos incompatíveis.",
        });
    });

    it("filtra insights pela sessão de consulta indicada", async () => {
        AiConsultationReview.find.mockReturnValue(createReviewQuery([]));

        await request(createApp())
            .get(`/api/me/ai-consultation-insights?consultationSessionId=${consultationSessionId}`)
            .set("Cookie", [createCookie()])
            .expect(200);

        expect(AiConsultationReview.find).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: clientUserId,
                consultationSessionId,
            }),
        );
    });

    it("bloqueia pedidos sem sessão autenticada", async () => {
        await request(createApp())
            .get("/api/me/ai-consultation-insights")
            .expect(401);

        expect(AiConsultationReview.find).not.toHaveBeenCalled();
    });

    it("rejeita identificadores de sessão inválidos", async () => {
        await request(createApp())
            .get("/api/me/ai-consultation-insights?consultationSessionId=abc")
            .set("Cookie", [createCookie()])
            .expect(400);

        expect(AiConsultationReview.find).not.toHaveBeenCalled();
    });

    it("não devolve campos internos da review", async () => {
        AiConsultationReview.find.mockReturnValue(
            createReviewQuery([createPublishedReview()]),
        );

        const response = await request(createApp())
            .get("/api/me/ai-consultation-insights")
            .set("Cookie", [createCookie()])
            .expect(200);

        expect(response.body.insights[0]).not.toHaveProperty("internalNote");
        expect(response.body.insights[0]).not.toHaveProperty("reviewerId");
        expect(response.body.insights[0]).not.toHaveProperty("prompt");
    });
});
```

5. **Explicação do código:** Os testes isolam a query do modelo para confirmar os filtros gerados pelo service. O primeiro teste valida sucesso, o segundo valida o filtro por sessão, o terceiro valida autenticação, o quarto valida query inválida e o quinto valida a fronteira do DTO público.

6. **Erros comuns a evitar:**

   1. Testar apenas o caso feliz.
   2. Validar a ausência de campos internos só visualmente no frontend.
   3. Fazer o teste aceitar qualquer query sem confirmar `userId`.
   4. Esquecer que a ausência de sessão deve responder `401`.
   5. Criar dados de teste com campos públicos que não existem no DTO real.

7. **Como validar o passo:** Executa os testes de API da MF8 e confirma que todos os casos passam.

### Passo 7 - Executar validação final e preparar evidence

1. **Objetivo do passo:** Confirmar que o BK cumpre RF46, RNF31 e a cadeia de dependências da MF8.

2. **Ficheiros/pastas envolvidos:** `apps/api`, `apps/web`, `docs/planificacao/guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md`.

3. **Instruções de implementação:** Depois de implementar os passos anteriores, corre validações de lint, testes e plano. Executar cenarios negativos obrigatorios (minimo 2): pedido sem sessão autenticada e `consultationSessionId` inválido. Guarda os comandos executados e o resultado no PR ou relatório.

4. **Código completo do passo:**

```bash
npm --prefix apps/api test -- --runInBand
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check
```

5. **Explicação do código:** O primeiro comando valida a API, o segundo confirma que o frontend compila, o terceiro valida a estrutura de planificação e o quarto deteta espaços finais ou conflitos no diff.

6. **Erros comuns a evitar:**

   1. Validar apenas o frontend.
   2. Ignorar falhas de autenticação nos testes.
   3. Aceitar uma resposta pública com campos privados.
   4. Não registar o resultado dos comandos.
   5. Alterar BKs vizinhos sem necessidade.

7. **Como validar o passo:** A validação está concluída quando os comandos terminam sem erros ou quando qualquer limitação de ambiente fica documentada com mensagem concreta.

#### Expected results

Depois de concluir este BK:

1. `GET /api/me/ai-consultation-insights` existe e exige sessão autenticada.
2. A query da base de dados filtra por `userId` da sessão.
3. A API só devolve reviews finalizadas e com `publicInsight`.
4. `consultationSessionId` é opcional e validado.
5. A resposta tem `{ insights: [...] }`.
6. Cada insight tem apenas campos públicos: `id`, `consultationSessionId`, `status`, `note`, `publishedAt`, `reviewedAt` e `recommendations`.
7. A página `ClientAiInsightsPage` mostra carregamento, erro, vazio e lista de insights.
8. A aplicação integra a página na área autenticada do cliente.
9. Os testes provam sucesso, filtro, autenticação obrigatória e ausência de campos internos.

#### Critérios de aceite

| Prioridade | Critério |
| --- | --- |
| P1 | O cliente autenticado consegue listar insights públicos do consultor associados às suas sessões. |
| P1 | O backend usa `req.user.id` para ownership e nunca aceita `userId` vindo do browser. |
| P1 | Reviews sem `publicInsight` não aparecem na resposta. |
| P1 | Reviews fora de estado final não aparecem na resposta. |
| P1 | Campos internos da review não aparecem no DTO público. |
| P2 | O filtro opcional `consultationSessionId` é validado como ObjectId. |
| P2 | O frontend mostra estados de carregamento, erro, vazio e sucesso. |
| P2 | A página fica integrada junto da experiência de recomendações do cliente. |
| P2 | Existem testes automatizados para sucesso, filtro, ausência de sessão e query inválida. |
| P3 | As mensagens da interface usam português claro e não prometem resultados clínicos. |

- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada: service/API, integração HTTP focal, build frontend e validação documental.

### Matriz minima de testes por prioridade

| Prioridade | Teste mínimo | Evidência esperada |
| --- | --- | --- |
| P1 | Pedido autenticado lista insights publicados do próprio cliente. | `200` com `insights` e query com `userId` da sessão. |
| P1 | Pedido sem sessão é recusado. | `401` e nenhuma query ao modelo. |
| P1 | DTO não expõe campos internos. | Resposta sem `internalNote`, `reviewerId` ou `prompt`. |
| P2 | Filtro `consultationSessionId` válido restringe a query. | Query contém `consultationSessionId`. |
| P2 | Filtro inválido é rejeitado. | `400` e nenhuma query ao modelo. |
| P2 | Frontend compila com a nova página. | Build do `apps/web` sem erros. |
| P3 | Estados de UI estão legíveis. | Página apresenta carregamento, vazio, erro e lista. |

#### Validação final

Executa:

```bash
npm --prefix apps/api test -- --runInBand
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check
```

Também confirma manualmente:

1. A rota foi registada em `apps/api/src/app.js`.
2. O frontend chama `/me/ai-consultation-insights`.
3. A página não usa credenciais persistidas no browser.
4. A resposta pública não inclui campos internos da review.
5. O BK-MF8-13 pode consumir estados públicos consistentes depois deste BK.

- [ ] Negativos: minimo `2` cenarios com resultado controlado.

### Validacao

Usa esta secção para compatibilidade com validadores legados do projeto. A validação funcional deste BK é a mesma descrita em `#### Validação final`.

#### Evidence para PR/defesa

Inclui no PR ou defesa:

1. Captura ou log de `GET /api/me/ai-consultation-insights` autenticado.
2. Exemplo de resposta com um insight público e recomendações afetadas.
3. Demonstração de que uma review sem `publicInsight` não aparece.
4. Demonstração de que um pedido sem sessão recebe `401`.
5. Demonstração de que `consultationSessionId=abc` recebe `400`.
6. Captura da página `ClientAiInsightsPage` em estado vazio e com dados.
7. Resultado dos testes de API.
8. Resultado do build do frontend.
9. Resultado de `bash scripts/validate-planificacao.sh`.
10. Resultado de `git diff --check`.

#### Handoff

Para o BK-MF8-13, entrega:

1. Endpoint público autenticado `GET /api/me/ai-consultation-insights`.
2. DTO público dos insights do consultor.
3. Página `ClientAiInsightsPage` integrada na área do cliente.
4. Testes que provam ownership e ausência de campos internos.
5. Garantia de que a experiência seguinte pode usar `status`, `note`, `publishedAt`, `reviewedAt` e `recommendations` sem aceder à review privada.

#### Changelog

| Data | Alteração |
| --- | --- |
| 2026-07-02 | Reescrito para incluir implementação completa de RF46: service, validator, controller, rota, frontend, integração, testes e validação. |
| 2026-06-30 | Versão inicial do guia de insights e correções do consultor visíveis para o cliente. |

Nota de compatibilidade do validador local: os marcadores `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite` e `## Evidence para PR/defesa` ficam registados aqui como texto, sem substituir as secções obrigatórias deste guia.
