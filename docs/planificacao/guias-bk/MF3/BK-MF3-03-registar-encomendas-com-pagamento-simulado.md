# BK-MF3-03 - Registar encomendas com Pagamento simulado

## Header
- `doc_id`: `GUIA-BK-MF3-03`
- `bk_id`: `BK-MF3-03`
- `macro`: `MF3`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF3-02`
- `rf_rnf`: `RF27`
- `fase_documental`: `Fase 2`
- `sprint`: `S07-S08`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF3-04`
- `guia_path`: `docs/planificacao/guias-bk/MF3/BK-MF3-03-registar-encomendas-com-pagamento-simulado.md`
- `last_updated`: `2026-07-10`

> **Estado atual da implementação de referência:** o fluxo local de dois passos já está implementado em `real_dev`. O backend calcula e compara o hash SHA-256 da `Idempotency-Key`, guarda um snapshot interno por tentativa terminal e devolve exatamente o mesmo resultado em replay, tanto para `simulated_paid` como para `simulated_failed`. A UI cria primeiro o resumo, mantém o aviso académico e só depois apresenta “Simular pagamento”. Não existe gateway, I/O financeiro, URL/redirect financeiro ou chamada externa neste domínio; navegação React interna same-origin depois do sucesso é permitida.

#### Objetivo

Implementar `RF27` com um único método chamado `Pagamento simulado`. `POST /api/orders/checkout`, com body vazio, cria a encomenda em `payment.mode = "simulated"` e `payment.status = "awaiting_simulation"`. Depois, `POST /api/orders/:orderId/payments/simulate`, com `Idempotency-Key`, volta a validar ownership, carrinho, produtos, preços e stock e grava `simulated_paid` ou `simulated_failed`. O fluxo é totalmente local, não pede dados financeiros, não comunica com serviços de cobrança, não abre páginas externas e não movimenta dinheiro.

#### Importância

Uma simulação honesta permite demonstrar checkout, idempotência, ownership e estados de encomenda sem introduzir dependências externas ou riscos financeiros. O frontend nunca decide o total, o utilizador dono da encomenda ou o resultado da simulação.

#### Scope-in

- Criar uma encomenda a partir do carrinho do utilizador autenticado.
- Usar apenas o método interno `simulated`, apresentado como `Pagamento simulado`.
- Calcular itens e total exclusivamente no backend.
- Separar estado logístico do resultado simulado.
- Exigir `Idempotency-Key` na confirmação da simulação e reaproveitar o mesmo resultado em retry.
- Disponibilizar ações explícitas de criar resumo e confirmar Pagamento simulado.
- Cobrir sucesso, falha simulada e negativos materiais.

#### Scope-out

- Pedir número de cartão, conta bancária, telefone financeiro ou outro dado de cobrança.
- Comunicar com serviços financeiros ou abrir URLs externas.
- Aceitar escolha de modo ou resultado no body.
- Aceitar `userId`, itens, preço, total, estado ou resultado enviados pelo frontend.
- Alterar o estado logístico para `enviado` ou `entregue` neste BK.

#### Estado antes e depois

- Antes: o carrinho é editável e ainda não constitui uma encomenda.
- Depois: o checkout cria a encomenda em `awaiting_simulation`; a confirmação idempotente muda o resultado para `simulated_paid` ou `simulated_failed`.

#### Pré-requisitos

- `BK-MF3-02` concluído, com carrinho autenticado e preços em cêntimos.
- Sessão HttpOnly resolvida pelo backend.
- Modelos `Cart`, `Product` e `Order` disponíveis.
- Noções de validação, ownership e idempotência.

#### Glossário

- Pagamento simulado: resultado local de demonstração que não representa cobrança real.
- Snapshot: cópia do nome, quantidade e preço usada no histórico da encomenda.
- Idempotency-Key: header obrigatório usado para reconhecer a repetição da mesma confirmação simulada.
- Estado logístico: situação operacional da encomenda, independente do resultado simulado.

#### Conceitos teóricos essenciais

O browser é uma fonte não confiável. Mesmo que apresente o total correto, o backend deve reler os produtos e usar o preço atual guardado na base de dados. A identidade vem da sessão e nunca do body.

Idempotência significa que um duplo clique ou retry da confirmação não repete efeitos comerciais. O backend guarda apenas o hash da `Idempotency-Key`, nunca a chave crua, e associa-o a um snapshot interno da resposta terminal. Repetir a chave de uma tentativa falhada reproduz a mesma falha; iniciar uma nova simulação depois dessa resposta exige uma nova chave.

#### Arquitetura do BK

- `domain.constants.js`: vocabulário fechado do modo e estados.
- `order.model.js`: snapshot, total, estado logístico, resultado simulado, chave única e histórico interno de tentativas terminais.
- `checkout.validator.js`: body vazio e rejeição de campos inesperados.
- `payment.provider.js`: estados locais `awaiting_simulation`, `simulated_paid` e `simulated_failed`.
- `order.service.js`: checkout pendente, confirmação simulada, ownership, total, stock, idempotência e persistência.
- `order.controller.js` e `order.routes.js`: endpoint autenticado.
- `CheckoutPage.jsx`: criação do resumo, confirmação simulada e feedback acessível.

#### Ficheiros a criar/editar/rever

- EDITAR: `apps/api/src/constants/domain.constants.js`
- EDITAR: `apps/api/src/providers/payment.provider.js`
- EDITAR: `apps/api/src/models/order.model.js`
- EDITAR: `apps/api/src/validators/checkout.validator.js`
- EDITAR: `apps/api/src/services/order.service.js`
- EDITAR: `apps/api/src/controllers/order.controller.js`
- EDITAR: `apps/api/src/routes/order.routes.js`
- EDITAR: `apps/api/src/app.js`
- EDITAR: `apps/web/src/pages/CheckoutPage.jsx`
- CRIAR/EDITAR: testes focais de checkout e idempotência.

#### Tutorial técnico linear

### Passo 1 - Fixar o contrato único

Cria constantes fechadas. Não existe seletor de métodos nem configuração externa.

```js
// excerto de apps/api/src/constants/domain.constants.js
export const PAYMENT_MODE = Object.freeze({ SIMULATED: "simulated" });

export const PAYMENT_STATUS = Object.freeze({
    AWAITING_SIMULATION: "awaiting_simulation",
    SIMULATED_PAID: "simulated_paid",
    SIMULATED_FAILED: "simulated_failed",
});
```

Confirma que nenhum modo alternativo é aceite. O label é texto público; `simulated` é o valor interno estável.

### Passo 2 - Modelar a encomenda

O modelo deve separar logística e simulação, guardar snapshots e impor unicidade da chave.

```js
// excerto de apps/api/src/models/order.model.js
const orderSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        checkoutKey: { type: String, required: true, index: true },
        items: [{
            productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            unitPriceCents: { type: Number, required: true, min: 0 },
            quantity: { type: Number, required: true, min: 1 },
            lineTotalCents: { type: Number, required: true, min: 0 },
        }],
        subtotalCents: { type: Number, required: true, min: 0 },
        discountCents: { type: Number, default: 0, min: 0 },
        totalCents: { type: Number, required: true, min: 0 },
        status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDENTE },
        payment: {
            mode: { type: String, enum: [PAYMENT_MODE.SIMULATED], default: PAYMENT_MODE.SIMULATED },
            status: { type: String, enum: Object.values(PAYMENT_STATUS), required: true },
            simulationReference: { type: String, default: null },
            simulatedAt: { type: Date, default: null },
            idempotencyKeyHash: { type: String, default: null, select: false },
            message: { type: String, required: true },
        },
    },
    { timestamps: true },
);
```

O snapshot suporta histórico sem confiar no frontend. `idempotencyKeyHash` e o histórico interno `paymentAttempts` não saem em queries normais ou DTOs. Cada tentativa terminal guarda o hash, o estado, a referência/data e o snapshot público necessário para um replay exato.

### Passo 3 - Rejeitar payloads de negócio

O endpoint não precisa de receber dados para decidir identidade, carrinho, total ou método.

```js
// apps/api/src/validators/checkout.validator.js
import { AppError } from "../middlewares/error.middleware.js";

export function validateCheckoutPayload(body) {
    const keys = Object.keys(body ?? {});

    if (keys.length > 0) {
        throw new AppError(400, "O checkout simulado não aceita campos no body");
    }

    return Object.freeze({});
}
```

Testa bodies com preço, itens, identidade, método ou estado. Todos devem devolver `400`.

### Passo 4 - Criar os estados locais

O checkout cria primeiro o estado pendente. O caminho normal da confirmação devolve sucesso simulado; a falha é injetada apenas em testes, nunca escolhida pelo browser.

```js
// apps/api/src/providers/payment.provider.js
import { randomUUID } from "node:crypto";
import { PAYMENT_MODE, PAYMENT_STATUS } from "../constants/domain.constants.js";

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

Este módulo não usa rede nem lê credenciais. Um factory equivalente de falha fica disponível apenas para testes internos.

### Passo 5 - Criar a encomenda pendente

O checkout carrega o carrinho do dono autenticado, relê os produtos, calcula snapshots e cria a encomenda sem consumir stock, voucher ou carrinho.

```js
// excerto de apps/api/src/services/order.service.js
import { createHash } from "node:crypto";

function buildCheckoutKey(userId, cart) {
    const cartVersion = cart.items
        .map(({ productId, quantity }) => `${productId}:${quantity}`)
        .sort()
        .join("|");

    return createHash("sha256")
        .update(`${userId}:${cart._id}:${cartVersion}`)
        .digest("hex");
}

export async function checkoutMyCart(userId) {
    const cart = await Cart.findOne({ userId });
    if (!cart?.items?.length) throw new AppError(400, "Carrinho vazio");

    const checkoutKey = buildCheckoutKey(userId, cart);
    const existingOrder = await Order.findOne({ userId, checkoutKey });
    if (existingOrder) return toOrderResponse(existingOrder);

    const items = await buildOrderItemsFromCart(cart.items);
    const totalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const payment = createAwaitingSimulationPayment();
    const order = await Order.create({ userId, checkoutKey, items, totalCents, payment });

    return toOrderResponse(order);
}
```

`buildOrderItemsFromCart` deve recusar produto inexistente, inativo ou sem stock. O checkout devolve `201` e `awaiting_simulation`; o resultado público não devolve `userId`, `checkoutKey` ou hashes internos.

### Passo 6 - Expor os dois endpoints autenticados

```js
// excertos de controller e route
export async function checkoutController(req, res, next) {
    try {
        validateCheckoutPayload(req.body);
        const order = await checkoutMyCart(req.user.id);
        return res.status(201).json({ order });
    } catch (error) {
        return next(error);
    }
}

export async function simulateOrderPaymentController(req, res, next) {
    try {
        const { orderId } = validateOrderIdParam(req.params);
        const idempotencyKey = validatePaymentIdempotencyKey(req.headers);
        const order = await simulateOrderPayment(req.user.id, orderId, idempotencyKey);
        return res.status(200).json({ order });
    } catch (error) {
        return next(error);
    }
}

router.post("/orders/checkout", requireAuth, checkoutController);
router.post(
    "/orders/:orderId/payments/simulate",
    requireAuth,
    simulateOrderPaymentController,
);
```

`validatePaymentIdempotencyKey` exige 8–128 caracteres seguros no header `Idempotency-Key`. Sem sessão espera `401`; uma encomenda de outro cliente espera `404`.

Antes de executar qualquer novo efeito, o service procura o hash no histórico de tentativas. Se já existir, devolve o snapshot persistido sem voltar a tocar em stock, voucher, encomenda ou carrinho. Isto aplica-se aos dois resultados terminais. Uma chave diferente depois de `simulated_failed` representa uma nova ação explícita; uma chave diferente depois de `simulated_paid` é rejeitada porque a encomenda já está concluída.

### Passo 7 - Criar as duas ações explícitas na UI

```jsx
// excerto de apps/web/src/pages/CheckoutPage.jsx
<button type="button" onClick={handleCheckout} disabled={status === "loading"}>
    {status === "loading" ? "A criar resumo..." : "Criar resumo do checkout"}
</button>

{order?.payment.status === "awaiting_simulation" && (
    <button type="button" onClick={handleSimulatePayment}>
        Simular pagamento
    </button>
)}

<p className="form-hint">
    Demonstração local: não são pedidos dados financeiros e não há movimentação de dinheiro.
</p>
```

O checkout envia body vazio. `handleSimulatePayment` chama `/orders/${orderId}/payments/simulate` com uma `Idempotency-Key` estável durante retries de transporte. Depois de uma resposta terminal falhada, uma nova ação explícita gera uma nova chave; repetir diretamente a chave anterior continua a reproduzir a resposta falhada. A UI implementada mostra `loading`, `error` e `success`, não contém seletor e não abre URL externa.

### Passo 8 - Executar testes e recolher evidence

Executar cenarios negativos obrigatorios (minimo 3): sem sessão, carrinho vazio, campo inesperado, `Idempotency-Key` ausente/inválida, ownership, stock insuficiente e replay da mesma chave para ambos os resultados terminais.

```js
it("reaproveita o resultado com a mesma Idempotency-Key", async () => {
    const order = await checkoutMyCart(userId);
    const first = await simulateOrderPayment(userId, order.id, "sim-run-001");
    const second = await simulateOrderPayment(userId, order.id, "sim-run-001");

    expect(second.id).toBe(first.id);
    expect(second.payment.simulationReference).toBe(
        first.payment.simulationReference,
    );
});
```

Regista comandos, exit code e resumo sanitizado. Não copies cookies, identificadores pessoais ou conteúdo do carrinho para a evidence.

## Bloco pedagogico

### Objetivo

Compreender como um checkout académico pode provar regras reais de ownership, cálculo e idempotência mantendo o resultado financeiro explicitamente simulado.

### Pre-requisitos

- Conhecer `async/await`, services e validators.
- Distinguir carrinho, encomenda, estado logístico e resultado simulado.
- Saber que o backend é a fonte de verdade para identidade e preço.

### Erros comuns

- Aceitar total, itens ou identidade do frontend.
- Permitir que o browser escolha sucesso ou falha.
- Criar nova encomenda em cada retry.
- Apresentar a simulação como cobrança real.
- Limpar o carrinho antes de a encomenda ficar persistida.

### Check de compreensao

- [ ] Sei explicar por que o body fica vazio.
- [ ] Sei justificar a `Idempotency-Key` e o hash persistido.
- [ ] Sei distinguir `order.status` de `payment.status`.
- [ ] Sei provar que a simulação não usa rede ou credenciais financeiras.

## Bloco operacional

### Entrada

- Carrinho autenticado com produtos ativos e stock suficiente.
- API e web locais em execução.
- Base académica isolada para testes.

### Passos

1. Criar constantes do método único.
2. Ajustar o modelo de encomenda.
3. Fechar o validator a body vazio.
4. Implementar os estados locais da simulação.
5. Criar a encomenda em `awaiting_simulation`.
6. Ligar checkout e confirmação simulada autenticados.
7. Criar as duas ações explícitas na UI.
8. Executar cenarios negativos obrigatorios (minimo 3).

### Validacao

- [ ] `npm --prefix apps/api test` passa.
- [ ] `npm --prefix apps/web run build` passa.
- [ ] Método público único: `Pagamento simulado`.
- [ ] Body do checkout vazio; identidade, preço e resultado ficam no backend.
- [ ] Replay da mesma `Idempotency-Key` devolve a mesma referência simulada.
- [ ] Não existe chamada de rede ou redirecionamento financeiro.
- [ ] Negativos: minimo `3` cenarios com resultado esperado e observado.

### Matriz minima de testes por prioridade

| Prioridade | Camada | Prova mínima |
| --- | --- | --- |
| P0 | integração API | checkout `awaiting_simulation`, ownership, confirmação, falha injetada e replay |
| P0 | frontend | duas ações explícitas, estados acessíveis e ausência de seletor/URL externa |
| P0 | negativo | sem sessão, carrinho vazio e campo inesperado |

### Evidencia de testes por camada

- Unit: constantes, validator, chave de checkout e simulador.
- Integração: duas routes autenticadas, total do backend, persistência e idempotência por header.
- Frontend: criação do resumo, confirmação simulada, loading/error/success e copy académico explícito.
- Evidence: comando, exit code, data e commit; nunca dados privados.

### Handoff

`BK-MF3-04` deve listar apenas encomendas do utilizador autenticado e preservar a distinção entre estado logístico e resultado simulado. `BK-MF3-08` deve garantir que o stock associado a `simulated_paid` é aplicado uma única vez, sem duplicar o efeito já coordenado pela confirmação simulada.

## Criterios de aceite

- `RF27` usa exclusivamente o método `Pagamento simulado`.
- O backend decide identidade, itens, preço, total e resultado.
- O frontend não pede dados financeiros nem oferece alternativas.
- O fluxo não usa credenciais, rede ou redirecionamento externo.
- Checkout cria `awaiting_simulation`; confirmação produz apenas `simulated_paid` ou `simulated_failed`.
- Replay da mesma `Idempotency-Key` não repete efeitos comerciais.
- Cenarios negativos concluidos: minimo `3`.
- Evidence sanitizada e ligada ao commit atual.

## Evidence para PR/defesa

- Output da suite API focal.
- Output do build web.
- Resposta `201` do checkout com `payment.mode = "simulated"` e `payment.status = "awaiting_simulation"`.
- Resposta `200` da confirmação com `simulated_paid` ou `simulated_failed`.
- Negativos `401`, `409` e `400` sem dados privados.
- Prova de replay com o mesmo `order.id` e `simulationReference`.
- Screenshot das duas ações e do aviso académico.

#### Expected results

- Checkout válido cria uma encomenda própria em `awaiting_simulation` com total recalculado.
- Confirmação com `Idempotency-Key` produz `simulated_paid`; falha injetada em teste produz `simulated_failed`.
- Replay da mesma chave devolve o snapshot terminal original, incluindo quando esse resultado foi `simulated_failed`.
- Campos inesperados são rejeitados.
- Nenhuma chamada externa é necessária.

#### Handoff final

Próximo BK recomendado: `BK-MF3-04`.

#### Changelog

- `2026-07-10`: estado da referência reconciliado com replay por hash para sucesso/falha terminal e UI de dois passos já implementada, sempre sem gateway ou I/O externo.
- `2026-07-09`: guia reescrito para o contrato único `Pagamento simulado`, sem integração financeira externa ou movimentação de dinheiro.
