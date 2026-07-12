# BK-MF2-04 - Registar feedback sobre recomendações úteis ou não relevantes, sem treino automático

## Header
- `doc_id`: `GUIA-BK-MF2-04`
- `bk_id`: `BK-MF2-04`
- `macro`: `MF2`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P2`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF2-02`
- `rf_rnf`: `RF20`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-05`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-04-o-utilizador-pode-marcar-recomendacoes-como-uteis-ou-nao-relevantes-para-treinar-o-modelo.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico ativo — 2026-07-11:** este BK atua sobre recomendações pertencentes a um `FaceReport` v2. O cliente marca `util` ou `nao_relevante` nos cards do relatório em `apps/web/src/features/consultation/ConsultationReportPage.jsx`; a escrita continua protegida por sessão e ownership no backend e nunca desencadeia treino automático. O endpoint de feedback pode conservar `recommendationId`, mas não cria, regenera nem lista recomendações fora da consulta.

> **Substituição obrigatória:** qualquer bloco inferior que mande criar uma página independente `ProductRecommendationsPage`, gerar recomendações diretamente ou navegar para uma rota paralela de recomendações é material pedagógico anterior e **não deve ser executado**. A API devolve recomendações apenas como parte do relatório teaser/completo autorizado; a referência atual é o [plano canónico da consulta OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

### Handoff atual do BK

- EDITAR: `apps/api/src/services/recommendation.service.js` apenas para validar/persistir feedback da recomendação já existente.
- EDITAR: `apps/api/src/routes/recommendation.routes.js` apenas para a mutação autenticada de feedback, sem endpoint de geração.
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx` para apresentar o estado e preservar o conteúdo carregado perante erro.
- TESTAR: ownership, enum inválida, replay e garantia de que o feedback não altera `machineResult`, `humanOverride`, preços, stock ou catálogo.

### Critérios de aceitação ativos

- O feedback só é apresentado para recomendações recebidas no relatório autorizado.
- A mutação aceita apenas `util` ou `nao_relevante`, filtra pelo utilizador autenticado e não recebe `userId` do browser.
- Uma falha mantém o relatório e o estado anterior visíveis; duplo clique não gera efeitos divergentes.
- Não existe CTA, rota ou pedido que gere recomendações fora de `generate_report`.

<details class="historical-archive">
<summary><strong>Anexo histórico da arquitetura anterior — não executar</strong></summary>

> Todo o conteúdo restante deste ficheiro, incluindo imperativos, código, curls, checklists, validação final e handoff, é preservado apenas para rastreabilidade. Não constitui instrução pedagógica nem critério de aceitação atual.

## Contexto do BK
- Entrega alvo: implementar `RF20`, permitindo feedback `util` ou `nao_relevante` sobre recomendações.
- CANONICO: `RF20` depende de `RF18`.
- DERIVADO: nesta fase, o feedback é registado como sinal persistido; não há treino automático de qualquer modelo.
- Este BK usa `ProductRecommendation.feedback`, criado em `BK-MF2-02`.

## Objetivo
Neste BK vais criar a API e os botões de feedback para recomendações já geradas pelo utilizador autenticado.

## Importância
O feedback melhora a qualidade futura da recomendação, mas só é útil se for validado no backend e ligado à recomendação correta. O cliente não pode marcar recomendações de outro utilizador.

## Scope-in
- Criar validator de feedback.
- Criar service para atualizar recomendação do próprio utilizador.
- Criar controller e route `POST /api/recommendations/:recommendationId/feedback`.
- Atualizar a página de recomendações com botões de feedback.

## Scope-out
- Não treinar automaticamente providers internos ou externos.
- Não aceitar valores livres.
- Não apagar recomendações.
- Não permitir feedback anónimo.

## Estado antes
`PARCIAL`: havia ideia de validator e service, mas faltavam controller, route, DTO final, integração na UI e negativos de ownership.

## Estado depois
`OK`: feedback fica validado, persistido, protegido por sessão e integrado nos cards de recomendação.

## Pré-requisitos
- `BK-MF2-02`: modelo `ProductRecommendation`.
- `BK-MF2-03`: recomendações com motivo.
- `BK-MF0-02`: `requireAuth`.

## Glossário
- `feedback`: sinal enviado pelo cliente sobre a utilidade da recomendação.
- `util`: o cliente achou a recomendação adequada.
- `nao_relevante`: o cliente não achou a recomendação adequada.
- `ownership`: filtro por `userId` no backend.

## Conceitos teóricos
Feedback é uma escrita sobre uma entidade existente. Por isso precisa de duas validações: o valor enviado deve pertencer à lista permitida e a recomendação deve pertencer ao utilizador autenticado.

O frontend deve apresentar botões claros, mas a proteção real fica no backend. Mesmo que alguém altere o ID no browser, o service procura por `_id` e `userId` ao mesmo tempo. Se não encontrar, devolve `404`, evitando revelar se a recomendação existe para outra pessoa.

Este feedback pode alimentar métricas e avaliação futura, como taxa de recomendações úteis, mas não deve ser apresentado como treino real de IA nesta fase.

## Arquitetura do BK
- `recommendation-feedback.validator.js`: valida params e body.
- `recommendation.service.js`: adiciona `submitRecommendationFeedback`.
- `recommendation.controller.js`: adiciona controller de feedback.
- `recommendation.routes.js`: adiciona route protegida.
- `ProductRecommendationsPage.jsx`: adiciona botões por card.

## Ficheiros a criar/editar/rever
- CRIAR: `apps/api/src/validators/recommendation-feedback.validator.js`
- EDITAR: `apps/api/src/services/recommendation.service.js`
- EDITAR: `apps/api/src/controllers/recommendation.controller.js`
- EDITAR: `apps/api/src/routes/recommendation.routes.js`
- EDITAR: `apps/web/src/pages/ProductRecommendationsPage.jsx`
- REVER: `apps/api/src/models/product-recommendation.model.js`

## Bloco pedagogico
### Objetivo
Implementar `RF20` como registo seguro de feedback.

### Pre-requisitos
- Ter recomendações geradas.
- Saber o ID público da recomendação.
- Ter sessão ativa.

### Erros comuns
- Aceitar texto livre como feedback.
- Procurar recomendação apenas por `_id`.
- Criar endpoint sem `requireAuth`.
- Prometer treino automático sem esse fluxo existir.

### Check de compreensao
- [ ] Sei indicar os dois valores aceites.
- [ ] Sei explicar por que o service filtra `_id` e `userId`.
- [ ] Sei testar recomendação de outro utilizador.

### Tempo estimado
- `P2`: 45-75 minutos, incluindo negativo de ownership.

## Bloco operacional
### Entrada
- BK: `BK-MF2-04`
- Requisito: `RF20`
- Endpoint principal: `POST /api/recommendations/:recommendationId/feedback`

### Passos
1. Confirmar contrato funcional e limites.
2. Criar validator.
3. Atualizar service.
4. Atualizar controller e route.
5. Atualizar UI.
6. Executar cenários negativos obrigatórios (mínimo 1).

### Cenarios negativos recomendados
- Pedido sem sessão devolve `401`.
- Valor fora da enum devolve `400`.
- Recomendação de outro utilizador devolve `404`.

### Validacao
- [ ] Smoke: feedback `util` atualiza recomendação.
- [ ] Negativos: mínimo `1` cenários com resultado controlado.
- [ ] Segurança: não é possível marcar recomendação de outro utilizador.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF2-05` pode usar recomendações `active` e `accepted` para sugerir rotina.

## Passos lineares
### Passo 1 - Confirmar contrato e limites

1. Explicação simples do objetivo: separar feedback de treino automático externo.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: linhas de `RF20` e `BK-MF2-04`.
3. O que fazer: confirma que o BK depende de recomendações já geradas.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: o requisito pede marcação de utilidade; não define pipeline externo.
6. Como validar este passo: o PR deve mostrar escrita em `ProductRecommendation.feedback`.
7. Erros comuns ou cenário negativo: vender este feedback como treino real sem implementação correspondente.

### Passo 2 - Criar validator de feedback

1. Explicação simples do objetivo: aceitar apenas IDs válidos e valores permitidos.
2. Ficheiros envolvidos.
    - CRIAR: `apps/api/src/validators/recommendation-feedback.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: validar params e body antes de chamar o service.
4. Código completo, correto e integrado.

```js
// apps/api/src/validators/recommendation-feedback.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const FEEDBACK_VALUES = new Set(["util", "nao_relevante"]);

export function validateRecommendationFeedbackParams(params) {
    if (!mongoose.isValidObjectId(params.recommendationId)) {
        throw new AppError(400, "ID de recomendação inválido");
    }

    return {
        recommendationId: params.recommendationId,
    };
}

export function validateRecommendationFeedbackInput(body) {
    const value = String(body?.value ?? "");

    if (!FEEDBACK_VALUES.has(value)) {
        throw new AppError(400, "Feedback deve ser util ou nao_relevante");
    }

    return { value };
}
```

5. Explicação do código: o validator impede IDs malformados e valores livres. Isto protege o service de receber dados fora do contrato.
6. Como validar este passo: enviar `{ "value": "talvez" }` deve devolver `400`.
7. Erros comuns ou cenário negativo: aceitar qualquer string dificulta métricas e abre margem para conteúdo impróprio.

### Passo 3 - Atualizar service

1. Explicação simples do objetivo: gravar feedback apenas na recomendação do próprio utilizador.
2. Ficheiros envolvidos.
    - EDITAR: `apps/api/src/services/recommendation.service.js`
    - LOCALIZAÇÃO: adicionar função `submitRecommendationFeedback`.
3. O que fazer: procurar recomendação por `_id` e `userId`, atualizar feedback e status.
4. Código completo, correto e integrado.

```js
// apps/api/src/services/recommendation.service.js
export async function submitRecommendationFeedback(userId, recommendationId, input) {
    const recommendation = await ProductRecommendation.findOne({
        _id: recommendationId,
        userId,
    }).populate("productId", "name brandName imageUrl priceCents stock");

    if (!recommendation) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    recommendation.feedback = {
        value: input.value,
        submittedAt: new Date(),
    };

    recommendation.status = input.value === "util" ? "accepted" : "dismissed";
    await recommendation.save();

    return {
        recommendation: toRecommendationDto(recommendation, recommendation.productId),
    };
}
```

5. Explicação do código: o filtro `{ _id, userId }` aplica ownership. O status passa a `accepted` quando o feedback é útil e `dismissed` quando não é relevante, preparando a rotina do próximo BK.
6. Como validar este passo: marcar recomendação de outro utilizador deve devolver `404`.
7. Erros comuns ou cenário negativo: usar `findById` permitiria atualizar recomendação alheia se o ID fosse conhecido.

### Passo 4 - Atualizar controller e route

1. Explicação simples do objetivo: ligar validator e service ao endpoint.
2. Ficheiros envolvidos.
    - EDITAR: `apps/api/src/controllers/recommendation.controller.js`
    - EDITAR: `apps/api/src/routes/recommendation.routes.js`
    - LOCALIZAÇÃO: imports e handler de feedback.
3. O que fazer: adicionar controller e route protegida.
4. Código completo, correto e integrado.

```js
// apps/api/src/controllers/recommendation.controller.js
import { submitRecommendationFeedback } from "../services/recommendation.service.js";
import {
    validateRecommendationFeedbackInput,
    validateRecommendationFeedbackParams,
} from "../validators/recommendation-feedback.validator.js";

export async function submitRecommendationFeedbackController(req, res, next) {
    try {
        const params = validateRecommendationFeedbackParams(req.params);
        const input = validateRecommendationFeedbackInput(req.body);
        const result = await submitRecommendationFeedback(
            req.user.id,
            params.recommendationId,
            input,
        );

        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/recommendation.routes.js
import { submitRecommendationFeedbackController } from "../controllers/recommendation.controller.js";

recommendationRoutes.post(
    "/recommendations/:recommendationId/feedback",
    requireAuth,
    submitRecommendationFeedbackController,
);
```

5. Explicação do código: a route exige sessão e o controller valida antes do service. O status HTTP `200` é adequado porque atualiza uma recomendação existente.
6. Como validar este passo: enviar feedback válido deve devolver recomendação atualizada.
7. Erros comuns ou cenário negativo: validar só no frontend não impede chamadas diretas à API.

### Passo 5 - Atualizar UI com botões de feedback

1. Explicação simples do objetivo: permitir feedback diretamente no card.
2. Ficheiros envolvidos.
    - EDITAR: `apps/web/src/pages/ProductRecommendationsPage.jsx`
    - LOCALIZAÇÃO: componente de página e card de recomendação.
3. O que fazer: criar função de envio e botões `Útil` / `Não relevante`.
4. Código completo, correto e integrado.

```jsx
// apps/web/src/pages/ProductRecommendationsPage.jsx
async function submitFeedback(recommendationId, value) {
    setStatus("loading");
    setError("");

    try {
        const data = await apiRequest(`/api/recommendations/${recommendationId}/feedback`, {
            method: "POST",
            body: JSON.stringify({ value }),
        });

        setRecommendations((current) =>
            current.map((recommendation) =>
                recommendation.id === recommendationId
                    ? data.recommendation
                    : recommendation,
            ),
        );
        setStatus("success");
    } catch (err) {
        setError(err.message);
        setStatus("error");
    }
}

// Dentro do card:
<button type="button" onClick={() => submitFeedback(recommendation.id, "util")}>
    Útil
</button>
<button type="button" onClick={() => submitFeedback(recommendation.id, "nao_relevante")}>
    Não relevante
</button>
{recommendation.feedback?.value && (
    <p>Feedback registado: {recommendation.feedback.value.replace("_", " ")}</p>
)}
```

5. Explicação do código: a página envia apenas o valor permitido e o ID da recomendação. O backend confirma ownership. O estado local é atualizado com a resposta do servidor.
6. Como validar este passo: clicar em `Útil` deve atualizar o card sem recarregar a página.
7. Erros comuns ou cenário negativo: pedir ao utilizador para escrever o ID manualmente torna o fluxo frágil e pouco seguro.

### Passo 6 - Validar negativos obrigatórios

1. Explicação simples do objetivo: provar que feedback inválido ou alheio falha.
2. Ficheiros envolvidos.
    - REVER: `apps/api/src/validators/recommendation-feedback.validator.js`
    - REVER: `apps/api/src/services/recommendation.service.js`
    - LOCALIZAÇÃO: validator e filtro `{ _id, userId }`.
3. O que fazer: executar pedidos com valor inválido e recomendação de outro utilizador.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3001/api/recommendations/ID/feedback -H "Content-Type: application/json" -d '{"value":"util"}'
curl -i -X POST http://localhost:3001/api/recommendations/ID/feedback -H "Cookie: orelle_session=COOKIE" -H "Content-Type: application/json" -d '{"value":"talvez"}'
curl -i -X POST http://localhost:3001/api/recommendations/ID_DE_OUTRO_UTILIZADOR/feedback -H "Cookie: orelle_session=COOKIE" -H "Content-Type: application/json" -d '{"value":"util"}'
```

5. Explicação do código: os pedidos cobrem ausência de sessão, enum inválida e ownership.
6. Como validar este passo: esperar `401`, `400` e `404`.
7. Erros comuns ou cenário negativo: devolver `403` para recomendação alheia pode revelar que o ID existe.

## Expected results
- Feedback `util` devolve `200` e status `accepted`.
- Feedback `nao_relevante` devolve `200` e status `dismissed`.
- Valor inválido devolve `400`.
- Recomendação de outro utilizador devolve `404`.

## Snippet tecnico aplicavel
Consultar os snippets completos nos passos lineares deste guia; nao ha snippet adicional fora do fluxo documentado.

## Criterios de aceite
- Entrega funcional de `RF20` concluída.
- Cenários negativos concluídos: mínimo `1`.
- Evidência de testes por camada conforme prioridade `P2`.
- Feedback limitado a `util` e `nao_relevante`.
- Ownership aplicado no backend.
- UI integrada nos cards de recomendações.

## Validação final
- Testar botões na página de recomendações.
- Testar `401`, `400` e `404` por API.
- Confirmar que o feedback não altera preço, produto ou análise.
- Executar `git diff --check` antes do PR.

## Evidence para PR/defesa
- `proof_tecnico`: resposta `200` com recomendação atualizada.
- `proof_negativos`: evidência de `401`, `400` e `404`.
- `proof_negocio`: card com feedback registado.

## Handoff
`BK-MF2-05` pode priorizar recomendações `accepted` e ignorar `dismissed` ao sugerir rotina.

## Changelog
- `2026-06-08`: guia reescrito com validator, service, controller, route, UI e negativos de feedback.

</details>
