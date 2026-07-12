# BK-MF2-08 - Mostrar original e preview OpenAI lado a lado

## Header

- `doc_id`: `GUIA-BK-MF2-08`
- `bk_id`: `BK-MF2-08`
- `macro`: `MF2`
- `owner`: `Bruna`
- `apoio`: `Izelicks`
- `prioridade`: `P1`
- `estado`: `TODO`
- `esforco`: `S`
- `dependencias`: `BK-MF2-07`
- `rf_rnf`: `RF24`
- `fase_documental`: `Fase 1`
- `sprint`: `S05-S06`
- `core_or_reforco`: `Core`
- `proximo_bk`: `BK-MF3-01`
- `guia_path`: `docs/planificacao/guias-bk/MF2/BK-MF2-08-a-ia-deve-gerar-uma-visualizacao-antes-depois-com-os-produtos-recomendados.md`
- `last_updated`: `2026-07-11`

> **Contrato canónico:** esta UI compara a fotografia frontal original autorizada com o output real da edição OpenAI de `BK-MF2-07`. Não existe entidade/rota separada de “antes/depois”, representação local ou campo para introduzir `simulationId`. A comparação vive no relatório desbloqueado e carrega ambos os blobs por endpoints autenticados `no-store`.

## Contexto do BK

A geração já terminou no backend. Este BK trata apenas da apresentação segura e acessível dos dois recursos:

- **Original:** fotografia frontal usada na edição;
- **Preview OpenAI:** WebP derivado e temporário.

“Original/preview” é uma comparação visual de maquilhagem, não uma previsão de evolução da pele.

## Objetivo

Apresentar original e preview OpenAI lado a lado, com estados assíncronos, aviso de variação, ownership, URLs temporárias em memória e comportamento responsivo/acessível.

## Importância

Uma boa edição pode ser mal interpretada se a UI sugerir certeza ou evolução clínica. A página deve deixar claro o que foi alterado, que produtos/variantes foram usados e que o resultado real pode variar.

## Scope-in

- Mostrar estados `queued`, `processing`, `completed`, `failed_retryable`, `expired` e `cancelled`.
- Fazer polling enquanto a operação está ativa.
- Obter original e output como blobs autenticados.
- Criar e revogar `objectURL` apenas em memória.
- Mostrar os dois painéis lado a lado e empilhados em ecrãs estreitos.
- Apresentar variantes congeladas e aviso permanente.
- Permitir retry/novo consentimento quando o contrato o autoriza.
- Garantir labels, alt text, foco, teclado e ausência de overflow.

## Scope-out

- Não gerar imagem no browser.
- Não guardar blobs/URLs em `localStorage` ou `sessionStorage`.
- Não expor storage keys nem criar URLs públicas.
- Não aplicar slider que esconda contexto essencial sem alternativa.
- Não usar esta comparação em objetivos não relacionados com maquilhagem.
- Não alegar que o preview prevê o resultado real.

## Pré-requisitos

- Simulação de `BK-MF2-07` pertencente ao titular.
- Relatório congelado e desbloqueado.
- Endpoints autenticados do original e output.
- API client capaz de descarregar blobs com cookies e abort.

## Glossário

- **Object URL:** URL temporária criada pelo browser para um `Blob` em memória.
- **Original:** fotografia frontal autorizada e efetivamente enviada ao modelo.
- **Preview:** output generativo OpenAI, não fotografia histórica real.
- **No-store:** diretiva que impede caching do recurso sensível.

## Conceitos teóricos

O DTO de estado não inclui bytes. Depois de `completed`, o frontend faz duas chamadas autenticadas:

- URL do original devolvida pelo relatório, por exemplo `GET /api/me/skin-analyses/:analysisId/image`;
- `GET /api/makeup-simulations/:simulationId/image` para o output.

O código converte cada blob numa `objectURL`. Essas URLs existem apenas durante a montagem do componente e são revogadas no cleanup. Um `AbortController` cancela downloads quando o utilizador navega para outra página.

O aviso é sempre visível:

> “Pré-visualização gerada por IA — o resultado real poderá variar.”

O alt text distingue os painéis sem fazer diagnóstico: “Fotografia original usada nesta pré-visualização” e “Pré-visualização de maquilhagem gerada por IA”.

## Arquitetura do BK

- estado da simulação no `GET /api/makeup-simulations/:simulationId`
- original através do `sourceImageUrl` do relatório unlocked
- output em `GET /api/makeup-simulations/:simulationId/image`
- `ConsultationReportPage` gere polling, blobs, cleanup e apresentação
- sem modelo ou rota paralela de comparação

## Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/services/report-access.service.js`
- EDITAR: `apps/api/src/services/makeup-simulation.service.js`
- EDITAR: `apps/api/src/controllers/makeup-simulation.controller.js`
- EDITAR: `apps/web/src/features/consultation/ConsultationReportPage.jsx`
- EDITAR: `apps/web/src/features/consultation/consultationApi.js`
- EDITAR: `apps/web/src/styles.css`

## Bloco pedagogico

### Objetivo

Aprender a apresentar ficheiros privados sem os tornar públicos nem os persistir no browser.

### Pre-requisitos

- Saber usar `Blob`, `URL.createObjectURL` e cleanup de `useEffect`.
- Conhecer polling com backoff e `AbortController`.
- Compreender estados assíncronos e acessibilidade de imagens.

### Erros comuns

- Colocar URL privada diretamente no HTML sem autenticação adequada.
- Esquecer `URL.revokeObjectURL`.
- Continuar polling depois de navegar.
- Mostrar “depois” como se fosse resultado futuro garantido.
- Ocultar warnings por cor ou texto pequeno.
- Pedir ao utilizador um ID técnico.

### Check de compreensao

- Porque é que estado e bytes usam pedidos diferentes?
- Quando devem ser revogadas as object URLs?
- Como distinguir preview generativo de evolução real?
- Que informação permanece visível quando a imagem expira?

### Tempo estimado

`S` — integração de blobs, estados, CSS e testes.

## Bloco operacional

### Entrada

- DTO do relatório unlocked.
- DTO da simulação própria.
- `sourceImageUrl` e `imageUrl` autenticados.

### Saída

- Comparação responsiva e acessível.
- Aviso de IA e variantes utilizadas.
- Cleanup de requests e object URLs.

### Passos

Executar cenarios negativos obrigatorios (minimo 2).

#### Passo 1 - Derivar estado da simulação

Usa a simulação correlacionada devolvida pelo relatório. Não pede `simulationId` num input nem procura uma simulação global por ID livre.

#### Passo 2 - Fazer polling controlado

Enquanto `queued`/`processing`, atualiza o estado. Cancela timers no cleanup e aumenta o intervalo quando necessário. `failed_retryable`, `expired` e `cancelled` param polling.

#### Passo 3 - Descarregar os dois blobs

Só quando `completed`, usa o API client autenticado para original e output. Trata `401`, `403`, `404` e abort sem apagar o relatório já carregado.

#### Passo 4 - Criar URLs temporárias

Cria URLs em memória, guarda-as apenas em state e revoga ambas ao trocar de simulação ou desmontar.

```js
useEffect(() => {
    if (!sourceBlob || !previewBlob) return undefined;
    const sourceUrl = URL.createObjectURL(sourceBlob);
    const previewUrl = URL.createObjectURL(previewBlob);
    setImages({ sourceUrl, previewUrl });
    return () => {
        URL.revokeObjectURL(sourceUrl);
        URL.revokeObjectURL(previewUrl);
    };
}, [sourceBlob, previewBlob]);
```

#### Passo 5 - Construir os dois painéis

Usa `figure`/`figcaption`, dimensões explícitas e `object-fit` consistente. Em desktop, duas colunas; a 320/375 px, uma coluna sem scroll horizontal.

#### Passo 6 - Mostrar contexto e limitações

Mantém o aviso de variação junto às imagens. Lista produtos/variantes do snapshot e não produtos atuais adicionais. Identifica o preview como gerado por IA.

#### Passo 7 - Tratar estados terminais

Em `failed_retryable`, mantém relatório e oferece retry. Em `expired`, informa que os bytes foram eliminados e permite regenerar apenas com fotografia existente e novo consentimento. Em `cancelled`, explica revogação.

#### Passo 8 - Validar acessibilidade e privacidade

Move foco para o heading do resultado, usa alt text contextual, touch targets 44×44 e `prefers-reduced-motion`. Confirma `Cache-Control: private, no-store` nos dois endpoints e ausência de blobs no storage.

### Cenarios negativos recomendados

- Relatório/simulação alheios: nenhum blob é servido.
- Output ainda processing: não tentar mostrar imagem inexistente.
- Download do output falha: original/relatório não desaparecem.
- Navegação durante download: requests abortados e URLs limpas.
- Output expira: estado informativo, sem imagem quebrada persistente.
- Viewport 320 px: sem overflow.
- JavaScript inspecionado: conteúdo locked ou storage key ausentes.

### Validacao

- [ ] Negativos: minimo 2 cenarios materiais executados.
- Gate documental: falhar se `negativos < 2`.
- Testes unitários dos estados de apresentação.
- Testes de cleanup de object URLs e abort.
- Testes de ownership/no-store nos endpoints.
- Testes frontend de erro parcial e retry.
- E2E em Chromium/Firefox/WebKit, axe e 320/375/768/1280.

### Matriz minima de testes por prioridade

| Prioridade | Cenário | Resultado esperado |
|---|---|---|
| P0 | acesso alheio | original/output não são servidos |
| P0 | unmount durante download | abort + URLs revogadas |
| P1 | completed | original e preview lado a lado |
| P1 | failed_retryable | relatório preservado e retry disponível |
| P1 | expired | mensagem clara e sem bytes |
| P1 | 320/375 px + teclado | sem overflow e navegação acessível |

### Evidencia de testes por camada

- Unit: polling, estados, abort e cleanup de object URLs.
- Integração: blobs autenticados e headers `no-store`.
- Frontend/E2E: original/preview, erro parcial, viewports e axe.

### Handoff

A próxima macro reutiliza apenas produtos/variantes do snapshot para a loja. A imagem generativa continua temporária e não se torna fotografia de catálogo, perfil ou evolução.

## Expected results

- Original e preview OpenAI aparecem com contexto correto.
- A UI não pede IDs técnicos nem cria uma representação local.
- Blobs são autenticados, temporários e limpos.
- Estados de erro/expiração preservam o relatório.
- Aviso de variação está sempre visível.

## Snippet tecnico aplicavel

O efeito do Passo 4 demonstra o lifecycle correto. A aplicação final junta `AbortController` e validação do estado antes do download.

## Criterios de aceite

- Cenarios negativos concluidos: minimo 2.
- Comparação vive no relatório unlocked.
- Original e output vêm de endpoints do titular com `no-store`.
- Object URLs nunca são persistidas e são sempre revogadas.
- Estado assíncrono é explícito e recuperável.
- Produtos/variantes apresentados pertencem ao snapshot congelado.
- Aviso de IA/variação é permanente.
- Layout funciona a 320/375/768/1280 e é navegável por teclado.
- Não existe fluxo visual local nem entidade antes/depois paralela.

## Validação final

Executa testes frontend, E2E multi-browser, axe, responsive e contratos dos dois endpoints. Se algum browser não estiver instalado, regista `BLOQUEADO_EXTERNO` em vez de inventar validação.

## Evidence para PR/defesa

- Estado sanitizado da simulação e headers `no-store`.
- Resultado de axe/viewports.
- Teste de abort/revogação de object URLs.
- Imagens sintéticas/consentidas apenas; não anexar fotografia real.

## Handoff

O preview pode expirar ou ser eliminado sem afetar o relatório, o voucher ou as recomendações históricas.

## Changelog

- `2026-07-10`: contrato anterior de visualização local.
- `2026-07-11`: substituição pela comparação original/preview OpenAI, blobs autenticados, estados e acessibilidade.
