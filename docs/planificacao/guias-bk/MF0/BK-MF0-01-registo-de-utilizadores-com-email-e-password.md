# BK-MF0-01 - Registo de utilizadores com email e password

## Header

- `doc_id`: `GUIA-BK-MF0-01`
- `bk_id`: `BK-MF0-01`
- `macro`: `MF0`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RF01`
- `fase_documental`: `Fase 1`
- `sprint`: `S01-S02`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF0-02`
- `guia_path`: `docs/planificacao/guias-bk/MF0/BK-MF0-01-registo-de-utilizadores-com-email-e-password.md`
- `last_updated`: `2026-05-29`

#### BK-MF0-01 - Registo de utilizadores com email e password

##### O que vamos fazer neste BK

Neste BK vamos construir a primeira base real de identidade da Orélle: o registo de utilizadores com `email` e `password`. Como o estado da app é `sem_codigo`, este BK também cria a estrutura mínima do backend e do frontend para suportar os BKs seguintes sem reescrever a fundação.

O resultado esperado é um endpoint `POST /api/auth/register`, um modelo `User`, validação de input, hashing de password com `bcrypt` e uma primeira página de registo em React. A password nunca deve ser guardada nem devolvida em texto claro.

Esta fase foi detalhada sem mockup de UI. Por isso, a interface deve ser simples, funcional e extensível, sem assumir identidade visual definitiva.

##### Porque é que isto é importante

- Cria a entidade central `User`, reutilizada por perfil, roles, preferências, uploads, histórico e compras.
- Introduz uma regra de segurança obrigatória: passwords guardadas com hash seguro, alinhada com `RNF10` sem alterar o `rf_rnf` canónico do BK.
- Ensina a separação entre rota, validação, controller, service e modelo de dados.
- Desbloqueia `BK-MF0-02`, `BK-MF0-03`, `BK-MF0-05` e, mais tarde, gestão de utilizadores em `MF4`.

##### O que entra (scope)

- Estrutura base `server/` e `client/` para uma app Node.js + Express + React.
- Modelo MongoDB/Mongoose `User`.
- Endpoint `POST /api/auth/register`.
- Validação de email e password no backend.
- Hash de password com `bcrypt`.
- Página React simples para registo.
- Smoke tests e negativos mínimos de segurança.

##### O que não entra (scope-out)

- Login, logout e cookies HttpOnly, que ficam para `BK-MF0-02`.
- Perfis detalhados de pele, que ficam para `BK-MF0-03`.
- Roles avançadas ou área de administração, que ficam para `BK-MF0-05`.
- Recuperação de password, verificação por email, OAuth ou autenticação externa.

##### Como saber que isto ficou bem

- Um utilizador válido é criado com resposta `201`.
- Um email repetido é recusado com `409`.
- Uma password fraca é recusada com `400`.
- A resposta nunca inclui `password`, `passwordHash` ou qualquer segredo.
- O frontend consegue submeter o formulário e mostrar erro/sucesso sem recarregar a página.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P0` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `M` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Bruna` (CANONICO)
- Apoio: `Izelicks` (CANONICO)
- Dependências (BK IDs): `-` (CANONICO)
- Pré-condições: documentos canónicos lidos; app ainda sem código (DERIVADO de `APP_STATE`)
- Ref. Plano: `RF01`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-AUTH-REGISTER` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF01` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-01` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-01` (CANONICO)
- Descrição: Registo de utilizadores com email e password, com persistência segura da password através de hash (CANONICO + DERIVADO de `RNF10`)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: não existe código de app; existem apenas documentos de planificação.
- Estado esperado depois do BK: backend e frontend mínimos existem, o utilizador consegue criar conta e a password fica protegida com hash.
- Ficheiros a criar: `server/package.json`, `server/src/app.js`, `server/src/server.js`, `server/src/config/env.js`, `server/src/config/db.js`, `server/src/models/user.model.js`, `server/src/routes/auth.routes.js`, `server/src/controllers/auth.controller.js`, `server/src/services/auth.service.js`, `server/src/validators/auth.validator.js`, `server/src/middlewares/error.middleware.js`, `client/package.json`, `client/src/main.jsx`, `client/src/App.jsx`, `client/src/pages/RegisterPage.jsx`, `client/src/services/apiClient.js`.
- Ficheiros a rever: `README.md`, `docs/RF.md`, `docs/RNF.md`, `docs/planificacao/backlogs/BACKLOG-MVP.md`, `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.
- Dependências de BK anteriores: nenhuma dependência canónica; este BK cria contratos iniciais.
- Impacto na arquitetura: introduz separação backend/frontend e padrão `routes -> controller -> service -> model`.
- Impacto em frontend: cria primeira página de formulário e cliente HTTP reutilizável.
- Impacto em backend: cria API Express, ligação à base de dados, modelo `User` e tratamento centralizado de erros.
- Impacto em dados: cria coleção `users` com `email`, `passwordHash`, `role`, `isActive`, timestamps.
- Impacto em segurança: password com hash; email normalizado; resposta sem campos sensíveis.
- Impacto em testes: define smoke de registo e negativos de validação/duplicação/exposição.
- Handoff para o próximo BK: `BK-MF0-02` deve reutilizar `User.passwordHash` para login e nunca comparar passwords em texto claro.

#### Pre-leitura mínima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF01`.
- `docs/RNF.md`: `RNF10`, `RNF14`, `RNF19`.
- `docs/planificacao/backlogs/BACKLOG-MVP.md`: linha `BK-MF0-01`.
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`: linha `BK-MF0-01`.
- `docs/planificacao/guias-bk/_TEMPLATE-BK.md`: contrato base de guia.
- Mockup: não existe nesta execução; usar UI simples e não definitiva.

#### Glossario (rapido) (DERIVADO):

- `Express`: framework Node.js para criar endpoints HTTP.
- `Endpoint`: rota da API que recebe um pedido e devolve uma resposta.
- `Controller`: camada que traduz HTTP para chamadas de serviço.
- `Service`: camada onde fica a regra de negócio do registo.
- `Model`: definição da estrutura persistida em MongoDB.
- `Hash`: transformação irreversível da password para não guardar o segredo original.
- `bcrypt`: biblioteca própria para hashing de passwords.
- `Validação backend`: verificação obrigatória no servidor, mesmo que o frontend valide primeiro.
- `DTO seguro`: objeto de resposta sem campos sensíveis.

#### Conceitos teoricos essenciais (DERIVADO):

O backend deve validar e proteger dados antes de os guardar. O frontend pode ajudar o utilizador com mensagens rápidas, mas nunca é uma barreira de segurança porque pode ser contornado. Por isso, email, password e duplicados são sempre verificados no backend.

O fluxo recomendado é `route -> controller -> service -> model`. A route define o caminho HTTP, o controller trata `req` e `res`, o service decide o que fazer e o model grava no MongoDB. Esta separação evita controllers gigantes e facilita testes nos BKs seguintes.

Passwords não se encriptam para login normal; guardam-se com hash. Com `bcrypt`, o sistema guarda `passwordHash` e, no login futuro, compara a password recebida com esse hash. Assim, mesmo que a base de dados seja exposta, as passwords originais não aparecem diretamente.

Um erro comum é devolver o objeto completo do utilizador criado. Isso pode expor `passwordHash`. O service deve construir explicitamente uma resposta segura, por exemplo `{ id, email, role }`.

#### Guia de execução (passo-a-passo) (DERIVADO):

0. **Objetivo (~20 min): confirmar contrato e preparar estrutura**
    - Descrição detalhada do objetivo: confirmar que o BK implementa apenas `RF01` e criar a estrutura inicial da app.
    - Justificação: como não há código, a estrutura criada aqui condiciona todos os BKs seguintes.
    - Como fazer (0.0): criar a estrutura inicial do projeto com duas áreas principais: `server` para o backend/API e `client` para o frontend. Esta separação ajuda a manter claro o que corre no servidor e o que pertence à interface do utilizador.
    - Como fazer (0.1): criar pastas `server/src` e `client/src`.
    - Como fazer (0.2): criar `package.json` separados para backend e frontend, usando ES Modules.
    - Ficheiro a rever: `docs/RF.md`.
    - Ficheiro alvo: `server/package.json`, `client/package.json`.
    - Snippet de referência: `"type": "module"`.
    - O que verificar: os comandos `npm run dev` estão definidos, mesmo que só sejam usados depois.

1. **Objetivo (~25 min): criar a app Express base**
    - Descrição detalhada do objetivo: iniciar o backend com Express, JSON parser e middleware de erro.
    - Justificação: todos os endpoints futuros precisam de uma entrada comum e previsível.
    - Como fazer (1.1): criar `server/src/app.js` com `express.json()` e rota `/api/health`.
    - Como fazer (1.2): criar `server/src/server.js` para arrancar a porta a partir do ambiente.
    - Ficheiro a rever: `docs/RNF.md`.
    - Ficheiro alvo: `server/src/app.js`.
    - Snippet de referência: `app.use('/api/auth', authRoutes);`.
    - O que verificar: `GET /api/health` responde `200`.

2. **Objetivo (~25 min): configurar MongoDB e variáveis de ambiente**
    - Descrição detalhada do objetivo: centralizar configuração de `PORT`, `MONGODB_URI` e ambiente.
    - Justificação: strings de ligação e segredos não devem ficar espalhados no código.
    - Como fazer (2.1): criar `server/src/config/env.js` com leitura de `process.env`.
    - Como fazer (2.2): criar `server/src/config/db.js` com função `connectDB`.
    - Ficheiro a rever: `docs/RNF.md`.
    - Ficheiro alvo: `server/src/config/db.js`.
    - Snippet de referência: `await mongoose.connect(env.mongodbUri);`.
    - O que verificar: o backend falha com mensagem clara se `MONGODB_URI` não existir.

3. **Objetivo (~30 min): criar o modelo User**
    - Descrição detalhada do objetivo: definir a coleção `users` com os campos mínimos para identidade.
    - Justificação: `User` será reutilizado por login, perfil, roles e preferências.
    - Como fazer (3.1): criar `email` único, normalizado e obrigatório.
    - Como fazer (3.2): criar `passwordHash`, `role: 'cliente'` e `isActive: true`.
    - Ficheiro a rever: `docs/RF.md`.
    - Ficheiro alvo: `server/src/models/user.model.js`.
    - Snippet de referência: `email: { type: String, required: true, unique: true, lowercase: true, trim: true }`.
    - O que verificar: o schema não tem campo `password` persistido.

4. **Objetivo (~35 min): validar input de registo**
    - Descrição detalhada do objetivo: rejeitar dados incompletos ou inseguros antes de chamar o service.
    - Justificação: a validação protege a base de dados e dá feedback previsível ao frontend.
    - Como fazer (4.1): criar `validateRegisterInput`.
    - Como fazer (4.2): exigir email válido e password com mínimo definido pela equipa, recomendado `8` caracteres.
    - Ficheiro a rever: `docs/RNF.md`.
    - Ficheiro alvo: `server/src/validators/auth.validator.js`.
    - Snippet de referência: `if (!email.includes('@')) errors.email = 'Email inválido';`.
    - O que verificar: pedido sem email ou password não chega ao model.

5. **Objetivo (~40 min): implementar service de registo**
    - Descrição detalhada do objetivo: normalizar email, verificar duplicados, gerar hash e criar utilizador.
    - Justificação: a regra de negócio fica testável fora do HTTP.
    - Como fazer (5.1): usar `bcrypt.hash(password, 12)`.
    - Como fazer (5.2): devolver apenas campos seguros.
    - Ficheiro a rever: `docs/RNF.md`.
    - Ficheiro alvo: `server/src/services/auth.service.js`.
    - Snippet de referência: `const passwordHash = await bcrypt.hash(password, 12);`.
    - O que verificar: `passwordHash` existe na BD, mas não aparece na resposta.

6. **Objetivo (~35 min): expor POST /api/auth/register**
    - Descrição detalhada do objetivo: ligar route, controller, validator e service.
    - Justificação: o frontend precisa de um contrato HTTP claro.
    - Como fazer (6.1): criar `auth.routes.js` com `router.post('/register', registerController)`.
    - Como fazer (6.2): no controller, responder `201` no sucesso, `400` nos inválidos e `409` em email duplicado.
    - Ficheiro a rever: `docs/RF.md`.
    - Ficheiro alvo: `server/src/controllers/auth.controller.js`.
    - Snippet de referência: `return res.status(201).json({ user });`.
    - O que verificar: os códigos HTTP são consistentes e documentados no PR.

7. **Objetivo (~45 min): criar página de registo e evidência**
    - Descrição detalhada do objetivo: criar UI mínima para submeter email/password e guardar provas do BK.
    - Justificação: a PAP precisa de app utilizável e evidência, não apenas backend.
    - Como fazer (7.1): criar `RegisterPage.jsx` com estados `idle`, `loading`, `success`, `error`.
    - Como fazer (7.2): Executar cenários negativos obrigatórios (mínimo 3) e registar resultados.
    - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
    - Ficheiro alvo: `client/src/pages/RegisterPage.jsx`.
    - Snippet de referência: `await apiClient.post('/auth/register', { email, password });`.
    - O que verificar: sucesso e erros aparecem no ecrã sem expor dados sensíveis.

#### Checklist de validação (DERIVADO):

- Smoke: criar utilizador com email novo e password válida; esperar `201` e objeto `user` sem `passwordHash`.
- Negativo 1: passo 4; input sem email; resultado esperado `400`; risco que cobre: dados incompletos entrarem na BD.
- Negativo 2: passo 5; input com email já existente; resultado esperado `409`; risco que cobre: contas duplicadas.
- Negativo 3: passo 7; inspecionar resposta após registo; resultado esperado sem `password`/`passwordHash`; risco que cobre: exposição de segredo.
- Técnico: confirmar `routes -> controller -> service -> model`.
- Regressão das fases anteriores: não aplicável; `MF0` não tem fase anterior.
- UI/mockup: fase detalhada sem mockup; formulário deve ser simples, responsivo e não definitivo.
- Segurança: password com hash `bcrypt`; sem segredos no código.

#### Critérios de aceite:

- Outputs: endpoint `POST /api/auth/register`, modelo `User`, validator, service e página `RegisterPage` criados.
- Verificações: caso válido responde `201`; dados inválidos respondem `400`; email duplicado responde `409`.
- Qualidade: código modular, sem password em texto claro, sem `passwordHash` na resposta.
- Continuidade: `BK-MF0-02` consegue usar `User.email` e `User.passwordHash` para autenticação.
- Evidência: prints ou logs do smoke, negativos e ficheiros alterados anexados ao PR/defesa.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher após validação`
- `neg`: `A preencher após testes negativos`
- `files`: `server/src/models/user.model.js`, `server/src/routes/auth.routes.js`, `server/src/services/auth.service.js`, `client/src/pages/RegisterPage.jsx`
- `commands`: `npm run dev`, `npm test`, `curl -X POST /api/auth/register`
- `screenshots`: formulário de registo com sucesso e erro
- `notes`: confirmar que não há mockup e que a UI é baseline

#### TODOs

- TODO: confirmar política exata de força da password com o orientador.
- TODO: decidir se haverá confirmação de email em fase pós-PAP.
- TODO (BLOCKER): definir `MONGODB_URI` local antes da execução real.
- FOLLOW-UP: `BK-MF0-02` deve implementar sessão HttpOnly.
- Assuncao a validar: `role` inicial `cliente` é necessário para preparar `RF05`.

## Contexto do BK

- Entrega alvo: implementar `Registo de utilizadores com email e password` com rastreabilidade direta ao requisito `RF01`.
- Foco técnico da macro: `Fundamentos e governance`.
- Regra de governança: preservar IDs BK, contrato de campos e consistência entre backlog, matriz, sprints e guias.

## Bloco pedagógico

### Objetivo

Construir o registo real de utilizadores da Orélle, explicando validação, hashing e separação de camadas.

### Pré-requisitos

- Rever `RF01`, `RNF10`, `RNF19`.
- Confirmar que não existe código prévio da app.
- Ter MongoDB local ou URI de desenvolvimento preparada.

### Erros comuns

- Guardar `password` em texto claro.
- Devolver `passwordHash` na resposta.
- Confiar apenas na validação do frontend.
- Misturar regra de negócio diretamente na route.

### Check de compreensao

- [ ] Sei explicar por que se usa hash em vez de guardar password.
- [ ] Sei localizar route, controller, service e model.
- [ ] Sei provar que email duplicado é rejeitado.

### Tempo estimado

- `M`: 2 a 4 horas, incluindo smoke, negativos e evidência.

## Bloco operacional

### Entrada

- BK: `BK-MF0-01`
- Requisito: `RF01`
- Dependências: `-`
- Artefactos: `RF.md`, `RNF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos

1. Confirmar contrato canónico do BK.
2. Criar estrutura base de backend e frontend.
3. Criar modelo `User`.
4. Criar validator de registo.
5. Criar service com `bcrypt`.
6. Criar controller e route `POST /api/auth/register`.
7. Criar formulário React de registo.
8. Executar cenários negativos obrigatórios (mínimo 3) e registar evidência.

### Cenários negativos recomendados

- Email em falta ou inválido deve devolver `400`.
- Password fraca deve devolver `400`.
- Email já registado deve devolver `409`.

### Validação

- [ ] Smoke: registo válido devolve `201`.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Técnico: não existe password em texto claro na BD.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificáveis.

### Matriz mínima de testes por prioridade

- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff

- Próximo BK recomendado: `BK-MF0-02`
- O próximo BK deve reutilizar `User.email` e `User.passwordHash`.

## Snippet técnico aplicável

O código aplicável deste BK-MF0-01 já não fica como anexo isolado. Para cumprir o contrato documental sem contrariar o formato tutorial, considera-se técnico aplicável o conjunto de blocos completos no `## Tutorial linear de implementação`, sempre ligados a `BK-MF0-01` e `RF01`.

Usar um snippet solto aqui seria pedagogicamente mais fraco: o aluno poderia copiar uma função sem perceber ficheiro, imports, validação, erro esperado e handoff. Por isso, o código foi integrado nos passos onde é usado.

## Critérios de aceite

- Entrega funcional específica de `Registo de utilizadores com email e password` validada contra `RF01`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa

- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher após validação`
- `proof_negativos`: `A preencher após testes negativos`
- `proof_negocio`: criação de conta desbloqueia perfil, sessão e personalização.

## Próximo BK recomendado

`BK-MF0-02`

## Tutorial linear de implementação

### Passo 1 - Confirmar contrato, scope e riscos

1. Objetivo simples do passo: confirmar o que este BK entrega, o que fica fora e que contratos dos BKs vizinhos não podem ser quebrados.
2. Ficheiros envolvidos:
    - CRIAR: nenhum ficheiro de aplicação neste passo.
    - EDITAR: este guia BK, apenas para orientar a implementação.
    - LOCALIZAÇÃO: ler esta secção antes de abrir o editor de código.
    - REVER: RF/RNF indicados no header, backlog, matriz, MF-VIEWS e próximo BK.
3. O que fazer: ler e respeitar as decisões abaixo antes de implementar.
4. Código completo, correto e integrado: este passo ainda não tem código; o código aparece nos passos seguintes, junto do ficheiro onde é usado.
5. Explicação didática e detalhada: este passo evita que o aluno implemente uma funcionalidade correta isoladamente, mas incoerente com a app final. Primeiro confirma-se o contrato; só depois se escreve código.
6. Como validar: confirmar que o header do BK, RF/RNF, dependências e handoff continuam iguais aos documentos canónicos.
7. Erro comum ou cenário negativo: alterar scope, IDs, roles, nomes de ficheiros ou prometer IA/recomendações/pagamentos antes da fase correta.

**Decisão técnica confirmada:**
Para evitar drift entre guias, este BK deve criar a estrutura `server/src` e `client/src`, a mesma usada pelos BKs seguintes da `MF0`. A estrutura final deste BK passa a ser:

- Backend: `server/`
- Frontend: `client/`
- API base: `/api`
- Registo: `POST /api/auth/register`

Esta decisão não altera o `bk_id`, `rf_rnf`, owner, prioridade, dependências ou escopo funcional. Apenas normaliza a localização dos ficheiros para os alunos implementarem sem ambiguidade.

**Scope-in deste passo:**

- Criar o scaffold mínimo de backend Node.js + Express.
- Criar ligação MongoDB com Mongoose.
- Criar modelo `User` com `email`, `passwordHash` e `role` por defeito `cliente`.
- Criar endpoint de registo com validação, hash bcrypt e resposta segura.
- Criar frontend mínimo com página de registo e mensagens claras.
- Criar testes de registo válido, email duplicado e resposta sem password.

**Scope-out deste passo:**

- Login, logout e cookies ficam para `BK-MF0-02`.
- Roles administrativas ficam para `BK-MF0-05`; aqui apenas se guarda a role inicial `cliente`.
- Perfil detalhado fica para `BK-MF0-03`.
- Fotografias, análise facial, simulação, recomendações e pagamentos ficam fora deste BK.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever código, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
    - CRIAR:
        - `server/package.json`
        - `server/src/config/env.js`
        - `server/src/config/db.js`
        - `server/src/middlewares/error.middleware.js`
        - `server/src/models/user.model.js`
        - `server/src/validators/auth.validator.js`
        - `server/src/services/auth.service.js`
        - `server/src/controllers/auth.controller.js`
        - `server/src/routes/auth.routes.js`
        - `server/src/app.js`
        - `server/src/server.js`
        - `server/tests/auth.register.test.js`
        - `client/package.json`
        - `client/src/services/apiClient.js`
        - `client/src/pages/RegisterPage.jsx`
        - `client/src/App.jsx`
        - `client/src/main.jsx`

    - REVER:
        - `docs/RF.md`, requisito `RF01`.
        - `docs/RNF.md`, requisito `RNF10`.
        - `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`, linha `BK-MF0-01`.
        - `docs/planificacao/guias-bk/MF0/BK-MF0-02-login-e-logout-com-sessao-segura-cookie-httponly.md`, porque o próximo BK vai reutilizar `User.passwordHash`.
    - LOCALIZAÇÃO: usar exatamente os caminhos listados; quando o ficheiro já existir, editar o ficheiro existente em vez de criar outro com nome parecido.

3. O que fazer: criar ou editar estes ficheiros pela ordem dos passos seguintes.
4. Código completo, correto e integrado: este passo ainda não tem código; ele prepara a lista para os passos de implementação.
5. Explicação didática e detalhada: mapear ficheiros antes de programar ensina separacao de responsabilidades e reduz erros de arquitetura.
6. Como validar: verificar que cada caminho aparece uma única vez e que os nomes batem com os imports dos passos seguintes.
7. Erro comum ou cenário negativo: criar ficheiros duplicados, por exemplo outro controller com nome parecido, faz a app compilar parcialmente mas falhar no fluxo completo.

### Passo 3 - Implementar código por ficheiro

1. Objetivo simples do passo: escrever cada ficheiro no local certo, mantendo o contrato com os BKs anteriores e seguintes.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: os ficheiros aparecem um a um nos subpassos abaixo.
    - LOCALIZAÇÃO: cada subpasso indica o caminho completo do ficheiro.
    - REVER: imports, exports, nomes das funções e contratos HTTP usados no handoff.
3. O que fazer: seguir os subpassos na ordem apresentada; cada bloco de código deve ser colocado no ficheiro indicado.
4. Código completo, correto e integrado: os blocos surgem imediatamente abaixo, junto do ficheiro onde são usados.
5. Explicação didática e detalhada: a ordem dos ficheiros acompanha a arquitetura da app, para o aluno perceber como dados entram, são validados, passam pelo service e chegam ao frontend.
6. Como validar: após cada ficheiro, confirmar imports/exports e mensagens de erro antes de passar ao seguinte.
7. Erro comum ou cenário negativo: copiar apenas parte do código deixa o tutorial incoerente e quebra os passos posteriores.

Como este e o primeiro BK técnico, os ficheiros acima devem ser criados de raiz. Nos BKs seguintes, quando um ficheiro já existir, o aluno deve editar esse ficheiro em vez de criar outro com nome parecido.

### Passo 4 - Criar ou editar `server/package.json`

1. Objetivo simples do passo: implementar o ficheiro `server/package.json` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/package.json` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/package.json`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/package.json`.

```json
{
    "name": "orelle-server",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "node --watch src/server.js",
        "start": "node src/server.js",
        "test": "vitest run"
    },
    "dependencies": {
        "bcryptjs": "^2.4.3",
        "cors": "^2.8.5",
        "dotenv": "^16.4.5",
        "express": "^4.19.2",
        "mongoose": "^8.5.1"
    },
    "devDependencies": {
        "supertest": "^7.0.0",
        "vitest": "^2.0.5"
    }
}
```

5. Explicação do código: este ficheiro diz ao Node que o backend usa ES Modules (`import/export`) e lista as bibliotecas minimas: Express para a API, Mongoose para MongoDB e bcrypt para guardar passwords com hash.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `server/src/config/env.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/config/env.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/config/env.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/config/env.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/config/env.js`.

```js
import "dotenv/config";

/**
 * Centraliza as variaveis de ambiente usadas pelo backend.
 * Assim evitamos espalhar process.env por muitos ficheiros.
 */
export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3001),
    mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/orelle",
    clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};
```

5. Explicação do código: este ficheiro guarda configuracoes externas. Em desenvolvimento pode usar valores por defeito; em produção, as variaveis devem vir do ambiente e não do código.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 6 - Criar ou editar `server/src/config/db.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/config/db.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/config/db.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/config/db.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/config/db.js`.

```js
import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Liga a API a MongoDB.
 * Esta função fica separada para ser reutilizada pelo server e pelos testes.
 */
export async function connectDB() {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.mongoUri);
}

export async function disconnectDB() {
    await mongoose.disconnect();
}
```

5. Explicação do código: a API precisa de uma base de dados antes de guardar utilizadores. Separar `connectDB` evita repetir a mesma ligação em varios ficheiros.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 7 - Criar ou editar `server/src/middlewares/error.middleware.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/middlewares/error.middleware.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/middlewares/error.middleware.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/middlewares/error.middleware.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/middlewares/error.middleware.js`.

```js
/**
 * Erro controlado da aplicação.
 * Usamos statusCode para devolver 400, 401, 409, etc. de forma previsivel.
 */
export class AppError extends Error {
    constructor(statusCode, message, details = undefined) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.details = details;
    }
}

/**
 * Middleware final de erro.
 * Nunca devolve stack traces ao utilizador final.
 */
export function errorMiddleware(err, req, res, next) {
    if (res.headersSent) return next(err);

    const statusCode = err.statusCode ?? 500;
    const message =
        statusCode === 500 ? "Erro interno do servidor" : err.message;

    return res.status(statusCode).json({
        error: {
            message,
            details: err.details,
        },
    });
}
```

5. Explicação do código: controllers e services podem fazer `throw new AppError(...)`; este middleware transforma isso numa resposta JSON igual para todos os endpoints.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `server/src/models/user.model.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/models/user.model.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/models/user.model.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/models/user.model.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/models/user.model.js`.

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const USER_ROLES = ["cliente", "consultor", "administrador"];

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: USER_ROLES,
            default: "cliente",
        },
    },
    {
        timestamps: true,
    },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = model("User", userSchema);
```

5. Explicação do código: `passwordHash` guarda o hash da password, não a password original. O campo fica com `select: false` para não aparecer por acidente nas respostas.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 9 - Criar ou editar `server/src/validators/auth.validator.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/validators/auth.validator.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/validators/auth.validator.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/validators/auth.validator.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/validators/auth.validator.js`.

```js
import { AppError } from "../middlewares/error.middleware.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Valida o body do registo antes de chegar ao service.
 * O objetivo é devolver erros claros e não deixar dados inválidos entrar na BD.
 */
export function validateRegisterInput(body) {
    const email = String(body.email ?? "")
        .trim()
        .toLowerCase();
    const password = String(body.password ?? "");
    const errors = {};

    if (!EMAIL_RE.test(email)) {
        errors.email = "Email invalido";
    }

    if (password.length < 8) {
        errors.password = "A password deve ter pelo menos 8 caracteres";
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        errors.password = "A password deve incluir letras e numeros";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de registo invalidos", errors);
    }

    return { email, password };
}
```

5. Explicação do código: a validação protege a aplicação de emails mal escritos e passwords demasiado fracas. A mensagem é didática, mas não guarda a password em lado nenhum.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 10 - Criar ou editar `server/src/services/auth.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/auth.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/services/auth.service.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/services/auth.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/services/auth.service.js`.

```js
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { AppError } from "../middlewares/error.middleware.js";

function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };
}

/**
 * Cria uma conta de cliente.
 * A password nunca e guardada em texto claro: primeiro passa por bcrypt.hash.
 */
export async function registerUser({ email, password }) {
    const existing = await User.findOne({ email }).select("_id");

    if (existing) {
        throw new AppError(409, "Já existe uma conta com este email");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
        email,
        passwordHash,
        role: "cliente",
    });

    return toSafeUser(user);
}
```

5. Explicação do código: o service faz a regra de negócio. Primeiro verifica duplicados, depois cria o hash seguro, guarda o utilizador e devolve apenas dados seguros.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 11 - Criar ou editar `server/src/controllers/auth.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/controllers/auth.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/controllers/auth.controller.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/controllers/auth.controller.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/controllers/auth.controller.js`.

```js
import { registerUser } from "../services/auth.service.js";
import { validateRegisterInput } from "../validators/auth.validator.js";

/**
 * Controller do registo.
 * Recebe HTTP, chama validação/service e devolve JSON.
 */
export async function registerController(req, res, next) {
    try {
        const input = validateRegisterInput(req.body);
        const user = await registerUser(input);

        return res.status(201).json({ user });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: o controller não contem regras complexas. Ele coordena: válida entrada, chama service, devolve resposta.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 12 - Criar ou editar `server/src/routes/auth.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/routes/auth.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/routes/auth.routes.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/routes/auth.routes.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/routes/auth.routes.js`.

```js
import { Router } from "express";
import { registerController } from "../controllers/auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/register", registerController);
```

5. Explicação do código: a rota completa fica `POST /api/auth/register`, porque o prefixo `/api/auth` será montado no `app.js`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 13 - Criar ou editar `server/src/app.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/app.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/app.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/app.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/app.js`.

```js
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createApp() {
    const app = express();

    app.use(cors({ origin: env.clientOrigin, credentials: true }));
    app.use(express.json());

    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", app: "orelle" });
    });

    app.use("/api/auth", authRoutes);

    app.use(errorMiddleware);

    return app;
}
```

5. Explicação do código: este ficheiro cria a app Express, ativa JSON, liga rotas e garante que erros controlados saem em JSON.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 14 - Criar ou editar `server/src/server.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/server.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/server.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/server.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/server.js`.

```js
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

await connectDB();

const app = createApp();

app.listen(env.port, () => {
    console.log(`Orelle API ativa em http://localhost:${env.port}`);
});
```

5. Explicação do código: este ficheiro arranca a aplicação. Primeiro liga a MongoDB; só depois abre a porta HTTP.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 15 - Criar ou editar `client/package.json`

1. Objetivo simples do passo: implementar o ficheiro `client/package.json` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/package.json` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/package.json`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `client/package.json`.

```json
{
    "name": "orelle-client",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite --host 127.0.0.1",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "@vitejs/plugin-react": "^4.3.1",
        "vite": "^5.3.5",
        "react": "^18.3.1",
        "react-dom": "^18.3.1"
    }
}
```

5. Explicação do código: este ficheiro prepara um frontend React com Vite. Ainda não define design final; apenas permite demonstrar o registo.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 16 - Criar ou editar `client/src/services/apiClient.js`

1. Objetivo simples do passo: implementar o ficheiro `client/src/services/apiClient.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/services/apiClient.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/services/apiClient.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `client/src/services/apiClient.js`.

```js
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001/api";

/**
 * Cliente HTTP simples para a API da Orelle.
 * Mantemos a função centralizada para não repetir fetch em todas as páginas.
 */
export async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = data?.error?.message ?? "Pedido falhou";
        throw new Error(message);
    }

    return data;
}
```

5. Explicação do código: a UI chama `apiRequest('/auth/register', ...)` e recebe dados ou erro. Assim os componentes ficam mais simples.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 17 - Criar ou editar `client/src/pages/RegisterPage.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/pages/RegisterPage.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/pages/RegisterPage.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/pages/RegisterPage.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `client/src/pages/RegisterPage.jsx`.

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function RegisterPage() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const data = await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify(form),
            });

            setStatus("success");
            setMessage(`Conta criada para ${data.user.email}`);
            setForm({ email: "", password: "" });
        } catch (err) {
            setStatus("error");
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Registo Orélle</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        autoComplete="email"
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={updateField}
                        autoComplete="new-password"
                        minLength={8}
                        required
                    />
                </label>

                <button type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "A criar..." : "Criar conta"}
                </button>
            </form>

            {message && (
                <p role={status === "error" ? "alert" : "status"}>{message}</p>
            )}
        </main>
    );
}
```

5. Explicação do código: este componente mostra um formulário, envia os dados para a API e apresenta sucesso ou erro. A password nunca e mostrada depois de submetida.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 18 - Criar ou editar `client/src/App.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/App.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/App.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/App.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `client/src/App.jsx`.

```jsx
import { RegisterPage } from "./pages/RegisterPage.jsx";

export function App() {
    return <RegisterPage />;
}
```

### Passo 19 - Criar ou editar `client/src/main.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/main.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/main.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/main.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `client/src/main.jsx`.

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
```

5. Explicação do código: estes dois ficheiros ligam o React ao HTML gerado pelo Vite e mostram a página de registo.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 20 - Validar payloads e respostas esperadas

1. Objetivo simples do passo: testar o contrato HTTP que a UI e os BKs seguintes vao usar.
2. Ficheiros envolvidos:
    - CRIAR: nenhum ficheiro novo.
    - EDITAR: nenhum ficheiro neste passo, salvo se a resposta real não bater com o contrato documentado.
    - LOCALIZAÇÃO: executar pedidos contra os endpoints implementados nos passos anteriores.
    - REVER: routes, controllers, validators e services deste BK.
3. O que fazer: usar os exemplos abaixo para confirmar pedidos válidos, respostas de sucesso e erros esperados.
4. Código completo, correto e integrado: os payloads abaixo fazem parte do contrato de API e devem bater com o código implementado.
5. Explicação didática e detalhada: payloads mostram ao aluno como o frontend comunica com o backend e que mensagens a app deve apresentar.
6. Como validar: executar os pedidos com cliente HTTP ou teste automatizado e comparar status code e JSON.
7. Erro comum ou cenário negativo: mudar nomes de campos no backend sem atualizar frontend e testes cria erros difíceis de diagnosticar.

Pedido válido:

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "cliente@orelle.test",
  "password": "PalavraPasse12345"
}
```

Resposta `201`:

```json
{
    "user": {
        "id": "66a000000000000000000001",
        "email": "cliente@orelle.test",
        "role": "cliente",
        "createdAt": "2026-05-29T10:00:00.000Z"
    }
}
```

Erro de validação `400`:

```json
{
    "error": {
        "message": "Dados de registo invalidos",
        "details": {
            "email": "Email invalido",
            "password": "A password deve incluir letras e numeros"
        }
    }
}
```

Erro de email duplicado `409`:

```json
{
    "error": {
        "message": "Já existe uma conta com este email"
    }
}
```

### Passo 21 - Criar testes minimos

1. Objetivo simples do passo: provar que o comportamento principal e os cenários negativos funcionam antes de entregar o BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: ficheiro de teste indicado abaixo.
    - LOCALIZAÇÃO: pasta de testes do backend ou frontend indicada no próprio passo.
    - REVER: validators, services, controllers e rotas usados pelo teste.
3. O que fazer: criar o teste completo abaixo e correr a suite.
4. Código completo, correto e integrado: o teste abaixo deve acompanhar o código real, não ser apenas exemplo solto.
5. Explicação didática e detalhada: testes ajudam o aluno a perceber o que significa terminar um BK: não basta escrever código, é preciso provar o comportamento.
6. Como validar: correr o comando de testes documentado no BK e confirmar que os casos positivos e negativos passam.
7. Erro comum ou cenário negativo: testar apenas o caminho feliz deixa falhas de segurança e validação por descobrir.

Criar este ficheiro em `server/tests/auth.register.test.js`.

```js
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { User } from "../src/models/user.model.js";

vi.mock("../src/models/user.model.js", () => ({
    User: {
        findOne: vi.fn(),
        create: vi.fn(),
    },
}));

describe("BK-MF0-01 / RF01 - registo", () => {
    it("cria utilizador valido sem expor password", async () => {
        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue(null),
        });
        User.create.mockResolvedValueOnce({
            _id: { toString: () => "user-1" },
            email: "cliente@orelle.test",
            role: "cliente",
            createdAt: new Date("2026-05-29T10:00:00.000Z"),
        });

        const response = await request(createApp())
            .post("/api/auth/register")
            .send({ email: "cliente@orelle.test", password: "PalavraPasse12345" });

        expect(response.status).toBe(201);
        expect(response.body.user.email).toBe("cliente@orelle.test");
        expect(response.body.user.password).toBeUndefined();
        expect(response.body.user.passwordHash).toBeUndefined();
    });

    it("rejeita email invalido", async () => {
        const response = await request(createApp())
            .post("/api/auth/register")
            .send({ email: "email-invalido", password: "PalavraPasse12345" });

        expect(response.status).toBe(400);
        expect(response.body.error.details.email).toBe("Email invalido");
    });

    it("rejeita email duplicado", async () => {
        User.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue({ _id: "user-1" }),
        });

        const response = await request(createApp())
            .post("/api/auth/register")
            .send({ email: "cliente@orelle.test", password: "PalavraPasse12345" });

        expect(response.status).toBe(409);
    });
});
```

5. Explicação do código: os testes provam o caminho feliz e dois negativos. O mock evita depender de MongoDB real durante o teste unitario/integration leve.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 22 - Confirmar bloqueios e decisões antes do PR

1. Objetivo simples do passo: identificar decisões que não podem ser inventadas durante a implementação.
2. Ficheiros envolvidos:
    - CRIAR: nenhum ficheiro de aplicação.
    - EDITAR: apenas documentos canónicos se a decisão alterar contrato, scope ou política.
    - LOCALIZAÇÃO: rever os pontos abaixo antes de abrir PR.
    - REVER: README, RF, RNF, backlog, matriz e guias dependentes.
3. O que fazer: se algum bloqueio se aplicar, parar a implementação real e atualizar primeiro a fonte documental correta.
4. Código completo, correto e integrado: este passo não adiciona código; protege a coerência do código já escrito.
5. Explicação didática e detalhada: alunos não devem preencher lacunas com suposicoes, sobretudo quando há dados sensíveis, roles ou contratos usados por outros BKs.
6. Como validar: confirmar que não ficou nenhuma decisão implicita no código.
7. Erro comum ou cenário negativo: implementar uma regra por intuicao pode funcionar hoje, mas quebrar privacidade, segurança ou o handoff de fases seguintes.

Se a equipa decidir usar uma estrutura diferente de `server/src` + `client/src`, deve atualizar antes de implementar:

- `docs/planificacao/guias-bk/MF0/BK-MF0-01-registo-de-utilizadores-com-email-e-password.md`
- todos os guias seguintes da `MF0` que referem `server/src` e `client/src`
- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF0.md`

Sem esta decisão, os alunos podem criar duas apps paralelas e quebrar o handoff para `BK-MF0-02`.

### Evidence para PR/defesa

- Mostrar output de `npm test` dentro de `server/`.
- Mostrar `POST /api/auth/register` com resposta `201`.
- Mostrar tentativa com email inválido e resposta `400`.
- Mostrar tentativa duplicada e resposta `409`.
- Confirmar no corpo da resposta que não existe `password` nem `passwordHash`.

### Handoff para BK-MF0-02

O próximo BK deve reutilizar `User.email` e `User.passwordHash` para login. Não deve criar outro modelo de utilizador nem guardar password em texto claro.

## Changelog

- `2026-04-14`: guia normalizado para contrato canónico comum.
- `2026-05-25`: guia refinado de documentação genérica para execução concreta da app Orélle.
- `2026-05-29`: tutorial linear integrado com scaffold `server/src` + `client/src`, código de registo, payloads, testes e handoff.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com código, explicação, validação e negativo no passo onde são usados.
