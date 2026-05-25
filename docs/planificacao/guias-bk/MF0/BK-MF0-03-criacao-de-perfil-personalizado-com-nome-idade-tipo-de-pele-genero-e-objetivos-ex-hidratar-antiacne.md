# BK-MF0-03 - Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne)

## Header
- `doc_id`: `GUIA-BK-MF0-03`
- `bk_id`: `BK-MF0-03`
- `macro`: `MF0`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-01`
- `rf_rnf`: `RF03`
- `fase_documental`: `Fase 1`
- `sprint`: `S01-S02`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF0-04`
- `guia_path`: `docs/planificacao/guias-bk/MF0/BK-MF0-03-criacao-de-perfil-personalizado-com-nome-idade-tipo-de-pele-genero-e-objetivos-ex-hidratar-antiacne.md`
- `last_updated`: `2026-05-25`

#### BK-MF0-03 - Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne)

##### O que vamos fazer neste BK

Neste BK vamos criar o perfil cosmético inicial do cliente. O registo de `BK-MF0-01` cria a conta; este BK acrescenta dados usados para personalização: nome, idade, tipo de pele, género e objetivos como hidratação ou antiacne.

O perfil deve ficar associado ao utilizador autenticado. Por isso, tecnicamente reutiliza a sessão de `BK-MF0-02` quando já existir, embora a dependência canónica seja `BK-MF0-01`. Se o login ainda não estiver implementado, usar uma conta de teste local e marcar a limitação na evidence.

Esta fase foi detalhada sem mockup. O formulário deve ser claro e modular para poder evoluir quando houver design final.

##### Porque e que isto e importante

- Transforma uma conta genérica num perfil útil para recomendações futuras.
- Prepara `RF13`, `RF18`, `RF40` e fluxos de análise facial sem recolher ainda imagens biométricas.
- Ensina relação um-para-um entre `User` e `Profile`.
- Cria contrato de dados que será usado por preferências, histórico e recomendações.

##### O que entra (scope)

- Modelo `Profile` associado a `User`.
- Endpoint `POST /api/profile/me` para criar perfil do utilizador autenticado.
- Endpoint `GET /api/profile/me` para consultar o perfil.
- Validação de nome, idade, tipo de pele, género e objetivos.
- Página React `ProfileSetupPage`.
- Testes de criação, duplicação e acesso autenticado.

##### O que nao entra (scope-out)

- Edição posterior do perfil, que fica para `BK-MF0-04`.
- Upload/análise de fotografias do rosto, que fica para `MF1`.
- Alergias, ingredientes a evitar e restrições médicas leves, que ficam para `BK-MF4-08`.
- Diagnóstico médico ou promessas clínicas.

##### Como saber que isto ficou bem

- Um utilizador autenticado consegue criar um perfil uma única vez.
- O perfil fica ligado ao `userId` correto.
- Idade inválida, tipo de pele inválido ou objetivos vazios são rejeitados.
- Outro utilizador não consegue consultar o perfil alheio.
- `BK-MF0-04` consegue reutilizar o mesmo modelo para edição.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P0` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `M` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Bruna` (CANONICO)
- Apoio: `Izelicks` (CANONICO)
- Dependencias (BK IDs): `BK-MF0-01` (CANONICO)
- Pre-condicoes: `User` criado; autenticação disponível ou conta de teste controlada (DERIVADO)
- Ref. Plano: `RF03`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-PROFILE-CREATE` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF03` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-03` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-03` (CANONICO)
- Descricao: criação de perfil personalizado para personalização cosmética inicial (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: existe `User`; a sessão pode existir se `BK-MF0-02` já foi executado.
- Estado esperado depois do BK: existe `Profile` por utilizador, consultável e validado.
- Ficheiros a criar: `server/src/models/profile.model.js`, `server/src/routes/profile.routes.js`, `server/src/controllers/profile.controller.js`, `server/src/services/profile.service.js`, `server/src/validators/profile.validator.js`, `client/src/pages/ProfileSetupPage.jsx`.
- Ficheiros a editar: `server/src/app.js`, `client/src/App.jsx`, `client/src/services/apiClient.js`.
- Dependencias de BK anteriores: `BK-MF0-01` fornece `User._id`; `BK-MF0-02` fornece `req.user` se já estiver implementado.
- Impacto na arquitetura: adiciona módulo `profile` separado de `auth`.
- Impacto em frontend: adiciona formulário multi-campo com estados de erro.
- Impacto em backend: adiciona rotas protegidas e service de perfil.
- Impacto em dados: cria coleção `profiles` com relação `userId` única.
- Impacto em segurança: utilizador só acede ao próprio perfil.
- Impacto em testes: validar criação, duplicação, campos inválidos e acesso sem auth.
- Handoff para o próximo BK: `BK-MF0-04` edita estes campos sem criar perfil duplicado.

#### Pre-leitura minima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF03`.
- `README.md`: secções de identidade, perfil e recomendação.
- `BK-MF0-01`: contrato `User`.
- `BK-MF0-02`: contrato `requireAuth`, se já executado.
- Mockup: não existe nesta execução; usar formulário simples.

#### Glossario (rapido) (DERIVADO):

- `Profile`: dados pessoais e cosméticos ligados ao utilizador.
- `userId`: referência ao `User` dono do perfil.
- `Relação um-para-um`: cada utilizador tem no máximo um perfil.
- `Enum`: lista fechada de valores aceites.
- `Objetivos`: intenções do utilizador, como hidratar ou reduzir oleosidade.
- `Validação de domínio`: regra que confirma se um valor faz sentido para a app.
- `Ownership`: garantia de que o recurso pertence ao utilizador autenticado.
- `409`: conflito, usado quando o perfil já existe.

#### Conceitos teoricos essenciais (DERIVADO):

Separar `User` de `Profile` evita misturar credenciais com dados de personalização. `User` responde à pergunta "quem é a pessoa para entrar na app?"; `Profile` responde "que dados ajudam a personalizar a experiência?".

O campo `tipoDePele` deve usar valores controlados para evitar dados caóticos como `oleosa`, `Oleosa`, `pele oleosa`, `oily`. Uma lista inicial simples pode ser `oleosa`, `seca`, `mista`, `normal`, `sensivel`, marcada como assunção técnica derivada do domínio cosmético.

A app não deve tratar estes dados como diagnóstico médico. O perfil ajuda recomendações cosméticas e experiência de compra, mas não substitui avaliação clínica.

#### Guia de execucao (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): confirmar campos canónicos do perfil**
   - Descricao detalhada do objetivo: alinhar os campos com `RF03`.
   - Justificacao: inventar campos nesta fase cria drift e confunde recomendações futuras.
   - Como fazer (0.1): listar apenas `nome`, `idade`, `tipoDePele`, `genero`, `objetivos`.
   - Como fazer (0.2): marcar listas de valores como `DERIVADO`.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/validators/profile.validator.js`.
   - Snippet de referencia: `const SKIN_TYPES = ['oleosa', 'seca', 'mista', 'normal', 'sensivel'];`.
   - O que verificar: não foram adicionados campos médicos ou alergias neste BK.

1. **Objetivo (~25 min): criar modelo Profile**
   - Descricao detalhada do objetivo: persistir perfil ligado a `User`.
   - Justificacao: a relação única evita vários perfis contraditórios por utilizador.
   - Como fazer (1.1): criar `userId` obrigatório, único e referenciado a `User`.
   - Como fazer (1.2): criar campos de perfil com `timestamps`.
   - Ficheiro a rever: `server/src/models/user.model.js`.
   - Ficheiro alvo: `server/src/models/profile.model.js`.
   - Snippet de referencia: `userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true }`.
   - O que verificar: índice único em `userId`.

2. **Objetivo (~30 min): criar validação de perfil**
   - Descricao detalhada do objetivo: impedir perfis incompletos ou inconsistentes.
   - Justificacao: recomendações futuras dependem de dados previsíveis.
   - Como fazer (2.1): validar `nome` com tamanho mínimo e máximo.
   - Como fazer (2.2): validar idade num intervalo razoável definido pela equipa.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/validators/profile.validator.js`.
   - Snippet de referencia: `if (!SKIN_TYPES.includes(tipoDePele)) errors.tipoDePele = 'Tipo de pele inválido';`.
   - O que verificar: erros são claros e por campo.

3. **Objetivo (~35 min): implementar service de criação**
   - Descricao detalhada do objetivo: criar perfil para o utilizador autenticado.
   - Justificacao: o service garante que cada user só cria um perfil.
   - Como fazer (3.1): procurar perfil existente por `userId`.
   - Como fazer (3.2): devolver `409` se já existir.
   - Ficheiro a rever: `server/src/models/profile.model.js`.
   - Ficheiro alvo: `server/src/services/profile.service.js`.
   - Snippet de referencia: `const existing = await Profile.findOne({ userId });`.
   - O que verificar: chamadas repetidas não criam duplicados.

4. **Objetivo (~30 min): criar rotas protegidas de perfil**
   - Descricao detalhada do objetivo: expor `POST /api/profile/me` e `GET /api/profile/me`.
   - Justificacao: usar `/me` deixa claro que a operação é sobre o próprio utilizador.
   - Como fazer (4.1): aplicar `requireAuth`.
   - Como fazer (4.2): no controller, usar `req.user.id`.
   - Ficheiro a rever: `server/src/middlewares/auth.middleware.js`.
   - Ficheiro alvo: `server/src/routes/profile.routes.js`.
   - Snippet de referencia: `router.post('/me', requireAuth, createMyProfileController);`.
   - O que verificar: sem login devolve `401`.

5. **Objetivo (~40 min): criar formulário React**
   - Descricao detalhada do objetivo: permitir ao cliente preencher o perfil.
   - Justificacao: a PAP deve demonstrar fluxo utilizável, não só API.
   - Como fazer (5.1): criar inputs controlados para cada campo.
   - Como fazer (5.2): usar select ou radio para valores fechados.
   - Ficheiro a rever: `client/src/App.jsx`.
   - Ficheiro alvo: `client/src/pages/ProfileSetupPage.jsx`.
   - Snippet de referencia: `<select name="tipoDePele" value={form.tipoDePele}>`.
   - O que verificar: o formulário mostra loading, erro e sucesso.

6. **Objetivo (~30 min): preparar dados para fases futuras**
   - Descricao detalhada do objetivo: garantir que o perfil é útil para recomendações sem antecipar IA.
   - Justificacao: `MF1` e `MF2` vão usar estes campos como contexto.
   - Como fazer (6.1): normalizar `objetivos` como array de strings curtas.
   - Como fazer (6.2): documentar que alergias e restrições ficam fora.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/services/profile.service.js`.
   - Snippet de referencia: `objetivos: objetivos.map((item) => item.trim().toLowerCase())`.
   - O que verificar: objetivos vazios ou duplicados são tratados.

7. **Objetivo (~45 min): validar negativos e handoff**
   - Descricao detalhada do objetivo: provar que o perfil funciona e não quebra auth.
   - Justificacao: perfil será dependência direta de upload e recomendações.
   - Como fazer (7.1): testar criação válida e consulta.
   - Como fazer (7.2): Executar cenarios negativos obrigatorios (minimo 3) e registar resultados.
   - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
   - Ficheiro alvo: `server/tests/profile.test.js`.
   - Snippet de referencia: `expect(response.status).toBe(409);`.
   - O que verificar: evidence mostra perfil único por user.

#### Checklist de validacao (DERIVADO):

- Smoke: utilizador autenticado cria perfil e consulta em `/api/profile/me`.
- Negativo 1: passo 4; criar perfil sem sessão; resultado esperado `401`; risco que cobre: acesso anónimo.
- Negativo 2: passo 2; idade inválida; resultado esperado `400`; risco que cobre: dados incoerentes.
- Negativo 3: passo 3; criar segundo perfil para mesmo user; resultado esperado `409`; risco que cobre: duplicação de perfil.
- Tecnico: `Profile.userId` tem índice único.
- Regressao das fases anteriores: registo/login continuam válidos.
- UI/mockup: sem mockup; formulário baseline e responsivo.
- Seguranca: controller usa `req.user.id`, nunca `userId` enviado pelo cliente.

#### Criterios de aceite:

- Outputs: modelo `Profile`, endpoints `/api/profile/me`, formulário `ProfileSetupPage`.
- Verificacoes: criação válida `201`, consulta `200`, duplicado `409`, inválidos `400`.
- Qualidade: campos normalizados e sem dados médicos fora de scope.
- Continuidade: `BK-MF0-04` consegue editar o perfil; `MF1` consegue usar contexto de pele.
- Evidencia: testes ou curl com perfil criado, duplicado rejeitado e acesso sem auth bloqueado.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher apos validacao`
- `neg`: `A preencher apos testes negativos`
- `files`: `server/src/models/profile.model.js`, `server/src/routes/profile.routes.js`, `client/src/pages/ProfileSetupPage.jsx`
- `commands`: `curl -X POST /api/profile/me`, `npm test`
- `screenshots`: formulário de perfil e estado de sucesso
- `notes`: indicar que não há mockup e que fotos/análise facial ficam fora

#### TODOs

- TODO: confirmar lista final de `tipoDePele` com orientador.
- TODO: confirmar se `genero` deve ser opcional, para reduzir recolha desnecessária.
- TODO (BLOCKER): se `requireAuth` não existir, documentar uso de conta de teste controlada.
- FOLLOW-UP: `BK-MF0-04` deve editar este perfil sem duplicar documento.

## Contexto do BK
- Entrega alvo: implementar `Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne)` com rastreabilidade direta ao requisito `RF03`.
- Foco tecnico da macro: `Fundamentos e governance`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Criar o perfil cosmético inicial, separando credenciais (`User`) de personalização (`Profile`).

### Pre-requisitos
- Rever `RF03`.
- Ter `User` de `BK-MF0-01`.
- Usar `requireAuth` se `BK-MF0-02` já existir.

### Erros comuns
- Guardar campos de perfil dentro de `User` sem critério.
- Aceitar `userId` enviado pelo frontend.
- Criar múltiplos perfis para a mesma conta.

### Check de compreensao
- [ ] Sei explicar diferença entre `User` e `Profile`.
- [ ] Sei justificar o índice único em `userId`.
- [ ] Sei provar que outro user não lê este perfil.

### Tempo estimado
- `M`: 2 a 4 horas.

## Bloco operacional
### Entrada
- BK: `BK-MF0-03`
- Requisito: `RF03`
- Dependencias: `BK-MF0-01`
- Artefactos: `RF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos
1. Confirmar campos do `RF03`.
2. Criar modelo `Profile`.
3. Criar validator de perfil.
4. Criar service de criação única.
5. Criar routes/controller protegidos.
6. Criar formulário React.
7. Testar integração com auth.
8. Executar cenarios negativos obrigatorios (minimo 3) e registar evidência.

### Cenarios negativos recomendados
- Pedido sem sessão deve devolver `401`.
- Idade ou tipo de pele inválidos devem devolver `400`.
- Segundo perfil para o mesmo user deve devolver `409`.

### Validacao
- [ ] Smoke: perfil válido é criado.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Tecnico: relação `User -> Profile` é única.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF0-04`
- O próximo BK deve atualizar este perfil, não criar outro.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF0-03';
const REQ_ID = 'RF03';
const MIN_NEGATIVOS = 3;

export function validarEvidenceBkMf003({ smokeOk, negativos, profile }) {
  if (!smokeOk) throw new Error(`${BK_ID}/${REQ_ID}: smoke de perfil falhou`);
  if (negativos < 3) throw new Error(`${BK_ID}/${REQ_ID}: negativos insuficientes`);
  if (!profile?.userId) throw new Error(`${BK_ID}/${REQ_ID}: perfil sem userId`);
  return { bkId: BK_ID, reqId: REQ_ID, minNegativos: MIN_NEGATIVOS, status: 'OK' };
}
```

## Criterios de aceite
- Entrega funcional especifica de `Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos` validada contra `RF03`.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher apos validacao`
- `proof_negativos`: `A preencher apos testes negativos`
- `proof_negocio`: perfil desbloqueia personalização, análise e recomendação.

## Proximo BK recomendado
`BK-MF0-04`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para perfil personalizado executável.
