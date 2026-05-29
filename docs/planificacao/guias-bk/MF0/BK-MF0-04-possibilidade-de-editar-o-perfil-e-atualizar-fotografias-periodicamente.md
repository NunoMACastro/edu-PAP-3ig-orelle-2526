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
- `last_updated`: `2026-05-29`

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

O codigo aplicavel deste BK-MF0-04 ja nao fica como anexo isolado. Para cumprir o contrato documental sem contrariar o formato tutorial, considera-se tecnico aplicavel o conjunto de blocos completos no `## Tutorial linear de implementacao`, sempre ligados a `BK-MF0-04` e `RF04`.

Usar um snippet solto aqui seria pedagogicamente mais fraco: o aluno poderia copiar uma funcao sem perceber ficheiro, imports, validacao, erro esperado e handoff. Por isso, o codigo foi integrado nos passos onde e usado.

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
Nesta fase, a fotografia e apenas um avatar por URL controlado (`profilePhotoMode: 'stub_url'`). Nao ha upload real de ficheiro neste BK. Isto evita tratar uma fotografia facial como upload comum antes de existirem consentimento explicito, armazenamento seguro, retencao e controlo de acesso.

**Scope-in deste passo:**

- Editar campos do perfil criado em `BK-MF0-03`.
- Impedir alteracao de `userId`, `role` ou campos internos.
- Guardar `profilePhotoUrl` apenas se for URL controlado.
- Guardar `profilePhotoMode: 'stub_url'`.
- Bloquear qualquer tentativa de `secure_upload` neste BK.

**Scope-out deste passo:**

- Upload real de fotografias do rosto fica para `BK-MF1-05`.
- Consentimento formal para analise facial fica para `BK-MF7-01`.
- Encriptacao de fotografias/relatorios fica para `BK-MF6-07`.
- Analise facial, simulacao, diagnostico e recomendacoes continuam fora da `MF0`.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever codigo, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
    - EDITAR:
        - `server/src/models/profile.model.js`
        - `server/src/validators/profile.validator.js`
        - `server/src/services/profile.service.js`
        - `server/src/controllers/profile.controller.js`
        - `server/src/routes/profile.routes.js`
        - `client/src/App.jsx`

    - CRIAR:
        - `server/src/validators/profile-photo.validator.js`
        - `server/tests/profile.edit.test.js`
        - `client/src/pages/EditProfilePage.jsx`

    - REVER:
        - `docs/RNF.md`: `RNF08`, `RNF11`, `RNF12`, `RNF13`, `RNF25`.
        - `docs/planificacao/guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`.
        - `docs/planificacao/guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md`.
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

### Passo 4 - Criar ou editar `server/src/models/profile.model.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/models/profile.model.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/models/profile.model.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/models/profile.model.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Editar `profileSchema` e acrescentar estes campos depois de `objetivos`.

```js
profilePhotoUrl: {
  type: String,
  default: ''
},
profilePhotoMode: {
  type: String,
  enum: ['stub_url', 'secure_upload'],
  default: 'stub_url'
},
profilePhotoUpdatedAt: {
  type: Date,
  default: null
}
```

5. Explicacao do codigo: o modelo fica preparado para fotografia, mas por defeito usa `stub_url`. O valor `secure_upload` existe para futuro, mas este BK bloqueia esse modo no validator.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `server/src/validators/profile.validator.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/validators/profile.validator.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/validators/profile.validator.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/validators/profile.validator.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Editar `server/src/validators/profile.validator.js` e acrescentar a funcao abaixo no fim do ficheiro.

```js
export function validateUpdateProfileInput(body) {
    const forbiddenKeys = ["userId", "role", "_id", "createdAt", "updatedAt"];
    const payload = {};
    const errors = {};

    for (const key of forbiddenKeys) {
        if (key in body) {
            errors[key] = "Este campo nao pode ser alterado pelo cliente";
        }
    }

    if ("nome" in body) {
        const nome = normalizeText(body.nome);
        if (nome.length < 2 || nome.length > 80) {
            errors.nome = "Nome deve ter entre 2 e 80 caracteres";
        } else {
            payload.nome = nome;
        }
    }

    if ("idade" in body) {
        const idade = Number(body.idade);
        if (!Number.isInteger(idade) || idade < 13 || idade > 120) {
            errors.idade = "Idade deve ser um numero inteiro entre 13 e 120";
        } else {
            payload.idade = idade;
        }
    }

    if ("tipoDePele" in body) {
        const tipoDePele = normalizeText(body.tipoDePele).toLowerCase();
        if (!SKIN_TYPES.includes(tipoDePele)) {
            errors.tipoDePele = `Tipo de pele deve ser um destes: ${SKIN_TYPES.join(", ")}`;
        } else {
            payload.tipoDePele = tipoDePele;
        }
    }

    if ("genero" in body) {
        const genero = normalizeText(body.genero).toLowerCase();
        if (!GENDERS.includes(genero)) {
            errors.genero = `Genero deve ser um destes: ${GENDERS.join(", ")}`;
        } else {
            payload.genero = genero;
        }
    }

    if ("objetivos" in body) {
        const objetivos = normalizeList(body.objetivos);
        if (objetivos.length === 0 || objetivos.length > 5) {
            errors.objetivos = "Indica entre 1 e 5 objetivos";
        } else {
            payload.objetivos = objetivos;
        }
    }

    if (Object.keys(payload).length === 0) {
        errors.base = "Nada para atualizar";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de perfil invalidos", errors);
    }

    return payload;
}
```

5. Explicacao do codigo: a funcao deixa editar apenas campos permitidos. Se o aluno tentar mandar `role` ou `userId`, o backend devolve erro.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 6 - Criar ou editar `server/src/validators/profile-photo.validator.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/validators/profile-photo.validator.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/validators/profile-photo.validator.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/validators/profile-photo.validator.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/validators/profile-photo.validator.js`.

```js
import { AppError } from "../middlewares/error.middleware.js";

const ALLOWED_STUB_HOSTS = ["localhost", "127.0.0.1", "images.orelle.local"];

function parseUrl(value) {
    try {
        return new URL(String(value ?? "").trim());
    } catch {
        return null;
    }
}

export function validateProfilePhotoInput(body) {
    const mode = String(body.profilePhotoMode ?? "stub_url").trim();

    if (mode === "secure_upload") {
        throw new AppError(
            403,
            "Upload real de fotografia bloqueado neste BK; usar stub_url ate existir consentimento e storage seguro",
        );
    }

    if (mode !== "stub_url") {
        throw new AppError(400, "Modo de fotografia invalido");
    }

    const url = parseUrl(body.profilePhotoUrl);

    if (!url || !["http:", "https:"].includes(url.protocol)) {
        throw new AppError(
            400,
            "profilePhotoUrl deve ser um URL http/https controlado",
        );
    }

    if (!ALLOWED_STUB_HOSTS.includes(url.hostname)) {
        throw new AppError(
            400,
            "profilePhotoUrl deve apontar para origem controlada da Orelle",
        );
    }

    return {
        profilePhotoMode: "stub_url",
        profilePhotoUrl: url.toString(),
    };
}
```

5. Explicacao do codigo: este validator impede upload real e so aceita URLs de origens controladas. Assim o aluno demonstra o fluxo sem recolher imagens faciais reais.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 7 - Criar ou editar `server/src/services/profile.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/profile.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/services/profile.service.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/services/profile.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Editar `server/src/services/profile.service.js` e substituir pelo ficheiro completo abaixo.

```js
import { Profile } from "../models/profile.model.js";
import { AppError } from "../middlewares/error.middleware.js";

function toProfileResponse(profile) {
    return {
        id: profile._id.toString(),
        userId: profile.userId.toString(),
        nome: profile.nome,
        idade: profile.idade,
        tipoDePele: profile.tipoDePele,
        genero: profile.genero,
        objetivos: profile.objetivos,
        profilePhotoUrl: profile.profilePhotoUrl ?? "",
        profilePhotoMode: profile.profilePhotoMode ?? "stub_url",
        profilePhotoUpdatedAt: profile.profilePhotoUpdatedAt ?? null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
}

export async function createMyProfile(userId, input) {
    const existing = await Profile.findOne({ userId }).select("_id");

    if (existing) {
        throw new AppError(409, "Este utilizador ja tem perfil");
    }

    const profile = await Profile.create({ userId, ...input });
    return toProfileResponse(profile);
}

export async function getMyProfile(userId) {
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(404, "Perfil ainda nao criado");
    }

    return toProfileResponse(profile);
}

export async function updateMyProfile(userId, input) {
    const profile = await Profile.findOneAndUpdate(
        { userId },
        { $set: input },
        { new: true, runValidators: true },
    );

    if (!profile) {
        throw new AppError(404, "Perfil ainda nao criado");
    }

    return toProfileResponse(profile);
}

export async function updateMyProfilePhoto(userId, input) {
    const profile = await Profile.findOneAndUpdate(
        { userId },
        {
            $set: {
                profilePhotoUrl: input.profilePhotoUrl,
                profilePhotoMode: input.profilePhotoMode,
                profilePhotoUpdatedAt: new Date(),
            },
        },
        { new: true, runValidators: true },
    );

    if (!profile) {
        throw new AppError(404, "Perfil ainda nao criado");
    }

    return toProfileResponse(profile);
}
```

5. Explicacao do codigo: o service atualiza sempre pelo `userId` da sessao. Nao existe rota para editar perfil de outra pessoa.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `server/src/controllers/profile.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/controllers/profile.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/controllers/profile.controller.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/controllers/profile.controller.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Editar `server/src/controllers/profile.controller.js` e acrescentar estes controllers.

```js
import {
    createMyProfile,
    getMyProfile,
    updateMyProfile,
    updateMyProfilePhoto,
} from "../services/profile.service.js";
import {
    validateCreateProfileInput,
    validateUpdateProfileInput,
} from "../validators/profile.validator.js";
import { validateProfilePhotoInput } from "../validators/profile-photo.validator.js";

export async function updateMyProfileController(req, res, next) {
    try {
        const input = validateUpdateProfileInput(req.body);
        const profile = await updateMyProfile(req.user.id, input);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}

export async function updateMyProfilePhotoController(req, res, next) {
    try {
        const input = validateProfilePhotoInput(req.body);
        const profile = await updateMyProfilePhoto(req.user.id, input);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}
```

Nota de localizacao: se o ficheiro ja tiver `createMyProfileController` e `getMyProfileController`, manter essas funcoes e acrescentar as duas novas exportacoes. O import deve ficar consolidado para nao duplicar linhas.

5. Explicacao do codigo: ha um controller para editar texto e outro para fotografia. Separar ajuda a tratar erros de imagem sem misturar com erros de idade/nome.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 9 - Criar ou editar `server/src/routes/profile.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/routes/profile.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/routes/profile.routes.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/routes/profile.routes.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Editar `server/src/routes/profile.routes.js` e substituir pelo ficheiro completo abaixo.

```js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    createMyProfileController,
    getMyProfileController,
    updateMyProfileController,
    updateMyProfilePhotoController,
} from "../controllers/profile.controller.js";

export const profileRoutes = Router();

profileRoutes.get("/me", requireAuth, getMyProfileController);
profileRoutes.post("/me", requireAuth, createMyProfileController);
profileRoutes.put("/me", requireAuth, updateMyProfileController);
profileRoutes.patch("/me/photo", requireAuth, updateMyProfilePhotoController);
```

5. Explicacao do codigo: todas as rotas de perfil usam `requireAuth`. O aluno nao deve criar `PUT /api/profile/:userId` para clientes.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 10 - Criar ou editar `client/src/pages/EditProfilePage.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/pages/EditProfilePage.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/pages/EditProfilePage.jsx` conforme indicado na frase abaixo.
    - LOCALIZACAO: `client/src/pages/EditProfilePage.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `client/src/pages/EditProfilePage.jsx`.

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function EditProfilePage() {
    const [message, setMessage] = useState("");
    const [profileForm, setProfileForm] = useState({
        nome: "",
        idade: "",
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        objetivosTexto: "hidratar",
    });
    const [photoUrl, setPhotoUrl] = useState(
        "http://localhost/avatar-demo.png",
    );

    function updateProfileField(event) {
        setProfileForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function saveProfile(event) {
        event.preventDefault();
        const objetivos = profileForm.objetivosTexto
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        try {
            await apiRequest("/profile/me", {
                method: "PUT",
                body: JSON.stringify({
                    nome: profileForm.nome,
                    idade: Number(profileForm.idade),
                    tipoDePele: profileForm.tipoDePele,
                    genero: profileForm.genero,
                    objetivos,
                }),
            });
            setMessage("Perfil atualizado");
        } catch (err) {
            setMessage(err.message);
        }
    }

    async function savePhotoStub(event) {
        event.preventDefault();

        try {
            await apiRequest("/profile/me/photo", {
                method: "PATCH",
                body: JSON.stringify({
                    profilePhotoMode: "stub_url",
                    profilePhotoUrl: photoUrl,
                }),
            });
            setMessage("Fotografia stub atualizada");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Editar perfil</h1>

            <form onSubmit={saveProfile}>
                <label>
                    Nome
                    <input
                        name="nome"
                        value={profileForm.nome}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Idade
                    <input
                        name="idade"
                        type="number"
                        value={profileForm.idade}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Tipo de pele
                    <input
                        name="tipoDePele"
                        value={profileForm.tipoDePele}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Genero
                    <input
                        name="genero"
                        value={profileForm.genero}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Objetivos
                    <input
                        name="objetivosTexto"
                        value={profileForm.objetivosTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <button type="submit">Guardar alteracoes</button>
            </form>

            <form onSubmit={savePhotoStub}>
                <label>
                    URL controlado da fotografia
                    <input
                        value={photoUrl}
                        onChange={(event) => setPhotoUrl(event.target.value)}
                    />
                </label>
                <button type="submit">Guardar fotografia stub</button>
            </form>

            {message && <p role="status">{message}</p>}
        </main>
    );
}
```

5. Explicacao do codigo: o formulario de fotografia so envia uma URL controlada. Nao ha `<input type="file">` neste BK.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 11 - Criar ou editar `client/src/App.jsx`

1. Objetivo simples do passo: ligar a pagina de edicao de perfil a app de demonstracao sem criar routing definitivo.
2. Ficheiros envolvidos:
    - EDITAR: `client/src/App.jsx`.
    - LOCALIZACAO: substituir o ficheiro atual por esta versao completa.
    - REVER: `ProfileSetupPage.jsx`, `EditProfilePage.jsx`, `LoginPage.jsx` e `AuthContext.jsx`.
3. O que fazer: manter as paginas de registo/login/perfil e acrescentar a edicao segura de perfil.
4. Codigo completo, correto e integrado:

Editar `client/src/App.jsx` e substituir pelo ficheiro completo abaixo.

```jsx
import { AuthProvider } from "./context/AuthContext.jsx";
import { EditProfilePage } from "./pages/EditProfilePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { ProfileSetupPage } from "./pages/ProfileSetupPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

export function App() {
    return (
        <AuthProvider>
            <RegisterPage />
            <LoginPage />
            <ProfileSetupPage />
            <EditProfilePage />
        </AuthProvider>
    );
}
```

5. Explicacao do codigo: nesta fase a app ainda pode mostrar paginas em sequencia para demonstracao. O importante e a pagina de edicao usar o mesmo cliente HTTP e o mesmo cookie seguro, sem inventar outro sistema de sessao.
6. Como validar: abrir o frontend depois de login e confirmar que a pagina de edicao chama `PUT /api/profile/me` com credenciais incluídas.
7. Erro comum ou cenario negativo: criar uma segunda app React ou outro provider de auth faria as paginas deixarem de partilhar a mesma sessao.

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

Editar perfil:

```http
PUT /api/profile/me
Cookie: orelle_session=...
Content-Type: application/json

{
  "nome": "Marta Silva",
  "idade": 19,
  "tipoDePele": "mista",
  "genero": "feminino",
  "objetivos": ["hidratar", "uniformizar textura"]
}
```

Resposta `200`:

```json
{
    "profile": {
        "nome": "Marta Silva",
        "idade": 19,
        "profilePhotoMode": "stub_url"
    }
}
```

Atualizar fotografia stub:

```http
PATCH /api/profile/me/photo
Cookie: orelle_session=...
Content-Type: application/json

{
  "profilePhotoMode": "stub_url",
  "profilePhotoUrl": "http://localhost/avatar-demo.png"
}
```

Tentativa de upload real bloqueada `403`:

```json
{
    "error": {
        "message": "Upload real de fotografia bloqueado neste BK; usar stub_url ate existir consentimento e storage seguro"
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

Criar este ficheiro em `server/tests/profile.edit.test.js`.

```js
import { describe, expect, it } from "vitest";
import { validateProfilePhotoInput } from "../src/validators/profile-photo.validator.js";

describe("BK-MF0-04 / RF04 - fotografia segura", () => {
    it("aceita URL controlado em modo stub_url", () => {
        const input = validateProfilePhotoInput({
            profilePhotoMode: "stub_url",
            profilePhotoUrl: "http://localhost/avatar-demo.png",
        });

        expect(input.profilePhotoMode).toBe("stub_url");
    });

    it("bloqueia secure_upload neste BK", () => {
        expect(() =>
            validateProfilePhotoInput({
                profilePhotoMode: "secure_upload",
                profilePhotoUrl: "http://localhost/avatar-demo.png",
            }),
        ).toThrow("Upload real de fotografia bloqueado");
    });

    it("rejeita origem externa nao controlada", () => {
        expect(() =>
            validateProfilePhotoInput({
                profilePhotoMode: "stub_url",
                profilePhotoUrl: "https://site-externo.example/avatar.png",
            }),
        ).toThrow("origem controlada");
    });
});
```

5. Explicacao do codigo: estes testes provam que a seguranca nao depende da UI. Mesmo que alguem tente forcar `secure_upload`, o backend bloqueia.
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

Upload real de fotografias so pode ser implementado depois de haver decisao documentada sobre:

- consentimento explicito para imagem facial;
- armazenamento seguro/encriptado;
- limite de tamanho e MIME;
- politica de retencao/apagamento;
- auditoria de acessos.

Ficheiros que devem ser atualizados antes de upload real:

- `docs/planificacao/guias-bk/MF1/BK-MF1-05-permitir-upload-de-fotografias-do-rosto-frontal-e-perfil.md`
- `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md`

### Evidence para PR/defesa

- `PUT /api/profile/me` valido com `200`.
- Tentativa de alterar `role` ou `userId` com `400`.
- `PATCH /api/profile/me/photo` com `stub_url` e `200`.
- Tentativa de `secure_upload` com `403`.
- Screenshot da UI sem input de ficheiro real.

### Handoff para BK-MF0-05

O proximo BK deve manter roles em `User`, nao em `Profile`. Este BK nunca deve permitir editar permissoes.

## Changelog

- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para edição segura de perfil e foto não analítica.
- `2026-05-25`: reforçada regra de consentimento, storage seguro e stub obrigatório quando upload real não existir.
- `2026-05-29`: tutorial linear integrado com update de perfil, fotografia stub, bloqueio de upload real, payloads, testes e handoff.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com codigo, explicacao, validacao e negativo no passo onde sao usados.
- `2026-05-29`: acrescentado `client/src/App.jsx` completo para ligar a pagina de edicao de perfil.
