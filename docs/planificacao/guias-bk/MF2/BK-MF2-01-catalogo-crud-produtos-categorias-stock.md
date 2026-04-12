# BK-MF2-01 - Catálogo: CRUD de produtos, categorias e stock inicial

## Header
- `doc_id`: `GUIA-BK-MF2-01`
- `bk_id`: `BK-MF2-01`
- `macro`: `MF2`
- `owner`: `Bruna`
- `apoio`: `Daniel Bulica`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforço`: `M`
- `dependências`: `BK-MF0-03, BK-MF1-04`
- `rf_rnf`: `RF07, RF08, RNF19`
- `last_updated`: `2026-04-12`

## O que vamos fazer neste BK
Neste BK vamos entregar **catálogo: crud de produtos, categorias e stock inicial** com um resultado final verificável em review e pronto para integração na macro `MF2`.

A execução acontece na Fase 1 e respeita as dependências `BK-MF0-03, BK-MF1-04`. Qualquer detalhe técnico não fechado fica marcado como **a definir no BK dependente**, sem expandir scope fora deste BK.

## Porque isto é importante
- Impacto funcional: habilita diretamente os requisitos `RF07, RF08, RNF19` com entrega concreta visível no produto.
- Impacto técnico/arquitetural: estabiliza contratos de implementação para reduzir retrabalho entre frontend, backend e dados.
- Impacto na sequência: desbloqueia a progressão para `BK-MF2-02` sem ambiguidade documental.
- Risco se mal executado: cria falhas de integração, regressões de qualidade ou atraso em cadeia na macro seguinte.

## O que entra (scope)
- Definir o entregável técnico e funcional de `BK-MF2-01` com critérios observáveis.
- Implementar os fluxos principais associados a `RF07, RF08, RNF19`.
- Validar dependências de entrada e contratos de saída para handoff.
- Documentar decisões operacionais, limites e evidências de execução.
- Verificar smoke, negativos e validação técnica conforme checklist.

## O que não entra (scope-out)
- Trabalho de BKs seguintes, incluindo `BK-MF2-02` quando aplicável.
- Refactors fora do objetivo direto deste BK.
- Integrações sem pré-condições já concluídas nas dependências.
- Otimizações avançadas não exigidas pelos critérios de aceite deste BK.
- Alteração de estado operacional sem pedido explícito.

## Como saber que isto ficou bem
- Quando os fluxos principais definidos no scope executam sem erro, então o resultado funcional está correto.
- Quando os critérios de aceite deste guia são todos `passa`, então o BK está completo.
- Quando a evidência (`pr`, `proof`, `neg`) está preenchida com dados reais, então a auditoria é reprodutível.
- Quando backlog e guia têm metadados idênticos, então não existe divergência documental.

## Pre-leitura mínima (10-15 min)
- `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `docs/planificacao/backlogs/MF-VIEWS.md`
- `docs/RF.md` (secções relacionadas com `RF07, RF08, RNF19`)
- `docs/RNF.md` (secções relacionadas com `RF07, RF08, RNF19`)

## Glossário rápido
- `scope`: limite do que este BK inclui para entrega.
- `scope-out`: exclusões explícitas para evitar scope creep.
- `handoff`: passagem estruturada para o próximo BK.
- `smoke`: verificação rápida de funcionamento principal.
- `proof`: evidência objetiva da entrega em execução real.
- `neg`: teste negativo com resultado e comportamento esperado.

## Guia de execução (passo-a-passo)
1. Objetivo (~15 min): confirmar baseline e dependências.
Justificação: evita iniciar implementação com pré-condições incompletas.
Como fazer: validar `BK-MF0-03, BK-MF1-04` no backlog, confirmar contratos e restrições de `RF07, RF08, RNF19`.
O que verificar: não existem dependências em falta nem conflito de owner.
2. Objetivo (~20 min): decompor tarefas executáveis deste BK.
Justificação: reduz risco de ambiguidade durante implementação.
Como fazer: dividir em tarefas pequenas por fluxo principal, validação e documentação.
O que verificar: cada tarefa tem resultado observável e critério de done.
3. Objetivo (~25 min): desenhar a solução antes de codificar.
Justificação: garante coerência técnica com arquitetura e RF/RNF.
Como fazer: definir contratos, dados, validações e pontos de falha esperados.
O que verificar: desenho cobre casos principais e limitações deste BK.
4. Objetivo (~45 min): entregar primeiro incremento funcional.
Justificação: acelerar feedback com um fluxo ponta-a-ponta mínimo.
Como fazer: implementar caminho feliz do BK e executar smoke local.
O que verificar: fluxo principal responde sem erro e com saída correta.
5. Objetivo (~35 min): fechar casos principais e consistência de dados.
Justificação: evitar regressões ao expandir além do primeiro incremento.
Como fazer: completar variações do fluxo e garantir persistência/consulta corretas.
O que verificar: critérios funcionais do BK ficam todos cobertos.
6. Objetivo (~30 min): validar negativos e estabilidade.
Justificação: reduzir defeitos em cenários inválidos e de borda.
Como fazer: testar entradas inválidas, permissões, timeouts e respostas de erro.
O que verificar: sistema falha com segurança e mensagens úteis.
7. Objetivo (~20 min): preparar handoff e evidência.
Justificação: permite continuidade por outro aluno sem reunião extra.
Como fazer: registar `pr`, `proof`, `neg` e indicar próximo BK recomendado.
O que verificar: documentação está completa, auditável e alinhada com backlog.

## Snippets de código (evolução)
Neste momento este BK ainda não tem snippet consolidado; os snippets serão adicionados aqui com a evolução do projeto.

## Checklist de validação
### Smoke
- Fluxo principal de `scope` executa do início ao fim sem erro.
- Entregável final deste BK está visível e verificável em review.
### Negativos
- Entradas inválidas devolvem erro controlado e mensagem clara.
- Ação sem permissão/condição prévia é bloqueada sem quebrar sistema.
### Técnico
- Metadados do guia batem 100% com `BACKLOG-MVP.md`.
- Dependências e próximo BK existem e têm link válido.

## Critérios de aceite
- Entregável principal do BK está implementado e demonstrável.
- Dependências `BK-MF0-03, BK-MF1-04` estão satisfeitas para o contexto atual.
- Checklist de validação apresenta resultados reproduzíveis.
- Evidence de PR/defesa foi preenchida com dados factuais.
- Não há divergência entre backlog, MF-VIEWS e este guia.

## Evidence para PR/defesa
- `pr`: a preencher com link/ID real de pull request.
- `proof`: a preencher com vídeo curto, screenshots ou logs de execução.
- `neg`: teste negativo obrigatório com resultado esperado vs observado.

## Próximo BK recomendado
- `BK-MF2-02` - Mantém a sequência prevista de dependências e reduz bloqueios em macro seguinte.
