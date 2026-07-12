# BK-MF6-07 - Fotografias e relatórios de análise armazenados de forma encriptada

## Header
- `doc_id`: `GUIA-BK-MF6-07`
- `bk_id`: `BK-MF6-07`
- `macro`: `MF6`
- `owner`: `Aline`
- `apoio`: `Izelicks`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF11`
- `fase_documental`: `Fase 3`
- `sprint`: `S10-S11`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `SUPORTE`
- `eixo_primario`: `FundacaoQualidade`
- `kpi_primario`: `taxa_incidentes_criticos`
- `kpi_secundario`: `taxa_conformidade_gates`
- `proximo_bk`: `BK-MF7-01`
- `guia_path`: `docs/planificacao/guias-bk/MF6/BK-MF6-07-fotografias-e-relatorios-de-analise-armazenados-de-forma-encriptada.md`
- `last_updated`: `2026-07-11`

> **Contrato vigente:** fotografias normalizadas, previews de maquilhagem e payloads sensíveis da consulta OpenAI usam AES-256-GCM com contexto ligado à coleção, titular e campo. O registry append-only inclui 001–015; as migrações 010–015 introduzem consentimento v2/OpenAI-only, sessões/jobs, metadata e variantes de catálogo, relatório v2, revisão/unlock e qualidade/preview. O estado atual está no [plano vivo OpenAI](../../PLANO-IMPLEMENTACAO-CONSULTA-IA-OPENAI-real_dev.md).

#### Objetivo

Fechar `RNF11` garantindo que bytes faciais, perguntas, respostas, factos derivados, findings, relatórios, revisões e outputs de maquilhagem não ficam legíveis em disco ou num dump MongoDB. A descifra ocorre apenas dentro de uma operação autenticada e autorizada.

#### Importância

As fotografias faciais e os dados derivados são sensíveis. Cifrar apenas o ficheiro original não protege transcript, relatório, override humano ou preview. O contexto AES-GCM também impede trocar ciphertext entre utilizadores, coleções ou campos.

#### Scope-in

- Normalizar frontal/perfil para WebP e remover EXIF antes da cifra.
- Guardar ficheiros privados com modo `0600` e diretórios `0700`.
- Usar `keyVersion`, `aadHash`, IV e auth tag sem expor a chave.
- Cifrar perguntas, respostas, factos, findings, restrições e conteúdo de relatório/revisão.
- Cifrar outputs `gpt-image-2`, aplicar TTL de sete dias e eliminar derivados com o recurso de origem.
- Atualizar migrations 010–015 sem alterar checksums 001–009.
- Proteger downloads próprios/consultor com autenticação, ownership, grant e `no-store`.

#### Scope-out

- Não guardar uma segunda cópia em claro para pesquisa ou debug.
- Não promover consentimentos antigos para v2.
- Não converter dados antigos de outros providers em resultados OpenAI.
- Não expor `storageKey`, paths, ciphertext, IV, auth tag ou AAD no DTO.
- Não editar nem reordenar migrations já aplicadas.

#### Estado antes e depois

- Antes: a proteção podia abranger apenas fotografias ou campos antigos isolados.
- Depois: todos os recursos OpenAI v2 e derivados têm fronteira criptográfica, migração append-only e ciclo de eliminação verificável.

#### Pre-requisitos

- Chave de dados separada dos segredos de sessão e backup.
- `BK-MF1-05`: Busboy, Sharp e consentimento v2.
- `BK-MF1-07`: relatório v2 e teaser seguro.
- `BK-MF2-06`: separação `machineResult`/`humanOverride`.
- Replica set efémero para testar migrações, rollback e eliminação física.

#### Glossário

- **AES-GCM:** cifra autenticada que deteta alteração do ciphertext.
- **AAD:** contexto autenticado, mas não cifrado, que liga o valor ao seu lugar correto.
- **`keyVersion`:** versão da chave usada para permitir rotação controlada.
- **Normalização:** descodificar, validar, auto-orientar e reencodar sem metadados.
- **Recifra:** descifrar apenas numa migração autorizada e cifrar de imediato no novo contexto.
- **Tombstone:** estado que bloqueia novas escritas durante revogação ou eliminação.

#### Conceitos teóricos essenciais

Um campo cifrado só é seguro se o contexto for estável e específico. `collection + owner + field` impede que um valor válido num relatório seja copiado para outro utilizador ou para um campo com significado diferente.

As migrations são append-only. 010 arquiva referências antigas e exige consentimento v2; 011 cria sessão/jobs; 012 enriquece o catálogo sem eliminar produtos; 013 cria relatório v2 e snapshots; 014 acrescenta revisão/freeze/unlock; 015 acrescenta qualidade e outputs OpenAI. Todas precisam de `dry-run`, checksum, lock, contagens e pós-condições.

#### Arquitetura do BK

- `apps/api/src/services/face-photo-normalization.service.js`: valida e remove metadados.
- `apps/api/src/services/face-secure-storage.service.js`: cifra/lê fotografias com AAD próprio.
- `apps/api/src/utils/contextual-encrypted-field.util.js`: campos JSON contextuais.
- `apps/api/src/services/makeup-simulation-storage.service.js`: normaliza, cifra e lê previews.
- `apps/api/src/models/face-analysis.model.js`: provenance e findings cifrados.
- `apps/api/src/models/face-report.model.js`: conteúdo versionado e snapshot imutável.
- `apps/api/src/migrations/010_openai_only_and_consent_v2.js` a `015_photo_quality_and_openai_simulation.js`.
- `apps/api/src/migrations/catalog-invariant.js`: protege IDs, contagem e stock do catálogo.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/services/face-photo-normalization.service.js`
- EDITAR: `apps/api/src/services/face-secure-storage.service.js`
- EDITAR: `apps/api/src/utils/contextual-encrypted-field.util.js`
- EDITAR: `apps/api/src/services/makeup-simulation-storage.service.js`
- REVER: `apps/api/src/models/face-analysis.model.js`
- REVER: `apps/api/src/models/face-report.model.js`
- REVER: `apps/api/src/models/ai-consultation-session.model.js`
- CRIAR/REVER: migrations e testes 010–015.

#### Tutorial técnico linear

### Passo 1 - Inventariar dados e fronteiras

Cria uma tabela por coleção com owner, campo sensível, finalidade, retenção, AAD e rotina de eliminação. Inclui sessão/transcript, análise, relatório, revisão, grant, job e preview.

### Passo 2 - Exigir consentimento v2 antes da escrita

`GET|POST|DELETE /api/face-consent` controla o consentimento OpenAI v2. A versão inclui provider `openai`, `noticeVersion` e propósitos separados para análise, edição generativa e acesso fotográfico do consultor. Revogação bloqueia novas operações e cancela jobs ainda não concluídos.

### Passo 3 - Normalizar antes de cifrar

Busboy aceita apenas `frontal` e `perfil`. Sharp limita píxeis/dimensões, auto-orienta, reencoda WebP e remove EXIF. O ficheiro temporário em claro é eliminado depois da escrita cifrada ou perante abort/erro.

```js
/**
 * Persiste uma fotografia já normalizada com AAD imutável.
 *
 * @param {{path: string}} normalizedFile - WebP temporário sem metadados.
 * @param {{userId: string, photoId: string, kind: "frontal"|"perfil"}} identity - Identidade criptográfica.
 * @param {AbortSignal} signal - Cancelamento cooperativo.
 * @returns {Promise<object>} Storage key e envelope criptográfico seguro.
 */
export async function persistEncryptedPhoto(normalizedFile, identity, signal) {
    return encryptFacePhotoFile(normalizedFile, identity, { signal });
}
```

### Passo 4 - Cifrar payloads JSON com AAD contextual

Usa `contextualEncryptedField` nos schemas e garante que qualquer query/projeção necessária à descifra inclui o owner exato. DTOs são construídos depois da autorização e nunca devolvem o envelope criptográfico.

### Passo 5 - Aplicar migrations 010–015 sem destruir catálogo

Executa `status`, `dry-run` e `up`. Antes/depois de cada migration de catálogo, compara contagem, conjunto de IDs e stock agregado. Dados antigos ficam `legacy/archived`; nunca são promovidos a OpenAI nem recalculam unlocks/vouchers existentes.

### Passo 6 - Servir apenas através de endpoints autenticados

- `POST /api/face-photos`: upload normalizado e cifrado.
- `GET /api/face-reports/:reportId`: teaser ou conteúdo segundo ownership/unlock.
- `GET /api/consultant/ai-consultation-reviews/:reviewId/photos/:view`: grant temporário e auditoria.
- `GET /api/makeup-simulations/:simulationId/image`: imagem própria cifrada e `no-store`.

Cada resposta de ficheiro usa `Cache-Control: no-store`, `Pragma: no-cache`, `X-Content-Type-Options: nosniff` e nunca publica o path.

### Passo 7 - Implementar retenção e eliminação física

O preview expira em sete dias. Substituir fotografias elimina o par anterior; apagar fotografia, relatório ou conta elimina também outputs derivados. Um job de eliminação só fica `completed` depois de verificar ausência física.

### Passo 8 - Executar cenários negativos obrigatórios (mínimo 3)

1. Trocar owner/campo/kind do AAD e confirmar falha de autenticação.
2. Adulterar ciphertext/auth tag e confirmar ausência de plaintext na resposta/log.
3. Abortar depois da escrita cifrada e provar cleanup sem ficheiro parcial.
4. Executar migration 012 com alteração inesperada de ID/stock e exigir rollback.
5. Pedir fotografia de outro utilizador ou com grant expirado e receber 404/403 auditado.

#### Expected results

- Ficheiros persistidos não abrem como imagem sem descifra autorizada.
- Dumps não contêm perguntas, respostas, findings, rotina ou notas sensíveis em claro.
- Relatório v2 conserva provenance OpenAI: provider, modelo pedido/efetivo, request ID e versões de prompt/schema.
- Migrações 010–015 passam dry-run/replay e preservam catálogo, unlocks, vouchers e encomendas.
- DTOs e exports não expõem chaves, paths, envelopes ou conteúdo bloqueado.
- Eliminação remove bytes e derivados abrangidos.

#### Critérios de aceite

- AES-256-GCM contextual aplicado a ficheiros e campos sensíveis.
- Normalização WebP e remoção de EXIF ocorrem antes da cifra.
- Registry 001–015 é append-only e os checksums 001–009 permanecem intactos.
- Consentimentos antigos não são promovidos.
- Endpoints canónicos validam ownership/grant e usam `no-store`.
- Cenarios negativos concluídos: mínimo `3`.
- Evidencia de testes por camada: unit, integration replica-set, HTTP e E2E/privacidade.

### Matriz mínima de testes por prioridade

| Prioridade | Camada | Prova mínima |
|---|---|---|
| P0 | Unit | AAD, adulteração, normalização e DTO |
| P0 | Integration | round-trip, migrations 010–015, rollback e eliminação física |
| P0 | HTTP/E2E | ownership, grant, teaser/paywall e headers privados |
| P0 | Negativos | pelo menos três cenários materiais |

#### Validação final

- [ ] EXIF ausente no WebP normalizado.
- [ ] Dump sem campos sensíveis legíveis.
- [ ] Checksums 001–009 inalterados e 010–015 aplicáveis/repetíveis.
- [ ] Catálogo conserva IDs, contagem e stock agregado.
- [ ] Ficheiros próprios/consultor usam auth, ownership/grant e `no-store`.
- [ ] Negativos: mínimo `3` cenários com resultado controlado.

#### Evidence para PR/defesa

Regista apenas hashes, contagens, permissões e resultados sanitizados. Não copies chave, URI MongoDB, ciphertext completo, fotografia, transcript, cookies ou PII.

#### Handoff

O `BK-MF7-01` reutiliza este boundary para consentimento v2, propósitos separados, revogação e cancelamento de jobs.

## Bloco pedagogico

### Objetivo

Perceber a diferença entre cifrar bytes, cifrar campos derivados e autorizar a descifra.

### Pre-requisitos

Rever buffers, AES-GCM, AAD, Mongoose getters/setters, migrations e transações.

### Erros comuns

- Cifrar antes de remover EXIF.
- Usar AAD genérico ou sem owner.
- Fazer debug com plaintext persistido.
- Alterar uma migration já aplicada.
- Marcar eliminação concluída antes de remover os bytes.

### Check de compreensao

1. Por que o mesmo ciphertext não pode ser movido para outro owner?
2. O que 012 deve provar sobre o catálogo?
3. Quando um endpoint pode descifrar uma fotografia?

## Bloco operacional

### Entrada

Consentimento v2, chaves locais válidas, replica set efémero e snapshot do catálogo.

### Passos

Normalizar, cifrar, persistir, migrar, autorizar leitura, aplicar retenção e testar eliminação.

### Validacao

```bash
npm --prefix apps/api run migrate:status
npm --prefix apps/api run migrate:dry-run
npm --prefix apps/api test -- tests/migrations-010-015.replset.integration.test.js
npm --prefix apps/api test -- tests/sensitive-derivatives-encryption.replset.integration.test.js tests/openai-makeup-storage.test.js
```

### Handoff

Entregar matriz de campos/AAD, contagens de migração e provas de ausência física ao `BK-MF7-01`.

## Criterios de aceite

- Dados OpenAI v2 sensíveis não persistem em claro.
- Migrations 010–015 preservam dados e invariantes definidos.
- Cenarios negativos concluidos: minimo `3`.
- Evidencia de testes por camada registada.

## Evidence para PR/defesa

Mostrar um round-trip autorizado e três recusas materiais, sempre com dados sintéticos e output sanitizado.

## Snippet tecnico aplicavel

```js
const BK_ID = "BK-MF6-07";
const MIN_NEGATIVOS = 3;

/** Valida o pacote de evidence sem receber dados biométricos. */
export function validarEvidenceBkMf607(evidence) {
    const negativos = Array.isArray(evidence?.negativos) ? evidence.negativos.length : 0;
    if (evidence?.bkId !== BK_ID || negativos < MIN_NEGATIVOS) {
        throw new Error("Evidence incompleta para BK-MF6-07");
    }
    return true;
}
```

## Changelog

- `2026-07-11`: guia alinhado a OpenAI-only, consentimento v2, provenance, registry 001–015, relatório v2 e preview cifrado.
- `2026-07-10`: endpoints e campos do contrato anterior ficaram supersedidos e permanecem apenas nos relatórios históricos.
