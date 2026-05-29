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
- `last_updated`: `2026-05-29`

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

O codigo aplicavel deste BK-MF0-06 ja nao fica como anexo isolado. Para cumprir o contrato documental sem contrariar o formato tutorial, considera-se tecnico aplicavel o conjunto de blocos completos no `## Tutorial linear de implementacao`, sempre ligados a `BK-MF0-06` e `RF06`.

Usar um snippet solto aqui seria pedagogicamente mais fraco: o aluno poderia copiar uma funcao sem perceber ficheiro, imports, validacao, erro esperado e handoff. Por isso, o codigo foi integrado nos passos onde e usado.

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
Neste BK, `favoriteBrandNames` fica funcional. `favoriteProductIds` fica no contrato, mas o backend rejeita IDs de produto enquanto `BK-MF0-07` nao criar `Product`. Isto evita prometer favoritos por produto sem catalogo real.

**Scope-in deste passo:**

- Criar preferencias privadas por utilizador autenticado.
- Guardar marcas favoritas normalizadas.
- Preparar campo `favoriteProductIds`, mas rejeitar valores nao vazios nesta fase.
- Criar `GET /api/preferences/me` e `PUT /api/preferences/me`.
- Criar UI simples para marcas favoritas.

**Scope-out deste passo:**

- Criacao de produtos fica para `BK-MF0-07`.
- Validacao real de produtos favoritos fica apos existir catalogo.
- Recomendacoes personalizadas ficam fora da `MF0`.
- Alergias e restricoes medicas ficam para `BK-MF4-08`.

### Passo 2 - Mapear ficheiros antes de codificar

1. Objetivo simples do passo: identificar todos os ficheiros antes de escrever codigo, para evitar duplicados, imports partidos e contratos divergentes entre BKs.
2. Ficheiros envolvidos:
    - CRIAR:
        - `server/src/models/preference.model.js`
        - `server/src/validators/preferences.validator.js`
        - `server/src/services/preferences.service.js`
        - `server/src/controllers/preferences.controller.js`
        - `server/src/routes/preferences.routes.js`
        - `server/tests/preferences.test.js`
        - `client/src/pages/PreferencesPage.jsx`

    - EDITAR:
        - `server/src/app.js`
        - `client/src/App.jsx`

    - REVER:
        - `server/src/middlewares/auth.middleware.js`
        - `docs/RF.md`, requisito `RF06`.
        - `docs/planificacao/guias-bk/MF0/BK-MF0-07-registar-produtos-com-nome-descricao-ingredientes-tipo-de-pele-indicado-imagem-preco-e-stock.md`.
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

### Passo 4 - Criar ou editar `server/src/models/preference.model.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/models/preference.model.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/models/preference.model.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/models/preference.model.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/models/preference.model.js`.

```js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const preferenceSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        favoriteBrandNames: {
            type: [String],
            default: [],
        },
        favoriteProductIds: {
            type: [Schema.Types.ObjectId],
            ref: "Product",
            default: [],
        },
    },
    { timestamps: true },
);

export const Preference = model("Preference", preferenceSchema);
```

5. Explicacao do codigo: o documento pertence a um utilizador. Marcas sao texto; produtos serao IDs reais quando `Product` existir.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 5 - Criar ou editar `server/src/validators/preferences.validator.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/validators/preferences.validator.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/validators/preferences.validator.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/validators/preferences.validator.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/validators/preferences.validator.js`.

```js
import { AppError } from "../middlewares/error.middleware.js";

const MAX_BRANDS = 10;

function normalizeBrand(value) {
    return String(value ?? "")
        .trim()
        .replace(/\s+/g, " ");
}

export function validatePreferencesInput(body) {
    const favoriteBrandNames = Array.isArray(body.favoriteBrandNames)
        ? [
              ...new Set(
                  body.favoriteBrandNames.map(normalizeBrand).filter(Boolean),
              ),
          ]
        : [];

    const favoriteProductIds = Array.isArray(body.favoriteProductIds)
        ? body.favoriteProductIds
        : [];

    const errors = {};

    if (favoriteBrandNames.length > MAX_BRANDS) {
        errors.favoriteBrandNames = `Maximo de ${MAX_BRANDS} marcas favoritas`;
    }

    if (favoriteProductIds.length > 0) {
        errors.favoriteProductIds =
            "Produtos favoritos so ficam ativos depois do BK-MF0-07 criar o catalogo";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Preferencias invalidas", errors);
    }

    return {
        favoriteBrandNames,
        favoriteProductIds: [],
    };
}
```

5. Explicacao do codigo: o backend permite marcas já, mas bloqueia produtos favoritos para nao validar IDs contra uma colecao que ainda nao existe.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 6 - Criar ou editar `server/src/services/preferences.service.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/services/preferences.service.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/services/preferences.service.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/services/preferences.service.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/services/preferences.service.js`.

```js
import { Preference } from "../models/preference.model.js";

function toPreferenceResponse(preference) {
    return {
        id: preference._id.toString(),
        userId: preference.userId.toString(),
        favoriteBrandNames: preference.favoriteBrandNames,
        favoriteProductIds: preference.favoriteProductIds.map((id) =>
            id.toString(),
        ),
        updatedAt: preference.updatedAt,
    };
}

export async function getMyPreferences(userId) {
    const preference = await Preference.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: {
                userId,
                favoriteBrandNames: [],
                favoriteProductIds: [],
            },
        },
        { upsert: true, new: true },
    );

    return toPreferenceResponse(preference);
}

export async function updateMyPreferences(userId, input) {
    const preference = await Preference.findOneAndUpdate(
        { userId },
        { $set: input },
        { upsert: true, new: true, runValidators: true },
    );

    return toPreferenceResponse(preference);
}
```

5. Explicacao do codigo: `upsert` cria as preferencias se ainda nao existirem. A segunda chamada atualiza o mesmo documento.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 7 - Criar ou editar `server/src/controllers/preferences.controller.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/controllers/preferences.controller.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/controllers/preferences.controller.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/controllers/preferences.controller.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/controllers/preferences.controller.js`.

```js
import {
    getMyPreferences,
    updateMyPreferences,
} from "../services/preferences.service.js";
import { validatePreferencesInput } from "../validators/preferences.validator.js";

export async function getMyPreferencesController(req, res, next) {
    try {
        const preferences = await getMyPreferences(req.user.id);
        return res.status(200).json({ preferences });
    } catch (err) {
        return next(err);
    }
}

export async function updateMyPreferencesController(req, res, next) {
    try {
        const input = validatePreferencesInput(req.body);
        const preferences = await updateMyPreferences(req.user.id, input);
        return res.status(200).json({ preferences });
    } catch (err) {
        return next(err);
    }
}
```

5. Explicacao do codigo: o controller usa sempre `req.user.id`, tal como perfil. Assim um cliente nao altera preferencias de outro.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 8 - Criar ou editar `server/src/routes/preferences.routes.js`

1. Objetivo simples do passo: implementar o ficheiro `server/src/routes/preferences.routes.js` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `server/src/routes/preferences.routes.js` conforme indicado na frase abaixo.
    - LOCALIZACAO: `server/src/routes/preferences.routes.js`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `server/src/routes/preferences.routes.js`.

```js
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
    getMyPreferencesController,
    updateMyPreferencesController,
} from "../controllers/preferences.controller.js";

export const preferencesRoutes = Router();

preferencesRoutes.get("/me", requireAuth, getMyPreferencesController);
preferencesRoutes.put("/me", requireAuth, updateMyPreferencesController);
```

5. Explicacao do codigo: as rotas finais sao `GET /api/preferences/me` e `PUT /api/preferences/me`.
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

Editar `server/src/app.js` e substituir pelo ficheiro completo abaixo, preservando rotas anteriores e montando preferências.

```js
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRoutes } from "./routes/auth.routes.js";
import { adminUsersRoutes } from "./routes/admin-users.routes.js";
import { profileRoutes } from "./routes/profile.routes.js";
import { preferencesRoutes } from "./routes/preferences.routes.js";
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

    app.use(errorMiddleware);

    return app;
}
```

5. Explicacao do codigo: preferências entram como rota própria, protegida no ficheiro de rotas com `requireAuth`. A montagem fica antes de `/api/admin` apenas por organização; a segurança real está nos middlewares de cada rota.
6. Como validar: chamar `GET /api/preferences/me` sem cookie deve devolver `401`; com cookie válido deve devolver as preferências do próprio utilizador.
7. Erro comum ou cenario negativo: montar preferências sob `/api/admin` ou esquecer `requireAuth` misturaria dados privados de cliente com área administrativa.

### Passo 10 - Criar ou editar `client/src/pages/PreferencesPage.jsx`

1. Objetivo simples do passo: implementar o ficheiro `client/src/pages/PreferencesPage.jsx` no contrato deste BK.
2. Ficheiros envolvidos:
    - CRIAR/EDITAR: `client/src/pages/PreferencesPage.jsx` conforme indicado na frase abaixo.
    - LOCALIZACAO: `client/src/pages/PreferencesPage.jsx`.
    - REVER: imports, exports e ficheiros que este bloco referencia.
3. O que fazer: usa o codigo completo abaixo; se o ficheiro ja existir, substitui ou acrescenta exatamente o que a instrucao deste passo indicar.
4. Codigo completo, correto e integrado:

Criar este ficheiro em `client/src/pages/PreferencesPage.jsx`.

```jsx
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

export function PreferencesPage() {
    const [brandsText, setBrandsText] = useState("Orelle, The Ordinary");
    const [message, setMessage] = useState("");

    async function savePreferences(event) {
        event.preventDefault();

        const favoriteBrandNames = brandsText
            .split(",")
            .map((brand) => brand.trim())
            .filter(Boolean);

        try {
            await apiRequest("/preferences/me", {
                method: "PUT",
                body: JSON.stringify({
                    favoriteBrandNames,
                    favoriteProductIds: [],
                }),
            });
            setMessage("Preferencias guardadas");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Preferencias</h1>
            <form onSubmit={savePreferences}>
                <label>
                    Marcas favoritas separadas por virgula
                    <input
                        value={brandsText}
                        onChange={(event) => setBrandsText(event.target.value)}
                    />
                </label>
                <button type="submit">Guardar preferencias</button>
            </form>
            {message && <p role="status">{message}</p>}
        </main>
    );
}
```

5. Explicacao do codigo: a UI deixa guardar marcas. Produtos favoritos aparecem apenas como contrato tecnico, nao como controlo funcional.
6. Como validar: confirma que o ficheiro esta no caminho indicado, que os imports/export existem e que o comportamento descrito no passo funciona.
7. Erro comum ou cenario negativo: colocar este codigo noutro ficheiro, alterar nomes exportados ou apagar validacoes quebra o handoff deste BK.

### Passo 11 - Criar ou editar `client/src/App.jsx`

1. Objetivo simples do passo: ligar a pagina de preferencias a app de demonstracao sem criar routing definitivo.
2. Ficheiros envolvidos:
    - EDITAR: `client/src/App.jsx`.
    - LOCALIZACAO: substituir o ficheiro atual por esta versao completa.
    - REVER: paginas importadas abaixo e `AuthContext.jsx`.
3. O que fazer: manter as paginas anteriores e acrescentar a nova pagina deste BK.
4. Codigo completo, correto e integrado:

Editar `client/src/App.jsx` e substituir pelo ficheiro completo abaixo.

```jsx
import { AuthProvider } from "./context/AuthContext.jsx";
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
        </AuthProvider>
    );
}
```

5. Explicacao do codigo: preferencias pertencem ao cliente autenticado e usam a mesma sessao HttpOnly dos BKs anteriores. Assim nao ha outro estado paralelo para dados privados de consumo.
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

Guardar marcas:

```http
PUT /api/preferences/me
Cookie: orelle_session=...
Content-Type: application/json

{
  "favoriteBrandNames": ["Orelle", "The Ordinary"],
  "favoriteProductIds": []
}
```

Resposta `200`:

```json
{
    "preferences": {
        "userId": "66a000000000000000000001",
        "favoriteBrandNames": ["Orelle", "The Ordinary"],
        "favoriteProductIds": []
    }
}
```

Tentar produtos antes do catalogo `400`:

```json
{
    "error": {
        "message": "Preferencias invalidas",
        "details": {
            "favoriteProductIds": "Produtos favoritos so ficam ativos depois do BK-MF0-07 criar o catalogo"
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

Criar este ficheiro em `server/tests/preferences.test.js`.

```js
import { describe, expect, it } from "vitest";
import { validatePreferencesInput } from "../src/validators/preferences.validator.js";

describe("BK-MF0-06 / RF06 - preferencias", () => {
    it("normaliza marcas favoritas", () => {
        const input = validatePreferencesInput({
            favoriteBrandNames: [" Orelle ", "Orelle", "The Ordinary"],
            favoriteProductIds: [],
        });

        expect(input.favoriteBrandNames).toEqual(["Orelle", "The Ordinary"]);
    });

    it("bloqueia produtos favoritos antes de existir catalogo", () => {
        expect(() =>
            validatePreferencesInput({
                favoriteBrandNames: ["Orelle"],
                favoriteProductIds: ["66c000000000000000000001"],
            }),
        ).toThrow("Preferencias invalidas");
    });

    it("limita excesso de marcas", () => {
        expect(() =>
            validatePreferencesInput({
                favoriteBrandNames: Array.from(
                    { length: 11 },
                    (_, index) => `Marca ${index}`,
                ),
            }),
        ).toThrow("Preferencias invalidas");
    });
});
```

5. Explicacao do codigo: estes testes garantem dados limpos e evitam que o aluno finja uma funcionalidade dependente do catalogo.
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

Quando `BK-MF0-07` estiver concluido, a equipa pode decidir se `favoriteProductIds` passa a validar contra `Product`. Essa alteracao deve atualizar este guia ou criar nota de handoff no BK de produto, sem alterar `RF06`.

### Evidence para PR/defesa

- `PUT /api/preferences/me` com marcas validas e `200`.
- Pedido sem cookie com `401`.
- Lista com mais de 10 marcas com `400`.
- `favoriteProductIds` nao vazio antes do catalogo com `400`.
- Screenshot da UI de marcas favoritas.

### Handoff para BK-MF0-07

O proximo BK cria `Product`. Depois disso, favoritos por produto podem ser ativados com validacao real contra catalogo.

## Changelog

- `2026-04-14`: guia normalizado para contrato canonico comum.
- `2026-05-25`: guia refinado para preferências de marcas/produtos.
- `2026-05-25`: reforçado que `favoriteProductIds` é contrato preparado até existir catálogo em `BK-MF0-07`.
- `2026-05-29`: tutorial linear integrado com modelo Preference, bloqueio de produtos antes do catalogo, payloads, UI e testes.
- `2026-05-29`: estrutura corrigida para tutorial linear integrado, com codigo, explicacao, validacao e negativo no passo onde sao usados.
- `2026-05-29`: acrescentado `client/src/App.jsx` completo para ligar a pagina de preferencias.
