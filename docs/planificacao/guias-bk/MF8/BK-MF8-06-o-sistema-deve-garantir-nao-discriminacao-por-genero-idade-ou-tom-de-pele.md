# BK-MF8-06 - Pré-filtro autoritativo e testes de invariância

## Header
- `doc_id`: `GUIA-BK-MF8-06`
- `bk_id`: `BK-MF8-06`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-05`
- `rf_rnf`: `RNF24`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-07`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-06-o-sistema-deve-garantir-nao-discriminacao-por-genero-idade-ou-tom-de-pele.md`
- `last_updated`: `2026-07-11`

#### Objetivo

Implementar `RNF24` sem prometer ausência absoluta de viés. O backend constrói por allowlist os sinais permitidos, exclui produtos incompatíveis, entrega no máximo 15 candidatos minimizados à OpenAI e revalida os IDs/variantes devolvidos.

Testes de invariância provam que perfis cosméticos equivalentes mantêm a mesma lista/ordem quando apenas género, idade ou outro atributo protegido varia. Tom/undertone só pode ter finalidade limitada de correspondência cromática no objetivo de maquilhagem; nunca decide acesso, qualidade da pele ou valor comercial.

#### Importância

Uma denylist de palavras não controla os dados que entram no ranking. A defesa principal é construir o input a partir de sinais necessários e estruturados, com restrições usadas como exclusão de segurança e não como bónus de score.

#### Scope-in

- Allowlist de objetivos, factos e atributos cosméticos necessários.
- Exclusão de género, idade, nome, email, texto livre e identificadores.
- Restrições/alergias/INCI como hard filter.
- Pré-filtro de catálogo por elegibilidade, objetivo, orçamento e variantes.
- Máximo 15 candidatos e validação dos IDs devolvidos.
- Testes de invariância para perfis equivalentes.
- Finalidade cromática isolada para maquilhagem.
- Limitações públicas e provenance da política.

#### Scope-out

- Não certificar neutralidade universal do modelo OpenAI.
- Não usar atributos protegidos como score, motivo ou fonte pública.
- Não resolver segurança com prompt/denylist apenas.
- Não diagnosticar condições nem criar grupos demográficos.
- Não saltar validações em ajustes humanos.

#### Estado antes e depois

- Antes: filtros/reasons podem existir sem uma fronteira única de inputs.
- Depois: `buildFairnessSafeRankingInputs` e o filtro de catálogo são os únicos caminhos para candidatos/recomendações da consulta.

#### Pre-requisitos

- `BK-MF8-05`: report explicável, allowlist e provenance.
- Catálogo IA com INCI, concerns, rotina, atributos e variantes.
- Perfil/restrições validados e consulta de 5–8 perguntas.
- `RNF24`, `RF18`, `RF19`, `RF40` e `RF43`.

#### Glossário

- Invariância: mesma saída quando varia apenas um dado irrelevante/protegido.
- Hard filter: exclusão obrigatória antes de score/provider.
- Proxy: sinal aparentemente neutro que pode codificar atributo protegido.
- Purpose-limited: uso permitido apenas para finalidade declarada.
- Allowlist: conjunto fechado de campos/valores permitidos.

#### Conceitos teóricos essenciais

Fairness precisa de boundary de dados, testes e limitações. Os testes cobrem cenários definidos, não todos os utilizadores possíveis. Para maquilhagem, cor/undertone pode ajudar a escolher uma variante visual quando há consentimento e goal correspondente; isso não autoriza inferir etnia, qualidade, risco ou poder de compra.

#### Arquitetura do BK

- Guard: `apps/api/src/services/ai-fairness-guard.service.js`.
- Catálogo: filtro no handler `generate_report`.
- Goals/facts: sessão canónica e definitions versionadas.
- Provider: recebe candidatos minimizados, não o catálogo inteiro.
- Revisão: ajustes humanos passam pelos mesmos filtros.
- Testes: unit de inputs/filtros, invariância e integração report.

#### Ficheiros a criar/editar/rever

- CRIAR/EDITAR: `apps/api/src/services/ai-fairness-guard.service.js`
- EDITAR: `apps/api/src/services/report-ai-job-handlers.service.js`
- EDITAR: `apps/api/src/services/ai-consultation-review.service.js`
- EDITAR: `apps/api/src/constants/ai-consultation-goals.js`
- EDITAR: `apps/api/src/models/product.model.js`
- CRIAR/EDITAR: `apps/api/tests/mf8.fairness-guard.test.js`
- CRIAR/EDITAR: `apps/api/tests/openai-consultation-core-v2.test.js`

#### Tutorial técnico linear

### Passo 1 - Fixar ameaça e sinais proibidos

1. Objetivo: declarar o que nunca entra no ranking geral.
2. Ficheiro: fairness guard.
3. Código:

```js
/** Campos que nunca podem alterar ranking, razão ou elegibilidade geral. */
export const PROTECTED_RANKING_FIELDS = new Set([
    "gender", "age", "ethnicity", "name", "email", "skinTone",
]);
```

Explicação do código: idade/género podem existir no perfil por outros RF, mas não entram na consulta de ranking. Denylist textual é apenas defesa adicional.

Validação: builder não devolve nenhuma destas chaves.

Cenário negativo: uma nova chave protegida num payload faz o teste falhar.

### Passo 2 - Construir input por allowlist

1. Objetivo: aceitar apenas goals e factos estruturados conhecidos.
2. Ficheiro: `ai-fairness-guard.service.js`.
3. Código:

```js
const ALLOWED_FACT_KEYS = new Set([
    "budget_cents", "current_routine", "skin_comfort", "texture_preference",
    "finish_preference", "sun_exposure", "fragrance_preference",
]);

export function buildFairnessSafeRankingInputs({ goals, facts }) {
    return {
        goals: { primary: goals.primary, secondary: goals.secondary },
        facts: Object.fromEntries(
            Object.entries(facts).filter(([key]) => ALLOWED_FACT_KEYS.has(key)),
        ),
    };
}
```

Explicação do código: texto curto autorizado é normalizado para factos, não enviado como instrução. Chaves desconhecidas ficam fora até revisão explícita.

Validação: snapshot contém apenas campos conhecidos.

Cenário negativo: prompt injection/texto livre não aparece no input do ranking.

### Passo 3 - Aplicar restrições como hard filter

1. Objetivo: excluir risco sem transformar alergia em score.
2. Ficheiro: filtro de catálogo.
3. Regras: INCI normalizado, ingredientes a evitar e restrições do perfil/conversa reconciliadas antes de gerar report.

```js
export function filterRestrictedCandidates(products, restrictions) {
    return products.filter((product) =>
        !product.inciNormalized.some((ingredient) => restrictions.avoid.has(ingredient)),
    );
}
```

Explicação do código: a ausência de restrição não dá pontos; apenas um conflito elimina candidato. Restrição livre nova bloqueia report até reconciliação no perfil.

Validação: candidato incompatível nunca entra na lista OpenAI.

Cenário negativo: ajuste humano que reintroduz alergénio é recusado.

### Passo 4 - Pré-filtrar e minimizar o catálogo

1. Objetivo: criar lista curta autoritativa.
2. Ficheiro: handler de relatório.
3. Filtros: `aiEligible`, concerns/goals, tipo de pele, budget, variante e restrições; ordenar disponível primeiro, permitir indisponível explicado e limitar 15.

```js
const allowlistedCandidates = filteredProducts
    .sort(compareAvailabilityThenGoalMatch)
    .slice(0, 15)
    .map(({ publicCandidateId, name, priceCents, stock, variants, concernTags }) => ({
        publicCandidateId, name, priceCents, available: stock > 0,
        variants: variants.map(toMinimizedVariant), concernTags,
    }));
```

Explicação do código: OpenAI só recebe atributos de seleção necessários. O backend volta a consultar preço/stock/restrições antes de persistir.

Validação: no máximo 15; catálogo vazio/curto é tratado honestamente.

Cenário negativo: produto `aiEligible=false` não entra mesmo que pareça relevante.

### Passo 5 - Isolar cor/undertone para maquilhagem

1. Objetivo: impedir reutilização cromática fora do propósito.
2. Ficheiro: fairness guard/goal definitions.
3. Regra: só quando `makeup` é goal e apenas para escolher variante/cor; não usar para rank geral, preço, acesso ou avaliação da pele.

```js
export function buildMakeupColorContext({ goals, declaredUndertone }) {
    const makeupSelected = [goals.primary, ...goals.secondary].includes("makeup");
    return makeupSelected && declaredUndertone
        ? { undertone: declaredUndertone }
        : {};
}
```

Explicação do código: prefere dado declarado/validado e documenta limitação de vision; nunca infere grupo protegido.

Validação: goals de skincare produzem contexto cromático vazio.

Cenário negativo: tentar usar undertone para score de acne/hidratação falha o guard.

### Passo 6 - Validar IDs/variantes devolvidos

1. Objetivo: impedir que JSON válido ultrapasse a allowlist.
2. Ficheiro: report validator.
3. Cada seleção deve existir no map de candidatos e respeitar variante/restrições atuais.

```js
const candidate = candidateMap.get(selection.publicCandidateId);
if (!candidate) throw new AppError(502, "PRODUCT_OUTSIDE_ALLOWLIST");
if (selection.variantId && !candidate.variantIds.includes(selection.variantId)) {
    throw new AppError(502, "VARIANT_OUTSIDE_ALLOWLIST");
}
```

Explicação do código: erros semânticos participam no retry/fallback; nunca são “corrigidos” para outro produto silenciosamente.

Validação: seleção final é subset da allowlist original.

Cenário negativo: ID/variante inventados deixam o job retomável sem report parcial.

### Passo 7 - Criar testes de invariância

1. Objetivo: comparar outputs quando só varia atributo protegido.
2. Ficheiro: `mf8.fairness-guard.test.js`.
3. Código:

```js
it.each([
    ["gender", "feminino", "masculino"],
    ["age", 19, 61],
    ["skinTone", "claro", "escuro"],
])("mantém ranking ao variar apenas %s", (field, left, right) => {
    const base = makeEquivalentCosmeticProfile();
    expect(rank({ ...base, [field]: left })).toEqual(rank({ ...base, [field]: right }));
});
```

Explicação do código: fixa candidatos, goals e factos cosméticos. Para teste de variantes de maquilhagem, avalia separadamente o contexto cromático purpose-limited.

Validação: mesma lista, ordem e scores no ranking geral.

Cenário negativo: introduzir atributo protegido no score quebra a matriz.

### Passo 8 - Aplicar política também à revisão e UI

1. Objetivo: impedir bypass por consultor e explicar limitações.
2. Ficheiros: review service/report page.
3. Ajustes humanos passam por restrictions/allowlist/variants; UI mostra policy version/scope/limitations e nunca claim “sem viés”.

```js
const validatedOverride = validateHumanRecommendations(
    requestedOverride,
    { candidateMap, restrictions, fairnessPolicy },
);
```

Explicação do código: revisão humana melhora contexto, não remove guardrails nem safety flags.

Validação: report ajustado preserva provenance da máquina e política aplicada.

Cenário negativo: override com produto proibido/fora da allowlist devolve `422`/`409`.

### Passo 9 - Executar bateria focal

1. Objetivo: provar input, filtro, invariância e integração OpenAI/report.
2. Comandos:

```bash
npm --prefix apps/api test -- tests/mf8.fairness-guard.test.js
npm --prefix apps/api test -- tests/openai-consultation-core-v2.test.js
```

Explicação do código: não depende de chamada live; usa candidatos determinísticos e transport de teste.

Validação: matriz de atributos, restrições, 15 candidatos e IDs inválidos.

Cenário negativo: texto proibido, proxy desconhecido e override inseguro são recusados.

Executar cenarios negativos obrigatorios (minimo 3): atributo protegido no input; alergénio reintroduzido; ID fora da allowlist. Acrescenta proxy/texto e override inseguro.

#### Expected results

- Ranking geral só usa sinais cosméticos estruturados necessários.
- Restrições são hard filters, não score.
- OpenAI só seleciona candidatos/variantes autorizados.
- Invariância comprovada nos perfis equivalentes definidos.
- Limitações do provider e finalidade cromática ficam explícitas.

#### Critérios de aceite

- [ ] Allowlist de inputs e exclusão de atributos protegidos/proxies conhecidos.
- [ ] Pré-filtro autoritativo, no máximo 15 candidatos e revalidação final.
- [ ] Invariância de lista/ordem/score no ranking geral.
- [ ] Cor/undertone limitado a variantes de maquilhagem.
- [ ] Evidencia de testes por camada: unit builder/filter/invariance + integração report/review.
- [ ] Cenarios negativos concluidos: minimo `3`.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | unit | allowlist, hard filters e finalidade cromática |
| P0 | invariância | género/idade/tom variam sem alterar ranking geral |
| P0 | integração | candidates → OpenAI fixture → report/review |
| P0 | segurança | IDs/proxies/texto/override inseguros recusados |

#### Validação final

- [ ] Negativos: minimo `3` cenarios executados e registados.
- [ ] Pesquisa sem promessas absolutas de neutralidade.
- [ ] Testes live ausentes não são usados como prova de fairness.
- [ ] Links/fences e `git diff --check` verdes.

#### Evidence para PR/defesa

- Matriz de invariância e lista exata de inputs permitidos.
- Prova de candidato/alergénio/ID recusado.
- DTO com policy scope/limitations sem PII.

#### Handoff

O `BK-MF8-07` aplica consentimento/minimização aos mesmos inputs e candidatos antes de qualquer chamada OpenAI.

## Bloco pedagogico

### Objetivo

Perceber por que allowlist + testes de invariância são mais fortes do que uma denylist textual.

### Pre-requisitos

- Arrays/maps, funções puras, testes parametrizados e domínio de catálogo.

### Erros comuns

- Prometer “zero viés”.
- Usar alergia como bónus de ranking.
- Reutilizar tom/undertone fora da maquilhagem.

### Check de compreensao

- [ ] Sei construir um perfil equivalente para invariância.
- [ ] Sei explicar a diferença entre hard filter e score.

## Bloco operacional

### Entrada

Goals/factos validados, perfil reconciliado e catálogo elegível.

### Passos

Allowlist inputs → hard filters → purpose gate → shortlist 15 → OpenAI → revalidar → policy/limitations.

### Validacao

Executar testes unitários, invariância e integração report/review.

### Handoff

Shortlist segura/minimizada e política verificável para o provider.

## Criterios de aceite

- Pré-filtro autoritativo e invariância sem promessas absolutas.
- Evidencia de testes por camada presente.
- Cenarios negativos concluidos: minimo `3`.

## Evidence para PR/defesa

Usar apenas perfis sintéticos equivalentes e resultados sanitizados.

#### Changelog

- `2026-07-11`: guia alinhado a pré-filtro backend, allowlist de candidatos, invariância e uso cromático limitado à maquilhagem.
