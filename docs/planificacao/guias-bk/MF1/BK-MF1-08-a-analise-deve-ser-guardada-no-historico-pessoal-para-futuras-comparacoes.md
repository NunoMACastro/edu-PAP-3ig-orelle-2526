# BK-MF1-08 - A análise deve ser guardada no histórico pessoal para futuras comparações

## Header
- `doc_id`: `GUIA-BK-MF1-08`
- `bk_id`: `BK-MF1-08`
- `macro`: `MF1`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF1-07`
- `rf_rnf`: `RF16`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-01`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-08-a-analise-deve-ser-guardada-no-historico-pessoal-para-futuras-comparacoes.md`
- `last_updated`: `2026-05-31`

## Objetivo
Neste BK vais expor o histórico pessoal de análises e relatórios do utilizador autenticado.

## Importância
O histórico permite comparar evolução ao longo do tempo em `BK-MF2-01` e comparar imagens após 30 dias em `BK-MF3-01`. Como contém dados sensíveis, deve aplicar ownership no backend.

## Scope-in
- Criar endpoint `GET /api/me/skin-history`.
- Listar análises e relatórios do próprio utilizador.
- Ordenar por data.
- Não devolver caminhos internos de fotografias.
- Criar página React com estados `loading`, `error`, `empty` e `success`.

## Scope-out
- Não criar gráficos; isso fica para `BK-MF2-01`.
- Não comparar imagens; isso fica para `BK-MF3-01`.
- Não criar painel de eliminação/anonymização.

## Pré-requisitos
- `BK-MF1-06`: análises guardadas em `FaceAnalysis`.
- `BK-MF1-07`: relatórios guardados em `FaceReport`.
- `BK-MF0-02`: `requireAuth`.

## Glossário
- Histórico pessoal: lista cronológica de análises e relatórios do próprio cliente.
- Evolução temporal: comparação futura entre resultados ao longo do tempo.
- Ownership: regra que impede um utilizador de ler histórico de outro.

## Conceitos teóricos
Histórico pessoal não é gráfico. Este BK organiza dados em formato temporal. O gráfico virá depois, usando a resposta deste endpoint.

O backend nunca aceita `userId` por query param. A identidade vem da sessão. Isto impede que alguém tente chamar `/api/me/skin-history?userId=outro`.

Como o histórico junta análises e relatórios, a resposta deve ser curta, ordenada e sem dados de armazenamento. Não há paths, `storageKey`, IDs de consentimento ou detalhes de ficheiro; há apenas informação necessária para o cliente ver evolução e para BKs futuros criarem gráficos ou comparações.

O limite de resultados protege performance e privacidade. Mesmo que o utilizador tenha muitos registos, este BK devolve um conjunto recente e previsível, preparado para paginação futura se o histórico crescer.

## Arquitetura do BK
- `GET /api/me/skin-history`
- `getPersonalSkinHistory`
- `SkinHistoryPage`

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/services/skin-history.service.js`
- CRIAR: `server/src/controllers/skin-history.controller.js`
- CRIAR: `server/src/routes/skin-history.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/SkinHistoryPage.jsx`
- EDITAR: `client/src/App.jsx`

## Bloco pedagogico

### Objetivo
Listar historico pessoal de analises e relatorios sem permitir acesso cruzado entre utilizadores.

### Pre-requisitos
- Ter `FaceAnalysis` em `BK-MF1-06`.
- Ter `FaceReport` em `BK-MF1-07`.
- Ter sessao autenticada com `req.user.id`.

### Erros comuns
- Aceitar `userId` vindo da query.
- Devolver paths ou `storageKey` de fotografias.
- Misturar historico de utilizadores diferentes.

### Check de compreensao
- Porque e que a rota usa `/api/me/skin-history`?
- Que tipos de entrada entram no historico?
- Como validar que o utilizador A nao ve dados do utilizador B?

## Bloco operacional

### Entrada
- Sessao autenticada.
- Analises e relatorios do proprio utilizador.
- Resposta temporal ordenada por data.

### Passos
Executar cenarios negativos obrigatorios (minimo 2).

Segue os passos lineares abaixo e valida sem sessao, sem dados e tentativa de manipular `userId`.

## Passos lineares

### Passo 1 - Confirmar contrato do histórico

1. Explicação simples do objetivo: garantir que o histórico pertence ao utilizador autenticado.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: `RF16`, `RF17` e `RF25`.
3. O que fazer: confirma que `RF16` prepara comparações futuras.
4. Código completo, correto e integrado: sem código novo neste passo.
5. Explicação do código: o histórico é a ponte entre análise, evolução temporal e comparação futura. Este passo define o endpoint como leitura pessoal e sensível, para que gráficos e comparações futuras usem um contrato seguro em vez de consultar fotografias diretamente.
6. Como validar este passo: a rota não deve receber `userId`.
7. Erros comuns ou cenário negativo: permitir consultar histórico por ID enviado pelo frontend quebra privacidade.

### Passo 2 - Criar service de histórico

1. Explicação simples do objetivo: listar análises e relatórios do utilizador da sessão.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/skin-history.service.js`
    - REVER: `server/src/models/face-analysis.model.js`
    - REVER: `server/src/models/face-report.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o service.
4. Código completo, correto e integrado:

```js
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";

function toAnalysisHistoryItem(analysis) {
    return {
        id: analysis._id.toString(),
        type: "analysis",
        createdAt: analysis.createdAt,
        providerName: analysis.providerName,
        findings: analysis.findings,
        limitations: analysis.limitations,
    };
}

function toReportHistoryItem(report) {
    return {
        id: report._id.toString(),
        type: "report",
        analysisId: report.analysisId.toString(),
        createdAt: report.createdAt,
        cosmeticSummary: report.cosmeticSummary,
        routineSuggestions: report.routineSuggestions,
        limitations: report.limitations,
    };
}

export async function getPersonalSkinHistory(userId) {
    const [analyses, reports] = await Promise.all([
        FaceAnalysis.find({ userId })
            .select("providerName findings limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(30),
        FaceReport.find({ userId })
            .select("analysisId cosmeticSummary routineSuggestions limitations createdAt")
            .sort({ createdAt: -1 })
            .limit(30),
    ]);

    return [...analyses.map(toAnalysisHistoryItem), ...reports.map(toReportHistoryItem)]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
```

5. Explicação do código: o service filtra por `userId` da sessão e nunca por valor vindo do frontend. O `.select(...)` limita os campos devolvidos e impede que o histórico transporte detalhes técnicos desnecessários, como IDs de fotografias, consentimento ou storage.
6. Como validar este passo: cria dados para dois utilizadores e confirma que cada um vê apenas os seus; confirma também que a resposta não inclui `storageKey`, `photoIds` ou `consentId`.
7. Erros comuns ou cenário negativo: listar sem filtro por `userId` expõe dados biométricos de todos; devolver documentos completos aumenta superfície de fuga de dados.

### Passo 3 - Criar controller e route

1. Explicação simples do objetivo: expor o histórico com autenticação.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/skin-history.controller.js`
    - CRIAR: `server/src/routes/skin-history.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: cria controller e route.
4. Código completo, correto e integrado:

```js
// server/src/controllers/skin-history.controller.js
import { getPersonalSkinHistory } from "../services/skin-history.service.js";

export async function getMySkinHistoryController(req, res, next) {
    try {
        const history = await getPersonalSkinHistory(req.user.id);
        return res.status(200).json({ history });
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/skin-history.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMySkinHistoryController } from "../controllers/skin-history.controller.js";

export const skinHistoryRoutes = Router();

skinHistoryRoutes.get(
    "/me/skin-history",
    requireAuth,
    getMySkinHistoryController,
);
```

5. Explicação do código: a rota usa `/me` para deixar claro que só devolve dados do próprio utilizador.
6. Como validar este passo: sem sessão, espera `401`.
7. Erros comuns ou cenário negativo: criar `/users/:userId/history` neste BK abre risco de acesso cruzado.

### Passo 4 - Registar route na app

1. Explicação simples do objetivo: ligar o histórico ao Express.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: imports e routes.
3. O que fazer: adiciona a route.
4. Código completo, correto e integrado:

```js
import { skinHistoryRoutes } from "./routes/skin-history.routes.js";

app.use("/api", skinHistoryRoutes);
```

5. Explicação do código: o endpoint final é `GET /api/me/skin-history`. Montar a route em `/api` preserva o prefixo comum da aplicação e mantém `/me` como sinal de que os dados pertencem ao utilizador autenticado.
6. Como validar este passo: confirma que a rota autenticada existe.
7. Erros comuns ou cenário negativo: registar sem `requireAuth` expõe dados sensíveis.

### Passo 5 - Criar página de histórico

1. Explicação simples do objetivo: mostrar histórico pessoal ao cliente.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/SkinHistoryPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: ficheiro completo e imports do `App`.
3. O que fazer: cria e regista a página.
4. Código completo, correto e integrado:

```jsx
// client/src/pages/SkinHistoryPage.jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function SkinHistoryPage() {
    const [history, setHistory] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function loadHistory() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/me/skin-history");
            setHistory(data.history);
            setStatus(data.history.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Histórico pessoal de pele</h1>
            <button onClick={loadHistory} disabled={status === "loading"}>
                {status === "loading" ? "A carregar..." : "Ver histórico"}
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem análises ou relatórios.</p>}
            {status === "success" && (
                <ol>
                    {history.map((item) => (
                        <li key={`${item.type}-${item.id}`}>
                            <strong>{item.type === "analysis" ? "Análise" : "Relatório"}</strong>
                            <time dateTime={item.createdAt}>
                                {new Date(item.createdAt).toLocaleString("pt-PT")}
                            </time>
                            {item.type === "report" ? (
                                <p>{item.cosmeticSummary}</p>
                            ) : (
                                <p>Provider: {item.providerName}</p>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
```

```jsx
// client/src/App.jsx
import { SkinHistoryPage } from "./pages/SkinHistoryPage.jsx";

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
            <SkinHistoryPage />
        </>
    );
}
```

5. Explicação do código: a página mostra lista temporal e distingue análise de relatório.
6. Como validar este passo: gera análise e relatório, depois carrega o histórico.
7. Erros comuns ou cenário negativo: mostrar paths de fotografias não é necessário e seria inseguro.

### Passo 6 - Validar negativos de ownership

1. Explicação simples do objetivo: confirmar que o histórico nunca aceita `userId` vindo do cliente.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/skin-history.service.js`
    - REVER: `server/src/controllers/skin-history.controller.js`
    - REVER: `server/src/routes/skin-history.routes.js`
3. O que fazer: cria dados para dois utilizadores e consulta o histórico com cada sessão.
4. Código completo, correto e integrado:

```bash
curl -i http://localhost:3000/api/me/skin-history \
    -H "Authorization: Bearer TOKEN_UTILIZADOR_A"
curl -i "http://localhost:3000/api/me/skin-history?userId=ID_UTILIZADOR_B" \
    -H "Authorization: Bearer TOKEN_UTILIZADOR_A"
curl -i http://localhost:3000/api/me/skin-history \
    -H "Authorization: Bearer TOKEN_UTILIZADOR_B"
```

5. Explicação do código: o segundo pedido tenta manipular o ownership, mas o backend deve continuar a usar apenas `req.user.id`.
6. Como validar este passo: confirma que o utilizador A nunca recebe entradas do utilizador B.
7. Erros comuns ou cenário negativo: aceitar `userId` na query transforma o histórico numa fuga direta de dados pessoais.

### Validacao
- [ ] Negativos: minimo `2` cenarios.
- [ ] Sem sessao devolve `401`.
- [ ] Query com `userId` externo nao altera ownership.
- [ ] Historico vazio devolve lista vazia.
- [ ] Resposta nao inclui `storageKey` nem paths internos.

### Matriz minima de testes por prioridade

| Camada | Evidencia |
| --- | --- |
| Service | Consulta filtra por `req.user.id`. |
| Controller/route | Endpoint `/api/me/skin-history` autenticado. |
| UI | Pagina mostra lista temporal ou vazio. |

Evidencia de testes por camada:
- API: output com historico, sem sessao e tentativa de `userId` externo.
- Service: teste de isolamento entre dois utilizadores.
- UI: screenshot da lista temporal.

## Expected results
- Com sessão: `200` com `{ "history": [...] }`.
- Sem sessão: `401`.
- Sem dados: `200` com lista vazia.
- A resposta não inclui `storageKey` nem paths internos.
- A resposta não inclui `photoIds` nem `consentId`.

## Criterios de aceite
- Cenarios negativos concluidos: minimo `2`.
- Evidencia de testes por camada documentada.
- O backend filtra por `req.user.id`.
- A UI mostra estado vazio.
- O histórico está ordenado por data descrescente.
- O contrato prepara gráficos em `BK-MF2-01`.

## Validação final
- Criar análise e relatório.
- Chamar `GET /api/me/skin-history`.
- Entrar com outro utilizador e confirmar que não vê os dados anteriores.

## Evidence para PR/defesa
- Output do histórico com dados.
- Output sem sessão com `401`.
- Screenshot da UI com lista temporal.

## Handoff

### Handoff

`BK-MF2-01` deve usar `history` para construir gráficos. Não deve voltar a consultar fotografias diretamente nem contornar `GET /api/me/skin-history`.

## Changelog
- `2026-05-31`: guia revisto com histórico pessoal, ownership, route autenticada e UI.
