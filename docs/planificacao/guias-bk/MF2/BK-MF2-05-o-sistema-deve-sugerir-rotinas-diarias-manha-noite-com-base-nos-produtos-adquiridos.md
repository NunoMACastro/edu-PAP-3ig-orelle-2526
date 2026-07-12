# BK-MF2-05 - Sugerir rotina do relatório com instruções e cautelas

## Header

- `doc_id`: `GUIA-BK-MF2-05`
- `bk_id`: `BK-MF2-05`
- `macro`: `MF2`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P1`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF2-02`
- `rf_rnf`: `RF21`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-06`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-05-o-sistema-deve-sugerir-rotinas-diarias-manha-noite-com-base-nos-produtos-adquiridos.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico:** a rotina faz parte do relatório OpenAI v2. Não é gerada por uma rota independente nem depende apenas do histórico de compras. Usa os objetivos, respostas e produtos/variantes validados do relatório e inclui instruções e cautelas. A loja pode informar disponibilidade atual, mas não altera a rotina congelada.

## Contexto do BK

Uma lista de produtos não explica ordem, frequência ou compatibilidade. A rotina organiza as recomendações num plano simples e conservador, normalmente manhã/noite, adaptado ao objetivo e às preferências recolhidas na conversa.

## Objetivo

Produzir dentro do relatório uma rotina estruturada com períodos, passos ordenados, instruções, razão e cautelas, usando apenas as recomendações validadas da mesma versão.

## Importância

Produtos corretos podem ser usados de forma incorreta. Uma rotina útil deve evitar combinações agressivas, explicar progressão e lembrar proteção solar quando relevante, sem transformar a aplicação em prescrição médica.

## Scope-in

- Incluir uma rotina no schema do relatório OpenAI.
- Suportar períodos `manha`, `noite` e, se necessário, `ocasional`.
- Referenciar apenas recommendation IDs/variant IDs da allowlist final.
- Exigir `title`, `instructions`, `reason` e `cautions` por passo.
- Respeitar preferência de rotina curta e orçamento.
- Mostrar indisponibilidade atual sem apagar passos históricos.
- Permitir ajuste humano do plano dentro da revisão do relatório.

## Scope-out

- Não criar uma geração independente fora do relatório.
- Não inventar produtos fora do relatório.
- Não obrigar o utilizador a comprar todos os produtos.
- Não prescrever medicamentos, concentrações clínicas ou tratamento de doença.
- Não alterar a rotina congelada com compras ou stock posteriores.

## Pré-requisitos

- Recomendações validadas e explicadas em `BK-MF2-02`/`BK-MF2-03`.
- Respostas sobre rotina atual, orçamento e preferências.
- Relatório v2 e revisão opcional.

## Glossário

- **Período:** momento de utilização, por exemplo manhã ou noite.
- **Passo:** ação ordenada ligada a uma recomendação ou cuidado geral permitido.
- **Progressão:** introdução gradual para reduzir risco de irritação.
- **Rotina congelada:** snapshot do plano na versão final do relatório.

## Conceitos teóricos

O modelo pode organizar e explicar, mas o backend limita os ingredientes disponíveis para a decisão. Cada passo de produto aponta para uma recomendação já validada. Assim, uma resposta OpenAI não consegue introduzir um produto novo através do campo de texto da rotina.

Um contrato possível é:

```text
routine[]
  period: manha | noite | ocasional
  title: texto curto
  steps[]
    recommendationId: ID permitido ou null para cuidado geral
    order: inteiro positivo
    instructions: como/quando aplicar
    reason: relação com o objetivo
    cautions[]: lista curta
```

Cuidados gerais sem produto, como “aplicar proteção solar adequada”, têm de estar dentro das regras do objetivo e não podem esconder uma recomendação comercial inventada.

Se a consulta assinalar irritação forte ou sinais potencialmente clínicos, a rotina torna-se conservadora e recomenda avaliação por profissional de saúde. Não faz diagnóstico.

## Arquitetura do BK

- schema de rotina no `openai-report.provider`
- validação em `consultation-report.service`
- snapshot dentro de `FaceReport.machineResult`/`humanOverride`
- `GET /api/face-reports/:reportId`
- `ConsultationReportPage` como UI principal

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/providers/openai-report.provider.js`
- EDITAR: `apps/api/src/services/consultation-report.service.js`
- EDITAR: `apps/api/src/models/face-report.model.js`
- EDITAR: `apps/api/src/validators/ai-consultation-review.validator.js`
- EDITAR: `apps/api/src/services/ai-consultation-review.service.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- EDITAR: `apps/web/src/features/consultation/ConsultationReviewsPage.jsx`

## Bloco pedagogico

### Objetivo

Aprender a validar relações internas num documento gerado por IA: a rotina só pode apontar para recomendações da mesma versão.

### Pre-requisitos

- Compreender arrays ordenados e IDs relacionais.
- Ter recomendações e explicações validadas.
- Distinguir plano cosmético de prescrição clínica.

### Erros comuns

- Aceitar nome livre de produto dentro do passo.
- Omitir instruções ou cautelas num ajuste humano.
- Ordenar passos apenas no frontend.
- Regerar a rotina sempre que a página abre.
- Remover um passo histórico porque o produto ficou sem stock.

### Check de compreensao

- Porque é que cada passo deve apontar para uma recomendação validada?
- O que muda entre snapshot histórico e disponibilidade atual?
- Que campos tornam um passo executável e seguro?

### Tempo estimado

`S` — schema, validação e apresentação.

## Bloco operacional

### Entrada

- Recomendações finais do relatório.
- Objetivos, rotina atual, orçamento, preferências e restrições.

### Saída

- Plano ordenado de manhã/noite e, quando justificado, semanal.
- Instruções, razão e cautelas por passo.
- Limitações e aviso não médico.

### Passos

Executar cenarios negativos obrigatorios (minimo 2).

#### Passo 1 - Definir o contrato da rotina

Usa enums para período, ordem inteira e campos obrigatórios. Limita o número de passos e cautelas para manter a rotina compreensível.

#### Passo 2 - Passar apenas recomendações finais

O prompt recebe os IDs e atributos do conjunto final. Não recebe catálogo adicional nem permite nomes livres como substituto de IDs.

#### Passo 3 - Pedir ordem e progressão

Instrui a OpenAI a ordenar limpeza, cuidado, hidratação e proteção de acordo com os produtos existentes, respeitando rotina curta e introdução gradual quando necessário.

#### Passo 4 - Validar referências

Rejeita `recommendationId` fora do relatório, duplicação incoerente, ordem repetida, período inválido ou campos em falta.

```js
function validateRoutineStep(step, allowedRecommendationIds) {
    if (step.recommendationId !== null
        && !allowedRecommendationIds.has(step.recommendationId)) {
        throw new Error("Rotina referencia recomendação não permitida");
    }
    if (!step.instructions?.trim() || !step.reason?.trim()) {
        throw new Error("Passo sem instruções ou razão");
    }
}
```

#### Passo 5 - Persistir no relatório

Guarda o plano em `machineResult`. Se houver revisão, o ajuste vai para `humanOverride`, preservando o original e o audit log.

#### Passo 6 - Aplicar o paywall

O teaser pode indicar que existe uma rotina, mas não envia passos, instruções ou cautelas. A rotina completa só é serializada depois do unlock.

#### Passo 7 - Apresentar na UI

Usa headings por período e lista numerada por ordem. Cada passo mostra variante, instruções, motivo, cautelas e estado atual do produto com texto, não apenas cor.

#### Passo 8 - Ligar ao catálogo sem reescrever o passado

Produto disponível abre o detalhe/variante; indisponível oferece alerta. A disponibilidade atual é calculada à parte e nunca remove o passo do snapshot.

### Cenarios negativos recomendados

- Passo referencia recomendação inexistente: rejeitar.
- Ajuste humano omite `instructions` ou `cautions`: `400`.
- Período/ordem inválidos: rejeitar.
- Relatório locked: rotina ausente do DTO.
- Produto fica sem stock: passo histórico mantém-se e CTA muda.
- Conteúdo clínico/prescritivo: saída rejeitada ou limitada.

### Validacao

- [ ] Negativos: minimo 2 cenarios materiais executados.
- Gate documental: falhar se `negativos < 2`.
- Testes do schema e referências internas.
- Testes de instruções/cautelas obrigatórias no ajuste humano.
- Teste de paywall.
- Teste de imutabilidade após freeze.
- Teste frontend de ordem, labels e navegação por teclado.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | ID fora do conjunto final | rotina rejeitada |
| P0 | locked | passos não saem da API |
| P1 | ajuste sem instruções/cautelas | validação falha |
| P1 | produto fica sem stock | snapshot preservado, CTA adaptado |
| P1 | revisão humana | machine result preservado |

### Evidencia de testes por camada

- Unit: períodos, ordem, referências, instruções e cautelas.
- Integração: relatório, revisão, freeze e paywall.
- Frontend/E2E: ordem visual, catálogo, teclado e estado de stock.

### Handoff

`BK-MF2-06` permite ao consultor ajustar a rotina inteira dentro da revisão do relatório, usando este mesmo validator.

## Expected results

- Rotina útil, ordenada e específica para os objetivos.
- Todos os produtos pertencem às recomendações validadas.
- Cada passo tem instruções, razão e cautelas.
- Relatório locked não revela o plano.
- Freeze mantém o plano histórico.

## Snippet tecnico aplicavel

O validator do Passo 4 mostra a regra central: nenhum texto da rotina pode introduzir uma recomendação comercial fora do relatório.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 2.
- Rotina integra o Structured Output do relatório v2.
- Períodos e passos têm ordem validada.
- Referências pertencem à versão final.
- `instructions`, `reason` e `cautions` são obrigatórios.
- Revisão preserva `machineResult`.
- Conteúdo locked não é enviado.
- Linguagem é cosmética e não médica.

## Validação final

Executa testes do provider/schema, revisão, paywall, frontend, E2E e axe no relatório.

## Evidence para PR/defesa

- Rotina sintética sanitizada com manhã/noite.
- Teste negativo de recommendation ID inventado.
- Teste de ajuste humano incompleto.
- Prova de snapshot preservado após mudança de stock.

## Handoff

A revisão humana trabalha sobre o relatório inteiro: avaliação, recomendações e rotina. Não cria uma entidade concorrente de rotina.

## Changelog

- `2026-06-08`: guia inicial de rotina diária.
- `2026-07-11`: rotina incorporada no relatório OpenAI v2 com referências allowlisted, instruções, cautelas e paywall.
