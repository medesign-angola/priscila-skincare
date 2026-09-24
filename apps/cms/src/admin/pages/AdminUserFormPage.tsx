import { useEffect, useMemo, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { storeListLink } from '../components/StoreSidebar';
import {
  CheckRow,
  Field,
  FormButton,
  FormCard,
  FormFooter,
  FormGrid,
  FormHeading,
  FormNotice,
  FormSection,
  FormWorkspace,
  Input,
  Required,
  SectionHeading,
  Select,
  StoreFormPage,
  SummaryList,
} from '../components/StoreFormPrimitives';

type Role = { id: number | string; name?: string; description?: string };
type AdminUser = {
  id?: number | string;
  firstname?: string;
  lastname?: string;
  username?: string;
  email?: string;
  isActive?: boolean;
  preferedLanguage?: string;
  roles?: Role[];
};
type Mode = 'create' | 'edit' | 'profile';

const RoleList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 44rem) {
    grid-template-columns: 1fr;
  }
`;

const RoleOption = styled.label<{ $selected?: boolean }>`
  display: flex;
  min-height: 74px;
  align-items: flex-start;
  gap: 12px;
  padding: 15px 16px;
  border: 1px solid ${({ $selected }) => ($selected ? '#a98b62' : '#e4ddd3')};
  border-radius: 11px;
  background: ${({ $selected }) => ($selected ? '#fbf6ee' : '#fbfaf8')};
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    accent-color: #8f7048;
  }

  strong,
  small {
    display: block;
  }

  strong {
    color: #292824;
    font-size: 14px;
  }

  small {
    margin-top: 4px;
    color: #777168;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
  }
`;

const PasswordHint = styled.div`
  padding: 15px 17px;
  border-left: 3px solid #a8895f;
  border-radius: 0 9px 9px 0;
  color: #675b4c;
  background: #faf6ef;
  font-size: 13px;
  line-height: 1.55;
`;

const initial = {
  firstname: '',
  lastname: '',
  username: '',
  email: '',
  isActive: true,
  preferedLanguage: 'pt',
  roles: [] as string[],
  currentPassword: '',
  password: '',
  confirmPassword: '',
};

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? null;
const errorText = (error: any, fallback: string) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  fallback;

function AdminUserForm({ mode }: { mode: Mode }) {
  const { get, post, put } = useFetchClient();
  const { locale } = useIntl();
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const language = locale.toLowerCase().startsWith('fr') ? 'fr' : 'pt';
  const listLink = storeListLink('users');
  const profile = mode === 'profile';
  const editing = mode === 'edit';
  const [form, setForm] = useState(initial);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(mode !== 'create');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
    success?: boolean;
  } | null>(null);

  useEffect(() => {
    if (profile) return;
    let active = true;
    void get('/admin/roles')
      .then((response) => {
        const data = unwrap(response);
        const values = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];
        if (active) setRoles(values);
      })
      .catch(() =>
        active &&
        setMessage({
          text: 'Não foi possível carregar as funções disponíveis.',
          error: true,
        }),
      );
    return () => {
      active = false;
    };
  }, [get, profile]);

  useEffect(() => {
    if (mode === 'create') return;
    const endpoint = profile ? '/admin/users/me' : `/admin/users/${documentId}`;
    if (!profile && !documentId) return;
    let active = true;
    setLoading(true);
    void get(endpoint)
      .then((response) => {
        if (!active) return;
        const user = unwrap(response) as AdminUser | null;
        if (!user) throw new Error('not-found');
        setForm({
          ...initial,
          firstname: String(user.firstname ?? ''),
          lastname: String(user.lastname ?? ''),
          username: String(user.username ?? ''),
          email: String(user.email ?? ''),
          isActive: user.isActive !== false,
          preferedLanguage: String(user.preferedLanguage ?? 'pt'),
          roles: (user.roles ?? []).map((role) => String(role.id)),
        });
      })
      .catch(() =>
        active &&
        setMessage({
          text: profile
            ? 'Não foi possível carregar o seu perfil.'
            : 'Não foi possível carregar este usuário.',
          error: true,
        }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [documentId, get, mode, profile]);

  const setField = <K extends keyof typeof initial>(
    key: K,
    value: (typeof initial)[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const selectedRoleNames = useMemo(
    () =>
      roles
        .filter((role) => form.roles.includes(String(role.id)))
        .map((role) => role.name)
        .filter(Boolean)
        .join(', '),
    [form.roles, roles],
  );

  const toggleRole = (id: string) =>
    setField(
      'roles',
      form.roles.includes(id)
        ? form.roles.filter((current) => current !== id)
        : [...form.roles, id],
    );

  const save = async () => {
    if (!form.firstname.trim() || !form.email.trim()) {
      setMessage({
        text: 'Informe o primeiro nome e o e-mail.',
        error: true,
      });
      return;
    }
    if (!profile && form.roles.length === 0) {
      setMessage({
        text: 'Selecione pelo menos uma função para este usuário.',
        error: true,
      });
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      setMessage({
        text: 'A confirmação da palavra-passe não corresponde.',
        error: true,
      });
      return;
    }
    if (profile && form.password && !form.currentPassword) {
      setMessage({
        text: 'Informe a palavra-passe atual para definir uma nova.',
        error: true,
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      if (mode === 'create') {
        await post('/admin/users', {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim() || null,
          email: form.email.trim().toLowerCase(),
          roles: form.roles,
          preferedLanguage: form.preferedLanguage,
        });
        navigate(listLink, { replace: true });
        return;
      }

      if (editing) {
        await put(`/admin/users/${documentId}`, {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim() || null,
          username: form.username.trim() || null,
          email: form.email.trim().toLowerCase(),
          isActive: form.isActive,
          roles: form.roles,
          ...(form.password ? { password: form.password } : {}),
        });
        navigate(`/store/users/${documentId}`, { replace: true });
        return;
      }

      await put('/admin/users/me', {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim() || null,
        username: form.username.trim() || null,
        email: form.email.trim().toLowerCase(),
        preferedLanguage: form.preferedLanguage,
        ...(form.password
          ? {
              currentPassword: form.currentPassword,
              password: form.password,
            }
          : {}),
      });
      setForm((current) => ({
        ...current,
        currentPassword: '',
        password: '',
        confirmPassword: '',
      }));
      setMessage({
        text: 'Perfil atualizado com sucesso.',
        success: true,
      });
    } catch (error: any) {
      setMessage({
        text: errorText(
          error,
          profile
            ? 'Não foi possível atualizar o perfil.'
            : 'Não foi possível guardar o usuário.',
        ),
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const title = profile
    ? 'Meu perfil'
    : editing
      ? 'Editar usuário'
      : 'Novo usuário';
  const description = profile
    ? 'Atualize os seus dados de acesso e as preferências do painel.'
    : editing
      ? 'Atualize os dados, a função e o acesso deste usuário.'
      : 'Adicione uma pessoa à equipa. Ela receberá as instruções para concluir o primeiro acesso.';

  return (
    <StoreFormPage
      activeHref={profile ? '' : listLink}
      backTo={profile ? '/' : listLink}
      backLabel={profile ? 'Dashboard' : 'Usuários'}
      language={language}
      labelledBy="admin-user-form-title"
    >
      <FormWorkspace>
        <FormHeading>
          <h1 id="admin-user-form-title">{title}</h1>
          <p>{description}</p>
        </FormHeading>
        {message && (
          <FormNotice
            $error={message.error}
            $success={message.success}
            role={message.error ? 'alert' : 'status'}
          >
            {message.text}
          </FormNotice>
        )}
        <FormCard>
          {loading ? (
            <FormSection>
              <FormNotice>A carregar os dados…</FormNotice>
            </FormSection>
          ) : (
            <>
              <FormSection>
                <SectionHeading>
                  <h2>Dados pessoais</h2>
                  <p>Informações usadas para identificar a pessoa no painel.</p>
                </SectionHeading>
                <FormGrid>
                  <Field>
                    <span>
                      Primeiro nome <Required>*</Required>
                    </span>
                    <Input
                      value={form.firstname}
                      onChange={(event) =>
                        setField('firstname', event.target.value)
                      }
                      placeholder="Insira o primeiro nome"
                      autoFocus
                    />
                  </Field>
                  <Field>
                    Apelido
                    <Input
                      value={form.lastname}
                      onChange={(event) =>
                        setField('lastname', event.target.value)
                      }
                      placeholder="Insira o apelido"
                    />
                  </Field>
                  <Field>
                    <span>
                      E-mail <Required>*</Required>
                    </span>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      placeholder="nome@empresa.com"
                    />
                  </Field>
                  {mode !== 'create' && (
                    <Field>
                      Nome de utilizador
                      <Input
                        value={form.username}
                        onChange={(event) =>
                          setField('username', event.target.value)
                        }
                        placeholder="Nome usado no painel"
                      />
                    </Field>
                  )}
                  <Field>
                    Idioma preferido
                    <Select
                      value={form.preferedLanguage}
                      onChange={(event) =>
                        setField('preferedLanguage', event.target.value)
                      }
                    >
                      <option value="pt">Português</option>
                      <option value="fr">Français</option>
                    </Select>
                  </Field>
                </FormGrid>
              </FormSection>

              {!profile && (
                <FormSection>
                  <SectionHeading>
                    <h2>Função e acesso</h2>
                    <p>
                      A função determina o que esta pessoa pode consultar ou
                      alterar no painel.
                    </p>
                  </SectionHeading>
                  <RoleList>
                    {roles.map((role) => {
                      const id = String(role.id);
                      const selected = form.roles.includes(id);
                      return (
                        <RoleOption key={id} $selected={selected}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleRole(id)}
                          />
                          <span>
                            <strong>{role.name || 'Função sem nome'}</strong>
                            <small>
                              {role.description ||
                                'As permissões desta função são definidas nas configurações.'}
                            </small>
                          </span>
                        </RoleOption>
                      );
                    })}
                  </RoleList>
                  {editing && (
                    <CheckRow>
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) =>
                          setField('isActive', event.target.checked)
                        }
                      />
                      <span>
                        <strong>Permitir acesso ao painel</strong>
                        <small>
                          Desative esta opção para impedir o acesso sem eliminar o
                          usuário.
                        </small>
                      </span>
                    </CheckRow>
                  )}
                </FormSection>
              )}

              {mode !== 'create' && (
                <FormSection>
                  <SectionHeading>
                    <h2>Alterar palavra-passe</h2>
                    <p>
                      Deixe estes campos vazios quando não pretende alterar a
                      palavra-passe.
                    </p>
                  </SectionHeading>
                  {profile && (
                    <PasswordHint>
                      Para sua segurança, a palavra-passe atual é necessária antes
                      de definir uma nova.
                    </PasswordHint>
                  )}
                  <FormGrid>
                    {profile && (
                      <Field>
                        Palavra-passe atual
                        <Input
                          type="password"
                          autoComplete="current-password"
                          value={form.currentPassword}
                          onChange={(event) =>
                            setField('currentPassword', event.target.value)
                          }
                        />
                      </Field>
                    )}
                    <Field>
                      Nova palavra-passe
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) =>
                          setField('password', event.target.value)
                        }
                      />
                    </Field>
                    <Field>
                      Confirmar nova palavra-passe
                      <Input
                        type="password"
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={(event) =>
                          setField('confirmPassword', event.target.value)
                        }
                      />
                    </Field>
                  </FormGrid>
                </FormSection>
              )}

              {!profile && (
                <FormSection>
                  <SectionHeading>
                    <h2>Resumo</h2>
                    <p>Confirme os dados antes de guardar.</p>
                  </SectionHeading>
                  <SummaryList>
                    <div>
                      <dt>Nome</dt>
                      <dd>
                        {[form.firstname, form.lastname]
                          .filter(Boolean)
                          .join(' ') || 'Não informado'}
                      </dd>
                    </div>
                    <div>
                      <dt>E-mail</dt>
                      <dd>{form.email || 'Não informado'}</dd>
                    </div>
                    <div>
                      <dt>Função</dt>
                      <dd>{selectedRoleNames || 'Não selecionada'}</dd>
                    </div>
                    <div>
                      <dt>Acesso</dt>
                      <dd>{form.isActive ? 'Permitido' : 'Desativado'}</dd>
                    </div>
                  </SummaryList>
                </FormSection>
              )}

              <FormFooter>
                <FormButton
                  type="button"
                  onClick={() => navigate(profile ? '/' : listLink)}
                >
                  Cancelar
                </FormButton>
                <FormButton
                  type="button"
                  $primary
                  disabled={saving}
                  onClick={() => void save()}
                >
                  {saving
                    ? 'A guardar…'
                    : mode === 'create'
                      ? 'Convidar usuário'
                      : 'Guardar alterações'}
                </FormButton>
              </FormFooter>
            </>
          )}
        </FormCard>
      </FormWorkspace>
    </StoreFormPage>
  );
}

export const AdminUserCreatePage = () => <AdminUserForm mode="create" />;
export const AdminUserEditPage = () => <AdminUserForm mode="edit" />;
export const ProfilePage = () => <AdminUserForm mode="profile" />;
