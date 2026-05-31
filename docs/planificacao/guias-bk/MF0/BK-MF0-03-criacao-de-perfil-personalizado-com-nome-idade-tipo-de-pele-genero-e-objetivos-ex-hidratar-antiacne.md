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
- `last_updated`: `2026-05-29`

#### BK-MF0-03 - Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos (ex: hidratar, antiacne)

##### O que vamos fazer neste BK

Neste BK vamos criar o perfil cosmético inicial do cliente. O registo de `BK-MF0-01` cria a conta; este BK acrescenta dados usados para personalização: nome, idade, tipo de pele, género e objetivos como hidratação ou antiacne.

O perfil deve ficar associado ao utilizador autenticado. Por isso, tecnicamente reutiliza a sessão de `BK-MF0-02` quando já existir, embora a dependência canónica seja `BK-MF0-01`. Se o login ainda não estiver implementado, usar uma conta de teste local e marcar a limitação na evidence.

Esta fase foi detalhada sem mockup. O formulário deve ser claro e modular para poder evoluir quando houver design final.

##### Porque é que isto é importante

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

##### O que não entra (scope-out)

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
- Dependências (BK IDs): `BK-MF0-01` (CANONICO)
- Pré-condições: `User` criado; autenticação disponível ou conta de teste controlada (DERIVADO)
- Ref. Plano: `RF03`, `Fase 1`, `S01-S02`, `Reforco` (CANONICO)
- Flow ID: `FLOW-PROFILE-CREATE` (DERIVADO)
- Fonte de verdade: `docs/RF.md` -> `RF03` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/BACKLOG-MVP.md` -> linha `BK-MF0-03` (CANONICO)
- Fonte de verdade: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md` -> linha `BK-MF0-03` (CANONICO)
- Descrição: criação de perfil personalizado para personalização cosmética inicial (CANONICO)

#### O que vamos fazer neste BK (DERIVADO):

- Estado esperado antes do BK: existe `User`; a sessão pode existir se `BK-MF0-02` já foi executado.
- Estado esperado depois do BK: existe `Profile` por utilizador, consultável e validado.
- Ficheiros a criar: `server/src/models/profile.model.js`, `server/src/routes/profile.routes.js`, `server/src/controllers/profile.controller.js`, `server/src/services/profile.service.js`, `server/src/validators/profile.validator.js`, `client/src/pages/ProfileSetupPage.jsx`.
- Ficheiros a editar: `server/src/app.js`, `client/src/App.jsx`, `client/src/services/apiClient.js`.
- Dependências de BK anteriores: `BK-MF0-01` fornece `User._id`; `BK-MF0-02` fornece `req.user` se já estiver implementado.
- Impacto na arquitetura: adiciona módulo `profile` separado de `auth`.
- Impacto em frontend: adiciona formulário multi-campo com estados de erro.
- Impacto em backend: adiciona rotas protegidas e service de perfil.
- Impacto em dados: cria coleção `profiles` com relação `userId` única.
- Impacto em segurança: utilizador só acede ao próprio perfil.
- Impacto em testes: validar criação, duplicação, campos inválidos e acesso sem auth.
- Handoff para o próximo BK: `BK-MF0-04` edita estes campos sem criar perfil duplicado.

#### Pre-leitura mínima (10-15 min) (DERIVADO):

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

#### Guia de execução (passo-a-passo) (DERIVADO):

0. **Objetivo (~15 min): confirmar campos canónicos do perfil**
    - Descrição detalhada do objetivo: alinhar os campos com `RF03`.
    - Justificação: inventar campos nesta fase cria drift e confunde recomendações futuras.
    - Como fazer (0.1): listar apenas `nome`, `idade`, `tipoDePele`, `genero`, `objetivos`.
    - Como fazer (0.2): marcar listas de valores como `DERIVADO`.
    - Ficheiro a rever: `docs/RF.md`.
    - Ficheiro alvo: `server/src/validators/profile.validator.js`.
    - Snippet de referência: `const SKIN_TYPES = ['oleosa', 'seca', 'mista', 'normal', 'sensivel'];`.
    - O que verificar: não foram adicionados campos médicos ou alergias neste BK.

1. **Objetivo (~25 min): criar modelo Profile**
    - Descrição detalhada do objetivo: persistir perfil ligado a `User`.
    - Justificação: a relação única evita vários perfis contraditórios por utilizador.
    - Como fazer (1.1): criar `userId` obrigatório, único e referenciado a `User`.
    - Como fazer (1.2): criar campos de perfil com `timestamps`.
    - Ficheiro a rever: `server/src/models/user.model.js`.
    - Ficheiro alvo: `server/src/models/profile.model.js`.
    - Snippet de referência: `userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, required: true }`.
    - O que verificar: índice único em `userId`.

2. **Objetivo (~30 min): criar validação de perfil**
    - Descrição detalhada do objetivo: impedir perfis incompletos ou inconsistentes.
    - Justificação: recomendações futuras dependem de dados previsíveis.
    - Como fazer (2.1): validar `nome` com tamanho mínimo e máximo.
    - Como fazer (2.2): validar idade num intervalo razoável definido pela equipa.
    - Ficheiro a rever: `docs/RF.md`.
    - Ficheiro alvo: `server/src/validators/profile.validator.js`.
    - Snippet de referência: `if (!SKIN_TYPES.includes(tipoDePele)) errors.tipoDePele = 'Tipo de pele inválido';`.
    - O que verificar: erros são claros e por campo.

3. **Objetivo (~35 min): implementar service de criação**
    - Descrição detalhada do objetivo: criar perfil para o utilizador autenticado.
    - Justificação: o service garante que cada user só cria um perfil.
    - Como fazer (3.1): procurar perfil existente por `userId`.
    - Como fazer (3.2): devolver `409` se já existir.
    - Ficheiro a rever: `server/src/models/profile.model.js`.
    - Ficheiro alvo: `server/src/services/profile.service.js`.
    - Snippet de referência: `const existing = await Profile.findOne({ userId });`.
    - O que verificar: chamadas repetidas não criam duplicados.

4. **Objetivo (~30 min): criar rotas protegidas de perfil**
    - Descrição detalhada do objetivo: expor `POST /api/profile/me` e `GET /api/profile/me`.
    - Justificação: usar `/me` deixa claro que a operação é sobre o próprio utilizador.
    - Como fazer (4.1): aplicar `requireAuth`.
    - Como fazer (4.2): no controller, usar `req.user.id`.
    - Ficheiro a rever: `server/src/middlewares/auth.middleware.js`.
    - Ficheiro alvo: `server/src/routes/profile.routes.js`.
    - Snippet de referência: `router.post('/me', requireAuth, createMyProfileController);`.
    - O que verificar: sem login devolve `401`.

5. **Objetivo (~40 min): criar formulário React**
    - Descrição detalhada do objetivo: permitir ao cliente preencher o perfil.
    - Justificação: a PAP deve demonstrar fluxo utilizável, não só API.
    - Como fazer (5.1): criar inputs controlados para cada campo.
    - Como fazer (5.2): usar select ou radio para valores fechados.
    - Ficheiro a rever: `client/src/App.jsx`.
    - Ficheiro alvo: `client/src/pages/ProfileSetupPage.jsx`.
    - Snippet de referência: `<select name="tipoDePele" value={form.tipoDePele}>`.
    - O que verificar: o formulário mostra loading, erro e sucesso.

6. **Objetivo (~30 min): preparar dados para fases futuras**
    - Descrição detalhada do objetivo: garantir que o perfil é útil para recomendações sem antecipar IA.
    - Justificação: `MF1` e `MF2` vão usar estes campos como contexto.
    - Como fazer (6.1): normalizar `objetivos` como array de strings curtas.
    - Como fazer (6.2): documentar que alergias e restrições ficam fora.
    - Ficheiro a rever: `docs/RF.md`.
    - Ficheiro alvo: `server/src/services/profile.service.js`.
    - Snippet de referência: `objetivos: objetivos.map((item) => item.trim().toLowerCase())`.
    - O que verificar: objetivos vazios ou duplicados são tratados.

7. **Objetivo (~45 min): validar negativos e handoff**
    - Descrição detalhada do objetivo: provar que o perfil funciona e não quebra auth.
    - Justificação: perfil será dependência direta de upload e recomendações.
    - Como fazer (7.1): testar criação válida e consulta.
    - Como fazer (7.2): Executar cenários negativos obrigatórios (mínimo 3) e registar resultados.
    - Ficheiro a rever: `docs/planificacao/sprints/PLANO-SPRINTS.md`.
    - Ficheiro alvo: `server/tests/profile.test.js`.
    - Snippet de referência: `expect(response.status).toBe(409);`.
    - O que verificar: evidence mostra perfil único por user.

#### Checklist de validação (DERIVADO):

- Smoke: utilizador autenticado cria perfil e consulta em `/api/profile/me`.
- Negativo 1: passo 4; criar perfil sem sessão; resultado esperado `401`; risco que cobre: acesso anónimo.
- Negativo 2: passo 2; idade inválida; resultado esperado `400`; risco que cobre: dados incoerentes.
- Negativo 3: passo 3; criar segundo perfil para mesmo user; resultado esperado `409`; risco que cobre: duplicação de perfil.
- Técnico: `Profile.userId` tem índice único.
- Regressão das fases anteriores: registo/login continuam válidos.
- UI/mockup: sem mockup; formulário baseline e responsivo.
- Segurança: controller usa `req.user.id`, nunca `userId` enviado pelo cliente.

#### Critérios de aceite:

- Outputs: modelo `Profile`, endpoints `/api/profile/me`, formulário `ProfileSetupPage`.
- Verificações: criação válida `201`, consulta `200`, duplicado `409`, inválidos `400`.
- Qualidade: campos normalizados e sem dados médicos fora de scope.
- Continuidade: `BK-MF0-04` consegue editar o perfil; `MF1` consegue usar contexto de pele.
- Evidência: testes ou curl com perfil criado, duplicado rejeitado e acesso sem auth bloqueado.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).

#### Evidence (para o PR/defesa):

- `pr`: `A preencher no fecho do BK`
- `proof`: `A preencher após validação`
- `neg`: `A preencher após testes negativos`
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
- Foco técnico da macro: `Fundamentos e governance`.
- Regra de governança: preservar IDs BK, contrato de campos e consistência entre backlog, matriz, sprints e guias.

## Bloco pedagógico

### Objetivo

Criar o perfil cosmético inicial, separando credenciais (`User`) de personalização (`Profile`).

### Pré-requisitos

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
- Dependências: `BK-MF0-01`
- Artefactos: `RF.md`, `BACKLOG-MVP.md`, `MATRIZ-CANONICA-BK.md`

### Passos

1. Confirmar campos do `RF03`.
2. Criar modelo `Profile`.
3. Criar validator de perfil.
4. Criar service de criação única.
5. Criar routes/controller protegidos.
6. Criar formulário React.
7. Testar integração com auth.
8. Executar cenários negativos obrigatórios (mínimo 3) e registar evidência.

### Cenários negativos recomendados

- Pedido sem sessão deve devolver `401`.
- Idade ou tipo de pele inválidos devem devolver `400`.
- Segundo perfil para o mesmo user deve devolver `409`.

### Validação

- [ ] Smoke: perfil válido é criado.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Técnico: relação `User -> Profile` é única.
- [ ] Evidence: `pr`, `proof`, `neg` preenchidos com artefactos verificáveis.

### Matriz mínima de testes por prioridade

- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff

- Próximo BK recomendado: `BK-MF0-04`
- O próximo BK deve atualizar este perfil, não criar outro.

## Snippet técnico aplicável

O código aplicável deste BK-MF0-03 já não fica como anexo isolado. Para cumprir o contrato documental sem contrariar o formato tutorial, considera-se técnico aplicável o conjunto de blocos completos no `## Tutorial linear de implementação`, sempre ligados a `BK-MF0-03` e `RF03`.

Usar um snippet solto aqui seria pedagogicamente mais fraco: o aluno poderia copiar uma função sem perceber ficheiro, imports, validação, erro esperado e handoff. Por isso, o código foi integrado nos passos onde é usado.

## Critérios de aceite

- Entrega funcional específica de `Criação de perfil personalizado com nome, idade, tipo de pele, género e objetivos` validada contra `RF03`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada conforme prioridade (`P0`).
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa

- `pr`: `A preencher no fecho do BK`
- `proof_tecnico`: `A preencher após validação`
- `proof_negativos`: `A preencher após testes negativos`
- `proof_negocio`: perfil prepara contexto para personalização futura; análise IA e recomendações avançadas ficam fora da MF0.

## Próximo BK recomendado

`BK-MF0-04`

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

**Scope-in deste passo:**

- Criar um perfil por utilizador autenticado.
- Guardar apenas os campos de `RF03`: `nome`, `idade`, `tipoDePele`, `genero` e `objetivos`.
- Normalizar listas simples para que BKs futuros consigam usar os dados.
- Impedir segundo perfil para o mesmo `userId`.
- Criar UI simples de configuração de perfil.

**Scope-out deste passo:**

- Fotografias ficam para `BK-MF0-04` e `BK-MF1-05`.
- Alergias, ingredientes a evitar e restrições médicas leves ficam para `BK-MF4-08`.
- Análise facial, diagnóstico, relatórios, simulação e recomendações avancadas ficam fora da `MF0`.
- O perfil não deve fazer promessas clinicas nem substituir aconselhamento médico.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever código, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
    - CRIAR:
        - `server/src/models/profile.model.js`
        - `server/src/validators/profile.validator.js`
        - `server/src/services/profile.service.js`
        - `server/src/controllers/profile.controller.js`
        - `server/src/routes/profile.routes.js`
        - `server/tests/profile.test.js`
        - `client/src/pages/ProfileSetupPage.jsx`

    - EDITAR:
        - `server/src/app.js`
        - `client/src/App.jsx`

    - REVER:
        - `server/src/middlewares/auth.middleware.js`, criado no `BK-MF0-02`.
        - `docs/RF.md`, requisito `RF03`.
        - `docs/planificacao/guias-bk/MF0/BK-MF0-04-possibilidade-de-editar-o-perfil-e-atualizar-fotografias-periodicamente.md`, porque vai editar este perfil.
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

### Passo 4 - Criar ou editar `server/src/models/profile.model.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/models/profile.model.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/models/profile.model.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/models/profile.model.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/models/profile.model.js`.

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const SKIN_TYPES = ["oleosa", "seca", "mista", "normal", "sensivel"];
export const GENDERS = [
    "feminino",
    "masculino",
    "nao_binario",
    "prefiro_nao_dizer",
];

const profileSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        nome: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
        },
        idade: {
            type: Number,
            required: true,
            min: 13,
            max: 120,
        },
        tipoDePele: {
            type: String,
            required: true,
            enum: SKIN_TYPES,
        },
        genero: {
            type: String,
            required: true,
            enum: GENDERS,
        },
        objetivos: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true },
);

export const Profile = model("Profile", profileSchema);
```

5. Explicação do código: `userId` liga o perfil a uma conta. O `unique: true` impede que a mesma conta tenha dois perfis.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `server/src/validators/profile.validator.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/validators/profile.validator.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/validators/profile.validator.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/validators/profile.validator.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/validators/profile.validator.js`.

```js
import { AppError } from "../middlewares/error.middleware.js";
import { GENDERS, SKIN_TYPES } from "../models/profile.model.js";

function normalizeText(value) {
    return String(value ?? "").trim();
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

export function validateCreateProfileInput(body) {
    const input = {
        nome: normalizeText(body.nome),
        idade: Number(body.idade),
        tipoDePele: normalizeText(body.tipoDePele).toLowerCase(),
        genero: normalizeText(body.genero).toLowerCase(),
        objetivos: normalizeList(body.objetivos),
    };

    const errors = {};

    if (input.nome.length < 2 || input.nome.length > 80) {
        errors.nome = "Nome deve ter entre 2 e 80 caracteres";
    }

    if (
        !Number.isInteger(input.idade) ||
        input.idade < 13 ||
        input.idade > 120
    ) {
        errors.idade = "Idade deve ser um numero inteiro entre 13 e 120";
    }

    if (!SKIN_TYPES.includes(input.tipoDePele)) {
        errors.tipoDePele = `Tipo de pele deve ser um destes: ${SKIN_TYPES.join(", ")}`;
    }

    if (!GENDERS.includes(input.genero)) {
        errors.genero = `Genero deve ser um destes: ${GENDERS.join(", ")}`;
    }

    if (input.objetivos.length === 0 || input.objetivos.length > 5) {
        errors.objetivos = "Indica entre 1 e 5 objetivos";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de perfil invalidos", errors);
    }

    return input;
}
```

5. Explicação do código: o validator transforma dados vindos do frontend em dados previsiveis. Isto ajuda recomendações futuras sem criar campos fora do RF.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 6 - Criar ou editar `server/src/services/profile.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/profile.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/services/profile.service.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/services/profile.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/services/profile.service.js`.

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
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
}

export async function createMyProfile(userId, input) {
    const existing = await Profile.findOne({ userId }).select("_id");

    if (existing) {
        throw new AppError(409, "Este utilizador já tem perfil");
    }

    const profile = await Profile.create({
        userId,
        ...input,
    });

    return toProfileResponse(profile);
}

export async function getMyProfile(userId) {
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(404, "Perfil ainda não criado");
    }

    return toProfileResponse(profile);
}
```

5. Explicação do código: o service usa sempre `userId` vindo da sessão. O frontend nunca escolhe para quem esta a criar perfil.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 7 - Criar ou editar `server/src/controllers/profile.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/controllers/profile.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/controllers/profile.controller.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/controllers/profile.controller.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/controllers/profile.controller.js`.

```js
import { createMyProfile, getMyProfile } from "../services/profile.service.js";
import { validateCreateProfileInput } from "../validators/profile.validator.js";

export async function createMyProfileController(req, res, next) {
    try {
        const input = validateCreateProfileInput(req.body);
        const profile = await createMyProfile(req.user.id, input);

        return res.status(201).json({ profile });
    } catch (err) {
        return next(err);
    }
}

export async function getMyProfileController(req, res, next) {
    try {
        const profile = await getMyProfile(req.user.id);

        return res.status(200).json({ profile });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicação do código: o controller recebe o pedido autenticado e chama o service. A propriedade `req.user.id` vem do `requireAuth`.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `server/src/routes/profile.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/routes/profile.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/routes/profile.routes.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/routes/profile.routes.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `server/src/routes/profile.routes.js`.

```js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    createMyProfileController,
    getMyProfileController,
} from "../controllers/profile.controller.js";

export const profileRoutes = Router();

profileRoutes.get("/me", requireAuth, getMyProfileController);
profileRoutes.post("/me", requireAuth, createMyProfileController);
```

5. Explicação do código: a rota usa `/me` para reforcar que o perfil pertence ao utilizador autenticado, não a um ID enviado pelo cliente.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 9 - Criar ou editar `server/src/app.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/app.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/app.js` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `server/src/app.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `server/src/app.js` e substituir pelo ficheiro completo abaixo, preservando autenticação do `BK-MF0-02` e montando o perfil neste BK.

```js
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
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

    app.use(errorMiddleware);

    return app;
}
```

5. Explicação do código: o ficheiro continua a criar a app Express completa. O perfil entra depois de `/api/auth`, porque as rotas de perfil usam `requireAuth` e precisam da sessão já configurada no BK anterior.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 10 - Criar ou editar `client/src/pages/ProfileSetupPage.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/pages/ProfileSetupPage.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/pages/ProfileSetupPage.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/pages/ProfileSetupPage.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Criar este ficheiro em `client/src/pages/ProfileSetupPage.jsx`.

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

const initialForm = {
    nome: "",
    idade: "",
    tipoDePele: "mista",
    genero: "prefiro_nao_dizer",
    objetivosTexto: "hidratar",
};

export function ProfileSetupPage() {
    const [form, setForm] = useState(initialForm);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        const objetivos = form.objetivosTexto
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

        try {
            await apiRequest("/profile/me", {
                method: "POST",
                body: JSON.stringify({
                    nome: form.nome,
                    idade: Number(form.idade),
                    tipoDePele: form.tipoDePele,
                    genero: form.genero,
                    objetivos,
                }),
            });

            setMessage("Perfil criado com sucesso");
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Perfil Orélle</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Nome
                    <input
                        name="nome"
                        value={form.nome}
                        onChange={updateField}
                        required
                    />
                </label>

                <label>
                    Idade
                    <input
                        name="idade"
                        type="number"
                        min="13"
                        max="120"
                        value={form.idade}
                        onChange={updateField}
                        required
                    />
                </label>

                <label>
                    Tipo de pele
                    <select
                        name="tipoDePele"
                        value={form.tipoDePele}
                        onChange={updateField}
                    >
                        <option value="oleosa">Oleosa</option>
                        <option value="seca">Seca</option>
                        <option value="mista">Mista</option>
                        <option value="normal">Normal</option>
                        <option value="sensivel">Sensivel</option>
                    </select>
                </label>

                <label>
                    Genero
                    <select
                        name="genero"
                        value={form.genero}
                        onChange={updateField}
                    >
                        <option value="feminino">Feminino</option>
                        <option value="masculino">Masculino</option>
                        <option value="nao_binario">Não binário</option>
                        <option value="prefiro_nao_dizer">
                            Prefiro não dizer
                        </option>
                    </select>
                </label>

                <label>
                    Objetivos separados por vírgula
                    <input
                        name="objetivosTexto"
                        value={form.objetivosTexto}
                        onChange={updateField}
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? "A guardar..." : "Guardar perfil"}
                </button>
            </form>

            {message && <p role="status">{message}</p>}
        </main>
    );
}
```

5. Explicação do código: a UI recolhe campos simples e transforma objetivos separados por vírgula num array, que é o formato esperado pelo backend.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenário negativo: colocar este código noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 11 - Criar ou editar `client/src/App.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/App.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/App.jsx` conforme indicado na frase abaixo.
    - LOCALIZAÇÃO: `client/src/App.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o código completo abaixo; se o ficheiro já existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Código completo, correto e integrado:

Editar `client/src/App.jsx` para expor a página de perfil enquanto ainda não há routing final.

```jsx
import { AuthProvider } from "./context/AuthContext.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { ProfileSetupPage } from "./pages/ProfileSetupPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

export function App() {
    return (
        <AuthProvider>
            <RegisterPage />
            <LoginPage />
            <ProfileSetupPage />
        </AuthProvider>
    );
}
```

5. Explicação do código: por agora as páginas podem estar juntas para demonstração. Navegação completa pode ser refinada numa fase UI posterior.
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

Pedido válido:

```http
POST /api/profile/me
Cookie: orelle_session=...
Content-Type: application/json

{
  "nome": "Marta Silva",
  "idade": 18,
  "tipoDePele": "mista",
  "genero": "feminino",
  "objetivos": ["hidratar", "reduzir oleosidade"]
}
```

Resposta `201`:

```json
{
    "profile": {
        "id": "66b000000000000000000001",
        "userId": "66a000000000000000000001",
        "nome": "Marta Silva",
        "idade": 18,
        "tipoDePele": "mista",
        "genero": "feminino",
        "objetivos": ["hidratar", "reduzir oleosidade"]
    }
}
```

Erro sem sessão `401`:

```json
{
    "error": {
        "message": "Autenticação obrigatória"
    }
}
```

Erro de perfil duplicado `409`:

```json
{
    "error": {
        "message": "Este utilizador já tem perfil"
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

Criar este ficheiro em `server/tests/profile.test.js`.

```js
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Profile } from "../src/models/profile.model.js";
import { createSessionToken } from "../src/services/session.service.js";

vi.mock("../src/models/profile.model.js", async () => {
    const actual = await vi.importActual("../src/models/profile.model.js");
    return {
        ...actual,
        Profile: {
            findOne: vi.fn(),
            create: vi.fn(),
        },
    };
});

describe("BK-MF0-03 / RF03 - perfil", () => {
    it("cria perfil autenticado", async () => {
        Profile.findOne.mockReturnValueOnce({
            select: vi.fn().mockResolvedValue(null),
        });
        Profile.create.mockResolvedValueOnce({
            _id: { toString: () => "profile-1" },
            userId: { toString: () => "user-1" },
            nome: "Marta Silva",
            idade: 18,
            tipoDePele: "mista",
            genero: "feminino",
            objetivos: ["hidratar"],
        });

        const token = createSessionToken({
            id: "user-1",
            email: "marta@orelle.test",
            role: "cliente",
        });

        const response = await request(createApp())
            .post("/api/profile/me")
            .set("Cookie", [`orelle_session=${token}`])
            .send({
                nome: "Marta Silva",
                idade: 18,
                tipoDePele: "mista",
                genero: "feminino",
                objetivos: ["hidratar"],
            });

        expect(response.status).toBe(201);
        expect(response.body.profile.userId).toBe("user-1");
    });

    it("bloqueia pedido sem sessão", async () => {
        const response = await request(createApp())
            .post("/api/profile/me")
            .send({});

        expect(response.status).toBe(401);
    });

    it("rejeita tipo de pele invalido", async () => {
        const token = createSessionToken({
            id: "user-1",
            email: "marta@orelle.test",
            role: "cliente",
        });

        const response = await request(createApp())
            .post("/api/profile/me")
            .set("Cookie", [`orelle_session=${token}`])
            .send({
                nome: "Marta Silva",
                idade: 18,
                tipoDePele: "diagnóstico-medico",
                genero: "feminino",
                objetivos: ["hidratar"],
            });

        expect(response.status).toBe(400);
    });
});
```

5. Explicação do código: os testes provam criação autenticada, bloqueio sem sessão e rejeicao de dados fora do contrato.
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

Se a equipa quiser recolher alergias, doenças, medicamentos, fotografias ou diagnóstico neste ecran, deve parar. Esses dados não pertencem a `RF03` e exigem atualização documental noutros BKs (`BK-MF4-08`, `BK-MF1-05`, `BK-MF7-01`).

### Evidence para PR/defesa

- Criação de perfil com resposta `201`.
- Tentativa sem cookie com resposta `401`.
- Tentativa com tipo de pele inválido com resposta `400`.
- Screenshot da UI com feedback claro.
- Nota de defesa: perfil prepara personalização futura, mas não executa diagnóstico médico, IA facial ou recomendações avancadas.

### Handoff para BK-MF0-04

O próximo BK deve editar este mesmo documento `Profile`, sem criar outro modelo paralelo e sem aceitar alterar `userId` ou `role`.

## Changelog

- `2026-04-14`: guia normalizado para contrato canónico comum.
- `2026-05-25`: guia refinado para perfil personalizado executável.
- `2026-05-29`: tutorial linear integrado com modelo Profile, rotas protegidas, UI, payloads, testes e limites de scope.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com código, explicação, validação e negativo no passo onde são usados.
