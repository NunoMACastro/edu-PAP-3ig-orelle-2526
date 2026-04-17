# GUIAO-DOCENTE-SEMANAL

## Header
- `doc_id`: `GUIAO-DOCENTE-SEMANAL`
- `path`: `docs/planificacao/sprints/GUIAO-DOCENTE-SEMANAL.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-17`

## Objetivo
Fornecer guiao pratico de intervencao docente por sprint, com foco em risco, carga realista e consistencia documental.

## Ritual semanal obrigatorio
1. Segunda-feira (planeamento): validar BKs da semana, carga real e riscos iniciais.
2. Quarta-feira (checkpoint): medir progresso real e tratar bloqueios >48h.
3. Sexta-feira (fecho/retro): validar evidence, consolidar scorecard e definir acao corretiva.

## Matriz de intervencao por carga
| Estado de carga da sprint | Sinal | Intervencao docente |
| --- | --- | --- |
| Dentro da meta (`desvio_u <= 2`) | Entrega estavel | Manter ritmo e validar qualidade dos negativos/evidence. |
| Pressao moderada (`desvio_u = 3..4`) | Acumulo de tarefas | Reduzir paralelismo e reforcar `Core` prioritario. |
| Sobrecarga (`desvio_u >= 5`) | Risco de quebra de rastreabilidade | Congelar `Reforco` e abrir decisao do orientador. |

## Checkpoints de risco por perfil
| Perfil | Sinais de risco | Intervencao docente |
| --- | --- | --- |
| Aluno forte | WIP excessivo em paralelo | Limitar trabalho em curso e reforcar handoff objetivo. |
| Aluno intermadio | Entrega parcial sem negativos/evidence | Aplicar checklist guiada e validar primeiro negativo em conjunto. |
| Aluno em risco | Bloqueio >48h e baixa compreensao | Dividir BK em micro-passos e aplicar pairing orientado. |

## Gate pedagogico entre sprints
- Sem `Core` concluido na sprint `N`, o aluno nao inicia `Reforco` na sprint `N+1`.
- Excecoes apenas com justificacao no scorecard e aprovacao do orientador.

## Evidencias minimas por semana
- 1 `proof` funcional por BK ativo.
- 1 `neg` validado por BK ativo.
- 1 registo de risco/acao corretiva por sprint no scorecard.

## Script de revisao rapida (15 min)
1. Confirmar `carga_real_u` vs `carga_planeada_u` no scorecard.
2. Auditar 1 BK `P0` e 1 BK `P1/P2` (bloco pedagogico + operacional).
3. Verificar snippet tecnico concreto e aplicavel.
4. Registar decisao docente e proxima acao.

## Changelog
- `2026-04-14`: guiao docente criado para alinhamento de governanca semanal.
- `2026-04-17`: guião alinhado com a nova distribuição de carga após corte de escopo.
