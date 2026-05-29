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
- `last_updated`: `2026-05-29`

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

O codigo aplicavel deste BK-MF0-08 ja nao fica como anexo isolado. Para cumprir o contrato documental sem contrariar o formato tutorial, considera-se tecnico aplicavel o conjunto de blocos completos no `## Tutorial linear de implementacao`, sempre ligados a `BK-MF0-08` e `RF08`.

Usar um snippet solto aqui seria pedagogicamente mais fraco: o aluno poderia copiar uma funcao sem perceber ficheiro, imports, validacao, erro esperado e handoff. Por isso, o codigo foi integrado nos passos onde e usado.

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

## Tutorial linear de implementacao

### Passo 1 - Confirmar contrato, scope e riscos

1. Objetivo simples do passo: confirmar o que este BK entrega, o que fica fora e que contratos dos BKs vizinhos nao podem ser quebrados.
2. Ficheiros envolvidos:
   - CRIAR: nenhum ficheiro de aplicacao neste passo.
   - EDITAR: este guia BK, apenas para orientar a implementacao.
   - LOCALIZACAO: ler esta secao antes de abrir o editor de codigo.
   - REVER: RF/RNF indicados no header, backlog, matriz, MF-VIEWS e proximo BK.
3. O que fazer: ler e respeitar as decisoes abaixo antes de implementar.
4. Codigo completo, correto e integrado: este passo ainda nao tem codigo; o codigo aparece nos passos seguintes, junto do ficheiro onde e usado.
5. Explicacao didatica e detalhada: este passo evita que o aluno implemente uma funcionalidade correta isoladamente, mas incoerente com a app final. Primeiro confirma-se o contrato; so depois se escreve codigo.
6. Como validar: confirmar que o header do BK, RF/RNF, dependencias e handoff continuam iguais aos documentos canonicos.
7. Erro comum ou cenario negativo: alterar scope, IDs, roles, nomes de ficheiros ou prometer IA/recomendacoes/pagamentos antes da fase correta.

**Decisao tecnica confirmada:**
Categorias sao metadados de catalogo, nao IA. A associacao produto-categoria e acao administrativa protegida no backend.

Categorias iniciais canonicas para seed:

- `limpeza`
- `maquilhagem`
- `tratamento`
- `protetor-solar`


**Scope-in deste passo:**
- Criar modelo `Category`.
- Criar seed de categorias iniciais.
- Criar endpoint admin para criar categoria.
- Criar endpoint admin para associar categorias a produto.
- Validar que todas as categorias existem antes de associar.
- Preparar contrato para filtros de `BK-MF1-01`.


**Scope-out deste passo:**
- Pesquisa por categoria fica para `BK-MF1-01`.
- Detalhe publico de produto fica para `BK-MF1-02`.
- Recomendacoes, simulacao, carrinho e pagamentos ficam fora deste BK.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever codigo, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
   - CRIAR:
     - `server/src/models/category.model.js`
     - `server/src/validators/category.validator.js`
     - `server/src/services/category.service.js`
     - `server/src/controllers/admin-categories.controller.js`
     - `server/src/routes/admin-categories.routes.js`
     - `server/src/scripts/seed-categories.js`
     - `server/tests/categories.test.js`
     - `client/src/pages/AdminCategoriesPage.jsx`

   - EDITAR:
     - `server/src/models/product.model.js`
     - `server/src/app.js`
     - `client/src/App.jsx`

   - REVER:
     - `server/src/models/product.model.js`, criado no `BK-MF0-07`.
     - `server/src/middlewares/role.middleware.js`.
     - `docs/RF.md`, requisito `RF08`.
     - `docs/planificacao/guias-bk/MF1/BK-MF1-01-permitir-pesquisa-e-filtragem-por-categoria-preco-tipo-de-pele-marca.md`.
   - LOCALIZACAO: usar exatamente os caminhos listados; quando o ficheiro ja existir, editar o ficheiro existente em vez de criar outro com nome parecido.
3. O que fazer: criar ou editar estes ficheiros pela ordem dos passos seguintes.
4. Codigo completo, correto e integrado: este passo ainda nao tem codigo; ele prepara a lista para os passos de implementacao.
5. Explicacao didatica e detalhada: mapear ficheiros antes de programar ensina separacao de responsabilidades e reduz erros de arquitetura.
6. Como validar: verificar que cada caminho aparece uma unica vez e que os nomes batem com os imports dos passos seguintes.
7. Erro comum ou cenario negativo: criar ficheiros duplicados, por exemplo outro controller com nome parecido, faz a app compilar parcialmente mas falhar no fluxo completo.

### Passo 3 - Implementar codigo por ficheiro

1. Objetivo simples do passo: escrever cada ficheiro no local certo, mantendo o contrato com os BKs anteriores e seguintes.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: os ficheiros aparecem um a um nos subpassos abaixo.
   - LOCALIZACAO: cada subpasso indica o caminho completo do ficheiro.
   - REVER: imports, exports, nomes das funcoes e contratos HTTP usados no handoff.
3. O que fazer: seguir os subpassos na ordem apresentada; cada bloco de codigo deve ser colocado no ficheiro indicado.
4. Codigo completo, correto e integrado: os blocos surgem imediatamente abaixo, junto do ficheiro onde sao usados.
5. Explicacao didatica e detalhada: a ordem dos ficheiros acompanha a arquitetura da app, para o aluno perceber como dados entram, sao validados, passam pelo service e chegam ao frontend.
6. Como validar: apos cada ficheiro, confirmar imports/exports e mensagens de erro antes de passar ao seguinte.
7. Erro comum ou cenario negativo: copiar apenas parte do codigo deixa o tutorial incoerente e quebra os passos posteriores.


### Passo 4 - Criar ou editar `server/src/models/category.model.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/models/category.model.js` no contrato deste BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `server/src/models/category.model.js` conforme indicado na frase abaixo.
   - LOCALIZACAO: `server/src/models/category.model.js`.
   - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:


Criar este ficheiro em `server/src/models/category.model.js`.

```js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300
    }
  },
  { timestamps: true }
);

export const Category = model('Category', categorySchema);
```

5. Explicacao didatica e detalhada do codigo: `slug` e o identificador estavel usado em URLs e filtros. Exemplo: "Protetor Solar" vira `protetor-solar`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `server/src/validators/category.validator.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/validators/category.validator.js` no contrato deste BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `server/src/validators/category.validator.js` conforme indicado na frase abaixo.
   - LOCALIZACAO: `server/src/validators/category.validator.js`.
   - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:


Criar este ficheiro em `server/src/validators/category.validator.js`.

```js
import mongoose from 'mongoose';
import { AppError } from '../middlewares/error.middleware.js';

export function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateCategoryInput(body) {
  const name = String(body.name ?? '').trim();
  const slug = slugify(body.slug ?? name);
  const description = String(body.description ?? '').trim();
  const errors = {};

  if (name.length < 2 || name.length > 80) {
    errors.name = 'Nome da categoria deve ter entre 2 e 80 caracteres';
  }

  if (slug.length < 2) {
    errors.slug = 'Slug da categoria invalido';
  }

  if (description.length > 300) {
    errors.description = 'Descricao deve ter no maximo 300 caracteres';
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(400, 'Categoria invalida', errors);
  }

  return { name, slug, description };
}

export function validateCategoryIds(body) {
  const categoryIds = Array.isArray(body.categoryIds) ? body.categoryIds : [];

  if (categoryIds.length === 0) {
    throw new AppError(400, 'Indica pelo menos uma categoria');
  }

  const invalid = categoryIds.filter((id) => !mongoose.isValidObjectId(id));

  if (invalid.length > 0) {
    throw new AppError(400, 'categoryIds contem IDs invalidos', { invalid });
  }

  return [...new Set(categoryIds)];
}
```

5. Explicacao didatica e detalhada do codigo: o validator cria slugs previsiveis e impede associar IDs que nem sequer parecem ObjectId de MongoDB.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 6 - Criar ou editar `server/src/services/category.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/category.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `server/src/services/category.service.js` conforme indicado na frase abaixo.
   - LOCALIZACAO: `server/src/services/category.service.js`.
   - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:


Criar este ficheiro em `server/src/services/category.service.js`.

```js
import { AppError } from '../middlewares/error.middleware.js';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';

function toCategoryResponse(category) {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description
  };
}

function toProductCategoryResponse(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    categoryIds: product.categoryIds.map((id) => id.toString())
  };
}

export async function createCategory(input) {
  const category = await Category.create(input);
  return toCategoryResponse(category);
}

export async function seedCategory(input) {
  const category = await Category.findOneAndUpdate(
    { slug: input.slug },
    { $setOnInsert: input },
    { upsert: true, new: true }
  );

  return toCategoryResponse(category);
}

export async function assignCategoriesToProduct(productId, categoryIds) {
  const found = await Category.countDocuments({ _id: { $in: categoryIds } });

  if (found !== categoryIds.length) {
    throw new AppError(400, 'Uma ou mais categorias nao existem');
  }

  const product = await Product.findByIdAndUpdate(
    productId,
    { $set: { categoryIds } },
    { new: true, runValidators: true }
  );

  if (!product) {
    throw new AppError(404, 'Produto nao encontrado');
  }

  return toProductCategoryResponse(product);
}
```

5. Explicacao didatica e detalhada do codigo: antes de associar, o service conta se todas as categorias existem. Assim o produto nao fica com referencias partidas.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 7 - Criar ou editar `server/src/controllers/admin-categories.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/controllers/admin-categories.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `server/src/controllers/admin-categories.controller.js` conforme indicado na frase abaixo.
   - LOCALIZACAO: `server/src/controllers/admin-categories.controller.js`.
   - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:


Criar este ficheiro em `server/src/controllers/admin-categories.controller.js`.

```js
import {
  assignCategoriesToProduct,
  createCategory
} from '../services/category.service.js';
import {
  validateCategoryIds,
  validateCategoryInput
} from '../validators/category.validator.js';

export async function createCategoryController(req, res, next) {
  try {
    const input = validateCategoryInput(req.body);
    const category = await createCategory(input);

    return res.status(201).json({ category });
  } catch (err) {
    return next(err);
  }
}

export async function assignProductCategoriesController(req, res, next) {
  try {
    const categoryIds = validateCategoryIds(req.body);
    const product = await assignCategoriesToProduct(req.params.productId, categoryIds);

    return res.status(200).json({ product });
  } catch (err) {
    return next(err);
  }
}
```

5. Explicacao didatica e detalhada do codigo: ha um controller para criar categorias e outro para associar categorias a produtos.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `server/src/routes/admin-categories.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/routes/admin-categories.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `server/src/routes/admin-categories.routes.js` conforme indicado na frase abaixo.
   - LOCALIZACAO: `server/src/routes/admin-categories.routes.js`.
   - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:


Criar este ficheiro em `server/src/routes/admin-categories.routes.js`.

```js
import { Router } from 'express';
import { ROLES } from '../constants/roles.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import {
  assignProductCategoriesController,
  createCategoryController
} from '../controllers/admin-categories.controller.js';

export const adminCategoriesRoutes = Router();

adminCategoriesRoutes.post(
  '/categories',
  requireAuth,
  requireRole(ROLES.ADMIN),
  createCategoryController
);

adminCategoriesRoutes.patch(
  '/products/:productId/categories',
  requireAuth,
  requireRole(ROLES.ADMIN),
  assignProductCategoriesController
);
```

5. Explicacao didatica e detalhada do codigo: a rota fica sob `/api/admin`, tal como produtos e utilizadores administrativos.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 9 - Criar ou editar `server/src/scripts/seed-categories.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/scripts/seed-categories.js` no contrato deste BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `server/src/scripts/seed-categories.js` conforme indicado na frase abaixo.
   - LOCALIZACAO: `server/src/scripts/seed-categories.js`.
   - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:


Criar este ficheiro em `server/src/scripts/seed-categories.js`.

```js
import { connectDB, disconnectDB } from '../config/db.js';
import { seedCategory } from '../services/category.service.js';
import { slugify } from '../validators/category.validator.js';

const INITIAL_CATEGORIES = [
  { name: 'Limpeza', description: 'Produtos de limpeza diaria da pele' },
  { name: 'Maquilhagem', description: 'Produtos de maquilhagem e acabamento' },
  { name: 'Tratamento', description: 'Produtos cosmeticos de cuidado da pele' },
  { name: 'Protetor Solar', description: 'Produtos cosmeticos com protecao solar' }
];

await connectDB();

for (const category of INITIAL_CATEGORIES) {
  await seedCategory({
    ...category,
    slug: slugify(category.name)
  });
}

await disconnectDB();

console.log('Categorias iniciais preparadas');
```

5. Explicacao didatica e detalhada do codigo: o seed pode ser corrido varias vezes sem duplicar categorias porque usa `upsert`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 10 - Criar ou editar `server/src/app.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/app.js` no contrato deste BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `server/src/app.js` conforme indicado na frase abaixo.
   - LOCALIZACAO: `server/src/app.js`.
   - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:


Editar `server/src/app.js` e substituir pelo ficheiro completo abaixo, preservando toda a API da `MF0` e acrescentando categorias admin.

```js
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { authRoutes } from './routes/auth.routes.js';
import { adminUsersRoutes } from './routes/admin-users.routes.js';
import { adminProductsRoutes } from './routes/admin-products.routes.js';
import { adminCategoriesRoutes } from './routes/admin-categories.routes.js';
import { preferencesRoutes } from './routes/preferences.routes.js';
import { profileRoutes } from './routes/profile.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'orelle' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/preferences', preferencesRoutes);
  app.use('/api/admin', adminUsersRoutes);
  app.use('/api/admin', adminProductsRoutes);
  app.use('/api/admin', adminCategoriesRoutes);

  app.use(errorMiddleware);

  return app;
}
```

5. Explicacao didatica e detalhada do codigo: este e o estado final de `server/src/app.js` no fim da `MF0`. A app tem identidade, perfil, preferências e administração de catálogo, mas ainda não promete análise facial, recomendações avançadas, carrinho ou pagamentos.
6. Como validar: confirmar `GET /api/health`, `POST /api/auth/login`, `GET /api/profile/me`, `GET /api/preferences/me` e rotas `/api/admin/*` com admin.
7. Erro comum ou cenario negativo: substituir este ficheiro por um snippet parcial apaga rotas criadas nos BKs anteriores e quebra a macrofase.

### Passo 11 - Criar ou editar `client/src/pages/AdminCategoriesPage.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/pages/AdminCategoriesPage.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: `client/src/pages/AdminCategoriesPage.jsx` conforme indicado na frase abaixo.
   - LOCALIZACAO: `client/src/pages/AdminCategoriesPage.jsx`.
   - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:


Criar este ficheiro em `client/src/pages/AdminCategoriesPage.jsx`.

```jsx
import { useState } from 'react';
import { apiRequest } from '../services/apiClient.js';

export function AdminCategoriesPage() {
  const [message, setMessage] = useState('');
  const [categoryName, setCategoryName] = useState('Limpeza');
  const [productId, setProductId] = useState('');
  const [categoryIdsText, setCategoryIdsText] = useState('');

  async function createCategory(event) {
    event.preventDefault();

    try {
      await apiRequest('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: categoryName })
      });
      setMessage('Categoria criada');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function assignCategories(event) {
    event.preventDefault();
    const categoryIds = categoryIdsText.split(',').map((item) => item.trim()).filter(Boolean);

    try {
      await apiRequest(`/admin/products/${productId}/categories`, {
        method: 'PATCH',
        body: JSON.stringify({ categoryIds })
      });
      setMessage('Categorias associadas');
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <main>
      <h1>Categorias</h1>

      <form onSubmit={createCategory}>
        <label>
          Nome da categoria
          <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
        </label>
        <button type="submit">Criar categoria</button>
      </form>

      <form onSubmit={assignCategories}>
        <label>
          ID do produto
          <input value={productId} onChange={(event) => setProductId(event.target.value)} />
        </label>
        <label>
          IDs de categorias separados por virgula
          <input value={categoryIdsText} onChange={(event) => setCategoryIdsText(event.target.value)} />
        </label>
        <button type="submit">Associar categorias</button>
      </form>

      {message && <p role="status">{message}</p>}
    </main>
  );
}
```

5. Explicacao didatica e detalhada do codigo: a UI e administrativa e simples. O backend continua a validar permissao e existencia das categorias.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 12 - Criar ou editar `client/src/App.jsx`

1. Objetivo simples do passo: ligar a pagina admin de categorias a app de demonstracao sem criar routing definitivo.
2. Ficheiros envolvidos:
   - EDITAR: `client/src/App.jsx`.
   - LOCALIZACAO: substituir o ficheiro atual por esta versao completa.
   - REVER: paginas importadas abaixo e `AuthContext.jsx`.
3. O que fazer: manter as paginas anteriores e acrescentar a nova pagina deste BK.
4. Codigo completo, correto e integrado:

Editar `client/src/App.jsx` e substituir pelo ficheiro completo abaixo.

```jsx
import { AuthProvider } from './context/AuthContext.jsx';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage.jsx';
import { AdminProductCreatePage } from './pages/AdminProductCreatePage.jsx';
import { EditProfilePage } from './pages/EditProfilePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { PreferencesPage } from './pages/PreferencesPage.jsx';
import { ProfileSetupPage } from './pages/ProfileSetupPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';

export function App() {
  return (
    <AuthProvider>
      <RegisterPage />
      <LoginPage />
      <ProfileSetupPage />
      <EditProfilePage />
      <PreferencesPage />
      <AdminProductCreatePage />
      <AdminCategoriesPage />
    </AuthProvider>
  );
}
```

5. Explicacao didatica e detalhada do codigo: este e o frontend de demonstracao no fim da MF0. Mostra identidade, perfil, preferencias e catalogo base, sem prometer IA facial, simulacao, recomendacoes avancadas ou pagamentos.
6. Como validar: abrir o frontend e confirmar que a nova pagina consegue chamar a API com o mesmo `apiClient` e a mesma sessao segura.
7. Erro comum ou cenario negativo: deixar a pagina criada mas nao importada em `App.jsx` faz o codigo existir no repositorio, mas ficar invisivel para demonstracao e defesa.

### Passo 13 - Validar payloads e respostas esperadas

1. Objetivo simples do passo: testar o contrato HTTP que a UI e os BKs seguintes vao usar.
2. Ficheiros envolvidos:
   - CRIAR: nenhum ficheiro novo.
   - EDITAR: nenhum ficheiro neste passo, salvo se a resposta real nao bater com o contrato documentado.
   - LOCALIZACAO: executar pedidos contra os endpoints implementados nos passos anteriores.
   - REVER: routes, controllers, validators e services deste BK.
3. O que fazer: usar os exemplos abaixo para confirmar pedidos validos, respostas de sucesso e erros esperados.
4. Codigo completo, correto e integrado: os payloads abaixo fazem parte do contrato de API e devem bater com o codigo implementado.
5. Explicacao didatica e detalhada: payloads mostram ao aluno como o frontend comunica com o backend e que mensagens a app deve apresentar.
6. Como validar: executar os pedidos com cliente HTTP ou teste automatizado e comparar status code e JSON.
7. Erro comum ou cenario negativo: mudar nomes de campos no backend sem atualizar frontend e testes cria erros dificeis de diagnosticar.


Criar categoria:

```http
POST /api/admin/categories
Cookie: orelle_session=...admin...
Content-Type: application/json

{
  "name": "Limpeza",
  "description": "Produtos de limpeza diaria da pele"
}
```

Resposta `201`:

```json
{
  "category": {
    "id": "66d000000000000000000001",
    "name": "Limpeza",
    "slug": "limpeza"
  }
}
```

Associar categorias:

```http
PATCH /api/admin/products/66c000000000000000000001/categories
Cookie: orelle_session=...admin...
Content-Type: application/json

{
  "categoryIds": ["66d000000000000000000001"]
}
```

Resposta `200`:

```json
{
  "product": {
    "id": "66c000000000000000000001",
    "name": "Gel de Limpeza Suave",
    "categoryIds": ["66d000000000000000000001"]
  }
}
```

Categoria inexistente `400`:

```json
{
  "error": {
    "message": "Uma ou mais categorias nao existem"
  }
}
```

### Passo 14 - Criar testes minimos

1. Objetivo simples do passo: provar que o comportamento principal e os cenarios negativos funcionam antes de entregar o BK.
2. Ficheiros envolvidos:
   - CRIAR/EDITAR: ficheiro de teste indicado abaixo.
   - LOCALIZACAO: pasta de testes do backend ou frontend indicada no proprio passo.
   - REVER: validators, services, controllers e rotas usados pelo teste.
3. O que fazer: criar o teste completo abaixo e correr a suite.
4. Codigo completo, correto e integrado: o teste abaixo deve acompanhar o codigo real, nao ser apenas exemplo solto.
5. Explicacao didatica e detalhada: testes ajudam o aluno a perceber o que significa terminar um BK: nao basta escrever codigo, e preciso provar o comportamento.
6. Como validar: correr o comando de testes documentado no BK e confirmar que os casos positivos e negativos passam.
7. Erro comum ou cenario negativo: testar apenas o caminho feliz deixa falhas de seguranca e validacao por descobrir.


Criar este ficheiro em `server/tests/categories.test.js`.

```js
import { describe, expect, it } from 'vitest';
import { slugify, validateCategoryIds, validateCategoryInput } from '../src/validators/category.validator.js';

describe('BK-MF0-08 / RF08 - categorias', () => {
  it('cria slug estavel', () => {
    expect(slugify('Protetor Solar')).toBe('protetor-solar');
  });

  it('valida categoria', () => {
    const input = validateCategoryInput({ name: 'Limpeza' });

    expect(input.slug).toBe('limpeza');
  });

  it('rejeita categoryIds invalidos', () => {
    expect(() => validateCategoryIds({ categoryIds: ['abc'] })).toThrow('categoryIds contem IDs invalidos');
  });
});
```

5. Explicacao didatica e detalhada do codigo: os testes garantem slugs previsiveis e impedem IDs invalidos antes de tocar na base de dados.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 15 - Confirmar bloqueios e decisoes antes do PR

1. Objetivo simples do passo: identificar decisoes que nao podem ser inventadas durante a implementacao.
2. Ficheiros envolvidos:
   - CRIAR: nenhum ficheiro de aplicacao.
   - EDITAR: apenas documentos canonicos se a decisao alterar contrato, scope ou politica.
   - LOCALIZACAO: rever os pontos abaixo antes de abrir PR.
   - REVER: README, RF, RNF, backlog, matriz e guias dependentes.
3. O que fazer: se algum bloqueio se aplicar, parar a implementacao real e atualizar primeiro a fonte documental correta.
4. Codigo completo, correto e integrado: este passo nao adiciona codigo; protege a coerencia do codigo ja escrito.
5. Explicacao didatica e detalhada: alunos nao devem preencher lacunas com suposicoes, sobretudo quando ha dados sensiveis, roles ou contratos usados por outros BKs.
6. Como validar: confirmar que nao ficou nenhuma decisao implicita no codigo.
7. Erro comum ou cenario negativo: implementar uma regra por intuicao pode funcionar hoje, mas quebrar privacidade, seguranca ou o handoff de fases seguintes.


Se `Product.categoryIds` nao existir no modelo criado em `BK-MF0-07`, atualizar primeiro `server/src/models/product.model.js`. Sem esse campo, `BK-MF1-01` nao conseguira filtrar produtos por categoria.

### Evidence para PR/defesa
- Seed de categorias executado com sucesso.
- Admin cria categoria com `201`.
- Cliente recebe `403` ao tentar criar categoria.
- Produto recebe `categoryIds` com `200`.
- ID invalido ou categoria inexistente devolve `400`.
- Handoff documentado para filtros de `BK-MF1-01`.

### Handoff para BK-MF1-01
O proximo BK deve usar `Product.categoryIds`, `Product.priceCents`, `Product.skinTypes` e `Product.brandName` para pesquisa e filtragem. Nao deve criar outro contrato de categoria.

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para categorias e handoff da MF0 para MF1.
- `2026-05-29`: tutorial linear integrado com Category, seed, associacao produto-categoria, payloads, UI, testes e handoff para MF1.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com codigo, explicacao, validacao e negativo no passo onde sao usados.
- `2026-05-29`: acrescentado `client/src/App.jsx` completo para ligar a pagina admin de categorias.
