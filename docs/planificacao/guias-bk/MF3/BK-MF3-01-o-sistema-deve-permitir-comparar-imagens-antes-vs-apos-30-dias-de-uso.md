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
- `last_updated`: `2026-07-10`

> **Contrato reconciliado com o runtime:** a UI obtém opções próprias em `GET /api/me/skin-analyses/comparison-options`, mostra datas/tipo de pele e usa `selectionKey` apenas como valor opaco dos selects; nunca pede IDs. O body de `POST /api/me/skin-comparisons` usa `baselineSelection`/`followUpSelection`. Fotografias autorizadas são lidas exclusivamente em `GET /api/me/skin-analyses/:analysisId/image`, com ownership e `Cache-Control: private, no-store`; o resultado inclui tabela acessível de métricas.

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
- Criar endpoint de opções datadas e endpoint autenticado/no-store para a imagem pertencente à análise.
- Validar duas análises do próprio utilizador.
- Exigir intervalo mínimo de 30 dias entre registos.
- Criar página React com selects por data, imagens autorizadas e tabela acessível, sem inputs de IDs.

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

As diferenças, o resumo e as limitações continuam a ser dados sensíveis derivados, mesmo sem guardar as fotografias. No estado final, `metricDeltas`, `summary` e `limitations` são cifrados com AES-GCM contextual, ligando cada envelope à coleção `skincomparisons`, ao owner `userId` e ao nome do campo. Estes derivados não pertenciam ao conjunto original da migração `005_sensitive_encryption_v2`; foram acrescentados pela migração append-only `008_sensitive_derivatives_encryption`, sem alterar o checksum histórico de `005`. Numa instalação nova usa-se diretamente o schema final abaixo; se este BK tiver sido implementado antes da hardening da MF6, executar `008` é um retrofit obrigatório e o schema em claro nunca é o estado final aceitável.

## Arquitetura do BK
- `skin-comparison.model.js`: guarda comparação.
- `skin-comparison.validator.js`: valida `selectionKey` recebidas dos selects e o parâmetro interno da imagem.
- `skin-comparison.service.js`: valida ownership, intervalo e calcula diferenças.
- `skin-comparison.controller.js`: expõe endpoint.
- `skin-comparison.routes.js`: protege route.
- `SkinComparisonPage.jsx`: cria e mostra comparação.

## Ficheiros a criar/editar/rever
- CRIAR: `apps/api/src/models/skin-comparison.model.js`
- CRIAR: `apps/api/src/validators/skin-comparison.validator.js`
- CRIAR: `apps/api/src/services/skin-comparison.service.js`
- CRIAR: `apps/api/src/services/skin-analysis-image.service.js`
- CRIAR: `apps/api/src/controllers/skin-comparison.controller.js`
- CRIAR: `apps/api/src/routes/skin-comparison.routes.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/pages/SkinComparisonPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- REVER: `apps/api/src/models/face-analysis.model.js`
- REVER: `apps/api/src/utils/contextual-encrypted-field.util.js`

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
- `baselineSelection` escolhido numa opção datada.
- `followUpSelection` escolhido numa opção datada.

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
6. Como validar este passo: a UI deve oferecer momentos datados e enviar apenas as respetivas `selectionKey` opacas; nunca apresenta um campo para escrever IDs nem recebe produtos de maquilhagem.
7. Erros comuns ou cenário negativo: usar simulação de maquilhagem como prova após 30 dias cria evidência falsa.

### Passo 2 - Criar modelo SkinComparison

1. Explicação simples do objetivo: guardar comparação temporal minimizada.
2. Ficheiros envolvidos.
    - CRIAR: `apps/api/src/models/skin-comparison.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar schema.
4. Código completo, correto e integrado.

```js
// apps/api/src/models/skin-comparison.model.js
import mongoose from "mongoose";
import { contextualEncryptedField } from "../utils/contextual-encrypted-field.util.js";

const { Schema, model } = mongoose;

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
        metricDeltas: contextualEncryptedField({
            collection: "skincomparisons",
            field: "metricDeltas",
            required: true,
        }),
        summary: contextualEncryptedField({
            collection: "skincomparisons",
            field: "summary",
            required: true,
        }),
        limitations: contextualEncryptedField({
            collection: "skincomparisons",
            field: "limitations",
            required: true,
        }),
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

skinComparisonSchema.index({ userId: 1, baselineAnalysisId: 1, followUpAnalysisId: 1 }, { unique: true });

/**
 * Modelo MongoDB responsável pelas comparações faciais persistidas.
 */
export const SkinComparison = model("SkinComparison", skinComparisonSchema);
```

5. Explicação do código: o modelo guarda referências internas às análises, mas as diferenças e os textos derivados ficam opacos no storage. O setter usa `userId` para construir o AAD; os getters devolvem os valores lógicos apenas quando o documento conserva esse owner. Como estes campos cifrados são `Mixed`, a forma de cada delta e os arrays/textos obrigatórios são validados no service/validator antes da persistência.
6. Como validar este passo: `daysBetween` abaixo de `30` deve falhar e uma consulta pelo driver nativo deve mostrar envelopes v2 em `metricDeltas`, `summary` e `limitations`, sem texto cosmético legível.
7. Erros comuns ou cenário negativo: não recuperar o antigo `metricDeltaSchema` em claro como solução final; guardar imagens duplicadas ou derivados legíveis aumenta o risco biométrico sem necessidade.

### Passo 3 - Criar validator

1. Explicação simples do objetivo: validar IDs recebidos.
2. Ficheiros envolvidos.
    - CRIAR: `apps/api/src/validators/skin-comparison.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: validar `baselineSelection` e `followUpSelection`, recebidas apenas dos selects datados.
4. Código completo, correto e integrado.

```js
// apps/api/src/validators/skin-comparison.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Valida o payload usado para pedir uma comparação entre duas análises.
 * @param {unknown} body - Corpo recebido no pedido HTTP.
 * @returns {{baselineSelection: string, followUpSelection: string}} Chaves opacas normalizadas.
 * @throws {AppError} Quando algum ID é inválido ou quando os dois IDs são iguais.
 */
export function validateSkinComparisonPayload(body) {
    const baselineSelection = String(body?.baselineSelection || "").trim();
    const followUpSelection = String(body?.followUpSelection || "").trim();

    if (!mongoose.Types.ObjectId.isValid(baselineSelection)) {
        throw new AppError(400, "Momento inicial inválido");
    }

    if (!mongoose.Types.ObjectId.isValid(followUpSelection)) {
        throw new AppError(400, "Momento final inválido");
    }

    if (baselineSelection === followUpSelection) {
        throw new AppError(400, "Escolhe duas análises diferentes");
    }

    return { baselineSelection, followUpSelection };
}

/** Valida o parâmetro interno do endpoint autenticado de imagem. */
export function validateSkinAnalysisImageParams(params) {
    const analysisId = String(params?.analysisId ?? "").trim();

    if (!mongoose.Types.ObjectId.isValid(analysisId)) {
        throw new AppError(400, "Análise inválida");
    }

    return { analysisId };
}
```

5. Explicação do código: o validator bloqueia chaves de seleção inválidas antes de consultar a base de dados e valida também o `analysisId` presente no URL interno da imagem. A identidade do utilizador não vem no payload e a UI nunca pede estas chaves ao utilizador.
6. Como validar este passo: enviar chaves iguais ou alterar o URL para um `analysisId` malformado deve devolver `400`.
7. Erros comuns ou cenário negativo: aceitar IDs iguais cria comparação inútil.

### Passo 4 - Criar service de comparação

1. Explicação simples do objetivo: validar ownership, intervalo e calcular diferenças.
2. Ficheiros envolvidos.
    - CRIAR: `apps/api/src/services/skin-comparison.service.js`
    - REVER: `apps/api/src/models/face-analysis.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar função principal.
4. Código completo, correto e integrado.

```js
// apps/api/src/services/skin-comparison.service.js
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { SkinComparison } from "../models/skin-comparison.model.js";
import { AppError } from "../middlewares/error.middleware.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const COMPARABLE_METRICS = {
    skinType: "Tipo de pele",
    acne: "Acne",
    manchas: "Manchas",
    rugas: "Rugas",
    oleosidade: "Oleosidade",
};

/**
 * Calcula a distância inteira em dias entre duas datas.
 * @param {Date | string} a - Primeira data da comparação.
 * @param {Date | string} b - Segunda data da comparação.
 * @returns {number} Número absoluto de dias entre as datas.
 */
function daysBetween(a, b) {
    return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY);
}

/**
 * Constrói a lista de diferenças observáveis entre duas análises faciais.
 * @param {{ findings?: Record<string, unknown> }} baseline - Análise inicial.
 * @param {{ findings?: Record<string, unknown> }} followUp - Análise final.
 * @returns {Array<{ metric: string, baselineValue: unknown, followUpValue: unknown, changeLabel: string }>}
 */
function buildMetricDeltas(baseline, followUp) {
    return Object.entries(COMPARABLE_METRICS).map(([metric, label]) => {
        const baselineValue = baseline.findings?.[metric]?.label ?? "sem registo";
        const followUpValue = followUp.findings?.[metric]?.label ?? "sem registo";
        return {
            metric: label,
            baselineValue,
            followUpValue,
            changeLabel: baselineValue === followUpValue ? "sem alteração observável" : "alteração observada",
        };
    });
}

/**
 * Cria ou atualiza uma comparação facial para o cliente autenticado.
 * @param {string} userId - ID do utilizador vindo da sessão autenticada.
 * @param {{baselineSelection: string, followUpSelection: string}} payload - Opções datadas escolhidas.
 * @returns {Promise<{ id: string, daysBetween: number, metricDeltas: Array<object>, summary: string, limitations: string[] }>}
 * @throws {AppError} Quando as análises não pertencem ao cliente ou não respeitam o intervalo mínimo.
 */
export async function createSkinComparison(userId, { baselineSelection, followUpSelection }) {
    // O filtro por userId aplica ownership; análises de outro cliente são tratadas como inexistentes.
    const [baseline, followUp] = await Promise.all([
        FaceAnalysis.findOne({
            _id: baselineSelection,
            userId,
            status: "completed",
        }).select("userId status findings createdAt"),
        FaceAnalysis.findOne({
            _id: followUpSelection,
            userId,
            status: "completed",
        }).select("userId status findings createdAt"),
    ]);

    if (!baseline || !followUp) {
        throw new AppError(404, "Análise não encontrada");
    }

    const intervalDays = daysBetween(baseline.createdAt, followUp.createdAt);
    if (intervalDays < 0) {
        throw new AppError(400, "A análise final deve ser posterior à análise inicial");
    }
    if (intervalDays < 30) {
        throw new AppError(400, "A comparação exige pelo menos 30 dias entre análises");
    }

    const metricDeltas = buildMetricDeltas(baseline, followUp);
    const comparison = await SkinComparison.findOneAndUpdate(
        { userId, baselineAnalysisId: baseline._id, followUpAnalysisId: followUp._id },
        {
            userId,
            baselineAnalysisId: baseline._id,
            followUpAnalysisId: followUp._id,
            daysBetween: intervalDays,
            metricDeltas,
            summary: "Comparação cosmética entre duas análises do histórico pessoal.",
            limitations: [
                "Esta comparação não é diagnóstico médico.",
                "Resultados dependem da qualidade das fotografias e das condições de luz.",
            ],
        },
        { new: true, upsert: true },
    ).select("userId daysBetween metricDeltas summary limitations");

    return {
        id: comparison._id.toString(),
        baselineDate: baseline.createdAt,
        followUpDate: followUp.createdAt,
        daysBetween: comparison.daysBetween,
        metricDeltas: comparison.metricDeltas,
        summary: comparison.summary,
        limitations: comparison.limitations,
    };
}
```

5. Explicação do código: as consultas incluem `{ userId, status: "completed" }` e a projeção mantém `userId`, necessário para autenticar o AAD do campo cifrado `findings`. O `findOneAndUpdate` também usa um filtro exato por `userId`, para o setter cifrar no contexto certo, e a projeção do resultado conserva o owner antes de ler `metricDeltas`, `summary` e `limitations`. Análises alheias ou incompletas parecem inexistentes. O JSON devolve só datas e valores lógicos autorizados: nunca bytes, paths ou metadados de cifra.
6. Como validar este passo: análise de outro utilizador deve devolver `404`; intervalo curto deve devolver `400`.
7. Erros comuns ou cenário negativo: comparar sem validar data pode apresentar evolução falsa.

### Passo 5 - Criar controller e route

1. Explicação simples do objetivo: expor comparação autenticada.
2. Ficheiros envolvidos.
    - CRIAR: `apps/api/src/controllers/skin-comparison.controller.js`
    - CRIAR: `apps/api/src/routes/skin-comparison.routes.js`
    - EDITAR: `apps/api/src/app.js`
    - LOCALIZAÇÃO: ficheiros completos e registo na app.
3. O que fazer: criar opções datadas, leitura autenticada/no-store da imagem e criação da comparação.
4. Código completo, correto e integrado.

```js
// apps/api/src/controllers/skin-comparison.controller.js
import {
    createSkinComparison,
    listSkinComparisonOptions,
} from "../services/skin-comparison.service.js";
import { getOwnedSkinAnalysisImage } from "../services/skin-analysis-image.service.js";
import {
    validateSkinAnalysisImageParams,
    validateSkinComparisonPayload,
} from "../validators/skin-comparison.validator.js";

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

export async function listSkinComparisonOptionsController(req, res, next) {
    try {
        const analyses = await listSkinComparisonOptions(req.user.id);
        res.set("Cache-Control", "private, no-store, max-age=0");
        return res.status(200).json({ analyses });
    } catch (err) {
        return next(err);
    }
}

export async function getOwnedSkinAnalysisImageController(req, res, next) {
    try {
        const { analysisId } = validateSkinAnalysisImageParams(req.params);
        const image = await getOwnedSkinAnalysisImage(
            req.user.id,
            analysisId,
        );
        res.set({
            "Cache-Control": "private, no-store, max-age=0",
            Pragma: "no-cache",
            "Content-Type": image.mimeType,
            "Content-Length": String(image.bytes.length),
            "X-Content-Type-Options": "nosniff",
            "Cross-Origin-Resource-Policy": "same-origin",
        });
        return res.status(200).send(image.bytes);
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/skin-comparison.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    createSkinComparisonController,
    getOwnedSkinAnalysisImageController,
    listSkinComparisonOptionsController,
} from "../controllers/skin-comparison.controller.js";

/**
 * Rotas autenticadas para comparações faciais do próprio cliente.
 */
export const skinComparisonRoutes = Router();

skinComparisonRoutes.get(
    "/me/skin-analyses/comparison-options",
    requireAuth,
    listSkinComparisonOptionsController,
);
skinComparisonRoutes.get(
    "/me/skin-analyses/:analysisId/image",
    requireAuth,
    getOwnedSkinAnalysisImageController,
);
skinComparisonRoutes.post("/me/skin-comparisons", requireAuth, createSkinComparisonController);
```

```js
import { skinComparisonRoutes } from "./routes/skin-comparison.routes.js";

app.use("/api", skinComparisonRoutes);
```

5. Explicação do código: todas as rotas usam `/me` e `requireAuth`. As respostas JSON de opções/comparação contêm apenas DTOs minimizados, sem bytes nem paths. Só a rota de imagem, separada, valida `analysisId`, ownership e consentimento, desencripta em memória e responde `private, no-store` ao titular.
6. Como validar este passo: sem sessão devolve `401`; payload válido devolve `201`.
7. Erros comuns ou cenário negativo: criar endpoint com `/users/:userId` aumenta risco de acesso cruzado.

### Passo 6 - Criar página React

1. Explicação simples do objetivo: permitir ao cliente escolher duas análises reais do seu histórico pessoal e criar a comparação.
2. Ficheiros envolvidos.
    - CRIAR: `apps/web/src/pages/SkinComparisonPage.jsx`
    - EDITAR: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo e registo de página.
3. O que fazer: carregar `GET /api/me/skin-analyses/comparison-options`, mostrar opções por data, deixar o cliente escolher momentos inicial/final e bloquear submissão inválida.
4. Código completo, correto e integrado.

```jsx
// apps/web/src/pages/SkinComparisonPage.jsx
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Página que permite escolher duas análises reais do histórico pessoal e criar a comparação.
 * @returns {JSX.Element} Interface de comparação facial.
 */
export function SkinComparisonPage() {
    const [baselineSelection, setBaselineSelection] = useState("");
    const [followUpSelection, setFollowUpSelection] = useState("");
    const [analyses, setAnalyses] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [historyStatus, setHistoryStatus] = useState("idle");
    const [submitStatus, setSubmitStatus] = useState("idle");
    const [error, setError] = useState("");

    const selectedMoments = useMemo(() => ({
        baseline: analyses.find((item) => item.selectionKey === baselineSelection),
        followUp: analyses.find((item) => item.selectionKey === followUpSelection),
    }), [analyses, baselineSelection, followUpSelection]);
    const canSubmit =
        baselineSelection &&
        followUpSelection &&
        baselineSelection !== followUpSelection &&
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
                const data = await apiRequest("/me/skin-analyses/comparison-options", {
                    credentials: "include",
                });
                const options = Array.isArray(data.analyses) ? data.analyses : [];
                setAnalyses(options);
                setBaselineSelection(options[0]?.selectionKey ?? "");
                setFollowUpSelection(options.at(-1)?.selectionKey ?? "");
                setHistoryStatus(options.length >= 2 ? "success" : "empty");
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
                body: JSON.stringify({ baselineSelection, followUpSelection }),
            });
            setComparison(data.comparison);
            setSubmitStatus("success");
        } catch (err) {
            setError(err.message || "Não foi possível criar comparação.");
            setSubmitStatus("error");
        }
    }

    function analysisLabel(analysis) {
        const date = new Date(analysis.date).toLocaleDateString("pt-PT");
        return `${date} - pele ${analysis.skinType || "não conclusiva"}`;
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
                        value={baselineSelection}
                        onChange={(event) => setBaselineSelection(event.target.value)}
                        disabled={analyses.length < 2}
                    >
                        <option value="">Escolher análise inicial</option>
                        {analyses.map((analysis) => (
                            <option key={analysis.selectionKey} value={analysis.selectionKey}>
                                {analysisLabel(analysis)}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Análise final
                    <select
                        value={followUpSelection}
                        onChange={(event) => setFollowUpSelection(event.target.value)}
                        disabled={analyses.length < 2}
                    >
                        <option value="">Escolher análise final</option>
                        {analyses.map((analysis) => (
                            <option key={analysis.selectionKey} value={analysis.selectionKey}>
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
                    <div className="preview-grid">
                        {[selectedMoments.baseline, selectedMoments.followUp]
                            .filter((moment) => moment?.imageUrl)
                            .map((moment) => (
                                <img
                                    key={moment.selectionKey}
                                    src={moment.imageUrl}
                                    alt={`Fotografia autorizada de ${analysisLabel(moment)}`}
                                    width="320"
                                    height="320"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                />
                            ))}
                    </div>
                    <table>
                        <caption>Métricas cosméticas nos dois momentos</caption>
                        <thead>
                            <tr>
                                <th scope="col">Métrica</th>
                                <th scope="col">Momento inicial</th>
                                <th scope="col">Momento final</th>
                                <th scope="col">Alteração</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparison.metricDeltas.map((delta) => (
                                <tr key={delta.metric}>
                                    <th scope="row">{delta.metric}</th>
                                    <td>{delta.baselineValue}</td>
                                    <td>{delta.followUpValue}</td>
                                    <td>{delta.changeLabel}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ) : null}
        </main>
    );
}
```

5. Explicação do código: a página carrega opções próprias já minimizadas, mostra datas e usa `selectionKey` apenas nos valores dos selects, sem pedir IDs. Imagens autorizadas vêm do URL gerado pelo backend, autenticado e `no-store`; não há path de storage. A tabela mantém as métricas acessíveis sem depender apenas de cor ou imagem.
6. Como validar este passo: com duas análises no histórico, os dois selects ficam preenchidos e uma comparação válida mostra resumo e métricas; com zero ou uma análise, a página mostra estado vazio e bloqueia o botão.
7. Erros comuns ou cenário negativo: aceitar a mesma opção nos dois campos cria uma comparação inútil; usar URL pública ou cacheável para a imagem quebra ownership e privacidade.

### Passo 7 - Validar negativos e evidence

1. Explicação simples do objetivo: provar segurança e limite temporal.
2. Ficheiros envolvidos.
    - REVER: `apps/api/src/services/skin-comparison.service.js`
    - REVER: `apps/api/src/routes/skin-comparison.routes.js`
    - LOCALIZAÇÃO: testes ou outputs.
3. O que fazer: testar sem sessão, análise de outro utilizador e intervalo curto.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3000/api/me/skin-comparisons \
  -H "Content-Type: application/json" \
  -d '{"baselineSelection":"SELECTION_KEY_1","followUpSelection":"SELECTION_KEY_2"}'
```

5. Explicação do código: sem cookie espera `401`. Com opções inválidas espera `400`. Uma chave alterada para análise de outro utilizador recebe `404`.
6. Como validar este passo: registar `201`, `401`, `400` e `404`.
7. Erros comuns ou cenário negativo: aceitar intervalo curto torna a comparação sem valor pedagógico e funcional.

## Expected results
- Comparação válida devolve `201`.
- Sem sessão devolve `401`.
- Opções inválidas devolvem `400`.
- Análise de outro utilizador devolve `404`.
- Intervalo inferior a 30 dias devolve `400`.

## Critérios de aceite
- Comparação usa duas análises do próprio utilizador.
- Intervalo mínimo de 30 dias é validado no backend.
- UI não pede IDs; opções mostram datas e usam `selectionKey` apenas como valor opaco.
- JSON de opções/comparação não contém bytes, paths ou metadados de storage; a imagem é servida apenas ao proprietário por endpoint autenticado `private, no-store` e parâmetro validado.
- Resultado apresenta métricas numa tabela acessível.
- `metricDeltas`, `summary` e `limitations` ficam cifrados com AAD contextual; todas as projeções que os leem preservam `userId`.
- Cenários negativos concluídos: mínimo `1`.
- Evidência de testes por camada conforme prioridade (`P2`).

## Validação final
- Smoke: comparação válida gera resumo.
- Segurança: ownership/no-store provados; nenhum path de storage ou ID manual aparece na UI.
- Integração: não interfere com comércio da MF3.

## Evidence para PR/defesa
- Output de comparação válida.
- Output de intervalo curto.
- Output de análise de outro utilizador.
- Screenshot do resultado.
- Headers do endpoint de imagem e tabela acessível com os dois momentos.

## Handoff
O próximo BK inicia carrinho de compras. Não há adição automática de produtos nem promessa clínica neste BK.

## Changelog
- `2026-07-10`: `SkinComparison` alinhado com a migração append-only `008`: derivados cifrados por `contextualEncryptedField`, filtros/projeções com owner `userId` e ausência de plaintext no estado final.
- `2026-07-10`: guia reconciliado com opções datadas/`selectionKey`, endpoint autenticado `no-store` de imagem, tabela acessível e paths pedagógicos `apps/...`.
- `2026-06-13`: guia reescrito para comparação temporal segura após 30 dias.
