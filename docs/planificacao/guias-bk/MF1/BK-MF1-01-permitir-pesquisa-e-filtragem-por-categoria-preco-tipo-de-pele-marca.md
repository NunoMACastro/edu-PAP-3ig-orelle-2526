# BK-MF1-01 - Permitir pesquisa e filtragem por categoria, preço, tipo de pele, marca

## Header
- `doc_id`: `GUIA-BK-MF1-01`
- `bk_id`: `BK-MF1-01`
- `macro`: `MF1`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-02, BK-MF0-07, BK-MF0-08`
- `rf_rnf`: `RF09`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-02`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-01-permitir-pesquisa-e-filtragem-por-categoria-preco-tipo-de-pele-marca.md`
- `last_updated`: `2026-05-31`

## Objetivo
Neste BK vais implementar a pesquisa e filtragem pública de produtos da Orélle por texto, categoria, intervalo de preço, tipo de pele e marca.

## Importância
Este BK transforma o catálogo administrativo criado em `BK-MF0-07` e organizado por categorias em `BK-MF0-08` numa experiência útil para o cliente. Sem pesquisa e filtros, o catálogo existe na base de dados, mas o utilizador não consegue encontrar rapidamente produtos compatíveis com o seu perfil cosmético.

## Scope-in
- Criar endpoint público `GET /api/catalog/products`.
- Validar query params no backend.
- Reutilizar `Product`, `Category` e `Product.categoryIds` criados na `MF0`.
- Criar página React de pesquisa com estados `loading`, `error`, `empty` e `success`.
- Usar `credentials: "include"` no cliente API, preservando o contrato de sessão sem tokens no `localStorage`.

## Scope-out
- Não criar carrinho, checkout ou pagamento.
- Não criar recomendação personalizada por IA.
- Não alterar produtos; escrita de produtos continua reservada a administradores.
- Não inventar ranking clínico ou diagnóstico facial.

## Pré-requisitos
- `BK-MF0-07`: `server/src/models/product.model.js` e `server/src/services/product.service.js`.
- `BK-MF0-08`: `server/src/models/category.model.js` e `Product.categoryIds`.
- `BK-MF0-02`: `client/src/services/apiClient.js` com `credentials: "include"`.

## Glossário
- Produto: item do catálogo com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock.
- Categoria: agrupamento como limpeza, maquilhagem, tratamento ou protetor solar.
- Filtro: critério usado para reduzir a lista de produtos.
- Query param: valor enviado no URL, por exemplo `?brandName=Orelle`.

## Conceitos teóricos
Pesquisa de produtos não é recomendação personalizada. Em `RF09`, o cliente escolhe filtros e o backend devolve produtos que correspondem a esses filtros. A app não deve usar IA para decidir o que é melhor para a pele do cliente nesta fase.

Query params chegam sempre como texto. Por isso, o validator converte preços para número, normaliza texto de pesquisa e rejeita valores fora do contrato antes de qualquer query em MongoDB. Esta validação protege a API contra filtros ambíguos, preços negativos e IDs mal formados.

No backend, a route recebe o pedido HTTP, o validator transforma query params em dados seguros, o service consulta MongoDB/Mongoose e o controller devolve apenas campos públicos. Esta separação ajuda a perceber onde cada responsabilidade vive: validação na entrada, regra de pesquisa no service e resposta HTTP no controller.

A resposta pública deve ser minimizada. Campos administrativos como `createdBy`, timestamps internos que não sejam necessários ou detalhes de gestão não devem sair para o cliente. A pesquisa é pública, mas isso não significa que todo o documento `Product` seja público.

No frontend, o componente React guarda filtros em `useState`, faz o pedido com `useEffect` ou por submissão de formulário e mostra estados claros. Mesmo sendo uma rota pública, o `apiClient` continua a usar cookies com `credentials: "include"` para manter o padrão da aplicação.

## Arquitetura do BK
- `GET /api/catalog/products` lista produtos públicos.
- `validateCatalogQuery` válida filtros.
- `listCatalogProducts` consulta `Product` com filtros seguros.
- `ProductSearchPage` mostra o catálogo pesquisável.

## Ficheiros a criar/editar/rever
- CRIAR: `server/src/validators/catalog-query.validator.js`
- EDITAR: `server/src/services/product.service.js`
- CRIAR: `server/src/controllers/catalog.controller.js`
- CRIAR: `server/src/routes/catalog.routes.js`
- EDITAR: `server/src/app.js`
- EDITAR: `client/src/services/apiClient.js`
- CRIAR: `client/src/pages/ProductSearchPage.jsx`
- EDITAR: `client/src/App.jsx`

## Bloco pedagógico

### Objetivo
Construir uma pesquisa pública de catálogo com filtros controlados pelo backend.

### Pré-requisitos
- Saber ler query params no Express.
- Conhecer `Product`, `Category` e `Product.categoryIds` criados na `MF0`.
- Saber usar `useState` para controlar filtros no React.

### Erros comuns
- Filtrar produtos apenas no frontend.
- Aceitar preço negativo ou categoria inexistente sem validar.
- Devolver campos internos do produto na resposta pública.

### Check de compreensao
- Que ficheiro válida os filtros antes do service?
- Porque é que pesquisa de catálogo não é recomendação personalizada?
- Que estados a página deve mostrar quando não há resultados?

## Bloco operacional

### Entrada
- Models de produto e categoria da `MF0`.
- Pedido `GET /api/catalog/products` com filtros opcionais.
- Página React de pesquisa.

### Passos
Executar cenários negativos obrigatórios (mínimo 3).

Segue os passos lineares abaixo e valida backend, frontend e casos vazios antes de fechar o BK.

## Passos lineares

### Passo 1 - Confirmar contrato do catálogo

1. Explicação simples do objetivo: garantir que vais reutilizar o produto e as categorias já definidos, sem criar outro modelo para o mesmo conceito.
2. Ficheiros envolvidos.
    - REVER: `docs/RF.md`
    - REVER: `docs/planificacao/guias-bk/MF0/BK-MF0-07-registar-produtos-com-nome-descricao-ingredientes-tipo-de-pele-indicado-imagem-preco-e-stock.md`
    - REVER: `docs/planificacao/guias-bk/MF0/BK-MF0-08-associar-categorias-limpeza-maquilhagem-tratamento-protetor-solar-etc.md`
    - LOCALIZAÇÃO: secções de `RF07`, `RF08` e `RF09`.
3. O que fazer: confirma que o produto tem `name`, `brandName`, `description`, `ingredientNames`, `skinTypes`, `imageUrl`, `priceCents`, `stock` e `categoryIds`.
4. Código completo, correto e integrado: sem código novo neste passo.
5. Explicação do código: este passo evita duplicar schemas e mantém a sequência técnica da `MF0`.
6. Como validar este passo: confirma que `Product.categoryIds` existe no guia `BK-MF0-07` e que `BK-MF0-08` associa categorias a produtos.
7. Erros comuns ou cenário negativo: criar um novo modelo `CatalogProduct` quebraria o handoff para detalhe, avaliações e carrinho.

### Passo 2 - Criar validator dos filtros

1. Explicação simples do objetivo: transformar query params em filtros seguros antes de chegar ao service.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/validators/catalog-query.validator.js`
    - REVER: `server/src/models/profile.model.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o ficheiro abaixo.
4. Código completo, correto e integrado:

```js
import mongoose from "mongoose";
import { AppError } from "../middlewares/error.middleware.js";
import { SKIN_TYPES } from "../models/profile.model.js";

function normalizeText(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeOptionalText(value) {
    const text = normalizeText(value);
    return text.length > 0 ? text : undefined;
}

function parseOptionalPrice(value, fieldName, errors) {
    if (value === undefined || value === null || value === "") return undefined;

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue < 0) {
        errors[fieldName] = `${fieldName} deve ser inteiro em cêntimos`;
        return undefined;
    }

    return numberValue;
}

export function validateCatalogQuery(query) {
    const errors = {};
    const input = {
        search: normalizeOptionalText(query.search),
        brandName: normalizeOptionalText(query.brandName),
        skinType: normalizeOptionalText(query.skinType),
        categoryId: normalizeOptionalText(query.categoryId),
        minPriceCents: parseOptionalPrice(
            query.minPriceCents,
            "minPriceCents",
            errors,
        ),
        maxPriceCents: parseOptionalPrice(
            query.maxPriceCents,
            "maxPriceCents",
            errors,
        ),
    };

    if (input.skinType && !SKIN_TYPES.includes(input.skinType)) {
        errors.skinType = `Tipo de pele deve ser: ${SKIN_TYPES.join(", ")}`;
    }

    if (input.categoryId && !mongoose.isValidObjectId(input.categoryId)) {
        errors.categoryId = "Categoria invalida";
    }

    if (
        input.minPriceCents !== undefined &&
        input.maxPriceCents !== undefined &&
        input.minPriceCents > input.maxPriceCents
    ) {
        errors.price = "Preço mínimo não pode ser maior do que preço máximo";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Filtros de catálogo inválidos", errors);
    }

    return input;
}
```

5. Explicação do código: o validator impede tipos de pele fora do contrato, preços negativos e IDs de categoria inválidos. Assim o MongoDB recebe filtros previsíveis.
6. Como validar este passo: chama `validateCatalogQuery({ minPriceCents: "-1" })` e confirma que lança `AppError(400)`.
7. Erros comuns ou cenário negativo: converter preço no frontend apenas não chega; o backend deve proteger a API.

### Passo 3 - Editar o service de produtos

1. Explicação simples do objetivo: acrescentar leitura pública ao service já criado em `BK-MF0-07`.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/services/product.service.js`
    - REVER: `server/src/models/product.model.js`
    - LOCALIZAÇÃO: acrescentar as funções abaixo sem remover `createProduct`.
3. O que fazer: mantém a função `createProduct` existente e acrescenta este bloco no fim do ficheiro.
4. Código completo, correto e integrado:

```js
function toPublicProductResponse(product) {
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
    };
}

export async function listCatalogProducts(filters) {
    const query = {};

    if (filters.search) {
        query.$text = { $search: filters.search };
    }

    if (filters.brandName) {
        query.brandName = new RegExp(filters.brandName, "i");
    }

    if (filters.skinType) {
        query.skinTypes = filters.skinType;
    }

    if (filters.categoryId) {
        query.categoryIds = filters.categoryId;
    }

    if (
        filters.minPriceCents !== undefined ||
        filters.maxPriceCents !== undefined
    ) {
        query.priceCents = {};
        if (filters.minPriceCents !== undefined) {
            query.priceCents.$gte = filters.minPriceCents;
        }
        if (filters.maxPriceCents !== undefined) {
            query.priceCents.$lte = filters.maxPriceCents;
        }
    }

    const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .limit(40);

    return products.map(toPublicProductResponse);
}
```

5. Explicação do código: o service devolve apenas campos públicos. `createdBy` fica fora da resposta para não expor dados administrativos.
6. Como validar este passo: cria dois produtos com marcas diferentes e confirma que `brandName` filtra sem alterar a base de dados.
7. Erros comuns ou cenário negativo: usar `Product.find(req.query)` deixaria o cliente pesquisar por campos internos.

### Passo 4 - Criar controller público do catálogo

1. Explicação simples do objetivo: ligar o validator ao service e devolver HTTP status correto.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/controllers/catalog.controller.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria o controller abaixo.
4. Código completo, correto e integrado:

```js
import { listCatalogProducts } from "../services/product.service.js";
import { validateCatalogQuery } from "../validators/catalog-query.validator.js";

export async function listCatalogProductsController(req, res, next) {
    try {
        const filters = validateCatalogQuery(req.query);
        const products = await listCatalogProducts(filters);

        return res.status(200).json({ products });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: o controller só coordena validação, service e resposta. Se a query for inválida, o validator lança erro antes da consulta; se for válida, o service aplica filtros em MongoDB e o controller devolve sempre o contrato `{ products }`.
6. Como validar este passo: faz `GET /api/catalog/products?minPriceCents=-5` e confirma resposta `400`.
7. Erros comuns ou cenário negativo: colocar lógica de MongoDB no controller dificulta testes e duplicação futura.

### Passo 5 - Criar route do catálogo

1. Explicação simples do objetivo: expor o endpoint público de pesquisa.
2. Ficheiros envolvidos.
    - CRIAR: `server/src/routes/catalog.routes.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria a route abaixo.
4. Código completo, correto e integrado:

```js
import { Router } from "express";
import { listCatalogProductsController } from "../controllers/catalog.controller.js";

export const catalogRoutes = Router();

catalogRoutes.get("/products", listCatalogProductsController);
```

5. Explicação do código: a rota fica pública porque pesquisar catálogo não exige login. Escrita de produtos continua em `/api/admin/products`.
6. Como validar este passo: confirma que a rota final será `GET /api/catalog/products`.
7. Erros comuns ou cenário negativo: proteger pesquisa pública com role de admin impediria o cliente de ver o catálogo.

### Passo 6 - Registar a route na app

1. Explicação simples do objetivo: ligar a route ao Express.
2. Ficheiros envolvidos.
    - EDITAR: `server/src/app.js`
    - LOCALIZAÇÃO: zona dos imports e zona onde as routes são registadas.
3. O que fazer: adiciona o import e o `app.use` abaixo.
4. Código completo, correto e integrado:

```js
import { catalogRoutes } from "./routes/catalog.routes.js";

app.use("/api/catalog", catalogRoutes);
```

5. Explicação do código: o prefixo `/api/catalog` separa leitura pública de administração.
6. Como validar este passo: arranca a API e confirma que `GET /api/catalog/products` não devolve `404`.
7. Erros comuns ou cenário negativo: registar a route depois do middleware de erro faz com que nunca seja chamada.

### Passo 7 - Criar página React de pesquisa

1. Explicação simples do objetivo: permitir que o cliente use filtros sem escrever URLs manualmente.
2. Ficheiros envolvidos.
    - CRIAR: `client/src/pages/ProductSearchPage.jsx`
    - REVER: `client/src/services/apiClient.js`
    - LOCALIZAÇÃO: ficheiro completo.
3. O que fazer: cria a página abaixo.
4. Código completo, correto e integrado:

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const SKIN_TYPES = ["oleosa", "seca", "mista", "sensivel", "normal"];

export function ProductSearchPage() {
    const [filters, setFilters] = useState({
        search: "",
        brandName: "",
        skinType: "",
        minPriceCents: "",
        maxPriceCents: "",
    });
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    function updateFilter(field, value) {
        setFilters((current) => ({ ...current, [field]: value }));
    }

    function buildQueryString() {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (String(value).trim()) params.set(key, value);
        });
        return params.toString();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setError("");

        try {
            const query = buildQueryString();
            const data = await apiRequest(`/catalog/products?${query}`);
            setProducts(data.products);
            setStatus(data.products.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setProducts([]);
            setStatus("error");
        }
    }

    return (
        <main>
            <h1>Catálogo Orélle</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Pesquisa
                    <input
                        value={filters.search}
                        onChange={(event) =>
                            updateFilter("search", event.target.value)
                        }
                    />
                </label>
                <label>
                    Marca
                    <input
                        value={filters.brandName}
                        onChange={(event) =>
                            updateFilter("brandName", event.target.value)
                        }
                    />
                </label>
                <label>
                    Tipo de pele
                    <select
                        value={filters.skinType}
                        onChange={(event) =>
                            updateFilter("skinType", event.target.value)
                        }
                    >
                        <option value="">Todos</option>
                        {SKIN_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Preço mínimo em cêntimos
                    <input
                        type="number"
                        min="0"
                        value={filters.minPriceCents}
                        onChange={(event) =>
                            updateFilter("minPriceCents", event.target.value)
                        }
                    />
                </label>
                <label>
                    Preço máximo em cêntimos
                    <input
                        type="number"
                        min="0"
                        value={filters.maxPriceCents}
                        onChange={(event) =>
                            updateFilter("maxPriceCents", event.target.value)
                        }
                    />
                </label>
                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A pesquisar..." : "Pesquisar"}
                </button>
            </form>

            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Não foram encontrados produtos.</p>}
            {status === "success" && (
                <ul>
                    {products.map((product) => (
                        <li key={product.id}>
                            <img src={product.imageUrl} alt={product.name} />
                            <h2>{product.name}</h2>
                            <p>{product.brandName}</p>
                            <p>{(product.priceCents / 100).toFixed(2)} €</p>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
```

5. Explicação do código: a página mantém filtros no estado local, chama o endpoint real e mostra mensagens diferentes para erro, vazio e sucesso.
6. Como validar este passo: pesquisa por uma marca existente e depois por uma marca inexistente.
7. Erros comuns ou cenário negativo: guardar token no browser é errado; o `apiClient` deve continuar a usar cookie HttpOnly com `credentials: "include"`.

### Passo 8 - Registar a página no frontend

1. Explicação simples do objetivo: tornar a página acessível no fluxo da aplicação.
2. Ficheiros envolvidos.
    - EDITAR: `client/src/App.jsx`
    - LOCALIZAÇÃO: imports e zona de navegação.
3. O que fazer: adiciona a página ao `App`.
4. Código completo, correto e integrado:

```jsx
import { ProductSearchPage } from "./pages/ProductSearchPage.jsx";

export function App() {
    return <ProductSearchPage />;
}
```

5. Explicação do código: esta versão mínima deixa o catálogo como ecrã principal para validação do BK.
6. Como validar este passo: abre o frontend e confirma que o formulário aparece sem erros no console.
7. Erros comuns ou cenário negativo: criar uma página sem a importar no `App` impede validação visual.

### Validação
- [ ] Negativos: mínimo `3` cenários.
- [ ] Query com preço negativo devolve `400`.
- [ ] Categoria inexistente devolve `400`.
- [ ] Pesquisa sem resultados devolve lista vazia sem erro.
- [ ] Frontend mostra estados `loading`, `error`, `empty` e `success`.

### Matriz mínima de testes por prioridade

| Camada | Evidência |
| --- | --- |
| Validator | Query params inválidos rejeitados. |
| Service | Filtros aplicados em MongoDB sem campos internos. |
| Controller/route | `GET /api/catalog/products` devolve contrato público. |
| UI | Página pesquisa e renderiza lista ou estado vazio. |

Evidência de testes por camada:
- API: output de `curl` com filtro válido e filtro inválido.
- Service: teste ou log controlado com filtros combinados.
- UI: screenshot da pesquisa com resultados e sem resultados.

## Expected results
- `GET /api/catalog/products` responde `200` com `{ "products": [...] }`.
- Filtros inválidos respondem `400`.
- A página mostra `loading`, `error`, `empty` e lista de produtos.

## Critérios de aceite
- Cenários negativos concluídos: mínimo `3`.
- Evidência de testes por camada documentada.
- Pesquisa por texto funciona.
- Filtros por marca, tipo de pele, categoria e preço funcionam no backend.
- Campos internos como `createdBy` não aparecem na resposta pública.
- O frontend chama endpoint real.

## Validação final
- `curl "http://localhost:3000/api/catalog/products?skinType=oleosa"`
- `curl "http://localhost:3000/api/catalog/products?minPriceCents=-1"` deve devolver `400`.
- Abrir a página e testar filtros com e sem resultados.

## Evidence para PR/defesa
- Screenshot da página com resultados.
- Output do `curl` com filtro válido.
- Output do `curl` com filtro inválido.

## Handoff

### Handoff

O próximo BK deve reutilizar `GET /api/catalog/products/:productId` ou criar uma rota de detalhe compatível com o mesmo modelo `Product`. Não deve criar outro schema de produto.

## Changelog
- `2026-05-31`: guia revisto com endpoint, validator, service, controller, route, página React e validação pedagógica.
