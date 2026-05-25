# BK-MF0-07 - Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock

## Header
- `doc_id`: `GUIA-BK-MF0-07`
- `bk_id`: `BK-MF0-07`
- `macro`: `MF0`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RF07`
- `fase_documental`: `Fase 1`
- `sprint`: `S01-S02`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF0-08`
- `guia_path`: `docs/planificacao/guias-bk/MF0/BK-MF0-07-registar-produtos-com-nome-descricao-ingredientes-tipo-de-pele-indicado-imagem-preco-e-stock.md`
- `last_updated`: `2026-05-25`

#### BK-MF0-07 - Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock

##### O que vamos fazer neste BK

Neste BK vamos criar a base do catálogo comercial da Orélle. O Admin deve conseguir registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock, exatamente como definido em `RF07`.

Também vamos preparar campos que os BKs seguintes vão precisar. `brandName` é marcado como `DERIVADO` porque `RF06` fala de marcas favoritas e `RF09` fala de filtro por marca, apesar de `RF07` não listar marca diretamente. Esta decisão deve ficar explícita para não parecer requisito inventado.

Esta fase foi detalhada sem mockup. A UI administrativa deve ser simples e funcional, sem assumir design final.

##### Porque e que isto e importante

- Cria o contrato de catálogo usado por categorias, pesquisa, detalhes, recomendações, carrinho e compras.
- Ensina modelação de dados comerciais com validação de preço e stock.
- Reutiliza roles de `BK-MF0-05` para proteger criação de produtos.
- Prepara `BK-MF0-08` e `MF1`.

##### O que entra (scope)

- Modelo `Product`.
- Endpoint `POST /api/admin/products` protegido por Admin.
- Validação de nome, descrição, ingredientes, tipos de pele indicados, imagem, preço e stock.
- Campo `brandName` como assunção técnica derivada de `RF06`/`RF09`.
- Página React simples de criação de produto para Admin.
- Testes negativos de permissão, preço/stock e campos obrigatórios.

##### O que nao entra (scope-out)

- Categorias, que ficam para `BK-MF0-08`.
- Pesquisa e filtragem, que ficam para `BK-MF1-01`.
- Página pública de detalhe do produto, que fica para `BK-MF1-02`.
- Carrinho, pagamentos e stock automático pós-compra.

##### Como saber que isto ficou bem

- Admin cria produto válido e recebe `201`.
- Cliente autenticado não consegue criar produto e recebe `403`.
- Preço negativo, stock negativo ou nome em falta devolvem `400`.
- O produto guarda ingredientes e tipos de pele em listas normalizadas.
- `BK-MF0-08` consegue associar categorias sem alterar a estrutura base.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P0` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `M` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Bruna` (CANONICO)
- Apoio: `Izelicks` (CANONICO)
- Dependencias (BK IDs): `-` (CANONICO)
- Pre-condicoes: autenticação e roles recomendadas para proteger admin; sem dependência canónica declarada (DERIVADO)
- Ref. Plano: `RF07`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-CATALOG-PRODUCTS` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF07` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-07` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-07` (CANONICO)
- Descricao: registo administrativo de produtos do catálogo base (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: app tem base de utilizadores; roles admin são recomendadas para proteção.
- Estado esperado depois do BK: catálogo tem modelo e criação administrativa de produtos.
- Ficheiros a criar: `server/src/models/product.model.js`, `server/src/routes/admin-products.routes.js`, `server/src/controllers/admin-products.controller.js`, `server/src/services/product.service.js`, `server/src/validators/product.validator.js`, `client/src/pages/AdminProductCreatePage.jsx`.
- Ficheiros a editar: `server/src/app.js`, `client/src/App.jsx`, `client/src/services/apiClient.js`.
- Dependencias de BK anteriores: canonicamente `-`; tecnicamente reutiliza `requireAuth`/`requireRole` se `BK-MF0-05` já foi executado.
- Impacto na arquitetura: adiciona módulo `catalog/products`.
- Impacto em frontend: cria primeiro formulário administrativo de catálogo.
- Impacto em backend: cria endpoint admin e service de produto.
- Impacto em dados: cria coleção `products` com campos comerciais.
- Impacto em segurança: criação de produto deve ser restrita a `administrador`.
- Impacto em testes: P0 com unit/integration/e2e e 3 negativos.
- Handoff para o próximo BK: `BK-MF0-08` acrescenta categorias e associa-as ao produto.

#### Pre-leitura minima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF07`, ler `RF06`, `RF08`, `RF09` para continuidade.
- Guia `BK-MF0-05`: roles e `requireRole`.
- `docs/RNF.md`: `RNF19` modularidade.
- Mockup: não existe nesta execução.

#### Glossario (rapido) (DERIVADO):

- `Produto`: item comercial do catálogo.
- `Stock`: quantidade disponível para venda.
- `Preço em cêntimos`: forma de guardar dinheiro evitando erros de casas decimais.
- `Ingredientes`: lista textual usada para informação e recomendações futuras.
- `Tipo de pele indicado`: lista de perfis de pele compatíveis.
- `Admin route`: rota que só administradores podem usar.
- `Catálogo`: conjunto de produtos consultáveis e compráveis.
- `DERIVADO`: decisão técnica inferida de RF relacionados, não campo novo arbitrário.

#### Conceitos teoricos essenciais (DERIVADO):

Em comércio, valores monetários devem ser guardados de forma previsível. Uma prática simples é guardar preço em cêntimos (`priceCents`) em vez de `19.99`, porque números decimais podem criar arredondamentos inesperados.

Stock nunca deve aceitar valores negativos. Mesmo que o frontend impeça, o backend tem de validar porque qualquer pessoa pode chamar a API diretamente.

O produto pertence a uma área administrativa. Esconder o botão no frontend melhora UX, mas a proteção real é no backend com `requireRole('administrador')`.

#### Guia de execucao (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): confirmar contrato do produto**
   - Descricao detalhada do objetivo: listar campos canónicos e derivados.
   - Justificacao: catálogo será usado por várias fases e não pode mudar sem controlo.
   - Como fazer (0.1): marcar `nome`, `descricao`, `ingredientes`, `tipoDePeleIndicado`, `imagem`, `preco`, `stock` como `CANONICO`.
   - Como fazer (0.2): marcar `brandName` como `DERIVADO de RF06/RF09`.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/models/product.model.js`.
   - Snippet de referencia: `brandName // DERIVADO de RF06/RF09`.
   - O que verificar: não foram criados campos de pagamento ou carrinho.

1. **Objetivo (~30 min): criar modelo Product**
   - Descricao detalhada do objetivo: persistir produtos com validação estrutural.
   - Justificacao: pesquisa, detalhe e carrinho dependem deste modelo.
   - Como fazer (1.1): criar campos obrigatórios do RF07.
   - Como fazer (1.2): guardar `priceCents` e `stock` como números inteiros não negativos.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/models/product.model.js`.
   - Snippet de referencia: `priceCents: { type: Number, min: 0, required: true }`.
   - O que verificar: `stock` tem `min: 0`.

2. **Objetivo (~30 min): criar validação de produto**
   - Descricao detalhada do objetivo: validar payload antes de gravar.
   - Justificacao: evita lixo no catálogo e erros futuros em filtros.
   - Como fazer (2.1): validar strings obrigatórias e listas não vazias.
   - Como fazer (2.2): converter preço para cêntimos no backend.
   - Ficheiro a rever: `docs/RNF.md`.
   - Ficheiro alvo: `server/src/validators/product.validator.js`.
   - Snippet de referencia: `if (priceCents < 0) errors.price = 'Preço inválido';`.
   - O que verificar: preço e stock inválidos devolvem `400`.

3. **Objetivo (~35 min): implementar service de criação**
   - Descricao detalhada do objetivo: criar produto a partir de payload validado.
   - Justificacao: regras de catálogo ficam fora do controller.
   - Como fazer (3.1): normalizar ingredientes e tipos de pele.
   - Como fazer (3.2): guardar `createdBy` com id do admin, se auth existir.
   - Ficheiro a rever: `server/src/models/product.model.js`.
   - Ficheiro alvo: `server/src/services/product.service.js`.
   - Snippet de referencia: `const product = await Product.create({ ...payload, createdBy: adminUserId });`.
   - O que verificar: resposta devolve produto criado sem campos internos desnecessários.

4. **Objetivo (~30 min): criar rota admin de produto**
   - Descricao detalhada do objetivo: expor `POST /api/admin/products`.
   - Justificacao: criação de catálogo é operação administrativa.
   - Como fazer (4.1): proteger com `requireAuth`.
   - Como fazer (4.2): proteger com `requireRole(ROLES.ADMIN)`.
   - Ficheiro a rever: `server/src/middlewares/role.middleware.js`.
   - Ficheiro alvo: `server/src/routes/admin-products.routes.js`.
   - Snippet de referencia: `router.post('/products', requireAuth, requireRole(ROLES.ADMIN), createProductController);`.
   - O que verificar: cliente recebe `403`.

5. **Objetivo (~40 min): criar UI admin de produto**
   - Descricao detalhada do objetivo: construir formulário para registar produto.
   - Justificacao: a defesa precisa mostrar criação real de catálogo.
   - Como fazer (5.1): criar inputs para nome, descrição, ingredientes, pele indicada, imagem, preço e stock.
   - Como fazer (5.2): mostrar loading, erro, sucesso e limpar formulário após sucesso.
   - Ficheiro a rever: `client/src/App.jsx`.
   - Ficheiro alvo: `client/src/pages/AdminProductCreatePage.jsx`.
   - Snippet de referencia: `await apiClient.post('/admin/products', payload);`.
   - O que verificar: UI não aparece para cliente, mas backend continua protegido.

6. **Objetivo (~30 min): preparar contrato para categorias e MF1**
   - Descricao detalhada do objetivo: deixar produto pronto para receber categorias no próximo BK.
   - Justificacao: `BK-MF0-08` e pesquisa de `MF1` dependem disto.
   - Como fazer (6.1): não criar categorias aqui.
   - Como fazer (6.2): documentar que `categoryIds` será acrescentado ou ativado no BK seguinte.
   - Ficheiro a rever: `docs/planificacao/backlogs/MF-VIEWS.md`.
   - Ficheiro alvo: `server/src/models/product.model.js`.
   - Snippet de referencia: `// categoryIds entra no BK-MF0-08`.
   - O que verificar: não há lógica de filtros neste BK.

7. **Objetivo (~45 min): validar negativos e evidence**
   - Descricao detalhada do objetivo: provar que produto é criado só por admin e com dados válidos.
   - Justificacao: catálogo incorreto quebra compra, recomendação e análise.
   - Como fazer (7.1): testar criação válida.
   - Como fazer (7.2): Executar cenarios negativos obrigatorios (minimo 3) e registar resultados.
   - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
   - Ficheiro alvo: `server/tests/products.test.js`.
   - Snippet de referencia: `expect(forbiddenResponse.status).toBe(403);`.
   - O que verificar: evidência cobre permissões e validações.

#### Checklist de validacao (DERIVADO):

- Smoke: admin cria produto válido e recebe `201`.
- Negativo 1: passo 4; cliente tenta criar produto; resultado esperado `403`; risco que cobre: alteração indevida do catálogo.
- Negativo 2: passo 2; preço ou stock negativo; resultado esperado `400`; risco que cobre: dados comerciais inválidos.
- Negativo 3: passo 2; nome/descrição em falta; resultado esperado `400`; risco que cobre: produto incompleto.
- Tecnico: `Product` usa campos de `RF07` e `brandName` marcado como derivado.
- Regressao das fases anteriores: roles e login continuam a funcionar.
- UI/mockup: sem mockup; formulário admin baseline.
- Seguranca: endpoint admin protegido no backend.

#### Criterios de aceite:

- Outputs: modelo `Product`, endpoint admin, validator, service e UI admin.
- Verificacoes: produto válido `201`, cliente `403`, inválidos `400`.
- Qualidade: preço em cêntimos ou política equivalente documentada; stock não negativo.
- Continuidade: `BK-MF0-08` consegue associar categorias; `MF1` consegue filtrar por preço/tipo/marca.
- Evidencia: payload válido, negativos e ficheiros alterados registados.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher apos validacao`
- `neg`: `A preencher apos testes negativos`
- `files`: `server/src/models/product.model.js`, `server/src/routes/admin-products.routes.js`, `client/src/pages/AdminProductCreatePage.jsx`
- `commands`: `curl -X POST /api/admin/products`, `npm test`
- `screenshots`: formulário de produto com sucesso e erro
- `notes`: `brandName` é derivado de RF06/RF09; categorias ficam para BK seguinte

#### TODOs

- TODO: confirmar se `brandName` deve ser obrigatório quando `RF09` for implementado.
- TODO: confirmar política de armazenamento de imagens de produto.
- TODO (BLOCKER): sem role admin funcional, criação de produto não deve ser considerada segura.
- FOLLOW-UP: `BK-MF0-08` associa categorias; `BK-MF1-01` cria pesquisa/filtros.

## Contexto do BK
- Entrega alvo: implementar `Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock` com rastreabilidade direta ao requisito `RF07`.
- Foco tecnico da macro: `Fundamentos e governance`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Criar a base de catálogo de produtos da Orélle com validação e proteção administrativa.

### Pre-requisitos
- Rever `RF07`.
- Ter roles/admin de `BK-MF0-05` para proteção real.
- Ter backend Express e MongoDB.

### Erros comuns
- Guardar preço como string sem normalização.
- Permitir stock negativo.
- Proteger só no frontend e esquecer backend.
- Implementar filtros de `MF1` antes do tempo.

### Check de compreensao
- [ ] Sei justificar `priceCents`.
- [ ] Sei provar que cliente não cria produto.
- [ ] Sei explicar porque categorias entram no próximo BK.

### Tempo estimado
- `M`: 2 a 4 horas.

## Bloco operacional
### Entrada
- BK: `BK-MF0-07`
- Requisito: `RF07`
- Dependencias: `-`
- Artefactos: `RF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos
1. Confirmar contrato de produto.
2. Criar modelo `Product`.
3. Criar validator de produto.
4. Criar service de criação.
5. Criar rota admin protegida.
6. Criar UI admin de criação.
7. Preparar handoff para categorias e MF1.
8. Executar cenarios negativos obrigatorios (minimo 3) e registar evidência.

### Cenarios negativos recomendados
- Cliente tenta criar produto e recebe `403`.
- Preço/stock inválido recebe `400`.
- Campos obrigatórios em falta recebem `400`.

### Validacao
- [ ] Smoke: admin cria produto válido.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: produto guarda campos de `RF07`.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF0-08`
- O próximo BK deve associar categorias aos produtos criados aqui.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF0-07';
const REQ_ID = 'RF07';
const MIN_NEGATIVOS = 3;

export function validarEvidenceBkMf007({ smokeOk, negativos, product }) {
  if (!smokeOk) throw new Error(`${BK_ID}/${REQ_ID}: smoke de produto falhou`);
  if (negativos < 3) throw new Error(`${BK_ID}/${REQ_ID}: negativos insuficientes`);
  if (product?.stock < 0 || product?.priceCents < 0) {
    throw new Error(`${BK_ID}/${REQ_ID}: preço ou stock inválido`);
  }
  return { bkId: BK_ID, reqId: REQ_ID, minNegativos: MIN_NEGATIVOS, status: 'OK' };
}
```

## Criterios de aceite
- Entrega funcional especifica de `Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock` validada contra `RF07`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher apos validacao`
- `proof_negativos`: `A preencher apos testes negativos`
- `proof_negocio`: produto desbloqueia categorias, pesquisa, recomendação e compra.

## Proximo BK recomendado
`BK-MF0-08`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para catálogo base de produtos.
