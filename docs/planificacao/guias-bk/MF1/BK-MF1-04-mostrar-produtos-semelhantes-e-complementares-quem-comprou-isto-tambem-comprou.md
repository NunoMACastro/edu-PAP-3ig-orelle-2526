# BK-MF1-04 - Mostrar produtos semelhantes e complementares ("quem comprou isto também comprou...")

## Header
- `doc_id`: `GUIA-BK-MF1-04`
- `bk_id`: `BK-MF1-04`
- `macro`: `MF1`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF0-07, BK-MF0-08, BK-MF1-02`
- `rf_rnf`: `RF12`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF1-05`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-04-mostrar-produtos-semelhantes-e-complementares-quem-comprou-isto-tambem-comprou.md`
- `last_updated`: `2026-05-31`

## Objetivo
Neste BK vais mostrar produtos semelhantes e complementares a partir de dados de catálogo: categoria, tipo de pele, marca e stock.

## Importância
Produtos relacionados melhoram descoberta comercial sem transformar o fluxo em diagnóstico facial ou checkout. O cliente continua a decidir livremente o que quer ver ou comprar.

## Scope-in
- Criar endpoint `GET /api/catalog/products/:productId/related`.
- Calcular relacionados por catálogo, sem histórico de compra real.
- Remover o produto atual da lista.
- Devolver lista vazia de forma clara se não houver resultados.
- Criar componente React para apresentar relacionados.

## Scope-out
- Não criar carrinho.
- Não usar dados biométricos.
- Não adicionar produtos automaticamente ao carrinho.
- Não prometer collaborative filtering avançado.

## Pré-requisitos
- `BK-MF0-07`: `Product`.
- `BK-MF0-08`: `categoryIds`.
- `BK-MF1-02`: rota de detalhe.

## Glossário
- Produto semelhante: produto da mesma categoria ou indicado para o mesmo tipo de pele.
- Produto complementar: produto de outra categoria que pode acompanhar o produto atual, sem promessa clínica.
- Regra determinística: regra clara baseada em campos do catálogo.

## Conceitos teóricos
`RF12` fala de produtos semelhantes e complementares. Nesta fase, a Orélle ainda não tem histórico de compras suficiente para "quem comprou isto também comprou" real. Por isso, a decisão técnica mínima é usar dados do catálogo. Esta decisão é `DERIVADO` e mantém a funcionalidade executável sem inventar comportamento.

O backend deve devolver sugestões, não ações. Nenhum produto é comprado, reservado ou adicionado ao carrinho neste BK. A lista também pode ser vazia: se o produto base não tiver categorias, tipo de pele, marca ou se não existirem produtos com stock, o resultado correto é `200` com lista vazia.

Isto não é collaborative filtering. A regra é determinística e explicável: procura produtos com categoria, tipo de pele ou marca em comum, exclui o produto atual e filtra stock disponível. Recomendações personalizadas com perfil, compras ou IA ficam para requisitos futuros.

## Arquitetura do BK
- `GET /api/catalog/products/:productId/related`
- `listRelatedCatalogProducts`
- `RelatedProductsPage`

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/services/related-products.service.js`
- CRIAR: `server/src/controllers/related-products.controller.js`
- EDITAR: `server/src/routes/catalog.routes.js`
- CRIAR: `client/src/pages/RelatedProductsPage.jsx`
- EDITAR: `client/src/App.jsx`

## Bloco pedagógico

### Objetivo
Mostrar produtos semelhantes e complementares usando regras simples de catálogo.

### Pré-requisitos
- Ter produtos e categorias da `MF0`.
- Ter detalhe de produto em `BK-MF1-02`.
- Saber remover o produto atual da lista relacionada.

### Erros comuns
- Implementar checkout neste BK.
- Usar histórico de compras que ainda não existe.
- Prometer recomendação personalizada por IA nesta fase.

### Check de compreensao
- Que dados de produto são suficientes para encontrar semelhantes?
- Porque é que a lista pode ficar vazia?
- Que requisito futuro trata recomendação personalizada?

## Bloco operacional

### Entrada
- `productId` no URL.
- Produto base com categorias, tipo de pele, marca e stock.
- Lista de produtos publicos relacionados.

### Passos
Executar cenários negativos obrigatórios (mínimo 2).

Segue os passos lineares abaixo e valida produto inexistente, lista vazia e exclusão do produto atual.

## Passos lineares

### Passo 1 - Confirmar decisão de catálogo

1. Explicação simples do objetivo: evitar confundir produtos relacionados com recomendação personalizada por IA.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
    - LOCALIZAÇÃO: `RF12`, `RF18` e linha de `BK-MF1-04`.
3. O que fazer: regista que este BK usa catálogo e não análise facial.
4. Código completo, correto e integrado: sem código novo neste passo.
5. Explicação do código: a app fica funcional com regras de catálogo e mantém a recomendação personalizada para `RF18`. Esta separação evita misturar descoberta comercial simples com perfil facial, compras ou IA antes de esses dados existirem.
6. Como validar este passo: confirma que nenhum ficheiro deste BK importa modelos de análise facial.
7. Erros comuns ou cenário negativo: usar fotografias do utilizador para produtos semelhantes viola o domínio deste BK.

### Passo 2 - Criar service de produtos relacionados

1. Explicação simples do objetivo: encontrar produtos compatíveis sem duplicar o produto atual.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/services/related-products.service.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o service abaixo.
4. Código completo, correto e integrado:

```js
import { AppError } from "../middlewares/error.middleware.js";
import { Product } from "../models/product.model.js";

function toRelatedProductResponse(product) {
    return {
        id: product._id.toString(),
        name: product.name,
        brandName: product.brandName,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
        skinTypes: product.skinTypes,
        categoryIds: product.categoryIds.map((id) => id.toString()),
    };
}

export async function listRelatedCatalogProducts(productId) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new AppError(404, "Produto não encontrado");
    }

    const criteria = [
        product.categoryIds.length > 0
            ? { categoryIds: { $in: product.categoryIds } }
            : null,
        product.skinTypes.length > 0
            ? { skinTypes: { $in: product.skinTypes } }
            : null,
        product.brandName
            ? { brandName: product.brandName }
            : null,
    ].filter(Boolean);

    if (criteria.length === 0) {
        return [];
    }

    const related = await Product.find({
        _id: { $ne: product._id },
        stock: { $gt: 0 },
        $or: criteria,
    })
        .sort({ stock: -1, createdAt: -1 })
        .limit(8);

    return related.map(toRelatedProductResponse);
}
```

5. Explicação do código: o service cria critérios apenas com dados existentes no produto base. Se não houver categoria, tipo de pele nem marca, devolve lista vazia sem erro. Quando há critérios, a query procura semelhanças, exclui o produto atual e evita stock zero.
6. Como validar este passo: cria dois produtos na mesma categoria e confirma que um aparece nos relacionados do outro; cria um produto sem critérios úteis e confirma `200` com lista vazia.
7. Erros comuns ou cenário negativo: não remover o produto atual faz a página recomendar o que o cliente já está a ver; não tratar critérios vazios pode gerar consultas confusas.

### Passo 3 - Criar controller

1. Explicação simples do objetivo: expor relacionados por HTTP.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/related-products.controller.js`
    - REVER: `server/src/validators/product-id.validator.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o controller.
4. Código completo, correto e integrado:

```js
import { listRelatedCatalogProducts } from "../services/related-products.service.js";
import { validateProductIdParam } from "../validators/product-id.validator.js";

export async function listRelatedProductsController(req, res, next) {
    try {
        const productId = validateProductIdParam(req.params);
        const products = await listRelatedCatalogProducts(productId);

        return res.status(200).json({ products });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: o controller reutiliza o validator de ID criado no detalhe para manter respostas consistentes.
6. Como validar este passo: chama com ID inválido e espera `400`.
7. Erros comuns ou cenário negativo: validar ID num ficheiro novo duplicado aumenta drift.

### Passo 4 - Editar route do catálogo

1. Explicação simples do objetivo: adicionar endpoint de relacionados ao módulo público de catálogo.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/routes/catalog.routes.js`
    - LOCALIZAÇÃO: imports e rotas.
3. O que fazer: acrescenta o código.
4. Código completo, correto e integrado:

```js
import { listRelatedProductsController } from "../controllers/related-products.controller.js";

catalogRoutes.get(
    "/products/:productId/related",
    listRelatedProductsController,
);
```

5. Explicação do código: a rota é pública e de leitura, tal como pesquisa e detalhe. Ela não altera carrinho, encomenda nem preferências; apenas devolve uma lista calculada pelo service com base no produto do URL.
6. Como validar este passo: `GET /api/catalog/products/:productId/related` deve responder `200`.
7. Erros comuns ou cenário negativo: criar `/api/recommendations` aqui mistura este BK com `RF18`.

### Passo 5 - Criar página de relacionados

1. Explicação simples do objetivo: mostrar a lista ao cliente.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/RelatedProductsPage.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria a página.
4. Código completo, correto e integrado:

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function RelatedProductsPage() {
    const [productId, setProductId] = useState("");
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");
        setProducts([]);

        try {
            const data = await apiRequest(
                `/catalog/products/${productId}/related`,
            );
            setProducts(data.products);
            setStatus(data.products.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Produtos semelhantes e complementares</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    ID do produto
                    <input
                        value={productId}
                        onChange={(event) => setProductId(event.target.value)}
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A procurar..." : "Ver relacionados"}
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Sem produtos relacionados.</p>}
            {status === "success" && (
                <ul>
                    {products.map((product) => (
                        <li key={product.id}>
                            <img src={product.imageUrl} alt={product.name} />
                            <strong>{product.name}</strong>
                            <span>{(product.priceCents / 100).toFixed(2)} €</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
```

5. Explicação do código: a página trata lista vazia como resultado normal e não como erro.
6. Como validar este passo: usa um produto sem pares compatíveis e confirma a mensagem vazia.
7. Erros comuns ou cenário negativo: mostrar compra automática seria incorreto; este BK só mostra sugestões.

### Passo 6 - Registar página no App

1. Explicação simples do objetivo: permitir validação visual.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: imports e JSX principal.
3. O que fazer: acrescenta a página.
4. Código completo, correto e integrado:

```jsx
import { RelatedProductsPage } from "./pages/RelatedProductsPage.jsx";

export function App() {
    return (
        <>
            <ProductSearchPage />
            <ProductDetailsPage />
            <ProductReviewPage />
            <RelatedProductsPage />
        </>
    );
}
```

5. Explicação do código: a página fica visível para testar o endpoint sem depender de routing avançado.
6. Como validar este passo: abre o frontend e confirma que a secção aparece.
7. Erros comuns ou cenário negativo: substituir as páginas anteriores impede validar a sequência da `MF1`.

### Validação
- [ ] Negativos: mínimo `2` cenários.
- [ ] Produto inexistente devolve `404`.
- [ ] Produto sem relacionados devolve lista vazia.
- [ ] Produto atual não aparece nos resultados.
- [ ] UI mostra estado vazio.

### Matriz mínima de testes por prioridade

| Camada | Evidência |
| --- | --- |
| Service | Query exclui produto atual e limita resultados. |
| Controller/route | Endpoint devolve `{ "relatedProducts": [...] }`. |
| UI | Página mostra lista ou vazio. |

Evidência de testes por camada:
- API: output com relacionados e sem relacionados.
- Service: teste de exclusão do produto atual.
- UI: screenshot da lista relacionada.

## Snippet técnico aplicável

O código técnico aplicável deste BK está nos passos lineares acima. Para manter o guia seguro e executável, não existe código adicional solto nesta secção: o aluno deve copiar cada ficheiro completo no passo correspondente e validar a integração pela matriz mínima de testes.

## Expected results
- Produto existente com relacionados: `200` e lista com produtos.
- Produto existente sem relacionados: `200` e lista vazia.
- Produto base sem categoria, tipo de pele e marca: `200` e lista vazia.
- Produto inexistente: `404`.
- ID inválido: `400`.

## Critérios de aceite
- Cenários negativos concluídos: mínimo `2`.
- Evidência de testes por camada documentada.
- O produto atual nunca aparece na lista.
- Só produtos com `stock > 0` entram na lista.
- A regra usa categoria, tipo de pele ou marca.
- A UI distingue erro de lista vazia.

## Validação final
- Criar dois produtos na mesma categoria.
- Chamar `GET /api/catalog/products/:productId/related`.
- Testar ID inválido.

## Evidence para PR/defesa
- Output do endpoint com relacionados.
- Output do endpoint com lista vazia.
- Screenshot da UI.

## Handoff

### Handoff

`BK-MF1-05` inicia o domínio de fotografias faciais. Este BK não cria dependência com biometria nem recomendação personalizada.

## Changelog
- `2026-05-31`: guia revisto com produtos relacionados por catálogo, endpoint público, service e UI.
