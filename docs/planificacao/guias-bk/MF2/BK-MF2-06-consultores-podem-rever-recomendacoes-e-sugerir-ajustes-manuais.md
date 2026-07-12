# BK-MF2-06 - Rever opcionalmente o relatório e preservar machineResult

## Header

- `doc_id`: `GUIA-BK-MF2-06`
- `bk_id`: `BK-MF2-06`
- `macro`: `MF2`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P2`
- `estado`: `DONE`
- `esforco`: `S`
- `dependencias`: `BK-MF2-02`
- `rf_rnf`: `RF22`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF2-07`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-06-consultores-podem-rever-recomendacoes-e-sugerir-ajustes-manuais.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico:** existe uma revisão opcional por relatório, não uma segunda revisão por recomendação. O consultor pode aprovar, ajustar ou pedir esclarecimento. `machineResult` é imutável; qualquer alteração ocupa `humanOverride`. Fotografias só ficam disponíveis com grant explícito, temporário e auditado.

## Contexto do BK

Depois de gerar o draft, o utilizador escolhe:

- **Continuar com relatório IA:** congela a versão OpenAI;
- **Pedir revisão humana:** cria uma revisão do relatório e bloqueia temporariamente o freeze/pagamento.

A revisão não deve bloquear para sempre. O utilizador pode retirar um pedido ainda não decidido, responder a um esclarecimento e continuar o fluxo.

## Objetivo

Permitir revisão humana opcional do relatório inteiro, com controlo por roles, consentimento temporário para fotografias, compare-and-set nas decisões e separação rigorosa entre resultado OpenAI e override humano.

## Importância

A revisão dá supervisão humana sem apagar a provenance da IA. Também protege o utilizador: o consultor não vê fotografias por defeito, não decide duas vezes a mesma revisão e não consegue introduzir produtos que violem stock, variantes ou restrições.

## Scope-in

- Pedir/retirar revisão pelo próprio utilizador.
- Conceder acesso às fotografias apenas quando explicitamente autorizado.
- Expirar o grant ao concluir/cancelar ou após sete dias.
- Listar e abrir revisões para `consultor`/`admin`.
- Auditar listagem, detalhe, fotografia e decisão.
- Suportar `approved`, `adjusted` e `needs_clarification`.
- Validar produtos, variantes, rotina, instruções e cautelas ajustados.
- Usar compare-and-set para uma única decisão.
- Criar nova revisão do relatório depois de esclarecimento.

## Scope-out

- Não permitir revisão por produto/recomendação isolada.
- Não carregar fotografias ao abrir a página do consultor.
- Não mostrar fotografias sem grant válido.
- Não substituir `machineResult`.
- Não permitir ajuste de produtos fora do relatório/catálogo válido.
- Não deixar pagamento ativo durante revisão pendente.

## Pré-requisitos

- Draft do relatório OpenAI v2.
- Roles `consultor` e `admin`.
- Audit log append-only.
- Consentimento separado para acesso do consultor às fotografias.
- Validators de catálogo, variantes, alergias e stock.

## Glossário

- **Review request:** pedido opcional criado pelo titular.
- **Photo grant:** autorização temporária por relatório/revisão.
- **Compare-and-set (CAS):** atualização apenas se o estado ainda for o esperado.
- **Human override:** versão humana separada do resultado da OpenAI.
- **Clarification:** pedido de informação que reabre a conversa e cria uma nova revisão.

## Conceitos teóricos

O consultor deve ver primeiro dados textuais minimizados. A fotografia só é carregada depois de uma ação explícita, através de um endpoint autenticado com `Cache-Control: private, no-store`. Cada acesso cria audit log; o grant expira ao concluir/cancelar a revisão ou em sete dias e pode ser revogado antes.

Uma decisão concorrente é um problema real: dois separadores podem tentar decidir a mesma revisão. O service atualiza apenas quando `status=pending`; a primeira decisão vence e a segunda recebe `409`.

`needs_clarification` não edita o relatório existente. Reabre a conversa, persiste a resposta e cria um novo job de relatório. A nova versão recebe uma revisão sucessora; a antiga fica cancelada/ligada para auditoria.

## Arquitetura do BK

- `POST|DELETE /api/face-reports/:reportId/review-request`
- `DELETE /api/face-reports/:reportId/review-photo-access`
- `GET /api/consultant/ai-consultation-reviews`
- `GET /api/consultant/ai-consultation-reviews/:reviewId`
- `GET /api/consultant/ai-consultation-reviews/:reviewId/photos/:view`
- `POST /api/consultant/ai-consultation-reviews/:reviewId/decision`
- `AiConsultationReview` + photo grant + audit log

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/ai-consultation-review.model.js`
- EDITAR: `apps/api/src/models/ai-consultation-audit-log.model.js`
- EDITAR: `apps/api/src/services/report-review.service.js`
- EDITAR: `apps/api/src/services/ai-consultation-review.service.js`
- EDITAR: `apps/api/src/validators/ai-consultation-review.validator.js`
- EDITAR: `apps/api/src/routes/ai-consultation-review.routes.js`
- EDITAR: `apps/api/src/routes/face-report.routes.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- EDITAR: `apps/web/src/features/consultation/ConsultationReviewsPage.jsx`

## Bloco pedagogico

### Objetivo

Perceber como combinar supervisão humana, autorização temporária, versionamento e concorrência.

### Pre-requisitos

- Saber aplicar middleware de role.
- Compreender machine result, override e freeze.
- Conhecer updates condicionais MongoDB.

### Erros comuns

- Carregar todas as fotografias na listagem.
- Guardar a revisão por cima do resultado OpenAI.
- Permitir ajustes numa decisão `approved`.
- Aceitar decisão sem verificar estado pendente.
- Manter grant de fotografia ativo depois da decisão.
- Criar nova UI/revisão separada para cada recomendação.

### Check de compreensao

- Porque é que o acesso textual e o acesso às fotografias são separados?
- O que acontece à segunda decisão concorrente?
- Como se preserva a versão OpenAI depois de um ajuste?
- Porque é que um esclarecimento cria nova revisão do relatório?

### Tempo estimado

`S` — endpoints, CAS, audit log e duas perspetivas de UI.

## Bloco operacional

### Entrada

- Relatório draft pertencente ao cliente.
- Pedido opcional de revisão.
- Decisão de consultor autenticado.

### Saída

- Versão IA aprovada ou `humanOverride` validado.
- Audit log append-only.
- Grant expirado/revogado no fim.
- Relatório pronto para freeze ou conversa reaberta.

### Passos

Executar cenarios negativos obrigatorios (minimo 1).

#### Passo 1 - Apresentar a escolha ao cliente

Na página do relatório, mostra duas ações explícitas. Não cria revisão automaticamente. Enquanto `review_pending`, desativa finalize e unlock.

#### Passo 2 - Criar o pedido e o grant opcional

O pedido aceita autorização separada para fotografias. O backend cria o grant por relatório/revisão com expiração máxima de sete dias. Retirar o pedido revoga o grant.

#### Passo 3 - Listar revisões sem fotografias

A fila mostra objetivos, data, estado e metadata necessária. Abrir o detalhe não faz fetch automático de imagens.

#### Passo 4 - Servir fotografia sob pedido

O endpoint valida role, revisão, grant, vista e expiração; descifra apenas para a resposta e envia `no-store`. Regista o acesso antes/depois conforme a política de audit log.

#### Passo 5 - Validar decisões

`approved` não aceita campos de ajuste. `adjusted` exige recommendation IDs válidos e, se ajustar rotina, exige título, período, motivo, instruções e até cinco cautelas. `needs_clarification` exige nota pública clara.

```js
const updated = await AiConsultationReview.findOneAndUpdate(
    { _id: reviewId, status: "pending" },
    { $set: decisionPatch },
    { new: true },
);
if (!updated) throw new AppError(409, "Revisão já decidida");
```

#### Passo 6 - Aplicar ajuste sem apagar machineResult

Cria `humanOverride` e valida novamente catálogo, variantes, alergias, stock e rotina. Se o ajuste remover todas as variantes de maquilhagem, desativa a simulação em vez de manter um `simulationSpec` impossível.

#### Passo 7 - Tratar esclarecimento

Marca a revisão anterior, reabre `asking_questions` e apresenta uma pergunta ativa ao cliente. A resposta gera nova versão do relatório e uma revisão sucessora pendente, com grant renovado apenas se autorizado.

#### Passo 8 - Fechar o lifecycle

Ao aprovar, ajustar, cancelar ou expirar, revoga o grant. Atualiza o relatório para permitir freeze. Todas as leituras e decisões relevantes ficam no audit log append-only.

### Cenarios negativos recomendados

- Cliente tenta abrir fila de consultor: `403`.
- Consultor tenta fotografia sem grant/expirada: `403`/`404` e audit log adequado.
- Segunda decisão concorrente: `409`.
- `approved` com campos ajustados: `400`.
- Ajuste com produto/variante inválidos: rejeitar.
- Ajuste de rotina sem instruções/cautelas: `400`.
- Pedido retirado antes da decisão: freeze volta a ficar disponível e grant é revogado.
- Clarification respondida: relatório sucessor e revisão sucessora, sem sobrescrever o anterior.

### Validacao

- [ ] Negativos: minimo 1 cenarios materiais executados.
- Gate documental: falhar se `negativos < 1`.
- Testes de roles e ownership.
- Testes de grant, expiração, revogação e `no-store`.
- Teste CAS com duas decisões.
- Testes de validators por decisão.
- Teste de clarification end-to-end.
- Teste de imutabilidade do `machineResult`.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | fotografia sem grant | bytes não são servidos |
| P0 | decisões concorrentes | primeira vence, segunda `409` |
| P0 | ajuste inválido | relatório não é alterado |
| P1 | pedido retirado | revisão cancelada e freeze permitido |
| P1 | clarification | nova versão + revisão sucessora |
| P1 | decisão final | grant revogado e audit log criado |

### Evidencia de testes por camada

- Unit: validators e transições de decisão.
- Integração: CAS, grants, audit log e revisão sucessora.
- Frontend/E2E: escolha do cliente, fila do consultor e clarification.
- Segurança: roles, ownership e imagens `no-store`.

### Handoff

Depois da revisão, `BK-MF1-07` congela a versão final. `BK-MF2-07` só pode criar edição de maquilhagem a partir dessa versão congelada e desbloqueada.

## Expected results

- Revisão é opcional e nunca bloqueia permanentemente.
- Machine result permanece intacto.
- Ajustes humanos passam pelos mesmos validadores.
- Fotografias têm consentimento/grant temporário e acessos auditados.
- Concorrência e esclarecimentos produzem versões coerentes.

## Snippet tecnico aplicavel

O CAS do Passo 5 é o núcleo de concorrência. A implementação final também usa sessão/transação para atualizar review, report, grants e audit log de forma coerente.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 1.
- Uma revisão opcional por relatório.
- Roles e ownership aplicados no backend.
- Fotografias não carregam por defeito e usam endpoint `no-store`.
- Grant expira/revoga no lifecycle definido.
- Segunda decisão recebe `409`.
- `machineResult` nunca é sobrescrito.
- Ajustes de produtos/rotina são revalidados.
- Clarification cria nova versão e revisão sucessora.
- Pagamento fica indisponível enquanto a revisão está pendente.

## Validação final

Executa testes unitários, integração MongoDB/CAS, frontend cliente/consultor, E2E de clarification e auditoria de acessos.

## Evidence para PR/defesa

- Audit log sanitizado de listagem/detalhe/fotografia/decisão.
- Prova de `409` concorrente.
- Machine result e human override lado a lado sem dados reais.
- Grant expirado/revogado sem fotografias na evidência.

## Handoff

A edição de maquilhagem usa apenas o relatório final congelado. Uma revisão antiga ou pendente nunca pode originar uma simulação.

## Changelog

- `2026-06-08`: guia inicial de revisão de recomendações.
- `2026-07-10`: reforço de auditoria e decisão concorrente.
- `2026-07-11`: revisão opcional por relatório, grants temporários, clarification e separação machine result/human override.
