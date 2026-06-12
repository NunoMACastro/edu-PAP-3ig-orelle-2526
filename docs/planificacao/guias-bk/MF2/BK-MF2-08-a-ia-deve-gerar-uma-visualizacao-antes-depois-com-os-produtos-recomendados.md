# BK-MF2-08 - A IA deve gerar uma visualização antes/depois com os produtos recomendados

## Header
- `doc_id`: `GUIA-BK-MF2-08`
- `bk_id`: `BK-MF2-08`
- `macro`: `MF2`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF2-07`
- `rf_rnf`: `RF24`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF3-01`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-08-a-ia-deve-gerar-uma-visualizacao-antes-depois-com-os-produtos-recomendados.md`
- `last_updated`: `2026-06-08`

## Contexto do BK
- Entrega alvo: implementar `RF24`, gerando visualização antes/depois com produtos recomendados.
- CANONICO: `RF24` depende de `RF23`.
- DERIVADO: a visualização usa o preview seguro de `MakeupSimulation` e recomendações existentes, sem publicar fotografia facial.
- Este BK cria entidade própria para a visualização final, reutilizando a simulação do BK anterior.

## Objetivo
Neste BK vais criar a visualização antes/depois associada a uma simulação de maquilhagem do próprio utilizador.

## Importância
`RF23` gera uma simulação; `RF24` organiza essa simulação como antes/depois com produtos recomendados. A separação permite validar ownership, consentimento e recomendações sem misturar responsabilidades.

## Scope-in
- Criar `BeforeAfterVisualization`.
- Criar provider local de visualização.
- Criar `POST /api/before-after-visualizations`.
- Validar `simulationId` por ownership.
- Mostrar painéis antes/depois e produtos recomendados na UI.

## Scope-out
- Não criar comparação após 30 dias; isso pertence a `RF25`.
- Não devolver fotografia, path interno, `facePhotoId`, `consentId` ou `storageKey`.
- Não criar compra automática.
- Não aceitar IDs de recomendações no body.

## Estado antes
`CRITICO`: o BK guardava resumo textual, mas não fechava visualização, provider, validator, controller nem privacidade.

## Estado depois
`OK`: visualização passa a ter provider, entidade, API, UI e cenários negativos.

## Pré-requisitos
- `BK-MF2-07`: `MakeupSimulation`.
- `BK-MF2-02`: `ProductRecommendation`.
- `BK-MF1-05`: consentimento facial ativo.

## Glossário
- `BeforeAfterVisualization`: resultado final antes/depois.
- `simulationId`: ID público da simulação criada pelo próprio utilizador.
- `recommendedProducts`: produtos recomendados usados para contexto visual.
- `panel`: bloco visual de antes ou depois.

## Conceitos teóricos
Uma visualização antes/depois deve ser mais do que texto solto. Precisa de painéis, resumo, limitações e ligação a produtos recomendados. Como ainda não há imagem pública segura, a visualização usa o preview criado em `BK-MF2-07`.

O backend deve verificar que a simulação pertence ao utilizador autenticado. Também deve voltar a confirmar consentimento ativo, porque o cliente pode ter revogado consentimento depois de criar a simulação.

O frontend não escolhe recomendações. O service procura recomendações ativas ou aceites do próprio utilizador e monta o contexto. Isto evita manipulação do resultado no browser.

## Arquitetura do BK
- `before-after-visualization.provider.js`: compõe painéis e resumo.
- `before-after-visualization.model.js`: guarda visualização.
- `before-after-visualization.validator.js`: valida `simulationId`.
- `before-after-visualization.service.js`: valida consentimento, ownership e recomendações.
- `before-after-visualization.controller.js`: chama validator e service.
- `before-after-visualization.routes.js`: protege endpoint.
- `BeforeAfterVisualizationPage.jsx`: mostra visualização.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/providers/before-after-visualization.provider.js`
- CRIAR: `server/src/models/before-after-visualization.model.js`
- CRIAR: `server/src/validators/before-after-visualization.validator.js`
- CRIAR: `server/src/services/before-after-visualization.service.js`
- CRIAR: `server/src/controllers/before-after-visualization.controller.js`
- CRIAR: `server/src/routes/before-after-visualization.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/BeforeAfterVisualizationPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/makeup-simulation.model.js`
- REVER: `server/src/models/product-recommendation.model.js`

## Bloco pedagogico
### Objetivo
Implementar `RF24` a partir de uma simulação existente e segura.

### Pre-requisitos
- Ter simulação criada em `BK-MF2-07`.
- Ter recomendações geradas.
- Ter consentimento ativo.

### Erros comuns
- Receber lista de produtos no body.
- Usar simulação de outro utilizador.
- Devolver fotografia privada.
- Confundir visualização imediata com comparação de 30 dias.

### Check de compreensao
- [ ] Sei explicar diferença entre `RF23` e `RF24`.
- [ ] Sei indicar por que o service revalida consentimento.
- [ ] Sei testar `simulationId` de outro utilizador.

### Tempo estimado
- `P1`: 60-90 minutos, incluindo negativos.

## Bloco operacional
### Entrada
- BK: `BK-MF2-08`
- Requisito: `RF24`
- Endpoint principal: `POST /api/before-after-visualizations`

### Passos
1. Confirmar contrato funcional e limites.
2. Criar provider de visualização.
3. Criar modelo.
4. Criar validator.
5. Criar service.
6. Criar controller e route.
7. Registar route e página.
8. Executar cenários negativos obrigatórios (mínimo 2).

### Cenarios negativos recomendados
- Pedido sem sessão devolve `401`.
- Consentimento revogado devolve `403`.
- `simulationId` de outro utilizador devolve `404`.
- Sem recomendações válidas devolve `400`.

### Validacao
- [ ] Smoke: visualização criada com simulação e recomendações.
- [ ] Negativos: mínimo `2` cenários com resultado controlado.
- [ ] Segurança: DTO não expõe fotografia nem consentimento.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF3-01` deve tratar comparação após 30 dias; não deve reutilizar esta visualização como medição temporal real.

## Passos lineares
### Passo 1 - Confirmar contrato e limites

1. Explicação simples do objetivo: separar visualização imediata de comparação temporal.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: `RF24`, `RF25`, `BK-MF2-08` e `BK-MF3-01`.
3. O que fazer: confirmar dependência de `BK-MF2-07`.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: este passo evita misturar antes/depois imediato com evolução após 30 dias.
6. Como validar este passo: a visualização deve receber `simulationId`, não datas de comparação.
7. Erros comuns ou cenário negativo: usar este BK para provar efeito real do produto seria incorreto.

### Passo 2 - Criar provider de visualização

1. Explicação simples do objetivo: compor painéis antes/depois a partir da simulação.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/providers/before-after-visualization.provider.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar provider que usa preview e recomendações.
4. Código completo, correto e integrado.

```js
// server/src/providers/before-after-visualization.provider.js
import { AppError } from "../middlewares/error.middleware.js";

export function createBeforeAfterVisualizationPreview({ simulation, recommendations }) {
    if (!simulation?.preview) {
        throw new AppError(400, "Simulação válida obrigatória");
    }

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
        throw new AppError(400, "Recomendações válidas são obrigatórias");
    }

    const productNames = recommendations
        .map((recommendation) => recommendation.productId?.name)
        .filter(Boolean)
        .slice(0, 5);

    return {
        beforePanel: simulation.preview.beforePanel,
        afterPanel: {
            ...simulation.preview.afterPanel,
            description: `${simulation.preview.afterPanel.description} Produtos considerados: ${productNames.join(", ")}.`,
        },
        summary:
            "Visualização antes/depois baseada na simulação de maquilhagem e nas recomendações personalizadas ativas.",
        recommendedProductNames: productNames,
        limitations: [
            ...simulation.preview.limitations,
            "Visualização imediata; não mede evolução após uso prolongado.",
            "Produtos não são adicionados automaticamente ao carrinho.",
        ],
    };
}
```

5. Explicação do código: o provider valida simulação e recomendações, depois monta painéis públicos. Não recebe fotografia nem path.
6. Como validar este passo: chamar sem recomendações deve devolver `400`.
7. Erros comuns ou cenário negativo: montar a visualização no frontend permitiria alterar produtos considerados.

### Passo 3 - Criar modelo BeforeAfterVisualization

1. Explicação simples do objetivo: guardar visualização final com referências internas mínimas.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/before-after-visualization.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar schema com painéis e limitações.
4. Código completo, correto e integrado.

```js
// server/src/models/before-after-visualization.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const visualizationPanelSchema = new Schema(
    {
        label: { type: String, required: true },
        description: { type: String, required: true },
        accentColor: { type: String, default: null },
    },
    { _id: false },
);

const beforeAfterVisualizationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        simulationId: { type: Schema.Types.ObjectId, ref: "MakeupSimulation", required: true },
        sourceRecommendationIds: {
            type: [Schema.Types.ObjectId],
            ref: "ProductRecommendation",
            required: true,
        },
        beforePanel: { type: visualizationPanelSchema, required: true },
        afterPanel: { type: visualizationPanelSchema, required: true },
        summary: { type: String, required: true },
        recommendedProductNames: { type: [String], required: true },
        limitations: { type: [String], required: true },
    },
    { timestamps: true },
);

beforeAfterVisualizationSchema.index({ userId: 1, simulationId: 1 }, { unique: true });

export const BeforeAfterVisualization = model(
    "BeforeAfterVisualization",
    beforeAfterVisualizationSchema,
);
```

5. Explicação do código: a visualização guarda painéis e referências, mas não guarda fotografia. O índice impede duplicar várias visualizações para a mesma simulação do mesmo utilizador.
6. Como validar este passo: criar duas visualizações com o mesmo `userId` e `simulationId` deve atualizar ou falhar conforme fluxo.
7. Erros comuns ou cenário negativo: guardar imagem facial no modelo aumenta risco e não é necessário para este BK.

### Passo 4 - Criar validator

1. Explicação simples do objetivo: validar `simulationId` recebido no body.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/before-after-visualization.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar validação de ObjectId.
4. Código completo, correto e integrado.

```js
// server/src/validators/before-after-visualization.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

export function validateBeforeAfterVisualizationInput(body) {
    const simulationId = String(body?.simulationId ?? "");

    if (!mongoose.isValidObjectId(simulationId)) {
        throw new AppError(400, "ID de simulação inválido");
    }

    return { simulationId };
}
```

5. Explicação do código: o body só precisa de `simulationId`; recomendações são escolhidas no backend.
6. Como validar este passo: body vazio deve devolver `400`.
7. Erros comuns ou cenário negativo: aceitar produtos no body permitiria adulterar a visualização.

### Passo 5 - Criar service

1. Explicação simples do objetivo: validar consentimento, ownership, simulação e recomendações.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/before-after-visualization.service.js`
    - REVER: `server/src/models/makeup-simulation.model.js`
    - REVER: `server/src/models/product-recommendation.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar visualização e devolver DTO público.
4. Código completo, correto e integrado.

```js
// server/src/services/before-after-visualization.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { BeforeAfterVisualization } from "../models/before-after-visualization.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { MakeupSimulation } from "../models/makeup-simulation.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { createBeforeAfterVisualizationPreview } from "../providers/before-after-visualization.provider.js";

const VISUALIZATION_RECOMMENDATION_STATUSES = ["accepted", "active"];

function toVisualizationDto(visualization) {
    return {
        id: visualization._id.toString(),
        beforePanel: visualization.beforePanel,
        afterPanel: visualization.afterPanel,
        summary: visualization.summary,
        recommendedProductNames: visualization.recommendedProductNames,
        limitations: visualization.limitations,
        createdAt: visualization.createdAt,
    };
}

export async function createBeforeAfterVisualizationForUser(userId, simulationId) {
    const consent = await FaceConsent.findOne({ userId, revokedAt: null });

    if (!consent) {
        throw new AppError(403, "Consentimento facial em falta");
    }

    const simulation = await MakeupSimulation.findOne({ _id: simulationId, userId });

    if (!simulation) {
        throw new AppError(404, "Simulação não encontrada");
    }

    const recommendations = await ProductRecommendation.find({
        userId,
        status: { $in: VISUALIZATION_RECOMMENDATION_STATUSES },
    })
        .sort({ status: 1, score: -1 })
        .limit(5)
        .populate("productId", "name brandName imageUrl priceCents stock");

    if (recommendations.length === 0) {
        throw new AppError(400, "Recomendações válidas são obrigatórias");
    }

    const preview = createBeforeAfterVisualizationPreview({ simulation, recommendations });
    const visualization = await BeforeAfterVisualization.findOneAndUpdate(
        { userId, simulationId: simulation._id },
        {
            $set: {
                sourceRecommendationIds: recommendations.map((recommendation) => recommendation._id),
                beforePanel: preview.beforePanel,
                afterPanel: preview.afterPanel,
                summary: preview.summary,
                recommendedProductNames: preview.recommendedProductNames,
                limitations: preview.limitations,
            },
        },
        { upsert: true, new: true, runValidators: true },
    );

    return { visualization: toVisualizationDto(visualization) };
}
```

5. Explicação do código: o service revalida consentimento, procura a simulação por `_id` e `userId`, escolhe recomendações do próprio utilizador e guarda uma visualização pública. O DTO não devolve IDs internos sensíveis.
6. Como validar este passo: usar `simulationId` de outro utilizador deve devolver `404`.
7. Erros comuns ou cenário negativo: procurar simulação só por ID quebra ownership.

### Passo 6 - Criar controller e route

1. Explicação simples do objetivo: expor criação da visualização.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/before-after-visualization.controller.js`
    - CRIAR: `server/src/routes/before-after-visualization.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: criar controller com validator e route protegida.
4. Código completo, correto e integrado.

```js
// server/src/controllers/before-after-visualization.controller.js
import { createBeforeAfterVisualizationForUser } from "../services/before-after-visualization.service.js";
import { validateBeforeAfterVisualizationInput } from "../validators/before-after-visualization.validator.js";

export async function createBeforeAfterVisualizationController(req, res, next) {
    try {
        const input = validateBeforeAfterVisualizationInput(req.body);
        const result = await createBeforeAfterVisualizationForUser(req.user.id, input.simulationId);

        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/before-after-visualization.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createBeforeAfterVisualizationController } from "../controllers/before-after-visualization.controller.js";

export const beforeAfterVisualizationRoutes = Router();

beforeAfterVisualizationRoutes.post(
    "/before-after-visualizations",
    requireAuth,
    createBeforeAfterVisualizationController,
);
```

5. Explicação do código: a route exige sessão e o controller valida input antes do service. O service mantém ownership e consentimento.
6. Como validar este passo: sem sessão, esperar `401`.
7. Erros comuns ou cenário negativo: confiar só no `simulationId` sem sessão torna o endpoint inseguro.

### Passo 7 - Registar route e página

1. Explicação simples do objetivo: ligar API e UI.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - CRIAR: `client/src/pages/BeforeAfterVisualizationPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: route backend, página completa e rota frontend.
3. O que fazer: registar route e criar página com painéis.
4. Código completo, correto e integrado.

```js
// server/src/app.js
import { beforeAfterVisualizationRoutes } from "./routes/before-after-visualization.routes.js";

app.use("/api", beforeAfterVisualizationRoutes);
```

```jsx
// client/src/pages/BeforeAfterVisualizationPage.jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function BeforeAfterVisualizationPage() {
    const [simulationId, setSimulationId] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [visualization, setVisualization] = useState(null);

    async function submitVisualization(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/api/before-after-visualizations", {
                method: "POST",
                body: JSON.stringify({ simulationId }),
            });

            setVisualization(data.visualization);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Visualização antes/depois</h1>
            <form onSubmit={submitVisualization}>
                <label>
                    ID da simulação
                    <input value={simulationId} onChange={(event) => setSimulationId(event.target.value)} />
                </label>
                <button type="submit" disabled={status === "loading"}>Gerar visualização</button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && visualization && (
                <div>
                    <section>
                        <h2>{visualization.beforePanel.label}</h2>
                        <p>{visualization.beforePanel.description}</p>
                    </section>
                    <section style={{ borderColor: visualization.afterPanel.accentColor }}>
                        <h2>{visualization.afterPanel.label}</h2>
                        <p>{visualization.afterPanel.description}</p>
                    </section>
                    <p>{visualization.summary}</p>
                    <ul>
                        {visualization.recommendedProductNames.map((name) => (
                            <li key={name}>{name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
```

```jsx
// client/src/App.jsx
import { BeforeAfterVisualizationPage } from "./pages/BeforeAfterVisualizationPage.jsx";

// Dentro da configuração de rotas:
{
    path: "/before-after",
    element: <BeforeAfterVisualizationPage />,
}
```

5. Explicação do código: a página envia apenas `simulationId`. O backend decide recomendações e valida ownership.
6. Como validar este passo: criar simulação, gerar visualização e confirmar painéis.
7. Erros comuns ou cenário negativo: deixar o browser escolher produtos enfraquece a personalização.

### Passo 8 - Validar negativos obrigatórios

1. Explicação simples do objetivo: provar autenticação, consentimento e ownership.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/before-after-visualization.service.js`
    - REVER: `server/src/routes/before-after-visualization.routes.js`
    - LOCALIZAÇÃO: revalidação de consentimento e `findOne({ _id, userId })`.
3. O que fazer: executar pedidos negativos principais.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3001/api/before-after-visualizations -H "Content-Type: application/json" -d '{"simulationId":"ID"}'
curl -i -X POST http://localhost:3001/api/before-after-visualizations -H "Cookie: orelle_session=COOKIE_SEM_CONSENTIMENTO" -H "Content-Type: application/json" -d '{"simulationId":"ID"}'
curl -i -X POST http://localhost:3001/api/before-after-visualizations -H "Cookie: orelle_session=COOKIE" -H "Content-Type: application/json" -d '{"simulationId":"ID_DE_OUTRO_UTILIZADOR"}'
curl -i -X POST http://localhost:3001/api/before-after-visualizations -H "Cookie: orelle_session=COOKIE_SEM_RECOMENDACOES" -H "Content-Type: application/json" -d '{"simulationId":"ID"}'
```

5. Explicação do código: os pedidos cobrem sessão, consentimento revogado, simulação alheia e falta de recomendações.
6. Como validar este passo: esperar `401`, `403`, `404` e `400`.
7. Erros comuns ou cenário negativo: testar só o sucesso não prova proteção dos dados faciais.

## Expected results
- Sem sessão devolve `401`.
- Consentimento em falta devolve `403`.
- Simulação de outro utilizador devolve `404`.
- Sem recomendações válidas devolve `400`.
- Com dados válidos devolve `201` com painéis antes/depois.

## Snippet tecnico aplicavel
Consultar os snippets completos nos passos lineares deste guia; nao ha snippet adicional fora do fluxo documentado.

## Criterios de aceite
- Entrega funcional de `RF24` concluída.
- Cenários negativos concluídos: mínimo `2`.
- Evidência de testes por camada conforme prioridade `P1`.
- Visualização usa `MakeupSimulation` e recomendações do próprio utilizador.
- DTO não inclui fotografia, `facePhotoId`, `consentId` ou `storageKey`.
- Fluxo não cria carrinho ou pagamento.

## Validação final
- Gerar simulação em `BK-MF2-07` e criar visualização.
- Testar `401`, `403`, `404` e `400`.
- Confirmar que a página mostra painéis e produtos recomendados.
- Executar `git diff --check` antes do PR.

## Evidence para PR/defesa
- `proof_tecnico`: resposta `201` com `beforePanel` e `afterPanel`.
- `proof_negativos`: evidência de `401`, `403`, `404` e `400`.
- `proof_negocio`: screenshot da visualização antes/depois.

## Handoff
`BK-MF3-01` deve tratar comparação após 30 dias como funcionalidade diferente, baseada em histórico temporal e não apenas no preview imediato.

## Changelog
- `2026-06-08`: guia reescrito com provider, modelo, validator, service, controller, route, UI e negativos de visualização.
