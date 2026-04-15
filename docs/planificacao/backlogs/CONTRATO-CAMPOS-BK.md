# CONTRATO-CAMPOS-BK

## Header
- `doc_id`: `CONTRATO-CAMPOS-BK`
- `path`: `docs/planificacao/backlogs/CONTRATO-CAMPOS-BK.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-14`

## Objetivo
Definir o contrato deterministico de campos BK para impedir drift entre matriz, backlog, sprints, guias e auditoria.

## Campos obrigatorios
| campo | descricao | status | regra |
| --- | --- | --- | --- |
| bk_id | ID unico do BK (formato BK-MF*-NN) | Obrigatorio | Imutavel apos publicacao |
| macro | Macrofase oficial (MF0..MF8) | Obrigatorio | Tem de coincidir com matriz/backlog |
| owner | Responsavel principal | Obrigatorio | Unico por BK |
| apoio | Responsavel secundario | Obrigatorio | Pode ser `-` apenas com justificacao |
| prioridade | P0/P1/P2 | Obrigatorio | Define modo Core/Reforco |
| estado | TODO/IN_PROGRESS/BLOCKED/DONE | Obrigatorio | Atualizado em cada sprint |
| esforco | S/M/L | Obrigatorio | Conversao oficial: S=1, M=2, L=3 |
| dependencias | BKs predecessores ou `-` | Obrigatorio | Nao pode referir BK inexistente |
| rf_rnf | Requisito RFxx ou RNFxx | Obrigatorio | Sem requisito orfao |
| fase_documental | Fase 1/2/3 | Obrigatorio | Consistente com macro |
| sprint | Janela temporal da execucao | Obrigatorio | Coerente com PLANO-SPRINTS |
| core_or_reforco | Core/Reforco | Obrigatorio | `P0=>Reforco`, `P1/P2=>Core` |
| proximo_bk | Handoff canónico | Obrigatorio | BK terminal usa `-` |
| guia_path | Path absoluto no repositório | Obrigatorio | Tem de existir e apontar para o ficheiro real |
| last_updated | Data ISO de ultima revisao | Obrigatorio | Mesma data da vaga documental |

## Regras de consistencia
1. `bk_id` e imutavel em todos os artefactos.
2. `owner`, `prioridade`, `dependencias` e `rf_rnf` devem coincidir em backlog, matriz e guia.
3. `sprint`, `core_or_reforco` e `guia_path` devem estar presentes em 100% dos guias.
4. `proximo_bk` deve ser valido; BK terminal usa obrigatoriamente `-`.

## Changelog
- `2026-04-14`: contrato criado para alinhamento canónico transversal.
