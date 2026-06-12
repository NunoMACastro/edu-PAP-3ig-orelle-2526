# BK-MF2-05 - O sistema deve sugerir rotinas diárias manhã/noite com base nos produtos adquiridos

## Header
- `doc_id`: `GUIA-BK-MF2-05`
- `bk_id`: `BK-MF2-05`
- `macro`: `MF2`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF2-02`
- `rf_rnf`: `RF21`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-06`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-05-o-sistema-deve-sugerir-rotinas-diarias-manha-noite-com-base-nos-produtos-adquiridos.md`
- `last_updated`: `2026-06-08`

## Contexto do BK
- Entrega alvo: implementar `RF21`, sugerindo rotina diária de manhã e noite.
- CANONICO: `RF21` fala em produtos adquiridos.
- DERIVADO: compras reais começam na MF3; nesta MF, a rotina usa recomendações `active` e `accepted` e grava `source: "recommendations"`.
- O modelo já prepara `source: "purchases"` para a fase de encomendas sem chamar compras inexistentes.

## Objetivo
Neste BK vais criar a rotina diária do cliente com base nas recomendações disponíveis, mantendo explícita a origem dos dados.

## Importância
Rotina é uma funcionalidade de orientação. Se o BK fingir que já há compras reais, cria drift com a documentação. Ao marcar a origem como `recommendations`, a aplicação fica funcional nesta fase e pronta para ser ligada a compras depois da MF3.

## Scope-in
- Criar `DailyRoutine`.
- Criar `POST /api/me/daily-routine/generate`.
- Criar `GET /api/me/daily-routine`.
- Gerar passos de manhã e noite a partir de recomendações do próprio utilizador.
- Mostrar a rotina numa página React.

## Scope-out
- Não criar carrinho, encomenda ou pagamento.
- Não consultar uma entidade de compras antes da MF3.
- Não usar recomendações `dismissed`.
- Não prometer resultado clínico.

## Estado antes
`PARCIAL`: o BK já tinha origem explícita, controller, route, DTO e UI, mas o service aceitava uma única recomendação válida e podia gerar rotina apenas de manhã.

## Estado depois
`OK`: origem fica explícita, rotina exige passos de manhã e noite e o handoff para compras fica fechado.

## Pré-requisitos
- `BK-MF2-02`: recomendações geradas.
- `BK-MF2-04`: feedback pode marcar recomendações como `accepted` ou `dismissed`.
- `BK-MF0-02`: sessão autenticada.

## Glossário
- `DailyRoutine`: rotina guardada para o cliente.
- `period`: período da rotina, `manha` ou `noite`.
- `source`: origem da rotina, `recommendations` nesta fase.
- `productSnapshot`: cópia pública mínima do produto no momento da geração.

## Conceitos teóricos
Uma rotina é uma composição de recomendações, não uma compra. Na MF2 ainda não há encomendas, por isso a app não consegue saber produtos adquiridos. A solução correta é ser explícita: gerar a rotina a partir de recomendações e guardar a origem.

No backend, o service escolhe recomendações do próprio utilizador, ignora as rejeitadas e cria passos por período. No frontend, a página apenas pede a geração e mostra o resultado.

Este BK prepara alertas futuros de rotina. Para isso, cada passo precisa de `period`, `title`, `instructions` e produto associado. Assim `BK-MF4-05` consegue usar os períodos sem reescrever a rotina.

## Arquitetura do BK
- `daily-routine.model.js`: guarda rotina e passos.
- `daily-routine.service.js`: cria e lista rotina.
- `daily-routine.controller.js`: expõe geração e consulta.
- `daily-routine.routes.js`: protege endpoints.
- `DailyRoutinePage.jsx`: mostra rotina por manhã/noite.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/daily-routine.model.js`
- CRIAR: `server/src/services/daily-routine.service.js`
- CRIAR: `server/src/controllers/daily-routine.controller.js`
- CRIAR: `server/src/routes/daily-routine.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/DailyRoutinePage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/product-recommendation.model.js`

## Bloco pedagogico
### Objetivo
Implementar `RF21` sem inventar compras antes da fase correta.

### Pre-requisitos
- Ter recomendações geradas.
- Ter pelo menos duas recomendações válidas para preencher manhã e noite.
- Ter feedback opcional de recomendações.
- Saber que `dismissed` não entra na rotina.

### Erros comuns
- Chamar uma coleção de compras que ainda não existe.
- Usar recomendações rejeitadas.
- Criar rotina no frontend.
- Misturar rotina com checkout.

### Check de compreensao
- [ ] Sei explicar a decisão `DERIVADO`.
- [ ] Sei indicar a origem `recommendations`.
- [ ] Sei testar utilizador sem recomendações válidas.

### Tempo estimado
- `P1`: 60-90 minutos, incluindo negativos.

## Bloco operacional
### Entrada
- BK: `BK-MF2-05`
- Requisito: `RF21`
- Endpoint principal: `POST /api/me/daily-routine/generate`

### Passos
1. Confirmar contrato funcional e decisão de origem.
2. Criar modelo `DailyRoutine`.
3. Criar service.
4. Criar controller e route.
5. Registar route na app.
6. Criar página React.
7. Executar cenários negativos obrigatórios (mínimo 2).

### Cenarios negativos recomendados
- Pedido sem sessão devolve `401`.
- Utilizador sem recomendações válidas devolve `400`.
- Utilizador com só uma recomendação válida devolve `400`.
- Recomendações `dismissed` não entram na rotina.

### Validacao
- [ ] Smoke: rotina gerada com passos de manhã e noite.
- [ ] Negativos: mínimo `2` cenários com resultado controlado.
- [ ] Segurança: rotina pertence ao próprio utilizador.
- [ ] Drift: origem da rotina fica explícita.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
Depois da MF3, o service pode trocar a origem para `purchases` sem mudar a UI nem os períodos.

## Passos lineares
### Passo 1 - Confirmar contrato e decisão de origem

1. Explicação simples do objetivo: resolver a diferença entre `RF21` e a ausência de compras na MF2.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF3/`
    - LOCALIZAÇÃO: `RF21`, `RF26`, `RF27` e `RF28`.
3. O que fazer: registar que a primeira versão usa recomendações e não compras.
4. Código completo, correto e integrado.

```text
DERIVADO: source="recommendations" até existirem compras reais na MF3.
```

5. Explicação do código: a marca `DERIVADO` documenta a decisão técnica e evita fingir uma entidade ainda não criada.
6. Como validar este passo: o modelo deve incluir `source` e não deve importar compras.
7. Erros comuns ou cenário negativo: consultar compras inexistentes deixa a aplicação sem compilar.

### Passo 2 - Criar modelo DailyRoutine

1. Explicação simples do objetivo: guardar rotina por utilizador e origem.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/daily-routine.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar schema com passos por período e snapshots públicos.
4. Código completo, correto e integrado.

```js
// server/src/models/daily-routine.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const routineProductSnapshotSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        brandName: { type: String, required: true },
        imageUrl: { type: String, required: true },
        priceCents: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);

const routineStepSchema = new Schema(
    {
        period: { type: String, enum: ["manha", "noite"], required: true },
        order: { type: Number, required: true, min: 1 },
        title: { type: String, required: true },
        instructions: { type: String, required: true },
        reason: { type: String, required: true },
        product: { type: routineProductSnapshotSchema, required: true },
    },
    { _id: false },
);

const dailyRoutineSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        source: {
            type: String,
            enum: ["recommendations", "purchases"],
            required: true,
            default: "recommendations",
        },
        sourceRecommendationIds: {
            type: [Schema.Types.ObjectId],
            ref: "ProductRecommendation",
            default: [],
        },
        sourcePurchaseIds: {
            type: [Schema.Types.ObjectId],
            default: [],
        },
        steps: {
            type: [routineStepSchema],
            required: true,
        },
    },
    { timestamps: true },
);

dailyRoutineSchema.index({ userId: 1, source: 1 }, { unique: true });

export const DailyRoutine = model("DailyRoutine", dailyRoutineSchema);
```

5. Explicação do código: `source` guarda a origem real da rotina. `productSnapshot` evita depender de populate para mostrar dados públicos e não duplica informação sensível.
6. Como validar este passo: tentar criar rotina sem `steps` deve falhar.
7. Erros comuns ou cenário negativo: guardar documentos completos de produto aumenta acoplamento e exposição.

### Passo 3 - Criar service

1. Explicação simples do objetivo: gerar rotina a partir de recomendações válidas.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/daily-routine.service.js`
    - REVER: `server/src/models/product-recommendation.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: procurar recomendações do utilizador e criar passos de manhã/noite.
4. Código completo, correto e integrado.

```js
// server/src/services/daily-routine.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { DailyRoutine } from "../models/daily-routine.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";

const VALID_ROUTINE_STATUSES = ["accepted", "active"];
const REQUIRED_PERIODS = ["manha", "noite"];

function toProductSnapshot(product) {
    return {
        productId: product._id,
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
    };
}

function buildStep(recommendation, period, order) {
    const product = recommendation.productId;
    const periodLabel = period === "manha" ? "Rotina de manhã" : "Rotina de noite";

    return {
        period,
        order,
        title: `${periodLabel}: ${product.name}`,
        instructions:
            period === "manha"
                ? "Aplicar após limpeza suave e antes de proteção solar escolhida pelo cliente."
                : "Aplicar após remover impurezas do dia, respeitando tolerância da pele.",
        reason: recommendation.explanation,
        product: toProductSnapshot(product),
    };
}

function toDailyRoutineDto(routine) {
    return {
        id: routine._id.toString(),
        source: routine.source,
        steps: routine.steps,
        createdAt: routine.createdAt,
        updatedAt: routine.updatedAt,
    };
}

function hasRequiredPeriods(steps) {
    const periods = new Set(steps.map((step) => step.period));
    return REQUIRED_PERIODS.every((period) => periods.has(period));
}

export async function generateDailyRoutineForUser(userId) {
    const recommendations = await ProductRecommendation.find({
        userId,
        status: { $in: VALID_ROUTINE_STATUSES },
    })
        .sort({ status: 1, score: -1, createdAt: -1 })
        .limit(6)
        .populate("productId", "name brandName imageUrl priceCents stock");

    const availableRecommendations = recommendations.filter(
        (recommendation) => recommendation.productId?.stock > 0,
    );

    if (availableRecommendations.length < REQUIRED_PERIODS.length) {
        throw new AppError(
            400,
            "Pelo menos duas recomendações válidas são obrigatórias para gerar rotina de manhã e noite",
        );
    }

    const steps = availableRecommendations.map((recommendation, index) =>
        buildStep(recommendation, index % 2 === 0 ? "manha" : "noite", index + 1),
    );

    if (!hasRequiredPeriods(steps)) {
        throw new AppError(400, "A rotina precisa de passos de manhã e noite");
    }

    const routine = await DailyRoutine.findOneAndUpdate(
        { userId, source: "recommendations" },
        {
            $set: {
                steps,
                sourceRecommendationIds: availableRecommendations.map(
                    (recommendation) => recommendation._id,
                ),
                sourcePurchaseIds: [],
            },
        },
        { upsert: true, new: true, runValidators: true },
    );

    return { routine: toDailyRoutineDto(routine) };
}

export async function getMyDailyRoutine(userId) {
    const routine = await DailyRoutine.findOne({ userId }).sort({ updatedAt: -1 });

    if (!routine) {
        return { routine: null };
    }

    return { routine: toDailyRoutineDto(routine) };
}
```

5. Explicação do código: o service só usa recomendações do próprio utilizador, ignora as rejeitadas e remove produtos sem stock. Também exige recomendações suficientes para cobrir `manha` e `noite`, porque `RF21` não é cumprido com apenas um período. A rotina fica persistida por origem, permitindo atualizar a mesma rotina sem duplicar documentos.
6. Como validar este passo: com uma recomendação `dismissed`, confirmar que ela não entra em `steps`; com só uma recomendação válida, confirmar erro `400`.
7. Erros comuns ou cenário negativo: usar qualquer recomendação sem filtrar status cria rotina com produtos rejeitados; aceitar só um passo cria rotina incompleta.

### Passo 4 - Criar controller e route

1. Explicação simples do objetivo: expor geração e consulta da rotina.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/daily-routine.controller.js`
    - CRIAR: `server/src/routes/daily-routine.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: criar controller e route com `requireAuth`.
4. Código completo, correto e integrado.

```js
// server/src/controllers/daily-routine.controller.js
import {
    generateDailyRoutineForUser,
    getMyDailyRoutine,
} from "../services/daily-routine.service.js";

export async function generateDailyRoutineController(req, res, next) {
    try {
        const result = await generateDailyRoutineForUser(req.user.id);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function getMyDailyRoutineController(req, res, next) {
    try {
        const result = await getMyDailyRoutine(req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/daily-routine.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    generateDailyRoutineController,
    getMyDailyRoutineController,
} from "../controllers/daily-routine.controller.js";

export const dailyRoutineRoutes = Router();

dailyRoutineRoutes.get("/me/daily-routine", requireAuth, getMyDailyRoutineController);
dailyRoutineRoutes.post(
    "/me/daily-routine/generate",
    requireAuth,
    generateDailyRoutineController,
);
```

5. Explicação do código: a consulta devolve rotina existente ou `null`; a geração cria ou atualiza a rotina. Ambas usam `req.user.id`.
6. Como validar este passo: pedido sem sessão deve devolver `401`.
7. Erros comuns ou cenário negativo: aceitar `userId` na URL permitiria tentar consultar rotina de outra pessoa.

### Passo 5 - Registar route na app

1. Explicação simples do objetivo: ligar endpoints ao Express.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: imports e routes.
3. O que fazer: adicionar `dailyRoutineRoutes`.
4. Código completo, correto e integrado.

```js
// server/src/app.js
import { dailyRoutineRoutes } from "./routes/daily-routine.routes.js";

app.use("/api", dailyRoutineRoutes);
```

5. Explicação do código: o prefixo mantém os endpoints em `/api/me/daily-routine`.
6. Como validar este passo: confirmar que `GET` e `POST` respondem.
7. Erros comuns ou cenário negativo: duplicar prefixos criaria URLs inconsistentes.

### Passo 6 - Criar página React

1. Explicação simples do objetivo: mostrar rotina por períodos.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/DailyRoutinePage.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar página com consulta inicial e botão de geração.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/DailyRoutinePage.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

function groupByPeriod(steps) {
    return {
        manha: steps.filter((step) => step.period === "manha"),
        noite: steps.filter((step) => step.period === "noite"),
    };
}

export function DailyRoutinePage() {
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const [routine, setRoutine] = useState(null);

    async function loadRoutine() {
        const data = await apiRequest("/api/me/daily-routine");
        setRoutine(data.routine);
        setStatus(data.routine ? "success" : "empty");
    }

    async function generateRoutine() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/api/me/daily-routine/generate", {
                method: "POST",
            });
            setRoutine(data.routine);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    useEffect(() => {
        loadRoutine().catch((err) => {
            setError(err.message);
            setStatus("error");
        });
    }, []);

    const groupedSteps = groupByPeriod(routine?.steps ?? []);

    return (
        <section>
            <h1>Rotina diária</h1>
            <button type="button" onClick={generateRoutine} disabled={status === "loading"}>
                Gerar rotina
            </button>
            {status === "loading" && <p>A carregar rotina...</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existe rotina gerada.</p>}
            {status === "success" && (
                <div>
                    {["manha", "noite"].map((period) => (
                        <section key={period}>
                            <h2>{period === "manha" ? "Manhã" : "Noite"}</h2>
                            {groupedSteps[period].map((step) => (
                                <article key={`${step.period}-${step.order}`}>
                                    <h3>{step.title}</h3>
                                    <p>{step.instructions}</p>
                                    <p>{step.reason}</p>
                                </article>
                            ))}
                        </section>
                    ))}
                </div>
            )}
        </section>
    );
}
```

5. Explicação do código: a página não decide que produtos entram na rotina. Pede ao backend, agrupa passos por período e mostra instruções.
6. Como validar este passo: gerar rotina e confirmar secções Manhã/Noite.
7. Erros comuns ou cenário negativo: montar rotina só no frontend perderia persistência e ownership.

### Passo 7 - Registar página no frontend

1. Explicação simples do objetivo: tornar a rotina acessível.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: imports e configuração de rotas.
3. O que fazer: importar página e adicionar rota.
4. Código completo, correto e integrado.

```jsx
// client/src/App.jsx
import { DailyRoutinePage } from "./pages/DailyRoutinePage.jsx";

// Dentro da configuração de rotas:
{
    path: "/daily-routine",
    element: <DailyRoutinePage />,
}
```

5. Explicação do código: a rota visual fica separada de recomendações e compras.
6. Como validar este passo: abrir `/daily-routine`.
7. Erros comuns ou cenário negativo: esconder a página impede validar `RF21` no fluxo real.

### Passo 8 - Validar negativos obrigatórios

1. Explicação simples do objetivo: confirmar que rotina falha sem dados válidos.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/daily-routine.service.js`
    - REVER: `server/src/routes/daily-routine.routes.js`
    - LOCALIZAÇÃO: filtro de recomendações e `requireAuth`.
3. O que fazer: executar pedidos sem sessão e sem recomendações válidas.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3001/api/me/daily-routine/generate
curl -i -X POST http://localhost:3001/api/me/daily-routine/generate -H "Cookie: orelle_session=COOKIE_SEM_RECOMENDACOES"
curl -i -X POST http://localhost:3001/api/me/daily-routine/generate -H "Cookie: orelle_session=COOKIE_UMA_RECOMENDACAO_VALIDA"
rg -n "Cart|Order|Payment|Checkout" server/src/services/daily-routine.service.js
```

5. Explicação do código: os pedidos validam autenticação, ausência de recomendações e rotina sem períodos suficientes. O `rg` confirma que este BK não chama compra.
6. Como validar este passo: esperar `401`, dois resultados `400` e nenhuma importação comercial.
7. Erros comuns ou cenário negativo: criar rotina a partir de qualquer produto ignora personalização.

## Expected results
- `POST /api/me/daily-routine/generate` sem sessão devolve `401`.
- Utilizador sem recomendações válidas devolve `400`.
- Utilizador com apenas uma recomendação válida devolve `400`.
- Utilizador com pelo menos duas recomendações válidas recebe `201` com rotina.
- `GET /api/me/daily-routine` devolve `200` com rotina ou `routine: null`.

## Snippet tecnico aplicavel
Consultar os snippets completos nos passos lineares deste guia; nao ha snippet adicional fora do fluxo documentado.

## Criterios de aceite
- Entrega funcional de `RF21` concluída com origem explícita.
- Cenários negativos concluídos: mínimo `2`.
- Evidência de testes por camada conforme prioridade `P1`.
- Rotina usa recomendações `active` e `accepted`; ignora `dismissed`.
- Rotina final contém pelo menos um passo `manha` e um passo `noite`.
- Nenhuma compra inexistente é chamada.
- Modelo prepara `purchases` sem alterar o fluxo atual.

## Validação final
- Gerar pelo menos duas recomendações, marcar uma como útil e gerar rotina.
- Confirmar que recomendação rejeitada não aparece nos passos.
- Confirmar que `steps` contém `manha` e `noite`.
- Confirmar que `source` fica `recommendations`.
- Executar `git diff --check` antes do PR.

## Evidence para PR/defesa
- `proof_tecnico`: resposta `201` com rotina manhã/noite.
- `proof_negativos`: evidência de `401`, `400` sem recomendações e `400` com uma só recomendação válida.
- `proof_negocio`: página com rotina agrupada por período.

## Handoff
Quando MF3 criar compras reais, a origem `purchases` deve substituir `recommendations` no service, mantendo `period`, `steps` e página.

## Changelog
- `2026-06-08`: guia reescrito com decisão `DERIVADO`, modelo, service, controller, route, UI e negativos.
- `2026-06-08`: corrigido service para exigir passos de manhã e noite antes de persistir rotina.
