# BK-MF4-02 - Moderação de comentários e avaliações

## Header
- `doc_id`: `GUIA-BK-MF4-02`
- `bk_id`: `BK-MF4-02`
- `macro`: `MF4`
- `owner`: `Daniel Bulica`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF1-03`
- `rf_rnf`: `RF34`
- `fase_documental`: `Fase 2`
- `sprint`: `S08-S09`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF4-03`
- `guia_path`: `docs/planificacao/guias-bk/MF4/BK-MF4-02-moderacao-de-comentarios-e-avaliacoes.md`
- `last_updated`: `2026-06-15`

#### Objetivo
Criar moderação administrativa para comentários e avaliações de produtos, permitindo listar reviews, ocultar conteúdo impróprio e repor conteúdo publicado sem destruir o histórico.

#### Importância
As avaliações influenciam confiança e compra. Sem moderação, comentários abusivos, spam ou conteúdo enganador podem ficar visíveis na página de produto. A moderação deve proteger a experiência sem permitir que o admin altere a nota ou finja uma opinião do cliente.

#### Scope-in
- Reutilizar o modelo `Review` criado em `BK-MF1-03`.
- Acrescentar campos de moderação: motivo, admin responsável e data.
- Criar endpoints admin para listar e moderar reviews.
- Garantir que o catálogo público continua a mostrar apenas reviews publicadas.
- Criar página admin para ocultar e repor comentários.

#### Scope-out
- Não editar texto ou nota do cliente.
- Não apagar reviews em definitivo.
- Não criar votação de utilidade.
- Não criar denúncias por utilizadores; este BK é fluxo admin.

#### Estado antes e depois
- Antes: `Review.status` já existia com `published` e `hidden`, mas não havia painel nem endpoints admin de moderação.
- Depois: reviews passam a ter auditoria mínima de moderação e gestão administrativa protegida.

#### Pre-requisitos
- `BK-MF1-03`: criação e listagem pública de reviews.
- `BK-MF0-05`: role `administrador`.
- `BK-MF4-01`: padrão admin para routes protegidas.
- `RF34`: moderação de comentários e avaliações.

#### Glossário
- Review: avaliação de produto com nota e comentário.
- Publicada: visível na página de produto.
- Oculta: preservada na base de dados, mas invisível no catálogo público.
- Motivo de moderação: razão curta para justificar a ação admin.
- Auditoria mínima: registo de quem moderou e quando.

#### Conceitos teóricos essenciais
Moderar não é o mesmo que editar. Se um administrador altera o comentário de um cliente, a app deixa de refletir a opinião original. Por isso, este BK permite ocultar ou repor, mas não reescrever.

O catálogo público deve continuar simples: só mostra reviews com `status: "published"`. A área admin vê todas, porque precisa de contexto para decidir.

O backend deve guardar o motivo da ação. Isto ajuda a defesa PAP e prepara `BK-MF5-04`, onde acessos e operações sensíveis ficam auditados de forma mais completa.

#### Arquitetura do BK
- `review.model.js`: acrescenta campos de moderação.
- `admin-review.validator.js`: valida status e motivo.
- `admin-review.service.js`: lista e atualiza moderação.
- `admin-review.controller.js`: responde HTTP.
- `admin-review.routes.js`: protege endpoints com admin.
- `AdminReviewsPage.jsx`: UI administrativa.
- `app.js` e `App.jsx`: registam backend e frontend.

#### Ficheiros a criar/editar/rever
- EDITAR: `apps/api/src/models/review.model.js`
- CRIAR: `apps/api/src/validators/admin-review.validator.js`
- CRIAR: `apps/api/src/services/admin-review.service.js`
- CRIAR: `apps/api/src/controllers/admin-review.controller.js`
- CRIAR: `apps/api/src/routes/admin-review.routes.js`
- EDITAR: `apps/api/src/app.js`
- CRIAR: `apps/web/src/pages/AdminReviewsPage.jsx`
- EDITAR: `apps/web/src/App.jsx`
- REVER: `apps/api/src/services/review.service.js`
- REVER: `apps/api/src/services/product.service.js`

#### Tutorial técnico linear
### Passo 1 - Confirmar contrato de moderação

1. Objetivo funcional do passo no contexto da app.

manter `RF34` limitado a moderação de reviews de produto.
2. Ficheiros envolvidos:
   - REVER: `docs/RF.md`
   - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
   - REVER: `apps/api/src/models/review.model.js`
   - LOCALIZAÇÃO: `RF34`, `BK-MF4-02` e schema `Review`.
3. Instruções do que fazer.

confirmar que `Review.status` já prepara ocultar/publicar.
4. Código completo, correto e integrado com a app final.

```text
Sem código neste passo. A decisão é reutilizar Review e não criar entidade paralela.
```

5. Explicação do código.

O contrato anterior já tem `Review`, por isso este BK deve evoluir essa entidade em vez de criar uma segunda coleção para moderação. Esta decisão é importante para alunos: quando duas partes da app falam da mesma coisa, devem partilhar o mesmo modelo ou um contrato muito bem justificado. Se criássemos `AdminReview` ou `ModeratedReview`, o catálogo podia mostrar uma avaliação e o painel admin podia alterar outra, criando drift funcional e bugs difíceis de explicar.
6. Validação do passo.

o PR não deve criar outro modelo para comentários de produto.
7. Cenário negativo/erro esperado.

dois modelos para o mesmo conceito geram contagens e páginas públicas inconsistentes.

### Passo 2 - Estender Review com metadados

1. Objetivo funcional do passo no contexto da app.

saber quem moderou e porquê.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/models/review.model.js`
   - LOCALIZAÇÃO: dentro de `reviewSchema`.
3. Instruções do que fazer.

manter `status` e adicionar campos opcionais de moderação.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/review.model.js
const reviewSchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 600,
        },
        status: {
            type: String,
            enum: ["published", "hidden"],
            default: "published",
            index: true,
        },
        // A moderação não apaga nem reescreve o comentário.
        // Guarda apenas o motivo administrativo para justificar a decisão.
        moderationReason: {
            type: String,
            trim: true,
            maxlength: 240,
            default: "",
        },
        // Estes campos permitem responder às perguntas "quem moderou?" e
        // "quando moderou?", sem misturar essa informação com o texto do cliente.
        moderatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        moderatedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);
```

5. Explicação do código.

O código preserva a avaliação original do cliente. `rating` e `comment` continuam a representar aquilo que o utilizador escreveu; a moderação apenas altera `status` e acrescenta metadados administrativos. Isto ensina uma regra ética e técnica: moderar conteúdo não deve falsificar a opinião do cliente. Se o comentário for ocultado, a aplicação guarda quem moderou, quando moderou e porquê, para que a decisão possa ser revista.
6. Validação do passo.

review nova continua `published`; review moderada passa a ter `moderatedAt`.
7. Cenário negativo/erro esperado.

tornar `moderationReason` obrigatório quebraria reviews antigas.

### Passo 3 - Validar input administrativo

1. Objetivo funcional do passo no contexto da app.

rejeitar estados ou motivos inválidos antes do service.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/validators/admin-review.validator.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

aceitar apenas `published` ou `hidden` e motivo curto.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/admin-review.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const REVIEW_STATUSES = ["published", "hidden"];

/**
 * Valida params e body de moderação de review.
 *
 * @function validateReviewModerationInput
 * @param {Record<string, string>} params - Params da route.
 * @param {Record<string, unknown>} body - Body recebido.
 * @returns {{reviewId: string, status: "published"|"hidden", moderationReason: string}} Dados normalizados.
 * @throws {AppError} Quando o ID, status ou motivo são inválidos.
 */
export function validateReviewModerationInput(params, body) {
    const reviewId = String(params.reviewId ?? "");
    const status = String(body.status ?? "").trim();
    const moderationReason = String(body.moderationReason ?? "").trim();

    if (!mongoose.isValidObjectId(reviewId)) {
        throw new AppError(400, "ID de review invalido");
    }

    if (!REVIEW_STATUSES.includes(status)) {
        throw new AppError(400, "Estado de moderação invalido");
    }

    if (status === "hidden" && moderationReason.length < 3) {
        throw new AppError(400, "Motivo obrigatório para ocultar review");
    }

    if (moderationReason.length > 240) {
        throw new AppError(400, "Motivo demasiado longo");
    }

    return { reviewId, status, moderationReason };
}
```

5. Explicação do código.

O validator transforma uma regra pedagógica em regra de backend. Ocultar uma review exige motivo porque a decisão retira conteúdo público da loja e deve ser justificável. Repor uma review como `published` pode não precisar de motivo novo, porque a ação devolve visibilidade ao conteúdo original. Esta diferença ajuda o aluno a perceber que validação não é só "campo obrigatório"; validação também representa intenção de negócio e responsabilidade.
6. Validação do passo.

enviar `status: "deleted"` e esperar `400`.
7. Cenário negativo/erro esperado.

aceitar qualquer string permitiria estados que o catálogo não sabe filtrar.

### Passo 4 - Criar service admin

1. Objetivo funcional do passo no contexto da app.

listar todas as reviews e alterar apenas visibilidade.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/services/admin-review.service.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

criar DTO seguro e funções admin.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/admin-review.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { Review } from "../models/review.model.js";

/**
 * Converte review para DTO administrativo sem dados sensíveis.
 *
 * @function toAdminReviewDto
 * @param {object} review - Documento Mongoose populado.
 * @returns {object} Review segura para admin.
 */
function toAdminReviewDto(review) {
    return {
        id: review._id.toString(),
        productId: review.productId?._id?.toString() ?? review.productId.toString(),
        productName: review.productId?.name ?? "",
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        moderationReason: review.moderationReason,
        moderatedAt: review.moderatedAt,
        createdAt: review.createdAt,
    };
}

/**
 * Lista reviews para moderação administrativa.
 *
 * @async
 * @function listAdminReviews
 * @returns {Promise<object[]>} Reviews ordenadas por data.
 */
export async function listAdminReviews() {
    const reviews = await Review.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("productId", "name");

    return reviews.map(toAdminReviewDto);
}

/**
 * Atualiza visibilidade de uma review.
 *
 * @async
 * @function moderateReview
 * @param {{reviewId: string, status: "published"|"hidden", moderationReason: string, adminUserId: string}} input - Ação validada.
 * @returns {Promise<object>} Review moderada.
 */
export async function moderateReview(input) {
    const review = await Review.findByIdAndUpdate(
        input.reviewId,
        {
            status: input.status,
            moderationReason: input.moderationReason,
            moderatedBy: input.adminUserId,
            moderatedAt: new Date(),
        },
        { new: true, runValidators: true },
    ).populate("productId", "name");

    if (!review) {
        throw new AppError(404, "Review não encontrada");
    }

    return toAdminReviewDto(review);
}
```

5. Explicação do código.

O service é deliberadamente estreito: recebe a decisão de moderação, valida o alvo e altera apenas os campos que pertencem à moderação. Ele não toca em `rating`, `comment` nem `userId`, porque esses campos pertencem ao fluxo do cliente criado em `BK-MF1-03`. Esta fronteira protege a confiança do catálogo: o admin pode esconder conteúdo impróprio, mas não pode transformar uma avaliação negativa numa avaliação positiva.
6. Validação do passo.

moderar uma review e confirmar que a nota original se mantém.
7. Cenário negativo/erro esperado.

devolver email do autor não é necessário para moderação inicial e aumenta exposição de dados.

### Passo 5 - Criar controller, route e registo

1. Objetivo funcional do passo no contexto da app.

expor endpoints admin.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/controllers/admin-review.controller.js`
   - CRIAR: `apps/api/src/routes/admin-review.routes.js`
   - EDITAR: `apps/api/src/app.js`
3. Instruções do que fazer.

criar `GET /api/admin/reviews` e `PATCH /api/admin/reviews/:reviewId`.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/controllers/admin-review.controller.js
import {
    listAdminReviews,
    moderateReview,
} from "../services/admin-review.service.js";
import { validateReviewModerationInput } from "../validators/admin-review.validator.js";

/**
 * Lista reviews para moderação.
 *
 * @async
 * @function listAdminReviewsController
 */
export async function listAdminReviewsController(req, res, next) {
    try {
        const reviews = await listAdminReviews();
        return res.status(200).json({ reviews });
    } catch (err) {
        return next(err);
    }
}

/**
 * Aplica decisão de moderação.
 *
 * @async
 * @function moderateReviewController
 */
export async function moderateReviewController(req, res, next) {
    try {
        const input = validateReviewModerationInput(req.params, req.body);
        const review = await moderateReview({ ...input, adminUserId: req.user.id });
        return res.status(200).json({ review });
    } catch (err) {
        return next(err);
    }
}
```

```js
// apps/api/src/routes/admin-review.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    listAdminReviewsController,
    moderateReviewController,
} from "../controllers/admin-review.controller.js";

/**
 * Router Express para moderação administrativa de reviews.
 *
 * @type {import("express").Router}
 */
export const adminReviewRoutes = Router();

adminReviewRoutes.get("/reviews", requireAuth, requireRole(ROLES.ADMIN), listAdminReviewsController);
adminReviewRoutes.patch("/reviews/:reviewId", requireAuth, requireRole(ROLES.ADMIN), moderateReviewController);
```

```js
// apps/api/src/app.js
import { adminReviewRoutes } from "./routes/admin-review.routes.js";

app.use("/api/admin", adminReviewRoutes);
```

5. Explicação do código.

O prefixo `/api/admin` comunica a intenção da rota e facilita a leitura do projeto, mas a proteção real vem dos middlewares. O aluno deve reparar que `requireAuth` identifica a sessão e `requireRole(ROLES.ADMIN)` limita a ação a administradores. Isto evita um erro comum: criar uma página admin no frontend e esquecer que qualquer endpoint sem middleware pode ser chamado diretamente.
6. Validação do passo.

cliente recebe `403`; admin recebe lista.
7. Cenário negativo/erro esperado.

expor `PATCH /api/reviews/:id` sem prefixo admin pode confundir com review do cliente.

### Passo 6 - Criar página de moderação

1. Objetivo funcional do passo no contexto da app.

permitir revisão manual das reviews.
2. Ficheiros envolvidos:
   - CRIAR: `apps/web/src/pages/AdminReviewsPage.jsx`
   - EDITAR: `apps/web/src/App.jsx`
3. Instruções do que fazer.

listar reviews, recolher motivo e enviar ação.
4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/AdminReviewsPage.jsx
import React, { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Painel de moderação de reviews.
 *
 * @function AdminReviewsPage
 * @returns {JSX.Element} UI admin para ocultar ou repor reviews.
 */
export function AdminReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [reasonById, setReasonById] = useState({});
    const [message, setMessage] = useState("");

    /**
     * Carrega reviews administrativas.
     *
     * @async
     * @returns {Promise<void>}
     */
    async function loadReviews() {
        const data = await apiRequest("/admin/reviews");
        setReviews(data.reviews);
    }

    /**
     * Envia decisão de moderação.
     *
     * @async
     * @param {string} reviewId - Review alvo.
     * @param {"published"|"hidden"} status - Estado pretendido.
     * @returns {Promise<void>}
     */
    async function moderate(reviewId, status) {
        try {
            // O frontend envia apenas a decisão e o motivo.
            // O backend decide permissões, valida status e preserva rating/comment.
            await apiRequest(`/admin/reviews/${reviewId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    status,
                    moderationReason: reasonById[reviewId] ?? "",
                }),
            });
            setMessage("Review atualizada.");
            await loadReviews();
        } catch (err) {
            setMessage(err.message);
        }
    }

    useEffect(() => {
        loadReviews().catch((err) => setMessage(err.message));
    }, []);

    return (
        <section className="page-section">
            <h2>Moderação de avaliações</h2>
            {message && <p role="alert">{message}</p>}
            <ul>
                {reviews.map((review) => (
                    <li key={review.id}>
                        <strong>{review.productName}</strong>
                        <span> Nota {review.rating} - {review.status}</span>
                        <p>{review.comment}</p>
                        <input
                            aria-label="Motivo para ocultar"
                            value={reasonById[review.id] ?? ""}
                            // Guardamos motivos por ID para o admin poder preparar
                            // decisões diferentes em várias reviews antes de enviar.
                            onChange={(event) =>
                                setReasonById((current) => ({
                                    ...current,
                                    [review.id]: event.target.value,
                                }))
                            }
                        />
                        <button type="button" onClick={() => moderate(review.id, "hidden")}>
                            Ocultar
                        </button>
                        <button type="button" onClick={() => moderate(review.id, "published")}>
                            Publicar
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
```

5. Explicação do código.

A UI dá ao administrador uma forma simples de listar, justificar e enviar decisões, mas não substitui a regra de backend. O motivo é guardado por review para que o admin não tenha de escrever a mesma coisa globalmente. `apiRequest` envia o cookie HttpOnly sem expor tokens ao JavaScript, mantendo o padrão de autenticação da app. Se o pedido falhar, a mensagem aparece no ecrã para o aluno conseguir testar cenários negativos durante a defesa.
6. Validação do passo.

ocultar review, abrir página de detalhe do produto e confirmar que ela não aparece.
7. Cenário negativo/erro esperado.

a UI permitir editar `rating` quebraria a confiança do comentário original.

### Passo 7 - Validar negativos e evidência

1. Objetivo funcional do passo no contexto da app.

provar que a moderação está protegida e não altera a opinião.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `apps/api/tests/mf4.admin-reviews.test.js`
   - REVER: `apps/api/src/services/review.service.js`
3. Instruções do que fazer.

testar autorização, status inválido e ocultação na listagem pública.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf4.admin-reviews.test.js
import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateReviewModerationInput } from "../src/validators/admin-review.validator.js";
import { moderateReview } from "../src/services/admin-review.service.js";
import { Review } from "../src/models/review.model.js";

vi.mock("../src/models/review.model.js", () => ({
    Review: {
        findByIdAndUpdate: vi.fn(),
    },
}));

// Tal como nos services reais, basta que o ID tenha `toString()`.
// Isto mantém o teste focado na moderação e não na implementação do MongoDB.
function objectId(value) {
    return { toString: () => value };
}

// Este helper cria uma review com valores seguros por defeito.
// Cada teste altera apenas o que interessa para o cenário.
function makeReview(overrides = {}) {
    return {
        _id: objectId(overrides.id ?? "64b7f1a0f4e6f5c6d7e8f901"),
        productId: {
            _id: objectId(overrides.productId ?? "64b7f1a0f4e6f5c6d7e8f902"),
            name: overrides.productName ?? "Sérum suave",
        },
        rating: overrides.rating ?? 5,
        comment: overrides.comment ?? "Textura agradável",
        status: overrides.status ?? "published",
        moderationReason: overrides.moderationReason ?? "",
        moderatedAt: overrides.moderatedAt ?? null,
        createdAt: new Date("2026-06-15T10:00:00.000Z"),
    };
}

describe("BK-MF4-02 admin review moderation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejeita estado de moderação fora do contrato", () => {
        expect(() =>
            validateReviewModerationInput(
                { reviewId: "64b7f1a0f4e6f5c6d7e8f901" },
                { status: "deleted", moderationReason: "pedido inválido" },
            ),
        ).toThrow("Estado de moderação invalido");
    });

    it("oculta review sem alterar rating nem comentário", async () => {
        const reviewId = "64b7f1a0f4e6f5c6d7e8f901";
        Review.findByIdAndUpdate.mockReturnValueOnce({
            populate: vi.fn().mockResolvedValue(
                makeReview({
                    id: reviewId,
                    status: "hidden",
                    moderationReason: "linguagem ofensiva",
                    moderatedAt: new Date("2026-06-15T11:00:00.000Z"),
                }),
            ),
        });

        const review = await moderateReview({
            reviewId,
            status: "hidden",
            moderationReason: "linguagem ofensiva",
            adminUserId: "64b7f1a0f4e6f5c6d7e8f902",
        });
        const [, update] = Review.findByIdAndUpdate.mock.calls[0];

        // O update deve conter só campos de moderação. Se rating/comment
        // aparecerem aqui, o admin estaria a reescrever a opinião do cliente.
        expect(update).toMatchObject({
            status: "hidden",
            moderationReason: "linguagem ofensiva",
            moderatedBy: "64b7f1a0f4e6f5c6d7e8f902",
        });
        expect(update).not.toHaveProperty("rating");
        expect(update).not.toHaveProperty("comment");
        expect(review).toMatchObject({
            rating: 5,
            comment: "Textura agradável",
            status: "hidden",
        });
    });
});
```

5. Explicação do código.

Os testes estão escritos para provar a fronteira do BK. O validator rejeita estados que não existem no contrato, e o service é testado para garantir que só os campos de moderação entram no update. O detalhe mais importante é o `not.toHaveProperty("rating")` e `not.toHaveProperty("comment")`: estes asserts ensinam que um teste também pode proteger o que não deve acontecer. Isso é especialmente útil em moderação, onde alterar demais seria uma quebra de confiança.
6. Validação do passo.

executar `npm --prefix apps/api test` e confirmar também os `403` nas routes admin.
7. Cenário negativo/erro esperado.

não testar a listagem pública pode deixar reviews ocultas visíveis.

#### Expected results
- `GET /api/admin/reviews` devolve `200` para admin.
- `PATCH /api/admin/reviews/:reviewId` devolve `200` com review moderada.
- Cliente recebe `403` nos endpoints admin.
- Status inválido devolve `400`.
- Review oculta deixa de aparecer no catálogo público.

#### Critérios de aceite
- Entrega funcional especifica de `Moderação de comentários e avaliações` validada contra `RF34`.
- Cenários negativos concluídos: mínimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Reviews são ocultadas ou republicadas sem editar nota/comentário.
- Endpoints admin protegidos por sessão e role.

#### Validação final
- Executar testes de integração da API.
- Confirmar que `listProductReviews` mantém filtro `status: "published"`.
- Executar build do frontend.
- Confirmar `bash scripts/validate-planificacao.sh`.

#### Evidence para PR/defesa
- `proof_tecnico`: output dos endpoints admin.
- `proof_negativos`: `403`, `400` e `404` documentados.
- `proof_ui`: screenshot da página de moderação.
- `proof_catalogo`: antes/depois mostrando review oculta fora da página pública.

#### Handoff
`BK-MF4-03` pode exportar dados administrativos com reviews moderadas, mas deve minimizar dados pessoais. `BK-MF5-04` pode usar `moderatedBy` e `moderatedAt` como base para auditoria posterior.

#### Changelog
- `2026-06-15`: guia reescrito para moderação real de reviews, com service, validator, route admin, UI e negativos `P1`.
