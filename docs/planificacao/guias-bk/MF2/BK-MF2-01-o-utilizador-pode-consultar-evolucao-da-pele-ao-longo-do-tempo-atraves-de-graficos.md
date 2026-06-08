# BK-MF2-01 - O utilizador pode consultar evolução da pele ao longo do tempo através de gráficos

## Header
- `doc_id`: `GUIA-BK-MF2-01`
- `bk_id`: `BK-MF2-01`
- `macro`: `MF2`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P2`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF1-08`
- `rf_rnf`: `RF17`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-02`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-01-o-utilizador-pode-consultar-evolucao-da-pele-ao-longo-do-tempo-atraves-de-graficos.md`
- `last_updated`: `2026-06-08`

## Contexto do BK
- Entrega alvo: implementar `RF17`, permitindo ao cliente consultar evolução da pele ao longo do tempo através de gráficos.
- CANONICO: `RF17` depende do histórico pessoal criado em `BK-MF1-08`.
- DERIVADO: a evolução é calculada a partir de `FaceAnalysis.findings`, porque `BK-MF1-06` já guarda acne, manchas, rugas, oleosidade e tipo de pele.
- Este BK não cria nova análise facial; apenas transforma análises concluídas em séries temporais seguras.

## Objetivo
Neste BK vais criar uma API autenticada e uma página React para mostrar a evolução cosmética do próprio utilizador em gráfico.

## Importância
Sem gráfico, o histórico fica difícil de interpretar. A evolução visual ajuda o cliente a perceber tendências sem expor fotografias, caminhos internos, IDs de consentimento ou dados de outros utilizadores.

## Scope-in
- Criar `GET /api/me/skin-evolution`.
- Ler apenas análises concluídas do utilizador autenticado.
- Converter labels cosméticas em pontuações simples para gráfico.
- Criar `SkinEvolutionPage` com estados `loading`, `error`, `empty` e `success`.

## Scope-out
- Não comparar fotografias após 30 dias; isso pertence a `RF25`.
- Não criar recomendações de produto; isso começa em `BK-MF2-02`.
- Não devolver `photoIds`, `consentId`, `storageKey` ou ficheiros privados.

## Estado antes
`PARCIAL`: havia intenção de endpoint e service, mas faltavam controller completo, gráfico real e DTO final bem explicado.

## Estado depois
`OK`: o BK passa a ter fluxo completo `route -> controller -> service -> página`, com gráfico SVG acessível e validação negativa mínima.

## Pré-requisitos
- `BK-MF0-02`: sessão autenticada com cookie HttpOnly e `requireAuth`.
- `BK-MF1-06`: modelo `FaceAnalysis` com `findings`, `status`, `sources` e `limitations`.
- `BK-MF1-08`: histórico pessoal filtrado por `userId`.

## Glossário
- `finding`: resultado cosmético guardado numa análise, por exemplo acne ou oleosidade.
- `pontuação`: número derivado de uma label para desenhar uma linha no gráfico.
- `DTO público`: resposta da API com apenas os dados necessários ao frontend.
- `ownership`: regra que obriga o backend a usar `req.user.id` em vez de aceitar `userId` do browser.

## Conceitos teóricos
Uma `route` recebe o pedido HTTP e aplica middleware. O `controller` transforma o pedido numa chamada ao service e devolve JSON. O `service` contém a regra de negócio: neste caso, procurar análises concluídas do utilizador autenticado e transformar dados cosméticos em pontos de gráfico.

No frontend, `useEffect` executa o carregamento inicial, `useState` guarda estados da página e `fetch` deve usar `credentials: "include"` para enviar o cookie de sessão. O token não é guardado no `localStorage`, porque isso aumentaria o risco de exposição em caso de XSS.

Para privacidade, o gráfico não precisa de fotografias nem de identificadores internos de consentimento. A resposta devolve datas, pontuações e limitações. Este BK evita diagnóstico médico: mostra tendências cosméticas derivadas das labels já produzidas pela análise anterior.

## Arquitetura do BK
- `skin-evolution.routes.js`: cria o endpoint protegido.
- `skin-evolution.controller.js`: chama o service com `req.user.id`.
- `skin-evolution.service.js`: lê `FaceAnalysis`, calcula pontos e devolve DTO.
- `SkinEvolutionPage.jsx`: apresenta gráfico SVG e estados da UI.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/services/skin-evolution.service.js`
- CRIAR: `server/src/controllers/skin-evolution.controller.js`
- CRIAR: `server/src/routes/skin-evolution.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/SkinEvolutionPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/face-analysis.model.js`
- REVER: `client/src/services/apiClient.js`

## Bloco pedagógico
### Objetivo
Implementar `RF17` com código final, integrado e seguro.

### Pré-requisitos
- Confirmar que `FaceAnalysis` existe desde `BK-MF1-06`.
- Confirmar que a app já usa `requireAuth`.
- Confirmar que o frontend usa `credentials: "include"` no cliente API.

### Erros comuns
- Aceitar `userId` no query string.
- Tentar desenhar gráfico a partir de fotografias.
- Devolver documentos Mongoose completos.
- Apresentar pontuações cosméticas como diagnóstico.

### Check de compreensão
- [ ] Sei explicar porque a API usa `req.user.id`.
- [ ] Sei dizer que campos não podem sair na resposta.
- [ ] Sei testar o pedido sem sessão.

### Tempo estimado
- `P2`: 60-90 minutos, incluindo teste negativo.

## Bloco operacional
### Entrada
- BK: `BK-MF2-01`
- Requisito: `RF17`
- Endpoint principal: `GET /api/me/skin-evolution`

### Passos
1. Confirmar contrato funcional e limites.
2. Criar service de evolução.
3. Criar controller e route.
4. Registar route na app.
5. Criar página com gráfico.
6. Executar cenários negativos obrigatórios (mínimo 1).

### Cenários negativos recomendados
- Pedido sem sessão deve devolver `401`.
- Utilizador sem análises concluídas deve receber lista vazia e estado `empty`.

### Validação
- [ ] Smoke: `GET /api/me/skin-evolution` devolve `200` com sessão válida.
- [ ] Negativos: mínimo `1` cenários com resultado controlado.
- [ ] Segurança: resposta não inclui `photoIds`, `consentId` nem `storageKey`.
- [ ] UI: página mostra estados `loading`, `error`, `empty` e `success`.

### Matriz mínima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
O próximo BK usa análise e histórico para gerar recomendações. Este endpoint não deve ser misturado com catálogo ou checkout.

## Passos lineares
### Passo 1 - Confirmar contrato e limites

1. Explicação simples do objetivo: garantir que o BK implementa apenas evolução temporal.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: linhas de `RF17` e `BK-MF2-01`.
3. O que fazer: confirma que o requisito fala em gráficos e que a dependência é `BK-MF1-08`.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: a leitura documental evita trazer comparação de imagens, carrinho ou recomendação para este BK.
6. Como validar este passo: o PR deve referir `RF17` e não deve criar endpoints de produtos.
7. Erros comuns ou cenário negativo: tentar usar fotografias diretamente para gráfico expõe dados sensíveis sem necessidade.

### Passo 2 - Criar service de evolução

1. Explicação simples do objetivo: transformar análises concluídas em pontos de gráfico.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/skin-evolution.service.js`
    - REVER: `server/src/models/face-analysis.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o service com filtro por `userId`, ordenação temporal e DTO público.
4. Código completo, correto e integrado.

```js
// server/src/services/skin-evolution.service.js
import { FaceAnalysis } from "../models/face-analysis.model.js";

const SCORE_BY_LABEL = new Map([
    ["baixo", 1],
    ["baixa", 1],
    ["moderado", 2],
    ["moderada", 2],
    ["alto", 3],
    ["alta", 3],
]);

const TRACKED_FINDINGS = ["acne", "manchas", "rugas", "oleosidade"];

function toScore(finding) {
    return SCORE_BY_LABEL.get(finding?.label) ?? null;
}

function toPoint(analysis) {
    const scores = Object.fromEntries(
        TRACKED_FINDINGS.map((key) => [`${key}Score`, toScore(analysis.findings?.[key])]),
    );

    return {
        analysisId: analysis._id.toString(),
        createdAt: analysis.createdAt,
        skinType: analysis.findings?.skinType?.label ?? "nao_conclusivo",
        ...scores,
    };
}

export async function getMySkinEvolution(userId) {
    const analyses = await FaceAnalysis.find({ userId, status: "completed" })
        .select("findings createdAt")
        .sort({ createdAt: 1 })
        .limit(30);

    return {
        points: analyses.map(toPoint),
        scale: {
            1: "baixo",
            2: "moderado",
            3: "alto",
        },
        limitations: [
            "Pontuações cosméticas derivadas das labels guardadas.",
            "Não substitui avaliação médica.",
            "Resultados dependem da qualidade das fotografias usadas nas análises anteriores.",
        ],
    };
}
```

5. Explicação do código: o service só consulta análises do utilizador da sessão, seleciona apenas `findings` e `createdAt`, e converte labels em números. O `analysisId` serve para identificar o ponto no frontend, mas a resposta não expõe fotografias, consentimento ou caminhos internos.
6. Como validar este passo: criar duas análises concluídas do mesmo utilizador e confirmar que `points` vem ordenado por data.
7. Erros comuns ou cenário negativo: consultar `FaceAnalysis.find()` sem `userId` mostraria dados de outros utilizadores.

### Passo 3 - Criar controller e route

1. Explicação simples do objetivo: expor o service por API autenticada.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/skin-evolution.controller.js`
    - CRIAR: `server/src/routes/skin-evolution.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: cria controller fino e route com `requireAuth`.
4. Código completo, correto e integrado.

```js
// server/src/controllers/skin-evolution.controller.js
import { getMySkinEvolution } from "../services/skin-evolution.service.js";

export async function getMySkinEvolutionController(req, res, next) {
    try {
        const evolution = await getMySkinEvolution(req.user.id);
        return res.status(200).json({ evolution });
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/skin-evolution.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMySkinEvolutionController } from "../controllers/skin-evolution.controller.js";

export const skinEvolutionRoutes = Router();

skinEvolutionRoutes.get(
    "/me/skin-evolution",
    requireAuth,
    getMySkinEvolutionController,
);
```

5. Explicação do código: o controller não lê `userId` do body ou da URL. A route aplica `requireAuth` antes do controller, por isso pedidos sem sessão terminam antes de consultar MongoDB.
6. Como validar este passo: sem cookie de sessão, o endpoint deve devolver `401`.
7. Erros comuns ou cenário negativo: colocar ownership apenas na UI não protege chamadas diretas à API.

### Passo 4 - Registar route na app

1. Explicação simples do objetivo: ligar a route ao prefixo `/api`.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: zona de imports e registo de routes.
3. O que fazer: importa a route e adiciona `app.use`.
4. Código completo, correto e integrado.

```js
// server/src/app.js
import { skinEvolutionRoutes } from "./routes/skin-evolution.routes.js";

app.use("/api", skinEvolutionRoutes);
```

5. Explicação do código: o endpoint final fica `GET /api/me/skin-evolution`, mantendo o padrão das rotas anteriores.
6. Como validar este passo: arrancar a API e confirmar que a route existe.
7. Erros comuns ou cenário negativo: registar a route sem prefixo muda o contrato para o frontend.

### Passo 5 - Criar página com gráfico

1. Explicação simples do objetivo: mostrar a evolução sem depender de bibliotecas extra.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/SkinEvolutionPage.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria uma página React com gráfico SVG simples e estados de UI.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/SkinEvolutionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const SERIES = [
    { key: "acneScore", label: "Acne", color: "#0f766e" },
    { key: "manchasScore", label: "Manchas", color: "#7c3aed" },
    { key: "rugasScore", label: "Rugas", color: "#c2410c" },
    { key: "oleosidadeScore", label: "Oleosidade", color: "#1d4ed8" },
];

function buildPolyline(points, key) {
    const validPoints = points.filter((point) => typeof point[key] === "number");

    if (validPoints.length === 0) {
        return "";
    }

    return validPoints
        .map((point, index) => {
            const x = validPoints.length === 1 ? 50 : 10 + (index * 80) / (validPoints.length - 1);
            const y = 90 - ((point[key] - 1) * 35);
            return `${x},${y}`;
        })
        .join(" ");
}

export function SkinEvolutionPage() {
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const [evolution, setEvolution] = useState(null);

    useEffect(() => {
        let active = true;

        async function loadEvolution() {
            try {
                const data = await apiRequest("/api/me/skin-evolution");

                if (!active) return;

                setEvolution(data.evolution);
                setStatus(data.evolution.points.length === 0 ? "empty" : "success");
            } catch (err) {
                if (!active) return;

                setError(err.message);
                setStatus("error");
            }
        }

        loadEvolution();

        return () => {
            active = false;
        };
    }, []);

    const polylines = useMemo(() => {
        const points = evolution?.points ?? [];
        return SERIES.map((serie) => ({
            ...serie,
            points: buildPolyline(points, serie.key),
        }));
    }, [evolution]);

    if (status === "loading") {
        return <p>A carregar evolução da pele...</p>;
    }

    if (status === "error") {
        return <p role="alert">{error}</p>;
    }

    if (status === "empty") {
        return <p>Ainda não existem análises suficientes para desenhar evolução.</p>;
    }

    return (
        <section>
            <h1>Evolução da pele</h1>
            <svg viewBox="0 0 100 100" role="img" aria-labelledby="skin-evolution-title">
                <title id="skin-evolution-title">Gráfico de evolução cosmética</title>
                <line x1="10" y1="20" x2="10" y2="90" stroke="#94a3b8" />
                <line x1="10" y1="90" x2="90" y2="90" stroke="#94a3b8" />
                {polylines.map((serie) => (
                    <polyline
                        key={serie.key}
                        points={serie.points}
                        fill="none"
                        stroke={serie.color}
                        strokeWidth="2"
                    />
                ))}
            </svg>
            <ul>
                {SERIES.map((serie) => (
                    <li key={serie.key}>
                        <span aria-hidden="true" style={{ color: serie.color }}>●</span> {serie.label}
                    </li>
                ))}
            </ul>
            <p>Escala: 1 baixo, 2 moderado, 3 alto.</p>
        </section>
    );
}
```

5. Explicação do código: a página carrega o endpoint com o cliente API existente, que deve enviar cookies com `credentials: "include"`. O SVG desenha linhas a partir dos pontos recebidos, sem bibliotecas novas. O estado `empty` evita mostrar um gráfico vazio como se tivesse dados.
6. Como validar este passo: testar utilizador com zero análises e utilizador com duas análises concluídas.
7. Erros comuns ou cenário negativo: guardar token no browser para chamar a API aumenta risco de exposição e não é necessário.

### Passo 6 - Registar página no frontend

1. Explicação simples do objetivo: tornar a página acessível na aplicação.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: imports e lista de rotas/páginas.
3. O que fazer: importar a página e adicioná-la ao router ou ao menu interno já usado no projeto.
4. Código completo, correto e integrado.

```jsx
// client/src/App.jsx
import { SkinEvolutionPage } from "./pages/SkinEvolutionPage.jsx";

// Dentro da configuração de rotas:
{
    path: "/skin-evolution",
    element: <SkinEvolutionPage />,
}
```

5. Explicação do código: o frontend passa a ter uma entrada clara para `RF17`. A página continua dependente da sessão real, porque a API rejeita pedidos sem cookie válido.
6. Como validar este passo: abrir `/skin-evolution` com sessão ativa e confirmar que existe pedido para `/api/me/skin-evolution`.
7. Erros comuns ou cenário negativo: criar página pública sem sessão cria falsa sensação de acesso autorizado.

### Passo 7 - Validar negativos obrigatórios

1. Explicação simples do objetivo: provar que o endpoint falha de forma controlada.
2. Ficheiros envolvidos.
    - REVER: `server/src/routes/skin-evolution.routes.js`
    - REVER: `server/src/services/skin-evolution.service.js`
    - LOCALIZAÇÃO: route e filtro `userId`.
3. O que fazer: executar pedidos sem sessão e com utilizador sem análises.
4. Código completo, correto e integrado.

```bash
curl -i http://localhost:3001/api/me/skin-evolution
curl -i http://localhost:3001/api/me/skin-evolution -H "Cookie: orelle_session=COOKIE_SEM_ANALISES"
```

5. Explicação do código: o primeiro pedido valida autenticação. O segundo valida estado vazio sem erro técnico.
6. Como validar este passo: registar `401` no primeiro pedido e `200` com `points: []` no segundo.
7. Erros comuns ou cenário negativo: devolver `500` por falta de dados torna a UI instável.

## Expected results
- `GET /api/me/skin-evolution` sem sessão devolve `401`.
- `GET /api/me/skin-evolution` com sessão e sem análises devolve `200` com `points: []`.
- `GET /api/me/skin-evolution` com análises concluídas devolve `200` com pontos ordenados por data.
- A página mostra gráfico SVG quando existem pontos e não mostra dados biométricos internos.

## Critérios de aceite
- Entrega funcional de `RF17` concluída.
- Cenários negativos concluídos: mínimo `1`.
- Evidência de testes por camada conforme prioridade `P2`.
- DTO público sem `photoIds`, `consentId` e `storageKey`.
- O código mantém o padrão `routes -> controller -> service`.
- A UI cobre `loading`, `error`, `empty` e `success`.

## Validação final
- Executar pedido autenticado e não autenticado.
- Confirmar que o gráfico é legível com 1, 2 e 3 pontos.
- Rever imports em `server/src/app.js` e `client/src/App.jsx`.
- Executar `git diff --check` antes do PR.

## Evidence para PR/defesa
- `proof_tecnico`: resposta JSON do endpoint com duas análises concluídas.
- `proof_negativos`: `401` sem sessão e `200` vazio sem análises.
- `proof_negocio`: screenshot do gráfico com tendência temporal.

## Handoff
`BK-MF2-02` deve usar análise e histórico para recomendar produtos. Não deve importar a página deste BK; deve reutilizar os modelos de MF1 e manter ownership por sessão.

## Changelog
- `2026-06-08`: guia reescrito com service, controller, route, gráfico SVG, estados de UI e cenários negativos.
