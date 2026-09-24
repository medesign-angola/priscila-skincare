import { useEffect, useMemo, useState } from 'react';
import { Main } from '@strapi/design-system';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  contentLink,
  iconPath,
  StoreLayout,
  StorePage,
  StoreSidebar,
  storeListLink,
} from '../components/StoreSidebar';

type OrderItem = {
  productName?: string;
  variant?: string;
  quantity?: number;
  reference?: string;
  productSku?: string;
  unitPrice?: number;
  imageUrl?: string;
  itemType?: string;
};
type TimelineItem = { status?: string; occurredAt?: string };
type Order = Record<string, any> & {
  number?: string;
  customerName?: string;
  customerEmail?: string;
  orderStatus?: string;
  paymentStatus?: string;
  currency?: string;
  subtotal?: number;
  shipping?: number;
  total?: number;
  placedAt?: string;
  deliveryAddress?: Record<string, unknown>;
  items?: OrderItem[];
  timeline?: TimelineItem[];
};
type Response = { data?: Order };

const states: Record<string, { pt: string; fr: string }> = {
  pending: { pt: 'Pendente', fr: 'En attente' },
  confirmed: { pt: 'Confirmada', fr: 'Confirmée' },
  paid: { pt: 'Paga', fr: 'Payée' },
  paymentfailed: { pt: 'Pagamento não aprovado', fr: 'Paiement refusé' },
  processing: { pt: 'Em preparação', fr: 'En préparation' },
  shipped: { pt: 'Enviada', fr: 'Expédiée' },
  delivered: { pt: 'Entregue', fr: 'Livrée' },
  cancelled: { pt: 'Cancelada', fr: 'Annulée' },
  refunded: { pt: 'Reembolsada', fr: 'Remboursée' },
};
const paymentStates: Record<string, { pt: string; fr: string }> = {
  pending: { pt: 'Pagamento pendente', fr: 'Paiement en attente' },
  approved: { pt: 'Pagamento aprovado', fr: 'Paiement approuvé' },
  rejected: { pt: 'Pagamento não aprovado', fr: 'Paiement refusé' },
  cancelled: { pt: 'Pagamento cancelado', fr: 'Paiement annulé' },
  refunded: { pt: 'Pagamento reembolsado', fr: 'Paiement remboursé' },
};
const nextState: Record<string, string> = {
  pending: 'confirmed',
  paid: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
};
const addressLabels: Record<string, string> = {
  recipient: 'Destinatário',
  phone: 'Telefone',
  country: 'País',
  province: 'Província',
  city: 'Município/cidade',
  neighborhood: 'Bairro',
  street: 'Rua',
  houseNumber: 'Número da casa',
  apartment: 'Referência ou apartamento',
  postalCode: 'Código postal',
};

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
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #7d6645;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;
const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;
const Language = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a1917;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  img {
    width: 24px;
    height: 24px;
  }
`;
const Profile = styled(Link)`
  display: flex;
  min-height: 54px;
  align-items: center;
  gap: 9px;
  padding: 6px 12px;
  border: 1px solid #ece8e1;
  border-radius: 12px;
  color: #1a1917;
  background: #fff;
  text-decoration: none;
`;
const Avatar = styled.span`
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 10px;
  color: #fff;
  background: #7d6645;
  font-size: 13px;
  font-weight: 700;
`;
const ProfileText = styled.span`
  display: grid;
  min-width: 120px;
  strong {
    font-size: 15px;
    font-weight: 500;
  }
  small {
    color: #6d675f;
    font-size: 12px;
  }
`;
const Workspace = styled.div`
  box-sizing: border-box;
  display: grid;
  gap: 26px;
  width: min(100%, 1220px);
  margin: 0 auto;
  padding: 34px 32px 56px;
`;
const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 28px;
  h1 {
    margin: 0 0 7px;
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.5px;
  }
  p {
    margin: 0;
    color: #777168;
    font-size: 14px;
  }
`;
const statusColors: Record<
  string,
  { background: string; border: string; color: string }
> = {
  pending: { background: '#fff7e6', border: '#f0c36a', color: '#75530b' },
  confirmed: { background: '#eef6ff', border: '#93c5fd', color: '#1e4f86' },
  processing: { background: '#f7f2e9', border: '#d6c19a', color: '#6b522d' },
  shipped: { background: '#f1f0ff', border: '#b9b4f6', color: '#47408f' },
  delivered: { background: '#dcfce7', border: '#7bf1a8', color: '#166534' },
  approved: { background: '#dcfce7', border: '#7bf1a8', color: '#166534' },
  rejected: { background: '#fff1f2', border: '#fda4af', color: '#9f1239' },
  cancelled: { background: '#fff1f2', border: '#fda4af', color: '#9f1239' },
  refunded: { background: '#f5f5f4', border: '#d6d3d1', color: '#57534e' },
};
const StatusGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;
const Badge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border: 1px solid
    ${({ $status }) => (statusColors[$status] ?? statusColors.pending).border};
  border-radius: 999px;
  color: ${({ $status }) =>
    (statusColors[$status] ?? statusColors.pending).color};
  background: ${({ $status }) =>
    (statusColors[$status] ?? statusColors.pending).background};
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
`;
const Notice = styled.div<{ $error?: boolean }>`
  padding: 13px 16px;
  border: 1px solid ${({ $error }) => ($error ? '#fecaca' : '#bbf7d0')};
  border-radius: 9px;
  color: ${({ $error }) => ($error ? '#991b1b' : '#166534')};
  background: ${({ $error }) => ($error ? '#fef2f2' : '#f0fdf4')};
  font-size: 14px;
`;
const SummaryGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  gap: 14px;
  align-items: stretch;
  @media (max-width: 70rem) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
const Metric = styled.article`
  box-sizing: border-box;
  display: grid;
  min-width: 0;
  height: 100%;
  align-content: start;
  padding: 18px;
  border: 1px solid #e8e2d9;
  border-radius: 10px;
  background: #fff;
  small {
    display: block;
    margin-bottom: 8px;
    color: #777168;
    font-size: 12px;
  }
  strong {
    display: block;
    min-width: 0;
    font-size: 18px;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
    word-break: normal;
  }
`;
const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.7fr);
  gap: 22px;
  align-items: start;
  @media (max-width: 66rem) {
    grid-template-columns: 1fr;
  }
`;
const ColumnStack = styled.div`
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
const ProductList = styled.div`
  display: grid;
`;
const Product = styled.article`
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #ece8e1;
  &:last-child {
    border-bottom: 0;
  }
  img {
    width: 78px;
    height: 78px;
    border-radius: 9px;
    object-fit: cover;
    background: #f1eee9;
  }
  h3 {
    margin: 0 0 5px;
    font-size: 15px;
  }
  p {
    margin: 2px 0;
    color: #777168;
    font-size: 13px;
  }
  strong {
    font-size: 15px;
    font-variant-numeric: tabular-nums;
  }
`;
const Address = styled.dl`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  margin: 0;
  padding: 8px 20px 18px;
  div {
    padding: 12px 0;
    border-bottom: 1px solid #f0ece6;
  }
  dt {
    margin-bottom: 4px;
    color: #8a837a;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
  }
  div:nth-child(odd) {
    padding-right: 14px;
  }
  div:nth-child(even) {
    padding-left: 14px;
  }
`;
const Flow = styled.ol`
  display: grid;
  gap: 0;
  margin: 0;
  padding: 12px 20px 20px;
  list-style: none;
  li {
    position: relative;
    display: grid;
    grid-template-columns: 18px 1fr;
    gap: 12px;
    padding: 11px 0;
    color: #777168;
    font-size: 14px;
  }
  li::before {
    width: 12px;
    height: 12px;
    margin-top: 3px;
    border: 2px solid #d8d1c7;
    border-radius: 50%;
    background: #fff;
    content: '';
  }
  li:not(:last-child)::after {
    position: absolute;
    top: 28px;
    bottom: -5px;
    left: 7px;
    width: 2px;
    background: #e7e1d8;
    content: '';
  }
  li.done {
    color: #252421;
    font-weight: 600;
  }
  li.done::before {
    border-color: #8b7048;
    background: #8b7048;
  }
`;
const Advance = styled.div`
  display: grid;
  gap: 12px;
  padding: 18px 20px;
  border-top: 1px solid #ece8e1;
  background: #faf9f7;
  p {
    margin: 0;
    color: #6d675f;
    font-size: 13px;
    line-height: 1.5;
  }
  button {
    display: flex;
    min-height: 50px;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border: 0;
    border-radius: 9px;
    color: #fff;
    background: #8b7048;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  button:hover {
    background: #6f593d;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;
const PaymentActions = styled.div`
  display: grid;
  gap: 10px;
  padding: 18px 20px;
  p {
    margin: 0 0 4px;
    color: #6d675f;
    font-size: 13px;
    line-height: 1.5;
  }
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
    color: #8a3d48;
    border-color: #e1b7bd;
    background: #fff;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

function parseObject<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value && typeof value === 'object' ? (value as T) : fallback;
}
function statusOf(order: Order) {
  const timeline = parseObject<TimelineItem[]>(order.timeline, []);
  const status = String(
    order.orderStatus ?? timeline.at(-1)?.status ?? 'pending',
  ).toLowerCase();
  if (status === 'paid' || status === 'paymentfailed') return 'confirmed';
  if (status === 'refunded') return 'cancelled';
  return status;
}
function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';
}

export default function OrderDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const { get, put } = useFetchClient();
  const { locale } = useIntl();
  const user = useAuth('OrderDetailPage', (state) => state.user);
  const language = locale.toLowerCase().startsWith('fr') ? 'fr' : 'pt';
  const listLink = storeListLink('orders');
  const [order, setOrder] = useState<Order | null>(null);
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
      const response = await get<Response>(
        `${contentLink('api::order.order')}/${documentId}`,
      );
      setOrder(response.data.data ?? null);
    } catch {
      setMessage({
        text: 'Não foi possível carregar esta encomenda.',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [documentId]);
  const status = order ? statusOf(order) : 'pending';
  const legacyOrderStatus = String(order?.orderStatus ?? '').toLowerCase();
  const storedPaymentStatus = String(
    order?.paymentStatus ?? 'pending',
  ).toLowerCase();
  const paymentStatus =
    storedPaymentStatus === 'pending' && legacyOrderStatus === 'paid'
      ? 'approved'
      : storedPaymentStatus === 'pending' &&
          legacyOrderStatus === 'paymentfailed'
        ? 'rejected'
        : storedPaymentStatus === 'pending' && legacyOrderStatus === 'refunded'
          ? 'refunded'
          : storedPaymentStatus;
  const next =
    status === 'confirmed'
      ? paymentStatus === 'approved'
        ? 'processing'
        : undefined
      : nextState[status];
  const items = useMemo(
    () => parseObject<OrderItem[]>(order?.items, []),
    [order?.items],
  );
  const timeline = useMemo(
    () => parseObject<TimelineItem[]>(order?.timeline, []),
    [order?.timeline],
  );
  const address = parseObject<Record<string, unknown>>(
    order?.deliveryAddress,
    {},
  );
  const money = (value: unknown) =>
    new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'pt-AO', {
      style: 'currency',
      currency: String(order?.currency ?? 'AOA'),
      maximumFractionDigits: order?.currency === 'AOA' ? 0 : 2,
    }).format(Number(value ?? 0));
  const advance = async () => {
    if (!documentId || !next) return;
    setSaving(true);
    setMessage(null);
    try {
      await put(`${contentLink('api::order.order')}/${documentId}`, {
        orderStatus: next,
      });
      setMessage({
        text: `Estado alterado para ${states[next]?.[language] ?? next}.`,
        error: false,
      });
      await load();
      window.dispatchEvent(new Event('priscila:workflow-updated'));
    } catch (error: any) {
      setMessage({
        text:
          error?.response?.data?.error?.message ||
          'Não foi possível avançar o estado da encomenda.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };
  const changePayment = async (paymentStatus: 'approved' | 'rejected') => {
    if (!documentId) return;
    setSaving(true);
    setMessage(null);
    try {
      await put(`${contentLink('api::order.order')}/${documentId}`, {
        paymentStatus,
      });
      setMessage({
        text: 'Atualização recebida. A confirmar o pagamento…',
        error: false,
      });
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
        const response = await get<Response>(
          `${contentLink('api::order.order')}/${documentId}`,
        );
        const refreshed = response.data.data ?? null;
        setOrder(refreshed);
        if (
          String(refreshed?.paymentStatus ?? '').toLowerCase() === paymentStatus
        ) {
          setMessage({
            text:
              paymentStatus === 'approved'
                ? 'Pagamento confirmado.'
                : 'Pagamento marcado como não aprovado.',
            error: false,
          });
          window.dispatchEvent(new Event('priscila:workflow-updated'));
          return;
        }
      }
      setMessage({
        text: 'A atualização está a demorar mais do que o esperado. Atualize a página dentro de alguns segundos.',
        error: false,
      });
    } catch (error: any) {
      setMessage({
        text:
          error?.response?.data?.error?.message ||
          'Não foi possível atualizar o pagamento.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };
  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    'Utilizador';
  const role = user?.roles?.[0]?.name || 'Admin';
  return (
    <Shell labelledBy="order-title">
      <StoreLayout>
        <StoreSidebar activeHref={listLink} />
        <StorePage>
          <Topbar>
            <Back to={listLink}>
              <span aria-hidden>←</span>Encomendas
            </Back>
            <Actions>
              <Language to="/store/profile">
                <span>{language === 'fr' ? 'FR / €' : 'PT / €'}</span>
                <img src={iconPath('language')} alt="" aria-hidden />
              </Language>
              <Profile to="/store/profile">
                <Avatar>{initials(user?.firstname, user?.lastname)}</Avatar>
                <ProfileText>
                  <strong>{fullName}</strong>
                  <small>{role}</small>
                </ProfileText>
                <span aria-hidden>⌄</span>
              </Profile>
            </Actions>
          </Topbar>
          <Workspace>
            {message && <Notice $error={message.error}>{message.text}</Notice>}
            {loading ? (
              <Notice>A carregar a encomenda…</Notice>
            ) : order ? (
              <>
                <Header>
                  <div>
                    <h1 id="order-title">Encomenda {order.number}</h1>
                    <p>
                      Efetuada em{' '}
                      {order.placedAt
                        ? new Intl.DateTimeFormat(
                            language === 'fr' ? 'fr-FR' : 'pt-AO',
                            { dateStyle: 'long', timeStyle: 'short' },
                          ).format(new Date(order.placedAt))
                        : 'data não disponível'}
                    </p>
                  </div>
                  <StatusGroup>
                    <Badge $status={status}>
                      {states[status]?.[language] ?? status}
                    </Badge>
                    <Badge $status={paymentStatus}>
                      {paymentStates[paymentStatus]?.[language] ??
                        paymentStatus}
                    </Badge>
                  </StatusGroup>
                </Header>
                <SummaryGrid>
                  <Metric>
                    <small>Cliente</small>
                    <strong>{order.customerName || 'Não informado'}</strong>
                  </Metric>
                  <Metric>
                    <small>E-mail</small>
                    <strong>{order.customerEmail || 'Não informado'}</strong>
                  </Metric>
                  <Metric>
                    <small>Produtos</small>
                    <strong>
                      {items.reduce(
                        (sum, item) => sum + Number(item.quantity ?? 0),
                        0,
                      )}
                    </strong>
                  </Metric>
                  <Metric>
                    <small>Total</small>
                    <strong>{money(order.total)}</strong>
                  </Metric>
                </SummaryGrid>
                <Columns>
                  <ColumnStack>
                    <Card>
                      <CardHeader>
                        <h2>Produtos da encomenda</h2>
                        <p>Itens e valores confirmados no momento da compra.</p>
                      </CardHeader>
                      <ProductList>
                        {items.map((item, index) => (
                          <Product
                            key={`${item.reference ?? item.productSku}-${index}`}
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName || 'Produto'}
                              />
                            ) : (
                              <span />
                            )}
                            <div>
                              <h3>{item.productName || 'Produto'}</h3>
                              <p>
                                {item.variant
                                  ? `Tamanho: ${item.variant} · `
                                  : ''}
                                Quantidade: {item.quantity ?? 0}
                              </p>
                              <p>
                                Referência:{' '}
                                {item.reference ?? item.productSku ?? '—'}
                              </p>
                            </div>
                            <strong>
                              {money(
                                Number(item.unitPrice ?? 0) *
                                  Number(item.quantity ?? 0),
                              )}
                            </strong>
                          </Product>
                        ))}
                      </ProductList>
                    </Card>
                    <Card>
                      <CardHeader>
                        <h2>Resumo financeiro</h2>
                      </CardHeader>
                      <Address>
                        <div>
                          <dt>Subtotal</dt>
                          <dd>{money(order.subtotal)}</dd>
                        </div>
                        <div>
                          <dt>Entrega</dt>
                          <dd>{money(order.shipping)}</dd>
                        </div>
                        <div>
                          <dt>Total</dt>
                          <dd>{money(order.total)}</dd>
                        </div>
                        <div>
                          <dt>Moeda</dt>
                          <dd>{order.currency}</dd>
                        </div>
                      </Address>
                    </Card>
                  </ColumnStack>
                  <ColumnStack>
                    <Card>
                      <CardHeader>
                        <h2>Morada de entrega</h2>
                      </CardHeader>
                      <Address>
                        {Object.entries(addressLabels).map(([key, label]) =>
                          address[key] ? (
                            <div key={key}>
                              <dt>{label}</dt>
                              <dd>{String(address[key])}</dd>
                            </div>
                          ) : null,
                        )}
                      </Address>
                    </Card>
                    <Card>
                      <CardHeader>
                        <h2>Pagamento</h2>
                        <p>Registe o resultado do pagamento desta encomenda.</p>
                      </CardHeader>
                      <PaymentActions>
                        {paymentStatus === 'pending' ? (
                          <>
                            <p>
                              Confirme apenas depois de validar o recebimento do
                              valor fora da plataforma.
                            </p>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void changePayment('approved')}
                            >
                              Confirmar pagamento recebido
                            </button>
                            <button
                              className="secondary"
                              type="button"
                              disabled={saving}
                              onClick={() => void changePayment('rejected')}
                            >
                              Marcar como não aprovado
                            </button>
                          </>
                        ) : (
                          <p>
                            Estado atual:{' '}
                            <strong>
                              {paymentStates[paymentStatus]?.[language] ??
                                paymentStatus}
                            </strong>
                            . Um pagamento já processado não pode ser confirmado
                            novamente.
                          </p>
                        )}
                      </PaymentActions>
                    </Card>
                    <Card>
                      <CardHeader>
                        <h2>Progresso da encomenda</h2>
                        <p>
                          Os estados avançam pela ordem operacional definida.
                        </p>
                      </CardHeader>
                      <Flow>
                        {timeline.map((item, index) => (
                          <li className="done" key={`${item.status}-${index}`}>
                            <span>
                              <strong>
                                {states[String(item.status).toLowerCase()]?.[
                                  language
                                ] ?? item.status}
                              </strong>
                              <br />
                              <small>
                                {item.occurredAt
                                  ? new Intl.DateTimeFormat(
                                      language === 'fr' ? 'fr-FR' : 'pt-AO',
                                      {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                      },
                                    ).format(new Date(item.occurredAt))
                                  : '—'}
                              </small>
                            </span>
                          </li>
                        ))}
                      </Flow>
                      <Advance>
                        {next ? (
                          <>
                            <p>
                              {language === 'fr'
                                ? 'En continuant, la commande passera à : '
                                : 'Ao continuar, a encomenda passará para: '}
                              <strong>
                                {states[next]?.[language] ?? next}
                              </strong>
                              .
                            </p>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void advance()}
                            >
                              {saving
                                ? 'A atualizar…'
                                : `Avançar para ${states[next]?.[language] ?? next}`}
                              <span>→</span>
                            </button>
                          </>
                        ) : (
                          <p>
                            {status === 'confirmed' &&
                            paymentStatus !== 'approved'
                              ? 'A preparação ficará disponível quando o pagamento for aprovado.'
                              : 'Esta encomenda chegou a um estado final e não possui uma próxima etapa automática.'}
                          </p>
                        )}
                      </Advance>
                    </Card>
                  </ColumnStack>
                </Columns>
              </>
            ) : (
              <Notice $error>Encomenda não encontrada.</Notice>
            )}
          </Workspace>
        </StorePage>
      </StoreLayout>
    </Shell>
  );
}
