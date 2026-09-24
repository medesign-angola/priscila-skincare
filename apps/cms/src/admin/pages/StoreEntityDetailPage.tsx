import { useEffect, useState } from 'react';
import { Main } from '@strapi/design-system';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { AdminProfileMenu } from '../components/AdminProfileMenu';
import {
  contentLink,
  iconPath,
  StoreLayout,
  StorePage,
  StoreSidebar,
  storeListLink,
} from '../components/StoreSidebar';

type Kind = 'review' | 'customer' | 'user';
type Entity = Record<string, any>;

const settings = {
  review: {
    resource: 'reviews',
    uid: 'api::review.review',
    title: 'Detalhe da avaliação',
    subtitle: 'Conteúdo enviado pelo cliente e estado da moderação.',
  },
  customer: {
    resource: 'customers',
    uid: 'api::customer.customer',
    title: 'Detalhe do cliente',
    subtitle: 'Dados sincronizados a partir da conta do cliente.',
  },
  user: {
    resource: 'users',
    uid: 'admin::user',
    title: 'Detalhe do usuário',
    subtitle: 'Dados de acesso e função no painel de gestão.',
  },
} as const;

const Shell = styled(Main)`
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #252421;
  background: #f7f5f2;
  font-family: 'Priscila Inter', Inter, Arial, sans-serif;
`;
const Topbar = styled.header`
  box-sizing: border-box;
  display: flex;
  min-height: 86px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 28px;
  border-bottom: 1px solid #ece8e1;
  background: #fafafa;
`;
const Back = styled(Link)`
  color: #7d6645;
  font-size: 16px;
  font-weight: 650;
  text-decoration: none;
`;
const Profile = styled(Link)`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 12px;
  border: 1px solid #ece8e1;
  border-radius: 12px;
  color: #252421;
  background: #fff;
  text-decoration: none;
  strong,
  small {
    display: block;
  }
  strong {
    font-size: 14px;
  }
  small {
    color: #777168;
    font-size: 12px;
  }
`;
const Avatar = styled.span`
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  color: #fff;
  background: #7d6645;
  font-size: 13px;
  font-weight: 700;
`;
const Workspace = styled.div`
  box-sizing: border-box;
  display: grid;
  gap: 24px;
  width: min(100%, 1080px);
  margin: 0 auto;
  padding: 38px 32px 64px;
`;
const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  h1 {
    margin: 0 0 8px;
    font-size: 32px;
    font-weight: 650;
    letter-spacing: -0.5px;
  }
  p {
    margin: 0;
    color: #777168;
    font-size: 14px;
  }
`;
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const EditLink = styled(Link)`
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  padding: 9px 15px;
  border: 1px solid #92754d;
  border-radius: 9px;
  color: #755a36;
  background: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 160ms ease;

  &:hover {
    background: #f8f3ec;
  }
`;
const Badge = styled.span<{ $tone?: string }>`
  display: inline-flex;
  padding: 7px 13px;
  border: 1px solid
    ${({ $tone }) => ($tone === 'positive' ? '#86d9a4' : $tone === 'negative' ? '#f3a4ae' : '#dfc68d')};
  border-radius: 999px;
  color: ${({ $tone }) => ($tone === 'positive' ? '#166534' : $tone === 'negative' ? '#9f1239' : '#75530b')};
  background: ${({ $tone }) => ($tone === 'positive' ? '#ecfdf3' : $tone === 'negative' ? '#fff1f2' : '#fff8e7')};
  font-size: 14px;
  font-weight: 700;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
  gap: 22px;
  align-items: start;
  @media (max-width: 62rem) {
    grid-template-columns: 1fr;
  }
`;
const Stack = styled.div`
  display: grid;
  gap: 22px;
`;
const Card = styled.section`
  overflow: hidden;
  border: 1px solid #e8e2d9;
  border-radius: 12px;
  background: #fff;
`;
const CardHeader = styled.header`
  padding: 18px 20px;
  border-bottom: 1px solid #ece8e1;
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 650;
  }
  p {
    margin: 5px 0 0;
    color: #777168;
    font-size: 13px;
  }
`;
const Fields = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  padding: 8px 20px 18px;
  div {
    padding: 13px 0;
    border-bottom: 1px solid #f0ece6;
  }
  div:nth-child(odd) {
    padding-right: 16px;
  }
  div:nth-child(even) {
    padding-left: 16px;
  }
  dt {
    margin-bottom: 5px;
    color: #857e75;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 14px;
    line-height: 1.5;
  }
`;
const ReviewBody = styled.div`
  padding: 22px 20px;
  h3 {
    margin: 0 0 10px;
    font-size: 18px;
  }
  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.7;
  }
  strong {
    display: block;
    margin-bottom: 12px;
    color: #8b7048;
    font-size: 20px;
    letter-spacing: 3px;
  }
`;
const ReviewProduct = styled.section`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  border-top: 1px solid #ece8e1;
  img,
  .placeholder {
    display: grid;
    width: 88px;
    height: 88px;
    place-items: center;
    border: 1px solid #ece8e1;
    border-radius: 10px;
    color: #8b7048;
    background: #f7f5f2;
    object-fit: cover;
    font-size: 24px;
  }
  small,
  strong,
  span {
    display: block;
  }
  small {
    margin-bottom: 5px;
    color: #857e75;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  strong {
    color: #252421;
    font-size: 16px;
    line-height: 1.35;
  }
  span {
    margin-top: 5px;
    color: #777168;
    font-size: 13px;
  }
  a {
    padding: 10px 13px;
    border: 1px solid #8b7048;
    border-radius: 8px;
    color: #7d6645;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }
  @media (max-width: 42rem) {
    grid-template-columns: 72px minmax(0, 1fr);
    img,
    .placeholder {
      width: 72px;
      height: 72px;
    }
    a {
      grid-column: 1 / -1;
      text-align: center;
    }
  }
`;
const Buttons = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px 20px;
  button {
    min-height: 48px;
    padding: 0 15px;
    border: 1px solid #8b7048;
    border-radius: 9px;
    color: #fff;
    background: #8b7048;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  button.secondary {
    color: #7b4a4a;
    border-color: #d9b5b5;
    background: #fff;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;
const Notice = styled.div<{ $error?: boolean }>`
  padding: 14px 16px;
  border: 1px solid ${({ $error }) => ($error ? '#fecaca' : '#bbf7d0')};
  border-radius: 9px;
  color: ${({ $error }) => ($error ? '#991b1b' : '#166534')};
  background: ${({ $error }) => ($error ? '#fef2f2' : '#f0fdf4')};
  font-size: 14px;
`;

const value = (input: unknown, fallback = '—') => {
  if (input === null || input === undefined || input === '') return fallback;
  if (typeof input === 'boolean') return input ? 'Sim' : 'Não';
  if (typeof input === 'object') {
    const entry = input as Entity;
    return String(entry.name ?? entry.title ?? entry.email ?? fallback);
  }
  return String(input);
};
const date = (input: unknown, locale: string) =>
  input
    ? new Intl.DateTimeFormat(locale.startsWith('fr') ? 'fr-FR' : 'pt-AO', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(new Date(String(input)))
    : '—';
const initials = (first?: string, last?: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';
const unwrap = (response: any) =>
  response?.data?.data ?? response?.data ?? null;
const firstEntry = (input: unknown): Entity | null => {
  if (Array.isArray(input)) return (input[0] as Entity | undefined) ?? null;
  if (!input || typeof input !== 'object') return null;
  const entry = input as Entity;
  if (Array.isArray(entry.results))
    return (entry.results[0] as Entity | undefined) ?? null;
  if (Array.isArray(entry.data))
    return (entry.data[0] as Entity | undefined) ?? null;
  return entry;
};
const imageUrl = (input: unknown): string | null => {
  const asset = firstEntry(input);
  return asset?.url ? String(asset.url) : null;
};

export default function StoreEntityDetailPage({ kind }: { kind: Kind }) {
  const { documentId } = useParams<{ documentId: string }>();
  const { get, put } = useFetchClient();
  const { locale } = useIntl();
  const user = useAuth('StoreEntityDetailPage', (state) => state.user);
  const config = settings[kind];
  const listLink = storeListLink(config.resource);
  const [entity, setEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const load = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const endpoint =
        kind === 'user'
          ? `/admin/users/${documentId}`
          : `${contentLink(config.uid)}/${documentId}`;
      const loaded = unwrap(await get(endpoint));
      if (kind !== 'review' || !loaded || loaded.reviewType === 'platform') {
        setEntity(loaded);
        return;
      }

      let product = firstEntry(loaded.product);
      try {
        const relationResponse = await get(
          `/content-manager/relations/api::review.review/${documentId}/product`,
          { params: { page: 1, pageSize: 1 } },
        );
        product = firstEntry(relationResponse.data) ?? product;
      } catch {
        // A referência SKU continua disponível caso a relação não possa ser expandida.
      }

      if (product?.documentId) {
        try {
          const productResponse = await get(
            `${contentLink('api::product.product')}/${product.documentId}`,
            {
              params: {
                locale: product.locale ?? 'pt',
                status: 'draft',
              },
            },
          );
          product = { ...product, ...(unwrap(productResponse) ?? {}) };
        } catch {
          // Os dados resumidos da relação já permitem identificar o produto.
        }
      }

      setEntity({ ...loaded, product });
    } catch {
      setMessage({
        text: 'Não foi possível carregar os detalhes.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [documentId, kind]);

  const moderate = async (status: 'published' | 'rejected') => {
    if (!documentId || kind !== 'review') return;
    setSaving(true);
    setMessage(null);
    try {
      await put(`${contentLink(config.uid)}/${documentId}`, {
        moderationStatus: status,
      });
      setMessage({
        text:
          status === 'published'
            ? 'Avaliação aprovada.'
            : 'Avaliação rejeitada.',
        error: false,
      });
      await load();
      window.dispatchEvent(new Event('priscila:workflow-updated'));
    } catch (error: any) {
      setMessage({
        text:
          error?.response?.data?.error?.message ||
          'Não foi possível atualizar a avaliação.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const name =
    kind === 'user'
      ? [entity?.firstname, entity?.lastname].filter(Boolean).join(' ') ||
        entity?.username
      : entity?.name;
  const status =
    kind === 'review'
      ? String(entity?.moderationStatus ?? 'pending')
      : entity?.isActive === false || entity?.blocked === true
        ? 'inactive'
        : 'active';
  const statusLabel =
    kind === 'review'
      ? ((
          {
            pending: 'Aguarda aprovação',
            published: 'Publicada',
            rejected: 'Rejeitada',
          } as Record<string, string>
        )[status] ?? status)
      : status === 'active'
        ? 'Ativo'
        : 'Inativo';
  const tone =
    status === 'published' || status === 'active'
      ? 'positive'
      : status === 'rejected' || status === 'inactive'
        ? 'negative'
        : 'warning';
  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    'Utilizador';

  const fields: [string, unknown][] =
    kind === 'review'
      ? [
          ['Cliente', entity?.name],
          [
            'Tipo',
            entity?.reviewType === 'platform'
              ? 'Avaliação da plataforma'
              : 'Avaliação de produto',
          ],
          ['Produto', entity?.product?.name ?? entity?.productSku],
          ['Recomenda', entity?.recommends],
          ['Enviada em', date(entity?.submittedAt, locale)],
          ['Editada em', date(entity?.sourceEditedAt, locale)],
        ]
      : kind === 'customer'
        ? [
            ['Nome', entity?.name],
            ['E-mail', entity?.email],
            ['Telefone', entity?.phone],
            ['Aceita comunicações', entity?.acceptsMarketing],
            ['Conta ativa', entity?.isActive],
            ['Registado em', date(entity?.registeredAt, locale)],
          ]
        : [
            ['Nome', name],
            ['Nome de utilizador', entity?.username],
            ['E-mail', entity?.email],
            ['Função', entity?.roles?.[0]?.name ?? entity?.role?.name],
            ['Conta ativa', entity?.isActive],
            ['Conta bloqueada', entity?.blocked],
          ];

  return (
    <Shell labelledBy="entity-detail-title">
      <StoreLayout>
        <StoreSidebar activeHref={listLink} />
        <StorePage>
          <Topbar>
            <Back to={listLink}>
              ←{' '}
              {kind === 'review'
                ? 'Avaliações'
                : kind === 'customer'
                  ? 'Clientes'
                  : 'Usuários'}
            </Back>
            <AdminProfileMenu />
          </Topbar>
          <Workspace>
            {message && <Notice $error={message.error}>{message.text}</Notice>}
            {loading ? (
              <Notice>A carregar detalhes…</Notice>
            ) : entity ? (
              <>
                <Header>
                  <div>
                    <h1 id="entity-detail-title">{config.title}</h1>
                    <p>{config.subtitle}</p>
                  </div>
                  <HeaderActions>
                    {kind === 'user' && documentId && (
                      <EditLink to={`/store/users/${documentId}/edit`}>
                        Editar usuário
                      </EditLink>
                    )}
                    <Badge $tone={tone}>{statusLabel}</Badge>
                  </HeaderActions>
                </Header>
                <Grid>
                  <Stack>
                    {kind === 'review' && (
                      <Card>
                        <CardHeader>
                          <h2>{value(entity.title, 'Avaliação sem título')}</h2>
                          <p>Comentário escrito pelo cliente.</p>
                        </CardHeader>
                        <ReviewBody>
                          <strong>
                            {'★'.repeat(Number(entity.rating ?? 0))}
                            {'☆'.repeat(
                              Math.max(0, 5 - Number(entity.rating ?? 0)),
                            )}
                          </strong>
                          <p>{value(entity.comment)}</p>
                        </ReviewBody>
                        {entity.reviewType !== 'platform' && (
                          <ReviewProduct aria-label="Produto avaliado">
                            {imageUrl(entity.product?.thumbnailImage) ? (
                              <img
                                src={imageUrl(entity.product?.thumbnailImage) ?? ''}
                                alt={value(entity.product?.name, 'Produto avaliado')}
                              />
                            ) : (
                              <span className="placeholder" aria-hidden="true">
                                ◇
                              </span>
                            )}
                            <div>
                              <small>Produto avaliado</small>
                              <strong>
                                {value(entity.product?.name, entity.productSku)}
                              </strong>
                              <span>SKU: {value(entity.product?.sku, entity.productSku)}</span>
                            </div>
                            {entity.product?.documentId && (
                              <Link
                                to={`/store/products/${entity.product.documentId}/edit?locale=${entity.product.locale ?? 'pt'}`}
                              >
                                Ver produto
                              </Link>
                            )}
                          </ReviewProduct>
                        )}
                      </Card>
                    )}
                    <Card>
                      <CardHeader>
                        <h2>Informações</h2>
                        <p>
                          Dados apresentados de forma clara e apenas para a
                          finalidade desta página.
                        </p>
                      </CardHeader>
                      <Fields>
                        {fields.map(([label, content]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value(content)}</dd>
                          </div>
                        ))}
                      </Fields>
                    </Card>
                  </Stack>
                  <Stack>
                    <Card>
                      <CardHeader>
                        <h2>Resumo</h2>
                        <p>Identificação principal do registo.</p>
                      </CardHeader>
                      <Fields>
                        <div>
                          <dt>Nome</dt>
                          <dd>{value(name)}</dd>
                        </div>
                        <div>
                          <dt>Estado</dt>
                          <dd>{statusLabel}</dd>
                        </div>
                      </Fields>
                    </Card>
                    {kind === 'review' && (
                      <Card>
                        <CardHeader>
                          <h2>Moderação</h2>
                          <p>
                            Escolha se esta avaliação pode aparecer no site.
                          </p>
                        </CardHeader>
                        <Buttons>
                          <button
                            type="button"
                            disabled={saving || status === 'published'}
                            onClick={() => void moderate('published')}
                          >
                            Aprovar e publicar
                          </button>
                          <button
                            className="secondary"
                            type="button"
                            disabled={saving || status === 'rejected'}
                            onClick={() => void moderate('rejected')}
                          >
                            Rejeitar avaliação
                          </button>
                        </Buttons>
                      </Card>
                    )}
                  </Stack>
                </Grid>
              </>
            ) : (
              <Notice $error>Registo não encontrado.</Notice>
            )}
          </Workspace>
        </StorePage>
      </StoreLayout>
    </Shell>
  );
}

export const ReviewDetailPage = () => <StoreEntityDetailPage kind="review" />;
export const CustomerDetailPage = () => (
  <StoreEntityDetailPage kind="customer" />
);
export const UserDetailPage = () => <StoreEntityDetailPage kind="user" />;
