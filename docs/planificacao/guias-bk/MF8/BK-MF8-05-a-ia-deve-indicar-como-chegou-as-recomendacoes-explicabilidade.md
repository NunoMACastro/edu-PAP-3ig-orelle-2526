# BK-MF8-05 - Explicabilidade e provenance do relatório OpenAI

## Header
- `doc_id`: `GUIA-BK-MF8-05`
- `bk_id`: `BK-MF8-05`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF7-07`
- `rf_rnf`: `RNF23`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-06`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-05-a-ia-deve-indicar-como-chegou-as-recomendacoes-explicabilidade.md`
- `last_updated`: `2026-07-11`

#### Objetivo

Fechar `RNF23` no relatório canónico da consulta: cada recomendação explica motivo, modo de utilização e cautelas, identifica as fontes cosméticas relevantes e inclui limitações/provenance sem expor prompts, fotografias ou dados internos.

O relatório é uma versão imutável. `machineResult` conserva a saída OpenAI validada; uma revisão humana ocupa `humanOverride`. Antes do unlock, a API devolve apenas teaser e valores comerciais, nunca o conteúdo escondido no DOM.

#### Importância

Uma lista de produtos sem razões não permite ao cliente avaliar a sugestão. Explicabilidade também torna fairness testável: conseguimos confirmar quais os sinais usados e impedir atributos protegidos no ranking.

#### Scope-in

- Schema estruturado do relatório e 3–5 recomendações quando possível.
- Pré-filtro backend e allowlist de no máximo 15 candidatos.
- Validação de IDs/variantes, restrições, preço e stock.
- Motivo, utilização, cautelas, fontes e limitações públicas.
- Provenance: provider, modelos, request ID, prompt/schema/notice e tentativas.
- Separação `machineResult`/`humanOverride` e congelamento com `contentHash`.
- Teaser bloqueado e DTO completo apenas após acesso.
- UI acessível de explicações e snapshot/disponibilidade atual.

#### Scope-out

- Não criar endpoint direto de recomendações fora da consulta.
- Não mostrar chain-of-thought, prompt ou resposta bruta.
- Não garantir cura, diagnóstico, resultado clínico ou disponibilidade futura.
- Não colocar produtos no carrinho automaticamente.
- Não recalcular uma versão congelada quando catálogo/preço muda.

#### Estado antes e depois

- Antes: razões podem estar separadas do relatório ou ser texto livre não validado.
- Depois: report v2, recomendações/snapshots e provenance formam um contrato único, validado e congelável.

#### Pre-requisitos

- `BK-MF7-07`: OpenAI-only, Structured Outputs e jobs.
- `BK-MF8-08`: consulta 5–8 com factos validados.
- Catálogo com `aiEligible`, concerns, INCI, rotina e variantes.
- `RF15`, `RF18`, `RF19`, `RF43` e `RNF23`.

#### Glossário

- Provenance: metadados verificáveis sobre provider/modelo/prompt/schema.
- Snapshot: cópia histórica de produto/variante/preço/stock no relatório.
- Allowlist: candidatos que a OpenAI está autorizada a selecionar.
- `machineResult`: resultado OpenAI imutável.
- `humanOverride`: versão ajustada por consultor sem apagar a máquina.
- Teaser: metadata segura antes do desbloqueio.

#### Conceitos teóricos essenciais

Explicabilidade não significa revelar raciocínio interno. A app apresenta fatores e regras observáveis: objetivo, factos declarados, características do produto e restrições respeitadas. O backend deve validar toda a referência devolvida pela OpenAI, porque JSON válido pode conter um ID inventado.

#### Arquitetura do BK

- Job: `generate_report`.
- Provider: `apps/api/src/providers/openai-report.provider.js`.
- Models: `FaceReport`, `ProductRecommendation` e `ReportUnlock`.
- Services: report handler, recommendation reason e report access.
- API: `GET /api/face-reports/:reportId` e `POST .../:reportId/finalize`.
- Frontend: `apps/web/src/features/consultation/ConsultationReportPage.jsx`.
- Testes: schema/semântica, allowlist, snapshots, freeze/paywall e UI.

#### Ficheiros a criar/editar/rever

- CRIAR/EDITAR: `apps/api/src/providers/openai-report.provider.js`
- EDITAR: `apps/api/src/services/report-ai-job-handlers.service.js`
- EDITAR: `apps/api/src/services/recommendation-reason.service.js`
- EDITAR: `apps/api/src/services/face-report.service.js`
- EDITAR: `apps/api/src/services/report-access.service.js`
- EDITAR: `apps/api/src/models/face-report.model.js`
- EDITAR: `apps/api/src/models/product-recommendation.model.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- CRIAR/EDITAR: `apps/api/tests/report-v2.freeze.replset.integration.test.js`

#### Tutorial técnico linear

### Passo 1 - Fixar o schema público do relatório

1. Objetivo: definir campos obrigatórios e limites.
2. Ficheiro: provider/schema do relatório.
3. Estrutura: objetivos, qualidade, observações, resumo, avaliação, rotina completa, 3–5 recomendações possíveis, plano visual, limitações, aviso não médico e safety flags.

```js
/** Fragmento fechado de uma recomendação do relatório v2. */
export const REPORT_RECOMMENDATION_SCHEMA = Object.freeze({
    type: "object",
    additionalProperties: false,
    required: ["candidateId", "variantId", "reason", "usage", "cautions"],
    properties: {
        candidateId: { type: "string" },
        variantId: { type: ["string", "null"] },
        reason: { type: "string", maxLength: 500 },
        usage: { type: "string", maxLength: 500 },
        cautions: { type: "array", items: { type: "string", maxLength: 240 } },
    },
});
```

Explicação do código: schema fechado impede campos-surpresa; validação semântica aplica domínio depois do JSON Schema.

Validação: fixture válida passa e ausência de cautelas falha.

Cenário negativo: texto clínico/garantia é recusado ou transformado em safety limitation controlada.

### Passo 2 - Pré-filtrar candidatos no backend

1. Objetivo: não entregar todo o catálogo nem deixar a OpenAI decidir segurança.
2. Ficheiro: report job handler/catalog service.
3. Filtros: `aiEligible`, goals/concerns, tipo de pele, alergias/INCI, orçamento e variantes; ordenar disponíveis antes dos indisponíveis e limitar a 15.

```js
const candidates = (await findEligibleProducts(filters))
    .filter((product) => respectsRestrictions(product, restrictions))
    .sort(compareAvailabilityThenRelevance)
    .slice(0, 15)
    .map(toMinimizedAiCandidate);
```

Explicação do código: o input não inclui descrição livre desnecessária, owner ou IDs MongoDB. Usa IDs opacos de candidatos.

Validação: alergia e orçamento removem candidatos antes do provider.

Cenário negativo: zero candidatos gera cobertura limitada honesta, não produtos inventados.

### Passo 3 - Validar a seleção OpenAI

1. Objetivo: aceitar apenas IDs/variantes enviados na allowlist.
2. Ficheiro: report handler.
3. Código:

```js
/** Rejeita referências fora do snapshot de candidatos enviado. */
export function assertAllowedRecommendation(selection, candidateMap) {
    const candidate = candidateMap.get(selection.candidateId);
    if (!candidate) throw new AppError(502, "OPENAI_PRODUCT_OUTSIDE_ALLOWLIST");
    if (selection.variantId && !candidate.variantIds.includes(selection.variantId)) {
        throw new AppError(502, "OPENAI_VARIANT_OUTSIDE_ALLOWLIST");
    }
    return candidate;
}
```

Explicação do código: revalida stock/preço/restrições no momento de persistir. Falha semântica participa no retry/fallback OpenAI.

Validação: IDs inventados não chegam ao model.

Cenário negativo: produto permitido com variante não permitida também falha.

### Passo 4 - Construir explicação pública

1. Objetivo: ligar razão OpenAI a fontes cosméticas controladas.
2. Ficheiro: `recommendation-reason.service.js`.
3. Fontes permitidas: objetivos selecionados, factos estruturados, atributos do produto e restrições respeitadas. Nunca foto/prompt/atributo protegido.

```js
export function buildPublicRecommendationExplanation({ result, candidate }) {
    return {
        reason: sanitizeCosmeticText(result.reason),
        usage: sanitizeCosmeticText(result.usage),
        cautions: result.cautions.map(sanitizeCosmeticText),
        sourceLabels: buildAllowedSourceLabels(result.sourceCodes, candidate),
        limitations: ["Orientação cosmética; não substitui aconselhamento de saúde."],
    };
}
```

Explicação do código: a UI mostra campos prontos; não reconstrói explicações. Safety flags não podem ser removidas por revisão humana.

Validação: cada produto tem motivo, uso, cautelas e fonte permitida.

Cenário negativo: source code desconhecido ou texto de cura é rejeitado.

### Passo 5 - Persistir provenance completa

1. Objetivo: saber que configuração produziu o resultado.
2. Ficheiro: `FaceReport`/handler.
3. Campos: `provider=openai`, requested/effective model, request ID, notice/prompt/schema versions, attempts, createdAt e photo/goal/session snapshot por referência autorizada.

```js
const provenance = {
    provider: "openai",
    requestedModel: response.requestedModel,
    effectiveModel: response.effectiveModel,
    requestId: response.requestId,
    promptVersion: config.promptVersion,
    schemaVersion: config.schemaVersion,
    attempts: response.attempts,
};
```

Explicação do código: nunca guardar chave, prompt completo ou response body bruto. Provenance aparece de forma resumida no relatório.

Validação: fallback identifica modelo efetivo diferente do pedido.

Cenário negativo: response sem request/model/version obrigatórios não congela.

### Passo 6 - Separar máquina, humano e versão congelada

1. Objetivo: impedir regeneração/feedback de alterar a versão final.
2. Models/services: report/review/freeze.
3. `machineResult` é imutável; `humanOverride` é outro campo. Ao finalizar, guardar `finalRecommendationIds`, snapshots e `contentHash`.

```js
const frozenPayload = buildFrozenReportPayload({ report, recommendations });
const contentHash = createHash("sha256")
    .update(stableStringify(frozenPayload))
    .digest("hex");
```

Explicação do código: feedback posterior muda a opinião do cliente, não o report congelado. Ajustes humanos usam os mesmos validadores de catálogo.

Validação: regeneração e feedback preservam hash/IDs finais.

Cenário negativo: segunda finalização incompatível devolve `409`.

### Passo 7 - Aplicar teaser e paywall no backend

1. Objetivo: explicar estado sem entregar conteúdo bloqueado.
2. Ficheiro: `report-access.service.js`.
3. Teaser: goals, data, versão, review status, contagem, total disponível e 10%. Full report apenas com unlock owner.

```js
return access.unlocked
    ? toFullReportDto(report, effectiveVersion)
    : toReportTeaserDto(report, access);
```

Explicação do código: o browser nunca recebe findings/rotina/recomendações completas antes do unlock.

Validação: serialização do teaser tem allowlist exata.

Cenário negativo: query flag ou CSS não contorna `ReportUnlock`.

### Passo 8 - Mostrar explicações no frontend

1. Objetivo: apresentar versão, provenance, razão/uso/cautelas e disponibilidade.
2. Ficheiro: `ConsultationReportPage.jsx`.
3. Cards usam snapshot histórico para explicar o relatório e disponibilidade atual para CTA. Indisponível fica sem compra; revisão/teaser/unlock seguem o DTO.

```jsx
<article aria-labelledby={`recommendation-${item.publicId}`}>
    <h3 id={`recommendation-${item.publicId}`}>{item.productSnapshot.name}</h3>
    <p>{item.reason}</p>
    <p><strong>Como usar:</strong> {item.usage}</p>
    <CautionList items={item.cautions} />
</article>
```

Explicação do código: estado não é transmitido apenas por cor e fontes/limitações são texto acessível.

Validação: teclado/axe, locked report sem conteúdo e variante correta no link.

Cenário negativo: falha ao enviar feedback não apaga o relatório carregado.

### Passo 9 - Criar testes focais

1. Objetivo: provar schema, semântica, explicabilidade, freeze e paywall.
2. Comandos:

```bash
npm --prefix apps/api test -- tests/openai-consultation-core-v2.test.js
npm --prefix apps/api test -- tests/report-v2.freeze.replset.integration.test.js
npm --prefix apps/web test -- ConsultationFlowV2.test.jsx
```

Explicação do código: transport determinístico fornece Structured Output conhecido sem rede/créditos.

Validação: 1–5 produtos conforme cobertura, allowlist e imutabilidade.

Cenário negativo: ID inventado, texto clínico e acesso bloqueado não persistem/expoõem conteúdo.

Executar cenarios negativos obrigatorios (minimo 3): ID fora da allowlist; texto inseguro; report bloqueado. Acrescenta variante inválida e freeze concorrente.

#### Expected results

- Relatório estruturado e cosmético, sem chain-of-thought nem diagnóstico.
- Recomendações reais/validadas com motivo, utilização, cautelas e fontes.
- Provenance completa e versão final imutável.
- Teaser seguro antes do desbloqueio.

#### Critérios de aceite

- [ ] Structured Output + validação semântica e safety flags.
- [ ] Máximo 15 candidatos; IDs/variantes revalidados.
- [ ] `machineResult` imutável, override separado e `contentHash` congelado.
- [ ] Provenance sem segredos/prompts/resposta bruta.
- [ ] Evidencia de testes por camada: unit schema/reason + integração report/freeze/paywall + frontend.
- [ ] Cenarios negativos concluidos: minimo `3`.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | unit | schema, semantic validator e explicações |
| P0 | integração | allowlist, snapshots, freeze e paywall |
| P0 | HTTP | teaser vs full owner-only |
| P0 | frontend | razão/uso/cautelas, a11y e conteúdo bloqueado ausente |

#### Validação final

- [ ] Negativos: minimo `3` cenarios executados e registados.
- [ ] Zero endpoint direto de recomendação no fluxo ativo.
- [ ] DTO/log/dump sem prompt, foto ou segredo.
- [ ] Live OpenAI não executado não é usado como prova.

#### Evidence para PR/defesa

- JSON sanitizado de teaser e full report com chaves públicas.
- Assert de allowlist/variante e imutabilidade do hash.
- Screenshot do relatório desbloqueado com dados sintéticos.

#### Handoff

O `BK-MF8-06` usa fontes/allowlist/provenance para testar invariância e impedir atributos protegidos no ranking.

## Bloco pedagogico

### Objetivo

Distinguir explicabilidade pública de raciocínio interno e de provenance técnica.

### Pre-requisitos

- JSON Schema, Mongoose, hashing estável, React e catálogo/variantes.

### Erros comuns

- Mostrar prompt/resposta bruta para “explicar”.
- Confiar em IDs devolvidos pela OpenAI.
- Recalcular report congelado com preço/stock atual.

### Check de compreensao

- [ ] Sei explicar por que um ID JSON válido ainda precisa de allowlist.
- [ ] Sei distinguir snapshot histórico e disponibilidade atual.

## Bloco operacional

### Entrada

Consulta concluída, factos cifrados e candidatos backend validados.

### Passos

Filtrar → gerar Structured Output → validar → explicar → persistir → rever/finalizar → teaser/full.

### Validacao

Executar schema, allowlist, freeze/paywall e frontend com fixtures determinísticas.

### Handoff

Relatório explicável e provenance para fairness, revisão e desbloqueio.

## Criterios de aceite

- Explicações completas e seguras por recomendação.
- Evidencia de testes por camada presente.
- Cenarios negativos concluidos: minimo `3`.

## Evidence para PR/defesa

Nunca guardar prompt, resposta bruta, fotos, PII, cookies ou chave OpenAI.

#### Changelog

- `2026-07-11`: guia migrado de recomendações diretas para explicabilidade/provenance do relatório OpenAI versionado e sujeito a paywall backend.
