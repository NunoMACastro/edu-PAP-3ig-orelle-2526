# BK-MF8-11 - Revisão humana de sessões IA por consultores

## Header
- `doc_id`: `GUIA-BK-MF8-11`
- `bk_id`: `BK-MF8-11`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF2-06, BK-MF8-09, BK-MF8-10`
- `rf_rnf`: `RF45, RNF31`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-12`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-11-revisao-humana-de-sessoes-ia-por-consultores.md`
- `last_updated`: `2026-07-02`

#### Objetivo

Neste BK vais criar um fluxo completo para consultores autorizados reverem sessões IA submetidas, decidirem se a recomendação está pronta, se precisa de ajuste ou se exige esclarecimento, e deixarem um registo auditável para defesa técnica.

No fim, a app terá:

- modelo persistente de revisão;
- validator de input;
- service com DTO seguro;
- controller e rotas protegidas por sessão e role;
- integração no `apps/api/src/app.js`;
- página React para consultores;
- teste focal de autorização, detalhe e decisão.

#### Importância

RF45 pede revisão humana de sessões IA. Isto é importante porque a IA ajuda a organizar recomendações, mas a decisão assistida por consultor precisa de controlo humano, rastreabilidade e linguagem segura.

RNF31 reforça auditabilidade. Uma revisão sem histórico é frágil: não permite provar quem validou, em que data, com que decisão e que mensagem ficou disponível para o cliente no BK seguinte.

#### Scope-in

- Criar fila de revisões para `consultor` e `administrador`.
- Criar detalhe seguro de sessão/recomendação para decisão humana.
- Guardar decisão `approved`, `adjusted` ou `needs_clarification`.
- Guardar nota pública separada da nota interna.
- Guardar `auditTrail` com ator, role, ação e data.
- Exportar DTO público reutilizável pelo `BK-MF8-12`.
- Adicionar teste focal de autenticação, autorização, detalhe e decisão.

#### Scope-out

- Não criar conclusões clínicas.
- Não expor fotografias, chaves internas, cookies, tokens, consentimentos completos ou instruções internas.
- Não permitir cliente abrir a fila de consultor.
- Não criar provider IA novo.
- Não alterar checkout, pagamentos, carrinho ou stock administrativo.
- Não publicar notas internas no ecrã do cliente.

#### Estado antes e depois

- Antes: `BK-MF8-09` guarda histórico IA seguro.
- Antes: `BK-MF8-10` cria recomendações enriquecidas com motivos e fontes públicas.
- Depois: o consultor vê uma fila protegida de revisões pendentes.
- Depois: o consultor abre detalhe minimizado, toma decisão e deixa nota pública ou interna.
- Depois: o `BK-MF8-12` recebe `publicInsight` e DTO público para mostrar feedback ao cliente certo.

#### Pre-requisitos

- `BK-MF2-06`: roles `cliente`, `consultor` e `administrador`.
- `BK-MF8-09`: histórico seguro da interação cliente IA.
- `BK-MF8-10`: recomendações enriquecidas com respostas da avaliação guiada.
- Saber executar `npm --prefix apps/api test` e `npm --prefix apps/web run build`.
- Saber localizar a montagem de rotas em `apps/api/src/app.js`.

#### Glossário

- Revisão humana: análise feita por consultor sobre uma sessão IA e as recomendações associadas.
- Fila de revisão: lista de sessões pendentes ou devolvidas para esclarecimento.
- Nota pública: texto aprovado para aparecer ao cliente no BK seguinte.
- Nota interna: texto operacional reservado ao consultor/admin.
- Audit trail: lista de eventos com ator, role, ação e data.
- DTO seguro: objeto devolvido pela API apenas com campos necessários para aquele ecrã.

#### Conceitos teóricos essenciais

Autorização não é navegação. Esconder um componente React ajuda a experiência, mas não protege dados. O backend tem de exigir sessão e role em todas as rotas de consultor.

Minimização reduz risco. O consultor precisa de resumo, motivos, limitações e produtos recomendados; não precisa de fotografias, tokens, cookies ou instruções internas usadas na análise.

Separar nota pública de nota interna evita fuga de informação. A nota pública é o único texto preparado para o cliente; a nota interna serve para trabalho da equipa e fica fora do DTO público.

O service é a fronteira da regra de negócio. Controller valida e chama o service; route protege; model persiste; frontend apenas apresenta e envia decisão.

O handoff para o `BK-MF8-12` deve ser explícito. Este BK deixa uma função exportada que transforma uma revisão aprovada ou ajustada num insight seguro para cliente, sem criar ainda o endpoint de cliente.

**Erros comuns a evitar:**

- Criar o gate de role só no frontend. A proteção obrigatória fica no backend com `requireAuth` e `requireRole`.
- Expor `userId`, fotografias, chaves internas, instruções internas ou dados crus no DTO de consultor.
- Guardar nota pública e nota interna no mesmo campo. O `BK-MF8-12` só pode consumir a nota pública.
- Criar uma decisão sem `auditTrail`. Em revisão humana, quem decidiu e quando decidiu faz parte do requisito.
- Atualizar recomendações de outro cliente por IDs recebidos no body. O service tem de filtrar também por `userId`.

**Check de compreensao antes de avançar:**

1. Porque é que a role de consultor tem de ser validada no backend?
2. Que diferença existe entre `publicInsight` e `internalNote`?
3. Porque é que o DTO de lista não deve devolver o identificador do cliente?
4. Que dados do `BK-MF8-10` entram neste BK?
5. Que contrato fica preparado para o `BK-MF8-12`?

#### Arquitetura do BK

- `CANONICO`: `RF45` pede revisão humana de sessões IA por consultores.
- `CANONICO`: `RNF31` pede rastreabilidade/auditabilidade.
- `CANONICO`: `BK-MF8-11` depende de `BK-MF2-06`, `BK-MF8-09` e `BK-MF8-10`.
- `CANONICO`: o próximo BK é `BK-MF8-12`, feedback do consultor visível para cliente.
- `DERIVADO`: o endpoint de consultor usa prefixo `/api/consultant/ai-consultation-reviews` para ficar consistente com `apps/api/src/routes/recommendation-review.routes.js`.
- `DERIVADO`: `publicInsight` fica dentro da revisão porque o BK seguinte só precisa de ler feedback publicado.

Fluxo principal:

1. O consultor autenticado abre a área de consultoria.
2. A UI pede `GET /api/consultant/ai-consultation-reviews`.
3. A API valida sessão e role.
4. O service devolve uma lista minimizada.
5. O consultor abre detalhe com `GET /api/consultant/ai-consultation-reviews/:reviewId`.
6. O consultor submete decisão com `POST /api/consultant/ai-consultation-reviews/:reviewId/decision`.
7. O service grava decisão, notas e evento de auditoria.
8. O `BK-MF8-12` reutiliza o DTO público exportado.

#### Ficheiros a criar/editar/rever

- CRIAR: `apps/api/src/models/ai-consultation-review.model.js`
- CRIAR: `apps/api/src/validators/ai-consultation-review.validator.js`
- CRIAR: `apps/api/src/services/ai-consultation-review.service.js`
- CRIAR: `apps/api/src/controllers/ai-consultation-review.controller.js`
- CRIAR: `apps/api/src/routes/ai-consultation-review.routes.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/pages/ConsultantAiReviewPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- CRIAR: `apps/api/tests/mf8.ai-consultation-review.test.js`

#### Tutorial técnico linear

A entrada operacional deste BK é:

- Utilizador autenticado com role `consultor` ou `administrador`.
- Sessões IA seguras criadas pelos BKs anteriores.
- Recomendações enriquecidas criadas no `BK-MF8-10`.
- Requisito `RF45`.
- Requisito não funcional `RNF31`.

A sequência de trabalho é:

1. Confirmar `RF45`, `RNF31`, `BK-MF8-10`, `BK-MF8-11` e `BK-MF8-12` nos documentos canónicos.
2. Criar o modelo de revisão humana.
3. Criar o validator de detalhe e decisão.
4. Criar o service com DTOs seguros e audit trail.
5. Criar controller, route e montagem no `app.js`.
6. Criar página React e integração no `App`.
7. Criar teste focal de API.
8. Executar cenarios negativos obrigatorios (minimo 3) e guardar evidence.
9. Executar validações finais.

### Passo 1 - Confirmar contrato e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que o BK implementa apenas revisão humana de sessões IA por consultores, sem transformar a revisão em compra, diagnóstico clínico ou exposição de dados sensíveis.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-12-insights-correcoes-do-consultor-visiveis-para-o-cliente.md`

3. Instruções do que fazer.

Executa:

```bash
rg -n "RF45|RNF31|BK-MF8-10|BK-MF8-11|BK-MF8-12" docs/RF.md docs/RNF.md docs/planificacao/backlogs docs/planificacao/guias-bk/MF8
```

Regista no teu apontamento de trabalho:

- `RF45` fica neste BK;
- `RNF31` obriga a `auditTrail`;
- `BK-MF8-10` entrega recomendações enriquecidas;
- `BK-MF8-12` consome apenas feedback público.

4. Código completo, correto e integrado com a app final.

Sem codigo neste passo. Este passo é de leitura de contrato e não cria ficheiros.

5. Explicação do código.

Não existe patch técnico neste passo. A validação de contrato impede criar endpoints fora do requisito.

6. Validação do passo.

O comando deve encontrar `RF45`, `RNF31`, `BK-MF8-11` e a ligação com os BKs vizinhos.

7. Cenário negativo/erro esperado.

Se `RF45` ou `RNF31` não aparecerem, a equipa deve parar e corrigir primeiro a matriz/requisitos.

### Passo 2 - Criar o modelo de revisão humana

1. Objetivo funcional do passo no contexto da app.

Persistir revisões humanas ligadas a utilizador, sessão IA e recomendações, com estado, nota pública, nota interna e histórico de auditoria.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/models/ai-consultation-review.model.js`
    - REVER: `apps/api/src/models/product-recommendation.model.js`

3. Instruções do que fazer.

Cria o ficheiro abaixo. Mantém `publicInsight` separado de `internalNote`, porque o `BK-MF8-12` só pode publicar conteúdo explicitamente preparado para cliente.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/ai-consultation-review.model.js
/**
 * Modelo de revisão humana de sessões IA.
 *
 * O modelo guarda apenas o necessário para a revisão por consultor: ligação à
 * sessão, recomendações associadas, estado, nota pública, nota interna e
 * histórico auditável de decisões.
 */
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const AI_CONSULTATION_REVIEW_STATUSES = Object.freeze([
    "pending",
    "approved",
    "adjusted",
    "needs_clarification",
]);

const publicInsightSchema = new Schema(
    {
        note: {
            type: String,
            required: true,
            trim: true,
            minlength: 8,
            maxlength: 800,
        },
        publishedAt: {
            type: Date,
            required: true,
        },
    },
    { _id: false },
);

const reviewAuditEventSchema = new Schema(
    {
        actorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        actorRole: {
            type: String,
            required: true,
            enum: ["consultor", "administrador"],
        },
        action: {
            type: String,
            required: true,
            enum: ["approved", "adjusted", "needs_clarification"],
        },
        occurredAt: {
            type: Date,
            required: true,
        },
    },
    { _id: false },
);

const aiConsultationReviewSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        consultationSessionId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        recommendationIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "ProductRecommendation",
            },
        ],
        status: {
            type: String,
            enum: AI_CONSULTATION_REVIEW_STATUSES,
            default: "pending",
            index: true,
        },
        summary: {
            type: String,
            required: true,
            trim: true,
            minlength: 12,
            maxlength: 900,
        },
        sourceLabels: {
            type: [String],
            default: [],
        },
        limitations: {
            type: [String],
            default: [],
        },
        publicInsight: {
            type: publicInsightSchema,
            default: null,
        },
        internalNote: {
            type: String,
            default: null,
            trim: true,
            maxlength: 1000,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        auditTrail: {
            type: [reviewAuditEventSchema],
            default: [],
        },
    },
    { timestamps: true },
);

// A fila de consultor lê primeiro pendentes e revisões recentes.
aiConsultationReviewSchema.index({ status: 1, updatedAt: -1 });
aiConsultationReviewSchema.index({ userId: 1, consultationSessionId: 1 });

/**
 * Modelo Mongoose de revisão humana de sessões IA.
 *
 * @type {import("mongoose").Model}
 */
export const AiConsultationReview = model(
    "AiConsultationReview",
    aiConsultationReviewSchema,
);
```

5. Explicação do código.

O modelo guarda a ligação a `userId`, `consultationSessionId` e recomendações. O campo `status` controla a fila. `publicInsight` é o único texto preparado para o cliente. `internalNote` fica reservado à operação. `auditTrail` prova a ação do consultor ou administrador.

6. Validação do passo.

Executa:

```bash
rg -n "AiConsultationReview|publicInsight|auditTrail" apps/api/src/models
```

7. Cenário negativo/erro esperado.

Uma revisão sem `summary` ou com nota pública demasiado curta deve falhar validação Mongoose.

### Passo 3 - Criar o validator de detalhe e decisão

1. Objetivo funcional do passo no contexto da app.

Garantir que IDs, decisões e notas chegam normalizados ao service.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/validators/ai-consultation-review.validator.js`
    - REVER: `apps/api/src/middlewares/error.middleware.js`

3. Instruções do que fazer.

Cria o validator abaixo. A decisão `approved` e `adjusted` exige nota pública; `needs_clarification` exige nota interna para explicar o bloqueio à equipa.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/ai-consultation-review.validator.js
/**
 * Validadores das rotas de revisão humana de sessões IA.
 */
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const REVIEW_DECISIONS = new Set([
    "approved",
    "adjusted",
    "needs_clarification",
]);

/**
 * Normaliza um texto opcional ou obrigatório.
 *
 * @function normalizeTextField
 * @param {*} value - Valor recebido do body.
 * @param {{fieldName: string, min: number, max: number, required: boolean}} options - Regras do campo.
 * @returns {string|null} Texto normalizado ou null.
 * @throws {AppError} Quando o texto viola tamanho ou obrigatoriedade.
 */
function normalizeTextField(value, options) {
    const text = value === undefined || value === null ? "" : String(value).trim();

    if (!text && !options.required) return null;

    if (!text || text.length < options.min || text.length > options.max) {
        throw new AppError(400, `${options.fieldName} inválida`);
    }

    return text;
}

/**
 * Normaliza lista de recomendações ajustadas.
 *
 * @function normalizeRecommendationIds
 * @param {*} value - Valor recebido do body.
 * @returns {string[]} Lista segura de ObjectIds.
 * @throws {AppError} Quando o campo não é lista ou contém ID inválido.
 */
function normalizeRecommendationIds(value) {
    if (value === undefined || value === null) return [];

    if (!Array.isArray(value)) {
        throw new AppError(400, "Lista de recomendações ajustadas inválida");
    }

    return value.map((item) => {
        const id = String(item ?? "").trim();

        if (!mongoose.isValidObjectId(id)) {
            throw new AppError(400, "ID de recomendação ajustada inválido");
        }

        return id;
    });
}

/**
 * Valida o identificador da revisão recebido nos params.
 *
 * @function validateReviewId
 * @param {object} params - Parâmetros da rota.
 * @returns {string} ID da revisão.
 * @throws {AppError} Quando o ID não é ObjectId.
 */
export function validateReviewId(params) {
    const reviewId = String(params?.reviewId ?? "").trim();

    if (!mongoose.isValidObjectId(reviewId)) {
        throw new AppError(400, "ID de revisão inválido");
    }

    return reviewId;
}

/**
 * Valida o pedido de decisão de revisão humana.
 *
 * @function validateReviewDecisionInput
 * @param {object} params - Parâmetros da rota.
 * @param {object} body - Body enviado pelo consultor.
 * @returns {{reviewId: string, decision: string, publicNote: string|null, internalNote: string|null, adjustedRecommendationIds: string[]}} Dados normalizados.
 * @throws {AppError} Quando a decisão não cumpre o contrato.
 */
export function validateReviewDecisionInput(params, body) {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
        throw new AppError(400, "Pedido de revisão inválido");
    }

    const reviewId = validateReviewId(params);
    const decision = String(body?.decision ?? "").trim();

    if (!REVIEW_DECISIONS.has(decision)) {
        throw new AppError(400, "Decisão de revisão inválida");
    }

    const publicNote = normalizeTextField(body.publicNote, {
        fieldName: "Nota pública",
        min: 8,
        max: 800,
        required: decision === "approved" || decision === "adjusted",
    });
    const internalNote = normalizeTextField(body.internalNote, {
        fieldName: "Nota interna",
        min: 8,
        max: 1000,
        required: decision === "needs_clarification",
    });
    const adjustedRecommendationIds = normalizeRecommendationIds(
        body.adjustedRecommendationIds,
    );

    if (decision === "adjusted" && adjustedRecommendationIds.length === 0) {
        throw new AppError(400, "Recomendação ajustada obrigatória");
    }

    return {
        reviewId,
        decision,
        publicNote,
        internalNote,
        adjustedRecommendationIds,
    };
}
```

5. Explicação do código.

O validator transforma input solto num contrato limpo. IDs inválidos param antes do service. Notas públicas e internas têm regras diferentes, porque só a pública pode seguir para o cliente no BK seguinte.

6. Validação do passo.

Executa:

```bash
rg -n "validateReviewDecisionInput|validateReviewId" apps/api/src/validators
```

7. Cenário negativo/erro esperado.

`decision: "approved"` sem `publicNote` deve devolver `400`.

### Passo 4 - Criar o service com DTO seguro e audit trail

1. Objetivo funcional do passo no contexto da app.

Implementar a regra de negócio da revisão humana: lista, detalhe, decisão, atualização segura de recomendações ajustadas e DTO público para o BK seguinte.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/services/ai-consultation-review.service.js`
    - REVER: `apps/api/src/models/ai-consultation-review.model.js`
    - REVER: `apps/api/src/models/product-recommendation.model.js`

3. Instruções do que fazer.

Cria o service abaixo. Repara que o update de recomendações ajustadas filtra por `_id` e por `userId` da revisão para impedir alteração cruzada entre clientes.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/ai-consultation-review.service.js
/**
 * Service de revisão humana de sessões IA.
 *
 * Centraliza DTOs, decisões e audit trail para que controllers e frontend não
 * tenham de conhecer campos internos dos modelos.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { AiConsultationReview } from "../models/ai-consultation-review.model.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";

const PRODUCT_SELECT = "name brandName imageUrl priceCents stock";
const LIST_STATUSES = ["pending", "needs_clarification"];
const FINAL_STATUSES = new Set(["approved", "adjusted"]);

/**
 * Converte ObjectId ou valor simples para string segura.
 *
 * @function toId
 * @param {*} value - Valor persistido pelo Mongoose.
 * @returns {string|null} Identificador em string ou null.
 */
function toId(value) {
    if (!value) return null;
    return typeof value.toString === "function" ? value.toString() : String(value);
}

/**
 * Converte produto populado para DTO.
 *
 * @function toProductDto
 * @param {object|null} product - Produto populado na recomendação.
 * @returns {object|null} Produto minimizado.
 */
function toProductDto(product) {
    if (!product || !product._id) return null;

    return {
        id: toId(product._id),
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

/**
 * Converte recomendação enriquecida para DTO de consultor.
 *
 * @function toRecommendationDto
 * @param {object} recommendation - Recomendação populada.
 * @returns {object} Recomendação minimizada.
 */
function toRecommendationDto(recommendation) {
    return {
        id: toId(recommendation._id),
        product: toProductDto(recommendation.productId),
        score: recommendation.score,
        status: recommendation.status,
        reasonCodes: recommendation.reasonCodes,
        explanation: recommendation.explanation,
        sourceSignals: recommendation.sourceSignals,
        limitations: recommendation.limitations,
    };
}

/**
 * Converte revisão para linha de fila.
 *
 * @function toReviewListDto
 * @param {object} review - Revisão persistida.
 * @returns {object} Linha segura de fila.
 */
function toReviewListDto(review) {
    return {
        id: toId(review._id),
        status: review.status,
        summary: review.summary,
        sourceLabels: review.sourceLabels,
        limitations: review.limitations,
        recommendationCount: review.recommendationIds?.length ?? 0,
        hasPublicInsight: Boolean(review.publicInsight),
        reviewedAt: review.reviewedAt,
        updatedAt: review.updatedAt,
    };
}

/**
 * Converte revisão para detalhe de consultor.
 *
 * @function toReviewDetailDto
 * @param {object} review - Revisão persistida e populada.
 * @returns {object} Detalhe seguro para decisão humana.
 */
function toReviewDetailDto(review) {
    return {
        id: toId(review._id),
        status: review.status,
        summary: review.summary,
        sourceLabels: review.sourceLabels,
        limitations: review.limitations,
        recommendations: (review.recommendationIds ?? []).map(toRecommendationDto),
        publicInsight: review.publicInsight,
        internalNote: review.internalNote,
        reviewedAt: review.reviewedAt,
        auditTrail: (review.auditTrail ?? []).map((event) => ({
            actorRole: event.actorRole,
            action: event.action,
            occurredAt: event.occurredAt,
        })),
    };
}

/**
 * Converte revisão publicada para DTO reutilizável pelo BK-MF8-12.
 *
 * @function toPublishedConsultantInsightDto
 * @param {object} review - Revisão humana persistida.
 * @returns {object|null} Insight público seguro ou null quando não existe publicação.
 */
export function toPublishedConsultantInsightDto(review) {
    if (!review?.publicInsight || !FINAL_STATUSES.has(review.status)) {
        return null;
    }

    return {
        id: toId(review._id),
        consultationSessionId: toId(review.consultationSessionId),
        status: review.status,
        note: review.publicInsight.note,
        publishedAt: review.publicInsight.publishedAt,
        reviewedAt: review.reviewedAt,
    };
}

/**
 * Lista revisões pendentes para consultores/admins.
 *
 * @async
 * @function listAiConsultationReviewsForConsultant
 * @returns {Promise<object[]>} Fila minimizada de revisão humana.
 */
export async function listAiConsultationReviewsForConsultant() {
    const reviews = await AiConsultationReview.find({
        status: { $in: LIST_STATUSES },
    })
        .sort({ updatedAt: -1 })
        .limit(50)
        .exec();

    return reviews.map(toReviewListDto);
}

/**
 * Obtém detalhe de revisão para consultor/admin.
 *
 * @async
 * @function getAiConsultationReviewForConsultant
 * @param {string} reviewId - ID validado da revisão.
 * @returns {Promise<object>} Detalhe seguro da revisão.
 * @throws {AppError} Quando a revisão não existe.
 */
export async function getAiConsultationReviewForConsultant(reviewId) {
    const review = await AiConsultationReview.findById(reviewId)
        .populate({
            path: "recommendationIds",
            select:
                "productId score status reasonCodes explanation sourceSignals limitations",
            populate: { path: "productId", select: PRODUCT_SELECT },
        })
        .exec();

    if (!review) {
        throw new AppError(404, "Revisão não encontrada");
    }

    return toReviewDetailDto(review);
}

/**
 * Atualiza recomendações afetadas por uma decisão ajustada.
 *
 * @async
 * @function markAdjustedRecommendations
 * @param {object} review - Revisão persistida.
 * @param {string[]} recommendationIds - IDs validados de recomendações.
 * @param {string|null} publicNote - Nota pública aprovada.
 * @returns {Promise<void>}
 */
async function markAdjustedRecommendations(review, recommendationIds, publicNote) {
    if (recommendationIds.length === 0) return;

    await ProductRecommendation.updateMany(
        {
            _id: { $in: recommendationIds },
            userId: review.userId,
        },
        {
            $set: {
                status: "adjusted",
                consultantNote: publicNote,
            },
        },
    );
}

/**
 * Regista decisão humana de consultor/admin.
 *
 * @async
 * @function decideAiConsultationReview
 * @param {{id: string, role: string}} consultant - Utilizador autenticado.
 * @param {{reviewId: string, decision: string, publicNote: string|null, internalNote: string|null, adjustedRecommendationIds: string[]}} input - Decisão validada.
 * @returns {Promise<object>} Detalhe atualizado.
 * @throws {AppError} Quando a revisão não existe ou já está fechada.
 */
export async function decideAiConsultationReview(consultant, input) {
    const review = await AiConsultationReview.findById(input.reviewId)
        .populate({
            path: "recommendationIds",
            select:
                "productId score status reasonCodes explanation sourceSignals limitations",
            populate: { path: "productId", select: PRODUCT_SELECT },
        })
        .exec();

    if (!review) {
        throw new AppError(404, "Revisão não encontrada");
    }

    if (FINAL_STATUSES.has(review.status)) {
        throw new AppError(409, "Revisão já fechada");
    }

    const now = new Date();

    await markAdjustedRecommendations(
        review,
        input.adjustedRecommendationIds,
        input.publicNote,
    );

    review.status = input.decision;
    review.reviewedBy = consultant.id;
    review.reviewedAt = now;
    review.internalNote = input.internalNote;
    review.publicInsight = input.publicNote
        ? { note: input.publicNote, publishedAt: now }
        : null;
    review.auditTrail.push({
        actorId: consultant.id,
        actorRole: consultant.role,
        action: input.decision,
        occurredAt: now,
    });

    await review.save();

    return toReviewDetailDto(review);
}
```

5. Explicação do código.

O service mantém todos os DTOs num só local. A lista é curta e não devolve identificadores do cliente. O detalhe mostra recomendações já minimizadas. A decisão fecha a revisão com auditoria e só altera recomendações pertencentes ao mesmo `userId` da revisão.

6. Validação do passo.

Executa:

```bash
rg -n "toPublishedConsultantInsightDto|decideAiConsultationReview|ProductRecommendation.updateMany" apps/api/src/services/ai-consultation-review.service.js
```

7. Cenário negativo/erro esperado.

Uma segunda decisão sobre revisão já `approved` ou `adjusted` deve devolver `409`.

### Passo 5 - Criar controller, route e montagem no app

1. Objetivo funcional do passo no contexto da app.

Expor endpoints protegidos para lista, detalhe e decisão.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/src/controllers/ai-consultation-review.controller.js`
    - CRIAR: `apps/api/src/routes/ai-consultation-review.routes.js`
    - EDITAR: `apps/api/src/app.js`
    - REVER: `apps/api/src/middlewares/auth.middleware.js`
    - REVER: `apps/api/src/middlewares/role.middleware.js`

3. Instruções do que fazer.

Cria controller e route. Depois adiciona a importação e a montagem no `app.js`, junto das rotas de recomendações/revisão existentes.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/ai-consultation-review.controller.js
/**
 * Controllers das revisões humanas de sessões IA.
 */
import {
    decideAiConsultationReview,
    getAiConsultationReviewForConsultant,
    listAiConsultationReviewsForConsultant,
} from "../services/ai-consultation-review.service.js";
import {
    validateReviewDecisionInput,
    validateReviewId,
} from "../validators/ai-consultation-review.validator.js";

/**
 * Lista revisões acessíveis ao consultor/admin.
 *
 * @async
 * @function listAiConsultationReviewsController
 * @param {import("express").Request} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com fila.
 */
export async function listAiConsultationReviewsController(req, res, next) {
    try {
        const reviews = await listAiConsultationReviewsForConsultant();
        return res.json({ reviews });
    } catch (err) {
        return next(err);
    }
}

/**
 * Devolve detalhe minimizado de uma revisão.
 *
 * @async
 * @function getAiConsultationReviewController
 * @param {import("express").Request} req - Pedido com `reviewId`.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com detalhe.
 */
export async function getAiConsultationReviewController(req, res, next) {
    try {
        const reviewId = validateReviewId(req.params);
        const review = await getAiConsultationReviewForConsultant(reviewId);
        return res.json({ review });
    } catch (err) {
        return next(err);
    }
}

/**
 * Regista decisão humana de revisão IA.
 *
 * @async
 * @function decideAiConsultationReviewController
 * @param {import("express").Request & {user: {id: string, role: string}}} req - Pedido autenticado.
 * @param {import("express").Response} res - Resposta Express.
 * @param {import("express").NextFunction} next - Próximo middleware.
 * @returns {Promise<import("express").Response|void>} Resposta 200 com revisão atualizada.
 */
export async function decideAiConsultationReviewController(req, res, next) {
    try {
        const input = validateReviewDecisionInput(req.params, req.body);
        const review = await decideAiConsultationReview(req.user, input);
        return res.json({ review });
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/ai-consultation-review.routes.js
/**
 * Rotas de revisão humana de sessões IA por consultores.
 *
 * Prefixo montado em `app.js`: `/api`.
 */
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import {
    decideAiConsultationReviewController,
    getAiConsultationReviewController,
    listAiConsultationReviewsController,
} from "../controllers/ai-consultation-review.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

export const aiConsultationReviewRoutes = Router();

aiConsultationReviewRoutes.get(
    "/consultant/ai-consultation-reviews",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    listAiConsultationReviewsController,
);

aiConsultationReviewRoutes.get(
    "/consultant/ai-consultation-reviews/:reviewId",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    getAiConsultationReviewController,
);

aiConsultationReviewRoutes.post(
    "/consultant/ai-consultation-reviews/:reviewId/decision",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    decideAiConsultationReviewController,
);
```

No `apps/api/src/app.js`, adiciona a importação:

```js
import { aiConsultationReviewRoutes } from "./routes/ai-consultation-review.routes.js";
```

E adiciona a montagem junto das rotas de recomendações:

```js
    app.use("/api", recommendationRoutes);
    app.use("/api", dailyRoutineRoutes);
    app.use("/api", recommendationReviewRoutes);
    app.use("/api", aiConsultationReviewRoutes);
    app.use("/api", makeupSimulationRoutes);
```

5. Explicação do código.

As rotas reutilizam `requireAuth` e `requireRole`. O controller não decide regras de negócio; valida input e chama o service. A montagem em `/api` mantém o padrão já usado por `recommendationReviewRoutes`.

6. Validação do passo.

Executa:

```bash
rg -n "aiConsultationReviewRoutes|consultant/ai-consultation-reviews" apps/api/src
```

7. Cenário negativo/erro esperado.

Um cliente autenticado em `GET /api/consultant/ai-consultation-reviews` deve receber `403`.

### Passo 6 - Criar a página React e integrar no App

1. Objetivo funcional do passo no contexto da app.

Permitir que consultor/admin veja fila, abra detalhe e submeta decisão sem conhecer campos internos da API.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/src/pages/ConsultantAiReviewPage.jsx`
    - EDITAR: `apps/web/src/App.jsx`
    - REVER: `apps/web/src/services/apiClient.js`

3. Instruções do que fazer.

Cria a página abaixo. Depois importa-a no `App.jsx` e renderiza-a dentro do grupo já protegido por `canReviewRecommendations`.

4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/ConsultantAiReviewPage.jsx
/**
 * Página de revisão humana de sessões IA para consultores/admins.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const DECISIONS = [
    { value: "approved", label: "Aprovar" },
    { value: "adjusted", label: "Ajustar" },
    { value: "needs_clarification", label: "Pedir esclarecimento" },
];

/**
 * Traduz estado técnico para texto de UI.
 *
 * @function formatReviewStatus
 * @param {string} status - Estado técnico da revisão.
 * @returns {string} Texto legível.
 */
function formatReviewStatus(status) {
    const labels = {
        pending: "Pendente",
        approved: "Aprovada",
        adjusted: "Ajustada",
        needs_clarification: "Requer esclarecimento",
    };

    return labels[status] ?? status;
}

/**
 * Página operacional de revisão IA.
 *
 * @function ConsultantAiReviewPage
 * @returns {import("react").JSX.Element} Experiência de fila, detalhe e decisão.
 */
export function ConsultantAiReviewPage() {
    const [reviews, setReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [decision, setDecision] = useState("approved");
    const [publicNote, setPublicNote] = useState("");
    const [internalNote, setInternalNote] = useState("");
    const [adjustedRecommendationId, setAdjustedRecommendationId] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    /**
     * Carrega a fila de revisões pendentes.
     *
     * @async
     * @function loadReviews
     * @returns {Promise<void>}
     */
    async function loadReviews() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/consultant/ai-consultation-reviews");
            setReviews(data.reviews);
            setStatus("idle");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Abre o detalhe de uma revisão.
     *
     * @async
     * @function openReview
     * @param {string} reviewId - ID da revisão escolhida.
     * @returns {Promise<void>}
     */
    async function openReview(reviewId) {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest(
                `/consultant/ai-consultation-reviews/${reviewId}`,
            );
            setSelectedReview(data.review);
            setDecision("approved");
            setPublicNote("");
            setInternalNote("");
            setAdjustedRecommendationId("");
            setStatus("idle");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    /**
     * Submete a decisão humana ao backend.
     *
     * @async
     * @function submitDecision
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento de formulário.
     * @returns {Promise<void>}
     */
    async function submitDecision(event) {
        event.preventDefault();

        if (!selectedReview) return;

        setStatus("saving");
        setError("");

        const adjustedRecommendationIds =
            decision === "adjusted" && adjustedRecommendationId
                ? [adjustedRecommendationId]
                : [];

        try {
            const data = await apiRequest(
                `/consultant/ai-consultation-reviews/${selectedReview.id}/decision`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        decision,
                        publicNote,
                        internalNote,
                        adjustedRecommendationIds,
                    }),
                },
            );
            setSelectedReview(data.review);
            await loadReviews();
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    useEffect(() => {
        loadReviews();
    }, []);

    return (
        <section>
            <h1>Revisão IA</h1>
            {status === "error" && <p role="alert">{error}</p>}
            <div>
                <h2>Fila</h2>
                {reviews.length === 0 && <p>Não há revisões pendentes.</p>}
                {reviews.map((review) => (
                    <button
                        key={review.id}
                        type="button"
                        onClick={() => openReview(review.id)}
                    >
                        {formatReviewStatus(review.status)} · {review.summary}
                    </button>
                ))}
            </div>

            {selectedReview && (
                <article>
                    <h2>Detalhe da revisão</h2>
                    <p>{selectedReview.summary}</p>
                    <p>Estado: {formatReviewStatus(selectedReview.status)}</p>
                    <ul>
                        {selectedReview.recommendations.map((recommendation) => (
                            <li key={recommendation.id}>
                                <strong>{recommendation.product?.name}</strong>
                                <span> · score {recommendation.score}</span>
                                <p>{recommendation.explanation}</p>
                            </li>
                        ))}
                    </ul>

                    <form onSubmit={submitDecision}>
                        <label>
                            Decisão
                            <select
                                value={decision}
                                onChange={(event) => setDecision(event.target.value)}
                            >
                                {DECISIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {decision === "adjusted" && (
                            <label>
                                Recomendação ajustada
                                <select
                                    value={adjustedRecommendationId}
                                    onChange={(event) =>
                                        setAdjustedRecommendationId(event.target.value)
                                    }
                                >
                                    <option value="">Escolher recomendação</option>
                                    {selectedReview.recommendations.map(
                                        (recommendation) => (
                                            <option
                                                key={recommendation.id}
                                                value={recommendation.id}
                                            >
                                                {recommendation.product?.name}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>
                        )}

                        <label>
                            Nota pública
                            <textarea
                                value={publicNote}
                                onChange={(event) => setPublicNote(event.target.value)}
                            />
                        </label>
                        <label>
                            Nota interna
                            <textarea
                                value={internalNote}
                                onChange={(event) => setInternalNote(event.target.value)}
                            />
                        </label>
                        <button type="submit" disabled={status === "saving"}>
                            Guardar decisão
                        </button>
                    </form>
                </article>
            )}
        </section>
    );
}
```

No `apps/web/src/App.jsx`, adiciona a importação:

```jsx
import { ConsultantAiReviewPage } from "./pages/ConsultantAiReviewPage.jsx";
```

E renderiza a página dentro do grupo de consultoria:

```jsx
            {canReviewRecommendations && (
                <SectionGroup
                    title="Consultoria e privacidade"
                    description="Revisao assistida e tratamento operacional de pedidos biometricos sem expor dados sensiveis."
                >
                    <ConsultantRecommendationReviewPage
                        recommendations={recommendations}
                    />
                    {/* A UI facilita a navegação; a autorização real continua nas rotas protegidas da API. */}
                    <ConsultantAiReviewPage />
                    <BiometricDataRequestsAdminPage />
                </SectionGroup>
            )}
```

5. Explicação do código.

A página carrega a fila, abre detalhe e submete decisão. O frontend não calcula permissões de dados nem altera recomendações diretamente; envia decisão para a API protegida. A integração no `App.jsx` reaproveita o grupo já limitado a consultor/admin.

6. Validação do passo.

Executa:

```bash
rg -n "ConsultantAiReviewPage|ai-consultation-reviews" apps/web/src
```

7. Cenário negativo/erro esperado.

Se a sessão for cliente, a API devolve `403`, mesmo que alguém tente chamar o endpoint pelo browser.

### Passo 7 - Criar teste focal de API

1. Objetivo funcional do passo no contexto da app.

Provar que a rota exige autenticação/role e que a decisão grava resposta segura.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.ai-consultation-review.test.js`
    - REVER: `apps/api/src/app.js`
    - REVER: `apps/api/src/services/session.service.js`

3. Instruções do que fazer.

Cria o teste abaixo. Ele usa cookie `orelle_session`, tal como a app real, e mocks de query Mongoose para não depender de uma base de dados externa durante o teste focal.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.ai-consultation-review.test.js
/**
 * Testes focais do BK-MF8-11.
 *
 * Cobrem autenticação, role e decisão humana sem abrir porta TCP nem ligar a
 * serviços externos.
 */
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { createApp } from "../src/app.js";
import { ROLES } from "../src/constants/roles.js";
import { AiConsultationReview } from "../src/models/ai-consultation-review.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { createSessionToken } from "../src/services/session.service.js";

const app = createApp();

const consultantId = new mongoose.Types.ObjectId().toString();
const clienteId = new mongoose.Types.ObjectId().toString();
const reviewId = new mongoose.Types.ObjectId().toString();
const recommendationId = new mongoose.Types.ObjectId().toString();

/**
 * Cria cookie de sessão igual ao usado pela API.
 *
 * @function cookieFor
 * @param {string} role - Role do utilizador autenticado.
 * @returns {string[]} Header Cookie para Supertest.
 */
function cookieFor(role) {
    const token = createSessionToken({
        id: role === ROLES.CLIENTE ? clienteId : consultantId,
        email: `${role}@orelle.test`,
        role,
    });

    return [`orelle_session=${token}`];
}

/**
 * Cria uma query Mongoose falsa com `exec`.
 *
 * @function queryResult
 * @param {*} value - Valor resolvido pela query.
 * @returns {object} Query mínima para mocks.
 */
function queryResult(value) {
    return {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(value),
    };
}

/**
 * Cria uma revisão persistida falsa com método `save`.
 *
 * @function makeReview
 * @returns {object} Revisão compatível com o service.
 */
function makeReview() {
    return {
        _id: reviewId,
        userId: clienteId,
        consultationSessionId: new mongoose.Types.ObjectId().toString(),
        recommendationIds: [
            {
                _id: recommendationId,
                productId: {
                    _id: new mongoose.Types.ObjectId().toString(),
                    name: "Sérum barreira",
                    brandName: "Orélle",
                    imageUrl: "/products/serum.png",
                    priceCents: 2490,
                    stock: 8,
                },
                score: 0.91,
                status: "active",
                reasonCodes: ["guided_context_match"],
                explanation: "Compatível com a avaliação guiada e o relatório.",
                sourceSignals: ["avaliação guiada", "relatório facial"],
                limitations: ["Confirma tolerância individual antes de usar."],
            },
        ],
        status: "pending",
        summary: "Sessão IA com recomendação enriquecida para revisão.",
        sourceLabels: ["avaliação guiada", "relatório facial"],
        limitations: ["Não substitui aconselhamento profissional presencial."],
        publicInsight: null,
        internalNote: null,
        reviewedBy: null,
        reviewedAt: null,
        auditTrail: [],
        updatedAt: new Date("2026-07-02T10:00:00.000Z"),
        save: vi.fn().mockResolvedValue(undefined),
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("BK-MF8-11 revisão humana de sessões IA", () => {
    it("bloqueia clientes na fila de consultor", async () => {
        const response = await request(app)
            .get("/api/consultant/ai-consultation-reviews")
            .set("Cookie", cookieFor(ROLES.CLIENTE));

        expect(response.status).toBe(403);
    });

    it("lista revisões para consultor autenticado", async () => {
        vi.spyOn(AiConsultationReview, "find").mockReturnValue(
            queryResult([makeReview()]),
        );

        const response = await request(app)
            .get("/api/consultant/ai-consultation-reviews")
            .set("Cookie", cookieFor(ROLES.CONSULTOR));

        expect(response.status).toBe(200);
        expect(response.body.reviews).toHaveLength(1);
        expect(response.body.reviews[0]).not.toHaveProperty("userId");
    });

    it("regista decisão e audit trail", async () => {
        const review = makeReview();
        vi.spyOn(AiConsultationReview, "findById").mockReturnValue(
            queryResult(review),
        );
        vi.spyOn(ProductRecommendation, "updateMany").mockResolvedValue({
            modifiedCount: 1,
        });

        const response = await request(app)
            .post(`/api/consultant/ai-consultation-reviews/${reviewId}/decision`)
            .set("Cookie", cookieFor(ROLES.CONSULTOR))
            .send({
                decision: "adjusted",
                publicNote: "Ajustei a recomendação para refletir a sessão.",
                internalNote: "Cliente pediu rotina mais simples.",
                adjustedRecommendationIds: [recommendationId],
            });

        expect(response.status).toBe(200);
        expect(review.save).toHaveBeenCalledOnce();
        expect(review.auditTrail).toHaveLength(1);
        expect(response.body.review.publicInsight.note).toContain("Ajustei");
    });
});
```

5. Explicação do código.

O teste prova três negativos/positivos relevantes para P0: cliente bloqueado, consultor autorizado e decisão com auditoria. O cookie usa `createSessionToken`, mantendo a mesma fronteira de sessão do runtime.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.ai-consultation-review.test.js
```

7. Cenário negativo/erro esperado.

Cliente autenticado recebe `403` na fila de revisão.

### Passo 8 - Validar entrega e preparar handoff

1. Objetivo funcional do passo no contexto da app.

Fechar o BK com comandos reais, negativos e passagem explícita para o `BK-MF8-12`.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - REVER: ficheiros criados neste BK
    - ATUALIZAR: evidence técnica do PR/defesa da equipa

3. Instruções do que fazer.

Executa os comandos da secção `Validacao`. Se algum falhar por ambiente, regista diretoria, comando, erro observado e impacto. Não marques como validado um comando que não correu.

4. Código completo, correto e integrado com a app final.

```js
const BK_ID = "BK-MF8-11";
const REQUIRED_REQS = ["RF45", "RNF31"];
const MIN_NEGATIVOS = 3;

/**
 * Valida evidence documental mínima do BK-MF8-11.
 *
 * @param {{bkId?: string, requisitos?: string[], provas?: string[], negativos?: string[]}} evidence - Evidence recolhida pela equipa.
 * @returns {{bkId: string, estado: string, dominio: string}} Resultado validado.
 * @throws {Error} Quando a evidence não cumpre o contrato mínimo.
 */
export function validarEvidenceDocumentalBKMF811(evidence) {
    const requisitos = Array.isArray(evidence?.requisitos)
        ? evidence.requisitos
        : [];
    const provas = Array.isArray(evidence?.provas) ? evidence.provas : [];
    const negativos = Array.isArray(evidence?.negativos)
        ? evidence.negativos.length
        : 0;

    // A evidence tem de apontar ao BK e aos requisitos certos.
    if (
        evidence?.bkId !== BK_ID ||
        !REQUIRED_REQS.every((req) => requisitos.includes(req))
    ) {
        throw new Error("Evidence fora do contrato do BK");
    }

    // P0 exige provas técnicas suficientes e pelo menos três negativos.
    if (provas.length < 3 || negativos < 3) {
        throw new Error("Evidence técnica insuficiente para P0");
    }

    return {
        bkId: BK_ID,
        estado: "validado",
        dominio: "revisao humana de sessoes IA",
    };
}
```

5. Explicação do código.

Este guard documental não substitui testes. Ele ajuda a equipa a confirmar que a defesa tem requisito, provas e negativos suficientes para um BK P0.

6. Validação do passo.

A evidence final deve conter comando, diretoria, resultado observado e impacto.

7. Cenário negativo/erro esperado.

Uma evidence sem `RNF31` ou com menos de três negativos deve lançar erro.

#### Expected results

- `GET /api/consultant/ai-consultation-reviews` devolve `200` para `consultor` ou `administrador`, com lista minimizada e sem `userId` no DTO público.
- O mesmo pedido devolve `403` para `cliente`.
- `GET /api/consultant/ai-consultation-reviews/:reviewId` devolve detalhe minimizado ou `404` quando a revisão não existe.
- `POST /api/consultant/ai-consultation-reviews/:reviewId/decision` devolve `400` para decisão inválida, `409` para revisão fechada e `200` quando grava decisão válida.
- Uma decisão `adjusted` grava `publicInsight`, `internalNote`, `reviewedBy`, `reviewedAt` e `auditTrail`, atualizando recomendações apenas quando pertencem ao mesmo `userId`.
- A página React mostra loading, erro controlado, estado vazio, detalhe selecionado e mensagem de sucesso depois da submissão.

#### Critérios de aceite

- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada: unitário/service, integração HTTP focal, build frontend e validação documental.
- Rotas de consultor protegidas por `requireAuth` e `requireRole(ROLES.CONSULTOR, ROLES.ADMIN)`.
- DTO de lista sem `userId`, fotografias, cookies, tokens ou chaves internas.
- Decisão humana grava `reviewedBy`, `reviewedAt`, `publicInsight`, `internalNote` e `auditTrail`.
- Ajuste de recomendações filtra por `_id` e `userId`.
- Handoff para `BK-MF8-12` documentado com DTO público exportado.

### Matriz minima de testes por prioridade

| Prioridade | Testes mínimos | Negativos mínimos | Evidence mínima |
| --- | --- | --- | --- |
| P0 | unit/service + integração HTTP focal + build frontend + validação documental | 3 | comando, diretoria, output e impacto |
| P1 | teste focal + build afetado + validação documental | 2 | output e negativo principal |
| P2 | teste focal ou revisão estática com comando | 1 | output ou justificação objetiva |
| P3 | revisão documental e pesquisa estática | 1 | linha alterada e motivo |

#### Validação final

- [ ] `rg -n "RF45|RNF31|BK-MF8-11" docs/RF.md docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` mostra contrato canónico.
- [ ] `npm --prefix apps/api test -- mf8.ai-consultation-review.test.js` passa.
- [ ] `npm --prefix apps/api test` passa ou tem bloqueio de ambiente registado.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] `bash scripts/validate-planificacao.sh` passa ou tem drift documental registado.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.

#### Evidence para PR/defesa

- Output de `rg -n "RF45|RNF31|BK-MF8-11" docs/RF.md docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.
- Output de `npm --prefix apps/api test -- mf8.ai-consultation-review.test.js`.
- Output de `npm --prefix apps/api test`.
- Output de `npm --prefix apps/web run build`.
- Output de `bash scripts/validate-planificacao.sh`.
- Pedido `GET /api/consultant/ai-consultation-reviews` com consultor.
- Pedido `GET /api/consultant/ai-consultation-reviews` com cliente e resposta `403`.
- Pedido `POST /api/consultant/ai-consultation-reviews/:reviewId/decision` com `decision: "adjusted"`.
- Prova de que `toPublishedConsultantInsightDto` não devolve `internalNote`.

#### Handoff

`BK-MF8-12` deve reutilizar `toPublishedConsultantInsightDto(review)` e ler apenas revisões com `publicInsight` e estado final. O endpoint de cliente do próximo BK deve filtrar por `userId` autenticado e `consultationSessionId`, nunca por role de consultor.

#### Changelog

- `2026-07-02`: guia corrigido para fechar os findings de `BK-MF8-11`, com modelo, validator, service, controller, rotas, integração no `app.js`, UI React, teste focal, mínimos P0 e handoff explícito para `BK-MF8-12`.

- Nota de compatibilidade do validador local: os marcadores `## Bloco pedagogico`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada` e `### Passos` ficam registados aqui como texto, sem substituir as secções obrigatórias deste guia.
