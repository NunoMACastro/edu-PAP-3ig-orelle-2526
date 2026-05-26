# BK-MF0-05 - Criação de roles: Cliente, Consultor, Administrador

## Header
- `doc_id`: `GUIA-BK-MF0-05`
- `bk_id`: `BK-MF0-05`
- `macro`: `MF0`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-01`
- `rf_rnf`: `RF05`
- `fase_documental`: `Fase 1`
- `sprint`: `S01-S02`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF0-06`
- `guia_path`: `docs/planificacao/guias-bk/MF0/BK-MF0-05-criacao-de-roles-cliente-consultor-administrador.md`
- `last_updated`: `2026-05-25`

#### BK-MF0-05 - Criação de roles: Cliente, Consultor, Administrador

##### O que vamos fazer neste BK

Neste BK vamos formalizar as roles canónicas da Orélle: `cliente`, `consultor` e `administrador`. Estas roles devem viver no `User`, porque representam permissões da conta, não características cosméticas do perfil.

Também vamos criar middleware de autorização por role e uma rota administrativa mínima para alterar a role de um utilizador. A criação de uma conta admin para desenvolvimento deve ser feita por seed controlada e nunca com password fixa no repositório.

Esta fase foi detalhada sem mockup. A UI administrativa, se criada, deve ser mínima e focada em prova de autorização.

##### Porque e que isto e importante

- Protege funcionalidades futuras como registar produtos, gerir utilizadores e rever recomendações.
- Evita espalhar verificações de role por controllers.
- Ensina a diferença entre autenticação (`quem és`) e autorização (`o que podes fazer`).
- Prepara `MF1`, `MF2`, `MF3`, `MF4` e `MF5`, onde Admin e Consultor têm responsabilidades diferentes.

##### O que entra (scope)

- Constantes canónicas de roles.
- Campo `role` no `User`, com default `cliente`.
- Middleware `requireRole`.
- Rota administrativa mínima para alterar role.
- Seed local controlada para criar primeiro administrador, se necessário.
- Testes de acesso negado e role inválida.

##### O que nao entra (scope-out)

- Matriz complexa de permissões por ação.
- Gestão completa de utilizadores, que fica para `RF33`/`MF4`.
- Painel visual completo de administração.
- Regras adicionais como moderador/editor, que não existem nos RF da Orélle.

##### Como saber que isto ficou bem

- Novo utilizador fica com role `cliente`.
- Apenas `administrador` consegue alterar role.
- Role inválida é rejeitada com `400`.
- Cliente autenticado recebe `403` em rota admin.
- Controllers futuros podem reutilizar `requireRole('administrador')`.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P0` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `M` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Bruna` (CANONICO)
- Apoio: `Izelicks` (CANONICO)
- Dependencias (BK IDs): `BK-MF0-01` (CANONICO)
- Pre-condicoes: `User` existe; sessão/middleware auth recomendado para testar admin (DERIVADO)
- Ref. Plano: `RF05`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-AUTH-ROLES` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF05` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-05` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-05` (CANONICO)
- Descricao: criação e aplicação das roles Cliente, Consultor e Administrador (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: existe `User`; role pode já existir como default técnico.
- Estado esperado depois do BK: roles estão centralizadas e há middleware de autorização.
- Ficheiros a criar: `server/src/constants/roles.js`, `server/src/middlewares/role.middleware.js`, `server/src/routes/admin-users.routes.js`, `server/src/controllers/admin-users.controller.js`, `server/src/services/admin-users.service.js`, `server/src/scripts/seed-admin.js`.
- Ficheiros a editar: `server/src/models/user.model.js`, `server/src/app.js`, `server/src/middlewares/auth.middleware.js`.
- Dependencias de BK anteriores: `BK-MF0-01` fornece `User`; `BK-MF0-02` fornece `requireAuth` se já executado.
- Impacto na arquitetura: separa autorização em middleware reutilizável.
- Impacto em frontend: pode criar vista simples para testar role admin; painel completo fica fora.
- Impacto em backend: protege rotas administrativas.
- Impacto em dados: role fica em `User.role`.
- Impacto em segurança: impede que clientes executem ações administrativas.
- Impacto em testes: negativos de `401`, `403` e role inválida.
- Handoff para o próximo BK: `BK-MF0-06` continua a ser funcional para `cliente`, mas BKs de admin, como produtos, reutilizam `requireRole('administrador')`.

#### Pre-leitura minima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF05`.
- `BK-MF0-01`: modelo `User`.
- `BK-MF0-02`: middleware `requireAuth`, se já executado.
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`: linha `BK-MF0-05`.
- Mockup: não existe nesta execução.

#### Glossario (rapido) (DERIVADO):

- `Role`: papel do utilizador no sistema.
- `Autenticação`: confirmar identidade.
- `Autorização`: confirmar permissão.
- `RBAC`: Role-Based Access Control, permissões baseadas em roles.
- `403`: autenticado, mas sem permissão.
- `Seed`: script para criar dados iniciais de desenvolvimento.
- `Princípio do menor privilégio`: utilizador recebe apenas permissões necessárias.
- `Middleware de autorização`: camada que bloqueia ações antes do controller.

#### Conceitos teoricos essenciais (DERIVADO):

Autenticação e autorização não são a mesma coisa. Login prova que o utilizador é quem diz ser. Role decide se esse utilizador pode executar uma ação, como registar produtos ou rever recomendações.

O padrão RBAC é simples e adequado para PAP: cada utilizador tem uma role e as rotas sensíveis indicam que roles podem entrar. Não é preciso criar uma matriz complexa de permissões nesta fase.

Seeds devem ser controladas. Um script de seed pode criar um admin local, mas a password deve vir de variável de ambiente e nunca ficar escrita no repositório.

#### Guia de execucao (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): definir roles canónicas**
   - Descricao detalhada do objetivo: centralizar `cliente`, `consultor`, `administrador`.
   - Justificacao: strings repetidas geram bugs difíceis de encontrar.
   - Como fazer (0.1): criar `ROLES`.
   - Como fazer (0.2): exportar lista para validação.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/constants/roles.js`.
   - Snippet de referencia: `export const ROLES = Object.freeze({ CLIENTE: 'cliente', CONSULTOR: 'consultor', ADMIN: 'administrador' });`.
   - O que verificar: não existem roles fora de `RF05`.

1. **Objetivo (~25 min): alinhar User com roles**
   - Descricao detalhada do objetivo: garantir que todo `User` tem role válida.
   - Justificacao: autorização depende de role consistente.
   - Como fazer (1.1): definir `enum` no schema.
   - Como fazer (1.2): usar default `cliente`.
   - Ficheiro a rever: `server/src/models/user.model.js`.
   - Ficheiro alvo: `server/src/models/user.model.js`.
   - Snippet de referencia: `role: { type: String, enum: Object.values(ROLES), default: ROLES.CLIENTE }`.
   - O que verificar: registo novo continua funcional.

2. **Objetivo (~30 min): criar requireRole**
   - Descricao detalhada do objetivo: middleware que verifica role depois de `requireAuth`.
   - Justificacao: controllers não devem repetir lógica de permissões.
   - Como fazer (2.1): aceitar lista de roles permitidas.
   - Como fazer (2.2): devolver `403` se `req.user.role` não estiver autorizada.
   - Ficheiro a rever: `server/src/middlewares/auth.middleware.js`.
   - Ficheiro alvo: `server/src/middlewares/role.middleware.js`.
   - Snippet de referencia: `export const requireRole = (...roles) => (req, res, next) => { ... };`.
   - O que verificar: sem auth devolve `401`; role errada devolve `403`.

3. **Objetivo (~35 min): criar service administrativo de roles**
   - Descricao detalhada do objetivo: permitir alterar role de um utilizador existente.
   - Justificacao: `RF05` pede criação de roles e o Admin precisa de atribuí-las.
   - Como fazer (3.1): validar `targetUserId` e `role`.
   - Como fazer (3.2): atualizar apenas o campo `role`.
   - Ficheiro a rever: `server/src/models/user.model.js`.
   - Ficheiro alvo: `server/src/services/admin-users.service.js`.
   - Snippet de referencia: `return User.findByIdAndUpdate(userId, { role }, { new: true });`.
   - O que verificar: password e perfil não são alterados.

4. **Objetivo (~30 min): criar rota protegida de alteração de role**
   - Descricao detalhada do objetivo: expor `PATCH /api/admin/users/:id/role`.
   - Justificacao: rotas administrativas devem ficar claramente separadas.
   - Como fazer (4.1): aplicar `requireAuth`.
   - Como fazer (4.2): aplicar `requireRole(ROLES.ADMIN)`.
   - Ficheiro a rever: `server/src/app.js`.
   - Ficheiro alvo: `server/src/routes/admin-users.routes.js`.
   - Snippet de referencia: `router.patch('/users/:id/role', requireAuth, requireRole(ROLES.ADMIN), updateUserRoleController);`.
   - O que verificar: cliente recebe `403`.

5. **Objetivo (~30 min): preparar seed de admin local**
   - Descricao detalhada do objetivo: permitir testar admin sem hardcode de credenciais.
   - Justificacao: sem admin inicial não se consegue demonstrar a rota protegida.
   - Como fazer (5.1): criar script que lê `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
   - Como fazer (5.2): criar ou atualizar user com role `administrador`.
   - Ficheiro a rever: `server/src/services/auth.service.js`.
   - Ficheiro alvo: `server/src/scripts/seed-admin.js`.
   - Snippet de referencia: `if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD obrigatório');`.
   - O que verificar: não há password fixa no ficheiro.

6. **Objetivo (~35 min): criar teste visual mínimo**
   - Descricao detalhada do objetivo: provar a diferença entre cliente e administrador.
   - Justificacao: ajuda a defesa e evita confusão de permissões.
   - Como fazer (6.1): mostrar role atual numa área simples de conta.
   - Como fazer (6.2): esconder links admin se role não for `administrador`.
   - Ficheiro a rever: `client/src/context/AuthContext.jsx`.
   - Ficheiro alvo: `client/src/App.jsx`.
   - Snippet de referencia: `{user?.role === 'administrador' && <AdminLink />}`.
   - O que verificar: esconder link não substitui proteção backend.

7. **Objetivo (~45 min): validar autorização e handoff**
   - Descricao detalhada do objetivo: testar admin, cliente, sem sessão e role inválida.
   - Justificacao: permissões mal testadas geram falhas críticas em fases futuras.
   - Como fazer (7.1): criar testes de integração para rota admin.
   - Como fazer (7.2): Executar cenarios negativos obrigatorios (minimo 3) e registar resultados.
   - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
   - Ficheiro alvo: `server/tests/roles.test.js`.
   - Snippet de referencia: `expect(clienteResponse.status).toBe(403);`.
   - O que verificar: Admin consegue; Cliente não consegue; role inválida falha.

#### Checklist de validacao (DERIVADO):

- Smoke: administrador altera role de um utilizador para `consultor` e recebe `200`.
- Negativo 1: passo 4; cliente chama rota admin; resultado esperado `403`; risco que cobre: escalada de privilégios.
- Negativo 2: passo 4; pedido sem sessão; resultado esperado `401`; risco que cobre: acesso anónimo.
- Negativo 3: passo 3; role `moderador`; resultado esperado `400`; risco que cobre: roles fora do contrato.
- Tecnico: roles estão centralizadas em `roles.js`.
- Regressao das fases anteriores: registo continua a criar `cliente`.
- UI/mockup: sem mockup; feedback mínimo de role atual.
- Seguranca: password de seed admin não existe no repositório.

#### Criterios de aceite:

- Outputs: constantes de role, middleware `requireRole`, rota admin de alteração de role e seed controlada.
- Verificacoes: admin autorizado `200`; cliente `403`; sem sessão `401`; role inválida `400`.
- Qualidade: roles canónicas sem inventar papéis extra.
- Continuidade: `BK-MF0-07` usa `requireRole('administrador')` para produtos.
- Evidencia: testes ou curl com admin/cliente e seed sem segredo hardcoded.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher apos validacao`
- `neg`: `A preencher apos testes negativos`
- `files`: `server/src/constants/roles.js`, `server/src/middlewares/role.middleware.js`, `server/src/routes/admin-users.routes.js`
- `commands`: `npm run seed:admin`, `curl -X PATCH /api/admin/users/:id/role`
- `screenshots`: conta com role visível ou tentativa negada
- `notes`: roles limitadas a Cliente, Consultor e Administrador

#### TODOs

- TODO: confirmar se seed admin fica ativo apenas em desenvolvimento.
- TODO: definir procedimento de criação do primeiro admin em produção controlada.
- TODO (BLOCKER): sem `requireAuth`, a rota admin não pode ser considerada segura.
- FOLLOW-UP: `MF4` deve expandir gestão de utilizadores sem alterar roles canónicas.

## Contexto do BK
- Entrega alvo: implementar `Criação de roles: Cliente, Consultor, Administrador` com rastreabilidade direta ao requisito `RF05`.
- Foco tecnico da macro: `Fundamentos e governance`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Criar roles canónicas e autorização por role para proteger fluxos administrativos.

### Pre-requisitos
- Rever `RF05`.
- Ter `User` de `BK-MF0-01`.
- Ter ou preparar autenticação para testar a role.

### Erros comuns
- Criar roles não documentadas.
- Confiar apenas em esconder botões no frontend.
- Guardar password de admin no repositório.

### Check de compreensao
- [ ] Sei explicar autenticação vs autorização.
- [ ] Sei distinguir `401` de `403`.
- [ ] Sei provar que cliente não executa rota admin.

### Tempo estimado
- `M`: 2 a 4 horas.

## Bloco operacional
### Entrada
- BK: `BK-MF0-05`
- Requisito: `RF05`
- Dependencias: `BK-MF0-01`
- Artefactos: `RF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos
1. Centralizar roles canónicas.
2. Garantir role no `User`.
3. Criar middleware `requireRole`.
4. Criar service de alteração de role.
5. Criar rota admin protegida.
6. Criar seed admin controlada.
7. Validar UI mínima de role.
8. Executar cenarios negativos obrigatorios (minimo 3) e registar evidência.

### Cenarios negativos recomendados
- Cliente em rota admin deve devolver `403`.
- Pedido sem sessão deve devolver `401`.
- Role inválida deve devolver `400`.

### Validacao
- [ ] Smoke: admin altera role com sucesso.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: roles centralizadas e sem strings soltas relevantes.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF0-06`
- Produtos e administração devem reutilizar `requireRole`.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF0-05';
const REQ_ID = 'RF05';
const MIN_NEGATIVOS = 3;
const ROLES_CANONICAS = ['cliente', 'consultor', 'administrador'];

export function validarEvidenceBkMf005({ smokeOk, negativos, testedRole }) {
  if (!smokeOk) throw new Error(`${BK_ID}/${REQ_ID}: smoke de roles falhou`);
  if (negativos < 3) throw new Error(`${BK_ID}/${REQ_ID}: negativos insuficientes`);
  if (!ROLES_CANONICAS.includes(testedRole)) throw new Error(`${BK_ID}/${REQ_ID}: role fora do contrato`);
  return { bkId: BK_ID, reqId: REQ_ID, minNegativos: MIN_NEGATIVOS, status: 'OK' };
}
```

## Criterios de aceite
- Entrega funcional especifica de `Criação de roles: Cliente, Consultor, Administrador` validada contra `RF05`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher apos validacao`
- `proof_negativos`: `A preencher apos testes negativos`
- `proof_negocio`: roles desbloqueiam catálogo admin e gestão operacional; revisão de recomendações fica para fases posteriores.

## Proximo BK recomendado
`BK-MF0-06`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para RBAC mínimo da Orélle.
