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
- `last_updated`: `2026-05-29`

#### BK-MF0-05 - Criação de roles: Cliente, Consultor, Administrador

##### O que vamos fazer neste BK

Neste BK vamos formalizar as roles canónicas da Orélle: `cliente`, `consultor` e `administrador`. Estas roles devem viver no `User`, porque representam permissões da conta, não características cosméticas do perfil.

Também vamos criar middleware de autorização por role e uma rota administrativa mínima para alterar a role de um utilizador. A criação de uma conta admin para desenvolvimento deve ser feita por seed controlada e nunca com password fixa no repositório.

Esta fase foi detalhada sem mockup. A UI administrativa, se criada, deve ser mínima e focada em prova de autorização.

##### Porque é que isto é importante

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

##### O que não entra (scope-out)

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
- Dependências (BK IDs): `BK-MF0-01` (CANONICO)
- Pré-condições: `User` existe; sessão/middleware auth recomendado para testar admin (DERIVADO)
- Ref. Plano: `RF05`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-AUTH-ROLES` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF05` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-05` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-05` (CANONICO)
- Descrição: criação e aplicação das roles Cliente, Consultor e Administrador (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: existe `User`; role pode já existir como default técnico.
- Estado esperado depois do BK: roles estão centralizadas e há middleware de autorização.
- Ficheiros a criar: `server/src/constants/roles.js`, `server/src/middlewares/role.middleware.js`, `server/src/routes/admin-users.routes.js`, `server/src/controllers/admin-users.controller.js`, `server/src/services/admin-users.service.js`, `server/src/scripts/seed-admin.js`.
- Ficheiros a editar: `server/src/models/user.model.js`, `server/src/app.js`, `server/src/middlewares/auth.middleware.js`.
- Dependências de BK anteriores: `BK-MF0-01` fornece `User`; `BK-MF0-02` fornece `requireAuth` se já executado.
- Impacto na arquitetura: separa autorização em middleware reutilizável.
- Impacto em frontend: pode criar vista simples para testar role admin; painel completo fica fora.
- Impacto em backend: protege rotas administrativas.
- Impacto em dados: role fica em `User.role`.
- Impacto em segurança: impede que clientes executem ações administrativas.
- Impacto em testes: negativos de `401`, `403` e role inválida.
- Handoff para o próximo BK: `BK-MF0-06` continua a ser funcional para `cliente`, mas BKs de admin, como produtos, reutilizam `requireRole('administrador')`.

#### Pre-leitura mínima (10-15 min) (DERIVADO):

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

#### Guia de execução (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): definir roles canónicas**
    - Descrição detalhada do objetivo: centralizar `cliente`, `consultor`, `administrador`.
    - Justificação: strings repetidas geram bugs difíceis de encontrar.
    - Como fazer (0.1): criar `ROLES`.
    - Como fazer (0.2): exportar lista para validação.
    - Ficheiro a rever: `docs/RF.md`.
    - Ficheiro alvo: `server/src/constants/roles.js`.
    - Snippet de referência: `export const ROLES = Object.freeze({ CLIENTE: 'cliente', CONSULTOR: 'consultor', ADMIN: 'administrador' });`.
    - O que verificar: não existem roles fora de `RF05`.

1. **Objetivo (~25 min): alinhar User com roles**
    - Descrição detalhada do objetivo: garantir que todo `User` tem role válida.
    - Justificação: autorização depende de role consistente.
    - Como fazer (1.1): definir `enum` no schema.
    - Como fazer (1.2): usar default `cliente`.
    - Ficheiro a rever: `server/src/models/user.model.js`.
    - Ficheiro alvo: `server/src/models/user.model.js`.
    - Snippet de referência: `role: { type: String, enum: Object.values(ROLES), default: ROLES.CLIENTE }`.
    - O que verificar: registo novo continua funcional.

2. **Objetivo (~30 min): criar requireRole**
    - Descrição detalhada do objetivo: middleware que verifica role depois de `requireAuth`.
    - Justificação: controllers não devem repetir lógica de permissões.
    - Como fazer (2.1): aceitar lista de roles permitidas.
    - Como fazer (2.2): devolver `403` se `req.user.role` não estiver autorizada.
    - Ficheiro a rever: `server/src/middlewares/auth.middleware.js`.
    - Ficheiro alvo: `server/src/middlewares/role.middleware.js`.
    - Snippet de referência: `export const requireRole = (...roles) => (req, res, next) => { ... };`.
    - O que verificar: sem auth devolve `401`; role errada devolve `403`.

3. **Objetivo (~35 min): criar service administrativo de roles**
    - Descrição detalhada do objetivo: permitir alterar role de um utilizador existente.
    - Justificação: `RF05` pede criação de roles e o Admin precisa de atribuí-las.
    - Como fazer (3.1): validar `targetUserId` e `role`.
    - Como fazer (3.2): atualizar apenas o campo `role`.
    - Ficheiro a rever: `server/src/models/user.model.js`.
    - Ficheiro alvo: `server/src/services/admin-users.service.js`.
    - Snippet de referência: `return User.findByIdAndUpdate(userId, { role }, { new: true });`.
    - O que verificar: password e perfil não são alterados.

4. **Objetivo (~30 min): criar rota protegida de alteração de role**
    - Descrição detalhada do objetivo: expor `PATCH /api/admin/users/:id/role`.
    - Justificação: rotas administrativas devem ficar claramente separadas.
    - Como fazer (4.1): aplicar `requireAuth`.
    - Como fazer (4.2): aplicar `requireRole(ROLES.ADMIN)`.
    - Ficheiro a rever: `server/src/app.js`.
    - Ficheiro alvo: `server/src/routes/admin-users.routes.js`.
    - Snippet de referência: `router.patch('/users/:id/role', requireAuth, requireRole(ROLES.ADMIN), updateUserRoleController);`.
    - O que verificar: cliente recebe `403`.

5. **Objetivo (~30 min): preparar seed de admin local**
    - Descrição detalhada do objetivo: permitir testar admin sem hardcode de credenciais.
    - Justificação: sem admin inicial não se consegue demonstrar a rota protegida.
    - Como fazer (5.1): criar script que lê `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
    - Como fazer (5.2): criar ou atualizar user com role `administrador`.
    - Ficheiro a rever: `server/src/services/auth.service.js`.
    - Ficheiro alvo: `server/src/scripts/seed-admin.js`.
    - Snippet de referência: `if (!process.env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD obrigatório');`.
    - O que verificar: não há password fixa no ficheiro.

6. **Objetivo (~35 min): criar teste visual mínimo**
    - Descrição detalhada do objetivo: provar a diferença entre cliente e administrador.
    - Justificação: ajuda a defesa e evita confusão de permissões.
    - Como fazer (6.1): mostrar role atual numa área simples de conta.
    - Como fazer (6.2): esconder links admin se role não for `administrador`.
    - Ficheiro a rever: `client/src/context/AuthContext.jsx`.
    - Ficheiro alvo: `client/src/App.jsx`.
    - Snippet de referência: `{user?.role === 'administrador' && <AdminLink />}`.
    - O que verificar: esconder link não substitui proteção backend.

7. **Objetivo (~45 min): validar autorização e handoff**
    - Descrição detalhada do objetivo: testar admin, cliente, sem sessão e role inválida.
    - Justificação: permissões mal testadas geram falhas críticas em fases futuras.
    - Como fazer (7.1): criar testes de integração para rota admin.
    - Como fazer (7.2): Executar cenários negativos obrigatórios (mínimo 3) e registar resultados.
    - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
    - Ficheiro alvo: `server/tests/roles.test.js`.
    - Snippet de referência: `expect(clienteResponse.status).toBe(403);`.
    - O que verificar: Admin consegue; Cliente não consegue; role inválida falha.

#### Checklist de validação (DERIVADO):

- Smoke: administrador altera role de um utilizador para `consultor` e recebe `200`.
- Negativo 1: passo 4; cliente chama rota admin; resultado esperado `403`; risco que cobre: escalada de privilégios.
- Negativo 2: passo 4; pedido sem sessão; resultado esperado `401`; risco que cobre: acesso anónimo.
- Negativo 3: passo 3; role `moderador`; resultado esperado `400`; risco que cobre: roles fora do contrato.
- Técnico: roles estão centralizadas em `roles.js`.
- Regressão das fases anteriores: registo continua a criar `cliente`.
- UI/mockup: sem mockup; feedback mínimo de role atual.
- Segurança: password de seed admin não existe no repositório.

#### Critérios de aceite:

- Outputs: constantes de role, middleware `requireRole`, rota admin de alteração de role e seed controlada.
- Verificações: admin autorizado `200`; cliente `403`; sem sessão `401`; role inválida `400`.
- Qualidade: roles canónicas sem inventar papéis extra.
- Continuidade: `BK-MF0-07` usa `requireRole('administrador')` para produtos.
- Evidência: testes ou curl com admin/cliente e seed sem segredo hardcoded.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher após validação`
- `neg`: `A preencher após testes negativos`
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
- Foco técnico da macro: `Fundamentos e governance`.
- Regra de governança: preservar IDs BK, contrato de campos e consistência entre backlog, matriz, sprints e guias.

## Bloco pedagógico

### Objetivo

Criar roles canónicas e autorização por role para proteger fluxos administrativos.

### Pré-requisitos

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
- Dependências: `BK-MF0-01`
- Artefactos: `RF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos

1. Centralizar roles canónicas.
2. Garantir role no `User`.
3. Criar middleware `requireRole`.
4. Criar service de alteração de role.
5. Criar rota admin protegida.
6. Criar seed admin controlada.
7. Validar UI mínima de role.
8. Executar cenários negativos obrigatórios (mínimo 3) e registar evidência.

### Cenários negativos recomendados

- Cliente em rota admin deve devolver `403`.
- Pedido sem sessão deve devolver `401`.
- Role inválida deve devolver `400`.

### Validação

- [ ] Smoke: admin altera role com sucesso.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Técnico: roles centralizadas e sem strings soltas relevantes.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificáveis.

### Matriz mínima de testes por prioridade

- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff

- Próximo BK recomendado: `BK-MF0-06`
- Produtos e administração devem reutilizar `requireRole`.

## Snippet técnico aplicável

O código aplicável deste BK-MF0-05 já não fica como anexo isolado. Para cumprir o contrato documental sem contrariar o formato tutorial, considera-se técnico aplicável o conjunto de blocos completos no `## Tutorial linear de implementação`, sempre ligados a `BK-MF0-05` e `RF05`.

Usar um snippet solto aqui seria pedagogicamente mais fraco: o aluno poderia copiar uma função sem perceber ficheiro, imports, validação, erro esperado e handoff. Por isso, o código foi integrado nos passos onde é usado.

## Critérios de aceite

- Entrega funcional específica de `Criação de roles: Cliente, Consultor, Administrador` validada contra `RF05`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa

- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher após validação`
- `proof_negativos`: `A preencher após testes negativos`
- `proof_negocio`: roles desbloqueiam catálogo admin e gestão operacional; revisão de recomendações fica para fases posteriores.

## Próximo BK recomendado

`BK-MF0-06`

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
As roles canónicas da Orélle ficam guardadas no modelo `User` e protegidas no backend. O frontend pode esconder botões, mas nunca é a fonte de autorização.

Roles permitidas:

- `cliente`
- `consultor`
- `administrador`

**Scope-in deste passo:**

- Centralizar roles em constante única.
- Garantir role `cliente` por defeito no registo.
- Criar middleware `requireRole`.
- Criar endpoint admin para alterar role de outro utilizador.
- Criar seed admin sem password hardcoded.
- Testar `401`, `403` e role invalida.

**Scope-out deste passo:**

- Permissões finas por recurso ficam para fases posteriores.
- Suspender/eliminar contas fica para `BK-MF4-01`.
- Consultores reverem recomendações fica para `BK-MF2-06`.
- Painel completo de admin fica fora deste BK.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever código, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
    - CRIAR:
        - `server/src/constants/roles.js`
        - `server/src/middlewares/role.middleware.js`
        - `server/src/services/admin-users.service.js`
        - `server/src/controllers/admin-users.controller.js`
        - `server/src/routes/admin-users.routes.js`
        - `server/src/scripts/seed-admin.js`
        - `server/tests/roles.test.js`

    - EDITAR:
        - `server/src/models/user.model.js`
        - `server/src/app.js`

    - REVER:
        - `server/src/middlewares/auth.middleware.js`
        - `server/src/services/session.service.js`
        - `docs/RF.md`, requisito `RF05`.
        - `docs/planificacao/guias-bk/MF0/BK-MF0-07-registar-produtos-com-nome-descricao-ingredientes-tipo-de-pele-indicado-imagem-preco-e-stock.md`, porque produtos admin dependem de `requireRole('administrador')`.
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

### Passo 4 - Criar ou editar `server/src/constants/roles.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/constants/roles.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/constants/roles.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/constants/roles.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/constants/roles.js`.

```js
export const ROLES = Object.freeze({
    CLIENTE: "cliente",
    CONSULTOR: "consultor",
    ADMIN: "administrador",
});

export const ROLE_VALUES = Object.freeze(Object.values(ROLES));
```

5. Explicação do código: usar constantes evita escrever strings de roles de forma diferente em cada ficheiro.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `server/src/models/user.model.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/models/user.model.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/models/user.model.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/models/user.model.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/src/models/user.model.js`: importar roles e substituir `USER_ROLES`.

```js
import mongoose from "mongoose";
import { ROLE_VALUES, ROLES } from "../constants/roles.js";

const { Schema, model } = mongoose;

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
            enum: ROLE_VALUES,
            default: ROLES.CLIENTE,
        },
    },
    { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = model("User", userSchema);
```

5. Explicação do código: o modelo continua igual para o resto da app, mas agora a lista de roles vem de um ponto central.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 6 - Criar ou editar `server/src/middlewares/role.middleware.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/middlewares/role.middleware.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/middlewares/role.middleware.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/middlewares/role.middleware.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/middlewares/role.middleware.js`.

```js
import { AppError } from "./error.middleware.js";

/**
 * Verifica se o utilizador autenticado tem uma das roles permitidas.
 * Deve ser usado sempre depois de requireAuth.
 */
export function requireRole(...allowedRoles) {
    return function roleMiddleware(req, res, next) {
        if (!req.user) {
            return next(new AppError(401, "Autenticação obrigatória"));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new AppError(403, "Sem permissao para esta operacao"));
        }

        return next();
    };
}
```

5. Explicação do código: `401` significa "não autenticado"; `403` significa "autenticado, mas sem permissão".
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 7 - Criar ou editar `server/src/services/admin-users.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/admin-users.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/services/admin-users.service.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/services/admin-users.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/services/admin-users.service.js`.

```js
import { ROLE_VALUES } from "../constants/roles.js";
import { AppError } from "../middlewares/error.middleware.js";
import { User } from "../models/user.model.js";

function toSafeUser(user) {
    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
    };
}

export async function updateUserRole({ targetUserId, role, actorUserId }) {
    if (!ROLE_VALUES.includes(role)) {
        throw new AppError(400, "Role invalida");
    }

    if (targetUserId === actorUserId) {
        throw new AppError(
            400,
            "Um administrador não deve alterar a própria role neste fluxo",
        );
    }

    const user = await User.findByIdAndUpdate(
        targetUserId,
        { role },
        { new: true, runValidators: true },
    );

    if (!user) {
        throw new AppError(404, "Utilizador não encontrado");
    }

    return toSafeUser(user);
}
```

5. Explicação do código: o service impede roles fora do contrato e evita que um admin se retire permissão por engano neste fluxo simples.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `server/src/controllers/admin-users.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/controllers/admin-users.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/controllers/admin-users.controller.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/controllers/admin-users.controller.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/controllers/admin-users.controller.js`.

```js
import { updateUserRole } from "../services/admin-users.service.js";

export async function updateUserRoleController(req, res, next) {
    try {
        const user = await updateUserRole({
            targetUserId: req.params.id,
            role: String(req.body.role ?? "").trim(),
            actorUserId: req.user.id,
        });

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: o controller recebe `:id` da URL, `role` do body e o admin autenticado de `req.user`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 9 - Criar ou editar `server/src/routes/admin-users.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/routes/admin-users.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/routes/admin-users.routes.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/routes/admin-users.routes.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/routes/admin-users.routes.js`.

```js
import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { updateUserRoleController } from "../controllers/admin-users.controller.js";

export const adminUsersRoutes = Router();

adminUsersRoutes.patch(
    "/users/:id/role",
    requireAuth,
    requireRole(ROLES.ADMIN),
    updateUserRoleController,
);
```

5. Explicação do código: a rota final fica `PATCH /api/admin/users/:id/role`. Primeiro válida sessão, depois role.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 10 - Criar ou editar `server/src/app.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/app.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/app.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/app.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/src/app.js` e substituir pelo ficheiro completo abaixo, preservando autenticação/perfil e acrescentando as rotas administrativas deste BK.

```js
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { adminUsersRoutes } from "./routes/admin-users.routes.js";
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
    app.use("/api/admin", adminUsersRoutes);

    app.use(errorMiddleware);

    return app;
}
```

5. Explicação do código: todas as rotas administrativas ficam sob `/api/admin`, mas continuam dentro da mesma app Express. Isto evita criar uma segunda API e garante que cookies, JSON e middleware de erro são os mesmos para cliente e administrador.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 11 - Criar ou editar `server/src/scripts/seed-admin.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/scripts/seed-admin.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/scripts/seed-admin.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/scripts/seed-admin.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/scripts/seed-admin.js`.

```js
import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { ROLES } from "../constants/roles.js";
import { User } from "../models/user.model.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
    throw new Error(
        "ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios para criar admin",
    );
}

await connectDB();

const passwordHash = await bcrypt.hash(password, 12);

await User.updateOne(
    { email: email.trim().toLowerCase() },
    {
        $set: {
            passwordHash,
            role: ROLES.ADMIN,
        },
    },
    { upsert: true },
);

await disconnectDB();

console.log(`Admin preparado: ${email}`);
```

5. Explicação do código: o seed cria ou atualiza um admin, mas a password vem sempre do ambiente. Nunca se escreve uma password real no repositório.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 12 - Validar payloads e respostas esperadas

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

Promover utilizador para consultor:

```http
PATCH /api/admin/users/66a000000000000000000002/role
Cookie: orelle_session=...admin...
Content-Type: application/json

{
  "role": "consultor"
}
```

Resposta `200`:

```json
{
    "user": {
        "id": "66a000000000000000000002",
        "email": "consultor@orelle.test",
        "role": "consultor"
    }
}
```

Cliente autenticado tenta alterar role `403`:

```json
{
    "error": {
        "message": "Sem permissao para esta operacao"
    }
}
```

Role invalida `400`:

```json
{
    "error": {
        "message": "Role invalida"
    }
}
```

### Passo 13 - Criar testes minimos

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

Criar este ficheiro em `server/tests/roles.test.js`.

```js
import { describe, expect, it } from "vitest";
import { ROLES } from "../src/constants/roles.js";
import { requireRole } from "../src/middlewares/role.middleware.js";

function runMiddleware(middleware, req) {
    return new Promise((resolve) => {
        middleware(req, {}, (err) => resolve(err));
    });
}

describe("BK-MF0-05 / RF05 - roles", () => {
    it("permite administrador", async () => {
        const err = await runMiddleware(requireRole(ROLES.ADMIN), {
            user: { id: "admin-1", role: ROLES.ADMIN },
        });

        expect(err).toBeUndefined();
    });

    it("bloqueia cliente em rota admin", async () => {
        const err = await runMiddleware(requireRole(ROLES.ADMIN), {
            user: { id: "cliente-1", role: ROLES.CLIENTE },
        });

        expect(err.statusCode).toBe(403);
    });

    it("bloqueia pedido sem autenticação", async () => {
        const err = await runMiddleware(requireRole(ROLES.ADMIN), {});

        expect(err.statusCode).toBe(401);
    });
});
```

5. Explicação do código: estes testes isolam o middleware e provam a diferença entre `401` e `403`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 14 - Confirmar bloqueios e decisões antes do PR

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

Antes de executar o seed admin, definir variaveis no ambiente local:

```env
ADMIN_EMAIL=admin@orelle.test
ADMIN_PASSWORD=uma-password-forte-para-desenvolvimento
```

Se a equipa quiser criar admins por interface grafica, isso deve ficar para um BK administrativo posterior. Neste BK o caminho seguro e seed controlado.

### Evidence para PR/defesa

- Output do seed sem mostrar password.
- Teste de admin alterar role com `200`.
- Teste de cliente tentar alterar role com `403`.
- Teste sem cookie com `401`.
- Evidência de que roles possíveis são apenas `cliente`, `consultor`, `administrador`.

### Handoff para BK-MF0-06

Preferencias continuam a pertencer ao cliente autenticado. O próximo BK deve usar `requireAuth`, mas não precisa de `requireRole`, porque preferencias são do próprio utilizador.

### Handoff critico para BK-MF0-07

Criação de produtos só pode ser exposta se `requireAuth` e `requireRole(ROLES.ADMIN)` estiverem funcionais.

## Changelog

- `2026-04-14`: guia normalizado para contrato canónico comum.
- `2026-05-25`: guia refinado para RBAC mínimo da Orélle.
- `2026-05-29`: tutorial linear integrado com roles centralizadas, middleware RBAC, seed admin, payloads, testes e handoff admin.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com código, explicação, validação e negativo no passo onde são usados.
