# BK-MF8-10 - Recomendações enriquecidas com respostas da avaliação guiada

## Header
- `doc_id`: `GUIA-BK-MF8-10`
- `bk_id`: `BK-MF8-10`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Aline`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF2-02, BK-MF4-08, BK-MF8-09`
- `rf_rnf`: `RF43, RNF23`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-HIBRIDO`
- `eixo_primario`: `ConfiancaConversao`
- `kpi_primario`: `add_to_cart_recomendado`
- `kpi_secundario`: `taxa_recomendacao_util`
- `proximo_bk`: `BK-MF8-11`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md`
- `last_updated`: `2026-07-11`

> **Contrato OpenAI-only vigente:** as recomendações nascem no job persistente `generate_report` da própria sessão. O endpoint direto e o formulário sequencial antigo deixam de fazer parte do contrato. A OpenAI recebe apenas candidatos pré-filtrados e só pode devolver produtos e variantes dessa allowlist; o backend volta a validar restrições, preço e stock antes de congelar snapshots.

#### Objetivo

Ligar as respostas da consulta, as observações fotográficas e o catálogo real num relatório v2 coerente, explicável e seguro. O relatório deve propor três a cinco produtos quando existirem candidatos válidos, sem permitir que a OpenAI invente IDs ou contorne alergias, orçamento e stock.

#### Importância

O valor académico não está numa resposta livre do modelo. Está na combinação entre interpretação multimodal, regras determinísticas de negócio, catálogo real e evidência auditável. Esta separação permite demonstrar IA aplicada sem entregar stock, preços ou segurança ao provider.

#### Scope-in

- Usar a sessão submetida e o snapshot cifrado de perguntas, respostas e factos.
- Pré-filtrar o catálogo por objetivo, perfil, restrições, orçamento e `aiEligible`.
- Enviar no máximo 15 candidatos minimizados à OpenAI.
- Validar novamente produtos, variantes, preços e stock.
- Persistir `machineResult`, snapshots e provenance num `FaceReport` imutável.
- Permitir produtos indisponíveis, sem CTA e fora do cálculo do depósito.
- Entregar apenas teaser antes do desbloqueio.

#### Scope-out

- Não criar recomendações por endpoint direto.
- Não enviar o catálogo completo, nome, email ou IDs MongoDB do utilizador.
- Não autorizar compra, reserva de stock ou pagamento durante a geração.
- Não substituir aconselhamento clínico.
- Não sobrescrever `humanOverride` numa regeneração.

#### Estado antes e depois

- Antes: respostas e recomendações podiam viver em páginas e pedidos independentes.
- Depois: a sessão própria cria um job durável, o backend constrói a allowlist e o relatório v2 conserva a versão exata que justificou cada sugestão.

#### Pre-requisitos

- `BK-MF8-09` concluiu o histórico cifrado e retomável.
- Existem consentimento OpenAI v2, duas fotografias válidas e cinco a oito respostas.
- Produtos elegíveis têm metadata de objetivos, rotina, INCI e variantes quando aplicável.
- MongoDB local corre como replica set para transações.

#### Glossário

- **Allowlist:** conjunto fechado de produtos e variantes que o modelo pode escolher.
- **Snapshot:** cópia imutável de nome, variante, preço e disponibilidade naquele relatório.
- **machineResult:** conteúdo produzido pela OpenAI e validado pelo backend.
- **humanOverride:** ajuste posterior do consultor, separado do resultado automático.
- **Teaser:** metadados mínimos devolvidos enquanto o relatório está bloqueado.

#### Conceitos teóricos essenciais

Structured Outputs limita a forma do JSON, mas não prova que os IDs existem ou que o produto é adequado. A validação semântica permanece no backend. O provider trata interpretação e explicação; o domínio trata ownership, catálogo, restrições, preços, percentagem e vouchers.

O relatório é versionado. Alterar o catálogo depois da geração não altera o snapshot histórico. A interface mostra separadamente a disponibilidade atual para não confundir passado e presente.

#### Arquitetura do BK

1. `POST /api/ai-consultation/sessions/:sessionId/submit` cria ou reutiliza o job `generate_report`.
2. O worker reclama o job com lease e carrega apenas dados da sessão do titular.
3. O backend filtra e minimiza até 15 candidatos.
4. A OpenAI devolve JSON estruturado com IDs permitidos e explicações.
5. O backend revalida tudo e persiste relatório, recomendações e snapshots numa transação.
6. A sessão passa a `draft_ready`; em falha transitória passa a `failed_retryable`.

#### Ficheiros a criar/editar/rever

- REVER: `apps/api/src/services/consultation-report.service.js`
- REVER: `apps/api/src/services/report-ai-job-handlers.service.js`
- REVER: `apps/api/src/models/face-report.model.js`
- REVER: `apps/api/src/models/product-recommendation.model.js`
- REVER: `apps/api/src/models/product.model.js`
- REVER: `apps/api/src/providers/openai-responses.provider.js`
- REVER: `apps/api/src/providers/openai-report.provider.js`
- REVER: `apps/web/src/features/consultation/ActiveConsultationPage.jsx`
- REVER: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- CRIAR/REVER: testes unitários, de contrato e de integração deste fluxo.

#### Tutorial técnico linear

### Passo 1 - Fixar o contrato do relatório v2

Define um schema versionado com objetivos, qualidade fotográfica, observações, resumo das respostas, avaliação específica, rotina, recomendações, plano visual, limitações, aviso não médico e provenance. Separa sempre `machineResult` de `humanOverride`.

### Passo 2 - Construir a allowlist no backend

Filtra primeiro por `aiEligible`, objetivo, tipo de pele, alergias, ingredientes a evitar e orçamento. Ordena disponíveis antes dos indisponíveis e limita o payload enviado ao provider.

```js
import { buildProductVariantKey } from "./product-variant.service.js";

/**
 * Confirma que cada escolha devolvida pela OpenAI pertence à allowlist.
 * @param {Array<{productId:string, variantId:string|null}>} selections
 * @param {Set<string>} allowedKeys
 * @returns {void}
 */
export function assertAllowedSelections(selections, allowedKeys) {
    for (const item of selections) {
        const key = buildProductVariantKey(item.productId, item.variantId);
        if (!allowedKeys.has(key)) {
            throw new AppError(502, "A OpenAI devolveu uma recomendação fora da allowlist");
        }
    }
}
```

### Passo 3 - Gerar com OpenAI e JSON Schema

Envia apenas fotografias consentidas, factos necessários e candidatos minimizados. Persiste modelo pedido, modelo efetivo, request ID, versão do prompt e versão do schema. Uma repetição do modelo primário e uma tentativa no fallback OpenAI são internas ao mesmo job.

### Passo 4 - Revalidar e criar snapshots

Depois da resposta, repete as verificações de IDs, variantes, restrições, preço e stock. Conserva três a cinco recomendações quando o catálogo o permitir. Menos candidatos é cobertura limitada, não motivo para inventar produtos.

### Passo 5 - Persistir transacionalmente

Cria relatório, recomendações e ligação à sessão na mesma transação. Usa chave de idempotência do job para que restart ou duplo clique devolvam a mesma versão. Uma falha deve fazer rollback integral.

### Passo 6 - Integrar teaser e estados no frontend

Durante `generating_report`, a página faz polling progressivo. Em `draft_ready`, navega para `/consulta/relatorios/:reportId`. Antes do desbloqueio, o DTO contém apenas objetivos, data, versão, estado de revisão, número de produtos, total elegível e 10%; o conteúdo completo não entra no DOM.

### Passo 7 - Executar cenários negativos obrigatórios (mínimo 3)

1. Fazer a OpenAI devolver um produto fora da allowlist e esperar `502` (output upstream inválido) sem relatório parcial.
2. Usar um produto com ingrediente proibido e provar que é removido antes e depois do provider.
3. Injetar falha na transação e provar ausência de relatório e recomendações órfãs.
4. Fazer ambos os modelos falharem e confirmar `failed_retryable`, sem resposta cosmética fabricada.

#### Expected results

- A última sessão própria submetida é a única fonte da geração.
- A OpenAI escolhe apenas entre candidatos permitidos.
- O relatório conserva respostas, produtos e provenance da versão gerada.
- Produtos sem stock podem ser explicados, mas não entram no depósito.
- Regenerar nunca apaga uma decisão humana existente.

#### Critérios de aceite

- Allowlist limitada, minimizada e revalidada.
- Relatório v2 e recomendações persistidos atomicamente.
- Teaser bloqueado não revela conteúdo integral.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: unitário, contrato, integração transacional e E2E.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova |
|---|---|---|
| P0 | Integração | Job idempotente, allowlist, rollback e imutabilidade |
| P0 | Contrato | Structured Output inválido e IDs inventados são rejeitados |
| P1 | Frontend/E2E | Polling, teaser seguro, retry e navegação para relatório |

#### Validação final

- [ ] Unitários do filtro e do validador semântico verdes.
- [ ] Integração em `MongoMemoryReplSet` prova commit e rollback.
- [ ] Contratos do provider cobrem primary, retry e fallback OpenAI.
- [ ] Negativos: mínimo `3` cenários.
- [ ] Pesquisa scoped não encontra geração direta ativa nem provider sintético.

#### Evidence para PR/defesa

- Comandos, CWD, exit code e resumo sanitizado.
- IDs de testes e contagens, nunca prompts, respostas, fotografias ou PII.
- Exemplo minimizado de allowlist e de rejeição de ID inventado.
- Hash da versão do relatório e versões de prompt/schema.

#### Handoff

O `BK-MF8-11` recebe um relatório `draft_ready` com `machineResult` imutável, recomendações validadas e snapshots suficientes para uma revisão humana opcional.

## Bloco pedagogico

### Objetivo

Perceber por que razão JSON Schema e uma allowlist resolvem problemas diferentes.

### Pre-requisitos

Rever validação semântica, transações MongoDB, idempotência e ownership.

### Erros comuns

- Confiar nos IDs devolvidos pelo modelo.
- Enviar todo o catálogo ou dados identificáveis.
- Calcular preços no provider.
- Guardar resultado automático e revisão humana no mesmo campo.

### Check de compreensao

1. Por que se valida a seleção antes e depois da OpenAI?
2. O que acontece quando só existem dois candidatos válidos?
3. Por que o teaser não pode ser apenas conteúdo escondido por CSS?

## Bloco operacional

### Entrada

Sessão completa, consentimento v2, fotografias válidas e catálogo com metadata.

### Passos

Filtrar, minimizar, gerar, validar, persistir, publicar teaser e testar.

### Validacao

Executar testes focados, integração transacional e E2E sem internet através do transport injetado apenas em testes.

### Handoff

Entregar relatório v2 pronto para aceitação automática ou revisão humana.

## Criterios de aceite

- Contrato OpenAI-only sem geração sintética.
- Recomendações ligadas a evidência da consulta e a produtos reais.
- Conteúdo histórico imutável e disponibilidade atual separada.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Apresentar a cadeia sessão → job → allowlist → OpenAI → revalidação → relatório, com logs sanitizados e uma demonstração de rollback.

## Snippet tecnico aplicavel

```sh
npm --prefix apps/api test -- consultation-report ai-job
npm --prefix apps/web run test:contracts
```

#### Changelog

- `2026-07-11`: substituídos os contratos antigos pelo fluxo OpenAI-only de sessão, job durável, allowlist e relatório v2.
