# BK-MF8-10 - Recomendações enriquecidas com respostas da avaliação guiada.

## Header
- `doc_id`: `GUIA-BK-MF8-10`
- `bk_id`: `BK-MF8-10`
- `macro`: `MF8`
- `owner`: `Izelicks`
- `apoio`: `Aline`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF2-02, BK-MF4-08, BK-MF8-09`
- `rf_rnf`: `RF43, RNF23`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-11`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-10-recomendacoes-enriquecidas-com-respostas-da-avaliacao-guiada.md`
- `last_updated`: `2026-06-30`

## Contexto do BK
- Entrega alvo: ligar `consultationSessionId` às recomendações e enriquecer ranking com respostas guiadas, restrições e catálogo real com stock.
- Foco tecnico da macro: recomendações explicáveis, seguras e alinhadas com produtos reais da loja online.
- Regra de governanca: recomendações antigas sem sessão continuam compatíveis; quando existe sessão, ela melhora ranking e explicação.

## Bloco pedagogico
### Objetivo
O aluno deve adaptar o motor de recomendação para usar análise, relatório, histórico, respostas guiadas, alergias/restrições e produtos reais com stock. O resultado observável é uma recomendação mais contextual e com motivos rastreáveis.

### Pre-requisitos
- Rever `RF43` em `docs/RF.md` e `RNF23` em `docs/RNF.md`.
- Confirmar recomendações base de `BK-MF2-02`.
- Confirmar restrições/alergias de `BK-MF4-08` e histórico seguro de `BK-MF8-09`.

### Erros comuns
- Recomendar produtos inexistentes, sem stock ou fora do catálogo.
- Quebrar recomendações antigas quando `consultationSessionId` não existe.
- Usar respostas livres sem normalização ou sem motivo explicável.

### Check de compreensao
- [ ] Sei explicar como respostas guiadas influenciam ranking.
- [ ] Sei garantir compatibilidade com recomendações antigas.
- [ ] Sei testar stock, restrições e explicabilidade.

### Tempo estimado
- `Core`: `60-90 min`.
- `Reforco`: `+20-40 min` para BK `P0`.

## Bloco operacional
### Entrada
- BK: `BK-MF8-10`
- Requisito: `RF43, RNF23`
- Dependencias: `BK-MF2-02, BK-MF4-08, BK-MF8-09`
- Endpoints alvo: extensão de recomendações com `consultationSessionId`
- Artefactos: `MATRIZ-CANONICA-BK.md`, `ANEXO-RF-PARA-BKS.md`, `ANEXO-RNF-PARA-BKS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-10` e dos requisitos `RF43, RNF23`.
2. Definir contrato opcional `consultationSessionId` nos pedidos/serviços de recomendação.
3. Carregar respostas minimizadas do histórico seguro com ownership do cliente.
4. Normalizar objetivos, sensibilidade, rotina atual, textura/preço preferido e alergias/restrições.
5. Filtrar catálogo real por produto ativo, stock disponível e restrições médicas leves/alergias.
6. Ajustar ranking com pesos documentados e motivos explicáveis por produto.
7. Manter fallback para recomendações antigas sem sessão guiada.
8. Atualizar UI para mostrar recomendações enriquecidas e motivo ajustado.
9. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
10. Reexecutar testes de recomendação, catálogo, restrições e explicabilidade.

### Cenarios negativos recomendados
- `consultationSessionId` pertence a outro utilizador
- todas as opções violam alergias/restrições e a resposta fica controlada
- produto sem stock não aparece nas recomendações

### Validacao
- [ ] Smoke: recomendação usa sessão guiada e mostra motivos.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] Compatibilidade: fluxo antigo sem `consultationSessionId` continua válido.
- [ ] Evidence: ranking, filtros e motivos documentados.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF8-11`
- Entrega recomendações enriquecidas e explicações para revisão humana por consultores.

## Snippet tecnico aplicavel
**Contrato de recomendação enriquecida (`BK-MF8-10` / `RF43, RNF23`)**

```js
const BK_ID = 'BK-MF8-10';
const REQUIRED_REQS = ['RF43', 'RNF23'];

export function validarRecomendacaoEnriquecida(evidence) {
  const requisitos = Array.isArray(evidence?.requisitos) ? evidence.requisitos : [];
  const produtos = Array.isArray(evidence?.produtos) ? evidence.produtos : [];
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID || !REQUIRED_REQS.every((req) => requisitos.includes(req))) {
    throw new Error('Recomendacao sem rastreabilidade obrigatoria');
  }

  if (produtos.some((produto) => produto.stock <= 0 || !produto.explicacao)) {
    throw new Error('Produto recomendado sem stock ou sem explicacao');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo P0');
  }

  return { bkId: BK_ID, estado: 'validado', dominio: 'ranking enriquecido' };
}
```

## Checklist tecnico especifico
- `consultationSessionId` opcional e autorizado
- ranking considera respostas guiadas e restrições
- recomendações usam produtos reais com stock
- motivos continuam compatíveis com `RNF23`

## Criterios de aceite
- Recomendações com sessão usam respostas guiadas, relatório, histórico, restrições e catálogo real.
- Recomendações sem sessão continuam a funcionar.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referência de commit/PR e resumo técnico.
- `proof_tecnico`: payload com `consultationSessionId`, ranking e explicações.
- `proof_negativos`: sessão cruzada, sem stock e restrição bloqueada.
- `proof_negocio`: recomendação aponta para produto real e disponível na loja.

## Proximo BK recomendado
`BK-MF8-11`

## Changelog
- `2026-06-30`: guia criado para recomendações enriquecidas com avaliação guiada.
