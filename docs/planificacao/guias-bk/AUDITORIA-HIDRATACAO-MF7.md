# AUDITORIA-HIDRATACAO-MF7

## Header

- `project`: `Orelle`
- `mf_alvo`: `MF7`
- `modo`: `auditar_apenas`
- `bk_ids`: `[]`
- `finding_ids`: `[]`
- `fix_severities`: `P0,P1,P2,P3`
- `incluir_p3`: `sim`
- `strict_scope`: `true`
- `check_mf_coherence`: `true`
- `profundidade_coerencia`: `vizinhas`
- `output_mode`: `relatorio_e_resumo`
- `run_commands`: `true`
- `permitir_alterar_docs`: `sim`
- `permitir_commits`: `nao`
- `data_execucao`: `2026-06-27`
- `student_app_root`: `apps`
- `private_reference_root`: `real_dev`
- `bk_output_root`: `apps`
- `audit_report_source`: `auto`
- `audit_report_path`: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF7.md`

## Resumo executivo

Foi executada auditoria documental estrita à `MF7 - Privacidade, seguranca e controlo`, com `BK_IDS=[]`, abrangendo `BK-MF7-01` a `BK-MF7-07`.

Escopo respeitado:

- Foram auditados os sete BKs da MF7.
- A documentação canonica, a MF6 anterior e a MF8 seguinte foram consultadas para coerencia.
- Nenhum BK foi editado nesta execução, porque o modo activo é `auditar_apenas`.
- Não foram alterados ficheiros em `apps/**`, `real_dev/**`, documentos canonicos globais, scripts, prompts ou legacy.
- Foi actualizado apenas este relatório durável por `OUTPUT_MODE=relatorio_e_resumo`.
- Não foi feito commit por `PERMITIR_COMMITS=nao`.

Resultado documental dos BKs alvo: `OK`.

Os sete BKs cumprem a estrutura obrigatória da prompt activa: 17 secções essenciais em ordem, `### Passo 1` a `### Passo 7`, pontos 1 a 7 em todos os passos, caminhos públicos em `apps/...`, sem leakage de `real_dev`, com JSDoc/comentários didácticos suficientes nos blocos JavaScript/JSX relevantes e sem linguagem interna proibida.

Resultado global da execução: `GO_COM_RESSALVAS`. As ressalvas não bloqueiam a MF7: o validador documental global ainda usa um contrato legacy (`Bloco pedagogico` / `Bloco operacional` / matriz antiga), a MF8 seguinte ainda está no formato legacy e a validação manual real nos quatro browsers/provedor externo real não foi executada nesta auditoria.

## Contagem OK/PARCIAL/CRITICO

| Momento | Universo | OK | PARCIAL | CRITICO | Nota |
| --- | --- | ---: | ---: | ---: | --- |
| Antes da auditoria actual | Estado lido dos sete BKs MF7 antes de editar este relatório | 7 | 0 | 0 | O relatório anterior estava estreito a `BK-MF7-07`; a contagem desta execução foi recalculada a partir dos BKs reais. |
| Depois da auditoria actual | `BK-MF7-01` a `BK-MF7-07`, sem edição de BKs por `auditar_apenas` | 7 | 0 | 0 | Nenhum finding activo confirmado nesta ronda. |

## BKs analisados

| BK | Estado final | RF/RNF | Evidencia principal |
| --- | --- | --- | --- |
| `BK-MF7-01` | `OK` | `RNF12` | Consentimento explícito antes de upload/análise facial; ownership por sessão; bloqueio sem consentimento; handoff para eliminação/anonymização. |
| `BK-MF7-02` | `OK` | `RNF13`, relacionado com `RF41` e `RF44` | Fluxo completo de pedido, revisão, decisão, auditoria, fallback durável, UI minimizada e negativos de sessão/role/recurso. |
| `BK-MF7-03` | `OK` | `RNF14`, relacionado com `RF02` | Sessão por cookie HttpOnly, segredo forte em produção, middleware de autenticação, cliente `credentials: "include"` e testes de login/me/logout. |
| `BK-MF7-04` | `OK` | `RNF15` | Smoke estático de compatibilidade, build Vite, checklist Chrome/Safari/Edge/Firefox e evidence manual orientada por fluxos críticos. |
| `BK-MF7-05` | `OK` | `RNF16`, relacionado com `RF35` | Exportação PDF minimizada no módulo `admin-export`, sem dependência nova, protegida por admin, com headers e exclusão de relatórios não activos. |
| `BK-MF7-06` | `OK` | `RNF17`, relacionado com `RF27`, `RF28`, `RF30` | Checkout separa carrinho, encomenda e pagamento; backend recalcula preço/stock; Stripe controlado; PayPal/MBWay como stubs honestos. |
| `BK-MF7-07` | `OK` | `RNF18`, relacionado com `RF14`, `RF15`, `RNF23`, `RNF24`, `RNF25` | Provider externo isolado, HTTPS obrigatório para provider publicado, payload minimizado, fallback local honesto e `sources`/`limitations` para MF8. |

## Findings activos

Não foram confirmados findings activos `P0`, `P1`, `P2` ou `P3` nos BKs alvo desta execução.

As ocorrências textuais encontradas por `rg` dentro da MF7 foram classificadas como falsos positivos contextuais:

- `Sem diagnostico medico` / `diagnóstico médico`: usado como limitação segura da análise cosmética, não como claim clínico.
- `treino externo`: usado em proibições e limites de privacidade, não como promessa de treino.
- `localStorage` / `sessionStorage`: aparece em comandos de leakage scan, não como armazenamento real de sessão.
- `storageKey`, `token`, `cookie`, `passwordHash`: aparecem em explicações, testes negativos ou asserts de não exposição.

## Mapa de integracao da MF

### `BK-MF7-01`

- `ficheiros previstos`: `apps/api/src/models/face-consent.model.js`, `apps/api/src/validators/face-consent.validator.js`, `apps/api/src/controllers/face-consent.controller.js`, `apps/api/src/routes/face.routes.js`, `apps/web/src/pages/FacePhotoUploadPage.jsx`, testes faciais.
- `contratos consumidos`: upload/análise facial de MF1, encriptação e minimização de `BK-MF6-07`, sessão autenticada.
- `contratos entregues`: consentimento activo verificável antes de fotografia, análise, simulação ou leitura sensível.
- `segurança`: consentimento explícito, ownership no backend, bloqueio sem sessão e sem aceitação afirmativa.
- `handoff`: `BK-MF7-02` consome o estado de consentimento sem o confundir com eliminação/anonymização.

### `BK-MF7-02`

- `ficheiros previstos`: model/validator/service/controller/route de pedidos de privacidade biométrica, páginas de cliente/revisão, testes HTTP.
- `contratos consumidos`: `FacePhoto`, `FaceReport`, `FaceConsent`, `BiometricAccessLog`, roles de cliente/consultor/admin.
- `contratos entregues`: pedido com `requesterId` vindo da sessão, decisão por consultor/admin, estados `pending`, `processing`, `approved`, `rejected`, `failed`.
- `segurança`: respostas minimizadas, auditoria RF44, fallback operacional quando não há transacção MongoDB real.
- `handoff`: `BK-MF7-03` reforça que todos estes endpoints dependem de cookie HttpOnly.

### `BK-MF7-03`

- `ficheiros previstos`: config/env, `session.service.js`, auth middleware, controllers/rotas de auth, `apiClient`, testes de sessão.
- `contratos consumidos`: `RF02`, `RNF14`, HTTPS de `BK-MF6-05`.
- `contratos entregues`: cookie HttpOnly com opções coerentes, limpeza em logout, revalidação de sessão e chamadas frontend com `credentials: "include"`.
- `segurança`: sem token em storage do browser; segredo fraco bloqueado em produção.
- `handoff`: os restantes BKs da MF7 podem depender de sessão autenticada sem receber `userId` vindo do frontend.

### `BK-MF7-04`

- `ficheiros previstos`: script `apps/web/scripts/check-mf7-browser-compatibility.mjs`, script npm `smoke:mf7-compat`, evidence de browsers.
- `contratos consumidos`: Vite/React existentes e fluxos sensíveis de upload, sessão, privacidade, exportação e checkout.
- `contratos entregues`: verificação contra branches por browser, build Vite e checklist manual nos quatro browsers.
- `segurança`: reduz decisões frágeis que poderiam quebrar cookies, downloads ou upload de ficheiros.
- `handoff`: `BK-MF7-05` e `BK-MF7-06` mantêm downloads/checkout testáveis em browsers modernos.

### `BK-MF7-05`

- `ficheiros previstos`: `admin-export.service.js`, controller/route admin, `AdminExportsPage.jsx`, testes de exportação.
- `contratos consumidos`: exportação de `BK-MF4-03`, `RF35`, relatórios de IA, `privacyStatus` de MF5/MF6.
- `contratos entregues`: PDF textual minimizado com `Content-Type: application/pdf`, `Content-Disposition`, filtro `privacyStatus: "active"` e role admin.
- `segurança`: exclui `passwordHash`, fotografias, paths internos, tokens, cookies e relatórios não activos.
- `handoff`: MF8 pode acrescentar métricas/logs sem expor conteúdo sensível.

### `BK-MF7-06`

- `ficheiros previstos`: payment provider, checkout validator/service/controller/route, `CheckoutPage.jsx`, testes.
- `contratos consumidos`: carrinho/produto/encomenda de MF3, sessão HttpOnly, stock/preço do backend.
- `contratos entregues`: `POST /api/orders/checkout`, idempotência mínima, Stripe real controlado e PayPal/MBWay pendentes.
- `segurança/comércio`: backend recalcula preço e stock; stubs não devolvem `paid`; recomendações não disparam checkout.
- `handoff`: `BK-MF7-07` mantém IA separada de compra automática.

### `BK-MF7-07`

- `ficheiros previstos`: config/env, provider externo, provider local, secure storage, face-analysis service, `FaceAnalysisPage.jsx`, testes do provider externo.
- `contratos consumidos`: consentimento `BK-MF7-01`, sessão `BK-MF7-03`, encriptação/storage `BK-MF6-07`, limites IA de `RF14`/`RF15`.
- `contratos entregues`: provider externo configurável, fallback local, resposta normalizada com `providerName`, `findings`, `sources` e `limitations`.
- `segurança/IA`: API key só no header, URL externo HTTP recusado antes de `fetch`, sem `storageKey`/path interno no body/resposta, sem diagnóstico médico e sem treino externo.
- `handoff`: `BK-MF8-05`, `BK-MF8-06` e `BK-MF8-07` devem consumir `sources`/`limitations` para explicabilidade, não discriminação e consentimento de treino.

## Coerencia MF6 -> MF7 -> MF8

- `MF6`: os BKs estão maioritariamente no contrato activo e `BK-MF6-05`, `BK-MF6-06` e `BK-MF6-07` entregam HTTPS, bcrypt e protecção/encriptação de fotografias e relatórios. A MF7 consome esses contratos sem os substituir.
- `MF7`: a sequência está coerente: consentimento, eliminação/anonymização, sessão, compatibilidade, exportação PDF, checkout e provider externo de IA preservam ownership, minimização, roles e separação entre recomendação e compra.
- `MF8`: os BKs seguintes ainda estão em formato legacy, sem as 17 secções activas nem passos técnicos lineares. Isto é drift da MF seguinte; não torna a MF7 `PARCIAL`, mas mantém risco de handoff até a MF8 ser hidratada.

## Decisoes confirmadas

- `CANONICO`: `RNF12` exige consentimento explícito para análise facial.
- `CANONICO`: `RNF13` exige direito a eliminar conta e dados, incluindo fotografias.
- `CANONICO`: `RNF14` exige sessões autenticadas com cookies HttpOnly.
- `CANONICO`: `RNF15` exige compatibilidade com Chrome, Safari, Edge e Firefox.
- `CANONICO`: `RNF16` exige exportação de relatórios em PDF.
- `CANONICO`: `RNF17` define Stripe real no MVP e PayPal/MBWay em stub funcional.
- `CANONICO`: `RNF18` pede suporte para API externa de IA.
- `CANONICO`: `RF41` e `RF44` sustentam revisão/administração e auditoria de dados biométricos.
- `CANONICO`: `RF27` separa encomenda/pagamento e suporta o checkout da MF7.
- `CANONICO`: `RF14` e `RF15` limitam IA a análise/relatório cosmético, sem diagnóstico médico definitivo.
- `DERIVADO`: usar `fetch` nativo no adapter externo evita dependência nova.
- `DERIVADO`: PDF textual mínimo com `Buffer` é suficiente para o MVP PAP quando a prioridade é autorização, minimização e headers.
- `DERIVADO`: HTTP só é aceitável para provider local controlado (`localhost`/`127.0.0.1`); provider externo publicado deve usar HTTPS.
- `DERIVADO`: PayPal/MBWay ficam como stubs pendentes, sem fingir pagamento recebido.

## Validacoes executadas

| Comando/verificacao | Resultado | Nota |
| --- | --- | --- |
| Leitura da prompt activa | `OK` | Execução em `auditar_apenas`, escopo `BK_IDS=[]`, MF7 completa. |
| Existência dos documentos obrigatórios | `OK` | Todos os caminhos obrigatórios existem. |
| Pesquisa canónica `MF7`/`BK-MF7`/`RNF12`-`RNF18` | `OK` | Matriz, backlog, MF views, RF/RNF e anexos confirmam os sete BKs. |
| Auditoria estrutural dos BKs MF7 | `OK` | 7/7 com secções obrigatórias, passos 1 a 7 e caminhos `apps/...`. |
| Pesquisa de `real_dev` nos BKs MF7 | `exit 1` | Sem leakage da referência privada nos BKs dos alunos. |
| Pesquisa de linguagem interna/riscos nos BKs MF7 | `exit 0` | Ocorrências classificadas como falsos positivos contextuais ou negativos seguros. |
| Pesquisa focada em `apps/**`, testes e MF7 para segredos/storage/claims | `exit 0` | Ocorrências explicadas por testes, comentários de segurança, asserts de não exposição ou variáveis de ambiente. Sem finding novo da MF7. |
| `git diff --check` | `exit 0` | Sem erros de whitespace no diff antes da escrita do relatório. |
| `bash scripts/validate-planificacao.sh` | `exit 1` | Coverage/consistency/naming passam; `guides_pass=false` por contrato legacy e issues fora/contra a prompt activa. |
| `npm --prefix apps/web run build` | `exit 0` | Vite build passou; 73 módulos transformados. |
| `npm --prefix apps/api test` na sandbox | `exit 1` | Falhou por bloqueio ambiental `listen EPERM: operation not permitted 0.0.0.0` em Supertest. |
| `npm --prefix apps/api test` fora da sandbox | `exit 0` | 18 test files e 144 testes passaram. |

## Verificacoes nao executadas

- Smoke manual real em Chrome, Safari, Edge e Firefox, porque esta auditoria não abriu browsers nem executou QA manual.
- Smoke contra provider externo real de IA, porque não há fornecedor pago definitivo nem credenciais/contrato canónico nesta prompt.
- Comandos em `real_dev/**`; `real_dev` foi tratado apenas como referência privada.
- Correcção dos BKs, porque `MODO=auditar_apenas`.
- Commit, porque `PERMITIR_COMMITS=nao`.

## Drift documental e tecnico encontrado

- `DRIFT`: o relatório MF7 existente antes desta execução ainda declarava `bk_ids: [BK-MF7-07]`; esta execução recalculou o escopo correcto como `BK_IDS=[]`.
- `DRIFT`: `scripts/validate-planificacao.sh` ainda espera anchors legacy como `Bloco pedagogico`, `Bloco operacional` e `Matriz minima`; a prompt activa exige a estrutura `#### Objetivo` a `#### Changelog`.
- `DRIFT`: o validador global acusa BKs fora do escopo (`MF4`, `MF6`) e acusa a MF7 por regras antigas ou incompatíveis com a prompt actual.
- `DRIFT`: `BK-MF8-01` a `BK-MF8-07` ainda estão em formato legacy, sem tutorial técnico linear activo; isto deve ser tratado numa execução própria de MF8.

## Riscos restantes

- `Risco de validador`: suite documental global continua vermelha por drift legacy, apesar de coverage, consistency e naming passarem.
- `Risco de MF seguinte`: a MF8 ainda precisa de hidratação para consumir o handoff da MF7 com o mesmo nível pedagógico.
- `Risco de QA manual`: compatibilidade real nos quatro browsers não foi comprovada nesta execução.
- `Risco de provider real`: a integração com fornecedor externo de IA não foi testada contra serviço real.

## Ficheiros alterados nesta execucao

- `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF7.md`

## Ficheiros nao alterados nesta execucao

- `docs/planificacao/guias-bk/MF7/BK-MF7-01-consentimento-explicito-para-analise-facial-rgpd.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-02-direito-a-eliminar-conta-e-dados-incluindo-fotos.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-03-sessoes-autenticadas-com-cookies-httponly.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-04-compativel-com-chrome-safari-edge-e-firefox.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-05-exportacao-de-relatorios-em-pdf.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-06-integracao-com-gateways-de-pagamento-stripe-paypal-mbway.md`
- `docs/planificacao/guias-bk/MF7/BK-MF7-07-suporte-para-api-de-ia-externa-ex-azure-face-api-ou-tensorflow.md`
- `apps/api/**`
- `apps/web/**`
- `real_dev/**`
- documentos canonicos globais
- scripts, prompts e `agent/legacy/**`

## Estado git observado

- Alterações pre-existentes preservadas: `apps/api/src/services/admin-export.service.js`, `apps/api/tests/mf4.integration.test.js`, os sete BKs MF7 e relatórios MF6 não rastreados.
- Alteração desta execução: `docs/planificacao/guias-bk/AUDITORIA-HIDRATACAO-MF7.md`.
- Commit não executado por `PERMITIR_COMMITS=nao`.

## Estado final

`MF7` fica `GO_COM_RESSALVAS` nesta auditoria documental. Os sete BKs alvo ficam `OK`, sem findings activos confirmados. As ressalvas restantes são externas ao conteúdo actual da MF7: validador legacy, MF8 ainda por hidratar, QA manual de browsers e ausência de provider externo real.
