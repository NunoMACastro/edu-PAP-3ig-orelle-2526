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
- `last_updated`: `2026-07-11`

> **Contrato vigente:** cada falha do BK16 é corrigida individualmente, reexecutando primeiro o teste afetado e depois todos os gates cujo contrato foi tocado. A evidence é append-only. O fecho exige zero P0/P1 aberto; P2 só pode ficar validado ou bloqueado por dependência externa demonstrada.

#### Objetivo

Corrigir os findings atuais sem refactors não relacionados, repetir a validação proporcional ao risco e fechar a MF8 com uma reauditoria independente.

#### Importância

Uma suite verde depois de várias alterações não explica qual causa raiz foi removida. O ciclo finding → correção → teste focado → regressão permite defender tecnicamente cada decisão e evita “corrigir” sintomas.

#### Scope-in

- Confirmar reprodução e causa raiz.
- Marcar o finding em implementação antes de editar.
- Aplicar a menor correção correta.
- Atualizar ou criar teste de regressão.
- Reexecutar teste focado e gates afetados.
- Reabrir findings fechados quando o contrato voltar a ser tocado.
- Executar reauditoria integral independente.
- Fechar com risco residual explícito.

#### Scope-out

- Não alterar `apps/` fora dos ficheiros necessários ao finding.
- Não apagar evidence falhada.
- Não transformar falha ambiental em sucesso.
- Não ligar à base remota.
- Não criar commits sem autorização.
- Não aceitar P0/P1 por conveniência.

#### Estado antes e depois

- Antes: a bateria final produziu findings ou blockers.
- Depois: cada finding tem causa, alteração, teste e decisão; a execução final é repetida sobre o estado corrigido.

#### Pre-requisitos

- Evidence do BK16 completa.
- Findings com ID, severidade, comando e reprodução.
- Worktree inspecionada para preservar alterações alheias.
- Backup local recuperável e invariantes do catálogo.

#### Glossário

- **Causa raiz:** condição que produz a falha, não apenas a mensagem observada.
- **Teste de regressão:** teste que falha antes e passa depois da correção.
- **Reaberto:** finding anteriormente fechado cujo contrato voltou a mudar.
- **Risco residual:** consequência ainda possível depois da correção.
- **Reauditoria independente:** nova leitura do sistema, não só repetição do teste escrito.

#### Conceitos teóricos essenciais

O tamanho do reteste depende do raio de impacto. Alterar um validator pede unitários e contratos; alterar transações pede integração; alterar rotas/páginas pede E2E e Axe; alterar dependências pede build e audit.

Resultados anteriores permanecem no registo para mostrar progresso. O reteste acrescenta uma entrada com novo instante e exit code.

#### Arquitetura do BK

Estados recomendados por finding:

`ABERTO → EM_ANALISE → PLANEADO → EM_IMPLEMENTACAO → PRONTO_PARA_RETESTE → VALIDADO → FECHADO`

Estados laterais:

`BLOQUEADO_EXTERNO`, `REABERTO`, `ACEITE_RISCO`, `RESOLVIDO_POR_DECISAO_DE_ESCOPO`.

#### Ficheiros a criar/editar/rever

- REVER: ficheiros `apps/api` ou `apps/web` estritamente ligados ao finding.
- REVER: teste que reproduz a falha.
- REVER: `docs/evidencias/MF8/EXECUCAO-FINAL-TESTES.md`
- CRIAR/REVER: `docs/evidencias/MF8/CORRECOES-E-RETESTES.md`
- REVER: matriz RF/RNF → runtime → teste quando o contrato mudar.

#### Tutorial técnico linear

### Passo 1 - Classificar e reproduzir

Separa falha de produto, teste obsoleto e blocker ambiental. Regista o comando mínimo que reproduz. Não edites código enquanto a causa ainda for uma hipótese sem prova.

### Passo 2 - Atualizar estado e plano do finding

Documenta comportamento observado/esperado, causa raiz, ficheiros, risco e testes. Muda para `EM_IMPLEMENTACAO` antes da primeira edição.

### Passo 3 - Aplicar a correção mínima

Respeita arquitetura existente, validação, ownership e transações. Não enfraqueças o teste para fazê-lo passar. Protege catálogo, consentimentos, snapshots e pagamento simulado.

### Passo 4 - Criar ou ajustar regressão

O teste deve falhar pela causa original e passar apenas com a correção. Inclui um negativo material. Para concorrência/persistência, usa replica set em vez de mocks.

### Passo 5 - Reexecutar por raio de impacto

Começa pelo teste focado. Depois executa a suite do pacote, build e contratos relacionados. Se tocares fluxo, paywall, revisão ou imagem, repete E2E e Axe. Se tocares migrations, repete invariantes do catálogo.

### Passo 6 - Reabrir contratos afetados

Qualquer alteração posterior a um campo, endpoint ou estado reabre os findings que o validaram. Atualiza documentação canónica apenas depois de o runtime estabilizar.

### Passo 7 - Executar cenários negativos obrigatórios (mínimo 3)

1. Forçar novamente a condição original e provar que o teste de regressão a deteta.
2. Simular rollback no ponto alterado e confirmar ausência de estado parcial.
3. Repetir uma ação concorrente e confirmar idempotência ou `409`.
4. Fazer o gate final falhar deliberadamente com contrato proibido e confirmar que o fecho é recusado.

#### Expected results

- Cada falha tem causa e teste de regressão.
- Zero P0/P1 permanece aberto.
- P2 tem decisão e evidência atual.
- Catálogo e dados privados permanecem protegidos.
- Todos os gates verdes pertencem ao mesmo estado do código.
- Reauditoria não encontra contratos sintéticos ou integrações financeiras.

#### Critérios de aceite

- Findings fechados individualmente, nunca em lote.
- Testes focados e regressões afetadas executados.
- Evidence falhada preservada.
- Reauditoria independente concluída.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: focado, suite afetada, integração/E2E proporcional e gate integral.

### Matriz minima de testes por prioridade

| Prioridade | Alteração | Reteste mínimo |
|---|---|---|
| P0 | Transação, auth, paywall, privacidade | focado + integração + suite + E2E |
| P0 | Sessão/job/provider | focado + worker/restart + suite + E2E |
| P1 | UI/acessibilidade | componente + build + E2E + Axe |
| P1 | Docs/config/deps | validator + links + audit + gate integral |

#### Validação final

- [ ] Nenhum finding está em estado intermédio sem justificação.
- [ ] Zero P0/P1 aberto.
- [ ] P2 validado ou bloqueado externamente com tentativa real.
- [ ] Catálogo conserva IDs e stock.
- [ ] Pagamento é exclusivamente simulado e voucher transacional.
- [ ] Negativos: mínimo `3` cenários.
- [ ] Reauditoria independente registada.

#### Evidence para PR/defesa

- Por finding: causa, patch, teste antes/depois e risco residual.
- Comando, CWD, data, exit code e resumo sanitizado.
- Baseline/hashes do estado final.
- Decisão `CONCLUIDO` ou `CONCLUIDO_COM_BLOCKERS_EXTERNOS`.

#### Handoff

Este é o BK terminal da MF8. O resultado é entregue à defesa/manutenção com report final, matriz de cobertura e blockers externos identificados; não existe avanço implícito para outro BK.

## Bloco pedagogico

### Objetivo

Aprender a corrigir por causa raiz e a escolher retestes pelo risco.

### Pre-requisitos

Rever debugging, testes de regressão, impacto transacional e leitura de logs.

### Erros comuns

- Alterar vários módulos antes de reproduzir.
- Apagar a falha antiga da evidence.
- Executar só o teste que acabou de ser escrito.
- Fechar vários findings com uma única frase.

### Check de compreensao

1. Quando um finding deve ser reaberto?
2. Que alteração exige repetir E2E?
3. Como se distingue blocker de falha de produto?

## Bloco operacional

### Entrada

Findings reproduzíveis e evidence integral do BK16.

### Passos

Classificar, reproduzir, corrigir, testar, reabrir impactos e reauditar.

### Validacao

Executar testes focados, gates afetados e `verify:all` no estado final.

### Handoff

Encerrar a MF8 apenas com decisão e risco residual documentados.

## Criterios de aceite

- Zero P0/P1 aberto.
- Correções com regressão e reteste proporcional.
- Bloqueios externos honestos e evidence preservada.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Apresentar um finding completo desde a reprodução até ao fecho e o quadro final da reauditoria.

## Snippet tecnico aplicavel

```js
export function canCloseMf8(findings) {
    return findings.every((finding) =>
        ["FECHADO", "VALIDADO", "BLOQUEADO_EXTERNO", "ACEITE_RISCO"].includes(
            finding.status,
        ),
    ) && findings.every(
        (finding) =>
            !["P0", "P1"].includes(finding.severity) ||
            ["FECHADO", "VALIDADO"].includes(finding.status),
    );
}
```

#### Changelog

- `2026-07-11`: fecho atualizado para a arquitetura OpenAI-only e para retestes de jobs, relatório v2, revisão, unlock 10%+voucher, makeup, privacidade e backup.
