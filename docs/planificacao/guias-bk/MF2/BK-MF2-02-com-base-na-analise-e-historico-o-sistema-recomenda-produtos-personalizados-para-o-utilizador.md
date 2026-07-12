# BK-MF2-02 - Gerar no relatório recomendações de produtos/variantes validados

## Header

- `doc_id`: `GUIA-BK-MF2-02`
- `bk_id`: `BK-MF2-02`
- `macro`: `MF2`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `DONE`
- `esforco`: `M`
- `dependencias`: `BK-MF1-06, BK-MF1-07`
- `rf_rnf`: `RF18`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF2-03`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-02-com-base-na-analise-e-historico-o-sistema-recomenda-produtos-personalizados-para-o-utilizador.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico:** as recomendações são geradas dentro do relatório v2. Não existe uma segunda geração direta de recomendações. O backend cria uma allowlist curta de produtos/variantes; a OpenAI só pode selecionar IDs dessa lista; o backend volta a validar tudo antes de persistir snapshots imutáveis.

## Contexto do BK

A OpenAI é boa a relacionar objetivos, fotografias e respostas, mas não é a fonte de verdade do catálogo. Stock, preços, variantes, alergias, ingredientes e elegibilidade continuam sob controlo da aplicação.

## Objetivo

Integrar no job `generate_report` entre três e cinco recomendações reais, com variantes quando aplicável, validação de restrições e snapshots históricos.

## Importância

Sem allowlist e validação posterior, um modelo pode inventar IDs, recomendar produto incompatível ou usar preço/stock desatualizado. A arquitetura deste BK limita a IA ao que ela deve fazer: escolher e explicar entre candidatos já autorizados.

## Scope-in

- Evoluir o catálogo com metadata de IA sem apagar produtos existentes.
- Filtrar por objetivos, pele, alergias, ingredientes, orçamento e elegibilidade.
- Suportar variantes opcionais e stock por variante.
- Enviar no máximo 15 candidatos minimizados à OpenAI.
- Exigir 3–5 recomendações quando o catálogo e orçamento permitem.
- Permitir cobertura limitada de 1–2 produtos com limitação explícita.
- Permitir produtos sem stock, identificados e sem CTA de compra.
- Persistir snapshots de produto/variante por relatório e revisão.
- Usar `productId + variantId` como identidade no carrinho/encomenda quando existe variante.

## Scope-out

- Não enviar o catálogo completo nem dados administrativos à OpenAI.
- Não permitir que a OpenAI altere stock, preço ou metadata.
- Não aceitar IDs fora da allowlist.
- Não recomendar produto `aiEligible=false`.
- Não recalcular recomendações ao abrir o relatório/histórico.
- Não pedir ObjectIds ao utilizador.

## Pré-requisitos

- Relatório v2 e job `generate_report` de `BK-MF1-07`.
- Catálogo existente preservado por invariantes de ID/contagem/stock.
- Perfil com alergias/restrições confirmado.
- Metadata curada nos produtos elegíveis.

## Glossário

- **`aiEligible`:** marca administrativa que permite a um produto entrar na pré-seleção.
- **INCI normalizado:** lista de ingredientes preparada para comparação consistente.
- **Variante:** opção concreta de cor, undertone, acabamento ou cobertura com stock próprio.
- **Candidate DTO:** projeção mínima enviada à OpenAI.
- **Snapshot:** nome, preço, variante e disponibilidade fixados no relatório.

## Conceitos teóricos

O filtro ocorre antes da IA:

1. interseta tags com objetivos e preocupações;
2. exclui alergias e ingredientes a evitar;
3. respeita orçamento e preferências do perfil;
4. exige `aiEligible=true`;
5. considera stock de produto/variante;
6. ordena disponíveis primeiro;
7. limita a 15 candidatos.

A OpenAI recebe apenas campos necessários, por exemplo um ID opaco interno à chamada, categoria, passos da rotina, atributos cosméticos, variante e preço. Não recebe nome/email do utilizador nem metadata administrativa desnecessária.

Depois da resposta, o backend verifica novamente:

- cada ID pertence à allowlist;
- a variante pertence ao produto;
- restrições continuam satisfeitas;
- preço e stock são os observados naquele momento;
- o total respeita o orçamento;
- `simulationSpec` só usa variantes escolhidas para maquilhagem.

Produtos indisponíveis podem ajudar a explicar uma opção, mas ficam fora de `recommendedTotalCents`. Só recomendações disponíveis entram nos 10% de `BK-MF1-07`.

## Arquitetura do BK

- `Product` com metadata `aiEligible`, concerns, rotina, INCI e variantes
- filtro determinístico → allowlist ≤ 15 → OpenAI → validação determinística
- `ProductRecommendation` ligado a relatório/revisão/produto/variante
- `GET /api/face-reports/:reportId` como leitura canónica
- links frontend para `/produtos/:productId` com variante selecionada

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/models/product.model.js`
- EDITAR: `apps/api/src/models/product-recommendation.model.js`
- EDITAR: `apps/api/src/services/product.service.js`
- EDITAR: `apps/api/src/services/product-variant.service.js`
- EDITAR: `apps/api/src/services/recommendation-restrictions.service.js`
- EDITAR: `apps/api/src/services/consultation-report.service.js`
- EDITAR: `apps/api/src/providers/openai-report.provider.js`
- EDITAR: `apps/api/src/utils/product-variant.util.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- REVER: `apps/web/src/services/productAiCuration.js`

## Bloco pedagogico

### Objetivo

Aprender a combinar seleção por IA com regras determinísticas de catálogo e comércio.

### Pre-requisitos

- Conhecer filtros MongoDB e validação de arrays.
- Saber trabalhar com inteiros em cêntimos.
- Compreender a allowlist do relatório v2.

### Erros comuns

- Deixar a OpenAI pesquisar livremente o catálogo.
- Usar o nome do produto como identidade.
- Ignorar `variantId` no stock/carrinho.
- Tratar falta de stock como eliminação da recomendação histórica.
- Forçar cinco recomendações quando só existem duas válidas.

### Check de compreensao

- Que regras são aplicadas antes e depois da OpenAI?
- Porque é que um produto sem stock pode aparecer, mas não entrar nos 10%?
- Como se preserva compatibilidade com produtos antigos sem variantes?

### Tempo estimado

`M` — modelo, curadoria, filtro, validação e integração.

## Bloco operacional

### Entrada

- Objetivos, análise e factos da sessão.
- Orçamento e restrições confirmados no perfil.
- Catálogo curado com stock atual.

### Saída

- 3–5 recomendações validadas, ou cobertura limitada explícita.
- Snapshots imutáveis de produto/variante.
- Total elegível calculado apenas com itens disponíveis.

### Passos

Executar cenarios negativos obrigatorios (minimo 3).

#### Passo 1 - Evoluir o schema sem apagar catálogo

Adiciona metadata opcional e variantes. Produtos antigos continuam válidos para loja; ficam fora da IA até `aiEligible=true`. Migrações preservam IDs, contagem e stock total.

#### Passo 2 - Criar o editor administrativo

Usa selects/tags para concerns, passos, INCI, textura, acabamento, cobertura, fragrância, FPS/UVA e resistência. O administrador não introduz ObjectIds manualmente.

#### Passo 3 - Confirmar restrições

Alergias ou ingredientes novos escritos na conversa têm de ser confirmados no perfil antes de gerar o relatório. “Sem restrições” explícito é permitido; texto ambíguo bloqueia a geração.

#### Passo 4 - Construir candidatos

Filtra no backend e cria no máximo 15 candidate DTOs. Usa IDs efémeros/permitidos e minimiza campos enviados à OpenAI.

```js
const allowedKeys = new Set(candidates.map(({ productId, variantId }) =>
    `${productId}:${variantId ?? "default"}`,
));
```

#### Passo 5 - Validar Structured Output

Rejeita qualquer recomendação cuja chave não exista em `allowedKeys`. Verifica duplicados, quantidade, orçamento e compatibilidade entre produto e variante.

#### Passo 6 - Criar snapshots

Persiste nome, marca, preço, imagem, atributos e stock observado. Liga cada registo à versão do relatório e mantém a seleção final separada do estado mutável de feedback.

#### Passo 7 - Integrar carrinho e catálogo

Produto disponível abre o detalhe com variante selecionada e usa `productId + variantId` no carrinho. Indisponível não mostra CTA de compra e pode oferecer alerta de reposição.

#### Passo 8 - Calcular cobertura e total

Aceita 1–2 recomendações quando orçamento/catálogo não cobre três e adiciona limitação. Exclui indisponíveis do total congelado usado para os 10%.

### Cenarios negativos recomendados

- OpenAI devolve produto ou variante inventados: rejeitar.
- Produto viola alergia/INCI: excluir antes e rejeitar se reaparecer.
- Produto sem metadata: não entra na allowlist.
- Variante não pertence ao produto: rejeitar.
- Orçamento só cobre dois produtos: relatório válido com limitação.
- Stock muda depois do freeze: snapshot não muda; disponibilidade atual é separada.
- Duas variantes do mesmo produto no carrinho: identidades distintas.

### Validacao

- [ ] Negativos: minimo 3 cenarios materiais executados.
- Gate documental: falhar se `negativos < 3`.
- Testes unitários de filtros e normalização INCI.
- Testes de allowlist e IDs inventados.
- Testes de variantes, stock e compatibilidade legada.
- Invariante de catálogo antes/depois da migração.
- Teste E2E relatório → detalhe → variante → carrinho.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | ID fora da allowlist | output OpenAI rejeitado |
| P0 | alergia incompatível | produto nunca é recomendado |
| P0 | migração de catálogo | IDs e stock total preservados |
| P1 | orçamento limitado | 1–2 válidos e limitação explícita |
| P1 | produto indisponível | sem CTA e fora dos 10% |
| P1 | variante válida | snapshot e carrinho preservam `variantId` |

### Evidencia de testes por camada

- Unit: filtros, restrições, variantes e allowlist.
- Integração: migração, catálogo, relatório e snapshots.
- Frontend/E2E: variante, detalhe, carrinho e indisponibilidade.
- Invariantes: IDs, contagem e stock total preservados.

### Handoff

`BK-MF2-03` explica cada recomendação. `BK-MF2-05` organiza os produtos em rotina. `BK-MF2-06` aplica os mesmos validadores aos ajustes humanos.

## Expected results

- Recomendações pertencem ao catálogo e à allowlist.
- Restrições, variantes, orçamento, preço e stock são validados pelo backend.
- Histórico usa snapshots, não a versão atual do catálogo.
- Produtos sem stock são transparentes e excluídos do depósito.

## Snippet tecnico aplicavel

O `Set` do Passo 4 representa a verificação mínima de membership. Na implementação final, combina-a com os validators de restrições, orçamento e variantes.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 3.
- Catálogo não perde produtos, IDs nem stock na migração.
- Apenas `aiEligible=true` entra na allowlist.
- A OpenAI recebe no máximo 15 candidatos minimizados.
- IDs e variantes são revalidados no backend.
- Relatório contém 3–5 produtos quando possível e declara cobertura limitada quando não.
- Recomendações indisponíveis não entram nos 10%.
- Carrinho/encomenda preservam produto + variante.

## Validação final

Executa testes de catálogo, migrações, provider, relatório, carrinho e frontend. Faz pesquisa estática para garantir que não existe uma rota funcional de geração direta de recomendações.

## Evidence para PR/defesa

- Contagem/IDs/stock do catálogo antes e depois.
- Caso de ID inventado rejeitado.
- Caso de alergia excluída.
- Snapshot com variante e disponibilidade histórica/atual separadas.

## Handoff

As explicações e rotina usam os snapshots validados deste BK. Não voltam a pedir à OpenAI novos produtos fora da versão do relatório.

## Changelog

- `2026-06-08`: guia inicial de recomendações personalizadas.
- `2026-07-10`: reforço de restrições, stock e geração pelo próprio utilizador.
- `2026-07-11`: recomendações integradas no relatório OpenAI v2 com allowlist, variantes e snapshots.
