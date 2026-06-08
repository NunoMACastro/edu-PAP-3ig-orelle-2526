# BK-MF2-06 - Consultores podem rever recomendações e sugerir ajustes manuais

## Header
- `doc_id`: `GUIA-BK-MF2-06`
- `bk_id`: `BK-MF2-06`
- `macro`: `MF2`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P2`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF2-02`
- `rf_rnf`: `RF22`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-07`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-06-consultores-podem-rever-recomendacoes-e-sugerir-ajustes-manuais.md`
- `last_updated`: `2026-06-08`

## Contexto do BK
- Entrega alvo: implementar `RF22`, permitindo revisão manual por consultores.
- CANONICO: roles da MF0 são `cliente`, `consultor` e `administrador`.
- DERIVADO: como ainda não existe entidade de atribuição consultor-cliente, este BK autoriza `consultor` e `administrador` por role e limita o DTO a recomendação, produto e decisão.
- Este BK não dá acesso a fotografias, análises completas ou relatórios completos.

## Objetivo
Neste BK vais criar o registo de revisão de recomendações por consultores e administradores.

## Importância
Recomendações derivam de análise facial e devem ser revistas com cuidado. A role por si só não deve abrir dados sensíveis; o service deve devolver apenas o necessário para a decisão.

## Scope-in
- Criar `RecommendationReview`.
- Criar validator de revisão.
- Criar `POST /api/consultant/recommendations/:recommendationId/reviews`.
- Proteger route com `requireAuth` e `requireRole(ROLES.CONSULTOR, ROLES.ADMIN)`.
- Criar página mínima para submeter revisão.

## Scope-out
- Não expor fotografias faciais.
- Não devolver `analysisId`, `reportId`, `photoIds`, `consentId` ou `storageKey`.
- Não permitir revisão por cliente.
- Não criar entidade de atribuição consultor-cliente sem requisito próprio.

## Estado antes
`CRITICO`: faltavam validator, controller, DTO seguro e regra explícita de acesso.

## Estado depois
`OK`: revisão passa a ter role canónica, validação, registo de decisão, DTO mínimo e negativos de acesso.

## Pré-requisitos
- `BK-MF0-05`: `ROLES` e `requireRole`.
- `BK-MF2-02`: `ProductRecommendation`.
- `BK-MF2-03`: motivos da recomendação.

## Glossário
- `review`: decisão manual sobre uma recomendação.
- `consultor`: role canónica autorizada a rever.
- `administrador`: role canónica com permissão de revisão.
- `clientUserId`: cliente dono da recomendação.
- `DTO mínimo`: resposta sem campos sensíveis fora do necessário.

## Conceitos teóricos
Role-based access control significa que a API verifica a role antes de permitir a ação. Neste BK, a route exige sessão e role `consultor` ou `administrador`. O cliente autenticado recebe `403` antes de chegar ao service.

Privacidade continua a ser responsabilidade do service. Mesmo com role autorizada, o service não deve popular análise facial, relatório completo ou fotografia. A revisão precisa de produto, score, motivo e decisão; não precisa de biometria.

O registo de revisão guarda `consultantId` e `clientUserId`. Isto prepara rastreabilidade futura sem criar agora um módulo transversal.

## Arquitetura do BK
- `recommendation-review.model.js`: guarda decisão manual.
- `recommendation-review.validator.js`: valida ID, status, nota e explicação ajustada.
- `recommendation-review.service.js`: aplica decisão e devolve DTO.
- `recommendation-review.controller.js`: liga validator e service.
- `recommendation-review.routes.js`: aplica sessão e roles.
- `ConsultantRecommendationReviewPage.jsx`: formulário de revisão.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/recommendation-review.model.js`
- CRIAR: `server/src/validators/recommendation-review.validator.js`
- CRIAR: `server/src/services/recommendation-review.service.js`
- CRIAR: `server/src/controllers/recommendation-review.controller.js`
- CRIAR: `server/src/routes/recommendation-review.routes.js`
- EDITAR: `server/src/app.js`
- CRIAR: `client/src/pages/ConsultantRecommendationReviewPage.jsx`
- EDITAR: `client/src/App.jsx`
- REVER: `server/src/constants/roles.js`
- REVER: `server/src/middlewares/auth.middleware.js`
- REVER: `server/src/middlewares/role.middleware.js`

## Bloco pedagógico
### Objetivo
Implementar `RF22` com role, validação e minimização de dados.

### Pré-requisitos
- Confirmar roles canónicas da MF0.
- Ter recomendações geradas.
- Saber que cliente não pode rever recomendações.

### Erros comuns
- Usar role `admin` em vez de `administrador`.
- Popular análise ou fotografia no retorno.
- Permitir status livre.
- Atualizar recomendação sem registar quem reviu.

### Check de compreensão
- [ ] Sei explicar por que a route usa duas proteções.
- [ ] Sei listar os dados que não devem aparecer no DTO.
- [ ] Sei testar cliente autenticado com `403`.

### Tempo estimado
- `P2`: 60-90 minutos, incluindo negativos.

## Bloco operacional
### Entrada
- BK: `BK-MF2-06`
- Requisito: `RF22`
- Endpoint principal: `POST /api/consultant/recommendations/:recommendationId/reviews`

### Passos
1. Confirmar contrato funcional e roles.
2. Criar modelo de revisão.
3. Criar validator.
4. Criar service.
5. Criar controller e route.
6. Registar route e página.
7. Executar cenários negativos obrigatórios (mínimo 1).

### Cenários negativos recomendados
- Cliente autenticado deve receber `403`.
- Status inválido deve devolver `400`.
- Recomendação inexistente deve devolver `404`.

### Validação
- [ ] Smoke: consultor revê recomendação existente.
- [ ] Negativos: mínimo `1` cenários com resultado controlado.
- [ ] Segurança: DTO não expõe fotografia, análise completa ou consentimento.

### Matriz mínima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
`BK-MF2-07` continua com cliente e fotografia frontal; não depende desta revisão.

## Passos lineares
### Passo 1 - Confirmar contrato e roles

1. Explicação simples do objetivo: usar roles canónicas sem inventar nomes.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/guias-bk/MF0/BK-MF0-05-criacao-de-roles-cliente-consultor-administrador.md`
    - LOCALIZAÇÃO: `ROLES` e `RF22`.
3. O que fazer: confirmar `ROLES.CONSULTOR` e `ROLES.ADMIN`.
4. Código completo, correto e integrado.

```text
Roles válidas: cliente, consultor, administrador.
```

5. Explicação do código: a route deve usar constantes para evitar divergência de grafia.
6. Como validar este passo: verificar import de `ROLES`.
7. Erros comuns ou cenário negativo: escrever `"admin"` deixa administradores sem acesso ou cria regra paralela.

### Passo 2 - Criar modelo RecommendationReview

1. Explicação simples do objetivo: guardar decisão manual com autor e cliente afetado.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/recommendation-review.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar schema com status controlado.
4. Código completo, correto e integrado.

```js
// server/src/models/recommendation-review.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const recommendationReviewSchema = new Schema(
    {
        recommendationId: {
            type: Schema.Types.ObjectId,
            ref: "ProductRecommendation",
            required: true,
            index: true,
        },
        clientUserId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        consultantId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["approved", "adjusted", "rejected"],
            required: true,
        },
        note: {
            type: String,
            required: true,
            minlength: 5,
            maxlength: 500,
        },
        adjustedExplanation: {
            type: String,
            default: null,
            maxlength: 600,
        },
        reviewedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },
    },
    { timestamps: true },
);

recommendationReviewSchema.index({ recommendationId: 1, consultantId: 1, createdAt: -1 });

export const RecommendationReview = model("RecommendationReview", recommendationReviewSchema);
```

5. Explicação do código: a revisão liga recomendação, cliente e consultor. `adjustedExplanation` só é preenchido se a decisão for `adjusted`.
6. Como validar este passo: tentar criar revisão sem `consultantId` deve falhar.
7. Erros comuns ou cenário negativo: guardar só a nota sem autor impede rastrear a decisão.

### Passo 3 - Criar validator

1. Explicação simples do objetivo: validar ID, status e nota.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/recommendation-review.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: criar validação explícita antes do service.
4. Código completo, correto e integrado.

```js
// server/src/validators/recommendation-review.validator.js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

const REVIEW_STATUSES = new Set(["approved", "adjusted", "rejected"]);

export function validateRecommendationReviewParams(params) {
    if (!mongoose.isValidObjectId(params.recommendationId)) {
        throw new AppError(400, "ID de recomendação inválido");
    }

    return { recommendationId: params.recommendationId };
}

export function validateRecommendationReviewInput(body) {
    const status = String(body?.status ?? "");
    const note = String(body?.note ?? "").trim();
    const adjustedExplanation = body?.adjustedExplanation
        ? String(body.adjustedExplanation).trim()
        : null;

    if (!REVIEW_STATUSES.has(status)) {
        throw new AppError(400, "Estado de revisão inválido");
    }

    if (note.length < 5 || note.length > 500) {
        throw new AppError(400, "Nota deve ter entre 5 e 500 caracteres");
    }

    if (status === "adjusted" && (!adjustedExplanation || adjustedExplanation.length < 20)) {
        throw new AppError(400, "Ajuste exige explicação com pelo menos 20 caracteres");
    }

    return { status, note, adjustedExplanation };
}
```

5. Explicação do código: o validator impede IDs malformados, estados livres e ajuste sem explicação. Isto reduz erros antes da escrita em MongoDB.
6. Como validar este passo: enviar `status: "maybe"` deve devolver `400`.
7. Erros comuns ou cenário negativo: deixar `note` vazia transforma revisão em ação sem justificação.

### Passo 4 - Criar service

1. Explicação simples do objetivo: aplicar decisão e devolver DTO mínimo.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/recommendation-review.service.js`
    - REVER: `server/src/models/product-recommendation.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: procurar recomendação, criar revisão e atualizar status.
4. Código completo, correto e integrado.

```js
// server/src/services/recommendation-review.service.js
import { AppError } from "../middlewares/error.middleware.js";
import { ProductRecommendation } from "../models/product-recommendation.model.js";
import { RecommendationReview } from "../models/recommendation-review.model.js";

function toProductDto(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
    };
}

function toReviewDto(review) {
    return {
        id: review._id.toString(),
        status: review.status,
        note: review.note,
        adjustedExplanation: review.adjustedExplanation,
        reviewedAt: review.reviewedAt,
    };
}

function toRecommendationReviewDto(recommendation) {
    return {
        id: recommendation._id.toString(),
        clientUserId: recommendation.userId.toString(),
        product: toProductDto(recommendation.productId),
        score: recommendation.score,
        reasonCodes: recommendation.reasonCodes,
        explanation: recommendation.explanation,
        status: recommendation.status,
    };
}

export async function reviewRecommendation(consultantId, recommendationId, input) {
    const recommendation = await ProductRecommendation.findById(recommendationId)
        .select("_id userId productId score reasonCodes explanation status")
        .populate("productId", "name brandName imageUrl priceCents stock");

    if (!recommendation) {
        throw new AppError(404, "Recomendação não encontrada");
    }

    const review = await RecommendationReview.create({
        recommendationId: recommendation._id,
        clientUserId: recommendation.userId,
        consultantId,
        status: input.status,
        note: input.note,
        adjustedExplanation: input.adjustedExplanation,
    });

    if (input.status === "rejected") {
        recommendation.status = "dismissed";
    }

    if (input.status === "approved") {
        recommendation.status = "active";
    }

    if (input.status === "adjusted") {
        recommendation.status = "active";
        recommendation.explanation = input.adjustedExplanation;
    }

    await recommendation.save();

    return {
        review: toReviewDto(review),
        recommendation: toRecommendationReviewDto(recommendation),
    };
}
```

5. Explicação do código: o service não popula análise, relatório ou fotografia. Atualiza apenas status e explicação da recomendação. O retorno permite ao consultor ver o resultado da decisão sem aceder a dados sensíveis desnecessários.
6. Como validar este passo: revisão `adjusted` deve mudar `explanation`; revisão `rejected` deve mudar status para `dismissed`.
7. Erros comuns ou cenário negativo: popular `analysisId` ou `reportId` completo aumenta exposição sem necessidade para `RF22`.

### Passo 5 - Criar controller e route

1. Explicação simples do objetivo: proteger a revisão por sessão e role.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/recommendation-review.controller.js`
    - CRIAR: `server/src/routes/recommendation-review.routes.js`
    - REVER: `server/src/middlewares/auth.middleware.js`
    - REVER: `server/src/middlewares/role.middleware.js`
    - LOCALIZAÇÃO: ficheiros completos.
3. O que fazer: criar controller com validator e route com `requireRole`.
4. Código completo, correto e integrado.

```js
// server/src/controllers/recommendation-review.controller.js
import { reviewRecommendation } from "../services/recommendation-review.service.js";
import {
    validateRecommendationReviewInput,
    validateRecommendationReviewParams,
} from "../validators/recommendation-review.validator.js";

export async function reviewRecommendationController(req, res, next) {
    try {
        const params = validateRecommendationReviewParams(req.params);
        const input = validateRecommendationReviewInput(req.body);
        const result = await reviewRecommendation(req.user.id, params.recommendationId, input);

        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}
```

```js
// server/src/routes/recommendation-review.routes.js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { reviewRecommendationController } from "../controllers/recommendation-review.controller.js";

export const recommendationReviewRoutes = Router();

recommendationReviewRoutes.post(
    "/consultant/recommendations/:recommendationId/reviews",
    requireAuth,
    requireRole(ROLES.CONSULTOR, ROLES.ADMIN),
    reviewRecommendationController,
);
```

5. Explicação do código: `requireAuth` confirma sessão; `requireRole` confirma role e vem do middleware de roles criado na `MF0`. A ordem evita que uma pessoa sem sessão chegue à verificação de role.
6. Como validar este passo: confirmar que os imports apontam para `auth.middleware.js` e `role.middleware.js`; cliente autenticado deve receber `403`.
7. Erros comuns ou cenário negativo: omitir `requireAuth` pode deixar `req.user` vazio.

### Passo 6 - Registar route e página

1. Explicação simples do objetivo: ligar backend e frontend.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - CRIAR: `client/src/pages/ConsultantRecommendationReviewPage.jsx`
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: route backend, página completa e rota frontend.
3. O que fazer: registar route e criar formulário de revisão.
4. Código completo, correto e integrado.

```js
// server/src/app.js
import { recommendationReviewRoutes } from "./routes/recommendation-review.routes.js";

app.use("/api", recommendationReviewRoutes);
```

```jsx
// client/src/pages/ConsultantRecommendationReviewPage.jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ConsultantRecommendationReviewPage() {
    const [recommendationId, setRecommendationId] = useState("");
    const [statusValue, setStatusValue] = useState("approved");
    const [note, setNote] = useState("");
    const [adjustedExplanation, setAdjustedExplanation] = useState("");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    async function submitReview(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest(
                `/api/consultant/recommendations/${recommendationId}/reviews`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        status: statusValue,
                        note,
                        adjustedExplanation: statusValue === "adjusted" ? adjustedExplanation : null,
                    }),
                },
            );

            setResult(data);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Rever recomendação</h1>
            <form onSubmit={submitReview}>
                <label>
                    ID da recomendação
                    <input value={recommendationId} onChange={(event) => setRecommendationId(event.target.value)} />
                </label>
                <label>
                    Decisão
                    <select value={statusValue} onChange={(event) => setStatusValue(event.target.value)}>
                        <option value="approved">Aprovar</option>
                        <option value="adjusted">Ajustar</option>
                        <option value="rejected">Rejeitar</option>
                    </select>
                </label>
                <label>
                    Nota
                    <textarea value={note} onChange={(event) => setNote(event.target.value)} />
                </label>
                {statusValue === "adjusted" && (
                    <label>
                        Explicação ajustada
                        <textarea
                            value={adjustedExplanation}
                            onChange={(event) => setAdjustedExplanation(event.target.value)}
                        />
                    </label>
                )}
                <button type="submit" disabled={status === "loading"}>Guardar revisão</button>
            </form>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && result && <p>Revisão registada: {result.review.status}</p>}
        </section>
    );
}
```

```jsx
// client/src/App.jsx
import { ConsultantRecommendationReviewPage } from "./pages/ConsultantRecommendationReviewPage.jsx";

// Dentro da configuração de rotas:
{
    path: "/consultant/recommendation-reviews",
    element: <ConsultantRecommendationReviewPage />,
}
```

5. Explicação do código: o formulário envia decisão e nota. A API valida role; a página não substitui a autorização do backend.
6. Como validar este passo: entrar como cliente e tentar submeter deve devolver erro de acesso.
7. Erros comuns ou cenário negativo: esconder a página no frontend sem proteger a API não é autorização.

### Passo 7 - Validar negativos obrigatórios

1. Explicação simples do objetivo: confirmar role e validação.
2. Ficheiros envolvidos.
    - REVER: `server/src/routes/recommendation-review.routes.js`
    - REVER: `server/src/validators/recommendation-review.validator.js`
    - LOCALIZAÇÃO: `requireRole` e enum de status.
3. O que fazer: executar pedidos de cliente, status inválido e ID inexistente.
4. Código completo, correto e integrado.

```bash
curl -i -X POST http://localhost:3001/api/consultant/recommendations/ID/reviews -H "Cookie: orelle_session=COOKIE_CLIENTE" -H "Content-Type: application/json" -d '{"status":"approved","note":"Revisão válida"}'
curl -i -X POST http://localhost:3001/api/consultant/recommendations/ID/reviews -H "Cookie: orelle_session=COOKIE_CONSULTOR" -H "Content-Type: application/json" -d '{"status":"talvez","note":"Revisão válida"}'
curl -i -X POST http://localhost:3001/api/consultant/recommendations/64f000000000000000000001/reviews -H "Cookie: orelle_session=COOKIE_CONSULTOR" -H "Content-Type: application/json" -d '{"status":"approved","note":"Revisão válida"}'
```

5. Explicação do código: os pedidos cobrem autorização, validação e inexistência.
6. Como validar este passo: esperar `403`, `400` e `404`.
7. Erros comuns ou cenário negativo: testar apenas consultor com sucesso não prova que cliente está bloqueado.

## Expected results
- Cliente autenticado recebe `403`.
- Consultor com body válido recebe `201`.
- Status inválido recebe `400`.
- Recomendação inexistente recebe `404`.
- DTO não inclui análise completa, relatório completo, fotografia ou consentimento.

## Critérios de aceite
- Entrega funcional de `RF22` concluída.
- Cenários negativos concluídos: mínimo `1`.
- Evidência de testes por camada conforme prioridade `P2`.
- Roles canónicas usadas: `consultor` e `administrador`.
- Revisão guarda `consultantId` e `clientUserId`.
- DTO mínimo aplicado.

## Validação final
- Testar route com cliente, consultor e administrador.
- Confirmar que revisão `adjusted` altera explicação.
- Confirmar que revisão `rejected` muda status para `dismissed`.
- Executar `git diff --check` antes do PR.

## Evidence para PR/defesa
- `proof_tecnico`: resposta `201` com revisão registada.
- `proof_negativos`: evidência de `403`, `400` e `404`.
- `proof_negocio`: demonstração de ajuste manual sobre recomendação.

## Handoff
`BK-MF2-07` volta ao fluxo do cliente e deve manter a mesma política de minimização de dados faciais.

## Changelog
- `2026-06-08`: guia reescrito com role canónica, validator, modelo, service, controller, route, UI e negativos.
- `2026-06-08`: corrigido import de `requireRole` para reutilizar `role.middleware.js` da `MF0`.
