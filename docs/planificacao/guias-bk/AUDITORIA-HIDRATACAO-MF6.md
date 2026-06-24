# AUDITORIA-HIDRATACAO-MF6

## Header

- `project`: `Orelle`
- `mf_alvo`: `MF6`
- `modo`: `auditar_apenas`
- `bk_ids`: `[]`
- `strict_scope`: `true`
- `output_mode`: `relatorio_e_resumo`
- `run_commands`: `true`
- `permitir_alterar_docs`: `sim`
- `permitir_commits`: `nao`
- `data_execucao`: `2026-06-24`
- `student_app_root`: `apps`
- `private_reference_root`: `real_dev`
- `bk_output_root`: `apps`
- `relatorio`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF6.md`

## Resumo executivo

Foi executada uma re-auditoria `auditar_apenas` da `MF6`, cobrindo todos os BKs canonicos da fase porque `BK_IDS: []`.

Escopo alterado nesta execucao:

- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF6.md`

Escopo preservado sem edicoes:

- `docs/planificacao/guias-bk/MF6/BK-MF6-*.md`
- `apps/api/**`
- `apps/web/**`
- `real_dev/**`
- `agent/**`, `agent/legacy/**`
- documentos canonicos, prompts, commits, branches e PRs

| Momento | OK | PARCIAL | CRITICO |
| --- | ---: | ---: | ---: |
| Relatorio anterior apos correcao | 7 | 0 | 0 |
| Re-auditoria manual atual | 7 | 0 | 0 |

Resultado manual da MF6: `GO_COM_RESSALVAS`.

A ressalva principal e objetiva: `bash scripts/validate-planificacao.sh` continua com `overall_pass=false`. A falha automatica vem de `guides_pass=false`, sobretudo por contrato legacy do validador (`## Bloco pedagogico` / `## Bloco operacional`) e por anchors literais de matriz/evidencia/negativos em alguns BKs. A prompt ativa proibe reintroduzir blocos pedagogicos/operacionais genericos nos BKs, pelo que esta divergencia deve ser tratada como drift de contrato do validador, nao como autorizacao para editar BKs nesta execucao audit-only.

## Documentos e fontes consultadas

- prompt anexada desta execucao
- `README.md`
- `docs/RF.md`
- `docs/RNF.md`
- `docs/planificacao/README.md`
- `docs/planificacao/CORE-DUAL-CONTRATO.md`
- `docs/planificacao/PLANO-IMPLEMENTACAO-TOTAL.md`
- `docs/planificacao/backlogs/BACKLOG-MVP.md`
- `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- `docs/planificacao/backlogs/CONTRATO-CAMPOS-BK.md`
- `docs/planificacao/backlogs/MF-VIEWS.md`
- `docs/planificacao/backlogs/ANEXO-RF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-RNF-PARA-BKS.md`
- `docs/planificacao/backlogs/ANEXO-CORE-DUAL-BK.md`
- `docs/planificacao/sprints/PLANO-SPRINTS.md`
- `docs/planificacao/sprints/SCORECARD-SPRINTS.md`
- `docs/planificacao/guias-bk/README.md`
- `docs/planificacao/guias-bk/_TEMPLATE-BK.md`
- todos os guias em `docs/planificacao/guias-bk/MF6/`
- `docs/planificacao/scripts/auditar_planificacao.py`
- `apps/api/src/**`
- `apps/api/tests/**`
- `apps/web/src/**`
- `apps/api/package.json`
- `apps/web/package.json`

## Inventario canonico da MF6

| BK | RNF | Prioridade | Estado atual | Evidencia principal |
| --- | --- | --- | --- | --- |
| `BK-MF6-01` | `RNF05` | `P0` | `OK` | 8 passos, todos os subcampos obrigatorios por passo, sem leakage `real_dev`. |
| `BK-MF6-02` | `RNF06` | `P0` | `OK` | 8 passos, todos os subcampos obrigatorios por passo, sem leakage `real_dev`. |
| `BK-MF6-03` | `RNF07` | `P1` | `OK` | 6 passos, todos os subcampos obrigatorios por passo, sem leakage `real_dev`. |
| `BK-MF6-04` | `RNF08` | `P1` | `OK` | 7 passos, todos os subcampos obrigatorios por passo, sem leakage `real_dev`. |
| `BK-MF6-05` | `RNF09` | `P0` | `OK` | 8 passos, todos os subcampos obrigatorios por passo, sem leakage `real_dev`. |
| `BK-MF6-06` | `RNF10` | `P0` | `OK` | 8 passos, todos os subcampos obrigatorios por passo, sem leakage `real_dev`. |
| `BK-MF6-07` | `RNF11` | `P0` | `OK` | 8 passos, todos os subcampos obrigatorios por passo, sem leakage `real_dev`. |

## Resultado da re-auditoria por BK

| BK | Resultado | Observacao |
| --- | --- | --- |
| `BK-MF6-01` | `OK_COM_RESSALVA_VALIDATOR` | Manualmente consistente com `RNF05`; o validador ainda acusa contrato legacy e mismatch literal em validacao negativa. |
| `BK-MF6-02` | `OK_COM_RESSALVA_VALIDATOR` | Manualmente consistente com `RNF06`; o validador ainda acusa contrato legacy, matriz/evidencia literal e negativos literais. |
| `BK-MF6-03` | `OK_COM_RESSALVA_VALIDATOR` | Manualmente consistente com `RNF07`; o validador ainda acusa contrato legacy, matriz/evidencia literal e negativos literais. |
| `BK-MF6-04` | `OK_COM_RESSALVA_VALIDATOR` | Manualmente consistente com `RNF08`; o validador ainda acusa contrato legacy e mismatch literal em validacao negativa. |
| `BK-MF6-05` | `OK_COM_RESSALVA_VALIDATOR` | Conteudo estruturalmente completo; o validador ja so acusa contrato legacy de blocos pedagogico/operacional. |
| `BK-MF6-06` | `OK_COM_RESSALVA_VALIDATOR` | Conteudo estruturalmente completo; o validador ja so acusa contrato legacy de blocos pedagogico/operacional. |
| `BK-MF6-07` | `OK_COM_RESSALVA_VALIDATOR` | Manualmente consistente com `RNF11`; o validador ainda acusa contrato legacy e negativos literais. |

## Findings

### `ORELLE-MF6-BK05-P2-001`

- `severidade`: `P2`
- `bk_rnf`: `BK-MF6-05` / `RNF09`
- `estado`: `NAO_REPRODUZIDO_NA_REAUDITORIA`
- `expected`: BK `P0` com tutorial granular, minimo de 8 passos, subcampos 1-7 por passo, testes e politicas negativas.
- `observed`: o guia tem 8 passos, todos os passos cumprem os subcampos obrigatorios e nao contem `real_dev`.
- `validacao executada`: inventario estrutural, scan de `real_dev`, scan de padroes proibidos, build web, suite API e validator documental.
- `bloqueia_mf`: `nao`.

### `ORELLE-MF6-BK06-P2-002`

- `severidade`: `P2`
- `bk_rnf`: `BK-MF6-06` / `RNF10`
- `estado`: `NAO_REPRODUZIDO_NA_REAUDITORIA`
- `expected`: BK `P0` com tutorial granular, minimo de 8 passos, subcampos 1-7 por passo, testes e politicas negativas.
- `observed`: o guia tem 8 passos, todos os passos cumprem os subcampos obrigatorios e nao contem `real_dev`.
- `validacao executada`: inventario estrutural, scan de `real_dev`, scan de padroes proibidos, build web, suite API e validator documental.
- `bloqueia_mf`: `nao`.

### `ORELLE-MF6-VAL-P2-003`

- `severidade`: `P2`
- `bk_rnf`: `MF6` / `RNF05-RNF11`
- `estado`: `CONFIRMADO`
- `expected`: gate documental automatico com `overall_pass=true` ou, em alternativa, erro limitado a fora-de-escopo.
- `observed`: `bash scripts/validate-planificacao.sh` terminou com `overall_pass=false`.
- `status global observado`: `coverage_pass=true`, `consistency_pass=true`, `guides_pass=false`, `naming_pass=true`, `overall_pass=false`.
- `evidencia MF6 observada`:
  - `BK-MF6-01`: `missing_pedagogic_or_operational_blocks`, `negative_policy_validacao_mismatch(expected=3,actual=missing)`.
  - `BK-MF6-02`: `missing_pedagogic_or_operational_blocks`, `missing_test_matrix_section`, `missing_test_layer_acceptance`, `negative_policy_step_mismatch(expected=3,actual=missing)`, `negative_policy_validacao_mismatch(expected=3,actual=missing)`, `negative_policy_criterio_mismatch(expected=3,actual=missing)`.
  - `BK-MF6-03`: `missing_pedagogic_or_operational_blocks`, `missing_test_matrix_section`, `missing_test_layer_acceptance`, `negative_policy_step_mismatch(expected=2,actual=missing)`, `negative_policy_validacao_mismatch(expected=2,actual=missing)`, `negative_policy_criterio_mismatch(expected=2,actual=missing)`.
  - `BK-MF6-04`: `missing_pedagogic_or_operational_blocks`, `negative_policy_validacao_mismatch(expected=2,actual=missing)`.
  - `BK-MF6-05`: `missing_pedagogic_or_operational_blocks`.
  - `BK-MF6-06`: `missing_pedagogic_or_operational_blocks`.
  - `BK-MF6-07`: `missing_pedagogic_or_operational_blocks`, `negative_policy_step_mismatch(expected=3,actual=missing)`, `negative_policy_validacao_mismatch(expected=3,actual=missing)`.
- `causa provavel`: `docs/planificacao/scripts/auditar_planificacao.py` ainda exige blocos legacy e anchors literais como `### Matriz minima de testes por prioridade` e `Evidencia de testes por camada`.
- `nota de contrato`: a prompt ativa exige estrutura `####` e proibe os blocos genericos `bloco pedagogico` / `bloco operacional` nos BKs. Corrigir o validador ou criar uma ponte formal deve ser uma tarefa separada.
- `impacto`: bloqueia o gate automatico, mas nao invalida por si so a leitura manual dos BKs MF6 nesta re-auditoria.
- `correcao recomendada`: alinhar `docs/planificacao/scripts/auditar_planificacao.py` com o contrato ativo dos BKs ou documentar explicitamente uma migracao de compatibilidade.
- `bloqueia_mf`: `sim` para fecho automatico; `nao` para estado manual dos BKs auditados.

### `ORELLE-MF6-APPS-P3-004`

- `severidade`: `P3`
- `bk_rnf`: `MF6` / superficie auxiliar `apps/web`
- `estado`: `CONFIRMADO_FORA_DE_ESCOPO`
- `expected`: superficies destinadas a aluno/utilizador final nao devem expor a raiz privada `real_dev`.
- `observed`: a pesquisa estatica encontrou `real_dev` em `apps/web/src/App.jsx`, incluindo texto visivel em `app-kicker`.
- `ficheiros`: `apps/web/src/App.jsx`
- `decisao desta execucao`: nao corrigido porque o modo e `auditar_apenas`; a prompt permite atualizar apenas o relatorio.
- `impacto`: risco baixo de apresentacao/terminologia, sem evidencia de quebra funcional ou seguranca runtime.
- `bloqueia_mf`: `nao` para BKs MF6; deve ser tratado em tarefa propria se a app for considerada superficie student-facing.

## Falsos positivos e leituras controladas

- Ocorrencias de `passwordHash`, `token`, `cookie`, `DATA_ENCRYPTION_KEY`, `storageKey`, `authTag` e `encrypted` em codigo/testes/BKs MF6 estao alinhadas com contratos de seguranca ou testes negativos.
- Ocorrencias de `diagnostico medico` aparecem como disclaimers e guardrails de seguranca, nao como promessa clinica.
- Ocorrencia de `localStorage/sessionStorage` em `apps/api/src/services/session.service.js` aparece como proibicao explicita para o frontend, nao como implementacao insegura.
- Ocorrencias de `treino externo`, `RAG`, `embeddings` ou `IA generativa` nos BKs MF6 nao foram encontradas como requisitos indevidos.
- Nao foi encontrada leakage `real_dev` nos BKs `docs/planificacao/guias-bk/MF6/BK-MF*.md`.

## Mapa de integracao da MF6

| BK | Responsabilidade | Contratos consumidos | Testes previstos/observados no guia | Dependencias principais |
| --- | --- | --- | --- | --- |
| `BK-MF6-01` | Performance basica no backend. | Express, middlewares, endpoints existentes, contratos de resposta. | Testes de tempo/resposta, negativos de carga/latencia, evidencia por camada. | MF0/MF1 API base. |
| `BK-MF6-02` | Carga moderada. | API, base de dados, limitacoes de recursos. | Testes de carga controlada e negativos. | MF6-01, contratos de API. |
| `BK-MF6-03` | Otimizacao e compressao de imagens. | Upload/media, formatos e limites. | Testes de imagem, tamanho, formatos invalidos e regressao visual. | MF3/MF5 media e privacidade. |
| `BK-MF6-04` | Mensagens de erro compreensiveis. | Error middleware, validadores, respostas publicas. | Testes de erro por camada, negativos e acceptance. | MF0 auth, validators e UI. |
| `BK-MF6-05` | Comunicacoes via HTTPS/TLS. | Proxy/app, cookies HttpOnly, `apiClient`, headers. | Middleware, frontend base URL, smoke/manual e negativos. | MF0 auth, MF6-06, MF6-07. |
| `BK-MF6-06` | Passwords com hash seguro bcrypt. | `User`, `auth.service.js`, `auth.validator.js`, `bcryptjs`. | Unit/integracao auth, resposta publica e negativos. | MF0 auth, MF6-05. |
| `BK-MF6-07` | Encriptacao de dados sensiveis em repouso. | Config/env, servicos de privacidade, base de dados. | Unit/integracao, round-trip e negativos de chave/dados. | MF5 privacidade, MF6-06. |

Nao ha evidencia nesta re-auditoria de endpoints, schemas, providers externos, webhooks, pagamentos ou regras de dominio inventadas nos BKs MF6.

## Coerencia MF5 -> MF6 -> MF7

- `MF5` entrega privacidade operacional, auditoria de dados biometricos e qualidade de UI.
- `MF6` reforca robustez: performance, carga, imagens, erros, HTTPS, bcrypt e encriptacao em repouso.
- `MF7` pode depender de `MF6` para consentimento, cookies HttpOnly, compatibilidade, exportacao e integracoes externas.

Coerencia funcional manual: `PASS_COM_RESSALVAS`.

Ressalvas:

- Gate automatico ainda vermelho por contrato legacy do validador.
- `apps/web/src/App.jsx` ainda expoe `real_dev` fora do escopo desta auditoria documental.

## Validacoes executadas

| Comando | Resultado | Nota |
| --- | --- | --- |
| `node -e "...inventario MF6..."` | `exit 0` | `BK-MF6-01`, `02`, `05`, `06`, `07` com 8 passos; `BK-MF6-03` com 6; `BK-MF6-04` com 7; todos sem missing sections e sem `real_dev`. |
| `node -e "...subcampos 1-7..."` | `exit 0` | Todos os passos MF6 tem itens obrigatorios 1-7. |
| `node -e "...comentarios em blocos de codigo..."` | `exit 0` | Blocos `js/jsx/ts/tsx` MF6 cumprem comentarios minimos por tamanho. |
| `rg -n "real_dev\|REAL_DEV" docs/planificacao/guias-bk/MF6/BK-MF*.md` | `exit 1`/OK controlado | Sem leakage `real_dev` nos BKs MF6. |
| Pesquisa estatica de termos proibidos em `docs/planificacao/guias-bk/MF6/*.md` | `exit 1` | Sem ocorrencias proibidas nos BKs MF6. |
| Pesquisa estatica de riscos em `apps/api/src`, `apps/api/tests`, `apps/web/src` e BKs MF6 | `exit 0` | Produziu falsos positivos esperados e confirmou `apps/web/src/App.jsx` com `real_dev`. |
| `git diff --check` | `exit 0` | Sem whitespace errors nos diffs rastreados no momento da auditoria. |
| `bash scripts/validate-planificacao.sh` | `exit 1` | `coverage_pass=true`, `consistency_pass=true`, `naming_pass=true`, `guides_pass=false`, `overall_pass=false`. |
| `npm --prefix apps/web run build` | `exit 0` | Vite build passou: 66 modules transformados. |
| `npm --prefix apps/api test` em sandbox | `exit 1` | Falhou por `listen EPERM: operation not permitted 0.0.0.0`; classificado como bloqueio ambiental. |
| `npm --prefix apps/api test` fora da sandbox | `exit 0` | 16 test files e 129 tests passaram. |

## Validacoes nao executadas

- Comandos em `real_dev/**`: nao executados; a auditoria e student-facing e o modo e `auditar_apenas`.
- E2E/browser manual: nao executado; nao houve alteracao de codigo runtime.
- Commit/push/PR: nao executados porque `PERMITIR_COMMITS=nao`.
- Correcao do validator ou dos BKs: nao executada porque esta re-auditoria e audit-only.

## Riscos restantes

1. `docs/planificacao/scripts/auditar_planificacao.py` continua desalinhado com a estrutura ativa exigida pela prompt.
2. `bash scripts/validate-planificacao.sh` continua vermelho enquanto `guides_pass=false`.
3. `apps/web/src/App.jsx` contem `real_dev` em superficie visivel, fora do escopo desta execucao.
4. Existem alteracoes locais pre-existentes em ficheiros MF5/MF6 e relatorios untracked que foram preservadas.
5. `git diff --check` nao cobre ficheiros untracked por si so; por isso o relatorio atual foi tratado como artefacto novo/atualizado e deve ser revisto em staging antes de commit futuro.

## Conclusao

Estado manual apos re-auditoria `auditar_apenas`:

- `OK`: `BK-MF6-01`, `BK-MF6-02`, `BK-MF6-03`, `BK-MF6-04`, `BK-MF6-05`, `BK-MF6-06`, `BK-MF6-07`
- `PARCIAL`: nenhum BK MF6 na leitura manual atual
- `CRITICO`: nenhum BK MF6 na leitura manual atual

Gate automatico:

- `coverage_pass`: `true`
- `consistency_pass`: `true`
- `guides_pass`: `false`
- `naming_pass`: `true`
- `overall_pass`: `false`

Proxima acao recomendada: abrir uma tarefa separada para alinhar o validador documental ao contrato ativo dos BKs ou decidir formalmente uma ponte temporaria para anchors legacy sem reintroduzir blocos proibidos nos guias.
