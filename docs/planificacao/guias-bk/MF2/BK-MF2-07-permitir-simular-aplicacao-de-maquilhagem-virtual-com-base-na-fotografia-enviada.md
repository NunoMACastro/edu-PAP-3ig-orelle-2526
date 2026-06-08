# BK-MF2-07 - Permitir simular aplicação de maquilhagem virtual com base na fotografia enviada

## Header
- `doc_id`: `GUIA-BK-MF2-07`
- `bk_id`: `BK-MF2-07`
- `macro`: `MF2`
- `owner`: `Daniel Bulica`
- `apoio`: `Aline`
- `prioridade`: `P2`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF1-05`
- `rf_rnf`: `RF23`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-08`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-07-permitir-simular-aplicacao-de-maquilhagem-virtual-com-base-na-fotografia-enviada.md`
- `last_updated`: `2026-06-08`

## Contexto do BK
- Entrega alvo: implementar `RF23`, criando simulação de maquilhagem com base na fotografia frontal já enviada.
- CANONICO: upload facial e consentimento vêm de `BK-MF1-05`.
- DERIVADO: a primeira versão usa provider local controlado que cria uma pré-visualização textual/visual segura, sem publicar a fotografia privada.
- O frontend envia apenas `productId`; o backend escolhe consentimento e fotografia frontal ativa.

## Objetivo
Neste BK vais criar a simulação de maquilhagem com consentimento ativo, produto válido e DTO seguro.

## Importância
Fotografias faciais são dados sensíveis. A simulação só pode acontecer depois de sessão, consentimento e fotografia frontal ativa. A resposta deve permitir uma pré-visualização sem expor ficheiros privados.

## Scope-in
- Criar `MakeupSimulation`.
- Criar validator de `productId`.
- Criar provider local controlado.
- Criar `POST /api/makeup-simulations`.
- Criar página para gerar e mostrar preview.

## Scope-out
- Não aceitar `facePhotoId` no body.
- Não devolver `storageKey`, path interno ou ficheiro facial.
- Não prometer realismo avançado.
- Não chamar provider externo sem configuração.

## Estado antes
`CRITICO`: faltavam provider, validator, controller completo e garantias fechadas de consentimento/privacidade.

## Estado depois
`OK`: o BK passa a ter provider, modelo, validator, service, controller, route, UI e negativos de consentimento.

## Pré-requisitos
- `BK-MF1-05`: `FaceConsent`, `FacePhoto` e `ensureActiveFaceConsent`.
- `BK-MF0-07`: produto com stock e imagem.
- `BK-MF0-02`: sessão autenticada.

## Glossário
- `MakeupSimulation`: registo de simulação gerada.
- `preview`: objeto público que descreve a visualização sem devolver fotografia.
- `provider local controlado`: módulo interno que devolve resultado determinístico e seguro.
- `fotografia frontal`: imagem do rosto guardada em área privada na MF1.

## Conceitos teóricos
Um provider isola a parte de IA ou simulação. Mesmo que hoje seja local, o controller e o service não precisam mudar se no futuro existir provider externo configurado.

Consentimento deve ser verificado antes do processamento. A route usa `ensureActiveFaceConsent`, criado na MF1, antes de chegar ao controller. O service ainda recebe o consentimento ativo para guardar `consentId` sem o devolver ao frontend.

A simulação deste BK é baseline: cria painéis de antes/depois e uma descrição de overlay. Isso entrega um preview funcional e seguro sem expor fotografia privada nem inventar precisão visual avançada.

## Arquitetura do BK
- `makeup-simulation.provider.js`: cria preview.
- `makeup-simulation.model.js`: guarda simulação e referências.
- `makeup-simulation.validator.js`: valida `productId`.
- `makeup-simulation.service.js`: valida produto, fotografia e consentimento.
- `makeup-simulation.controller.js`: chama validator e service.
- `makeup-simulation.routes.js`: aplica sessão e consentimento.
- `MakeupSimulationPage.jsx`: formulário e preview.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/providers/makeup-simulation.provider.js`
- CRIAR: `server/src/models/makeup-simulation.model.js`
- CRIAR: `server/src/validators/makeup-simulation.validator.js`
- CRIAR: `server/src/services/makeup-simulation.service.js`
- CRIAR: `server/src/controllers/makeup-simulation.controller.js`
- CRIAR: `server/src/routes/makeup-simulation.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/MakeupSimulationPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/middlewares/face-photo-upload.middleware.js`

## Bloco pedagógico
### Objetivo
Implementar `RF23` com consentimento, fotografia frontal e produto real.

### Pré-requisitos
- Ter consentimento facial ativo.
- Ter fotografia frontal ativa.
- Ter produto com stock positivo.

### Erros comuns
- Receber `facePhotoId` do frontend.
- Devolver path interno da fotografia.
- Criar simulação sem consentimento.
- Usar produto inexistente ou sem stock.

### Check de compreensão
- [ ] Sei explicar por que a route usa `ensureActiveFaceConsent`.
- [ ] Sei listar o que não pode sair no DTO.
- [ ] Sei testar utilizador sem consentimento.

### Tempo estimado
- `P2`: 60-90 minutos, incluindo negativos de privacidade.

## Bloco operacional
### Entrada
- BK: `BK-MF2-07`
- Requisito: `RF23`
- Endpoint principal: `POST /api/makeup-simulations`

### Passos
1. Confirmar contrato funcional e privacidade.
2. Criar provider local controlado.
3. Criar modelo.
4. Criar validator.
5. Criar service.
6. Criar controller e route.
7. Registar route e página.
8. Executar cenários negativos obrigatórios (mínimo 1).

### Cenários negativos recomendados
- Sem sessão devolve `401`.
- Sem consentimento ativo devolve `403`.
- Sem fotografia frontal ativa devolve `400`.
- Produto inexistente ou sem stock devolve `404`.

### Validação
- [ ] Smoke: gerar simulação com consentimento, fotografia e produto.
- [ ] Negativos: mínimo `1` cenários com resultado controlado.
- [ ] Segurança: DTO não inclui `storageKey`, `facePhotoId` nem `consentId`.

### Matriz mínima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF2-08` deve reutilizar `MakeupSimulation` para gerar visualização antes/depois.

## Passos lineares
### Passo 1 - Confirmar contrato e privacidade

1. Explicação simples do objetivo: bloquear simulação sem consentimento e fotografia.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`
    - LOCALIZAÇÃO: `RF23`, regras de consentimento e `ensureActiveFaceConsent`.
3. O que fazer: confirmar que o backend escolhe a fotografia frontal.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: este passo evita que a UI escolha fotografia privada por ID.
6. Como validar este passo: o body final deve ter apenas `productId`.
7. Erros comuns ou cenário negativo: aceitar `facePhotoId` permite tentar usar imagem de outra pessoa.

### Passo 2 - Criar provider local controlado

1. Explicação simples do objetivo: isolar a criação do preview.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/providers/makeup-simulation.provider.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar provider determinístico com input e output públicos.
4. Código completo, correto e integrado.

```js
// server/src/providers/makeup-simulation.provider.js
import { AppError } from "../middlewares/error.middleware.js";

function colorFromProduct(product) {
    const seed = String(product._id).slice(-6);
    return `#${seed.padStart(6, "8")}`;
}

export function createMakeupPreview({ facePhoto, product }) {
    if (!facePhoto?._id) {
        throw new AppError(400, "Fotografia frontal ativa obrigatória");
    }

    if (!product?._id) {
        throw new AppError(404, "Produto obrigatório para simulação");
    }

    return {
        mode: "local_overlay",
        beforePanel: {
            label: "Antes",
            description: "Fotografia frontal privada confirmada pelo backend.",
        },
        afterPanel: {
            label: "Depois",
            description: `Aplicação visual estimada com ${product.name}.`,
            accentColor: colorFromProduct(product),
        },
        overlayDescription:
            "Preview de maquilhagem para apoio à escolha do produto, sem publicar a fotografia facial.",
        limitations: [
            "Preview baseline sem garantia de realismo fotográfico.",
            "Não é avaliação médica nem promessa de resultado.",
            "A fotografia usada permanece privada no servidor.",
        ],
    };
}
```

5. Explicação do código: o provider valida entradas e devolve um objeto público. A cor deriva do produto para tornar o preview visível, mas a fotografia não é devolvida.
6. Como validar este passo: chamar sem `facePhoto` deve devolver `400`.
7. Erros comuns ou cenário negativo: colocar esta lógica no controller dificulta troca futura de provider.

### Passo 3 - Criar modelo MakeupSimulation

1. Explicação simples do objetivo: guardar simulação e preview público.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/makeup-simulation.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar schema com referências internas e preview.
4. Código completo, correto e integrado.

```js
// server/src/models/makeup-simulation.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const previewPanelSchema = new Schema(
    {
        label: { type: String, required: true },
        description: { type: String, required: true },
        accentColor: { type: String, default: null },
    },
    { _id: false },
);

const makeupPreviewSchema = new Schema(
    {
        mode: { type: String, enum: ["local_overlay"], required: true },
        beforePanel: { type: previewPanelSchema, required: true },
        afterPanel: { type: previewPanelSchema, required: true },
        overlayDescription: { type: String, required: true },
        limitations: { type: [String], required: true },
    },
    { _id: false },
);

const makeupSimulationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        consentId: { type: Schema.Types.ObjectId, ref: "FaceConsent", required: true },
        facePhotoId: { type: Schema.Types.ObjectId, ref: "FacePhoto", required: true },
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        preview: { type: makeupPreviewSchema, required: true },
    },
    { timestamps: true },
);

makeupSimulationSchema.index({ userId: 1, createdAt: -1 });

export const MakeupSimulation = model("MakeupSimulation", makeupSimulationSchema);
```

5. Explicação do código: o modelo guarda referências para rastreabilidade interna, mas o DTO não as devolve. `preview` contém apenas dados seguros para UI.
6. Como validar este passo: criar simulação sem `consentId` deve falhar.
7. Erros comuns ou cenário negativo: guardar path público dentro do preview expõe ficheiros faciais.

### Passo 4 - Criar validator

1. Explicação simples do objetivo: aceitar apenas `productId` válido.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/makeup-simulation.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: validar body do pedido.
4. Código completo, correto e integrado.

```js
// server/src/validators/makeup-simulation.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

export function validateMakeupSimulationInput(body) {
    const productId = String(body?.productId ?? "");

    if (!mongoose.isValidObjectId(productId)) {
        throw new AppError(400, "ID de produto inválido");
    }

    return { productId };
}
```

5. Explicação do código: o cliente escolhe produto, não fotografia nem utilizador.
6. Como validar este passo: body sem `productId` deve devolver `400`.
7. Erros comuns ou cenário negativo: aceitar campos extra para fotografia cria risco de acesso cruzado.

### Passo 5 - Criar service

1. Explicação simples do objetivo: validar consentimento, fotografia e produto.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/makeup-simulation.service.js`
    - REVER: `server/src/models/face-photo.model.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar simulação e devolver DTO seguro.
4. Código completo, correto e integrado.

```js
// server/src/services/makeup-simulation.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { FacePhoto } from "../models/face-photo.model.js";
import { Product } from "../models/product.model.js";
import { MakeupSimulation } from "../models/makeup-simulation.model.js";
import { createMakeupPreview } from "../providers/makeup-simulation.provider.js";

function toProductDto(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
    };
}

function toMakeupSimulationDto(simulation, product) {
    return {
        id: simulation._id.toString(),
        product: toProductDto(product),
        preview: simulation.preview,
        createdAt: simulation.createdAt,
    };
}

export async function createMakeupSimulationForUser({ userId, consent, productId }) {
    if (!consent?._id) {
        throw new AppError(403, "Consentimento facial em falta");
    }

    const [facePhoto, product] = await Promise.all([
        FacePhoto.findOne({ userId, kind: "frontal", status: "active" })
            .sort({ createdAt: -1 })
            .select("+storageKey"),
        Product.findById(productId).select("name brandName imageUrl priceCents stock"),
    ]);

    if (!facePhoto) {
        throw new AppError(400, "Fotografia frontal ativa obrigatória");
    }

    if (!product || product.stock <= 0) {
        throw new AppError(404, "Produto indisponível");
    }

    const preview = createMakeupPreview({ facePhoto, product });
    const simulation = await MakeupSimulation.create({
        userId,
        consentId: consent._id,
        facePhotoId: facePhoto._id,
        productId: product._id,
        preview,
    });

    return { simulation: toMakeupSimulationDto(simulation, product) };
}
```

5. Explicação do código: o service recebe consentimento já confirmado, procura a fotografia frontal do próprio utilizador e valida produto com stock. Apesar de selecionar `storageKey` para confirmar disponibilidade interna da fotografia, a resposta nunca o devolve.
6. Como validar este passo: utilizador sem fotografia frontal deve receber `400`.
7. Erros comuns ou cenário negativo: procurar a última fotografia global em vez de filtrar por `userId` quebra ownership.

### Passo 6 - Criar controller e route

1. Explicação simples do objetivo: expor simulação com sessão e consentimento.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/makeup-simulation.controller.js`
    - CRIAR: `server/src/routes/makeup-simulation.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: criar controller e route com `ensureActiveFaceConsent`.
4. Código completo, correto e integrado.

```js
// server/src/controllers/makeup-simulation.controller.js
import { createMakeupSimulationForUser } from "../services/makeup-simulation.service.js";
import { validateMakeupSimulationInput } from "../validators/makeup-simulation.validator.js";

export async function createMakeupSimulationController(req, res, next) {
    try {
        const input = validateMakeupSimulationInput(req.body);
        const result = await createMakeupSimulationForUser({
            userId: req.user.id,
            consent: req.faceConsent,
            productId: input.productId,
        });

        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/makeup-simulation.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { ensureActiveFaceConsent } from "../middlewares/face-photo-upload.middleware.js";
import { createMakeupSimulationController } from "../controllers/makeup-simulation.controller.js";

export const makeupSimulationRoutes = Router();

makeupSimulationRoutes.post(
    "/makeup-simulations",
    requireAuth,
    ensureActiveFaceConsent,
    createMakeupSimulationController,
);
```

5. Explicação do código: a route reaproveita o middleware de MF1. Assim, sem consentimento ativo, o pedido termina antes de criar simulação.
6. Como validar este passo: sem consentimento ativo, esperar `403`.
7. Erros comuns ou cenário negativo: repetir consulta de consentimento com regra diferente pode criar inconsistência.

### Passo 7 - Registar route e página

1. Explicação simples do objetivo: ligar API e UI.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - CRIAR: `client/src/pages/MakeupSimulationPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: route backend, página completa e rota frontend.
3. O que fazer: registar route e criar página de simulação.
4. Código completo, correto e integrado.

```js
// server/src/app.js
import { makeupSimulationRoutes } from "./routes/makeup-simulation.routes.js";

app.use("/api", makeupSimulationRoutes);
```

```jsx
// client/src/pages/MakeupSimulationPage.jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function MakeupSimulationPage() {
    const [productId, setProductId] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [simulation, setSimulation] = useState(null);

    async function submitSimulation(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/api/makeup-simulations", {
                method: "POST",
                body: JSON.stringify({ productId }),
            });

            setSimulation(data.simulation);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Simulação de maquilhagem</h1>
            <form onSubmit={submitSimulation}>
                <label>
                    ID do produto
                    <input value={productId} onChange={(event) => setProductId(event.target.value)} />
                </label>
                <button type="submit" disabled={status === "loading"}>Gerar simulação</button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && simulation && (
                <div>
                    <h2>{simulation.product.name}</h2>
                    <section>
                        <h3>{simulation.preview.beforePanel.label}</h3>
                        <p>{simulation.preview.beforePanel.description}</p>
                    </section>
                    <section style={{ borderColor: simulation.preview.afterPanel.accentColor }}>
                        <h3>{simulation.preview.afterPanel.label}</h3>
                        <p>{simulation.preview.afterPanel.description}</p>
                    </section>
                    <p>{simulation.preview.overlayDescription}</p>
                </div>
            )}
        </section>
    );
}
```

```jsx
// client/src/App.jsx
import { MakeupSimulationPage } from "./pages/MakeupSimulationPage.jsx";

// Dentro da configuração de rotas:
{
    path: "/makeup-simulation",
    element: <MakeupSimulationPage />,
}
```

5. Explicação do código: a UI envia só `productId`. O preview mostra painéis, não a fotografia privada.
6. Como validar este passo: gerar simulação com produto válido e verificar painéis.
7. Erros comuns ou cenário negativo: mostrar a fotografia real sem endpoint protegido quebra privacidade.

### Passo 8 - Validar negativos obrigatórios

1. Explicação simples do objetivo: provar que consentimento e fotografia são obrigatórios.
2. Ficheiros envolvidos.
    - REVER: `server/src/routes/makeup-simulation.routes.js`
    - REVER: `server/src/services/makeup-simulation.service.js`
    - LOCALIZAÇÃO: middleware e verificações do service.
3. O que fazer: executar pedidos sem sessão, sem consentimento, sem fotografia e com produto inválido.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3001/api/makeup-simulations -H "Content-Type: application/json" -d '{"productId":"ID"}'
curl -i -X POST http://localhost:3001/api/makeup-simulations -H "Cookie: orelle_session=COOKIE_SEM_CONSENTIMENTO" -H "Content-Type: application/json" -d '{"productId":"ID"}'
curl -i -X POST http://localhost:3001/api/makeup-simulations -H "Cookie: orelle_session=COOKIE_SEM_FOTO_FRONTAL" -H "Content-Type: application/json" -d '{"productId":"ID"}'
curl -i -X POST http://localhost:3001/api/makeup-simulations -H "Cookie: orelle_session=COOKIE" -H "Content-Type: application/json" -d '{"productId":"64f000000000000000000001"}'
```

5. Explicação do código: os pedidos cobrem autenticação, consentimento, fotografia e produto.
6. Como validar este passo: esperar `401`, `403`, `400` e `404`.
7. Erros comuns ou cenário negativo: testar apenas produto válido não prova proteção biométrica.

## Expected results
- Sem sessão devolve `401`.
- Sem consentimento ativo devolve `403`.
- Sem fotografia frontal ativa devolve `400`.
- Produto inexistente ou sem stock devolve `404`.
- Com dados válidos devolve `201` com `simulation.preview`.

## Critérios de aceite
- Entrega funcional de `RF23` concluída.
- Cenários negativos concluídos: mínimo `1`.
- Evidência de testes por camada conforme prioridade `P2`.
- Backend escolhe fotografia frontal; frontend só envia `productId`.
- DTO não inclui `storageKey`, `facePhotoId` ou `consentId`.
- Provider isolado criado.

## Validação final
- Testar endpoint com e sem consentimento.
- Confirmar que o preview aparece na página.
- Confirmar que a resposta não contém path interno.
- Executar `git diff --check` antes do PR.

## Evidence para PR/defesa
- `proof_tecnico`: resposta `201` com `preview`.
- `proof_negativos`: evidência de `401`, `403`, `400` e `404`.
- `proof_negocio`: screenshot da simulação baseline.

## Handoff
`BK-MF2-08` deve usar `MakeupSimulation` por `simulationId` e revalidar ownership antes de criar visualização antes/depois.

## Changelog
- `2026-06-08`: guia reescrito com provider, modelo, validator, service, controller, route, UI e negativos de privacidade.
