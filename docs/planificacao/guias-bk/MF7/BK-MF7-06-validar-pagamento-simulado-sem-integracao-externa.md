# BK-MF7-06 - Validar Pagamento simulado sem integração externa

## Header
- `doc_id`: `GUIA-BK-MF7-06`
- `bk_id`: `BK-MF7-06`
- `macro`: `MF7`
- `owner`: `Bruna`
- `apoio`: `Daniel Bulica`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `-`
- `rf_rnf`: `RNF17`
- `fase_documental`: `Fase 3`
- `sprint`: `S11-S12`
- `core_or_reforco`: `Reforco`
- `classe_core_dual`: `CORE-COM`
- `eixo_primario`: `MonetizacaoLoja`
- `kpi_primario`: `taxa_conversao_checkout`
- `kpi_secundario`: `taxa_recompra_30d`
- `proximo_bk`: `BK-MF7-07`
- `guia_path`: `docs/planificacao/guias-bk/MF7/BK-MF7-06-validar-pagamento-simulado-sem-integracao-externa.md`
- `last_updated`: `2026-07-10`

> **Estado atual da implementação de referência:** o contrato está implementado em `real_dev`. A confirmação compara o hash SHA-256 da `Idempotency-Key` com o histórico interno de tentativas e reproduz o snapshot exato de resultados `simulated_paid` e `simulated_failed`; a UI já separa criação do resumo e “Simular pagamento”. Os testes de transação, rollback, replay e concorrência constituem evidence atual. O domínio não contém gateway, cliente HTTP, URL/redirect financeiro ou I/O externo; navegação React interna same-origin depois do sucesso é permitida.

#### Objetivo

Consolidar `RNF17` com o contrato único da Orelle: `POST /api/orders/checkout` recebe body vazio e cria uma encomenda com `payment.mode = "simulated"` e `payment.status = "awaiting_simulation"`; depois, `POST /api/orders/:orderId/payments/simulate` exige `Idempotency-Key` e termina em `simulated_paid` ou `simulated_failed`.

Tudo decorre no ambiente académico/local. Não são pedidos dados financeiros, não existe comunicação com serviços de cobrança, não há redirecionamento externo e nenhum valor monetário é movimentado.

#### Importância

O checkout e a confirmação são momentos diferentes. O primeiro apresenta um snapshot verificável; o segundo volta a validar ownership, carrinho, preços, stock e voucher antes de aplicar efeitos comerciais. A separação evita consumir recursos antes da confirmação explícita e permite provar retry seguro.

#### Scope-in

- Fixar `payment.mode = "simulated"` como único modo atual.
- Usar apenas `awaiting_simulation`, `simulated_paid` e `simulated_failed`.
- Exigir body vazio no checkout.
- Exigir `Idempotency-Key` na confirmação simulada.
- Guardar somente o hash da chave.
- Revalidar ownership, carrinho, preços, stock e voucher.
- Aplicar encomenda, stock, voucher e carrinho como uma operação atómica.
- Provar replay, concorrência e rollback com falhas injetadas internamente.

#### Scope-out

- Recolher ou guardar dados de cobrança.
- Configurar segredos ou URLs financeiros.
- Comunicar com serviços financeiros.
- Permitir seleção de modo, total ou resultado no body.
- Marcar encomendas como enviadas ou entregues.
- Expor hashes, identidade interna ou dados do carrinho na evidence.

#### Estado antes e depois

- Antes: `RF27` cria o resumo da encomenda a partir do carrinho.
- Depois: `RNF17` fecha a confirmação simulada idempotente, com efeitos comerciais atómicos, ownership e ausência comprovada de rede.

#### Pré-requisitos

- `BK-MF3-03` compreendido.
- Sessão HttpOnly e ownership protegidos no backend.
- MongoDB de testes com suporte a sessões para os testes de atomicidade.
- Modelos `Cart`, `Order`, `Product` e `Voucher` disponíveis.

#### Glossário

- `awaiting_simulation`: encomenda criada, ainda sem confirmação simulada.
- `simulated_paid`: confirmação académica concluída com sucesso.
- `simulated_failed`: confirmação académica falhou sem consumir recursos comerciais.
- `Idempotency-Key`: header obrigatório, com 8–128 caracteres seguros, usado para replay.
- Operação atómica: alterações confirmadas em conjunto ou integralmente anuladas.

#### Conceitos teóricos essenciais

O browser é uma fonte não confiável. O body vazio impede que escolha modo, preço, itens, identidade ou resultado. A `Idempotency-Key` identifica a tentativa, mas a aplicação guarda apenas SHA-256 da chave para minimizar dados internos.

O controlo de duplo clique no frontend melhora UX, mas não garante idempotência. A garantia real fica no backend, incluindo pedidos simultâneos. O mesmo hash reproduz sempre o snapshot terminal original; depois de `simulated_failed`, só uma chave nova representa uma nova ação explícita.

#### Arquitetura do BK

- `domain.constants.js`: modo e estados canónicos.
- `order.model.js`: metadados simulados, hash não selecionado, snapshots e histórico interno de tentativas terminais.
- `checkout.validator.js`: body vazio, `orderId` e `Idempotency-Key`.
- `payment.provider.js`: estados puramente locais, sem clientes HTTP.
- `order.service.js`: checkout, confirmação, replay, atomicidade e ownership.
- `order.controller.js` e `order.routes.js`: dois endpoints autenticados.
- `CheckoutPage.jsx`: criação do resumo e confirmação explícita.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/constants/domain.constants.js`
- EDITAR: `apps/api/src/models/order.model.js`
- EDITAR: `apps/api/src/validators/checkout.validator.js`
- EDITAR: `apps/api/src/providers/payment.provider.js`
- EDITAR: `apps/api/src/services/order.service.js`
- EDITAR: `apps/api/src/controllers/order.controller.js`
- EDITAR: `apps/api/src/routes/order.routes.js`
- EDITAR: `apps/web/src/pages/CheckoutPage.jsx`
- CRIAR/EDITAR: testes unitários, integração, concorrência e browser.

#### Tutorial técnico linear

### Passo 1 - Fixar modo e estados

```js
// apps/api/src/constants/domain.constants.js
export const PAYMENT_MODE = Object.freeze({
    SIMULATED: "simulated",
});

export const PAYMENT_STATUS = Object.freeze({
    AWAITING_SIMULATION: "awaiting_simulation",
    SIMULATED_PAID: "simulated_paid",
    SIMULATED_FAILED: "simulated_failed",
});
```

Os arrays dos schemas e guards devem derivar destas constantes. Não cries strings paralelas.

### Passo 2 - Modelar metadados simulados

```js
// excerto de apps/api/src/models/order.model.js
const paymentSchema = new Schema(
    {
        mode: {
            type: String,
            enum: [PAYMENT_MODE.SIMULATED],
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            required: true,
        },
        simulationReference: { type: String, default: null },
        simulatedAt: { type: Date, default: null },
        idempotencyKeyHash: { type: String, default: null, select: false },
        message: { type: String, required: true },
    },
    { _id: false },
);
```

O DTO pode devolver `mode`, `status`, `simulationReference`, `simulatedAt` e `message`. Nunca devolve `idempotencyKeyHash`, `paymentAttempts`, `userId` ou `checkoutKey`. O histórico interno associa cada hash a um snapshot público terminal para permitir replay exato mesmo após uma tentativa posterior.

### Passo 3 - Fechar os validators

```js
// apps/api/src/validators/checkout.validator.js
export function validateCheckoutPayload(body) {
    if (
        body !== undefined &&
        body !== null &&
        (typeof body !== "object" || Array.isArray(body) || Object.keys(body).length > 0)
    ) {
        throw new AppError(400, "O checkout não aceita método, preço ou dados de pagamento.");
    }
    return {};
}

export function validatePaymentIdempotencyKey(headers) {
    const rawKey = headers?.["idempotency-key"];
    const key = Array.isArray(rawKey) ? "" : String(rawKey ?? "").trim();

    if (key.length < 8 || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
        throw new AppError(400, "Header Idempotency-Key obrigatório e inválido.");
    }
    return key;
}
```

Valida também `orderId` como ObjectId antes de consultar a base de dados.

### Passo 4 - Criar estados puramente locais

```js
// apps/api/src/providers/payment.provider.js
import { randomUUID } from "node:crypto";

export function createAwaitingSimulationPayment() {
    return {
        mode: PAYMENT_MODE.SIMULATED,
        status: PAYMENT_STATUS.AWAITING_SIMULATION,
        simulationReference: null,
        simulatedAt: null,
        idempotencyKeyHash: null,
        message: "Pagamento por simular. Não será efetuada qualquer cobrança.",
    };
}

export function createSuccessfulSimulationPayment(
    order,
    { now = new Date(), randomId = randomUUID } = {},
) {
    return {
        mode: PAYMENT_MODE.SIMULATED,
        status: PAYMENT_STATUS.SIMULATED_PAID,
        simulationReference: `sim-${order._id}-${randomId()}`,
        simulatedAt: now,
        message: "Demonstração académica — não foi efetuada qualquer cobrança.",
    };
}
```

O ficheiro não importa `fetch`, cliente HTTP, URL ou credencial. Um factory de falha equivalente existe apenas para testes internos.

### Passo 5 - Criar checkout em estado pendente

```js
// excerto de apps/api/src/services/order.service.js
export async function checkoutMyCart(userId) {
    const cart = await getOwnedCartWithItems(userId);
    const prepared = await buildCheckoutSnapshot(userId, cart);

    let order = await Order.findOne({
        userId,
        checkoutKey: prepared.checkoutKey,
    });

    if (!order) {
        order = await Order.create({
            ...prepared,
            userId,
            payment: createAwaitingSimulationPayment(),
            stockReserved: false,
        });
    }

    return toOrderResponse(order);
}
```

Este passo não reduz stock, não consome voucher e não elimina o carrinho. A resposta `201` contém `awaiting_simulation`.

### Passo 6 - Confirmar com Idempotency-Key

O service procura a encomenda por `_id` e `userId`, calcula SHA-256 da chave e consulta primeiro o histórico interno. O mesmo hash devolve o snapshot já persistido, sem repetir validações mutáveis ou efeitos comerciais. Apenas uma chave ainda não registada segue para a revalidação de carrinho, preços, stock e voucher e para a operação atómica.

```js
// excerto de apps/api/src/controllers/order.controller.js
export async function simulateOrderPaymentController(req, res, next) {
    try {
        const { orderId } = validateOrderIdParam(req.params);
        const idempotencyKey = validatePaymentIdempotencyKey(req.headers);
        const order = await simulateOrderPayment(
            req.user.id,
            orderId,
            idempotencyKey,
        );
        return res.status(200).json({ order });
    } catch (error) {
        return next(error);
    }
}
```

Falha simulada guarda `simulated_failed`, não reduz stock, não consome voucher e preserva carrinho. Repetir a mesma chave devolve essa falha terminal; uma nova ação explícita usa uma chave nova. Sucesso guarda `simulated_paid`, reduz stock uma vez, consome o voucher uma vez e limpa o carrinho; qualquer replay da chave de sucesso devolve o snapshot original.

### Passo 7 - Ligar routes e UI

```js
// apps/api/src/routes/order.routes.js
orderRoutes.post("/orders/checkout", requireAuth, checkoutController);
orderRoutes.post(
    "/orders/:orderId/payments/simulate",
    requireAuth,
    simulateOrderPaymentController,
);
```

```jsx
// excerto de apps/web/src/pages/CheckoutPage.jsx
<button type="button" onClick={handleCheckout} disabled={status === "loading"}>
    Criar resumo do checkout
</button>

{order?.payment.status === "awaiting_simulation" && (
    <button type="button" onClick={handleSimulatePayment}>
        Simular pagamento
    </button>
)}

<p role="note">
    Demonstração académica local. Não introduza dados financeiros: nenhum valor será cobrado.
</p>
```

`handleSimulatePayment` envia body vazio e `Idempotency-Key`. A UI implementada mantém a chave nos retries de transporte e gera outra apenas depois de receber uma falha terminal e de o utilizador iniciar nova simulação. Não contém seletor, campo financeiro, iframe ou URL externa.

### Passo 8 - Provar replay, concorrência e rollback

Executar cenarios negativos obrigatorios (minimo 3): body inesperado, chave ausente/inválida, ownership, carrinho alterado, preço alterado, stock insuficiente, falha interna, replay de sucesso/falha terminal e pedidos concorrentes.

```js
it("faz replay com a mesma Idempotency-Key", async () => {
    const first = await simulateOrderPayment(userId, orderId, "payment-run-001");
    const second = await simulateOrderPayment(userId, orderId, "payment-run-001");

    expect(second.id).toBe(first.id);
    expect(second.payment.simulationReference).toBe(
        first.payment.simulationReference,
    );
});
```

Um teste com falha injetada depois de cada efeito deve confirmar que a operação não deixa stock, voucher, carrinho e encomenda em estados parciais. O gate de concorrência final usa 25 pedidos equivalentes e exige uma encomenda, uma redução de stock e um consumo de voucher.

## Bloco pedagogico

### Objetivo

Compreender como body vazio, ownership, idempotência por header e atomicidade tornam uma simulação académica segura e reproduzível.

### Pre-requisitos

- Conhecer `async/await`, services, validators e DTOs.
- Distinguir checkout, encomenda e confirmação simulada.
- Saber testar concorrência e falhas injetadas.

### Erros comuns

- Consumir stock ou voucher durante o checkout inicial.
- Aceitar modo, preço, itens ou resultado no body.
- Guardar a `Idempotency-Key` em claro.
- Tratar bloqueio de duplo clique como garantia suficiente.
- Devolver hashes, identidade interna ou configuração no DTO.

### Check de compreensao

- [ ] Sei explicar os dois endpoints e os três estados.
- [ ] Sei justificar `Idempotency-Key` e o seu hash.
- [ ] Sei provar que replay não repete efeitos.
- [ ] Sei explicar por que a falha preserva stock, voucher e carrinho.
- [ ] Sei provar ausência de rede e dados financeiros.

## Bloco operacional

### Entrada

- Carrinho autenticado com produtos ativos.
- Base de testes académica e isolada.
- Suporte a sessões MongoDB para os testes atómicos.
- Nenhuma credencial ou URL financeira configurada.

### Passos

1. Fixar modo e estados canónicos.
2. Modelar metadados simulados.
3. Fechar body, `orderId` e `Idempotency-Key`.
4. Criar estados puramente locais.
5. Criar checkout em `awaiting_simulation`.
6. Confirmar a simulação de forma idempotente e atómica.
7. Ligar routes e UI.
8. Executar cenarios negativos obrigatorios (minimo 3).

### Validacao

- [ ] `npm --prefix apps/api test` passa.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] Checkout body vazio devolve `201` e `awaiting_simulation`.
- [ ] Confirmação com header válido devolve `200` e estado final simulado.
- [ ] Mesmo header devolve a mesma referência sem repetir efeitos.
- [ ] Falha não consome stock, voucher ou carrinho.
- [ ] Nenhum teste observa chamada de rede financeira.
- [ ] Negativos: minimo `3` cenarios com resultado esperado e observado.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova mínima |
| --- | --- | --- |
| P0 | unit | constantes, validators e estados locais |
| P0 | integração | dois endpoints, ownership, preços, stock, voucher e replay |
| P0 | concorrência | dois pedidos equivalentes, um único efeito comercial |
| P0 | browser | resumo, confirmação explícita e aviso académico |
| P0 | negativo | chave inválida, carrinho/preço alterado e falha interna |

### Evidencia de testes por camada

- Unit: body vazio, header, ObjectId e factories locais.
- Integração: `awaiting_simulation`, `simulated_paid`, `simulated_failed` e ownership.
- Concorrência: mesma chave e mesmo `order.id` sem efeito duplicado.
- Browser: duas ações, estados acessíveis e ausência de campos financeiros.
- Evidence: commit, comandos, exit codes e artefactos sanitizados.

### Handoff

`BK-MF7-07` trata apenas a API de IA e não pode reutilizar configuração ou dados do Pagamento simulado. `BK-MF8-01` preserva a separação entre constants, model, validator, provider de simulação local, service, controller, routes e UI.

## Criterios de aceite

- `RNF17` usa apenas `payment.mode = "simulated"`.
- Checkout body vazio cria `awaiting_simulation`.
- Confirmação exige `Idempotency-Key` e termina em `simulated_paid` ou `simulated_failed`.
- Replay não repete efeitos comerciais.
- Falha preserva stock, voucher e carrinho.
- Nenhuma camada pede dados financeiros ou comunica com serviços financeiros.
- DTO exclui hashes, identidade interna e configuração.
- Cenarios negativos concluidos: minimo `3`.

## Evidence para PR/defesa

- Resposta `201` de `POST /api/orders/checkout` com `awaiting_simulation`.
- Resposta `200` de `POST /api/orders/:orderId/payments/simulate` com estado final.
- Negativo sem `Idempotency-Key` com `400`.
- Ownership negativo sem revelar existência da encomenda.
- Replay com a mesma `simulationReference`.
- Falha injetada sem efeitos parciais.
- Build web e suites no mesmo commit.

#### Expected results

- Os dois endpoints têm responsabilidades distintas.
- Só existem `mode=simulated` e os três estados canónicos.
- O resultado final é local e explicitamente académico.
- Retry e concorrência não duplicam efeitos.
- Replay de uma chave terminal devolve o snapshot original, quer tenha sido sucesso ou falha.
- Não existe comunicação financeira externa.

#### Handoff final

Próximo BK recomendado: `BK-MF7-07`.

#### Changelog

- `2026-07-10`: estado da referência reconciliado com replay terminal por hash, UI de dois passos e evidence transacional/concorrente já implementados, sem I/O externo.
- `2026-07-09`: guia alinhado ao contrato G2 com checkout body vazio, confirmação simulada por `Idempotency-Key`, modo/estados canónicos e efeitos comerciais atómicos.
