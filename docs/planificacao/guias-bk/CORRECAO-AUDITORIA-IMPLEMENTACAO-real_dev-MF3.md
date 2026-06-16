# Correcao da auditoria de implementacao real_dev MF3 - Orelle

## Metadados

- Projeto: `Orelle`
- Macrofase alvo: `MF3`
- Modo executado: `corrigir_auditoria`
- Implementation root: `real_dev`
- Fonte da auditoria: `docs/planificacao/guias-bk/AUDITORIA-IMPLEMENTACAO-real_dev-MF3.md`
- Data da correcao: `2026-06-15`
- BKs abrangidos: `BK-MF3-03`, `BK-MF3-08`
- Severidades corrigidas: `P1`
- P3 incluido: `nao`
- Commits: `nao realizados`

## Sumario executivo

Foram corrigidos os dois findings `P1` confirmados na auditoria MF3:

1. `ORELLE-MF3-BK03-P1-001`: Stripe sem configuracao ja nao cria encomenda, nao chama o provider de pagamento e nao limpa carrinho. O checkout falha com `503` antes de qualquer mutacao persistente.
2. `ORELLE-MF3-BK08-P1-001`: a atualizacao automatica de stock apos pagamento passou a correr dentro de transacao MongoDB, com pre-validacao de stock, agrupamento de linhas duplicadas e protecao contra aplicacao duplicada.

Depois das correccoes, a suite completa da API passou fora do sandbox: `15` ficheiros de teste e `116` testes.

## Findings corrigidos

| Finding | Severidade | Estado final | Evidencia principal |
| --- | --- | --- | --- |
| `ORELLE-MF3-BK03-P1-001` | `P1` | `CORRIGIDO` | `assertPaymentGatewayReady` em `payment.provider.js` e chamada antes de `Order.create` em `order.service.js` |
| `ORELLE-MF3-BK08-P1-001` | `P1` | `CORRIGIDO` | `applyOrderStockUpdate` com `mongoose.startSession()` e `session.withTransaction()` |

Nao foram encontrados findings `P0` nesta fase. Nao foram corrigidos findings `P3`, conforme `INCLUIR_P3: nao`.

## Correcao BK-MF3-03

### Problema original

Quando `STRIPE_SECRET_KEY` nao estava configurada, o fluxo Stripe devolvia estado stub `requires_payment`, criava uma encomenda `201` e limpava o carrinho, apesar de nao existir sessao Stripe real. Isto contrariava o guia `BK-MF3-03`, que espera falha controlada `503` antes da criacao da encomenda.

### Alteracoes aplicadas

- `real_dev/api/src/providers/payment.provider.js`
  - Adicionada `assertPaymentGatewayReady(gateway)`.
  - Stripe sem `env.stripeSecretKey` passa a lancar `AppError(503, "Stripe nao esta configurado")`.
  - `createStripeCheckoutSession` tambem falha com `503` caso seja invocada sem chave, mantendo defesa em profundidade.
- `real_dev/api/src/services/order.service.js`
  - `checkoutMyCart` chama `assertPaymentGatewayReady(input.gateway)` depois de confirmar que o carrinho existe e antes de consultar produtos, criar `Order`, iniciar pagamento ou limpar carrinho.
- `real_dev/api/tests/mf3.integration.test.js`
  - Adicionado teste negativo que confirma `503`, ausencia de `Order.create`, ausencia de `Product.find` e ausencia de `Cart.deleteOne`.
  - O teste de checkout stub passou a usar `mbway`, mantendo cobertura de PayPal/MBWay como gateways manuais sem depender da ausencia de Stripe.

### Estado final

`CORRIGIDO`. O fluxo Stripe sem configuracao cumpre o contrato esperado: falha cedo, de forma controlada, sem criar encomenda nem limpar carrinho.

## Correcao BK-MF3-08

### Problema original

`applyOrderStockUpdate` reduzia stock sem transacao e sem garantia de rollback atomico. Em encomendas com multiplos produtos, uma falha a meio podia deixar stock parcialmente reduzido. A funcao tambem nao tinha cobertura dedicada para atomicidade, duplicacao ou preflight de stock.

### Alteracoes aplicadas

- `real_dev/api/src/services/stock.service.js`
  - Adicionada sessao MongoDB com `mongoose.startSession()`.
  - `applyOrderStockUpdate(orderId)` passa a executar dentro de `session.withTransaction(...)`.
  - A encomenda e lida com `.session(session)`.
  - A funcao bloqueia encomendas inexistentes, pagamentos nao `paid` e encomendas ja aplicadas com `stockReserved`.
  - Linhas da mesma encomenda sao agrupadas por produto antes da reducao.
  - Existe pre-validacao transacional de todos os produtos antes de qualquer `$inc`.
  - Cada reducao usa filtro atomico `{ _id, stock: { $gte: quantity } }`.
  - `order.save({ session })` marca `stockReserved: true` na mesma transacao.
  - `session.endSession()` corre sempre em `finally`.
- `real_dev/api/tests/mf3.integration.test.js`
  - Adicionados testes para pagamento nao confirmado, transacao aplicada, agrupamento de linhas duplicadas, nao duplicacao quando `stockReserved: true` e falha de preflight sem reduzir produtos anteriores.

### Estado final

`CORRIGIDO`. A atualizacao automatica de stock passa a ter comportamento atomico ao nivel da transacao MongoDB e cobertura dedicada para os cenarios de maior risco.

## Coerencia MF2 -> MF3 -> MF4

- `MF2 -> MF3`: `CUMPRE`. O smoke MF2 continua a passar e a correcao nao altera recomendacoes, rotinas, simulacoes ou contratos MF2.
- `MF3`: `CUMPRE_APOS_CORRECAO`. Os dois pontos que impediam `AUDITADO_OK` em `BK-MF3-03` e `BK-MF3-08` foram corrigidos e cobertos por testes.
- `MF3 -> MF4`: `CUMPRE`. O contrato de `Order` para historico/dashboard/notificacoes futuras foi preservado, e `stockReserved` ficou mais seguro para consumo posterior por MF4.

## Ficheiros alterados

- `real_dev/api/src/providers/payment.provider.js`
- `real_dev/api/src/services/order.service.js`
- `real_dev/api/src/services/stock.service.js`
- `real_dev/api/tests/mf3.integration.test.js`
- `docs/planificacao/guias-bk/CORRECAO-AUDITORIA-IMPLEMENTACAO-real_dev-MF3.md`

## Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `node --check real_dev/api/tests/mf3.integration.test.js` | `PASS` |
| `node --check real_dev/api/src/services/stock.service.js` | `PASS` |
| `node --check real_dev/api/src/providers/payment.provider.js` | `PASS` |
| `node --check real_dev/api/src/services/order.service.js` | `PASS` |
| `npm --prefix real_dev/api test -- tests/mf3.integration.test.js` | `PASS`: `18` testes MF3 |
| `npm --prefix real_dev/api test` | `PASS`: `15` ficheiros, `116` testes, executado fora do sandbox apos falha de sockets no sandbox |
| `npm --prefix real_dev/web run build` | `PASS` |
| `npm --prefix real_dev/web run smoke:mf2` | `PASS` |
| `bash scripts/validate-planificacao.sh` | `PASS`: `overall_pass: true` |
| `git diff --check` | `PASS` |

## Validacoes nao executadas

- Nao foi executado E2E browser MF3 com backend real ligado. A prompt pediu correcao de auditoria com comandos locais e a cobertura API especifica passou.
- Nao foi feito teste real contra Stripe externo. O finding era especificamente a ausencia de configuracao local; a correcao validada garante falha `503` antes de mutacoes quando nao existe chave.

## Blockers e TODOs

- Sem blockers tecnicos para os dois findings `P1` corrigidos.
- TODO futuro, fora do escopo desta correcao: validar o fluxo Stripe real com `STRIPE_SECRET_KEY` e ambiente de teste Stripe quando essas credenciais estiverem disponiveis.

## Recomendacao

Classificar os findings `ORELLE-MF3-BK03-P1-001` e `ORELLE-MF3-BK08-P1-001` como `CORRIGIDO` e usar este relatorio como anexo tecnico da auditoria MF3.
