# BK-MF8-17 - Correção dos erros encontrados e reexecução dos testes afetados

## Header
- `doc_id`: `GUIA-BK-MF8-17`
- `bk_id`: `BK-MF8-17`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-16`
- `rf_rnf`: `RNF29`
- `fase_documental`: `Fase 3`
- `sprint`: `S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `-`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-17-correcao-dos-erros-encontrados-e-reexecucao-dos-testes-afetados.md`
- `last_updated`: `2026-07-03`

#### Objetivo

Neste BK vais corrigir os erros encontrados na bateria final do `BK-MF8-16`, reexecutar apenas os testes afetados e fechar a MF8 com evidence clara, segura e repetível.

#### Importância

`RNF29` é o último gate técnico da MF8. A defesa PAP só fica sólida quando cada falha final tem causa raiz, alteração controlada, teste afetado, reexecução, estado final e prova de que dados sensíveis não foram expostos.

#### Scope-in

- Ler o handoff do `BK-MF8-16` em `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`.
- Criar `docs/evidence/MF8/CORRECOES-FINAIS.md` com erros, bloqueios, comandos antes/depois e fecho da MF8.
- Corrigir apenas falhas com estado `falhou_por_produto`.
- Manter bloqueios de ambiente ou ferramenta separados da correção de produto.
- Criar contrato de evidence para `BK-MF8-17`.
- Criar teste Vitest do contrato de evidence.
- Reexecutar testes afetados e gates finais reais.

#### Scope-out

- Não fazer refactor global.
- Não alterar requisitos para fazer testes passar.
- Não inventar runner E2E, browser smoke, gateway externo, provider de IA ou webhook não documentado.
- Não tratar falhas de ambiente como correções de produto.
- Não anexar outputs com passwords, tokens, cookies, paths internos, fotografias, relatórios sensíveis ou dados pessoais.
- Não editar documentos canónicos, matriz, backlog, RF/RNF ou BKs fora de `BK-MF8-17`.

#### Estado antes e depois

- Antes: o `BK-MF8-16` deixou a bateria final com provas, falhas reais e bloqueios separados.
- Depois: cada falha de produto tem correção e reexecução afetada; cada bloqueio continua explicitamente bloqueado; a MF8 fica pronta para defesa ou fica fechada com blocker objetivo.

#### Pre-requisitos

- Ter concluído o `BK-MF8-16`.
- Ter `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` preenchido ou marcado com blockers explícitos.
- Ter revisto `apps/api/package.json` e `apps/web/package.json`.
- Ter permissões de trabalho para editar apenas os ficheiros afetados pelas falhas confirmadas.
- Saber distinguir `passou`, `falhou_por_produto`, `bloqueado_por_ambiente_ou_ferramenta` e `bloqueado_por_contrato`.

#### Glossário

- Causa raiz: origem real da falha, não apenas o sintoma observado no terminal.
- Teste afetado: teste mínimo que falhou antes da correção ou que prova diretamente a correção.
- Reexecução afetada: execução do teste afetado depois da correção.
- Bloqueio ambiental: impedimento causado por runner, browser, serviço, permissão ou ferramenta ausente.
- Evidence segura: prova técnica sem dados sensíveis, paths internos ou payloads privados.
- Fecho terminal: encerramento da MF8 sem handoff para outro BK, porque `BK-MF8-17` é o último BK da macrofase.

#### Conceitos teóricos essenciais

- Correção de causa raiz: começa na falha observada, identifica o contrato quebrado e altera o ficheiro certo. Serve para evitar alterações superficiais que escondem regressões.
- Reexecução afetada: valida o teste mínimo ligado ao erro corrigido. Vem do handoff do `BK-MF8-16`, vai para `CORRECOES-FINAIS.md` e evita correr apenas comandos genéricos sem provar a falha real.
- Estado normalizado: separa `corrigido_revalidado`, `bloqueado_por_ambiente_ou_ferramenta`, `bloqueado_por_contrato` e `sem_falhas_de_produto`. Isto impede misturar sucesso, bug real e bloqueio.
- Segurança na evidence: logs e outputs podem conter dados privados. Antes de colar evidence, confirma que não há `passwordHash`, tokens, cookies, paths internos, fotografias, relatórios sensíveis, `storageKey`, `consentId` ou dados pessoais.
- Teste de contrato: valida se a evidence final tem campos obrigatórios. Não substitui testes da feature, mas evita entregar um relatório incompleto.
- Fecho da MF8: como `proximo_bk` é `-`, o objetivo não é preparar outro BK; é deixar a defesa com provas, riscos e blockers explícitos.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-17`
- `flow_id`: `FLOW-MF8-FINAL-FIXES`
- `requisitos`: `RNF29`
- `dependências`: `BK-MF8-16`
- `tema técnico`: `correção final, reexecução afetada e fecho da MF8`
- `destino dos alunos`: `apps/api`, `apps/web` e `docs/evidence/MF8`
- `decisão CANONICO`: o requisito, a prioridade `P0`, a dependência `BK-MF8-16` e o facto de ser BK terminal vêm da matriz/backlog.
- `decisão CANONICO`: por ser `P0`, a matriz mínima de testes exige `unit + integration + e2e` e mínimo de `3` negativos.
- `decisão DERIVADO`: se não existir comando E2E/browser aprovado, `proof_e2e` permanece bloqueado com motivo explícito em vez de sucesso inventado.
- `decisão DERIVADO`: `docs/evidence/MF8/CORRECOES-FINAIS.md` é o artefacto final que torna `RNF29` auditável sem introduzir uma dependência nova.

#### Ficheiros a criar/editar/rever

- REVER: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
- CRIAR: `docs/evidence/MF8/CORRECOES-FINAIS.md`
- CRIAR: `apps/api/tests/evidence/bk-mf8-17.evidence-contract.js`
- CRIAR: `apps/api/tests/mf8.final-fixes-contract.test.js`
- REVER: `apps/api/package.json`
- REVER: `apps/web/package.json`
- EDITAR: ficheiros afetados por falhas confirmadas com estado `falhou_por_produto`
- CRIAR/EDITAR: teste afetado correspondente a cada falha corrigida

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato, dependência e fecho terminal

1. Objetivo funcional do passo no contexto da app.

Confirmar que este BK corrige apenas `RNF29`, consome o handoff do `BK-MF8-16` e fecha a MF8 sem inventar uma macrofase seguinte.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/backlogs/BACKLOG-MVP.md`
    - REVER: `docs/planificacao/backlogs/MF-VIEWS.md`
    - REVER: `docs/planificacao/sprints/PLANO-SPRINTS.md`
    - LOCALIZAÇÃO: linhas de `RNF29`, `BK-MF8-17`, `BK-MF8-16`, `P0` e matriz mínima de testes.

3. Instruções do que fazer.

Executa a pesquisa abaixo e confirma quatro pontos:

- `RNF29` exige corrigir e revalidar erros encontrados nos testes finais.
- `BK-MF8-17` depende de `BK-MF8-16`.
- `proximo_bk` é `-`, por isso este BK fecha a MF8.
- A prioridade `P0` exige `unit + integration + e2e` e mínimo de `3` negativos.

4. Código completo, correto e integrado com a app final.

```bash
# Esta pesquisa cruza requisito, matriz, backlog e sprint para impedir que o fecho final dependa de memória.
rg -n "RNF29|BK-MF8-17|BK-MF8-16|unit \\+ integration \\+ e2e" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md docs/planificacao/backlogs/MF-VIEWS.md docs/planificacao/sprints/PLANO-SPRINTS.md
```

5. Explicação do código.

Este comando não altera ficheiros. Ele confirma a fonte canónica do BK e evita três erros comuns: corrigir uma falha fora de scope, criar um handoff para um BK inexistente ou fingir cobertura E2E quando não há comando aprovado.

O output também deve mostrar que `BK-MF8-17` é o fecho da macrofase. Por isso, a evidence final fala em defesa e riscos restantes, não em preparação de outro BK.

6. Validação do passo.

O output deve mostrar `RNF29`, `BK-MF8-17`, `BK-MF8-16` e a regra `P0`.

7. Cenário negativo/erro esperado.

Se `RNF29` não aparecer, para e regista `TODO (BLOCKER)` em `docs/evidence/MF8/CORRECOES-FINAIS.md`, porque não podes corrigir um requisito sem contrato canónico.

### Passo 2 - Ler o handoff do BK-MF8-16

1. Objetivo funcional do passo no contexto da app.

Transformar a execução final do `BK-MF8-16` numa lista objetiva de falhas de produto, bloqueios e testes afetados.

2. Ficheiros envolvidos:
    - REVER: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
    - CRIAR: `docs/evidence/MF8/CORRECOES-FINAIS.md`
    - LOCALIZAÇÃO: secções `Falhas para BK-MF8-17`, `Handoff para BK-MF8-17`, `proof_e2e` e linhas com estados diferentes de `passou`.

3. Instruções do que fazer.

Confirma se `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` existe. Se existir, lista:

- cada linha com estado `falhou_por_produto`;
- cada linha com estado `bloqueado_por_ambiente_ou_ferramenta`;
- cada linha com estado `bloqueado_por_contrato`;
- o teste afetado de cada falha real;
- o estado de `proof_e2e`.

4. Código completo, correto e integrado com a app final.

```bash
# O primeiro comando falha de propósito quando o handoff ainda não existe; isso é blocker, não sucesso.
test -f docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md

# Esta pesquisa mostra apenas estados que interessam ao fecho: falhas reais, bloqueios e E2E.
rg -n "Falhas para BK-MF8-17|Handoff para BK-MF8-17|falhou_por_produto|bloqueado_por_ambiente_ou_ferramenta|bloqueado_por_contrato|proof_e2e" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md
```

5. Explicação do código.

`test -f` confirma que o BK anterior entregou o artefacto que este BK consome. Se falhar, não deves inventar uma lista de erros.

O `rg` procura os estados que decidem o trabalho deste BK. Só `falhou_por_produto` vira correção de código. Bloqueios ambientais e bloqueios de contrato ficam documentados como bloqueios.

6. Validação do passo.

A tua lista de trabalho deve ter três grupos: falhas de produto, bloqueios e `proof_e2e`.

7. Cenário negativo/erro esperado.

Se uma falha tiver estado `falhou_por_produto` mas não tiver teste afetado, regista blocker de triagem antes de alterar código.

### Passo 3 - Criar o registo final de correções

1. Objetivo funcional do passo no contexto da app.

Criar o ficheiro que prova a correção, a reexecução afetada e os blockers restantes da MF8.

2. Ficheiros envolvidos:
    - CRIAR: `docs/evidence/MF8/CORRECOES-FINAIS.md`
    - REVER: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Preenche uma linha por falha ou bloqueio. Se a bateria final não tiver falhas de produto, usa o estado `sem_falhas_de_produto` e mantém a prova dos comandos finais.

4. Código completo, correto e integrado com a app final.

```md
<!-- docs/evidence/MF8/CORRECOES-FINAIS.md -->
# MF8 - Correções finais e reexecução dos testes afetados

## Header
- `bk_id`: `BK-MF8-17`
- `requisito`: `RNF29`
- `source_evidence`: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
- `estado_final`: `PREENCHER_COM_corrigido_revalidado_ou_bloqueado_ou_sem_falhas_de_produto`

## Falhas de produto corrigidas

<!-- Cada erro precisa de causa, ficheiro, teste afetado e prova antes/depois para evitar correções de sintoma. -->
| error_id | source_proof | causa_raiz | ficheiros_editados | teste_afetado | comando_antes | exit_antes | comando_depois | exit_depois | estado |
| --- | --- | --- | --- | --- | --- | ---: | --- | ---: | --- |
| `ERR-MF8-17-001` | `proof_api` | `PREENCHER_COM_CAUSA_RAIZ` | `apps/...` | `PREENCHER_COM_TESTE` | `PREENCHER_COM_COMANDO` | 1 | `PREENCHER_COM_COMANDO` | 0 | `corrigido_revalidado` |

## Bloqueios preservados

<!-- Bloqueios não são bugs corrigidos; ficam explícitos para a defesa e não podem ser marcados como sucesso. -->
| blocker_id | source_proof | tipo | motivo | impacto | proxima_acao |
| --- | --- | --- | --- | --- | --- |
| `BLK-MF8-17-E2E` | `proof_e2e` | `bloqueado_por_ambiente_ou_ferramenta` | `Sem comando E2E/browser aprovado em apps/web/package.json.` | `Cobertura P0 sem browser real.` | `Aprovar runner E2E ou aceitar blocker na defesa.` |

## Provas de reexecução

| proof_id | comando | diretoria | exit_code | output_resumido | privacy_check |
| --- | --- | --- | ---: | --- | --- |
| `proof_reexecucao_afetada` | `PREENCHER_COM_COMANDO_DO_TESTE_AFETADO` | `raiz` | 0 | `PREENCHER_COM_OUTPUT_CURTO` | `sem dados sensíveis` |
| `proof_api` | `npm --prefix apps/api test` | `raiz` | 0 | `PREENCHER_COM_OUTPUT_CURTO` | `sem dados sensíveis` |
| `proof_web_build` | `npm --prefix apps/web run build` | `raiz` | 0 | `PREENCHER_COM_OUTPUT_CURTO` | `sem dados sensíveis` |
| `proof_planificacao` | `bash scripts/validate-planificacao.sh` | `raiz` | 0 | `PREENCHER_COM_OUTPUT_CURTO` | `sem dados sensíveis` |
| `proof_diff` | `git diff --check` | `raiz` | 0 | `sem output` | `sem dados sensíveis` |
| `proof_e2e` | `TODO (BLOCKER)` | `raiz` | 1 | `Sem comando E2E/browser aprovado.` | `sem dados sensíveis` |

## Negativos finais

- `neg_erro_sem_teste_afetado`: uma falha sem teste afetado bloqueia a correção.
- `neg_bloqueio_ambiental`: uma falha de runner/browser não pode ser marcada como correção de produto.
- `neg_output_sensivel`: outputs com passwords, tokens, cookies, paths internos, fotografias ou relatórios sensíveis são rejeitados.

## Fecho da MF8

- `proof_fecho_mf8`: `BK-MF8-17` é terminal (`proximo_bk = "-"`).
- `decisao_final`: `PREENCHER_COM_FECHO_OU_BLOCKER`.
- `riscos_restantes`: `PREENCHER_COM_RISCOS_RESTANTES`.
```

5. Explicação do código.

Este ficheiro é documentação técnica em Markdown. Ele não muda a aplicação, mas muda a qualidade da entrega: cada erro deixa de ser uma frase vaga e passa a ter origem, causa, ficheiros, teste afetado e prova antes/depois.

A secção de bloqueios impede mascarar problemas de ambiente. Se `proof_e2e` não tem comando real, fica como `TODO (BLOCKER)` e não como `passou`.

6. Validação do passo.

Executa:

```bash
rg -n "BK-MF8-17|RNF29|Falhas de produto corrigidas|Bloqueios preservados|proof_reexecucao_afetada|proof_fecho_mf8" docs/evidence/MF8/CORRECOES-FINAIS.md
```

7. Cenário negativo/erro esperado.

Se `CORRECOES-FINAIS.md` tiver uma linha `corrigido_revalidado` com `exit_depois` diferente de `0`, a correção ainda não está validada.

### Passo 4 - Criar contrato de evidence do BK

1. Objetivo funcional do passo no contexto da app.

Criar uma função que valida se a evidence final prova `RNF29` com erros, reexecução, blockers, privacidade e fecho terminal.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/evidence/bk-mf8-17.evidence-contract.js`
    - REVER: `docs/evidence/MF8/CORRECOES-FINAIS.md`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Não retires `proof_e2e`: se não houver E2E aprovado, o contrato aceita apenas blocker explícito.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/evidence/bk-mf8-17.evidence-contract.js
const BK_ID = "BK-MF8-17";
const REQUIREMENT = "RNF29";
const SOURCE_EVIDENCE = "docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md";
const FINAL_FIXES_EVIDENCE = "docs/evidence/MF8/CORRECOES-FINAIS.md";

const FINAL_STATUSES = [
    "corrigido_revalidado",
    "bloqueado_por_ambiente_ou_ferramenta",
    "bloqueado_por_contrato",
    "sem_falhas_de_produto",
];

const REQUIRED_PROOFS = [
    "proof_relatorio_final",
    "proof_matriz_falhas",
    "proof_correcao_final",
    "proof_reexecucao_afetada",
    "proof_api",
    "proof_web_build",
    "proof_planificacao",
    "proof_diff",
    "proof_e2e",
    "proof_privacidade",
    "proof_fecho_mf8",
];

const SENSITIVE_OUTPUT_PATTERNS = [
    /passwordHash/i,
    /Set-Cookie/i,
    /Authorization/i,
    /Bearer\s+[A-Za-z0-9._-]+/i,
    /storageKey/i,
    /consentId/i,
    /\/Users\//i,
    /\/var\//i,
];

/**
 * Confirma que um valor textual não expõe dados sensíveis na evidence.
 *
 * @param {string} value - Texto resumido de output, causa, impacto ou prova.
 * @param {string} fieldName - Nome do campo validado para mensagens de erro úteis.
 * @throws {Error} Quando o texto contém um padrão sensível.
 */
function assertSafeText(value, fieldName) {
    const text = String(value ?? "");

    // A evidence é pública em PR/defesa, por isso não pode transportar segredos nem paths internos.
    for (const pattern of SENSITIVE_OUTPUT_PATTERNS) {
        if (pattern.test(text)) {
            throw new Error(`Evidence sensível em ${fieldName}`);
        }
    }
}

/**
 * Valida que uma correção real tem causa, ficheiros, teste afetado e reexecução.
 *
 * @param {object} correction - Correção recolhida a partir das falhas finais.
 * @throws {Error} Quando a correção não prova `RNF29`.
 */
function assertCorrection(correction) {
    if (!correction?.errorId || !correction?.sourceProof || !correction?.rootCause) {
        throw new Error("Correção sem erro, prova de origem ou causa raiz");
    }

    if (!Array.isArray(correction.changedFiles) || correction.changedFiles.length === 0) {
        throw new Error(`Correção ${correction.errorId} sem ficheiros editados`);
    }

    if (!Array.isArray(correction.affectedTests) || correction.affectedTests.length === 0) {
        throw new Error(`Correção ${correction.errorId} sem teste afetado`);
    }

    // O exit code antes/depois torna a reexecução auditável: falhou antes, passou depois.
    if (correction.before?.exitCode === 0 || correction.after?.exitCode !== 0) {
        throw new Error(`Correção ${correction.errorId} sem before/after válido`);
    }

    assertSafeText(correction.rootCause, `rootCause:${correction.errorId}`);
    assertSafeText(correction.before?.summary, `before:${correction.errorId}`);
    assertSafeText(correction.after?.summary, `after:${correction.errorId}`);
}

/**
 * Valida que um bloqueio ficou separado de uma correção de produto.
 *
 * @param {object} blocker - Bloqueio herdado ou encontrado na reexecução.
 * @throws {Error} Quando o bloqueio não tem tipo, motivo ou impacto.
 */
function assertBlocker(blocker) {
    if (!blocker?.blockerId || !blocker?.sourceProof || !blocker?.type || !blocker?.reason || !blocker?.impact) {
        throw new Error("Bloqueio sem campos mínimos");
    }

    if (!["bloqueado_por_ambiente_ou_ferramenta", "bloqueado_por_contrato"].includes(blocker.type)) {
        throw new Error(`Tipo de bloqueio inválido: ${blocker.type}`);
    }

    assertSafeText(blocker.reason, `blockerReason:${blocker.blockerId}`);
    assertSafeText(blocker.impact, `blockerImpact:${blocker.blockerId}`);
}

/**
 * Valida a evidence mínima do BK-MF8-17.
 *
 * @param {{
 *   bkId: string,
 *   requisitos: string[],
 *   sourceEvidence: string,
 *   finalEvidence: string,
 *   finalStatus: string,
 *   corrections: object[],
 *   blockers: object[],
 *   proofs: { id: string, command: string, status: string, exitCode: number, summary: string }[],
 *   privacyReview: { passed: boolean, notes: string[] },
 *   closure: { nextBk: string, decision: string, remainingRisks: string[] }
 * }} evidence - Evidence recolhida durante o fecho final da MF8.
 * @returns {{ bkId: string, estado: "validado", dominio: "fecho_mf8" }} Resultado normalizado para PR/defesa.
 * @throws {Error} Quando a evidence não prova correção/revalidação de `RNF29`.
 */
export function validarBKMF817Evidence(evidence) {
    const requisitos = Array.isArray(evidence?.requisitos) ? evidence.requisitos : [];
    const corrections = Array.isArray(evidence?.corrections) ? evidence.corrections : [];
    const blockers = Array.isArray(evidence?.blockers) ? evidence.blockers : [];
    const proofs = Array.isArray(evidence?.proofs) ? evidence.proofs : [];

    if (evidence?.bkId !== BK_ID || !requisitos.includes(REQUIREMENT)) {
        throw new Error("Evidence fora do contrato BK-MF8-17/RNF29");
    }

    if (evidence.sourceEvidence !== SOURCE_EVIDENCE || evidence.finalEvidence !== FINAL_FIXES_EVIDENCE) {
        throw new Error("Evidence final sem ligação aos ficheiros esperados");
    }

    if (!FINAL_STATUSES.includes(evidence.finalStatus)) {
        throw new Error(`Estado final inválido: ${evidence.finalStatus}`);
    }

    for (const proofId of REQUIRED_PROOFS) {
        if (!proofs.some((proof) => proof.id === proofId)) {
            throw new Error(`Evidence final sem proof obrigatório: ${proofId}`);
        }
    }

    corrections.forEach(assertCorrection);
    blockers.forEach(assertBlocker);

    if (evidence.finalStatus === "corrigido_revalidado" && corrections.length === 0) {
        throw new Error("Estado corrigido sem correções registadas");
    }

    if (evidence.finalStatus === "sem_falhas_de_produto" && corrections.length > 0) {
        throw new Error("Estado sem falhas não pode ter correções de produto");
    }

    const e2eProof = proofs.find((proof) => proof.id === "proof_e2e");
    if (e2eProof?.command === "TODO (BLOCKER)" && e2eProof.status !== "bloqueado_por_ambiente_ou_ferramenta") {
        throw new Error("proof_e2e sem comando real deve ficar bloqueado");
    }

    if (evidence.privacyReview?.passed !== true) {
        throw new Error("Evidence final sem revisão de privacidade aprovada");
    }

    proofs.forEach((proof) => assertSafeText(proof.summary, `proof:${proof.id}`));

    if (evidence.closure?.nextBk !== "-") {
        throw new Error("BK-MF8-17 deve fechar a MF8 sem próximo BK");
    }

    return { bkId: BK_ID, estado: "validado", dominio: "fecho_mf8" };
}
```

5. Explicação do código.

O contrato valida o que `RNF29` realmente precisa: origem da falha, correção, teste afetado, reexecução, blockers, privacy check e fecho terminal. Não basta ter duas provas soltas; cada correção precisa de before/after e teste afetado.

`assertSafeText` protege a evidence contra fugas de dados sensíveis. Mesmo em testes, outputs com cookies, tokens, paths internos ou `storageKey` não devem ser copiados para o relatório de defesa.

`proof_e2e` tem regra própria. Se o comando for `TODO (BLOCKER)`, o estado tem de ser `bloqueado_por_ambiente_ou_ferramenta`. Isto evita dizer que existe E2E real quando o projeto não tem runner aprovado.

6. Validação do passo.

Executa:

```bash
node --check apps/api/tests/evidence/bk-mf8-17.evidence-contract.js
```

7. Cenário negativo/erro esperado.

Se removeres `proof_reexecucao_afetada`, o contrato deve falhar com `Evidence final sem proof obrigatório: proof_reexecucao_afetada`.

### Passo 5 - Criar teste Vitest do contrato final

1. Objetivo funcional do passo no contexto da app.

Garantir que o contrato de evidence aceita uma entrega válida e rejeita evidence incompleta, insegura ou com falso sucesso.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.final-fixes-contract.test.js`
    - REVER: `apps/api/tests/evidence/bk-mf8-17.evidence-contract.js`
    - LOCALIZAÇÃO: ficheiro completo.

3. Instruções do que fazer.

Cria o teste abaixo. Mantém pelo menos três negativos porque este BK é `P0`.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.final-fixes-contract.test.js
import { describe, expect, it } from "vitest";
import { validarBKMF817Evidence } from "./evidence/bk-mf8-17.evidence-contract.js";

/**
 * Cria uma evidence válida para o fecho final da MF8.
 *
 * @returns {object} Evidence completa com uma correção real e um blocker E2E.
 */
function makeValidEvidence() {
    return {
        bkId: "BK-MF8-17",
        requisitos: ["RNF29"],
        sourceEvidence: "docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md",
        finalEvidence: "docs/evidence/MF8/CORRECOES-FINAIS.md",
        finalStatus: "corrigido_revalidado",
        corrections: [
            {
                errorId: "ERR-MF8-17-001",
                sourceProof: "proof_api",
                rootCause: "Validação de contrato final incompleta.",
                changedFiles: ["apps/api/tests/evidence/bk-mf8-17.evidence-contract.js"],
                affectedTests: ["npm --prefix apps/api test -- mf8.final-fixes-contract.test.js"],
                before: {
                    command: "npm --prefix apps/api test -- mf8.final-fixes-contract.test.js",
                    exitCode: 1,
                    summary: "Contrato rejeitava evidence final incompleta.",
                },
                after: {
                    command: "npm --prefix apps/api test -- mf8.final-fixes-contract.test.js",
                    exitCode: 0,
                    summary: "Contrato valida correções, blockers e fecho terminal.",
                },
            },
        ],
        blockers: [
            {
                blockerId: "BLK-MF8-17-E2E",
                sourceProof: "proof_e2e",
                type: "bloqueado_por_ambiente_ou_ferramenta",
                reason: "Sem comando E2E/browser aprovado em apps/web/package.json.",
                impact: "Cobertura P0 sem browser real.",
                nextAction: "Aprovar runner E2E ou aceitar blocker na defesa.",
            },
        ],
        proofs: [
            { id: "proof_relatorio_final", command: "rg -n RNF29 docs/RNF.md", status: "passou", exitCode: 0, summary: "RNF29 encontrado." },
            { id: "proof_matriz_falhas", command: "rg -n falhou_por_produto docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md", status: "passou", exitCode: 0, summary: "Falhas triadas." },
            { id: "proof_correcao_final", command: "rg -n ERR-MF8-17 docs/evidence/MF8/CORRECOES-FINAIS.md", status: "passou", exitCode: 0, summary: "Correção final registada." },
            { id: "proof_reexecucao_afetada", command: "npm --prefix apps/api test -- mf8.final-fixes-contract.test.js", status: "passou", exitCode: 0, summary: "Teste afetado passou." },
            { id: "proof_api", command: "npm --prefix apps/api test", status: "passou", exitCode: 0, summary: "Suite API passou." },
            { id: "proof_web_build", command: "npm --prefix apps/web run build", status: "passou", exitCode: 0, summary: "Build web passou." },
            { id: "proof_planificacao", command: "bash scripts/validate-planificacao.sh", status: "passou", exitCode: 0, summary: "Planificação válida." },
            { id: "proof_diff", command: "git diff --check", status: "passou", exitCode: 0, summary: "Sem whitespace inválido." },
            { id: "proof_e2e", command: "TODO (BLOCKER)", status: "bloqueado_por_ambiente_ou_ferramenta", exitCode: 1, summary: "Sem comando E2E aprovado." },
            { id: "proof_privacidade", command: "rg -n padroes-sensiveis docs/evidence/MF8/CORRECOES-FINAIS.md", status: "passou", exitCode: 1, summary: "Sem outputs sensíveis." },
            { id: "proof_fecho_mf8", command: "rg -n 'proximo_bk.: `-`' docs/planificacao/guias-bk/MF8/BK-MF8-17-correcao-dos-erros-encontrados-e-reexecucao-dos-testes-afetados.md", status: "passou", exitCode: 0, summary: "BK terminal confirmado." },
        ],
        privacyReview: {
            passed: true,
            notes: ["Outputs resumidos e sem dados sensíveis."],
        },
        closure: {
            nextBk: "-",
            decision: "MF8 pronta para defesa com blocker E2E explícito.",
            remainingRisks: ["Browser E2E depende de comando aprovado."],
        },
    };
}

describe("BK-MF8-17 / RNF29 - contrato de correções finais", () => {
    it("aceita evidence final com correção, reexecução afetada e blocker E2E explícito", () => {
        expect(validarBKMF817Evidence(makeValidEvidence())).toEqual({
            bkId: "BK-MF8-17",
            estado: "validado",
            dominio: "fecho_mf8",
        });
    });

    it("falha quando uma correção não tem teste afetado", () => {
        const evidence = makeValidEvidence();
        evidence.corrections[0].affectedTests = [];

        // Sem teste afetado, o aluno não consegue provar que a causa raiz foi corrigida.
        expect(() => validarBKMF817Evidence(evidence)).toThrow("sem teste afetado");
    });

    it("falha quando proof_e2e sem comando real fica marcado como sucesso", () => {
        const evidence = makeValidEvidence();
        const e2eProof = evidence.proofs.find((proof) => proof.id === "proof_e2e");
        e2eProof.status = "passou";

        // Este negativo impede transformar ausência de runner browser em sucesso artificial.
        expect(() => validarBKMF817Evidence(evidence)).toThrow("proof_e2e sem comando real");
    });

    it("falha quando output resumido expõe dados sensíveis", () => {
        const evidence = makeValidEvidence();
        evidence.proofs[0].summary = "Set-Cookie: orelle_session=valor";

        expect(() => validarBKMF817Evidence(evidence)).toThrow("Evidence sensível");
    });

    it("falha quando o fecho aponta para outro BK", () => {
        const evidence = makeValidEvidence();
        evidence.closure.nextBk = "BK-MF9-01";

        expect(() => validarBKMF817Evidence(evidence)).toThrow("sem próximo BK");
    });
});
```

5. Explicação do código.

O teste cria uma evidence válida com uma correção e um blocker E2E. Isto representa o caso realista de fecho: há correções revalidadas e pode haver browser E2E bloqueado por falta de comando aprovado.

Os negativos cobrem os erros mais perigosos: correção sem teste afetado, E2E falso, output sensível e handoff para um BK inexistente. Estes negativos protegem a rastreabilidade de `RNF29`.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.final-fixes-contract.test.js
```

7. Cenário negativo/erro esperado.

Se o teste de output sensível aceitar `Set-Cookie`, o contrato ainda permite evidence insegura e deve ser corrigido antes de fechar a MF8.

### Passo 6 - Corrigir falhas de produto e reexecutar testes afetados

1. Objetivo funcional do passo no contexto da app.

Aplicar alterações apenas nos ficheiros ligados a falhas confirmadas e provar cada correção com o teste afetado.

2. Ficheiros envolvidos:
    - REVER: `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`
    - EDITAR: ficheiros afetados por cada falha `falhou_por_produto`
    - CRIAR/EDITAR: teste afetado correspondente
    - ATUALIZAR: `docs/evidence/MF8/CORRECOES-FINAIS.md`
    - LOCALIZAÇÃO: ficheiro completo, função completa ou componente completo indicado pela falha.

3. Instruções do que fazer.

Para cada falha com estado `falhou_por_produto`:

1. copia o `error_id`, `source_proof` e comando que falhou;
2. identifica a causa raiz;
3. edita apenas os ficheiros afetados;
4. reexecuta o teste afetado;
5. regista antes/depois em `CORRECOES-FINAIS.md`;
6. se a falha envolver autenticação, autorização, ownership, consentimento, dados biométricos, IA ou pagamentos, confirma que a validação principal fica no backend.

4. Código completo, correto e integrado com a app final.

```bash
# Primeiro reexecuta o teste afetado para confirmar que a falha ainda existe antes de alterar ficheiros.
PREENCHER_COM_COMANDO_DO_TESTE_AFETADO

# Depois da correção, volta a executar o mesmo teste para provar a revalidação afetada.
PREENCHER_COM_COMANDO_DO_TESTE_AFETADO

# Fecha com os gates globais que existem no projeto, sem inventar runners novos.
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check
```

5. Explicação do código.

Os dois primeiros comandos têm o mesmo alvo: o teste afetado. A diferença está no momento. Antes da correção, o comando prova o erro; depois da correção, prova que a causa raiz ficou resolvida.

Os gates globais garantem que a correção local não partiu a API, o build web, a planificação ou a higiene do diff.

6. Validação do passo.

Cada linha `corrigido_revalidado` em `CORRECOES-FINAIS.md` deve ter `exit_antes` diferente de `0` e `exit_depois` igual a `0`.

7. Cenário negativo/erro esperado.

Se um comando falhar por browser, runner, permissão ou serviço externo ausente, não edites código para esconder o ambiente. Regista `bloqueado_por_ambiente_ou_ferramenta`.

### Passo 7 - Fechar a MF8 com evidence segura

1. Objetivo funcional do passo no contexto da app.

Validar o contrato final, executar os gates finais e deixar a MF8 pronta para defesa ou bloqueada com motivo concreto.

2. Ficheiros envolvidos:
    - REVER: `docs/evidence/MF8/CORRECOES-FINAIS.md`
    - REVER: `apps/api/tests/evidence/bk-mf8-17.evidence-contract.js`
    - REVER: `apps/api/tests/mf8.final-fixes-contract.test.js`
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - LOCALIZAÇÃO: secção `Fecho da MF8`, `Provas de reexecução` e outputs finais.

3. Instruções do que fazer.

Executa os comandos abaixo a partir da raiz do projeto. Guarda outputs curtos em `CORRECOES-FINAIS.md`, sem dados sensíveis.

Executar cenarios negativos obrigatorios (minimo 3) com resultado controlado.

4. Código completo, correto e integrado com a app final.

```bash
# Estes comandos validam o contrato específico do BK17 antes dos gates globais.
node --check apps/api/tests/evidence/bk-mf8-17.evidence-contract.js
npm --prefix apps/api test -- mf8.final-fixes-contract.test.js

# Estes gates provam que a correção final não partiu API, frontend, planificação ou diff.
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check

# Este scan protege a evidence de outputs sensíveis antes de PR/defesa.
rg -n "passwordHash|Set-Cookie|Authorization|Bearer|storageKey|consentId|/Users/|/var/" docs/evidence/MF8/CORRECOES-FINAIS.md
```

5. Explicação do código.

`node --check` valida sintaxe ESM do contrato. O Vitest focal prova os negativos de `RNF29`. A suite API, o build web, o validador de planificação e `git diff --check` confirmam que o fecho não causou regressões gerais.

O último `rg` deve devolver exit code `1`. Se devolver ocorrências reais, remove ou resume esse output antes de anexar evidence.

6. Validação do passo.

`CORRECOES-FINAIS.md` deve terminar com uma decisão clara: `MF8 pronta para defesa`, `MF8 pronta com blocker explícito` ou `MF8 bloqueada por falha real`.

7. Cenário negativo/erro esperado.

Se `proof_fecho_mf8` disser que existe próximo BK, corrige a evidence: `BK-MF8-17` é terminal e não deve apontar para `BK-MF9-01` sem contrato canónico.

#### Expected results

- `docs/evidence/MF8/CORRECOES-FINAIS.md` existe com falhas corrigidas, blockers preservados, provas de reexecução e fecho da MF8.
- `apps/api/tests/evidence/bk-mf8-17.evidence-contract.js` valida `RNF29`, erros corrigidos, blockers, proofs, privacidade e fecho terminal.
- `apps/api/tests/mf8.final-fixes-contract.test.js` valida caminho positivo e pelo menos `3` negativos `P0`.
- Cada falha `falhou_por_produto` tem causa raiz, ficheiros editados, teste afetado, comando antes/depois e estado `corrigido_revalidado`.
- `proof_e2e` tem comando real aprovado ou `TODO (BLOCKER)` explícito.
- Outputs anexados não expõem passwords, tokens, cookies, paths internos, fotografias, relatórios sensíveis, `storageKey`, `consentId` ou dados pessoais.
- A MF8 fica fechada para defesa ou bloqueada com motivo concreto.

#### Critérios de aceite

- Entrega funcional específica de `Correção dos erros encontrados e reexecução dos testes afetados` validada contra `RNF29`.
- Registo `docs/evidence/MF8/CORRECOES-FINAIS.md` criado com erros, blockers, provas e fecho terminal.
- Contrato `apps/api/tests/evidence/bk-mf8-17.evidence-contract.js` criado com JSDoc e comentários didáticos.
- Teste `apps/api/tests/mf8.final-fixes-contract.test.js` criado com caminho positivo e negativos de teste afetado, E2E falso, output sensível e próximo BK inválido.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).

### Matriz minima de testes por prioridade

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.
- Fecho terminal da MF8 documentado, sem handoff para BK inexistente.

#### Validação final

- [ ] `rg -n "RNF29|BK-MF8-17|BK-MF8-16|unit \\+ integration \\+ e2e" ...` confirma contrato.
- [ ] `test -f docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` passa ou deixa blocker explícito.
- [ ] `rg -n "falhou_por_produto|bloqueado_por_ambiente_ou_ferramenta|proof_e2e" docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md` passa ou deixa blocker explícito.
- [ ] `rg -n "BK-MF8-17|RNF29|proof_reexecucao_afetada|proof_fecho_mf8" docs/evidence/MF8/CORRECOES-FINAIS.md` passa.
- [ ] `node --check apps/api/tests/evidence/bk-mf8-17.evidence-contract.js` passa.
- [ ] `npm --prefix apps/api test -- mf8.final-fixes-contract.test.js` passa.
- [ ] Testes afetados por falhas reais passam depois da correção.
- [ ] `npm --prefix apps/api test` passa ou falha com output registado.
- [ ] `npm --prefix apps/web run build` passa ou falha com output registado.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] `git diff --check` passa.
- [ ] `proof_e2e` tem comando real aprovado ou `TODO (BLOCKER)` explícito.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.
- [ ] Segurança/privacidade: outputs anexados não expõem dados sensíveis.
- [ ] Fecho: `proximo_bk = "-"` e riscos restantes registados.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `proof_contrato`: output do `rg` de `RNF29`, `BK-MF8-17`, `BK-MF8-16` e matriz `P0`.
- `proof_handoff_bk16`: output do `rg` em `docs/evidence/MF8/EXECUCAO-FINAL-TESTES.md`.
- `proof_correcao_final`: output do `rg` em `docs/evidence/MF8/CORRECOES-FINAIS.md`.
- `proof_contrato_bk17`: output de `node --check apps/api/tests/evidence/bk-mf8-17.evidence-contract.js`.
- `proof_teste_bk17`: output de `npm --prefix apps/api test -- mf8.final-fixes-contract.test.js`.
- `proof_reexecucao_afetada`: output do teste afetado por cada falha real.
- `proof_api`: output de `npm --prefix apps/api test`.
- `proof_web_build`: output de `npm --prefix apps/web run build`.
- `proof_planificacao`: output de `bash scripts/validate-planificacao.sh`.
- `proof_diff`: output de `git diff --check`.
- `proof_e2e`: comando E2E real aprovado ou `TODO (BLOCKER)` com motivo.
- `proof_privacidade`: confirmação de que outputs anexados não expõem dados sensíveis.
- `proof_fecho_mf8`: nota curta com decisão final e riscos restantes.

#### Handoff

- Próximo BK recomendado: `-`
- Este é o BK terminal da MF8.
- A MF8 só fica pronta para defesa quando `CORRECOES-FINAIS.md` distingue correções revalidadas, blockers de ambiente, blockers de contrato e riscos restantes.
- Não avances para apresentação final com falhas `falhou_por_produto` abertas.
- Se `proof_e2e` ficar `TODO (BLOCKER)`, explica na defesa que falta runner browser aprovado e mostra os restantes gates executados.

#### Changelog

| Data | Alteração |
| --- | --- |
| 2026-07-03 | Corrigido para materializar `CORRECOES-FINAIS.md`, reforçar o contrato de evidence, criar teste Vitest focal, separar falhas reais de blockers e fechar a MF8 como BK terminal. |
| 2026-06-30 | Guia revisto para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito. |
