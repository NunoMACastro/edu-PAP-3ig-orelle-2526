# BK-MF4-08 - Guardar alergias, ingredientes a evitar e restrições médicas leves no perfil e impedir recomendações que violem regras

## Header
- `doc_id`: `GUIA-BK-MF4-08`
- `bk_id`: `BK-MF4-08`
- `macro`: `MF4`
- `owner`: `Izelicks`
- `apoio`: `Bruna`
- `prioridade`: `P0`
- `estado`: `TODO`
- `esforco`: `M`
- `dependencias`: `BK-MF0-03`
- `rf_rnf`: `RF40`
- `fase_documental`: `Fase 2`
- `sprint`: `S08-S09`
- `core_or_reforco`: `Reforco`
- `proximo_bk`: `BK-MF5-01`
- `guia_path`: `docs/planificacao/guias-bk/MF4/BK-MF4-08-guardar-alergias-ingredientes-a-evitar-e-restricoes-medicas-leves-no-perfil-e-impedir-recomendacoes-que-violem-regras.md`
- `last_updated`: `2026-06-15`

#### Objetivo
Guardar alergias, ingredientes a evitar e restrições médicas leves no perfil do utilizador, e impedir que o motor de recomendações proponha produtos que violem essas regras.

#### Importância
Este BK protege confiança e segurança do utilizador. A Orélle não pode recomendar um produto com ingrediente que o próprio utilizador marcou como alergénico ou a evitar. A validação deve acontecer no backend, porque o frontend pode ser contornado.

#### Scope-in
- Estender `Profile` com listas de alergias, ingredientes a evitar e restrições leves.
- Atualizar validators e services de perfil.
- Atualizar UI de perfil para recolher esses dados.
- Filtrar recomendações com base em ingredientes do produto.
- Incluir motivo de bloqueio em validações e testes.

#### Scope-out
- Não fazer avaliação clínica.
- Não inferir alergias a partir de fotografia.
- Não substituir aconselhamento de profissional de saúde.
- Não esconder todos os produtos do catálogo; o bloqueio aplica-se às recomendações personalizadas.
- Não adicionar produtos automaticamente ao carrinho.

#### Estado antes e depois
- Antes: `Profile` guardava pele, género, idade e objetivos; recomendações filtravam por sinais cosméticos e stock.
- Depois: perfil guarda restrições e recomendações excluem produtos incompatíveis antes de gerar ranking.

#### Pre-requisitos
- `BK-MF0-03`: perfil personalizado.
- `BK-MF0-07`: produtos com `ingredientNames`.
- `BK-MF2-02`: recomendações personalizadas.
- `BK-MF2-03`: explicações de recomendação.
- `RF40`: restrições no perfil e bloqueio de recomendações incompatíveis.

#### Glossário
- Alergia: item declarado pelo utilizador que deve bloquear recomendações com o ingrediente correspondente.
- Ingrediente a evitar: substância que o utilizador prefere excluir.
- Restrição médica leve: nota declarativa, sem interpretação clínica automática.
- Normalização: transformar texto para comparação consistente.
- Produto incompatível: produto com ingrediente que coincide com uma regra de bloqueio.

#### Conceitos teóricos essenciais
O backend deve aplicar o bloqueio antes de criar recomendações. Se o produto incompatível já entrou no ranking, a UI pode falhar e mostrar algo perigoso.

As restrições são declaradas pelo utilizador. A app não diagnostica, não confirma alergias e não promete segurança absoluta. Ela usa a informação indicada para evitar recomendações óbvias com ingredientes registados.

Comparação de ingredientes deve ser normalizada: minúsculas, espaços aparados e listas sem duplicados. Isto reduz falhas por diferenças simples como `Niacinamida` versus `niacinamida`.

#### Arquitetura do BK
- `profile.model.js`: acrescenta listas de restrições.
- `profile.validator.js`: valida e normaliza listas.
- `profile.service.js`: devolve e atualiza restrições.
- `EditProfilePage.jsx`: permite editar restrições.
- `recommendation.service.js`: filtra produtos incompatíveis.
- `recommendation-restrictions.service.js`: concentra regras de bloqueio.
- Testes: cobrem normalização e bloqueio.

#### Ficheiros a criar/editar/rever
- EDITAR: `apps/api/src/models/profile.model.js`
- EDITAR: `apps/api/src/validators/profile.validator.js`
- EDITAR: `apps/api/src/services/profile.service.js`
- CRIAR: `apps/api/src/services/recommendation-restrictions.service.js`
- EDITAR: `apps/api/src/services/recommendation.service.js`
- EDITAR: `apps/web/src/pages/EditProfilePage.jsx`
- EDITAR: `apps/web/src/pages/ProductRecommendationsPage.jsx`
- CRIAR/EDITAR: `apps/api/tests/mf4.restrictions.test.js`
- REVER: `apps/api/src/models/product.model.js`

#### Tutorial técnico linear
### Passo 1 - Confirmar contrato de RF40

1. Objetivo funcional do passo no contexto da app.

garantir que restrições bloqueiam recomendações, não apenas aparecem no perfil.
2. Ficheiros envolvidos:
   - REVER: `docs/RF.md`
   - REVER: `docs/planificacao/backlogs/MATRIZ-CANONICA-BK.md`
   - REVER: `apps/api/src/services/recommendation.service.js`
3. Instruções do que fazer.

identificar ponto de ranking antes de persistir recomendações.
4. Código completo, correto e integrado com a app final.

```text
Contrato do BK: restrições guardadas no perfil -> produtos incompatíveis excluídos antes de criar ProductRecommendation.
```

5. Explicação do código.

o ponto de integração tem de ficar antes de `ProductRecommendation.findOneAndUpdate`, porque esse é o momento em que a app decide que produtos vão ser persistidos como recomendação. Para os alunos, a ideia central é: não basta esconder um produto na página; o backend deve impedir que ele seja gravado como recomendação ativa quando viola uma restrição declarada no perfil.
6. Validação do passo.

criar produto incompatível e confirmar que não chega ao array final.
7. Cenário negativo/erro esperado.

filtrar só no frontend permite que a API continue a recomendar produto bloqueado.

### Passo 2 - Estender Profile

1. Objetivo funcional do passo no contexto da app.

persistir listas de restrições.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/models/profile.model.js`
   - LOCALIZAÇÃO: dentro de `profileSchema`.
3. Instruções do que fazer.

adicionar arrays simples de strings normalizadas.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/models/profile.model.js
const profileSchema = new Schema(
    {
        // Ownership: cada perfil pertence a uma única conta.
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        nome: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 80,
        },
        idade: {
            type: Number,
            required: true,
            min: 13,
            max: 120,
        },
        tipoDePele: {
            type: String,
            required: true,
            enum: SKIN_TYPES,
        },
        genero: {
            type: String,
            required: true,
            enum: GENDERS,
        },
        objetivos: {
            type: [String],
            default: [],
        },
        // Alergias declaradas pelo utilizador, guardadas como texto normalizado.
        allergies: {
            type: [String],
            default: [],
        },
        // Ingredientes que o utilizador quer evitar mesmo sem declarar alergia.
        avoidIngredients: {
            type: [String],
            default: [],
        },
        // Campo informativo: não faz diagnóstico e não substitui aconselhamento profissional.
        lightMedicalRestrictions: {
            type: [String],
            default: [],
        },
        // A fotografia continua separada das restrições para não misturar responsabilidades.
        profilePhotoUrl: {
            type: String,
            default: "",
        },
        profilePhotoMode: {
            type: String,
            enum: ["stub_url", "secure_upload"],
            default: "stub_url",
        },
        profilePhotoUpdatedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);
```

5. Explicação do código.

os campos novos são listas opcionais para manter compatibilidade com perfis antigos. `allergies` e `avoidIngredients` são as listas que o motor consegue comparar com ingredientes do produto. `lightMedicalRestrictions` fica como informação declarativa e transparente, mas não deve ser tratada como diagnóstico médico automático. Esta separação ajuda os alunos a perceber que nem todo o dado guardado deve acionar a mesma regra.
6. Validação do passo.

perfil antigo continua válido com arrays vazios.
7. Cenário negativo/erro esperado.

tornar restrições obrigatórias quebraria utilizadores já existentes.

### Passo 3 - Atualizar validator e service de perfil

1. Objetivo funcional do passo no contexto da app.

normalizar listas e devolvê-las no DTO.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/validators/profile.validator.js`
   - EDITAR: `apps/api/src/services/profile.service.js`
3. Instruções do que fazer.

reutilizar `validateCreateProfileInput` e `validateUpdateProfileInput`, acrescentando helpers de restrições e os campos novos no DTO.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/validators/profile.validator.js
/**
 * Validadores de perfil personalizado.
 *
 * O BK-MF0-03 cria o perfil inicial. O BK-MF0-04 reutiliza os mesmos limites
 * para edição controlada. O BK-MF4-08 acrescenta restrições declarativas sem
 * mudar os nomes exportados que o controller real já consome.
 */
import { AppError } from "../middlewares/error.middleware.js";
import { GENDERS, SKIN_TYPES } from "../models/profile.model.js";

const RESTRICTION_FIELDS = [
    "allergies",
    "avoidIngredients",
    "lightMedicalRestrictions",
];

/**
 * Normaliza texto simples vindo de formulários.
 *
 * @function normalizeText
 * @param {unknown} value - Valor original.
 * @returns {string} Texto sem espaços nas pontas.
 */
function normalizeText(value) {
    return String(value ?? "").trim();
}

/**
 * Normaliza listas de texto, removendo vazios e duplicados.
 *
 * @function normalizeList
 * @param {unknown} value - Valor original, esperado como array.
 * @returns {string[]} Lista em minúsculas, sem vazios e sem duplicados.
 */
function normalizeList(value) {
    if (!Array.isArray(value)) return [];

    return [
        ...new Set(
            value
                // Minúsculas e trim reduzem duplicados como " Retinol " e "retinol".
                .map((item) => normalizeText(item).toLowerCase())
                .filter(Boolean),
        ),
    ];
}

/**
 * Normaliza uma lista opcional de restrições de perfil.
 *
 * @function normalizeRestrictionList
 * @param {unknown} value - Valor recebido do frontend.
 * @param {string} fieldName - Nome do campo validado.
 * @param {Record<string, string>} errors - Mapa de erros acumulado.
 * @returns {string[]} Lista segura para persistir.
 */
function normalizeRestrictionList(value, fieldName, errors) {
    if (value === undefined) return [];

    if (!Array.isArray(value)) {
        errors[fieldName] = "Indica uma lista de textos";
        return [];
    }

    const normalized = normalizeList(value);
    // Limites curtos mantêm o perfil legível e evitam texto livre sem controlo.
    const hasInvalidItem = normalized.some(
        (item) => item.length < 2 || item.length > 80,
    );

    if (hasInvalidItem) {
        errors[fieldName] = "Cada item deve ter entre 2 e 80 caracteres";
        return [];
    }

    if (normalized.length > 20) {
        // Um teto por lista evita perfis demasiado grandes e formulários difíceis de usar.
        errors[fieldName] = "Indica no máximo 20 itens";
        return [];
    }

    return normalized;
}

/**
 * Acrescenta restrições opcionais ao payload validado.
 *
 * @function appendRestrictionFields
 * @param {Record<string, unknown>} body - Corpo do pedido.
 * @param {Record<string, unknown>} payload - Payload em construção.
 * @param {Record<string, string>} errors - Mapa de erros acumulado.
 * @param {{onlyPresent?: boolean}} options - Define se só valida campos enviados.
 * @returns {void}
 */
function appendRestrictionFields(body, payload, errors, options = {}) {
    for (const fieldName of RESTRICTION_FIELDS) {
        // Em edição parcial, só validamos o campo se ele tiver sido enviado.
        if (options.onlyPresent && !(fieldName in body)) continue;

        const value = normalizeRestrictionList(body[fieldName], fieldName, errors);
        if (!(fieldName in errors)) {
            // Só copiamos para o payload quando a lista passou todas as validações.
            payload[fieldName] = value;
        }
    }
}

/**
 * Valida a criação do perfil personalizado do RF03 e restrições do RF40.
 *
 * @function validateCreateProfileInput
 * @param {{nome?: unknown, idade?: unknown, tipoDePele?: unknown, genero?: unknown, objetivos?: unknown, allergies?: unknown, avoidIngredients?: unknown, lightMedicalRestrictions?: unknown}} body - Corpo do pedido.
 * @returns {{nome: string, idade: number, tipoDePele: string, genero: string, objetivos: string[], allergies: string[], avoidIngredients: string[], lightMedicalRestrictions: string[]}} Dados validados.
 * @throws {AppError} Quando algum campo não cumpre o contrato do perfil.
 */
export function validateCreateProfileInput(body) {
    const input = {
        nome: normalizeText(body.nome),
        idade: Number(body.idade),
        tipoDePele: normalizeText(body.tipoDePele).toLowerCase(),
        genero: normalizeText(body.genero).toLowerCase(),
        objetivos: normalizeList(body.objetivos),
    };
    const errors = {};

    // Na criação, campos ausentes entram como listas vazias.
    appendRestrictionFields(body, input, errors);

    if (input.nome.length < 2 || input.nome.length > 80) {
        errors.nome = "Nome deve ter entre 2 e 80 caracteres";
    }

    if (
        !Number.isInteger(input.idade) ||
        input.idade < 13 ||
        input.idade > 120
    ) {
        errors.idade = "Idade deve ser um número inteiro entre 13 e 120";
    }

    if (!SKIN_TYPES.includes(input.tipoDePele)) {
        errors.tipoDePele = `Tipo de pele deve ser um destes: ${SKIN_TYPES.join(", ")}`;
    }

    if (!GENDERS.includes(input.genero)) {
        errors.genero = `Género deve ser um destes: ${GENDERS.join(", ")}`;
    }

    if (input.objetivos.length === 0 || input.objetivos.length > 5) {
        errors.objetivos = "Indica entre 1 e 5 objetivos";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de perfil inválidos", errors);
    }

    return input;
}

/**
 * Valida a edição controlada do perfil do RF04 e restrições do RF40.
 *
 * @function validateUpdateProfileInput
 * @param {Record<string, unknown>} body - Corpo do pedido de edição.
 * @returns {Partial<{nome: string, idade: number, tipoDePele: string, genero: string, objetivos: string[], allergies: string[], avoidIngredients: string[], lightMedicalRestrictions: string[]}>} Campos permitidos para atualizar.
 * @throws {AppError} Quando o payload está vazio, inválido ou tenta alterar campos proibidos.
 */
export function validateUpdateProfileInput(body) {
    const forbiddenKeys = ["userId", "role", "_id", "createdAt", "updatedAt"];
    const payload = {};
    const errors = {};

    for (const key of forbiddenKeys) {
        if (key in body) {
            // O cliente pode editar o conteúdo do perfil, mas não a sua identidade técnica.
            errors[key] = "Este campo não pode ser alterado pelo cliente";
        }
    }

    if ("nome" in body) {
        const nome = normalizeText(body.nome);
        if (nome.length < 2 || nome.length > 80) {
            errors.nome = "Nome deve ter entre 2 e 80 caracteres";
        } else {
            payload.nome = nome;
        }
    }

    if ("idade" in body) {
        const idade = Number(body.idade);
        if (!Number.isInteger(idade) || idade < 13 || idade > 120) {
            errors.idade = "Idade deve ser um número inteiro entre 13 e 120";
        } else {
            payload.idade = idade;
        }
    }

    if ("tipoDePele" in body) {
        const tipoDePele = normalizeText(body.tipoDePele).toLowerCase();
        if (!SKIN_TYPES.includes(tipoDePele)) {
            errors.tipoDePele = `Tipo de pele deve ser um destes: ${SKIN_TYPES.join(", ")}`;
        } else {
            payload.tipoDePele = tipoDePele;
        }
    }

    if ("genero" in body) {
        const genero = normalizeText(body.genero).toLowerCase();
        if (!GENDERS.includes(genero)) {
            errors.genero = `Género deve ser um destes: ${GENDERS.join(", ")}`;
        } else {
            payload.genero = genero;
        }
    }

    if ("objetivos" in body) {
        const objetivos = normalizeList(body.objetivos);
        if (objetivos.length === 0 || objetivos.length > 5) {
            errors.objetivos = "Indica entre 1 e 5 objetivos";
        } else {
            payload.objetivos = objetivos;
        }
    }

    appendRestrictionFields(body, payload, errors, { onlyPresent: true });

    if (Object.keys(payload).length === 0) {
        errors.base = "Nada para atualizar";
    }

    if (Object.keys(errors).length > 0) {
        throw new AppError(400, "Dados de perfil inválidos", errors);
    }

    return payload;
}
```

```js
// apps/api/src/services/profile.service.js
/**
 * Converte um perfil Mongoose numa resposta JSON estável.
 *
 * @function toProfileResponse
 * @param {object} profile - Documento Mongoose ou equivalente de teste.
 * @returns {{id: string, userId: string, nome: string, idade: number, tipoDePele: string, genero: string, objetivos: string[], allergies: string[], avoidIngredients: string[], lightMedicalRestrictions: string[], profilePhotoUrl: string, profilePhotoMode: string, profilePhotoUpdatedAt: Date|null, createdAt: Date|undefined, updatedAt: Date|undefined}} Perfil seguro para o cliente.
 */
function toProfileResponse(profile) {
    return {
        id: profile._id.toString(),
        userId: profile.userId.toString(),
        nome: profile.nome,
        idade: profile.idade,
        tipoDePele: profile.tipoDePele,
        genero: profile.genero,
        objetivos: profile.objetivos,
        // Fallbacks mantêm compatibilidade com documentos criados antes do RF40.
        allergies: profile.allergies ?? [],
        avoidIngredients: profile.avoidIngredients ?? [],
        lightMedicalRestrictions: profile.lightMedicalRestrictions ?? [],
        profilePhotoUrl: profile.profilePhotoUrl ?? "",
        profilePhotoMode: profile.profilePhotoMode ?? "stub_url",
        profilePhotoUpdatedAt: profile.profilePhotoUpdatedAt ?? null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
}
```

5. Explicação do código.

listas vazias são válidas porque nem todos os utilizadores têm alergias ou ingredientes a evitar. O validator transforma texto em listas previsíveis: remove espaços, passa para minúsculas, elimina duplicados e aplica limites de tamanho. Isto torna a comparação no motor de recomendações mais fiável e evita que a UI ou a base de dados fiquem poluídas com variações como `" Retinol "` e `"retinol"`.
6. Validação do passo.

enviar `["Niacinamida", " niacinamida "]` e receber apenas `["niacinamida"]`.
7. Cenário negativo/erro esperado.

aceitar strings gigantes pode poluir perfil e UI.

### Passo 4 - Criar service de bloqueio

1. Objetivo funcional do passo no contexto da app.

isolar regra de compatibilidade em função testável.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/src/services/recommendation-restrictions.service.js`
   - LOCALIZAÇÃO: ficheiro completo.
3. Instruções do que fazer.

comparar ingredientes do produto com regras do perfil.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/recommendation-restrictions.service.js
/**
 * Normaliza texto para comparação de ingredientes.
 *
 * @function normalizeRestrictionValue
 * @param {unknown} value - Valor bruto.
 * @returns {string} Valor normalizado.
 */
function normalizeRestrictionValue(value) {
    return String(value ?? "").trim().toLowerCase();
}

/**
 * Obtém conjunto de ingredientes bloqueados pelo perfil.
 *
 * @function getBlockedIngredients
 * @param {object} profile - Perfil do utilizador.
 * @returns {Set<string>} Ingredientes bloqueados.
 */
function getBlockedIngredients(profile) {
    return new Set(
        [
            // Apenas listas comparáveis com ingredientes entram no bloqueio automático.
            ...(profile.allergies ?? []),
            ...(profile.avoidIngredients ?? []),
        ]
            .map(normalizeRestrictionValue)
            .filter(Boolean),
    );
}

/**
 * Verifica se produto viola restrições declaradas no perfil.
 *
 * @function getProductRestrictionConflict
 * @param {object} product - Produto candidato.
 * @param {object} profile - Perfil do utilizador.
 * @returns {{blocked: boolean, matchedIngredients: string[]}} Resultado do bloqueio.
 */
export function getProductRestrictionConflict(product, profile) {
    const blockedIngredients = getBlockedIngredients(profile);
    const productIngredients = (product.ingredientNames ?? [])
        // A mesma normalização é aplicada aos ingredientes do produto e às restrições.
        .map(normalizeRestrictionValue)
        .filter(Boolean);

    const matchedIngredients = productIngredients.filter((ingredient) =>
        // Comparação exata evita falsos positivos por partes de palavras.
        blockedIngredients.has(ingredient),
    );

    return {
        blocked: matchedIngredients.length > 0,
        matchedIngredients,
    };
}
```

5. Explicação do código.

a função é pura: recebe produto e perfil, compara listas normalizadas e devolve apenas o resultado do conflito. Ela não grava nada, não consulta a base de dados e não muda os objetos recebidos. Isso facilita testes unitários e ajuda os alunos a ver uma boa separação: uma função decide compatibilidade; outro service decide o que fazer com essa decisão.
6. Validação do passo.

produto com `ingredientNames: ["retinol"]` e perfil com `avoidIngredients: ["retinol"]` devolve `blocked: true`.
7. Cenário negativo/erro esperado.

usar `includes` parcial pode bloquear ingredientes indevidamente, como `oil` dentro de outra palavra.

### Passo 5 - Integrar bloqueio no service de recomendação

1. Objetivo funcional do passo no contexto da app.

impedir persistência de recomendações incompatíveis.
2. Ficheiros envolvidos:
   - EDITAR: `apps/api/src/services/recommendation.service.js`
   - LOCALIZAÇÃO: dentro de `generateRecommendationsForUser`.
3. Instruções do que fazer.

carregar `Profile` e filtrar antes do ranking.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/src/services/recommendation.service.js
import { Profile } from "../models/profile.model.js";
import { getProductRestrictionConflict } from "./recommendation-restrictions.service.js";

/**
 * Obtém perfil necessário para aplicar RF40.
 *
 * @async
 * @function getProfileForRecommendation
 * @param {string} userId - Utilizador autenticado.
 * @returns {Promise<object>} Perfil do próprio utilizador.
 * @throws {AppError} Quando o perfil ainda não existe.
 */
async function getProfileForRecommendation(userId) {
    // A recomendação depende do perfil do próprio utilizador autenticado.
    const profile = await Profile.findOne({ userId });

    if (!profile) {
        throw new AppError(400, "Perfil obrigatório para gerar recomendações");
    }

    return profile;
}

export async function generateRecommendationsForUser(userId) {
    const { analysis, report } = await getLatestAnalysisAndReport(userId);
    const profile = await getProfileForRecommendation(userId);
    const products = await Product.find({ stock: { $gt: 0 } })
        .select(PRODUCT_SELECT)
        .limit(60);

    const rankedProducts = products
        .map((product) => {
            const restrictionConflict = getProductRestrictionConflict(product, profile);

            if (restrictionConflict.blocked) {
                // Produto bloqueado sai antes de receber score e antes de ser persistido.
                return null;
            }

            const ranking = scoreProductForAnalysis(product, analysis);
            if (!ranking) return null;

            return { product, ...ranking };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    if (rankedProducts.length < 3) {
        // Erro explícito é melhor do que devolver poucas recomendações sem explicar porquê.
        throw new AppError(404, "Catálogo sem produtos compatíveis suficientes");
    }

    return Promise.all(
        rankedProducts.map(async ({ product, score, reasonCodes, sourceSignals }) => {
            const reason = buildRecommendationReason({ reasonCodes, sourceSignals, product });
            const recommendation = await ProductRecommendation.findOneAndUpdate(
                { userId, analysisId: analysis._id, productId: product._id },
                {
                    $set: {
                        reportId: report._id,
                        score,
                        reasonCodes: reason.reasonCodes,
                        explanation: reason.explanation,
                        sourceSignals: reason.sourceSignals,
                        limitations: [
                            ...new Set([
                                ...(report.limitations ?? []),
                                // A resposta comunica a regra aplicada sem expor detalhes sensíveis.
                                "Produtos com alergias ou ingredientes a evitar declarados no perfil são excluídos.",
                                "Recomendação cosmética; não substitui aconselhamento profissional.",
                            ]),
                        ],
                        status: "active",
                    },
                },
                { upsert: true, new: true, runValidators: true },
            ).populate("productId", PRODUCT_SELECT);

            return toRecommendationDto(recommendation);
        }),
    );
}
```

5. Explicação do código.

o produto incompatível retorna `null` antes de receber ranking e antes da chamada a `ProductRecommendation.findOneAndUpdate`. Isto garante que o bloqueio acontece no backend e antes da persistência. A validação de mínimo de três produtos compatíveis torna o erro explícito quando o catálogo não chega para gerar uma lista segura, em vez de devolver recomendações incompletas sem contexto.
6. Validação do passo.

gerar recomendação com produto bloqueado e confirmar ausência no resultado.
7. Cenário negativo/erro esperado.

filtrar depois do `.slice(0, 5)` pode deixar menos de 3 produtos compatíveis sem erro claro.

### Passo 6 - Atualizar UI de perfil e recomendações

1. Objetivo funcional do passo no contexto da app.

recolher restrições e explicar limitações ao utilizador.
2. Ficheiros envolvidos:
   - EDITAR: `apps/web/src/pages/EditProfilePage.jsx`
   - EDITAR: `apps/web/src/pages/ProductRecommendationsPage.jsx`
3. Instruções do que fazer.

adicionar campos de texto separados por vírgula e mostrar limitações.
4. Código completo, correto e integrado com a app final.

```jsx
// apps/web/src/pages/EditProfilePage.jsx
/**
 * Página de edição de perfil com restrições declarativas do RF40.
 */
import { useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Converte texto separado por vírgulas numa lista para a API.
 *
 * @function toList
 * @param {string} text - Texto inserido pelo utilizador.
 * @returns {string[]} Lista limpa, sem itens vazios.
 */
function toList(text) {
    return text
        // A UI usa vírgulas por ser simples para alunos e utilizadores finais.
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

/**
 * Formulário de edição de dados, fotografia controlada e restrições.
 *
 * @function EditProfilePage
 * @returns {JSX.Element} UI de edição do perfil.
 */
export function EditProfilePage() {
    const [message, setMessage] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileForm, setProfileForm] = useState({
        nome: "",
        idade: "",
        tipoDePele: "mista",
        genero: "prefiro_nao_dizer",
        objetivosTexto: "hidratar",
        allergiesTexto: "",
        avoidIngredientsTexto: "",
        lightMedicalRestrictionsTexto: "",
    });
    const [photoUrl, setPhotoUrl] = useState(
        "http://localhost/avatar-demo.png",
    );

    useEffect(() => {
        // Converte listas vindas da API em texto editável no formulário.
        apiRequest("/profile/me")
            .then((data) => {
                const profile = data.profile;
                setProfileForm({
                    nome: profile.nome,
                    idade: String(profile.idade),
                    tipoDePele: profile.tipoDePele,
                    genero: profile.genero,
                    objetivosTexto: profile.objetivos.join(", "),
                    allergiesTexto: (profile.allergies ?? []).join(", "),
                    avoidIngredientsTexto: (profile.avoidIngredients ?? []).join(", "),
                    lightMedicalRestrictionsTexto: (
                        profile.lightMedicalRestrictions ?? []
                    ).join(", "),
                });
                if (profile.profilePhotoUrl) {
                    setPhotoUrl(profile.profilePhotoUrl);
                }
            })
            .catch((err) => {
                setMessage(err.message);
            })
            .finally(() => {
                setLoadingProfile(false);
            });
    }, []);

    /**
     * Atualiza um campo do formulário de perfil.
     *
     * @function updateProfileField
     * @param {import("react").ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} event - Evento do campo.
     * @returns {void}
     */
    function updateProfileField(event) {
        setProfileForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    /**
     * Guarda alterações textuais do perfil e restrições do RF40.
     *
     * @async
     * @function saveProfile
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function saveProfile(event) {
        event.preventDefault();

        try {
            // O frontend prepara listas, mas o backend volta a normalizar e validar.
            await apiRequest("/profile/me", {
                method: "PUT",
                body: JSON.stringify({
                    nome: profileForm.nome,
                    idade: Number(profileForm.idade),
                    tipoDePele: profileForm.tipoDePele,
                    genero: profileForm.genero,
                    objetivos: toList(profileForm.objetivosTexto),
                    allergies: toList(profileForm.allergiesTexto),
                    avoidIngredients: toList(profileForm.avoidIngredientsTexto),
                    lightMedicalRestrictions: toList(
                        profileForm.lightMedicalRestrictionsTexto,
                    ),
                }),
            });
            setMessage("Perfil atualizado");
        } catch (err) {
            setMessage(err.message);
        }
    }

    /**
     * Guarda o URL controlado da fotografia.
     *
     * @async
     * @function savePhoto
     * @param {import("react").FormEvent<HTMLFormElement>} event - Evento do formulário.
     * @returns {Promise<void>}
     */
    async function savePhoto(event) {
        event.preventDefault();

        try {
            await apiRequest("/profile/me/photo", {
                method: "PATCH",
                body: JSON.stringify({
                    profilePhotoMode: "stub_url",
                    profilePhotoUrl: photoUrl,
                }),
            });
            setMessage("Fotografia atualizada");
        } catch (err) {
            setMessage(err.message);
        }
    }

    return (
        <main>
            <h1>Editar perfil</h1>
            {loadingProfile && <p role="status">A carregar perfil...</p>}

            <form onSubmit={saveProfile}>
                <label>
                    Nome
                    <input
                        name="nome"
                        value={profileForm.nome}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Idade
                    <input
                        name="idade"
                        type="number"
                        value={profileForm.idade}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Tipo de pele
                    <select
                        name="tipoDePele"
                        value={profileForm.tipoDePele}
                        onChange={updateProfileField}
                    >
                        <option value="oleosa">Oleosa</option>
                        <option value="seca">Seca</option>
                        <option value="mista">Mista</option>
                        <option value="normal">Normal</option>
                        <option value="sensivel">Sensível</option>
                    </select>
                </label>
                <label>
                    Género
                    <select
                        name="genero"
                        value={profileForm.genero}
                        onChange={updateProfileField}
                    >
                        <option value="feminino">Feminino</option>
                        <option value="masculino">Masculino</option>
                        <option value="nao_binario">Não binário</option>
                        <option value="prefiro_nao_dizer">
                            Prefiro não dizer
                        </option>
                    </select>
                </label>
                <label>
                    Objetivos
                    <input
                        name="objetivosTexto"
                        value={profileForm.objetivosTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Alergias declaradas
                    <textarea
                        name="allergiesTexto"
                        value={profileForm.allergiesTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Ingredientes a evitar
                    <textarea
                        name="avoidIngredientsTexto"
                        value={profileForm.avoidIngredientsTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <label>
                    Restrições médicas leves
                    <textarea
                        name="lightMedicalRestrictionsTexto"
                        value={profileForm.lightMedicalRestrictionsTexto}
                        onChange={updateProfileField}
                    />
                </label>
                <button type="submit" disabled={loadingProfile}>
                    Guardar alterações
                </button>
            </form>

            <form onSubmit={savePhoto}>
                <label>
                    URL controlado da fotografia
                    <input
                        value={photoUrl}
                        onChange={(event) => setPhotoUrl(event.target.value)}
                    />
                </label>
                <button type="submit">Guardar fotografia</button>
            </form>

            {message && <p role="status">{message}</p>}
        </main>
    );
}
```

```jsx
// apps/web/src/pages/ProductRecommendationsPage.jsx
/**
 * Página de recomendações personalizadas com limitações visíveis.
 */
import { useState } from "react";
import { apiRequest } from "../services/apiClient.js";

/**
 * Lista limitações devolvidas pelo backend.
 *
 * @function RecommendationLimitations
 * @param {{limitations?: string[]}} props - Limitações da recomendação.
 * @returns {JSX.Element|null} Lista de limitações ou nada.
 */
function RecommendationLimitations({ limitations = [] }) {
    // Sem limitações não há nada a mostrar; evita renderizar listas vazias.
    if (limitations.length === 0) return null;

    return (
        <ul>
            {limitations.map((limitation) => (
                <li key={limitation}>{limitation}</li>
            ))}
        </ul>
    );
}

/**
 * Gera, lista e avalia recomendações do utilizador autenticado.
 *
 * @function ProductRecommendationsPage
 * @param {{onRecommendationsChange?: (recommendations: object[]) => void}} props - Callback opcional.
 * @returns {JSX.Element} UI de recomendações.
 */
export function ProductRecommendationsPage({
    onRecommendationsChange = () => {},
}) {
    const [recommendations, setRecommendations] = useState([]);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");

    async function generateRecommendations() {
        setStatus("loading");
        setError("");

        try {
            // A geração usa a sessão; o browser não envia userId.
            const data = await apiRequest("/recommendations/generate", {
                method: "POST",
            });
            setRecommendations(data.recommendations);
            onRecommendationsChange(data.recommendations);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    async function loadRecommendations() {
        setStatus("loading");
        setError("");

        try {
            const data = await apiRequest("/recommendations");
            setRecommendations(data.recommendations);
            onRecommendationsChange(data.recommendations);
            setStatus(data.recommendations.length === 0 ? "empty" : "success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    async function submitFeedback(recommendationId, feedback) {
        try {
            const data = await apiRequest(
                `/recommendations/${recommendationId}/feedback`,
                {
                    method: "POST",
                    body: JSON.stringify({ value: feedback }),
                },
            );
            setRecommendations((items) => {
                // Substitui apenas a recomendação atualizada e preserva as restantes.
                const updated = items.map((item) =>
                    item.id === recommendationId ? data.recommendation : item,
                );
                onRecommendationsChange(updated);
                return updated;
            });
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }

    return (
        <section>
            <h1>Recomendações personalizadas</h1>
            <button onClick={generateRecommendations} disabled={status === "loading"}>
                Gerar recomendações
            </button>
            <button onClick={loadRecommendations} disabled={status === "loading"}>
                Ver recomendações existentes
            </button>
            {status === "error" && <p role="alert">{error}</p>}
            {status === "empty" && <p>Ainda não existem recomendações.</p>}
            {status === "success" && (
                <ul>
                    {recommendations.map((recommendation) => (
                        <li key={recommendation.id}>
                            <article>
                                <h2>{recommendation.product.name}</h2>
                                <p>{recommendation.explanation}</p>
                                <p>
                                    Score: {Math.round(recommendation.score * 100)}% |
                                    Estado: {recommendation.status}
                                </p>
                                <p>Motivos: {recommendation.reasonCodes.join(", ")}</p>
                                <RecommendationLimitations
                                    limitations={recommendation.limitations}
                                />
                                {recommendation.consultantNote && (
                                    <p>
                                        Nota do consultor:{" "}
                                        {recommendation.consultantNote}
                                    </p>
                                )}
                                <button
                                    onClick={() => submitFeedback(recommendation.id, "util")}
                                >
                                    Útil
                                </button>
                                <button
                                    onClick={() =>
                                        submitFeedback(
                                            recommendation.id,
                                            "nao_relevante",
                                        )
                                    }
                                >
                                    Não relevante
                                </button>
                            </article>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
```

5. Explicação do código.

o frontend torna a edição simples ao aceitar texto separado por vírgulas e convertê-lo em arrays para a API. Mesmo assim, a normalização definitiva continua no backend, onde há validação de tamanho, duplicados e campos proibidos. A página de recomendações também mostra `limitations`, para que o utilizador perceba que existem exclusões e que a recomendação é cosmética, não aconselhamento profissional.
6. Validação do passo.

guardar restrição, recarregar perfil e gerar recomendações.
7. Cenário negativo/erro esperado.

esconder limitações ao utilizador reduz transparência da recomendação.

### Passo 7 - Criar testes de bloqueio

1. Objetivo funcional do passo no contexto da app.

provar que restrições bloqueiam produtos.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/tests/mf4.restrictions.test.js`
   - REVER: `apps/api/src/services/recommendation-restrictions.service.js`
3. Instruções do que fazer.

testar conflito por alergia e ingrediente a evitar.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf4.restrictions.test.js
import { describe, expect, it } from "vitest";
import { validateUpdateProfileInput } from "../src/validators/profile.validator.js";
import { getProductRestrictionConflict } from "../src/services/recommendation-restrictions.service.js";

describe("BK-MF4-08 recommendation restrictions", () => {
    it("normaliza restrições recebidas no perfil", () => {
        // Duplicados e espaços devem desaparecer antes de guardar no perfil.
        const payload = validateUpdateProfileInput({
            allergies: [" Retinol ", "retinol"],
            avoidIngredients: ["Álcool"],
            lightMedicalRestrictions: ["pele reativa"],
        });

        expect(payload).toEqual({
            allergies: ["retinol"],
            avoidIngredients: ["álcool"],
            lightMedicalRestrictions: ["pele reativa"],
        });
    });

    it("bloqueia produto com alergia declarada", () => {
        // A comparação é feita sobre ingredientNames normalizados.
        const product = { ingredientNames: ["retinol", "glicerina"] };
        const profile = { allergies: ["retinol"], avoidIngredients: [] };

        const result = getProductRestrictionConflict(product, profile);

        expect(result.blocked).toBe(true);
        expect(result.matchedIngredients).toContain("retinol");
    });

    it("nao bloqueia produto sem ingredientes conflitantes", () => {
        // Ingredientes diferentes não devem gerar bloqueio por aproximação.
        const product = { ingredientNames: ["agua", "glicerina"] };
        const profile = { allergies: ["retinol"], avoidIngredients: ["alcool"] };

        expect(getProductRestrictionConflict(product, profile).blocked).toBe(false);
    });
});
```

5. Explicação do código.

os testes unitários separam duas responsabilidades: o validator prepara listas limpas para o perfil e a função de conflito bloqueia produtos por ingredientes comparáveis. Esta separação é útil para alunos porque permite encontrar bugs mais depressa: se a lista estiver mal normalizada, o problema está no validator; se a comparação falhar, está no service de restrições.
6. Validação do passo.

executar teste unitário e depois teste de integração de `POST /api/recommendations/generate`.
7. Cenário negativo/erro esperado.

testar apenas o formulário não prova que o motor de recomendação respeita restrições.

### Passo 8 - Validar negativos de integração

1. Objetivo funcional do passo no contexto da app.

provar o fluxo completo `perfil -> recomendação`.
2. Ficheiros envolvidos:
   - CRIAR: `apps/api/tests/mf4.restrictions.integration.test.js`
   - REVER: `apps/api/tests/mf2.integration.test.js`
3. Instruções do que fazer.

criar cenário executável com produto incompatível no catálogo de teste e confirmar que não aparece na resposta final.
4. Código completo, correto e integrado com a app final.

```js
// apps/api/tests/mf4.restrictions.integration.test.js
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FaceAnalysis } from "../src/models/face-analysis.model.js";
import { FaceReport } from "../src/models/face-report.model.js";
import { Product } from "../src/models/product.model.js";
import { ProductRecommendation } from "../src/models/product-recommendation.model.js";
import { Profile } from "../src/models/profile.model.js";
import { generateRecommendationsForUser } from "../src/services/recommendation.service.js";

vi.mock("../src/models/face-analysis.model.js", () => ({
    FaceAnalysis: { findOne: vi.fn() },
}));

vi.mock("../src/models/face-report.model.js", () => ({
    FaceReport: { findOne: vi.fn() },
}));

vi.mock("../src/models/product.model.js", () => ({
    Product: { find: vi.fn() },
}));

vi.mock("../src/models/product-recommendation.model.js", () => ({
    ProductRecommendation: { findOneAndUpdate: vi.fn() },
}));

vi.mock("../src/models/profile.model.js", () => ({
    Profile: { findOne: vi.fn() },
}));

function queryWithSort(value) {
    // Simula a query Mongoose que termina em .sort(...).
    return { sort: vi.fn().mockResolvedValue(value) };
}

function productQuery(products) {
    // Simula a cadeia Product.find(...).select(...).limit(...).
    return {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(products),
    };
}

function objectId(value) {
    // Simula o comportamento mínimo de ObjectId usado nos DTOs.
    return { toString: () => value };
}

function makeProduct(id, name, ingredientNames) {
    // Factory de produto para deixar o teste focado nos ingredientes.
    return {
        _id: objectId(id),
        name,
        brandName: "Orélle",
        description: "Produto compatível com pele mista",
        ingredientNames,
        skinTypes: ["mista"],
        imageUrl: "",
        priceCents: 1299,
        stock: 10,
    };
}

describe("BK-MF4-08 recommendation integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("mantém produto incompatível fora da resposta final", async () => {
        const userId = "user-1";
        // O catálogo inclui de propósito um produto com retinol para provar que é filtrado.
        const products = [
            makeProduct("product-1", "Creme suave", ["glicerina"]),
            makeProduct("product-2", "Sérum retinol", ["retinol"]),
            makeProduct("product-3", "Gel hidratante", ["ácido hialurónico"]),
            makeProduct("product-4", "Loção calmante", ["pantenol"]),
        ];
        // O map permite simular populate sem perder a ligação ao produto original.
        const productsById = new Map(
            products.map((product) => [product._id.toString(), product]),
        );

        FaceAnalysis.findOne.mockReturnValueOnce(
            queryWithSort({
                _id: objectId("analysis-1"),
                findings: { skinType: { label: "mista" } },
            }),
        );
        FaceReport.findOne.mockReturnValueOnce(
            queryWithSort({
                _id: objectId("report-1"),
                limitations: ["Usar protetor solar quando adequado."],
            }),
        );
        // O perfil declara retinol como alergia; o produto 2 deve ficar fora.
        Profile.findOne.mockResolvedValueOnce({
            allergies: ["retinol"],
            avoidIngredients: [],
            lightMedicalRestrictions: ["pele reativa"],
        });
        Product.find.mockReturnValueOnce(productQuery(products));
        ProductRecommendation.findOneAndUpdate.mockImplementation((query, update) => ({
            populate: vi.fn().mockResolvedValue({
                // Só produtos persistidos como recomendação chegam ao DTO final.
                _id: objectId(`rec-${query.productId.toString()}`),
                productId: productsById.get(query.productId.toString()),
                score: update.$set.score,
                reasonCodes: update.$set.reasonCodes,
                explanation: update.$set.explanation,
                limitations: update.$set.limitations,
                status: update.$set.status,
                feedback: null,
                consultantNote: null,
                createdAt: new Date("2026-06-15T10:00:00.000Z"),
                updatedAt: new Date("2026-06-15T10:00:00.000Z"),
            }),
        }));

        const recommendations = await generateRecommendationsForUser(userId);
        const names = recommendations.map((recommendation) => recommendation.product.name);

        expect(Profile.findOne).toHaveBeenCalledWith({ userId });
        expect(names).toContain("Creme suave");
        expect(names).not.toContain("Sérum retinol");
        // O produto incompatível nem sequer deve chegar à persistência.
        expect(ProductRecommendation.findOneAndUpdate).not.toHaveBeenCalledWith(
            expect.objectContaining({ productId: products[1]._id }),
            expect.any(Object),
            expect.any(Object),
        );
    });
});
```

5. Explicação do código.

o teste de integração mantém o produto incompatível dentro do catálogo de teste para provar que o filtro está no service, não no fixture. O produto com retinol desaparece da resposta final e também não é enviado para `ProductRecommendation.findOneAndUpdate`. Assim os alunos veem a regra completa: perfil declara restrição, catálogo contém produto bloqueado, backend remove antes de persistir e antes de devolver ao cliente.
6. Validação do passo.

executar `npm --prefix apps/api test` e confirmar que a resposta final contém apenas produtos compatíveis.
7. Cenário negativo/erro esperado.

remover produto do catálogo no teste não prova que o filtro funciona.

#### Expected results
- `GET/PUT /api/profile/me` incluem `allergies`, `avoidIngredients` e `lightMedicalRestrictions`.
- `POST /api/recommendations/generate` exclui produtos com ingredientes bloqueados.
- Utilizador sem perfil recebe `400` ao gerar recomendações.
- Produto incompatível não aparece no DTO final.
- Recomendações continuam sem adicionar produto ao carrinho automaticamente.

#### Critérios de aceite
- Entrega funcional especifica de `Guardar alergias, ingredientes a evitar e restrições médicas leves no perfil e impedir recomendações que violem regras` validada contra `RF40`.
- Cenários negativos concluídos: mínimo `3` com resultado controlado.
- Evidencia de testes por camada conforme prioridade (`P0`).
- Backend aplica ownership por sessão e ignora qualquer `userId` vindo do browser.
- Recomendações incompatíveis são bloqueadas antes de persistir `ProductRecommendation`.

#### Validação final
- Executar testes unitários de `recommendation-restrictions.service.js`.
- Executar teste de integração de recomendações.
- Testar UI de edição de perfil.
- Executar `bash scripts/validate-planificacao.sh`.

#### Evidence para PR/defesa
- `proof_tecnico`: teste unitário e integração do bloqueio.
- `proof_negativos`: produto com alergia, produto com ingrediente a evitar e utilizador sem perfil.
- `proof_privacidade`: DTO sem dados biométricos e sem alteração de ownership.
- `proof_negocio`: recomendações ficam mais confiáveis sem compra automática.

#### Handoff
`BK-MF5-01` deve tratar pedidos formais de eliminação/anonymização. `BK-MF8-05` deve explicar recomendações também com base nas restrições respeitadas. `BK-MF8-06` deve confirmar que o bloqueio não usa género, idade ou tom de pele para discriminar.

#### Changelog
- `2026-06-15`: guia reescrito para restrições de perfil com bloqueio backend de recomendações incompatíveis e negativos `P0`.
