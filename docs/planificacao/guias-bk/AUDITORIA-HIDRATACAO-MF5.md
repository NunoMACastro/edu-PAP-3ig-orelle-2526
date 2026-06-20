# Auditoria, hidratação e correção de guias BK - MF5

## Header
- `doc_id`: `AUDITORIA-HIDRATACAO-MF5`
- `project_name`: `Orelle`
- `mf_alvo`: `MF5`
- `modo`: `corrigir_apenas`
- `data_execucao`: `2026-06-20`
- `implementation_root`: `real_dev`
- `audit_report_source`: `auto`
- `relatorio`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF5.md`
- `status`: `bk_alvo_corrigido_com_validador_legacy_global_fail`
- `output_mode`: `relatorio_e_resumo`
- `bk_ids`: `BK-MF5-08`
- `strict_scope`: `true`
- `check_mf_coherence`: `true`
- `permitir_alterar_docs`: `sim`
- `permitir_commits`: `nao`

## Objetivo da execução

Executar a correção documental do guia `BK-MF5-08`, usando o relatório de auditoria existente como fonte dos findings confirmados. O scope ficou limitado ao BK alvo e a este relatório. Não houve alterações em runtime, código de produto, documentos canónicos, prompts ou `agent/legacy/**`.

## Contexto de worktree

- Antes desta execução já existiam alterações locais em vários BKs de `MF5` e ficheiros não versionados relacionados com relatórios de `MF4`.
- Esta execução alterou apenas:
  - `docs/planificacao/guias-bk/MF5/BK-MF5-08-modo-escuro-e-contraste-ajustado.md`
  - `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF5.md`
- Nenhum commit foi feito, porque `PERMITIR_COMMITS=nao`.

## Fonte dos findings corrigidos

O relatório audit-only anterior classificava `BK-MF5-08` como `PARCIAL` e registava três findings confirmados:

- `ORELLE-MF5-BK08-P1-001`: guia apontava para o root antigo `apps/web` em vez de `real_dev/web`.
- `ORELLE-MF5-BK08-P2-002`: blocos longos de código não cumpriam a regra de comentários didáticos internos.
- `ORELLE-MF5-BK08-P2-003`: validação `P2`, matriz mínima, evidence por camada e negativos não estavam formalizados no formato canónico.

## Resultado de classificação

| Momento | OK | PARCIAL | CRITICO | Total |
| --- | ---: | ---: | ---: | ---: |
| Antes da correção | 0 | 1 | 0 | 1 |
| Depois da correção | 1 | 0 | 0 | 1 |

## Resultado por BK

| BK | RF/RNF | Estado antes | Estado depois | Resultado |
| --- | --- | --- | --- | --- |
| `BK-MF5-08` | `RNF04` | `PARCIAL` | `OK` | Guia reescrito para `real_dev/web`, com 7 passos, comentários didáticos, matriz `P2`, evidence por camada e cenário negativo obrigatório. |

## Correções aplicadas

### `ORELLE-MF5-BK08-P1-001` - Root operacional errado

- Estado depois: `CORRIGIDO`.
- Correção: todos os ficheiros, instruções e comandos do guia alvo foram realinhados para `real_dev/web`.
- Validação: pesquisa de roots antigos em `docs/planificacao/guias-bk/MF5/*.md` terminou sem matches.
- Evidência adicional: `npm --prefix real_dev/web run build` passou.

### `ORELLE-MF5-BK08-P2-002` - Comentários didáticos insuficientes em blocos longos

- Estado depois: `CORRIGIDO`.
- Correção: os blocos longos de CSS, hook React, componente React e integração em `App.jsx` passaram a incluir comentários didáticos dentro do próprio código, além de explicações externas.
- Validação: revisão manual do guia corrigido. Os comentários explicam fronteiras relevantes como tema visual versus sessão, validação de tema permitido, foco visível, `aria-pressed` e preservação de roles.

### `ORELLE-MF5-BK08-P2-003` - Validação P2/negativos incompleta

- Estado depois: `CORRIGIDO`.
- Correção: o guia passou a ter `### Matriz mínima de testes por prioridade`, `Evidência de testes por camada`, `Executar cenários negativos obrigatórios (mínimo 1)`, `Cenários negativos concluídos: mínimo 1` e checklist `Negativos: mínimo 1 cenários`.
- Validação: `bash scripts/validate-planificacao.sh` já não reporta para `BK-MF5-08` os issues de matriz, evidence ou negativos; resta apenas o issue legacy `missing_pedagogic_or_operational_blocks`.

## Contrato canónico preservado

- `RNF04` continua limitado a acessibilidade, modo escuro e contraste.
- `BK-MF5-08` mantém `MF5`, prioridade `P2`, esforço `S`, sprint `S09-S10`, `core_or_reforco=Core` e `proximo_bk=BK-MF6-01`.
- Não foram inventados endpoints, models, services, roles, pagamentos, providers externos ou regras de negócio.
- O guia continua a separar scope visual de autenticação, autorização, consentimento, fotografias, relatórios e dados pessoais.

## Validações executadas

| Comando/verificação | Resultado | Observação |
| --- | --- | --- |
| Pesquisa de roots antigos em `docs/planificacao/guias-bk/MF5/*.md` | `PASS_SEM_MATCHES` | Exit code `1`, sem ocorrências. |
| Pesquisa de termos proibidos/drift em `docs/planificacao/guias-bk/MF5/*.md` | `PASS_SEM_MATCHES` | Exit code `1`, sem ocorrências. |
| Pesquisa específica no BK alvo para roots antigos, storage sensível, claims indevidos e domínios externos | `PASS_SEM_MATCHES` | Exit code `1`, sem ocorrências. |
| Marcadores canónicos no BK alvo | `PASS` | Matriz mínima, evidence por camada, negativos em passo, critérios e validação final encontrados. |
| `npm --prefix real_dev/web run build` | `PASS` | Vite: 66 módulos transformados; build concluído em 371 ms. |
| `git diff --check` | `PASS` | Sem output. |
| `bash scripts/validate-planificacao.sh` | `FAIL_LEGACY_GLOBAL` | `coverage_pass=true`, `consistency_pass=true`, `guides_pass=false`, `overall_pass=false`. Para `BK-MF5-08`, resta apenas `missing_pedagogic_or_operational_blocks`, regra legacy divergente da estrutura ativa da prompt. |

## Detalhe do validador canónico

Depois da correção, o validador deixou de reportar para `BK-MF5-08`:

- `missing_test_matrix_section`
- `missing_test_layer_acceptance`
- `negative_policy_step_mismatch`
- `negative_policy_validacao_mismatch`
- `negative_policy_criterio_mismatch`

O validador ainda reporta `missing_pedagogic_or_operational_blocks` para `BK-MF5-08` e para outros BKs de `MF5`, porque procura blocos legacy como `## Bloco pedagogico` e `## Bloco operacional`. A prompt ativa e o template atual pedem a estrutura tutorial com `#### Objetivo`, `#### Tutorial técnico linear`, `#### Critérios de aceite`, `#### Validação final`, `#### Evidence`, `#### Handoff` e `#### Changelog`. Este ponto foi tratado como drift legacy do validador, não como finding aberto do BK alvo.

## Validações não executadas

- Não foi executado build no root antigo, porque `IMPLEMENTATION_ROOT=real_dev`.
- Não foram executados testes API, porque `BK-MF5-08` é RNF visual e não altera backend.
- Não foi feita inspeção visual em browser, porque a execução corrigiu guia documental e não aplicou o BK no runtime.
- Não foram criados commits por instrução explícita da prompt.

## Riscos restantes

- O `overall_pass=false` do validador continua enquanto o contrato legacy de blocos antigos não for conciliado com a estrutura ativa.
- A validação visual real de contraste só fica completa quando o aluno aplicar o guia no runtime e testar em browser.
- Existem alterações locais prévias noutros BKs/relatórios que esta execução preservou e não reverteu.

## Resumo final

- MF processada: `MF5`.
- BKs no scope de correção: `1`.
- BKs editados: `BK-MF5-08`.
- Relatório editado: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF5.md`.
- Contagem antes: `OK=0`, `PARCIAL=1`, `CRITICO=0`.
- Contagem depois: `OK=1`, `PARCIAL=0`, `CRITICO=0`.
- Principais lacunas corrigidas: root `real_dev/web`, comentários didáticos, matriz `P2`, evidence por camada e negativo mínimo.
- Resultado de `npm --prefix real_dev/web run build`: `PASS`.
- Resultado de `git diff --check`: `PASS`.
- Resultado de `bash scripts/validate-planificacao.sh`: `FAIL_LEGACY_GLOBAL`, com `BK-MF5-08` sem issues canónicos remanescentes exceto o bloco legacy.
- Commits: nenhum.
