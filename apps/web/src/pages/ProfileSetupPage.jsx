/**
 * Consulta, criação e edição do perfil pessoal.
 *
 * O GET inicial decide o contrato de escrita: um 404 habilita a criação por
 * POST; um perfil existente é sempre atualizado por PUT.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavIcon } from "../components/NavIcon.jsx";
import { PageHero, SectionCard, Skeleton, TagInput } from "../components/OrelleUi.jsx";
import { apiRequest } from "../services/apiClient.js";
import {
    createEmptyProfileForm,
    PROFILE_LOAD_STATES,
    profileFormToPayload,
    profileToForm,
    resolveProfileWriteMethod,
} from "../services/profileForm.js";

/**
 * Formulário recorrente do perfil autenticado.
 *
 * @returns {JSX.Element} Resumo e formulário coerentes com a existência do perfil.
 */
export function ProfileSetupPage() {
    const location = useLocation();
    const [form, setForm] = useState(createEmptyProfileForm);
    const [profile, setProfile] = useState(null);
    const [loadState, setLoadState] = useState(PROFILE_LOAD_STATES.LOADING);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const returnToConsultation =
        location.state?.returnTo === "/consulta/ativa"
            ? "/consulta/ativa"
            : null;

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        setLoadState(PROFILE_LOAD_STATES.LOADING);
        setError("");

        apiRequest("/profile/me", { signal: controller.signal })
            .then((data) => {
                if (!active) return;

                setProfile(data.profile);
                setForm(profileToForm(data.profile));
                setLoadState(PROFILE_LOAD_STATES.EXISTING);
            })
            .catch((requestError) => {
                if (!active) return;

                if (requestError.status === 404) {
                    setProfile(null);
                    setForm(createEmptyProfileForm());
                    setLoadState(PROFILE_LOAD_STATES.MISSING);
                    return;
                }

                setError(requestError.message);
                setLoadState(PROFILE_LOAD_STATES.ERROR);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [loadAttempt]);

    /**
     * Atualiza um campo editável do perfil.
     *
     * @param {import("react").ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>} event - Campo alterado.
     * @returns {void}
     */
    function updateField(event) {
        setForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    }

    /**
     * Cria ou atualiza o perfil conforme o resultado do GET inicial.
     *
     * @async
     * @param {import("react").FormEvent<HTMLFormElement>} event - Submissão do formulário.
     * @returns {Promise<void>}
     */
    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            const method = resolveProfileWriteMethod(loadState);
            const data = await apiRequest("/profile/me", {
                method,
                body: JSON.stringify(profileFormToPayload(form)),
            });

            setProfile(data.profile);
            setForm(profileToForm(data.profile));
            setLoadState(PROFILE_LOAD_STATES.EXISTING);
            setMessage(
                method === "POST"
                    ? "Perfil criado com sucesso."
                    : "Perfil atualizado com sucesso.",
            );
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    }

    if (loadState === PROFILE_LOAD_STATES.LOADING) {
        return (
            <section aria-labelledby="profile-title" aria-busy="true">
                <PageHero eyebrow="Conta" title="O teu perfil" description="A carregar os dados que tornam a experiência mais pessoal." />
                <Skeleton lines={5} label="A carregar o perfil" />
            </section>
        );
    }

    if (loadState === PROFILE_LOAD_STATES.ERROR) {
        return (
            <section aria-labelledby="profile-title">
                <PageHero eyebrow="Conta" title="O teu perfil" description="Não foi possível apresentar os teus dados neste momento." />
                <p role="alert">{error}</p>
                <button
                    type="button"
                    onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                >
                    Tentar novamente
                </button>
            </section>
        );
    }

    const isExisting = loadState === PROFILE_LOAD_STATES.EXISTING;

    return (
        <section className="profile-page" aria-labelledby="profile-title">
            <PageHero eyebrow="Conta" title="O teu perfil" description={isExisting ? "Mantém os teus dados, objetivos e restrições atualizados." : "Conta-nos um pouco sobre ti para começarmos a personalização."}>
                <div className="profile-progress"><span>Progresso</span><strong>{isExisting ? "Perfil completo" : "Primeiro passo"}</strong><progress max="100" value={isExisting ? 100 : 25}>{isExisting ? 100 : 25}%</progress></div>
            </PageHero>

            {isExisting && profile ? (
                <SectionCard className="profile-summary" title="Resumo atual" aria-labelledby="profile-summary-title">
                    <dl>
                        <div>
                            <dt>Nome</dt>
                            <dd>{profile.nome}</dd>
                        </div>
                        <div>
                            <dt>Idade</dt>
                            <dd>{profile.idade} anos</dd>
                        </div>
                        <div>
                            <dt>Tipo de pele</dt>
                            <dd>{profile.tipoDePele}</dd>
                        </div>
                        <div>
                            <dt>Objetivos</dt>
                            <dd>{profile.objetivos.join(", ")}</dd>
                        </div>
                    </dl>
                </SectionCard>
            ) : null}

            <form
                className="profile-form"
                onSubmit={handleSubmit}
                aria-label={isExisting ? "Editar perfil" : "Criar perfil"}
            >
                <header className="account-form-heading">
                    <div>
                        <p className="orelle-eyebrow">Dados pessoais</p>
                        <h2>{isExisting ? "Atualizar perfil" : "Criar perfil"}</h2>
                        <p>
                            Estes dados ajudam a Orélle a adaptar a consulta, a
                            rotina e as recomendações ao que realmente precisas.
                        </p>
                    </div>
                    <span className="account-form-heading__badge">
                        <NavIcon name={isExisting ? "user-check" : "user"} />
                        {isExisting ? "Perfil ativo" : "Novo perfil"}
                    </span>
                </header>

                <div className="profile-form__layout">
                    <div className="profile-form__primary">
                        <fieldset className="profile-form-section">
                            <legend>
                                <span>01</span>
                                Sobre ti
                            </legend>

                            <label>
                                Nome
                                <input
                                    name="nome"
                                    value={form.nome}
                                    onChange={updateField}
                                    minLength="2"
                                    maxLength="80"
                                    autoComplete="name"
                                    required
                                />
                            </label>

                            <label>
                                Idade
                                <input
                                    name="idade"
                                    type="number"
                                    min="13"
                                    max="120"
                                    value={form.idade}
                                    onChange={updateField}
                                    inputMode="numeric"
                                    required
                                />
                            </label>

                            <label>
                                Tipo de pele
                                <select
                                    name="tipoDePele"
                                    value={form.tipoDePele}
                                    onChange={updateField}
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
                                    value={form.genero}
                                    onChange={updateField}
                                >
                                    <option value="feminino">Feminino</option>
                                    <option value="masculino">Masculino</option>
                                    <option value="nao_binario">Não binário</option>
                                    <option value="prefiro_nao_dizer">Prefiro não dizer</option>
                                </select>
                            </label>
                        </fieldset>

                        <fieldset className="profile-form-section profile-form-section--goals">
                            <legend>
                                <span>02</span>
                                Pele e objetivos
                            </legend>
                            <TagInput
                                label="Objetivos"
                                name="objetivosTexto"
                                value={form.objetivosTexto}
                                onChange={updateField}
                                hint="Separa cada objetivo por uma vírgula."
                                placeholder="Ex.: hidratar, proteger, equilibrar a rotina"
                                required
                            />
                        </fieldset>
                    </div>

                    <fieldset className="profile-form-section profile-form-section--restrictions">
                        <legend>
                            <span>03</span>
                            Restrições
                        </legend>
                        <p className="profile-form-section__intro">
                            Indica apenas informação relevante para escolhas cosméticas
                            mais seguras e adequadas.
                        </p>

                        <TagInput
                            label="Alergias declaradas"
                            name="allergiesTexto"
                            value={form.allergiesTexto}
                            onChange={updateField}
                            hint="Separa cada alergia por uma vírgula."
                            placeholder="Ex.: fragrâncias, níquel"
                            as="textarea"
                        />

                        <TagInput
                            label="Ingredientes a evitar"
                            name="avoidIngredientsTexto"
                            value={form.avoidIngredientsTexto}
                            onChange={updateField}
                            hint="Separa cada ingrediente por uma vírgula."
                            placeholder="Ex.: perfume intenso, retinol"
                            as="textarea"
                        />

                        <label className="profile-form-section__wide-field">
                            Restrições cosméticas relevantes
                            <textarea
                                name="lightMedicalRestrictionsTexto"
                                value={form.lightMedicalRestrictionsTexto}
                                onChange={updateField}
                                placeholder="Acrescenta contexto que possa influenciar a escolha de produtos."
                            />
                        </label>
                    </fieldset>
                </div>

                <footer className="account-form-actions">
                    <p>
                        Podes voltar e ajustar estes dados sempre que a tua pele ou
                        os teus objetivos mudarem.
                    </p>
                    <button type="submit" disabled={saving}>
                        <NavIcon name="save" />
                        {saving
                            ? "A guardar..."
                            : isExisting
                              ? "Guardar alterações"
                              : "Criar perfil"}
                    </button>
                </footer>
            </form>

            {message ? <p role="status">{message}</p> : null}
            {error ? <p role="alert">{error}</p> : null}

            {message && returnToConsultation ? (
                <Link className="orelle-button" to={returnToConsultation}>
                    Retomar consulta
                </Link>
            ) : null}

            <Link className="text-link" to="/conta">
                Voltar à visão geral da conta
            </Link>
        </section>
    );
}
