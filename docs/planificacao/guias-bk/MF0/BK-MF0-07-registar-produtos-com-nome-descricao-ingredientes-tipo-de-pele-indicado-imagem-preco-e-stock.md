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
- `last_updated`: `2026-05-29`

#### BK-MF0-07 - Registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock

##### O que vamos fazer neste BK

Neste BK vamos criar a base do catálogo comercial da Orélle. O Admin deve conseguir registar produtos com nome, descrição, ingredientes, tipo de pele indicado, imagem, preço e stock, exatamente como definido em `RF07`.

Este BK só pode expor criação de produtos se a autenticação e `requireRole('administrador')` estiverem funcionais. Se `requireAuth`/`requireRole` ainda não existirem, a criação real deve ficar bloqueada como `TODO (BLOCKER)`; nesse caso pode ser preparado o modelo/validator, mas não se deve disponibilizar endpoint inseguro.

Também vamos preparar campos que os BKs seguintes vão precisar. `brandName` é marcado como `DERIVADO` porque `RF06` fala de marcas favoritas e `RF09` fala de filtro por marca, apesar de `RF07` não listar marca diretamente. Esta decisão deve ficar explícita para não parecer requisito inventado.

Esta fase foi detalhada sem mockup. A UI administrativa deve ser simples e funcional, sem assumir design final.

##### Porque e que isto e importante

- Cria o contrato de catálogo usado por categorias, pesquisa, detalhes, recomendações, carrinho e compras.
- Ensina modelação de dados comerciais com validação de preço e stock.
- Reutiliza roles de `BK-MF0-05` para proteger criação de produtos; sem essas roles, o BK não deve abrir escrita administrativa.
- Prepara `BK-MF0-08` e `MF1`.

##### O que entra (scope)

- Modelo `Product`.
- Endpoint `POST /api/admin/products` protegido por `requireAuth` e `requireRole('administrador')`.
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

- Admin autenticado e autorizado cria produto válido e recebe `201`.
- Se auth/role não estiver funcional, a criação fica bloqueada e não há endpoint público temporário.
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
- Pre-condicoes: autenticação e `requireRole('administrador')` funcionais para criação real; sem isso, endpoint de escrita fica em `TODO (BLOCKER)` apesar de a dependência canónica ser `-` (DERIVADO)
- Ref. Plano: `RF07`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-CATALOG-PRODUCTS` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF07` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-07` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-07` (CANONICO)
- Descricao: registo administrativo de produtos do catálogo base (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: app tem base de utilizadores; roles admin são obrigatórias para expor criação real de produtos.
- Estado esperado depois do BK: catálogo tem modelo e criação administrativa de produtos.
- Ficheiros a criar: `server/src/models/product.model.js`, `server/src/routes/admin-products.routes.js`, `server/src/controllers/admin-products.controller.js`, `server/src/services/product.service.js`, `server/src/validators/product.validator.js`, `client/src/pages/AdminProductCreatePage.jsx`.
- Ficheiros a editar: `server/src/app.js`, `client/src/App.jsx`, `client/src/services/apiClient.js`.
- Dependencias de BK anteriores: canonicamente `-`; tecnicamente a criação real fica bloqueada até existir `requireAuth`/`requireRole` de `BK-MF0-05`.
- Impacto na arquitetura: adiciona módulo `catalog/products`.
- Impacto em frontend: cria primeiro formulário administrativo de catálogo.
- Impacto em backend: cria endpoint admin e service de produto.
- Impacto em dados: cria coleção `products` com campos comerciais.
- Impacto em segurança: criação de produto deve ser restrita a `administrador`; sem middleware funcional, não criar fallback aberto.
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
- `BLOCKER de autorização`: situação em que a funcionalidade de escrita fica parada por faltar auth/role seguro.
- `Catálogo`: conjunto de produtos consultáveis e compráveis.
- `DERIVADO`: decisão técnica inferida de RF relacionados, não campo novo arbitrário.

#### Conceitos teoricos essenciais (DERIVADO):

Em comércio, valores monetários devem ser guardados de forma previsível. Uma prática simples é guardar preço em cêntimos (`priceCents`) em vez de `19.99`, porque números decimais podem criar arredondamentos inesperados.

Stock nunca deve aceitar valores negativos. Mesmo que o frontend impeça, o backend tem de validar porque qualquer pessoa pode chamar a API diretamente.

O produto pertence a uma área administrativa. Esconder o botão no frontend melhora UX, mas a proteção real é no backend com `requireRole('administrador')`. Se esse middleware ainda não existir, o endpoint `POST /api/admin/products` não deve ser exposto como rota temporária aberta.

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
    - Como fazer (4.1): proteger com `requireAuth`; se não existir, marcar `TODO (BLOCKER)` e não expor endpoint.
    - Como fazer (4.2): proteger com `requireRole(ROLES.ADMIN)`; se não existir, implementar primeiro ou bloquear criação real.
    - Ficheiro a rever: `server/src/middlewares/role.middleware.js`.
    - Ficheiro alvo: `server/src/routes/admin-products.routes.js`.
    - Snippet de referencia: `router.post('/products', requireAuth, requireRole(ROLES.ADMIN), createProductController);`.
    - O que verificar: cliente recebe `403` e não existe rota alternativa sem auth.

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
- Negativo 1b: passo 4; `requireAuth`/`requireRole` ausente; resultado esperado BK marcado como `BLOCKER` e endpoint não exposto; risco que cobre: criação insegura temporária.
- Negativo 2: passo 2; preço ou stock negativo; resultado esperado `400`; risco que cobre: dados comerciais inválidos.
- Negativo 3: passo 2; nome/descrição em falta; resultado esperado `400`; risco que cobre: produto incompleto.
- Tecnico: `Product` usa campos de `RF07` e `brandName` marcado como derivado.
- Regressao das fases anteriores: roles e login continuam a funcionar.
- UI/mockup: sem mockup; formulário admin baseline.
- Seguranca: endpoint admin protegido no backend; sem auth/role funcional, criação real bloqueada.

#### Criterios de aceite:

- Outputs: modelo `Product`, validator, service e endpoint admin apenas quando auth/role estiver funcional.
- Verificacoes: produto válido `201` só como admin autorizado; cliente `403`; inválidos `400`; falta de auth/role gera `BLOCKER`.
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
- `notes`: `brandName` é derivado de RF06/RF09; categorias ficam para BK seguinte; criação real depende de `requireAuth`/`requireRole`

#### TODOs

- TODO: confirmar se `brandName` deve ser obrigatório quando `RF09` for implementado.
- TODO: confirmar política de armazenamento de imagens de produto.
- TODO (BLOCKER): sem `requireAuth` e `requireRole('administrador')` funcionais, não expor `POST /api/admin/products`.
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
- Ter roles/admin de `BK-MF0-05` para proteção real; sem isso, implementar apenas model/validator e bloquear endpoint de escrita.
- Ter backend Express e MongoDB.

### Erros comuns

- Guardar preço como string sem normalização.
- Permitir stock negativo.
- Proteger só no frontend e esquecer backend.
- Criar rota temporária de produtos sem `requireAuth`/`requireRole`.
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

- [ ] Smoke: admin autorizado cria produto válido.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: produto guarda campos de `RF07`.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade

- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff

- Proximo BK recomendado: `BK-MF0-08`
- O próximo BK deve associar categorias aos produtos criados aqui; se este BK ficou bloqueado por auth/role, o bloqueio passa para `BK-MF0-08`.

## Snippet tecnico aplicavel

O codigo aplicavel deste BK-MF0-07 ja nao fica como anexo isolado. Para cumprir o contrato documental sem contrariar o formato tutorial, considera-se tecnico aplicavel o conjunto de blocos completos no `## Tutorial linear de implementacao`, sempre ligados a `BK-MF0-07` e `RF07`.

Usar um snippet solto aqui seria pedagogicamente mais fraco: o aluno poderia copiar uma funcao sem perceber ficheiro, imports, validacao, erro esperado e handoff. Por isso, o codigo foi integrado nos passos onde e usado.

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
- `proof_negocio`: produto prepara categorias, pesquisa e compra; recomendações avançadas ficam para fases posteriores.

## Proximo BK recomendado

`BK-MF0-08`

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
Produtos pertencem ao catalogo comercial e nao dependem de IA. A criacao de produtos e uma acao administrativa protegida por `requireAuth` + `requireRole(ROLES.ADMIN)`.

Imagem de produto nesta fase e `imageUrl` controlado. Nao ha upload de ficheiros neste BK.

**Scope-in deste passo:**

- Criar modelo `Product`.
- Validar nome, marca, descricao, ingredientes, tipo de pele indicado, imagem, preco e stock.
- Guardar preco em centimos (`priceCents`) para evitar erros com decimais.
- Proteger `POST /api/admin/products` no backend.
- Rejeitar descricoes com claims clinicos/medicos nao documentados.
- Criar UI admin simples para registo de produto.

**Scope-out deste passo:**

- Pesquisa e filtros ficam para `BK-MF1-01`.
- Detalhe publico de produto fica para `BK-MF1-02`.
- Recomendacoes ficam para `MF2`.
- Carrinho, stock pos-compra e pagamentos ficam para `MF3`.
- Categorias entram no `BK-MF0-08`.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever codigo, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
    - CRIAR:
        - `server/src/models/product.model.js`
        - `server/src/validators/product.validator.js`
        - `server/src/services/product.service.js`
        - `server/src/controllers/admin-products.controller.js`
        - `server/src/routes/admin-products.routes.js`
        - `server/tests/products.test.js`
        - `client/src/pages/AdminProductCreatePage.jsx`

    - EDITAR:
        - `server/src/app.js`
        - `client/src/App.jsx`

    - REVER:
        - `server/src/middlewares/auth.middleware.js`
        - `server/src/middlewares/role.middleware.js`
        - `server/src/constants/roles.js`
        - `docs/RF.md`, requisito `RF07`.
        - `docs/planificacao/guias-bk/MF0/BK-MF0-08-associar-categorias-limpeza-maquilhagem-tratamento-protetor-solar-etc.md`.
        - `docs/planificacao/guias-bk/MF3/BK-MF3-02-adicionar-remover-produtos-do-carrinho-de-compras.md`.
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

### Passo 4 - Criar ou editar `server/src/models/product.model.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/models/product.model.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/models/product.model.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/models/product.model.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/models/product.model.js`.

```js
import mongoose from "mongoose";
import { SKIN_TYPES } from "./profile.model.js";

const { Schema, model } = mongoose;

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120,
        },
        brandName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        ingredientNames: {
            type: [String],
            required: true,
            validate: {
                validator: (items) => Array.isArray(items) && items.length > 0,
                message: "Produto deve ter pelo menos um ingrediente",
            },
        },
        skinTypes: {
            type: [String],
            required: true,
            enum: SKIN_TYPES,
        },
        imageUrl: {
            type: String,
            required: true,
            trim: true,
        },
        priceCents: {
            type: Number,
            required: true,
            min: 0,
        },
        stock: {
            type: Number,
            required: true,
            min: 0,
        },
        categoryIds: {
            type: [Schema.Types.ObjectId],
            ref: "Category",
            default: [],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);

productSchema.index({ name: "text", brandName: "text", description: "text" });

export const Product = model("Product", productSchema);
```

5. Explicacao do codigo: `categoryIds` ja fica preparado para o proximo BK, mas categorias ainda nao sao obrigatorias aqui.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `server/src/validators/product.validator.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/validators/product.validator.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/validators/product.validator.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/validators/product.validator.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/validators/product.validator.js`.

```js
import { AppError } from "../middlewares/error.middleware.js";
import { SKIN_TYPES } from "../models/profile.model.js";

const BLOCKED_CLAIM_WORDS = [
    "cura",
    "curar",
    "tratamento medico",
    "tratamento clinico",
    "elimina acne",
    "remove rugas",
    "doenca",
    "medicamento",
];

function normalizeText(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

function normalizeList(value) {
    if (!Array.isArray(value)) return [];
    return [
        ...new Set(
            value
                .map((item) => normalizeText(item).toLowerCase())
                .filter(Boolean),
        ),
    ];
}

function assertControlledImageUrl(value, errors) {
    try {
        const url = new URL(String(value ?? "").trim());
        if (!["http:", "https:"].includes(url.protocol)) {
            errors.imageUrl = "Imagem deve ser URL http/https";
        }
        return url.toString();
    } catch {
        errors.imageUrl = "Imagem deve ser URL valido";
        return "";
    }
}

function hasBlockedClaims(description) {
    const normalized = description.toLowerCase();
    return BLOCKED_CLAIM_WORDS.some((word) => normalized.includes(word));
}

export function validateProductInput(body) {
    const input = {
        name: normalizeText(body.name),
        brandName: normalizeText(body.brandName),
        description: normalizeText(body.description),
        ingredientNames: normalizeList(body.ingredientNames),
        skinTypes: normalizeList(body.skinTypes),
        imageUrl: "",
        priceCents: Number(body.priceCents),
        stock: Number(body.stock),
    };

    const errors = {};
    input.imageUrl = assertControlledImageUrl(body.imageUrl, errors);

    if (input.name.length < 2 || input.name.length > 120) {
        errors.name = "Nome deve ter entre 2 e 120 caracteres";
    }

    if (input.brandName.length < 2 || input.brandName.length > 80) {
        errors.brandName = "Marca deve ter entre 2 e 80 caracteres";
    }

    if (input.description.length < 20 || input.description.length > 1000) {
        errors.description = "Descricao deve ter entre 20 e 1000 caracteres";
    }

    if (hasBlockedClaims(input.description)) {
        errors.description =
            "Descricao nao pode conter claims clinicos ou medicos nao documentados";
    }

    if (input.ingredientNames.length === 0) {
        errors.ingredientNames = "Indica pelo menos um ingrediente";
    }

    if (
        input.skinTypes.length === 0 ||
        input.skinTypes.some((type) => !SKIN_TYPES.includes(type))
    ) {
        errors.skinTypes = `Tipos de pele devem ser: ${SKIN_TYPES.join(", ")}`;
    }

    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
        errors.priceCents =
            "Preco deve ser inteiro em centimos e maior ou igual a zero";
    }

    if (!Number.isInteger(input.stock) || input.stock < 0) {
        errors.stock = "Stock deve ser inteiro maior ou igual a zero";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Produto invalido", errors);
    }

    return input;
}
```

5. Explicacao do codigo: o validator protege o catalogo contra dados incompletos, preco negativo e promessas medicas. O produto pode dizer "indicado para pele oleosa", mas nao pode prometer curas.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 6 - Criar ou editar `server/src/services/product.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/product.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/services/product.service.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/services/product.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/services/product.service.js`.

```js
import { Product } from "../models/product.model.js";

function toProductResponse(product) {
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
        createdBy: product.createdBy.toString(),
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
}

export async function createProduct(input, adminUserId) {
    const product = await Product.create({
        ...input,
        createdBy: adminUserId,
    });

    return toProductResponse(product);
}
```

5. Explicacao do codigo: o service recebe dados ja validados e regista quem criou o produto.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 7 - Criar ou editar `server/src/controllers/admin-products.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/controllers/admin-products.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/controllers/admin-products.controller.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/controllers/admin-products.controller.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/controllers/admin-products.controller.js`.

```js
import { createProduct } from "../services/product.service.js";
import { validateProductInput } from "../validators/product.validator.js";

export async function createProductController(req, res, next) {
    try {
        const input = validateProductInput(req.body);
        const product = await createProduct(input, req.user.id);

        return res.status(201).json({ product });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicacao do codigo: o controller nao verifica role diretamente porque a rota ja faz isso antes.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `server/src/routes/admin-products.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/routes/admin-products.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/routes/admin-products.routes.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/routes/admin-products.routes.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/routes/admin-products.routes.js`.

```js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { createProductController } from "../controllers/admin-products.controller.js";

export const adminProductsRoutes = Router();

adminProductsRoutes.post(
    "/products",
    requireAuth,
    requireRole(ROLES.ADMIN),
    createProductController,
);
```

5. Explicacao do codigo: a rota final e `POST /api/admin/products`. Sem cookie valido recebe `401`; com cliente recebe `403`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 9 - Criar ou editar `server/src/app.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/app.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/app.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/app.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Editar `server/src/app.js` e substituir pelo ficheiro completo abaixo, preservando rotas anteriores e acrescentando produtos admin.

```js
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { adminUsersRoutes } from "./routes/admin-users.routes.js";
import { adminProductsRoutes } from "./routes/admin-products.routes.js";
import { preferencesRoutes } from "./routes/preferences.routes.js";
import { profileRoutes } from "./routes/profile.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createApp() {
    const app = express();

    app.use(cors({ origin: env.clientOrigin, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", app: "orelle" });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/profile", profileRoutes);
    app.use("/api/preferences", preferencesRoutes);
    app.use("/api/admin", adminUsersRoutes);
    app.use("/api/admin", adminProductsRoutes);

    app.use(errorMiddleware);

    return app;
}
```

5. Explicacao do codigo: pode haver varias rotas sob `/api/admin`, desde que cada uma esteja protegida no backend. O catálogo entra na mesma API final e não depende de IA, simulação ou recomendações.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 10 - Criar ou editar `client/src/pages/AdminProductCreatePage.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/pages/AdminProductCreatePage.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/pages/AdminProductCreatePage.jsx` conforme indicado na frase abaixo.
    - LOCALIZACAO: `client/src/pages/AdminProductCreatePage.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `client/src/pages/AdminProductCreatePage.jsx`.

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function AdminProductCreatePage() {
    const [message, setMessage] = useState("");
    const [form, setForm] = useState({
        name: "",
        brandName: "",
        description: "",
        ingredientNamesText: "agua, glicerina",
        skinTypesText: "mista",
        imageUrl: "https://images.orelle.local/produto-demo.png",
        priceEuros: "19.90",
        stock: "10",
    });

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function submitProduct(event) {
        event.preventDefault();

        const ingredientNames = form.ingredientNamesText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const skinTypes = form.skinTypesText
            .split(",")
            .map((item) => item.trim().toLowerCase())
            .filter(Boolean);
        const priceCents = Math.round(Number(form.priceEuros) * 100);

        try {
            await apiRequest("/admin/products", {
                method: "POST",
                body: JSON.stringify({
                    name: form.name,
                    brandName: form.brandName,
                    description: form.description,
                    ingredientNames,
                    skinTypes,
                    imageUrl: form.imageUrl,
                    priceCents,
                    stock: Number(form.stock),
                }),
            });
            setMessage("Produto criado");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Novo produto</h1>
            <form onSubmit={submitProduct}>
                <label>
                    Nome
                    <input
                        name="name"
                        value={form.name}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Marca
                    <input
                        name="brandName"
                        value={form.brandName}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Descricao
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Ingredientes
                    <input
                        name="ingredientNamesText"
                        value={form.ingredientNamesText}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Tipos de pele
                    <input
                        name="skinTypesText"
                        value={form.skinTypesText}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Imagem URL
                    <input
                        name="imageUrl"
                        value={form.imageUrl}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Preco EUR
                    <input
                        name="priceEuros"
                        type="number"
                        step="0.01"
                        value={form.priceEuros}
                        onChange={updateField}
                    />
                </label>
                <label>
                    Stock
                    <input
                        name="stock"
                        type="number"
                        value={form.stock}
                        onChange={updateField}
                    />
                </label>
                <button type="submit">Criar produto</button>
            </form>
            {message && <p role="status">{message}</p>}
        </main>
    );
}
```

5. Explicacao do codigo: a UI converte euros para centimos antes de enviar. O backend continua a validar tudo, incluindo permissao de admin.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 11 - Criar ou editar `client/src/App.jsx`

1. Objetivo simples do passo: ligar a pagina admin de produtos a app de demonstracao sem criar routing definitivo.
2. Ficheiros envolvidos:
    - EDITAR: `client/src/App.jsx`.
    - LOCALIZACAO: substituir o ficheiro atual por esta versao completa.
    - REVER: paginas importadas abaixo e `AuthContext.jsx`.
3. O que fazer: manter as paginas anteriores e acrescentar a nova pagina deste BK.
4. Codigo completo, correto e integrado:

Editar `client/src/App.jsx` e substituir pelo ficheiro completo abaixo.

```jsx
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminProductCreatePage } from "./pages/AdminProductCreatePage.jsx";
import { EditProfilePage } from "./pages/EditProfilePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { PreferencesPage } from "./pages/PreferencesPage.jsx";
import { ProfileSetupPage } from "./pages/ProfileSetupPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

export function App() {
    return (
        <AuthProvider>
            <RegisterPage />
            <LoginPage />
            <ProfileSetupPage />
            <EditProfilePage />
            <PreferencesPage />
            <AdminProductCreatePage />
        </AuthProvider>
    );
}
```

5. Explicacao do codigo: a pagina de produtos fica visivel para demonstracao, mas a protecao real continua no backend com `requireAuth` e `requireRole`. O frontend nao substitui autorizacao.
6. Como validar: abrir o frontend e confirmar que a nova pagina consegue chamar a API com o mesmo `apiClient` e a mesma sessao segura.
7. Erro comum ou cenario negativo: deixar a pagina criada mas nao importada em `App.jsx` faz o codigo existir no repositorio, mas ficar invisivel para demonstracao e defesa.

### Passo 12 - Validar payloads e respostas esperadas

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

Criar produto:

```http
POST /api/admin/products
Cookie: orelle_session=...admin...
Content-Type: application/json

{
  "name": "Gel de Limpeza Suave",
  "brandName": "Orelle",
  "description": "Gel cosmetico de limpeza diaria para pele mista, sem promessa clinica.",
  "ingredientNames": ["agua", "glicerina"],
  "skinTypes": ["mista", "oleosa"],
  "imageUrl": "https://images.orelle.local/gel-limpeza.png",
  "priceCents": 1290,
  "stock": 25
}
```

Resposta `201`:

```json
{
    "product": {
        "id": "66c000000000000000000001",
        "name": "Gel de Limpeza Suave",
        "brandName": "Orelle",
        "priceCents": 1290,
        "stock": 25,
        "categoryIds": []
    }
}
```

Cliente tenta criar produto `403`:

```json
{
    "error": {
        "message": "Sem permissao para esta operacao"
    }
}
```

Descricao com claim medico `400`:

```json
{
    "error": {
        "message": "Produto invalido",
        "details": {
            "description": "Descricao nao pode conter claims clinicos ou medicos nao documentados"
        }
    }
}
```

### Passo 13 - Criar testes minimos

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

Criar este ficheiro em `server/tests/products.test.js`.

```js
import { describe, expect, it } from "vitest";
import { validateProductInput } from "../src/validators/product.validator.js";

describe("BK-MF0-07 / RF07 - produtos", () => {
    it("aceita produto valido", () => {
        const input = validateProductInput({
            name: "Gel de Limpeza Suave",
            brandName: "Orelle",
            description:
                "Gel cosmetico de limpeza diaria para pele mista, sem promessa clinica.",
            ingredientNames: ["agua", "glicerina"],
            skinTypes: ["mista"],
            imageUrl: "https://images.orelle.local/gel.png",
            priceCents: 1290,
            stock: 10,
        });

        expect(input.priceCents).toBe(1290);
    });

    it("rejeita preco negativo", () => {
        expect(() =>
            validateProductInput({
                name: "Produto Teste",
                brandName: "Orelle",
                description:
                    "Descricao cosmetica sem claims medicos para teste.",
                ingredientNames: ["agua"],
                skinTypes: ["mista"],
                imageUrl: "https://images.orelle.local/produto.png",
                priceCents: -1,
                stock: 10,
            }),
        ).toThrow("Produto invalido");
    });

    it("rejeita claim medico", () => {
        expect(() =>
            validateProductInput({
                name: "Produto Teste",
                brandName: "Orelle",
                description: "Este produto cura acne e remove rugas.",
                ingredientNames: ["agua"],
                skinTypes: ["mista"],
                imageUrl: "https://images.orelle.local/produto.png",
                priceCents: 1000,
                stock: 10,
            }),
        ).toThrow("Produto invalido");
    });
});
```

5. Explicacao do codigo: estes testes cobrem produto valido, preco invalido e claims proibidos. A autorizacao admin deve ser testada tambem por integration/e2e usando cookie de admin.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 14 - Confirmar bloqueios e decisoes antes do PR

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

Se `requireAuth` ou `requireRole(ROLES.ADMIN)` ainda nao existirem, nao expor `POST /api/admin/products`. Nesse caso, implementar apenas model e validator, marcar o endpoint como bloqueado e concluir primeiro `BK-MF0-02` e `BK-MF0-05`.

### Evidence para PR/defesa

- Admin cria produto com `201`.
- Cliente autenticado recebe `403`.
- Pedido sem cookie recebe `401`.
- Preco negativo ou stock negativo recebe `400`.
- Claim clinico/medico recebe `400`.
- Produto criado tem `categoryIds: []`, pronto para `BK-MF0-08`.

### Handoff para BK-MF0-08

O proximo BK deve reutilizar `Product.categoryIds` e criar `Category`. Nao deve duplicar modelo de produto.

## Changelog

- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para catálogo base de produtos.
- `2026-05-25`: reforçado blocker obrigatório quando `requireAuth`/`requireRole` não estiverem funcionais.
- `2026-05-29`: tutorial linear integrado com modelo Product, rota admin protegida, validacao de claims, payloads, UI e testes.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com codigo, explicacao, validacao e negativo no passo onde sao usados.
- `2026-05-29`: acrescentado `client/src/App.jsx` completo para ligar a pagina admin de produtos.
