# BK-MF8-16 - Execução final de testes com evidências

## Header
- `doc_id`: `GUIA-BK-MF8-16`
- `bk_id`: `BK-MF8-16`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Daniel Bulica`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF8-14, BK-MF8-15`
- `rf_rnf`: `RNF28`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-17`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md`
- `last_updated`: `2026-06-30`

#### Objetivo

Neste BK vais executar a bateria final de testes da MF8, guardar evidências objetivas e deixar um handoff claro para o `BK-MF8-17`.

#### Importância

A defesa PAP precisa de prova, não apenas afirmação. Cada comando, diretoria, exit code, saída relevante, cenário negativo e limitação de ambiente deve ficar registado para que outra pessoa consiga repetir a validação.

#### Scope-in

- Executar a bateria final herdada do `BK-MF8-15`.
- Criar o ficheiro `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`.
- Criar um contrato de evidence para validar comandos, camadas, estados, negativos e `proof_e2e`.
- Criar um teste Vitest para o contrato de evidence do BK.
- Separar sucesso, falha real de produto e bloqueio por ambiente ou ferramenta.
- Preparar o `BK-MF8-17` apenas com erros, bloqueios e testes afetados.

#### Scope-out

- Não corrigir erros de produto neste BK.
- Não apagar evidência desfavorável.
- Não marcar teste como passado sem execução.
- Não inventar um runner E2E/browser se não existir comando aprovado.
- Não alterar requisitos, metadados, matriz, backlog ou BKs vizinhos.

#### Estado antes e depois

- Antes: o `BK-MF8-15` inventariou os testes, criou contratos de fecho e definiu lacunas controladas.
- Depois: a bateria final tem evidence por comando, estados normalizados e handoff objetivo para correção no `BK-MF8-17`.

#### Pre-requisitos

- Ter concluído o `BK-MF8-15`.
- Ter a matriz `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`.
- Ter revisto `apps/api/package.json` e `apps/web/package.json`.
- Ter ambiente local com dependências instaladas.
- Saber distinguir falha de produto, comando inexistente e bloqueio por ambiente.

#### Glossário

- Evidence: prova objetiva que mostra comando, diretoria, exit code, saída resumida, impacto e estado.
- Exit code: número devolvido pelo comando; `0` indica sucesso e valores diferentes de `0` indicam falha.
- Bateria final: conjunto de comandos e verificações que fecha a MF8 antes da estabilização final.
- `proof_e2e`: campo da evidence que prova E2E/browser real ou regista `TODO (BLOCKER)` quando não existe comando aprovado.
- Falha de produto: erro causado por código, contrato, teste ou configuração da aplicação.
- Bloqueio por ambiente ou ferramenta: falha causada por ausência de runner, browser, permissões ou serviço externo necessário.
- Handoff: informação mínima que o próximo BK precisa para continuar sem adivinhar o contexto.

#### Conceitos teóricos essenciais

- Evidence objetiva: é a prova técnica que liga um requisito a um comando executado. Vem da execução real da bateria final, vai para `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`, serve para a defesa PAP e evita dizer "passou" sem prova.
- Camada de teste: identifica se a prova é `unit`, `integration`, `smoke`, `build`, `planificacao`, `diff` ou `e2e`. Vem da matriz de testes do `BK-MF8-15`, vai para a evidence final e evita uma bateria desequilibrada que só valida uma parte da app.
- Estado normalizado: classifica cada comando como `passou`, `falhou_por_produto` ou `bloqueado_por_ambiente_ou_ferramenta`. Serve para o `BK-MF8-17` saber o que corrigir e evita esconder falhas reais.
- Exit code: é o número final do processo. Vem do terminal, vai para a linha de evidence e evita confundir output parcial com sucesso.
- Output resumido: é a parte do terminal suficiente para repetir o diagnóstico sem expor dados sensíveis. Serve para defesa e revisão técnica, e evita anexar logs enormes com tokens, cookies, paths internos, fotografias ou relatórios sensíveis.
- `proof_e2e`: é a prova de browser/E2E. Se não houver comando aprovado, fica como `TODO (BLOCKER)` com motivo concreto. Isto evita fingir que existe cobertura E2E quando o projeto ainda não tem runner browser.
- Handoff para correção: é a lista de falhas reais, bloqueios e testes afetados que segue para `BK-MF8-17`. Vem da evidence final e evita corrigir sintomas sem causa rastreável.
- Segurança e privacidade na evidence: outputs de testes não devem expor `passwordHash`, tokens, cookies, caminhos internos, fotografias, relatórios sensíveis, `storageKey`, `consentId` ou prompts internos. Esta regra protege dados pessoais e biométricos enquanto a equipa recolhe provas.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-16`
- `flow_id`: `FLOW-MF8-FINAL-TESTS`
- `requisitos`: `RNF28`
- `dependências`: `BK-MF8-14, BK-MF8-15`
- `tema técnico`: `bateria final de testes`
- `destino dos alunos`: `apps/api` e `apps/web`
- `decisão CANONICO`: o requisito e a prioridade vêm da matriz/backlog.
- `decisão CANONICO`: por ser `P0`, a matriz mínima de testes exige `unit + integration + e2e` e mínimo de `3` negativos.
- `decisão DERIVADO`: se o projeto não tiver comando E2E/browser aprovado, `proof_e2e` fica como `TODO (BLOCKER)` em vez de sucesso.

#### Ficheiros a criar/editar/rever

- CRIAR: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
- CRIAR: `apps/api/tests/evidence/bk-mf8-16.evidence-contract.js`
- CRIAR: `apps/api/tests/mf8.final-execution-contract.test.js`
- REVER: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
- REVER: `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`
- REVER: `apps/api/tests/mf8.final-contracts.test.js`
- REVER: `apps/web/scripts/check-mf8-final-smoke.mjs`
- REVER: `apps/api/package.json`
- REVER: `apps/web/package.json`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato, dependências e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que o `BK-MF8-16` executa apenas `RNF28`, consome o handoff do `BK-MF8-15` e entrega falhas triadas ao `BK-MF8-17`.

2. Ficheiros envolvidos:
    - REVER: `docs/RF.md`
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/BACKLOG-MVP.md`
    - REVER: `docs/planificacao/sprints/PLANO-SPRINTS.md`
    - LOCALIZAÇÃO: linhas de `RNF28`, `BK-MF8-16`, `P0` e matriz mínima de testes.

3. Instruções do que fazer.

Executa a pesquisa abaixo e confirma quatro pontos:

- `RNF28` existe e exige bateria final com evidências objetivas.
- `BK-MF8-16` depende de `BK-MF8-14` e `BK-MF8-15`.
- O próximo BK é `BK-MF8-17`.
- A prioridade `P0` exige `unit + integration + e2e` e mínimo de `3` negativos.

4. Código completo, correto e integrado com a app final.

```bash
rg -n "RNF28|BK-MF8-16|BK-MF8-17|unit \\+ integration \\+ e2e" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md docs/planificacao/sprints/PLANO-SPRINTS.md
```

5. Explicação do código.

Este comando não altera ficheiros. Ele cruza requisitos, matriz, backlog e plano de sprints para impedir que a bateria final seja definida por memória ou preferência pessoal.

A pesquisa também confirma que este BK é de execução e evidence. Correções de produto só entram no `BK-MF8-17`, porque esse BK é o requisito `RNF29`.

6. Validação do passo.

O output deve mostrar `RNF28`, a linha do `BK-MF8-16`, a linha do `BK-MF8-17` e a regra `P0`.

7. Cenário negativo/erro esperado.

Se `RNF28` ou `BK-MF8-16` não aparecerem, para e regista `TODO (BLOCKER)` em `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`.

### Passo 2 - Confirmar o handoff do BK-MF8-15

1. Objetivo funcional do passo no contexto da app.

Garantir que a execução final parte da matriz e dos comandos criados no `BK-MF8-15`.

2. Ficheiros envolvidos:
    - REVER: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
    - REVER: `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`
    - REVER: `apps/api/tests/mf8.final-contracts.test.js`
    - REVER: `apps/web/scripts/check-mf8-final-smoke.mjs`
    - CRIAR: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - LOCALIZAÇÃO: ficheiros completos e comandos registados na matriz do BK15.

3. Instruções do que fazer.

Confirma se os artefactos do `BK-MF8-15` existem. Se ainda não existirem no checkout da tua equipa, este BK não deve fingir sucesso: deves registar cada ausência como bloqueio herdado.

4. Código completo, correto e integrado com a app final.

```bash
test -f docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md
test -f apps/api/tests/evidence/bk-mf8-15.evidence-contract.js
test -f apps/api/tests/mf8.final-contracts.test.js
test -f apps/web/scripts/check-mf8-final-smoke.mjs
rg -n "proof_api|proof_web_build|proof_mf8_smoke|proof_e2e|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md
```

5. Explicação do código.

Os quatro comandos `test -f` confirmam se os ficheiros esperados pelo `BK-MF8-15` existem. O `rg` confirma se a matriz contém os campos de evidence que este BK vai executar.

Esta verificação evita criar uma bateria final paralela. O `BK-MF8-16` deve executar o que o `BK-MF8-15` preparou, não inventar novos critérios de fecho.

Quando a matriz anterior usar `proof_mf8_smoke`, regista essa prova na evidence final como `proof_smoke_bk15`. Assim fica claro que a prova veio do `BK-MF8-15`, mas foi executada e anexada no fecho do `BK-MF8-16`.

6. Validação do passo.

Todos os `test -f` devem terminar com exit code `0`. Se algum falhar, regista o caminho em falta na evidence final.

7. Cenário negativo/erro esperado.

Se `apps/web/scripts/check-mf8-final-smoke.mjs` não existir, a linha final `proof_smoke_bk15` fica `bloqueado_por_ambiente_ou_ferramenta` até o BK anterior ser aplicado.

### Passo 3 - Criar a evidence final da execução

1. Objetivo funcional do passo no contexto da app.

Criar o ficheiro onde ficam guardadas as provas finais da MF8.

2. Ficheiros envolvidos:
    - CRIAR: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
    - REVER: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` com o conteúdo abaixo. Depois substitui os campos `PREENCHER_APOS_EXECUCAO` pelos outputs reais da tua máquina.

4. Código completo, correto e integrado com a app final.

```md
# EXECUCAO-FINAL-TESTES - MF8 Orelle

## Header
- `doc_id`: `EXECUCAO-FINAL-TESTES-MF8`
- `bk_id`: `BK-MF8-16`
- `macro`: `MF8`
- `requisito`: `RNF28`
- `origem`: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
- `proximo_bk`: `BK-MF8-17`
- `estado_global`: `em_execucao`

## Contrato canónico

- `CANONICO`: `RNF28` exige bateria final de testes com evidências objetivas.
- `CANONICO`: por prioridade `P0`, a bateria deve cobrir `unit + integration + e2e` e mínimo de `3` negativos.
- `DERIVADO`: se não existir comando E2E/browser aprovado, `proof_e2e` fica `TODO (BLOCKER)` com motivo concreto.

## Estados permitidos

- `passou`: comando executado com exit code `0` e output guardado.
- `falhou_por_produto`: comando executado e falhou por código, contrato, teste ou configuração da app.
- `bloqueado_por_ambiente_ou_ferramenta`: comando não pode ser executado por falta de runner, browser, permissão, serviço externo ou artefacto herdado.

## Bateria final

| proof_id | BK/RNF | camada | comando | diretoria | exit_code | estado | output_resumido | privacy_check | impacto |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| `proof_contrato` | `BK-MF8-16 / RNF28` | `planificacao` | `rg -n "RNF28\|BK-MF8-16\|unit \\+ integration \\+ e2e" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/sprints/PLANO-SPRINTS.md` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova contrato canónico. |
| `proof_matriz` | `BK-MF8-15 / RNF27` | `planificacao` | `rg -n "proof_api\|proof_mf8_smoke\|proof_e2e\|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova handoff do BK15. |
| `proof_contrato_bk15` | `BK-MF8-15 / RNF27` | `unit` | `node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova sintaxe do contrato anterior. |
| `proof_teste_final_bk15` | `BK-MF8-15 / RNF27` | `unit` | `npm --prefix apps/api test -- mf8.final-contracts.test.js` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova matriz, contrato e negativos do BK15. |
| `proof_smoke_bk15` | `BK-MF8-15 / RNF27` | `smoke` | `node apps/web/scripts/check-mf8-final-smoke.mjs` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova artefactos mínimos de fecho. |
| `proof_contrato_bk16` | `BK-MF8-16 / RNF28` | `unit` | `node --check apps/api/tests/evidence/bk-mf8-16.evidence-contract.js` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova sintaxe do contrato deste BK. |
| `proof_teste_bk16` | `BK-MF8-16 / RNF28` | `unit` | `npm --prefix apps/api test -- mf8.final-execution-contract.test.js` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova caminho positivo e negativos deste BK. |
| `proof_api` | `MF0-MF8` | `integration` | `npm --prefix apps/api test` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem `passwordHash`, tokens, cookies, fotografias ou relatórios sensíveis no output anexado. | Prova backend/API. |
| `proof_web_build` | `MF0-MF8` | `build` | `npm --prefix apps/web run build` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova frontend compilável. |
| `proof_planificacao` | `MF8` | `planificacao` | `bash scripts/validate-planificacao.sh` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova consistência documental. |
| `proof_diff` | `MF8` | `diff` | `git diff --check` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova ausência de erros de whitespace. |
| `proof_e2e` | `MF8 / P0` | `e2e` | `TODO (BLOCKER)` | raiz | 1 | `bloqueado_por_ambiente_ou_ferramenta` | Sem comando E2E/browser aprovado em `apps/web/package.json`. | Sem dados sensíveis no output. | Bloqueio explícito se o professor exigir browser real. |
| `proof_privacidade` | `MF8 / RNF28` | `privacy` | `rg -n "passwordHash\|Authorization:\|Set-Cookie\|storageKey\|consentId\|/Users/\|/var/" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Exit code `1` esperado quando não há ocorrências sensíveis. | Prova que a evidence final não expõe dados sensíveis. |
| `proof_handoff` | `BK-MF8-17 / RNF29` | `handoff` | `rg -n "Falhas para BK-MF8-17\|Handoff para BK-MF8-17\|falhou_por_produto\|bloqueado_por_ambiente_ou_ferramenta\|proof_e2e" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` | raiz | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | Sem dados sensíveis no output. | Prova que o BK17 recebe falhas e bloqueios triados. |

## Cenários negativos obrigatórios

| negativo_id | esperado | resultado | estado |
| --- | --- | --- | --- |
| `neg_comando_inexistente` | Comando inexistente fica registado como `bloqueado_por_ambiente_ou_ferramenta`. | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO |
| `neg_falha_sem_output` | Falha sem output e repetida uma vez antes de ser classificada. | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO |
| `neg_e2e_sem_runner` | E2E sem comando aprovado fica `TODO (BLOCKER)`, nunca `passou`. | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO |

## Falhas para BK-MF8-17

| falha_id | proof_id | tipo | causa_provavel | ficheiros_afetados | teste_afetado | prioridade |
| --- | --- | --- | --- | --- | --- | --- |
| PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | `produto` ou `ambiente` | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO | PREENCHER_APOS_EXECUCAO |

## Handoff para BK-MF8-17

- Corrigir apenas falhas com estado `falhou_por_produto`.
- Manter bloqueios de ambiente como bloqueios, sem inventar correções de produto.
- Reexecutar apenas testes afetados e depois a prova global necessária.
- Não alterar requisitos para fazer um teste passar.
```

5. Explicação do código.

Este ficheiro é a evidence final da MF8. A tabela principal obriga a guardar comando, diretoria, camada, exit code, estado, output resumido, verificação de privacidade e impacto.

O campo `proof_e2e` não finge sucesso. Como o projeto pode ainda não ter runner browser aprovado, a linha fica com `TODO (BLOCKER)` até existir comando real. Isto respeita a matriz `P0` sem inventar ferramenta.

A secção de falhas prepara o `BK-MF8-17`. Só falhas de produto devem virar correção; bloqueios de ambiente continuam bloqueios.

6. Validação do passo.

Executa:

```bash
rg -n "proof_api|proof_web_build|proof_e2e|falhou_por_produto|bloqueado_por_ambiente_ou_ferramenta|Handoff para BK-MF8-17" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md
```

7. Cenário negativo/erro esperado.

Se `proof_e2e` estiver marcado como `passou` sem comando real aprovado, a evidence fica inválida.

### Passo 4 - Criar o contrato de evidence do BK

1. Objetivo funcional do passo no contexto da app.

Criar um contrato que valida se a evidence final tem todos os comandos, camadas, estados e negativos obrigatórios.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/evidence/bk-mf8-16.evidence-contract.js`
    - REVER: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Não removas `proof_e2e`: se não houver E2E real, o contrato aceita apenas o estado bloqueado com motivo explícito.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/evidence/bk-mf8-16.evidence-contract.js
const BK_ID = "BK-MF8-16";
const REQUIRED_REQUIREMENTS = ["RNF28"];
const MIN_NEGATIVOS = 3;

const REQUIRED_PROOFS = [
    "proof_contrato",
    "proof_matriz",
    "proof_contrato_bk15",
    "proof_teste_final_bk15",
    "proof_smoke_bk15",
    "proof_contrato_bk16",
    "proof_teste_bk16",
    "proof_api",
    "proof_web_build",
    "proof_planificacao",
    "proof_diff",
    "proof_e2e",
    "proof_privacidade",
    "proof_handoff",
];

const VALID_STATUSES = [
    "passou",
    "falhou_por_produto",
    "bloqueado_por_ambiente_ou_ferramenta",
];

const REQUIRED_LAYERS = ["unit", "integration", "smoke", "build", "planificacao", "diff", "e2e"];

const SENSITIVE_OUTPUT_PATTERNS = [
    "passwordHash",
    "Authorization:",
    "Set-Cookie",
    "storageKey",
    "consentId",
    "/Users/",
    "/var/",
];

/**
 * Valida a evidence final do BK-MF8-16.
 *
 * @param {{
 *   bkId: string,
 *   requisitos: string[],
 *   proofs: Array<{
 *     id: string,
 *     command: string,
 *     cwd: string,
 *     layer: string,
 *     exitCode: number,
 *     status: string,
 *     outputSummary: string,
 *     privacyCheck: string,
 *     impact: string
 *   }>,
 *   negativos: Array<{ id: string, expected: string, result: string, status: string }>,
 *   handoff: { nextBk: string, failures: string[], blockers: string[] }
 * }} evidence - Evidence recolhida durante a bateria final.
 * @returns {{ bkId: string, estado: string, dominio: string, proofs: number }} Resultado normalizado para PR/defesa.
 * @throws {Error} Quando a evidence não prova requisito, comandos, camadas, estados, negativos ou handoff.
 */
export function validarBKMF816Evidence(evidence) {
    const requisitos = Array.isArray(evidence?.requisitos) ? evidence.requisitos : [];
    const proofs = Array.isArray(evidence?.proofs) ? evidence.proofs : [];
    const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos : [];

    // O BK é validado contra requisitos explícitos para impedir evidence solta sem rastreabilidade RNF.
    if (evidence?.bkId !== BK_ID || !REQUIRED_REQUIREMENTS.every((req) => requisitos.includes(req))) {
        throw new Error("Evidence fora do contrato BK-MF8-16");
    }

    const proofById = new Map(proofs.map((proof) => [proof.id, proof]));
    const missingProof = REQUIRED_PROOFS.find((proofId) => !proofById.has(proofId));

    if (missingProof) {
        throw new Error(`Evidence final sem proof obrigatório: ${missingProof}`);
    }

    const layers = new Set(proofs.map((proof) => proof.layer));
    const missingLayer = REQUIRED_LAYERS.find((layer) => !layers.has(layer));

    if (missingLayer) {
        throw new Error(`Evidence final sem camada obrigatória: ${missingLayer}`);
    }

    for (const proof of proofs) {
        validateProof(proof);
    }

    if (negativos.length < MIN_NEGATIVOS) {
        throw new Error("Cenários negativos abaixo do mínimo exigido");
    }

    const e2eProof = proofById.get("proof_e2e");

    if (e2eProof.command === "TODO (BLOCKER)" && e2eProof.status !== "bloqueado_por_ambiente_ou_ferramenta") {
        throw new Error("proof_e2e sem comando real deve ficar bloqueado por ambiente ou ferramenta");
    }

    if (evidence?.handoff?.nextBk !== "BK-MF8-17") {
        throw new Error("Handoff final deve apontar para BK-MF8-17");
    }

    return {
        bkId: BK_ID,
        estado: "validado",
        dominio: "bateria final de testes",
        proofs: proofs.length,
    };
}

/**
 * Valida uma linha de proof da bateria final.
 *
 * @param {{
 *   id: string,
 *   command: string,
 *   cwd: string,
 *   layer: string,
 *   exitCode: number,
 *   status: string,
 *   outputSummary: string,
 *   privacyCheck: string,
 *   impact: string
 * }} proof - Linha de evidence de um comando executado ou bloqueado.
 * @returns {void}
 * @throws {Error} Quando a linha está incompleta, tem estado inválido ou expõe dados sensíveis.
 */
function validateProof(proof) {
    if (!proof.command || !proof.cwd || !proof.layer || !proof.outputSummary || !proof.privacyCheck || !proof.impact) {
        throw new Error(`Proof incompleto: ${proof.id}`);
    }

    if (!VALID_STATUSES.includes(proof.status)) {
        throw new Error(`Estado inválido no proof ${proof.id}: ${proof.status}`);
    }

    if (!Number.isInteger(proof.exitCode)) {
        throw new Error(`Exit code inválido no proof ${proof.id}`);
    }

    // O resumo de output não deve transportar segredos, paths internos ou identificadores sensíveis de biometria.
    const leakedPattern = SENSITIVE_OUTPUT_PATTERNS.find((pattern) => proof.outputSummary.includes(pattern));

    if (leakedPattern) {
        throw new Error(`Output sensível detetado no proof ${proof.id}: ${leakedPattern}`);
    }
}
```

5. Explicação do código.

O contrato valida `BK-MF8-16`, `RNF28`, todos os `proof_id` obrigatórios, as camadas mínimas, os três negativos, a verificação de privacidade e o handoff para `BK-MF8-17`.

`proof_e2e` tem uma regra própria: se o comando for `TODO (BLOCKER)`, o estado tem de ser `bloqueado_por_ambiente_ou_ferramenta`. Assim, o aluno não marca E2E como passado sem runner real.

`validateProof` impede linhas incompletas e também bloqueia padrões sensíveis no resumo do output. Esta regra evita anexar ao PR/defesa dados como `passwordHash`, headers de autorização, cookies, paths internos ou identificadores sensíveis.

A separação entre `proof_contrato_bk15`, `proof_teste_final_bk15`, `proof_smoke_bk15`, `proof_contrato_bk16` e `proof_teste_bk16` evita misturar provas herdadas com provas criadas neste BK.

6. Validação do passo.

Executa:

```bash
node --check apps/api/tests/evidence/bk-mf8-16.evidence-contract.js
```

7. Cenário negativo/erro esperado.

Se removeres `proof_e2e`, o contrato deve falhar com `Evidence final sem proof obrigatório: proof_e2e`.

### Passo 5 - Criar o teste do contrato de execução final

1. Objetivo funcional do passo no contexto da app.

Criar um teste Vitest que prova o caminho positivo e os negativos principais do contrato de evidence.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.final-execution-contract.test.js`
    - REVER: `apps/api/tests/evidence/bk-mf8-16.evidence-contract.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Mantém os negativos porque eles provam os erros que mais facilmente falseiam a execução final.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.final-execution-contract.test.js
import { describe, expect, it } from "vitest";
import { validarBKMF816Evidence } from "./evidence/bk-mf8-16.evidence-contract.js";

/**
 * Cria uma evidence válida para o BK-MF8-16.
 *
 * @returns {{
 *   bkId: string,
 *   requisitos: string[],
 *   proofs: Array<{
 *     id: string,
 *     command: string,
 *     cwd: string,
 *     layer: string,
 *     exitCode: number,
 *     status: string,
 *     outputSummary: string,
 *     privacyCheck: string,
 *     impact: string
 *   }>,
 *   negativos: Array<{ id: string, expected: string, result: string, status: string }>,
 *   handoff: { nextBk: string, failures: string[], blockers: string[] }
 * }} Evidence completa para validar o fecho da MF8.
 */
function createValidEvidence() {
    // A base comum garante estado, privacidade e impacto antes de cada proof alterar só o seu cenário.
    const baseProof = {
        cwd: "raiz",
        exitCode: 0,
        status: "passou",
        outputSummary: "Comando executado sem expor dados sensíveis.",
        privacyCheck: "Sem passwordHash, tokens, cookies, fotografias ou relatórios sensíveis.",
        impact: "Prova técnica guardada para PR/defesa.",
    };

    return {
        bkId: "BK-MF8-16",
        requisitos: ["RNF28"],
        proofs: [
            { ...baseProof, id: "proof_contrato", command: "rg -n RNF28 ...", layer: "planificacao" },
            { ...baseProof, id: "proof_matriz", command: "rg -n proof_api ...", layer: "planificacao" },
            { ...baseProof, id: "proof_contrato_bk15", command: "node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js", layer: "unit" },
            { ...baseProof, id: "proof_teste_final_bk15", command: "npm --prefix apps/api test -- mf8.final-contracts.test.js", layer: "unit" },
            { ...baseProof, id: "proof_smoke_bk15", command: "node apps/web/scripts/check-mf8-final-smoke.mjs", layer: "smoke" },
            { ...baseProof, id: "proof_contrato_bk16", command: "node --check apps/api/tests/evidence/bk-mf8-16.evidence-contract.js", layer: "unit" },
            { ...baseProof, id: "proof_teste_bk16", command: "npm --prefix apps/api test -- mf8.final-execution-contract.test.js", layer: "unit" },
            { ...baseProof, id: "proof_api", command: "npm --prefix apps/api test", layer: "integration" },
            { ...baseProof, id: "proof_web_build", command: "npm --prefix apps/web run build", layer: "build" },
            { ...baseProof, id: "proof_planificacao", command: "bash scripts/validate-planificacao.sh", layer: "planificacao" },
            { ...baseProof, id: "proof_diff", command: "git diff --check", layer: "diff" },
            {
                ...baseProof,
                id: "proof_e2e",
                command: "TODO (BLOCKER)",
                layer: "e2e",
                exitCode: 1,
                status: "bloqueado_por_ambiente_ou_ferramenta",
                outputSummary: "Sem comando E2E/browser aprovado em apps/web/package.json.",
                impact: "Bloqueio explícito para não fingir cobertura browser.",
            },
            {
                ...baseProof,
                id: "proof_privacidade",
                command: "rg -n padrões sensíveis docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md",
                layer: "privacy",
                outputSummary: "Sem padrões sensíveis na evidence final.",
                impact: "Prova que outputs anexados não expõem dados sensíveis.",
            },
            {
                ...baseProof,
                id: "proof_handoff",
                command: "rg -n Falhas/Handoff docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md",
                layer: "handoff",
                impact: "Prova que o BK-MF8-17 recebe falhas e bloqueios triados.",
            },
        ],
        negativos: [
            {
                id: "neg_comando_inexistente",
                expected: "Comando inexistente fica bloqueado.",
                result: "Estado bloqueado registado.",
                status: "passou",
            },
            {
                id: "neg_falha_sem_output",
                expected: "Falha sem output e repetida uma vez.",
                result: "Repetição documentada.",
                status: "passou",
            },
            {
                id: "neg_e2e_sem_runner",
                expected: "E2E sem runner fica TODO (BLOCKER).",
                result: "Bloqueio documentado.",
                status: "passou",
            },
        ],
        handoff: {
            nextBk: "BK-MF8-17",
            failures: [],
            blockers: ["proof_e2e"],
        },
    };
}

describe("BK-MF8-16 / RNF28 - execução final com evidências", () => {
    it("valida evidence final completa com E2E bloqueado de forma honesta", () => {
        const result = validarBKMF816Evidence(createValidEvidence());

        expect(result).toEqual({
            bkId: "BK-MF8-16",
            estado: "validado",
            dominio: "bateria final de testes",
            proofs: 14,
        });
    });

    it("falha quando falta proof_e2e", () => {
        const evidence = createValidEvidence();
        evidence.proofs = evidence.proofs.filter((proof) => proof.id !== "proof_e2e");

        expect(() => validarBKMF816Evidence(evidence)).toThrow("proof_e2e");
    });

    it("falha quando proof_e2e sem comando real fica marcado como sucesso", () => {
        const evidence = createValidEvidence();
        const e2eProof = evidence.proofs.find((proof) => proof.id === "proof_e2e");
        // Este negativo impede transformar um bloqueio E2E em sucesso sem comando browser real.
        e2eProof.status = "passou";

        expect(() => validarBKMF816Evidence(evidence)).toThrow("proof_e2e sem comando real");
    });

    it("falha quando o output resumido expõe dados sensíveis", () => {
        const evidence = createValidEvidence();
        const apiProof = evidence.proofs.find((proof) => proof.id === "proof_api");
        // Este negativo protege a evidence contra resumos que revelem dados sensíveis.
        apiProof.outputSummary = "Falha devolveu passwordHash no output.";

        expect(() => validarBKMF816Evidence(evidence)).toThrow("Output sensível");
    });
});
```

5. Explicação do código.

O teste cria uma evidence válida e confirma que o contrato aceita a bateria final quando todos os proofs existem. Depois testa três erros importantes: ausência de `proof_e2e`, E2E bloqueado marcado como sucesso e output com dado sensível.

Os spreads de `baseProof` reduzem repetição sem esconder campos obrigatórios. Cada linha continua explícita: tem comando, camada, estado, output, privacidade e impacto.

Os proofs `proof_privacidade` e `proof_handoff` fecham a ligação entre execução técnica, proteção de dados e continuidade para o `BK-MF8-17`.

Este teste prepara o `BK-MF8-17` porque impede handoff incompleto. Se a evidence final não listar falhas ou bloqueios corretamente, a correção seguinte começa com informação errada.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.final-execution-contract.test.js
```

7. Cenário negativo/erro esperado.

Se o teste "falha quando proof_e2e sem comando real fica marcado como sucesso" passar indevidamente, o contrato ainda permite evidence falsa e deve ser corrigido antes de avançar.

### Passo 6 - Executar a bateria final e preencher a evidence

1. Objetivo funcional do passo no contexto da app.

Executar os comandos finais e preencher `EXECUCAO-FINAL-TESTES.md` com resultados reais.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - ATUALIZAR: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
    - LOCALIZAÇÃO: tabela `Bateria final`.

3. Instruções do que fazer.

Executa os comandos abaixo a partir da raiz do projeto. Para cada comando, copia para a evidence: diretoria, exit code, estado, output resumido, impacto e nota de privacidade.

Executar cenários negativos obrigatórios (mínimo 3): comando inexistente, falha sem output e E2E sem runner aprovado.

4. Código completo, correto e integrado com a app final.

```bash
# Primeiro confirma contratos e handoff herdado; depois valida artefactos BK15/BK16 e gates globais sem inventar E2E.
rg -n "RNF28|BK-MF8-16|unit \\+ integration \\+ e2e" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/sprints/PLANO-SPRINTS.md
rg -n "proof_api|proof_mf8_smoke|proof_e2e|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md
node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js
npm --prefix apps/api test -- mf8.final-contracts.test.js
node --check apps/web/scripts/check-mf8-final-smoke.mjs
node apps/web/scripts/check-mf8-final-smoke.mjs
# Estes dois comandos provam os artefactos novos do BK16 antes da suite global.
node --check apps/api/tests/evidence/bk-mf8-16.evidence-contract.js
npm --prefix apps/api test -- mf8.final-execution-contract.test.js
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check
```

5. Explicação do código.

Os dois primeiros comandos provam contrato e handoff. Os quatro seguintes validam os artefactos preparados no `BK-MF8-15`. Depois validas o contrato e o teste deste BK. No fim, corres suite API, build web, validador documental e diff.

Se não existir comando E2E/browser em `apps/web/package.json`, não acrescentes um comando inventado. Mantém `proof_e2e` como `TODO (BLOCKER)` com estado `bloqueado_por_ambiente_ou_ferramenta`.

Esta bateria cobre o mínimo esperado para um BK `P0`: unit, integration, smoke/build, planificação, diff, negativos e registo honesto de E2E.

6. Validação do passo.

`docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` deve ter `exit_code`, `estado` e `output_resumido` preenchidos para todos os proofs.

7. Cenário negativo/erro esperado.

Se `npm --prefix apps/api test` falhar por bug real, classifica a linha como `falhou_por_produto` e adiciona a falha à tabela `Falhas para BK-MF8-17`.

### Passo 7 - Preparar handoff para BK-MF8-17

1. Objetivo funcional do passo no contexto da app.

Transformar a evidence final numa lista objetiva de correções ou bloqueios para o próximo BK.

2. Ficheiros envolvidos:
    - ATUALIZAR: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-17-correcao-dos-erros-encontrados-e-reexecucao-dos-testes-afetados.md`
    - LOCALIZAÇÃO: secções `Falhas para BK-MF8-17` e `Handoff para BK-MF8-17`.

3. Instruções do que fazer.

Preenche a tabela de falhas. Usa estas regras:

- `falhou_por_produto`: segue para correção no `BK-MF8-17`.
- `bloqueado_por_ambiente_ou_ferramenta`: segue como bloqueio, sem alterar código para mascarar ambiente.
- `passou`: não precisa de correção.

4. Código completo, correto e integrado com a app final.

```bash
rg -n "falhou_por_produto|bloqueado_por_ambiente_ou_ferramenta|BK-MF8-17|proof_e2e" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md
```

5. Explicação do código.

Este comando confirma se a evidence final tem estados suficientes para orientar o `BK-MF8-17`. O próximo BK não deve reler tudo às cegas; deve partir da lista de falhas e bloqueios que criaste.

O handoff também protege o scope: o `BK-MF8-17` corrige erros encontrados, mas não muda requisitos nem inventa funcionalidades novas.

6. Validação do passo.

O output deve mostrar pelo menos a linha de `proof_e2e`, a secção de handoff e todas as falhas com estado diferente de `passou`.

7. Cenário negativo/erro esperado.

Se uma falha tiver estado `falhou_por_produto` mas não tiver ficheiro ou teste afetado, o handoff fica incompleto e o `BK-MF8-17` não deve avançar sem triagem.

#### Expected results

- `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` existe com bateria final, estados e handoff.
- `apps/api/tests/evidence/bk-mf8-16.evidence-contract.js` valida comandos, camadas, estados, negativos, privacidade e handoff.
- `apps/api/tests/mf8.final-execution-contract.test.js` valida caminho positivo e negativos de evidence falsa.
- `proof_e2e` tem comando real aprovado ou `TODO (BLOCKER)` explícito.
- O `BK-MF8-17` recebe falhas reais e bloqueios separados.
- Outputs anexados não expõem passwords, tokens, cookies, paths internos, fotografias, relatórios sensíveis, `storageKey`, `consentId` ou prompts internos.

#### Critérios de aceite

- Entrega funcional específica de `Execução final de testes com evidências` validada contra `RNF28`.
- Evidence final criada com comando, diretoria, camada, exit code, estado, output resumido, privacy check e impacto.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidência de testes por camada: `unit`, `integration`, `smoke`, `build`, `planificacao`, `diff` e `e2e` com comando real ou `TODO (BLOCKER)`.
- Evidence de testes por camada conforme prioridade (`P0`).

### Matriz mínima de testes por prioridade

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.
- Handoff para `BK-MF8-17` distingue `passou`, `falhou_por_produto` e `bloqueado_por_ambiente_ou_ferramenta`.

#### Validação final

- [ ] `rg -n "RNF28|BK-MF8-16|unit \\+ integration \\+ e2e" ...` confirma contrato.
- [ ] `rg -n "proof_api|proof_mf8_smoke|proof_e2e|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` passa.
- [ ] `node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js` passa.
- [ ] `npm --prefix apps/api test -- mf8.final-contracts.test.js` passa.
- [ ] `node --check apps/web/scripts/check-mf8-final-smoke.mjs` passa.
- [ ] `node apps/web/scripts/check-mf8-final-smoke.mjs` passa.
- [ ] `node --check apps/api/tests/evidence/bk-mf8-16.evidence-contract.js` passa.
- [ ] `npm --prefix apps/api test -- mf8.final-execution-contract.test.js` passa.
- [ ] `npm --prefix apps/api test` passa ou falha com output registado.
- [ ] `npm --prefix apps/web run build` passa ou falha com output registado.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] `git diff --check` passa.
- [ ] `proof_e2e` tem comando real aprovado ou `TODO (BLOCKER)` explícito.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Segurança/privacidade: outputs anexados não expõem dados sensíveis.
- [ ] Handoff: `BK-MF8-17` recebe falhas e bloqueios com teste afetado.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `proof_contrato`: output do `rg` de `RNF28`, `BK-MF8-16` e matriz `P0`.
- `proof_matriz`: output do `rg` na matriz `TESTES-ATUAIS-E-LACUNAS.md`.
- `proof_contrato_bk15`: output de `node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`.
- `proof_teste_final_bk15`: output de `npm --prefix apps/api test -- mf8.final-contracts.test.js`.
- `proof_smoke_bk15`: output de `node apps/web/scripts/check-mf8-final-smoke.mjs`.
- `proof_contrato_bk16`: output de `node --check apps/api/tests/evidence/bk-mf8-16.evidence-contract.js`.
- `proof_teste_bk16`: output de `npm --prefix apps/api test -- mf8.final-execution-contract.test.js`.
- `proof_api`: output de `npm --prefix apps/api test`.
- `proof_web_build`: output de `npm --prefix apps/web run build`.
- `proof_planificacao`: output de `bash scripts/validate-planificacao.sh`.
- `proof_diff`: output de `git diff --check`.
- `proof_e2e`: comando E2E real aprovado ou `TODO (BLOCKER)` com motivo.
- `proof_privacidade`: nota a confirmar que os outputs anexados não expõem dados sensíveis.
- `proof_handoff`: lista de falhas e bloqueios que seguem para `BK-MF8-17`.

#### Handoff

Para o `BK-MF8-17`, entrega:

1. `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` preenchido;
2. lista de proofs com estado `falhou_por_produto`;
3. lista de bloqueios com estado `bloqueado_por_ambiente_ou_ferramenta`;
4. teste afetado por cada falha real;
5. nota de `proof_e2e`, com comando real ou `TODO (BLOCKER)`;
6. confirmação de que falhas de ambiente não foram tratadas como correções de produto.

O `BK-MF8-17` deve corrigir apenas causas raiz confirmadas, reexecutar testes afetados e manter bloqueios ambientais separados.

#### Changelog

| Data | Alteração |
| --- | --- |
| 2026-07-03 | Corrigido para materializar evidence final, comandos da bateria, contrato forte de evidence, teste Vitest do contrato, tratamento honesto de `proof_e2e` e handoff operacional para `BK-MF8-17`. |
| 2026-06-30 | Guia revisto para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito. |
