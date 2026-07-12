# OPERACAO-DEPLOY-ROLLBACK

## Header
- `doc_id`: `OPERACAO-DEPLOY-ROLLBACK`
- `path`: `docs/planificacao/sprints/OPERACAO-DEPLOY-ROLLBACK.md`
- `area`: `project`
- `owner`: `Nuno`
- `status`: `ativo`
- `last_updated`: `2026-07-11`

## Objetivo
Definir o protocolo operacional mínimo de release local e reposição da versão anterior no contexto académico da PAP, com evidências verificáveis para gates `S4`, `S8` e `S12`. Este documento não descreve nem comprova deploy de produção, cloud, alta disponibilidade ou recuperação de desastre.

## Release local (baseline académico)
1. Confirmar BKs da sprint em estado elegivel para release e sem bloqueios `P0`.
2. Executar validação documental e técnica (`validate-planificacao` + `npm run verify:all` no runtime privado), registando separadamente qualquer teste live opt-in.
3. Gerar localmente a versão demonstrável com changelog curto e identificador de release.
4. Validar smoke funcional dos fluxos `CORE-IA` e `CORE-COM`, incluindo retoma da consulta, relatório bloqueado/desbloqueado, pagamento simulado de 10% e voucher.
5. Confirmar que o bundle não inclui credenciais, hosts locais fixos nem providers IA `demo`/alternativos e que nenhuma URI remota foi usada na validação.

## Reposição local
1. Acionar a reposição se houver falha crítica em fluxo `P0` ou quebra de rastreabilidade.
2. Selecionar um snapshot cifrado já autenticado por manifest, sidecar e checksums.
3. Restaurar apenas para uma base local isolada cujo nome termine em `_restore`; nunca sobrescrever diretamente a base académica principal.
4. Executar a verificação de documentos e índices e deixar a rotina limpar a base efémera.
5. Só depois da prova isolada, repor localmente a versão estável anterior e confirmar a integridade da base académica pelo procedimento aprovado pelo docente.
6. Reexecutar smoke dos fluxos core, registar impacto e abrir acao corretiva no scorecard da sprint.

## Runbook de backup local recuperável

Executar no runtime privado dentro de `real_dev/api`, com `ORELLE_LOCAL_MONGODB_URI` loopback sem credenciais e `ORELLE_BACKUP_KEY` dedicada ao backup. Estes comandos não usam nem alteram o `.env` remoto:

```bash
npm run backup:create
npm run backup:verify
npm run backup:prune
```

Restore manual isolado:

```bash
ORELLE_RESTORE_DATABASE=orelle_manual_restore npm run backup:restore
```

- `backup-create` guarda documentos e índices como Extended JSON cifrado com AES-256-GCM, AAD e checksums, e aplica retenção de sete snapshots.
- `backup-verify` restaura numa base efémera `_restore`, compara documentos e índices e limpa o destino.
- `backup-prune` mantém os sete snapshots mais recentes.
- O helper de scheduler só pode iniciar com `runtimeMode="dev:local"` e `enabled=true`; a sua existência não prova que uma execução diária ocorreu.
- O manifest não publica `backup:daily`: o export redigido legado não é recuperável e não pode voltar a ser apresentado como backup operacional.

## Verificação após release local
- Smoke obrigatório para autenticação, consulta OpenAI, relatório/revisão, desbloqueio/voucher e compra orientada.
- Confirmar que análise, pergunta seguinte, relatório e imagem usam jobs retomáveis e que os estados `failed_retryable` não apagam a sessão nem fabricam resultados.
- Confirmar logs sem erro crítico e tempos/deadlines dentro do alvo documental.
- Validar alinhamento dos artefactos de sprint/gate apos release.

## Configuração OpenAI na demonstração local

- `OPENAI_API_KEY` é fornecida apenas ao processo local e nunca entra no repositório, relatório, bundle, logs ou evidência.
- Os defaults configuráveis são `gpt-5.4-mini`, `gpt-5.4` e `gpt-image-2`; a evidência deve registar apenas modelo pedido/efetivo, versões de prompt/schema e request ID sanitizado.
- Sem chave, a release local pode demonstrar autenticação, catálogo, conta e loja em estado degradado, mas não pode alegar que uma nova operação OpenAI foi validada.
- O teste `npm run test:ai:live` é opt-in, requer credenciais próprias e imagens sintéticas/consentidas; ausência destas condições fica `SKIP/BLOQUEADO`.
- Retry e fallback mantêm-se dentro da OpenAI. Só a próxima pergunta pode usar o banco canónico; análise, relatório e imagem nunca recebem fallback cosmético local.

## Incidentes
- Severidade `Alta`: indisponibilidade de fluxo core dual.
- Severidade `Media`: regressao parcial com workaround.
- Severidade `Baixa`: falha cosmetica sem impacto funcional core.
- Todo incidente deve registar causa, mitigacao e acao preventiva.

## Evidencias
- Identificador de release e timestamp.
- Resultado dos checks antes e depois da release local.
- Registo da reposição local, quando aplicável.
- Referencia no scorecard e no gate da sprint.
- Resumo sanitizado de `backup-create` e `backup-verify`, sem URI, chave ou caminhos privados.
- Comparação positiva de documentos e índices na base `_restore` e confirmação de cleanup.
- A prova unitária atual do formato deve ser acompanhada pelo ciclo real em replica set; até lá, `RNF21` permanece parcialmente comprovado.

## Changelog
- `2026-07-11`: operação local alinhada ao runtime `real_dev`, `verify:all`, OpenAI-only degradável, jobs retomáveis, relatório/revisão, desbloqueio de 10%, voucher e teste live opt-in.
- `2026-07-09`: adicionado runbook local recuperável com EJSON cifrado, checksums, índices, restore restrito a `_restore`, retenção de sete cópias e blocker explícito da prova real em replica set.
- `2026-07-09`: scope restringido a release/reposição académica local, sem alegar deploy de produção ou cloud.
- `2026-04-19`: artefacto criado para cumprir contrato canónico de operacao/deploy/rollback.

## Regra de evidencia por camada de teste
- Gate/release so valida BK com evidencias minimas por prioridade (`unit`, `integration`, `e2e` quando aplicavel) e negativos obrigatorios.
