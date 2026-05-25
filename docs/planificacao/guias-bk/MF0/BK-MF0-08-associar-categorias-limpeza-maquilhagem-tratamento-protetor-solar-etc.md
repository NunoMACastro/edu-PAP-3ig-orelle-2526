# BK-MF0-08 - Associar categorias (limpeza, maquilhagem, tratamento, protetor solar, etc.)

## Header
- `doc_id`: `GUIA-BK-MF0-08`
- `bk_id`: `BK-MF0-08`
- `macro`: `MF0`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-07`
- `rf_rnf`: `RF08`
- `fase_documental`: `Fase 1`
- `sprint`: `S01-S02`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-01`
- `guia_path`: `docs/planificacao/guias-bk/MF0/BK-MF0-08-associar-categorias-limpeza-maquilhagem-tratamento-protetor-solar-etc.md`
- `last_updated`: `2026-05-25`

#### BK-MF0-08 - Associar categorias (limpeza, maquilhagem, tratamento, protetor solar, etc.)

##### O que vamos fazer neste BK

Neste BK vamos criar categorias de catálogo e associá-las a produtos. As categorias iniciais vêm dos exemplos canónicos do `RF08`: limpeza, maquilhagem, tratamento e protetor solar.

O objetivo não é construir pesquisa ainda. O objetivo é deixar o catálogo categorizado para que `BK-MF1-01` consiga implementar filtragem por categoria, preço, tipo de pele e marca sem reestruturar produtos.

Esta fase foi detalhada sem mockup. A UI administrativa deve ser simples: listar categorias e permitir associá-las a um produto.

##### Porque e que isto e importante

- Organiza o catálogo e melhora navegação futura.
- Prepara filtros de `MF1` com contrato estável.
- Ensina relação entre entidades: `Product` e `Category`.
- Evita categorias escritas livremente e inconsistentes nos produtos.

##### O que entra (scope)

- Modelo `Category`.
- Seed controlada de categorias iniciais do `RF08`.
- Campo `categoryIds` no `Product`.
- Endpoint admin para criar/listar categorias.
- Endpoint admin para associar categorias a produto.
- UI simples de associação.
- Testes de categoria inexistente, produto inexistente e permissão.

##### O que nao entra (scope-out)

- Pesquisa/filtros públicos, que ficam para `BK-MF1-01`.
- Página de detalhe do produto, que fica para `BK-MF1-02`.
- Taxonomia avançada, subcategorias ou SEO.
- Regras comerciais por categoria.

##### Como saber que isto ficou bem

- Categorias iniciais existem sem duplicados.
- Produto pode ficar associado a uma ou mais categorias válidas.
- Associação com categoria inexistente é rejeitada.
- Cliente não consegue gerir categorias.
- `BK-MF1-01` consegue filtrar por `categoryIds`.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P0` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `M` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Bruna` (CANONICO)
- Apoio: `Izelicks` (CANONICO)
- Dependencias (BK IDs): `BK-MF0-07` (CANONICO)
- Pre-condicoes: modelo `Product` existe e produtos podem ser criados (DERIVADO)
- Ref. Plano: `RF08`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-CATALOG-CATEGORIES` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF08` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-08` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-08` (CANONICO)
- Descricao: categorias de catálogo associadas a produtos (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: `Product` existe com campos de `RF07`.
- Estado esperado depois do BK: produtos podem ter categorias validadas.
- Ficheiros a criar: `server/src/models/category.model.js`, `server/src/routes/admin-categories.routes.js`, `server/src/controllers/admin-categories.controller.js`, `server/src/services/category.service.js`, `server/src/validators/category.validator.js`, `server/src/scripts/seed-categories.js`, `client/src/pages/AdminCategoriesPage.jsx`.
- Ficheiros a editar: `server/src/models/product.model.js`, `server/src/app.js`, `client/src/App.jsx`.
- Dependencias de BK anteriores: `BK-MF0-07` fornece `Product`; `BK-MF0-05` fornece proteção admin se executado.
- Impacto na arquitetura: adiciona módulo `catalog/categories`.
- Impacto em frontend: adiciona ecrã admin simples para categorias.
- Impacto em backend: adiciona validação de relação produto-categoria.
- Impacto em dados: cria coleção `categories` e relação por `categoryIds`.
- Impacto em segurança: gestão de categorias é administrativa.
- Impacto em testes: P0 com 3 negativos e regressão de produto.
- Handoff para o próximo BK: `BK-MF1-01` deve reutilizar `categoryIds` para filtros.

#### Pre-leitura minima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF08` e `RF09`.
- Guia `BK-MF0-07`: modelo `Product`.
- `docs/planificacao/backlogs/MF-VIEWS.md`: handoff `MF0 -> MF1`.
- Mockup: não existe nesta execução.

#### Glossario (rapido) (DERIVADO):

- `Categoria`: grupo usado para organizar produtos.
- `Slug`: versão curta e estável do nome, como `protetor-solar`.
- `Seed`: script de dados iniciais.
- `Relação`: ligação entre duas entidades, aqui produto e categoria.
- `Referência`: guardar IDs de categorias dentro do produto.
- `Taxonomia`: organização hierárquica de categorias; fora deste BK.
- `Filtro`: consulta por critérios; fica para `MF1`.

#### Conceitos teoricos essenciais (DERIVADO):

Categorias devem ser entidades ou valores controlados, não texto livre em cada produto. Se cada produto guardar categoria como texto, surgem variações como `protetor solar`, `Protector Solar`, `solar`, e os filtros ficam pouco fiáveis.

Um `slug` ajuda a ter identificadores estáveis e legíveis. O nome visível pode ser `Protetor solar`; o slug pode ser `protetor-solar`. A app pode usar o slug em URLs ou filtros futuros.

Associar categorias não é ainda pesquisar. Este BK prepara dados; `BK-MF1-01` usa esses dados para construir a experiência de pesquisa e filtragem.

#### Guia de execucao (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): confirmar categorias iniciais canónicas**
   - Descricao detalhada do objetivo: usar exemplos do `RF08` como seed inicial.
   - Justificacao: evita inventar taxonomia completa sem fonte.
   - Como fazer (0.1): listar `limpeza`, `maquilhagem`, `tratamento`, `protetor-solar`.
   - Como fazer (0.2): marcar outras categorias como futuras e dependentes de confirmação.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/scripts/seed-categories.js`.
   - Snippet de referencia: `const INITIAL_CATEGORIES = ['limpeza', 'maquilhagem', 'tratamento', 'protetor-solar'];`.
   - O que verificar: não há subcategorias inventadas.

1. **Objetivo (~25 min): criar modelo Category**
   - Descricao detalhada do objetivo: persistir categorias com nome e slug únicos.
   - Justificacao: filtros futuros precisam de valores estáveis.
   - Como fazer (1.1): criar `name`, `slug`, `isActive`.
   - Como fazer (1.2): aplicar índice único em `slug`.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/models/category.model.js`.
   - Snippet de referencia: `slug: { type: String, required: true, unique: true, index: true }`.
   - O que verificar: seed repetido não duplica categorias.

2. **Objetivo (~30 min): ligar Product a Category**
   - Descricao detalhada do objetivo: acrescentar `categoryIds` ao produto.
   - Justificacao: produto pode pertencer a mais do que uma categoria.
   - Como fazer (2.1): adicionar array de ObjectIds no schema `Product`.
   - Como fazer (2.2): não tornar obrigatório se existirem produtos antigos sem categoria.
   - Ficheiro a rever: `server/src/models/product.model.js`.
   - Ficheiro alvo: `server/src/models/product.model.js`.
   - Snippet de referencia: `categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }]`.
   - O que verificar: produto de `BK-MF0-07` continua válido.

3. **Objetivo (~30 min): criar services de categoria**
   - Descricao detalhada do objetivo: listar/criar categorias e validar associações.
   - Justificacao: regra de existência da categoria fica fora do controller.
   - Como fazer (3.1): criar `listCategories` e `createCategory`.
   - Como fazer (3.2): criar `assignCategoriesToProduct(productId, categoryIds)`.
   - Ficheiro a rever: `server/src/models/category.model.js`.
   - Ficheiro alvo: `server/src/services/category.service.js`.
   - Snippet de referencia: `const found = await Category.countDocuments({ _id: { $in: categoryIds } });`.
   - O que verificar: todos os IDs enviados existem.

4. **Objetivo (~30 min): criar rotas admin**
   - Descricao detalhada do objetivo: expor gestão mínima de categorias.
   - Justificacao: categorias alteram catálogo e devem ser protegidas.
   - Como fazer (4.1): criar `GET /api/admin/categories` e `POST /api/admin/categories`.
   - Como fazer (4.2): criar `PATCH /api/admin/products/:id/categories`.
   - Ficheiro a rever: `server/src/routes/admin-products.routes.js`.
   - Ficheiro alvo: `server/src/routes/admin-categories.routes.js`.
   - Snippet de referencia: `router.patch('/products/:id/categories', requireAuth, requireRole(ROLES.ADMIN), assignCategoriesController);`.
   - O que verificar: cliente recebe `403`.

5. **Objetivo (~30 min): criar seed de categorias**
   - Descricao detalhada do objetivo: garantir dados base para testar filtros futuros.
   - Justificacao: sem categorias iniciais, `MF1` não consegue pesquisar por categoria.
   - Como fazer (5.1): criar script idempotente.
   - Como fazer (5.2): não apagar categorias existentes.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/scripts/seed-categories.js`.
   - Snippet de referencia: `await Category.updateOne({ slug }, { $setOnInsert: data }, { upsert: true });`.
   - O que verificar: correr seed duas vezes mantém 4 categorias iniciais, não 8.

6. **Objetivo (~35 min): criar UI admin de categorias**
   - Descricao detalhada do objetivo: listar categorias e associar a produto.
   - Justificacao: demonstra visualmente a organização do catálogo.
   - Como fazer (6.1): criar ecrã simples com lista de categorias.
   - Como fazer (6.2): em produto, usar checkboxes ou select múltiplo.
   - Ficheiro a rever: `client/src/pages/AdminProductCreatePage.jsx`.
   - Ficheiro alvo: `client/src/pages/AdminCategoriesPage.jsx`.
   - Snippet de referencia: `await apiClient.patch(\`/admin/products/${productId}/categories\`, { categoryIds });`.
   - O que verificar: UI mostra erro quando categoria inválida é rejeitada.

7. **Objetivo (~45 min): validar handoff para MF1**
   - Descricao detalhada do objetivo: provar que produto categorizado está pronto para filtros.
   - Justificacao: este é o último BK da `MF0` e entrega contrato para `BK-MF1-01`.
   - Como fazer (7.1): criar produto e associar categoria.
   - Como fazer (7.2): Executar cenarios negativos obrigatorios (minimo 3) e registar resultados.
   - Ficheiro a rever: `docs/planificacao/backlogs/MF-VIEWS.md`.
   - Ficheiro alvo: `server/tests/categories.test.js`.
   - Snippet de referencia: `expect(product.categoryIds).toHaveLength(1);`.
   - O que verificar: evidence inclui produto categorizado e contrato para pesquisa.

#### Checklist de validacao (DERIVADO):

- Smoke: seed cria categorias iniciais e admin associa categoria válida a produto.
- Negativo 1: passo 3; categoria inexistente; resultado esperado `400`; risco que cobre: referência inválida.
- Negativo 2: passo 4; cliente tenta associar categoria; resultado esperado `403`; risco que cobre: alteração indevida do catálogo.
- Negativo 3: passo 4; produto inexistente; resultado esperado `404`; risco que cobre: associação a recurso inexistente.
- Tecnico: `Category.slug` único e `Product.categoryIds` validado.
- Regressao das fases anteriores: criação de produto de `BK-MF0-07` continua válida.
- UI/mockup: sem mockup; ecrã admin baseline.
- Seguranca: endpoints de escrita protegidos por Admin.

#### Criterios de aceite:

- Outputs: modelo `Category`, seed inicial, endpoints admin e associação produto-categoria.
- Verificacoes: categoria válida associada `200`; inválida `400`; produto inexistente `404`; cliente `403`.
- Qualidade: categorias iniciais derivam do `RF08`; sem taxonomia inventada.
- Continuidade: `BK-MF1-01` consegue filtrar por `categoryIds`.
- Evidencia: prova de seed idempotente, produto categorizado e negativos.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher apos validacao`
- `neg`: `A preencher apos testes negativos`
- `files`: `server/src/models/category.model.js`, `server/src/models/product.model.js`, `server/src/routes/admin-categories.routes.js`, `client/src/pages/AdminCategoriesPage.jsx`
- `commands`: `npm run seed:categories`, `curl -X PATCH /api/admin/products/:id/categories`, `npm test`
- `screenshots`: categorias listadas e produto associado
- `notes`: último BK da MF0 entrega contrato para `BK-MF1-01`

#### TODOs

- TODO: confirmar se haverá subcategorias no pós-PAP.
- TODO: confirmar nomes visíveis finais das categorias com equipa/orientador.
- TODO (BLOCKER): sem produtos de `BK-MF0-07`, associação não pode ser validada.
- FOLLOW-UP: `BK-MF1-01` deve usar `categoryIds`, `priceCents`, `tipoDePeleIndicado` e `brandName` para filtros.

## Contexto do BK
- Entrega alvo: implementar `Associar categorias (limpeza, maquilhagem, tratamento, protetor solar, etc.)` com rastreabilidade direta ao requisito `RF08`.
- Foco tecnico da macro: `Fundamentos e governance`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Criar categorias controladas e associá-las aos produtos para preparar filtros da fase seguinte.

### Pre-requisitos
- Rever `RF08`.
- Ter `Product` de `BK-MF0-07`.
- Ter autorização admin para operações de catálogo.

### Erros comuns
- Guardar categoria como texto livre no produto.
- Criar taxonomia completa sem fonte nos RF.
- Implementar pesquisa de `MF1` neste BK.

### Check de compreensao
- [ ] Sei explicar por que usar `Category` com `slug`.
- [ ] Sei provar que seed é idempotente.
- [ ] Sei explicar o handoff para `BK-MF1-01`.

### Tempo estimado
- `M`: 2 a 4 horas.

## Bloco operacional
### Entrada
- BK: `BK-MF0-08`
- Requisito: `RF08`
- Dependencias: `BK-MF0-07`
- Artefactos: `RF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos
1. Confirmar categorias iniciais do RF.
2. Criar modelo `Category`.
3. Ligar `Product` a `Category`.
4. Criar services de categoria.
5. Criar rotas admin protegidas.
6. Criar seed idempotente.
7. Criar UI admin simples.
8. Executar cenarios negativos obrigatorios (minimo 3) e registar evidência.

### Cenarios negativos recomendados
- Categoria inexistente deve devolver `400`.
- Cliente em rota admin deve devolver `403`.
- Produto inexistente deve devolver `404`.

### Validacao
- [ ] Smoke: produto fica associado a categoria válida.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: seed não duplica categorias.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF1-01`
- A próxima fase deve reutilizar `categoryIds` para pesquisa e filtragem.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF0-08';
const REQ_ID = 'RF08';
const MIN_NEGATIVOS = 3;

export function validarEvidenceBkMf008({ smokeOk, negativos, categories, product }) {
  if (!smokeOk) throw new Error(`${BK_ID}/${REQ_ID}: smoke de categorias falhou`);
  if (negativos < 3) throw new Error(`${BK_ID}/${REQ_ID}: negativos insuficientes`);
  if (!Array.isArray(categories) || categories.length < 4) {
    throw new Error(`${BK_ID}/${REQ_ID}: categorias iniciais insuficientes`);
  }
  if (!Array.isArray(product?.categoryIds)) throw new Error(`${BK_ID}/${REQ_ID}: produto sem categoryIds`);
  return { bkId: BK_ID, reqId: REQ_ID, minNegativos: MIN_NEGATIVOS, status: 'OK' };
}
```

## Criterios de aceite
- Entrega funcional especifica de `Associar categorias (limpeza, maquilhagem, tratamento, protetor solar, etc.)` validada contra `RF08`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher apos validacao`
- `proof_negativos`: `A preencher apos testes negativos`
- `proof_negocio`: categorias desbloqueiam pesquisa, filtros e navegação de catálogo.

## Proximo BK recomendado
`BK-MF1-01`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para categorias e handoff da MF0 para MF1.
