# BK-MF2-02 - Com base na análise e histórico, o sistema recomenda produtos personalizados para o utilizador

## Header
- `doc_id`: `GUIA-BK-MF2-02`
- `bk_id`: `BK-MF2-02`
- `macro`: `MF2`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `DONE`
- `esforco`: `M`
- `dependencias`: `BK-MF1-06, BK-MF1-07`
- `rf_rnf`: `RF18`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF2-03`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-02-com-base-na-analise-e-historico-o-sistema-recomenda-produtos-personalizados-para-o-utilizador.md`
- `last_updated`: `2026-06-08`

## Contexto do BK
- Entrega alvo: implementar `RF18`, criando recomendações de produtos com base em análise facial, relatório e catálogo.
- CANONICO: produto vem de `RF07` e já inclui nome, marca, descrição, ingredientes, tipos de pele, imagem, preço e stock.
- CANONICO: análise facial vem de `RF14` e relatório personalizado vem de `RF15`.
- DERIVADO: até `RF40`, ainda não existe entidade de restrições médicas leves; por isso este BK filtra por sinais cosméticos, tipo de pele e disponibilidade, sem inventar bloqueios clínicos.

## Objetivo
Neste BK vais criar o modelo, o service, a API e a página que geram e mostram recomendações personalizadas para o cliente autenticado.

## Importância
Este BK liga a análise facial ao catálogo. É uma das zonas de maior risco técnico porque a app não pode recomendar por stock apenas, não pode inventar diagnóstico e não pode transformar recomendação em compra automática.

## Scope-in
- Criar `ProductRecommendation`.
- Criar `POST /api/recommendations/generate`.
- Criar `GET /api/recommendations`.
- Selecionar 3 a 5 produtos compatíveis com análise, relatório e catálogo.
- Devolver DTO público com produto, score, motivo e limitações.

## Scope-out
- Não criar carrinho, encomenda, checkout ou pagamento.
- Não adicionar produtos ao carrinho automaticamente.
- Não chamar provider externo sem configuração e tratamento de erro.
- Não usar dados de outro utilizador.

## Estado antes
`PARCIAL`: o guia já tinha modelo, service, controller, route e UI, mas o ranking ainda podia aceitar stock como motivo suficiente e o relatório podia não pertencer à análise facial mais recente.

## Estado depois
`OK`: o guia passa a exigir relatório ligado ao `analysisId`, compatibilidade cosmética verificável e cenários negativos `P0` contra recomendação baseada só em stock.

## Pré-requisitos
- `BK-MF0-02`: autenticação com `requireAuth`.
- `BK-MF0-07`: modelo `Product` com `skinTypes`, `ingredients`, `priceCents`, `stock` e `imageUrl`.
- `BK-MF1-06`: `FaceAnalysis` concluída com `findings`.
- `BK-MF1-07`: `FaceReport` com `limitations`.

## Glossário
- `recomendação`: ligação entre um utilizador, uma análise, um relatório e um produto.
- `score`: pontuação entre `0` e `1` usada para ordenar produtos.
- `reasonCodes`: códigos curtos que explicam sinais usados na recomendação.
- `explanation`: frase pública, clara e não clínica, apresentada ao cliente.
- `DTO público`: objeto final sem documentos internos de MongoDB.

## Conceitos teóricos
Uma recomendação personalizada precisa de três fontes: análise facial, relatório e catálogo. A análise fornece sinais cosméticos; o relatório fornece contexto e limitações; o catálogo fornece produtos realmente disponíveis. Se qualquer uma destas fontes faltar, o backend deve falhar de forma controlada.

O backend deve decidir ownership através da sessão. O browser pode pedir para gerar recomendações, mas não pode escolher outro `userId`. Também não pode enviar preço, stock ou resultado de análise, porque esses dados pertencem ao servidor.

Em IA e recomendação, explicabilidade significa indicar por que motivo um produto apareceu. Este BK cria uma explicação mínima e correta; `BK-MF2-03` vai especializar essa explicação sem mudar o endpoint.

## Arquitetura do BK
- `product-recommendation.model.js`: guarda recomendação e feedback futuro.
- `recommendation.service.js`: calcula score, persiste recomendações e devolve DTO.
- `recommendation.controller.js`: recebe pedidos e chama o service.
- `recommendation.routes.js`: protege endpoints com `requireAuth`.
- `ProductRecommendationsPage.jsx`: gera e lista recomendações.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/product-recommendation.model.js`
- CRIAR: `server/src/services/recommendation.service.js`
- CRIAR: `server/src/controllers/recommendation.controller.js`
- CRIAR: `server/src/routes/recommendation.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/ProductRecommendationsPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/models/product.model.js`
- REVER: `server/src/models/face-analysis.model.js`
- REVER: `server/src/models/face-report.model.js`

## Bloco pedagógico
### Objetivo
Implementar `RF18` com recomendação segura, explicável e integrada.

### Pré-requisitos
- Confirmar que há produtos com stock positivo.
- Confirmar que o utilizador tem análise concluída.
- Confirmar que existe relatório gerado a partir da análise.

### Erros comuns
- Recomendar apenas os produtos com mais stock.
- Receber `analysisId` no body e quebrar ownership.
- Devolver documento completo de `Product`.
- Criar carrinho dentro do service de recomendação.

### Check de compreensão
- [ ] Sei explicar por que a recomendação precisa de análise, relatório e produto.
- [ ] Sei indicar o endpoint de geração.
- [ ] Sei listar três cenários negativos `P0`.

### Tempo estimado
- `P0`: 90-120 minutos, incluindo testes de integração.

## Bloco operacional
### Entrada
- BK: `BK-MF2-02`
- Requisito: `RF18`
- Endpoint principal: `POST /api/recommendations/generate`

### Passos
1. Confirmar contrato funcional e limites.
2. Criar modelo `ProductRecommendation`.
3. Criar service de recomendação.
4. Criar controller e route.
5. Registar route na app.
6. Criar página React.
7. Executar cenários negativos obrigatórios (mínimo 3).

### Cenários negativos recomendados
- Pedido sem sessão deve devolver `401`.
- Utilizador sem análise ou relatório deve devolver `400`.
- Catálogo sem produtos compatíveis deve devolver `404`.
- A recomendação não deve criar carrinho, encomenda ou pagamento.

### Validação
- [ ] Smoke: gerar recomendações com análise, relatório e produtos compatíveis.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Segurança: resposta sem fotografia, consentimento, paths internos ou documentos completos.
- [ ] Produto: preço e stock vêm do backend, não do browser.

### Matriz mínima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF2-03` vai reforçar os motivos apresentados sem criar outro endpoint de geração.

## Passos lineares
### Passo 1 - Confirmar contrato e limites

1. Explicação simples do objetivo: garantir que `RF18` não se mistura com compra nem simulação.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: linhas de `RF18` e `BK-MF2-02`.
3. O que fazer: confirma dependências `BK-MF1-06` e `BK-MF1-07`.
4. Código completo, correto e integrado.

```text
Sem código novo neste passo.
```

5. Explicação do código: este passo trava drift funcional antes de escrever ficheiros.
6. Como validar este passo: o PR deve citar `RF18` e não deve criar `cart`, `order` ou `payment`.
7. Erros comuns ou cenário negativo: transformar recomendação em compra automática viola separação de responsabilidades.

### Passo 2 - Criar modelo ProductRecommendation

1. Explicação simples do objetivo: guardar recomendações geradas para o cliente.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/product-recommendation.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria schema com relações para análise, relatório e produto.
4. Código completo, correto e integrado.

```js
// server/src/models/product-recommendation.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recommendationFeedbackSchema = new Schema(
    {
        value: {
            type: String,
            enum: ["util", "nao_relevante", null],
            default: null,
        },
        submittedAt: {
            type: Date,
            default: null,
        },
    },
    { _id: false },
);

const productRecommendationSchema = new Schema(
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
        reportId: {
            type: Schema.Types.ObjectId,
            ref: "FaceReport",
            required: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
        },
        reasonCodes: {
            type: [String],
            required: true,
            validate: {
                validator: (items) => Array.isArray(items) && items.length > 0,
                message: "Pelo menos um motivo é obrigatório",
            },
        },
        explanation: {
            type: String,
            required: true,
            minlength: 20,
            maxlength: 600,
        },
        sourceSignals: {
            type: [String],
            default: [],
        },
        status: {
            type: String,
            enum: ["active", "accepted", "dismissed"],
            default: "active",
            index: true,
        },
        feedback: {
            type: recommendationFeedbackSchema,
            default: () => ({}),
        },
    },
    { timestamps: true },
);

productRecommendationSchema.index(
    { userId: 1, analysisId: 1, productId: 1 },
    { unique: true },
);

export const ProductRecommendation = model(
    "ProductRecommendation",
    productRecommendationSchema,
);
```

5. Explicação do código: o modelo guarda referências em vez de duplicar fotografias ou relatórios completos. `feedback` já prepara `BK-MF2-04`, mas fica neutro até o cliente marcar uma opção.
6. Como validar este passo: tentar criar recomendação sem `reasonCodes` deve falhar.
7. Erros comuns ou cenário negativo: guardar fotografia ou path no modelo de recomendação aumenta exposição de dados sensíveis.

### Passo 3 - Criar service de recomendação

1. Explicação simples do objetivo: gerar recomendações com critérios claros e DTO público.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/recommendation.service.js`
    - REVER: `server/src/models/product.model.js`
    - REVER: `server/src/models/face-analysis.model.js`
    - REVER: `server/src/models/face-report.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria ranking local com análise, relatório e catálogo.
4. Código completo, correto e integrado.

```js
// server/src/services/recommendation.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { FaceAnalysis } from "../models/face-analysis.model.js";
import { FaceReport } from "../models/face-report.model.js";
import { Product } from "../models/product.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";

const POSITIVE_STOCK_LIMIT = 50;
const MAX_RECOMMENDATIONS = 5;
const MIN_RECOMMENDATIONS = 3;
const CONCERN_TERMS = {
    acne: ["acne", "imperfeic", "borbulh", "salicilico", "niacinamida"],
    manchas: ["mancha", "uniform", "vitamina c", "despigment", "luminos"],
    rugas: ["ruga", "anti-idade", "retinol", "peptid", "firmeza"],
    oleosidade: ["oleosidade", "sebo", "matificante", "oil-free", "niacinamida"],
};

function normalizeLabel(value) {
    return String(value ?? "nao_conclusivo")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function getFindingLabel(analysis, key) {
    return normalizeLabel(analysis.findings?.[key]?.label);
}

function productSupportsSkinType(product, skinType) {
    const allowedSkinTypes = (product.skinTypes ?? []).map(normalizeLabel);
    return allowedSkinTypes.includes(skinType) || allowedSkinTypes.includes("todos");
}

function searchableProductText(product) {
    return [
        product.name,
        product.brandName,
        product.description,
        ...(product.ingredients ?? []),
    ]
        .filter(Boolean)
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function productMatchesConcern(product, key) {
    const productText = searchableProductText(product);
    return (CONCERN_TERMS[key] ?? []).some((term) => productText.includes(term));
}

function calculateProductScore(product, analysis) {
    const skinType = getFindingLabel(analysis, "skinType");
    let score = 0;
    const reasonCodes = new Set();
    const sourceSignals = new Set();

    if (skinType !== "nao_conclusivo" && productSupportsSkinType(product, skinType)) {
        score += 0.45;
        reasonCodes.add(`skin_type_${skinType}`);
        sourceSignals.add("skinType");
    }

    for (const key of ["acne", "manchas", "rugas", "oleosidade"]) {
        const label = getFindingLabel(analysis, key);

        if (label !== "nao_conclusivo" && productMatchesConcern(product, key)) {
            score += 0.15;
            reasonCodes.add(`${key}_${label}`);
            sourceSignals.add(key);
        }
    }

    const hasCosmeticReason = reasonCodes.size > 0;
    const normalizedScore = hasCosmeticReason ? Math.min(Number(score.toFixed(2)), 0.98) : 0;

    return {
        score: normalizedScore,
        reasonCodes: Array.from(reasonCodes),
        sourceSignals: Array.from(sourceSignals),
    };
}

function buildExplanation(product, analysis, reasonCodes) {
    const skinType = getFindingLabel(analysis, "skinType");
    const cosmeticReasons = reasonCodes.join(", ");

    return [
        `${product.name} foi recomendado porque existe compatibilidade verificável entre o produto e a análise facial.`,
        `A análise indica pele ${skinType}; a disponibilidade em stock permite apresentar o produto, mas não é usada como motivo cosmético.`,
        `Motivos técnicos: ${cosmeticReasons}.`,
    ].join(" ");
}

function toProductDto(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredients: product.ingredients,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

function toRecommendationDto(recommendation, product) {
    return {
        id: recommendation._id.toString(),
        product: toProductDto(product),
        score: recommendation.score,
        reasonCodes: recommendation.reasonCodes,
        explanation: recommendation.explanation,
        status: recommendation.status,
        feedback: recommendation.feedback,
        createdAt: recommendation.createdAt,
    };
}

async function getLatestInputs(userId) {
    const analysis = await FaceAnalysis.findOne({ userId, status: "completed" }).sort({
        createdAt: -1,
    });

    if (!analysis) {
        throw new AppError(400, "Análise facial concluída e relatório são obrigatórios");
    }

    const report = await FaceReport.findOne({
        userId,
        analysisId: analysis._id,
    }).sort({ createdAt: -1 });

    if (!report) {
        throw new AppError(400, "Relatório da análise facial mais recente é obrigatório");
    }

    return { analysis, report };
}

export async function generateRecommendationsForUser(userId) {
    const { analysis, report } = await getLatestInputs(userId);

    const products = await Product.find({ stock: { $gt: 0 } })
        .select("name brandName description ingredients skinTypes imageUrl priceCents stock")
        .limit(POSITIVE_STOCK_LIMIT);

    const rankedProducts = products
        .map((product) => ({
            product,
            ranking: calculateProductScore(product, analysis),
        }))
        .filter(({ ranking }) => ranking.reasonCodes.length > 0 && ranking.score > 0)
        .sort((a, b) => b.ranking.score - a.ranking.score)
        .slice(0, MAX_RECOMMENDATIONS);

    if (rankedProducts.length < MIN_RECOMMENDATIONS) {
        throw new AppError(404, "Não existem produtos compatíveis suficientes");
    }

    const recommendations = await Promise.all(
        rankedProducts.map(async ({ product, ranking }) => {
            const explanation = buildExplanation(product, analysis, ranking.reasonCodes);

            return ProductRecommendation.findOneAndUpdate(
                {
                    userId,
                    analysisId: analysis._id,
                    productId: product._id,
                },
                {
                    $set: {
                        reportId: report._id,
                        score: ranking.score,
                        reasonCodes: ranking.reasonCodes,
                        explanation,
                        sourceSignals: ranking.sourceSignals,
                        status: "active",
                    },
                    $setOnInsert: {
                        feedback: { value: null, submittedAt: null },
                    },
                },
                { upsert: true, new: true, runValidators: true },
            );
        }),
    );

    return {
        recommendations: recommendations.map((recommendation, index) =>
            toRecommendationDto(recommendation, rankedProducts[index].product),
        ),
        limitations: [
            ...(analysis.limitations ?? []),
            ...(report.limitations ?? []),
            "Recomendação cosmética baseada em análise e catálogo; não cria compra automática.",
        ],
    };
}

export async function listMyRecommendations(userId) {
    const recommendations = await ProductRecommendation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("productId", "name brandName description ingredients skinTypes imageUrl priceCents stock");

    return {
        recommendations: recommendations.map((recommendation) =>
            toRecommendationDto(recommendation, recommendation.productId),
        ),
    };
}
```

5. Explicação do código: `getLatestInputs` primeiro encontra a análise concluída mais recente e depois exige o relatório com o mesmo `analysisId`. `calculateProductScore` só cria `reasonCodes` quando existe compatibilidade cosmética entre produto e análise; stock continua a ser filtro de disponibilidade, não motivo. `findOneAndUpdate` evita duplicar a mesma recomendação para a mesma análise e produto. A resposta usa DTOs, não documentos completos.
6. Como validar este passo: com análise, relatório ligado a essa análise e catálogo compatível, devem surgir 3 a 5 recomendações ordenadas por `score`.
7. Erros comuns ou cenário negativo: aceitar produto apenas por stock criaria recomendação sem personalização real.

### Passo 4 - Criar controller e route

1. Explicação simples do objetivo: expor geração e listagem por API protegida.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/recommendation.controller.js`
    - CRIAR: `server/src/routes/recommendation.routes.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: cria controller com `try/catch` e route com `requireAuth`.
4. Código completo, correto e integrado.

```js
// server/src/controllers/recommendation.controller.js
import {
    generateRecommendationsForUser,
    listMyRecommendations,
} from "../services/recommendation.service.js";

export async function generateRecommendationsController(req, res, next) {
    try {
        const result = await generateRecommendationsForUser(req.user.id);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function listMyRecommendationsController(req, res, next) {
    try {
        const result = await listMyRecommendations(req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/recommendation.routes.js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    generateRecommendationsController,
    listMyRecommendationsController,
} from "../controllers/recommendation.controller.js";

export const recommendationRoutes = Router();

recommendationRoutes.get(
    "/recommendations",
    requireAuth,
    listMyRecommendationsController,
);

recommendationRoutes.post(
    "/recommendations/generate",
    requireAuth,
    generateRecommendationsController,
);
```

5. Explicação do código: ambos os endpoints dependem da sessão. A geração usa `201` porque cria ou atualiza recomendações persistidas; a listagem usa `200`.
6. Como validar este passo: sem sessão, ambos os endpoints devem devolver `401`.
7. Erros comuns ou cenário negativo: criar `POST /api/users/:userId/recommendations` permitiria tentar operar sobre outro cliente.

### Passo 5 - Registar route na app

1. Explicação simples do objetivo: ativar os endpoints no Express.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: zona de imports e routes.
3. O que fazer: importar `recommendationRoutes` e registar com prefixo `/api`.
4. Código completo, correto e integrado.

```js
// server/src/app.js
import { recommendationRoutes } from "./routes/recommendation.routes.js";

app.use("/api", recommendationRoutes);
```

5. Explicação do código: o frontend passa a chamar `/api/recommendations` e `/api/recommendations/generate`.
6. Como validar este passo: confirmar que as duas rotas aparecem na API.
7. Erros comuns ou cenário negativo: registar outro prefixo quebra a página React.

### Passo 6 - Criar página de recomendações

1. Explicação simples do objetivo: permitir gerar e consultar recomendações sem mostrar JSON bruto.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/ProductRecommendationsPage.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria página com botão de geração, listagem e estados.
4. Código completo, correto e integrado.

```jsx
// client/src/pages/ProductRecommendationsPage.jsx
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ProductRecommendationsPage() {
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const [recommendations, setRecommendations] = useState([]);
    const [limitations, setLimitations] = useState([]);

    async function loadRecommendations() {
        const data = await apiRequest("/api/recommendations");
        setRecommendations(data.recommendations);
        setStatus(data.recommendations.length === 0 ? "empty" : "success");
    }

    async function generateRecommendations() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/api/recommendations/generate", {
                method: "POST",
            });
            setRecommendations(data.recommendations);
            setLimitations(data.limitations ?? []);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    useEffect(() => {
        loadRecommendations().catch((err) => {
            setError(err.message);
            setStatus("error");
        });
    }, []);

    return (
        <section>
            <h1>Recomendações personalizadas</h1>
            <button type="button" onClick={generateRecommendations} disabled={status === "loading"}>
                Gerar recomendações
            </button>

            {status === "loading" && <p>A carregar recomendações...</p>}
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem recomendações geradas.</p>}

            {status === "success" && (
                <div>
                    {recommendations.map((recommendation) => (
                        <article key={recommendation.id}>
                            <img src={recommendation.product.imageUrl} alt="" width="96" height="96" />
                            <h2>{recommendation.product.name}</h2>
                            <p>{recommendation.product.brandName}</p>
                            <p>{recommendation.explanation}</p>
                            <p>Score: {Math.round(recommendation.score * 100)}%</p>
                            <p>Preço: {(recommendation.product.priceCents / 100).toFixed(2)} €</p>
                        </article>
                    ))}

                    {limitations.length > 0 && (
                        <ul>
                            {limitations.map((limitation) => (
                                <li key={limitation}>{limitation}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
```

5. Explicação do código: a página nunca envia preço, stock, análise ou `userId`; apenas chama endpoints protegidos. O botão cria recomendações, a listagem mostra produtos e explicações, e os estados tornam o fluxo compreensível.
6. Como validar este passo: abrir a página com sessão, gerar recomendações e confirmar que aparecem cards de produtos.
7. Erros comuns ou cenário negativo: fazer o ranking no browser permite manipular recomendações.

### Passo 7 - Registar página no frontend

1. Explicação simples do objetivo: adicionar rota visual para o cliente.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: imports e configuração de rotas.
3. O que fazer: importar a página e adicioná-la ao router.
4. Código completo, correto e integrado.

```jsx
// client/src/App.jsx
import { ProductRecommendationsPage } from "./pages/ProductRecommendationsPage.jsx";

// Dentro da configuração de rotas:
{
    path: "/recommendations",
    element: <ProductRecommendationsPage />,
}
```

5. Explicação do código: a rota visual fica alinhada com os endpoints `/api/recommendations`.
6. Como validar este passo: abrir `/recommendations` e confirmar pedido inicial para `/api/recommendations`.
7. Erros comuns ou cenário negativo: criar uma página sem rota deixa o fluxo invisível no produto.

### Passo 8 - Validar negativos obrigatórios

1. Explicação simples do objetivo: provar que o BK cumpre prioridade `P0`.
2. Ficheiros envolvidos.
    - REVER: `server/src/routes/recommendation.routes.js`
    - REVER: `server/src/services/recommendation.service.js`
    - LOCALIZAÇÃO: autenticação, `getLatestInputs` e filtro de catálogo.
3. O que fazer: executar pedidos de erro controlado e confirmar ausência de compra automática.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3001/api/recommendations/generate
curl -i -X POST http://localhost:3001/api/recommendations/generate -H "Cookie: orelle_session=COOKIE_SEM_ANALISE"
curl -i -X POST http://localhost:3001/api/recommendations/generate -H "Cookie: orelle_session=COOKIE_SEM_PRODUTOS"
curl -i -X POST http://localhost:3001/api/recommendations/generate -H "Cookie: orelle_session=COOKIE_SO_COM_STOCK"
rg -n "cart|checkout|order|payment|encomenda" server/src/services/recommendation.service.js client/src/pages/ProductRecommendationsPage.jsx
```

5. Explicação do código: os pedidos validam autenticação, pré-condições, catálogo e o bloqueio de produtos sem compatibilidade cosmética. O `rg` deve confirmar que este BK não cria fluxo comercial.
6. Como validar este passo: registar `401`, `400`, `404` e ausência de criação de carrinho/pagamento.
7. Erros comuns ou cenário negativo: fechar só o caminho feliz deixaria o endpoint inseguro para `P0`.

## Expected results
- `POST /api/recommendations/generate` sem sessão devolve `401`.
- Com sessão mas sem análise ou relatório devolve `400`.
- Com catálogo incompatível devolve `404`.
- Produto apenas disponível em stock, sem compatibilidade cosmética, não gera recomendação.
- Com dados completos devolve `201` com 3 a 5 recomendações.
- `GET /api/recommendations` devolve `200` com recomendações do próprio utilizador.

## Critérios de aceite
- Entrega funcional de `RF18` concluída.
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada conforme prioridade `P0`.
- Recomendação separada de carrinho, encomenda e pagamento.
- DTO público sem fotografias, consentimento ou paths internos.
- Produto recomendado vem do catálogo real e preserva preço/stock do backend.
- `reasonCodes` contém apenas motivos cosméticos, nunca disponibilidade comercial isolada.

## Validação final
- Executar os comandos do passo 8.
- Confirmar que cada recomendação tem `reasonCodes` e `explanation`.
- Confirmar que `FaceReport.analysisId` corresponde à análise usada.
- Confirmar que `ProductRecommendationsPage` não guarda tokens.
- Executar `git diff --check` antes do PR.

## Evidence para PR/defesa
- `proof_tecnico`: resposta `201` com lista de recomendações.
- `proof_negativos`: resultados `401`, `400` e `404`.
- `proof_negocio`: demonstração de recomendações ordenadas por score sem compra automática.

## Handoff
`BK-MF2-03` deve reutilizar `ProductRecommendation` e `recommendation.service.js`, reforçando os motivos sem criar novo endpoint de geração.

## Changelog
- `2026-06-08`: guia reescrito com modelo, service completo, listagem, geração, controller, route, página e negativos `P0`.
- `2026-06-08`: corrigido ranking para bloquear motivo baseado só em stock e exigir relatório ligado ao `analysisId` da análise mais recente.
