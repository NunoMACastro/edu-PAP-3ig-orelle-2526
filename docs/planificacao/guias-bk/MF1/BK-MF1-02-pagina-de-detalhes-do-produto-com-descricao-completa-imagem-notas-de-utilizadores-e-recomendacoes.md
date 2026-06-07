# BK-MF1-02 - Página de detalhes do produto com descrição completa, imagem, notas de utilizadores e recomendações

## Header
- `doc_id`: `GUIA-BK-MF1-02`
- `bk_id`: `BK-MF1-02`
- `macro`: `MF1`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `DONE`
- `esforco`: `M`
- `dependencias`: `BK-MF0-07, BK-MF1-01`
- `rf_rnf`: `RF10`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-03`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-02-pagina-de-detalhes-do-produto-com-descricao-completa-imagem-notas-de-utilizadores-e-recomendacoes.md`
- `last_updated`: `2026-05-31`

## Objetivo
Neste BK vais implementar a página de detalhe de produto com descrição completa, imagem, ingredientes, preço, stock, resumo de notas e zona preparada para recomendações de catálogo.

## Importância
O detalhe do produto é o ponto onde o cliente confirma se um produto faz sentido antes de o avaliar, comparar com semelhantes ou adicionar ao carrinho em fases futuras.

## Scope-in
- Criar endpoint `GET /api/catalog/products/:productId`.
- Devolver apenas dados públicos do produto.
- Preparar campos `reviewSummary` e `relatedProducts` para os BKs seguintes.
- Criar página React com estados `loading`, `error`, `empty` e `success`.

## Scope-out
- Não criar formulário de avaliação; isso fica para `BK-MF1-03`.
- Não criar algoritmo de produtos semelhantes; isso fica para `BK-MF1-04`.
- Não criar checkout.
- Não devolver dados administrativos como `createdBy`.

## Pré-requisitos
- `BK-MF0-07`: modelo `Product`.
- `BK-MF1-01`: prefixo público `/api/catalog`.

## Glossário
- Detalhe de produto: ecrã com informação completa de um produto.
- Resumo de notas: média e contagem de avaliações, começando a zero até `BK-MF1-03` criar reviews.
- Produtos relacionados: lista de produtos semelhantes ou complementares, preenchida por `BK-MF1-04`.

## Conceitos teóricos
O detalhe de produto não é checkout. O backend só lê dados públicos e devolve uma resposta adequada ao cliente. O preço continua a ser devolvido em cêntimos para evitar erros de arredondamento.

`reviewSummary` e `relatedProducts` aparecem neste BK como espaços de contrato, não como dados inventados. Enquanto `BK-MF1-03` e `BK-MF1-04` ainda não existem, a resposta pode devolver média `0`, total `0` e lista vazia. O guia deve deixar claro que isso é temporário e honesto: a página já sabe onde mostrar notas e relacionados, mas não finge avaliações nem recomendações.

O controller não decide regras de negócio; chama o service. O service válida existência do produto, monta uma resposta pública e deixa os estados de erro bem definidos. O frontend usa o endpoint real e deve tratar `400` para ID inválido, `404` para produto inexistente e `200` para produto encontrado.

## Arquitetura do BK
- `GET /api/catalog/products/:productId`
- `validateProductIdParam`
- `getCatalogProductDetails`
- `ProductDetailsPage`

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/validators/product-id.validator.js`
- EDITAR: `server/src/services/product.service.js`
- CRIAR: `server/src/controllers/product-details.controller.js`
- EDITAR: `server/src/routes/catalog.routes.js`
- CRIAR: `client/src/pages/ProductDetailsPage.jsx`
- EDITAR: `client/src/App.jsx`

## Bloco pedagógico

### Objetivo
Criar uma página de detalhe que mostra informação pública do produto e prepara avaliações e relacionados.

### Pré-requisitos
- Ter produtos criados em `BK-MF0-07`.
- Ter listagem pública criada em `BK-MF1-01`.
- Saber validar `ObjectId` antes de consultar MongoDB.

### Erros comuns
- Devolver produto inexistente como `200`.
- Mostrar dados internos do produto.
- Inventar avaliações antes de `BK-MF1-03`.

### Check de compreensao
- Porque é que o ID do produto deve ser validado antes da query?
- Que campos do produto são publicos?
- Que deve acontecer quando ainda não existem avaliações?

## Bloco operacional

### Entrada
- `productId` no URL.
- Model `Product` da `MF0`.
- Resumo vazio de avaliações até `BK-MF1-03`.

### Passos
Executar cenários negativos obrigatórios (mínimo 3).

Segue os passos lineares abaixo e fecha o BK apenas depois de validar ID inválido, produto inexistente e produto existente.

## Passos lineares

### Passo 1 - Confirmar domínio do detalhe

1. Explicação simples do objetivo: separar detalhe de produto de avaliação, produtos relacionados e checkout.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - LOCALIZAÇÃO: linhas de `RF10`, `RF11`, `RF12`, `RF26`.
3. O que fazer: confirma que `RF10` mostra informação e não cria compra.
4. Código completo, correto e integrado: sem código novo neste passo.
5. Explicação do código: a separação evita criar carrinho ou recomendação IA antes da fase correta.
6. Como validar este passo: escreve em uma frase o que pertence a este BK: ler produto e mostrar detalhe.
7. Erros comuns ou cenário negativo: adicionar produto ao carrinho nesta página antes de `RF26` quebra a sequência.

### Passo 2 - Validar o ID do produto

1. Explicação simples do objetivo: impedir consultas com IDs inválidos.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/product-id.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o validator.
4. Código completo, correto e integrado:

```js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";

export function validateProductIdParam(params) {
    const productId = String(params.productId ?? "").trim();

    if (!mongoose.isValidObjectId(productId)) {
        throw new AppError(400, "Produto invalido");
    }

    return productId;
}
```

5. Explicação do código: um ObjectId inválido nunca deve chegar ao service. Isto evita erros técnicos expostos ao cliente.
6. Como validar este passo: chama o endpoint com `/api/catalog/products/abc` e espera `400`.
7. Erros comuns ou cenário negativo: deixar o Mongoose lançar o erro bruto pode expor detalhes internos.

### Passo 3 - Acrescentar detalhe no service

1. Explicação simples do objetivo: obter um produto público pelo ID.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/services/product.service.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: acrescentar no fim do ficheiro.
3. O que fazer: adiciona a função abaixo.
4. Código completo, correto e integrado:

```js
import { AppError } from "../middlewares/error.middleware.js";

function toProductDetailResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        description: product.description,
        ingredientNames: product.ingredientNames,
        skinTypes: product.skinTypes,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        stock: product.stock,
        categoryIds: product.categoryIds.map((id) => id.toString()),
        reviewSummary: {
            averageRating: 0,
            totalReviews: 0,
        },
        relatedProducts: [],
    };
}

export async function getCatalogProductDetails(productId) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(404, "Produto não encontrado");
    }

    return toProductDetailResponse(product);
}
```

5. Explicação do código: `reviewSummary` e `relatedProducts` começam com valores vazios honestos. Os BKs seguintes atualizam esses dados com entidades reais.
6. Como validar este passo: pesquisa um ID existente e confirma que a resposta não inclui `createdBy`.
7. Erros comuns ou cenário negativo: devolver o documento Mongoose inteiro expõe campos administrativos.

### Passo 4 - Criar controller de detalhe

1. Explicação simples do objetivo: ligar validação, service e resposta HTTP.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/product-details.controller.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o controller.
4. Código completo, correto e integrado:

```js
import { getCatalogProductDetails } from "../services/product.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";

export async function getProductDetailsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const product = await getCatalogProductDetails(productId);

        return res.status(200).json({ product });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: o controller devolve `200` para produto encontrado, `400` para ID inválido e `404` para produto inexistente.
6. Como validar este passo: testa ID inválido e ID bem formado mas inexistente.
7. Erros comuns ou cenário negativo: responder `200` com `null` obriga o frontend a adivinhar o erro.

### Passo 5 - Editar a route do catálogo

1. Explicação simples do objetivo: acrescentar rota de detalhe ao ficheiro criado no BK anterior.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/routes/catalog.routes.js`
    - LOCALIZAÇÃO: imports e rotas.
3. O que fazer: adiciona o import e a rota.
4. Código completo, correto e integrado:

```js
import { getProductDetailsController } from "../controllers/product-details.controller.js";

catalogRoutes.get("/products/:productId", getProductDetailsController);
```

5. Explicação do código: a rota de detalhe usa o mesmo prefixo `/api/catalog` da pesquisa.
6. Como validar este passo: `GET /api/catalog/products/:productId` não deve devolver `404` de route.
7. Erros comuns ou cenário negativo: criar `/api/products/:id` separadamente gera contratos duplicados.

### Passo 6 - Criar página de detalhe

1. Explicação simples do objetivo: mostrar o produto e tratar todos os estados de UI.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/ProductDetailsPage.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria a página.
4. Código completo, correto e integrado:

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function ProductDetailsPage() {
    const [productId, setProductId] = useState("");
    const [product, setProduct] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");
        setProduct(null);

        try {
            const data = await apiRequest(`/catalog/products/${productId}`);
            setProduct(data.product);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Detalhe do produto</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A carregar..." : "Ver produto"}
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {status === "success" && product && (
                <article>
                    <img src={product.imageUrl} alt={product.name} />
                    <h2>{product.name}</h2>
                    <p>{product.brandName}</p>
                    <p>{product.description}</p>
                    <p>{(product.priceCents / 100).toFixed(2)} €</p>
                    <p>Stock: {product.stock}</p>
                    <p>
                        Nota média: {product.reviewSummary.averageRating} (
                        {product.reviewSummary.totalReviews} avaliações)
                    </p>
                    <h3>Ingredientes</h3>
                    <ul>
                        {product.ingredientNames.map((ingredient) => (
                            <li key={ingredient}>{ingredient}</li>
                        ))}
                    </ul>
                    <h3>Produtos relacionados</h3>
                    {product.relatedProducts.length === 0 ? (
                        <p>Sem produtos relacionados neste momento.</p>
                    ) : (
                        <ul>
                            {product.relatedProducts.map((item) => (
                                <li key={item.id}>{item.name}</li>
                            ))}
                        </ul>
                    )}
                </article>
            )}
        </section>
    );
}
```

5. Explicação do código: o formulário permite validar o BK sem router. A página mostra estado de erro e não tenta usar dados inexistentes.
6. Como validar este passo: usa um ID válido e depois `abc`.
7. Erros comuns ou cenário negativo: não tratar `404` deixa a interface sem feedback.

### Passo 7 - Registar a página no App

1. Explicação simples do objetivo: permitir validação visual do detalhe.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: imports e JSX principal.
3. O que fazer: acrescenta a página junto da pesquisa.
4. Código completo, correto e integrado:

```jsx
import { ProductDetailsPage } from "./pages/ProductDetailsPage.jsx";
import { ProductSearchPage } from "./pages/ProductSearchPage.jsx";

export function App() {
    return (
        <>
            <ProductSearchPage />
            <ProductDetailsPage />
        </>
    );
}
```

5. Explicação do código: a aplicação passa a permitir pesquisar e abrir detalhe por ID durante a validação.
6. Como validar este passo: abre o frontend e confirma que as duas secções aparecem.
7. Erros comuns ou cenário negativo: substituir a pesquisa pelo detalhe impede validar `BK-MF1-01`.

### Passo 8 - Validar negativos de detalhe

1. Explicação simples do objetivo: confirmar que o contrato do detalhe falha de forma controlada.
2. Ficheiros envolvidos.
    - REVER: `server/src/validators/product-id.validator.js`
    - REVER: `server/src/services/product.service.js`
    - REVER: `server/src/controllers/product-details.controller.js`
3. O que fazer: executa pedidos com ID inválido e com ID bem formado que não existe na base de dados.
4. Código completo, correto e integrado:

```bash
curl -i http://localhost:3001/api/catalog/products/abc
curl -i http://localhost:3001/api/catalog/products/64f000000000000000000000
```

5. Explicação do código: o primeiro pedido válida formato; o segundo válida ausência de produto sem expor detalhes internos.
6. Como validar este passo: confirma `400` no primeiro pedido e `404` no segundo.
7. Erros comuns ou cenário negativo: devolver `200` com `product: null` força o frontend a adivinhar o erro.

### Validação
- [ ] Negativos: mínimo `3` cenários.
- [ ] ID inválido devolve `400`.
- [ ] Produto inexistente devolve `404`.
- [ ] Produto existente devolve apenas campos publicos.
- [ ] UI mostra erro quando o pedido falha.

### Matriz mínima de testes por prioridade

| Camada | Evidência |
| --- | --- |
| Validator | `abc` rejeitado como ID inválido. |
| Service | Produto inexistente gera erro controlado. |
| Controller/route | Endpoint devolve `{ "product": ... }`. |
| UI | Página mostra detalhe e erro. |

Evidência de testes por camada:
- API: output de `curl` com ID válido, inválido e inexistente.
- Service: teste ou log controlado da query por ID.
- UI: screenshot do detalhe carregado.

## Snippet técnico aplicável

O código técnico aplicável deste BK está nos passos lineares acima. Para manter o guia seguro e executável, não existe código adicional solto nesta secção: o aluno deve copiar cada ficheiro completo no passo correspondente e validar a integração pela matriz mínima de testes.

## Expected results
- Produto existente: `200` com `{ "product": { ... } }`.
- ID inválido: `400`.
- Produto inexistente: `404`.
- A página mostra imagem, descrição, preço, stock, ingredientes, resumo de notas e lista vazia de relacionados.

## Critérios de aceite
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada documentada.
- O backend devolve apenas campos públicos.
- O frontend usa endpoint real.
- Estados `loading`, `error` e `success` existem.
- O BK prepara `BK-MF1-03` e `BK-MF1-04` sem inventar avaliações ou recomendações.

## Validação final
- `curl http://localhost:3001/api/catalog/products/ID_VALIDO`
- `curl http://localhost:3001/api/catalog/products/abc`
- Testar o formulário no browser.

## Evidence para PR/defesa
- Screenshot do detalhe de produto.
- Output do endpoint com produto existente.
- Output do endpoint com ID inválido.

## Handoff

### Handoff

O próximo BK deve criar a entidade `Review` e atualizar o detalhe para apresentar avaliações reais sem alterar o contrato público do produto.

## Changelog
- `2026-05-31`: guia revisto com detalhe público, validação de ID, página React e handoff para avaliações.
