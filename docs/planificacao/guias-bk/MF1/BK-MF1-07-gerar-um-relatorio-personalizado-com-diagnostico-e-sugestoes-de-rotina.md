# BK-MF1-07 - Gerar relatório OpenAI v2, revisão/freeze e desbloqueio simulado de 10% com voucher

## Header

- `doc_id`: `GUIA-BK-MF1-07`
- `bk_id`: `BK-MF1-07`
- `macro`: `MF1`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-02, BK-MF1-06`
- `rf_rnf`: `RF15`
- `fase_documental`: `Fase 1`
- `sprint`: `S03-S04`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF1-08`
- `guia_path`: `docs/planificacao/guias-bk/MF1/BK-MF1-07-gerar-um-relatorio-personalizado-com-diagnostico-e-sugestoes-de-rotina.md`
- `last_updated`: `2026-07-11`

> O slug histórico contém a palavra “diagnóstico”, mas o contrato atual é uma **avaliação cosmética assistida**, não um diagnóstico médico. O relatório v2 é gerado exclusivamente pela OpenAI, pode ser revisto opcionalmente por um consultor, é congelado antes do desbloqueio e só fica completo após pagamento académico simulado ou desbloqueio gratuito quando não existe total elegível.

## Contexto do BK

O relatório é o ponto em que se juntam:

- objetivos escolhidos;
- análise das fotografias;
- respostas às 5–8 perguntas;
- catálogo pré-filtrado;
- recomendações e variantes validadas;
- rotina, utilização, cautelas e limitações;
- provenance da OpenAI;
- eventual revisão humana.

Não existe geração direta a partir de um ID fornecido pela UI. O utilizador submete a sua sessão atual; o backend cria/reutiliza o job `generate_report`.

## Objetivo

Gerar um relatório OpenAI v2 estruturado e imutável, permitir revisão humana opcional, congelar a versão final e aplicar o desbloqueio simulado de 10% com voucher do mesmo valor.

## Importância

O relatório é simultaneamente um artefacto sensível, um snapshot histórico e a base do valor simulado/voucher. Se o conteúdo pudesse mudar depois do cálculo, se o teaser expusesse o relatório ou se o frontend calculasse os 10%, o contrato deixaria de ser auditável.

## Scope-in

- Criar/reutilizar o job `generate_report` a partir da sessão completa.
- Pré-filtrar e minimizar candidatos do catálogo no backend.
- Exigir output estruturado e IDs dentro da allowlist.
- Produzir relatório com 3–5 recomendações quando o catálogo o permitir.
- Guardar `machineResult` imutável e separar `humanOverride`.
- Devolver apenas teaser enquanto o relatório estiver bloqueado.
- Permitir “Continuar com relatório IA” ou “Pedir revisão humana”.
- Congelar a versão final com `contentHash` e snapshots de preço/stock.
- Calcular 10% no backend e simular o pagamento de forma idempotente.
- Criar um voucher exatamente igual ao valor simulado.

## Scope-out

- Não executar uma cobrança, gateway, redirect ou webhook.
- Não enviar todos os produtos para a OpenAI.
- Não aceitar IDs de produto/variante fora da allowlist.
- Não esconder relatório completo por CSS; dados bloqueados não entram no DTO/DOM.
- Não recalcular o depósito histórico quando preço ou stock mudarem.
- Não gerar uma evolução artificial da pele.

## Pré-requisitos

- Sessão com análise utilizável e recolha de factos concluída.
- Catálogo com metadata `aiEligible`, restrições e variantes.
- Worker e provider OpenAI operacionais.
- Transações MongoDB disponíveis para freeze, unlock e voucher.
- Contrato de pagamento exclusivamente simulado.

## Glossário

- **Allowlist:** conjunto de produtos/variantes candidatos que a OpenAI pode selecionar.
- **Teaser:** DTO reduzido de um relatório bloqueado.
- **Freeze:** operação que fixa conteúdo, recomendações, preços, stock e hash.
- **Machine result:** versão original produzida pela OpenAI, nunca sobrescrita.
- **Human override:** revisão humana separada, rastreável e opcional.
- **Depósito simulado:** 10% do total elegível, sem transação financeira.

## Conceitos teóricos

O backend começa por filtrar o catálogo segundo objetivos, tipo de pele, alergias, ingredientes a evitar, orçamento e `aiEligible`. Ordena os disponíveis primeiro e envia no máximo 15 candidatos minimizados. A OpenAI só escolhe IDs/variant IDs dessa lista. Depois, o backend valida novamente existência, restrições, preço e stock.

O relatório v2 contém:

- objetivos e qualidade das fotografias;
- observações cosméticas;
- resumo das respostas;
- avaliação específica para os objetivos;
- rotina/plano com instruções e cautelas;
- 3–5 snapshots de produtos quando houver cobertura;
- razão, utilização e cautelas de cada recomendação;
- plano visual ou `simulationSpec` quando maquilhagem é objetivo;
- limitações e aviso não médico;
- provider, modelo, request ID e versões de prompt/schema;
- estado da revisão humana.

Produtos sem stock podem aparecer identificados como indisponíveis, mas não entram no total elegível nem têm CTA de compra. A cobertura pode ser inferior a três produtos quando o orçamento ou o catálogo válido não permite mais; o relatório explica a limitação em vez de inventar produtos.

O valor usa inteiros em cêntimos:

```text
recommendedTotalCents = soma de uma unidade de cada recomendação disponível no freeze
depositCents = ceil(recommendedTotalCents × 1000 / 10000)
voucher.valueCents = depositCents
```

Se não existir nenhum produto disponível, o relatório é desbloqueado sem pagamento e sem voucher de valor zero.

## Arquitetura do BK

- `POST /api/ai-consultation/sessions/:sessionId/submit`
- `GET /api/face-reports/:reportId`
- `POST /api/face-reports/:reportId/finalize`
- `POST|DELETE /api/face-reports/:reportId/review-request`
- `POST /api/face-reports/:reportId/unlock/simulate-payment` com header obrigatório `Idempotency-Key`
- `AiJob` + `FaceReport` + `ProductRecommendation` + `ReportUnlock` + `Voucher`
- `ConsultationReportPage`

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/face-report.model.js`
- EDITAR: `apps/api/src/models/product-recommendation.model.js`
- EDITAR: `apps/api/src/models/report-unlock.model.js`
- EDITAR: `apps/api/src/providers/openai-report.provider.js`
- EDITAR: `apps/api/src/services/consultation-report.service.js`
- EDITAR: `apps/api/src/services/report-access.service.js`
- EDITAR: `apps/api/src/services/face-report.service.js`
- EDITAR: `apps/api/src/routes/face-report.routes.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- EDITAR: `apps/web/src/features/consultation/consultationApi.js`
- EDITAR: `apps/web/src/features/consultation/consultationModel.js`

## Bloco pedagogico

### Objetivo

Aprender a transformar uma saída de IA num contrato de negócio validado, versionado e protegido por paywall real no backend.

### Pre-requisitos

- Perceber transações e idempotência.
- Saber distinguir snapshot histórico de dados atuais.
- Conhecer validação estrutural e semântica.
- Ter concluído `BK-MF1-06`.

### Erros comuns

- Pedir à OpenAI para consultar diretamente a base de dados.
- Confiar em IDs, preços ou stock devolvidos pelo modelo.
- Devolver o relatório completo e escondê-lo com CSS.
- Sobrescrever `machineResult` durante revisão humana.
- Calcular os 10% no browser ou com números de ponto flutuante.
- Desbloquear antes de concluir/rejeitar a revisão pendente.

### Check de compreensao

- Porque é que a OpenAI recebe no máximo 15 candidatos?
- Que dados são imutáveis depois do freeze?
- Porque é que disponibilidade histórica e disponibilidade atual são mostradas separadamente?
- Quando é que o relatório pode ser desbloqueado sem voucher?

### Tempo estimado

`M` — geração, revisão/freeze, paywall e UI.

## Bloco operacional

### Entrada

- Sessão em `ready_for_report`.
- Factos mínimos recolhidos ou limitações registadas ao atingir oito perguntas.
- Catálogo curado e perfil/restrições do titular.

### Saída

- Relatório v2 draft, revisto opcionalmente e congelado.
- Teaser enquanto bloqueado.
- Relatório completo após unlock.
- Voucher do mesmo valor do depósito simulado, quando aplicável.

### Passos

Executar cenarios negativos obrigatorios (minimo 3).

#### Passo 1 - Criar o job do relatório

`POST .../submit` cria ou reutiliza `generate_report`. O job guarda referências e provenance sanitizada, nunca fotografias, respostas ou prompt sensível em claro.

#### Passo 2 - Construir a allowlist

Filtra catálogo por objetivo, tipo de pele, alergias, INCI, orçamento, elegibilidade e variantes. Envia até 15 candidatos minimizados e ordena stock disponível antes do indisponível.

#### Passo 3 - Validar a saída OpenAI

Exige Structured Output. Rejeita produto/variante fora da allowlist, total acima do orçamento, `simulationSpec` incoerente ou recomendações que violem restrições. Repete no primário e fallback OpenAI dentro da política definida.

#### Passo 4 - Persistir o relatório v2

Guarda `machineResult`, provenance e snapshots. Liga as recomendações por relatório/revisão/produto/variante. O conteúdo sensível é cifrado com AAD.

#### Passo 5 - Servir o teaser bloqueado

Antes do unlock, `GET /api/face-reports/:reportId` devolve objetivos, data, versão, estado de revisão, quantidade de produtos, total elegível e 10%. Não devolve observações, rotina, razões ou cautelas completas.

```js
function serializeLockedReport(report, access, review = null) {
    return {
        id: report._id.toString(),
        schemaVersion: report.schemaVersion,
        version: report.version,
        lifecycleStatus: report.lifecycleStatus,
        objectives: report.objectives,
        createdAt: report.createdAt,
        frozenAt: report.frozenAt,
        review: review
            ? { id: review._id.toString(), status: review.status }
            : null,
        access: {
            status: access.status,
            recommendationCount: access.recommendationCount,
            availableRecommendationCount:
                access.availableRecommendationCount,
            recommendedTotalCents: access.recommendedTotalCents,
            depositCents: access.depositCents,
            requiresPayment: access.requiresPayment,
            payment: access.payment,
        },
        locked: true,
    };
}
```

#### Passo 6 - Resolver a revisão opcional

O utilizador escolhe continuar com a versão IA ou pedir revisão. Enquanto a revisão estiver pendente, o botão de pagamento fica inativo. Pode retirar um pedido ainda não decidido. O fluxo detalhado fica em `BK-MF2-06`.

#### Passo 7 - Congelar a versão final

`POST .../finalize` escolhe a versão IA aceite ou a versão humana aprovada, calcula `contentHash` e guarda snapshots de preços/stock. Um ciclo `needs_clarification` pode criar uma nova revisão **antes** do freeze. Depois de `frozen_locked`, não se aceitam novos pedidos nem decisões de revisão e a versão congelada nunca é alterada.

#### Passo 8 - Simular pagamento e emitir voucher

`POST .../unlock/simulate-payment` exige `Idempotency-Key`. O frontend cria uma chave opaca com `crypto.randomUUID()` uma vez por montagem do relatório, mantém-na em memória e reutiliza exatamente a mesma chave em todos os retries dessa ação. A operação marca o desbloqueio, regista o pagamento como simulado e cria o voucher na mesma transação. Replay com a mesma chave devolve o mesmo resultado; rollback não deixa unlock sem voucher nem voucher duplicado.

```js
const idempotencyKey = `report.${reportId}.${crypto.randomUUID()}`;

await apiRequest(`/face-reports/${reportId}/unlock/simulate-payment`, {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
});
```

### Cenarios negativos recomendados

- Output contém ID/variant ID fora da allowlist: rejeitar.
- Alergia ou ingrediente proibido: remover/rejeitar recomendação.
- Menos de três produtos válidos: cobertura limitada explícita.
- Relatório bloqueado: conteúdo completo ausente do JSON e DOM.
- Revisão pendente: freeze/pagamento bloqueado.
- Dois pedidos de unlock: um único unlock e voucher.
- Header `Idempotency-Key` ausente/inválido: recusar antes da transação.
- Retry com a mesma chave: devolver o mesmo unlock/voucher; uma nova montagem gera uma chave nova sem duplicar o resultado já terminal.
- Falha entre unlock e voucher: rollback integral.
- Nenhum produto disponível: unlock gratuito sem voucher zero.

### Validacao

- [ ] Negativos: minimo 3 cenarios materiais executados.
- Gate documental: falhar se `negativos < 3`.
- Testes de allowlist, alergias, variantes, stock, preço e orçamento.
- Testes de imutabilidade e `contentHash`.
- Testes de teaser a provar ausência do conteúdo protegido.
- Testes de 10%, arredondamento, rollback e concorrência.
- Teste E2E draft → revisão/aceitação → freeze → unlock → voucher.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | ID inventado pela OpenAI | relatório não é persistido como válido |
| P0 | relatório locked | conteúdo completo não sai da API |
| P0 | unlock concorrente | um unlock e um voucher |
| P0 | sem `Idempotency-Key` | pedido recusado sem unlock/voucher |
| P0 | replay com a mesma chave | mesmo unlock/voucher, sem duplicados |
| P0 | falha transacional | nenhum estado parcial |
| P1 | produto sem stock | visível, mas excluído dos 10% |
| P1 | cobertura limitada | menos de três produtos e limitação explícita |
| P1 | preço muda depois | snapshot histórico mantém o depósito |

### Evidencia de testes por camada

- Unit: schema, semântica, allowlist e cálculo em cêntimos.
- Integração: geração, freeze, transação de unlock e voucher.
- Frontend/E2E: teaser, revisão opcional, desbloqueio e conteúdo completo.
- Segurança: paywall, ownership e ausência de gateway financeiro.

### Handoff

`BK-MF1-08` lista sessões e relatórios próprios sem ultrapassar o boundary locked/unlocked. `BK-MF2-02` aprofunda seleção e snapshots de recomendações.

## Expected results

- Um único relatório v2 por revisão da sessão.
- Machine result e human override separados.
- Teaser seguro antes do unlock.
- Freeze auditável com hash e snapshots.
- Pagamento inequivocamente simulado e voucher igual ao valor de 10%.

## Snippet tecnico aplicavel

O serializer do Passo 5 ilustra a regra mais importante do paywall: não enviar o conteúdo protegido.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 3.
- Relatório contém objetivos, qualidade, observações, respostas, avaliação, rotina, recomendações, cautelas, plano visual, limitações e provenance.
- Produtos e variantes pertencem à allowlist e passam validação local.
- `machineResult` nunca é sobrescrito.
- Revisão humana é opcional e termina antes do freeze.
- Conteúdo locked não está no DTO.
- Depósito é 10% em cêntimos, calculado no servidor.
- Unlock e voucher são idempotentes e transacionais.
- Nenhuma cobrança ou integração financeira existe.

## Validação final

Executa testes de contratos OpenAI, integração MongoDB, concorrência, frontend, E2E e pesquisa estática por gateways/URLs de pagamento proibidos.

## Evidence para PR/defesa

- DTO locked sanitizado e DTO unlocked comparável.
- Teste de allowlist com ID inventado.
- Cálculo de 10% e voucher com valores de fronteira.
- Replay concorrente sem duplicação.
- Não incluir relatório real, PII, respostas, fotografias ou segredos.

## Handoff

O histórico usa os snapshots congelados. A revisão humana e a edição de maquilhagem referenciam o `reportId`; não criam um segundo sistema de recomendações.

## Changelog

- `2026-05-31`: guia inicial de relatório personalizado.
- `2026-07-10`: substituição de “diagnóstico” por avaliação cosmética e cifragem de derivados.
- `2026-07-11`: relatório OpenAI v2, allowlist, revisão opcional, freeze, teaser e unlock simulado de 10% com voucher.
