# BK-MF0-06 - Cada utilizador pode guardar preferências de produtos e marcas favoritas

## Header
- `doc_id`: `GUIA-BK-MF0-06`
- `bk_id`: `BK-MF0-06`
- `macro`: `MF0`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF0-03`
- `rf_rnf`: `RF06`
- `fase_documental`: `Fase 1`
- `sprint`: `S01-S02`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF0-07`
- `guia_path`: `docs/planificacao/guias-bk/MF0/BK-MF0-06-cada-utilizador-pode-guardar-preferencias-de-produtos-e-marcas-favoritas.md`
- `last_updated`: `2026-05-25`

#### BK-MF0-06 - Cada utilizador pode guardar preferências de produtos e marcas favoritas

##### O que vamos fazer neste BK

Neste BK vamos criar a área de preferências do cliente: marcas favoritas e contrato preparado para produtos favoritos. Como `BK-MF0-07` ainda vem a seguir, `favoriteProductIds` não deve ser tratado como funcionalidade final completa nesta fase.

O backend terá endpoints `GET /api/preferences/me` e `PUT /api/preferences/me`. O frontend terá uma página simples para editar marcas favoritas. Produtos favoritos só devem ficar ativos depois de existir catálogo e validação contra `Product` em `BK-MF0-07`.

Esta fase foi detalhada sem mockup. A UI deve ser discreta e extensível, sem definir identidade visual final.

##### Porque e que isto e importante

- Prepara personalização e recomendações sem IA.
- Liga perfil do utilizador a marcas e produtos relevantes para comércio.
- Evita que preferências fiquem misturadas no modelo `Profile`.
- Prepara `RF09`, `RF18`, `RF21` e carrinho/histórico.

##### O que entra (scope)

- Modelo `Preference` associado ao `User`.
- Guardar `favoriteBrandNames`.
- Preparar `favoriteProductIds` como contrato técnico futuro, sem o apresentar como fluxo final enquanto `Product` não existir.
- Endpoints `GET` e `PUT` de preferências do próprio utilizador.
- UI simples de preferências.
- Validação de listas e IDs.

##### O que nao entra (scope-out)

- Criação de produtos, que fica para `BK-MF0-07`.
- Pesquisa/filtros por marca, que ficam para `MF1`.
- Recomendação automática por IA.
- Regras de alergias/restrições médicas, que ficam para `BK-MF4-08`.

##### Como saber que isto ficou bem

- Utilizador autenticado guarda e consulta marcas favoritas.
- Lista demasiado grande ou valores vazios são rejeitados.
- Produtos favoritos aceitam apenas IDs válidos depois de `BK-MF0-07`; antes disso, IDs de produto devem ficar vazios, desativados na UI ou rejeitados de forma controlada.
- Outro utilizador não lê nem altera preferências alheias.
- `BK-MF0-07` consegue ligar produtos a estas preferências sem mudar contrato.

#### Metadados do BK (CANONICO/DERIVADO):

- Prioridade: `P1` (CANONICO)
- Estado: `TODO` (CANONICO)
- Esforco: `S` (CANONICO)
- macro: `MF0` (CANONICO)
- Owner: `Izelicks` (CANONICO)
- Apoio: `Bruna` (CANONICO)
- Dependencias (BK IDs): `BK-MF0-03` (CANONICO)
- Pre-condicoes: perfil existe; utilizador autenticado recomendado (DERIVADO)
- Ref. Plano: `RF06`, `Fase 1`, `S01-S02`, `Core` (CANONICO)
- Flow ID: `FLOW-PREFERENCES` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF06` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-06` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-06` (CANONICO)
- Descricao: preferências de produtos e marcas favoritas por utilizador (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: `User` e `Profile` existem; catálogo pode ainda não existir.
- Estado esperado depois do BK: preferências de marcas ficam funcionais; produtos favoritos ficam apenas preparados como contrato para ligar ao catálogo depois de `BK-MF0-07`.
- Ficheiros a criar: `server/src/models/preference.model.js`, `server/src/routes/preferences.routes.js`, `server/src/controllers/preferences.controller.js`, `server/src/services/preferences.service.js`, `server/src/validators/preferences.validator.js`, `client/src/pages/PreferencesPage.jsx`.
- Ficheiros a editar: `server/src/app.js`, `client/src/App.jsx`, `client/src/services/apiClient.js`.
- Dependencias de BK anteriores: `BK-MF0-03` garante que o utilizador tem contexto de perfil; `BK-MF0-02` fornece sessão se já executado.
- Impacto na arquitetura: adiciona módulo `preferences` separado de perfil e catálogo.
- Impacto em frontend: cria página editável com chips/lista de marcas.
- Impacto em backend: cria upsert de preferências por user.
- Impacto em dados: cria coleção `preferences` com `userId` único.
- Impacto em segurança: preferências são privadas por utilizador.
- Impacto em testes: P1 exige unit/integration e 2 negativos.
- Handoff para o próximo BK: `BK-MF0-07` cria `Product`; só depois disso `favoriteProductIds` pode ser validado contra catálogo real.

#### Pre-leitura minima (10-15 min) (DERIVADO):

- `docs/RF.md`: `RF06`, ler também `RF07` e `RF09` para perceber continuidade.
- Guia `BK-MF0-03`: perfil do utilizador.
- Guia `BK-MF0-05`: roles, apenas para perceber que preferências são de cliente.
- Mockup: não existe nesta execução.

#### Glossario (rapido) (DERIVADO):

- `Preferência`: escolha guardada pelo utilizador para personalizar a experiência.
- `Upsert`: criar se não existir, atualizar se já existir.
- `favoriteBrandNames`: lista de marcas favoritas por nome.
- `favoriteProductIds`: lista de IDs de produtos favoritos; nesta fase é contrato preparado, não fluxo final ativo.
- `ObjectId`: identificador MongoDB.
- `Chip`: pequeno item visual removível numa lista.
- `Lista privada`: dados acessíveis apenas ao dono.

#### Conceitos teoricos essenciais (DERIVADO):

Preferências não são o mesmo que perfil. O perfil descreve a pessoa e a pele; preferências descrevem escolhas de consumo, como marcas ou produtos favoritos. Separar estes módulos evita modelos demasiado grandes e facilita recomendações futuras.

Como produtos ainda não existem neste ponto da sequência, o campo `favoriteProductIds` deve ser preparado, mas a UI deve começar por marcas favoritas. Se o backend receber IDs de produto antes de o catálogo estar integrado, deve rejeitar ou ignorar de forma explícita e documentada, nunca fingir que validou produtos inexistentes.

Um upsert é útil aqui: se o utilizador ainda não tem preferências, o sistema cria; se já tem, atualiza. O endpoint mantém o mesmo contrato para o frontend.

#### Guia de execucao (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): definir contrato de preferências**
   - Descricao detalhada do objetivo: separar marcas favoritas de produtos favoritos.
   - Justificacao: marcas podem existir antes do catálogo; produtos dependem de `BK-MF0-07`.
   - Como fazer (0.1): documentar `favoriteBrandNames`.
   - Como fazer (0.2): preparar `favoriteProductIds` como array opcional, inicialmente vazio e sem UI ativa.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/models/preference.model.js`.
   - Snippet de referencia: `favoriteBrandNames: [{ type: String, trim: true }]`.
   - O que verificar: não há dependência obrigatória de `Product` nem seleção de produto final antes de `BK-MF0-07`.

1. **Objetivo (~25 min): criar modelo Preference**
   - Descricao detalhada do objetivo: guardar preferências por utilizador.
   - Justificacao: preferências são dados persistentes e privados.
   - Como fazer (1.1): criar `userId` único e obrigatório.
   - Como fazer (1.2): criar arrays para marcas e produtos.
   - Ficheiro a rever: `server/src/models/profile.model.js`.
   - Ficheiro alvo: `server/src/models/preference.model.js`.
   - Snippet de referencia: `userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true }`.
   - O que verificar: cada user tem no máximo um documento de preferências.

2. **Objetivo (~25 min): validar listas de preferências**
   - Descricao detalhada do objetivo: limpar duplicados, strings vazias e listas exageradas.
   - Justificacao: listas sem controlo prejudicam UI e recomendações.
   - Como fazer (2.1): normalizar marcas com `trim`.
   - Como fazer (2.2): limitar quantidade máxima definida pela equipa.
   - Ficheiro a rever: `docs/RF.md`.
   - Ficheiro alvo: `server/src/validators/preferences.validator.js`.
   - Snippet de referencia: `const brands = [...new Set(input.favoriteBrandNames.map(normalizeBrand))];`.
   - O que verificar: string vazia não é guardada.

3. **Objetivo (~30 min): implementar service com upsert**
   - Descricao detalhada do objetivo: criar ou atualizar preferências do utilizador.
   - Justificacao: o frontend não precisa saber se é primeira gravação.
   - Como fazer (3.1): usar `findOneAndUpdate` com `upsert: true`.
   - Como fazer (3.2): se ainda não existir `Product`, manter `favoriteProductIds` vazio ou devolver erro controlado para IDs não vazios.
   - Ficheiro a rever: `server/src/models/preference.model.js`.
   - Ficheiro alvo: `server/src/services/preferences.service.js`.
   - Snippet de referencia: `await Preference.findOneAndUpdate({ userId }, payload, { upsert: true, new: true });`.
   - O que verificar: segunda gravação atualiza o mesmo documento e não aceita produto inexistente como se fosse válido.

4. **Objetivo (~30 min): criar endpoints protegidos**
   - Descricao detalhada do objetivo: expor consulta e gravação de preferências próprias.
   - Justificacao: preferências são privadas e não devem aceitar `userId` no body.
   - Como fazer (4.1): criar `GET /api/preferences/me`.
   - Como fazer (4.2): criar `PUT /api/preferences/me`.
   - Ficheiro a rever: `server/src/middlewares/auth.middleware.js`.
   - Ficheiro alvo: `server/src/routes/preferences.routes.js`.
   - Snippet de referencia: `router.put('/me', requireAuth, updateMyPreferencesController);`.
   - O que verificar: sem sessão devolve `401`.

5. **Objetivo (~45 min): criar UI e evidence**
   - Descricao detalhada do objetivo: permitir editar marcas favoritas com feedback.
   - Justificacao: o aluno consegue demonstrar personalização mesmo antes do catálogo.
   - Como fazer (5.1): criar input para adicionar/remover marcas.
   - Como fazer (5.2): Executar cenarios negativos obrigatorios (minimo 2) e registar resultados.
   - Ficheiro a rever: `client/src/App.jsx`.
   - Ficheiro alvo: `client/src/pages/PreferencesPage.jsx`.
   - Snippet de referencia: `await apiClient.put('/preferences/me', { favoriteBrandNames });`.
   - O que verificar: marcas aparecem após refresh ou nova consulta.

#### Checklist de validacao (DERIVADO):

- Smoke: guardar duas marcas favoritas e consultá-las em `/api/preferences/me`.
- Negativo 1: passo 4; pedido sem sessão; resultado esperado `401`; risco que cobre: exposição de preferências.
- Negativo 2: passo 2; lista com strings vazias ou excesso de itens; resultado esperado `400`; risco que cobre: dados inúteis ou abusivos.
- Negativo 3: passo 3; enviar `favoriteProductIds` antes de `Product` existir; resultado esperado erro controlado ou lista vazia documentada; risco que cobre: simular funcionalidade final sem catálogo.
- Tecnico: `Preference.userId` é único.
- Regressao das fases anteriores: perfil e login continuam a funcionar.
- UI/mockup: sem mockup; usar lista/chips simples.
- Seguranca: backend ignora qualquer `userId` enviado pelo cliente.

#### Criterios de aceite:

- Outputs: modelo `Preference`, endpoints `/api/preferences/me`, página `PreferencesPage`.
- Verificacoes: gravação válida `200`, consulta `200`, inválidos `400`, sem sessão `401`.
- Qualidade: marcas ficam funcionais agora; produtos favoritos ficam explicitamente preparados e só são ligados depois de `BK-MF0-07`.
- Continuidade: `BK-MF0-07` pode usar `favoriteProductIds` sem mudar endpoints.
- Evidencia: screenshots ou curl com guardar/consultar preferências e negativos.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher apos validacao`
- `neg`: `A preencher apos testes negativos`
- `files`: `server/src/models/preference.model.js`, `server/src/routes/preferences.routes.js`, `client/src/pages/PreferencesPage.jsx`
- `commands`: `curl -X PUT /api/preferences/me`, `npm test`
- `screenshots`: marcas favoritas guardadas
- `notes`: produtos favoritos ficam preparados para depois do catálogo; não demonstrar seleção real antes de `BK-MF0-07`

#### TODOs

- TODO: confirmar limite máximo de marcas/produtos favoritos.
- TODO: confirmar se marcas devem virar entidade própria no futuro.
- TODO (BLOCKER): se auth não estiver disponível, testar com user controlado e documentar limitação.
- FOLLOW-UP: ligar `favoriteProductIds` ao catálogo apenas depois de `BK-MF0-07`, com validação real de `Product`.

## Contexto do BK
- Entrega alvo: implementar `Cada utilizador pode guardar preferências de produtos e marcas favoritas` com rastreabilidade direta ao requisito `RF06`.
- Foco tecnico da macro: `Fundamentos e governance`.
- Regra de governanca: preservar IDs BK, contrato de campos e consistencia entre backlog, matriz, sprints e guias.

## Bloco pedagogico
### Objetivo
Criar preferências privadas por utilizador, preparando personalização por marca e produto.

### Pre-requisitos
- Rever `RF06`.
- Ter perfil de `BK-MF0-03`.
- Ter sessão ou utilizador de teste.

### Erros comuns
- Guardar preferências dentro de `Profile` sem separação.
- Obrigar a produtos antes do catálogo existir.
- Aceitar `userId` vindo do cliente.
- Apresentar produtos favoritos como funcionalidade final quando só existe contrato preparado.

### Check de compreensao
- [ ] Sei explicar upsert.
- [ ] Sei distinguir perfil de preferência.
- [ ] Sei demonstrar que outro user não acede a estas preferências.

### Tempo estimado
- `S`: 1 a 2 horas.

## Bloco operacional
### Entrada
- BK: `BK-MF0-06`
- Requisito: `RF06`
- Dependencias: `BK-MF0-03`
- Artefactos: `RF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos
1. Definir contrato de preferências.
2. Criar modelo `Preference`.
3. Criar validator de listas.
4. Criar service com upsert.
5. Criar endpoints protegidos e UI.
6. Executar cenarios negativos obrigatorios (minimo 2) e registar evidência.

### Cenarios negativos recomendados
- Pedido sem sessão deve devolver `401`.
- Lista inválida ou excessiva deve devolver `400`.

### Validacao
- [ ] Smoke: guardar e consultar marcas favoritas.
- [ ] Negativos: minimo `2` cenarios com resultado controlado.
- [ ] Tecnico: `userId` único no modelo.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificaveis.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF0-07`
- O próximo BK deve criar `Product`; só depois se pode ativar favoritos por produto com validação real.

## Snippet tecnico aplicavel
```js
const BK_ID = 'BK-MF0-06';
const REQ_ID = 'RF06';
const MIN_NEGATIVOS = 2;

export function validarEvidenceBkMf006({ smokeOk, negativos, preference }) {
  if (!smokeOk) throw new Error(`${BK_ID}/${REQ_ID}: smoke de preferências falhou`);
  if (negativos < 2) throw new Error(`${BK_ID}/${REQ_ID}: negativos insuficientes`);
  if (!preference?.userId) throw new Error(`${BK_ID}/${REQ_ID}: preferências sem userId`);
  return { bkId: BK_ID, reqId: REQ_ID, minNegativos: MIN_NEGATIVOS, status: 'OK' };
}
```

## Criterios de aceite
- Entrega funcional especifica de `Cada utilizador pode guardar preferências de produtos e marcas favoritas` validada contra `RF06`.
- Cenarios negativos concluidos: minimo `2` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P1`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisao tecnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher apos validacao`
- `proof_negativos`: `A preencher apos testes negativos`
- `proof_negocio`: preferências de marcas melhoram personalização futura; favoritos por produto ficam pendentes do catálogo.

## Proximo BK recomendado
`BK-MF0-07`

## Changelog
- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para preferências de marcas/produtos.
- `2026-05-25`: reforçado que `favoriteProductIds` é contrato preparado até existir catálogo em `BK-MF0-07`.
