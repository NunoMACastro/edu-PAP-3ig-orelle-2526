# BK-MF1-03 - Permitir ao cliente avaliar produtos (1-5 estrelas) e deixar comentários

## Header
- `doc_id`: `GUIA-BK-MF1-03`
- `bk_id`: `BK-MF1-03`
- `macro`: `MF1`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF0-02, BK-MF0-05, BK-MF1-02`
- `rf_rnf`: `RF11`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF1-04`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-03-permitir-ao-cliente-avaliar-produtos-1-5-estrelas-e-deixar-comentarios.md`
- `last_updated`: `2026-05-31`

## Objetivo
Neste BK vais permitir que um cliente autenticado avalie um produto com 1 a 5 estrelas e deixe um comentário.

## Importância
As avaliações ajudam outros clientes a decidir e preparam a moderação administrativa de `BK-MF4-02`. Como comentários são conteúdo de utilizador, o backend deve validar texto, ownership e autenticação.

## Scope-in
- Criar entidade `Review`.
- Criar endpoint `POST /api/catalog/products/:productId/reviews`.
- Criar endpoint `GET /api/catalog/products/:productId/reviews`.
- Impedir que o frontend envie `userId`.
- Integrar formulário React com sessão por cookie.

## Scope-out
- Não criar moderação administrativa.
- Não permitir editar ou apagar avaliações neste BK.
- Não usar avaliação como treino real de IA.

## Pré-requisitos
- `BK-MF1-02`: detalhe de produto.
- `BK-MF0-02`: `requireAuth`.
- `BK-MF0-05`: role `cliente`.

## Glossário
- Review: avaliação feita por um cliente a um produto.
- Rating: nota inteira entre 1 e 5.
- Ownership: regra que liga a avaliação ao utilizador autenticado.

## Conceitos teóricos
Avaliação de produto não é moderação. O cliente cria conteúdo; a administração só modera em fase posterior. Neste BK, o backend deve aceitar apenas nota válida e comentário controlado.

O `userId` vem de `req.user.id`, criado por `requireAuth`. Isto impede que o frontend crie avaliações em nome de outro cliente. O produto vem do URL e é validado no backend.

A unicidade é uma regra de negócio persistida no modelo: um utilizador só pode ter uma avaliação por produto. A validação de input apanha estrelas e comentário inválidos; o índice único apanha a repetição real no MongoDB. O service deve transformar esse erro técnico num `409` compreensível para a API.

Na resposta pública, a avaliação deve expor a nota, comentário, estado e data. Identificadores internos do utilizador não são necessários para mostrar reviews no produto e devem ser omitidos até existir um contrato explícito de perfil público.

## Arquitetura do BK
- `Review` guarda `productId`, `userId`, `rating` e `comment`.
- `validateReviewInput` válida estrelas e texto.
- `createProductReview` confirma produto existente e grava ownership.
- `ProductReviewForm` envia avaliação com `credentials: "include"` através do `apiClient`.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/models/review.model.js`
- CRIAR: `server/src/validators/review.validator.js`
- CRIAR: `server/src/services/review.service.js`
- CRIAR: `server/src/controllers/review.controller.js`
- EDITAR: `server/src/routes/catalog.routes.js`
- CRIAR: `client/src/pages/ProductReviewPage.jsx`
- EDITAR: `client/src/App.jsx`

## Bloco pedagógico

### Objetivo
Permitir que um cliente autenticado avalie um produto com estrelas e comentario controlado.

### Pré-requisitos
- Ter login por sessão em `BK-MF0-02`.
- Ter roles em `BK-MF0-05`.
- Ter detalhe de produto em `BK-MF1-02`.

### Erros comuns
- Aceitar `userId` vindo do frontend.
- Permitir estrelas fora do intervalo `1..5`.
- Expor dados internos do utilizador junto da avaliação.

### Check de compreensao
- Porque é que o dono da avaliação vem de `req.user.id`?
- Que erro deve surgir se o produto não existir?
- Que dados de utilizador podem aparecer publicamente?

## Bloco operacional

### Entrada
- Sessão autenticada de cliente.
- `productId` no URL.
- Body com `rating` e `comment`.

### Passos
Executar cenários negativos obrigatórios (mínimo 2).

Segue os passos lineares abaixo e valida autenticação, intervalo de estrelas e produto inexistente.

## Passos lineares

### Passo 1 - Confirmar regras da avaliação

1. Explicação simples do objetivo: garantir que vais implementar apenas `RF11`.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/guias-bk/MF4/BK-MF4-02-moderacao-de-comentarios-e-avaliacoes.md`
    - LOCALIZAÇÃO: linhas de `RF11` e `RF34`.
3. O que fazer: confirma que a moderação fica fora deste BK.
4. Código completo, correto e integrado: sem código novo neste passo.
5. Explicação do código: este passo evita misturar criação de avaliação com administração.
6. Como validar este passo: identifica que `RF11` pertence ao cliente e `RF34` pertence ao admin.
7. Erros comuns ou cenário negativo: criar endpoint admin neste BK aumenta escopo sem contrato.

### Passo 2 - Criar modelo Review

1. Explicação simples do objetivo: guardar a avaliação com ligações ao produto e ao utilizador.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/models/review.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o model abaixo.
4. Código completo, correto e integrado:

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

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
        },
    },
    { timestamps: true },
);

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export const Review = model("Review", reviewSchema);
```

5. Explicação do código: o índice único impede várias avaliações do mesmo utilizador para o mesmo produto.
6. Como validar este passo: tenta criar duas reviews com o mesmo `productId` e `userId`; a segunda deve falhar.
7. Erros comuns ou cenário negativo: guardar email do utilizador na review expõe dados desnecessários.

### Passo 3 - Criar validator de avaliação

1. Explicação simples do objetivo: validar rating e comentário.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/review.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o validator.
4. Código completo, correto e integrado:

```js
import { AppError } from "../middlewares/error.middleware.js";

export function validateReviewInput(body) {
    const rating = Number(body.rating);
    const comment = String(body.comment ?? "").trim().replace(/\s+/g, " ");
    const errors = {};

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.rating = "A avaliação deve ser um inteiro entre 1 e 5";
    }

    if (comment.length < 3 || comment.length > 600) {
        errors.comment = "O comentário deve ter entre 3 e 600 caracteres";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Avaliação inválida", errors);
    }

    return { rating, comment };
}
```

5. Explicação do código: o backend não confia em validação HTML; confirma a regra de negócio antes de gravar.
6. Como validar este passo: envia `rating: 6` e confirma `400`.
7. Erros comuns ou cenário negativo: aceitar texto sem limite permite abuso e piora UX.

### Passo 4 - Criar service de reviews

1. Explicação simples do objetivo: gravar e listar reviews com regras de ownership.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/review.service.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o service.
4. Código completo, correto e integrado:

```js
import { AppError } from "../middlewares/error.middleware.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";

function toReviewResponse(review) {
    return {
        id: review._id.toString(),
        productId: review.productId.toString(),
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        createdAt: review.createdAt,
    };
}

function isDuplicateReviewError(err) {
    return err?.code === 11000;
}

export async function createProductReview(productId, userId, input) {
    const exists = await Product.exists({ _id: productId });

    if (!exists) {
        throw new AppError(404, "Produto não encontrado");
    }

    try {
        const review = await Review.create({
            productId,
            userId,
            rating: input.rating,
            comment: input.comment,
        });

        return toReviewResponse(review);
    } catch (err) {
        if (isDuplicateReviewError(err)) {
            throw new AppError(409, "Já avaliaste este produto");
        }

        throw err;
    }
}

export async function listProductReviews(productId) {
    const reviews = await Review.find({ productId, status: "published" })
        .sort({ createdAt: -1 })
        .limit(30);

    return reviews.map(toReviewResponse);
}
```

5. Explicação do código: o service válida produto existente, usa `userId` recebido da sessão e omite esse identificador na resposta pública. O índice único pode lançar erro técnico `11000`; o service converte esse caso em `409`, que comunica regra de negócio sem expor detalhe interno do MongoDB.
6. Como validar este passo: cria review sem produto existente e confirma `404`; depois cria duas reviews para o mesmo produto/utilizador e confirma `409` na segunda.
7. Erros comuns ou cenário negativo: aceitar `userId` no body permitiria falsificar autoria; devolver o erro bruto do índice exporia implementação interna.

### Passo 5 - Criar controller de reviews

1. Explicação simples do objetivo: receber pedidos HTTP e devolver status corretos.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/review.controller.js`
    - REVER: `server/src/validators/product-id.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o controller.
4. Código completo, correto e integrado:

```js
import {
    createProductReview,
    listProductReviews,
} from "../services/review.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";
import { validateReviewInput } from "../validators/review.validator.js";

export async function createProductReviewController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const input = validateReviewInput(req.body);
        const review = await createProductReview(productId, req.user.id, input);

        return res.status(201).json({ review });
    } catch (err) {
        return next(err);
    }
}

export async function listProductReviewsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const reviews = await listProductReviews(productId);

        return res.status(200).json({ reviews });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: criação exige `req.user.id`; listagem é pública porque comentários publicados são visíveis na página de produto.
6. Como validar este passo: sem login, `POST` deve falhar por `requireAuth` na route.
7. Erros comuns ou cenário negativo: devolver `passwordHash` do autor nunca deve acontecer; este controller nem consulta esse campo.

### Passo 6 - Editar route do catálogo

1. Explicação simples do objetivo: expor criação e leitura de avaliações.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/routes/catalog.routes.js`
    - REVER: `server/src/middlewares/auth.middleware.js`
    - LOCALIZAÇÃO: imports e rotas.
3. O que fazer: acrescenta o código abaixo.
4. Código completo, correto e integrado:

```js
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    createProductReviewController,
    listProductReviewsController,
} from "../controllers/review.controller.js";

catalogRoutes.get(
    "/products/:productId/reviews",
    listProductReviewsController,
);

catalogRoutes.post(
    "/products/:productId/reviews",
    requireAuth,
    createProductReviewController,
);
```

5. Explicação do código: qualquer pessoa pode ler avaliações publicadas, mas só uma sessão autenticada pode criar.
6. Como validar este passo: faz `POST` sem cookie e espera `401`.
7. Erros comuns ou cenário negativo: proteger só no frontend deixa a API vulnerável.

### Passo 7 - Criar página de avaliação

1. Explicação simples do objetivo: permitir ao cliente submeter avaliação a partir do frontend.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/ProductReviewPage.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria a página.
4. Código completo, correto e integrado:

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ProductReviewPage() {
    const [productId, setProductId] = useState("");
    const [rating, setRating] = useState("5");
    const [comment, setComment] = useState("");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest(
                `/catalog/products/${productId}/reviews`,
                {
                    method: "POST",
                    body: JSON.stringify({ rating: Number(rating), comment }),
                },
            );
            setStatus("success");
            setMessage(`Avaliação registada com ID ${data.review.id}`);
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    return (
        <section>
            <h1>Avaliar produto</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <label>
                    Estrelas
                    <select
                        value={rating}
                        onChange={(event) => setRating(event.target.value)}
                    >
                        {[1, 2, 3, 4, 5].map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Comentário
                    <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A enviar..." : "Enviar avaliação"}
                </button>
            </form>
            {message && <p role={status === "error" ? "alert" : undefined}>{message}</p>}
        </section>
    );
}
```

5. Explicação do código: o frontend envia apenas `rating` e `comment`; o autor vem da sessão no backend. O `apiClient` envia cookies com `credentials: "include"` e não usa tokens no `localStorage`.
6. Como validar este passo: tenta submeter sem login e confirma mensagem de erro.
7. Erros comuns ou cenário negativo: enviar `userId` no body é desnecessário e inseguro.

### Passo 8 - Registar a página no App

1. Explicação simples do objetivo: mostrar a página de avaliação na aplicação.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: imports e JSX principal.
3. O que fazer: adiciona a página.
4. Código completo, correto e integrado:

```jsx
import { ProductReviewPage } from "./pages/ProductReviewPage.jsx";

export function App() {
    return (
        <>
            <ProductSearchPage />
            <ProductDetailsPage />
            <ProductReviewPage />
        </>
    );
}
```

5. Explicação do código: a página fica disponível para validação manual do fluxo.
6. Como validar este passo: abre o frontend e confirma que o formulário de avaliação aparece.
7. Erros comuns ou cenário negativo: esquecer o import gera erro de compilação no frontend.

### Validação
- [ ] Negativos: mínimo `2` cenários.
- [ ] Sem sessão devolve `401`.
- [ ] Rating fora de `1..5` devolve `400`.
- [ ] Produto inexistente devolve erro controlado.
- [ ] UI mostra erro e sucesso sem expor dados internos.

### Matriz mínima de testes por prioridade

| Camada | Evidência |
| --- | --- |
| Model | Indice único por `productId` e `userId`. |
| Validator | Rating e comentario validados. |
| Service | Ownership vem da sessão. |
| UI | Formulário submete avaliação real. |

Evidência de testes por camada:
- API: output de criação e listagem de reviews.
- Service: teste de rating inválido.
- UI: screenshot do formulário com sucesso.

## Expected results
- `POST /api/catalog/products/:productId/reviews` com sessão válida responde `201`.
- Sem sessão responde `401`.
- Rating fora de `1..5` responde `400`.
- Produto inexistente responde `404`.
- Segunda avaliação do mesmo utilizador para o mesmo produto responde `409`.

## Critérios de aceite
- Cenários negativos concluídos: mínimo `2`.
- Evidência de testes por camada documentada.
- O backend usa `req.user.id`.
- Não há `userId` no payload do frontend.
- Só uma avaliação por utilizador e produto.
- Reviews publicadas podem ser listadas por produto.

## Validação final
- Criar review autenticada.
- Repetir a mesma review e observar erro de duplicação controlado pelo índice.
- Listar reviews do produto.

## Evidence para PR/defesa
- Output de criação com `201`.
- Output de criação sem login com `401`.
- Screenshot do formulário.

## Handoff

### Handoff

`BK-MF1-04` pode usar avaliações como contexto comercial futuro, mas a primeira versão de produtos semelhantes deve continuar baseada em catálogo para não depender de compras reais.

## Changelog
- `2026-05-31`: guia revisto com modelo Review, validação, ownership por sessão, rotas e formulário React.
