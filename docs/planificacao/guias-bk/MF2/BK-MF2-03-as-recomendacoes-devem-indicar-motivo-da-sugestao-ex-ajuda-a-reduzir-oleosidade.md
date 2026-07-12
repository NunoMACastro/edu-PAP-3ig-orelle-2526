# BK-MF2-03 - Explicar motivo, utilização e cautelas das recomendações

## Header

- `doc_id`: `GUIA-BK-MF2-03`
- `bk_id`: `BK-MF2-03`
- `macro`: `MF2`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF2-02`
- `rf_rnf`: `RF19`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-04`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-03-as-recomendacoes-devem-indicar-motivo-da-sugestao-ex-ajuda-a-reduzir-oleosidade.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico:** motivo, utilização e cautelas fazem parte do Structured Output do relatório OpenAI v2 e ficam ligados ao snapshot do produto/variante. Não são gerados por uma segunda rota nem por frases locais genéricas depois do relatório.

## Contexto do BK

Uma recomendação sem explicação é difícil de avaliar e pode incentivar utilização incorreta. A explicação deve relacionar o produto com o objetivo e os factos da consulta, sem revelar dados privados desnecessários nem fazer alegações médicas.

## Objetivo

Garantir que cada recomendação validada inclui motivo específico, forma de utilização e cautelas coerentes com o produto, a variante, a rotina e as limitações cosméticas.

## Importância

Este BK torna a recomendação compreensível para o utilizador e auditável por um consultor. A qualidade não está em escrever mais texto, mas em mostrar a relação entre necessidade, atributo do produto e decisão tomada.

## Scope-in

- Exigir `reason`, `usage` e `cautions` no schema do relatório.
- Relacionar cada explicação com objetivos e evidência cosmética permitida.
- Validar campos vazios, tamanho e linguagem proibida.
- Mostrar produto/variante e explicação no mesmo card.
- Preservar a explicação no snapshot congelado.
- Permitir ajuste humano apenas dentro da revisão do relatório.
- Manter limitações e aviso não médico visíveis.

## Scope-out

- Não prometer cura, diagnóstico ou eficácia garantida.
- Não apresentar confiança/fonte inventadas.
- Não regenerar a explicação ao abrir o histórico.
- Não expor transcript completo, alergias ou respostas privadas no card.
- Não criar uma revisão separada por recomendação.

## Pré-requisitos

- Recomendações allowlisted e validadas de `BK-MF2-02`.
- Relatório v2 de `BK-MF1-07`.
- Catálogo com atributos cosméticos e INCI curados.

## Glossário

- **Motivo:** relação entre o objetivo/facto relevante e atributos reais do produto.
- **Utilização:** quando, onde e como integrar o produto na rotina.
- **Cautela:** condição de uso seguro ou limitação relevante, sem prescrição clínica.
- **Explicabilidade:** capacidade de apresentar os fatores que sustentam a escolha.

## Conceitos teóricos

Uma boa explicação é específica e verificável:

> “Escolhido para a etapa de hidratação porque a textura leve e as ceramidas declaradas são compatíveis com a preferência por uma rotina curta.”

Uma explicação fraca é genérica:

> “É o melhor produto para ti.”

O modelo só deve usar factos presentes no snapshot da sessão e atributos presentes nos candidatos. O backend não consegue provar verdade científica de texto livre, mas consegue impor boundaries: produto/variante allowlisted, campos obrigatórios, limites de tamanho, ausência de linguagem de cura e consistência com objetivos selecionados.

As cautelas não substituem aconselhamento médico. Sinais potencialmente clínicos ou reações importantes originam uma mensagem conservadora para procurar um profissional de saúde. A aplicação e o consultor são apresentados como apoio cosmético.

## Arquitetura do BK

- schema do `openai-report.provider`
- validação semântica por recomendação
- snapshot em `ProductRecommendation`
- projeção pelo `GET /api/face-reports/:reportId`
- UI em `ConsultationReportPage`

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/providers/openai-report.provider.js`
- EDITAR: `apps/api/src/services/consultation-report.service.js`
- EDITAR: `apps/api/src/services/recommendation-reason.service.js`
- EDITAR: `apps/api/src/models/product-recommendation.model.js`
- EDITAR: `apps/api/src/utils/recommendation-presentation.util.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx`

## Bloco pedagogico

### Objetivo

Aprender a converter a explicabilidade de IA num contrato de dados testável.

### Pre-requisitos

- Conhecer o relatório e a allowlist.
- Distinguir dados factuais de linguagem promocional.
- Saber validar strings e arrays.

### Erros comuns

- Usar uma frase fixa com base apenas na categoria.
- Copiar respostas sensíveis para o motivo.
- Omitir cautelas quando o produto tem utilização gradual.
- Mostrar motivo histórico com atributos atuais do catálogo.
- Permitir que feedback do utilizador altere a seleção congelada.

### Check de compreensao

- Que informação torna um motivo verificável?
- Porque é que a explicação pertence ao snapshot?
- Qual é a diferença entre cautela cosmética e diagnóstico médico?

### Tempo estimado

`S` — schema, validação, UI e testes.

## Bloco operacional

### Entrada

- Recomendação presente na allowlist.
- Atributos minimizados do produto/variante.
- Objetivos e factos permitidos da consulta.

### Saída

- `reason` específico.
- `usage` com integração na rotina.
- `cautions` como lista curta.
- Limitações gerais do relatório.

### Passos

Executar cenarios negativos obrigatorios (minimo 2).

#### Passo 1 - Definir o schema

Cada recomendação exige ID, variant ID opcional, motivo, utilização e cautelas. Limita o comprimento e o número de cautelas para evitar texto impossível de rever.

#### Passo 2 - Minimizar os factos

Envia apenas objetivos e factos necessários à escolha. Não inclui nome, email, IDs MongoDB, transcript completo ou texto livre irrelevante.

#### Passo 3 - Pedir causalidade explícita

Instrui a OpenAI a ligar a decisão a atributos recebidos, sem dizer que observou um ingrediente ou efeito que não consta do candidato.

#### Passo 4 - Validar semanticamente

Confirma que os três campos existem, que cautelas é um array curto e que a recomendação continua allowlisted. Rejeita linguagem médica definitiva e IDs desconhecidos.

```js
function hasUsableExplanation(item) {
    return item.reason.trim().length >= 20
        && item.usage.trim().length >= 15
        && Array.isArray(item.cautions)
        && item.cautions.length <= 5;
}
```

#### Passo 5 - Persistir no snapshot

Guarda explicação junto da versão do relatório. Uma alteração futura do produto ou do prompt não modifica esse texto.

#### Passo 6 - Projetar locked/unlocked

No teaser locked, não devolvas os motivos completos. Depois do unlock, apresenta razão, utilização, cautelas e limitações do relatório.

#### Passo 7 - Integrar o card acessível

Associa heading, produto, variante, estado de stock e listas com labels. Não uses apenas cor para cautelas/indisponibilidade.

#### Passo 8 - Integrar revisão humana

O consultor pode ajustar texto dentro de `humanOverride`. A versão OpenAI permanece em `machineResult` e o audit log regista a decisão.

### Cenarios negativos recomendados

- Motivo vazio/genérico: Structured Output rejeitado.
- Motivo refere ingrediente ausente: falha semântica/revisão necessária.
- Linguagem de cura/diagnóstico: rejeitar ou normalizar de forma conservadora.
- Relatório locked: explicação não sai da API.
- Ajuste humano sem cautelas obrigatórias: validação falha.
- Feedback “não relevante”: não remove a recomendação congelada.

### Validacao

- [ ] Negativos: minimo 2 cenarios materiais executados.
- Gate documental: falhar se `negativos < 2`.
- Testes de campos obrigatórios e limites.
- Testes de linguagem proibida e IDs allowlisted.
- Teste do teaser sem explicações.
- Teste de imutabilidade depois do freeze.
- Teste frontend por teclado e leitor de ecrã.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | explicação ausente/inválida | relatório não é aceite |
| P0 | conteúdo locked | motivo/utilização/cautelas ausentes do DTO |
| P1 | snapshot histórico | explicação não muda com catálogo/prompt |
| P1 | ajuste humano | machine result preservado e override auditado |
| P1 | cautela visual | texto e semântica, não apenas cor |

### Evidencia de testes por camada

- Unit: campos, limites e linguagem proibida.
- Integração: snapshot, paywall e human override.
- Frontend/E2E: cards, cautelas, acessibilidade e conteúdo locked.

### Handoff

`BK-MF2-05` reutiliza `usage` e `cautions` para organizar uma rotina coerente. `BK-MF2-06` valida ajustes humanos com o mesmo contrato.

## Expected results

- Cada recomendação explica porquê, como usar e que cautelas considerar.
- O texto usa apenas dados permitidos e atributos reais do candidato.
- O teaser não expõe explicações locked.
- O histórico mantém a explicação da versão congelada.

## Snippet tecnico aplicavel

O helper do Passo 4 é uma validação mínima; a implementação final acrescenta allowlist, limites, linguagem proibida e coerência com objetivos.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 2.
- `reason`, `usage` e `cautions` são obrigatórios no relatório válido.
- Explicações não fazem diagnóstico nem promessa de cura.
- Texto bloqueado não é enviado ao frontend.
- Snapshot e machine result são imutáveis.
- Ajuste humano ocupa `humanOverride` e fica auditado.
- UI associa claramente explicação ao produto/variante.

## Validação final

Executa testes do schema/semântica, paywall, revisão, frontend e axe nas recomendações do relatório.

## Evidence para PR/defesa

- Exemplo sintético sanitizado de motivo/utilização/cautelas.
- Teste negativo de motivo genérico ou linguagem clínica.
- DTO locked sem explicações.
- Prova de machine result + human override separados.

## Handoff

A rotina do relatório deve usar exatamente as recomendações e explicações congeladas, sem chamar uma segunda geração independente.

## Changelog

- `2026-06-08`: guia inicial de motivos de recomendação.
- `2026-07-11`: explicações integradas no Structured Output do relatório v2 com utilização, cautelas e paywall.
