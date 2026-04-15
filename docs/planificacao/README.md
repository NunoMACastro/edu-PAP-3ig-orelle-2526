# Planificacao PAP - Orelle

## Header
- `doc_id`: `PLANIFICACAO-README`
- `path`: `docs/planificacao/README.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-04-14`

## Objetivo
Centralizar a planificacao executavel da Orelle com contrato canónico alinhado com FaithFlix e OPSA, mantendo a identidade funcional do dominio cosmetico.

## Hierarquia de verdade (obrigatoria)
`MATRIZ-CANONICA-BK` > `BACKLOG-MVP` > `PLANO-SPRINTS` > `MF-VIEWS` > `guias-bk/*`.

## Contrato canonico comum (Orelle + FaithFlix + OPSA)
- Scorecard fixo: `Cobertura/rastreabilidade=25`, `Coerencia documental=20`, `Pedagogia/guidance/step-by-step=25`, `Adequacao ao 12o=20`, `Governanca/avaliacao=10`.
- Header obrigatorio por guia BK:
`doc_id`, `bk_id`, `macro`, `owner`, `apoio`, `prioridade`, `estado`, `esforco`, `dependencias`, `rf_rnf`, `fase_documental`, `sprint`, `core_or_reforco`, `proximo_bk`, `guia_path`, `last_updated`.
- Regra de modo: `P0 => Reforco`; `P1/P2 => Core`.
- Regra de rastreabilidade: cobertura `RF+RNF` sem orfaos em matriz e backlog.

## Regra de atualizacao em cadeia
Qualquer alteracao de RF/RNF/BK exige atualizar no mesmo ciclo:
1. `backlogs/MATRIZ-CANONICA-BK.md`
2. `backlogs/BACKLOG-MVP.md`
3. `backlogs/ANEXO-*.md`
4. guia BK impactado
5. `sprints/PLANO-SPRINTS.md` e scorecard, quando houver impacto temporal
6. `sprints/SCORECARD-SPRINTS.md` e `sprints/GUIAO-DOCENTE-SEMANAL.md`

## Estrutura
- `PLANO-IMPLEMENTACAO-TOTAL.md`
- `DISTRIBUICAO-RESPONSABILIDADES.md`
- `backlogs/MATRIZ-CANONICA-BK.md`
- `backlogs/BACKLOG-MVP.md`
- `backlogs/MF-VIEWS.md`
- `backlogs/CONTRATO-CAMPOS-BK.md`
- `backlogs/ANEXO-RF-PARA-BKS.md`
- `backlogs/ANEXO-RNF-PARA-BKS.md`
- `backlogs/ANEXO-BK-SPRINT-OWNER.md`
- `sprints/PLANO-SPRINTS.md`
- `sprints/SCORECARD-SPRINTS.md`
- `sprints/GUIAO-DOCENTE-SEMANAL.md`
- `guias-bk/README.md`
- `guias-bk/_TEMPLATE-BK.md`
- `guias-bk/ROADMAP-BKS-RESTANTES.md`
- `guias-bk/MAPA-MIGRACAO-LEGACY-PARA-CANONICO.md`
- `scripts/auditar_planificacao.py`

## Meta documental desta vaga
- Alinhar estrutura/layout com as restantes PAPs sem alterar IDs BK nem total de BK.
- Fechar gaps de governanca (scorecard, guiao docente, gates, anexos e contrato de campos).
- Garantir auditoria automatica em `PASS` e score final `>=93/100`.

## Resumo de cobertura
- Total RF: **44**
- Total RNF: **25**
- Total BK: **69**
- Total guias BK: **69**
- Cobertura BK<->guia: **100% (1:1)**

## Changelog
- `2026-04-12`: baseline inicial da normalizacao Orelle.
- `2026-04-14`: alinhamento canónico com FaithFlix/OPSA (governanca, naming semantico, scorecard e auditoria automatica).
