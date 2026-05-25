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
- `last_updated`: `2026-05-25`

#### BK-MF0-01 - Registo de utilizadores com email e password

##### O que vamos fazer neste BK

Neste BK vamos construir a primeira base real de identidade da Orélle: o registo de utilizadores com `email` e `password`. Como o estado da app é `sem_codigo`, este BK também cria a estrutura mínima do backend e do frontend para suportar os BKs seguintes sem reescrever a fundação.

O resultado esperado é um endpoint `POST /api/auth/register`, um modelo `User`, validação de input, hashing de password com `bcrypt` e uma primeira página de registo em React. A password nunca deve ser guardada nem devolvida em texto claro.

Esta fase foi detalhada sem mockup de UI. Por isso, a interface deve ser simples, funcional e extensível, sem assumir identidade visual definitiva.

##### Porque e que isto e importante

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

##### O que nao entra (scope-out)

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
- Dependencias (BK IDs): `-` (CANONICO)
- Pre-condicoes: documentos canónicos lidos; app ainda sem código (DERIVADO de `APP_STATE`)
- Ref. Plano: `RF01`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-AUTH-REGISTER` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF01` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-01` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-01` (CANONICO)
- Descricao: Registo de utilizadores com email e password, com persistência segura da password através de hash (CANONICO + DERIVADO de `RNF10`)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: não existe código de app; existem apenas documentos de planificação.
- Estado esperado depois do BK: backend e frontend mínimos existem, o utilizador consegue criar conta e a password fica protegida com hash.
- Ficheiros a criar: `server/package.json`, `server/src/app.js`, `server/src/server.js`, `server/src/config/env.js`, `server/src/config/db.js`, `server/src/models/user.model.js`, `server/src/routes/auth.routes.js`, `server/src/controllers/auth.controller.js`, `server/src/services/auth.service.js`, `server/src/validators/auth.validator.js`, `server/src/middlewares/error.middleware.js`, `client/package.json`, `client/src/main.jsx`, `client/src/App.jsx`, `client/src/pages/RegisterPage.jsx`, `client/src/services/apiClient.js`.
- Ficheiros a rever: `README.md`, `docs/RF.md`, `docs/RNF.md`, `docs/planificacao/backlogs/BACKLOG-MVP.md`, `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`.
- Dependencias de BK anteriores: nenhuma dependência canónica; este BK cria contratos iniciais.
- Impacto na arquitetura: introduz separação backend/frontend e padrão `routes -> controller -> service -> model`.
- Impacto em frontend: cria primeira página de formulário e cliente HTTP reutilizável.
- Impacto em backend: cria API Express, ligação à base de dados, modelo `User` e tratamento centralizado de erros.
- Impacto em dados: cria coleção `users` com `email`, `passwordHash`, `role`, `isActive`, timestamps.
- Impacto em segurança: password com hash; email normalizado; resposta sem campos sensíveis.
- Impacto em testes: define smoke de registo e negativos de validação/duplicação/exposição.
- Handoff para o próximo BK: `BK-MF0-02` deve reutilizar `User.passwordHash` para login e nunca comparar passwords em texto claro.

#### Pre-leitura minima (10-15 min) (DERIVADO):

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

#### Guia de execucao (passo-a-passo) (DERIVADO):

0. **Objetivo (~20 min): confirmar contrato e preparar estrutura**
   - Descricao detalhada do objetivo: confirmar que o BK implementa apenas `RF01` e criar a estrutura inicial da app.
   - Justificacao: como não há código, a estrutura criada aqui condiciona todos os BKs seguintes.
   - Como fazer (0.1): criar pastas `server/src` e `client/src`.
   - Como fazer (0.2): criar `package.json` separados para backend e frontend, usando ES Modules.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/package.json`, `client/package.json`.
   - Snippet de referencia: `"type": "module"`.
   - O que verificar: os comandos `npm run dev` estão definidos, mesmo que só sejam usados depois.

1. **Objetivo (~25 min): criar a app Express base**
   - Descricao detalhada do objetivo: iniciar o backend com Express, JSON parser e middleware de erro.
   - Justificacao: todos os endpoints futuros precisam de uma entrada comum e previsível.
   - Como fazer (1.1): criar `server/src/app.js` com `express.json()` e rota `/api/health`.
   - Como fazer (1.2): criar `server/src/server.js` para arrancar a porta a partir do ambiente.
   - Ficheiro a rever: `docs/RNF.md`.
   - Ficheiro alvo: `server/src/app.js`.
   - Snippet de referencia: `app.use('/api/auth', authRoutes);`.
   - O que verificar: `GET /api/health` responde `200`.

2. **Objetivo (~25 min): configurar MongoDB e variáveis de ambiente**
   - Descricao detalhada do objetivo: centralizar configuração de `PORT`, `MONGODB_URI` e ambiente.
   - Justificacao: strings de ligação e segredos não devem ficar espalhados no código.
   - Como fazer (2.1): criar `server/src/config/env.js` com leitura de `process.env`.
   - Como fazer (2.2): criar `server/src/config/db.js` com função `connectDB`.
   - Ficheiro a rever: `docs/RNF.md`.
   - Ficheiro alvo: `server/src/config/db.js`.
   - Snippet de referencia: `await mongoose.connect(env.mongodbUri);`.
   - O que verificar: o backend falha com mensagem clara se `MONGODB_URI` não existir.

3. **Objetivo (~30 min): criar o modelo User**
   - Descricao detalhada do objetivo: definir a coleção `users` com os campos mínimos para identidade.
   - Justificacao: `User` será reutilizado por login, perfil, roles e preferências.
   - Como fazer (3.1): criar `email` único, normalizado e obrigatório.
   - Como fazer (3.2): criar `passwordHash`, `role: 'cliente'` e `isActive: true`.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/models/user.model.js`.
   - Snippet de referencia: `email: { type: String, required: true, unique: true, lowercase: true, trim: true }`.
   - O que verificar: o schema não tem campo `password` persistido.

4. **Objetivo (~35 min): validar input de registo**
   - Descricao detalhada do objetivo: rejeitar dados incompletos ou inseguros antes de chamar o service.
   - Justificacao: a validação protege a base de dados e dá feedback previsível ao frontend.
   - Como fazer (4.1): criar `validateRegisterInput`.
   - Como fazer (4.2): exigir email válido e password com mínimo definido pela equipa, recomendado `8` caracteres.
   - Ficheiro a rever: `docs/RNF.md`.
   - Ficheiro alvo: `server/src/validators/auth.validator.js`.
   - Snippet de referencia: `if (!email.includes('@')) errors.email = 'Email inválido';`.
   - O que verificar: pedido sem email ou password não chega ao model.

5. **Objetivo (~40 min): implementar service de registo**
   - Descricao detalhada do objetivo: normalizar email, verificar duplicados, gerar hash e criar utilizador.
   - Justificacao: a regra de negócio fica testável fora do HTTP.
   - Como fazer (5.1): usar `bcrypt.hash(password, 12)`.
   - Como fazer (5.2): devolver apenas campos seguros.
   - Ficheiro a rever: `docs/RNF.md`.
   - Ficheiro alvo: `server/src/services/auth.service.js`.
   - Snippet de referencia: `const passwordHash = await bcrypt.hash(password, 12);`.
   - O que verificar: `passwordHash` existe na BD, mas não aparece na resposta.

6. **Objetivo (~35 min): expor POST /api/auth/register**
   - Descricao detalhada do objetivo: ligar route, controller, validator e service.
   - Justificacao: o frontend precisa de um contrato HTTP claro.
   - Como fazer (6.1): criar `auth.routes.js` com `router.post('/register', registerController)`.
   - Como fazer (6.2): no controller, responder `201` no sucesso, `400` nos inválidos e `409` em email duplicado.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/controllers/auth.controller.js`.
   - Snippet de referencia: `return res.status(201).json({ user });`.
   - O que verificar: os códigos HTTP são consistentes e documentados no PR.

7. **Objetivo (~45 min): criar página de registo e evidência**
   - Descricao detalhada do objetivo: criar UI mínima para submeter email/password e guardar provas do BK.
   - Justificacao: a PAP precisa de app utilizável e evidência, não apenas backend.
   - Como fazer (7.1): criar `RegisterPage.jsx` com estados `idle`, `loading`, `success`, `error`.
   - Como fazer (7.2): Executar cenarios negativos obrigatorios (minimo 3) e registar resultados.
   - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
   - Ficheiro alvo: `client/src/pages/RegisterPage.jsx`.
   - Snippet de referencia: `await apiClient.post('/auth/register', { email, password });`.
   - O que verificar: sucesso e erros aparecem no ecrã sem expor dados sensíveis.

#### Checklist de validacao (DERIVADO):

- Smoke: criar utilizador com email novo e password válida; esperar `201` e objeto `user` sem `passwordHash`.
- Negativo 1: passo 4; input sem email; resultado esperado `400`; risco que cobre: dados incompletos entrarem na BD.
- Negativo 2: passo 5; input com email já existente; resultado esperado `409`; risco que cobre: contas duplicadas.
- Negativo 3: passo 7; inspecionar resposta após registo; resultado esperado sem `password`/`passwordHash`; risco que cobre: exposição de segredo.
- Tecnico: confirmar `routes -> controller -> service -> model`.
- Regressao das fases anteriores: não aplicável; `MF0` não tem fase anterior.
- UI/mockup: fase detalhada sem mockup; formulário deve ser simples, responsivo e não definitivo.
- Seguranca: password com hash `bcrypt`; sem segredos no código.

#### Criterios de aceite:

- Outputs: endpoint `POST /api/auth/register`, modelo `User`, validator, service e página `RegisterPage` criados.
- Verificacoes: caso válido responde `201`; dados inválidos respondem `400`; email duplicado responde `409`.
- Qualidade: código modular, sem password em texto claro, sem `passwordHash` na resposta.
- Continuidade: `BK-MF0-02` consegue usar `User.email` e `User.passwordHash` para autenticação.
- Evidencia: prints ou logs do smoke, negativos e ficheiros alterados anexados ao PR/defesa.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher apos validacao`
- `neg`: `A preencher apos testes negativos`
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
- Foco tecnico da macro: `Fundamentos e governance`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Construir o registo real de utilizadores da Orélle, explicando validação, hashing e separação de camadas.

### Pre-requisitos
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
- Dependencias: `-`
- Artefactos: `RF.md`, `RNF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos
1. Confirmar contrato canónico do BK.
2. Criar estrutura base de backend e frontend.
3. Criar modelo `User`.
4. Criar validator de registo.
5. Criar service com `bcrypt`.
6. Criar controller e route `POST /api/auth/register`.
7. Criar formulário React de registo.
8. Executar cenarios negativos obrigatorios (minimo 3) e registar evidência.

### Cenarios negativos recomendados
- Email em falta ou inválido deve devolver `400`.
- Password fraca deve devolver `400`.
- Email já registado deve devolver `409`.

### Validacao
- [ ] Smoke: registo válido devolve `201`.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: não existe password em texto claro na BD.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF0-02`
- O próximo BK deve reutilizar `User.email` e `User.passwordHash`.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF0-01';
const REQ_ID = 'RF01';
const MIN_NEGATIVOS = 3;

export function validarEvidenceBkMf001({ smokeOk, negativos, responseBody }) {
  if (!smokeOk) throw new Error(`${BK_ID}/${REQ_ID}: smoke de registo falhou`);
  if (negativos < 3) throw new Error(`${BK_ID}/${REQ_ID}: negativos insuficientes`);
  if ('passwordHash' in responseBody || 'password' in responseBody) {
    throw new Error(`${BK_ID}/${REQ_ID}: resposta expõe dados sensíveis`);
  }
  return { bkId: BK_ID, reqId: REQ_ID, minNegativos: MIN_NEGATIVOS, status: 'OK' };
}
```

## Criterios de aceite
- Entrega funcional especifica de `Registo de utilizadores com email e password` validada contra `RF01`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher apos validacao`
- `proof_negativos`: `A preencher apos testes negativos`
- `proof_negocio`: criação de conta desbloqueia perfil, sessão e personalização.

## Proximo BK recomendado
`BK-MF0-02`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado de documentação genérica para execução concreta da app Orélle.
