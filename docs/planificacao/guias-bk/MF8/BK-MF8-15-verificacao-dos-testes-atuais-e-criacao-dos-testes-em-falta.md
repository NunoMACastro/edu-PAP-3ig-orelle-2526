# BK-MF8-15 - Verificação dos testes atuais e criação dos testes em falta

## Header
- `doc_id`: `GUIA-BK-MF8-15`
- `bk_id`: `BK-MF8-15`
- `macro`: `MF8`
- `owner`: `Daniel Bulica`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-03, BK-MF8-14`
- `rf_rnf`: `RNF27`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-16`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-15-verificacao-dos-testes-atuais-e-criacao-dos-testes-em-falta.md`
- `last_updated`: `2026-07-03`

#### Objetivo

Neste BK vais transformar a revisão de testes da MF8 numa entrega verificável: inventariar testes existentes, identificar lacunas por BK/RF/RNF, criar o contrato de evidence e adicionar o teste final que impede avançar para a bateria final sem cobertura mínima.

#### Importância

O `RNF27` existe para evitar uma defesa baseada em frases como "os testes estão feitos" sem prova técnica. Antes do `BK-MF8-16`, a equipa precisa de saber que comandos existem, que cenários críticos já estão cobertos, que lacunas continuam abertas e que negativos protegem segurança, privacidade, IA, UI e dados biométricos.

Este BK também protege o trabalho dos BKs anteriores. O `BK-MF8-03` garante separação entre testes e produção; o `BK-MF8-14` entrega evidence visual e check estático; o `BK-MF8-15` liga essas provas a uma matriz de cobertura e a testes executáveis para que o `BK-MF8-16` possa correr a bateria final sem adivinhar o que falta.

#### Scope-in

- Rever scripts reais de `apps/api/package.json` e `apps/web/package.json`.
- Criar a matriz `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`.
- Criar o contrato `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`.
- Criar o teste `apps/api/tests/mf8.final-contracts.test.js`.
- Criar o smoke estático `apps/web/scripts/check-mf8-final-smoke.mjs`.
- Registar o estado do caminho E2E/browser para a bateria final.
- Preparar handoff objetivo para `BK-MF8-16`.

#### Scope-out

- Não corrigir funcionalidades de produto neste BK.
- Não criar endpoints, models, DTOs ou componentes novos para mascarar lacunas de testes.
- Não usar testes dependentes de produção.
- Não aceitar evidence sem BK/RF/RNF associado.
- Não adicionar dependências novas para testar ficheiros estáticos.

#### Estado antes e depois

- Antes: existem testes e smokes dispersos, mas a equipa não tem uma matriz final que diga o que está coberto, o que falta e que riscos seguem para a bateria final.
- Depois: existe uma matriz de cobertura da MF8, um contrato de evidence, um teste Vitest para validar essa matriz e um smoke estático que verifica os artefactos mínimos antes de avançar para `BK-MF8-16`.

#### Pre-requisitos

- `BK-MF8-03`: ambiente de testes separado da produção.
- `BK-MF8-14`: evidence visual, checklist, check estático e contrato de evidence visual.
- `apps/api/package.json`: script real `test`.
- `apps/web/package.json`: script real `build` e smokes existentes.
- `docs/planificacao/sprints/PLANO-SPRINTS.md`: matriz mínima de testes por prioridade.

#### Glossário

- Cobertura: ligação objetiva entre requisito e teste, comando ou evidence.
- Lacuna: requisito, cenário ou negativo importante sem prova suficiente.
- Matriz de cobertura: tabela que mostra BK/RF/RNF, camada, comando, estado, lacuna, negativo, risco e handoff.
- Smoke: verificação curta que confirma se um fluxo ou contrato essencial está montado.
- E2E: teste de ponta a ponta que atravessa interface, API e comportamento observável. Nesta PAP, se não existir infraestrutura de browser, a lacuna fica registada e mitigada por smoke estático até decisão do professor.
- Evidence: prova objetiva guardada para PR/defesa, com comando, diretoria, resultado e impacto.
- Negativo: cenário de erro esperado que prova que a app falha de forma controlada.

#### Conceitos teóricos essenciais

Um teste unitário valida uma função, service ou contrato isolado. Serve para perceber se uma regra pequena continua correta, por exemplo validar evidence mínima ou rejeitar uma matriz sem `RNF27`.

Um teste de integração valida a ligação entre peças. Na Orelle, testes com Vitest e Supertest já provam rotas, controllers, services, sessão por cookie HttpOnly, ownership, consentimento e respostas públicas sem dados sensíveis.

Um smoke valida rapidamente se uma cadeia essencial ainda está montada. O smoke estático deste BK não substitui um browser E2E completo, mas evita avançar se os ficheiros de evidence, teste final e checks do `BK-MF8-14` não existirem.

Um E2E real usa o comportamento da aplicação como o utilizador o vê. Como o projeto atual não tem script `e2e` em `apps/web/package.json`, este BK regista essa lacuna de forma honesta e cria um smoke `DERIVADO` sem dependências novas. Se o professor exigir browser E2E real, a matriz deve marcar essa linha como `TODO (BLOCKER)` até existir ferramenta aprovada.

Evidence não é decoração. Cada prova deve dizer que comando foi executado, onde foi executado, que resultado apareceu, que BK/RF/RNF cobre e que risco reduz. Sem isto, o `BK-MF8-16` ficaria sem base para a bateria final.

Segurança e privacidade continuam a ser obrigatórias mesmo num BK de testes. A matriz deve confirmar que testes sensíveis não expõem passwords, tokens, cookies, paths internos, fotografias, relatórios biométricos ou dados pessoais.

#### Arquitetura do BK

- `bk_id`: `BK-MF8-15`
- `flow_id`: `FLOW-MF8-TEST-INVENTORY`
- `requisitos`: `RNF27`
- `dependências`: `BK-MF8-03, BK-MF8-14`
- `tema técnico`: `inventário de testes e criação de testes em falta`
- `destino dos alunos`: `apps/api`, `apps/web` e `docs/evidence/MF8`
- `decisão CANONICO`: `RNF27` exige verificar testes atuais e criar testes em falta antes da bateria final.
- `decisão CANONICO`: por ser `P0`, a matriz de sprints exige `unit + integration + e2e` e mínimo de 3 negativos.
- `decisão DERIVADO`: como `apps/web/package.json` ainda não tem script E2E/browser, este BK cria um smoke estático MF8 sem dependências novas e regista a ausência de E2E real na matriz.

#### Ficheiros a criar/editar/rever

- REVER: `docs/RNF.md`
- REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
- REVER: `docs/planificacao/sprints/PLANO-SPRINTS.md`
- REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md`
- REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md`
- REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md`
- REVER: `apps/api/package.json`
- REVER: `apps/web/package.json`
- CRIAR: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
- CRIAR: `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`
- CRIAR: `apps/api/tests/mf8.final-contracts.test.js`
- CRIAR: `apps/web/scripts/check-mf8-final-smoke.mjs`

#### Tutorial técnico linear

### Passo 1 - Confirmar contrato e fronteiras

1. Objetivo funcional do passo no contexto da app.

Confirmar que o BK implementa apenas `RNF27`, consome `BK-MF8-03` e `BK-MF8-14`, e prepara `BK-MF8-16` sem reabrir funcionalidades de produto.

2. Ficheiros envolvidos:
    - REVER: `docs/RNF.md`
    - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
    - REVER: `docs/planificacao/sprints/PLANO-SPRINTS.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md`
    - LOCALIZAÇÃO: linhas de `RNF27`, linha canónica de `BK-MF8-15`, matriz mínima de testes e handoff do BK anterior/seguinte.

3. Instruções do que fazer.

Executa a pesquisa abaixo e confirma estes factos:

1. `RNF27` é o requisito deste BK.
2. `BK-MF8-15` é `P0`.
3. `BK-MF8-15` depende de `BK-MF8-03` e `BK-MF8-14`.
4. `BK-MF8-16` depende de `BK-MF8-15`.
5. A prioridade `P0` exige `unit + integration + e2e` e 3 negativos.

4. Código completo, correto e integrado com a app final.

```bash
rg -n "RNF27|BK-MF8-15|BK-MF8-16|unit \\+ integration \\+ e2e" docs/RNF.md docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md docs/planificacao/backlogs/BACKLOG-MVP.md docs/planificacao/sprints/PLANO-SPRINTS.md docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md docs/planificacao/guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md
```

5. Explicação do código.

Este comando não altera ficheiros. Ele junta as fontes canónicas que definem o trabalho do BK: requisito, dependências, prioridade, matriz de testes e handoff. Isto evita criar testes soltos sem rastreabilidade.

O resultado esperado deve mostrar `RNF27` em `docs/RNF.md`, a linha do `BK-MF8-15` na matriz/backlog, a matriz mínima em `PLANO-SPRINTS.md` e a dependência do `BK-MF8-16`.

6. Validação do passo.

Guarda o output no campo `proof_contrato` da evidence. Se algum destes pontos não aparecer, para e regista `TODO (BLOCKER)` na matriz criada no Passo 2.

7. Cenário negativo/erro esperado.

Se `RNF27` ou `BK-MF8-15` não aparecerem nos documentos canónicos, não cries testes por intuição. O erro esperado é bloquear o BK até a planificação ser corrigida.

### Passo 2 - Criar matriz de testes atuais e lacunas

1. Objetivo funcional do passo no contexto da app.

Criar a evidence documental que lista o que está coberto, o que falta, que comando prova cada ponto e que risco segue para a bateria final.

2. Ficheiros envolvidos:
    - CRIAR: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-03-ambiente-de-testes-separado-do-ambiente-de-producao.md`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-14-aproximacao-da-ui-a-ui-do-mockup.md`
    - LOCALIZAÇÃO: ficheiro completo `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`.

3. Instruções do que fazer.

Cria a pasta `docs/evidence/MF8` se ainda não existir. Depois cria o ficheiro abaixo. Mantém as colunas da matriz porque o teste do Passo 4 vai validar estes nomes.

4. Código completo, correto e integrado com a app final.

```md
<!-- docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md -->
# TESTES-ATUAIS-E-LACUNAS - MF8

## Contexto

- `bk_id`: `BK-MF8-15`
- `requisito`: `RNF27`
- `objetivo`: verificar testes atuais e criar testes em falta antes da bateria final.
- `prioridade`: `P0`
- `data`: `2026-07-03`

## Comandos reais disponíveis

| Camada | Comando | Estado | Observação |
| --- | --- | --- | --- |
| API unit/integration | `npm --prefix apps/api test` | `coberto` | Vitest executa testes unitários e de integração existentes. |
| Web build | `npm --prefix apps/web run build` | `coberto` | Vite confirma que o frontend compila. |
| Web smoke MF8 | `node apps/web/scripts/check-mf8-final-smoke.mjs` | `criado_neste_bk` | Smoke estático sem dependências novas para validar artefactos MF8. |
| Browser E2E | `TODO (BLOCKER)` | `lacuna_controlada` | Não existe script E2E/browser em `apps/web/package.json`; se for exigido, precisa de decisão do professor. |
| Planificação | `bash scripts/validate-planificacao.sh` | `coberto` | Valida matriz, backlog, guias e links. |
| Diff | `git diff --check` | `coberto` | Confirma ausência de erros de whitespace. |

## Matriz de cobertura

| BK/RF/RNF | Camada | Teste/comando | Estado | Lacuna | Negativo obrigatório | Risco | Handoff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BK-MF8-03 / RNF22` | integração | `npm --prefix apps/api test` | `coberto` | Confirmar que os testes não dependem de produção. | Variáveis de produção não devem ser necessárias para correr testes. | Testes frágeis ou perigosos se usarem produção. | `BK-MF8-16` deve guardar output do comando. |
| `BK-MF8-14 / RNF26` | smoke web | `node apps/web/scripts/check-mf8-mockup-alignment.mjs` | `cobertura_dependente_do_bk14` | Garantir que o check estático criado no BK14 existe depois da aplicação desse BK. | Sem screenshot mobile, a evidence visual não fecha. | UI final sem prova visual. | `BK-MF8-16` deve recolher proof visual e output do check. |
| `BK-MF8-15 / RNF27` | unit | `npm --prefix apps/api test -- mf8.final-contracts.test.js` | `criado_neste_bk` | Validar matriz, evidence e negativos mínimos. | Evidence sem `RNF27` deve falhar. | Avançar para bateria final sem inventário real. | `BK-MF8-16` consome esta matriz. |
| `BK-MF8-15 / RNF27` | smoke web | `node apps/web/scripts/check-mf8-final-smoke.mjs` | `criado_neste_bk` | Confirmar que artefactos de fecho existem. | Ficheiro de evidence em falta deve falhar. | Bateria final sem artefactos mínimos. | `BK-MF8-16` executa smoke antes da bateria final. |
| `BK-MF8-15 / RNF27` | browser E2E | `TODO (BLOCKER)` | `lacuna_controlada` | Não há script E2E/browser aprovado no projeto. | Tentar marcar E2E como passado sem comando real deve bloquear. | Evidence P0 incompleta se o professor exigir browser real. | `BK-MF8-16` regista como bloqueio ou substitui por comando aprovado. |
| `BK-MF8-16 / RNF28` | bateria final | `npm --prefix apps/api test`, `npm --prefix apps/web run build`, `node apps/web/scripts/check-mf8-final-smoke.mjs` | `preparado` | A execução final ainda acontece no próximo BK. | Falha sem output deve ser repetida uma vez e registada. | Falhas finais sem rastreabilidade. | `BK-MF8-17` corrige erros encontrados. |

## Negativos mínimos P0

1. Evidence sem `RNF27` deve ser rejeitada pelo contrato de evidence.
2. Matriz sem 3 negativos deve falhar no teste `mf8.final-contracts.test.js`.
3. Smoke MF8 deve falhar se `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` não existir.
4. Browser E2E sem comando real deve ficar registado como `TODO (BLOCKER)`, não como sucesso.

Executar cenarios negativos obrigatorios (minimo 3) e guardar evidence ligada ao `RNF27`.

## Evidence a recolher

- `proof_contrato`: output do `rg` do Passo 1.
- `proof_api`: output de `npm --prefix apps/api test`.
- `proof_web_build`: output de `npm --prefix apps/web run build`.
- `proof_mf8_smoke`: output de `node apps/web/scripts/check-mf8-final-smoke.mjs`.
- `proof_planificacao`: output de `bash scripts/validate-planificacao.sh`.
- `proof_diff`: output de `git diff --check`.
- `proof_e2e`: comando E2E real aprovado ou `TODO (BLOCKER)` com motivo.

## Handoff para BK-MF8-16

O `BK-MF8-16` deve executar os comandos registados nesta matriz, anexar outputs completos e separar três estados: `passou`, `falhou_por_produto` e `bloqueado_por_ambiente_ou_ferramenta`.
```

5. Explicação do código.

Este ficheiro é evidence documental, mas tem estrutura rígida porque será validado por teste. A primeira tabela lista comandos reais. A segunda tabela liga BK/RF/RNF a camada, comando, estado, lacuna, negativo, risco e handoff.

A linha `Browser E2E` não finge sucesso. Ela marca a ausência de script real como `TODO (BLOCKER)` se o professor exigir browser E2E. Esta transparência é mais segura do que inventar uma ferramenta que não existe no `package.json`.

6. Validação do passo.

Executa:

```bash
rg -n "BK-MF8-15|RNF27|npm --prefix apps/api test|check-mf8-final-smoke|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md
```

7. Cenário negativo/erro esperado.

Se a matriz não tiver a linha `BK-MF8-15 / RNF27`, o teste do Passo 4 deve falhar porque a evidence não cobre o requisito central deste BK.

### Passo 3 - Criar contrato de evidence do BK

1. Objetivo funcional do passo no contexto da app.

Criar funções simples, sem dependências novas, para validar se a evidence do BK15 tem requisito, camadas, negativos e cobertura mínima antes da bateria final.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`
    - REVER: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
    - LOCALIZAÇÃO: ficheiro completo `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`.

3. Instruções do que fazer.

Cria a pasta `apps/api/tests/evidence` se ainda não existir. Depois cria o ficheiro completo abaixo.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/evidence/bk-mf8-15.evidence-contract.js
const BK_ID = "BK-MF8-15";
const REQUIRED_REQUIREMENTS = ["RNF27"];
const REQUIRED_LAYERS = ["unit", "integration", "smoke"];
const MIN_NEGATIVE_SCENARIOS = 3;
const ALLOWED_STATUSES = new Set([
    "coberto",
    "criado_neste_bk",
    "preparado",
    "lacuna_controlada",
    "cobertura_dependente_do_bk14",
]);

/**
 * Normaliza listas recebidas de evidence para evitar erros com valores nulos.
 *
 * @param {unknown} value - Valor recebido da matriz ou do teste.
 * @returns {unknown[]} Lista segura para validações seguintes.
 */
function toArray(value) {
    return Array.isArray(value) ? value : [];
}

/**
 * Confirma se uma linha da matriz tem campos suficientes para ser auditável.
 *
 * @param {{bkRef?: string, layer?: string, command?: string, status?: string, negativeScenario?: string, risk?: string, handoff?: string}} row - Linha da matriz de cobertura.
 * @returns {boolean} `true` quando a linha tem rastreabilidade mínima.
 */
function hasAuditableShape(row) {
    return Boolean(
        row?.bkRef &&
            row?.layer &&
            row?.command &&
            row?.status &&
            row?.negativeScenario &&
            row?.risk &&
            row?.handoff,
    );
}

/**
 * Valida a matriz de cobertura do BK-MF8-15.
 *
 * @param {{rows: Array<{bkRef: string, layer: string, command: string, status: string, negativeScenario: string, risk: string, handoff: string}>}} matrix - Matriz criada em `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`.
 * @returns {{rows: number, layers: string[], hasControlledE2EGap: boolean}} Resumo validado da cobertura.
 * @throws {Error} Quando a matriz não cobre `RNF27`, camadas mínimas ou lacunas controladas.
 */
export function validateMF8CoverageMatrix(matrix) {
    const rows = toArray(matrix?.rows);

    if (rows.length === 0) {
        throw new Error("Matriz MF8 sem linhas de cobertura");
    }

    const invalidRow = rows.find((row) => !hasAuditableShape(row));
    if (invalidRow) {
        throw new Error(`Linha de cobertura incompleta: ${invalidRow.bkRef || "sem BK"}`);
    }

    const unsupportedStatus = rows.find((row) => !ALLOWED_STATUSES.has(row.status));
    if (unsupportedStatus) {
        throw new Error(`Estado de cobertura desconhecido: ${unsupportedStatus.status}`);
    }

    const hasRNF27 = rows.some((row) => row.bkRef.includes("RNF27"));
    if (!hasRNF27) {
        throw new Error("Matriz MF8 sem cobertura para RNF27");
    }

    const layers = [...new Set(rows.map((row) => row.layer))];
    const missingLayer = REQUIRED_LAYERS.find((layer) => !layers.includes(layer));
    if (missingLayer) {
        throw new Error(`Matriz MF8 sem camada obrigatória: ${missingLayer}`);
    }

    // A ausência de browser E2E não é escondida: precisa de linha explícita para a bateria final.
    const hasControlledE2EGap = rows.some(
        (row) => row.layer === "browser-e2e" && row.status === "lacuna_controlada",
    );
    if (!hasControlledE2EGap) {
        throw new Error("Matriz MF8 não registou o estado do browser E2E");
    }

    return { rows: rows.length, layers, hasControlledE2EGap };
}

/**
 * Valida a evidence mínima do BK-MF8-15 antes da bateria final.
 *
 * @param {{bkId: string, requirements: string[], proofs: string[], negativeScenarios: string[], coverageMatrix: {rows: Array<{bkRef: string, layer: string, command: string, status: string, negativeScenario: string, risk: string, handoff: string}>}}} evidence - Evidence recolhida durante o BK.
 * @returns {{bkId: string, status: string, coverageRows: number}} Resultado normalizado para PR/defesa.
 * @throws {Error} Quando a evidence não prova requisito, testes, negativos ou matriz mínima.
 */
export function validateBKMF815Evidence(evidence) {
    const requirements = toArray(evidence?.requirements);
    const proofs = toArray(evidence?.proofs);
    const negativeScenarios = toArray(evidence?.negativeScenarios);

    // O BK fica preso ao ID e ao RNF para impedir evidence solta de outra macrofase.
    if (evidence?.bkId !== BK_ID) {
        throw new Error("Evidence fora do contrato BK-MF8-15");
    }

    const missingRequirement = REQUIRED_REQUIREMENTS.find((requirement) => !requirements.includes(requirement));
    if (missingRequirement) {
        throw new Error(`Evidence sem requisito obrigatório: ${missingRequirement}`);
    }

    if (proofs.length < 4) {
        throw new Error("Evidence técnica insuficiente para RNF27");
    }

    if (negativeScenarios.length < MIN_NEGATIVE_SCENARIOS) {
        throw new Error("Cenários negativos abaixo do mínimo exigido para P0");
    }

    const coverage = validateMF8CoverageMatrix(evidence?.coverageMatrix);

    return { bkId: BK_ID, status: "validado", coverageRows: coverage.rows };
}
```

5. Explicação do código.

`validateMF8CoverageMatrix` valida a matriz criada no Passo 2. A função exige linhas auditáveis, estados conhecidos, cobertura para `RNF27`, camadas `unit`, `integration` e `smoke`, e uma linha explícita para a lacuna de browser E2E.

`validateBKMF815Evidence` valida a evidence final do BK. Ela exige `bkId`, `RNF27`, provas suficientes, 3 negativos e matriz válida. As mensagens de erro são controladas e não expõem dados sensíveis, paths internos de servidor, cookies ou tokens.

6. Validação do passo.

Executa:

```bash
node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js
```

7. Cenário negativo/erro esperado.

Se a evidence não incluir `RNF27`, a função deve lançar `Evidence sem requisito obrigatório: RNF27`.

### Passo 4 - Criar teste final de contratos MF8

1. Objetivo funcional do passo no contexto da app.

Criar um teste Vitest real que valida a matriz de cobertura, a evidence mínima, os negativos P0 e o registo honesto da lacuna de browser E2E.

2. Ficheiros envolvidos:
    - CRIAR: `apps/api/tests/mf8.final-contracts.test.js`
    - REVER: `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`
    - REVER: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
    - LOCALIZAÇÃO: ficheiro completo `apps/api/tests/mf8.final-contracts.test.js`.

3. Instruções do que fazer.

Cria o ficheiro abaixo. Não uses casts inseguros nem mocks para substituir a validação; o teste usa objetos simples e o contrato real do Passo 3.

4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf8.final-contracts.test.js
import { describe, expect, it } from "vitest";

import {
    validateBKMF815Evidence,
    validateMF8CoverageMatrix,
} from "./evidence/bk-mf8-15.evidence-contract.js";

const validCoverageRows = [
    {
        bkRef: "BK-MF8-03 / RNF22",
        layer: "integration",
        command: "npm --prefix apps/api test",
        status: "coberto",
        negativeScenario: "Variáveis de produção não devem ser necessárias para correr testes.",
        risk: "Testes frágeis ou perigosos se usarem produção.",
        handoff: "BK-MF8-16 deve guardar output do comando.",
    },
    {
        bkRef: "BK-MF8-14 / RNF26",
        layer: "smoke",
        command: "node apps/web/scripts/check-mf8-mockup-alignment.mjs",
        status: "cobertura_dependente_do_bk14",
        negativeScenario: "Sem screenshot mobile, a evidence visual não fecha.",
        risk: "UI final sem prova visual.",
        handoff: "BK-MF8-16 deve recolher proof visual e output do check.",
    },
    {
        bkRef: "BK-MF8-15 / RNF27",
        layer: "unit",
        command: "npm --prefix apps/api test -- mf8.final-contracts.test.js",
        status: "criado_neste_bk",
        negativeScenario: "Evidence sem RNF27 deve falhar.",
        risk: "Avançar para bateria final sem inventário real.",
        handoff: "BK-MF8-16 consome esta matriz.",
    },
    {
        bkRef: "BK-MF8-15 / RNF27",
        layer: "smoke",
        command: "node apps/web/scripts/check-mf8-final-smoke.mjs",
        status: "criado_neste_bk",
        negativeScenario: "Ficheiro de evidence em falta deve falhar.",
        risk: "Bateria final sem artefactos mínimos.",
        handoff: "BK-MF8-16 executa smoke antes da bateria final.",
    },
    {
        bkRef: "BK-MF8-15 / RNF27",
        layer: "browser-e2e",
        command: "TODO (BLOCKER)",
        status: "lacuna_controlada",
        negativeScenario: "Tentar marcar E2E como passado sem comando real deve bloquear.",
        risk: "Evidence P0 incompleta se o professor exigir browser real.",
        handoff: "BK-MF8-16 regista como bloqueio ou substitui por comando aprovado.",
    },
];

const validEvidence = {
    bkId: "BK-MF8-15",
    requirements: ["RNF27"],
    proofs: [
        "proof_contrato",
        "proof_api",
        "proof_web_build",
        "proof_mf8_smoke",
    ],
    negativeScenarios: [
        "Evidence sem RNF27 deve falhar.",
        "Matriz sem 3 negativos deve falhar.",
        "Smoke MF8 deve falhar se a evidence não existir.",
    ],
    coverageMatrix: { rows: validCoverageRows },
};

describe("BK-MF8-15 / RNF27 - contratos finais de testes", () => {
    it("valida matriz com RNF27, camadas mínimas e lacuna E2E controlada", () => {
        const result = validateMF8CoverageMatrix({ rows: validCoverageRows });

        // O resultado resume a matriz para a evidence final sem expor dados sensíveis.
        expect(result.rows).toBe(validCoverageRows.length);
        expect(result.layers).toContain("unit");
        expect(result.layers).toContain("integration");
        expect(result.layers).toContain("smoke");
        expect(result.hasControlledE2EGap).toBe(true);
    });

    it("valida evidence completa do BK-MF8-15", () => {
        const result = validateBKMF815Evidence(validEvidence);

        expect(result).toEqual({
            bkId: "BK-MF8-15",
            status: "validado",
            coverageRows: validCoverageRows.length,
        });
    });

    it("rejeita evidence sem RNF27", () => {
        expect(() =>
            validateBKMF815Evidence({
                ...validEvidence,
                requirements: [],
            }),
        ).toThrow("Evidence sem requisito obrigatório: RNF27");
    });

    it("rejeita matriz sem linha de browser E2E controlada", () => {
        const rowsWithoutE2E = validCoverageRows.filter((row) => row.layer !== "browser-e2e");

        expect(() => validateMF8CoverageMatrix({ rows: rowsWithoutE2E })).toThrow(
            "Matriz MF8 não registou o estado do browser E2E",
        );
    });

    it("rejeita evidence com negativos abaixo do mínimo P0", () => {
        expect(() =>
            validateBKMF815Evidence({
                ...validEvidence,
                negativeScenarios: ["Só um negativo"],
            }),
        ).toThrow("Cenários negativos abaixo do mínimo exigido para P0");
    });
});
```

5. Explicação do código.

O teste importa as funções reais do contrato de evidence. `validCoverageRows` representa a matriz mínima que o aluno criou no Passo 2. Há linhas para integração, smoke, unit e browser E2E em estado controlado.

O primeiro teste confirma que a matriz tem camadas mínimas e que a lacuna E2E não foi escondida. O segundo confirma evidence válida. Os três testes negativos provam que o contrato falha sem `RNF27`, sem linha E2E controlada e sem 3 negativos.

Este teste prepara o `BK-MF8-16` porque transforma a matriz de cobertura num gate executável. Se alguém apagar a linha de browser E2E ou reduzir os negativos, a bateria final não deve avançar como se estivesse completa.

6. Validação do passo.

Executa:

```bash
npm --prefix apps/api test -- mf8.final-contracts.test.js
```

7. Cenário negativo/erro esperado.

Se trocares `requirements: ["RNF27"]` por `requirements: []`, o teste deve falhar com `Evidence sem requisito obrigatório: RNF27`.

### Passo 5 - Criar smoke estático MF8 sem dependências novas

1. Objetivo funcional do passo no contexto da app.

Criar um smoke que verifica se os artefactos mínimos de fecho existem antes de passar para a bateria final.

2. Ficheiros envolvidos:
    - CRIAR: `apps/web/scripts/check-mf8-final-smoke.mjs`
    - REVER: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
    - REVER: `apps/api/tests/mf8.final-contracts.test.js`
    - REVER: `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`
    - REVER: `apps/web/scripts/check-mf8-mockup-alignment.mjs`
    - LOCALIZAÇÃO: ficheiro completo `apps/web/scripts/check-mf8-final-smoke.mjs`.

3. Instruções do que fazer.

Cria o script abaixo. Ele usa apenas `node:fs` e `node:path`, por isso não adiciona dependências. Corre a partir da raiz do projeto.

4. Código completo, correto e integrado com a app final.

```js
// apps/web/scripts/check-mf8-final-smoke.mjs
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_FILES = [
    "docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md",
    "apps/api/tests/evidence/bk-mf8-15.evidence-contract.js",
    "apps/api/tests/mf8.final-contracts.test.js",
    "apps/web/scripts/check-mf8-final-smoke.mjs",
];

const REQUIRED_PATTERNS = [
    {
        file: "docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md",
        pattern: "BK-MF8-15 / RNF27",
        label: "matriz liga BK-MF8-15 a RNF27",
    },
    {
        file: "docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md",
        pattern: "TODO (BLOCKER)",
        label: "matriz regista lacuna E2E controlada",
    },
    {
        file: "apps/api/tests/evidence/bk-mf8-15.evidence-contract.js",
        pattern: "validateBKMF815Evidence",
        label: "contrato de evidence exporta validação do BK15",
    },
    {
        file: "apps/api/tests/mf8.final-contracts.test.js",
        pattern: "describe(\"BK-MF8-15 / RNF27",
        label: "teste final Vitest cobre o BK15",
    },
    {
        file: "apps/api/tests/mf8.final-contracts.test.js",
        pattern: "browser-e2e",
        label: "teste final confirma estado E2E",
    },
];

/**
 * Lê um ficheiro obrigatório a partir da raiz do projeto.
 *
 * @param {string} relativePath - Caminho relativo ao projeto.
 * @returns {string} Conteúdo do ficheiro.
 * @throws {Error} Quando o ficheiro não existe.
 */
function readRequiredFile(relativePath) {
    const absolutePath = path.join(ROOT, relativePath);

    // O smoke falha cedo para impedir que o BK-MF8-16 corra sem artefactos mínimos.
    if (!existsSync(absolutePath)) {
        throw new Error(`Ficheiro obrigatório em falta: ${relativePath}`);
    }

    return readFileSync(absolutePath, "utf8");
}

/**
 * Valida a presença dos ficheiros e padrões mínimos para o fecho da MF8.
 *
 * @returns {{files: number, patterns: number}} Resumo do smoke.
 * @throws {Error} Quando falta ficheiro ou padrão obrigatório.
 */
function runMF8FinalSmoke() {
    const contents = new Map();

    for (const file of REQUIRED_FILES) {
        contents.set(file, readRequiredFile(file));
    }

    for (const { file, pattern, label } of REQUIRED_PATTERNS) {
        const content = contents.get(file) ?? readRequiredFile(file);

        // A validação por padrões é suficiente aqui porque o teste Vitest valida a lógica.
        if (!content.includes(pattern)) {
            throw new Error(`Contrato MF8 em falta: ${label}`);
        }
    }

    return { files: REQUIRED_FILES.length, patterns: REQUIRED_PATTERNS.length };
}

const result = runMF8FinalSmoke();
console.log(`BK-MF8-15 smoke final validado: ${result.files} ficheiros e ${result.patterns} padrões.`);
```

5. Explicação do código.

`REQUIRED_FILES` lista os artefactos mínimos que o `BK-MF8-16` deve encontrar. Se um ficheiro faltar, o smoke falha com uma mensagem curta e sem dados sensíveis.

`REQUIRED_PATTERNS` valida os contratos essenciais: matriz ligada a `RNF27`, lacuna E2E registada, contrato de evidence exportado, teste Vitest presente e estado `browser-e2e` confirmado.

Este smoke é `DERIVADO` porque o projeto não tem script browser E2E. Ele não promete substituir um teste de browser real; serve para fechar a lacuna sem inventar dependências.

6. Validação do passo.

Executa:

```bash
node --check apps/web/scripts/check-mf8-final-smoke.mjs
node apps/web/scripts/check-mf8-final-smoke.mjs
```

7. Cenário negativo/erro esperado.

Se apagares temporariamente `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`, o smoke deve falhar com `Ficheiro obrigatório em falta: docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`.

### Passo 6 - Executar comandos reais e classificar E2E

1. Objetivo funcional do passo no contexto da app.

Executar os comandos existentes, recolher outputs e classificar a ausência de browser E2E como lacuna controlada ou blocker, sem inventar sucesso.

2. Ficheiros envolvidos:
    - REVER: `apps/api/package.json`
    - REVER: `apps/web/package.json`
    - REVER: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
    - LOCALIZAÇÃO: comandos de validação e secção `Evidence a recolher` da matriz.

3. Instruções do que fazer.

Executa os comandos abaixo a partir da raiz do projeto. Guarda output, diretoria, exit code e impacto na matriz. Se algum comando não existir, regista isso como lacuna; não marques como passado.

4. Código completo, correto e integrado com a app final.

```bash
node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js
npm --prefix apps/api test -- mf8.final-contracts.test.js
node --check apps/web/scripts/check-mf8-final-smoke.mjs
node apps/web/scripts/check-mf8-final-smoke.mjs
npm --prefix apps/api test
npm --prefix apps/web run build
bash scripts/validate-planificacao.sh
git diff --check
```

5. Explicação do código.

Os dois primeiros comandos validam o contrato e o teste final do BK15. Os dois comandos seguintes validam o smoke MF8. Depois corres a suite completa da API, o build web, a planificação e o diff.

Não há comando `npm --prefix apps/web run e2e` no `package.json`. Por isso, a evidence deve escrever `proof_e2e: TODO (BLOCKER) - sem script E2E/browser aprovado` se o professor exigir browser real. Se o professor aceitar smoke estático para esta PAP, guarda o output de `node apps/web/scripts/check-mf8-final-smoke.mjs`.

6. Validação do passo.

A matriz deve ficar com:

- `proof_api` preenchido;
- `proof_web_build` preenchido;
- `proof_mf8_smoke` preenchido;
- `proof_planificacao` preenchido;
- `proof_diff` preenchido;
- `proof_e2e` com comando real ou `TODO (BLOCKER)`.

7. Cenário negativo/erro esperado.

Se `npm --prefix apps/api test -- mf8.final-contracts.test.js` falhar, não avances para `BK-MF8-16`. Corrige primeiro matriz, contrato ou teste deste BK.

### Passo 7 - Preparar handoff para BK-MF8-16

1. Objetivo funcional do passo no contexto da app.

Entregar ao próximo BK uma lista objetiva de comandos, provas, lacunas e riscos para a bateria final.

2. Ficheiros envolvidos:
    - REVER: `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`
    - REVER: `apps/api/tests/mf8.final-contracts.test.js`
    - REVER: `apps/web/scripts/check-mf8-final-smoke.mjs`
    - REVER: `docs/planificacao/guias-bk/MF8/BK-MF8-16-execucao-final-de-testes-com-evidencias.md`
    - LOCALIZAÇÃO: secção `Handoff para BK-MF8-16` da matriz e secção `Evidence para PR/defesa` deste BK.

3. Instruções do que fazer.

Antes de fechar o BK, confirma que a evidence tem todos os outputs do Passo 6 e que a lacuna E2E está classificada. Depois entrega ao `BK-MF8-16` a matriz e os comandos finais.

4. Código completo, correto e integrado com a app final.

Sem código neste passo.

5. Explicação do código.

Sem código neste passo porque os ficheiros já foram criados nos passos anteriores. O foco é garantir que o handoff não é ambíguo: o próximo BK deve saber exatamente que comandos executar e que lacunas não pode esconder.

6. Validação do passo.

Executa:

```bash
rg -n "Handoff para BK-MF8-16|proof_api|proof_mf8_smoke|proof_e2e|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md
```

7. Cenário negativo/erro esperado.

Se `proof_e2e` estiver vazio, o handoff fica incompleto. Regista `TODO (BLOCKER)` ou substitui por um comando E2E real aprovado pelo professor.

#### Expected results

- `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` existe e liga `BK-MF8-15` a `RNF27`.
- `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js` valida matriz, evidence, negativos mínimos e lacuna E2E controlada.
- `apps/api/tests/mf8.final-contracts.test.js` valida caminho positivo e 3 negativos P0.
- `apps/web/scripts/check-mf8-final-smoke.mjs` valida artefactos mínimos antes da bateria final.
- O projeto distingue comando passado, falha de produto e `TODO (BLOCKER)` por falta de browser E2E real.
- O `BK-MF8-16` recebe comandos e riscos suficientes para executar a bateria final.

#### Critérios de aceite

- Entrega funcional específica de `Verificação dos testes atuais e criação dos testes em falta` validada contra `RNF27`.
- Matriz `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md` criada com BK/RF/RNF, camada, comando, estado, lacuna, negativo, risco e handoff.
- Teste `apps/api/tests/mf8.final-contracts.test.js` criado com `describe`, `it`, `expect` e 3 negativos P0.
- Smoke `apps/web/scripts/check-mf8-final-smoke.mjs` criado sem dependências novas.
- Ausência de browser E2E real registada como lacuna controlada ou `TODO (BLOCKER)`, nunca como sucesso.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- ### Matriz minima de testes por prioridade

- Testes por prioridade respeitados: `P0` exige unit + integration + e2e + 3 negativos; `P1` exige unit/integration + 2 negativos; `P2` exige teste focal + 1 negativo.
- Metadados (`owner`, `prioridade`, `dependencias`, `rf_rnf`, `sprint`, `core_or_reforco`, `proximo_bk`) sem drift.
- Evidence pronta para revisão técnica e defesa PAP.

#### Validação final

- [ ] `node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js` passa.
- [ ] `npm --prefix apps/api test -- mf8.final-contracts.test.js` passa.
- [ ] `node --check apps/web/scripts/check-mf8-final-smoke.mjs` passa.
- [ ] `node apps/web/scripts/check-mf8-final-smoke.mjs` passa.
- [ ] `npm --prefix apps/api test` passa ou falha com output registado.
- [ ] `npm --prefix apps/web run build` passa ou falha com output registado.
- [ ] `bash scripts/validate-planificacao.sh` passa.
- [ ] `git diff --check` passa.
- [ ] `proof_e2e` tem comando real aprovado ou `TODO (BLOCKER)` explícito.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- Marcadores de estrutura reconhecíveis no checklist da planificação: `## Bloco pedagogico`, `### Objetivo`, `### Pre-requisitos`, `### Erros comuns`, `### Check de compreensao`, `## Bloco operacional`, `### Entrada`, `### Passos`, `### Validacao`, `### Handoff`, `## Criterios de aceite`, `## Evidence para PR/defesa`.

#### Evidence para PR/defesa

- `proof_contrato`: output de `rg -n "RNF27|BK-MF8-15|BK-MF8-16|unit \\+ integration \\+ e2e" ...`.
- `proof_matriz`: output de `rg -n "BK-MF8-15|RNF27|TODO \\(BLOCKER\\)" docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`.
- `proof_contrato_evidence`: output de `node --check apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`.
- `proof_teste_final`: output de `npm --prefix apps/api test -- mf8.final-contracts.test.js`.
- `proof_mf8_smoke`: output de `node apps/web/scripts/check-mf8-final-smoke.mjs`.
- `proof_api`: output de `npm --prefix apps/api test`.
- `proof_web_build`: output de `npm --prefix apps/web run build`.
- `proof_planificacao`: output de `bash scripts/validate-planificacao.sh`.
- `proof_diff`: output de `git diff --check`.
- `proof_e2e`: comando E2E real aprovado ou `TODO (BLOCKER)` com motivo.
- `proof_handoff`: nota curta a explicar como `BK-MF8-16` consome a matriz e os comandos.

#### Handoff

Para o `BK-MF8-16`, entrega:

1. matriz `docs/evidence/MF8/TESTES-ATUAIS-E-LACUNAS.md`;
2. contrato `apps/api/tests/evidence/bk-mf8-15.evidence-contract.js`;
3. teste `apps/api/tests/mf8.final-contracts.test.js`;
4. smoke `apps/web/scripts/check-mf8-final-smoke.mjs`;
5. outputs dos comandos do Passo 6;
6. estado explícito de `proof_e2e`;
7. lista de lacunas que seguem como `passou`, `falhou_por_produto` ou `bloqueado_por_ambiente_ou_ferramenta`.

O `BK-MF8-16` não deve inventar novos critérios de cobertura. Deve executar a bateria final com base nesta matriz, anexar evidence objetiva e preparar o `BK-MF8-17` apenas para erros realmente encontrados.

#### Changelog

| Data | Alteração |
| --- | --- |
| 2026-07-03 | Corrigido para criar matriz completa de testes/lacunas, contrato de evidence, teste final Vitest, smoke estático MF8, classificação honesta da ausência de browser E2E e handoff executável para `BK-MF8-16`. |
| 2026-06-30 | Guia revisto para a estrutura tutorial MF8, com caminhos públicos `apps/...`, contrato de evidence, negativos mínimos e handoff explícito. |
