# Plano de correção da auditoria completa - `real_dev`

> **Documento histórico superseded no contrato de IA.** O trabalho concluído neste plano permanece como evidência da auditoria anterior; a arquitetura OpenAI-only, a consulta dinâmica e a evidência atual estão no [plano vivo da consulta cosmética OpenAI](PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md). As referências abaixo a `demo`/`external` não são configuração atual.

## Metadados

- `audit_id`: `ORELLE-AUDITORIA-COMPLETA-2026-07-09`
- `data_inicio`: `2026-07-09`
- `data_fim`: `2026-07-10`
- `agente_coordenador`: `Codex /root`
- `estado_global`: `CONCLUIDO_COM_BLOCKERS_EXTERNOS`
- `implementation_root`: `real_dev`
- `fora_de_scope`: `apps/`, MongoDB remota, pagamentos reais, commits
- `regra_pagamento`: pagamento exclusivamente simulado, método único, sem transação financeira ou provider externo
- `regra_ia`: modo `demo` explicitamente identificado; `openai`/`external` sem fallback silencioso
- `alvo_operacional`: académico/local
- `node`: `v24.11.1`
- `npm`: `11.6.2`
- `git_head_docs`: `c71b23291fea4e02c394187ae82786f644125c00`
- `api_package_lock_sha256`: `043baf15c773fbc61859a975a16ce56848f7bf75df80e7b947f6bba087c85b73`
- `web_package_lock_sha256`: `f26682d548a78a60180c34bcdc043e6a6bb19cdbd055e2c1732dd302d0c0bac2`
- `api_package_sha256`: `ccbd9cb54cd32bec293b62646e5aa44ca9eff05dfd2eb51ae282fbfd7928bd7a`
- `web_package_sha256`: `70d0dcf76a2c5ecdd6eac6d1dc4b6fc506a87e84568015a4b2f3147f614f6a42`
- `baseline_api_package_lock_sha256`: `e62aa2710c2495f9272d5a8a6ba086eefad340f24429c751d3a01ffee0c2f12c`
- `baseline_web_package_lock_sha256`: `9d411d1dc6f84a8d4e7c36dc7c8efb66056ed4676ee47f56b87c468902fe2820`
- `nota_git`: `real_dev/` está ignorado por `.gitignore:2`; o presente report em `docs/` é o artefacto durável

## Regras de acompanhamento obrigatório

1. Ler este report no início de cada turno e depois de qualquer compactação de contexto.
2. Atualizar um finding para `EM_IMPLEMENTACAO` antes de alterar o respetivo código.
3. Registar alterações e validações imediatamente; não substituir falhas antigas.
4. Registar data, CWD, comando, exit code e resumo sanitizado, nunca segredos, cookies, PII, biometria ou URIs MongoDB.
5. Um finding só fecha com critério de aceitação, teste positivo, negativo material e evidência atual.
6. Se uma alteração posterior tocar num finding fechado, reabri-lo e repetir os testes.
7. Falhas ambientais ficam `BLOQUEADO_EXTERNO`, nunca `PASS`.
8. Apenas o coordenador edita este report. Subagentes entregam evidência ao coordenador.
9. Nunca tocar em `apps/`, nunca ligar à MongoDB remota e nunca criar commits sem autorização.
10. O estado global só pode ser `CONCLUIDO` depois de reauditoria integral independente.

Estados normais: `ABERTO -> EM_ANALISE -> PLANEADO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO -> FECHADO`.

Estados laterais: `BLOQUEADO_EXTERNO`, `REABERTO`, `ACEITE_RISCO`, `RESOLVIDO_POR_DECISAO_DE_ESCOPO`.

## Baseline inicial

| Verificação | Estado inicial | Evidência |
| --- | --- | --- |
| Suite API | `PASS` histórico atual | 42 ficheiros / 311 testes fora da sandbox; rerun obrigatório no fecho |
| Build web | `PASS` histórico atual | 95 módulos; rerun obrigatório após alterações |
| Smokes web | `PASS` histórico atual | 12 scripts, maioritariamente estáticos |
| Planificação | `PASS` histórico atual | 44 RF, 31 RNF, 74 BK/guias |
| E2E browser | `LACUNA` | sem runner aprovado no estado inicial |
| Mockup | `BLOQUEADO_EXTERNO` | árvore `mockup/` ausente; não inventar evidência |
| Dependências API | `FAIL` | Multer 2.1.1 com advisory high no baseline |
| Dependências web | `FAIL` | Vite/esbuild com advisories high/moderate no baseline |
| Mongo local isolada | `LACUNA` | Docker e ferramentas Mongo ausentes; será usado `MongoMemoryReplSet` |

## Dashboard de findings

| ID | Severidade | Tema | Fase | Estado | Gate |
| --- | --- | --- | ---: | --- | --- |
| `ORELLE-AUD-P1-001` | P1 | Pagamento, stock, carrinho, logística e retorno | 2 | `VALIDADO` | G2 |
| `ORELLE-AUD-P1-002` | P1 | Duplo consumo de voucher | 2 | `VALIDADO` | G2 |
| `ORELLE-AUD-P1-003` | P1 | Bundle aponta para localhost | 1 | `VALIDADO` | G1 |
| `ORELLE-AUD-P1-004` | P1 | Eliminação, anonimização, conta e consentimento | 3 | `VALIDADO` | G3 |
| `ORELLE-AUD-P1-005` | P1 | Baseline IA apresentada como análise real | 4 | `VALIDADO` | G4 |
| `ORELLE-AUD-P1-006` | P1 | Consulta guiada desligada de recomendações/revisão | 4 | `VALIDADO` | G4 |
| `ORELLE-AUD-P1-007` | P1 | Perfil recorrente e navegação | 5 | `VALIDADO` | G5 |
| `ORELLE-AUD-P1-008` | P1 | Backup não recuperável | 7 | `VALIDADO` | G7 |
| `ORELLE-AUD-P1-009` | P1 | Rate limits, quotas, retenção e Multer | 1/3 | `VALIDADO` | G1/G3 |
| `ORELLE-AUD-P1-010` | P1 | CSV Formula Injection | 3 | `VALIDADO` | G3 |
| `ORELLE-AUD-P1-011` | P1 | Imagens pesadas e budget enganador | 6 | `VALIDADO` | G6 |
| `ORELLE-AUD-P2-001` | P2 | Leituras de consultor não auditadas | 4 | `VALIDADO` | G4 |
| `ORELLE-AUD-P2-002` | P2 | Dados sensíveis derivados em claro | 3 | `VALIDADO` | G3 |
| `ORELLE-AUD-P2-003` | P2 | Fairness baseada em denylist | 4 | `VALIDADO` | G4 |
| `ORELLE-AUD-P2-004` | P2 | Regeneração apaga correções humanas | 4 | `VALIDADO` | G4 |
| `ORELLE-AUD-P2-005` | P2 | Escritas multi-documento não atómicas | 2/3/4 | `VALIDADO` | G2/G3/G4 |
| `ORELLE-AUD-P2-006` | P2 | Timeout não cancela trabalho | 1 | `VALIDADO` | G1 |
| `ORELLE-AUD-P2-007` | P2 | Sessões, CSRF, proxy e headers | 1 | `VALIDADO` | G1 |
| `ORELLE-AUD-P2-008` | P2 | EXIF e normalização de imagens | 3 | `VALIDADO` | G3 |
| `ORELLE-AUD-P2-009` | P2 | Maquilhagem/comparação não usam imagens | 4/5 | `VALIDADO` | G4/G5 |
| `ORELLE-AUD-P2-010` | P2 | Cliente HTTP, erros, abort e races | 1/5 | `VALIDADO` | G1/G5 |
| `ORELLE-AUD-P2-011` | P2 | UIs admin, IDs técnicos e formulários | 5 | `VALIDADO` | G5 |
| `ORELLE-AUD-P2-012` | P2 | Acessibilidade, tema e responsive | 6 | `VALIDADO` | G6 |
| `ORELLE-AUD-P2-013` | P2 | Configuração, readiness e shutdown | 1/7 | `VALIDADO` | G1/G7 |
| `ORELLE-AUD-P2-014` | P2 | Testes frontend/E2E/browser | 7 | `VALIDADO` | G7 |
| `ORELLE-AUD-P2-015` | P2 | Migrações, observabilidade e retenção | 1/7 | `VALIDADO` | G1/G7 |
| `ORELLE-AUD-P2-016` | P2 | Dependências e runtime | 1/7 | `VALIDADO` | G1/G7 |
| `ORELLE-AUD-P3-001` | P3 | Enumeração, corrida de registo e password | 1 | `VALIDADO` | G1 |
| `ORELLE-AUD-P3-002` | P3 | Seeds e PDF inválido | 3 | `VALIDADO` | G3 |
| `ORELLE-AUD-P3-003` | P3 | Evidência e mockup desatualizados | 0/7 | `ACEITE_RISCO` | G0/G7 |
| `ORELLE-AUD-P3-004` | P3 | Títulos, copy, splitting e acabamento | 5/6 | `VALIDADO` | G5/G6 |
| `ORELLE-AUD-P3-005` | P3 | Segredos e scope local | 0/7 | `BLOQUEADO_EXTERNO` | G0/G7 |

## Fichas dos findings

### `ORELLE-AUD-P1-001` - Pagamento, stock, carrinho, logística e retorno

- Observado: sessão externa incompleta, carrinho/voucher consumidos cedo, stock sem caller e retorno 404.
- Esperado: checkout pendente + pagamento simulado atómico e idempotente; logística só após `simulated_paid`.
- Dependências: Mongo replica set, migração 001/002, P1-002 e P2-005.
- Testes: ownership, sucesso, falha, replay, concorrência, stock/voucher/carrinho e transições admin.
- Alterações realizadas: removido o provider financeiro e criado o fluxo `awaiting_simulation -> simulated_paid|simulated_failed`; o checkout já não consome recursos; a simulação revalida owner, carrinho, preços, stock e voucher e executa as mutações numa transação; logística passou a exigir `simulated_paid` e transições ordenadas. O frontend já apresenta resumo + botão `Simular pagamento`, aviso académico permanente e `Idempotency-Key` estável, sem gateways, URL ou redirects. O backend guarda um histórico interno de tentativas com hash e snapshot público: a mesma chave reproduz sucesso ou falha, uma chave nova pode repetir apenas depois de falha e uma chave diferente após pagamento recebe 409.
- Evidência intermédia: validação sintática, 18/18 testes unitários/de contrato, 22/22 MF3 e 6/6 testes num replica set real efémero. Estes últimos provam 25 checkouts/pagamentos concorrentes com replay igual e rollback após cada um dos cinco pontos transacionais. Migrações 001/002 e reauditoria independente continuam pendentes.
- Evidência final: frontend de dois passos 8/8 + gate estático/build; backend unit/contract 18/18 e MF3 22/22; replica set 6/6 para 25 pedidos e cinco rollbacks; migrations 001/002 em replica set 4/4 para dry-run, conversão sem promoção, voucher comprovado, replay, checksum, lock e rollback. Suite API integral anterior ficou 364/364 e será repetida no fecho da fase em curso.
- Reabertura atual: o teste de 25 pedidos terminava todos os checkouts antes de iniciar os pagamentos. Uma reprodução intercalada confirmou que `checkoutMyCart` pode ler uma encomenda pendente, o pagamento confirmar transacionalmente e o `order.save()` atrasado voltar a persistir `payment.status=awaiting_simulation`. Stock, voucher, tentativa e carrinho ficam no estado pago, mas a encomenda deixa de estar logisticamente elegível.
- Plano da correção: substituir o save documental por compare-and-set limitado a estados não terminais; quando o CAS perde a corrida, recarregar o estado atual e devolver o pago/replay seguro ou conflito, nunca reverter `simulated_paid`. Acrescentar uma barreira determinística que intercala checkout e pagamento no replica set.
- Evidência da correção: checks sintáticos e o conjunto checkout/MF3/replica-set passaram 3 ficheiros e 37/37 testes. O caso novo confirmou pagamento durante a pausa do CAS, checkout tardio a devolver `simulated_paid`, efeitos exatamente uma vez e replay igual; o mesmo ficheiro repetiu 25 pedidos e os cinco pontos de rollback.
- Fecho final: o `verify:all` de 25 gates repetiu a suite API integral e o journey E2E de checkout/pagamento simulado/replay no estado final, sem qualquer I/O financeiro externo.
- Risco residual: a suite API integral no estado posterior ao patch e a reauditoria final ainda podem reabrir; pagamentos continuam exclusivamente simulados.
- Reauditoria final independente: o desbloqueio de relatório mantém um segundo pagamento simulado sem `Idempotency-Key`, transação ou aviso único; report/unlock/voucher usam find-then-create/read-save e podem duplicar ou confirmar parcialmente. O contrato será unificado como “Pagamento simulado”, com CAS/transação/idempotência e concorrência/failure injection.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-002` - Duplo consumo de voucher

- Observado: preview concorrente e consumo nulo ignorado.
- Esperado: voucher consumido exatamente uma vez dentro da transação; conflito causa rollback 409.
- Dependências: P1-001.
- Testes: 25 pagamentos concorrentes, gateways removidos, replay da mesma chave.
- Alterações realizadas: consumo passou a compare-and-set transacional, exige sucesso quando existe desconto e usa `appliedOrderIds` como barreira idempotente; falha provoca rollback.
- Evidência final: teste em `MongoMemoryReplSet` com 25 pedidos concorrentes devolveu um único checkout/snapshot; voucher ficou com um único `appliedOrderIds`, foi debitado uma vez, stock reduziu uma vez, carrinho foi apagado e o replay permaneceu byte-equivalente no DTO. Testes do provider confirmam ausência de I/O financeiro externo.
- Risco residual: reauditoria G7 ainda pode reabrir o finding; a migração de dados legados pertence a P1-001/P2-015 e não volta a consumir vouchers sem prova em `appliedOrderIds`.
- Estado: `VALIDADO` (`EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-003` - Bundle aponta para localhost

- Observado: fallback `127.0.0.1` incorporado no bundle.
- Esperado: base `/api` e proxy Vite apenas em desenvolvimento; bundle sem loopback.
- Dependências: cliente HTTP P2-010.
- Testes: build + pesquisa em `dist` + pedido via proxy local.
- Alterações realizadas: cliente web passou a usar exclusivamente `/api`; Vite encaminha esse prefixo para loopback apenas no servidor de desenvolvimento; defaults visuais usam `window.location.origin`; configuração por `VITE_API_BASE_URL` foi removida.
- Evidência intermédia: build de 96 módulos e gate estático G1 passaram no handoff; revalidação coordenada ainda pendente.
- Revalidação atual parcial: `npm run check:g1-config` em `real_dev/web`, exit code 0; confirmou Node 24.11.1, `/api` same-origin e três artefactos de runtime sem loopback. Build/scan atual ainda pendentes.
- Build atual: `npm run build`, exit code 0 com Vite 8.1.4, 83 módulos e JS inicial de 82,66 KiB gzip; o scan direto do `dist` ainda está pendente.
- Scan do build: pesquisa por `localhost`, `127.0.0.1`, `0.0.0.0` e `VITE_API_BASE_URL` em `dist` terminou com exit code 1 esperado e zero matches.
- Alteração de prova: o target Vite continua estritamente local, mas aceita uma origin loopback dinâmica apenas no servidor de desenvolvimento, validada sem credenciais/path/query; foi criado `test:g1-dev-proxy` para arrancar backend/Vite em portas efémeras e provar um pedido `/api`. Checks/execução ainda pendentes.
- Checks sintáticos do config e do probe de proxy: ambos com exit code 0; execução HTTP ainda pendente.
- Prova HTTP: `npm run test:g1-dev-proxy`, fora da sandbox; exit code 0. Um backend e um Vite efémeros em loopback confirmaram que o pedido same-origin `/api/proxy-probe` chegou ao backend com o mesmo path. Falta apenas o negativo de target remoto antes de validar o finding.
- Negativo do proxy: importar `vite.config.js` com `VITE_API_PROXY_TARGET=https://example.com` terminou com exit code 1 esperado e recusou a origin por não ser HTTP loopback, antes de qualquer pedido. O build final após esta alteração ainda será repetido antes da mudança de estado.
- Build pós-proxy: `npm run build`, exit code 0; Vite 8.1.4 transformou 83 módulos e manteve JS inicial em 82,66 KiB gzip. Gate/scan final ainda pendentes.
- Evidência final: build pós-alteração com 83 módulos/82,66 KiB gzip; gate atual confirmou `/api` e três artefactos sem loopback; scan direto teve zero matches; proxy real em duas portas efémeras encaminhou `/api/proxy-probe`; target remoto foi recusado antes de I/O.
- Risco residual: o proxy existe apenas no servidor de desenvolvimento e aceita exclusivamente origin HTTP loopback; reauditoria G7 pode reabrir o contrato.
- Estado: `VALIDADO` (`EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-004` - Privacidade, consentimento e conta

- Observado: estados lógicos retêm bytes/ownership; sem revogação/autoeliminação; conta apagada reativável.
- Esperado: jobs idempotentes, bytes ausentes antes de `completed`, consentimento revogável e conta terminal.
- Dependências: upload normalizado, sessões opacas, migrations 003/004/005.
- Testes: filesystem, cascade de coleções, concorrência, retry e autenticação recusada.
- Causa raiz confirmada: o fluxo atual apenas troca `status`/`privacyStatus`, conserva `storageKey` e bytes, não expõe GET/revogação de consentimento nem listagem do próprio pedido/retry canónico, e não possui eliminação terminal de conta com revogação/cascade.
- Evidência atual: core integrado 56/56 e outbox/migration 17/17, consentimento concorrente 2/2, UI estática 37/37 no conjunto anterior e suite API integral atual 479/479. Ficheiros são confirmados `ENOENT`, jobs concluídos não retêm owner/path/token, conta é terminal, sessões são revogadas e 004 está no registry.
- Risco residual: falta o E2E browser do pedido/admin/eliminação e reauditoria independente; nenhum dado remoto foi tocado.
- Reauditoria final independente: falta uma write barrier entre upload e revogação/pedido/eliminação de conta; um upload autorizado antes do tombstone pode persistir depois e o finalize pode apagar metadata nova sem enfileirar os bytes. A UI também não oferece a revogação já suportada pela API. Serão exigidos CAS/generation no commit, captura de stragglers, reclaim dos jobs antigos e E2E de revogação.
- Evidência pós-correção da barreira: upload, revogação, pedido e eliminação terminal escrevem o mesmo documento `User` dentro das respetivas transações; os interleavings determinísticos confirmaram revogação vencedora sem stragglers, upload vencedor posteriormente capturado pelo pedido, account-vs-upload com retry transacional e reclaim de job antigo. Os conjuntos focais passaram 12/12, 5/5 e, depois da 009, o reteste integrado passou 14/14; falta a suite/E2E no estado final.
- Evidência browser final deste ciclo: a matriz ampliada passou 30/30 casos aplicáveis e manteve 12 skips intencionais fora do Chromium. O retry administrativo confirmou `completed`, tentativa 2 e recurso ausente por 404; a eliminação terminal mostrou a confirmação acessível, revogou a sessão (`/auth/me` 401) e recusou nova autenticação da conta eliminada (401). O orquestrador aplicou as nove migrações numa base efémera e executou teardown.
- Reauditoria final da separação administrativa: `softDeleteUserAccount` grava `accountStatus="deleted"`, o mesmo estado terminal usado pela eliminação própria. A desativação lógica admin bloqueia login e impede depois o titular de executar password+`ELIMINAR`/cascade; a distinção recém-documentada ainda não existe no modelo real.
- Plano da correção: o DELETE admin passa a suspensão/desativação reversível, preservando email/password e sem `deletedAt`; `deleted` continua exclusivo da eliminação própria. Desativação e revogação de todas as sessões serão uma única transação; reativação não revive sessões antigas. Contas terminalmente apagadas continuam recusadas e dados legados já anonimizados nunca são promovidos.
- Evidência final da separação administrativa: desativação e revogação transacionais, reativação sem cookies antigos e tombstone imutável para estado/role passaram 13/13 no focal, 576/576 na suite API e reauditoria read-only independente; o E2E anterior já provava eliminação própria/401 e será repetido no gate final.
- Correção documental final: os guias de decisão administrativa passaram a ensinar decisão e audit append-only na mesma `ClientSession`, com rollback/failure injection para rejeição, aprovação e retry. O runtime continua validado; a componente documental aguarda reauditoria independente.
- Fecho final: a suite API integral, o retry/404 e a eliminação terminal E2E passaram no gate final; o parecer documental confirmou decisão+audit transacional e o parecer backend já não encontrou residual.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-005` - IA demo apresentada como real

- Observado: baseline usa metadados/tamanho, mas produz findings cosméticos.
- Esperado: `demo` inequívoco; providers reais configurados/consentidos e sem fallback silencioso.
- Dependências: consentimento externo, cifra e UI.
- Testes: demo badge, configuração negativa, consentimento, indisponibilidade provider.
- Causa raiz confirmada: `AI_PROVIDER_MODE=local` é o default, o provider local infere findings cosméticos apenas de metadados/tamanho e devolve um nome que não declara simulação; falhas de rede, timeout e 5xx dos modos `openai`/`external` são convertidas silenciosamente nesse resultado local. O modelo persistido também não regista `mode`, `isDemo` ou versão do provider.
- Plano de implementação ativo: substituir `local` por `demo` (alias apenas em development), recusar configuração real incompleta/host não autorizado, remover todo o fallback, propagar `AbortSignal`, persistir `mode`/`isDemo`/versão e apresentar badge inequívoco em análise, relatório, recomendações e histórico. O consentimento específico por provider será ligado ao contrato G3 assim que esse handoff estabilizar.
- Ficheiros previstos: configuração/providers/model/service de análise, projeções de relatório/histórico/recomendação, páginas web correspondentes e testes G4 focais. Riscos de regressão: contratos MF1/MF6/MF7 que ainda esperam `local-skin-analysis-v1`, dados legados sem novos campos e providers mockados sem stream real.
- Evidência atual: configuração/provider/DTO 47/47; UI provenance 3/3 e consentimento real 11/11+2/2 concorrente; modos reais sem credencial/host/consentimento falham antes de I/O, nenhum fallback silencioso; migration 006 no registry e suite API integral 479/479.
- Evidência final automatizada: a suite API integral atual terminou 505/505 e o `verify:all` percorreu o journey demo/consentimento/relatório no Chromium, além dos gates públicos/Axe em Chromium, Firefox e WebKit; nenhum provider real ou fallback demo foi acionado.
- Risco residual: falta E2E browser dos badges/consentimento e reauditoria; nenhum provider real foi chamado durante os testes.
- Reauditoria final independente: provider real aceita HTTP 200 sem findings e fabrica cinco valores “indeterminado” marcados como reais; a homepage apresenta a capacidade demo como IA real e metadata ausente é classificada como real. O boundary passará a validar o payload completo/falhar 502 e a home/normalizador serão fail-closed para demo.
- Reabertura de fixture: a suite integral passou 555/556, mas `mf8.image-purpose-limit` ainda mocka uma resposta real sem os cinco findings agora obrigatórios. O provider recusou-a corretamente; antes de editar a expectativa/fixture, o finding regressa a implementação para repetir focal e suite sem cristalizar o contrato antigo.
- Alteração de teste: o mock remoto passou a fornecer `providerVersion` e os cinco findings materiais completos; a asserção continua centrada na minimização do request e não relaxa a validação fail-closed. Reteste focal/integral ainda pendente.
- Evidência atual: provider+finalidade passaram 45/45; a repetição integral terminou 82/82 ficheiros e 556/556 testes. Payload incompleto continua 502, home/normalizador continuam fail-closed para demo e o fixture de minimização usa agora um resultado real materialmente válido.
- Reauditoria final independente: o URL inicial do provider real é validado, mas `fetch` ainda segue redirects automaticamente; uma resposta 30x pode reenviar o payload facial para um host fora da allowlist. O modo demo não é afetado, mas o boundary real deve usar `redirect:"error"` e negativos sem segundo request.
- Correção documental final: os três guias de proveniência usam agora o contrato canónico `mode="demo"`, `isDemo=true`, provider `demo-skin-analysis` e versão `1`, sem variantes que possam apresentar a simulação como provider real.
- Reauditoria documental posterior: o guia MF1-06 persiste os quatro campos canónicos, mas o DTO pedagógico devolve apenas `providerName`; MF1-08 repete a omissão e a UI não identifica demo. O finding regressa a implementação documental antes da correção dos snippets e reauditoria.
- Correção documental: MF1-06 devolve `mode/isDemo/providerName/providerVersion`; MF1-08 preserva a proveniência em análises e relatórios e usa `AnalysisModeBadge`; MF6-07 documenta os três campos reais do `FaceReport` sem inventar `analysisProvider`.
- Reauditoria independente posterior: DTOs/queries/histórico passaram, mas a página pedagógica MF1-06 ainda cria manualmente um badge baseado apenas em `analysis.mode`, ignorando `isDemo/providerVersion`, em vez de usar o `AnalysisModeBadge` canónico. O finding regressa a implementação documental.
- Correção final: MF1-06 importa/reutiliza `AnalysisModeBadge` com os quatro campos reais e deixa de duplicar uma decisão por `mode`.
- Reauditoria documental independente final: `PASS`; confirmou o tuple completo em `FaceAnalysis`, os três campos reais em `FaceReport`, zero badge manual e zero propriedade inventada `analysisProvider`.
- Fecho final: provider fail-closed/redirects, consentimento, badges demo e journey E2E passaram no `verify:all`; nenhum provider real foi chamado durante a validação local.
- Estado: `VALIDADO` (`... -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-006` - Consulta guiada desligada

- Observado: UI pede ObjectId; sem ID o contexto fica vazio e não há review.
- Esperado: última sessão submetida do proprietário alimenta recomendações e cria review.
- Dependências: P2-004/005 e audit log.
- Testes: sessão -> recomendação -> review -> insight, ownership e reload.
- Causa raiz confirmada: o endpoint aceita `consultationSessionId` vindo do browser e, sem esse ObjectId técnico, devolve contexto vazio e não cria revisão. A submissão da sessão grava a sessão e só depois o histórico, sem atomicidade; a UI mantém um campo de ID manual e não transita automaticamente.
- Plano ativo: remover o ID do contrato público, resolver no backend a última sessão `submitted` do próprio cliente, usar o respetivo histórico minimizado, criar/atualizar a revisão na mesma unidade durável das recomendações e transitar a UI após submissão.
- Alterações realizadas: o browser deixou de enviar IDs; o backend resolve a última sessão submetida do titular. Submissão+histórico e recomendações+review usam transações próprias, sequenciais e idempotentes; failure injection reverte cada unidade. O wizard valida obrigatórios, permite Anterior, protege alterações não guardadas e transita automaticamente para recomendações.
- Evidência intermédia atual: 2/2 replica-set de rollback/retry, regressão guided/review 35/35, web 3/3+smoke+build e reteste coordenado de consentimento/guided/fairness/review com 84/84. A migration 006 isolada passou 3/3 no seu conjunto.
- Evidência final automatizada: API 505/505 e E2E integrado concluíram consulta guiada, geração, revisão humana e insight sem ObjectId no browser; a matriz multi-engine ficou 28 PASS/8 skips intencionais.
- Risco residual: falta registar 006 depois de 005 e repetir a suite integral/browser; a consulta e geração são duas transações iniciadas por ações distintas, não uma única transação UI de longa duração.
- Critérios finais: positivos de create/update/DTO, negativos de tamper/owner/campo/v1 runtime, dump cru sem markers, migration 005 e ordem 005→006, projeções com owner e suite integral 479/479.
- Reauditoria final independente: drafts podem duplicar, answers cifradas são substituídas por read-modify-save sem CAS e save-vs-submit pode divergir de history/recomendações. No browser, duplo clique pode saltar perguntas e trocar painel perde dirty state. Serão adicionados unique parcial, CAS/version/status draft, busy/guard e testes concorrentes.
- Evidência da correção backend concorrente: índice unique parcial garante um único draft por utilizador; start usa upsert com recovery de `11000`; answers e submit usam compare-and-set por `status=draft`/`__v`. O reteste conjunto terminou com 3 ficheiros e 13/13 testes: 25 starts convergiram, duas answers concorrentes produziram um sucesso/409 com retry sem perda, rollback/history mantiveram-se íntegros e uma barreira determinística provou que submit confirmado vence um save stale, que recebe 409 sem alterar respostas ou histórico. Migração 009, guards do wizard e suite integral continuam pendentes.
- Fecho final: as nove migrações, os testes de concorrência e o journey sessão→recomendação→review→insight passaram no gate integral, incluindo guards/dirty state no browser.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-007` - Perfil e navegação

- Observado: cliente recorrente cai em POST de criação; rotas órfãs.
- Esperado: overview, GET/404 onboarding, PUT edição e navegação completa por role.
- Dependências: cliente HTTP e componentes assíncronos.
- Testes: cliente novo/existente, role menus e rota visível.
- Alterações parciais: `/conta` e `/pele` passaram a hubs; login de cliente termina em `/conta`; `/conta/perfil` carrega por GET e escolhe POST apenas após 404 ou PUT quando existe; rota antiga redireciona; menus por role expõem as rotas reais de conta/pele sem pedir IDs.
- Evidência intermédia: reteste coordenado com 7/7 casos puros, smoke G5, configuração/tema/compatibilidade e build Vite 8 de 83 módulos (`82,66 KiB` gzip), todos verdes. O teste cobre destinos por role, rejeição de redirect externo, inventário de links, POST apenas em 404, PUT em existente e payload sem IDs técnicos.
- Risco residual: `EditProfilePage` ficou órfã, mas a rota antiga redireciona para o fluxo consolidado; alterações futuras de rotas devem atualizar a allowlist pós-login e os respetivos testes.
- Evidência final: contrato puro 8/8 inclui cliente novo/existente, destino externo, allowlist por role e negativos cliente→admin/consultor→conta; o E2E Chromium percorreu perfil 404→POST→PUT e trocou cliente por consultor sem herdar uma rota incompatível. A matriz integrada terminou 28 executados PASS/8 skips intencionais.
- Reauditoria final independente: home e layout público enviam consultor/admin para `/conta/perfil` ou deixam-nos sem retorno visível ao backoffice. A navegação pública autenticada será derivada da role e coberta por testes/E2E.
- Fecho final: allowlist de destinos por role, perfil novo/existente e menus/rotas foram repetidos nos contracts e E2E; cada role regressou à área compatível.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-008` - Backup não recuperável

- Observado: export redigido, test-only, sem restore.
- Esperado: backup local EJSON/BSON cifrado, índices, checksum, retenção e restore isolado verificado.
- Dependências: Mongo local, chave própria, migrations.
- Testes: backup -> restore `_restore` -> comparação de integridade.
- Alterações realizadas: criado formato Extended JSON cifrado com AES-256-GCM/AAD, checksums de payload e manifest, captura de documentos/índices, restore limitado a bases `_restore`, verificação com cleanup, retenção de sete snapshots, CLIs e aliases npm `backup:create|restore|verify|prune`, e scheduler apenas por opt-in `dev:local`. Os scripts exigem URI loopback sem credenciais e chave dedicada, sem carregar o `.env` da aplicação.
- Evidência final: 7/7 testes do core e 1/1 integração `MongoMemoryReplSet`. O ciclo real preservou BSON variado e uma coleção vazia, cifrou sem plaintext, validou checksums, recusou restore na origem, recriou documentos e índices unique/TTL/partial em `_restore`, verificou igualdade e removeu apenas a base restaurada. Retenção e scheduler sem opt-in também estão cobertos.
- Reabertura atual: a reauditoria final confirmou que o manifest continua a publicar `backup:daily` apontado a `scripts/backup-daily.mjs`, um export redigido deliberadamente não recuperável. Apesar de os quatro comandos canónicos e o core estarem verdes, este alias ativo pode ser confundido com o backup diário recuperável e contradiz o próprio guia operacional. O alias legado será removido, o scheduler continuará exclusivamente opt-in em `dev:local` e um contrato negativo impedirá a sua republicação.
- Evidência da reabertura: o manifest publica agora exatamente `backup:create|restore|verify|prune` e nenhum script ativo referencia `backup-daily.mjs`; 8/8 testes unitários do core/manifest e 1/1 ciclo replica-set recuperável passaram. O validator manteve 44 RF/31 RNF/74 BK/guias e o diff documental ficou limpo.
- Risco residual: os snapshots são locais ao alvo académico e não substituem disaster recovery externo; o ficheiro legado permanece apenas como artefacto histórico sem alias operacional.
- Reauditoria final independente: a criação lê coleções sequencialmente sem snapshot e publica diretamente no diretório final; uma falha deixa diretório parcial selecionável por latest/prune e writes concorrentes podem produzir estado cruzado. Será usado snapshot read concern/transaction, staging+rename, cleanup e seleção apenas de manifests completos verificados.
- Correção do boundary final: metadados/índices são lidos antes e depois; documentos são capturados numa única transação `readConcern=snapshot`; o snapshot é escrito numa staging 0700 com ficheiros 0600, verificado integralmente, marcado e publicado por um único rename. `list/latest/prune/resolve` ignoram staging e diretórios sem marker/manifest/checksums coerentes.
- Evidência coordenada: checks sintáticos 3/3 e 13/13 testes. O replica set provou revisão 1 consistente em duas coleções enquanto a origem avançava concorrentemente para revisão 2; drift de índice falhou, removeu staging e preservou snapshots publicados. Os unitários provaram falha após escrita, zero final parcial/órfão, permissões, tamper, retenção e parciais ignorados.
- Risco residual: snapshots são locais e não substituem disaster recovery externo; suite integral/verify e reauditoria final ainda podem reabrir.
- Reauditoria documental final: `backup-scheduler.mjs` existe e prova o negativo sem opt-in, mas não é importado/chamado pelo `dev:local`; logo o scheduler documentado não pode ser efetivamente ativado. O snapshot manual continua recuperável, mas o requisito diário opt-in fica incompleto.
- Fecho final: snapshot transacional/staging, restore/verify, retenção e scheduler exclusivamente `dev:local` passaram na suite API do gate integral; o scope continua local, sem alegação de disaster recovery externo.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-009` - Abuso, quotas e upload vulnerável

- Observado: sem limiter/quota; ficheiros acumulam; Multer vulnerável; métricas sem TTL.
- Esperado: limites por rota/utilizador, quotas, parser limitado, substituição física e TTL.
- Dependências: sessões, `busboy`, `sharp`.
- Testes: 429/Retry-After, limites multipart, abort cleanup e quota.
- Alterações parciais: factories de limiter com políticas/store injetáveis; login 5/15 min, registo 3/h, API autenticada 120/min, upload 5/h e IA 10/dia; chave por utilizador e fallback de IP normalizado; headers standard e 429 sanitizado. O runtime multipart passou de Multer para Busboy streaming com 2 ficheiros/2 partes/0 campos e 5 MiB por ficheiro, cleanup em erro/limite/abort e quota de 10 MiB normalizados; remoção da dependência no package aguarda reteste.
- Evidência final: G1/G3 50/50, bomb específico, substituição/outbox 2/2, audit/npm ci zero e suite integral 479/479. Cobertos 429/headers/chaves, limites multipart/abort/cleanup, quota duas fotos/10 MiB, normalização, retry e TTL 30 dias das métricas.
- Risco residual: os stores de rate limit são locais ao único processo académico e não representam quota distribuída; é coerente com o scope local. Reauditoria pode reabrir.
- Estado: `VALIDADO` (`EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-010` - CSV Formula Injection

- Observado: células controladas podem iniciar fórmula.
- Esperado: neutralizar `=`, `+`, `-`, `@`, tab e CR.
- Dependências: nenhuma.
- Testes: payloads maliciosos permanecem texto.
- Alterações realizadas: cada célula controlada cujo primeiro carácter é `=`, `+`, `-`, `@`, tab ou CR recebe um apóstrofo textual antes do escape RFC 4180; aspas e BOM continuam preservados.
- Evidência final: teste parametrizado com os seis prefixos e suite de exportação com 13/13 testes; execução autorizada fora da sandbox com exit code 0.
- Risco residual: aplicações de folha de cálculo com regras não convencionais devem ser reavaliadas no gate final; o contrato mínimo pedido está coberto.
- Estado: `VALIDADO` (`EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P1-011` - Imagens e budget

- Observado: ~47 MiB de PNG; budget mede apenas JS/CSS.
- Esperado: variantes responsivas, budgets de transferência/LCP/CLS e nenhum asset não autorizado acima do limite.
- Dependências: `sharp`, Playwright e UI de imagem.
- Testes: tamanhos, LCP/CLS, viewports e bundle.
- Causa atual confirmada: `real_dev/web/public/products` ocupa 47 MiB e cada PNG principal tem cerca de 1,6-2,3 MiB; o build atual só otimiza os dois assets importados e não controla os produtos públicos.
- Plano ativo: gerar variantes 320/640/960 AVIF/WebP com fallback, criar componente `picture` com dimensões/sizes/srcset e política eager apenas para hero, atualizar referências e aplicar budgets estáticos por variante. Métricas LCP/CLS reais continuam dependentes de browser.
- Handoff parcial: `OptimizedImage` já renderiza `<picture>` AVIF/WebP com `srcset`, `sizes`, dimensões, prioridade e fallback; o resolver deriva nomes 320/640/960. Porém, as variantes ainda não existem: permanecem 25 PNGs/49.575.605 bytes, entre 1.689.071 e 2.405.981 bytes, e zero AVIF/WebP. O browser recorre ao fallback pesado; este estado não satisfaz o finding.
- Alterações atuais: pipeline Sharp reproduzível publicou 150 variantes AVIF/WebP e reencodou 25 fallbacks PNG 960 de forma transacional; `<picture>` usa `srcset/sizes`, hero eager/high e restantes lazy. O budget mede entry gzip e 177 imagens do `dist`, não apenas JS/CSS.
- Evidência atual: 8.018.679 bytes para os 175 assets de produto versus 49.575.605 bytes nos 25 originais; maior fallback 190.534 bytes; 320 <=120 KiB e restantes <=300 KiB. Testes Node 62/62, smoke de imagens, checker, build 94 módulos, G1 sem loopback e page budget com entry 63.504 bytes gzip passaram.
- Evidência final automatizada: `verify:all` repetiu build de 94 módulos, entry de 63.835 bytes gzip, 177 imagens dentro do budget e o budget browser em Chromium; os quatro viewports e as rotas públicas passaram também em Firefox/WebKit.
- Risco residual: os dois assets conceptuais importados ficam 218,92/284,63 KiB e dentro do limite crítico; medições futuras dependem do perfil de máquina, mas o perfil local canónico ficou verde.
- Reauditoria final independente: a UI ainda publica um falso budget medido entre effect e `requestAnimationFrame`, apesar de o E2E medir LCP/CLS reais. Esse diagnóstico enganador será removido/substituído por Web Vitals reais e os callers receberão `sizes` material.
- Fecho final: o aviso falso foi removido; 25 produtos/150 variantes/177 imagens, Web Vitals e entry de 65.735 bytes gzip passaram no gate final nos viewports/engines configurados.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-001` - Leituras de consultor não auditadas

- Observado: só decisões entram no audit trail.
- Esperado: list/detail/decision append-only, minimizado e correlacionado.
- Testes: cada leitura autorizada cria evento; cliente não cria/acede.
- Causa raiz confirmada: listagem e detalhe não recebem o ator autenticado e só o array embebido da decisão regista evento; não existe log append-only próprio para acessos.
- Plano ativo: criar audit log IA separado, gravar `list|detail|decision` com ator/role/review/requestId minimizados e manter o DTO sem IDs de ator.
- Alterações realizadas: audit log append-only separado para `list|detail|decision`, com ator/role/review/requestId e contagem minimizados; controllers propagam contexto autenticado; DTOs nunca incluem o ator. A decisão e o respetivo evento executam na mesma transação e a eliminação de conta desassocia o ator sem apagar a prova temporal.
- Evidência final: suite HTTP e replica-set com 12/12 testes. Positivos de listagem/detalhe/decisão criam eventos; negativos 401/403 impedem cliente/anónimo; serialização não contém o ID do ator; falha injetada no audit da decisão reverte o CAS; duas decisões concorrentes produzem um sucesso, um 409 e um único evento.
- Risco residual: reauditoria G7 pode reabrir o contrato; retenção não destrutiva do audit é tratada em P2-015.
- Estado: `VALIDADO` (`ABERTO -> EM_ANALISE -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-002` - Dados derivados em claro

- Observado: findings, restrições, respostas e notas sem cifra.
- Esperado: AES-GCM com `keyVersion` e AAD; migração retomável.
- Testes: dump sem plaintext, troca de owner/campo falha autenticação.
- Causa raiz confirmada: o utilitário AES-GCM atual não autentica contexto nem versão de chave; apenas `FaceReport` e `AiInteractionHistory` usam setters cifrados. `FaceAnalysis.findings`, alergias/restrições do perfil, respostas guiadas e notas/overrides de revisão/recomendação são persistidos em claro.
- Plano ativo: evoluir o envelope para `keyVersion` + AAD determinístico por coleção/owner/campo; manter leitura controlada do formato v1 apenas durante a migração; cifrar campos sensíveis como payloads coesos e projetá-los nos DTOs existentes; criar migration 005 retomável e testar dump, adulteração e troca de owner/campo.
- Riscos: getters Mongoose não conhecem automaticamente o owner durante setters, índices não podem incidir em ciphertext e fixtures legadas dependem de subcampos. A alteração será faseada por helpers explícitos/service boundaries, sem cifrar campos necessários para ownership/estado/consulta.
- Alteração de fecho em curso: `AiInteractionHistory.safeSummary/safeSignals` entrou no mesmo contrato contextual v2 e na migration 005. As projeções inclusivas de histórico/evolução de pele foram corrigidas para selecionar `userId` juntamente com o envelope; o teste replica-set de models passa a exercer getters de análise, relatório, evolução e histórico IA através dos services públicos.
- Evidência integrada atual: crypto/migrações/models 4 ficheiros e 13/13 testes num replica set efémero; inclui dump sem markers, v1→v2, ordem 005→006, setters de documento/query, adulteração owner/campo e leitura real por histórico/evolução/recomendação. Registry completo e suite integral ainda pendem.
- Risco residual: novas projeções inclusivas futuras terão de selecionar o owner exato; a suite integral e a pesquisa estática de dumps/projeções ainda podem reabrir o finding.
- Critérios finais: regeneração não inclui status/feedback/notas/override em `$set`; decisão e nota sobrevivem, CAS concorrente produz um sucesso/409, override está cifrado e migration 006 preserva apenas decisões demonstráveis; suite integral 479/479.
- Reabertura atual: a cifra v2 protege notas/overrides explícitos, mas `ProductRecommendation` e `AiConsultationReview` continuam a persistir `sourceSignals`, `sourceLabels`, `limitations`, explicações e snapshots de máquina em claro. Restrições livres do perfil e findings faciais são copiados para esses campos; `SkinComparison.metricDeltas` também expõe evolução ligada ao titular. `RecommendationReview.note/adjustedExplanation` permanecem plaintext.
- Causa adicional: o endpoint legado de revisão copia a nota para um campo cifrado, mas também a grava em `RecommendationReview.note` e pode substituir diretamente `ProductRecommendation.explanation`, misturando decisão humana com o snapshot de máquina.
- Plano: migration 008 append-only cifra os derivados com AAD/owner exatos, sem alterar checksums 005/006; DTOs mantêm o contrato lógico por getters/services. O review legado passa a escrever apenas revisão/human override, nunca o resultado de máquina. Dumps crus e projeções com owner serão testados transversalmente.
- Reauditoria final independente: bytes faciais continuam no envelope AES-GCM legado sem `keyVersion`/AAD por owner/kind/photo e alguns motivos/nomes permanecem plaintext. Será criado contrato contextual para ficheiros, migração append-only e negativos de swap owner/kind, mantendo dados de routing mínimos fora do ciphertext.
- Evidência pós-correção: os ficheiros usam AES-GCM v2 com AAD por coleção/owner/photo/kind, nomes são minimizados e swaps de owner/kind/photo falham autenticação; `reason/decisionReason` usam AAD por requester. A 009 recifra v1, faz backfill dos motivos e valida dumps sem markers. Os focais passaram 48/48, privacy 6/6 e registry+009+privacy 14/14; falta a suite integral atual.
- Evidência integral atual: a suite API posterior passou 82/82 ficheiros e 556/556 testes, incluindo dumps, recifra, AAD/tamper, privacidade e as nove migrações. E2E/reauditoria continuam pendentes.
- Reabertura documental final: a ponte `decryptJsonForMigration` é usada legitimamente também pela migration 006 para ler legado antes de recifrar o split machine/human. README/RNF/MF6-07 e o comentário do helper listam apenas 005/008/009 ou 005/008, tornando o boundary auditável incoerente.
- Correção documental final: os tutoriais apresentam apenas AES-GCM contextual v2 com `keyVersion`, AAD e `aadHash`; a leitura legacy ficou limitada explicitamente às migrations 005/006/008/009, sem reexport em services de runtime.
- Reauditoria documental posterior: cinco projeções pedagógicas de campos contextuais omitem `userId`, necessário para reconstruir o AAD/owner, em MF1-08, MF2-01, MF4-03 e MF6-07. O finding regressa a implementação documental; o runtime permanece proibido de ler plaintext/v1.
- Correção documental: todas as projeções identificadas incluem agora `userId` para autenticar o AAD e os mappers/DTOs continuam a omiti-lo da resposta pública.
- Reauditoria documental posterior: as projeções e DTOs focais passaram, mas MF6-07 e MF7-05 continuam a incluir `userId` nos headers/rows de exportação administrativa, contradizendo a minimização já corrigida em MF4-03. O finding regressa a implementação documental.
- Correção final: MF6-07/MF7-05 continuam a selecionar `userId` apenas para reconstruir o AAD, mas removem-no dos headers e das linhas exportadas; comentários/changelog protegem a separação.
- Reauditoria documental independente final: `PASS`; scanner global analisou 17 projeções contextuais, encontrou zero owner em falta e zero owner técnico em headers, rows, DTOs ou mappers adjacentes.
- Fecho final: o `verify:all` repetiu dumps/AAD/migrations 005/006/008/009 e o parecer documental confirmou zero owner exposto; os campos sensíveis permanecem cifrados fail-closed.
- Estado: `VALIDADO` (`... -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-003` - Fairness insuficiente

- Observado: denylist textual e quatro cenários sintéticos.
- Esperado: ranking não usa atributos protegidos, testes de invariância e limitações honestas.
- Testes: perfis equivalentes variando atributos protegidos devolvem o mesmo ranking.
- Causa raiz confirmada: o guard anterior procurava palavras proibidas depois de os sinais já terem sido compostos, em vez de limitar estruturalmente os inputs do ranking; isso não demonstrava que atributos protegidos estavam ausentes do cálculo.
- Plano/alteração em curso: construir o input do ranking através de allowlist de sinais guiados e restrições de segurança, excluir atributos protegidos antes de qualquer score e expor política/limitações sem alegar garantia absoluta. Testes de invariância com perfis equivalentes variam idade/género/tom e exigem ordem, score e motivos idênticos.
- Evidência intermédia recebida: checks sintáticos em quatro ficheiros e 13/13 testes API focais, incluindo positivos de allowlist, negativos discriminatórios e invariância HTTP. O coordenador ainda aguarda integração DTO/build e reteste próprio antes de validar.
- Alterações realizadas: allowlist fechada de perguntas/valores cosméticos; labels canónicas; texto livre e atributos protegidos são removidos antes do ranking; alergias/ingredientes apenas excluem produtos. API/UI expõem versão, âmbito e limitações sem garantia absoluta.
- Evidência final: focais 13/13, integração 44/44, build web e reteste coordenado 84/84. A invariância HTTP exige ordem, score e `reasonCodes` idênticos ao variar idade, género e tom; negativos cobrem sinais discriminatórios e labels adulteradas.
- Risco residual: provider real pode ter limitações próprias e novas perguntas são ignoradas até revisão explícita da allowlist.
- Estado: `VALIDADO` (`ABERTO -> EM_ANALISE -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-004` - Correções humanas sobrescritas

- Observado: regeneração limpa status, feedback e nota.
- Esperado: `machineResult` separado de `humanOverride`.
- Testes: regenerar preserva decisão/nota/feedback.
- Causa raiz confirmada: cada upsert de recomendação repõe `status=active`, `feedback=null` e `consultantNote=null`; o refresh da revisão repõe estado, insight, notas e reviewer. A decisão usa read/mutate/save, permitindo duas decisões concorrentes.
- Plano ativo: guardar snapshot `machineResult` separado, inicializar feedback/override apenas no insert, nunca apagar override na regeneração e aplicar decisão por compare-and-set; a segunda decisão recebe 409.
- Alterações/evidência: `machineResult` e `humanOverride` estão separados; regeneração atualiza apenas máquina; overrides/notas/feedback ficam fora de `$set`; CAS aceita uma decisão, devolve 409 à segunda e persiste o override cifrado. Focais 15/15 anteriores, CAS/audit 12/12 atual e migration 006 no registry.
- Reabertura atual: o fluxo principal mantém o split, mas `recommendation-review.service.js` conserva uma via legacy que grava `adjustedExplanation` diretamente em `ProductRecommendation.explanation` e duplica texto livre em claro. Essa mutação pode substituir a explicação de máquina fora do `humanOverride` e invalida a garantia transversal.
- Plano: convergir esta via para um override humano cifrado/revisão própria, preservar `machineResult` e cobrir regeneração posterior, concorrência e dump cru.
- Risco residual: até ao reteste, a separação machine/human não é verdadeira para todos os endpoints ativos.
- Estado: `VALIDADO` (`ABERTO -> EM_ANALISE -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`). Concorrência, máquina imutável, minimização, explicação efetiva e suite integral estão verdes.

### `ORELLE-AUD-P2-005` - Operações não atómicas

- Observado: alterações parciais possíveis em checkout, privacy e review.
- Esperado: transações em replica set ou outbox/saga idempotente para filesystem.
- Testes: failure injection depois de cada passo e concorrência.
- Alterações realizadas nesta fase: pagamento, consumo de voucher, redução de stock, gravação da encomenda e limpeza do carrinho foram reunidos numa transação; atualização logística e notificação também passaram a transação. Privacy/review continuam pendentes nas fases G3/G4.
- Alterações/evidência: pagamento/logística, submissão+histórico, recomendações+review e decisão+audit usam transações; filesystem usa outbox idempotente na mesma transação, com retry pós-commit. Failure injection/rollback foi provada em pagamento (cinco pontos), guided (dois), review/audit, conta/privacy e substituição de fotos.
- Risco residual: DDL das migrations é faseada/replayable, não atomicamente ligada ao registo; isso pertence a P2-015 e está testado. Suite integral ainda pode reabrir.
- Critérios finais: transações/failure injection cobrem pagamento, logística, guided/history, recommendations/review, decisão/audit e alertas; outbox idempotente cobre filesystem/conta/privacy/fotos; concorrência e rollback reais passaram e a suite integral ficou 479/479.
- Reabertura atual: a escrita documental do checkout ocorre fora de transação/CAS e pode sobrescrever o commit transacional do pagamento. O fix será um update condicional monotónico com teste intercalado; os restantes contratos atómicos permanecem verdes mas o finding não pode continuar validado enquanto este boundary aceitar stale save.
- Evidência da correção: o CAS condicionado e o recovery monotónico passaram os contratos unitários/HTTP e a prova intercalada real, num total focal de 37/37; nenhuma resposta ou persistência regressou a `awaiting_simulation` depois do commit pago.
- Reabertura adicional: a rota legacy de revisão individual executa `ProductRecommendation.save()` e só depois `RecommendationReview.create()`, sem transação/CAS. Uma falha deixa mutação sem review; duas decisões concorrentes podem produzir last-write-wins e múltiplos registos. Este boundary será convergido para CAS+transação juntamente com a cifra 008.
- Reauditoria final independente: foram encontradas novas boundaries sem CAS/transação: unlock/voucher/report, carrinho, guided answers e write barrier de eliminação/upload. Cada uma exige concorrência/rollback material antes de voltar a validar.
- Evidência pós-correção das novas boundaries: report/unlock/voucher passou 23/23 com 25 replays, uma referência, 409 e dois rollbacks; carrinho passou 25/25 com incrementos/preservação/stock concorrentes; guided passou 13/13 com draft único, CAS/409/retry e save stale recusado; a barreira facial passou as corridas destrutivas e o reteste integrado 14/14. Falta repetir a suite integral/E2E antes de validar transversalmente.
- Evidência integral atual: 82/82 ficheiros e 556/556 testes repetiram pagamento/unlock/carrinho/guided/reviews/privacy/barreiras/analysis/alertas com replica sets, concorrência e rollback. Falta E2E/reauditoria, não implementação backend conhecida.
- Reauditoria final independente: a decisão administrativa de privacidade pode confirmar antes de o audit log autónomo falhar; o catch passa então a alegar decisão não aplicada. Decisão+audit exigem a mesma transação ou outbox atómico, com failure injection e rollback.
- Correção documental final: os snippets de privacidade foram reconciliados com a transação única decisão+audit e os negativos de rollback/retry já validados no runtime.
- Fecho final: pagamento/logística, carrinho, guided, reviews, privacy/audit, account erasure, outbox e alertas passaram a suite API integral com concorrência/rollback; o E2E repetiu os fluxos críticos.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-006` - Timeout sem cancelamento

- Observado: 503 é enviado, mas I/O continua.
- Esperado: AbortSignal propagado e commit bloqueado após timeout.
- Testes: provider/DB atrasado não produz mutação tardia.
- Alterações parciais: `requestTimeout` cria `req.signal`, aborta-o com o mesmo erro 503 no limite e também em cancelamento/fecho prematuro do cliente; cleanup do timer mantém-se idempotente. Foi acrescentado um teste onde uma mutação cooperativa posterior ao timeout não ocorre.
- Incremento transacional: o controller de pagamento propaga `req.signal`; a transação verifica cancelamento no início, após cada ponto mutável/failure injection e imediatamente antes de permitir commit. Um abort depois de carrinho/voucher/stock deve provocar rollback integral e permitir retry.
- Evidência final: middleware aborta e bloqueia mutação tardia; providers compõem signal/timeout sem fallback; pagamento abortado depois de alterações transacionais faz rollback integral e retry. Conjunto atual 49/49 após checks.
- Risco residual: operações de bibliotecas que não aceitam AbortSignal podem terminar internamente, mas não conseguem confirmar o fluxo transacional coberto; reauditoria G7 pode reabrir.
- Reauditoria final independente: `req.signal` ainda não chega ao parser/Sharp/storage/persistência facial nem ao service de análise; um 503/disconnect pode ser seguido de I/O ou escrita tardia. O sinal será propagado e verificado antes de writes/commit, com abort cleanup/retry.
- Correção incremental do provider: a leitura streaming recebe o sinal composto, cancela o reader e preserva a razão do caller; timeout durante chunks devolve 504 e cancelamento do pedido mantém 503, sem ser convertido em 502 nem produzir fallback demo.
- Evidência incremental: `npm test -- tests/mf7.external-ai-provider.test.js --reporter=dot`, exit code 0, 1 ficheiro e 40/40 testes, incluindo timeout/cancelamento no meio da stream. O pipeline facial local continua pendente, pelo que o finding não avança de estado.
- Alteração final deste incremento: `req.signal` atravessa Busboy/pipeline, normalização Sharp, leitura/escrita cifrada, upload service, controller de análise, budget e providers. O commit de `FaceAnalysis` reclama a barreira comum em `User`, relê consentimento e os dois `photoIds` ativos dentro da transação e verifica o sinal depois do insert.
- Evidência coordenada: o conjunto principal passou sete ficheiros e 100/100 testes; o unitário isolado de abort de Sharp/storage acrescentou 2/2. Incluem parser com cleanup no timeout, destruição cooperativa do codec, remoção de ciphertext parcial, stream remota cancelada, abort pós-provider sem create e replica set com rollback pós-insert/generation, retry único, fotos substituídas 409 e consentimento revogado 403.
- Risco residual: bibliotecas nativas só cancelam nos pontos cooperativos expostos; a última barreira transacional impede que os fluxos cobertos confirmem depois do abort. Suite integral/E2E e reauditoria ainda podem reabrir.
- Reauditoria final independente: geração e pagamento simulado do relatório não recebem `req.signal`; uma resposta 503 pode ser seguida de create/commit tardio apesar de order/face analysis já estarem protegidos. O sinal e a barreira pré-commit serão propagados com rollback/retry.
- Fecho final: providers, multipart/Sharp/storage, análise, relatório e ambos os pagamentos recusam commit pós-abort; positivos, negativos, rollback/retry e suite integral passaram no estado final.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-007` - Sessões, CSRF, proxy e headers

- Observado: JWT sem revogação, sem CSRF e confiança ampla em forwarded proto.
- Esperado: sessão opaca revogável, token CSRF, Origin, proxy explícito e headers defensivos.
- Testes: logout invalida, CSRF/origin falham, spoof não contorna HTTPS.
- Alterações parciais: token opaco aleatório de 256 bits, HMAC persistido em `AuthSession`, TTL, `revokedAt`, `lastSeenAt`, espaço `csrfHash`, revogação do cookie atual e `POST /api/auth/logout-all`; o adaptador sem BD é estritamente test-only. Helmet foi ligado; `X-Forwarded-Proto` deixou de ser lido manualmente e proxy só pode vir de allowlist IP/CIDR explícita, recusando valores amplos. CSRF/Origin continuam pendentes.
- Alterações CSRF recebidas: `GET /api/auth/csrf` autenticado/no-store; token de 256 bits com apenas HMAC ligado à sessão; comparação `timingSafeEqual`; mutações autenticadas exigem header e Origin da allowlist; HTTP só em loopback e origens remotas só por HTTPS. Login/registo/health ficam fora; logout passou a exigir sessão/CSRF. O bypass histórico está limitado ao helper estritamente test-only.
- Evidência final anterior: 25/25 testes backend focais; cliente web 7/7, checkout 8/8 e build; headers/rate/proxy focais 50/50 no conjunto anterior; migration 003/007 focal 6/6; suite API posterior 71/71 ficheiros e 482/482 testes. São cobertos logout/logout-all, HMAC/token cross-session, Origin ausente/remota, proxy spoof e regressões HTTP.
- Revalidação após reforço E2E: o middleware conserva o bypass apenas nos testes unitários sem BD e volta a consultar a conta quando `ORELLE_E2E_ISOLATED=true` e Mongoose está ligado. Checks e reteste fora da sandbox passaram 4/4 ficheiros e 33/33 testes; a suite API integral posterior passou 71/71 ficheiros e 483/483 testes, incluindo os quatro ramos do helper, sessões, CSRF/Origin, isolamento de configuração e todas as regressões backend.
- Risco residual: a matriz atual prova revogação/logout-all e troca de role; suspensão/eliminação mantêm cobertura API/replica-set e serão reavaliadas na reauditoria final. A suite API integral será repetida depois deste patch.
- Evidência E2E persistente: Mongo isolada criou `AuthSession` real; pedido sem CSRF recebeu 403, emissão autenticada devolveu prova, logout-all com prova recebeu 204 e `/me` seguinte 401. O journey confirmou logout/login entre roles e o unitário exige persistência no E2E isolado; matriz 28 PASS/8 skips intencionais.
- Reabertura final: desativação administrativa tem de revogar persistentemente todas as sessões para que uma reativação futura não ressuscite cookies antigos; a atualização da conta e a revogação devem ser atómicas.
- Fecho final: sessões opacas persistidas, CSRF/Origin, logout-all, suspensão/reativação e conta terminal foram repetidos na suite API e no E2E; cookies antigos permaneceram revogados.
- Estado: `VALIDADO` (`VALIDADO -> REABERTO -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-008` - EXIF e normalização

- Observado: fallback conserva original e metadados.
- Esperado: decode/re-encode server-side, limites de pixels e EXIF removido.
- Testes: GPS/EXIF ausente, magic bytes falsos e bomb recusados.
- Alterações parciais: sharp faz decode real, coerência MIME, máximo 6000 px por dimensão/25 MP, recusa animação/multipágina, auto-orientação e re-encode WebP sem EXIF; índice parcial único limita um par ativo e a substituição inativa documentos/limpa bytes antigos.
- Evidência intermédia: o teste de integração num `MongoMemoryReplSet` passou 1/1 e provou substituição transacional sequencial/concorrente, exatamente um par ativo, ausência física dos bytes antigos, conservação apenas dos dois ficheiros cifrados finais e permissões `0600`. Continua pendente um caso específico de decompression bomb e a política de órfãos se a limpeza pós-commit falhar.
- Alteração final: o par substituído entra no outbox dentro da mesma transação; falha do worker pós-commit preserva o novo par e deixa retry durável, sem cleanup compensatório incorreto.
- Evidência final: suite G1/G3 50/50, decompression bomb 5001x5000 recusada antes de DB/storage, replica set de substituição 2/2 para concorrência/0600/bytes ausentes e falha pós-commit+retry. O segundo cenário confirma dois jobs pending, retry `completed=2`, `outstanding=0`, antigos `ENOENT` e novo par intacto.
- Risco residual: reauditoria G7 pode reabrir; retenção/sanitização de metadata de jobs concluídos pertence a P2-002/P2-015.
- Reauditoria final independente: várias páginas continuam a substituir dados carregados por erro de mutation; carrinho/wizard/detalhe de review admitem races e auth bootstrap trata offline como logout. Serão separados os estados por ação, adicionados CAS/gates/cancelamento e testes de preservação/reordenação.
- Correção documental final do upload: entrada JPEG/PNG/WebP é sempre reencodada para WebP e persistida como `${kind}.webp`, sem conservar o nome original fornecido pelo cliente; os limites/EXIF continuam os do runtime validado.
- Fecho final: decode real, limites de dimensão/pixels, remoção de EXIF, nome minimizado, cifra v2 e cleanup/outbox foram repetidos na suite API; o parecer documental confirmou o mesmo contrato.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-009` - Maquilhagem e comparação

- Observado: SVG genérico e formulários com IDs.
- Esperado: preview conceptual honesto sobre imagem do proprietário; comparação por datas com tabela.
- Testes: ownership/no-store, seleção sem IDs e copy explícita.
- Plano ativo: manter a maquilhagem como pré-visualização conceptual inequívoca, usar apenas imagem facial autorizada através de endpoint autenticado/no-store do proprietário e remover IDs técnicos da UI; comparação passa a escolher análises por data, apresentar métricas e tabela acessível, sempre com ownership no backend.
- Causa raiz confirmada: a maquilhagem atual gera apenas SVG sintético, mas a copy afirma usar fotografia privada e mostra um ID; a comparação pede dois ObjectIds, devolve apenas lista e não oferece seleção por data/tabela/imagem. Não existe endpoint autenticado de bytes associado à análise.
- Riscos: não alegar render realista/AR, não expor storage paths nem reutilizar fotografia após revogação/eliminação; datasets sem dois momentos devem produzir estado vazio material.
- Alterações realizadas: opções próprias em `/api/me/skin-analyses/comparison-options`; imagem em `/api/me/skin-analyses/:analysisId/image` com auth, ownership/404, consentimento aplicável, bytes decifrados apenas em memória e headers `private,no-store`, nosniff/CORP. Comparação usa selects por data, revalida ordem/30 dias e mostra deltas em tabela; maquilhagem/before-after/home declaram pré-visualização conceptual e deixam de mostrar IDs.
- Evidência intermédia: API consolidada 5 ficheiros/51 testes, replica-set 1/1, web 3/3, smoke MF2 e build Vite 86 módulos/87,36 KiB gzip. Positivos/negativos incluem ownership, consentimento, no-store, bytes, datas, estado `<2`, copy e ausência de input técnico.
- Evidência final automatizada: suite API 505/505, frontend unit/contracts verdes e journey E2E integrado confirmaram ownership, preview conceptual, comparação sem IDs e navegação no estado posterior à cifra 008.
- Risco residual: fotografia fisicamente eliminada aparece indisponível embora métricas históricas permaneçam, por desenho de privacidade.
- Estado: `VALIDADO` (`ABERTO -> EM_ANALISE -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-010` - Cliente HTTP e races

- Observado: erro cru, sem timeout/abort/401 global e respostas antigas podem vencer.
- Esperado: `ApiError`, AbortSignal, retry seguro e evento de sessão expirada.
- Testes: offline, timeout, 401/403/422/500 e unmount.
- Alterações realizadas: base same-origin `/api`; `ApiError` com status/código/detalhes/requestId; timeout de 10 s para JSON e 30 s para ficheiros; composição de cancelamento do caller; códigos distintos para timeout/abort/rede; evento global de 401 observado pelo `AuthProvider`. Foram acrescentados `useAsyncResource` e `useAsyncAction`: cada execução recebe `AbortSignal`, cancela a anterior, usa geração monotónica contra respostas stale e conserva dados válidos quando um refresh ou mutation falha. Dashboard, reviews e notificações separam agora leitura de ação.
- Evidência atual: cliente HTTP 7/7; hooks focais 5/5; suite Node frontend 60/60. A revisão coordenada confirmou que erro de refresh não apaga o conteúdo e que unmount/cancel invalida a geração mesmo se a dependência ignorar o signal. O build global aguarda estabilização do ramo de imagens.
- Evidência final automatizada: Vitest/jsdom 8/8 exerceu lifecycle React real, os contracts ficaram 63/63 e o `verify:all` repetiu build/E2E/401/CSRF/flows sem perda de conteúdo.
- Risco residual: falhas de rede dependem do ambiente, mas timeout, abort, 401, preservação de dados e races têm testes materiais atuais.
- Estado: `VALIDADO` (`EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-011` - Admin, IDs e formulários

- Observado: ações incompletas, ObjectIds expostos, estado de mutation global.
- Esperado: selects/pesquisa, ações completas e busy/error por item.
- Testes: roles, encomendas, stock, categorias, privacy e alertas pela UI.
- Causa atual confirmada: `StockAdminPage` e `AdminCategoriesPage` pedem ID de produto manual; `ClientAiInsightsPage` pede e mostra ObjectId de sessão. Não existe `GET /api/catalog/categories`, embora o service/DTO de categorias já exista.
- Plano ativo deste incremento: endpoint público sanitizado de categorias; selects de produtos carregados do catálogo para stock/categorias; insights listam automaticamente e deixam de mostrar o ID interno. Restantes ações admin/estado assíncrono continuam no mesmo finding.
- Alterações adicionais: preferências carregam catálogo e representam favoritos por nome/checkbox, conservando IDs apenas como valores internos; o feedback de avaliação deixou de revelar o ID criado. O carregamento combinado é cancelado em unmount e não tenta atualizar estado depois de abort.
- Administração operacional: API lista encomendas num DTO minimizado e avança apenas logística de pagamentos simulados; nova UI seleciona linhas sem ID manual. Utilizadores permitem alterar role com busy/erro por linha; campanhas escolhem a role; alertas de rotina exigem execução explícita. A página de encomendas foi ligada a rota/menu/título administrativos.
- Fecho de inputs técnicos: o catálogo público carrega categorias e mostra select por nome; preços são introduzidos em EUR e convertidos apenas no boundary para cêntimos. Falha do carrinho já não apaga o catálogo e pesquisas concorrentes são canceladas/invalidadas.
- Evidência atual: API admin 27/27 e catálogo 14/14; frontend Node 62/62, smokes e build 94 módulos. Nenhuma UI focal pede IDs de produto/sessão/categoria e as ações destrutivas usam confirmação escrita.
- Reabertura atual: a reauditoria documental confirmou que a UI não mostra `consultationSessionId`, mas encontrou o campo ainda presente no DTO público de insights do cliente. O finding é reaberto antes de remover essa exposição e reforçar o teste API.
- Correção atual: `toPublishedConsultantInsightDto` deixou de serializar o ID técnico; o filtro backend opcional permanece exclusivamente interno/owner-scoped. O teste público passa a exigir ausência explícita de `consultationSessionId`; reteste ainda pendente.
- Risco residual: E2E por role e estados de erro num browser podem reabrir.
- Evidência de reabertura: o primeiro focal passou 14/15 e revelou uma expectativa legada; após alinhá-la, a repetição exata fora da sandbox passou 2/2 ficheiros e 15/15 testes. DTOs de cliente recusam agora explicitamente o ID técnico, mantendo ownership/filtro apenas no backend.
- Evidência final automatizada: API 505/505, frontend 8/8+63/63 e o E2E integrado percorreram administração, roles, encomendas, modal destrutivo, alertas e fluxo cliente/consultor sem pedir IDs técnicos.
- Reauditoria final independente: faltam sumário de erros, detalhes/requestId úteis, proteções de duplo submit e ainda existem resíduos técnicos/stub em source. O fecho será limitado aos formulários ativos e verificado sem IDs/copy interna.
- Reauditoria frontend posterior: os labels tipados de pele/privacidade/audit, as oito superfícies e 45 títulos passaram, mas `FaceAnalysisPage` ainda humaniza findings desconhecidos com `replaceAll`, podendo expor tokens internos. O finding regressa a implementação antes da correção fail-closed e respetivo negativo.
- Correção final: `FaceAnalysisPage` usa allowlist explícita e fallback neutro “Indicador cosmético indisponível”; o token desconhecido nunca é transformado em copy. O teste comportamental cobre `future_internal_signal`, preservação de “Hidratação” e manutenção dos dados após erro posterior.
- Fecho final: o parecer frontend independente passou labels/fallbacks, UIs administrativas, selects e títulos; 42 unitários, 86 contracts e os journeys administrativos do `verify:all` ficaram verdes.
- Estado: `VALIDADO` (`... -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-012` - Acessibilidade e responsive

- Observado: nested main, contraste, sem skip/reduced-motion, gráficos apenas visuais.
- Esperado: WCAG AA nos fluxos principais, teclado e viewports 320/375/768/1280.
- Testes: axe, contraste, teclado e overflow.
- Plano ativo: consolidar um único landmark principal por rota, skip-link e foco de navegação; acrescentar nomes contextuais, focus trap nos diálogos, redução de movimento, contraste/touch targets e provas de overflow nos viewports definidos. A automatização axe/browser pertence a G7 e não será substituída por scans estáticos.
- Alterações iniciais: o shell partilhado identifica o landmark `main-content`; páginas públicas/admin montadas dentro dele deixaram de criar landmarks `main` aninhados; o router expõe skip-link e move o foco programaticamente para o conteúdo depois da mudança de pathname. A homepage isolada ainda aguarda reconciliação do seu anchor com o handoff de imagens responsivas.
- Modal: criado `ConfirmDialog` com `role=dialog`, `aria-modal`, foco inicial, ciclo de Tab/Shift+Tab, Escape, restituição do foco e confirmação escrita. A eliminação administrativa de conta usa-o e mantém estado busy/erro por linha.
- Primeiro E2E real: os 12 cenários de overflow 320/375/768/1280 passaram nos três engines, mas Axe encontrou `color-contrast` serious na home/login/catálogo (13/1/4 nós) e o teste do skip-link falhou porque o foco inicial automático no `main` altera a ordem de Tab. O finding permanece aberto até correção/reteste, sem aceitar os smokes estáticos como substituto.
- Reauditoria final independente: evolução usa gráfico/cor sem tabela; tema não persiste a única preferência autorizada e o gate exige o oposto; há touch targets/names contextuais/focus-return ainda frágeis e cobertura autenticada insuficiente. Código, gate e testes Axe/E2E serão ampliados.
- Fecho final: tabela acessível, tema allowlisted, touch targets, focus trap/skip-link e responsive autenticado passaram Axe/teclado/overflow em Chromium, Firefox e WebKit; não existem violações serious/critical nas rotas testadas.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-013` - Configuração e ciclo do servidor

- Observado: defaults silenciosos, health superficial e sem shutdown.
- Esperado: fail-fast, liveness/readiness e fecho HTTP/Mongo.
- Testes: matriz de env, dependency down e SIGTERM.
- Alterações realizadas: adicionados liveness/readiness separados e sanitizados; `server.js` passou a ter arranque injetável e shutdown HTTP/Mongo idempotente em SIGINT/SIGTERM. Se o fecho HTTP exceder o limite, força as ligações ativas e ainda tenta desligar Mongo antes de devolver falha. Os restantes defaults/fail-fast ainda exigem revisão.
- Fail-fast atual: porta limitada a inteiro 1-65535; origins deduplicadas e restritas a origins HTTP/HTTPS sem credenciais/path/query/fragment, com HTTPS obrigatório em production; Mongo exige protocolo+base e valor explícito em production; cifra forte e HTTPS são obrigatórios antes de arrancar. O exemplo IA distingue demo de providers reais sem fallback de credencial.
- Evidência final atual: conjunto focal de configuração/provider/robustez 49/49 e suite API posterior 482/482. Foram cobertos port inválido, origins com path/HTTP em production, Mongo ausente/sem base, cifra fraca, HTTPS, readiness 200/503, 50 health concorrentes e shutdown normal/forçado.
- Risco residual: o alvo permanece académico/local, sem alegação de orchestration/cloud readiness; a reauditoria G7 pode reabrir.
- Reauditoria final independente, severidade efetiva P1: `npm run dev` carrega automaticamente o `.env` existente e pode ligar à URI remota proibida; readiness aceita Mongo standalone embora os fluxos críticos exijam transações. Será criado `dev:local` scrubbed com `MongoMemoryReplSet`, guard loopback/replica set e readiness transacional.
- Correção da race de startup: o arranque HTTP só resolve depois do evento `listening`; erro assíncrono de bind fecha MongoDB antes de propagar a falha. O shutdown imediato deixa assim de chamar `server.close()` sobre um listener ainda não iniciado.
- Evidência pós-correção: o conjunto focal de shutdown/listening/bind passou 4/4; um probe real `runLocalDevelopment()` em `MongoMemoryReplSet` arrancou em loopback e executou start→stop imediato com exit code 0, sem `ERR_SERVER_NOT_RUNNING`.
- Risco residual: a suite integral e a reauditoria independente no estado final ainda podem reabrir; o runtime continua deliberadamente académico/local.
- Reabertura final: o `dev:local` não liga o scheduler de backup opt-in que a documentação apresenta como capacidade operacional; a configuração segura/cleanup têm de fazer parte do lifecycle local.
- Fecho final: configuração fail-fast, readiness transacional, startup awaitable, shutdown e scheduler isolado por modo passaram testes/probes locais e a suite final; o runtime mantém-se académico/local.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-014` - Testes frontend/E2E/browser

- Observado: smokes estáticos, sem teste comportamental.
- Esperado: Vitest/Testing Library, Playwright Chromium/Firefox/WebKit e axe.
- Testes: matriz E2E multi-role e falhas de rede.
- Plano ativo: primeiro acrescentar Vitest/Testing Library/jsdom e ESLint com testes reais de diálogo, hooks, checkout, perfil e auth; depois montar Playwright/axe sobre API+Vite+`MongoMemoryReplSet` isolados. O runtime E2E eliminará env aplicacional herdado e importará a API apenas depois de definir dotenv `/dev/null`, Mongo loopback e IA demo.
- Dependências justificadas: Testing Library/jsdom permitem lifecycle e interação React que os scans Node não provam; ESLint valida hooks/JSX; Playwright/axe são necessários para três engines, teclado, responsive e WCAG. Nenhuma substitui os testes de persistência API já existentes.
- Handoff E2E API recebido, ainda sob revisão coordenada: runtime com environment allowlist-only, dotenv `/dev/null`, MongoMemoryReplSet restrito a `127.0.0.1/orelle_e2e_test`, migrations 001-007, seed mínimo de três roles/produtos/imagens, API+Vite Preview em loopback e teardown em `finally`; `verify-all` falha cedo se os scripts frontend necessários não existirem.
- Frontend comportamental implementado, ainda sem reteste: configuração Vitest/jsdom e setup jest-dom; ESLint flat com globals separados e regras de hooks; scripts `lint`, `test:unit`, `test:contracts`; testes reais de confirmação escrita/foco/Escape, races/abort/preservação de dados nos hooks e perfil GET 404→POST versus existente→PUT.
- Correção após o primeiro lint, ainda sem reteste: removidos seis imports default React obsoletos; cleanup dos hooks captura o gate estável; o draft de decisão acompanha a razão do pedido selecionado; os dois testes com matcher inválido comparam agora `error.message`.
- Integração do orquestrador: API expõe `check:syntax`, `test:e2e` e `verify:all`; o syntax gate inclui agora também `eslint.config.js` e `vitest.config.js`, além do Vite config e sources JS/MJS/CJS.
- Seed E2E ampliado, ainda sem reteste: mantém cliente novo, consultor e admin; acrescenta cliente existente e cliente exclusivo para eliminação. O cliente existente recebe perfil, análise demo concluída, relatório ativo e unlock académico simulado, permitindo guided/recommendations/review sem fabricar IDs no browser. Credenciais continuam apenas em env efémero e nunca em output.
- Handoff Playwright/Axe recebido, ainda sob revisão: config com Chromium/Firefox/WebKit sequenciais e 36 casos em cinco specs para auth/roles, fluxos, acessibilidade, responsive e performance. Parse, lint e listagem passaram no subtask; execução integrada ficou corretamente bloqueada por faltar o alias `test:e2e` no manifest web.
- Manifest web integrado: `test:e2e` publica `playwright test` e o lint inclui `playwright.config.js`. Execução/lint no estado coordenado ainda pendentes.
- Reteste do layer browser: `npm run lint` terminou exit code 0 sem warnings; a listagem Playwright com origin loopback sintética terminou exit code 0 e publicou 36 casos/5 specs em Chromium, Firefox e WebKit, com worker único. A listagem prova discovery/config, não comportamento.
- Evidência final automatizada: o ambiente unitário e o E2E persistente ficaram separados; `verify:all` terminou exit code 0 em 13 gates. Passaram syntax 379 ficheiros, lint, API 74/74 ficheiros e 505/505 testes, Vitest/jsdom 3 ficheiros/8 testes, contracts web 63/63, build Vite de 94 módulos, E2E 28 PASS/8 skips intencionais em Chromium/Firefox/WebKit, Axe, responsive/teclado, budgets, audits e planificação.
- Reauditoria final independente: journeys destrutivos/autenticados e Axe profundo correm sobretudo em Chromium; faltam revogação, eliminação física/retry, falhas de pagamento/offline, evolução/comparação e races do wizard nos testes materiais. A matriz será ampliada após os fixes, sem alegar Safari/Edge reais.
- Primeiro E2E ampliado atual: 42 casos descobertos; 29 passaram, 12 ficaram skipped por desenho fora do Chromium e um falhou. Retry de privacidade/404 do relatório passou. A eliminação terminal nem começou porque a sexta autenticação no mesmo IP loopback recebeu corretamente 429 pelo limite canónico 5/15 min. O harness será corrigido para representar clientes distintos através do único proxy Vite local explicitamente confiado; o rate limit não será aumentado ou desativado.
- Evidência ampliada atual: depois de preservar uma segunda falha real no aviso pós-eliminação e corrigi-la por flash efémero no contexto, lint, 16/16 unitários e build ficaram verdes. A repetição integral terminou exit code 0: 30 PASS e 12 skips intencionais em 42 casos/35,7 s, com nove migrações, cinco utilizadores, três produtos e três imagens numa base efémera. Inclui retry destrutivo/404, eliminação terminal/401, IA demo, pagamento simulado, roles, Axe, teclado, responsive e budgets.
- Fecho final: o agregador executou dinamicamente os 13 smokes e 45 casos Playwright; 33 passaram e 12 journeys mutáveis ficaram skipped intencionalmente fora do Chromium, com cobertura pública/autenticada em cada engine.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-015` - Migrações e observabilidade

- Observado: apenas seeds, métricas best-effort na mesma BD e sem retenção.
- Esperado: migrations versionadas, logs JSON e retenção/alertas locais documentados.
- Testes: lock/checksum/idempotência, redaction e TTL.
- Alterações parciais: runner e 001/002 já validados; criada e registada 003 para invalidar JWT/raw, sessões inválidas/duplicadas/expiradas, normalizar opacas e garantir índices unique/TTL/consulta. A 007 foi criada para TTL de 30 dias apenas em métricas e índices sem retenção destrutiva nos audit trails, mas permanece fora do registry canónico até existirem 004-006, preservando a ordem obrigatória.
- Alteração atual: o registry canónico contém agora, por ordem append-only, 001–008 e calcula checksum sobre cada source real. A antiga nota de 007 fora do registry fica historicamente preservada acima, mas já não descreve o estado atual. A 008 é DML transacional e cifra/minimiza derivados descobertos após a 005 sem alterar checksums anteriores.
- Evidência atual: registry 001-008, checksums/lock/dry-run/up/replay/rollback/fase DDL 6/6 num replica set; migrations 004/005/006 focais, ordem 005→006 e 008 com backfill/sanitização; TTL de 30 dias apenas em métricas; audit trails preservados; sampling HTTP 4/4 e erros sempre registados.
- Risco residual: o runner não torna DDL e registo atomicamente indivisíveis, mas usa lock, DML idempotente e replay comprovado; suite integral/re-auditoria ainda podem reabrir.
- Critérios finais: registry/status/dry-run/up/checksum/lock/replay/rollback/retoma 001-008, TTL 30 dias só em métricas, audit append-only intacto, sampling/erros/redaction e suite integral atual.
- Reauditoria final independente: os novos contratos de barreira/cifra/indexes exigirão migração append-only posterior à 008 e novo registry/checksum/replay; o finding é reaberto antes de qualquer source de migration.
- Evidência da 009: `009_privacy_barriers_and_face_file_encryption` está no fim do registry, usa DML transacional/finalize retomável, normaliza barriers, deduplica relatório/unlock/draft, recifra bytes v1, cifra motivos e cria índices únicos. O reteste atual de migration 009, runner 001–009 e privacy passou 14/14 com dry-run/up/replay/checksum/lock/rollback/retoma e ausência de plaintext; suite integral e E2E continuam pendentes.
- Evidência integral atual: 82/82 ficheiros e 556/556 testes repetiram o registry 001–009, checksums, lock, rollback, retoma, índices, TTL/sampling e todos os consumidores migrados. E2E/reauditoria continuam pendentes.
- Reauditoria final independente: uma prova com lease de 1 s e migração de 1,8 s executou dois runners concorrentes; ambos terminaram fulfilled, a DML correu duas vezes e foram criados dois registos da mesma versão. O runner adquire o lease uma vez, não o renova e a coleção não impõe unicidade de `version`.
- Evidência do lease corrigido: índice `version_1_unique`, heartbeat a cada terço do TTL e verificações de ownership antes/depois de cada fase passaram 7/7 no focal adverso; lease de 1 s com DML de 1,8 s produziu exatamente um runner/DML/registo e recusou o concorrente. A suite combinada posterior terminou 568/568.
- Fecho final: registry 001–009, checksum, lock+heartbeat, dry-run/up/replay/rollback/retoma, TTL e sampling passaram na suite final; o parecer backend independente aprovou o boundary.
- Estado: `VALIDADO` (`... -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P2-016` - Dependências e runtime

- Observado: Node não fixado, ranges e advisories.
- Esperado: Node 24.11.1, lockfiles atuais e zero high/critical não aceite.
- Testes: npm ci/build/test/audit no mesmo estado.
- Alterações realizadas: Node 24.11.1 fixado em `.nvmrc`/engines; Vitest 4.1.10, Vite 8.1.4/plugin 6.0.3, form-data corrigida, Multer removido, dependências G1/G3/PDF exatas e `mongodb-memory-server` local. O lock web foi reparado apenas nas duas entradas transitivas WASM exigidas por Rolldown.
- Evidência final: `npm ci` concluiu em API/web; `npm ls` exit 0 em ambos (API conserva rótulo opcional Sharp WASM, sem missing/invalid e com prune up-to-date); audits explícitos zero; API 404/404; web 7/7 + 8/8, build/config/proxy verdes na árvore pós-ci.
- Alteração posterior: P2-016 é reaberto porque o frontend recebeu onze devDependencies exatas para Vitest/Testing Library/jsdom/ESLint flat config. A instalação adicionou 197 packages e o audit automático terminou em zero, mas este grafo só volta a validar depois de `npm ci`, `npm ls`, audit, lint, testes e build no mesmo lock.
- Evidência final atual: no manifest API já sem o alias legado de backup, `npm ci` instalou 220 packages; no web instalou 234. `npm ls --depth=0` terminou exit code 0 nos dois packages, sem missing/invalid; audits explícitos ficaram a zero. Sobre essas árvores recém-instaladas, o segundo `verify:all` passou 13/13 gates, API 505/505, web 8/8+63/63, lint, build, E2E multi-engine, budgets, audits e planificação.
- Risco residual: duas árvores antigas `node_modules.quarantined-root-owned-20260710` não estão ativas e exigem cleanup externo por ownership histórico; pertencem a P3-005, não ao grafo instalável atual.
- Reabertura processual atual: a remoção do import automático tornou `dotenv` uma dependência direta sem uso e esta foi removida do manifest/lock. Como o grafo mudou, P2-016 regressa a implementação até `npm ci`, `npm ls`, audit e `verify:all` passarem sobre o novo lock; a suite 556/556 na árvore instalada não substitui a reinstalação limpa.
- Evidência pós-ci parcial: `npm ci` instalou 219 packages/audit automático zero; `npm ls --depth=0` saiu 0 sem `dotenv`, missing ou invalid e manteve apenas o rótulo opcional Sharp WASM já conhecido; audit explícito saiu 0/zero vulnerabilidades. Falta `verify:all` nesta árvore antes de validar.
- Evidência final atual: o `verify:all` na árvore pós-ci terminou exit code 0 com 13/13 gates, 397 ficheiros no syntax gate, 556/556 API, 16/16 frontend unit, 72/72 contracts, build, E2E, budgets, audits zero e planificação verde. `dotenv` continua ausente; nenhum missing/invalid foi introduzido.
- Estado: `VALIDADO` (`VALIDADO -> REABERTO -> PRONTO_PARA_RETESTE -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P3-001` - Auth e password

- Observado: registo enumera email, corrida duplica erro e bcrypt trunca >72 bytes.
- Esperado: resposta genérica, `11000` controlado e 8-72 bytes.
- Testes: email existente/concorrência/password Unicode longa.
- Alterações realizadas: removido o precheck enumerável/TOCTOU; o índice único decide atomicamente e apenas duplicate-key de email é convertido em resultado neutro; novo e duplicado recebem o mesmo HTTP 202/body; registo e login medem 8-72 bytes UTF-8 antes de bcrypt.
- Evidência intermédia: 32/32 testes focais verdes, incluindo respostas indistinguíveis, limites exatos, Unicode multibyte, erro `11000` concorrente, erros não relacionados propagados, fluxo HTTP MF0, hash, catálogo e gate JSDoc.
- Evidência final: além dos 32/32 focais, um replica set real recebeu duas inscrições HTTP concorrentes: dois 202/body indistinguíveis, um único duplicate-key `11000`, um documento e hash bcrypt válido. O negativo Unicode aceita exatamente 72 bytes, rejeita 73 com detalhe redigido e não persiste a segunda conta; 2/2 testes em 4,65 s.
- Reauditoria final: o login devolve antes de executar bcrypt quando o email não existe e verifica `accountStatus` antes da password. Isto permite distinguir temporalmente uma conta inexistente de uma credencial errada e expõe 403 de conta inativa sem primeiro provar a password.
- Plano: comparar sempre contra um hash bcrypt válido — real ou placeholder — e só avaliar o estado da conta depois de a password corresponder. Email inexistente e password errada continuam 401/body idênticos; 403 fica reservado a quem apresentou a credencial correta de uma conta inativa.
- Alteração ainda sem validação: `loginUser` executa `bcrypt.compare` contra o hash real ou um placeholder bcrypt cost 12 e só chama `ensureUserCanAuthenticate` depois de correspondência. Os testes passam a exigir compare no email ausente, 401 para password errada de conta suspensa e 403 apenas para a password correta dessa conta.
- Reteste focal: dois `node --check` e `npm test -- tests/mf6.password-hash.test.js tests/auth.session.test.js tests/mf4.integration.test.js --reporter=dot`, CWD `real_dev/api`, terminaram exit code 0; três ficheiros e 23/23 testes em 2,41 s. Email inexistente/password errada percorrem bcrypt e devolvem 401 comum; estado inativo só surge depois da credencial correta; sessões/roles/admin mantiveram-se verdes.
- Suite API posterior: `npm test`, CWD `real_dev/api`, terminou exit code 0; 82/82 ficheiros e 569/569 testes em 32,68 s. O incremento auth e todas as correções backend anteriores ficaram verdes no mesmo estado; falta apenas parecer independente antes de validar P3-001.
- Risco residual: reauditoria G7 pode reabrir; o contrato continua dependente do índice unique de email, agora verificado no teste real.
- Fecho final: respostas indistinguíveis, `11000`, bcrypt 72 bytes, placeholder timing e estado inativo pós-password passaram novamente na suite API integral do gate final.
- Estado: `VALIDADO` (`ABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`).

### `ORELLE-AUD-P3-002` - Seeds e PDF

- Observado: credenciais demo conhecidas/impressas e PDF com xref inválido.
- Esperado: seeds restritas e PDF conforme.
- Testes: produção bloqueia seed; `pdfinfo` sem warning.
- Alterações/evidência PDF: writer manual substituído por `pdf-lib@1.17.1`, paginação/wrapping/Unicode defensivo e ferramenta de amostra não sensível; 13/13 testes passaram, `pdfinfo` reconheceu PDF 1.7/A4 de duas páginas sem warnings e a renderização limpa das duas páginas foi inspecionada sem clipping ou artefactos. O primeiro render teve ruído Fontconfig/área negra e ficou preservado; cache/config isolada demonstrou que era ambiental.
- Alterações seeds: criado um guard comum que só permite `NODE_ENV=development`; todas as funções e runners verificam o guard antes de ligar à BD/escrever, o opt-in de produção foi removido, `seedDemoUsers` deixou de devolver a password e nenhum runner a imprime. O seed de admin foi tornado importável/testável, valida 12-72 bytes e fecha a ligação em `finally`.
- Evidência seeds: checks sintáticos verdes, 3/3 testes focais e execução standalone com `NODE_ENV=production`, dotenv apontado a `/dev/null` e Mongo loopback; terminou no guard com exit code 1 antes de abrir ligação, sem password no output. O exit 1 é o comportamento negativo esperado.
- Estado: `VALIDADO` (`EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`); PDF/seeds e suite integral estão verdes, mantendo reauditoria G7 como possível causa de reabertura.

### `ORELLE-AUD-P3-003` - Evidência e mockup

- Observado: contagens antigas e afirmação falsa de mockup existente.
- Esperado: evidence gerada da execução atual; mockup honestamente bloqueado.
- Testes: smoke documental e validator sem alegações artificiais.
- Alterações realizadas: contrato simulado propagado por RF/RNF, plano total, backlog, matriz, anexos, views, índices e guias; RNF21/RNF22 foram limitados ao alvo académico/local; RNF26/BK-MF8-14 deixaram de aceitar baseline como aprovação visual.
- Correção runtime atual: o hub deixou de declarar `hasMockup:true`, de expor o badge “Mockup” e de marcar áreas como revistas; usa `baseline` local e copy “Fluxo integrado”. O gate estático já não exige ficheiros inexistentes nem alega validação: devolve explicitamente `BLOQUEADO_EXTERNO` e a contagem dos três artefactos externos em falta.
- Evidência: validator com `overall_pass=true`, 44 RF, 31 RNF e 74 entradas coerentes em matriz/backlog/guias; zero mismatches, links partidos, placeholders ou guide issues. `git diff --check` passou e os scans dos documentos canónicos ativos não encontraram contratos financeiros antigos; relatórios históricos foram preservados com nota de supersessão. Esta afirmação não abrange os resíduos de configuração nem a UI ainda pendentes no runtime.
- Risco residual atual: a árvore existe, mas ainda não foi demonstrado neste ciclo que corresponde ao artefacto aprovado nem que o runtime coincide nos viewports exigidos; a comparação visual/browser é obrigatória antes de validar.
- Alteração de condição externa: a retoma de 2026-07-10 encontrou agora `mockup/README.md`, `mockup/src/app/docs/DESIGN-SYSTEM.md` e `mockup/src/app/App.tsx`, todos com timestamp anterior à auditoria. A premissa de ausência deixou de ser verdadeira no estado atual; não se infere aprovação nem correspondência visual a partir da mera existência.
- Comparação estática atual: paleta e estrutura da home têm forte paridade e os dois assets de análise são binariamente iguais, mas o mockup só cobre a home/tokens. Foram identificados desvios que exigem decisão explícita: hero diferente, siglas em vez de ícones, catálogo real em vez de cards fictícios, fluxo IA funcional/autenticado em vez de chat simulado e responsive ainda divergente. A execução do mockup exigiria dependências ausentes e assets externos, pelo que não foi tratada como prova automática.
- Estado runtime corrigido: o hub declara `hasMockup:true`, aponta para `mockup-reference`, conserva `reviewedAreas:[]` e expõe `pending-manual-review`; não alega ausência nem aprovação.
- Decisão explícita do utilizador em 2026-07-10: passar à frente a comparação manual/Figma. Esta decisão não constitui aprovação visual nem prova de paridade; aceita apenas o risco residual de não comparar o runtime com a fonte Figma original.
- Reauditoria semântica independente: apesar do validator verde, guias ativos ainda ensinam `paid`, proxy amplo, transações opcionais, timeouts sem cancelamento, health antigo, E2E ausente e mockup aprovado/ausente de forma contraditória. A aceitação de risco visual continua válida, mas não abrange estes defeitos documentais.
- Evidência pós-correção semântica: 28 documentos ativos foram reconciliados com pagamento/unlock simulado, `/api` same-origin, sessões/CSRF, `dev:local`, readiness transacional, privacy/cifra 009, IA fail-closed, backup staging, AbortSignal, Web Vitals, imagens, E2E/Axe e risco visual. O validator coordenado repetiu 44 RF/31 RNF/74 BK e `git diff --check` ficou verde; scans dos 74 tutoriais não encontraram paths privados, `/api/api` ou contratos financeiros ativos. O único match `paid` pertence ao changelog que regista a remoção; história antiga permanece explicitamente histórica.
- Reauditoria final read-only posterior: `FAIL` semântico apesar de validator/diff verdes. Permaneceram registry 001–008 e snippets de motivos plaintext sem a 009/barreira; staging de backup descrito como validado antes do runtime; RNF/backlog/matriz/MF views ainda `IN_PROGRESS`/validação humana em conflito com `ACEITE_RISCO`; MF1-07/MF7-01 desatualizados sobre badge/revogação; ausência do contrato canónico de unlock simulado do relatório; e snippets standalone/default inseguros em MF0/MF6. O agente corretor recebeu linhas/contratos exatos; AbortSignal e backup devem continuar pendentes até o runtime atual ficar verde.
- Correção documental final: nove guias/template foram reconciliados com audit atómico, cifra v2/migrations 005/006/008/009, WebP `${kind}.webp`, metadata demo canónica e paths pedagógicos exclusivos `apps/api|apps/web`. Validator, diff, fences e scans focais passaram; a mesma auditoria independente ainda tem de confirmar a semântica.
- Reauditoria documental posterior: os cinco clusters exatos passaram, mas a varredura adjacente encontrou DTOs demo incompletos e projeções contextuais sem owner em outros guias ativos. P3-003 regressa a implementação até correção e repetição do mesmo parecer.
- Correção documental: os dois clusters adjacentes foram alinhados aos contratos reais e o coordinator repetiu validator/diff com sucesso; a reauditoria semântica independente continua obrigatória.
- Reauditoria documental posterior: a provenance e o AAD foram aprovados, mas a varredura adjacente encontrou exportações pedagógicas com `userId` em MF6-07/MF7-05. P3-003 regressa a implementação até remover a exposição e repetir o parecer.
- Correção final: exports deixam de publicar o owner e MF1-06 usa o badge canónico; validator/diff/scan residual passaram no estado corrigido.
- Fecho final documental: validator 44/31/74, diff/fences/scans e reauditoria semântica independente terminaram `PASS`, sem residual conhecido. A comparação manual/Figma foi dispensada pelo utilizador e não é apresentada como aprovação.
- Estado: `ACEITE_RISCO` (`BLOQUEADO_EXTERNO -> REABERTO -> ACEITE_RISCO -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> ACEITE_RISCO`).

### `ORELLE-AUD-P3-004` - Acabamento

- Observado: copy interna, título único, imports eager e pequenos problemas mobile.
- Esperado: linguagem de produto, títulos por rota, splitting e layout estável.
- Testes: bundle chunks, títulos e screenshots/viewports.
- Plano ativo: aplicar code splitting por rota, títulos/document language por rota e remover copy interna ainda visível sem alterar contratos pedagógicos/documentais. A primeira intervenção fica limitada ao router/layout; componentes de imagens em alteração paralela não serão tocados até ao respetivo handoff.
- Alterações iniciais: todas as páginas/montra passaram a imports dinâmicos por rota com fallback de loading acessível; um matcher puro atribui títulos humanos por pathname, sem incluir IDs, e o runtime fixa `lang=pt-PT`. Copy interna e validação de chunks continuam pendentes.
- Copy corrigida neste incremento: o hub de consulta mostra “Fluxo integrado” e deixa de alegar alinhamento com um mockup aprovado inexistente; os smokes foram alinhados ao import dinâmico e ao blocker honesto.
- Copy PT-PT corrigida no incremento atual: títulos, estados, labels, mensagens, `aria-label` e nomes de medição deixaram de expor “Catalogo”, “Historico”, “Analise”, “Relatorio”, “Preferencias”, “Sessao”, “Nao” e outras formas visíveis sem diacríticos. Rotas, chaves de telemetria e contratos API não foram alterados.
- Evidência automatizada atual: títulos/lang/foco, chunks lazy, copy PT-PT, build de 94 módulos, viewports 320/375/768/1280, Axe e teclado passaram no `verify:all`; falta apenas a reauditoria independente de acabamento e a revisão manual do mockup, tratada separadamente em P3-003.
- Reabertura de acabamento: apesar do gate verde, o teste comportamental de perfil ainda emite os dois avisos de migração React Router v7 porque o `MemoryRouter` do fixture não ativa os future flags já usados pelo runtime. O teste será alinhado e repetido sem alterar rotas ou comportamento da aplicação.
- Evidência do reteste: `npm run test:unit -- --reporter=verbose`, CWD `real_dev/web`, terminou exit code 0, 3 ficheiros e 8/8 testes em 842 ms, sem qualquer warning React Router. Perfil 404→POST e existente→PUT mantiveram-se verdes.
- Evidência final: o `verify:all` pós-ci repetiu o fixture sem warnings, lint, 63 contracts, build com code splitting, títulos/lang, responsive, teclado e Axe nos três engines.
- Reauditoria final independente: evidence PNG está desatualizada e ainda mostra Mockup/ObjectId/cêntimos/budget falso; permanecem copy/stub e acabamento em source ativo. O runtime/evidence serão reconciliados, mantendo a comparação Figma dispensada pelo utilizador.
- Evidência atual: lint sem warnings, 8 ficheiros/16 testes comportamentais, 72/72 contracts anteriores, build de 96 módulos com code splitting e E2E ampliado 30 PASS/12 skips intencionais. A confirmação após eliminação é agora acessível e resiliente aos redirects concorrentes; copy PT-PT, títulos, viewports, teclado e Axe permanecem verdes.
- Reauditoria frontend posterior: a apresentação anterior ficou verde, mas permanecem duas strings visíveis em inglês/terminologia interna — “Hub consulta IA” e “checkout simulado inválido” — além do fallback cru de findings desconhecidos. O finding regressa a implementação antes da correção e reteste.
- Correção final: “Hub consulta IA” passou a “Consulta assistida”, o erro do pagamento usa “A resposta do pagamento simulado é inválida.” e o fallback de findings deixou de expor tokens. Lint, 42 unitários, 86 contracts e build de 96 módulos passaram; falta parecer independente e gate integral.
- Reauditoria independente posterior: os três resíduos exatos passaram, mas a mesma inspeção encontrou uma última adjacência visível na home — “O hub identifica o modo usado”. P3-004 regressa a implementação antes de substituir a terminologia interna e repetir a auditoria.
- Correção final da adjacência: a home apresenta agora “A consulta identifica o modo usado em cada resultado” e o contract rejeita a frase antiga. Lint, 42 unitários, 86 contracts, build de 96 módulos e scan do bundle passaram.
- Reauditoria independente final do frontend: `PASS`; confirmou zero copy visível `hub`/`checkout` técnico, allowlist/fallback neutro de findings e as novas frases PT-PT. Lint, 42/42 unitários e 86/86 contracts voltaram a passar; o E2E integral será executado pelo gate final.
- Fecho final: code splitting, títulos, copy PT-PT, labels fail-closed, responsive/teclado/Axe e o build de 96 módulos passaram no `verify:all`; o parecer frontend independente ficou `PASS`.
- Estado: `VALIDADO` (`... -> PRONTO_PARA_RETESTE -> REABERTO -> EM_IMPLEMENTACAO -> PRONTO_PARA_RETESTE -> VALIDADO`). A comparação Figma permanece tratada apenas em P3-003.

### `ORELLE-AUD-P3-005` - Segredos e scope local

- Observado: `.env` ignorado mas 0644 e credencial remota requer rotação externa; `real_dev` não é versionado neste checkout.
- Esperado: 0600, nenhum segredo em evidence e execução exclusivamente local; rotação confirmada pelo utilizador.
- Testes: permissões e secret scan por nomes/padrões, sem imprimir valores.
- Alterações/evidência local: novos ficheiros cifrados são 0600; `.env` remoto nunca foi lido/alterado; testes/migrations/backup usam apenas loopback. Árvores npm históricas com ownership root foram isoladas sem apagar em quarentenas inativas (API 60 MiB, web 6,1 MiB), permitindo `npm ci` limpo.
- Evidência final local: `apps/` não tem diff/status; `real_dev/` continua ignorado apenas por `.gitignore:2`; o scan de segredos, excluindo `.env`, dependências, quarentenas e builds, encontrou somente exemplos deliberadamente inválidos/recusados e o próprio comando de scan. Runtime de pagamento ficou sem Stripe/PayPal/MBWay/gateway/URL/fetch; scripts Mongo aceitam apenas `mongodb://` local sem credenciais. O `.env` foi observado apenas por metadata e continua `0644`; não foi aberto nem alterado. As duas quarentenas conservam entradas internas não pertencentes ao utilizador e não fazem parte das árvores ativas reproduzíveis.
- Estado: `BLOQUEADO_EXTERNO` (`EM_IMPLEMENTACAO -> BLOQUEADO_EXTERNO`). Rotação da credencial remota, mudança de modo do `.env` existente e cleanup das duas quarentenas exigem ação explícita externa; nenhuma é falsamente marcada como corrigida.

## Gates

| Gate | Critério | Estado |
| --- | --- | --- |
| G0 | Report, contrato documental simulado e validator | `VALIDADO_COM_RISCO_VISUAL_ACEITE` |
| G1 | Fundação local, sessão, CSRF, rate limit, config e audit | `VALIDADO` |
| G2 | Pagamento simulado transacional e concorrência | `VALIDADO` |
| G3 | Privacidade, upload, cifra e exports | `VALIDADO` |
| G4 | IA dual, consulta e revisão humana | `VALIDADO` |
| G5 | Conta, navegação, admin e formulários | `VALIDADO` |
| G6 | Performance, acessibilidade e acabamento | `VALIDADO` |
| G7 | Backup, testes completos, docs e reauditoria | `VALIDADO_COM_BLOCKERS_EXTERNOS` |

## Migrações implementadas e validadas

1. `001_payment_simulation_contract`
2. `002_order_idempotency_and_legacy_states`
3. `003_auth_sessions`
4. `004_privacy_requests_and_erasure`
5. `005_sensitive_encryption_v2`
6. `006_ai_machine_human_split`
7. `007_retention_and_audit_indexes`
8. `008_sensitive_derivatives_encryption`
9. `009_privacy_barriers_and_face_file_encryption`

Todas passaram dry-run, contagens antes/depois, checksum, lock com heartbeat, validação, replay e capacidade de retomar no `MongoMemoryReplSet` local.

## Blockers e ações externas

- `ACEITE_RISCO`: a árvore `mockup/` existe, mas a comparação manual/Figma foi dispensada explicitamente pelo utilizador em 2026-07-10; não se alega aprovação visual.
- `BLOQUEADO_EXTERNO`: rotação da credencial MongoDB remota e alteração da permissão do `.env` existente (`0644`) dependem do utilizador; o valor nunca foi lido para evidence.
- `BLOQUEADO_EXTERNO`: as duas árvores npm históricas em quarentena contêm entradas com ownership antigo e exigem cleanup externo; não pertencem às árvores ativas validadas.
- `BLOQUEADO_EXTERNO`: Safari/Edge reais não foram executados manualmente; Chromium/Firefox/WebKit passaram em Playwright, sem alegar equivalência a esses browsers.
- `DECISAO_DE_ESCOPO`: aplicação é académica/local; sem alegação de CI/CD ou disaster recovery cloud.

## Matriz RF/RNF -> runtime -> testes

| Contrato | Runtime alvo | Prova mínima |
| --- | --- | --- |
| RF27/RNF17 | checkout + pagamento simulado, sem provider | integração, concorrência e E2E |
| RF32 | stock reduzido uma vez após simulação | transação + 25 pedidos concorrentes |
| RNF12/RNF13/RF41 | consentimento, revogação e eliminação física | filesystem + cascade + E2E |
| RF14/RNF25 | demo explícita ou provider real consentido | unit/contract/provider mock |
| RF42/RF43/RF45-RF47 | sessão -> recomendação -> review -> insight | integração + E2E multi-role |
| RNF06/RNF08 | imagens responsivas e LCP <=3s | build + browser budget |
| RNF15 | engines automatizados; browsers reais honestos | Playwright + checklist manual |
| RNF20/RNF21 | logs seguros e backup local recuperável | redaction + restore verify |
| RNF23/RNF24 | explicabilidade e invariância | contracts + property scenarios |
| RNF27-RNF29 | bateria final e reauditoria | `verify:all` + report |

## Registo cronológico de execução

### 2026-07-09 - Inicialização

- CWD: raiz do repositório.
- Ações: recolha de versões/hashes, confirmação de `real_dev/` ignorado e criação deste report antes de qualquer alteração de código.
- Resultado: report criado; nenhum ficheiro de implementação alterado.
- Próximo passo: alinhar documentação canónica de pagamento e executar G0.

### 2026-07-09 - G2, contrato backend de pagamento simulado

- CWD: `real_dev/api` (comandos lançados a partir da raiz do repositório).
- Alterações: enums/modelo de pagamento sem gateway ou URL, provider local sem I/O, checkout pendente idempotente, endpoint `POST /api/orders/:orderId/payments/simulate`, hash da `Idempotency-Key`, transação de voucher/stock/order/cart e gate logístico transacional.
- Validação: `node --check` nos 13 módulos alterados e pesquisa dirigida nos módulos de pagamento; exit code 0. A UI de checkout continua a apresentar gateways/`checkoutUrl` e `env.js` conserva nomes Stripe legados, ambos pendentes. O hash da chave é guardado mas ainda não é comparado para replay específico por tentativa.
- Estado: evidência intermédia; não fecha findings sem os testes MongoDB de rollback, replay e 25 pedidos concorrentes.

### 2026-07-09 - G2, primeiro reteste unitário

- CWD: `real_dev/api`.
- Comando: `npm test -- tests/paywall-academic.service.test.js`.
- Resultado: exit code 1; 6/7 testes passaram. A falha é uma asserção legada que ainda esperava consumo imediato e estado `paid` no checkout, comportamento deliberadamente substituído pelo fluxo de dois passos.
- Decisão: manter a evidência falhada e atualizar o teste para provar que o checkout pendente não consome voucher/carrinho; novo reteste será acrescentado abaixo.

### 2026-07-09 - G2, reteste unitário após alinhamento do contrato

- CWD: `real_dev/api`.
- Comando: `npm test -- tests/paywall-academic.service.test.js`.
- Resultado: exit code 0; 1 ficheiro e 7/7 testes passaram. O teste revisto confirma preview limitado ao subtotal, estado `awaiting_simulation` e ausência de consumo de voucher/carrinho no checkout.

### 2026-07-09 - G3, CSV Formula Injection

- CWD: `real_dev/api`.
- Primeiro comando: `npm test -- tests/mf7.admin-export-pdf.test.js` na sandbox; exit code 1, 9/13 testes concluídos e quatro cenários Supertest bloqueados por `listen EPERM`. Os seis casos negativos de fórmula passaram; falha ambiental preservada.
- Reteste: o mesmo comando fora da sandbox; exit code 0, 1 ficheiro e 13/13 testes passaram.
- Resultado: `ORELLE-AUD-P1-010` passou por `PRONTO_PARA_RETESTE` e fica `VALIDADO`; fecho definitivo aguarda a reauditoria G7.

### 2026-07-09 - G2, contrato puro do provider local

- CWD: `real_dev/api`.
- Comando: `npm test -- tests/payment-simulation.provider.test.js tests/paywall-academic.service.test.js`.
- Resultado: exit code 0; 2 ficheiros e 11/11 testes passaram.
- Cobertura: estados pendente/sucesso/falha, aviso inequívoco de demonstração, conjunto mínimo de campos e gate estático que falha se o provider contiver `fetch(` ou URL de saída.
- Reteste após limpeza do payload persistido: `node --check` + o mesmo conjunto de 11 testes; exit code 0.
- Reteste após ampliar contratos negativos: `npm test -- tests/payment-simulation.provider.test.js tests/paywall-academic.service.test.js`; exit code 0, 14/14. Cobertos payload de checkout rejeitado, `Idempotency-Key` ausente/insegura e exclusão do hash interno no DTO público. Estes testes não provam comparação do hash, replay de `simulated_failed` ou concorrência.

### 2026-07-09 - G0, contrato documental canónico

- CWD: raiz do repositório.
- Alterações: RF27/RNF17 e guias MF3-03/MF7-06 passaram ao fluxo de dois passos exclusivamente simulado; links canónicos propagados; RNF21/RNF22 assumem apenas alvo académico/local; RNF26/BK-MF8-14 registam o mockup ausente como blocker externo.
- Comando: `bash scripts/validate-planificacao.sh`; exit code 0, `overall_pass=true`, 44 RF, 31 RNF e 74 BK coerentes, sem mismatches, links partidos, placeholders ou problemas de guias.
- Verificações complementares: `git diff --check` com exit code 0; scans por trailing whitespace, contratos financeiros removidos e paths antigos sem matches (exit code 1 esperado para pesquisa vazia).
- Gate: G0 validado; `ORELLE-AUD-P3-003` mantém apenas o blocker externo do mockup.

### 2026-07-09 - G7, primeiro teste do formato de backup local

- CWD: `real_dev/api`.
- Alterações: core EJSON cifrado AES-256-GCM com AAD/checksums, manifest+sidecar, restore restrito a `_restore`, verificação com limpeza, retenção de sete snapshots, quatro CLIs e scheduler apenas com opt-in `dev:local`.
- Comando: `node --check` nos seis scripts seguido de `npm test -- tests/backup-local.core.test.js`.
- Resultado: exit code 1; sintaxe passou e 6/7 testes passaram. O único negativo de tamper não alterou efetivamente o ficheiro devido ao método usado pelo próprio teste, pelo que a promise resolveu; não é evidência de falha do checksum. O reteste será acrescentado, sem remover este resultado.

### 2026-07-09 - G7, reteste do formato de backup local

- CWD: `real_dev/api`.
- Comando: os seis `node --check` e `npm test -- tests/backup-local.core.test.js`.
- Resultado: exit code 0; 1 ficheiro e 7/7 testes passaram.
- Cobertura: chave inválida, AAD/chave errados, URI remota/SRV/credenciais, round-trip EJSON de ObjectId/Date e índices, tamper cifrado, retenção sete e scheduler sem opt-in.
- Estado: `ORELLE-AUD-P1-008` continua `EM_IMPLEMENTACAO` até prova real `backup -> restore _restore -> verify` no replica set efémero.
- Reteste após corrigir deteção CLI em paths com espaços (`fileURLToPath`): quatro `node --check` e os 7 testes; exit code 0.
- Reteste após permitir criação automática da raiz privada: `node --check scripts/backup-local.core.mjs` e os mesmos 7 testes; exit code 0.

### 2026-07-09 - Reconciliação documental pedida pelo utilizador

- Objetivo: comparar os documentos canónicos com as alterações efetivamente presentes, sem documentar trabalho ainda não entregue como concluído.
- Âmbito imediato: contrato G2 já validado, proteção CSV validada e novo backup local parcialmente implementado; G1/G3 só serão descritos após handoff e evidência próprios.
- Regra: relatórios históricos permanecem imutáveis como história; documentos ativos podem apontar para este master report e indicar explicitamente testes ainda pendentes.
- Correções já aplicadas nesta passagem: cabula técnica com fluxo simulado de dois passos; inventário de funções reconciliado para provider/order/controller/validator e proteção CSV; guias ativos MF6-07, MF7-04, MF7-07, MF8-01 e MF8-03 sem configuração, enums, links ou credenciais de provider financeiro.
- Evidência intermédia: pesquisa dirigida deixou apenas referências ainda em tratamento pelo ramo documental de backup e uma entrada frontend que aguarda o handoff do runtime; validator final será registado após integração de todos os ajustes.
- Fontes de entrada corrigidas: `README.md` deixou de alegar cobrança externa, diagnóstico e simulação visual realista; `docs/planificacao/README.md` passou de 39/25/64 para 44 RF, 31 RNF e 74 BK/guias; `docs/RNF.md` descreve o snapshot recuperável e distingue a stack-alvo ainda não validada; a cabula estatística de 2026-07-07 está marcada como snapshot histórico.
- Guias de pagamento reconciliados com o runtime: nomes dos campos, assinatura injetável do provider, erro 400 de carrinho vazio, helpers atuais, rotas `requireAuth` e gate de 25 pedidos concorrentes.

### 2026-07-09 - Primeiro reteste da reconciliação documental

- CWD: raiz do repositório.
- Comando: `bash scripts/validate-planificacao.sh`.
- Resultado: exit code 1 e `overall_pass=false`; contagens e coerência mantiveram-se em 44 RF, 31 RNF e 74 BK, sem links partidos, mismatches ou placeholders, mas o validador encontrou oito lacunas de contrato nos guias `BK-MF7-07` e `BK-MF8-07`: blocos pedagógicos/operacionais, camada de testes de aceitação e metadados da política de testes negativos.
- Decisão: preservar esta evidência falhada, reabrir `ORELLE-AUD-P3-003` e corrigir apenas os contratos estruturais em falta antes de novo reteste.

### 2026-07-09 - Reconciliação documental integrada e revalidada

- CWD: raiz do repositório.
- Alterações integradas: RNF21, planos, matrizes, runbook local e guia `BK-MF8-04` descrevem o snapshot EJSON cifrado, checksums, índices, restore `_restore`, verificação, retenção sete e scheduler opt-in sem alegar a prova replica-set ainda pendente; `BK-MF4-03`/`BK-MF7-05` cobrem CSV Formula Injection e marcam o PDF manual como não conforme; os guias `BK-MF7-07`/`BK-MF8-07` passaram a distinguir IA `demo`/real, consentimento, ausência de fallback e política de não treino, mantendo os findings de runtime abertos.
- Relatórios históricos: apenas receberam nota de supersessão; as evidências anteriores não foram apagadas nem reescritas.
- Primeiro reteste: falha preservada na entrada anterior.
- Correção subsequente: adicionados aos dois guias os blocos pedagógicos/operacionais, pre-requisitos, passos, validação, evidence por camada e política mínima de 2/3 testes negativos exigida pelo contrato canónico.
- Comando de reteste: `bash scripts/validate-planificacao.sh`.
- Resultado: exit code 0 e `overall_pass=true`; 44 RF, 31 RNF e 74 BK/guias, com coverage, consistency, guides e naming verdes; zero links partidos, mismatches, placeholders ou guide issues.
- Evidência complementar recebida: `git diff --check` e pesquisa de trailing whitespace verdes; 21/21 testes unitários sem porta para backup/G2 e 6/6 casos focais de CSV passaram. Estes testes não substituem a prova real de restore em replica set nem o `pdfinfo`, que continuam pendentes nos respetivos findings.
- Estado: componente documental de `ORELLE-AUD-P3-003` novamente validada; apenas o mockup inexistente permanece `BLOQUEADO_EXTERNO`.

### 2026-07-09 - Reauditoria semântica posterior ao validador estrutural

- CWD: raiz do repositório.
- Comandos: pesquisas `rg` dirigidas em `README.md`, `docs/RF.md`, `docs/RNF.md`, backlog, matriz, índices e guias ativos por pagamentos/gateways, modos de IA/fallback, backup/restore, PDF/CSV, diagnóstico, treino e garantias de fairness.
- Resultado: o pagamento, backup, CSV/PDF e IA dual ficaram semanticamente coerentes nos documentos ativos; os matches de gateways restantes pertenciam a relatórios históricos. Foram, contudo, encontradas expressões canónicas ainda ambíguas: `personalização clínica`, relatório com `diagnóstico`, feedback apresentado como treino do modelo e títulos que prometiam simulação visual/garantia absoluta de não discriminação.
- Decisão: reabrir apenas a componente documental, preservar os IDs e paths estáveis, corrigir os títulos/textos públicos para avaliação e pré-visualização cosméticas, registo de feedback sem treino automático e redução verificável do risco de discriminação; acrescentar nota de vigência aos relatórios históricos `real_dev` sem reescrever evidence antiga.
- Revisão do runtime: confirmado que `simulateOrderPayment` só faz short-circuit por estado `simulated_paid` e não compara `payment.idempotencyKeyHash`; `simulated_failed` é novamente aceite. A documentação que descreve replay por chave passa a ser identificada como contrato-alvo e G2 permanece aberto.
- Resíduos confirmados: `env.js` ainda declara `STRIPE_SECRET_KEY`/`stripeSecretKey`, enquanto `CheckoutPage.jsx` conserva gateways e `checkoutUrl`. O report deixa de alegar que a UI era o único residual.

### 2026-07-09 - Correção e reteste da reauditoria semântica

- CWD: raiz do repositório.
- Correções: RF15/RF20/RF23/RF24 e respetivos títulos canónicos passaram a avaliação cosmética, feedback sem treino automático e pré-visualização conceptual; RNF24/BK-MF8-06 deixaram de prometer garantia absoluta; MF1-06, MF1-07, MF2-07 e MF2-08 deixaram de se apresentar como `DONE` enquanto os respetivos findings de IA/visualização permanecerem abertos; MF8-03/MF8-04 distinguem base académica local, prova de restore e scheduler opt-in; backlog histórico de snippets foi marcado como tal.
- Estado G2 documentado: guias, cabulas, inventário de funções e plano total distinguem o contrato-alvo do runtime parcial, incluindo replay específico por chave, UI antiga e resíduos Stripe em configuração. O typo `buildValidatedOrderItems` foi corrigido para `buildOrderItemsFromCart`.
- História: os relatórios `AUDITORIA-IMPLEMENTACAO`, `IMPLEMENTACAO-REAL_DEV` e `CORRECAO-AUDITORIA-IMPLEMENTACAO` de MF3-MF8 receberam no topo uma nota de vigência e link para este report; o conteúdo histórico não foi reescrito.
- Comando: `bash scripts/validate-planificacao.sh`.
- Resultado: exit code 0 e `overall_pass=true`; 44 RF, 31 RNF, 74 entradas em matriz/backlog e 74 guias, com zero problemas de coverage, consistency, guides, naming, links ou placeholders.
- Reteste após alinhar também o estado de `BK-MF1-07`: `bash scripts/validate-planificacao.sh && git diff --check -- README.md docs`; exit code 0, os mesmos 44/31/74/74 e diff sem erros de whitespace.
- Estado: componente documental novamente validada; `ORELLE-AUD-P3-003` regressa a `BLOQUEADO_EXTERNO` apenas pelo mockup ausente.

### 2026-07-09 - Gate documental final desta passagem

- CWD: raiz do repositório.
- Comandos: `bash scripts/validate-planificacao.sh`; `git diff --check -- README.md docs`; pesquisa dos dois paths antigos de guias de gateway nos documentos canónicos ativos; verificação da nota de vigência nos 18 relatórios históricos `real_dev` de MF3-MF8.
- Resultado: todos os comandos com exit code 0; `overall_pass=true`, 44 RF, 31 RNF e 74 BK/guias; zero links, mismatches, placeholders, guide issues, erros de whitespace, paths antigos ativos ou relatórios sem nota de vigência.
- Limite desta conclusão: o gate documental está verde, mas o estado global da correção continua `EM_EXECUCAO_G1_G2_G7`; replay por chave, UI de pagamento, resíduos Stripe de config, IA dual, PDF, restore real e restantes findings não foram convertidos em `PASS` documental.

### 2026-07-09 - Retoma após interrupção do ambiente

- CWD: raiz do repositório.
- Ações read-only: releitura integral deste report, `git status --short` e `bash scripts/validate-planificacao.sh`.
- Resultado: alterações anteriores continuam presentes; planificação mantém `overall_pass=true`, 44 RF, 31 RNF e 74 BK/guias, sem links, mismatches, placeholders ou guide issues.
- Decisão de retoma: continuar G2 pelo replay real por `Idempotency-Key` e checkout frontend; em paralelo avançar G1 pela configuração local, remoção de resíduos Stripe, base same-origin e fixação do runtime. `ORELLE-AUD-P1-003`, `ORELLE-AUD-P2-013` e `ORELLE-AUD-P2-016` passam a `EM_IMPLEMENTACAO` antes das respetivas alterações.

### 2026-07-09 - G1/G7, liveness, readiness e primeiro teste de shutdown

- CWD: `real_dev/api`.
- Alterações: adicionados `/api/health/live` e `/api/health/ready` com readiness Mongo injetável e resposta sanitizada; `/api/health` foi preservado como alias; `server.js` passou a exportar arranque testável e shutdown idempotente de HTTP/Mongo em `SIGINT`/`SIGTERM`, com timeout controlado.
- Comando: `node --check src/app.js && node --check src/server.js && npm test -- tests/mf6.robustness-security.test.js`.
- Resultado: exit code 1 na sandbox; os dois checks sintáticos passaram e 9/16 testes sem porta passaram, incluindo shutdown. Sete cenários Supertest falharam exclusivamente em `listen EPERM: operation not permitted 0.0.0.0`, o ruído ambiental já conhecido; a falha fica preservada e exige reteste fora da sandbox antes de qualquer validação.
- Reteste autorizado fora da sandbox: `npm test -- tests/mf6.robustness-security.test.js`; exit code 0, 1 ficheiro e 16/16 testes passaram, incluindo liveness, readiness indisponível `503`, resposta sanitizada e shutdown idempotente.

### 2026-07-09 - G1, configuração local e bundle same-origin

- CWD: `real_dev/api` e `real_dev/web`.
- Alterações recebidas: Node `24.11.1` em `.nvmrc`/`engines`; remoção de `STRIPE_SECRET_KEY`/`stripeSecretKey` da configuração e exemplo API; cliente web fixado em `/api`; proxy Vite apenas local; defaults de imagem sem loopback persistente; novos gates estáticos de configuração.
- Evidência do handoff: testes de isolamento 5/5, contratos de backup afetados 5/5, build web com 96 módulos, `check:g1-config` e smoke MF6 verdes; scans de configuração Stripe e bundle por loopback sem matches. Revalidação coordenada será registada depois da integração G2.
- Revalidação coordenada parcial: `node --check src/app.js`, `node --check src/server.js` e `npm test -- tests/mf8.test-env.contract.test.js tests/mf8.backup.contract.test.js` passaram com exit code 0 e 10/10 testes; no web, `npm run check:g1-config` e novo build de 96 módulos passaram com exit code 0.
- Estado: `ORELLE-AUD-P1-003`, `ORELLE-AUD-P2-013` e `ORELLE-AUD-P2-016` continuam `EM_IMPLEMENTACAO` até reteste conjunto e auditoria de dependências.

### 2026-07-09 - G2, checkout frontend exclusivamente simulado

- CWD: `real_dev/web`.
- Alterações recebidas: `CheckoutPage` em dois passos, helper de tentativa/idempotência, body vazio no checkout, aviso académico permanente, resumo preservado em erro e remoção de gateway, `checkoutUrl`, redirects e links externos.
- Primeiro smoke: `npm run smoke:g2-checkout` falhou porque o próprio comentário do gate continha o marcador proibido `Math.random`; a falha foi preservada e o comentário corrigido sem enfraquecer o scan.
- Retestes do handoff: unitário dedicado 7/7, smoke G2, build de 96 módulos, smoke MF7 (62 ficheiros) e smoke MF5 feedback passaram; scans de fonte/dist não encontraram Stripe, PayPal, MBWay, `checkoutUrl`, `payment.gateway` ou “Abrir pagamento”.
- Revalidação coordenada: `npm run test:g2-checkout && npm run smoke:g2-checkout && npm run check:g1-config && npm run build`; exit code 0, 7/7 testes, ambos os gates estáticos verdes e build de 96 módulos (`81.55 kB` JS gzip).
- Estado: frontend G2 pronto para reteste coordenado; `ORELLE-AUD-P1-001` permanece `EM_IMPLEMENTACAO` enquanto o backend e a concorrência não fecharem.

### 2026-07-09 - G2, correção do retry frontend após falha terminal

- Revisão integrada: depois de o backend passar a reproduzir exatamente `simulated_failed` para a mesma chave, foi detetado que o botão frontend reutilizava essa chave e repetiria a falha indefinidamente.
- Correção: erros de transporte mantêm a chave atual para retry seguro; uma resposta terminal `simulated_failed` gera uma chave nova apenas para a próxima ação explícita e o botão passa a indicar `Iniciar nova simulação`.
- Comando: `npm run test:g2-checkout && npm run smoke:g2-checkout && npm run build` em `real_dev/web`.
- Resultado: exit code 0; 8/8 testes, smoke G2 verde e build de 96 módulos (`81.60 kB` JS gzip).

### 2026-07-09 - G2, replay backend por Idempotency-Key

- CWD: `real_dev/api`.
- Alterações observadas: `Order.paymentAttempts` guarda, fora do DTO normal, hash, estado, referência, data e snapshot público de cada tentativa terminal; o service verifica primeiro a chave, preserva compatibilidade com o último hash legado, aceita nova chave depois de falha e bloqueia chave diferente depois de `simulated_paid`.
- Comando: `node --check src/models/order.model.js && node --check src/services/order.service.js && npm test -- tests/order-payment.idempotency.test.js tests/payment-simulation.provider.test.js tests/paywall-academic.service.test.js`.
- Resultado: exit code 0; 3 ficheiros e 18/18 testes passaram. Cobertos replay exato de `simulated_failed`, retry com chave nova, replay da falha antiga depois de sucesso, 409 após pago e compatibilidade do último hash legado.
- Reteste HTTP/MF3 autorizado fora da sandbox: `npm test -- tests/mf3.integration.test.js`; exit code 0, 1 ficheiro e 22/22 testes passaram. Cobertos checkout vazio/pending, payload financeiro recusado, voucher apenas em preview, chave obrigatória, simulação transacional, histórico, stock e roles.
- Estado: replay e suite MF3 prontos; G2 não fecha sem failure injection transacional e prova de 25 pedidos concorrentes num replica set real/efémero.

### 2026-07-09 - G1, início da migração para sessões opacas

- Decisão: `ORELLE-AUD-P2-007` passa a `EM_IMPLEMENTACAO` antes de alterar autenticação. O subtask fica limitado a token opaco de 256 bits, hash persistido, TTL/revogação, logout e logout-all; CSRF, rate limiting, proxy e headers mantêm-se abertos até evidence própria.

### 2026-07-09 - G1, primeira validação das sessões opacas

- CWD: `real_dev/api`.
- Alterações observadas: novo `AuthSession` com token HMAC `select:false`, TTL e revogação; runtime cria sessão persistente antes do cookie; `requireAuth` resolve sessão e revalida conta; logout individual/global revogam antes de limpar o cookie. O helper em memória usado pelas suites antigas falha fora de `NODE_ENV=test`.
- Comando: checks sintáticos de model/service/middleware/controller e `npm test -- tests/opaque-session.service.test.js`.
- Resultado: exit code 0; 1 ficheiro e 12/12 testes passaram, cobrindo 256 bits, ausência de formato JWT, persistência sem token bruto, TTL, expiração imediata, revogação individual/global, token adulterado e bloqueio do helper fora de teste.
- Reteste HTTP autorizado fora da sandbox: `npm test -- tests/auth.session.test.js tests/mf0.flow.test.js tests/roles.test.js`; exit code 0, 3 ficheiros e 14/14 testes passaram, incluindo login/cookie HttpOnly, logout com sessão seguinte recusada, fluxo MF0 e autorização por role.
- Estado: sessões prontas para integração HTTP; `ORELLE-AUD-P2-007` continua `EM_IMPLEMENTACAO` por faltar CSRF/Origin/proxy/headers e reteste das suites existentes.

### 2026-07-09 - G1, início do cliente HTTP tipado e cancelável

- Decisão: `ORELLE-AUD-P2-010` passa a `EM_IMPLEMENTACAO` antes de alterar `apiClient`. O subtask atual cobre `ApiError`, status/código/detalhes/requestId, timeout e composição de `AbortSignal`, bem como evento global de 401; guards de race ao nível de cada página permanecem para G5.

### 2026-07-09 - G1, cliente HTTP tipado, timeout e abort

- CWD: `real_dev/web`.
- Alterações: `apiClient` centraliza `ApiError`, envelope público, requestId, timeout por categoria, cancelamento explícito, falha de rede e evento `orelle:session-expired`; `AuthProvider` limpa o utilizador em 401 global. Headers JSON só são adicionados quando existe body não-FormData.
- Comando: `npm run test:g1-api-client && npm run test:g2-checkout && npm run check:g1-config && npm run smoke:g2-checkout && npm run build`.
- Resultado: exit code 0; 5/5 testes HTTP, 8/8 testes checkout, ambos os gates estáticos e build de 96 módulos passaram (`82.25 kB` JS gzip).
- Revisão subsequente: `apiDownload` passou a consumir o `Blob` antes de limpar o timeout/AbortSignal, para que os 30 s cubram o corpo completo e não apenas os headers; `AdminExportsPage` foi alinhada ao DTO de download. Reteste `test:g1-api-client`, `test:g2-checkout` e build passou com 5/5, 8/8 e 96 módulos (`82.27 kB` JS gzip).
- Estado: contrato HTTP base validado; `ORELLE-AUD-P2-010` mantém-se `EM_IMPLEMENTACAO` até os recursos assíncronos das páginas impedirem races/unmount.

### 2026-07-09 - Retoma G1, robustez do registo

- Decisão: `ORELLE-AUD-P3-001` passa a `EM_IMPLEMENTACAO` antes de rever a enumeração de email, a corrida de índice único e o limite bcrypt de 72 bytes.
- Âmbito do subtask: controller/service/validator e testes focais de registo; não altera CSRF, rate limits, packages, `apps/` ou configuração remota.
- Handoff recebido: validator e service medem 8-72 bytes UTF-8 antes de bcrypt; o registo deixou de fazer precheck, trata apenas `11000` do email e o controller devolve sempre 202 com mensagem genérica. O teste unitário concorrente e os negativos Unicode passaram 9/9 no handoff; o Supertest ficou bloqueado por `listen EPERM` na sandbox.
- Reteste coordenado: `npm test -- tests/auth.registration-hardening.test.js tests/auth.register.test.js tests/mf0.flow.test.js tests/mf6.password-hash.test.js tests/mf8.modularidade.contract.test.js tests/mf1.catalog.test.js`, fora da sandbox; exit code 1, 5/6 ficheiros e 31/32 testes passaram. Registo, fluxo MF0, hash e catálogo ficaram verdes; apenas o gate JSDoc recusou `registerUser` porque o bloco excede a janela estática de 700 caracteres.
- Correção após o reteste: o JSDoc de `registerUser` foi condensado sem remover causa, atomicidade, contrato, parâmetros, retorno ou erro, ficando novamente dentro da regra estática existente. O código executável não foi alterado nesta correção.
- Segundo reteste coordenado: o mesmo comando focal, exit code 0; 6/6 ficheiros e 32/32 testes passaram. `ORELLE-AUD-P3-001` passa a `PRONTO_PARA_RETESTE`; validação final aguarda a corrida no índice Mongo real e a suite integral estável.

### 2026-07-09 - Primeiro reteste integral API após integração G1/G2

- CWD: `real_dev/api`.
- Comando: `npm test`, com `NODE_ENV=test` e URI de teste loopback definida pelo próprio script; execução autorizada fora da sandbox para Supertest.
- Resultado: exit code 1; 46 ficheiros executados, 42 passaram e 4 falharam; 344/348 testes passaram.
- Falhas preservadas: um teste de catálogo ainda esperava o estado legado `paid` em vez de `simulated_paid`; três falhas ocorreram no contrato de registo que estava a ser alterado em paralelo (`201` versus `202`, DTO `{created,user}` e JSDoc de `registerUser`).
- Decisão: não classificar o run como verde nem apagar a evidência. Aguardar o handoff focal de registo, alinhar apenas expectativas realmente supersedidas e repetir primeiro os quatro ficheiros, depois a suite integral no mesmo estado estável.
- Correção imediata: a asserção do catálogo foi alinhada ao contrato já implementado `simulated_paid`; o runtime não foi alterado. Reteste focal será registado com o conjunto das restantes falhas.

### 2026-07-09 - G7, tentativa interrompida de preparar o replica set efémero

- CWD: `real_dev/api`.
- Comando: `npm install --save-dev mongodb-memory-server`.
- Resultado na sandbox: exit code 1 por `ENOTFOUND registry.npmjs.org`; nenhum package/lockfile ou módulo foi instalado.
- Retentativa com acesso autorizado: interrompida pelo encerramento do ambiente antes de existir resultado aproveitável; não ficou processo conhecido ativo nem alteração confirmada.
- Decisão: preservar ambas as ocorrências como falha ambiental/interrupção e repetir a consulta/instalação com acesso de rede explícito. `ORELLE-AUD-P1-008`, G2 e G7 continuam abertos; a ausência da dependência não é convertida em `PASS`.
- Consulta atual ao registry: `npm view mongodb-memory-server version engines --json`, exit code 0; versão publicada `11.2.0`, com requisito Node `>=20.19.0`, compatível com o runtime fixado `24.11.1`. A consulta não alterou ficheiros.
- Primeira instalação atual: `npm install --save-dev --save-exact mongodb-memory-server@11.2.0`, exit code 1. O registry respondeu, mas a cache npm global falhou com `EEXIST/EACCES` ao fazer rename de um artefacto `tslib`; verificação posterior confirmou ausência do módulo e de alterações em `package.json`/lockfile. A cache do utilizador não será apagada nem forçada; o reteste usará uma cache isolada em `/tmp`.
- Reteste de instalação: `npm install --save-dev --save-exact mongodb-memory-server@11.2.0 --cache /tmp/orelle-npm-cache`, exit code 0; 44 packages adicionados e lockfile atualizado. A dependência é exclusivamente de desenvolvimento e viabiliza o replica set local sem Docker/`mongod` instalado.
- Resultado de segurança emitido pelo npm durante a instalação: 7 vulnerabilidades no grafo completo (3 moderate, 3 high, 1 critical). Isto é evidência de falha, não aceitação; `ORELLE-AUD-P2-016` continua `EM_IMPLEMENTACAO` e será detalhado com `npm audit` antes de atualizações dirigidas.
- Integração CLI: `package.json` passou a expor explicitamente `backup:create`, `backup:restore`, `backup:verify` e `backup:prune`, mantendo `backup:daily`; nenhum comando de backup foi ainda declarado validado sem o ciclo real no replica set.

### 2026-07-09 - G1/G7, auditoria atual de dependências

- CWD: `real_dev/api` e `real_dev/web`.
- Comando em cada package: `npm audit --json`; ambos terminaram com exit code 1, como esperado perante advisories abertos.
- API: 7 vulnerabilidades (3 moderate, 3 high, 1 critical). A critical está no Vitest `<3.2.6`; Vite/esbuild transitivos exigem a atualização compatível de Vitest; `form-data <4.0.6` é transitiva e Multer `<2.2.0` tem advisories sem fix disponível nessa linha.
- Web: 2 vulnerabilidades (1 moderate, 1 high), ambas na cadeia Vite/esbuild; o audit indica Vite `8.1.4` como correção disponível e major update.
- Diagnóstico `npm ls`: na API, `form-data@4.0.5` vem de `supertest -> superagent`, e Vite `5.4.21` vem de Vitest `2.1.9`; no web, Vite `5.4.21`/esbuild `0.21.5` é direto através do toolchain Vite/plugin React.
- Compatibilidade consultada no registry: Vitest `4.1.10` suporta Node `>=24` e Vite 6/7/8; Vite `8.1.4` e plugin React `6.0.3` suportam Node `>=22.12`; Supertest já está na versão atual `7.2.2`; `form-data` corrigida está em `4.0.6`. Todas são compatíveis com Node `24.11.1`, mas os majors exigem reteste integral.
- Decisão: não executar `npm audit fix --force`. Atualizar ferramentas de teste/build de forma explícita, repetir todas as suites/build e remover Multer na fase G3; `ORELLE-AUD-P2-016` mantém-se `EM_IMPLEMENTACAO`.
- Atualização API: `npm install --save-dev --save-exact vitest@4.1.10 --cache /tmp/orelle-npm-cache`, exit code 0; 16 packages adicionados, 16 removidos e 17 alterados. A contagem npm caiu de 7 advisories para 2 high; o critical do runner e a cadeia Vite/esbuild deixaram de ser reportados. Testes pós-major e detalhe dos dois high continuam obrigatórios.
- Atualização web: `npm install --save-dev --save-exact vite@8.1.4 @vitejs/plugin-react@6.0.3 --cache /tmp/orelle-npm-cache`, exit code 0; Vite/plugin foram movidos corretamente para devDependencies, 11 packages adicionados, 50 removidos e 5 alterados. O audit emitido pela instalação ficou em 0 vulnerabilidades; build/smokes pós-major ainda pendentes.
- Reauditoria imediata: `npm audit --json` terminou exit code 1 na API com exatamente 2 high (`form-data@4.0.5` transitiva, fix disponível; Multer, sem fix na linha atual) e exit code 0 no web com 0 vulnerabilidades. Não existem criticals; `form-data` será atualizada no lock e Multer removido, não aceite como risco.
- Correção transitiva: `npm update form-data --cache /tmp/orelle-npm-cache`, exit code 0; uma package removida e uma alterada. O npm passou a reportar apenas 1 high, correspondente ao Multer que será substituído em G3.
- Reteste web pós-major: `npm run test:g1-api-client && npm run test:g2-checkout && npm run check:g1-config && npm run smoke:g2-checkout && npm run build`, exit code 0; 5/5 + 8/8 testes, gates estáticos verdes e build Vite `8.1.4` concluído (80 módulos pelo novo contador, JS `81,32 kB` gzip). O bundle mantém `/api` same-origin e sem loopback.
- Primeiro reteste API integral pós-Vitest 4: `npm test`, fora da sandbox; exit code 1, 48/49 ficheiros e 363/364 testes passaram. A única falha foi uma asserção `not.toHaveBeenCalled` em `mf8.ai-consultation-review`: Vitest 4 preservou a chamada do mock de módulo feita pelo teste anterior porque o ficheiro usava apenas `restoreAllMocks`, embora o pedido atual tenha devolvido corretamente 400 antes da mutation.
- Decisão: limpar explicitamente o histórico dos mocks entre casos e repetir primeiro o ficheiro focal, depois a suite integral; não alterar o service para satisfazer uma contaminação de teste.
- Correção aplicada: o `afterEach` do ficheiro passa a executar `clearAllMocks` depois de restaurar spies, isolando chamadas sem alterar stubs, runtime ou critério negativo.
- Reteste focal: `npm test -- tests/mf8.ai-consultation-review.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 9/9 testes passaram em Vitest `4.1.10`.
- Segundo reteste API integral: `npm test`, fora da sandbox; exit code 0, 49/49 ficheiros e 364/364 testes passaram no mesmo estado, incluindo sessões, G2, dois replica sets, backup, timeout/shutdown e contratos históricos. Este resultado substitui apenas o estado atual, não apaga o run falhado anterior.

### 2026-07-09 - G1, início do cancelamento transversal por timeout

- Decisão: `ORELLE-AUD-P2-006` passa a `EM_IMPLEMENTACAO` antes de alterar o middleware. O primeiro incremento cria e aborta um `AbortSignal` por pedido, preservando o erro 503 e bloqueando resposta tardia; providers/DB serão ligados ao sinal em incrementos e testes próprios.
- Alteração: o middleware expõe `req.signal`, aborta-o no timeout com o próprio `AppError` 503 e em disconnect, e limpa o temporizador em `finish`/`close`/`aborted`; teste focal cooperativo acrescentado. Validação ainda pendente.
- Validação: `node --check src/middlewares/request-timeout.middleware.js && npm test -- tests/mf6.robustness-security.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 17/17 testes passaram. O novo caso observa o abort, confirma a razão 503 e prova ausência de mutação tardia cooperativa; providers/DB ainda não consomem todos o sinal, logo o finding não fecha.
- Alteração de shutdown posterior: o timeout gracioso passou a chamar `closeAllConnections` quando disponível e a executar `disconnect` mesmo depois da falha HTTP; acrescentado teste negativo que exige rejeição, exit code do processo, fecho forçado e Mongo desligado. Reteste pendente.
- Reteste: `node --check src/server.js && npm test -- tests/mf6.robustness-security.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 18/18 testes passaram. O shutdown normal continua idempotente e o novo caminho de timeout força HTTP, desliga Mongo e assinala a falha.

### 2026-07-09 - G2, concorrência e rollback num replica set efémero

- CWD: `real_dev/api`.
- Alteração: novo teste `order-payment.replset.integration.test.js`, isolado de `MONGODB_URI`, com guard de URI loopback/sem credenciais; cobre 25 checkouts e 25 pagamentos com a mesma chave, replay exato e failure injection em `after_failed_state`, `after_voucher`, `after_stock`, `after_order` e `after_cart`.
- Primeira execução na sandbox recebida do subtask: exit code 1 em `beforeAll` por `listen EPERM 0.0.0.0`; seis testes ficaram skipped. Uma retentativa externa anterior foi interrompida sem resultado e não foi contada como sucesso.
- Reteste coordenado: `npm test -- tests/order-payment.replset.integration.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 6/6 testes passaram em 4,49 s. A prova confirma uma encomenda, uma redução de stock, um consumo de voucher, carrinho apagado, uma tentativa terminal, replay idêntico e rollback integral/retry após os cinco pontos.
- Estado: `ORELLE-AUD-P1-002` fica `VALIDADO`; `ORELLE-AUD-P1-001` passa a `PRONTO_PARA_RETESTE` porque as migrações 001/002 e a reauditoria final ainda não foram executadas; `ORELLE-AUD-P2-005` continua aberto para privacy/review.

### 2026-07-09 - G7, primeiro ciclo real de backup no replica set

- CWD: `real_dev/api`.
- Alteração recebida: teste `backup-local.replset.integration.test.js` com BSON ObjectId/Date/Decimal128/Long/Int32/Binary, coleção vazia, índices unique/TTL/partial, checksums, recusa da base origem, restore `_restore`, comparação e cleanup; não lê env nem expõe URI/chave.
- Execução inicial na sandbox: exit code 1 por `listen EPERM 0.0.0.0`; a retentativa externa anterior foi interrompida sem resultado. Ambas ficam preservadas e não contam como prova.
- Primeiro reteste coordenado fora da sandbox: `npm test -- tests/backup-local.replset.integration.test.js`, exit code 1; o replica set arrancou e o snapshot continha corretamente os quatro índices, mas uma asserção agregada `arrayContaining(objectContaining(...))` não os reconheceu apesar de o diff mostrar todos os campos esperados. A falha ocorreu antes do restore/verify, pelo que ainda não existe PASS do ciclo.
- Decisão: substituir apenas essa asserção frágil por verificações nominais de cada índice e repetir o ciclo completo; nenhuma lógica do backup é alterada sem evidência de defeito core.
- Correção aplicada: o teste constrói um mapa por nome e valida individualmente `email_unique`, `expires_at_ttl` e `active_profiles_partial`; dados, core e critérios de aceitação permanecem inalterados.
- Segundo reteste: `node --check` passou, mas a suite terminou exit code 1 antes do restore porque Extended JSON não relaxado reconstitui `expireAfterSeconds` como BSON `Int32(0)`, enquanto a asserção esperava o primitivo JS `0`; o próprio erro confirma valor semanticamente igual. O próximo ajuste valida o valor numérico sem perder a exigência do índice TTL e deixa o ciclo avançar até ao core de restore.
- Ajuste do teste: o índice continua a ser exigido pelo nome e o TTL é comparado por conversão numérica explícita (`Int32(0) -> 0`); nenhum tipo dos documentos, payload ou rotina de restore foi alterado.
- Terceiro reteste coordenado: `npm test -- tests/backup-local.replset.integration.test.js`, fora da sandbox; exit code 0, 1/1 teste passou em 2,31 s. O ciclo chegou a create, leitura autenticada, recusa da origem, restore `_restore`, comparação documentos/índices/checksums, verify e cleanup mantendo a origem.
- Estado: `ORELLE-AUD-P1-008` passa a `VALIDADO`; G7 permanece pendente porque ainda inclui migrations, suites/E2E, audits e reauditoria integral.

### 2026-07-09 - Início G1/G3, abuso e normalização de uploads

- Decisão: `ORELLE-AUD-P1-009` e `ORELLE-AUD-P2-008` passam a `EM_IMPLEMENTACAO` antes de instalar/substituir o boundary multipart. `busboy` é necessário para limites streaming/cleanup e `sharp` para decode, pixel limit, orientação e re-encode sem EXIF; não existe equivalente seguro no core Node. `helmet` e `express-rate-limit` suportam os controlos HTTP G1 já planeados.
- Consulta ao registry: sharp `0.35.3` (Node `>=20.9`), helmet `8.2.0` e express-rate-limit `8.5.2`/Express `>=4.11` são compatíveis com Node `24.11.1`/Express 4. A consulta de busboy falhou com `EACCES` na cache global npm; a cache não será reparada ou apagada automaticamente e a consulta será repetida em `/tmp`.
- Reteste da consulta com cache isolada: busboy `1.6.0`, Node `>=10.16`; exit code 0 e compatível com o runtime fixado.
- Instalação: `npm install --save --save-exact busboy@1.6.0 sharp@0.35.3 helmet@8.2.0 express-rate-limit@8.5.2 --cache /tmp/orelle-npm-cache`, exit code 0; oito packages adicionados e uma alterada. O único high continua a ser Multer enquanto o import/runtime ainda não for removido.
- Handoff HTTP: Helmet, proxy allowlist `TRUSTED_PROXY_CIDRS` e cinco políticas de rate limit foram integrados em app/auth/upload/IA. Checks sintáticos passaram. Na sandbox, 4/10 testes estruturais passaram e seis HTTP ficaram bloqueados apenas por `listen EPERM`; uma retentativa escalada anterior foi interrompida sem output conclusivo. Nenhum PASS HTTP é inferido; as rotas de upload exigem reconciliação com o subtask G3 antes do reteste coordenado.
- Configuração documentada no runtime: `.env.example` inclui `TRUSTED_PROXY_CIDRS=` vazio e explica que apenas IP/CIDR explícito é aceite; `FORCE_HTTPS` deixou de sugerir que confiar num proxy é automático.
- Handoff upload: Busboy/sharp, normalização, quota e substituição segura foram implementados nos middleware/services/model/controller/validator. Checks sintáticos passaram; primeira suite sandbox teve 3/22 PASS, 18 cenários bloqueados por `listen EPERM` e um timeout real no teste de abort. O cleanup/streams do abort foi corrigido e 2/2 testes sem socket (cleanup parcial + quota) passaram; a tentativa externa anterior foi interrompida e não conta como prova. Riscos abertos: reteste HTTP integral, replica set da substituição, índice para duplicados legados e eventual órfão se unlink falhar após commit.
- Primeiro reteste coordenado G1/G3: checks sintáticos e `npm test -- tests/g1.http-security-rate-limits.test.js tests/face-photo-upload-security.test.js tests/mf1.face.test.js tests/mf6.robustness-security.test.js`, fora da sandbox; exit code 1, 2/4 ficheiros e 42/50 testes passaram. Headers/proxy/rate limits e robustez ficaram integralmente verdes; oito uploads receberam 400 `Número de partes excede...`.
- Causa da falha G3: Busboy emite `partsLimit` ao atingir exatamente o limite configurado, não apenas ao receber uma parte adicional; o middleware tratava o par válido de duas fotografias como excesso. O boundary será ajustado com um slot sentinela e contadores explícitos, mantendo o máximo sem aceitar uma terceira parte.
- Correção: limites internos Busboy usam um terceiro slot sentinela, enquanto contadores próprios continuam a rejeitar acima de 2 ficheiros/2 partes; qualquer field textual é rejeitado explicitamente. Assim o par obrigatório não aciona falso positivo e a terceira parte continua bloqueada.
- Segundo reteste coordenado: exit code 1, 2/4 ficheiros e 48/50 testes passaram. G1/robustez mantiveram-se verdes e seis dos oito uploads anteriores foram corrigidos. Restam dois defeitos focais: o JPEG minúsculo com EXIF retorna genericamente conteúdo inválido, e o upload de 5 MiB + 1 byte não termina antes do timeout de 5 s. Ambos serão diagnosticados sem afrouxar MIME/pixel/size limits.
- Isolamento da causa: a mesma pipeline Sharp com JPEG/EXIF foi reproduzida fora do teste e gerou WebP 2x3 sem EXIF; depois, `face-photo-upload-security` passou 10/10 isoladamente e `mf1.face` passou 12/12 isoladamente. As duas falhas só existem quando os ficheiros correm em paralelo porque ambos removem o mesmo diretório de storage. A correção será um namespace estritamente test-only por worker, sem alterar o path do runtime.
- Correção de isolamento: `FACE_PHOTO_UPLOAD_DIR` acrescenta apenas em `NODE_ENV=test` um namespace sanitizado do worker/PID; o runtime académico mantém exatamente `storage/private/facial-photos`. O teste MF1 passou a usar a constante canónica e deixou de remover storage de outro worker.
- Terceiro reteste coordenado: checks sintáticos + o mesmo conjunto G1/G3, fora da sandbox; exit code 0, 4/4 ficheiros e 50/50 testes passaram em paralelo. Ficam provados Helmet/proxy/quotas, EXIF/orientação/WebP, MIME/decode/dimensão, multipart/abort/quota, substituição física mockada e regressão MF1; replica set da substituição e decompression bomb específico continuam pendentes.
- Scan pós-reteste: `rg` não encontrou `multer`/`MulterError` em `src` ou testes; o único match é a dependência direta ainda presente no package, pronta para remoção dirigida.
- Remoção dirigida: `npm uninstall multer --cache /tmp/orelle-npm-cache`, exit code 0; 8 packages removidos e audit final do comando com 0 vulnerabilidades. O npm emitiu warnings `EACCES` ao tentar limpar diretórios temporários ocultos antigos dentro de `node_modules`; package/lock deixaram de referir Multer. Esses resíduos não serão apagados à força e não contam como dependências instaláveis; `npm ci`/audit serão repetidos no gate.
- Verificação: `npm ls multer --all` devolveu árvore vazia e o scan por `multer|MulterError` em source, testes, package e lockfile não encontrou matches; exit code global 0.
- Reauditoria API: `npm audit --json`, exit code 0; 0 vulnerabilidades em todas as severidades. O web já estava em 0 após Vite 8. `ORELLE-AUD-P2-016` aguarda apenas `npm ci` e reteste integral no mesmo estado antes de avançar.

### 2026-07-09 - Início G5, conta e perfil recorrente

- Decisão: `ORELLE-AUD-P1-007` passa a `EM_IMPLEMENTACAO` antes de alterar o frontend. O incremento cobre redirect pós-login para `/conta`, overview, GET/404/PUT do perfil e links visíveis por role; componentes assíncronos genéricos e restante admin continuam subtasks próprios.
- Handoff: alterados router/layout/login/perfil/estilos, criados dois overviews e helpers/testes G5. Evidência do subtask: 7/7 testes Node, smoke G5, build (83 módulos, `82,66 KiB` JS gzip) e seis smokes de regressão verdes. Revalidação coordenada e inspeção de contratos ainda pendentes; browser/E2E não foi alegado.
- Revalidação coordenada: `node --test tests/accountNavigation.test.mjs`, smoke G5, `check:g1-config`, smoke tema, smoke compatibilidade e build; exit code 0, 7/7 testes, todos os gates verdes e 83 módulos/`82,66 KiB` gzip. `ORELLE-AUD-P1-007` passa a `PRONTO_PARA_RETESTE`; browser/E2E continua pendente.

### 2026-07-09 - Início G1/G2/G7, migrations versionadas

- Decisão: `ORELLE-AUD-P2-015` passa a `EM_IMPLEMENTACAO`; `ORELLE-AUD-P1-001` regressa de `PRONTO_PARA_RETESTE` a `EM_IMPLEMENTACAO` antes de o seu contrato receber as migrações 001/002. O runner deve provar status, dry-run, checksum, lock, idempotência e validação pós-migração sem ler o `.env` remoto.
- Alteração inicial 001: criado módulo nativo Mongo que contabiliza estados `paid` e pendentes/manuais/falhados, converte pagos apenas para `simulated_legacy/simulated_paid`, cancela restantes sem promoção, gera referência determinística quando ausente e elimina metadados externos. Inclui análise e validação transacionais; ainda não foi executado.
- Revisão defensiva 001: a expressão de referência trata campo ausente/null como string vazia antes de `strLenCP`, evitando erro de pipeline em documentos legados incompletos.
- Alteração inicial 002: encomendas sem `checkoutKey` recebem chave determinística, `paymentAttempts` ausente é inicializado e vouchers só são repostos quando o próprio `appliedOrderIds` contém a encomenda cancelada; a reposição remove essa prova na mesma atualização e fica limitada ao valor original. Inclui análise/validação idempotentes; ainda não executado.
- Registo: criado índice ordenado das migrações 001/002 com path do próprio source para checksum real; versões novas só podem ser acrescentadas no fim.
- Runner: criado estado `pending/applied/checksum_mismatch`, dry-run sem lock/escrita, lease global com owner/expiração, checksum SHA-256 do ficheiro, transação por versão, validação e registo atómicos, release em `finally` e replay `skipped`. Nenhum path, URI ou documento entra no resultado público; validação ainda pendente.
- CLI: criado `scripts/migrate.mjs` com `status|dry-run|up`, exigindo `ORELLE_LOCAL_MONGODB_URI` loopback explícita e sem carregar dotenv/`.env`; output contém apenas modo, nome da base e resultados sanitizados.
- Aliases npm: adicionados `migrate:status`, `migrate:dry-run` e `migrate:up`; nenhum foi apontado a configuração remota.
- Teste de integração preparado: replica set efémero com estados financeiros legados, metadados externos, voucher comprovado/não comprovado, status/dry-run sem escrita, aplicação, replay, checksum adulterado, lock ocupado e rollback por validação falhada. Validação ainda não executada.
- Validação sintática: `node --check` nos seis módulos/teste de migration, exit code 0.
- Validação real: `npm test -- tests/migrations.replset.integration.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 4/4 testes passaram em 1,86 s. Dry-run não criou registos/lock nem mudou documentos; 001/002 converteram sem promover, removeram metadados externos e repuseram apenas voucher comprovado; replay foi `skipped`; checksum/lock foram recusados e a validação injetada fez rollback integral/libertou lock.
- Estado: `ORELLE-AUD-P1-001` passa a `VALIDADO` e G2 fica `VALIDADO`. `ORELLE-AUD-P2-015` continua `EM_IMPLEMENTACAO` porque faltam migrações 003-007 e observabilidade/retenção.
- Negativo CLI: `env -u ORELLE_LOCAL_MONGODB_URI npm run migrate:status`, exit code 1 com mensagem sanitizada de URI local obrigatória; não tentou ligação nem carregou `.env`.

### 2026-07-09 - Início G3, PDF estruturalmente válido

- Decisão: `ORELLE-AUD-P3-002` passa a `EM_IMPLEMENTACAO` antes de substituir o gerador manual; a componente seeds permanece separada.
- Workflow PDF: lida a skill PDF integralmente. O plano do utilizador exige `pdf-lib`, que prevalece sobre a preferência genérica da skill; o runtime Codex disponibiliza `pdfinfo` e `pdftoppm` via bundle local, permitindo validação estrutural e inspeção visual sem instalar Poppler no sistema.
- Consulta ao registry com cache isolada: `pdf-lib` atual `1.17.1`, exit code 0.
- Baseline reproduzido sem ficheiro persistente: buffer atual canalizado para o `pdfinfo` bundled; o comando terminou exit code 0, mas emitiu `Syntax Warning: No valid XRef size in trailer`. O PDF manual continua formalmente falhado e não é aceite como válido.
- Primeira instalação: `npm install --save --save-exact pdf-lib@1.17.1 --cache /tmp/orelle-npm-cache` não produziu output nem terminou durante cerca de 90 s no ambiente restrito e foi interrompida, exit code 130. `package.json` e a árvore instalada continuam sem `pdf-lib`; a falha não é convertida em sucesso e será repetida com acesso de rede autorizado.
- Reteste autorizado da instalação: o mesmo comando fora da sandbox terminou com exit code 0; `pdf-lib@1.17.1` ficou fixada em dependencies, cinco packages foram adicionados e o npm reportou 0 vulnerabilidades. A dependência ainda não conta como validação do PDF até aos testes, `pdfinfo` e render visual.
- Alteração PDF: o writer manual foi substituído por `pdf-lib`; `buildSimplePdf` passou a assíncrono, multipágina, com wrapping de valores longos, normalização defensiva de caracteres não suportados, metadados mínimos e numeração de páginas. `buildAdminExport` aguarda o buffer e os testes passaram a carregar a estrutura com `PDFDocument`; validação ainda pendente.
- Checks sintáticos: `node --check src/services/admin-export.service.js && node --check tests/mf7.admin-export-pdf.test.js`, exit code 0 em `real_dev/api`; a suite funcional continua pendente.
- Reteste focal: `npm test -- tests/mf7.admin-export-pdf.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 13/13 testes passaram. A suite carrega o PDF com `PDFDocument`, exige múltiplas páginas para conteúdo longo, tolera Unicode não suportado, preserva a minimização e mantém autorização/headers/CSV; `pdfinfo` e inspeção renderizada continuam pendentes.
- Ferramenta de QA: criado `scripts/create-pdf-validation-sample.mjs` para gerar uma amostra multipágina determinística, sem dados pessoais, com diretório 0700 e ficheiro 0600; execução e inspeção ainda pendentes.
- Geração da amostra: `node --check scripts/create-pdf-validation-sample.mjs && node scripts/create-pdf-validation-sample.mjs`, exit code 0; foi criado um PDF não sensível de 6343 bytes em `real_dev/api/tmp/pdfs`, pronto para `pdfinfo`/render. O artefacto temporário não é evidência estrutural por si só.
- Validação estrutural: o `pdfinfo` bundled executado sobre a amostra terminou com exit code 0 e sem warnings; reconheceu PDF 1.7, duas páginas A4, metadata não suspeita, ausência de JavaScript/forms e 6343 bytes. Falta concluir a renderização e inspeção visual.
- Primeira renderização: `pdftoppm -png -r 144` terminou com exit code 0 e produziu as páginas, mas o Poppler bundled emitiu repetidamente warnings ambientais de Fontconfig por não encontrar configuração/cache gravável. O resultado não é tratado como render limpo; os PNG serão inspecionados e será tentado um rerun com cache/config local isolada.
- Primeira inspeção visual: a página 1 está legível, com título, separador, linhas sem clipping e rodapé; a página 2 apresenta uma área negra anómala no PNG renderizado. Ainda não é possível atribuir o artefacto ao PDF ou ao Fontconfig do renderer, pelo que a inspeção não passa e será diagnosticada/repetida.
- Rerender controlado: `pdftoppm` foi repetido apenas para a página 2 com `FONTCONFIG_FILE=/usr/local/etc/fonts/fonts.conf` e cache isolada em `/tmp`; exit code 0, sem warnings ou output de erro. A imagem corrigida aguarda inspeção visual e o primeiro artefacto anómalo permanece preservado.
- Inspeção final da renderização: a segunda página rerenderizada apresenta fundo branco uniforme, texto legível dentro das margens e rodapé `Página 2 de 2`; em conjunto com a página 1, não há clipping, sobreposição ou conteúdo fora da folha. A componente PDF de `ORELLE-AUD-P3-002` fica validada; o finding permanece `EM_IMPLEMENTACAO` exclusivamente pela componente seeds.

### 2026-07-09 - G3/G7, permissões de storage privado

- Decisão: `ORELLE-AUD-P3-005` passa a `EM_IMPLEMENTACAO` antes de fixar 0600 nos novos ficheiros cifrados; a credencial remota e o `.env` continuam sem ser lidos/alterados e a rotação permanece externa.
- Alteração: novos ficheiros faciais cifrados são criados explicitamente com modo 0600 antes de o claro normalizado ser removido. Validação de permissão ainda pendente.
- Teste reforçado: o cenário EXIF/WebP passa também a ler o mode real do ficheiro cifrado e exige `0600`.
- Validação: `node --check src/services/face-secure-storage.service.js && npm test -- tests/face-photo-upload-security.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 10/10 testes passaram, incluindo mode 0600.

### 2026-07-09 - G3, preparação do teste real de substituição de fotografias

- CWD: `real_dev/api`.
- Alteração: criado `tests/face-photo-replacement.replset.integration.test.js`, isolado de qualquer URI externa, para provar dois documentos ativos, substituição concorrente transacional, remoção física de todos os ficheiros supersedidos, conservação apenas do par final e modo `0600`.
- Validação sintática: `node --check tests/face-photo-replacement.replset.integration.test.js`, exit code 0 em `real_dev/api`.
- Validação real: `npm test -- tests/face-photo-replacement.replset.integration.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 1/1 teste passou em 2,26 s. Foram validados o par ativo, a concorrência, a eliminação física dos bytes supersedidos e o modo `0600`.
- Estado: evidência intermédia verde; `ORELLE-AUD-P2-008` permanece `EM_IMPLEMENTACAO` até ao negativo específico de decompression bomb e à decisão segura sobre falha de cleanup pós-commit.

### 2026-07-09 - G3, endurecimento das seeds locais

- CWD: `real_dev/api`.
- Alterações: guard único de seeds limitado a `NODE_ENV=development`; chamadas colocadas antes de ligações/escritas em users/categories/products/demo/admin; removido o bypass de produção; password deixou de fazer parte do retorno/output; seed admin refatorado com validação de 12-72 bytes e cleanup da ligação; criado teste focal de ambiente e output.
- Checks sintáticos: `node --check` nos seis módulos de seed/guard e no teste focal, todos com exit code 0.
- Teste focal: `npm test -- tests/seed-safety.test.js`, exit code 0; 1 ficheiro e 3/3 testes passaram. Foram cobertos allowlist exclusiva de development, recusa em test antes de escrita e scan de todos os outputs/retornos por password; falta executar o negativo standalone de produção sem carregar `.env`.
- Negativo standalone: `NODE_ENV=production` com `DOTENV_CONFIG_PATH=/dev/null`, segredo de teste e Mongo loopback terminou com exit code 1 no guard antes de `connectDB`; a mensagem foi sanitizada e não expôs credencial. O processo não leu o `.env` remoto nem tentou ligação.
- Estado: `ORELLE-AUD-P3-002` passa a `PRONTO_PARA_RETESTE`; a reauditoria/suite integral ainda podem reabri-lo.

### 2026-07-09 - G3, análise do fluxo de privacidade existente

- CWD: `real_dev/api`; ação exclusivamente read-only nos models/routes/controllers/services de consentimento e pedidos biométricos.
- Resultado: pedidos aprovados fazem apenas eliminação/anonimização lógica; bytes e ownership permanecem, `completed` não depende da ausência física, faltam GET/DELETE de consentimento, GET do próprio pedido, retry canónico e eliminação terminal de conta. O fallback sem transação pode deixar mutações parciais.
- Estado: `ORELLE-AUD-P1-004` passa de `ABERTO` a `EM_ANALISE`; implementação ainda não iniciada.

### 2026-07-09 - G3, início da implementação integral de privacidade

- Decisão: `ORELLE-AUD-P1-004` passa a `EM_IMPLEMENTACAO` antes de qualquer patch. O trabalho é dividido em três contratos sem sobreposição: GET/DELETE de consentimento; pedidos/jobs idempotentes com bytes físicos; eliminação terminal de conta/cascade/sessões.
- Regras preservadas: revogar consentimento bloqueia novo processamento mas não a leitura própria; fotografias são sempre apagadas em delete/anonymize; `completed` exige bytes ausentes; conta `deleted` é terminal.

### 2026-07-09 - G1, validação final do bundle same-origin

- CWD: `real_dev/web`.
- Evidência: config gate verde, build Vite 8.1.4 de 83 módulos/82,66 KiB gzip, `dist` sem loopback, pedido real `/api` encaminhado por Vite entre duas portas loopback efémeras e origin remota recusada com exit code 1 esperado.
- Estado: `ORELLE-AUD-P1-003` passou individualmente por `PRONTO_PARA_RETESTE` e fica `VALIDADO`; G1 continua pendente pelos restantes findings.

### 2026-07-09 - G3, negativo específico de decompression bomb preparado

- CWD: `real_dev/api`.
- Alteração recebida: teste PNG sólido 5001x5000, ambas as dimensões abaixo de 6000 mas total acima de 25 MP, payload abaixo de 5 MiB e compressão superior a 100:1; exige HTTP 400, zero queries/mutações e zero ficheiros finais.
- Check sintático do subtask: exit code 0.
- Execução na sandbox: inconclusiva por `listen EPERM` nos nove casos Supertest; dois casos sem HTTP passaram. Reteste externo do subtask foi interrompido após cerca de 563,8 s sem resultado conclusivo e não conta como `PASS`.
- Risco confirmado read-only: o cleanup pós-commit ignora falhas de `unlink` e não deixa job persistido para retry; a solução correta será outbox/job idempotente na mesma transação, integrada com a fase de privacidade.
- Reteste coordenado dirigido: `npm test -- tests/face-photo-upload-security.test.js -t "decompression bomb" --reporter=verbose`, fora da sandbox; exit code 0, 1/1 caso passou (10 restantes skipped pelo filtro). O PNG 5001x5000 altamente comprimido recebeu 400 antes de qualquer query/mutação e o storage ficou vazio.
- Estado: o negativo específico de decompression bomb está validado; `ORELLE-AUD-P2-008` continua `EM_IMPLEMENTACAO` exclusivamente pelo risco persistente de cleanup pós-commit sem retry durável.

### 2026-07-09 - G1, CSRF e validação de Origin preparados

- CWD: `real_dev/api`.
- Handoff: middleware CSRF, binding HMAC à sessão, endpoint autenticado no-store, proteção de mutações/logout e allowlist Origin coerente com CORS; sete ficheiros passaram `node --check`.
- Suite sandbox `csrf-origin + opaque-session + auth.session`: exit code 1; 15 casos sem HTTP passaram e 10 Supertest falharam exclusivamente por `listen EPERM`. Reteste externo do subtask foi interrompido e é inconclusivo.
- Risco aberto: o frontend ainda não obtém/envia CSRF, pelo que mutações reais do browser seriam recusadas. Nenhum estado verde é alegado antes do reteste backend e integração do cliente.
- Reteste coordenado fora da sandbox: `npm test -- tests/csrf-origin.test.js tests/opaque-session.service.test.js tests/auth.session.test.js --reporter=verbose`, exit code 0; 3 ficheiros e 25/25 testes passaram. Ficam provados HMAC/binding/tempo constante, emissao no-store, Origin/token ausente/alterado/cross-session, logout/logout-all e regressão de login/sessão. O finding continua aberto pela integração frontend e suite integral.
- Integração frontend aplicada: `apiClient` mantém a prova apenas em memória, partilha um único GET `/auth/csrf` entre mutações concorrentes, acrescenta `X-CSRF-Token`, deixa login/registo isentos, limpa a cache em login/logout/logout-all/401/erro CSRF e nunca tenta forjar o header `Origin` protegido pelo browser. Testes unitários foram ampliados; validação ainda pendente.
- Checks sintáticos de `apiClient.js` e do teste unitário atualizado: exit code 0; execução funcional/build ainda pendentes.
- Primeiro teste frontend pós-CSRF: `npm run test:g1-api-client` passou os cinco primeiros casos, bloqueou antes dos dois finais e foi interrompido após cerca de 53 s; exit code 1, 5 pass, 1 cancelled, sem asserção falhada. A execução não é aceite como PASS; será isolado o pending promise/estado partilhado introduzido pela cache CSRF.
- Causa raiz: `apiRequest` passou a aguardar a preparação CSRF mesmo em GET; um caller podia abortar nesse microtask antes de o mock/fetch instalar o listener, ficando uma Promise pendente. Correção mínima: `performApiFetch` deteta o signal já abortado e falha antes de invocar `fetch`; reteste pendente.
- Check sintático da correção de abort: exit code 0.
- Reteste frontend: `npm run test:g1-api-client`, exit code 0; 7/7 testes passaram em 70 ms, incluindo uma única emissão CSRF para concorrência, rotação de sessão, 401, timeout e cancelamento pré-fetch. Build/regressões ainda pendentes.
- Regressão checkout após CSRF: `npm run test:g2-checkout`, exit code 0; 8/8 testes passaram. Build ainda pendente.
- Build web pós-CSRF: exit code 0, Vite 8.1.4/83 módulos; JS inicial ficou em 83,07 KiB gzip. A integração está funcional no cliente; falta reteste API integral e browser real para fechar P2-007/G1.

### 2026-07-09 - Primeiro reteste API integral após G1/G3 consolidado

- CWD: `real_dev/api`; comando `npm test` fora da sandbox.
- Resultado: exit code 1; 54/55 ficheiros e 403/404 testes passaram. A única falha foi o gate estático de JSDoc, que não reconheceu `requireCsrfForAuthenticatedMutation` e `parseFacePhotoMultipart` dentro da janela textual; todas as suites funcionais, HTTP e replica-set passaram.
- Decisão: não alterar runtime para satisfazer o scanner. Condensar/reposicionar apenas os JSDoc completos dessas duas funções e repetir primeiro o gate, depois a suite integral; este run permanece falhado.
- Correção documental no código: os dois JSDoc foram condensados para a janela de 700 caracteres sem remover objetivo, exceção test-only, cleanup/limites, parâmetros, retorno ou erro; nenhum comportamento executável foi alterado. Reteste focal pendente.
- Reteste focal: `npm test -- tests/mf8.modularidade.contract.test.js`, exit code 0; 5/5 testes passaram. Suite integral será repetida no mesmo estado.
- Segundo reteste API integral: `npm test`, fora da sandbox; exit code 0, 55/55 ficheiros e 404/404 testes passaram em 6,73 s, incluindo CSRF, uploads/Sharp, PDF, seeds, migrations/replica sets, backup, pagamento, rate limits e contratos históricos.
- Estados individuais: `ORELLE-AUD-P2-007` e `ORELLE-AUD-P3-002` passam a `VALIDADO`; esta suite não fecha outros findings nem substitui a reauditoria G7.
- Auditorias de dependências no mesmo estado: `npm audit --json` em API e web, ambos exit code 0 e zero info/low/moderate/high/critical. `ORELLE-AUD-P2-016` continua `EM_IMPLEMENTACAO` porque o gate exige ainda `npm ci` limpo seguido dos testes/build.
- Primeira tentativa `npm ci --cache /tmp/orelle-npm-cache` na API não produziu output nem terminou durante cerca de 50 s no ambiente restrito e foi interrompida, exit code 130. Não é aceite como reinstalação limpa; a árvore instalada pode ter ficado parcial e será verificada/reposta com acesso autorizado antes de qualquer novo teste.
- Verificação pós-interrupção: `npm ls --depth=0` terminou exit code 0 e listou as dependências esperadas, mas assinalou `@img/sharp-wasm32@0.35.3` extraneous; a árvore não é considerada limpa até um `npm ci` concluído.
- Reteste autorizado de `npm ci`: exit code 243 por `EACCES` ao remover um diretório temporário oculto antigo `.buffer-from-*` dentro de `node_modules`. Não houve falha de lockfile/registry; não será usado sudo nem apagamento destrutivo implícito. É necessária inspeção de ownership/permissões e correção mínima dirigida antes de repetir.
- Inspeção: foram encontrados oito diretórios staging ocultos antigos (`.append-field-*`, `.buffer-from-*`, `.concat-stream-*`, `.multer-*`, `.readable-stream-*`, `.string_decoder-*`, `.typedarray-*`, `.util-deprecate-*`), todos `root:staff`/0755, datados do mesmo instante e fora da árvore instalável. `node_modules` é do utilizador. A remoção dirigida exige autorização explícita por ser destrutiva, apesar de serem resíduos gerados.
- Alternativa não destrutiva tentada: criada quarentena vazia em `/tmp` e tentado `mv` explícito dos oito diretórios; exit code 1, todos recusados com `Permission denied`, sem ficheiros movidos. Será repetido fora da sandbox por continuar reversível e estritamente limitado aos resíduos identificados.
- Reteste autorizado do mesmo `mv`: exit code 1 com as mesmas recusas; a elevação da sandbox não altera o ownership do processo. Próxima alternativa reversível: renomear a árvore `node_modules` inteira (a entrada-pai pertence ao utilizador), instalar uma árvore nova pelo lockfile e manter a antiga intacta para limpeza externa posterior.
- Quarentena reversível: `node_modules` foi renomeado integralmente para `node_modules.quarantined-root-owned-20260710`, exit code 0; nenhum conteúdo foi apagado. A API está deliberadamente sem árvore ativa até `npm ci` concluir; a árvore antiga exigirá limpeza externa posterior por conter entradas root-owned.
- Instalação limpa API: `npm ci --cache /tmp/orelle-npm-cache`, fora da sandbox; exit code 0, 233 packages instalados a partir do lockfile e audit automático com 0 vulnerabilidades. Falta validar `npm ls`, suite integral e audit explícito nesta árvore nova.
- Pós-ci: `npm audit --json` terminou exit code 0/zero vulnerabilidades. `npm ls --depth=0` também terminou exit code 0, mas continua a rotular `@img/sharp-wasm32@0.35.3` como extraneous mesmo numa árvore recém-criada; será confirmado contra lock/metadata do Sharp antes de decidir se é ruído opcional ou desvio real.
- Diagnóstico: o package está presente no lock como optional e é dependência dos builds opcionais FreeBSD/WebContainers declarados pelo próprio `sharp@0.35.3`; não é dependência direta nem advisory. O npm instalou-o/hoistou-o no Darwin mas não o associa na árvore ativa, daí `extraneous` com exit code 0. Será tentado `npm prune` normal, sem alterar package/lock, antes de aceitar o ruído.
- `npm prune` normal terminou exit code 0 e declarou a árvore up to date; não alterou package/lock. A classificação opcional será aceite apenas se `npm ls` continuar exit 0 e Sharp/testes funcionarem na árvore pós-ci.
- Reteste `npm ls --depth=0`: exit code 0, dependências diretas corretas e o mesmo único rótulo extraneous opcional `@img/sharp-wasm32`; nenhum package em falta/inválido. A aceitação técnica fica condicionada à suite integral pós-ci e ao audit zero já obtido, sem promover o WASM a dependência direta artificial.
- Suite API pós-ci: `npm test`, fora da sandbox; exit code 0, 55/55 ficheiros e 404/404 testes passaram em 7,39 s, incluindo Sharp/decompression bomb, PDFs, replica sets e CSRF. A árvore ativa nova está funcional; falta repetir o processo limpo no web e registar a quarentena antiga como cleanup externo.
- Primeiro `npm ci` web: exit code 1/EUSAGE antes de instalar porque package/lock não estão sincronizados; o npm identifica `@emnapi/core@1.11.1` e `@emnapi/runtime@1.11.1` em falta no lock. Não é falha ambiental nem é aceite como PASS; será localizado o requester transitivo e atualizado apenas o lock de forma dirigida antes de repetir.
- Causa: o lock contém `@rolldown/binding-wasm32-wasi@1.1.5`, que declara exatamente esses dois packages, mas faltam as respetivas entradas `node_modules/@emnapi/core` e `node_modules/@emnapi/runtime`. A árvore local não os usa no Darwin, mas `npm ci` valida todas as dependências opcionais do lock. Será executado `npm install --package-lock-only --ignore-scripts` sem alterar versões diretas.
- Hash antes da correção dirigida: lock web `9e23bb86...b7633f`, package web `3cfa6f51...204b8`; o segundo servirá para provar que as dependências diretas não foram editadas pelo refresh.
- Refresh dirigido: `npm install --package-lock-only --ignore-scripts --cache /tmp/orelle-npm-cache`, fora da sandbox; exit code 0, sem instalação/scripts e audit zero. Falta verificar hashes/entradas e repetir `npm ci`.
- Verificação: package web manteve exatamente o hash `3cfa6f51...204b8`; lock passou a `fecd6efd...fe69` e contém as duas entradas nested sob `@rolldown/binding-wasm32-wasi`. Nenhuma dependência direta foi alterada; `npm ci` será repetido.
- Segundo `npm ci` web: o erro de sincronização desapareceu, mas a limpeza terminou exit code 243/EACCES em `node_modules/fsevents/fsevents.js`, indicando outra árvore histórica com ownership incorreto. Será aplicada a mesma quarentena reversível da árvore inteira, sem apagar conteúdo, antes de instalar novamente.
- Inspeção encontrou apenas `fsevents` root-owned nessa árvore; `node_modules` web foi renomeado reversivelmente para `node_modules.quarantined-root-owned-20260710`, exit code 0, sem apagamento. A árvore antiga fica para cleanup externo; uma instalação ativa nova será criada pelo lock.
- Instalação limpa web: `npm ci --cache /tmp/orelle-npm-cache`, fora da sandbox; exit code 0, 25 packages instalados e audit automático zero. Falta `npm ls`, audit explícito, testes e build nesta árvore.
- Pós-ci web: `npm ls --depth=0` exit code 0 sem missing/invalid/extraneous; `npm audit --json` exit code 0 e zero vulnerabilidades. Testes/build continuam pendentes.
- Testes web pós-ci: `test:g1-api-client` 7/7 e `test:g2-checkout` 8/8, ambos exit code 0. Config/proxy/build ainda pendentes.
- Build web pós-ci: exit code 0, Vite 8.1.4/83 módulos, JS 83,07 KiB gzip. Gate config/proxy ainda pendentes.
- Gate config pós-ci: exit code 0; Node 24.11.1, `/api` same-origin e três artefactos sem loopback. Resta repetir o proxy HTTP efémero.
- Proxy pós-ci: `npm run test:g1-dev-proxy`, fora da sandbox; exit code 0 e pedido `/api` encaminhado apenas em loopback.
- Estado: `ORELLE-AUD-P2-016` passou individualmente por `PRONTO_PARA_RETESTE` e fica `VALIDADO`; as árvores antigas em quarentena continuam uma ação externa de permissões em P3-005.

### 2026-07-09 - G1/G7, migrações 003 e 007 preparadas

- CWD: `real_dev/api`.
- Handoff: criadas `003_auth_sessions` e `007_retention_and_audit_indexes`; 003 ficou no registry após 002, enquanto 007 é testada por injeção explícita e só poderá entrar depois de 004-006. A 007 não elimina audit logs e aplica TTL apenas a métricas técnicas.
- Checks: `node --check` nos dois módulos, registry e teste, exit code 0.
- Primeira integração na sandbox: `npm test -- tests/migrations.replset.integration.test.js`, exit code 1 em `beforeAll` por `listen EPERM 0.0.0.0`; cinco testes ficaram skipped.
- Reteste externo do subtask: interrompido depois de cerca de 1637 s sem resultado conclusivo; não conta como `PASS`. Permanecem por validar transações de índices e normalização real; o coordenador repetirá o focal com timeout controlado.
- Reteste coordenado: `npm test -- tests/migrations.replset.integration.test.js --reporter=verbose`, fora da sandbox; exit code 1, 1/5 passou e 4/5 falharam rapidamente. Causa raiz confirmada: MongoDB recusa `listIndexes` dentro de uma transação multi-documento (`OperationNotSupportedInTransaction`, code 263); 003/007 misturaram DML transacional com inspeção/DDL de índices. A falha contaminou também replay/rollback e não é aceite como PASS.
- Correção aplicada: o runner ganhou modo explícito `transaction_then_finalize`: DML confirma numa transação, DDL idempotente executa sob o mesmo lock global fora da transação, validação completa corre depois e o registo só é criado no fim. Se houver interrupção entre fases, a ausência do registo força replay idempotente. 003/007 separaram `up` de `finalize`; checks e reteste ainda pendentes.
- Contrato interno/JSDoc foi alinhado para não alegar atomicidade impossível entre DML e DDL; o modo transacional normal de 001/002 mantém validação/registo atómicos, enquanto 003/007 assumem explicitamente replay retomável sob lock.
- Checks após a correção: `node --check` no runner, 003, 007 e teste de integração, todos com exit code 0; reteste no replica set ainda pendente.
- Reteste após separação DML/DDL: o mesmo comando no replica set efémero terminou com exit code 0, 1 ficheiro e 5/5 testes passaram em 3,83 s. Foram provados status/dry-run, 001/002/003, invalidação sem promoção de credenciais, cinco índices de sessão, replay/checksum, lock/rollback e 007 isolada com TTL de 30 dias apenas em métricas e audit logs intactos.
- Estado: 003 e a implementação isolada de 007 ficam validadas; `ORELLE-AUD-P2-015` permanece `EM_IMPLEMENTACAO` por faltar 004-006, registo canónico posterior da 007 e restante observabilidade/retenção.
- Teste adicional preparado: failure injection na primeira fase DDL exige ausência de registo/lock, DML idempotente preservado e replay posterior com índice/validação/registo únicos; ainda não executado.
- Check sintático do teste de replay DDL: exit code 0; integração 6/6 ainda pendente.
- Reteste final focal: exit code 0, 1 ficheiro e 6/6 testes passaram em 4,00 s. A falha DDL injetada deixou zero registos/locks, conservou um único estado DML idempotente e o segundo run concluiu índice, validação e um único registo; fica demonstrada a retomabilidade explícita do modo faseado.

### 2026-07-09 - Segunda retoma após interrupção e análise inicial G4

- CWD: raiz do repositório; ação read-only seguida apenas da atualização deste report.
- Comandos: `wc -l` e leitura integral por blocos das 905 linhas deste master report; pesquisa dirigida em `real_dev/api/src`, `real_dev/api/tests` e `real_dev/web/src` pelos contratos de provider, fallback, sessão guiada, recomendações e revisão humana. Todos terminaram com exit code 0; a pesquisa foi sanitizada e não leu `.env`, URI, credenciais, fotografias ou dados pessoais.
- Resultado: G2 permanece `VALIDADO`; os três subtasks G3 retomaram sem sobreposição intencional. Em G4 confirmou-se que o modo `local` é apresentado como análise, que rede/timeout/5xx em providers reais fazem fallback local e que a persistência não distingue demo/provider/version. `ORELLE-AUD-P1-005` passou por `EM_ANALISE` e fica `EM_IMPLEMENTACAO` antes do primeiro patch de runtime; o plano/ficheiros/riscos/testes focais foram registados na ficha.
- Estado global: atualizado de `EM_EXECUCAO_G1_G2_G7` para `EM_EXECUCAO_G1_G3_G4_G7`, refletindo os gates efetivamente ativos sem reabrir G2.

### 2026-07-09 - G4, primeiro incremento da configuração IA dual

- CWD: `real_dev/api`; alteração ainda não validada.
- Alteração: `env.js` passou a aceitar apenas `demo|external|openai`; `local` é alias temporário exclusivamente em development e valores desconhecidos falham cedo. Production recusa demo; modos reais exigem credencial e versão do aviso, e `external` exige também URL e allowlist exata sem wildcard/protocolo/path. A configuração pública guarda apenas nomes/hosts e nunca regista valores de credenciais.
- Estado: `ORELLE-AUD-P1-005` mantém-se `EM_IMPLEMENTACAO`. Checks/configuração negativa e compatibilidade da suite ainda estão pendentes; a alteração não é tratada como PASS.
- Alteração provider ainda não validada: a antiga baseline local passou a `demo-skin-analysis`, com `mode=demo`, `isDemo=true`, versão e texto inequívoco de valores sintéticos derivados apenas de metadados técnicos. `analyzeSkinPhotos` deixou de capturar erros reais para produzir demo, verifica configuração e propaga cancelamento prévio; `openai`/`external` agora devolvem a falha original.
- Alteração de boundary real ainda não validada: o host `external` tem de pertencer à allowlist exata; o timeout interno compõe o `AbortSignal` do pedido; respostas JSON ficam limitadas a 256 KiB mesmo sem `Content-Length`; resultados reais recebem `mode`, `isDemo=false` e versão. Cancelamento do caller e timeout permanecem erros, nunca acionam demo.
- Alteração de persistência ainda não validada: `FaceAnalysis`, `FaceReport` e `ProductRecommendation` passaram a guardar modo, indicador demo e versão do provider; criação/DTO/histórico propagam esses campos e o resumo de relatório demo começa por avisar que os valores são simulados. O `AbortSignal` do budget passa até ao provider. Dados legados e mocks sem estes campos exigem migration/reteste antes de qualquer validação.
- Falha concorrente preservada: o primeiro arranque do novo teste replica-set de eliminação de conta terminou antes da recolha (exit code 1/0 testes), porque `dotenv/config` descobriu no `.env` real o valor legado `AI_PROVIDER_MODE=local`, agora corretamente recusado em `NODE_ENV=test`. O conteúdo do ficheiro não foi lido nem registado; apenas o nome do modo apareceu na exceção.
- Correção de isolamento ainda não validada: o script `npm test` define agora `DOTENV_CONFIG_PATH=/dev/null`, Mongo loopback e `AI_PROVIDER_MODE=demo`, impedindo a suite inteira de descobrir configuração remota. Esta alteração também pertence a `ORELLE-AUD-P3-005`; o reteste tem de provar o isolamento antes de ser aceite.
- Alteração UI ainda não validada: criado um badge textual de proveniência, com borda e não dependente apenas de cor, aplicado à análise, relatório bloqueado/desbloqueado, recomendações e histórico. Em demo, a mensagem visível declara “Demonstração académica — resultado simulado, sem análise por IA”; em modo real mostra apenas versão pública, sem host/chave.
- Exemplo de configuração atualizado sem segredos: default `demo`, versão obrigatória do aviso e allowlist exata documentadas; `openai` deixou de ser descrito como opcional quando esse modo é selecionado. O `.env` real permaneceu intocado e não foi aberto.
- Separação de credenciais ainda não validada: `openai` usa apenas `OPENAI_API_KEY`; `AI_PROVIDER_KEY` deixou de funcionar como fallback ambíguo e fica reservado ao modo `external`.
- Testes G4 atualizados, ainda sem execução: passaram a exigir identidade demo explícita, alias `local` só em development, falha de arranque real incompleto, ausência de fallback em rede/5xx/timeout, allowlist antes de `fetch`, limite de resposta, metadados de provider e propagação de cancelamento do pedido.
- Fixtures MF1/MF6 e o contrato RNF25 foram alinhados aos novos campos demo/provider e ao `AbortSignal`; nenhum teste foi ainda declarado verde após estas alterações.
- Contrato visual extraído para helper puro e suite web `test:g4-ai-mode` com três casos: demo explícita, provider real sem configuração sensível e metadata contraditória tratada como demo. Execução ainda pendente.
- Checks sintáticos: `node --check` em 14 ficheiros G4 de configuração, providers, models, services e testes, CWD `real_dev/api`; todos terminaram com exit code 0. Isto prova apenas parsing, não comportamento.
- Primeiro reteste API G4: `npm test -- tests/mf7.external-ai-provider.test.js tests/mf8.image-purpose-limit.test.js tests/mf1.face.test.js tests/mf6.face-analysis-performance.test.js --reporter=verbose`, CWD `real_dev/api`, fora da sandbox; exit code 0, 4 ficheiros e 47/47 testes passaram. O comando exibiu explicitamente `DOTENV_CONFIG_PATH=/dev/null`, Mongo loopback e `AI_PROVIDER_MODE=demo`. Cobertura: identidade demo, config real negativa, credenciais separadas, nenhum fallback em rede/4xx/5xx/timeout, allowlist, resposta 256 KiB, cancelamento transversal, propósito/sem treino, persistência/DTO e budget. Warnings sanitizados eram negativos HTTP esperados.
- Reteste web G4: `npm run test:g4-ai-mode`, CWD `real_dev/web`, exit code 0 com 3/3 casos. `npm run build` no mesmo estado terminou exit code 0, Vite 8.1.4/85 módulos, JS inicial 83,32 KiB gzip; o badge e as quatro páginas compilaram. Browser/E2E e consentimento específico continuam pendentes, logo o finding não avança de estado.

### 2026-07-10 - Terceira retoma após interrupção

- CWD: raiz do repositório; ações read-only e coordenação, sem alteração de runtime.
- Comandos: `wc -l` e leitura integral por blocos das 935 linhas deste report; exit code 0. Confirmou-se G2 validado, G3/G4 em implementação e o primeiro incremento IA com 47/47 API, 3/3 web e build verde, sem consentimento específico ainda.
- Coordenação: os subagentes antigos já não estavam ativos após a interrupção. Foram iniciadas três revisões de retoma, com scopes sem sobreposição e proibição de editar `app.js`, package/env, este report ou `apps/`: consentimento facial, eliminação terminal de conta e pedidos/jobs de privacidade. Apenas o coordenador montará rotas, resolverá integração e registará evidence.
- Estado: nenhum handoff é tratado como PASS antes de checks/testes próprios e revisão coordenada.

### 2026-07-10 - G4, análise da consulta e revisão humana

- CWD: `real_dev/api` e `real_dev/web`; pesquisa/leitura read-only de services, models, controllers, routes, validators, testes e wizard, exit code 0.
- Resultado: confirmado ObjectId técnico opcional no request, contexto vazio/review ausente sem ID, submissão sessão/histórico não atómica, regeneração destrutiva de feedback/nota/decisão, leituras de consultor sem audit e decisão concorrente read/mutate/save. Nenhum `.env`, dado pessoal ou provider externo foi acedido.
- Estados: `ORELLE-AUD-P1-006`, `ORELLE-AUD-P2-001` e `ORELLE-AUD-P2-004` passaram por `EM_ANALISE` e ficam `EM_IMPLEMENTACAO` antes de alterações de runtime; causa, plano, regressões e testes foram registados individualmente.

### 2026-07-10 - G4, separação machine result / human override

- Alterações ainda não validadas: recomendações e reviews ganharam snapshots `machineResult` e `humanOverride`; regeneração atualiza apenas o snapshot de máquina e inicializa status/feedback/notas/override exclusivamente no insert. O refresh de review deixou de repor estado, insight, reviewer ou notas e o par utilizador+sessão passou a índice unique. A decisão humana preenche o override separado sem remover o audit trail.
- Ajustes humanos de recomendações passaram também a persistir `humanOverride` com decisão, nota, reviewer e instante; testes focais foram alinhados para exigir que `$set` de regeneração nunca contenha status/feedback/nota/override e que esses defaults existam apenas em `$setOnInsert`. Ainda sem execução.
- Compatibilidade: campos públicos legados permanecem como projeção durante a migration 006; fixtures e testes que leem `$set.feedback/status/consultantNote` podem falhar e serão alinhados apenas ao contrato substituído. Compare-and-set/atomicidade da decisão ainda não foram implementados neste incremento.
- Estado: `ORELLE-AUD-P2-004` mantém-se `EM_IMPLEMENTACAO`; sem checks/testes ainda.
- Checks sintáticos em seis ficheiros de model/service/teste deste incremento, CWD `real_dev/api`; todos exit code 0. Estado funcional ainda pendente.
- Reteste focal: `npm test -- tests/mf8.enriched-recommendations.test.js tests/mf8.ai-consultation-review.test.js --reporter=verbose`, fora da sandbox; exit code 0, 2 ficheiros e 15/15. Rejeição do ID, seleção automática, contexto/no-session, ausência de resets em `$set`, snapshots machine, decisão/override/audit e negativos 401/403/400/409 ficaram verdes. Logs são cenários negativos sanitizados. Ainda falta CAS real concorrente e transação multi-documento.

### 2026-07-10 - G4, CAS e auditoria de consultor

- Alterações ainda não validadas: criado audit log IA separado para `list|detail|decision`, com ator/role/review/contagem/requestId minimizados e sem payload revisto. Controllers passam o ator autenticado; list/detail só devolvem depois de acrescentar o evento. A eliminação de conta desassocia o ator e conserva a prova temporal.
- Decisão humana: leitura/validação e compare-and-set `status in pending|needs_clarification AND humanOverride=null`; a segunda decisão recebe 409. Em runtime ligado, CAS, ajustes de recomendações e audit `decision` executam numa única transação; falha reverte tudo. `needs_clarification` também grava override e não aceita uma segunda decisão implícita.
- Estado: `ORELLE-AUD-P2-001`, `ORELLE-AUD-P2-004` e componente G4 de `ORELLE-AUD-P2-005` continuam `EM_IMPLEMENTACAO`; fixtures/checks/replset ainda pendentes.
- Fixtures focais passaram a simular o CAS e exigir audit em list/detail/decision; account erasure desassocia o ator do novo log. `node --check` nos cinco ficheiros alterados/testados terminou exit code 0. Comportamento e concorrência real ainda pendentes.
- Teste replica-set preparado, ainda não executado: duas decisões concorrentes, rollback integral se o audit falhar e audits de list/detail sem ator nos DTOs. Usa apenas URI loopback efémera e models reais com índice unique/snapshots.
- Check sintático do novo teste: exit code 0 em `real_dev/api`.
- Primeiro reteste CAS/audit: unitário HTTP 9/9 passou, mas o conjunto terminou exit code 1 porque os 3 casos replica-set falharam antes do CAS/audit ao popular `productId`: o teste não tinha registado o model `Product`. Como a falha esperada de audit não chegou a consumir o spy one-shot, contaminou depois a leitura. Nenhum resultado concorrente é aceite; será registado o model e garantido cleanup de spies antes de repetir.

### 2026-07-10 - G4, resolução automática da sessão guiada

- Primeira tentativa de patch multi-ficheiro: falhou na verificação de contexto da página web antes de aplicar qualquer hunk; nenhuma alteração parcial foi aceite. A falha fica preservada e o trabalho foi reaplicado por ficheiro.
- Alterações ainda não validadas: o validator rejeita `consultationSessionId` no body; o service procura a última `AiConsultationSession` `submitted` pelo `userId` autenticado, usa apenas o respetivo ID internamente e cria review apenas quando essa sessão existe; a UI removeu o input ObjectId e envia só `historyLimit`.
- Riscos pendentes: fixtures/testes antigos ainda esperam o ID opcional, a criação durável de recomendações/review e a transição do wizard ainda não foram alteradas. `ORELLE-AUD-P1-006` mantém-se `EM_IMPLEMENTACAO`.
- Fixtures focais atualizadas para resolver uma sessão submetida mockada pelo backend e propagar metadata demo. `node --check` no validator, service e teste `mf8.enriched-recommendations`, CWD `real_dev/api`, terminou exit code 0 nos três; o comportamento funcional continua pendente.
- Reteste focal: `npm test -- tests/mf8.enriched-recommendations.test.js --reporter=verbose`, fora da sandbox; exit code 0, 1 ficheiro e 5/5 testes. Prova body sem ID, rejeição explícita do ObjectId técnico, seleção interna/ownership, contexto que altera ranking e 404 quando a sessão submetida não tem histórico. O warning JSON é o negativo 404 esperado. Ainda falta ausência de sessão, transação/review e integração browser.
- Teste adicional preparado, ainda não executado: quando não existe sessão submetida, as recomendações base continuam disponíveis, não consultam histórico e não criam uma revisão órfã.
- Reteste após o caso adicional: `npm test -- tests/mf8.enriched-recommendations.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 6/6 testes. O caminho sem sessão submetida ficou verde e conserva recomendações base sem histórico/review.
- Frontend: criado `test:g4-guided`, ainda não executado, que lê a página de recomendações e exige ausência de `consultationSessionId`/“ID da sessão”, copy automática e envio apenas de `historyLimit`.
- Primeiro reteste web: `npm run test:g4-guided`, CWD `real_dev/web`, exit code 1 (0/1). As duas provas críticas de ausência de ID passaram; falhou apenas a regex de copy porque “aplicada” e “automaticamente” estão em linhas JSX consecutivas e o padrão não aceitava whitespace. No mesmo estado, `npm run build` passou com exit code 0, Vite 8.1.4/85 módulos e JS 83,28 KiB gzip. A falha do teste fica preservada e não é convertida em PASS.
- Correção do próprio teste: a regex passou a aceitar whitespace JSX entre as duas palavras, sem alterar runtime ou afrouxar as asserções de ausência de identificadores. Reteste pendente.
- Reteste web: `npm run test:g4-guided`, CWD `real_dev/web`, exit code 0, 1/1. A página não pede/envia ID de sessão, declara resolução automática e envia apenas o limite; o build verde imediatamente anterior continua atual ao runtime, pois só o teste mudou depois dele.

### 2026-07-10 - G3, handoff de consentimento facial recebido

- Ficheiros reportados: model/validator/teste de consentimento alterados; service/controller/routes existentes auditados. O handoff afirma GET/DELETE autenticados/no-store, ownership por sessão, CAS idempotente, bloqueio de novo upload/análise e histórico próprio legível após revogação.
- Evidence recebida: checks sintáticos e schema exit code 0; teste focal 8/8 e regressão MF1/MF7 27/27 fora da sandbox. Uma falha real inicial por timestamp de teste e uma repetição `listen EPERM` foram preservadas pelo subagente.
- Estado coordenado: ainda não validado pelo coordenador; falta inspeção do diff, montagem/contrato de rota e negativo concorrente real no replica set.

### 2026-07-10 - G4, consentimento específico do provider real

- Alterações iniciais ainda não validadas: `FaceConsent` ganhou subdocumento separado com `provider`, `noticeVersion`, `acceptedAt` e `revokedAt`; o validator aceita apenas `openai|external`, versão 1-64 e booleano explícito, mantendo o consentimento facial geral independente. Nenhuma credencial, URL ou fotografia é persistida neste contrato.
- Enforcement ainda não validado: GET devolve apenas requisito público `{required,provider,noticeVersion}`; aceitar em modo real exige decisão exata e guarda a data; revogar usa compare-and-set/pipeline e revoga também o consentimento externo; a análise recusa provider real se o consentimento estiver ausente, revogado ou desatualizado. Demo não exige nem reutiliza consentimento externo. DTO nunca inclui chave/URL.
- Primeira tentativa de patch da UI falhou no parser da ferramenta antes de tocar no ficheiro; não houve alteração parcial. A reaplicação limpa adicionou GET abortável do requisito, segundo checkbox visível apenas em modo real e envio exato de provider/versão/aceitação; erro de load ou consentimento em falta bloqueia upload. Alteração ainda sem teste/build.
- Checks sintáticos dos cinco módulos backend de consentimento/provider, CWD `real_dev/api`; todos terminaram exit code 0. O JSX continua dependente do build e o comportamento não está ainda validado.
- Testes de lifecycle atualizados, ainda sem execução: requisito público demo/real, recusa sem decisão específica, aceitação exata OpenAI/versão, resposta sem chave/URL, revogação conjunta no mesmo instante e bloqueio da análise real antes de consultar fotografias.
- `node --check tests/face-consent.lifecycle.test.js`, CWD `real_dev/api`, exit code 0; apenas sintaxe.
- Primeiro reteste funcional: `npm test -- tests/face-consent.lifecycle.test.js --reporter=verbose`, fora da sandbox; exit code 1, 10/11 passaram. Todos os novos positivos/negativos reais passaram; a única falha foi a expectativa antiga do DTO demo, que não incluía o novo campo público `externalProviderConsent:null`. Nenhum defeito runtime foi demonstrado, mas o run permanece falhado.
- Correção de teste apenas: a expectativa demo inclui agora explicitamente `externalProviderConsent:null`, mantendo o contrato estável e sem alterar runtime. Reteste pendente.
- Reteste: `npm test -- tests/face-consent.lifecycle.test.js`, fora da sandbox; exit code 0, 1 ficheiro e 11/11 testes. O runner voltou a provar `DOTENV_CONFIG_PATH=/dev/null`, Mongo loopback e demo. Ainda falta o CAS real concorrente e o build/teste da UI.
- Teste web preparado, ainda não executado: exige GET abortável do requisito, checkbox condicional, provider/versão/sem treino e prova estática de ausência de credenciais/URL no frontend.
- Reteste web: `npm run test:g4-provider-consent`, CWD `real_dev/web`, exit code 0, 2/2; `npm run build` no mesmo estado exit code 0, Vite 8.1.4/85 módulos e JS 83,54 KiB gzip. UI condicional e ausência de segredo/URL ficaram verdes; browser real continua G7.
- Teste replica-set preparado, ainda não executado: 25 DELETE concorrentes devem conservar um único instante geral/específico, replay idêntico e ownership sem alteração de outro titular; URI explicitamente loopback e sem credenciais.
- Check sintático do novo teste replica-set: exit code 0 em `real_dev/api`.
- Validação concorrente: `npm test -- tests/face-consent.replset.integration.test.js --reporter=verbose`, fora da sandbox; exit code 0, 1 ficheiro e 2/2. Vinte e cinco revogações produziram um único instante geral/específico, replay preservou-o e outro titular não alterou o documento. `ORELLE-AUD-P1-005` continua `EM_IMPLEMENTACAO` apenas por migration/suite integral/reauditoria, não por falta de prova concorrente do consentimento.
- Estado: `ORELLE-AUD-P1-005` mantém-se `EM_IMPLEMENTACAO`; faltam CAS real concorrente, migration e reauditoria integrada.

### 2026-07-10 - G3, handoffs de conta e privacy jobs

- Eliminação de conta recebida: tombstone terminal, cascata, anonimização de `simulated_paid`, revogação de sessões e outbox físico pós-commit. Evidence reportada: checks exit 0; 3 ficheiros/14 testes focais+modularidade PASS; admin isolado 1/1. Um batch anterior teve 33/34 e timeout num teste MF4 durante edição G4; a falha fica preservada. Route ainda não montada; falta integrar `PrivacyRequest`, retenção do job e consumidor de retry.
- Pedidos/jobs recebidos: contratos canónicos cliente/admin/retry, CAS/lease/attempts, transação metadados+outbox, unlink/ENOENT/stat, replay/legado e verificação antes de `completed`. Evidence reportada: 4 ficheiros/29 testes PASS num replica set loopback e checks exit 0. Falhas preservadas: primeiro check com path duplicado exit 1; suite legada inicial 10 falhas/8 pass; sandbox `listen EPERM` com 6 skipped e reteste externo 6/6.
- Riscos declarados: migration 004 pendente; audit da decisão ainda fora da transação destrutiva; sem worker autónomo; jobs concluídos conservam metadata privada interna. O coordenador ainda não montou rotas nem repetiu os focais no estado integrado.
- Integração inicial: `meAccountRoutes` foi montado em `/api/me`; os privacy routes já estavam montados em `/api`. Alteração ainda sem check/reteste coordenado; nenhuma route de `apps/` foi tocada.
- `node --check src/app.js`, CWD `real_dev/api`, exit code 0 após a montagem; apenas parsing.
- Reteste coordenado G3: `npm test --` account validator/replset, MF5/MF7 privacy, privacy replset, consent lifecycle e MF1 face, fora da sandbox; exit code 0, 7 ficheiros e 56/56 testes em 6,38 s. O runner forçou dotenv `/dev/null`, Mongo loopback e demo. Ficaram verdes password+`ELIMINAR`, CSRF/Origin/roles, tombstone/cascade/sessões, encomenda paga anonimizada, outbox/rollback/retry/concorrência, bytes `ENOENT`, pedidos canónicos/replay/legado/ownership, consentimento geral/específico/revogação e regressão upload/análise. Logs warn/error correspondem aos negativos esperados e estão sanitizados.
- Estado: `ORELLE-AUD-P1-004` permanece `EM_IMPLEMENTACAO` até migration 004, UI destrutiva e reauditoria; o core G3 já tem prova integrada atual.

### 2026-07-10 - G3, outbox na substituição de fotografias

- Alteração ainda não validada: quando existe transação real, os paths do par substituído são agora enfileirados na mesma transação que inativa os documentos e insere o novo par; após commit, o worker tenta eliminar/confirmar bytes. Falha pós-commit nunca apaga o novo par nem alega rollback e deixa job durável para retry. A via direta permanece apenas nos testes unitários sem ligação Mongo.
- Findings: este incremento ataca o único risco residual de `ORELLE-AUD-P2-008` e a componente filesystem de `ORELLE-AUD-P2-005`; checks, failure injection e reteste replica-set ainda estão pendentes.
- Teste replica-set ampliado, ainda sem execução: injeta indisponibilidade do worker depois do commit, exige novo par legível/ativo e bytes antigos ainda presentes com dois jobs pending; retry genérico deve concluir ambos, confirmar `ENOENT` antigo e preservar o novo par.
- Checks sintáticos do service e teste de substituição: ambos exit code 0 em `real_dev/api`.
- Reteste replica-set: `npm test -- tests/face-photo-replacement.replset.integration.test.js --reporter=verbose`, fora da sandbox; exit code 0, 1 ficheiro e 2/2. Sucesso normal e failure injection pós-commit/retry ficaram verdes. `ORELLE-AUD-P2-008` passou individualmente por `PRONTO_PARA_RETESTE` e fica `VALIDADO`.

### 2026-07-10 - G4, correção do fixture CAS/audit após retoma

- CWD: `real_dev/api`.
- Alteração: o teste replica-set passou a registar explicitamente o model `Product`, usado pelo `populate()` do DTO, e a restaurar todos os spies depois de cada caso. O índice do model é sincronizado no setup; o spy de falha de audit já não pode contaminar testes posteriores mesmo que uma asserção termine cedo.
- Âmbito: apenas o fixture de integração foi alterado; o service/model/runtime do CAS e da auditoria não foi modificado.
- Check: `node --check tests/ai-consultation-review.replset.integration.test.js`, exit code 0. O reteste dos três critérios continua pendente.
- Reteste: `npm test -- tests/mf8.ai-consultation-review.test.js tests/ai-consultation-review.replset.integration.test.js --reporter=verbose`, fora da sandbox e com dotenv `/dev/null`, Mongo loopback e IA demo; exit code 0, 2 ficheiros e 12/12 testes em 2,01 s.
- Resultado: uma única decisão concorrente confirmou, a segunda recebeu 409, o audit falhado reverteu a revisão e list/detail geraram dois eventos sem ator nos DTOs. `ORELLE-AUD-P2-001` passou individualmente por `PRONTO_PARA_RETESTE` e fica `VALIDADO`; P2-004/P2-005 permanecem em implementação por critérios adicionais.

### 2026-07-10 - G4, fairness por allowlist estrutural

- Handoff intermédio: o ranking passou a receber apenas sinais cosméticos guiados permitidos e restrições de segurança; idade, género, tom e outros atributos protegidos são removidos antes do score. A resposta descreve âmbito e limitações sem promessa absoluta.
- Evidence recebida, ainda a revalidar pelo coordenador: `node --check` em quatro ficheiros, exit code 0; `npm test -- tests/mf8.fairness-guard.test.js tests/mf8.enriched-recommendations.test.js --reporter=verbose`, exit code 0, 2 ficheiros e 13/13 testes. A integração DTO e o build continuam pendentes, por isso P2-003 permanece `EM_IMPLEMENTACAO`.
- Primeiro reteste alargado recebido: cinco ficheiros, exit code 1, 42/44 testes passaram; dois casos MF2/MF4 expiraram porque fixtures legadas não simularam a nova procura automática de `AiConsultationSession` e ficaram em I/O Mongo. A falha é preservada; os contratos substituídos serão alinhados e o mesmo conjunto repetido antes de qualquer validação.
- Correção de fixtures recebida: apenas os testes MF2/MF4 passaram a devolver explicitamente ausência de sessão submetida, evitando I/O Mongo acidental e preservando o comportamento base. `node --check` de ambos terminou exit code 0; repetição exata da suite ainda pendente.
- Hardening recebido: labels vindas do histórico já não atravessam para o ranking; depois de validar chave/valor pela allowlist, o backend usa uma label canónica. Isto fecha injeção de keywords através de copy adulterada; o comentário técnico também deixou de usar wording absoluto. Reteste continua pendente.
- Primeiro reteste pós-hardening na sandbox: exit code 1; nove casos unitários passaram e quatro Supertest falharam exclusivamente por `listen EPERM 0.0.0.0`. A falha ambiental fica preservada e não é convertida em sucesso.
- Reteste fora da sandbox: `npm test -- tests/mf8.fairness-guard.test.js tests/mf8.enriched-recommendations.test.js --reporter=dot`, exit code 0, 2 ficheiros e 13/13 testes. A suite alargada exata e o build continuam pendentes.
- Integração recebida: repetição exata de cinco ficheiros fora da sandbox terminou exit code 0, 44/44 testes; build web exit code 0, Vite 86 módulos e JS 85,14 KiB gzip. O risco residual declarado é correto: a allowlist limita inputs locais, mas não constitui prova absoluta sobre enviesamento de provider real. Reteste independente do coordenador ainda pendente.

### 2026-07-10 - G3/G7, migration 004 de privacidade preparada

- CWD: `real_dev/api`.
- Alteração ainda não validada: criada `004_privacy_requests_and_erasure` em modo `transaction_then_finalize`. Pedidos `completed` sem `erasureVerifiedAt` e leases presos tornam-se `failed` recuperáveis; defaults são normalizados; contas já eliminadas ficam terminalmente inativas sem qualquer reativação; revogação facial geral sincroniza a revogação específica; índices canónicos de pedidos, outbox, consentimento e conta são finalizados de forma idempotente.
- Segurança: a migração não promove pedidos a concluídos, não apaga bytes, não cria consentimentos e não usa configuração Mongo remota. Ainda não foi registada no índice canónico nem executada; checks/testes replica-set continuam pendentes.
- Check sintático: `node --check src/migrations/004_privacy_requests_and_erasure.js`, exit code 0. A prova funcional continua pendente.

### 2026-07-10 - G4/G7, migration 006 machine/human preparada

- CWD: `real_dev/api`.
- Alteração ainda não validada: criada `006_ai_machine_human_split` em modo `transaction_then_finalize`. Recomendações legadas recebem provenance `demo/legacy` e snapshot de máquina; `humanOverride` só é reconstruído num review quando existem estado final, revisor e data verificáveis. Reviews duplicados do mesmo titular/sessão são fundidos deterministicamente, preservando IDs de recomendações e audit trail, antes do índice único.
- Segurança: a migração não transforma recomendação automática em decisão humana nem apaga overrides existentes. Ainda não foi registada, analisada por check sintático ou executada num replica set.
- Checks: `node --check` em 004 e 006, ambos exit code 0. A 006 continua sem execução funcional e sem registo canónico.
- Teste replica-set preparado, ainda não executado: dry-run sem escrita; pedidos concluídos sem prova e leases expirados tornam-se retryáveis; conta eliminada permanece terminal; revogação específica é sincronizada; provenance demo/legacy é aplicada; duplicados de review são fundidos; decisão comprovada é preservada e estado final sem revisor não ganha override; índices e replay são exigidos.
- Correção pré-execução do fixture: a asserção da data humana passou a exigir `Date` sem referir uma variável fora de scope; nenhum critério ou runtime foi alterado. Check sintático continua pendente.
- Check: `node --check tests/migrations-privacy-ai.replset.integration.test.js`, exit code 0. Execução funcional pendente.
- Execução: `npm test -- tests/migrations-privacy-ai.replset.integration.test.js --reporter=verbose`, fora da sandbox, dotenv `/dev/null`, Mongo loopback e IA demo; exit code 0, 1 ficheiro e 3/3 testes em 2,68 s.
- Resultado: dry-run não escreveu; 004 tornou pedidos sem prova/leases expirados retryáveis, fixou tombstone e revogação; 006 marcou legado como demo, fundiu reviews e preservou apenas decisão humana demonstrável; índices e replay passaram. As migrações ficam validadas isoladamente, mas não entram ainda no registry enquanto faltar 005.

### 2026-07-10 - G4, durabilidade da consulta guiada recebida

- Alterações recebidas, ainda em inspeção coordenada: submissão de sessão e histórico usam uma única transação; geração persiste sequencialmente recomendações e review na mesma `ClientSession`; o refresh de review aceita a sessão sem alterar o CAS da decisão. O wizard valida obrigatórios, guarda ao recuar, protege alterações não guardadas e navega automaticamente para `/consulta/recomendacoes`.
- Failure injection: primeiro run replica-set na sandbox falhou por `listen EPERM`; fora da sandbox passou 2/2, provando rollback de sessão quando history falha e rollback de todas as recomendações quando review falha, seguido de retry completo. Regressão conjunta guided/review passou 6 ficheiros/35 testes, incluindo CAS/audit e dois replica sets. Web passou 3/3, smoke e build de 86 módulos/86,57 KiB gzip.
- Suite API integral recebida: exit code 1, 61/62 ficheiros e 446/447 testes passaram. A única falha está em `mf7.consent.test.js`: a fixture antiga espera o DTO anterior e não inclui os campos públicos do consentimento específico de provider. A falha fica preservada; não é atribuída ao ramo guided nem convertida em PASS. P1-006/P2-005 permanecem `EM_IMPLEMENTACAO` até inspeção, correção do contrato supersedido e reteste coordenado.
- Correção coordenada do contrato supersedido: apenas a asserção MF7 passou a esperar `providerConsentAccepted:false` e os campos opcionais `provider/noticeVersion` ausentes no modo demo, coerentes com o validator/lifecycle atual. Nenhum runtime foi alterado; reteste focal e integral continuam pendentes.
- Reteste coordenado: `npm test --` 11 ficheiros de consentimento, guided, durability, review/CAS, MF2/MF4 e fairness, fora da sandbox; exit code 0, 11 ficheiros e 84/84 testes em 4,27 s. P2-003 fica `VALIDADO`; P1-006 passa a `PRONTO_PARA_RETESTE` e aguarda registry 006/suite integral.

### 2026-07-10 - G3/G5, UI canónica de privacidade e conta

- Alterações recebidas: cliente usa `GET|POST /api/me/privacy-requests`, mostra histórico sem IDs técnicos e elimina a conta via `DELETE /api/me/account` com password em 8-72 bytes UTF-8 e confirmação literal `ELIMINAR`; limpa sessão/CSRF local e redireciona. Admin usa listagem selecionável, motivo/decisão editáveis, confirmações `APROVAR|REJEITAR` e retry `REPROCESSAR` apenas em `failed`; contas `deleted` não apresentam reativação.
- Falha preservada: o primeiro smoke MF5 recusou a expectativa do alias antigo `/me/biometric-data-requests`; o gate foi alinhado ao endpoint canónico e não ao runtime legado.
- Evidence recebida: teste focal 7/7, suite web 37/37, smoke MF5 corrigido, conta/navegação 7/7, G5 smoke e build Vite de 86 módulos/86,57 KiB gzip, todos exit code 0. Scan do `dist` sem loopback/aliases e apenas endpoints canónicos. Browser real/axe permanece pendente; P1-004 continua `EM_IMPLEMENTACAO` até migration 004 e reteste coordenado.
- Reteste coordenado de todos os testes web Node: `node --test tests/*.test.mjs`, CWD `real_dev/web`, exit code 0, 37/37 em 94,8 ms. Inclui endpoints canónicos, conta terminal, confirmações destrutivas, retry, wizard, consentimento, CSRF, perfil e checkout.
- Smokes coordenados `smoke:mf5-privacy-request`, `smoke:mf8-consultation` e `smoke:mf2`, todos exit code 0; confirmam endpoints canónicos, wizard e contratos de recomendação. Build coordenado ainda pendente.
- Build coordenado: `npm run build`, exit code 0; Vite 8.1.4 transformou 86 módulos, JS inicial 86,57 KiB gzip e imagens geradas de 218,92/284,63 KiB. G3/G4 web permanece sem browser/axe, mas o estado compilável atual está verde.

### 2026-07-10 - G3/G7, sanitização de outbox concluído

- Alteração ainda não validada: o compare-and-set que marca um job `completed` remove agora `storageKey`, `ownerId` e o token de lease depois de confirmar ausência física. Jobs `pending|processing|failed` conservam os metadados necessários ao retry; deduplicação, origem, contagens e timestamps permanecem auditáveis.
- Migration 004 atualizada, ainda não revalidada: contabiliza jobs concluídos com metadata sensível e remove os mesmos três campos, mantendo a operação idempotente. Testes de privacidade/conta/substituição ainda precisam de alinhar e provar a sanitização.
- Teste de eliminação de conta alinhado: depois do sucesso exige explicitamente `storageKey` e `ownerId` ausentes no job concluído, mantendo a verificação `ENOENT` pelo path conhecido apenas no fixture. Sem execução ainda.
- Testes de pedidos de privacidade reforçados: sucesso e retry exigem que todos os jobs concluídos já não tenham `ownerId`; a ausência do path continua provada por não aparecer no JSON e por `ENOENT`. Sem execução ainda.
- Teste de substituição pós-falha reforçado: depois do retry exige dois jobs concluídos e ambos sem `storageKey`/`ownerId`, além de bytes antigos ausentes e novo par intacto. Sem execução ainda.
- Fixture de migration 004 ampliado com job concluído legado contendo owner/path/token; dry-run deve contabilizá-lo e a aplicação deve remover os três campos. Sem execução ainda.
- Checks sintáticos: worker, migration 004 e quatro testes alterados, 6/6 com exit code 0. Reteste funcional coordenado pendente.
- Primeiro reteste coordenado do outbox: exit code 1, 3/4 ficheiros e 16/17 testes passaram. Conta, pedidos e migration ficaram verdes; a única falha contou oito jobs `face_photo_replacement` concluídos acumulados por casos anteriores, quando esperava os dois do workflow atual. A query do teste será limitada ao `sourceId`; nenhum defeito runtime foi demonstrado e a falha fica preservada.
- Correção apenas no teste: a leitura dos jobs concluídos filtra agora também o `sourceId` da substituição corrente, isolando os dois jobs relevantes sem enfraquecer a exigência de sanitização. Check/reteste pendentes.
- Check sintático do teste corrigido: exit code 0. Reteste funcional pendente.
- Segundo reteste coordenado: o mesmo conjunto, fora da sandbox, exit code 0; 4 ficheiros e 17/17 testes em 7,98 s. Conta, pedidos, substituição e migration 004 confirmam `ENOENT`, retry/rollback e ausência de owner/path/token em jobs concluídos. P1-004 mantém-se em implementação apenas até 004 entrar no registry e a suite integral ser repetida.

### 2026-07-10 - G4/G5, auditoria focal de visualização/comparação

- Handoff read-only: confirmado SVG sintético com copy enganadora/ID visível, comparação por dois ObjectIds sem tabela/opções por data e ausência de endpoint autenticado de imagem. O subtask prossegue dentro do plano já registado; nenhum resultado é ainda tratado como implementado ou validado.

### 2026-07-10 - G1, prova real da corrida de registo retomada pelo coordenador

- O subtask foi interrompido por não devolver evidence dentro do tempo esperado; nenhum resultado pendente é inferido como PASS.
- Alteração encontrada e revista: novo teste replica-set cria o índice unique real, envia duas inscrições HTTP concorrentes com a mesma password de 72 bytes UTF-8, exige dois 202/body indistinguíveis, um único `11000`, um utilizador persistido e hash válido. Um segundo caso aceita 72 bytes e rejeita 73 antes de persistir, com detalhe redigido.
- O teste não lê `.env` e valida URI loopback sem credenciais. Check e execução ainda pendentes.
- Check: `node --check tests/auth.registration-replset.integration.test.js`, exit code 0. Execução pendente.
- Execução: `npm test -- tests/auth.registration-replset.integration.test.js --reporter=verbose`, fora da sandbox; exit code 0, 1 ficheiro e 2/2 testes em 4,65 s. `ORELLE-AUD-P3-001` passa a `VALIDADO`.

### 2026-07-10 - G0/G7, permissões e secret scan sem abrir `.env`

- CWD: raiz do repositório. `stat` leu apenas metadata e confirmou `real_dev/api/.env` em `0644`, owner local; o conteúdo não foi aberto nem alterado. Este estado continua inadequado e bloqueado por decisão explícita de não tocar no ficheiro remoto existente.
- Scan por nomes/padrões de URI/credencial, excluindo `.env`, `apps/`, dependências, quarentenas e `dist`, devolveu apenas `.env.example`, testes negativos, guard do backup e documentação local. Inspeção dirigida confirmou URIs loopback de exemplo e casos deliberadamente recusados (`mongodb+srv`, credenciais embebidas e IP TEST-NET); não apareceu segredo utilizável hardcoded.
- Estado: P3-005 mantém `EM_IMPLEMENTACAO`; rotação remota, mudança de permissão do `.env` existente e cleanup das quarentenas root-owned permanecem ações externas, sem alegar correção local inexistente.

### 2026-07-10 - G1/G7, sampling de métricas HTTP

- Alteração ainda não validada: erros HTTP continuam sempre registados; sucessos usam taxa fixa de 10% no alvo local, enquanto `NODE_ENV=test` conserva 100% para evidence determinística. A decisão foi extraída para helper testável e não recebe userId, headers, body ou cookies.
- Âmbito: apenas observabilidade HTTP; métricas de budget facial mantêm o contrato próprio. Check/testes e integração com TTL 007 continuam pendentes.
- Teste acrescentado, ainda sem execução: fronteiras 0,099/0,1, erro 503 sempre registado, test mode determinístico e integração que salta um sucesso fora da amostra mas persiste o erro com o mesmo valor.
- Assinatura/JSDoc do recorder alinhados com as opções injetáveis de amostra/ambiente; sem alteração adicional de comportamento. Checks continuam pendentes.
- Checks sintáticos do service e teste, ambos exit code 0. Execução funcional pendente.
- Reteste: `npm test -- tests/mf8.safe-logging.contract.test.js --reporter=verbose`, fora da sandbox, exit code 0; 1 ficheiro e 4/4 testes em 904 ms. Redaction, erro genérico, métrica minimizada e sampling ficaram verdes; P2-015 aguarda registry 004-007/reauditoria.

### 2026-07-10 - G3/G7, cifra contextual v2 e conflito 005→006

- Handoff intermédio: helpers AES-256-GCM v2 usam `keyVersion` e AAD canónico com versão, purpose, coleção, owner e campo, guardando apenas hash do AAD no envelope. Models e migration 005 foram adaptados para os campos sensíveis planeados; nenhum segredo/plaintext foi incluído na evidence.
- Evidência recebida: crypto focal 3/3 e migration 005 isolada 2/2, ambos exit code 0.
- Falha obrigatória preservada: o terceiro caso que executa 005 seguida da 006 terminou falhado porque `006_ai_machine_human_split` voltou a criar `consultantNote/humanOverride` e `publicInsight/internalNote/humanOverride` em claro; `migration005.validate` detetou-o. Isto confirma um defeito de ordem real, não ambiental. A 006 será alinhada aos helpers contextuais antes de qualquer registry/reteste.
- Alinhamento iniciado: a 006 importa agora exclusivamente os helpers migration-only de leitura legada e cifra contextual; a lógica de escrita ainda não foi substituída e nenhum PASS é alegado.
- Alteração 006 concluída, ainda sem check: os updates pipeline que podiam aninhar plaintext/envelopes foram substituídos por iteração transacional com owner exato. Campos sensíveis existentes são lidos pelo helper migration-only e reescritos com AAD; qualquer override humano reconstruído é cifrado antes do update. Machine snapshots/provenance e fusão de duplicados mantêm-se; perda concorrente de ownership falha fechada.
- Check: `node --check src/migrations/006_ai_machine_human_split.js`, exit code 0. Retestes 005→006 e 004/006 continuam pendentes.
- Primeiro reteste após alinhamento: 3 ficheiros, exit code 1, 8/9 testes passaram. Crypto 3/3, migration 005 2/2 e o caso obrigatório 005→006 passaram; a única falha foi a expectativa antiga de 004/006 tentar comparar `humanOverride` diretamente, recebendo corretamente um envelope v2. O teste será alinhado para autenticar/decifrar com AAD, sem alterar runtime.
- Correção apenas no teste 004/006: exige envelope contextual, autentica-o com coleção/owner/campo exatos, valida o valor lógico e confirma que a nota não existe no dump serializado. Check/reteste pendentes.
- Check sintático do teste atualizado: exit code 0. Reteste funcional pendente.
- Segundo reteste: exit code 1, novamente 8/9. Envelope/AAD e ordem 005→006 passaram; a única diferença foi `reviewerId` decifrado como string hex canónica, contrato intencional do reviver, enquanto o teste esperava instância BSON. A asserção será alinhada sem alterar runtime.
- Correção do teste: `reviewerId` passa a ser comparado com o hex canónico do ObjectId. Check/reteste pendentes.
- Check sintático do teste: exit code 0. Reteste funcional pendente.
- Terceiro reteste: `npm test --` crypto, migration 005 e migrations 004/006, fora da sandbox; exit code 0, 3 ficheiros e 9/9 testes em 4,48 s. Ficam provados AAD/tamper/troca owner-campo, v1 apenas na migração, dump sem markers, dry-run/replay e ordem 005→006 sem reintroduzir plaintext. P2-002 aguarda regressão dos models/services e registry completo.
- Integração cross-feature identificou duas lacunas ainda abertas: histórico IA v1 não constava inicialmente dos specs 005; e qualquer projeção inclusiva de campo contextual tem de selecionar também `userId`, caso contrário o getter falha fechado por owner ausente. O subtask de cifra foi instruído a incluir history e auditar todas as projeções antes da validação.

### 2026-07-10 - G4/G5, primeiro reteste visual/comparison

- Implementação intermédia recebida: comparação passou a resolver escolhas datadas através de chave interna/ownership, evitando colisões de timestamps; restantes contratos de endpoint/imagem/UI aguardam handoff completo.
- Primeiro reteste API: quatro ficheiros, exit code 1, 49/50 testes passaram. A única falha é uma expectativa MF3 ainda procurar diretamente por `createdAt`, contrato substituído pela resolução segura da opção. A falha fica preservada; apenas a fixture será alinhada antes da repetição.
- Primeiro teste de persistência visual: exit code 1, 0/1. O GET da própria imagem devolveu 500 por uma projeção Mongo inválida que misturava inclusão com campos `+encryption`/subpaths; não existe PASS de ownership/bytes. O service será alinhado à projeção já usada no fluxo facial e `findings.skinType` será substituído pelo payload `findings` completo devido à cifra contextual Mixed.
- Segundo diagnóstico cross-feature: a projeção inclusiva de `findings` precisa também de `userId` para autenticar o AAD no getter. A correção visual adotará `userId photoIds consentId findings createdAt`; a regra será auditada transversalmente em P2-002.
- Segundo teste replica-set: exit code 1, 0/1, porque o getter AAD não tinha `userId` na projeção. Depois de incluir owner+payload completo, o reteste passou 1/1.
- Evidência final do handoff: focal API corrigido 50/50; consolidado com persistência 5 ficheiros/51 testes; web 3/3, smoke MF2 e build 86 módulos/303,62 KiB raw/87,36 KiB gzip, todos exit code 0. P2-009 passa a `PRONTO_PARA_RETESTE`; falta reexecução coordenada depois do fecho P2-002 e browser/axe.

### 2026-07-10 - G5, remoção de IDs técnicos em administração/insights

- Alteração inicial ainda não validada: o service de categorias ganhou listagem pública exclusiva de categorias ativas e DTO sem o campo administrativo `isActive`. Controller/rota, selects de produtos e remoção do filtro de sessão continuam pendentes.
- Controller público acrescentado para devolver apenas `{categories}` pelo novo service; rota e testes ainda pendentes.
- Rota pública `GET /api/catalog/categories` montada antes das rotas parametrizadas de produto; sem autenticação e sem mutação. Testes ainda pendentes.
- Teste MF1 acrescentado: exige query `{isActive:true}`, DTO exato sem `isActive` e resposta 200. Sem execução ainda.
- Stock admin alterado, ainda sem build: carrega o catálogo com AbortController, usa `<select>` nomeado em vez de input de ID, mantém erro/load da ação separado da listagem e atualiza apenas o produto selecionado. Nenhum ID técnico é apresentado ao utilizador.
- Categorias admin alterada, ainda sem build: carrega produtos/categorias com cancelamento em unmount, usa select por nome, exige seleção material e busy próprio da associação. O `<main>` interno foi removido para preservar um único landmark no layout.
- Insights cliente alterada, ainda sem build: removeu input/query/display de `consultationSessionId`, carrega automaticamente por ownership de sessão e cancela em unmount. A API pode conservar filtro interno compatível, mas a UI já não pede nem mostra o ObjectId.
- Teste web G5 acrescentado, ainda sem execução: exige catálogo+select nas duas páginas admin, ausência de labels/placeholders técnicos, um único main externo e insights sem `consultationSessionId`/ObjectId.
- Checks sintáticos dos quatro ficheiros API de categorias/teste, todos exit code 0. Testes API/web e build pendentes.
- Reteste API: `npm test -- tests/mf1.catalog.test.js --reporter=verbose`, fora da sandbox, exit code 0; 14/14 em 917 ms, incluindo endpoint público e negativos de catálogo/roles. Web/build pendentes.
- Teste web focal: `node --test tests/technicalIdRemoval.test.mjs`, exit code 0; 2/2. Selects, ausência de IDs, ownership automático e landmark único ficaram verdes; build/suite web aguardam o subtask de imagens ativo.

### 2026-07-10 - G6, início de acessibilidade e acabamento do router

- CWD: `real_dev/web`; inspeção read-only de `App.jsx`, layouts e páginas com landmarks, exit code 0.
- Resultado: todas as páginas são importadas eager; não existe gestão canónica de título/foco nem skip-link global; o shell autenticado já cria `<main>`, mas quatro páginas montadas dentro de layouts ainda criam outro `<main>`. A homepage possui o seu próprio landmark e será preservada como rota standalone.
- Decisão: `ORELLE-AUD-P2-012` e `ORELLE-AUD-P3-004` passam por `EM_ANALISE` para `EM_IMPLEMENTACAO` antes do primeiro patch. O incremento inicial cobre router/layout e testes estáticos/comportamentais próprios; axe, overflow real e screenshots continuam pendentes até existir runner browser.
- Alterações: criado matcher puro de títulos; 39 ecrãs/componentes de rota passaram a `React.lazy` sob `Suspense`; o router atualiza título/idioma, inclui skip-link e foca o primeiro `main`; o shell usa `id=main-content`; Login, Registo, Preferências, Novo Produto e 404 deixaram de aninhar `main`. Foi acrescentado teste Node para títulos, splitting, foco, skip-link e landmarks.
- Validação focal: `node --test tests/routePresentation.test.mjs`, CWD `real_dev/web`, exit code 0; 3/3. Títulos sem IDs, imports lazy/Suspense, gestão de título/foco, skip-link e ausência de `main` aninhado nas quatro páginas montadas ficaram verdes. Build pós-handoff de imagens, homepage, CSS visual e browser/axe continuam pendentes.
- Primeiro build pós-splitting: `npm run build`, CWD `real_dev/web`, exit code 0; Vite transformou 89 módulos, gerou chunks próprios para todas as páginas e reduziu o entry JS a 197,06 KiB raw/64,07 KiB gzip. As duas imagens importadas ficaram em 218,92/284,63 KiB, abaixo do limite crítico de 300 KiB. Variantes dos produtos públicos e medição browser continuam pendentes.

### 2026-07-10 - G5, preferências e feedback sem identificadores técnicos

- Alterações: Preferências deixou de pedir CSV de IDs, carrega preferências+catálogo com um `AbortController` e apresenta produtos por nome/marca em checkboxes; a avaliação de produto devolve confirmação humana sem revelar o ID persistido. O teste G5 foi ampliado para recusar a copy/campo antigos.
- Validação: `node --test tests/technicalIdRemoval.test.mjs tests/routePresentation.test.mjs`, CWD `real_dev/web`, exit code 0; 6/6. Selects/admin, insights, preferências, feedback, títulos/splitting e landmarks focais ficaram verdes.
- Estado: `ORELLE-AUD-P2-011` mantém-se `EM_IMPLEMENTACAO`; build continua pendente e a pesquisa do catálogo ainda aguarda o handoff de imagens antes de trocar `Categoria ID` por select.

### 2026-07-10 - G0/G6, blocker visual refletido no runtime

- Alterações: o hub usa o checklist em `baseline` com `hasMockup:false`, remove a label pública “Mockup” e não pré-marca áreas como revistas. O checker MF8-14 valida o baseline disponível e distingue presença do artefacto externo de revisão concluída; o smoke MF8-13 foi alinhado ao code splitting e recusa a regressão `hasMockup:true`.
- Validações: `node scripts/check-mf8-assisted-consultation-ui.mjs`, CWD `real_dev/web`, exit code 0; contratos funcionais do hub verdes. `node real_dev/web/scripts/check-mf8-mockup-alignment.mjs`, CWD raiz, exit code 0 e resultado `READY_FOR_MANUAL_REVIEW`, com baseline 3 ficheiros/17 padrões e mockup externo 3/3. Este segundo resultado não é aprovação visual.
- Descoberta posterior: `find/stat` confirmou a árvore `mockup/` com os três artefactos canónicos e timestamp `2026-05-25`; a alegação anterior de ausência ficou materialmente desatualizada. P3-003 passa a `REABERTO` e G0 a `REABERTO_PARA_MOCKUP`. P3-004 continua `EM_IMPLEMENTACAO` até build, scan de copy e comparação browser.

### 2026-07-10 - G6, handoff parcial de imagens responsivas

- Alterações recebidas: componente `<picture>` e resolver de variantes 320/640/960 AVIF/WebP, com fallback/dimensões/prioridade; teste unitário dedicado criado.
- Validação positiva: `node --test tests/responsiveImageSources.test.mjs`, CWD `real_dev/web`, exit code 0; 4/4.
- Falha preservada: `npm run smoke:mf6-images`, exit code 1, detetou um `<img>` direto em `SkinComparisonPage.jsx`. A instalação `npm install --save-dev --save-exact sharp@0.35.3` ficou sem output e foi interrompida com exit code 130; tentativa autorizada posterior também foi abortada. Package/lock não mudaram.
- Inventário atual: 25 PNGs, 49.575.605 bytes, mínimo 1.689.071 e máximo 2.405.981 bytes; zero variantes e nenhum asset removido. O componente aponta para sources ainda inexistentes e usa os PNGs gigantes como fallback, logo P1-011 mantém `EM_IMPLEMENTACAO`. O subtask foi retomado para instalar o pipeline, gerar assets, integrar referências, corrigir o smoke e validar budgets/build.

### 2026-07-10 - G3, handoff parcial final da cifra contextual

- Estado recebido: helpers v2, seis models principais, migration 005 e testes foram implementados; checks sintáticos, crypto 3/3, regressão focal reportada 90/90 e migration 005 isolada 2/2 passaram. O conflito 005→006 já está preservado e corrigido nas entradas anteriores.
- Lacunas explícitas: `AiInteractionHistory.safeSummary/safeSignals` ainda usa envelope v1 e não pertence aos specs 005; o scan de projeções inclusivas não terminou; `sensitive-models.replset.integration.test.js` foi interrompido sem resultado. Nenhum destes pontos é inferido como PASS. O coordenador assume agora a integração, projeções e registry completo.

### 2026-07-10 - G3, integração do histórico IA na cifra v2

- Alterações ainda não validadas: `aiinteractionhistories` foi acrescentada aos specs 005 e o model substituiu os getters/setters v1 por AAD contextual em `safeSummary/safeSignals`. O fixture 005 inclui agora um envelope v1+plaintext dessa coleção e passa a esperar 7 documentos/16 campos. Projeções de `FaceAnalysis` e `FaceReport` em histórico e de `FaceAnalysis` em evolução incluem o `userId` necessário ao getter. O teste de models foi ampliado para persistência crua e chamadas reais dos três services.
- Checks: `node --check` nos seis ficheiros alterados de spec/model/services/testes, CWD `real_dev/api`, todos exit code 0. P2-002 mantém `EM_IMPLEMENTACAO`; migrations e replica-set continuam pendentes e parsing não é usado como prova funcional.
- Primeiro reteste funcional: `npm test --` crypto, migration 005, migrations 004/006 e models contextuais, fora da sandbox, exit code 1; 3 ficheiros/9 testes passaram, 4 casos do ficheiro de models ficaram skipped porque o setup usou a enum legada `genero="outro"`. A falha ocorreu antes da persistência contextual e não prova defeito de cifra, mas o conjunto permanece falhado. O fixture será alinhado a `prefiro_nao_dizer` e repetido sem alterar runtime.
- Correção apenas no fixture: o género passou de `outro` para a enum canónica `prefiro_nao_dizer`; nenhum model/service/migration foi alterado nesta correção. Check e reteste continuam pendentes.
- Check do fixture corrigido: `node --check tests/sensitive-models.replset.integration.test.js`, CWD `real_dev/api`, exit code 0; reteste funcional continua pendente.
- Segundo reteste funcional: o mesmo conjunto de quatro ficheiros, fora da sandbox, exit code 0; 13/13 em 4,65 s. A migration 005 converteu 7 documentos/16 campos incluindo histórico IA, 005→006 não reintroduziu plaintext, models autenticaram AAD em create/query e os services com projeção inclusiva decifraram apenas com owner presente. P2-002 continua `EM_IMPLEMENTACAO` até registry 004-007 e suite integral.

### 2026-07-10 - G7, registry canónico 001-007

- Alteração ainda não validada: o índice de migrações importa e regista 004 privacy, 005 cifra contextual, 006 machine/human e 007 retenção depois de 001-003, todos com `sourcePath` para checksum real. Nenhuma migração foi executada contra configuração remota.
- Teste de integração alinhado, ainda sem execução: status/dry-run passam a exigir sete pendentes e contagens específicas das fases 004-007; aplicação/registos/replay exigem sete `applied/skipped`; o cenário 007 separado continua a provar TTL só em métricas e preservação dos audit trails.
- Checks: `node --check src/migrations/index.js` e `node --check tests/migrations.replset.integration.test.js`, CWD `real_dev/api`, ambos exit code 0. P2-015 mantém `EM_IMPLEMENTACAO`; corrida canónica completa continua pendente.
- Execução canónica: `npm test -- tests/migrations.replset.integration.test.js --reporter=verbose`, fora da sandbox, exit code 0; 6/6 em 4,95 s. Status/dry-run não escreveram; 001-007 aplicaram por ordem, sete registos/checksums foram criados, replay ficou skipped, checksum/lock/rollback foram recusados corretamente, falha DDL foi retomada e 007 preservou logs aplicando TTL apenas às métricas.
- Estados: P2-015 e P2-002 passam individualmente a `PRONTO_PARA_RETESTE`; aguardam suite integral e reauditoria, sem fecho em lote.

### 2026-07-10 - G3/G4, regressão após cifra contextual

- Comando: `npm test --` oito ficheiros de histórico/consulta/review/durabilidade/visual, CWD `real_dev/api`, fora da sandbox; exit code 1, 7 ficheiros e 42/43 testes passaram.
- Falha real preservada: no CAS replica-set, a revisão terminou `status=approved`, mas o getter de `humanOverride` devolveu um objeto sem `decision`. Os restantes históricos, consulta guiada, visualização, ownership e comparação ficaram verdes. Este resultado reabre a componente de P2-004 tocada pela cifra; será diagnosticado o envelope/update antes de qualquer suite integral.
- Diagnóstico: o fixture chamava `.lean()`, que por contrato devolve o BSON cru e não executa getters Mongoose; `humanOverride` era corretamente um envelope v2, daí `decision` não existir no nível externo. O runtime/DTO não usa lean neste model. O teste passa a ler simultaneamente o documento Mongoose para o valor lógico e a coleção crua para exigir `keyVersion=2`; nenhuma lógica de produção foi alterada. Check/reteste pendentes.
- Check do fixture ajustado: `node --check tests/ai-consultation-review.replset.integration.test.js`, CWD `real_dev/api`, exit code 0; execução funcional continua pendente.
- Reteste CAS/audit: `npm test --` unitário HTTP + replica-set, fora da sandbox, exit code 0; 12/12 em 2,06 s. Um sucesso/um 409, rollback se audit falha, leituras auditadas, DTO sem ator, valor lógico `decision=approved` e BSON cru `keyVersion=2` ficaram verdes. P2-002 regressa a `PRONTO_PARA_RETESTE`; P2-004 e P2-005 avançam individualmente para o mesmo estado, todos ainda dependentes da suite integral.

### 2026-07-10 - G5, operações administrativas completas

- Handoff integrado: `GET /api/admin/orders` devolve encomendas minimizadas sem user/product IDs internos e PATCH reutiliza transições pós-pagamento simulado; foram criadas UI de encomendas, alteração de roles, target role de campanhas, execução explícita de alertas e estado de ação por item. O coordenador ligou `AdminOrdersPage` por import lazy, rota `/admin/encomendas`, menu e título humano.
- Evidência recebida: API focal+replica-set 3 ficheiros/27 testes; web focal 13/13 depois de preservar uma falha inicial 12/13 por literal de teste; três transforms OXC e build isolado de 89 módulos verdes. A tentativa com esbuild falhou por dependência ausente e foi substituída pelo parser já incluído no Vite; não foi instalada dependência nova.
- Reteste coordenado do wiring: `node --test tests/adminOperations.test.mjs tests/technicalIdRemoval.test.mjs tests/routePresentation.test.mjs`, CWD `real_dev/web`, exit code 0; 10/10. Rota/menu/título, encomendas, roles, campanhas, alertas, IDs técnicos, lazy/foco/landmarks ficaram verdes. P2-011 mantém `EM_IMPLEMENTACAO` até build/suite e correção do filtro `Categoria ID` ainda presente no catálogo.
- Reteste coordenado API: `npm test -- tests/admin-orders.replset.integration.test.js tests/mf4.integration.test.js tests/roles.test.js --reporter=dot`, fora da sandbox, exit code 0; 3 ficheiros e 27/27. DTO minimizado, pagamento simulado/logística, ownership/roles, ID inválido, campanhas e execução de alertas ficaram verdes; warnings são negativos 400/401/403 esperados.
- Revisão de concorrência: `createDueRoutineAlerts` ainda lê preferência, cria notificação e só depois guarda `lastNotificationKey`; duas execuções podem duplicar o alerta e uma falha pode deixar estado parcial. P2-005 é `REABERTO` antes de substituir o workflow por claim+notificação transacionais e acrescentar concorrência/failure injection num replica set.

### 2026-07-10 - G4/G5, atomicidade dos alertas de rotina

- Alterações ainda não validadas: para cada preferência devida, o service verifica a rotina, faz compare-and-set de `lastNotificationKey` e cria a notificação na mesma transação quando Mongo está ligado; o fallback sem ligação mantém CAS apenas para fixtures unitários. O teste MF4 deixou de esperar `save()` e exige o claim condicional.
- Integração nova: 20 execuções concorrentes devem somar um único alerta; falha injetada no create deve reverter o claim e permitir retry. A suite usa exclusivamente `MongoMemoryReplSet` loopback, sem `.env`.
- Checks: `node --check` no service e nos dois testes, CWD `real_dev/api`, todos exit code 0. P2-005 mantém `REABERTO`; testes funcionais ainda pendentes.
- Reteste: `npm test -- tests/mf4.integration.test.js tests/routine-alerts.replset.integration.test.js --reporter=verbose`, fora da sandbox, exit code 0; 18/18. Vinte execuções somaram exatamente uma notificação/claim; falha injetada fez rollback e retry criou uma; HTTP/admin/negativos mantiveram-se verdes. P2-005 regressa individualmente a `PRONTO_PARA_RETESTE` até suite integral.

### 2026-07-10 - G1/G3/G4/G7, suite API integral pós-registry

- Comando: `npm test`, CWD `real_dev/api`, fora da sandbox; exit code 0. O script forçou dotenv `/dev/null`, Mongo loopback e IA demo.
- Resultado: 71/71 ficheiros e 479/479 testes em 23,40 s. Inclui sete migrações canónicas, cifra/contexto/models, privacy/outbox/conta, consentimento, consulta/review/fairness, pagamento/stock/voucher, backup, PDF/CSV, rate limit/CSRF/sessões, admin/logística e concorrência dos alertas.
- Limite: este PASS integral é backend e não substitui frontend/browser/E2E/audits. Findings individuais serão promovidos separadamente, nunca fechados em lote.

### 2026-07-10 - G1/G2, cancelamento antes do commit de pagamento

- Alterações ainda não validadas: `simulateOrderPayment` aceita `AbortSignal`, falha dentro da transação sempre que o pedido expirou e executa a última barreira depois de persistir a tentativa mas antes do commit; o controller passa o sinal criado pelo middleware. O teste replica-set aborta após limpar o carrinho e exige estado integralmente pristino+retry.
- Checks: `node --check` no service, controller e teste, CWD `real_dev/api`, todos exit code 0. P2-006 mantém `EM_IMPLEMENTACAO`; teste funcional continua pendente. A suite 479/479 imediatamente anterior não inclui este novo caso.
- Reteste: `npm test --` pagamento replica-set, robustez e provider externo, fora da sandbox, exit code 0; 3 ficheiros e 49/49. O novo abort depois de `after_cart` deixou order/stock/voucher/cart pristinos e retry pagou uma vez; timeouts HTTP, cancelamento provider e shutdown mantiveram-se verdes. P2-006 passa individualmente por `PRONTO_PARA_RETESTE` a `VALIDADO`.

### 2026-07-10 - G1, fail-fast da configuração local/production

- Alterações ainda não validadas: `PORT` é validada antes de `listen`; `CLIENT_ORIGINS` é normalizada como origin estrita e production recusa HTTP; `MONGODB_URI` exige protocolo/nome da base e deve ser explícita em production; esse ambiente também exige cifra com pelo menos 32 caracteres e HTTPS. O resumo do validator só contém ambiente/porta/contagens booleanas.
- Testes adicionados: porta inválida, origin com path, production HTTP, Mongo ausente e cifra fraca; positivo production usa apenas URI loopback/segredo fake no objeto local. `.env.example` corrigido para demo e credenciais separadas; `.env` real intocado.
- Checks: `node --check` em config e teste, CWD `real_dev/api`, ambos exit code 0. P2-013 mantém `EM_IMPLEMENTACAO`; testes/shutdown integrado ainda pendentes e o PASS 479/479 antecede este patch.
- Reteste: `npm test --` test-env, robustez e provider externo, fora da sandbox, exit code 0; 3 ficheiros/49 testes. Port/origins/Mongo/cifra/HTTPS, demo/real, readiness, 50 health concorrentes, shutdown normal/forçado e timeout ficaram verdes. P2-013 passa individualmente por `PRONTO_PARA_RETESTE` a `VALIDADO`.

### 2026-07-10 - G5/G6, diálogo destrutivo acessível

- Alterações ainda não validadas: novo `ConfirmDialog` prende o foco, fecha por Escape, restaura o trigger, exige palavra literal e expõe nomes/descrição ARIA; `AdminUsersPage` deixou de eliminar imediatamente e pede `ELIMINAR`. A ação conserva o conteúdo carregado em falha e só fecha o modal depois de sucesso.
- Validação focal: `node --test tests/adminOperations.test.mjs tests/routePresentation.test.mjs`, CWD `real_dev/web`, exit code 0; 8/8. Confirmação escrita, focus trap/Escape/restauro, estados admin, rota/título e landmark ficaram verdes. P2-011/P2-012 permanecem `EM_IMPLEMENTACAO`; build/browser continuam pendentes.

### 2026-07-10 - G6, primeira inspeção no browser real integrado

- Arranque: `npm run dev -- --host 127.0.0.1 --port 4173`, CWD `real_dev/web`, falhou na sandbox com exit code 1/`listen EPERM`; repetição autorizada fora da sandbox arrancou Vite 8.1.4 em loopback. Nenhuma API/Mongo remota foi iniciada, pelo que o estado de produtos em destaque mostrou erro esperado.
- Browser in-app a 1280×720: título `Início | Orélle`, `lang=pt-PT`, um único `main` e zero overflow horizontal; a UI/hero renderizaram e a copy conceptual ficou visível. Foram encontrados três defeitos reais: skip-link permanentemente visível (`position:static`), homepage ainda com `main#inicio` em vez de `main-content`, e foco final no `BODY` porque o effect correu sobre o fallback lazy. A imagem hero também estava `loading=lazy`, contra a prioridade pedida.
- Correção ainda não validada: `RoutePresentationEffects` foi movido para dentro do `Suspense`, para o foco/título só serem aplicados depois de o chunk lazy montar. CSS, anchor da home e prioridade hero aguardam o handoff de imagens; P2-012/P1-011 permanecem `EM_IMPLEMENTACAO`.
- Reteste browser após reload: o elemento ativo passou de `BODY` para o único `MAIN`, mantendo título correto; a correção de foco pós-lazy fica validada neste browser. O ID continua `inicio`, portanto o skip-link ainda não tem target e o finding não avança.

### 2026-07-10 - G6, primeira inspeção mobile no browser real integrado

- CWD/runtime: `real_dev/web`, Vite local já ativo em `127.0.0.1:4173`; inspeção pelo browser in-app a 320x720, sem iniciar API ou MongoDB e sem ler `.env`.
- Resultado: existe um único `main`, o foco pós-navegação termina corretamente nesse landmark e o título permanece humano. Porém, `document.documentElement.scrollWidth=335` para `clientWidth=320`, logo há overflow horizontal real.
- Causa visual localizada: `.mockup-chat-card` começa em x=48 e termina em x=368; os seus descendentes chegam aproximadamente a x=350. O conteúdo fica cortado no limite direito do viewport.
- Defeitos ainda visíveis: o skip-link continua permanentemente renderizado no topo e o landmark mantém `id="inicio"`, sem corresponder ao target `main-content`. Estas observações confirmam que P2-012/P3-004 continuam `EM_IMPLEMENTACAO`; não existe PASS mobile antes da correção e dos retestes 320/375/768/1280.

### 2026-07-10 - G1/G2/G3/G4/G7, suite API integral após as correções posteriores

- CWD: `real_dev/api`.
- Comando: `npm test`; exit code 0. O próprio script fixou `DOTENV_CONFIG_PATH=/dev/null`, `NODE_ENV=test`, MongoDB loopback e `AI_PROVIDER_MODE=demo`, sem descobrir ou usar o `.env` remoto.
- Resultado: 71/71 ficheiros e 482/482 testes passaram em 22,83 s. Este estado inclui os três incrementos posteriores ao anterior 479/479: alertas de rotina transacionais/concorrentes, abort antes do commit do pagamento e fail-fast de porta/origins/Mongo/cifra/HTTPS.
- Limite: a prova é integral apenas para a API; não substitui build, browser, acessibilidade, E2E, audits nem reauditoria final do estado frontend/documental ainda em alteração.

### 2026-07-10 - G5, recursos e ações assíncronas reutilizáveis

- CWD: `real_dev/web`.
- Alterações revistas: criados gate monotónico, `useAsyncResource` e `useAsyncAction` com `AbortController`, cleanup em unmount, invalidação anti-stale, normalização de erro e preservação dos dados carregados. Dashboard administrativo, moderação de avaliações e notificações separam leitura de mutação; a copy do dashboard explicita pagamentos e volume exclusivamente simulados.
- Validação coordenada: `node --test tests/asyncHooks.test.mjs && node --test tests/*.test.mjs`; exit code 0, respetivamente 5/5 e 60/60. O handoff também passou parsing JSX pelo transform OXC; uma tentativa anterior com esbuild inexistente no Vite 8 falhou por `ERR_MODULE_NOT_FOUND` e não é usada como evidence.
- Estado: P2-010 passa a `PRONTO_PARA_RETESTE`. Build, lifecycle React e falhas/races num browser continuam obrigatórios em P2-014/G7.

### 2026-07-10 - G6, warning runtime no componente de imagem

- CWD/runtime: `real_dev/web`, polling do Vite local em `127.0.0.1:4173`; API deliberadamente desligada.
- Resultado: além dos `ECONNREFUSED` esperados do proxy sem API, a consola do React 18 emitiu um warning real porque `OptimizedImage` passa `fetchPriority` diretamente ao `<img>` e esta versão pede o atributo DOM compatível em minúsculas. O finding P1-011 não pode avançar enquanto a prioridade hero produzir warning.
- Decisão: correção enviada ao subtask de imagens e exigida uma repetição com consola limpa. O warning fica preservado como evidence falhada; os erros do proxy não são classificados como defeito da UI neste arranque sem backend.

### 2026-07-10 - G1/G7, residual JWT encontrado na reauditoria estática

- CWD: raiz do repositório; pesquisa dirigida em `real_dev/api/src`, testes e manifests, excluindo dependências/quarentenas.
- Resultado: nenhum import ou uso runtime de `jsonwebtoken`, `sign` ou `verify`, mas a dependência direta continua no `package.json`/lock e nove JSDoc de fixtures ainda descrevem o token opaco como JWT. O contrato funcional de sessão permanece opaco; o residual aumenta superfície e torna a evidence enganadora.
- Estados: P2-007 e P2-016 passam de `VALIDADO` a `REABERTO` antes da remoção dirigida. Serão novamente validados individualmente por árvore de dependências/audit e suites de sessão/API.
- Primeira remoção: `npm uninstall jsonwebtoken --cache /tmp/orelle-npm-cache`, CWD `real_dev/api`, não produziu output durante cerca de 40 s e foi interrompido com exit code 130. Verificação posterior confirmou package, lock e árvore inalterados com `jsonwebtoken@9.0.3`; a tentativa falhada não é convertida em alteração nem PASS.
- Segunda remoção: o mesmo uninstall em modo `--offline --ignore-scripts --no-audit --no-fund`, exit code 0; removeu `jsonwebtoken` e 13 dependências transitivas. O npm emitiu warnings opcionais do binding WASM/Rolldown, sem missing/invalid no grafo final.
- Correção de evidence: dez JSDoc de fixtures passaram de “JWT” para “token opaco”; nenhum helper executável mudou.
- Validação paralela, CWD `real_dev/api`: scan de import/uso/nomenclatura JWT terminou exit code 1 esperado e zero matches; `npm ls --depth=0` exit code 0 sem `jsonwebtoken`; sessões/CSRF/auth 3 ficheiros e 25/25 testes; `npm audit --json` exit code 0 e zero vulnerabilidades em todas as severidades. O novo lock tem SHA-256 `7fb70abc...75b8`.
- Estados: P2-007 e P2-016 avançam a `PRONTO_PARA_RETESTE`. P2-007 aguarda a próxima suite API integral; P2-016 exige ainda `npm ci` limpo, suite integral e audit no mesmo estado do novo lock.

### 2026-07-10 - G0/G6, comparação estática do mockup e estado de revisão

- Âmbito read-only inicial: `mockup/` versus `real_dev/web`, sem instalar dependências, usar rede, abrir `.env` ou tocar em `apps/`.
- Correspondências: os cinco tokens cromáticos são iguais; header, pesquisa, hero, bloco IA, features, produtos, CTA, footer e launcher têm estrutura equivalente; os dois assets de análise têm SHA-256 idêntico entre mockup e runtime.
- Desvios materiais: grelhas IA/features não cumprem ainda o responsive 1→2→4 do design system; hero usa outra imagem; features usam siglas; catálogo vem corretamente da API; o fluxo IA real autentica e navega em vez de simular chat; copy PT-PT ainda precisa de diacríticos. O mockup é single-page e não aprova conta, pele, checkout ou administração.
- Alteração runtime: o hub deixou de declarar mockup ausente; usa `hasMockup:true`, source `mockup-reference`, revisão `pending-manual-review` e zero áreas revistas. A terminologia interna deixou de chamar “aprovado” ao artefacto de referência.
- Validação: smoke MF8-13 exit code 0/32 contratos; checker MF8-14 exit code 0, `READY_FOR_MANUAL_REVIEW`, 3 ficheiros/18 padrões e mockup 3/3; testes de router/hooks 8/8. Este estado significa apenas prontidão para revisão, não aprovação visual.

### 2026-07-10 - G0/G3/G4/G5, reconciliação documental com o runtime atual

- Âmbito: README, RF/RNF, cabulas/evidence, plano total, backlog/matriz/views e guias ativos de autenticação, visualização, privacidade, conta, IA dual, consulta/revisão, fairness e mockup. Relatórios/changelogs históricos mantêm os estados antigos; paths pedagógicos continuam em `apps/api|apps/web` e este master report não foi alterado pelo subtask.
- Contratos reconciliados: pedidos/retry e eliminação terminal; sessão guiada resolvida no backend sem IDs; transações de submit/history e generation/review; `machineResult` separado de `humanOverride`; audit list/detail/decision e CAS 409; comparação por data/`selectionKey`, imagem autenticada `no-store` e tabela; preview conceptual; fairness por allowlist; mockup presente mas sem aprovação.
- Falha preservada: a primeira invocação de `validate-planificacao.sh` a partir de `docs/planificacao` terminou exit code 127 por path relativo incorreto; não é usada como validação.
- Reteste coordenado na raiz: validator exit code 0/`overall_pass=true`, 44 RF, 31 RNF, 74 entradas de matriz/backlog e 74 guias, sem mismatches, links, placeholders ou issues; `git diff --check -- README.md docs` exit code 0.
- Scans semânticos: referências a mockup ausente e `BLOQUEADO_EXTERNO` só surgem em changelog/história de 2026-07-09; termos financeiros surgem apenas em negativos que proíbem cobrança; `consultationSessionId` surge apenas na regra que o recusa no browser. A comparação manual do mockup continua legitimamente pendente.
- Reauditoria semântica independente posterior: `FAIL` apesar dos gates estruturais verdes. Foram encontrados blocos pedagógicos ainda capazes de reintroduzir runtime antigo: estado de replay/UI de pagamento; MF2-07/08 com ID técnico/overlay antigo; MF8-06 sem a allowlist no ficheiro completo; MF8-11 sem cifra/índice unique/membership/audit; MF3-01 sem `userId` na projeção AAD nem validator; contradições delete/anonymize; negativos guiados impossíveis; oito guias MF0 ainda dizem mockup ausente; e paths `server/client` residuais.
- Decisão: a componente documental de P3-003 permanece `REABERTO`; o PASS do validator prova apenas estrutura. Cada grupo será corrigido contra o runtime atual e re-auditado antes de qualquer fecho.

### 2026-07-10 - G7, primeiro `npm ci` após remover JWT

- CWD: `real_dev/api`.
- Comando: `npm ci --cache /tmp/orelle-npm-cache`; exit code 1 com `Invalid Version` antes da instalação. A falha não é aceite como gate verde.
- Causa localizada no log npm sanitizado: a remoção offline gerou a entrada opcional `node_modules/@img/sharp-wasm32/node_modules/@emnapi/runtime` sem `version` no lock; o Arborist tentou deduplicá-la e lançou `TypeError`. O manifest e a remoção de JWT estão corretos, mas o lock ainda não é reproduzível.
- Decisão: reparar apenas metadata do lock através do npm sem scripts, confirmar que o manifest direto não muda e repetir `npm ci`; não editar versões à mão nem aceitar o grafo instalado anterior como substituto.
- Primeira reparação automática: `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`, exit code 1 com o mesmo `Invalid Version`; o npm valida a entrada vazia antes de poder regenerá-la. Será removida exclusivamente essa entrada inválida do lock e o próprio npm voltará a resolver/verificar a dependência opcional.
- Entrada vazia removida de forma dirigida; o manifest ficou com SHA-256 `2194b85e...d58d`. A repetição sandbox do refresh do lock deixou de emitir `Invalid Version`, mas ficou sem output/terminar durante cerca de 40 s e foi interrompida com exit code 130. Suspeita-se de espera de registry para a dependência opcional; será repetida com acesso de rede explícito, sem scripts/audit.
- Refresh autorizado do lock: `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`, exit code 0 em 398 ms. O manifest preservou o hash `2194b85e...d58d`; o lock passou a `4ec8f77a...9f34` e deixou de conter a entrada vazia.
- Segundo `npm ci`, exit code 0; 220 packages instalados pelo lock e audit automático zero. No mesmo estado: `npm audit --json` exit code 0/zero vulnerabilidades; `npm ls --depth=0` exit code 0 sem missing/invalid e apenas o rótulo extraneous opcional `@img/sharp-wasm32@0.35.3` já conhecido do grafo Sharp; suite API 71/71 ficheiros e 482/482 testes em 22,73 s.
- Estados: P2-007 e P2-016 regressam individualmente a `VALIDADO`. JWT ficou ausente da fonte/manifests/árvore, sessões opacas/CSRF continuam verdes e o lock atual é reproduzível; a reauditoria final ainda pode reabrir.

### 2026-07-10 - G5/G6, guard da consulta em browser mobile

- Runtime: Vite local em `127.0.0.1:4173`, viewport 320 px, API deliberadamente desligada. A primeira tentativa chamou um helper `domContentLoaded` inexistente no binding do browser e terminou com erro de ferramenta; não é usada como prova.
- Reteste por avaliação direta após navegação a `/consulta`: o guard redirecionou corretamente o visitante anónimo para login (`Iniciar sessão | Orélle`); existe um único `main#main-content`, o foco está no `MAIN` e `scrollWidth=clientWidth=320`, sem overflow horizontal nesse estado.
- Limite: o hub autenticado e os seus atributos `pending-manual-review` continuam provados apenas pelos smokes; exigem E2E com uma sessão local real antes de validar G5/G6.

### 2026-07-10 - G6, dependência do pipeline responsivo

- CWD: `real_dev/web`.
- Comando autorizado: `npm install --save-dev --save-exact sharp@0.35.3 --cache /tmp/orelle-npm-cache`; exit code 0. Foram adicionadas seis packages, o audit automático ficou em zero e nenhum script de instalação foi criado.
- Justificação: `sharp` é usado apenas em desenvolvimento para gerar variantes AVIF/WebP/fallback verificáveis; o browser não recebe esta dependência. Geração, integração, budgets e remoção segura dos originais continuam pendentes.
- Implementação ainda não validada: acrescentados `images:generate` e `check:g6-image-budgets`. O gerador cria 320/640/960 em AVIF/WebP, prepara fallback PNG 960 com palette, valida largura e limites (120 KiB thumbnail/300 KiB restantes) em temporários e só depois publica por rename. O checker exige os sete assets por produto e volta a medir dimensões/tamanho. Nenhum PNG foi ainda substituído nesta entrada.
- Checks iniciais: `node --check` nos dois scripts e teste puro do resolver, CWD `real_dev/web`; exit code 0, 4/4. Isto valida parsing/derivação de URLs, não prova ainda que os 175 outputs existem ou cabem nos budgets.
- Geração: `npm run images:generate`, exit code 0. Foram processados 25 produtos, publicados 150 AVIF/WebP e substituídos 25 fallbacks por PNG 960 apenas depois da validação interna. Os fallbacks de origem ocupavam 49.575.605 bytes; o conjunto publicado dos 175 assets ocupa 8.018.679 bytes. O checker independente, integração JSX, build e browser ainda são obrigatórios.
- Reteste independente: `npm run check:g6-image-budgets`, exit code 0; confirmou 25 produtos/150 variantes e 8.018.679 bytes. Todos os 320 ficaram <=120 KiB e todos os restantes/fallbacks <=300 KiB; o maior PNG publicado observado tem 190.534 bytes. P1-011 continua `EM_IMPLEMENTACAO` até integração, build e LCP/CLS/transferência no browser.

### 2026-07-10 - G0/G2/G3, correção semântica dos guias de pagamento e cábulas

- Handoff recebido, ainda sujeito a revisão coordenada: os dois guias de pagamento e duas cábulas deixaram de dizer que replay/UI estavam pendentes; documentam `paymentAttempts`, replay exato de `simulated_paid|simulated_failed`, checkout em dois passos e ausência total de gateway/I/O externo. Consentimento documenta GET/DELETE idempotentes, distinguindo apenas a ação visual dedicada ainda ausente.
- Evidência do subtask: validator 44/31/74/74 e `overall_pass=true`; fences MF3/MF7 pares; diff/trailing whitespace verdes; scans de Stripe/PayPal/MBWay/`checkoutUrl`/segredos sem matches. O inventário AST de 2026-07-07 permanece explicitamente histórico.
- Estado: a falha documental P1 deste grupo fica corrigida no handoff, mas P3-003 permanece `REABERTO` até inspeção coordenada e integração dos restantes grupos semânticos.

### 2026-07-10 - G0/G4, correção semântica dos guias IA

- Handoff recebido, ainda sujeito a revisão coordenada: BK-MF8-06 ensina allowlist fechada de chave+valor, labels canónicas, `policyVersion`, âmbito/limitações e invariância; BK-MF8-10 recusa `consultationSessionId`, resolve a última sessão própria e preserva transação/split; BK-MF8-11 inclui cifra contextual, índice único, membership, `$push auditTrail`, audit append-only e CAS 409.
- Evidência do subtask: validator 44/31/74/74 `overall_pass=true`, `git diff --check` verde, fences 18/28/38 pares, zero paths `real_dev` e zero negativos impossíveis de sessão estrangeira. P3-003 continua `REABERTO` até integrar o grupo visual/privacy e a revisão coordenada.

### 2026-07-10 - G0/G3/G5, correção semântica dos guias visual/privacy

- Handoff recebido, ainda sujeito a revisão coordenada: MF2-07/08 ensinam SVG seguro, `conceptual_preview`, `usesRealPhoto:false` e catálogo sem IDs; MF3-01 exige `completed`, projeção `userId` para AAD, validator e imagem owner-auth `private,no-store`; MF5/MF7 removem sempre bytes e eliminam FaceReport em delete/anonymize enquanto não houver agregado anónimo comprovado. MF7 passou a ensinar endpoint/service/UI/testes da eliminação terminal da conta.
- Falha preservada: primeira tentativa usou `docs/planificacao/validate-planificacao.sh` inexistente e terminou 127. Reteste canónico `scripts/validate-planificacao.sh` passou 44/31/74/74 `overall_pass=true`; diff check e fences 22/22/18/28/44 verdes.
- Estado: os três grupos P1/P2 da reauditoria documental estão corrigidos nos handoffs; falta QA coordenada e resolver o drift transversal de paths/mockup MF0 antes de P3-003 poder avançar.

### 2026-07-10 - G0, correções transversais de mockup MF0 e paths públicos

- MF0: os oito guias BK-MF0-01..08 deixaram de afirmar que o mockup está ausente; metadados, pré-leitura, notas atuais e changelog dizem árvore disponível, aprovação/alinhamento não confirmados e comparação manual pendente. Scan focal: 8/8 metadata, 8/8 pre-read, 8/8 changelog e zero claims stale; validator/diff check verdes.
- Paths pedagógicos: scan inicial encontrou 445 tokens em 19 guias ativos fora de MF0 (332 `server/`, 113 `client/`) e dois CWD exatos. Foram convertidos mecanicamente para `apps/api/|apps/web/`; scan final de slash/backslash/backticks/`cd` ficou sem matches, validator `overall_pass=true` e diff check verde.
- Falhas preservadas: o primeiro scan de paths usou lookbehind sem `--pcre2` e terminou exit 2; a primeira procura do validator num path antigo terminou 127. Ambos foram corrigidos antes dos retestes. P3-003 aguarda agora apenas QA coordenada final e comparação visual manual, não drift documental conhecido.

### 2026-07-10 - G5/G6, integração inicial de imagens e filtros humanos

- Alterações ainda não validadas: `OptimizedImage` usa o atributo React 18 compatível `fetchpriority`, a hero recebe eager/high e dimensões reais 1024x1536, a home passa a `main#main-content` e a copy visível recebeu diacríticos PT-PT. A comparação de pele substituiu os dois `<img>` diretos pelo componente comum sem alterar URLs autenticados.
- Catálogo ainda não validado: `Categoria ID` foi substituída por select carregado de `/catalog/categories`; preços são introduzidos em EUR e convertidos para cêntimos apenas no query contract. Pesquisas anteriores são abortadas/ignoradas e falha ao adicionar ao carrinho já não apaga os produtos carregados.
- Findings: P1-011, P2-010, P2-011, P2-012 e P3-004 permanecem `EM_IMPLEMENTACAO`/`PRONTO_PARA_RETESTE` conforme dashboard até testes, build e browser; nenhuma alteração é aceite apenas por parsing.
- Acessibilidade/responsive ainda não validada: skip-link fica fora do viewport até focus, diálogos receberam backdrop/layout, botões e controlos de tema passam a mínimo 44 px, os grids IA/features colapsam 2→1 em tablet/mobile, mensagens podem quebrar palavras longas e `prefers-reduced-motion` neutraliza animações/transições. Foram ampliados testes G5/G6 e o smoke de imagens para recusar `<img>` disperso e a prop React incompatível.
- Validação estática atual: todos os testes Node frontend 62/62; smoke MF6 de imagens; checker de budgets; e smoke MF8 do hub/32 contratos, todos exit code 0. Cobrem select de categorias/EUR, ausência de IDs, abort de pesquisa, preservação do catálogo em erro de carrinho, `<picture>`, hero prioritária, zero `<img>` disperso, mockup pendente e assets reais. Build/browser continuam pendentes.
- Build atual: `npm run build`, exit code 0; Vite 8.1.4 transformou 94 módulos, entry 197,65 KiB raw/64,24 KiB gzip e chunks por rota. Os dois assets críticos importados ficaram 218,92/284,63 KiB. O antigo gate de página ainda media apenas JS/CSS; foi alterado, ainda sem reteste, para exigir entry gzip <=200 KiB e cada imagem publicada <=120/300 KiB, mantendo LCP/CLS exclusivamente como prova browser.
- Retestes pós-build: page budget passou com entry real 63.507 bytes gzip, 381.770 bytes/53 JS+CSS e 177 imagens dentro do limite; smokes runtime/performance/compatibilidade também passaram. Porém, `check:g1-config` falhou com exit code 1: o chunk de `OptimizedImage` contém literais `localhost|127.0.0.1|::1` usados para reconhecer URLs locais. Mesmo sem constituírem base da API, violam o contrato de bundle P1-003; a falha fica preservada e o resolver será refeito sem hosts loopback incorporados.
- Correção ainda não validada: o resolver deixou de enumerar hosts; URLs HTTP de desenvolvimento e same-origin são reduzidos a path, enquanto CDN HTTPS preserva origin. O bundle não precisa de conhecer qualquer endereço local.
- Reteste: resolver/UI 5/5, novo build 94 módulos, `check:g1-config` exit code 0 com 54 artefactos sem loopback e page budget exit code 0. Entry ficou 63.504 bytes gzip; P1-003 permanece `VALIDADO` no contrato tocado e P1-011/P2-011 passam a `PRONTO_PARA_RETESTE`.
- Consola HMR posterior: o warning `fetchPriority` desapareceu, mas React encontrou duas keys `/login` no menu público. A falha fica preservada. Correção ainda não validada: keys passaram a destino+label e a copy visível/ARIA do layout recebeu diacríticos PT-PT; o proxy sem API continua a produzir apenas os `ECONNREFUSED` esperados deste arranque.
- Limpeza adicional ainda não validada: `BrowserRouter` ativa os dois future flags suportados pela versão 6.30 para remover warnings de transição/splat antes da migração v7; não altera as rotas públicas.
- Reteste browser da home após carregar o chunk: 320x720 tem um único `main#main-content`, foco no `MAIN`, hero `eager/high` 1024x1536, grid IA/feature de uma coluna, skip-link fixed transformado para fora do viewport, `scrollWidth=clientWidth=320` e zero offenders. A 375 px manteve 1/1 colunas; 768 px ficou 1/2; 1280 px ficou 2/4; todos sem overflow e com foco/landmark corretos.
- Consola após reload de `main.jsx`: desapareceram warnings de prop, keys duplicadas e future flags; ficaram apenas `ECONNREFUSED` do proxy para auth/produtos, esperados porque a API não foi iniciada neste runtime visual.
- Limite do browser in-app: duas tentativas de enviar Tab/Enter ao skip-link falharam por incompatibilidade do locator/Input.dispatchKeyEvent, não por asserção da UI. O teste de teclado fica pendente para Playwright real e não é convertido em PASS. Viewport deve ser reposto no final da sessão browser.

### 2026-07-10 - G1/G7, revalidação de conta no E2E persistente

- Reauditoria do desenho E2E: `auth.middleware` ignora o estado atual da conta em qualquer `NODE_ENV=test` quando `findById` não é mock, mesmo que Mongoose esteja realmente ligado. Isto impediria provar em browser que suspensão, eliminação e alteração de role invalidam imediatamente uma sessão.
- Estado: P2-007 passa de `VALIDADO` a `REABERTO` antes do patch. O plano é conservar bypass apenas nas suites unitárias sem BD e ativar revalidação exclusivamente quando o processo está marcado `ORELLE_E2E_ISOLATED=true` e a conexão Mongoose está pronta; a proteção de URI test-only já falha cedo para bases não isoladas.
- Alteração ainda não validada: `env.e2eIsolated` só pode ser true em `NODE_ENV=test`; o middleware revalida quando esse flag e `User.db.readyState=1` coexistem. Production continua sempre a revalidar, mocks explícitos mantêm os testes antigos e test sem BD continua sem I/O acidental. Foi acrescentado teste puro dos quatro ramos.
- Primeiro reteste: checks sintáticos passaram e os 23 casos sem socket ficaram verdes; o conjunto terminou exit code 1 com 10/33 falhas/10 unhandled, todas `listen EPERM 0.0.0.0` em Supertest dentro da sandbox. A falha ambiental fica preservada e será repetida fora da sandbox antes de avaliar o patch.

### 2026-07-10 - G1/G7, reteste externo da revalidação de sessão

- CWD: `real_dev/api`.
- Comando: `npm test -- tests/opaque-session.service.test.js tests/auth.session.test.js tests/csrf-origin.test.js tests/mf8.test-env.contract.test.js --reporter=dot`, fora da sandbox para permitir as portas efémeras locais do Supertest.
- Resultado: exit code 0; 4/4 ficheiros e 33/33 testes passaram em 2,98 s. O processo fixou dotenv em `/dev/null`, MongoDB loopback e IA demo; os warnings emitidos correspondem aos negativos 400/401/403 esperados.
- Estado: o patch distingue testes unitários sem BD de E2E isolado com Mongoose ligado e fica `PRONTO_PARA_RETESTE`; validação final exige o fluxo browser persistente e a repetição da suite API integral no mesmo estado.

### 2026-07-10 - G0, QA coordenada da documentação após retoma

- CWD: raiz do repositório.
- Validações: `bash scripts/validate-planificacao.sh` terminou exit code 0 com `overall_pass=true`, 44 RF, 31 RNF e 74 entradas/guias; `git diff --check -- README.md docs` terminou exit code 0.
- Scan semântico: os guias MF1-MF8 corrigidos usam os paths públicos `apps/api|apps/web`, mas a pesquisa transversal encontrou ainda muitos paths ativos `server/|client/` nos oito guias MF0. Os relatórios históricos também conservam esses termos, o que é permitido como história; os tutoriais ativos MF0 não são aceites como estado canónico.
- Decisão: manter P3-003 `REABERTO`. O PASS estrutural não substitui a coerência semântica; os paths dos oito tutoriais MF0 serão convertidos mecanicamente e validados antes do novo scan independente.
- Correção aplicada: apenas os oito tutoriais ativos `BK-MF0-01..08` foram convertidos de `server/|client/` para `apps/api/|apps/web/`, incluindo referências ao diretório package; cada changelog regista a normalização. Relatórios históricos e `apps/` não foram tocados.
- Reteste: o scan focal encontrou zero paths `server/|client/`, roots em backticks ou comandos `cd` antigos nos oito guias; 705 referências públicas `apps/api/|apps/web/` ficaram distribuídas pelos oito ficheiros. Depois de acrescentar os oito registos de changelog, o validator repetiu `overall_pass=true` com 44/31/74/74, `git diff --check` terminou exit code 0 e o scan confirmou 8/8 changelogs.
- Estado: o drift transversal de paths ativos ficou corrigido. P3-003 permanece `REABERTO` até ao parecer da reauditoria semântica independente e à revisão visual manual do mockup.

### 2026-07-10 - G0/G7, reauditoria semântica independente posterior aos paths MF0

- Âmbito read-only: README/documentação canónica e 74 guias, comparados com `real_dev`; `apps/`, `.env` e este report não foram editados pelo auditor. O validator e `git diff --check` mantiveram exit code 0, e o scan confirmou zero paths `server/|client/` nos guias.
- Resultado semântico preliminar: `FAIL`. Foram encontrados tutoriais ativos que ainda ensinam JWT e deixam CSRF para futuro; revogação de consentimento que bloquearia indevidamente a leitura própria; reativação de conta `deleted`; IA local/fallback; PDF/backup ainda pendentes apesar de validados; paths privados `real_dev` num guia; `consultationSessionId` exposto na UI de insights; e evidence antiga sem nota de supersessão.
- Finding documental P1 adicional: quatro tutoriais ativos ainda ensinam tipos/erros e instalação de Multer (`BK-MF1-05`, `BK-MF8-02`, `BK-MF6-07`, glossário `BK-MF0-04`), enquanto o runtime corrigido usa Busboy streaming + Sharp. Copiar esses blocos reintroduziria P1-009/P2-008; serão corrigidos antes do fecho.
- Finding documental de cifra: `BK-MF6-07` ainda ensina envelope AES-GCM v1 sem `keyVersion`/AAD e tipagem Multer; o runtime usa `encryptJsonWithContext`/`contextualEncryptedField` com contexto coleção/owner/campo e `aadHash`. Copiar o guia reabriria P2-002, pelo que snippets e testes têm de ser reconciliados com v2.
- Primeira inspeção coordenada dirigida: terminou exit code 2 porque sete nomes de ficheiro foram inferidos incorretamente; apenas o guia MF0-02 existente foi lido. Essa saída confirmou JWT/CSRF/localhost no tutorial, mas não valida os restantes grupos; o reteste usará paths descobertos por `rg --files`.
- Decisão: P3-003 permanece `REABERTO`. O parecer final com linhas exatas será usado para correções focais e novo reteste independente; nenhum destes pontos é convertido em PASS pelo validator estrutural.
- Correção focal concluída: as 39 referências pedagógicas privadas `real_dev/api|web` de `BK-MF5-04` foram normalizadas para `apps/api|web`; o gate textual foi corrigido para não procurar o próprio path permitido e o changelog regista a normalização. O scan pós-alteração encontrou zero paths privados/antigos, o validator manteve 44/31/74/74 `overall_pass=true` e `git diff --check` terminou exit code 0. O runtime privado, relatórios históricos e `apps/` não foram tocados.
- Parecer final independente: confirmou oito grupos ativos — sessão opaca/CSRF, Busboy/Sharp, lifecycle de consentimento, conta `deleted` terminal, cifra contextual v2, estado IA atual, PDF/backup validados e insights sem IDs — além de evidence browser não sustentada e relatórios sem nota de supersessão. Pagamento, guided/machine-human/CAS/audit, fairness, comparação e mockup pendente ficaram semanticamente alinhados.
- Evidence do parecer: validator 44/31/74/74 e `git diff --check` exit code 0, scans sem paths antigos, mas decisão semântica `FAIL`; nenhum ficheiro foi editado pelo auditor. As correções foram distribuídas em dois grupos sem sobreposição, mantendo apenas o coordenador neste report.
- Handoff lifecycle/status/evidence recebido: consentimento, conta terminal, estado IA, PDF/backup, insights e notas históricas foram corrigidos; validator, diff/trailing whitespace e scans semânticos passaram. A revisão encontrou ainda um mismatch runtime: o DTO API de insights inclui `consultationSessionId` embora a UI já o oculte; P2-011 é reaberto e a correção API/teste fica a cargo do coordenador.
- Correção runtime subsequente: o DTO público de insight deixou de incluir `consultationSessionId` e o teste negativo foi acrescentado. A query interna opcional continua limitada pelo `userId` autenticado; validação focal ainda pendente.
- Primeiro reteste focal fora da sandbox: exit code 1; 14/15 testes passaram. `mf8.client-insights` ficou integralmente verde, incluindo a ausência do ID; uma asserção unitária em `mf8.ai-consultation-review` ainda esperava o campo removido no DTO reutilizável. A falha de contrato legado é preservada e será alinhada antes da repetição exata.
- Correção de teste: a expectativa reutilizável deixou de exigir o ID e passou a recusar explicitamente `consultationSessionId`. Nenhum runtime adicional mudou; repetição focal pendente.
- Segundo reteste focal: exit code 0, 2/2 ficheiros e 15/15 testes fora da sandbox. Os warnings sanitizados eram negativos 400/401/403/409 esperados. P2-011 regressa a `PRONTO_PARA_RETESTE` até E2E por role/browser.
- Handoff auth/upload/crypto recebido: oito documentos passaram a sessões opacas+CSRF/Origin, Busboy+Sharp e AES-GCM contextual v2; validator 44/31/74/74, diff e scans focais passaram. Duas tentativas `apply_patch` em MF6-07 falharam por contexto sem mutação e foram substituídas por patches menores; a única menção JWT restante é changelog histórico explicitamente supersedido e a leitura v1 existe apenas no helper da migration 005.

### 2026-07-10 - G1/G3/G4/G7, suite API após reforço E2E de sessão

- CWD: `real_dev/api`.
- Comando: `npm test`, fora da sandbox para permitir HTTP e replica sets locais.
- Resultado: exit code 0; 71/71 ficheiros e 483/483 testes passaram em 22,87 s. O script voltou a fixar dotenv em `/dev/null`, MongoDB loopback e IA demo; nenhum `.env` remoto foi descoberto ou usado.
- Cobertura incremental: inclui a revalidação da conta persistida apenas no E2E isolado, sem regressão nas sessões unitárias sem BD. P2-007 continua `PRONTO_PARA_RETESTE` até à prova browser de suspensão/eliminação/role, não por falha backend.

### 2026-07-10 - G6, primeira tentativa de recolha Performance API após retoma

- Runtime: Vite local já ativo em loopback; browser in-app no estado visual da home.
- Resultado: a avaliação que tentou ler diretamente `performance.getEntriesByType` terminou com `TypeError` porque o binding de avaliação não expôs esse objeto nesse contexto. Nenhuma métrica LCP/CLS/transferência é inferida deste erro de ferramenta.
- Diagnóstico de ferramenta: uma segunda avaliação confirmou `window.performance` e `window.PerformanceObserver` como indisponíveis no contexto isolado do browser in-app, embora a navegação DOM continue funcional.
- Decisão: preservar a falha e recolher Web Vitals no Playwright real, onde `PerformanceObserver` e traces podem ser instalados antes da navegação.

### 2026-07-10 - G5/G6, acabamento linguístico PT-PT

- CWD: `real_dev/web` (alterações aplicadas a partir da raiz).
- Alteração: corrigidos diacríticos em copy visível, mensagens, labels de rota/medição e nomes acessíveis da home, catálogo, preferências, consulta guiada, histórico IA e hub assistido. Nenhuma rota, chave interna, role ou payload mudou.
- Primeiro reteste: 14/14 testes de navegação/apresentação/IDs, smoke do hub 32 contratos e smoke runtime MF6 passaram. O scan de texto encontrou ainda “Recomendacoes afetadas” num heading de insights; essa última ocorrência foi corrigida para “Recomendações afetadas” e fica pendente de reteste.
- Segundo scan estreito: zero headings/textos JSX com as formas inicialmente listadas. Um scan lexical mais amplo encontrou ainda quatro strings visíveis e alguns JSDoc sem diacríticos no histórico, hub, recomendações e consulta; foram corrigidos sem alterar código executável além da copy. O reteste amplo seguinte devolveu apenas JSDoc/comentários técnicos, sem nova copy visível. P3-004 mantém-se `EM_IMPLEMENTACAO`; suite frontend e build pós-alteração ainda pendentes.
- Browser HMR a 1280×720: título `Início | Orélle`, um único `main#main-content`, foco no `MAIN`, zero overflow e zero ocorrências visíveis das formas PT-PT antigas pesquisadas. Este reteste não substitui axe, teclado ou as rotas autenticadas.

### 2026-07-10 - G7, handoff intercalar do orquestrador E2E local

- Scope recebido: quatro scripts API de runtime E2E, syntax gate e `verify-all`, sem alteração de manifests, web, docs, `apps/` ou `.env`.
- Evidence do subtask: `node --check` 4/4, syntax gate em 361 ficheiros e 12/12 testes do core, todos exit code 0. O resolver de `verify-all` terminou exit code 2 esperado porque o package web ainda não publicara `lint`, `test:unit` e `test:contracts`; não arrancou Mongo/browser e a falha é preservada.
- Estado: P2-014 continua `EM_IMPLEMENTACAO`. O coordenador ainda tem de inspecionar os scripts, integrar o manifest frontend e executar E2E real; o handoff não é tratado como validação browser.
- Handoff final adicional: cinco ficheiros API, incluindo 13 testes core. Checks 4/4, core 13/13, syntax 361 ficheiros e stack sem browser passaram; a stack provou health/home 200, sete migrations e seeds minimizadas 3/3/3/3, seguida de teardown. O primeiro probe sandbox falhou por `listen EPERM` e o reteste externo passou; o allocator Mongo ficou fixado a 127.0.0.1. Uma primeira verificação de whitespace usou CWD incorreto e falhou, seguida do reteste correto verde. `run-e2e`/`verify-all` continuam a falhar cedo porque falta `test:e2e` web e aliases API, como esperado neste ponto.
- Integração coordenada aplicada: os três aliases API foram publicados e o syntax collector passou a incluir as duas configs web recém-criadas. Checks/reteste ainda pendentes; Playwright web continua a ser a dependência funcional em falta.
- Reteste da integração: `npm run check:syntax` terminou exit code 0 sobre 364 ficheiros JS/MJS/CJS; o focal E2E core terminou exit code 0, 1 ficheiro e 13/13 testes. JSX continua delegado a ESLint/Vite e ambos já têm gates próprios; browser ainda pendente.

### 2026-07-10 - G7, primeira execução E2E integrada multi-engine

- CWD: `real_dev/api`; comando `npm run test:e2e` fora da sandbox, com MongoMemoryReplSet, build isolado, gateway same-origin e teardown do orquestrador.
- Resultado: exit code 1 em 1,2 min; 14/36 passaram, 8 foram skipped por design fora do Chromium e 14 falharam. Build/infra/seed/teardown arrancaram; 12 provas de overflow e os budgets Chromium passaram.
- Falhas reais preservadas: login admin/cliente recebeu 400 porque a password efémera gerada excede o limite público de 72 bytes; Axe encontrou contraste `serious` na home/login/catálogo em todos os engines; skip-link não recebeu o primeiro Tab porque o effect foca o `main` também no carregamento inicial. Nenhuma destas falhas é convertida em PASS.
- Decisão: corrigir o gerador de password E2E, distinguir foco inicial de navegação SPA e identificar os seletores de contraste em páginas públicas antes de repetir focais e depois a matriz completa.
- Primeiro diagnóstico Axe isolado contra o Vite local: exit code 1 antes do scan, porque `@axe-core/playwright` exige `browser.newContext()` e a ferramenta usou diretamente `browser.newPage()`. A falha é exclusivamente do comando diagnóstico e não altera as violações já provadas; o reteste criará contexto explícito.
- Reteste diagnóstico Axe: exit code 0. Seletores públicos com contraste insuficiente foram isolados sem PII: `mockup-nav-label`, pill/action gold, CTA/floating IA e label do nav ativo. O rácio recorrente cream/gold era 3,37:1; CTA era 2,18:1.
- Correções aplicadas, ainda sem reteste: password de utilizador E2E usa 20 bytes de entropia e fica abaixo dos 72 bytes públicos, mantendo sanitização; o foco automático ocorre apenas após mudança real de pathname SPA, preservando o skip-link no carregamento inicial; elementos sobre gold usam agora foreground escuro de alto contraste. Uma primeira tentativa multi-ficheiro do patch falhou por contexto CSS/ordem e não alterou ficheiros; a reaplicação separada foi concluída.
- Primeiro reteste focal Chromium contra Vite local: exit code 1, 4/8 passaram. Os quatro viewports ficaram verdes; o skip-link passou a receber o primeiro Tab, mas o anchor não focou o `main` porque o landmark inicial ainda não tinha `tabindex=-1`. Axe reduziu os nós home de 13 para 4 e login/catálogo mantiveram um cada, exigindo novo diagnóstico de seletores/estados hover antes do segundo patch.
- Segundo diagnóstico focal, CWD `real_dev/web`: um probe Node/Playwright+Axe inline contra `http://127.0.0.1:4173` terminou com exit code 0 e isolou apenas os nós ainda falhados, sem dados autenticados. Home: `.mockup-nav-label`, `.mockup-pill--gold` e `small` tinham texto `#1e1e1e` sobre `#9b7e3c`, rácio 4,32:1; `.mockup-cta-icon` herdava `#e1bab5`, rácio 2,18:1. Login/catálogo: `.app-nav-link__label` repetia 4,32:1. O segundo patch usará foreground `#111111` com especificidade suficiente e acrescentará `tabindex=-1` aos três landmarks montáveis; nenhum PASS de acessibilidade é inferido antes do reteste Chromium.
- Segundo patch aplicado, CWD raiz: os estados sobre gold da navegação pública/profissional, pills, ação gold, ícone CTA e badge flutuante usam agora `#111111`, cujo contraste calculado contra `#9b7e3c` é 4,895:1. A regra do ícone CTA ganhou especificidade para não herdar o rosa do parágrafo. Os landmarks da home, layout partilhado, fallback lazy e guards de autenticação/role têm `tabIndex={-1}` estático e `main-content` quando montados isoladamente, permitindo que o skip-link altere o foco sem criar um segundo `main`. Reteste Chromium ainda pendente; o patch não é registado como PASS por si só.
- Segundo reteste focal Chromium, CWD `real_dev/web`: `env PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e -- tests/e2e/public-accessibility.spec.js tests/e2e/responsive-keyboard.spec.js --project=chromium` terminou exit code 1; 7/8 passaram em 5,3 s. Home e login ficaram sem violações serious/critical; os quatro viewports continuaram sem overflow; o skip-link recebeu foco, ativou `#main-content` e o foco pós-navegação passou. Apenas `/produtos` falhou `color-contrast` serious em 25 nós, pelo que P2-012/P2-014 permanecem `EM_IMPLEMENTACAO`; os seletores do catálogo serão diagnosticados antes de novo patch.
- Diagnóstico Axe do catálogo, CWD `real_dev/web`: `node --input-type=module -e '<probe Playwright/Axe read-only>'` terminou exit code 0. Os 25 nós correspondem exatamente ao mesmo componente `.product-card__badge` (“Disponível”), com foreground `#f5efe7` sobre gold `#9b7e3c`, rácio 3,37:1. Não surgiram outros seletores nem dados privados; a correção será limitada ao foreground deste badge antes de repetir os oito casos.
- Terceiro patch focal: `.product-card__badge` passou a foreground `#111111` sobre o mesmo gold, elevando o contraste teórico para 4,895:1 sem alterar estado, copy ou layout dos 25 produtos. O reteste Axe/teclado permanece obrigatório.
- Terceiro reteste focal Chromium, mesmo CWD/comando: exit code 0; 8/8 passaram em 4,4 s. Home, login e catálogo ficaram sem violações Axe serious/critical; 320/375/768/1280 ficaram sem overflow; skip-link, fragmento `#main-content` e foco pós-navegação funcionaram por teclado. P2-012/P2-014 mantêm-se `EM_IMPLEMENTACAO` até à execução integrada Chromium/Firefox/WebKit com autenticação e persistência.
- Segunda execução E2E integrada multi-engine, CWD `real_dev/api`: `npm run test:e2e` terminou exit code 1; build/preview/MongoMemoryReplSet/migrations/seeds/teardown funcionaram, 22/36 testes passaram e 8 foram skipped por desenho fora do Chromium. A password E2E deixou de falhar o limite de 72 bytes e os 12 viewports, budgets, login e catálogo Axe ficaram verdes. Seis falhas permanecem: (1) o negativo CSRF admin recebeu 204 porque o helper de request poderá ter acrescentado prova automaticamente; (2) o journey chegou à criação do relatório, mas a seed não tinha produtos compatíveis suficientes e a UI não mostrou “Relatório bloqueado”; (3) a home com catálogo real apresentou seis nós de contraste em cada engine; (4) no WebKit, o `blur()+Tab` do próprio teste não voltou deterministicamente ao início do documento. Nenhuma falha é convertida em PASS; serão distinguidos defeitos de runtime, fixture e teste cross-engine antes de repetir os focais.
- Diagnóstico independente de CSRF: o helper browser faz `fetch` cru e o negativo está correto. `isExplicitTestRuntime()` selecionava o adaptador legado sempre que `NODE_ENV=test`, ignorando `env.e2eIsolated`; por isso o login E2E criava sessão em memória com `csrfProtectionRequired=false`, e o middleware saltava Origin/token. P2-007 foi reaberto e colocado em `EM_IMPLEMENTACAO` antes do patch central; criação, verificação, emissão/validação CSRF e revogação têm de usar `AuthSession` persistida no E2E isolado.
- Diagnóstico independente do relatório: o provider demo produz pele `mista`, mas só dois dos três produtos seed eram compatíveis e o service exige corretamente pelo menos três recomendações. A correção de fixture será acrescentar `mista` ao primeiro produto, preservando o mínimo de negócio e a expectativa “Relatório bloqueado”; não será alterado o runtime de recomendação.
- Correções CSRF/seed aplicadas: o predicado central do adaptador em memória exige agora `env.e2eIsolated !== true`, pelo que login, verificação, emissão/validação CSRF e revogação usam a coleção `AuthSession` no E2E isolado; foi acrescentado um teste unitário que exige persistência/cookie nesse modo. O primeiro produto seed passou a incluir `mista`, criando os três candidatos mínimos sem baixar a regra de negócio. Checks e testes ainda pendentes; nenhum PASS é inferido do patch.
- Diagnóstico independente de acessibilidade: os seis nós dinâmicos da home são exatamente `.product-card__category` e `.product-card__brand` nos três produtos, com `#8c8c8c` sobre branco (3,363:1). `/produtos` podia ser analisado antes dos cards assíncronos. No WebKit, a screenshot mostra Tab a focar a pesquisa e confirma a convenção Safari de `Option+Tab` para links; o skip-link já é anchor nativo. O patch manterá o link sem `tabIndex=0`, escurecerá esses metadados para `#666666` (5,742:1), aguardará os três cards antes de Axe e usará `Alt+Tab` apenas no projeto WebKit.
- Correção cross-engine aplicada: metadados dos cards usam `#666666`; o spec público aguarda três cards reais na home e catálogo antes de Axe, evitando falso negativo assíncrono; o teste de teclado removeu o `blur()` artificial e usa `Alt+Tab` apenas em WebKit, mantendo `Tab` nos restantes engines. O runtime do skip-link não foi enfraquecido nem focado programaticamente pelo teste. Lint/specs continuam pendentes.
- Reteste pré-E2E, CWDs `real_dev/api` e `real_dev/web`: checks sintáticos de sessão/seed/teste e `npm test -- tests/opaque-session.service.test.js tests/e2e-runtime.core.test.js --reporter=dot` terminaram exit code 0, 2 ficheiros e 27/27 testes; o novo caso prova `AuthSession.create`/cookie no E2E isolado. `npm run lint` web terminou exit code 0 sem warnings. Falta a prova HTTP persistente de 403→token→204→401, o journey completo e os três engines.
- Terceira execução E2E integrada, CWD `real_dev/api`: `npm run test:e2e` terminou exit code 1; 27/36 passaram, 8 foram skipped por desenho e apenas 1 falhou em 39,3 s. Sessão persistida/CSRF passaram o negativo 403, emissão de token, logout-all 204 e `/me` 401; home/login/catálogo Axe ficaram verdes nos três engines depois de aguardarem os cards; WebKit passou `Alt+Tab`; 12 viewports e budgets continuaram verdes; o journey ultrapassou checkout, upload, demo e relatório. Falha residual: depois de logout do cliente, o login do consultor respondeu 200 mas a SPA permaneceu em `/conta/privacidade-biometrica` em vez do destino da role. P2-007 continua `EM_IMPLEMENTACAO` até distinguir estado `from`/redirect de auth; P2-012 pode avançar individualmente após registar a evidence no finding, mas P2-014 mantém-se aberto pelo journey incompleto.
- Diagnóstico da falha residual: `resolvePostLoginPath` valida apenas que `from.pathname` é local, não que a role autenticada pode abrir a rota. O logout numa rota protegida leva o guard a guardar esse `from`; o login seguinte do consultor aceita-o e regressa à área cliente. P1-007 foi reaberto/colocado em `EM_IMPLEMENTACAO`; a correção será uma allowlist de destinos por role, preservando rotas públicas e partilhadas, com negativos cliente→admin e consultor→conta.
- Correção de redirect aplicada: `resolvePostLoginPath` possui defaults por role e só preserva paths públicos, consulta partilhada ou prefixes explicitamente compatíveis com cliente/consultor/admin; detalhe público de produto permanece acessível, mas avaliação continua cliente-only. Foram acrescentados negativos consultor→privacidade cliente, cliente→admin e consultor→avaliação, além de positivos admin→consultoria, consulta partilhada e produto público. Testes/lint/E2E ainda pendentes.
- Reteste focal, CWD `real_dev/web`: `node --test tests/accountNavigation.test.mjs` terminou exit code 0, 8/8; `npm run lint` terminou exit code 0 sem warnings. A allowlist por role e os destinos externos/incompatíveis estão cobertos; falta confirmar a troca cliente→consultor no journey browser persistente.
- Quarta execução E2E integrada, CWD `real_dev/api`: `npm run test:e2e` terminou exit code 0. Playwright executou 28/28 casos aplicáveis e marcou 8 skips intencionais fora do Chromium em 31,8 s; o orquestrador confirmou base `orelle_e2e_test`, 7 migrations, 5 utilizadores, 3 produtos e 3 imagens, seguida de teardown. Foram validados admin/roles/modal/CSRF/logout-all, journey cliente completo até revisão humana, checkout/pagamento simulado/replay, demo/privacidade, budgets, Axe, 12 viewports e teclado em Chromium/Firefox/WebKit. P1-007, P2-007 e P2-012 ficam `VALIDADO` individualmente; P2-014 fica `PRONTO_PARA_RETESTE` até `verify:all` e reauditoria.
- Gate de instalação limpa, CWDs `real_dev/api` e `real_dev/web`: `npm ci --cache /tmp/orelle-npm-cache` terminou exit code 0 em ambos. A API instalou 220 packages/audit automático zero; o web instalou 234/audit automático zero. Nenhum manifest/lock foi editado pelo comando. P2-016 permanece `REABERTO` até `npm ls`, audits explícitos, suites e build na árvore recém-criada.
- Dependências pós-ci: `npm audit --json` terminou exit code 0/zero vulnerabilidades em API e web; `npm ls --depth=0` terminou exit code 0 sem missing/invalid em ambos. O npm rotula `@img/sharp-wasm32@0.35.3` como extraneous opcional nas duas árvores, embora venha do grafo opcional `sharp` presente no lock; é o mesmo ruído já diagnosticado, não uma dependência direta nem advisory. Hashes atuais: lock API `4ec8f77a…9f34`, lock web `f26682d5…bac2`, manifest API `43d14993…70c0`, manifest web `70d0dcf7…6a42`. P2-016 continua aberto até suites/build no mesmo estado.
- Suites pós-ci, CWDs dos packages: `npm test` API terminou exit code 0, 72/72 ficheiros e 497/497 testes em 23,63 s, sempre com dotenv `/dev/null`, Mongo loopback e IA demo. `npm test` web terminou exit code 1: Vitest/jsdom passou 3 ficheiros/8 testes; contracts Node passaram 62/63. A única falha é uma regex de `responsiveImageSources.test.mjs` que exige o markup antigo `<main id="main-content">` e não aceita o `tabIndex={-1}` agora necessário ao skip-link; E2E já provou o runtime. P2-014 foi reaberto antes de corrigir apenas a expectativa e repetir a suite.
- Correção do contrato estático: a expectativa da home exige agora explicitamente `<main id="main-content" tabIndex={-1}>`, preservando tanto o anchor como a focabilidade necessária. Nenhum ficheiro de runtime mudou; reteste web continua pendente.
- Reteste web pós-correção, CWD `real_dev/web`: `npm test` terminou exit code 0; Vitest/jsdom passou 3 ficheiros/8 testes e os contracts Node passaram 63/63. P2-014 regressa a `PRONTO_PARA_RETESTE`; lint/build/budgets e `verify:all` ainda pendem na árvore pós-ci.
- Gates web pós-ci: lint e build Vite 94 módulos terminaram exit code 0; entry 198,62 KiB raw/64,57 KiB gzip. G1 confirmou 54 artefactos sem loopback; G6 confirmou 25 produtos/150 variantes/8.018.679 bytes e page budget de 63.835 bytes gzip/382.633 bytes JS+CSS/177 imagens. Smokes de imagens, performance unit/runtime, compatibilidade, checkout simulado, MF2, privacidade, feedback e tema passaram. A sequência parou com exit code 1 em `smoke:mf8-consultation`: o gate procura import eager da página no App, embora o runtime use `lazyNamed` e E2E tenha passado o fluxo. A falha de teste é preservada e P2-014 volta a `EM_IMPLEMENTACAO` antes do patch.
- Correção do smoke MF8: a expectativa passou a exigir a declaração `lazyNamed(() => import(...), "GuidedConsultationPage")`, mantendo explicitamente o gate de code splitting em vez de aceitar qualquer ocorrência do nome. Runtime inalterado; reteste do smoke e restantes comandos pendente.
- Retestes MF8, CWD `real_dev/web`: guided consultation e hub assistido passaram; `smoke:mf8-ai-history` terminou exit code 1 porque ainda exige a copy sem diacrítico “Historico seguro da interacao IA”, deliberadamente corrigida no runtime para PT-PT. A falha estática é preservada; será atualizada para exigir a copy correta, sem alterar a página.
- Correção do smoke de histórico: a expectativa exige agora “Histórico seguro da interação IA”, fazendo do gate uma proteção da copy PT-PT. Runtime inalterado; reteste pendente.
- Reteste final dos smokes corrigidos: `smoke:mf8-ai-history` terminou exit code 0 e o lint web repetido terminou exit code 0 sem warnings. Em conjunto com guided/hub já verdes, todos os smokes publicados foram executados no estado pós-ci; P2-014 regressa a `PRONTO_PARA_RETESTE`.
- Proxy pós-ci, CWD `real_dev/web`: `npm run test:g1-dev-proxy` terminou exit code 0 e confirmou `/api` encaminhado exclusivamente entre duas origins loopback efémeras.
- Gate documental estrutural atual, CWD raiz: `bash scripts/validate-planificacao.sh` terminou exit code 0/`overall_pass=true`, 44 RF, 31 RNF, 74 matriz/backlog/guias e zero issues; `git diff --check -- README.md docs` terminou exit code 0; o scan de trailing whitespace do master report terminou exit code 1 esperado/zero matches. P3-003 continua `REABERTO` até ao parecer semântico independente e à revisão manual do mockup, não por falha estrutural.
- Primeiro `verify:all`, CWD `real_dev/api`: exit code 1. Syntax passou 374 ficheiros e lint passou; o gate falhou na suite API com 32 ficheiros/198 testes falhados e 40/299 passados. Causa transversal confirmada pelo erro repetido `createSessionToken ... apenas em NODE_ENV=test`: `verify-all` reutiliza o ambiente E2E com `ORELLE_E2E_ISOLATED=true` no passo unitário, levando corretamente o runtime a exigir `AuthSession` persistida embora estas fixtures não tenham Mongo ligada. O `npm test` normal imediatamente anterior passou 497/497, pelo que não se mascara a falha nem se altera o runtime; P2-014 foi reaberto para separar ambiente unitário do ambiente E2E.
- Correção do orquestrador: o ambiente scrubbed da suite unitária define explicitamente `ORELLE_E2E_ISOLATED=false`; `run-e2e.mjs` continua a construir internamente um ambiente novo com o flag true e replica set real. Assim o gate deixa de confundir fixtures unitárias com E2E persistente sem reintroduzir bypass na aplicação. Check/teste focal e repetição integral ainda pendentes.

### 2026-07-10 - G7, tentativa de preparar Vitest/Testing Library/ESLint frontend

- Scope: package/lock/config/setup e primeiros testes comportamentais web, sem tocar no runtime.
- Resultado: nenhuma alteração foi aplicada. A consulta `npm view` ficou sem output cerca de 60 s na sandbox; a repetição com acesso externo também ficou bloqueada e foi interrompida após cerca de 1093 s. Package, lock, configs e testes novos não foram criados nem ficaram parcialmente mutados.
- Decisão: preservar a falha de registry/latência. P2-014 continua `EM_IMPLEMENTACAO`; o coordenador repetirá uma instalação explícita com versões conhecidas/cache isolada e timeout controlado, sem confundir a ausência de mutação com PASS.
- Reteste coordenado do registry, CWD `real_dev/web`, fora da sandbox e com cache isolada: exit code 0. Foram consultadas apenas versões/engines/peers públicos, sem instalar: jsdom 29.1.1, Testing Library React 16.3.2, user-event 14.6.1, jest-dom 6.9.1, ESLint 10.6.0, react-hooks 7.1.1, react-refresh 0.5.3 e globals 17.7.0; todos aceitam Node 24/React 18 no contrato publicado.
- Segunda consulta pública: exit code 0; Vitest 4.1.10, Testing Library DOM 10.4.1 e `@eslint/js` 10.0.1 também suportam o runtime fixado. Nenhum manifest foi alterado por estas consultas.
- Instalação coordenada: `npm install --save-dev --save-exact` das onze ferramentas, fora da sandbox e com cache isolada, terminou exit code 0; 197 packages adicionados e audit automático zero. P2-016 foi reaberto porque package/lock mudaram; configs/testes e validação reproduzível ainda pendem.
- Consulta Playwright/Axe posterior, sem instalação: exit code 0; `@playwright/test` 1.61.1 (Node >=18) e `@axe-core/playwright` 4.12.1 foram confirmados no registry público, compatíveis com Node 24. O manifest não mudou nesta consulta.
- Instalação Playwright/Axe: `npm install --save-dev --save-exact @playwright/test@1.61.1 @axe-core/playwright@4.12.1`, fora da sandbox e com cache isolada, terminou exit code 0; cinco packages adicionados e audit automático zero. Browsers não foram descarregados por este comando; P2-016 continua reaberto até `npm ci`/audit/test/build no lock final.
- Inventário de browser: `npx playwright install --dry-run` terminou exit code 0 e identificou Chromium 1228, Firefox 1532 e WebKit 2311; inspeção dos paths mostrou os três browsers ausentes e apenas FFmpeg 1011 já disponível. E2E multi-engine exige download explícito ou permanece `BLOQUEADO_EXTERNO`; nenhuma validação é inferida do dry-run.
- Download autorizado: `npx playwright install chromium firefox webkit` terminou exit code 0. Foram instalados Chromium/Headless Shell 1228, Firefox 1532 e WebKit 2311 na cache Playwright local; a disponibilidade binária deixou de ser blocker, mas nenhum fluxo é considerado validado antes da execução dos specs.
- Implementação local subsequente: package scripts, `eslint.config.js`, `vitest.config.js`, setup jsdom/jest-dom e três suites comportamentais foram acrescentados. Cobrem diálogo destrutivo, hooks canceláveis/anti-race e perfil recorrente; lint/testes ainda não foram executados e nenhum PASS é inferido do patch.
- Primeiro reteste: `npm run lint` terminou exit code 1 com 9 erros/2 warnings — seis imports React default não usados, duas capturas de ref no cleanup dos hooks e uma dependência de effect de privacy admin. `npm run test:unit` terminou exit code 1: 6/8 passaram e duas asserções usaram o matcher inexistente `toHaveMessage` sobre `Error`. As falhas são preservadas; serão corrigidos o runtime/lint reais e apenas o matcher dos dois testes antes de repetir.
- Correções aplicadas: imports JSX desnecessários removidos, refs estáveis capturadas no effect, dependência do draft admin explicitada e matchers de `Error` alinhados. Lint e unit tests aguardam repetição; nenhum estado mudou ainda.
- Segundo reteste: `npm run test:unit` terminou exit code 0, 3 ficheiros e 8/8 testes. `npm run lint` terminou exit code 0 com zero erros e dois warnings `react-refresh` nos módulos que intencionalmente exportam layout/roles e provider/hook; será acrescentado override focal, mantendo a regra ativa nos restantes componentes, antes do lint final.
- Override focal aplicado apenas a `AppLayouts` e `AuthContext`, onde componente e contrato partilhado coexistem intencionalmente; a regra Fast Refresh continua ativa no restante runtime. Lint final ainda pendente.
- Reteste final deste incremento: `npm run lint` terminou exit code 0 sem warnings/output; `npm run test:contracts` terminou exit code 0 com 62/62 testes Node. Em conjunto com os 8/8 Vitest/jsdom, o frontend tem agora 70 testes locais verdes; build, `npm ci`, audit e E2E ainda pendem no grafo atual.
- Build pós-lint/testes/copy: exit code 0; Vite 8.1.4 transformou 94 módulos, manteve chunks por rota e entry em 197,77 KiB raw/64,29 KiB gzip. Os dois assets conceptuais ficaram 218,92/284,63 KiB; budgets e scan do `dist` serão repetidos depois do layer Playwright.
- Retestes estáticos pós-build, todos exit code 0: G1 confirmou 54 artefactos sem loopback; G6 confirmou 25 produtos/150 variantes/8.018.679 bytes; page budget mediu entry 63.562 bytes gzip, 381.933 bytes em 53 JS/CSS e 177 imagens dentro dos limites; runtime MF6 e compatibilidade estática sobre 76 ficheiros também passaram. LCP/CLS/teclado/axe continuam dependentes do browser real.

### 2026-07-10 - G7, reabertura do comando ativo de backup legado

- CWD: raiz do repositório; inspeção read-only de `real_dev/api/package.json`, scripts, testes e documentação operacional ativa, sem abrir `.env`, ligar MongoDB ou tocar em `apps/`.
- Resultado: os comandos recuperáveis `backup:create|restore|verify|prune` existem e continuam suportados pelo core já testado, mas o manifest publica também `backup:daily` apontado a `scripts/backup-daily.mjs`. Esse script produz um export redigido que não é restaurável; o próprio guia MF8 e o runbook avisam que não constitui evidence de RNF21.
- Decisão: `ORELLE-AUD-P1-008` passa de `VALIDADO` por `REABERTO` a `EM_IMPLEMENTACAO` antes de qualquer patch. Será removido apenas o alias ativo ambíguo; o ficheiro/teste legado permanece como história/compatibilidade interna, o scheduler recuperável continua exclusivamente opt-in em `dev:local` e um teste negativo impedirá manifests futuros de voltarem a expor o export redigido como backup operacional.
- Estado de processo: a enumeração de processos via `ps` foi bloqueada pela sandbox (`operation not permitted`); `lsof` não encontrou listener na porta 4173. Nenhum processo anterior é usado como evidence atual.
- Alterações: removido `backup:daily` do manifest API, sem apagar o script/teste histórico; o contrato do core exige agora exatamente `backup:create|restore|verify|prune` e recusa qualquer referência ativa a `backup-daily.mjs`. O guia MF8, o arranque local, o runbook de operação e o plano total passaram a declarar o alias removido e o scheduler recuperável exclusivamente opt-in em `dev:local`.
- Validação API: `node --check tests/backup-local.core.test.js && npm test -- tests/backup-local.core.test.js tests/backup-local.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox; exit code 0, 2 ficheiros e 9/9 testes. Foram repetidos cifra/checksums/tamper/URI/retenção/scheduler, o negativo do alias e o ciclo real de create/restore/verify com índices.
- Validação documental: `bash scripts/validate-planificacao.sh && git diff --check -- README.md docs`, CWD raiz; exit code 0, `overall_pass=true`, 44 RF, 31 RNF e 74 entradas/guias. O scan do manifest confirmou exatamente os quatro aliases recuperáveis e ausência de referência ativa ao script legado.
- Hashes após a alteração: manifest API `a379c5c6ee9139faf62480e04a71ef1398219b8b93cde32eca59442a550c672b`; lock API inalterado `4ec8f77ae5be60cc24bbfcfcab367852bb83eb81ea366e4b046fbf75c3f99f34`.
- Estado: P1-008 passou individualmente por `PRONTO_PARA_RETESTE` e regressa a `VALIDADO`; P2-016 permanece `REABERTO` até o gate reproduzível final no manifest atual.

### 2026-07-10 - G2, reabertura por corrida intercalada checkout/pagamento

- Âmbito: auditoria independente read-only de order service/model e testes, seguida de reprodução num `MongoMemoryReplSet` efémero; sem `.env`, MongoDB remota, provider externo ou alterações pelo auditor.
- Causa: `checkoutMyCart` lê a encomenda elegível e executa depois `order.save()` fora de transação/compare-and-set, enquanto `simulateOrderPayment` confirma os efeitos numa transação. O schema não ativa optimistic concurrency e o teste anterior terminava os 25 checkouts antes de começar os 25 pagamentos.
- Reprodução: um segundo checkout foi pausado imediatamente antes do save, o pagamento confirmou e o save obsoleto foi libertado. O pagamento devolveu `simulated_paid`, mas o documento persistido regressou a `awaiting_simulation` com `stockReserved=true`, uma tentativa terminal, stock/voucher consumidos e carrinho ausente. O probe terminou exit code 0 fora da sandbox; a primeira tentativa dentro da sandbox ficou bloqueada por `listen EPERM`.
- Impacto: logística recusa a encomenda, dashboard/vendas omitem-na e a eliminação de conta pode tratá-la como não paga, apesar dos efeitos irreversíveis já confirmados.
- Decisão: P1-001 e P2-005 passam de `VALIDADO` por `REABERTO` a `EM_IMPLEMENTACAO` antes do patch. Será usado CAS monotónico sobre estado pendente/não reservado; perda da corrida recarrega o estado atual e nunca regride um pagamento terminal. Um teste replica-set com barreira intercalada torna-se obrigatório.
- Alterações: `checkoutMyCart` deixou de mutar/gravar um documento previamente lido. O refresh comercial usa `findOneAndUpdate` condicionado por owner/chave, logística pendente, `stockReserved=false` e pagamento `awaiting_simulation|simulated_failed`; uma perda do CAS recarrega e classifica o estado, devolvendo `simulated_paid` sem escrita ou recusando combinações incompatíveis. O recovery de `11000` usa a mesma classificação monotónica.
- Testes alterados: fixtures unitárias/HTTP passaram a exigir o CAS e ausência de `save()`; a integração replica-set ganhou uma barreira antes do CAS, confirma o pagamento durante a pausa e exige que checkout tardio, documento, stock, voucher, carrinho, tentativa e replay permaneçam exatamente pagos uma vez.
- Validação: `node --check` nos quatro ficheiros e `npm test -- tests/paywall-academic.service.test.js tests/mf3.integration.test.js tests/order-payment.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox; exit code 0, 3 ficheiros e 37/37 testes em 2,85 s. O mesmo run cobriu o novo interleaving, os 25 pedidos, cinco rollbacks e negativos HTTP sanitizados.
- Estado: P1-001 e P2-005 avançam a `PRONTO_PARA_RETESTE`; a suite API integral no estado final da próxima correção continua obrigatória antes de `VALIDADO`.

### 2026-07-10 - G3/G4, reabertura dos derivados sensíveis e review legado

- Âmbito: reauditoria independente read-only de models/services/migrations/testes; sem `.env`, providers, rede, MongoDB remota ou edição pelo auditor.
- Fuga confirmada: restrições livres cifradas no perfil são interpoladas em `limitations`; findings faciais cifrados tornam-se `sourceSignals`, labels, reasons e explicações. `ProductRecommendation` e `AiConsultationReview` duplicam-nos também em `machineResult`, enquanto `SkinComparison.metricDeltas` persiste valores/labels de evolução em claro. `FaceAnalysis.limitations` aceita ainda texto livre do provider real.
- Review legado: `RecommendationReview.note/adjustedExplanation` são strings normais ligadas ao cliente; o service duplica a nota e pode substituir `ProductRecommendation.explanation`, apesar do split machine/human já validado no fluxo principal.
- Testes insuficientes: os dumps anteriores não incluíam as coleções/derivados acima e só procuravam markers de notas/overrides já cifrados. Respostas textuais guiadas estão corretamente minimizadas e a allowlist bloqueia valores livres, mas os sinais cosméticos permitidos continuam dados pessoais derivados quando ligados ao titular.
- Decisão: P2-002 e P2-004 passam de `VALIDADO` por `REABERTO` a `EM_IMPLEMENTACAO`. Será criada `008_sensitive_derivatives_encryption`, append-only e sem tocar nos checksums 001–007; terá dry-run, contagens, replay, validação, AAD/owner e dump cru. A via de review legacy deixa de escrever no resultado de máquina.
- Alteração de models ainda não validada: uma lista de specs separada da migration 005 identifica apenas os derivados da futura 008. `FaceAnalysis.sources/limitations`; motivos, explicação, sinais, limitações e `machineResult` das recomendações; resumo/labels/limitações/máquina das revisões; notas da revisão legacy; e métricas/resumo/limitações da comparação usam agora campos contextuais por owner. As populações de recomendações em reviews selecionam também `userId`, obrigatório para autenticar o AAD.
- Compatibilidade: os nomes lógicos/DTOs permanecem, mas os schemas deixaram de guardar subdocumentos/arrays em claro. Migração 005 e 006 não foram editadas; nenhum checksum antigo foi alterado. A migração 008, o fluxo legacy, testes de validação/dump e retestes funcionais continuam pendentes, portanto nenhum PASS é inferido deste patch.
- Atomicidade adicional: a mesma revisão encontrou que a via legacy muta a recomendação antes de criar o registo de review e não usa CAS. P2-005 regressa de `PRONTO_PARA_RETESTE` por `REABERTO` a `EM_IMPLEMENTACAO`; o endpoint será preservado por compatibilidade, mas decisão e review terão uma única transação e a segunda decisão concorrente receberá 409.
- Alteração legacy ainda sem reteste funcional: o endpoint individual preserva agora `explanation`/`machineResult`, grava decisão/nota/explicação ajustada apenas no `humanOverride` cifrado e atualiza por CAS com owner, status atual e override nulo. Em runtime Mongo, CAS e criação do `RecommendationReview` cifrado usam a mesma transação; perda da corrida devolve 409. O DTO continua a expor separadamente a explicação de máquina e o ajuste humano.
- Validação sintática: `node --check` no service, model e teste MF2 alterados, CWD raiz, exit code 0. Ainda faltam o focal HTTP, concorrência/rollback replica-set e dump cru; P2-002/P2-004/P2-005 permanecem `EM_IMPLEMENTACAO`.
- Migração 008 ainda não validada: foi criada como DML transacional append-only, com specs próprios, análise sanitizada, conversão plaintext/v1, autenticação de envelopes v2, owner exato, validação fail-closed e replay pelo runner. Entrou no fim do registry e na allowlist E2E; comentários/erro do orquestrador passaram de 001–007 para 001–008. Os sources 005/006 permanecem intocados.
- Checks: `node --check` em utilitário, cinco models, dois services, migration 008, registry, core E2E e fixture MF2, CWD `real_dev/api`; 12/12 terminaram com exit code 0. Isto prova apenas parsing; nenhuma persistência/compatibilidade é ainda declarada verde.
- Primeiro reteste cross-feature: `npm test --` seis ficheiros de MF2, recomendações, reviews, cifra e comparação, CWD `real_dev/api`, fora da sandbox; exit code 1. Cinco ficheiros/34 testes passaram e quatro casos ficaram skipped porque o setup de `sensitive-models` falhou antes dos testes: o fixture criava `AiConsultationReview` sem os antigos defaults de `sourceLabels/limitations`, agora campos cifrados obrigatórios. A falha é de compatibilidade do fixture, não é convertida em PASS; o dump será ampliado com markers reais e valores explícitos antes da repetição.
- Testes de persistência ampliados, ainda sem execução: o dump de models inclui agora recomendações, reviews de sessão/individuais, comparações e limitações/fontes de análise, exige envelopes v2 em todos os campos e restaura Dates/valores lógicos. Um teste próprio da 008 cobre 5 coleções/16 campos, plaintext+v1, dry-run, AAD campo/owner, backfill legacy e replay.
- Compatibilidade humana: foi criado um resolver puro de explicação efetiva; DTOs gerais, de consultor e do endpoint individual mostram o ajuste humano sem alterar a explicação de máquina persistida. O validator limita o ajuste a 600 caracteres e normaliza-o para null fora de `adjusted`.
- CAS moderno: ajustes de uma review de sessão deduplicam IDs, exigem `humanOverride:null` e confirmam `matchedCount`; perda da corrida lança 409 e reverte a transação. Overrides novos guardam `reviewId`, mantendo a identidade do consultor apenas nos campos pesquisáveis/anomizáveis de review/audit.
- Backfill 008: a review individual mais recente por recomendação cria override cifrado apenas quando ausente, com owner coincidente e sem tocar em máquina/feedback/status; referências órfãs ou ownership divergente falham fechadas. A primeira tentativa multi-ficheiro deste incremento falhou por contexto de patch antes de aplicar qualquer hunk; a reaplicação por ficheiro foi concluída.
- Retoma após interrupção: o coordenador releu integralmente as 1.678 linhas deste report antes de prosseguir. `node --check` em migration/registry 008, resolver de apresentação, três services/validator, sete fixtures de cifra/review/migrações e `verify-all`, CWD `real_dev/api`, terminou exit code 0 para 15/15 ficheiros. O resultado prova apenas parsing do estado retomado; P2-002/P2-004/P2-005 permanecem `EM_IMPLEMENTACAO` até persistência, concorrência, rollback e dumps crus verdes.
- Primeiro reteste funcional da retoma: `npm test --` nove ficheiros de migration 008, models sensíveis, MF2, recomendações/reviews, comparação visual e registry, CWD `real_dev/api`, fora da sandbox; exit code 0, 9 ficheiros e 53/53 testes em 9,50 s. A 008 passou dry-run/up/replay/backfill, dump cru e AAD campo/owner; os models restauraram os valores lógicos cifrados; os contratos MF2/G4 e o registry 001–008 permaneceram compatíveis. Os warnings JSON correspondem apenas a negativos HTTP esperados. Ainda faltam concorrência/rollback específicos da via legacy, conflito material no CAS moderno, anonimização de referências antigas e suite integral.
- Provas concorrentes ampliadas, ainda sem reteste conjunto: o fixture moderno ganhou um caso em que uma recomendação já tem override humano e exige 409 com rollback integral de review/audit, preservando máquina e override vencedor. Foi acrescentado `recommendation-review.replset.integration.test.js` para a via individual: duas decisões concorrentes devem produzir um sucesso/um 409/uma review; `RecommendationReview.create` falhado deve reverter o CAS e permitir retry; BSON cru deve conter apenas envelopes v2 e o DTO deve separar explicação efetiva da explicação de máquina. Nenhum PASS é inferido da criação do teste.
- Checks dos dois fixtures de concorrência/review: `node --check tests/recommendation-review.replset.integration.test.js && node --check tests/ai-consultation-review.replset.integration.test.js`, CWD `real_dev/api`, terminou exit code 0. Execução funcional da nova via individual continua pendente.
- Primeiro reteste dos dois replica sets de revisão: exit code 1, 1 ficheiro/5 testes passaram e 1 caso falhou. Concorrência/CAS/rollback modernos e rollback/retry individual ficaram verdes; a única falha comparou o `reviewId` lógico restaurado como string hexadecimal com a instância `ObjectId` do documento de review. Os valores serializam de forma idêntica e nenhum defeito runtime foi demonstrado, mas o run permanece falhado; a asserção será alinhada ao reviver canónico antes da repetição.
- Correção apenas no fixture individual: `reviewId` é comparado com o hex canónico devolvido pelo reviver contextual, tal como já acontece com referências cifradas na migration 006. Runtime, cifra, CAS e critérios materiais permaneceram inalterados; reteste ainda pendente.
- Segundo reteste dos dois replica sets de revisão: `node --check` + `npm test -- tests/recommendation-review.replset.integration.test.js tests/ai-consultation-review.replset.integration.test.js --reporter=verbose`, CWD `real_dev/api`, fora da sandbox; exit code 0, 2 ficheiros e 6/6 testes. A via individual confirmou um sucesso/um 409/uma review, máquina preservada, BSON v2, rollback após CAS e retry; a via de sessão confirmou CAS perdido, rollback de review/audit, decisão concorrente e leituras auditadas. P2-004 e P2-005 avançam individualmente a `PRONTO_PARA_RETESTE`.
- Reabertura preventiva antes do próximo patch: a auditoria de anonimização confirmou que a migration 006 pode ter colocado `reviewerId` dentro de `humanOverride` cifrado e que 008/eliminação de conta ainda não o removem; referências top-level ficam anónimas, mas o ciphertext do cliente pode conservar a identidade do consultor apagado. P1-004, P2-004 e P2-005 regressam a `EM_IMPLEMENTACAO`; P2-002 já estava nesse estado. A correção será append-only na 008 ainda não aplicada a base durável, mais defesa transacional fail-closed na eliminação da conta, sem alterar o checksum 006.
- Finding funcional adicional antes de editar: o DTO geral de recomendações calcula a explicação humana efetiva apenas para a fairness, mas ainda serializa `recommendation.explanation` no campo público. Assim, uma recomendação ajustada pode persistir corretamente o override e continuar a mostrar a explicação de máquina fora dos DTOs de review. P2-004 permanece `EM_IMPLEMENTACAO`; o resolver será usado uma única vez tanto na validação como no DTO, sem alterar o snapshot persistido.
- Alteração de minimização ainda sem reteste: um utilitário puro remove apenas `reviewerId` de overrides humanos lógicos. A migration 008 percorre overrides de recomendações/reviews, normaliza envelopes legacy, recifra sem a identidade redundante, usa CAS pelo envelope original e acrescenta contagens sanitizadas; 006 não foi alterada. A eliminação de conta faz a mesma limpeza apenas quando o ID coincide com o consultor apagado, dentro da transação e com AAD/owner exatos; envelope inválido ou CAS perdido provoca rollback de tombstone e restantes referências. Checks, fixtures e prova negativa continuam pendentes.
- Alteração de apresentação ainda sem reteste: `toRecommendationDto` calcula uma única explicação efetiva, usa-a no guard de fairness e no campo público `explanation`, e expõe a versão automática separadamente como `machineExplanation`. O teste HTTP de listagem passa a exigir o ajuste humano visível e a máquina intacta; a persistência não foi alterada.
- Fixture 008 ampliado, ainda sem execução: semeia overrides v2 nas duas coleções com `reviewerId`, exige duas sanitizações no dry-run/up, preserva decisão/`reviewId`/data sob o mesmo AAD e recusa a presença final da identidade redundante. As contagens de 5 documentos/16 derivados e o backfill de uma review legacy mantêm-se materialmente separados.
- Contrato de escrita futura alinhado no teste transversal de models: updates Mongoose de recomendação/review usam `reviewId`, exigem o hex restaurado e recusam `reviewerId` no valor lógico, mantendo a prova de ciphertext v2. Runtime de escrita já seguia este contrato; apenas a fixture legacy foi atualizada.
- Eliminação de conta ampliada, ainda sem execução: o cenário completo semeia overrides de outro cliente nas duas coleções com o consultor a apagar, exige a remoção interna de `reviewerId` e preservação de decisão/`reviewId`; um novo negativo adultera o auth tag, exige rejeição e confirma rollback da conta, referência top-level e ciphertext. Isto cobre tanto minimização positiva como falha fechada transacional.
- Checks após minimização/DTO/fixtures: `node --check` em utilitário, migration 008, dois services e quatro testes alterados, CWD `real_dev/api`; exit code 0 para 8/8 ficheiros. Persistência e compatibilidade funcional continuam pendentes.
- Reteste funcional de minimização e apresentação: `npm test --` account erasure, migration 008, models sensíveis, migration 004/006 e MF2, CWD `real_dev/api`, fora da sandbox; exit code 0, 6 ficheiros e 37/37 testes em 8,19 s. A 008 sanitizou dois overrides e preservou AAD/decisão/review; eliminação removeu IDs internos de duas coleções e o auth tag adulterado reverteu conta/referências/ciphertext; writes futuros só usam `reviewId`; listagem mostrou ajuste humano e máquina separada. P1-004, P2-002, P2-004 e P2-005 avançam individualmente a `PRONTO_PARA_RETESTE`.
- Registry após alterar a 008: `npm test -- tests/migrations.replset.integration.test.js tests/e2e-runtime.core.test.js tests/sensitive-derivatives-encryption.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox; exit code 0, 3 ficheiros e 21/21 testes. O runner aplicou/reproduziu 001–008, o core E2E reconheceu oito versões e a 008 repetiu sanitização/backfill/AAD. Correção de acompanhamento: P2-015 devia ter sido explicitamente reaberto antes de tocar a source 008; o estado histórico regista agora `REABERTO -> VALIDADO` com este reteste, sem ocultar a omissão processual.
- Reabertura documental de P2-002 antes de editar código: o JSDoc de `decryptJsonForMigration` ainda dizia que o helper pertencia exclusivamente à 005, embora 008 o use legitimamente dentro da fronteira de migrations. P2-002 regressa a `EM_IMPLEMENTACAO` apenas para alinhar essa documentação interna e repetir o check; o runtime cifrado já validado não muda.
- Reconciliação documental coordenada parcial: README, RF/RNF, índice/plano total e backlog/matriz passaram a documentar registry 001–008, divisão 005/008, `reviewId` no override, identidade apenas em review/audit, CAS transacional, máquina imutável e explicação efetiva+`machineExplanation`. Os guias MF2-02 e MF8-05/06/10 usam agora o resolver comum nos DTOs e corrigem a descrição de regeneração. O JSDoc runtime esclarece que `decryptJsonForMigration` pertence apenas às migrations append-only 005/008. Guias MF2-06, MF6-07 e MF8-11 seguem em correções independentes; nenhum PASS documental é inferido antes do validator/scan.
- Checks da documentação interna tocada: `node --check real_dev/api/src/utils/encryption.util.js && node --check real_dev/api/src/services/recommendation.service.js`, CWD raiz; exit code 0. O primeiro é apenas JSDoc; o segundo repete parsing do DTO já coberto por MF2. P2-002 regressa a `PRONTO_PARA_RETESTE`.
- Primeira suite API integral após a 008, CWD `real_dev/api`: exit code 1, 73 ficheiros/503 testes passaram e 1 ficheiro/2 testes falharam, num total 74/505. A aplicação 001–008 ultrapassou o timeout default de 5 s apenas sob carga paralela da suite; a promise continuou e registou a 008 depois de Vitest encerrar o caso, pelo que o teste seguinte observou sete `skipped` e um `applied`. O focal isolado anterior aplicara/reproduzira 21/21 corretamente. A falha não é convertida em PASS: P2-015 regressa a `EM_IMPLEMENTACAO` antes de dar ao caso integral um timeout explícito compatível com oito migrações/DDL e repetir focal+suite.
- Correção do fixture canónico: apenas o caso que aplica 001–008 recebeu timeout explícito de 30 s, mantendo todos os critérios e o timeout global inalterados. `node --check tests/migrations.replset.integration.test.js`, CWD `real_dev/api`, terminou exit code 0; focal e suite integral continuam pendentes.
- Reteste focal 001–008: `npm test -- tests/migrations.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox; exit code 0, 1 ficheiro e 6/6 testes em 4,64 s. Dry-run/up/replay/checksum/lock/rollback/retoma ficaram verdes; a repetição integral sob carga continua obrigatória antes de recuperar P2-015.
- Segunda suite API integral após a 008: `npm test`, CWD `real_dev/api`, fora da sandbox; exit code 0, 74/74 ficheiros e 505/505 testes em 24,19 s. O mesmo estado cobre checkout intercalado/25 pedidos/rollbacks, oito migrações, conta/privacy/outbox, sanitização fail-closed, cifra/dumps, IA/guided/fairness, duas vias de review, backup/PDF/CSV, sessões/CSRF/rate limits e admin. P1-001, P1-004, P2-002, P2-004, P2-005 e P2-015 regressam individualmente a `VALIDADO`; o fecho global continua dependente de web/E2E/verify/docs/reauditoria.
- Scan estático pós-suite, CWD raiz: `reviewerId` no runtime ficou limitado ao modelo/service legítimo de pedidos biométricos e ao sanitizer da identidade legacy; a única escrita dentro de override está na migration 006 imutável e é removida pela 008. Termos financeiros/`checkoutUrl` no runtime/manifests não tiveram matches, exceto os paths que a migration 001 elimina de documentos antigos. Ambos os comandos terminaram exit code 0 pela existência desses matches esperados, sem segredo ou I/O externo.
- Handoffs documentais integrados, ainda sob QA coordenada: MF2-06 ensina cifra contextual, CAS+transação, `reviewId`, máquina imutável, DTO efetivo, concorrência/rollback/dump; MF8-11 cobre sete campos cifrados, ator pesquisável, dedupe/CAS/matchedCount/audit; MF6-07 distingue migrations 005/008 e todos os grupos/negativos; MF1-06, MF2-02 e MF3-01 deixaram de fornecer schemas/projeções finais em claro. Cada subtask reportou fences/diff/validator verdes e não tocou `apps/`, `real_dev` ou história; o coordenador repetirá os gates no conjunto completo antes de aceitar PASS.
- Scan coordenado de paths encontrou seis referências privadas residuais em dois tutoriais MF5, apesar de os restantes BKs usarem paths pedagógicos. MF5-06/08 foram corrigidos para publicar apenas `apps/web` e remeter qualquer mapeamento privado para relatório externo, sem nomear a raiz de referência. Nenhuma implementação em `apps/` foi tocada; reteste documental agregado continua pendente.
- Gate documental agregado: `bash scripts/validate-planificacao.sh` e `git diff --check -- README.md docs`, CWD raiz, terminaram exit code 0; `overall_pass=true`, 44 RF, 31 RNF, 74 matriz/backlog/guias e zero issues. Scans de trailing whitespace e paths privados/`server`/`client` nos 74 BKs terminaram exit code 1 esperado/zero matches. O scan semântico encontrou `reviewerId` apenas no contrato legítimo de pedidos biométricos, JWT apenas num changelog explicitamente substituído, e referências a fallback apenas em regras que o proíbem; 005/008 e DTO efetivo ficaram coerentes. P3-003 permanece `REABERTO` até reauditoria independente e decisão externa sobre o mockup, não por falha estrutural conhecida.

### 2026-07-10 - G7, primeiro `verify:all` integral após a migration 008

- CWD: `real_dev/api`; comando `npm run verify:all`, fora da sandbox para permitir HTTP, MongoMemoryReplSet e browsers locais; exit code 0.
- Resultado: 13/13 gates passaram no mesmo estado. Syntax verificou 379 ficheiros; lint terminou sem erros; API passou 74/74 ficheiros e 505/505 testes; frontend passou 3 ficheiros/8 testes Vitest/jsdom e 63/63 contracts; o build Vite transformou 94 módulos com entry de 198,62 KiB raw/64,57 KiB gzip.
- E2E: 28 casos aplicáveis passaram e 8 ficaram skipped intencionalmente fora do Chromium, em 36 casos descobertos nos projetos Chromium, Firefox e WebKit. O orquestrador usou apenas `orelle_e2e_test`, aplicou oito migrações, criou fixtures minimizadas e executou teardown. Foram repetidos pagamento exclusivamente simulado, CSRF/sessões persistidas, roles/admin, consulta/revisão, privacidade/demo, Axe, teclado, responsive e budgets.
- Performance/segurança/documentação: 25 produtos/150 variantes/8.018.679 bytes; 177 imagens dentro do limite e entry real de 63.835 bytes gzip; `npm audit` API/web com zero vulnerabilidades; planificação `overall_pass=true`, 44 RF, 31 RNF e 74 matriz/backlog/guias.
- Estados individuais: P1-005, P1-006, P1-011, P2-009, P2-010, P2-011 e P2-014 avançam a `VALIDADO`; P3-004 avança a `PRONTO_PARA_RETESTE`. P2-016 mantém-se `REABERTO` até repetir a instalação limpa no manifest API atual; P3-003/P3-005 e a reauditoria independente continuam pendentes.
- Observação posterior ao PASS: o stdout do Vitest conservou dois warnings de future flags apenas no `MemoryRouter` do teste de perfil. P3-004 é reaberto antes de alinhar o fixture; o resultado dos 13 gates permanece historicamente verde, mas o acabamento não será aceite com ruído evitável.
- Alteração do fixture, ainda sem reteste: `ProfileSetupPage.test.jsx` ativa `v7_startTransition` e `v7_relativeSplatPath` no `MemoryRouter`, tal como o `BrowserRouter` do runtime. A alteração é exclusivamente de teste e não muda paths, redirects ou componentes.
- Reteste do fixture: `npm run test:unit -- --reporter=verbose`, CWD `real_dev/web`, exit code 0; 3 ficheiros/8 testes passaram em 842 ms e o output ficou sem os dois warnings. P3-004 regressa a `PRONTO_PARA_RETESTE` até ao gate integral pós-instalação e reauditoria independente.
- Hashes antes da instalação final: API manifest `a379c5c6…672b`/lock `4ec8f77a…9f34`; web manifest `70d0dcf7…6a42`/lock `f26682d5…bac2`. `npm ci --cache /tmp/orelle-npm-cache`, CWD `real_dev/api`, terminou exit code 0: 220 packages instalados pelo lock e audit automático com zero vulnerabilidades. A instalação web e o gate pós-ci continuam pendentes; P2-016 não muda ainda de estado.
- Instalação web final: `npm ci --cache /tmp/orelle-npm-cache`, CWD `real_dev/web`, terminou exit code 0: 234 packages instalados pelo lock e audit automático com zero vulnerabilidades. Os dois lockfiles são agora reproduzíveis no estado atual; faltam `npm ls`, audits explícitos e `verify:all` sobre estas árvores novas antes de validar P2-016.
- Pós-ci explícito: `npm ls --depth=0` terminou exit code 0 nos dois packages, sem missing/invalid; mantém apenas o rótulo opcional conhecido `@img/sharp-wasm32@0.35.3 extraneous`, produzido pelo grafo optional do Sharp e presente após instalações limpas. `npm audit --json` terminou exit code 0 em API/web, com zero info/low/moderate/high/critical. P2-016 continua `REABERTO` apenas até executar as suites/build/E2E no mesmo estado recém-instalado.
- Segundo `verify:all`, agora nas árvores pós-ci: CWD `real_dev/api`, fora da sandbox, exit code 0. Os mesmos 13 gates passaram: syntax 379; lint sem warnings; API 74 ficheiros/505 testes; frontend 3 ficheiros/8 testes e 63/63 contracts, agora sem warnings React Router; build 94 módulos/64,57 KiB gzip; E2E 28 PASS/8 skips intencionais em Chromium/Firefox/WebKit com oito migrações; Axe/teclado/viewports/budgets; audits zero; planificação 44/31/74. P2-016 e P3-004 avançam individualmente a `VALIDADO`; G1 fica `VALIDADO`. G7 continua pendente apenas pela reauditoria independente e tratamento honesto dos blockers externos.
- Auditoria final de scope/segredos: comandos read-only na raiz terminaram exit code 0; `apps/` ficou sem diff/status e `real_dev` foi confirmado ignorado. `stat` mostrou apenas metadata `0644` do `.env`, sem leitura de conteúdo. O scan secreto devolveu quatro ocorrências exclusivamente em exemplos negativos/um comando documental; pagamento runtime/web não teve termos/provider/I/O externos. Os dois scripts operacionais que referem `mongodb://` usam apenas guards que recusam credenciais; as quarentenas inativas ainda contêm uma entrada API e `fsevents` web fora do ownership local. P3-005 passa a `BLOQUEADO_EXTERNO` pelas três ações externas explicitadas.

### 2026-07-10 - G7, reauditoria integral independente reprova o fecho

- Organização: três auditores read-only, sem edição, `.env`, `apps/`, Mongo remota ou providers/rede externos, reviram backend/segurança, frontend/browser e documentação/estado. O utilizador dispensou separadamente a comparação manual/Figma; essa decisão fica como risco visual aceite e não afeta os findings técnicos.
- Veredicto: `FAIL` nos três eixos, sem P0. O `verify:all` verde prova apenas os contratos cobertos e permanece registado; não invalida lacunas de concorrência, UI ou documentação descobertas por inspeção independente.
- P1 reabertos: unlock/report/voucher como segundo pagamento não idempotente; write barriers de upload versus revogação/privacy/account; provider real que fabrica findings; guided drafts/answers sem CAS; navegação pública incompatível com role; backup sem snapshot/staging; homepage demo apresentada como IA real; medição first-frame exibida como budget.
- P2 reabertos: abort não propagado ao pipeline facial; cifra de bytes sem AAD/keyVersion; carrinho e páginas com lost updates/perda de conteúdo; tema/tabela/touch targets; runtime local que carrega `.env` e aceita Mongo standalone; cobertura E2E/Axe insuficiente; migração posterior à 008 necessária.
- Documentação: validator estrutural continua 44/31/74, mas guias ativos ainda ensinam `paid`, proxy amplo, transações opcionais, timeout sem cancelamento, health antigo, E2E ausente, mockup contraditório, tema/performance/imagens antigos e evidence browser não comprovada. P3-003/P3-004 regressam a implementação; o risco visual dispensado permanece explicitamente não aprovado.
- Evidência focal do auditor backend: `npm test -- tests/mf7.external-ai-provider.test.js --reporter=verbose`, exit code 0, 24/24; o PASS contém o caso que normaliza uma resposta sem findings e, portanto, confirma que o teste atual cristaliza o defeito. Todos os restantes achados são estáticos e exigem novos testes materiais antes de voltar a validar.
- Primeiro patch pós-reauditoria, ainda sem testes: `ReportUnlock.simulatedPayment` ganhou hash de idempotência privado, `FaceReport` ganhou unique `(userId,analysisId)` e o upsert de voucher aceita a mesma `ClientSession`. São apenas pré-condições para tornar report+unlock+voucher uma transação; o service/route, migração e concorrência ainda não foram corrigidos, logo P1-001/P2-005/P2-015 permanecem `EM_IMPLEMENTACAO`.
- Pagamento simulado do relatório, ainda sem reteste: criação de `FaceReport` e gate passaram a upserts protegidos; o endpoint exige `Idempotency-Key`; unlock usa CAS e guarda apenas o hash; report+unlock+voucher executam numa transação snapshot/majority e failure injection pode abortar depois de unlock ou voucher. DTO/copy declaram permanentemente que não existe cobrança. Fixtures, migration/index e prova concorrente ainda pendem, por isso nenhum estado avança.
- Prova de persistência preparada, ainda sem execução: novo teste replica-set exige uma única `FaceReport` sob 25 criações, 25 replays do mesmo pagamento/uma referência/um voucher, 409 para chave diferente e rollback+retry depois de `after_unlock` e `after_voucher`. Fixtures unitárias MF1/paywall foram alinhadas aos upserts/CAS sem afrouxar ownership ou idempotência.
- Checks do incremento de pagamento de relatório: `node --check` em nove models/services/controller/fixtures, CWD `real_dev/api`, terminou exit code 0. Isto prova apenas parsing; os testes unitários/replica-set continuam obrigatórios.
- Primeiro reteste do pagamento de relatório: `npm test --` paywall, MF1 e replica-set, CWD `real_dev/api`, fora da sandbox; exit code 1, 2 ficheiros/22 testes passaram e 1/23 falhou. Concorrência 25×, 409, dois rollbacks/retry e MF1 ficaram verdes; a única falha foi o mock unitário de criação devolver o fixture antigo com uma recomendação embora o input/upsert contenha duas. O run não é convertido em PASS; será corrigido apenas o valor devolvido pelo fixture e repetido.
- Correção apenas no fixture paywall: o retorno simulado do upsert contém agora as duas recomendações do input e a expectativa do filtro usa igualdade sem depender da identidade do ObjectId mock. Runtime/transaction/CAS não mudaram; reteste pendente.
- Segundo reteste do pagamento de relatório: o mesmo conjunto, fora da sandbox, terminou exit code 0; 3 ficheiros/23 testes passaram em 2,72 s. Ficaram verdes 25 criações/25 replays, uma referência/voucher, chave diferente 409, rollback depois de unlock/voucher, retry e regressão MF1. P1-001/P2-005 permanecem `EM_IMPLEMENTACAO` até migration, contrato HTTP/frontend e suite integral.
- Carrinho pós-reauditoria, ainda sem reteste: criação passou a upsert com retry controlado de `11000`; add usa pipeline atómica que incrementa a quantidade atual e condiciona stock; update usa posição atómica e remove usa `$pull`, eliminando os read-modify-save que perdiam alterações de outros itens. Fixtures e concorrência real continuam pendentes; P2-005/P2-010 não avançam.
- Teste concorrente do carrinho preparado, ainda sem execução: exige 25 incrementos exatos num único documento, preservação de dois produtos sob 20 operações intercaladas e limite material de 20 sucessos/10 conflitos quando 30 adds disputam stock 20. Usa apenas `MongoMemoryReplSet` loopback.
- Checks do carrinho: `node --check` no service, fixture MF3 e nova integração, CWD `real_dev/api`, terminou exit code 0. Comportamento continua por provar.
- Primeiro reteste do carrinho: MF3 + replica-set, CWD `real_dev/api`, fora da sandbox; exit code 1, 1 ficheiro/24 testes passaram e 1/25 falhou. Os três casos concorrentes novos ficaram verdes; apenas a recompra MF3 recebeu 409 porque o fixture não simulava as chamadas adicionais de produto/upserts introduzidas pelo boundary atómico. O run permanece falhado e será corrigido apenas no mock de recompra.
- Correção apenas no fixture de recompra: as duas operações atómicas de cart devolvem agora o documento e o segundo mock materializa o item, sem restaurar `create/save` no runtime. Reteste pendente.
- Segundo reteste do carrinho: o mesmo conjunto, fora da sandbox, terminou exit code 0; 2 ficheiros/25 testes passaram em 1,58 s. Foram confirmados 25 incrementos exatos, dois produtos preservados, stock 20 sob 30 disputas, MF3/recompra e negativos. P2-005/P2-010 continuam abertos pelos restantes boundaries/frontend.
- Guided concurrency, ainda sem reteste: criado índice unique parcial de um draft por utilizador; start usa upsert+retry `11000`; cada answer usa CAS por `status=draft`/`__v` e devolve 409 em conflito; submit usa o mesmo CAS dentro da transação antes de criar history, impedindo save stale pós-submit. Migration, fixtures e provas start/answer/save-vs-submit concorrentes ainda pendem.
- Teste guided concorrente preparado, ainda sem execução: 25 arranques devem devolver um draft; duas respostas concorrentes produzem um sucesso/409 e retry preserva ambas; save-vs-submit produz um sucesso/409 e o history final tem exatamente os sinais das respostas confirmadas. Base exclusivamente efémera/loopback.
- Checks guided: `node --check` em model, service, fixture HTTP e integração concorrente, CWD `real_dev/api`, terminou exit code 0. A fixture nominal foi alinhada a upsert/CAS; comportamento continua pendente.
- Primeiro reteste guided: HTTP + durability + concorrência, CWD `real_dev/api`, fora da sandbox; exit code 1, 2 ficheiros/12 testes passaram e 1/13 falhou. Draft 25×, answer CAS/retry, rollback/history e HTTP ficaram verdes. No caso save-vs-submit, as operações não se intercalaram de forma adversa: save terminou antes de submit ler e ambas concluíram corretamente. O teste será tornado determinístico com uma barreira test-only depois da leitura do save; não se aceita esta execução como prova da corrida stale.
- Interleaving guided determinístico preparado: `saveGuidedConsultationAnswer` aceita um hook default no-op exclusivo de teste depois da leitura e antes do CAS. O fixture pausa aí, confirma submit+history e só depois liberta o save stale, que deve receber 409 sem alterar respostas. Runtime normal não injeta hook; reteste pendente.
- Reteste guided determinístico: `node --check` nos módulos/fixtures tocados e `npm test -- tests/mf8.ai-consultation.test.js tests/guided-consultation-durability.replset.integration.test.js tests/guided-consultation-concurrency.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox; exit code 0, 3 ficheiros e 13/13 testes em 3,99 s. Foram provados draft único sob 25 arranques, CAS/409/retry sem lost update, rollback da unidade sessão+history e submit confirmado antes de um save stale, que foi recusado sem divergir do histórico. P1-006/P2-005 permanecem `EM_IMPLEMENTACAO` por migration 009, frontend e reteste integral.
- Barreira de escrita facial, primeiro incremento ainda sem validação: `User` ganhou geração privada e tombstone de processamento com motivos fechados; foi criado um service transacional comum para upload, revogação, pedido de privacidade e libertação segura. O desenho força todos estes workflows a escrever no mesmo documento, recusa conta inativa/deleted e mantém o bloqueio perante outro pedido ou consentimento revogado. O helper ainda não está ligado aos callers nem migrado; parsing, concorrência e regressões continuam pendentes, portanto P1-004/P2-005/P2-015 permanecem `EM_IMPLEMENTACAO`.
- Ligação inicial da barreira ao consentimento/upload, ainda sem validação: em runtime Mongo ligado, aceitar/revogar consentimento usa a topologia transacional obrigatória; revogar bloqueia a conta no mesmo commit e aceitar só liberta sem pedidos destrutivos ativos. O commit do novo par reclama o mesmo documento `User`, volta a ler o consentimento dentro da transação e ignora a autorização cached da middleware; revogação/conta que vençam a corrida fazem o upload falhar e limpar temporários/ciphertext. Foi acrescentado um hook no-op exclusivo de teste depois da barreira para interleavings determinísticos. Privacy/account ainda não usam o helper e não há checks/testes, por isso nenhum finding avança.
- Reclaim de outbox antigo, ainda sem validação/caller: o worker ganhou uma operação transacional que encontra jobs incompletos por owner, os recria idempotentemente sob a origem destrutiva atual e só depois remove entradas supersedidas. Falha ou path ausente aborta a transação; jobs já canónicos são preservados. A ligação a privacy/account e as provas de retry/bytes continuam pendentes.
- Pedido de privacidade ligado à barreira, ainda sem validação: criar um pedido que inclua fotografias bloqueia novos writes no mesmo commit; aprovação/retry reafirma o tombstone antes de capturar metadata, reclama jobs antigos do owner e só depois retira as fotos. Rejeição e conclusão libertam exclusivamente um bloqueio `privacy_request` quando não existe outro pedido ativo e o consentimento continua válido; falha mantém o bloqueio até retry. A via unitária sem Mongo preserva mocks, mas o runtime ligado exige replica set. Account erasure, migration e testes concorrentes continuam pendentes.
- Eliminação de conta ligada à barreira, ainda sem validação: o tombstone terminal grava `account_deleted` e incrementa a geração no mesmo CAS da password/email/status, serializando qualquer upload já iniciado. Antes de apagar metadata, a transação reclama todos os jobs incompletos do owner — mesmo de workflows antigos — sob a origem de account erasure, além de enfileirar as fotografias ainda documentadas. O cleanup pós-commit processa uma única origem retomável. Checks, fixture de jobs antigos, corrida com upload e migration 009 continuam pendentes.
- Primeiro check da write barrier: `node --check` em `user.model`, novo helper, face-photo, outbox, privacy request e account erasure, CWD `real_dev/api`; exit code 0 nos 6/6 ficheiros. O parsing está verde, mas não prova locks, rollback, bytes ou compatibilidade de fixtures; os findings mantêm-se `EM_IMPLEMENTACAO`.
- Primeiro reteste focal da write barrier: `npm test --` consent lifecycle/concorrência, substituição facial, privacy requests e account erasure, CWD `real_dev/api`, fora da sandbox; exit code 1, 4/5 ficheiros e 26/28 testes passaram. Consentimento, privacy/outbox e conta mantiveram-se verdes. Os dois casos de substituição falharam porque o fixture replica-set criava apenas ObjectIds em memória e dependia do consentimento cached; o novo boundary recusou corretamente o primeiro upload por não existir `User` ativo nem `FaceConsent` persistido, deixando o segundo sem par prévio. A falha fica preservada; será alinhado apenas o fixture com conta/consentimento reais e repetido.
- Correção exclusiva do fixture de substituição: o replica set passa a criar uma conta ativa e o consentimento facial canónico, sincronizando os respetivos índices; nenhuma exceção ou fallback foi acrescentado ao runtime. Reteste ainda pendente.
- Reteste do fixture real: `node --check` e `npm test -- tests/face-photo-replacement.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox; exit code 0, 1 ficheiro e 2/2 testes em 3,48 s. A substituição normal/concorrente e o outbox pós-commit+retry permanecem verdes sob conta/consentimento persistidos. A corrida destrutiva adversa e o reclaim antigo ainda não estão cobertos.
- Provas adversas preparadas, ainda sem execução: o teste replica-set passa a (1) revogar e depois tentar confirmar um upload com o consentimento cached, exigindo 409, zero documentos e cleanup de todos os temporários/ciphertext; e (2) pausar um upload depois de reclamar o `User`, iniciar um pedido destrutivo concorrente, libertar o upload vencedor e exigir que o pedido o capture, elimine os bytes e liberte apenas a barreira de privacy. Parsing e comportamento continuam pendentes.
- Prova de reclaim de conta preparada, ainda sem execução: o fixture cria um job `failed` antigo cujo ficheiro já não tem `FacePhoto` correspondente; a eliminação terminal deve mover o trabalho para a origem atual, apagar fisicamente os bytes, remover o job supersedido e concluir o novo sem owner/path. Não se infere PASS da criação do caso.
- Reteste adverso da barreira/reclaim: `node --check` nos dois fixtures e `npm test -- tests/face-photo-replacement.replset.integration.test.js tests/account-erasure.replset.integration.test.js --reporter=verbose`, CWD `real_dev/api`, fora da sandbox; exit code 0, 2 ficheiros e 12/12 testes em 8,03 s. Revogação vencedora recusou o consentimento cached e limpou tudo; upload vencedor foi serializado antes do pedido, depois capturado e fisicamente eliminado sem stragglers; privacy libertou apenas o seu bloqueio. Account erasure preservou rollback/CSRF/concorrência e reclamou um job antigo sem metadata, eliminou os bytes e concluiu sem owner/path. Migration 009, corrida account-vs-upload e suite integral continuam pendentes.
- Corrida account-vs-upload preparada, ainda sem execução: o mesmo fixture pausa o upload depois de reclamar o `User`, inicia a eliminação terminal com password real e só então o liberta. O critério exige que o upload linearizado primeiro seja capturado no retry transacional da conta, termine sem metadata/bytes/jobs pendentes e deixe o tombstone `account_deleted`; nenhum PASS é inferido antes do replica set.
- Reteste account-vs-upload: `node --check` e `npm test -- tests/face-photo-replacement.replset.integration.test.js --reporter=verbose`, CWD `real_dev/api`, fora da sandbox; exit code 0, 1 ficheiro e 5/5 testes em 3,92 s. A eliminação esperou pelo lock do upload, voltou a executar com snapshot atual, capturou o par confirmado, removeu metadata/bytes e concluiu sem jobs pendentes; o tombstone ficou `account_deleted`. Revogação, privacy e substituição/outbox foram repetidos no mesmo ficheiro. P1-004/P2-005 continuam `EM_IMPLEMENTACAO` até migration 009 e suite integral.
- Cifra contextual dos bytes, alteração ainda sem validação: cada novo `FacePhoto` recebe `_id` antes de cifrar; AES-GCM v2 autentica coleção, owner, photoId e kind, e o model exige `keyVersion`/`aadHash`. A leitura reconstrói exatamente esse AAD e rejeita envelope legacy ou swap. O nome original potencialmente identificável deixou de ser persistido e passou a `${kind}.webp`. Fixtures diretos, negativos de owner/kind/photo e recifra 009 continuam pendentes; P2-002/P2-015 permanecem `EM_IMPLEMENTACAO`.
- Fixtures e negativos v2 alinhados, ainda sem execução: a persistência visual cria o photoId antes da cifra; fixtures Mongoose incluem metadata v2; os mocks declaram o novo contrato. O teste de storage exige `keyVersion`/`aadHash`, round-trip e falha ao trocar owner, kind ou photoId. A primeira tentativa de patch conjunto falhou por contexto antes de aplicar qualquer hunk; a reaplicação por ficheiro foi concluída. Checks/testes permanecem pendentes.
- Check da cifra de ficheiros: `node --check` em model/storage/service e cinco fixtures, CWD `real_dev/api`; exit code 0 nos 8/8 ficheiros. Parsing verde não substitui round-trip, persistência nem migration 009; P2-002 mantém-se `EM_IMPLEMENTACAO`.
- Reteste focal da cifra contextual: `npm test --` robustez, imagem persistente, substituição/barreiras, privacy, MF1 e budget facial, CWD `real_dev/api`, fora da sandbox; exit code 0, 6 ficheiros e 48/48 testes em 8,01 s. Foram provados round-trip v2, metadata, troca owner/kind/photo recusada, ownership/no-store, upload/cleanup/EXIF, três corridas destrutivas e regressões de análise/timeout. A 009 ainda tem de recifrar bytes legacy e normalizar os campos de barreira antes de P2-002/P2-015 avançarem.
- Migration 009 implementada/registada, ainda sem checks: DML transacional normaliza gerações/tombstones a partir de contas, consentimentos e pedidos; consolida relatórios duplicados com no máximo um unlock e mantém apenas o draft guiado mais recente. O finalize retomável recifra cada ficheiro legacy para um path v2 determinístico, confirma metadata+outbox antigo na mesma transação, remove e sanitiza o ciphertext anterior, minimiza nomes e cria os dois índices únicos. Analyze/dry-run só expõem contagens; validate autentica todos os ficheiros, barriers, cleanup, duplicados e índices. O E2E passou a exigir registry 001–009. Parsing, fixture legacy, failure injection e replay continuam pendentes; nenhum finding avança.
- Check inicial 009: `node --check` na migration, registry e core E2E, CWD `real_dev/api`; exit code 0 nos 3/3 ficheiros. A prova continua apenas sintática; filesystem/transações/índices/replay não foram ainda exercidos.
- Fixture 009 preparado, ainda sem execução: um replica set/native client e diretório efémero sem env remoto cobrem dry-run sem escrita, quatro estados de barrier, face report+unlock duplicado, dois drafts, ficheiro AES-GCM v1 com nome identificável, recifra/outbox/índices, autenticação dos bytes e replay skipped. Um segundo cenário força `ENOENT` no finalize, exige ausência de registo/lock, conserva o DML idempotente e retoma depois de o ficheiro reaparecer. Nenhum PASS é inferido da criação do teste.
- Checks do fixture/migration 009: `node --check` em ambos, CWD `real_dev/api`; exit code 0. Execução persistente continua pendente.
- Reteste persistente 009: `npm test -- tests/migration-009-privacy-face-files.replset.integration.test.js --reporter=verbose`, CWD `real_dev/api`, fora da sandbox; exit code 0, 1 ficheiro e 2/2 testes em 2,83 s. Dry-run não escreveu; barriers, dedupe, unlock, draft, recifra v1→v2, nome minimizado, outbox sanitizado, índices, autenticação e replay passaram. O `ENOENT` após DML não criou registo/lock; após restaurar o ciphertext, o replay idempotente concluiu. Registry integral 001–009, E2E e suite completa continuam pendentes.
- Fixture canónico do runner alinhado de 001–008 para 001–009: status/dry-run/applied/skipped e contagem de registos passaram a exigir nove versões; a análise da 009 exige zero dados legacy e os dois índices ausentes na base vazia. Execução ainda pendente.
- Hardening pré-run da 009: geração inválida, negativa ou fracionária é normalizada por pipeline sem erro em campos ausentes; qualquer motivo de bloqueio válido sem timestamp recebe o instante da migração antes da validação. O source mudou antes de qualquer aplicação durável e o teste/checksum serão repetidos.
- Reteste registry 001–009: checks da migration/fixture e `npm test -- tests/migration-009-privacy-face-files.replset.integration.test.js tests/migrations.replset.integration.test.js tests/e2e-runtime.core.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox; exit code 0, 3 ficheiros e 21/21 testes, duração Vitest 9,19 s. Passaram dry-run/up/replay/checksum/lock/rollback/retoma das nove versões, recifra e E2E core allowlist-only. A entrega da ferramenta ficou anormalmente atrasada apesar da duração interna curta, mas o processo concluiu normalmente. Suite API integral e browser ainda pendentes.
- Motivos de privacidade cifrados, alteração ainda sem validação: `BiometricDataRequest.reason/decisionReason` passaram a campos contextuais v2 por coleção/requester/campo, com getters apenas após autenticação. Os CAS de rejeição/aprovação carregam primeiro o owner e incluem-no no filtro exato, mantendo concorrência e permitindo ao setter cifrar no AAD correto. Validator continua a impor comprimento antes do model; migration 009/backfill, dumps e regressões permanecem pendentes.
- Backfill 009 ampliado, ainda sem validação: analyze conta motivos fora de v2/owners inválidos; up autentica plaintext/v1 apenas no boundary de migration e recifra `reason/decisionReason` pelo requester exato; validate exige dois envelopes e strings lógicas. O fixture agora contém markers reais, exige ausência no dump e round-trip por AAD; o runner canónico espera zero campos legacy na base vazia. O checksum da 009 mudou antes de aplicação durável e será repetido.
- Check do incremento de motivos: `node --check` em model/service/migration e dois fixtures, CWD `real_dev/api`; exit code 0 nos 5/5 ficheiros. Persistência e CAS continuam por retestar.
- Primeiro reteste de motivos/009/privacy: `npm test --` migration 009, registry, privacy requests e account erasure, CWD `real_dev/api`, fora da sandbox; exit code 1, 3/4 ficheiros e 16/22 testes passaram. Migration/registry/conta ficaram verdes; os seis casos privacy falharam antes do workflow porque os defaults cifrados de `reason/decisionReason` executaram durante a construção Mongoose antes de `requesterId` estar disponível ao setter. É um defeito real de lifecycle do model, não de AAD. A falha fica preservada; os defaults serão removidos, mantendo vazio apenas no DTO/migration, e o mesmo conjunto será repetido.
- Correção do lifecycle do model: os campos contextuais deixam de aplicar defaults antes do owner; criação fornece `reason` validado e ausência de decisão é representada como vazio apenas na projeção pública, enquanto a 009 materializa envelopes vazios nos legados. O AAD e a obrigatoriedade de owner exato não foram enfraquecidos. Reteste pendente.
- Segundo reteste privacy: check do model + `npm test -- tests/privacy-requests.replset.integration.test.js --reporter=verbose`, CWD `real_dev/api`, fora da sandbox; exit code 1, 5/6 testes passaram. Aprovação, legacy/retry, rollback e ownership ficaram verdes. A única falha é uma asserção que usa `.lean()` e esperava `decisionReason` lógico; recebeu corretamente o envelope v2 cru. O runtime/DTO não usa lean para esse campo. A falha fica preservada; o fixture passará a verificar separadamente documento Mongoose lógico e BSON sem plaintext.
- Correção exclusiva do fixture de rejeição: o documento Mongoose deve devolver a decisão lógica; a coleção crua deve conter `keyVersion=2`/`aadHash` e não conter a frase. Runtime/CAS/cifra não foram alterados. Reteste pendente.
- Reteste privacy/dump: `node --check` + `npm test -- tests/privacy-requests.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox; exit code 0, 1 ficheiro e 6/6 testes em 4,14 s. Aprovação/rejeição concorrentes, rollback, retry, ownership, ausência física e razões lógicas ficaram verdes; BSON cru confirmou v2 sem plaintext. Registry e suite integral ainda pendentes após esta alteração.
- Reteste integrado posterior à cifragem dos motivos: `node --check` em model/service/migration 009 e dois fixtures terminou exit code 0 para 5/5 ficheiros. `npm test -- tests/migration-009-privacy-face-files.replset.integration.test.js tests/migrations.replset.integration.test.js tests/privacy-requests.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox, terminou exit code 0; 3 ficheiros e 14/14 testes em 7,45 s. O mesmo estado repetiu dry-run/up/replay/checksum/lock/retoma 001–009, recifra dos ficheiros, backfill contextual de `reason/decisionReason`, dump sem plaintext, CAS concorrente, rollback/retry e ausência física. P1-004, P2-002, P2-005 e P2-015 mantêm-se `EM_IMPLEMENTACAO` até suite integral, E2E e reauditoria.
- Handoff backend pós-reauditoria, ainda sob revalidação coordenada: o provider real passou a recusar HTTP 200 sem os cinco findings materiais e o runtime local removeu a carga automática de dotenv, usa ambiente allowlist-only, `MongoMemoryReplSet` estrito e readiness transacional. Evidence recebida em `real_dev/api`: provider 38/38; configuração/runtime/robustez 29/29 fora da sandbox; readiness+rollback num replica set 1/1, todos com exit code 0. Uma tentativa manual de `dev:local` foi interrompida antes de recolher o probe e não conta como PASS; o subagente ficou responsável por confirmar cleanup, corrigir AbortError streaming, propagar AbortSignal no pipeline facial e implementar snapshot/staging do backup. P1-005/P2-013 mantêm-se `EM_IMPLEMENTACAO` até reteste próprio; P1-008/P2-006 continuam abertos.
- Reteste coordenado de provider/runtime local: `node --check` em nove sources/fixtures terminou exit code 0 para 9/9. `npm test -- tests/mf7.external-ai-provider.test.js tests/local-dev-runtime.test.js tests/mf6.robustness-security.test.js tests/local-dev-runtime.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox, terminou exit code 0; 4 ficheiros e 61/61 testes em 2,92 s. Foram repetidos payload real fail-closed, ambiente scrubbed sem dotenv/segredos herdados, URI estrita, readiness transacional, rollback real, HTTPS e timeout. P1-005/P2-013 ficam `PRONTO_PARA_RETESTE`; o probe `dev:local` completo, a suite integral e a reauditoria continuam obrigatórios.
- Probe real de `dev:local`, CWD `real_dev/api`, fora da sandbox: `env ORELLE_LOCAL_PORT=43241 npm run dev:local` arrancou o replica set `orelle-local-rs` e a API; `curl` a `/api/health/live` e `/api/health/ready` terminou exit code 0 com HTTP/Mongo `ok`. O encerramento manual por `SIGINT` devolveu exit code 1 no wrapper, mas o probe subsequente terminou exit code 7 esperado e confirmou a porta fechada. Um segundo probe programático start→stop imediato em 43242 terminou exit code 1 com `ERR_SERVER_NOT_RUNNING`: `startServer` devolve antes de o evento `listening` confirmar o servidor, permitindo que `shutdown()` corra cedo demais. A falha real é preservada; P2-013 regressa a `EM_IMPLEMENTACAO` e exige startup awaitable, stop idempotente imediato e reteste exit code 0.
- Limpeza de artefactos vazios na raiz: foram removidos por patch os ficheiros não versionados de zero bytes `PRONTO_PARA_RETESTE` e `VALIDADO`, criados anteriormente como resíduos de tooling e sem conteúdo aplicacional/documental. Nenhum ficheiro de `apps/`, implementação ou evidence foi removido; a confirmação por `git status` será repetida no gate final.
- Reteste coordenado da documentação: `bash scripts/validate-planificacao.sh`, CWD raiz, terminou exit code 0/`overall_pass=true` com 44 RF, 31 RNF e 74 matriz/backlog/guias; `git diff --check -- README.md docs` terminou exit code 0. Scans dos tutoriais ativos terminaram sem paths `real_dev|server|client`, sem `/api/api` e sem termos financeiros de runtime; o único `paid` encontrado está no changelog que documenta a remoção. Referências históricas a mockup ausente/aprovado continuam em relatórios preservados, enquanto o guia ativo começa por declarar `ACEITE_RISCO`, artefacto disponível e ausência de aprovação/Figma. P3-003 avança a `PRONTO_PARA_RETESTE` até reauditoria independente.
- Handoff frontend pós-reauditoria, ainda incompleto: lint terminou exit code 0; Vitest passou 13/13; contracts passaram 72/72; build Vite transformou 96 módulos com entry 202,17 kB raw/65,70 kB gzip; smokes de tema, Web Vitals e MF8 ficaram verdes. Foram implementados navegação por role, demo fail-closed, revogação, guards/races, tema, tabela de evolução, contrastes, pagamento de relatório idempotente/copy, JSON inválido fail-closed e primeiros `ErrorSummary`. Porém, `env ORELLE_E2E_SKIP_WEB_BUILD=true npm run test:e2e`, CWD `real_dev/api`, ficou sem output e foi interrompido depois de cerca de 615 s; não existe PASS E2E posterior aos patches. P1-005/P1-007/P1-011 e P2-010/011/012/014/P3-004 mantêm o estado aberto/pronto indicado no dashboard até copy, formulários materiais, journeys destrutivos e reteste integrado concluírem.
- Reteste coordenado frontend intermédio, CWD `real_dev/web`: `npm run lint`, `npm run test:unit` e `npm run test:contracts` terminaram todos exit code 0; lint sem output, Vitest 7 ficheiros/13 testes e Node contracts 72/72. O conjunto prova os novos negativos de metadata demo, JSON 2xx inválido, auth offline, tema, evolução/tabela, relatório simulado, wizard/duplo clique, navegação por role e primeiras UIs de erro. Build/E2E devem ser repetidos depois das alterações ainda em curso; este PASS não substitui o run browser interrompido.
- Reauditoria documental final independente, read-only: `bash scripts/validate-planificacao.sh` e `git diff --check` terminaram exit code 0 com 44/31/74, mas o parecer semântico foi `FAIL`. Foram localizadas divergências materiais na 009/privacy/cifra, alegações prematuras de backup staging, propagação incompleta de `ACEITE_RISCO` visual, estados antigos de badge/revogação, falta do unlock simulado do relatório, snippets Mongo/segredo/start inseguros e AbortSignal ainda não ligado pelo controller facial. P3-003 regressa a `EM_IMPLEMENTACAO`; o resultado estrutural anterior permanece preservado e não substitui a semântica.

### 2026-07-10 - G1/G7, correção e reteste da race de arranque local

- CWD: `real_dev/api`.
- Alteração: `startServer` aguarda o listener HTTP confirmar `listening`; erro de bind tenta desligar MongoDB e é propagado, preservando shutdown idempotente.
- Teste focal: `npm test -- tests/mf6.robustness-security.test.js -t 'shutdown|listening|bind HTTP' --reporter=dot`; exit code 0, 1 ficheiro e 4/4 testes aplicáveis (16 skipped pelo filtro).
- Probe persistente: `env ORELLE_LOCAL_PORT=43242 node --input-type=module -e '<runLocalDevelopment; stop imediato>'`; exit code 0. O runtime arrancou API+replica set local, devolveu apenas depois de estar pronto e encerrou imediatamente sem `ERR_SERVER_NOT_RUNNING`.
- Estado: P2-013 avança a `PRONTO_PARA_RETESTE`; suite integral e reauditoria final continuam obrigatórias.

### 2026-07-10 - G1/G4, cancelamento durante streaming de provider real

- CWD: `real_dev/api`.
- Alteração: `readProviderJson` passou a consumir o `AbortSignal` composto, cancelar a stream e propagar a razão original; timeout interno mantém 504 e cancelamento do pedido mantém 503, sem conversão genérica para 502.
- Comando: `npm test -- tests/mf7.external-ai-provider.test.js --reporter=dot`; exit code 0, 1 ficheiro e 40/40 testes.
- Limite: P2-006 permanece `EM_IMPLEMENTACAO` até o mesmo sinal atravessar multipart, Sharp, storage, service e commit facial, com cleanup e retry comprovados.

### 2026-07-10 - G1/G3/G4, propagação local do cancelamento facial em curso

- CWD: `real_dev/api`.
- Alterações observadas, ainda sem validação coordenada: utilitário comum de abort; Busboy/pipeline ligado a `req.signal`; Sharp destruído em cancelamento; filesystem cifrado com operações canceláveis; upload/controller e análise propagam o sinal; persistência de análise usa transação, barreira comum em `User`, consentimento e `photoIds` ativos relidos antes do insert e check pós-write.
- Provas preparadas: multipart parcial deve limpar o diretório; abort depois do insert deve fazer rollback e permitir um único retry; fotografias já substituídas devem devolver 409 e deixar zero análises.
- Estado: P2-006 continua `EM_IMPLEMENTACAO`; parsing ou presença dos testes não substituem a execução focal/replica-set.

### 2026-07-10 - G1/G3/G4, reteste material do cancelamento facial

- CWD: `real_dev/api`.
- Comando: `npm test -- tests/mf6.robustness-security.test.js tests/face-photo-upload-security.test.js tests/mf6.face-analysis-performance.test.js tests/mf7.external-ai-provider.test.js tests/face-analysis-abort.replset.integration.test.js tests/face-photo-replacement.replset.integration.test.js tests/mf1.face.test.js --reporter=dot`.
- Resultado: exit code 0, 7 ficheiros e 100/100 testes em 5,49 s. A execução usou dotenv `/dev/null`, Mongo loopback e IA demo.
- Provas: abort de multipart limpa ficheiro parcial; Sharp/storage/provider param cooperativamente; abort pós-provider não escreve; abort pós-insert faz rollback da análise e da geração; retry cria exatamente uma análise; fotos substituídas e consentimento revogado são recusados antes do commit.
- Reteste isolado adicional: `npm test -- tests/face-photo-abort.unit.test.js --reporter=dot`; exit code 0, 1 ficheiro e 2/2 testes, confirmando destruição do codec e cleanup de ciphertext parcial.
- Estado: P2-006 avança a `PRONTO_PARA_RETESTE`; permanece dependente da suite integral/E2E e reauditoria final.

### 2026-07-10 - G7, snapshot consistente e publicação atómica em curso

- CWD: `real_dev/api`.
- Alterações observadas, ainda sem validação: catálogo/índices estáveis por leitura antes/depois; documentos numa transação snapshot única; staging oculta; verificação de envelopes/manifest/checksums; marker de conclusão; rename único para o diretório final; list/latest/prune limitados a snapshots completos.
- Revisão pendente: staging/root devem ficar 0700 e ficheiros 0600; failure injection precisa provar zero final parcial, zero staging órfã, snapshots anteriores preservados e visão consistente sob writes concorrentes.
- Estado: P1-008 continua `EM_IMPLEMENTACAO`; esta entrada não constitui PASS do novo boundary.

### 2026-07-10 - G7, reteste do snapshot consistente e publicação atómica

- CWD: `real_dev/api`.
- Checks: `node --check` no core e nos dois testes; 3/3 com exit code 0.
- Comando: `npm test -- tests/backup-local.core.test.js tests/backup-local.replset.integration.test.js --reporter=dot`; exit code 0, 2 ficheiros e 13/13 testes em 8,17 s.
- Provas: ponto temporal único sob writes concorrentes, metadata pre/post, drift de índice fail-closed, staging 0700, ficheiros 0600, verificação antes de rename, zero parcial/órfão, snapshots prévios preservados e latest/prune limitados a completos.
- Estado: P1-008 avança a `PRONTO_PARA_RETESTE`; suite integral, restore no `verify:all` e reauditoria continuam obrigatórios.

### 2026-07-10 - G5/G6/G7, reteste frontend posterior às correções

- CWD: `real_dev/web`.
- Comandos: `npm run lint`; `npm run test:unit -- --reporter=dot`; `npm run test:contracts`; `npm run build`.
- Resultado inicial: todos exit code 0 — lint sem erros, 7 ficheiros/14 testes unitários, 72/72 contracts e build Vite de 96 módulos com entry 202,23 KiB raw/65,72 KiB gzip. O primeiro unit run expôs dois warnings React Router no fixture `AuthBootstrap`; a evidência verde não os ocultou.
- Correção/reteste: o `MemoryRouter` do fixture recebeu os mesmos dois future flags do runtime; a repetição unitária terminou exit code 0, 7 ficheiros/14 testes e zero warnings.
- Cobertura incremental: copy PT-PT, navegação por role, metadata demo fail-closed, tema/tabela, preservação de conteúdo, duplo submit, `ErrorSummary` por allowlist e novos specs de retry privacy/eliminação terminal. E2E integrado posterior ainda não correu; os findings frontend mantêm os estados abertos do dashboard.

### 2026-07-10 - G1/G3/G4/G7, primeira suite API integral após os últimos patches

- CWD: `real_dev/api`.
- Comando: `npm test`; resultado recebido exit code 1, 81/82 ficheiros e 555/556 testes passaram.
- Falha preservada: `tests/mf8.image-purpose-limit.test.js:111` ainda constrói um mock remoto sem os cinco findings obrigatórios; o provider fail-closed recusou-o como payload inválido. O runtime corrigido comportou-se de acordo com o novo contrato, mas a suite continua formalmente falhada.
- Decisão: atualizar apenas a fixture para um resultado remoto material completo, repetir o focal e depois a suite integral; nenhum finding é promovido por este run.
- Alteração subsequente: apenas o mock de `mf8.image-purpose-limit` recebeu `providerVersion` e os cinco findings válidos; runtime/provider não mudaram. Reteste ainda pendente.

### 2026-07-10 - G4/G7, correção da fixture fail-closed e suite API verde

- CWD: `real_dev/api`.
- Reteste focal: `npm test -- tests/mf8.image-purpose-limit.test.js tests/mf7.external-ai-provider.test.js --reporter=dot`; exit code 0, 2 ficheiros e 45/45 testes.
- Suite integral: `npm test`; exit code 0, 82/82 ficheiros e 556/556 testes em 31,50 s. O script fixou dotenv `/dev/null`, Mongo loopback e IA demo.
- Estados individuais: P1-005, P2-002, P2-005 e P2-015 avançam a `PRONTO_PARA_RETESTE`; nenhum é fechado antes de E2E/reauditoria.
- Dependências: a remoção de `dotenv` altera o grafo; P2-016 é reaberto até instalação limpa/audit/verify no lock atual.

### 2026-07-10 - G1/G7, reinstalação limpa após remover dotenv

- CWD: `real_dev/api`.
- Comando: `npm ci --cache /tmp/orelle-npm-cache`; exit code 0, 219 packages instalados e audit automático zero.
- Pós-ci: `npm ls --depth=0` exit code 0, sem `dotenv`, missing ou invalid; apenas `@img/sharp-wasm32` opcional continua rotulado extraneous. `npm audit --json` exit code 0 com zero vulnerabilidades em todas as severidades.
- Hashes atuais: manifest API `99c6fa59933d3f416750b76c1109772b6d82f74464be45b9546b893235c944cb`; lock API `043baf15c773fbc61859a975a16ce56848f7bf75df80e7b947f6bba087c85b73`.
- Estado: P2-016 continua `EM_IMPLEMENTACAO` até `verify:all` na árvore recém-instalada.

### 2026-07-10 - G0/G1/G7, evidence runtime final propagada à documentação

- CWD: raiz do repositório.
- Alterações: documentos ativos que mantinham backup staging, cancelamento facial e start→stop como pendentes passaram a refletir exclusivamente a evidence atual: backup 10/10+3/3, cancelamento 100/100+2/2 e API 556/556, provider streaming 40/40, startup focal 4/4 e probe imediato exit code 0. Linhas históricas falhadas foram preservadas e recebem um estado posterior explícito.
- Ficheiros principais: README de planificação, plano total e guias MF6-01/MF6-03/MF7-07/MF8 arranque/MF8-03/MF8-04.
- Hardening adicional: o apêndice histórico de MF8-03 deixou de conter URI/pepper/default dotenv copiáveis; valores perigosos foram neutralizados e a explicação corrente reforça injeção exclusiva pelo `dev:local`/runner.
- Estado: P3-003 permanece `EM_IMPLEMENTACAO` até validator, diff, scans semânticos e reauditoria independente no conjunto final.

### 2026-07-10 - G7, primeiro E2E ampliado e colisão legítima do rate limit

- CWD: `real_dev/api`; comando `env ORELLE_E2E_SKIP_WEB_BUILD=true npm run test:e2e`, fora da sandbox e apenas com MongoMemoryReplSet/browsers locais.
- Resultado: exit code 1; 29 PASS, 12 skips intencionais e 1 falha em 42 casos/34,2 s.
- Evidência verde: journey cliente, retry admin com relatório 404, CSRF/sessões, Axe público, 12 viewports, teclado e budgets. A eliminação terminal não executou porque a sexta chamada ao login, proveniente do mesmo IP artificial 127.0.0.1, recebeu 429; o limite 5/15 min funcionou corretamente.
- Correção planeada do harness: E2E confia exclusivamente no proxy loopback e atribui um IP TEST-NET estável por identidade através de `X-Forwarded-For`. API tests continuam a provar que um caller sem proxy confiado não consegue spoofar o header; nenhuma política será relaxada.
- Alteração aplicada, ainda sem reteste: o ambiente E2E confia apenas em `127.0.0.1/32` e `loginAs` usa um endereço TEST-NET distinto por identidade. O limiter permanece 5/15 min; source/manifests de runtime normal não mudaram.
- Reteste focal: três checks sintáticos, E2E core + segurança HTTP/rate limit 23/23 e lint web terminaram exit code 0. O negativo que roda `X-Forwarded-For` sem proxy confiado continua verde; falta a matriz browser integral.
- Estado: P2-014 mantém-se `EM_IMPLEMENTACAO`; a falha permanece no histórico e exige repetição integral.

### 2026-07-10 - G3/G7, segundo E2E ampliado e confirmação visual após eliminação terminal

- CWD: `real_dev/api`; comando `env ORELLE_E2E_SKIP_WEB_BUILD=true npm run test:e2e`, fora da sandbox, com MongoMemoryReplSet e browsers exclusivamente locais.
- Resultado: exit code 1; 29 PASS, 12 skips intencionais e 1 falha em 42 casos/45,7 s. A separação de IP por identidade evitou o 429 anterior sem alterar o limite de login.
- Evidência verde: retry administrativo deixou o relatório fisicamente ausente e observável por 404; a eliminação terminal confirmou o backend, revogou a sessão e redirecionou o browser para `/login`; Axe, teclado, 12 viewports, budgets e os restantes journeys mantiveram-se verdes.
- Falha real preservada: depois do redirect, o login não apresentou o estado acessível com “Conta eliminada”. O teste não encontrou qualquer elemento `role=status`, apesar de a conta já estar terminalmente eliminada. O problema será diagnosticado entre o estado de navegação, o bootstrap de auth e a renderização do feedback; não se relaxará a asserção nem se repetirá a eliminação como se a confirmação visual fosse dispensável.
- Estado: P2-014 e P3-004 mantêm-se `EM_IMPLEMENTACAO`; P1-004 permanece `PRONTO_PARA_RETESTE` porque a garantia backend/terminal passou, mas a experiência completa só poderá validar após o reteste browser.

### 2026-07-10 - G3/G5, correção do aviso após eliminação terminal

- Causa raiz: `forgetSession()` limpava o utilizador ainda na rota protegida; `RequireRole` podia substituir a navegação por outro redirect sem o aviso. Se o estado explícito chegasse depois ao mesmo `/login`, o initializer de `useState` já não era repetido.
- Alteração: o contexto de autenticação guarda agora um aviso efémero juntamente com `forgetSession(data.message)` e expõe consumo explícito; o login usa esse canal como redundância ao route state, reage também a atualizações tardias da localização e limpa o aviso depois de o materializar. Não foi usado `localStorage`, `sessionStorage`, cookie legível ou parâmetro sensível.
- Teste acrescentado: o componente deve mostrar/consumir o aviso do contexto e reagir a route state recebido depois do mount.
- Validação local: `npm run lint` e `npm run test:unit -- --reporter=dot`, CWD `real_dev/web`, terminaram ambos com exit code 0; ESLint não emitiu erros/warnings e Vitest passou 8 ficheiros/16 testes. O E2E completo continua obrigatório antes de avançar os findings.
- Build pós-correção: `npm run build`, CWD `real_dev/web`, terminou exit code 0; Vite 8.1.4 transformou 96 módulos, manteve code splitting e gerou entry de 202,40 KiB raw/65,75 KiB gzip. A matriz browser continua pendente.
- Estado: P2-014 e P3-004 mantêm-se `EM_IMPLEMENTACAO`; P1-004 continua `PRONTO_PARA_RETESTE` até o journey completo provar confirmação visual, sessão 401 e login posterior recusado.

### 2026-07-10 - G3/G6/G7, E2E ampliado verde após corrigir o aviso terminal

- CWD: `real_dev/api`; comando `env ORELLE_E2E_SKIP_WEB_BUILD=true npm run test:e2e`, fora da sandbox, depois do build atual em `real_dev/web`.
- Resultado: exit code 0; 30 PASS e 12 skips intencionais em 42 casos/35,7 s. O orquestrador usou `orelle_e2e_test`, aplicou nove migrações, criou 5 utilizadores/3 produtos/3 imagens e executou teardown completo.
- Correção confirmada: a conta exclusiva foi eliminada, o login mostrou “Conta eliminada”, `/api/auth/me` devolveu 401 e a tentativa de voltar a autenticar a conta eliminada recebeu 401 com erro acessível. O retry administrativo continuou a provar o relatório fisicamente ausente por 404.
- Regressões: checkout e pagamento exclusivamente simulados, consulta/revisão, IA demo, roles/admin, CSRF, Axe público, teclado, viewports 320/375/768/1280 e budgets permaneceram verdes nos projetos configurados. Os 12 skips correspondem deliberadamente a journeys mutáveis executados uma vez em Chromium; Firefox/WebKit mantêm as provas públicas, responsive, teclado e performance.
- Estados: P1-004 avança individualmente a `VALIDADO`; P2-014 e P3-004 avançam a `PRONTO_PARA_RETESTE` até `verify:all` e reauditoria final.

### 2026-07-10 - G7, primeiro `verify:all` depois do aviso terminal

- CWD: `real_dev/api`; comando `npm run verify:all`, fora da sandbox.
- Resultado: exit code 1. Sintaxe passou 397 ficheiros; lint passou; API passou 82 ficheiros/556 testes; frontend comportamental passou 8 ficheiros/16 testes. O gate parou nos contracts web com 71/72.
- Falha preservada: `privacyManagement.test.mjs` ainda exigia a forma histórica `function forgetSession()`, mas a correção tornou o callback estável através de `useCallback((notice = "") => ...)`. A prova estática do fluxo ficou desatualizada; não foi detetado defeito funcional e o E2E ampliado anterior continua historicamente verde.
- Decisão: P2-014 regressa a `EM_IMPLEMENTACAO` antes de alterar apenas o contrato para exigir o callback, o aviso efémero e o consumo no login. Depois serão repetidos o focal e todo o `verify:all`; os gates posteriores não chegaram a executar neste run.
- Alteração do contrato: o teste deixou de procurar a antiga declaração de função e exige agora `useCallback`, `postSessionNotice`, passagem de `data.message`, consumo no login e fallback de route state. O comentário do próprio fixture foi reconciliado com a suite Vitest/jsdom já existente. Reteste ainda pendente; nenhum PASS é inferido do patch.
- Reteste focal: `npm run test:contracts` e `npm run lint`, CWD `real_dev/web`, terminaram exit code 0; 72/72 contracts e ESLint sem erros/warnings. P2-014 permanece `EM_IMPLEMENTACAO` até repetir todos os gates posteriores no `verify:all`.

### 2026-07-10 - G1/G3/G4/G5/G6/G7, `verify:all` integral verde no estado final candidato

- CWD: `real_dev/api`; comando `npm run verify:all`, fora da sandbox; exit code 0.
- Resultado: 13/13 gates passaram no mesmo estado. Syntax verificou 397 ficheiros; lint terminou sem erros/warnings; API passou 82 ficheiros/556 testes; frontend passou 8 ficheiros/16 testes Vitest e 72/72 contracts; build Vite transformou 96 módulos e gerou entry de 65.020 bytes gzip.
- E2E: 30 PASS e 12 skips intencionais em 42 casos/35,3 s, com `orelle_e2e_test`, nove migrações, cinco utilizadores, três produtos, três imagens e teardown. A matriz repetiu o aviso pós-eliminação, sessão/login terminal, retry/404, pagamento simulado, IA demo, roles, CSRF, Axe, teclado, responsive e budgets.
- Performance/segurança/docs: 25 produtos/150 variantes/8.018.679 bytes, 177 imagens dentro do limite, audits API/web com zero vulnerabilidades e validator `overall_pass=true` com 44 RF, 31 RNF e 74 matriz/backlog/guias.
- Estados individuais: P2-014, P2-016 e P3-004 avançam a `VALIDADO`. Os restantes findings serão avaliados individualmente depois dos três pareceres read-only; nenhum estado global é fechado apenas por este comando.
- Higiene/scope pós-gate: hashes atuais são API manifest `99c6fa59…44cb`/lock `043baf15…b73` e web manifest `70d0dcf7…6a42`/lock `f26682d5…bac2`; `real_dev/` continua ignorado por `.gitignore:2` e `apps/` não apresentou alterações. Apenas metadata confirmou o `.env` existente em `0644`; o conteúdo não foi aberto nem alterado e P3-005 continua bloqueado externamente.

### 2026-07-10 - G6/G7, reauditoria encontra dois smokes publicados fora do agregador

- CWD: `real_dev/web`; comandos `npm run smoke:mf8-consultation` e `npm run smoke:mf6-images`.
- Resultado: ambos terminaram exit code 1. O primeiro ainda exige o literal `role="alert"` apesar de o runtime usar o `ErrorSummary` acessível e já testado; o segundo exige uma chamada de detalhe sem opções apesar de o runtime propagar corretamente `{ signal }` para cancelamento.
- Classificação: drift dos próprios smokes, não regressão funcional demonstrada — contracts 72/72, E2E 30 PASS e os testes de `ErrorSummary`/abort estão verdes. Ainda assim, comandos publicados a falhar impedem fecho e mostram uma lacuna do `verify:all`.
- Decisão: P2-014 e P3-004 regressam a `EM_IMPLEMENTACAO` antes de alinhar as asserções ao contrato atual e incluir todos os scripts `smoke:*` no gate integral. As falhas ficam preservadas e serão repetidas focalmente e no agregador.
- Alterações: o smoke guided valida agora o `ErrorSummary` real, respetivo ID estável e `role="alert"` no componente comum; o smoke de imagens exige o endpoint de detalhe com `{ signal }`, preservando a prova de cancelamento. O `verify:all` enumera dinamicamente todos os scripts `smoke:*`, executa-os depois do build e mantém o page budget no gate próprio; um teste puro impede novos smokes órfãos. Checks/testes ainda pendentes, pelo que nenhum estado avança.
- Reteste focal: checks sintáticos dos dois smokes e do agregador, os dois comandos anteriormente falhados e `e2e-runtime.core` terminaram exit code 0; os smokes guided/imagens ficaram verdes e o teste do plano passou 14/14. Falta executar todos os smokes publicados e repetir o gate integral ampliado.
- Execução de todos os scripts `smoke:*`: 12/13 terminaram exit code 0; `smoke:mf2` terminou exit code 1 porque ainda exige a apresentação direta `recommendation.reasonCodes.join`, substituída no runtime por explicações humanas/máquina resolvidas e testadas. A falha adicional fica preservada; P2-014/P3-004 continuam `EM_IMPLEMENTACAO` até alinhar este terceiro gate e repetir a lista completa.
- Alteração MF2: o smoke passou a exigir `reasonCodes`, labels pela allowlist `REASON_LABELS`, fallback humano e junção após o mapping, em vez do acesso direto antigo. A introdução do script deixou também de alegar ausência de Vitest/Playwright. Reteste ainda pendente.
- Reteste completo dos comandos publicados: os 13 scripts `smoke:*` terminaram exit code 0 no mesmo build. P2-014/P3-004 permanecem `EM_IMPLEMENTACAO` apenas até o `verify:all` ampliado executar automaticamente esta lista e a reauditoria final não encontrar novo drift.

### 2026-07-10 - G7, reauditoria reproduz lease expirado com migração duplicada

- CWD: `real_dev/api`; prova independente num `MongoMemoryReplSet` efémero, sem `.env` ou URI remota.
- Resultado: com lease de 1 s e DML de 1,8 s, dois `runMigrations` concorrentes terminaram fulfilled; a DML correu duas vezes e `schema_migrations` conservou dois registos da mesma versão.
- Causa: o lease era adquirido apenas no início, sem heartbeat/asserção contínua de ownership, e a coleção não tinha índice único por `version`. A suite existente não exercia expiração durante uma migração em curso.
- Estado: P2-015 regressa a `EM_IMPLEMENTACAO`; serão exigidos renovação de lease, falha fechada ao perder ownership, unicidade na versão e teste concorrente determinístico antes da suite integral.
- Alteração inicial: o runner cria índice único por `version`, recusa registos duplicados, renova o lease a cada terço do TTL e verifica ownership antes/depois de DML, finalize, validate e imediatamente antes do registo. O relógio do lease foi separado do `now` determinístico das migrations. Checks e reprodução concorrente ainda pendentes; nenhum PASS é inferido do patch.
- Prova acrescentada: uma migração transacional demora 1,8 s sob lease de 1 s; o segundo runner arranca aos 1,1 s e deve falhar com lock ocupado, enquanto DML/registo ficam exatamente uma vez e o índice de versão permanece unique. Execução ainda pendente.
- Reteste focal: checks sintáticos do runner/fixture e `npm test -- tests/migrations.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, fora da sandbox, terminaram exit code 0; 7/7 testes em 6,88 s. O caso adverso confirmou um runner fulfilled, o concorrente recusado, `probeCount=1`, um único registo e índice `version_1_unique`. Suite integral/reauditoria continuam pendentes.

### 2026-07-10 - G1/G3/G4/G7, parecer backend independente final

- Âmbito read-only: API, testes e manifests, sem `.env`, Mongo remota, provider externo, rede ou edição pelo auditor.
- Veredicto: `FAIL` sem P0/P1 novos e com quatro P2 materiais. Além do lease duplicado já reproduzido: (1) geração/pagamento do relatório não propagam `req.signal`; (2) redirects HTTP do provider real não são recusados após validar o URL inicial; (3) decisão de privacidade confirma antes do audit log autónomo, podendo ficar aplicada quando o catch alega falha.
- Evidência positiva independente: syntax 397 ficheiros, suite API 82/82 ficheiros e 557/557 testes, audit offline zero. Pagamentos simulados, write barriers/cifra 009, IA fail-closed sem redirect, guided/review/fairness, sessões/CSRF, `dev:local`, backup, uploads, PDF/CSV e dependências foram revalidados sem novo finding.
- Estados: P1-005, P2-005 e P2-006 regressam a `EM_IMPLEMENTACAO`; P2-015 já estava reaberto pela reprodução concorrente. Cada correção exige negativo material antes da suite/gate integral.

### 2026-07-10 - G5/G6/G7, parecer frontend independente final

- Âmbito read-only: runtime, testes e configuração de `real_dev/web`, sem editar implementação, documentação, `apps/` ou `.env`.
- Veredicto: `FAIL` sem P0/P1 novos e com seis grupos P2 materiais. Foram confirmados: logout rejeitado sem feedback e ausência de ação visível `logout-all`; wizard submetido retomado num estado morto e ações start/resume capazes de descartar respostas dirty; resultados/históricos ocultados depois de refresh ou mutation falhada; duplo submit no mesmo tick nos fluxos destrutivos; categorias admin com markup/estado/desassociação frágeis; e tabela/cobertura responsive autenticada insuficientes.
- Acabamento P3: persistem algumas strings sem diacríticos, roles/status técnicos na administração e um aviso técnico de LCP/CLS sem valor de produto.
- Evidência positiva preservada: 16/16 unitários, 72/72 contracts, 30 E2E PASS/12 skips intencionais e os três smokes antes desatualizados já verdes. Estes gates não cobrem os comportamentos acima e, por isso, não são usados para os fechar.
- Estados: P1-006, P1-007, P2-010, P2-011, P2-012, P2-014 e P3-004 mantêm-se `EM_IMPLEMENTACAO`. A correção foi atribuída com testes de erro/retry, dirty-state, latch síncrono, Axe/overflow autenticado e pelo menos um percurso autenticado independente por engine.

### 2026-07-10 - G0/G7, correção semântica final da documentação

- Handoff docs-only recebido, sem edição de master report, `apps/` ou `real_dev`: os oito grupos da última reauditoria foram reconciliados — migrations 005/008/009, estado MF8-03, `dev`/`dev:local` scrubbed, defaults exclusivamente development, guia MF6-04, decisão visual `ACEITE_RISCO`, estado do plano total e os dois pagamentos exclusivamente simulados.
- Clarificação adicional: RF33 distingue a desativação lógica administrativa de `DELETE /api/admin/users/:id` da eliminação terminal autenticada em `DELETE /api/me/account`; nenhuma reativação de conta terminal é ensinada.
- Evidência recebida: validator exit code 0 com `overall_pass=true` e 44 RF/31 RNF/74 BK; `git diff --check` exit code 0; fences e scans stale/paths privados sem ocorrências; generator de snippets passou `node --check` e os snippets JSX MF6-04 passaram ESLint.
- Estado: P3-003 mantém-se `EM_IMPLEMENTACAO` até inventário/inspeção coordenada e nova reauditoria semântica independente. A comparação manual/Figma continua apenas `ACEITE_RISCO`, nunca aprovação visual.
- Reteste coordenado: `bash scripts/validate-planificacao.sh` e `git diff --check -- README.md docs`, CWD raiz, terminaram exit code 0; `overall_pass=true`, 44 RF/31 RNF/74 matriz/backlog/guias e zero issues/whitespace. O scan dirigido só devolveu proibições explícitas, preservação dos checksums 001–008 antes da 009 e linhas históricas imediatamente precedidas pelo estado posterior; não encontrou contrato financeiro ativo nem alegação visual aprovada.
- Reauditoria independente posterior: `FAIL` semântico apesar dos gates estruturais verdes. Permanecem afirmações antigas sobre `dev`, defaults, “payment redirects”, JPEG, snippets provider sem `redirect:"error"`, campo `providerModelVersion`, oito notas/changelogs de comparação manual pendente, PDF histórico ainda aberto, ação admin “Eliminar” e contagens rígidas desatualizadas. Foi também confirmada a omissão da migration 006 no boundary legítimo de leitura legacy.
- Estado: P3-003 permanece `EM_IMPLEMENTACAO`; cada grupo será corrigido por linha e a mesma auditoria independente será repetida. O risco visual continua `ACEITE_RISCO` e não `pendente`/aprovado.

### 2026-07-10 - G1/G4, handoff de redirects e cancelamento de relatório

- Alterações recebidas, ainda sob revalidação coordenada: providers reais recusam redirects HTTP em vez de reenviar o payload facial; geração e pagamento simulado do relatório recebem `req.signal`, verificam cancelamento nos boundaries transacionais e propagam a sessão até às recomendações.
- Evidência recebida: syntax gate sobre 397 ficheiros e três ficheiros focais/63 testes com exit code 0. Inclui dois negativos 30x para `external`/OpenAI e cinco failure injections em replica set: geração após report/recomendações/unlock e pagamento após unlock/voucher, sempre com rollback e retry.
- Estado: P1-005 e P2-006 continuam `EM_IMPLEMENTACAO` até inspeção coordenada, suite API integral e reauditoria. A execução integral foi iniciada pelo subagente e ainda não constitui evidence recebida nesta entrada.
- Handoff final recebido: controllers propagam `req.signal`; criação do relatório, recomendações e unlock reutilizam uma única `ClientSession`; há barriers antes/depois das escritas e antes do commit; o pagamento verifica abort depois de unlock/voucher; ambos os providers usam `redirect:"error"` e recusam respostas redirecionadas.
- Evidência recebida: syntax 397 ficheiros; focais finais 2 ficheiros/52 testes; suite API 82 ficheiros/566 testes, todos exit code 0. O conjunto acrescenta três aborts de geração, dois de pagamento, dois 302 mockados e um 307 real loopback que observou um pedido no host autorizado e zero pedidos/bytes no destino.
- Estado: P1-005 e P2-006 avançam a `PRONTO_PARA_RETESTE`; o coordenador ainda repetirá os focais/suite no estado combinado com a atomicidade de privacidade antes da validação independente.

### 2026-07-10 - G3/G7, decisão de privacidade e audit na mesma unidade atómica

- Alteração ainda sem validação: `recordBiometricAccess` aceita uma `ClientSession` e executa contagem/criação dentro dela. Rejeição e conclusão de aprovação/retry passam a persistir o evento `allowed` na mesma transação que altera o pedido e liberta a barreira; o wrapper deixou de criar esse evento autonomamente depois do commit.
- Comportamento esperado: se o append-only audit falhar, uma rejeição faz rollback para `pending`; uma aprovação não pode ficar `completed`, passa a `failed` recuperável depois do rollback da finalização e um retry pode concluir. O evento `denied` posterior continua sanitizado e corresponde agora a uma decisão efetivamente não confirmada.
- Estado: P2-005 mantém-se `EM_IMPLEMENTACAO`. Checks, failure injection de rejeição/aprovação, rollback/retry e regressão dos logs administrativos continuam obrigatórios; nenhum PASS é inferido do patch.
- Provas acrescentadas, ainda sem execução: falha injetada no audit da aprovação exige estado `failed`, zero evento `allowed`, um `denied` e retry completo; falha no audit da rejeição exige rollback para `pending` e retry posterior; concorrência/replay passam também a contar exatamente os eventos `allowed` esperados.
- Reteste focal: três `node --check` e `npm test -- tests/privacy-requests.replset.integration.test.js tests/mf5.biometric-audit.test.js --reporter=dot`, CWD `real_dev/api`, terminaram exit code 0; dois ficheiros e 11/11 testes em 2,71 s. Aprovação/rejeição fazem rollback quando o audit falha, nunca conservam `allowed` sem decisão, retry conclui e a regressão de listagem/alertas minimizados permanece verde.
- Estado: P2-005 avança apenas a `PRONTO_PARA_RETESTE`; suite API integral, E2E e reauditoria independente continuam obrigatórios.
- Primeira suite API combinada: `npm test`, CWD `real_dev/api`, terminou exit code 1; 81/82 ficheiros e 567/568 testes passaram. `face-photo-replacement` chamava diretamente o service de aprovação com um ator fixture sem `role`; o novo audit atómico recusou corretamente o documento incompleto antes de concluir. A falha fica preservada e P2-005 regressa a `EM_IMPLEMENTACAO`; o fixture será alinhado ao contrato real de revisor autenticado e a suite repetida.
- Correção exclusiva do fixture: o caller direto da corrida upload→privacy fornece agora `id` e role `administrador`, como o controller autenticado real. O service/audit e os critérios de eliminação física não foram relaxados; reteste focal e integral continuam pendentes.
- Reteste focal combinado: `npm test -- tests/face-photo-replacement.replset.integration.test.js tests/privacy-requests.replset.integration.test.js tests/mf5.biometric-audit.test.js --reporter=dot`, CWD `real_dev/api`, terminou exit code 0; três ficheiros e 16/16 testes em 5,74 s. Barreiras/upload, decisão+audit, rollback/retry e logs minimizados ficaram verdes; suite integral ainda pendente.
- Segunda suite API combinada: `npm test`, CWD `real_dev/api`, terminou exit code 0; 82/82 ficheiros e 568/568 testes em 31,18 s. O mesmo estado inclui redirects 30x recusados, abort/rollback de relatório, audit atómico, lease heartbeat/índice único, nove migrações, write barriers, cifra, pagamentos simulados, backup e todas as regressões API.
- Estados: P2-005 regressa a `PRONTO_PARA_RETESTE`; P1-005, P2-006 e P2-015 mantêm/avançam para `PRONTO_PARA_RETESTE`. A reauditoria read-only posterior continua obrigatória antes de `VALIDADO`.

### 2026-07-10 - G1/G7, scheduler recuperável ligado ao `dev:local`

- Alteração ainda sem validação: `run-local-dev.mjs` captura apenas `ORELLE_LOCAL_BACKUP_ENABLED`, `ORELLE_BACKUP_KEY` e `ORELLE_BACKUP_ROOT` antes de descartar o ambiente herdado; o opt-in exige literalmente `true`, valida a chave de 32 bytes e a raiz privada, mas nunca copia a chave para o novo `process.env` ou para output.
- O scheduler chama diretamente `createBackupSnapshot` e retenção sete sobre a base efémera já ligada; impede jobs sobrepostos, mantém o timer `unref`, aguarda job ativo e limpa-o antes de desligar HTTP/Mongo. Falha de configuração durante startup fecha também a API já iniciada.
- Estados: P1-008/P2-013 mantêm-se `EM_IMPLEMENTACAO`; checks, positivos/negativos de ativação, cleanup e probe real continuam obrigatórios.
- Provas preparadas, ainda sem execução: scheduler inativo sem opt-in; flag ambígua/chave ausente recusados; intervalo diário com latch anti-overlap e `stop` que limpa/aguarda; integração `dev:local` que chama snapshot+retenção com DB atual, chave em `Buffer` e raiz privada, sem copiar segredo para o ambiente scrubbed.
- Reteste focal: quatro `node --check` e `npm test -- tests/backup-local.core.test.js tests/local-dev-runtime.test.js tests/local-dev-runtime.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, terminaram exit code 0; três ficheiros e 18/18 testes em 3,33 s. Negativos, latch/cleanup, ligação snapshot+retenção e readiness/rollback real ficaram verdes; falta um probe do orquestrador completo com opt-in antes de avançar estados.
- Primeiro probe completo com opt-in: CWD `real_dev/api`, terminou exit code 1 antes do runtime por `listen EPERM 127.0.0.1` na sandbox. É falha ambiental preservada, não defeito de scheduler; o mesmo comando será repetido fora da sandbox sem escrever snapshots reais (snapshot/prune são injetados).
- Reteste fora da sandbox: o mesmo probe terminou exit code 0. Arrancou API+`orelle-local-rs`, confirmou scheduler ativo, uma chamada de snapshot, uma de retenção, limpeza do timer e shutdown; nenhuma chave/URI/path privado foi impresso e os jobs injetados não escreveram snapshots.
- Reauditoria imediata encontrou uma regressão de scope: `npm run dev` e `dev:local` usam o mesmo runner e este identifica sempre o scheduler como `dev:local`; logo o flag também o ativaria sob `dev --watch`. P1-008/P2-013 permanecem `EM_IMPLEMENTACAO`; o manifest/runner terão modo explícito e um negativo `dev + opt-in` antes de novo probe.
- Correção ainda sem reteste: o manifest passa `--runtime-mode=dev` ou `--runtime-mode=dev:local`; o runner exige exatamente um dos modos e o backup resolve para inativo antes de ler/validar qualquer chave quando o modo é `dev`. Foi acrescentado negativo `dev + opt-in` sem timer/leitura da chave; o positivo conserva-se apenas em `dev:local`.
- Reteste focal pós-modo: dois `node --check` e o conjunto backup/local runtime terminaram exit code 0; três ficheiros e 19/19 testes em 8,71 s. `dev + opt-in` ficou inativo sem validar a chave, `dev:local` ligou snapshot+retenção e os contratos de readiness/rollback mantiveram-se verdes. Falta repetir o probe do orquestrador final.
- Primeiro probe combinado dos dois modos no mesmo processo: o ciclo `dev` arrancou/parou, mas o segundo arranque `dev:local` terminou exit code 1 porque os módulos ESM de configuração mantiveram em cache a URI efémera já encerrada. Os scripts npm reais criam um processo novo por modo; este harness sequencial não representa esse lifecycle e não é usado como PASS. Os modos serão provados em processos separados.
- Probes finais em processos separados, CWD `real_dev/api`, fora da sandbox: ambos terminaram exit code 0. `dev` arrancou/encerrou com opt-in+chave inválida sem ler a chave e reportou scheduler inativo; `dev:local` reportou scheduler ativo, executou exatamente um snapshot/retention injetados e limpou o timer antes do shutdown. Nenhum snapshot, URI ou chave foi impresso.
- Estados: P1-008/P2-013 avançam a `PRONTO_PARA_RETESTE`; suite integral/`verify:all`, documentação do novo contrato e reauditoria continuam obrigatórias.

### 2026-07-10 - G1/G3/G5, separação da desativação administrativa

- Alteração ainda sem validação: o DELETE admin legado deixa de gravar `deleted`, alterar email ou preencher `deletedAt`; passa a uma suspensão reversível que preserva credenciais/dados. Apenas a eliminação própria com password+`ELIMINAR` pode produzir o tombstone terminal.
- Em runtime com BD, atualização da conta e revogação de todas as `AuthSession`/CSRF ocorrem na mesma transação; a suspensão por PATCH usa a mesma unidade. Reativação mantém sessões antigas revogadas. Um alvo já terminal devolve 409 e nunca é promovido.
- Estados: P1-004/P2-005/P2-007 mantêm-se `EM_IMPLEMENTACAO`; checks, integração replica-set, rollback de revogação e regressões HTTP/UI continuam obrigatórios.
- Provas acrescentadas, ainda sem execução: falha injetada em `AuthSession.updateMany` deve reverter a suspensão; retry deve preservar email/password, deixar `deletedAt=null` e revogar duas sessões/CSRF; reativação não pode ressuscitar cookies; conta terminal deve devolver 409 tanto na desativação como na reativação. O contrato HTTP MF4 passa a exigir `suspended`, não `deleted`.
- Primeiro reteste: checks sintáticos passaram; o conjunto terminou exit code 1 com 2/3 ficheiros e 21/22 testes verdes. A integração replica-set e auth passaram, mas o mock MF4 substitui o módulo `user.model` sem exportar o novo `ACCOUNT_STATUSES` importado pelo service, originando 500 antes da query. A falha fica preservada; o fixture será completado sem alterar runtime.
- Correção exclusiva do fixture: o mock de `user.model` exporta agora os três estados canónicos usados pelo service real. Nenhuma exceção, filtro ou transação de runtime foi relaxada; repetição focal pendente.
- Segundo reteste: `npm test -- tests/mf4.integration.test.js tests/admin-account-deactivation.replset.integration.test.js tests/auth.session.test.js --reporter=dot`, CWD `real_dev/api`, terminou exit code 0; três ficheiros e 22/22 testes em 2,35 s. Rollback da revogação, retry, duas sessões/CSRF revogadas, reativação sem cookies antigos, 409 terminal e contrato HTTP `suspended` ficaram verdes.
- Estados: P1-004/P2-005/P2-007 avançam a `PRONTO_PARA_RETESTE`; suite integral, E2E/UI e reauditoria posterior continuam obrigatórios.

### 2026-07-10 - G1/G3/G4/G7, parecer backend independente posterior às correções focais

- Âmbito read-only: redirects dos providers reais, cancelamento/rollback do relatório, decisão de privacidade com audit atómico, lease/heartbeat das migrações e equalização do login; sem `.env`, Mongo remota, providers externos, rede ou edição pelo auditor.
- Resultado: `PASS` nos contratos pedidos, sem P0/P1/P2 residual conhecido nesse recorte. Os focais passaram 4 ficheiros/67 testes, auth 3/3 e a suite API então corrente passou 82 ficheiros/573 testes.
- Riscos residuais declarados: cancelamento continua cooperativo nos pontos expostos pelas bibliotecas; filesystem usa saga/outbox; DDL de migração continua retomável, não atomicamente ligada ao registo; equalização temporal não constitui uma garantia matemática de tempo constante.
- Limite: a separação administrativa foi alterada depois deste parecer e acrescentou um novo ficheiro de integração; por isso, o parecer não substitui a suite integral posterior nem fecha P1-004/P2-005/P2-007.

### 2026-07-10 - G1/G3/G5, primeira suite integral após separar a desativação administrativa

- CWD: `real_dev/api`; comando `npm test`, com dotenv `/dev/null`, Mongo loopback e IA demo.
- Resultado: exit code 1; 81/83 ficheiros e 573/575 testes passaram. `mf0.flow` e `roles` receberam 500 ao alterar a role administrativa, enquanto a integração replica-set nova e os focais anteriores tinham ficado verdes.
- Decisão: a falha fica preservada e P1-004/P2-005/P2-007 mantêm-se `PRONTO_PARA_RETESTE`, sem promoção. Será diagnosticada a compatibilidade dos fixtures HTTP com a nova unidade transacional, corrigido apenas o contrato efetivamente desatualizado ou o defeito de runtime demonstrado, e repetida a suite integral.
- Causa confirmada: os mocks de `user.model` em `mf0.flow` e `roles` substituíam o módulo completo sem exportar `ACCOUNT_STATUSES`; o novo `toSafeUser` tentava por isso ler `ACTIVE` de um valor ausente depois da mutação de role já ter sido simulada. Não foi encontrado defeito na atualização de role do runtime.
- Correção aplicada, ainda sem reteste: os dois fixtures exportam os três estados canónicos, tal como o mock MF4 já corrigido. P1-004/P2-005/P2-007 regressaram a `EM_IMPLEMENTACAO` antes desta edição; runtime, transação e DTO não foram relaxados.
- Reteste focal: `npm test -- tests/mf0.flow.test.js tests/roles.test.js --reporter=dot`, CWD `real_dev/api`, terminou exit code 0; dois ficheiros e 10/10 testes. A alteração de role voltou a 200 e os negativos 400/401/403/404 permaneceram verdes. A suite integral ainda é obrigatória antes de recuperar `PRONTO_PARA_RETESTE`.
- Segunda suite integral: `npm test`, CWD `real_dev/api`, terminou exit code 0; 83/83 ficheiros e 575/575 testes em 31,29 s. O estado combinado inclui a separação admin, revogação transacional, redirects/abort, audit atómico, lease heartbeat, 009 e restantes regressões API. P1-004/P2-005/P2-007 regressam individualmente a `PRONTO_PARA_RETESTE`; E2E/reauditoria posterior continuam obrigatórios.

### 2026-07-10 - G3/G7, boundary migration-only da leitura legacy

- Causa: o helper `decryptJsonForMigration` era legitimamente usado por 005/006/008/009, mas o seu JSDoc mencionava apenas 005/008 e a fachada genérica de services voltava a exportá-lo apesar de nenhum service de runtime o consumir.
- Alteração: o comentário enumera agora exatamente 005/006/008/009 e mantém a recifra imediata em v2; a fachada `encryption.service` deixou de exportar o helper migration-only. Models/services continuam limitados a envelopes contextuais v2 e as migrations importam diretamente o utilitário explícito.
- Estado: P2-002 mantém-se `EM_IMPLEMENTACAO` até checks, testes de cifra/migrações e reconciliação documental independente; a alteração não modifica ciphertext, checksum ou source de migration.
- Reteste runtime: dois `node --check` terminaram exit code 0; quatro ficheiros de cifra/migrações passaram 10/10 testes num replica set efémero. O scan de `src/services|models|controllers` terminou exit code 1 esperado e zero imports/exports do helper legacy. P2-002 mantém-se `EM_IMPLEMENTACAO` apenas até os documentos ativos refletirem 005/006/008/009 e a reauditoria semântica confirmar o boundary.

### 2026-07-10 - G0/G7, controlo de scope na retoma final

- CWD: raiz do repositório; `git status --short`, `git diff --name-only -- apps` e `git check-ignore -v` foram executados sem alterar ficheiros.
- Resultado: `apps/` continua sem qualquer diff; `real_dev/` e ambos os manifests permanecem ignorados exclusivamente por `.gitignore:2`. O estado versionável contém apenas a reconciliação documental esperada e o master report novo; nenhum commit foi criado.

### 2026-07-10 - G1/G3/G4/G7, reauditoria backend independente no estado combinado

- Âmbito read-only: desativação/revogação/eliminação terminal, redirects, cancelamento/rollback do relatório, decisão+audit de privacidade, lease/heartbeat, boundary migration-only, scheduler e equalização do login; sem `.env`, rede remota, `apps/` ou edição pelo auditor.
- Resultado: `PASS` sem P0/P1/P2. Onze ficheiros focais passaram 102/102 testes, a suite API integral passou 83/83 ficheiros e 575/575 testes, e syntax verificou 398 ficheiros. Apenas MongoDB efémero e listeners loopback foram usados.
- Observação P3 reaberta: `updateUserRole` ainda usava `findByIdAndUpdate` sem excluir `accountStatus=deleted`; o tombstone permanecia inativo, mas aceitava uma alteração irrelevante de metadata. P1-004 regressa preventivamente a `EM_IMPLEMENTACAO`: a role de uma conta terminal será recusada com 409 e um negativo HTTP impedirá regressão.
- Alteração aplicada, ainda sem validação: a mutação de role usa `findOneAndUpdate` com filtro terminal, distingue 404 de tombstone 409 e não toca no documento eliminado. Fixtures MF0/roles foram alinhados e a integração de desativação exige agora que role, email e estado terminal permaneçam intactos. Checks, focal, replica set e suite integral continuam obrigatórios.
- Reteste focal: quatro checks sintáticos e `npm test -- tests/mf0.flow.test.js tests/roles.test.js tests/admin-account-deactivation.replset.integration.test.js --reporter=dot`, CWD `real_dev/api`, terminaram exit code 0; três ficheiros e 13/13 testes. O endpoint devolve agora 409 para tombstone, a integração confirma role `cliente` intacta e os positivos/negativos 200/400/401/403/404 permanecem verdes. P1-004 regressa a `PRONTO_PARA_RETESTE`; a bateria integral final e uma revisão focal posterior continuam obrigatórias.
- Suite API posterior: `npm test`, CWD `real_dev/api`, terminou exit code 0; 83/83 ficheiros e 576/576 testes em 31,91 s. A proteção terminal acrescentou um teste sem regressão nos restantes contratos; P1-004 mantém-se `PRONTO_PARA_RETESTE` apenas até a revisão independente focal e o E2E/`verify:all` final.
- Reauditoria focal independente: `PASS`, sem novo finding. O auditor confirmou CAS com exclusão de `deleted`, distinção 404/409 e preservação real de `role="cliente"`; repetiu syntax em 398 ficheiros e o focal MF0/roles/admin 13/13. P1-004 avança individualmente a `VALIDADO`; uma alteração posterior do contrato ou o gate integrado pode reabri-lo.

### 2026-07-10 - G4/G5/G6/G7, handoff frontend dos findings finais

- Alterações: logout/logout-all com feedback acessível e latch; wizard redireciona sessões submetidas e protege respostas dirty; seis páginas assíncronas preservam dados perante refresh/mutation falhados e propagam cancelamento; fluxos destrutivos de privacidade usam latches síncronos; categorias permitem desassociar tudo e separam mutation/refresh; administração usa labels humanas e `Desativar conta` reversível; tabela responsive, copy PT-PT e aviso técnico falso de performance foram removidos.
- Testes acrescentados/alinhados: quatro suites unitárias focais, seis contracts, quatro specs E2E e três smokes. O E2E inclui um percurso autenticado/Axe/overflow por engine, duplo clique do wizard e da privacidade, falhas/retry e administração sem IDs técnicos.
- Evidência do handoff: lint exit code 0, Vitest 22/22 e contracts 74/74. Build anterior ao último alinhamento administrativo passou com 95 módulos; G1/G6 e os 13 smokes estavam verdes. O proxy dentro da sandbox falhou apenas com `listen EPERM` e a tentativa externa foi interrompida, logo permanece sem PASS atual. Build, budgets, proxy externo e E2E no estado final combinado serão repetidos pelo coordenador.
- Estados: P1-006/P1-007/P1-011, P2-010/P2-011/P2-012/P2-014 e P3-004 avançam individualmente a `PRONTO_PARA_RETESTE`; nenhum é validado apenas pelo handoff.
- Reteste coordenado no estado pós-AdminUsers: `npm run lint`, `npm test` e `npm run build`, CWD `real_dev/web`, terminaram exit code 0. ESLint não emitiu warnings; Vitest passou 10 ficheiros/22 testes; contracts passaram 74/74; Vite 8.1.4 transformou 95 módulos com entry de 66,39 KiB gzip e chunks por rota. Budgets, smokes, proxy e E2E continuam pendentes desta passagem.
- Gates estáticos pós-build: `check:g1-config`, `check:g6-image-budgets` e os 13 scripts `smoke:*` terminaram todos exit code 0. Foram confirmados 56 artefactos sem loopback, 25 produtos/150 variantes/8.018.679 bytes, JS inicial 65.632 bytes gzip, 177 imagens dentro do limite, Web Vitals, tema, responsive images, pagamento simulado, privacy, IA/guided e compatibilidade estática sobre 76 ficheiros. Proxy HTTP e E2E material continuam pendentes.
- Proxy real: `npm run test:g1-dev-proxy`, CWD `real_dev/web`, repetido fora da sandbox, terminou exit code 0; `/api` foi encaminhado apenas entre listeners loopback efémeros. A falha `listen EPERM` do handoff permanece corretamente classificada como ambiental.
- Primeiro E2E integrado pós-handoff: `npm run test:e2e`, CWD `real_dev/api`, terminou exit code 1; 30 PASS, 12 skips intencionais e 3 falhas em 45 casos/57,2 s. Axe, viewports, teclado, budgets, eliminação terminal e journeys executados ficaram verdes. Duas falhas esperavam `administrador` minúsculo quando a UI mostra corretamente `Administrador`; a terceira usava um locator parcial `Sair` que ficou ambíguo depois de acrescentar `Sair de todos os dispositivos`. P2-014/P3-004 regressam a `EM_IMPLEMENTACAO`; as fixtures serão alinhadas com nome exato/copy humana sem alterar o runtime e a matriz completa será repetida.
- Correção apenas no helper E2E: os três nomes de role passaram a exigir labels humanas capitalizadas e o botão da sessão atual usa `exact:true`, distinguindo-o de logout-all. Nenhum componente, rota ou contrato API mudou; lint e a matriz integral continuam pendentes.
- Check do helper: `npm run lint`, CWD `real_dev/web`, terminou exit code 0 sem warnings. O comportamento browser continua pendente.
- Segundo E2E integrado: `npm run test:e2e`, CWD `real_dev/api`, fora da sandbox, terminou exit code 0; 33 PASS e 12 skips intencionais em 45 casos/38,2 s. O orquestrador aplicou nove migrações numa base `orelle_e2e_test`, usou 5 utilizadores/3 produtos/3 imagens e executou teardown. Ficaram verdes journeys mutáveis Chromium, um percurso autenticado com Axe/overflow em cada engine, logout/logout-all, admin, wizard, privacidade/retry/eliminação terminal, pagamento simulado, Web Vitals, teclado e viewports 320/375/768/1280. P2-014/P3-004 regressam a `PRONTO_PARA_RETESTE`; falta o `verify:all` e a reauditoria frontend independente.

### 2026-07-10 - G5/G6/G7, reauditoria frontend independente pós-E2E

- Veredicto read-only: `FAIL` apenas por residuais P3, sem regressão P0/P1/P2 nos fluxos corrigidos. O auditor repetiu lint, 22/22 unitários, 74/74 contracts e discovery de 45 casos Playwright.
- Acabamento residual: role/estado técnicos ainda apareciam na home, moderação e checkout; persistiam `catalogo`, `Aparencia`, título `Checkout`, `Login`, `Dashboard` e ocorrências públicas de `Orelle` sem acento. P3-004 regressa a `EM_IMPLEMENTACAO` antes da correção.
- Cobertura residual: cinco das seis páginas resilientes dependiam sobretudo de contracts estáticos; AdminUsers não tinha teste comportamental de confirmação/falha/reativação/preservação; evolução/comparação não entravam no overflow browser. P2-014 regressa a `EM_IMPLEMENTACAO`; serão acrescentados unit tests reais e as duas rotas autenticadas ao E2E responsive sem eliminar os 12 skips intencionais dos fluxos mutáveis.
- Contratos positivos confirmados: logout/logout-all, wizard, seis consumers canceláveis, latches privacy, categorias, desativação admin, tabelas responsive e remoção do falso aviso LCP/CLS passaram a inspeção; P1-006/P1-007/P1-011 e P2-010/P2-011/P2-012 mantêm-se `PRONTO_PARA_RETESTE` até o reteste final do conjunto tocado.
- Correções finais: helper único fail-closed traduz role/review/order/voucher; superfícies públicas usam `Orélle` e copy PT-PT; títulos passam a `Pagamento simulado`, `Iniciar sessão` e `Painel administrativo`. Foram acrescentados testes comportamentais para os cinco consumers assíncronos, AdminUsers e superfícies de apresentação; o E2E responsive autenticado inclui `/conta`, `/pele/evolucao` e `/pele/comparacao` em 320/375 com Axe/overflow por engine.
- Evidência do handoff final: lint exit code 0; Vitest 13 ficheiros/37 testes; contracts 78/78; build Vite 96 módulos com entry 66,41 KiB gzip. P2-014/P3-004 avançam a `PRONTO_PARA_RETESTE`; o coordenador repetirá o conjunto e o E2E integral antes da reauditoria independente.
- Reteste coordenado: `npm run lint`, `npm test` e `npm run build`, CWD `real_dev/web`, terminaram exit code 0. ESLint ficou sem warnings; Vitest passou 13 ficheiros/37 testes; contracts 78/78; Vite 8.1.4 transformou 96 módulos e manteve entry em 66,41 KiB gzip. Falta repetir E2E/verify e reauditar o impacto final.
- E2E pós-cobertura: `npm run test:e2e`, CWD `real_dev/api`, fora da sandbox, terminou exit code 0; 33 PASS/12 skips intencionais em 45 casos/45,3 s, com nove migrações e teardown. A área autenticada percorreu conta, evolução e comparação em 320/375 com Axe/overflow nos três engines, mantendo os journeys mutáveis Chromium e todos os contratos de segurança/privacidade/pagamento. P2-014/P3-004 continuam `PRONTO_PARA_RETESTE` apenas até `verify:all` e reauditoria independente.

### 2026-07-10 - G0-G7, `verify:all` integral no estado final candidato

- CWD: `real_dev/api`; comando `npm run verify:all`, fora da sandbox; exit code 0.
- Resultado: 25/25 gates passaram no mesmo estado. Syntax verificou 401 ficheiros; lint ficou sem warnings; API passou 83 ficheiros/576 testes; frontend passou 13 ficheiros/37 testes e 78/78 contracts; build Vite transformou 96 módulos.
- O agregador executou os 13 smokes publicados, E2E 33 PASS/12 skips intencionais em 45 casos nos projetos Chromium/Firefox/WebKit, Axe, responsive/teclado, nove migrações, teardown, budgets de 25 produtos/150 variantes/177 imagens, JS inicial 65.652 bytes gzip, audits API/web com zero vulnerabilidades e planificação 44/31/74 `overall_pass=true`.
- Limite: o PASS integral não substitui os pareceres read-only finais ainda em curso. Findings mantêm os estados individuais atuais até a reauditoria frontend e documental confirmar ausência de residual.

### 2026-07-10 - G0/G3/G4/G7, reauditoria documental independente pós-validator

- Veredicto: `FAIL` semântico apesar de validator/diff/fences verdes. Foram encontrados cinco clusters ativos capazes de reintroduzir contratos antigos: decisão de privacidade e audit em unidades separadas; AES-GCM/plaintext sem AAD apresentado como solução final; nome cliente/PNG persistido em vez de `${kind}.webp`; metadata demo divergente; e `_TEMPLATE-BK.md` com paths privados `real_dev`.
- Contratos que passaram: dois pagamentos simulados, suspensão/eliminação terminal, registry 001–009, scheduler `dev:local`, ambiente isolado, redirects/fail-closed IA, FaceReport AbortSignal, 13 smokes dinâmicos, `ACEITE_RISCO`, PDF e contagens qualificadas.
- Estados reabertos antes de editar: P1-004/P1-005, P2-002/P2-005/P2-008 e P3-003 passam a `EM_IMPLEMENTACAO`. A correção ficará limitada aos snippets/guias/template identificados; runtime já validado não será alterado. O mesmo auditor independente repetirá a inspeção.

### 2026-07-10 - G5/G6/G7, segunda reauditoria frontend independente

- Positivos read-only: lint, 37/37 unitários e 78/78 contracts passaram. Os cinco consumers têm 5 testes de preservação+5 aborts reais; AdminUsers tem sucesso/reativação e falha com linha/modal preservados; o spec responsive lista o caso autenticado nos três engines e cobre duas larguras por conta/evolução/comparação. Estes critérios deixam de ser residuais.
- Veredicto: `FAIL` de apresentação. Tipos de pele e estados de privacidade/auditoria ainda podiam refletir tokens crus ou ingleses; persistiam `Orelle`, `Login`, `Dashboard`, `Users`, `checkout` e `Imagem URL` em superfícies visíveis; a rota montada `/conta/editar` caía no título `Página não encontrada`.
- Estados: P2-011 e P3-004 regressam a `EM_IMPLEMENTACAO` antes da edição. Será criada uma camada fail-closed também para tipos de pele/privacidade/audit, toda a copy pública será PT-PT/Orélle e o inventário de rotas/títulos ganhará negativo explícito. P2-014 mantém-se `PRONTO_PARA_RETESTE` porque a cobertura comportamental pedida passou; os novos contracts serão apenas proteção de regressão.
- Correções finais do residual: labels fail-closed cobrem seis tipos de pele, scope/action/status/resource de privacidade e event/outcome/resource de auditoria; valores desconhecidos usam texto neutro. As oito superfícies deixaram de refletir enums, a copy pública foi normalizada sem alterar keys/paths e `/conta/editar` recebeu `Editar perfil`; o contract inventaria mais de 30 rotas e recusa fallback.
- Evidência do handoff: lint exit code 0; Vitest 14 ficheiros/42 testes; contracts 85/85; build Vite 96 módulos com entry 66,50 KiB gzip; scans de interpolação raw, helper legacy/replace heurístico e copy proibida tiveram zero matches. P2-011/P3-004 avançam a `PRONTO_PARA_RETESTE`; reteste coordenado, E2E/verify e reauditoria independente continuam obrigatórios.
- Reteste coordenado: `npm run lint`, `npm test` e `npm run build`, CWD `real_dev/web`, terminaram exit code 0. ESLint ficou sem warnings; Vitest passou 14 ficheiros/42 testes; contracts 85/85; Vite transformou 96 módulos e gerou entry de 66,50 KiB gzip. O E2E/verify final será executado depois de os snippets documentais estabilizarem, para manter todos os gates no mesmo estado final.

### 2026-07-10 - G0/G1/G3/G4/G7, handoff documental semântico final

- Âmbito: 40 ficheiros ativos em README/docs, sem tocar no master report, `apps/` ou `real_dev/`. Foram reconciliados 005/006/008/009, desativação admin reversível, scheduler exclusivamente `dev:local`, defaults demo/test, pagamentos simulados, MIME/nome dos uploads, redirects/providerVersion, `ACEITE_RISCO`, PDF vigente, privacy+audit atómico, AbortSignal e enumeração dinâmica dos 13 smokes.
- Evidência do handoff: validator `overall_pass=true` com 44 RF/31 RNF/74 matriz/74 backlog/74 guias; `git diff --check` verde; 137 Markdown sem fences abertos; 70 snippets JS/JSX críticos com parsing válido; auditoria semântica automatizada 10/10; zero diffs em `apps/|real_dev`.
- Resultado: sem blocker documental. P2-002 e P3-003 avançam individualmente a `PRONTO_PARA_RETESTE`; o risco visual permanece `ACEITE_RISCO`, sem aprovação alegada. O coordenador repetirá os gates e uma reauditoria read-only independente antes da validação.
- Reteste coordenado estrutural: `bash scripts/validate-planificacao.sh` e `git diff --check -- README.md docs`, CWD raiz, terminaram exit code 0. O validator repetiu 44 RF/31 RNF/74 matriz/74 backlog/74 guias, zero issues e `overall_pass=true`; não existem erros de whitespace no diff. A coerência semântica independente continua obrigatória.

### 2026-07-10 - G0/G3/G4/G7, correção dos cinco clusters documentais residuais

- Âmbito: nove guias ativos/template; o subagente não editou este master report, `apps/`, `real_dev/` ou `.env`.
- Alterações: decisão de privacidade e audit na mesma `ClientSession`, com failure injection; cifra contextual v2 e leitura legacy apenas em 005/006/008/009; entrada JPEG/PNG/WebP normalizada e persistida como `${kind}.webp` sem nome original; metadata demo canónica; `_TEMPLATE-BK.md` limitado a `apps/api|apps/web`.
- Validação recebida: `bash scripts/validate-planificacao.sh`, CWD raiz, exit code 0/`overall_pass=true`, 44 RF/31 RNF/74 BK; `git diff --check` focal exit code 0; fences pares nos nove ficheiros e scans focais sem os contratos antigos.
- Reteste coordenado imediato: `bash scripts/validate-planificacao.sh` e `git diff --check -- README.md docs`, CWD raiz, terminaram exit code 0; o validator repetiu `overall_pass=true`, 44 RF/31 RNF/74 matriz/backlog/guias e zero issues, e o diff não encontrou whitespace inválido. A semântica permanece pendente do auditor independente já acionado.
- Incidente de tooling preservado: uma procura do subagente continha backticks numa string shell e executou acidentalmente, de forma read-only, `npm --prefix apps/api test`; falhou por `listen EPERM`, não alterou `apps/` e não é usada como evidence do produto ou do scope. A validação documental correta foi executada depois e passou.
- Estados: P1-004, P1-005, P2-002, P2-005, P2-008 e P3-003 avançam a `PRONTO_PARA_RETESTE`; a mesma auditoria documental independente será repetida.

### 2026-07-10 - G5/G6/G7, reauditoria frontend independente após labels tipados

- Âmbito read-only: apresentação, copy, títulos e testes de `real_dev/web`; sem edição, E2E integral, `apps/` ou `.env`.
- Evidência positiva: oito probes unknown de pele/privacidade/audit produziram fallback neutro; oito superfícies usam helpers tipados; marca visível e copy anteriormente citada ficaram corrigidas; 45 rotas montadas tiveram zero fallback de título. Lint, 42/42 unitários e 85/85 contracts terminaram exit code 0; discovery responsive listou 18 casos nos três engines.
- Veredicto: `FAIL` residual. `FaceAnalysisPage` ainda transforma finding desconhecido substituindo underscores e pode expor copy interna; `AppLayouts` mostra “Hub consulta IA”; o checkout apresenta “checkout simulado inválido”.
- Estados: P2-011 e P3-004 regressam a `EM_IMPLEMENTACAO` antes do patch fail-closed/PT-PT. P2-014 mantém-se `PRONTO_PARA_RETESTE`; a suite E2E completa será repetida no gate final.

### 2026-07-10 - G5/G6/G7, correção dos três resíduos frontend de apresentação

- Âmbito: exclusivamente `real_dev/web`; sem alterações em API, docs, `apps/`, `.env` ou neste report pelo subagente.
- Alterações: allowlist/fallback neutro em `FaceAnalysisPage`; “Consulta assistida” na navegação; erro do pagamento simulado integralmente em PT-PT. Os testes cobrem token desconhecido, ausência de leakage, label conhecida e preservação de dados após erro.
- Validação recebida em `real_dev/web`: `npm run lint`, `npm run test:unit`, `npm run test:contracts` e `npm run build`, todos exit code 0; 14 ficheiros/42 unitários, 86/86 contracts e Vite 8.1.4/96 módulos. Scans dos três resíduos terminaram exit code 1 esperado/zero matches e o scan positivo das novas copies terminou exit code 0.
- Estados: P2-011 e P3-004 avançam a `PRONTO_PARA_RETESTE`; o mesmo auditor independente e o `verify:all` final continuam obrigatórios.

### 2026-07-10 - G5/G6/G7, terceira reauditoria frontend independente

- Âmbito read-only: findings desconhecidos, navegação, checkout e adjacências de copy; sem edição, E2E integral, docs, `apps/`, `.env` ou report.
- Evidência positiva: allowlist/fallback de findings, “Consulta assistida” e mensagem de pagamento PT-PT passaram inspeção; lint, 14 ficheiros/42 unitários e 86/86 contracts terminaram exit code 0. Os scans não encontraram `replaceAll` nem tokens crus nas superfícies auditadas.
- Veredicto: `FAIL` por uma única adjacência P3 em `OrelleMockupHome`: “O hub identifica o modo usado” continua visível e usa terminologia interna. P2-011 mantém-se `PRONTO_PARA_RETESTE`; P3-004 regressa a `EM_IMPLEMENTACAO` antes da substituição e novo parecer independente.

### 2026-07-10 - G0/G3/G4/G7, reauditoria documental independente dos cinco clusters

- Resultado intercalar read-only: os cinco clusters exatos do handoff passaram os gates estruturais, mas a varredura adjacente encontrou semântica ainda incompleta noutros guias ativos.
- Resíduos confirmados: o DTO de MF1-06 omite `mode/isDemo/providerVersion`; MF1-08 repete um DTO reduzido e uma UI sem identificação demo. Projeções de campos contextuais omitem o owner `userId` em MF1-08, MF2-01, MF4-03 e MF6-07, podendo impedir a autenticação AAD ensinada pelo próprio guia.
- Estados: P1-005, P2-002 e P3-003 regressam a `EM_IMPLEMENTACAO` antes de qualquer correção documental. O auditor continua a varredura e entregará a lista final; nenhum runtime foi reaberto por este parecer.
- Veredicto final: `FAIL` semântico limitado aos dois clusters acima. Passaram decisão+audit transacional, fronteira legacy 005/006/008/009, upload WebP sem nome original e paths pedagógicos do template.
- Evidência independente: validator exit code 0/44 RF/31 RNF/74 matriz-backlog-guias; `git diff --check -- README.md docs` exit code 0; 136 Markdown/1668 marcadores com zero fences abertos; 74 guias com 3393 referências públicas e zero paths privados; scans proibidos sem getters genéricos, metadata demo antiga ou nome original persistido.
- Correção atribuída: incluir `userId` apenas nas projeções necessárias ao AAD, mantendo-o fora dos DTOs, e propagar `mode/isDemo/provider/providerVersion` até mappers, queries e `AnalysisModeBadge` de histórico. A mesma auditoria será repetida após o handoff.

### 2026-07-10 - G5/G6/G7, correção da última adjacência de copy frontend

- Âmbito: uma frase visível da home e a respetiva proteção contratual, apenas em `real_dev/web`; sem E2E integral ou alterações em docs/API/`apps/`/`.env`.
- Alteração: “O hub identifica o modo usado” foi substituído por “A consulta identifica o modo usado em cada resultado”, preservando keys, paths e comportamento.
- Validação recebida em `real_dev/web`: lint, 14 ficheiros/42 unitários, 86/86 contracts e build Vite 8.1.4/96 módulos terminaram exit code 0; o scan da frase antiga em `src/dist` teve zero matches e a nova copy existe em source/bundle.
- Estado: P3-004 avança a `PRONTO_PARA_RETESTE`; falta repetir o parecer frontend independente e o gate integral.

### 2026-07-10 - G5/G6/G7, parecer frontend independente final

- Veredicto read-only: `PASS` nos contratos focais e adjacências, sem edição ou E2E integral.
- Evidência: a home renderiza “A consulta identifica...”; scan semântico de JSX/copy encontrou zero candidatos visíveis `hub`/`checkout` técnicos; findings desconhecidos usam fallback neutro sem token; navegação e pagamento permanecem em PT-PT.
- Comandos em `real_dev/web`: lint exit code 0; unitários 14 ficheiros/42 testes exit code 0; contracts 86/86 exit code 0; scans focais exit code 0 para a nova copy e zero matches esperados para a antiga.
- Estados: P2-011 e P3-004 mantêm `PRONTO_PARA_RETESTE` até o `verify:all` final no mesmo estado; não ficou residual frontend conhecido neste recorte.

### 2026-07-10 - G0/G3/G4/G7, correção dos dois clusters documentais adjacentes

- Âmbito: guias MF1-06/MF1-08/MF2-01/MF4-03/MF6-07; sem runtime, `apps/`, `.env`, relatórios históricos ou master report pelo subagente.
- Alterações: DTOs/mappers/queries propagam a proveniência demo real; o histórico usa `AnalysisModeBadge`; projeções de campos AES-GCM contextuais incluem `userId` para o AAD sem o expor no DTO. O `FaceReport` documenta apenas `analysisMode`, `analysisIsDemo` e `analysisProviderVersion`, conforme o schema real.
- Reteste coordenado na raiz: `bash scripts/validate-planificacao.sh` e `git diff --check -- README.md docs` terminaram exit code 0; `overall_pass=true`, 44 RF/31 RNF/74 matriz-backlog-guias e zero issues/whitespace.
- Estados: P1-005, P2-002 e P3-003 avançam a `PRONTO_PARA_RETESTE`; a mesma reauditoria independente será repetida antes do gate integral.

### 2026-07-10 - G0/G3/G7, reauditoria documental posterior às projeções/provenance

- Resultado intercalar read-only: projeções com owner e provenance demo estão corrigidas conforme o runtime real.
- Residual adjacente: MF6-07 e MF7-05 ainda expõem `userId` em headers/rows de exportação administrativa, embora MF4-03 já ensine que o owner serve apenas para autenticar o AAD e não pertence ao dataset público/exportado.
- Estados: P2-002 e P3-003 regressam a `EM_IMPLEMENTACAO` antes de editar esses dois snippets. Gates estruturais continuam verdes; o auditor entregará a confirmação final independente.
- Veredicto final dessa passagem: `FAIL` também porque MF1-06 ainda usa um badge manual que decide apenas por `mode`, apesar de os DTOs já transportarem `isDemo/providerVersion`. P1-005 regressa a `EM_IMPLEMENTACAO`; a correção deve reutilizar o componente canónico, não duplicar lógica de proveniência.
- Validações independentes mantidas: validator exit code 0/44-31-74, diff exit code 0, 136 Markdown/1672 fences sem abertura, 74 guias/3402 referências públicas e zero paths privados.

### 2026-07-10 - G0/G3/G4/G7, correção final de minimização e badge demo

- Alterações: MF6-07/MF7-05 mantêm `userId` somente na projeção necessária ao AAD e removem-no de headers/rows; MF1-06 importa e usa `AnalysisModeBadge` com `mode/isDemo/providerName/providerVersion`.
- Validação coordenada na raiz: validator exit code 0/`overall_pass=true`, 44 RF/31 RNF/74 matriz-backlog-guias; `git diff --check -- README.md docs` exit code 0; scan dos headers/rows e badge manual terminou exit code 1 esperado/zero matches.
- Estados: P1-005, P2-002 e P3-003 avançam a `PRONTO_PARA_RETESTE`; a reauditoria independente será repetida mais uma vez sobre o estado atual.

### 2026-07-10 - G0/G3/G4/G7, parecer documental independente final

- Veredicto read-only: `PASS`, sem edição nem acesso a `.env`, `apps/`, `real_dev/` ou este report.
- Projeções/exports: 17 projeções contextuais analisadas, zero owner em falta e zero owner técnico exposto em headers/rows/DTOs; MF6-07 e MF7-05 usam `userId` apenas para AAD.
- Proveniência: MF1-06 usa `AnalysisModeBadge` com os quatro campos de `FaceAnalysis`; `FaceReport` conserva apenas os três campos reais; zero badge manual por `mode` e zero `analysisProvider:` inventado.
- Gates: validator exit code 0/44 RF/31 RNF/74 matriz-backlog-guias/`overall_pass=true`; diff exit code 0; 136 Markdown/1672 marcadores/zero fences abertos; scans semânticos sem resíduos.
- Estados: P1-005, P2-002 e P3-003 mantêm `PRONTO_PARA_RETESTE` até o `verify:all` final; não ficou residual documental conhecido. P3-003 conservará `ACEITE_RISCO` apenas para a comparação Figma dispensada, sem alegar aprovação.

### 2026-07-10 - G0-G7, `verify:all` definitivo no estado combinado

- CWD: `real_dev/api`; comando `npm run verify:all`, executado fora da sandbox apenas para listeners loopback, `MongoMemoryReplSet` e browsers locais; exit code 0.
- Resultado: 25/25 gates. Syntax verificou 402 ficheiros; API passou 83 ficheiros/576 testes; frontend passou 14 ficheiros/42 unitários e 86/86 contracts; lint ficou sem warnings e o build Vite transformou 96 módulos.
- Smokes/E2E: os 13 scripts `smoke:*` passaram. Playwright descobriu 45 casos em Chromium/Firefox/WebKit: 33 PASS e 12 skips intencionais dos journeys mutáveis fora do Chromium. O orquestrador aplicou nove migrações em `orelle_e2e_test`, usou fixtures minimizadas e executou teardown.
- Acessibilidade/performance: Axe, teclado e overflow passaram nas rotas/viewports configurados; 25 produtos/150 variantes/177 imagens ficaram dentro dos budgets, com 8.018.679 bytes publicados e JS inicial de 65.735 bytes gzip.
- Segurança/docs: audits API/web reportaram zero vulnerabilidades; planificação terminou `overall_pass=true` com 44 RF/31 RNF/74 matriz-backlog-guias.

### 2026-07-10 - Controlos finais de scope, hashes e configuração sensível

- `git diff --name-only -- apps` e `git status --short -- apps`, CWD raiz, terminaram exit code 0 e sem output; `apps/` não foi alterado.
- `git check-ignore -v real_dev real_dev/api/package.json real_dev/web/package.json`, exit code 0; os três paths continuam cobertos exclusivamente por `.gitignore:2`.
- `stat` leu apenas metadata de `real_dev/api/.env`: modo `0644`, owner local; o ficheiro nunca foi aberto ou alterado.
- Hashes atuais: API manifest `ccbd9cb54cd32bec293b62646e5aa44ca9eff05dfd2eb51ae282fbfd7928bd7a`, lock `043baf15c773fbc61859a975a16ce56848f7bf75df80e7b947f6bba087c85b73`; web manifest `70d0dcf76a2c5ecdd6eac6d1dc4b6fc506a87e84568015a4b2f3147f614f6a42`, lock `f26682d548a78a60180c34bcdc043e6a6bb19cdbd055e2c1732dd302d0c0bac2`.
- Scan financeiro: a primeira invocação usou um path antigo de provider e terminou exit code 2; o reteste no path real `src/providers/payment.provider.js` terminou exit code 1 esperado/zero matches para Stripe, PayPal, MBWay, gateway/URL, `fetch` ou HTTP nos quatro módulos de pagamento.
- Secret scan path-only, excluindo `.env`, dependências, quarentenas e builds, encontrou apenas `.env.example`, testes e documentação de exemplos/negativos; não encontrou ficheiro de runtime com credencial utilizável. Nenhum valor foi impresso no report.
- Fecho do report: validator final exit code 0/`overall_pass=true` com 44/31/74; `git diff --check -- README.md docs` exit code 0; dashboard e fichas P1/P2 sem estados abertos/intermédios (scans exit code 1 esperado/zero matches); master report sem trailing whitespace (exit code 1 esperado/zero matches).

## Validações finais

| Validação | Resultado final |
| --- | --- |
| `npm run verify:all` | `PASS`, 25/25 gates |
| API | `PASS`, 83 ficheiros/576 testes |
| Frontend | `PASS`, 14 ficheiros/42 unitários e 86/86 contracts |
| Build/smokes | `PASS`, Vite 96 módulos e 13/13 smokes |
| E2E | `PASS`, 33 executados e 12 skips intencionais/45 casos, Chromium/Firefox/WebKit |
| Acessibilidade | `PASS`, Axe sem violações serious/critical nos fluxos cobertos, teclado e responsive |
| Performance | `PASS`, JS inicial 65.735 bytes gzip; 177 imagens dentro dos budgets |
| Migrações | `PASS`, 001–009 com checksum, lock+heartbeat, dry-run/up/replay/rollback/retoma |
| Dependências | `PASS`, `npm audit` API/web com zero vulnerabilidades |
| Documentação | `PASS`, validator 44/31/74, diff/fences/scans e parecer semântico independente |
| Scope | `PASS`, zero alterações em `apps/`; `real_dev/` continua ignorado |
| Configuração sensível | `BLOQUEADO_EXTERNO`, `.env` remoto não lido/alterado e ainda `0644` |

### Decisão individual por finding

| Finding | Evidência de fecho atual | Decisão |
| --- | --- | --- |
| `P1-001` | concorrência/replay/rollback e E2E do pagamento simulado | `VALIDADO` |
| `P1-002` | 25 pedidos, um consumo de voucher/stock e replay exato | `VALIDADO` |
| `P1-003` | bundle sem loopback, proxy local real e target remoto recusado | `VALIDADO` |
| `P1-004` | write barriers, eliminação física/terminal, retry e parecer independente | `VALIDADO` |
| `P1-005` | demo fail-closed, consentimento/redirect e provenance canónica | `VALIDADO` |
| `P1-006` | draft/CAS/transações e journey sessão→review→insight | `VALIDADO` |
| `P1-007` | perfil novo/existente, destinos por role e E2E | `VALIDADO` |
| `P1-008` | snapshot consistente, staging, restore/verify e scheduler local | `VALIDADO` |
| `P1-009` | rate limits, Busboy/Sharp, quota, cleanup e TTL | `VALIDADO` |
| `P1-010` | seis prefixos de fórmula neutralizados e regressão export | `VALIDADO` |
| `P1-011` | variantes/budgets/Web Vitals e remoção do budget enganador | `VALIDADO` |
| `P2-001` | list/detail/decision auditados e CAS concorrente | `VALIDADO` |
| `P2-002` | AES-GCM v2/AAD, dumps/migrations e zero owner exportado | `VALIDADO` |
| `P2-003` | allowlist de ranking e invariância de atributos protegidos | `VALIDADO` |
| `P2-004` | split machine/human, CAS e regeneração preserva override | `VALIDADO` |
| `P2-005` | transações/outbox/failure injection em todos os boundaries críticos | `VALIDADO` |
| `P2-006` | AbortSignal até providers/storage/commits e rollback/retry | `VALIDADO` |
| `P2-007` | sessão opaca, CSRF/Origin, revogação e headers/proxy | `VALIDADO` |
| `P2-008` | normalização WebP, EXIF/pixel limits, nome minimizado e cleanup | `VALIDADO` |
| `P2-009` | imagens owner-only/no-store e comparação por data sem IDs | `VALIDADO` |
| `P2-010` | `ApiError`, timeout/abort/401 e preservação anti-race | `VALIDADO` |
| `P2-011` | administração completa, labels fail-closed e zero IDs técnicos | `VALIDADO` |
| `P2-012` | tema/tabelas/foco/touch targets/Axe/responsive multi-engine | `VALIDADO` |
| `P2-013` | fail-fast, readiness transacional, startup/shutdown e `dev:local` | `VALIDADO` |
| `P2-014` | unit/contracts, 13 smokes e 45 casos Playwright descobertos | `VALIDADO` |
| `P2-015` | migrations 001–009, heartbeat/unique, TTL/sampling e replay | `VALIDADO` |
| `P2-016` | runtime fixado, instalações reproduzíveis e audits zero | `VALIDADO` |
| `P3-001` | enumeração/timing, corrida `11000` e limite bcrypt | `VALIDADO` |
| `P3-002` | seeds limitadas a development e PDF validado/renderizado | `VALIDADO` |
| `P3-003` | docs/validator/parecer semântico verdes; revisão Figma dispensada | `ACEITE_RISCO` |
| `P3-004` | copy/títulos/splitting/responsive e parecer frontend final | `VALIDADO` |
| `P3-005` | execução local segura; rotação/permissão/cleanup dependem do utilizador | `BLOQUEADO_EXTERNO` |

## Decisão de fecho

`CONCLUIDO_COM_BLOCKERS_EXTERNOS`.

Zero P0/P1/P2 permanece aberto. O único risco aceite é a comparação manual/Figma dispensada pelo utilizador, sem alegação de aprovação visual. Os blockers externos restantes são a rotação da credencial remota, a permissão `0644` do `.env`, o cleanup das quarentenas com ownership histórico e a ausência de validação manual em Safari/Edge reais. A aplicação é declarada concluída apenas para o alvo académico/local; não se alega prontidão de produção, CI/CD cloud ou disaster recovery externo.
