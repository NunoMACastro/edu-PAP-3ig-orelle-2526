# Distribuição de Responsabilidades

## Header
- `doc_id`: `DISTRIBUICAO-RESPONSABILIDADES`
- `path`: `docs/planificacao/DISTRIBUICAO-RESPONSABILIDADES.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-12`

## Equipa e carga alvo
| Pessoa | Papel principal | Carga alvo BK | Tipo de BK preferencial |
| :-- | :-- | :-- | :-- |
| Bruna | Engenharia core (backend/IA/segurança) | 12-14 BK | P0 e integrações críticas |
| Izelicks | Implementação funcional e integração | 10-12 BK | P0/P1 backend+frontend |
| Aline | Planeamento, UX, validação e coordenação | 8-10 BK | UX, governance, documentação e operação |
| Daniel Bulica | Execução guiada, QA e tarefas de menor risco | 6-8 BK | P1/P2, checklist, testes e handoff |
| Nuno (orientador) | Governance e decisão final | N/A | Gate de qualidade e sequência macro |

## Regras principais
- Cada BK tem exatamente um owner e um apoio.
- O apoio não substitui ownership; apoia revisão técnica e desbloqueio.
- Sem alteração de estado operacional de BK sem pedido explícito.
- Dependências e próximo BK devem bater certo entre backlog e guia.
- Se faltar detalhe técnico: `a definir no BK dependente`.
- Entregas devem incluir evidence mínima (`pr`, `proof`, `neg`).

## Matriz por área
| Área | Responsável primário | Responsável secundário |
| :-- | :-- | :-- |
| Segurança e autenticação | Bruna | Izelicks |
| IA e diagnóstico | Bruna | Izelicks |
| Catálogo e commerce | Izelicks | Bruna |
| UX, conteúdo e operação | Aline | Izelicks |
| QA funcional e negativos | Daniel Bulica | Aline |
| Governance macro e aceitação | Nuno | Aline |

## Matriz por artefacto
| Artefacto | Owner documental |
| :-- | :-- |
| `PLANO-IMPLEMENTACAO-TOTAL.md` | Nuno |
| `DISTRIBUICAO-RESPONSABILIDADES.md` | Nuno |
| `backlogs/BACKLOG-MVP.md` | Aline |
| `backlogs/MF-VIEWS.md` | Aline |
| `sprints/PLANO-SPRINTS.md` | Aline |
| `guias-bk/*` | Owner de cada BK |

## Cerimónias
- Planeamento semanal (45 min): validar prioridades e capacidade por sprint.
- Standup técnico (15 min, 3x por semana): bloqueios e dependências.
- Revisão de BK (30 min): confirmar critérios de aceite e evidence.
- Retro curta (20 min): atualizar regras de execução e riscos.

## Fluxo de atribuição e fecho de BK
1. Confirmar BK no backlog, dependências e owner/apoio.
2. Ler guia BK e validar scope/scope-out antes de implementar.
3. Executar com smoke + negativos + validação técnica.
4. Registar evidence (`pr`, `proof`, `neg`) no guia BK.
5. Fechar BK documentalmente e preparar handoff para próximo BK.
6. Sincronizar backlog, MF-VIEWS e guias no mesmo ciclo.

## Papel do orientador
- Confirmar que sequência macro respeita RF/RNF e precedência documental.
- Intervir em conflitos de prioridade e desbloqueio entre BKs críticos.
- Aprovar conclusão de macro após validação dos gates de saída.
- Garantir que a documentação continua replicável para outras turmas.

## Changelog
- **2026-04-12** - Matriz de responsabilidades e governance criada.
