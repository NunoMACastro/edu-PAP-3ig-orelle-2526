# BK-MF8-13 - Interface integrada cliente/consultor para consulta assistida.

## Header
- `doc_id`: `GUIA-BK-MF8-13`
- `bk_id`: `BK-MF8-13`
- `macro`: `MF8`
- `owner`: `Aline`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF8-08, BK-MF8-09, BK-MF8-10, BK-MF8-11, BK-MF8-12`
- `rf_rnf`: `RF42, RF45, RF46, RNF26`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF8-14`
- `guia_path`: `docs/planificacao/guias-bk/MF8/BK-MF8-13-interface-integrada-cliente-consultor-para-consulta-assistida.md`
- `last_updated`: `2026-06-30`

## Contexto do BK
- Entrega alvo: integrar páginas cliente/consultor em `App.jsx`, ligar role gates e garantir estados vazios, loading, erro, sucesso e layout responsivo.
- Foco tecnico da macro: interface operacional completa antes do polimento visual final em `BK-MF8-14`.
- Regra de governanca: este BK integra fluxos já implementados; o polimento fino do mockup fica no BK seguinte.

## Bloco pedagogico
### Objetivo
O aluno deve unir as páginas e componentes criados nos BKs 08-12 numa experiência utilizável. O resultado observável é o cliente conseguir fazer consulta guiada, ver histórico/recomendações/insights, e o consultor conseguir rever sessões no painel adequado.

### Pre-requisitos
- Rever `RF42`, `RF45`, `RF46` e `RNF26`.
- Confirmar entregas de `BK-MF8-08` a `BK-MF8-12`.
- Confirmar rotas e role gates existentes no frontend.

### Erros comuns
- Criar componentes soltos sem rotas reais no `App.jsx`.
- Não separar role cliente de role consultor/administrador.
- Falhar estados vazios, loading, erro ou sucesso em ecrãs críticos.

### Check de compreensao
- [ ] Sei mapear rotas cliente e consultor.
- [ ] Sei testar role gate e navegação responsiva.
- [ ] Sei explicar o que fica para o polimento visual do BK seguinte.

### Tempo estimado
- `Core`: `60-90 min`.
- `Reforco`: `+20-40 min` para BK `P0`.

## Bloco operacional
### Entrada
- BK: `BK-MF8-13`
- Requisito: `RF42, RF45, RF46, RNF26`
- Dependencias: `BK-MF8-08, BK-MF8-09, BK-MF8-10, BK-MF8-11, BK-MF8-12`
- Ficheiros alvo: `real_dev/web/src/App.jsx`, páginas cliente, páginas consultor, cliente API e guards de role
- Artefactos: `MATRIZ-CANONICA-BK.md`, `BACKLOG-MVP.md`, `ANEXO-RF-PARA-BKS.md`, `ANEXO-RNF-PARA-BKS.md`

### Passos
1. Confirmar no backlog e na matriz o contexto do `BK-MF8-13` e dos requisitos `RF42, RF45, RF46, RNF26`.
2. Mapear rotas cliente para wizard, histórico, detalhe, recomendações e insight/correção.
3. Mapear rotas consultor/admin para fila, detalhe e submissão de revisão.
4. Integrar as rotas em `App.jsx` com guards de autenticação e role.
5. Consolidar cliente API frontend para endpoints criados nos BKs 08-12.
6. Criar estados vazios, loading, erro, sucesso e retry nos ecrãs principais.
7. Validar layout responsivo base sem fazer ainda o polimento visual completo do mockup.
8. Executar cenarios negativos obrigatorios (minimo 3) e registar o resultado.
9. Reexecutar smoke end-to-end cliente/consultor e guardar screenshots.

### Cenarios negativos recomendados
- cliente tenta abrir rota consultor
- consultor tenta abrir detalhe de cliente sem permissões/DTO correto
- falha de API mostra erro recuperável sem quebrar a navegação

### Validacao
- [ ] Smoke: cliente completa consulta e consultor revê sessão.
- [ ] Negativos: minimo `3` cenarios com resultado controlado.
- [ ] UX: vazio, loading, erro, sucesso e layout responsivo existem.
- [ ] Evidence: screenshots desktop/mobile e rotas protegidas.

### Matriz minima de testes por prioridade
- `P0`: unit + integration + e2e + 3 negativos.
- `P1`: unit/integration + 2 negativos.
- `P2`: teste focal + 1 negativo.

### Handoff
- Proximo BK recomendado: `BK-MF8-14`
- Entrega interface funcional integrada para aproximação visual ao mockup.

## Snippet tecnico aplicavel
**Contrato de integração UI (`BK-MF8-13` / `RF42, RF45, RF46, RNF26`)**

```js
const BK_ID = 'BK-MF8-13';
const REQUIRED_ROUTES = ['clienteWizard', 'clienteHistorico', 'consultorFila', 'consultorRevisao'];

export function validarInterfaceAssistida(evidence) {
  const rotas = Array.isArray(evidence?.rotas) ? evidence.rotas : [];
  const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;

  if (evidence?.bkId !== BK_ID || !REQUIRED_ROUTES.every((rota) => rotas.includes(rota))) {
    throw new Error('Interface assistida sem rotas essenciais');
  }

  if (!evidence.estadosUi?.loading || !evidence.estadosUi?.erro || !evidence.estadosUi?.vazio) {
    throw new Error('Estados UI obrigatorios em falta');
  }

  if (negativos < 3) {
    throw new Error('Cenarios negativos abaixo do minimo P0');
  }

  return { bkId: BK_ID, estado: 'validado', dominio: 'interface cliente consultor' };
}
```

## Checklist tecnico especifico
- rotas integradas no `App.jsx`
- role gates cliente/consultor/admin
- estados de UI completos
- screenshots desktop/mobile antes do polimento final

## Criterios de aceite
- Cliente e consultor têm páginas integradas para consulta assistida.
- Rotas têm autenticação, role gates e feedback claro.
- Cenarios negativos concluidos: minimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Evidence pronta para revisão técnica e defesa PAP.

## Evidence para PR/defesa
- `pr`: referência de commit/PR e resumo técnico.
- `proof_tecnico`: screenshots e smoke cliente/consultor.
- `proof_negativos`: rota consultor bloqueada, DTO/permissão inválida e falha API recuperável.
- `proof_negocio`: fluxo assistido fica pronto para polimento visual e testes finais.

## Proximo BK recomendado
`BK-MF8-14`

## Changelog
- `2026-06-30`: guia criado para interface integrada da consulta assistida.
