# BK-MF3-01 - O sistema deve permitir comparar imagens (antes vs após 30 dias de uso)

## Header
- `doc_id`: `GUIA-BK-MF3-01`
- `bk_id`: `BK-MF3-01`
- `macro`: `MF3`
- `owner`: `Daniel Bulica`
- `apoio`: `Bruna`
- `prioridade`: `P2`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF1-08`
- `rf_rnf`: `RF25`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF3-02`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-01-o-sistema-deve-permitir-comparar-imagens-antes-vs-apos-30-dias-de-uso.md`
- `last_updated`: `2026-06-13`

## Contexto do BK
- Entrega alvo: implementar `RF25`, comparação entre análise/fotografia inicial e análise/fotografia após 30 dias.
- CANONICO: a comparação vem depois de histórico pessoal (`RF16`) e não substitui a visualização imediata de `RF24`.
- DERIVADO: a comparação usa métricas de `FaceAnalysis.findings` e referências seguras a registos do próprio utilizador.
- Este BK fecha a parte temporal da simulação/evolução antes de entrar no comércio.

## Objetivo
Neste BK vais criar uma comparação temporal de pele após 30 dias, usando dados do histórico pessoal.

## Importância
A comparação de 30 dias ajuda o cliente a acompanhar evolução, mas não deve prometer resultado clínico. É um apoio visual e informativo baseado em dados já recolhidos.

## Scope-in
- Criar modelo `SkinComparison`.
- Criar endpoint `POST /api/me/skin-comparisons`.
- Validar duas análises do próprio utilizador.
- Exigir intervalo mínimo de 30 dias entre registos.
- Criar página React para selecionar análises e ver comparação.

## Scope-out
- Não criar novo upload de fotografia.
- Não criar diagnóstico médico.
- Não reutilizar a visualização imediata de maquilhagem como prova temporal.
- Não expor paths internos de fotografias.

## Estado antes
`CRITICO`: o guia era genérico e não tratava dados biométricos, consentimento, ownership nem código executável.

## Estado depois
`OK`: o guia define comparação temporal com modelo, validator, service, endpoint, UI e negativos.

## Pré-requisitos
- `BK-MF1-08`: histórico pessoal de análises.
- `BK-MF1-06`: `FaceAnalysis`.
- `BK-MF1-05`: fotografias e consentimento facial.
- `BK-MF0-02`: sessão autenticada.

## Glossário
- Comparação temporal: comparação entre dois momentos separados no tempo.
- Análise inicial: registo usado como ponto de partida.
- Análise final: registo usado após pelo menos 30 dias.
- Dados biométricos: dados derivados de fotografias faciais.
- Minimização: devolver só o necessário para a funcionalidade.

## Conceitos teóricos
Comparação após 30 dias não é simulação. A simulação mostra uma previsão imediata; a comparação temporal observa dois registos históricos.

O backend deve validar ownership das duas análises. O frontend não pode escolher análises de outro utilizador.

A resposta deve evitar paths, `storageKey`, IDs de consentimento e ficheiros privados. A UI pode mostrar métricas, datas e resumo textual.

IA e análise facial têm limites. O texto deve falar em sinais cosméticos observados, não em diagnóstico médico definitivo.

## Arquitetura do BK
- `skin-comparison.model.js`: guarda comparação.
- `skin-comparison.validator.js`: valida IDs.
- `skin-comparison.service.js`: valida ownership, intervalo e calcula diferenças.
- `skin-comparison.controller.js`: expõe endpoint.
- `skin-comparison.routes.js`: protege route.
- `SkinComparisonPage.jsx`: cria e mostra comparação.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/skin-comparison.model.js`
- CRIAR: `server/src/validators/skin-comparison.validator.js`
- CRIAR: `server/src/services/skin-comparison.service.js`
- CRIAR: `server/src/controllers/skin-comparison.controller.js`
- CRIAR: `server/src/routes/skin-comparison.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/SkinComparisonPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/face-analysis.model.js`

## Bloco pedagógico
### Objetivo
Comparar duas análises do próprio utilizador com pelo menos 30 dias de distância.

### Pré-requisitos
- Saber consultar histórico pessoal.
- Saber validar ObjectId.
- Saber tratar dados biométricos de forma minimizada.

### Erros comuns
- Comparar duas análises com poucos dias de intervalo.
- Aceitar `userId` vindo do frontend.
- Devolver fotografias ou paths internos.
- Apresentar melhoria como garantia clínica.

### Check de compreensao
- [ ] Sei distinguir comparação temporal de simulação imediata.
- [ ] Sei explicar porque o backend valida 30 dias.
- [ ] Sei testar análise de outro utilizador.

### Tempo estimado
`P2`: 60-75 minutos.

## Bloco operacional
### Entrada
- Sessão autenticada.
- `baselineAnalysisId`.
- `followUpAnalysisId`.

### Passos
1. Confirmar contrato.
2. Criar modelo.
3. Criar validator.
4. Criar service.
5. Criar controller e route.
6. Criar página React.
7. Executar cenários negativos obrigatórios (mínimo 1).

### Cenarios negativos recomendados
- Análise de outro utilizador devolve `404`.
- Intervalo inferior a 30 dias devolve `400`.
- Sem sessão devolve `401`.

### Validacao
- [ ] Smoke: comparação válida devolve resumo e diferenças.
- [ ] Negativos: mínimo `1` cenários com resultado controlado.
- [ ] Privacidade: DTO não devolve paths ou fotografias.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF3-02` inicia comércio. Este BK não adiciona produtos ao carrinho nem faz recomendações de compra.

## Passos lineares

### Passo 1 - Confirmar contrato da comparação

1. Explicação simples do objetivo: separar comparação temporal de visualização imediata.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: `RF24`, `RF25`, `RF16`.
3. O que fazer: confirmar que a comparação usa histórico.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: não há código porque o passo evita erro semântico. `RF25` mede evolução temporal, não efeito visual imediato.
6. Como validar este passo: endpoint deste BK deve receber IDs de análises, não produtos de maquilhagem.
7. Erros comuns ou cenário negativo: usar simulação de maquilhagem como prova após 30 dias cria evidência falsa.

### Passo 2 - Criar modelo SkinComparison

1. Explicação simples do objetivo: guardar comparação temporal minimizada.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/skin-comparison.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar schema.
4. Código completo, correto e integrado.

```js
// server/src/models/skin-comparison.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Representa a diferença entre uma métrica da análise inicial e da análise final.
 * Guarda apenas valores derivados, sem duplicar fotografias ou paths internos.
 */
const metricDeltaSchema = new Schema(
    {
        metric: { type: String, required: true },
        baselineValue: { type: Schema.Types.Mixed, required: true },
        followUpValue: { type: Schema.Types.Mixed, required: true },
        changeLabel: { type: String, required: true },
    },
    { _id: false },
);

/**
 * Guarda uma comparação entre duas análises faciais do mesmo cliente.
 * O schema mantém referências e resultados resumidos para reduzir exposição biométrica.
 */
const skinComparisonSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        baselineAnalysisId: { type: Schema.Types.ObjectId, ref: "FaceAnalysis", required: true },
        followUpAnalysisId: { type: Schema.Types.ObjectId, ref: "FaceAnalysis", required: true },
        daysBetween: { type: Number, required: true, min: 30 },
        metricDeltas: { type: [metricDeltaSchema], required: true },
        summary: { type: String, required: true },
        limitations: { type: [String], required: true },
    },
    { timestamps: true },
);

skinComparisonSchema.index({ userId: 1, baselineAnalysisId: 1, followUpAnalysisId: 1 }, { unique: true });

/**
 * Modelo MongoDB responsável pelas comparações faciais persistidas.
 */
export const SkinComparison = model("SkinComparison", skinComparisonSchema);
```

5. Explicação do código: o modelo guarda referências internas às análises, diferenças e limitações. Não guarda fotografia nem path.
6. Como validar este passo: `daysBetween` abaixo de `30` deve falhar.
7. Erros comuns ou cenário negativo: guardar imagens duplicadas aumenta risco biométrico sem necessidade.

### Passo 3 - Criar validator

1. Explicação simples do objetivo: validar IDs recebidos.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/skin-comparison.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: validar `baselineAnalysisId` e `followUpAnalysisId`.
4. Código completo, correto e integrado.

```js
// server/src/validators/skin-comparison.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o payload usado para pedir uma comparação entre duas análises.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{ baselineAnalysisId: string, followUpAnalysisId: string }} IDs normalizados.
 * @throws {AppError} Quando algum ID é inválido ou quando os dois IDs são iguais.
 */
export function validateSkinComparisonPayload(body) {
    const baselineAnalysisId = String(body?.baselineAnalysisId || "").trim();
    const followUpAnalysisId = String(body?.followUpAnalysisId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(baselineAnalysisId)) {
        throw new AppError(400, "Análise inicial inválida");
    }

    if (!mongoose.Types.ObjectId.isValid(followUpAnalysisId)) {
        throw new AppError(400, "Análise final inválida");
    }

    if (baselineAnalysisId === followUpAnalysisId) {
        throw new AppError(400, "Escolhe duas análises diferentes");
    }

    return { baselineAnalysisId, followUpAnalysisId };
}
```

5. Explicação do código: o validator bloqueia IDs inválidos antes de consultar a base de dados. A identidade do utilizador não vem no payload.
6. Como validar este passo: enviar IDs iguais deve devolver `400`.
7. Erros comuns ou cenário negativo: aceitar IDs iguais cria comparação inútil.

### Passo 4 - Criar service de comparação

1. Explicação simples do objetivo: validar ownership, intervalo e calcular diferenças.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/skin-comparison.service.js`
    - REVER: `server/src/models/face-analysis.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar função principal.
4. Código completo, correto e integrado.

```js
// server/src/services/skin-comparison.service.js
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { SkinComparison } from "../models/skin-comparison.model.js";
import { AppError } from "../middlewares/error.middleware.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COMPARABLE_METRICS = ["skinType", "acne", "spots", "wrinkles", "oiliness"];

/**
 * Calcula a distância inteira em dias entre duas datas.
 * @param {Date | string} a - Primeira data da comparação.
 * @param {Date | string} b - Segunda data da comparação.
 * @returns {number} Número absoluto de dias entre as datas.
 */
function daysBetween(a, b) {
    return Math.floor(Math.abs(new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY);
}

/**
 * Constrói a lista de diferenças observáveis entre duas análises faciais.
 * @param {{ findings?: Record<string, unknown> }} baseline - Análise inicial.
 * @param {{ findings?: Record<string, unknown> }} followUp - Análise final.
 * @returns {Array<{ metric: string, baselineValue: unknown, followUpValue: unknown, changeLabel: string }>}
 */
function buildMetricDeltas(baseline, followUp) {
    return COMPARABLE_METRICS.map((metric) => {
        const baselineValue = baseline.findings?.[metric] ?? "sem dados";
        const followUpValue = followUp.findings?.[metric] ?? "sem dados";
        return {
            metric,
            baselineValue,
            followUpValue,
            changeLabel: baselineValue === followUpValue ? "sem alteração observável" : "alteração observada",
        };
    });
}

/**
 * Cria ou atualiza uma comparação facial para o cliente autenticado.
 * @param {string} userId - ID do utilizador vindo da sessão autenticada.
 * @param {{ baselineAnalysisId: string, followUpAnalysisId: string }} payload - IDs das análises a comparar.
 * @returns {Promise<{ id: string, daysBetween: number, metricDeltas: Array<object>, summary: string, limitations: string[] }>}
 * @throws {AppError} Quando as análises não pertencem ao cliente ou não respeitam o intervalo mínimo.
 */
export async function createSkinComparison(userId, { baselineAnalysisId, followUpAnalysisId }) {
    // O filtro por userId aplica ownership; análises de outro cliente são tratadas como inexistentes.
    const [baseline, followUp] = await Promise.all([
        FaceAnalysis.findOne({ _id: baselineAnalysisId, userId }).select("findings createdAt"),
        FaceAnalysis.findOne({ _id: followUpAnalysisId, userId }).select("findings createdAt"),
    ]);

    if (!baseline || !followUp) {
        throw new AppError(404, "Análise não encontrada");
    }

    const intervalDays = daysBetween(baseline.createdAt, followUp.createdAt);
    if (intervalDays < 30) {
        throw new AppError(400, "A comparação exige pelo menos 30 dias entre análises");
    }

    const metricDeltas = buildMetricDeltas(baseline, followUp);
    const comparison = await SkinComparison.findOneAndUpdate(
        { userId, baselineAnalysisId, followUpAnalysisId },
        {
            userId,
            baselineAnalysisId,
            followUpAnalysisId,
            daysBetween: intervalDays,
            metricDeltas,
            summary: "Comparação cosmética entre duas análises do histórico pessoal.",
            limitations: [
                "Esta comparação não é diagnóstico médico.",
                "Resultados dependem da qualidade das fotografias e das condições de luz.",
            ],
        },
        { new: true, upsert: true },
    );

    return {
        id: comparison._id.toString(),
        daysBetween: comparison.daysBetween,
        metricDeltas: comparison.metricDeltas,
        summary: comparison.summary,
        limitations: comparison.limitations,
    };
}
```

5. Explicação do código: as consultas incluem `{ userId }`, por isso análises de outro utilizador parecem inexistentes. O DTO devolve métricas e limitações, não imagens.
6. Como validar este passo: análise de outro utilizador deve devolver `404`; intervalo curto deve devolver `400`.
7. Erros comuns ou cenário negativo: comparar sem validar data pode apresentar evolução falsa.

### Passo 5 - Criar controller e route

1. Explicação simples do objetivo: expor comparação autenticada.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/skin-comparison.controller.js`
    - CRIAR: `server/src/routes/skin-comparison.routes.js`
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: ficheiros completos e registo na app.
3. O que fazer: criar endpoint `POST /api/me/skin-comparisons`.
4. Código completo, correto e integrado.

```js
// server/src/controllers/skin-comparison.controller.js
import { createSkinComparison } from "../services/skin-comparison.service.js";
import { validateSkinComparisonPayload } from "../validators/skin-comparison.validator.js";

/**
 * Handler HTTP que cria uma comparação facial para o utilizador autenticado.
 * @param {import("express").Request} req - Pedido Express com sessão em `req.user`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Middleware de erro.
 * @returns {Promise<import("express").Response | void>}
 */
export async function createSkinComparisonController(req, res, next) {
    try {
        const payload = validateSkinComparisonPayload(req.body);
        const comparison = await createSkinComparison(req.user.id, payload);
        return res.status(201).json({ comparison });
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/skin-comparison.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createSkinComparisonController } from "../controllers/skin-comparison.controller.js";

/**
 * Rotas autenticadas para comparações faciais do próprio cliente.
 */
export const skinComparisonRoutes = Router();

skinComparisonRoutes.post("/me/skin-comparisons", requireAuth, createSkinComparisonController);
```

```js
import { skinComparisonRoutes } from "./routes/skin-comparison.routes.js";

app.use("/api", skinComparisonRoutes);
```

5. Explicação do código: a route usa `/me` e `requireAuth`, mantendo dados biométricos dentro da sessão do próprio utilizador.
6. Como validar este passo: sem sessão devolve `401`; payload válido devolve `201`.
7. Erros comuns ou cenário negativo: criar endpoint com `/users/:userId` aumenta risco de acesso cruzado.

### Passo 6 - Criar página React

1. Explicação simples do objetivo: permitir ao cliente escolher duas análises reais do seu histórico pessoal e criar a comparação.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/SkinComparisonPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo e registo de página.
3. O que fazer: carregar `GET /api/me/skin-history`, filtrar itens do tipo `analysis`, deixar o cliente escolher análise inicial e final, e bloquear submissão inválida.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/SkinComparisonPage.jsx
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Página que permite escolher duas análises reais do histórico pessoal e criar a comparação.
 * @returns {JSX.Element} Interface de comparação facial.
 */
export function SkinComparisonPage() {
    const [baselineAnalysisId, setBaselineAnalysisId] = useState("");
    const [followUpAnalysisId, setFollowUpAnalysisId] = useState("");
    const [history, setHistory] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [historyStatus, setHistoryStatus] = useState("idle");
    const [submitStatus, setSubmitStatus] = useState("idle");
    const [error, setError] = useState("");

    const analyses = useMemo(
        () => history.filter((item) => item.type === "analysis"),
        [history],
    );
    const canSubmit =
        baselineAnalysisId &&
        followUpAnalysisId &&
        baselineAnalysisId !== followUpAnalysisId &&
        submitStatus !== "loading";

    useEffect(() => {
        /**
         * Carrega o histórico pessoal e mantém apenas entradas de análise facial.
         * @returns {Promise<void>}
         */
        async function loadHistory() {
            setHistoryStatus("loading");
            setError("");

            try {
                // A autenticação via cookie HttpOnly segue no pedido; a página não guarda tokens.
                const data = await apiRequest("/me/skin-history", {
                    credentials: "include",
                });
                const safeHistory = Array.isArray(data.history) ? data.history : [];
                setHistory(safeHistory);
                setHistoryStatus(safeHistory.some((item) => item.type === "analysis") ? "success" : "empty");
            } catch (err) {
                setError(err.message || "Não foi possível carregar o histórico.");
                setHistoryStatus("error");
            }
        }

        loadHistory();
    }, []);

    /**
     * Submete a comparação escolhida pelo cliente.
     * @param {React.FormEvent<HTMLFormElement>} event - Evento de submissão do formulário.
     * @returns {Promise<void>}
     */
    async function submitComparison(event) {
        event.preventDefault();

        if (!canSubmit) {
            setError("Escolhe duas análises diferentes antes de comparar.");
            return;
        }

        setSubmitStatus("loading");
        setError("");
        try {
            const data = await apiRequest("/me/skin-comparisons", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ baselineAnalysisId, followUpAnalysisId }),
            });
            setComparison(data.comparison);
            setSubmitStatus("success");
        } catch (err) {
            setError(err.message || "Não foi possível criar comparação.");
            setSubmitStatus("error");
        }
    }

    function analysisLabel(analysis) {
        const date = new Date(analysis.createdAt).toLocaleDateString("pt-PT");
        return `${date} - ${analysis.providerName || "análise facial"}`;
    }

    return (
        <main>
            <h1>Comparação após 30 dias</h1>
            {historyStatus === "loading" ? <p>A carregar histórico pessoal...</p> : null}
            {historyStatus === "empty" ? <p>Precisas de pelo menos duas análises guardadas no histórico.</p> : null}
            {historyStatus === "error" ? <p role="alert">{error}</p> : null}
            <form onSubmit={submitComparison}>
                <label>
                    Análise inicial
                    <select
                        value={baselineAnalysisId}
                        onChange={(event) => setBaselineAnalysisId(event.target.value)}
                        disabled={analyses.length < 2}
                    >
                        <option value="">Escolher análise inicial</option>
                        {analyses.map((analysis) => (
                            <option key={analysis.id} value={analysis.id}>
                                {analysisLabel(analysis)}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Análise final
                    <select
                        value={followUpAnalysisId}
                        onChange={(event) => setFollowUpAnalysisId(event.target.value)}
                        disabled={analyses.length < 2}
                    >
                        <option value="">Escolher análise final</option>
                        {analyses.map((analysis) => (
                            <option key={analysis.id} value={analysis.id}>
                                {analysisLabel(analysis)}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="submit" disabled={!canSubmit}>
                    {submitStatus === "loading" ? "A comparar..." : "Comparar"}
                </button>
            </form>
            {error && historyStatus !== "error" ? <p role="alert">{error}</p> : null}
            {comparison ? (
                <section>
                    <h2>Resultado</h2>
                    <p>{comparison.summary}</p>
                    <p>Dias entre análises: {comparison.daysBetween}</p>
                    <ul>
                        {comparison.metricDeltas.map((delta) => (
                            <li key={delta.metric}>
                                {delta.metric}: {delta.changeLabel}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
        </main>
    );
}
```

5. Explicação do código: a página começa por carregar o histórico pessoal criado em `BK-MF1-08` e usa apenas itens `analysis`, porque relatórios não são a fonte direta da comparação. O cliente escolhe duas análises existentes, sem escrever IDs à mão. `credentials: "include"` envia o cookie `HttpOnly`; não há token em `localStorage`. A UI nunca mostra fotografias nem paths internos, apenas datas e provider, reduzindo exposição de dados biométricos.
6. Como validar este passo: com duas análises no histórico, os dois selects ficam preenchidos e uma comparação válida mostra resumo e métricas; com zero ou uma análise, a página mostra estado vazio e bloqueia o botão.
7. Erros comuns ou cenário negativo: aceitar o mesmo ID nos dois campos cria uma comparação inútil; mostrar imagem facial diretamente nesta página aumenta exposição.

### Passo 7 - Validar negativos e evidence

1. Explicação simples do objetivo: provar segurança e limite temporal.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/skin-comparison.service.js`
    - REVER: `server/src/routes/skin-comparison.routes.js`
    - LOCALIZAÇÃO: testes ou outputs.
3. O que fazer: testar sem sessão, análise de outro utilizador e intervalo curto.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3000/api/me/skin-comparisons \
  -H "Content-Type: application/json" \
  -d '{"baselineAnalysisId":"BASELINE_ID","followUpAnalysisId":"FOLLOW_UP_ID"}'
```

5. Explicação do código: sem cookie espera `401`. Com IDs inválidos espera `400`. Com análise de outro utilizador espera `404`.
6. Como validar este passo: registar `201`, `401`, `400` e `404`.
7. Erros comuns ou cenário negativo: aceitar intervalo curto torna a comparação sem valor pedagógico e funcional.

## Expected results
- Comparação válida devolve `201`.
- Sem sessão devolve `401`.
- IDs inválidos devolvem `400`.
- Análise de outro utilizador devolve `404`.
- Intervalo inferior a 30 dias devolve `400`.

## Critérios de aceite
- Comparação usa duas análises do próprio utilizador.
- Intervalo mínimo de 30 dias é validado no backend.
- DTO não devolve fotografias nem paths internos.
- Cenários negativos concluídos: mínimo `1`.
- Evidência de testes por camada conforme prioridade (`P2`).

## Validação final
- Smoke: comparação válida gera resumo.
- Segurança: dados biométricos permanecem minimizados.
- Integração: não interfere com comércio da MF3.

## Evidence para PR/defesa
- Output de comparação válida.
- Output de intervalo curto.
- Output de análise de outro utilizador.
- Screenshot do resultado.

## Handoff
O próximo BK inicia carrinho de compras. Não há adição automática de produtos nem promessa clínica neste BK.

## Changelog
- `2026-06-13`: guia reescrito para comparação temporal segura após 30 dias.
