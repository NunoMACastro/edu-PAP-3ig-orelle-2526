# BK-MF0-04 - Possibilidade de editar o perfil e atualizar fotografias periodicamente

## Header
- `doc_id`: `GUIA-BK-MF0-04`
- `bk_id`: `BK-MF0-04`
- `macro`: `MF0`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF0-03`
- `rf_rnf`: `RF04`
- `fase_documental`: `Fase 1`
- `sprint`: `S01-S02`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF0-05`
- `guia_path`: `docs/planificacao/guias-bk/MF0/BK-MF0-04-possibilidade-de-editar-o-perfil-e-atualizar-fotografias-periodicamente.md`
- `last_updated`: `2026-05-25`

#### BK-MF0-04 - Possibilidade de editar o perfil e atualizar fotografias periodicamente

##### O que vamos fazer neste BK

Neste BK vamos permitir que o cliente atualize dados do perfil criado em `BK-MF0-03` e associe uma fotografia de perfil simples. Esta fotografia não é ainda a fotografia facial para análise por IA; esse fluxo sensível pertence a `RF13` e fases seguintes.

Como qualquer fotografia facial pode identificar uma pessoa e pode ser tratada como dado sensível/biométrico dependendo do uso, este BK não pode fingir upload real sem infraestrutura. Se ainda não existir consentimento explícito, armazenamento seguro e limitação de acesso, a implementação deve usar apenas `profilePhotoUrl` controlado ou stub documentado, sem receber ficheiros reais.

O foco é editar com segurança: só o dono do perfil pode alterar os seus dados, o backend valida todos os campos e a UI mostra estados de loading, erro e sucesso.

Como não existe mockup, a UI deve ser funcional e simples, sem decidir a identidade visual final.

##### Porque e que isto e importante

- Evita que o perfil fique estático e desatualizado.
- Prepara a ideia de atualização periódica sem antecipar análise facial biométrica.
- Ensina atualização parcial (`PATCH`/`PUT`) e controlo de ownership.
- Desbloqueia roles e preferências com dados de perfil consistentes.

##### O que entra (scope)

- Endpoint `PUT /api/profile/me` para editar campos do perfil.
- Endpoint opcional `PATCH /api/profile/me/photo` para fotografia de perfil não analítica, apenas se houver consentimento e armazenamento seguro.
- Alternativa segura quando upload real não existir: guardar apenas `profilePhotoUrl` controlado/stub e documentar que não há ficheiro real nem processamento.
- Validação de campos parciais.
- Atualização da página de perfil no frontend.
- Testes negativos de acesso, campos inválidos e ficheiro inválido.

##### O que nao entra (scope-out)

- Upload de fotografias frontal/perfil para análise de pele.
- Processamento facial, IA, simulação, relatório ou diagnóstico.
- Upload real sem consentimento explícito, armazenamento seguro, controlo de acesso e política de retenção.
- Compressão/encriptação avançada de imagens, salvo se a equipa implementar upload real com segurança mínima aprovada.
- Histórico de versões do perfil.

##### Como saber que isto ficou bem

- O utilizador autenticado edita o próprio perfil com resposta `200`.
- Campos inválidos devolvem `400`.
- Tentativas sem sessão devolvem `401`.
- A fotografia de perfil aceita apenas formatos/tamanhos definidos quando upload real estiver aprovado.
- Se upload real não estiver aprovado, a app usa URL/stub controlado e declara isso na evidence.
- O perfil editado continua compatível com `BK-MF0-03`.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P1` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `S` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Izelicks` (CANONICO)
- Apoio: `Bruna` (CANONICO)
- Dependencias (BK IDs): `BK-MF0-03` (CANONICO)
- Pre-condicoes: perfil criado e associado ao utilizador; upload real bloqueado até existir consentimento, armazenamento seguro e acesso limitado (DERIVADO)
- Ref. Plano: `RF04`, `Fase 1`, `S01-S02`, `Core` (CANONICO)
- Flow ID: `FLOW-PROFILE-EDIT` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF04` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-04` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-04` (CANONICO)
- Descricao: edição do perfil e atualização controlada de fotografia de perfil não analítica (CANONICO + DERIVADO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: `Profile` existe e pertence ao utilizador.
- Estado esperado depois do BK: o cliente pode editar dados e, no máximo, associar fotografia por URL/stub controlado se o upload seguro ainda não existir.
- Ficheiros a criar: `server/src/validators/profile-photo.validator.js`, `client/src/pages/EditProfilePage.jsx`.
- Ficheiros a editar: `server/src/routes/profile.routes.js`, `server/src/controllers/profile.controller.js`, `server/src/services/profile.service.js`, `server/src/models/profile.model.js`, `client/src/App.jsx`.
- Dependencias de BK anteriores: `BK-MF0-03` define campos e relação `userId`.
- Impacto na arquitetura: adiciona update parcial ao módulo `profile`.
- Impacto em frontend: formulário de edição com valores iniciais.
- Impacto em backend: controller usa `req.user.id` e não aceita editar `userId`.
- Impacto em dados: pode acrescentar `profilePhotoUrl` e `profilePhotoMode`; `profilePhotoMeta` só entra se upload real estiver aprovado.
- Impacto em segurança: valida tipo/tamanho de ficheiro, exige consentimento para upload real, limita acesso ao dono/admin autorizado e bloqueia edição alheia.
- Impacto em testes: P1 exige unit/integration e 2 negativos.
- Handoff para o próximo BK: `BK-MF0-05` pode usar perfil e conta para distinguir permissões.

#### Pre-leitura minima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF04`.
- Guia `BK-MF0-03`: modelo `Profile`.
- `docs/RNF.md`: `RNF03`, `RNF08`, `RNF11`, `RNF12`, `RNF25`.
- Mockup: não existe nesta execução.

#### Glossario (rapido) (DERIVADO):

- `PUT`: atualização completa ou substituição controlada de recurso.
- `PATCH`: atualização parcial de um recurso.
- `Ownership`: garantia de que cada pessoa altera apenas os seus dados.
- `Multipart`: formato de pedido usado para enviar ficheiros.
- `Multer`: middleware Express comum para receber uploads.
- `MIME type`: tipo declarado do ficheiro, como `image/jpeg`.
- `Avatar`: fotografia de perfil, diferente de imagem biométrica para análise.
- `Consentimento explícito`: confirmação clara do utilizador antes de recolher/processar imagem sensível.
- `Stub`: simulação controlada que prova o fluxo sem fazer upload real.

#### Conceitos teoricos essenciais (DERIVADO):

Atualizar dados é diferente de criar dados. Na criação, a app rejeita duplicados; na edição, a app procura o perfil existente e altera apenas campos permitidos. Campos como `userId`, `role` e identificadores internos nunca devem vir do frontend.

Uma fotografia de perfil pode parecer simples, mas continua a exigir validação. Se a imagem permitir identificar o rosto, deve ser tratada com cuidado de privacidade: consentimento explícito, armazenamento seguro, acesso limitado e política clara de retenção. Sem estes elementos, o BK deve usar URL/stub controlado em vez de upload real.

Usar `PATCH` para fotografia separa a atualização de imagem da atualização textual. Isso torna o fluxo mais claro e evita misturar erros de ficheiro com erros de campos de perfil. Se o modo for stub, o endpoint deve guardar apenas metadados seguros, por exemplo `{ profilePhotoMode: 'stub_url', profilePhotoUrl }`.

#### Guia de execucao (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): separar fotografia de perfil de fotografia biométrica**
   - Descricao detalhada do objetivo: documentar que este BK não processa imagens de análise facial e que upload real fica bloqueado sem consentimento/armazenamento seguro.
   - Justificacao: imagens faciais podem ser dados sensíveis e não podem ser tratadas como simples ficheiros decorativos.
   - Como fazer (0.1): nomear o campo como `profilePhotoUrl` ou `avatarUrl` e adicionar `profilePhotoMode`.
   - Como fazer (0.2): usar `profilePhotoMode: 'stub_url'` quando não houver upload real aprovado; evitar nomes como `analysisPhoto`.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/models/profile.model.js`.
   - Snippet de referencia: `profilePhotoMode: { type: String, enum: ['stub_url', 'secure_upload'], default: 'stub_url' }`.
   - O que verificar: `RF13` não foi implementado aqui e não há upload real sem consentimento.

1. **Objetivo (~25 min): preparar atualização do Profile**
   - Descricao detalhada do objetivo: permitir alterar campos de `RF03`.
   - Justificacao: reutiliza contrato do perfil sem criar outro documento.
   - Como fazer (1.1): criar função `updateMyProfile(userId, input)`.
   - Como fazer (1.2): filtrar campos permitidos antes de atualizar.
   - Ficheiro a rever: `server/src/services/profile.service.js`.
   - Ficheiro alvo: `server/src/services/profile.service.js`.
   - Snippet de referencia: `const allowed = pick(input, ['nome', 'idade', 'tipoDePele', 'genero', 'objetivos']);`.
   - O que verificar: `userId` do body é ignorado.

2. **Objetivo (~25 min): criar validação de edição**
   - Descricao detalhada do objetivo: validar apenas campos enviados sem obrigar a reenviar tudo.
   - Justificacao: edição parcial melhora UX e reduz erros.
   - Como fazer (2.1): reaproveitar regras do `profile.validator`.
   - Como fazer (2.2): rejeitar objeto vazio com `400`.
   - Ficheiro a rever: `server/src/validators/profile.validator.js`.
   - Ficheiro alvo: `server/src/validators/profile.validator.js`.
   - Snippet de referencia: `if (Object.keys(input).length === 0) errors.base = 'Nada para atualizar';`.
   - O que verificar: idade inválida continua a falhar.

3. **Objetivo (~30 min): criar endpoint de edição**
   - Descricao detalhada do objetivo: expor `PUT /api/profile/me`.
   - Justificacao: `/me` mantém ownership no servidor.
   - Como fazer (3.1): aplicar `requireAuth`.
   - Como fazer (3.2): devolver `404` se o perfil ainda não existir.
   - Ficheiro a rever: `server/src/routes/profile.routes.js`.
   - Ficheiro alvo: `server/src/controllers/profile.controller.js`.
   - Snippet de referencia: `router.put('/me', requireAuth, updateMyProfileController);`.
   - O que verificar: não há rota `PUT /api/profile/:userId` para clientes.

4. **Objetivo (~30 min): criar atualização de fotografia em modo seguro**
   - Descricao detalhada do objetivo: permitir trocar avatar/foto de perfil apenas no modo que a infraestrutura suporta.
   - Justificacao: cumpre `RF04` sem antecipar análise facial nem recolher ficheiros sensíveis de forma insegura.
   - Como fazer (4.1): se não existir consentimento + storage seguro + controlo de acesso, guardar só URL/stub controlado e bloquear ficheiro real.
   - Como fazer (4.2): se upload real estiver aprovado, validar MIME `image/jpeg`, `image/png` ou `image/webp`, limite de tamanho, consentimento e acesso restrito.
   - Ficheiro a rever: `docs/RNF.md`.
   - Ficheiro alvo: `server/src/validators/profile-photo.validator.js`.
   - Snippet de referencia: `if (!consentAccepted && mode === 'secure_upload') throw new AppError(403, 'Consentimento obrigatório');`.
   - O que verificar: ficheiro real é bloqueado quando o modo seguro não está disponível.

5. **Objetivo (~45 min): criar UI de edição e evidence**
   - Descricao detalhada do objetivo: permitir editar perfil e foto com feedback.
   - Justificacao: o aluno consegue demonstrar evolução do perfil na defesa.
   - Como fazer (5.1): carregar valores existentes em `EditProfilePage`.
   - Como fazer (5.2): Executar cenarios negativos obrigatorios (minimo 2) e registar resultados.
   - Ficheiro a rever: `client/src/pages/ProfileSetupPage.jsx`.
   - Ficheiro alvo: `client/src/pages/EditProfilePage.jsx`.
   - Snippet de referencia: `await apiClient.put('/profile/me', form);`.
   - O que verificar: sucesso atualiza o ecrã sem criar perfil novo.

#### Checklist de validacao (DERIVADO):

- Smoke: editar `nome` e `objetivos` de um perfil existente; esperar `200`.
- Negativo 1: passo 3; pedido sem sessão; resultado esperado `401`; risco que cobre: edição anónima.
- Negativo 2: passo 4; upload real sem consentimento ou sem storage seguro; resultado esperado `403` ou `BLOCKER`; risco que cobre: recolha insegura de imagem sensível.
- Negativo 3: passo 4; ficheiro com tipo/tamanho inválido quando upload seguro estiver aprovado; resultado esperado `400`; risco que cobre: ficheiro perigoso ou pesado.
- Tecnico: rota usa `/me` e `req.user.id`.
- Regressao das fases anteriores: criação de perfil continua a impedir duplicados.
- UI/mockup: sem mockup; manter formulário simples com feedback imediato.
- Seguranca: não aceitar alteração de `userId`, `role` ou campos internos.

#### Criterios de aceite:

- Outputs: `PUT /api/profile/me`, validação parcial, UI de edição e fotografia em modo `stub_url` ou upload seguro aprovado.
- Verificacoes: edição válida `200`, sem sessão `401`, upload real sem consentimento/storage seguro bloqueado, ficheiro inválido `400` quando aplicável.
- Qualidade: não implementa análise facial fora de fase e não finge upload real quando só existe stub.
- Continuidade: `BK-MF0-05` mantém roles fora do perfil e dentro de `User`.
- Evidencia: prova de antes/depois do perfil e negativos documentados.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher apos validacao`
- `neg`: `A preencher apos testes negativos`
- `files`: `server/src/services/profile.service.js`, `server/src/routes/profile.routes.js`, `client/src/pages/EditProfilePage.jsx`
- `commands`: `curl -X PUT /api/profile/me`, `npm test`
- `screenshots`: perfil antes/depois da edição
- `notes`: fotografia é avatar/perfil; análise facial fica fora; indicar se foi usado `stub_url` ou `secure_upload`

#### TODOs

- TODO: confirmar limite final de tamanho para fotografia de perfil.
- TODO: confirmar armazenamento local vs serviço externo em fase posterior.
- TODO (BLOCKER): se consentimento, storage seguro e controlo de acesso não estiverem preparados, guardar apenas URL/stub controlado e documentar.
- FOLLOW-UP: `MF1` deve tratar fotografias biométricas com consentimento explícito.

## Contexto do BK
- Entrega alvo: implementar `Possibilidade de editar o perfil e atualizar fotografias periodicamente` com rastreabilidade direta ao requisito `RF04`.
- Foco tecnico da macro: `Fundamentos e governance`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Permitir edição segura do perfil existente, sem duplicar dados e sem implementar análise facial fora da fase.

### Pre-requisitos
- Rever `RF04`.
- Ter `Profile` de `BK-MF0-03`.
- Ter autenticação ou conta de teste controlada.

### Erros comuns
- Criar novo perfil em vez de atualizar.
- Permitir editar `userId` ou `role`.
- Tratar avatar como fotografia biométrica de análise.
- Aceitar upload real sem consentimento explícito e armazenamento seguro.

### Check de compreensao
- [ ] Sei distinguir avatar de fotografia para análise facial.
- [ ] Sei explicar por que `/me` é mais seguro do que receber `userId`.
- [ ] Sei demonstrar que ficheiro inválido é rejeitado.

### Tempo estimado
- `S`: 1 a 2 horas.

## Bloco operacional
### Entrada
- BK: `BK-MF0-04`
- Requisito: `RF04`
- Dependencias: `BK-MF0-03`
- Artefactos: `RF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos
1. Confirmar fronteira entre avatar e análise facial.
2. Atualizar modelo/serviço de perfil.
3. Criar validação parcial.
4. Criar rota `PUT /api/profile/me`.
5. Criar UI de edição.
6. Executar cenarios negativos obrigatorios (minimo 2) e registar evidência.

### Cenarios negativos recomendados
- Pedido sem sessão deve devolver `401`.
- Upload real sem consentimento/storage seguro deve ficar bloqueado.
- Fotografia com tipo/tamanho inválido deve devolver `400` quando upload seguro estiver ativo.

### Validacao
- [ ] Smoke: edição válida devolve `200`.
- [ ] Negativos: minimo `2` cenarios com resultado controlado.
- [ ] Tecnico: não altera `userId` nem `role`.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF0-05`
- O próximo BK deve manter permissões no `User`, não dentro do `Profile`.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF0-04';
const REQ_ID = 'RF04';
const MIN_NEGATIVOS = 2;

export function validarEvidenceBkMf004({ smokeOk, negativos, attemptedRoleChange }) {
  if (!smokeOk) throw new Error(`${BK_ID}/${REQ_ID}: smoke de edição falhou`);
  if (negativos < 2) throw new Error(`${BK_ID}/${REQ_ID}: negativos insuficientes`);
  if (attemptedRoleChange) throw new Error(`${BK_ID}/${REQ_ID}: edição tentou alterar role`);
  return { bkId: BK_ID, reqId: REQ_ID, minNegativos: MIN_NEGATIVOS, status: 'OK' };
}
```

## Criterios de aceite
- Entrega funcional especifica de `Possibilidade de editar o perfil e atualizar fotografias periodicamente` validada contra `RF04`.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher apos validacao`
- `proof_negativos`: `A preencher apos testes negativos`
- `proof_negocio`: edição mantém perfil útil para personalização futura sem executar análise facial nesta fase.

## Proximo BK recomendado
`BK-MF0-05`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para edição segura de perfil e foto não analítica.
- `2026-05-25`: reforçada regra de consentimento, storage seguro e stub obrigatório quando upload real não existir.
