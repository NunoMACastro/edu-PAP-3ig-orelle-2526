# BK-MF1-07 - Gerar um relatório personalizado com diagnóstico e sugestões de rotina

## Header
- `doc_id`: `GUIA-BK-MF1-07`
- `bk_id`: `BK-MF1-07`
- `macro`: `MF1`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-02, BK-MF1-06`
- `rf_rnf`: `RF15`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-08`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md`
- `last_updated`: `2026-05-31`

## Objetivo
Neste BK vais gerar um relatório personalizado a partir da análise facial mais recente do utilizador autenticado.

## Importância
O relatório transforma sinais técnicos da análise em linguagem compreensível para o cliente. Deve explicar limites, resumir pontos observados e sugerir rotina cosmética sem prometer efeito clínico.

## Scope-in
- Criar modelo `FaceReport`.
- Criar endpoint `POST /api/face-reports/latest`.
- Gerar diagnóstico cosmético limitado.
- Gerar sugestões de rotina de manhã e noite.
- Mostrar relatório no frontend.

## Scope-out
- Não recomendar produtos personalizados; isso fica para `BK-MF2-02`.
- Não exportar PDF; isso pertence a `RNF16`.
- Não adicionar produtos ao carrinho.
- Não apresentar diagnóstico médico definitivo.

## Pré-requisitos
- `BK-MF1-06`: `FaceAnalysis`.
- `BK-MF0-02`: `requireAuth`.
- `RNF23`: explicabilidade.

## Glossário
- Relatório: resumo interpretável da análise facial.
- Diagnóstico cosmético: leitura limitada ao contexto de pele e rotina, sem valor médico.
- Rotina: conjunto de cuidados sugeridos para manhã e noite.

## Conceitos teóricos
Relatório personalizado não é histórico completo. Este BK gera um documento associado a uma análise. O histórico de relatórios e análises será organizado em `BK-MF1-08`.

Um relatório seguro deve indicar fontes e limitações. Se a análise tem confiança baixa, o relatório deve explicar essa incerteza em vez de fingir precisão. O termo diagnóstico, neste projeto, significa diagnóstico cosmético limitado, sem valor médico.

As sugestões de rotina são orientações gerais de cuidado, não recomendações personalizadas de produto nem ordens de compra. A recomendação comercial ligada a produtos fica para `RF18`/`BK-MF2-02`; este BK apenas transforma a análise em resumo, rotina de manhã/noite, fontes e limitações.

Como o relatório agrega dados derivados de fotografias faciais, a resposta deve continuar minimizada e ligada ao utilizador autenticado. O service não recebe `analysisId` do frontend; escolhe a análise concluída mais recente do próprio utilizador para reduzir risco de acesso cruzado.

## Arquitetura do BK
- `FaceReport`
- `generateReportFromLatestAnalysis`
- `POST /api/face-reports/latest`
- `FaceReportPage`

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/face-report.model.js`
- CRIAR: `server/src/services/face-report.service.js`
- CRIAR: `server/src/controllers/face-report.controller.js`
- CRIAR: `server/src/routes/face-report.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/FaceReportPage.jsx`
- EDITAR: `client/src/App.jsx`

## Bloco pedagógico

### Objetivo
Gerar um relatório personalizado a partir da última análise concluída do próprio utilizador.

### Pré-requisitos
- Ter análise facial criada em `BK-MF1-06`.
- Saber distinguir leitura cosmética de diagnóstico médico.
- Saber persistir documento ligado a utilizador e análise.

### Erros comuns
- Criar relatório sem análise concluída.
- Sugerir compra automática.
- Esconder limites e fontes da análise.

### Check de compreensao
- De onde vem a análise usada no relatório?
- Porque é que o relatório não cria encomendas?
- Que mensagem protege o utilizador contra excesso de confiança?

## Bloco operacional

### Entrada
- Sessão autenticada.
- Última `FaceAnalysis` concluída do utilizador.
- Modelo `FaceReport`.

### Passos
Executar cenários negativos obrigatórios (mínimo 3).

Segue os passos lineares abaixo e valida sem sessão, sem análise e com análise ainda não concluída.

## Passos lineares

### Passo 1 - Confirmar limites do relatório

1. Explicação simples do objetivo: impedir promessas médicas e compra automática.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - LOCALIZAÇÃO: `RF15`, `RF18`, `RF19`, `RNF23`.
3. O que fazer: confirma que este BK gera relatório, não recomendação personalizada.
4. Código completo, correto e integrado: sem código novo neste passo.
5. Explicação do código: a separação mantém o fluxo pedagógico e evita overengineering.
6. Como validar este passo: o relatório não deve conter botão de compra automática.
7. Erros comuns ou cenário negativo: sugerir produto específico com motivo pertence a `RF18`/`RF19`.

### Passo 2 - Criar modelo de relatório

1. Explicação simples do objetivo: guardar relatório ligado a análise e utilizador.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/face-report.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o modelo.
4. Código completo, correto e integrado:

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const routineStepSchema = new Schema(
    {
        period: {
            type: String,
            enum: ["manha", "noite"],
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
    },
    { _id: false },
);

const faceReportSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        analysisId: {
            type: Schema.Types.ObjectId,
            ref: "FaceAnalysis",
            required: true,
            index: true,
        },
        cosmeticSummary: {
            type: String,
            required: true,
        },
        routineSuggestions: {
            type: [routineStepSchema],
            required: true,
        },
        sources: {
            type: [String],
            required: true,
        },
        limitations: {
            type: [String],
            required: true,
        },
    },
    { timestamps: true },
);

export const FaceReport = model("FaceReport", faceReportSchema);
```

5. Explicação do código: o relatório guarda resumo, rotina, fontes e limitações ligados a `userId` e `analysisId`. Esta ligação permite auditoria, histórico e exportação futura sem voltar a processar fotografias nem perder a origem da conclusão.
6. Como validar este passo: confirma que `analysisId` é obrigatório.
7. Erros comuns ou cenário negativo: guardar relatório sem ligação à análise impede auditoria.

### Passo 3 - Criar service de relatório

1. Explicação simples do objetivo: gerar relatório a partir da última análise do próprio utilizador.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/face-report.service.js`
    - REVER: `server/src/models/face-analysis.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o service.
4. Código completo, correto e integrado:

```js
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";

function buildCosmeticSummary(analysis) {
    const { skinType, acne, manchas, rugas, oleosidade } = analysis.findings;

    return [
        `Tipo de pele estimado: ${skinType.label}.`,
        `Acne: ${acne.label}.`,
        `Manchas: ${manchas.label}.`,
        `Rugas: ${rugas.label}.`,
        `Oleosidade: ${oleosidade.label}.`,
        "Esta leitura é cosmética e deve ser interpretada com as limitações indicadas.",
    ].join(" ");
}

function buildRoutineSuggestions(analysis) {
    const oleosidade = analysis.findings.oleosidade.label;

    return [
        {
            period: "manha",
            title: "Limpeza suave",
            reason: `Ajuda a preparar a pele sem assumir tratamento médico. Oleosidade observada: ${oleosidade}.`,
        },
        {
            period: "manha",
            title: "Cuidado emoliente leve",
            reason: "O cuidado emoliente apoia conforto da pele e não substitui avaliação profissional.",
        },
        {
            period: "noite",
            title: "Remover impurezas",
            reason: "A rotina noturna reduz acumulação de resíduos do dia.",
        },
        {
            period: "noite",
            title: "Reforçar cuidado noturno",
            reason: "Apoia consistência da rotina sem prometer resultado clínico.",
        },
    ];
}

function toFaceReportResponse(report) {
    return {
        id: report._id.toString(),
        analysisId: report.analysisId.toString(),
        cosmeticSummary: report.cosmeticSummary,
        routineSuggestions: report.routineSuggestions,
        sources: report.sources,
        limitations: report.limitations,
        createdAt: report.createdAt,
    };
}

export async function generateReportFromLatestAnalysis(userId) {
    const analysis = await FaceAnalysis.findOne({ userId, status: "completed" })
        .sort({ createdAt: -1 });

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída obrigatória");
    }

    const report = await FaceReport.create({
        userId,
        analysisId: analysis._id,
        cosmeticSummary: buildCosmeticSummary(analysis),
        routineSuggestions: buildRoutineSuggestions(analysis),
        sources: analysis.sources,
        limitations: analysis.limitations,
    });

    return toFaceReportResponse(report);
}
```

5. Explicação do código: o service lê apenas análises concluídas do próprio utilizador, ordena pela mais recente e cria sugestões genéricas de rotina, não produtos. A resposta reutiliza `sources` e `limitations` da análise para manter explicabilidade e não esconder incerteza.
6. Como validar este passo: tenta gerar relatório sem análise e confirma `400`.
7. Erros comuns ou cenário negativo: usar a última análise global permitiria relatório de outro utilizador.

### Passo 4 - Criar controller e route

1. Explicação simples do objetivo: disponibilizar geração do relatório pela API.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/face-report.controller.js`
    - CRIAR: `server/src/routes/face-report.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: cria controller e route.
4. Código completo, correto e integrado:

```js
// server/src/controllers/face-report.controller.js
import { generateReportFromLatestAnalysis } from "../services/face-report.service.js";

export async function generateLatestFaceReportController(req, res, next) {
    try {
        const report = await generateReportFromLatestAnalysis(req.user.id);
        return res.status(201).json({ report });
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/face-report.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { generateLatestFaceReportController } from "../controllers/face-report.controller.js";

export const faceReportRoutes = Router();

faceReportRoutes.post(
    "/face-reports/latest",
    requireAuth,
    generateLatestFaceReportController,
);
```

5. Explicação do código: a rota usa a sessão para escolher o utilizador. O frontend não envia IDs de análise.
6. Como validar este passo: sem sessão, espera `401`.
7. Erros comuns ou cenário negativo: aceitar `analysisId` vindo do cliente pode quebrar ownership.

### Passo 5 - Registar route na app

1. Explicação simples do objetivo: ligar relatórios ao Express.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: imports e routes.
3. O que fazer: adiciona a route.
4. Código completo, correto e integrado:

```js
import { faceReportRoutes } from "./routes/face-report.routes.js";

app.use("/api", faceReportRoutes);
```

5. Explicação do código: o endpoint final é `POST /api/face-reports/latest`. A palavra `latest` indica que o backend escolhe a análise concluída mais recente do utilizador autenticado; o frontend não decide qual análise de outra pessoa usar.
6. Como validar este passo: confirma que a rota existe e não devolve `404`.
7. Erros comuns ou cenário negativo: colocar a rota antes do parser JSON não afeta este endpoint, mas manter ordem consistente facilita leitura.

### Passo 6 - Criar página do relatório

1. Explicação simples do objetivo: permitir gerar e ler o relatório no frontend.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/FaceReportPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: ficheiro completo e imports do `App`.
3. O que fazer: cria e regista a página.
4. Código completo, correto e integrado:

```jsx
// client/src/pages/FaceReportPage.jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function FaceReportPage() {
    const [report, setReport] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function handleGenerate() {
        setStatus("loading");
        setError("");
        setReport(null);

        try {
            const data = await apiRequest("/face-reports/latest", {
                method: "POST",
            });
            setReport(data.report);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Relatório personalizado</h1>
            <button onClick={handleGenerate} disabled={status === "loading"}>
                {status === "loading" ? "A gerar..." : "Gerar relatório"}
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && report && (
                <article>
                    <p>{report.cosmeticSummary}</p>
                    <h2>Rotina sugerida</h2>
                    <ul>
                        {report.routineSuggestions.map((step) => (
                            <li key={`${step.period}-${step.title}`}>
                                <strong>{step.period}: {step.title}</strong>
                                <p>{step.reason}</p>
                            </li>
                        ))}
                    </ul>
                    <h2>Limitações</h2>
                    <ul>
                        {report.limitations.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </article>
            )}
        </section>
    );
}
```

```jsx
// client/src/App.jsx
import { FaceReportPage } from "./pages/FaceReportPage.jsx";

export function App() {
    return (
        <>
            <ProductSearchPage />
            <ProductDetailsPage />
            <ProductReviewPage />
            <RelatedProductsPage />
            <FacePhotoUploadPage />
            <FaceAnalysisPage />
            <FaceReportPage />
        </>
    );
}
```

5. Explicação do código: a UI mostra resumo, rotina e limitações. Isto torna o resultado explicável para o cliente.
6. Como validar este passo: tenta gerar relatório antes da análise e confirma erro.
7. Erros comuns ou cenário negativo: esconder limitações cria confiança excessiva no resultado.

### Passo 7 - Validar ausência de compra automática

1. Explicação simples do objetivo: confirmar que o relatório não cria carrinho, encomenda ou recomendação comercial automática.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/face-report.service.js`
    - REVER: `server/src/controllers/face-report.controller.js`
    - REVER: `client/src/pages/FaceReportPage.jsx`
3. O que fazer: procura chamadas ou imports relacionados com carrinho, encomenda ou checkout nos ficheiros do relatório.
4. Código completo, correto e integrado:

```bash
rg -n "cart|checkout|order|purchase|Product" server/src/services/face-report.service.js server/src/controllers/face-report.controller.js client/src/pages/FaceReportPage.jsx
```

5. Explicação do código: o comando deve ficar sem resultados para confirmar que o relatório se mantém cosmético.
6. Como validar este passo: executa o comando e confirma que não há referências comerciais no fluxo do relatório.
7. Erros comuns ou cenário negativo: criar encomenda a partir de sinais cosméticos altera o contrato e exige consentimentos e regras adicionais.

### Passo 8 - Validar negativos do relatório

1. Explicação simples do objetivo: garantir que o relatório só nasce a partir de uma análise concluída do próprio utilizador.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/face-report.service.js`
    - REVER: `server/src/routes/face-report.routes.js`
3. O que fazer: testa sem sessão, com sessão sem análise e com sessão cujo último registo ainda não esteja concluído.
4. Código completo, correto e integrado:

```bash
curl -i -X POST http://localhost:3001/api/face-reports/latest
curl -i -X POST http://localhost:3001/api/face-reports/latest \
    -H "Cookie: orelle_session=COOKIE_CLIENTE_SEM_ANALISE"
curl -i -X POST http://localhost:3001/api/face-reports/latest \
    -H "Cookie: orelle_session=COOKIE_CLIENTE_COM_ANALISE_PENDENTE"
```

5. Explicação do código: os pedidos confirmam autenticação e dependência de uma análise concluída. Os pedidos autenticados usam o cookie `orelle_session` criado no login do `BK-MF0-02`; no browser, o `apiClient` envia esse cookie com `credentials: "include"` e não envia token.
6. Como validar este passo: confirma `401` no primeiro pedido e `400` nos restantes.
7. Erros comuns ou cenário negativo: usar qualquer análise existente na coleção pode expor dados de outro utilizador; validar com header de autorização por token incentivaria um segundo sistema de autenticação.

### Validação
- [ ] Negativos: mínimo `3` cenários.
- [ ] Sem sessão devolve `401`.
- [ ] Sem análise concluída devolve `400`.
- [ ] Relatório não cria carrinho, encomenda ou checkout.
- [ ] Resposta inclui resumo, rotina, sources e limitations.

### Matriz mínima de testes por prioridade

| Camada | Evidência |
| --- | --- |
| Model | `FaceReport` guarda resumo, rotina, sources e limitations. |
| Service | Usa apenas análise do próprio utilizador. |
| Controller/route | Endpoint cria relatório com `201`. |
| UI | Página mostra resumo, rotina e limites. |

Evidência de testes por camada:
- API: output de relatório criado e erro sem análise.
- Service: teste de ausência de análise concluída.
- UI: screenshot do relatório.

## Expected results
- Com análise concluída: `201` com `{ "report": ... }`.
- Sem sessão: `401`.
- Sem análise: `400`.
- A resposta inclui resumo, rotina, fontes e limitações.

## Critérios de aceite
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada documentada.
- Relatório pertence ao utilizador autenticado.
- Não existem recomendações automáticas de compra.
- O texto deixa claro que a leitura é cosmética.
- O relatório prepara histórico em `BK-MF1-08`.

## Validação final
- Fazer análise no BK anterior.
- Gerar relatório.
- Repetir sem análise num utilizador novo e confirmar `400`.

## Evidence para PR/defesa
- Output de relatório com `201`.
- Output sem análise com `400`.
- Screenshot do relatório com rotina e limitações.

## Handoff

### Handoff

`BK-MF1-08` deve listar análises e relatórios do próprio utilizador, preservando ownership e ordem temporal.

## Changelog
- `2026-05-31`: guia revisto com modelo de relatório, service, route, UI, limites cosméticos e handoff para histórico.
