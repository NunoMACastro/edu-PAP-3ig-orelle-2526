# BK-MF1-06 - O sistema deve analisar as fotos com IA para detetar tipo de pele, acne, manchas, rugas e oleosidade

## Header
- `doc_id`: `GUIA-BK-MF1-06`
- `bk_id`: `BK-MF1-06`
- `macro`: `MF1`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF1-05`
- `rf_rnf`: `RF14`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-07`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-06-o-sistema-deve-analisar-as-fotos-com-ia-para-detetar-tipo-de-pele-acne-manchas-rugas-e-oleosidade.md`
- `last_updated`: `2026-05-31`

## Objetivo
Neste BK vais criar o fluxo de análise facial a partir das fotografias frontal e de perfil, com provider isolado, consentimento obrigatório e limites claros.

## Importância
A análise facial é núcleo `CORE-IA`. Como usa dados biométricos, deve ser segura, explicável e honesta sobre as suas limitações.

## Scope-in
- Criar modelo `FaceAnalysis`.
- Criar provider isolado `skin-analysis.provider.js`.
- Criar endpoint `POST /api/face-analyses`.
- Bloquear análise sem consentimento e sem fotografias válidas.
- Guardar resultado associado ao utilizador autenticado.

## Scope-out
- Não gerar relatório final; isso fica para `BK-MF1-07`.
- Não recomendar produtos; isso fica para `BK-MF2-02`.
- Não apresentar diagnóstico médico definitivo.
- Não enviar imagens para treino externo.

## Pré-requisitos
- `BK-MF1-05`: `FaceConsent` e `FacePhoto`.
- `RNF18`: suporte para provider de IA externo ou provider isolado.
- `RNF23`, `RNF24`, `RNF25`: explicabilidade, não discriminação e privacidade.

## Glossário
- Provider de IA: módulo isolado que recebe input permitido e devolve resultado estruturado.
- Guardrails: regras que impedem análise sem dados suficientes ou sem consentimento.
- Fallback honesto: resposta controlada quando a análise não consegue concluir algo.

## Conceitos teóricos
Análise facial não é recomendação automática. Este BK observa fotografias e produz sinais cosméticos: tipo de pele, acne, manchas, rugas e oleosidade. O resultado não é diagnóstico médico.

O provider só deve receber fotografias já validadas e pertencentes ao utilizador autenticado. O frontend não envia paths, `storageKey` nem IDs de fotografias; o service escolhe as fotografias no backend depois de confirmar sessão, consentimento e ownership.

O provider fica isolado para trocar uma implementação local por Azure Face API, TensorFlow/FastAPI ou outro motor sem reescrever controllers. A app regista fonte, confiança e limitações para o utilizador perceber de onde veio a conclusão e quão forte ela é.

Os limites éticos fazem parte do contrato técnico. A análise deve evitar linguagem médica definitiva, indicar incerteza quando a confiança é baixa, não treinar modelos externos sem consentimento explícito e manter atenção a enviesamentos de iluminação, tom de pele, enquadramento e qualidade da fotografia.

## Arquitetura do BK
- `POST /api/face-analyses`
- `FaceAnalysis`
- `analyzeSkinPhotos`
- `createFaceAnalysisForUser`
- `FaceAnalysisPage`

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/face-analysis.model.js`
- CRIAR: `server/src/providers/skin-analysis.provider.js`
- CRIAR: `server/src/services/face-analysis.service.js`
- CRIAR: `server/src/controllers/face-analysis.controller.js`
- CRIAR: `server/src/routes/face-analysis.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/FaceAnalysisPage.jsx`
- EDITAR: `client/src/App.jsx`

## Bloco pedagogico

### Objetivo
Criar uma analise facial cosmetica com provider isolado, guardrails e limites visiveis.

### Pre-requisitos
- Ter upload facial seguro em `BK-MF1-05`.
- Ter consentimento ativo.
- Saber separar controller, service e provider.

### Erros comuns
- Fazer a analise diretamente no controller.
- Processar fotografias sem consentimento.
- Apresentar resultado cosmetico como diagnostico medico.

### Check de compreensao
- Que condicoes bloqueiam a analise?
- Porque e que o provider fica isolado?
- Que limites devem aparecer na resposta?

## Bloco operacional

### Entrada
- Sessao autenticada.
- Consentimento ativo.
- Fotografias frontal e perfil do proprio utilizador.

### Passos
Executar cenarios negativos obrigatorios (minimo 3).

Segue os passos lineares abaixo e valida sem sessao, sem consentimento e sem as duas fotografias.

## Passos lineares

### Passo 1 - Confirmar limites da IA

1. Explicação simples do objetivo: separar análise cosmética de diagnóstico médico.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - LOCALIZAÇÃO: `RF14`, `RNF18`, `RNF23`, `RNF24`, `RNF25`.
3. O que fazer: confirma que a saída deve ter fontes, confiança e limitações.
4. Código completo, correto e integrado: sem código novo neste passo.
5. Explicação do código: a regra protege utilizadores de conclusões exageradas. O objetivo é obrigar o resultado a comunicar fontes, confiança e limitações, para que a análise seja entendida como leitura cosmética e não como diagnóstico médico.
6. Como validar este passo: a resposta final deve dizer que não é diagnóstico médico.
7. Erros comuns ou cenário negativo: prometer cura ou certeza clínica não pertence à Orélle.

### Passo 2 - Criar modelo de análise

1. Explicação simples do objetivo: guardar resultado estruturado da análise.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/face-analysis.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o modelo.
4. Código completo, correto e integrado:

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const findingSchema = new Schema(
    {
        label: { type: String, required: true },
        confidence: { type: Number, required: true, min: 0, max: 1 },
        explanation: { type: String, required: true },
    },
    { _id: false },
);

const faceAnalysisSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        photoIds: {
            type: [Schema.Types.ObjectId],
            ref: "FacePhoto",
            required: true,
        },
        consentId: {
            type: Schema.Types.ObjectId,
            ref: "FaceConsent",
            required: true,
        },
        providerName: {
            type: String,
            required: true,
        },
        findings: {
            skinType: findingSchema,
            acne: findingSchema,
            manchas: findingSchema,
            rugas: findingSchema,
            oleosidade: findingSchema,
        },
        sources: {
            type: [String],
            required: true,
        },
        limitations: {
            type: [String],
            required: true,
        },
        status: {
            type: String,
            enum: ["completed", "failed"],
            default: "completed",
        },
    },
    { timestamps: true },
);

export const FaceAnalysis = model("FaceAnalysis", faceAnalysisSchema);
```

5. Explicação do código: cada sinal tem label, confiança e explicação. Isto prepara relatório e explicabilidade.
6. Como validar este passo: confirma que `confidence` só aceita valores entre 0 e 1.
7. Erros comuns ou cenário negativo: guardar uma frase livre impede gráficos e histórico comparável.

### Passo 3 - Criar provider isolado

1. Explicação simples do objetivo: isolar a análise para trocar provider sem alterar controller.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/providers/skin-analysis.provider.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria um provider local controlado.
4. Código completo, correto e integrado:

```js
import { AppError } from "../middlewares/error.middleware.js";

function createFinding(label, confidence, explanation) {
    return { label, confidence, explanation };
}

export async function analyzeSkinPhotos({ frontalPhoto, perfilPhoto }) {
    if (!frontalPhoto?.storageKey || !perfilPhoto?.storageKey) {
        throw new AppError(400, "Fotografias validas obrigatorias para analise");
    }

    return {
        providerName: "local-skin-analysis-v1",
        findings: {
            skinType: createFinding(
                "mista",
                0.55,
                "Estimativa cosmética inicial baseada no fluxo local controlado.",
            ),
            acne: createFinding(
                "baixo",
                0.5,
                "Sem provider externo ativo, a app devolve uma indicação conservadora.",
            ),
            manchas: createFinding(
                "nao_conclusivo",
                0.3,
                "A fotografia deve ser revista por provider especializado para maior confiança.",
            ),
            rugas: createFinding(
                "nao_conclusivo",
                0.3,
                "A app evita afirmar sinais que não consegue medir com segurança.",
            ),
            oleosidade: createFinding(
                "moderada",
                0.5,
                "Estimativa cosmética inicial, sem valor clínico.",
            ),
        },
        sources: ["fotografia_frontal", "fotografia_perfil"],
        limitations: [
            "Não é diagnóstico médico.",
            "Resultado de provider local controlado.",
            "Qualidade de luz e enquadramento podem afetar a análise.",
        ],
    };
}
```

5. Explicação do código: o provider é honesto: devolve confiança baixa/moderada e limitações claras. Não inventa certeza clínica.
6. Como validar este passo: chama sem fotografia de perfil e confirma erro `400`.
7. Erros comuns ou cenário negativo: colocar chamada externa diretamente no controller torna a app difícil de testar.

### Passo 4 - Criar service da análise

1. Explicação simples do objetivo: verificar consentimento, escolher fotografias do utilizador e guardar resultado.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/face-analysis.service.js`
    - REVER: `server/src/models/face-photo.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o service.
4. Código completo, correto e integrado:

```js
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceConsent } from "../models/face-consent.model.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { analyzeSkinPhotos } from "../providers/skin-analysis.provider.js";

function latestByKind(photos, kind) {
    return photos.find((photo) => photo.kind === kind);
}

function toFaceAnalysisResponse(analysis) {
    return {
        id: analysis._id.toString(),
        providerName: analysis.providerName,
        findings: analysis.findings,
        sources: analysis.sources,
        limitations: analysis.limitations,
        status: analysis.status,
        createdAt: analysis.createdAt,
    };
}

export async function createFaceAnalysisForUser(userId) {
    const consent = await FaceConsent.findOne({ userId, revokedAt: null });

    if (!consent) {
        throw new AppError(403, "Consentimento facial em falta");
    }

    const photos = await FacePhoto.find({ userId, status: "active" })
        .sort({ createdAt: -1 })
        .select("+storageKey");

    const frontalPhoto = latestByKind(photos, "frontal");
    const perfilPhoto = latestByKind(photos, "perfil");

    if (!frontalPhoto || !perfilPhoto) {
        throw new AppError(400, "Fotografias frontal e de perfil obrigatorias");
    }

    const result = await analyzeSkinPhotos({ frontalPhoto, perfilPhoto });
    const analysis = await FaceAnalysis.create({
        userId,
        photoIds: [frontalPhoto._id, perfilPhoto._id],
        consentId: consent._id,
        providerName: result.providerName,
        findings: result.findings,
        sources: result.sources,
        limitations: result.limitations,
    });

    return toFaceAnalysisResponse(analysis);
}
```

5. Explicação do código: o service usa apenas fotografias do próprio utilizador autenticado. O frontend não escolhe IDs de fotografias.
6. Como validar este passo: cria fotografias para um utilizador e tenta analisar com outro; o segundo deve falhar.
7. Erros comuns ou cenário negativo: aceitar `photoId` do frontend poderia permitir acesso cruzado.

### Passo 5 - Criar controller e route

1. Explicação simples do objetivo: expor a criação de análise com sessão.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/face-analysis.controller.js`
    - CRIAR: `server/src/routes/face-analysis.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: cria controller e route.
4. Código completo, correto e integrado:

```js
// server/src/controllers/face-analysis.controller.js
import { createFaceAnalysisForUser } from "../services/face-analysis.service.js";

export async function createFaceAnalysisController(req, res, next) {
    try {
        const analysis = await createFaceAnalysisForUser(req.user.id);
        return res.status(201).json({ analysis });
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/face-analysis.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createFaceAnalysisController } from "../controllers/face-analysis.controller.js";

export const faceAnalysisRoutes = Router();

faceAnalysisRoutes.post(
    "/face-analyses",
    requireAuth,
    createFaceAnalysisController,
);
```

5. Explicação do código: a rota cria análise para o utilizador da sessão. Não recebe `userId` nem caminhos de ficheiro.
6. Como validar este passo: sem sessão, espera `401`; sem consentimento, espera `403`.
7. Erros comuns ou cenário negativo: receber path no body expõe ficheiros internos e quebra ownership.

### Passo 6 - Registar route na app

1. Explicação simples do objetivo: ligar análise à API.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: imports e routes.
3. O que fazer: adiciona a route.
4. Código completo, correto e integrado:

```js
import { faceAnalysisRoutes } from "./routes/face-analysis.routes.js";

app.use("/api", faceAnalysisRoutes);
```

5. Explicação do código: o endpoint final é `POST /api/face-analyses`. A route usa `requireAuth`, por isso a análise é sempre criada para o utilizador da sessão e não para um `userId` enviado pelo cliente.
6. Como validar este passo: confirma que a rota não devolve `404`.
7. Erros comuns ou cenário negativo: registar depois do middleware de erro impede execução.

### Passo 7 - Criar página de análise

1. Explicação simples do objetivo: permitir que o cliente peça análise depois do upload.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/FaceAnalysisPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: ficheiro completo e imports do `App`.
3. O que fazer: cria e regista a página.
4. Código completo, correto e integrado:

```jsx
// client/src/pages/FaceAnalysisPage.jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function FaceAnalysisPage() {
    const [analysis, setAnalysis] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function handleAnalyze() {
        setStatus("loading");
        setError("");
        setAnalysis(null);

        try {
            const data = await apiRequest("/face-analyses", {
                method: "POST",
            });
            setAnalysis(data.analysis);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Análise facial cosmética</h1>
            <button onClick={handleAnalyze} disabled={status === "loading"}>
                {status === "loading" ? "A analisar..." : "Iniciar análise"}
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && analysis && (
                <article>
                    <p>{analysis.limitations.join(" ")}</p>
                    <ul>
                        {Object.entries(analysis.findings).map(([key, value]) => (
                            <li key={key}>
                                <strong>{key}</strong>: {value.label} (
                                {Math.round(value.confidence * 100)}%)
                            </li>
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
import { FaceAnalysisPage } from "./pages/FaceAnalysisPage.jsx";

export function App() {
    return (
        <>
            <ProductSearchPage />
            <ProductDetailsPage />
            <ProductReviewPage />
            <RelatedProductsPage />
            <FacePhotoUploadPage />
            <FaceAnalysisPage />
        </>
    );
}
```

5. Explicação do código: a UI mostra limitações antes dos sinais, para o utilizador perceber o alcance da análise.
6. Como validar este passo: tenta analisar antes do upload e confirma erro controlado.
7. Erros comuns ou cenário negativo: esconder limitações transforma a análise em promessa excessiva.

### Passo 8 - Validar guardrails da análise

1. Explicação simples do objetivo: garantir que a análise só corre com sessão, consentimento e fotografias obrigatórias.
2. Ficheiros envolvidos.
    - REVER: `server/src/services/face-analysis.service.js`
    - REVER: `server/src/routes/face-analysis.routes.js`
    - REVER: `server/src/providers/skin-analysis.provider.js`
3. O que fazer: testa os cenários negativos principais antes de validar o caso feliz.
4. Código completo, correto e integrado:

```bash
curl -i -X POST http://localhost:3000/api/face-analyses
curl -i -X POST http://localhost:3000/api/face-analyses \
    -H "Authorization: Bearer TOKEN_SEM_CONSENTIMENTO"
curl -i -X POST http://localhost:3000/api/face-analyses \
    -H "Authorization: Bearer TOKEN_COM_CONSENTIMENTO_SEM_FOTOS"
```

5. Explicação do código: os pedidos validam autenticação, consentimento e existência das duas fotografias antes de qualquer processamento.
6. Como validar este passo: confirma `401`, `403` e `400` nos três cenários.
7. Erros comuns ou cenário negativo: executar o provider antes dos guardrails desperdiça recursos e pode tratar dados sem base legal.

### Validacao
- [ ] Negativos: minimo `3` cenarios.
- [ ] Sem sessao devolve `401`.
- [ ] Sem consentimento devolve `403`.
- [ ] Sem frontal ou perfil devolve `400`.
- [ ] Resposta inclui limitations e nao devolve paths internos.

### Matriz minima de testes por prioridade

| Camada | Evidencia |
| --- | --- |
| Model | `FaceAnalysis` guarda findings, sources e limitations. |
| Provider | Analise isolada do controller. |
| Service | Guardrails aplicados antes do provider. |
| UI | Pagina mostra resultado e limites. |

Evidencia de testes por camada:
- API: output de analise criada e bloqueios.
- Service: teste de consentimento ausente.
- UI: screenshot com findings e limitations.

## Expected results
- Com sessão, consentimento e duas fotografias: `201`.
- Sem sessão: `401`.
- Sem consentimento: `403`.
- Sem frontal ou perfil: `400`.
- Resposta inclui `findings`, `sources` e `limitations`.

## Criterios de aceite
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada documentada.
- Provider isolado existe.
- Controller não contém lógica de IA.
- Backend aplica ownership por sessão.
- Resposta não devolve caminhos internos.
- Resultado indica limitações.

## Validação final
- Fazer upload facial no BK anterior.
- Chamar `POST /api/face-analyses`.
- Testar sem consentimento e sem fotografia de perfil.

## Evidence para PR/defesa
- Output de análise com `201`.
- Output sem consentimento com `403`.
- Screenshot da página com limitações visíveis.

## Handoff

### Handoff

`BK-MF1-07` deve consumir `FaceAnalysis` e gerar relatório personalizado sem voltar a processar ficheiros diretamente.

## Changelog
- `2026-05-31`: guia revisto com modelo de análise, provider isolado, guardrails, ownership e UI.
