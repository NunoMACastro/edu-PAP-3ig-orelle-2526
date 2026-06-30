# BK-MF8-08 - Sessão guiada de avaliação cosmética com IA.

## Header
- `doc_id`: `GUIA-BK-MF8-08`
- `bk_id`: `BK-MF8-08`
- `macro`: `MF8`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF1-06, BK-MF1-07, BK-MF7-01`
- `rf_rnf`: `RF42`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-09`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-08-sessao-guiada-de-avaliacao-cosmetica-com-ia.md`
- `last_updated`: `2026-06-30`

## Contexto do BK
- Entrega alvo: implementar uma sessão guiada v1, baseada em script versionado de perguntas cosméticas, para enriquecer a avaliação IA antes/depois da análise facial.
- Foco tecnico da macro: consulta IA assistida, privacidade, recomendações reais e fecho por testes.
- Regra de governanca: a sessão guarda respostas estruturadas e estado do fluxo, mas não guarda fotografias nem prompts internos completos.

## Bloco pedagogico
### Objetivo
O aluno deve construir o fluxo inicial de consulta IA guiada: criação da sessão, obtenção do script, registo de respostas e conclusão controlada. O resultado observável é um wizard cliente que recolhe objetivos, sensibilidade, rotina atual, preferências e restrições antes de passar dados minimizados para os BKs seguintes.

### Pre-requisitos
- Rever `RF42` em `docs/RF.md`.
- Confirmar `BK-MF1-06`, `BK-MF1-07` e `BK-MF7-01`.
- Validar ownership por `userId`, sessão autenticada e consentimento facial quando a sessão for associada à análise.

### Erros comuns
- Tratar a consulta como chat livre sem script versionado.
- Guardar fotografias, storage keys, consent IDs ou prompts internos na sessão.
- Permitir completar a sessão sem respostas obrigatórias ou sem ownership.

### Check de compreensao
- [ ] Sei explicar a diferença entre script guiado e chat generativo livre.
- [ ] Sei indicar que dados entram, que dados ficam minimizados e que dados ficam fora da sessão.
- [ ] Sei testar criação, respostas, conclusão e acesso cruzado bloqueado.

### Tempo estimado
- `Core`: `60-90 min`.
- `Reforco`: `+20-40 min` para BK `P0`.

## Bloco operacional
### Entrada
- BK: `BK-MF8-08`
- Requisito: `RF42`
- Dependencias: `BK-MF1-06, BK-MF1-07, BK-MF7-01`
- Endpoints alvo: `POST /api/ai-consultations`, `GET /api/me/ai-consultations/:id`, `POST /api/ai-consultations/:id/answers`, `POST /api/ai-consultations/:id/complete`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `ANEXO-RF-PARA-BKS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-08` e do requisito `RF42`.
2. Definir o script versionado de perguntas cosméticas com campos obrigatórios, opcionais e tipos permitidos.
3. Criar modelo/coleção de sessão IA com `userId`, `scriptVersion`, `status`, `privacyStatus`, timestamps e respostas minimizadas.
4. Implementar `POST /api/ai-consultations` com autenticação, ownership e estado inicial `draft`.
5. Implementar `GET /api/me/ai-consultations/:id` devolvendo apenas DTO seguro do próprio cliente.
6. Implementar `POST /api/ai-consultations/:id/answers` com validação de pergunta, tipo, obrigatoriedade e normalização da resposta.
7. Implementar `POST /api/ai-consultations/:id/complete` bloqueando sessão incompleta, sessão de outro utilizador e sessão já fechada.
8. Construir wizard cliente em `real_dev/web` com estados de loading, erro, progresso, guardar resposta e conclusão.
9. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
10. Reexecutar testes afetados e guardar evidence de request/response e screenshot do wizard.

### Cenarios negativos recomendados
- cliente tenta consultar sessão de outro `userId`
- resposta enviada para pergunta inexistente ou tipo inválido
- conclusão recusada quando faltam perguntas obrigatórias

### Validacao
- [ ] Smoke: cliente cria sessão, responde ao script e conclui a avaliação.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Privacidade: DTO não expõe fotografias, storage keys, consent IDs nem prompts internos.
- [ ] Evidence: request/response, teste e screenshot do wizard registados.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF8-09`
- Entrega sessão estruturada e respostas minimizadas para persistência segura do histórico cliente-IA.

## Snippet tecnico aplicavel
**Contrato de evidence para sessão guiada (`BK-MF8-08` / `RF42`)**

```js
const BK_ID = 'BK-MF8-08';
const REQ_ID = 'RF42';

export function validarEvidenceSessaoGuiada(evidence) {
  if (!evidence || evidence.bkId !== BK_ID || evidence.requisito !== REQ_ID) {
    throw new Error('Evidence fora do contrato da sessao guiada');
  }

  const endpoints = Array.isArray(evidence.endpoints) ? evidence.endpoints : [];
  const negativos = Array.isArray(evidence.negativos) ? evidence.negativos.length : 0;

  if (!endpoints.includes('POST /api/ai-consultations')) {
    throw new Error('Criacao de sessao nao comprovada');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo P0');
  }

  return { bkId: BK_ID, requisito: REQ_ID, estado: 'validado', dominio: 'consulta IA guiada' };
}
```

## Checklist tecnico especifico
- script de perguntas versionado e testável
- sessão associada ao `userId` autenticado
- wizard não avança sem respostas obrigatórias
- DTO seguro sem imagens, storage interno ou prompts completos

## Criterios de aceite
- Cliente consegue iniciar, responder e completar uma sessão guiada associada à própria conta.
- Endpoints de criação, leitura, respostas e conclusão existem com autenticação e ownership.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referência de commit/PR e resumo técnico.
- `proof_tecnico`: request/response dos quatro endpoints e screenshot do wizard.
- `proof_negativos`: acesso cruzado, resposta inválida e conclusão incompleta.
- `proof_privacidade`: DTO seguro sem fotografias, storage keys, consent IDs ou prompts internos.

## Proximo BK recomendado
`BK-MF8-09`

## Changelog
- `2026-06-30`: guia criado para inserir a consulta IA guiada na sequência MF8.
