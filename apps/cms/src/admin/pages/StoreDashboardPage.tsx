import { useEffect, useState } from 'react';
import { Box, Flex, Main, Typography } from '@strapi/design-system';
import { ArrowRight, CheckCircle, ExternalLink, Plus, ShoppingCart, Star, WarningCircle } from '@strapi/icons';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

interface CollectionResponse {
  pagination?: { total?: number };
  results?: unknown[];
}

interface DashboardMetrics {
  products: number | null;
  orders: number | null;
  pendingReviews: number | null;
  unavailableProducts: number | null;
  kits: number | null;
  collections: number | null;
  ingredients: number | null;
  categories: number | null;
  customers: number | null;
  banners: number | null;
  draftProducts: number | null;
  productsWithoutIngredients: number | null;
  productsWithoutUsage: number | null;
  pendingTranslations: number | null;
}

interface OrderEntry {
  documentId?: string;
  id?: number;
  number?: string;
  customerName?: string;
  total?: number | string;
  currency?: string;
  status?: string;
  placedAt?: string;
}

interface OrdersResponse extends CollectionResponse {
  results?: OrderEntry[];
}

const contentLink = (uid: string) => `/content-manager/collection-types/${uid}`;
const storefrontUrl = import.meta.env.STRAPI_ADMIN_STOREFRONT_URL || 'http://localhost:4300';

const DashboardMain = styled(Main)`
  min-height: 100%;
  background: ${({ theme }) => theme.colors.neutral100};
`;

const DashboardHeader = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 2.5rem 3rem 1.75rem;

  @media (max-width: 48rem) {
    align-items: flex-start;
    flex-direction: column;
    padding: 2rem 1.5rem 1.5rem;
  }
`;

const DashboardTitle = styled.h1`
  margin: 0 0 0.375rem;
  color: ${({ theme }) => theme.colors.neutral800};
  font-family: 'Priscila Cormorant', Georgia, serif;
  font-size: clamp(2rem, 3.2vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
`;

const DashboardContent = styled.div`
  display: grid;
  gap: 1.25rem;
  padding: 0 3rem 3rem;

  @media (max-width: 48rem) { padding: 0 1.5rem 2rem; }
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.primary600};
  border-radius: 0.1875rem;
  color: ${({ theme }) => theme.colors.buttonNeutral0};
  background: ${({ theme }) => theme.colors.primary600};
  font-weight: 600;
  text-decoration: none;
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary700};
    background: ${({ theme }) => theme.colors.primary700};
    transform: translateY(-0.0625rem);
  }
`;

const MetricsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 68rem) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 36rem) { grid-template-columns: 1fr; }
`;

const MetricLink = styled(Link)`
  display: grid;
  gap: 0.75rem;
  min-height: 7.25rem;
  padding: 1.125rem;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 0.3125rem;
  color: ${({ theme }) => theme.colors.neutral800};
  background: ${({ theme }) => theme.colors.neutral0};
  text-decoration: none;
  transition: border-color 160ms ease, transform 160ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary500};
    transform: translateY(-0.125rem);
  }
`;

const MetricValue = styled.span`
  align-self: end;
  font-family: 'Priscila Cormorant', Georgia, serif;
  font-size: clamp(2rem, 3vw, 2.625rem);
  font-weight: 600;
  line-height: 0.9;
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const ContentStatsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 0.3125rem;
  background: ${({ theme }) => theme.colors.neutral0};

  @media (max-width: 72rem) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 42rem) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

const ContentStatLink = styled(Link)`
  display: grid;
  gap: 0.4rem;
  min-height: 5.75rem;
  padding: 1rem;
  border-right: 1px solid ${({ theme }) => theme.colors.neutral200};
  color: ${({ theme }) => theme.colors.neutral800};
  text-decoration: none;

  &:last-child { border-right: 0; }
  &:hover { background: ${({ theme }) => theme.colors.primary100}; }

  @media (max-width: 72rem) {
    &:nth-child(3n) { border-right: 0; }
    &:nth-child(-n + 3) { border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200}; }
  }

  @media (max-width: 42rem) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200};
    &:nth-child(3n) { border-right: 1px solid ${({ theme }) => theme.colors.neutral200}; }
    &:nth-child(2n) { border-right: 0; }
    &:nth-last-child(-n + 2) { border-bottom: 0; }
  }
`;

const ContentStatValue = styled.span`
  font-family: 'Priscila Cormorant', Georgia, serif;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1;
`;

const WorkGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(17rem, 0.7fr);
  gap: 1.25rem;

  @media (max-width: 62rem) { grid-template-columns: 1fr; }
`;

const Panel = styled.section`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 0.3125rem;
  background: ${({ theme }) => theme.colors.neutral0};
`;

const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 3.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral200};
`;

const QuietLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary600};
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const AttentionLink = styled(Link)`
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1.125rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
  color: ${({ theme }) => theme.colors.neutral800};
  text-decoration: none;

  &:last-child { border-bottom: 0; }
  &:hover { background: ${({ theme }) => theme.colors.primary100}; }
`;

const AttentionIcon = styled.span`
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  color: ${({ theme }) => theme.colors.primary700};
  background: ${({ theme }) => theme.colors.primary100};
`;

const ActionList = styled.div`
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
`;

const QualityItem = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
  color: ${({ theme }) => theme.colors.neutral800};
  text-decoration: none;

  &:last-child { border-bottom: 0; }
  &:hover { background: ${({ theme }) => theme.colors.primary100}; }
`;

const QualityCount = styled.span`
  flex: 0 0 auto;
  min-width: 2.25rem;
  color: ${({ theme }) => theme.colors.primary700};
  font-weight: 700;
  text-align: right;
`;

const OrderList = styled.div`
  display: grid;
`;

const OrderRow = styled(Link)`
  display: grid;
  grid-template-columns: minmax(7rem, 0.7fr) minmax(9rem, 1.2fr) minmax(7rem, 0.7fr) minmax(7rem, 0.7fr);
  gap: 1rem;
  align-items: center;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
  color: ${({ theme }) => theme.colors.neutral800};
  text-decoration: none;

  &:last-child { border-bottom: 0; }
  &:hover { background: ${({ theme }) => theme.colors.primary100}; }

  @media (max-width: 46rem) {
    grid-template-columns: 1fr auto;
    & > :nth-child(2) { grid-column: 1; }
    & > :nth-child(3) { grid-column: 2; grid-row: 1; }
    & > :nth-child(4) { grid-column: 2; grid-row: 2; }
  }
`;

const StatusLabel = styled.span`
  justify-self: start;
  padding: 0.3rem 0.5rem;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.primary700};
  background: ${({ theme }) => theme.colors.primary100};
  font-size: 0.72rem;
  font-weight: 600;
`;

const actionStyles = `
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 3.25rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.1875rem;
  text-decoration: none;
  transition: border-color 160ms ease, color 160ms ease;
`;

const ActionLink = styled(Link)`
  ${actionStyles}
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  color: ${({ theme }) => theme.colors.neutral800};
  &:hover { border-color: ${({ theme }) => theme.colors.primary500}; color: ${({ theme }) => theme.colors.primary700}; }
`;

const ExternalActionLink = styled.a`
  ${actionStyles}
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  color: ${({ theme }) => theme.colors.neutral800};
  &:hover { border-color: ${({ theme }) => theme.colors.primary500}; color: ${({ theme }) => theme.colors.primary700}; }
`;

async function countFor(
  get: ReturnType<typeof useFetchClient>['get'],
  uid: string,
  filters?: Record<string, string>,
): Promise<number | null> {
  try {
    const response = await get<CollectionResponse>(contentLink(uid), {
      params: { page: 1, pageSize: 1, ...filters },
    });
    return response.data.pagination?.total ?? response.data.results?.length ?? 0;
  } catch {
    return null;
  }
}

function formatMetric(value: number | null): string {
  return value === null ? '—' : new Intl.NumberFormat('pt-AO').format(value);
}

async function translationGap(
  get: ReturnType<typeof useFetchClient>['get'],
  uid: string,
): Promise<number | null> {
  const [portuguese, french] = await Promise.all([
    countFor(get, uid, { locale: 'pt' }),
    countFor(get, uid, { locale: 'fr' }),
  ]);
  if (portuguese === null || french === null) return null;
  return Math.max(0, portuguese - french);
}

async function fetchRecentOrders(
  get: ReturnType<typeof useFetchClient>['get'],
): Promise<OrderEntry[]> {
  try {
    const response = await get<OrdersResponse>(contentLink('api::order.order'), {
      params: { page: 1, pageSize: 5, sort: 'placedAt:DESC' },
    });
    return response.data.results ?? [];
  } catch {
    return [];
  }
}

const orderStatus: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  paid: 'Paga',
  processing: 'Em preparação',
  shipped: 'Enviada',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
  paymentfailed: 'Pagamento não aprovado',
  refunded: 'Reembolsada',
};

function formatMoney(value?: number | string, currency = 'AOA'): string {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'AOA' ? 0 : 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export default function StoreDashboardPage() {
  const { get } = useFetchClient();
  const user = useAuth('StoreDashboardPage', (state) => state.user);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderEntry[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      countFor(get, 'api::product.product'),
      countFor(get, 'api::order.order', { 'filters[status][$eq]': 'pending' }),
      countFor(get, 'api::review.review', { 'filters[moderationStatus][$eq]': 'pending' }),
      countFor(get, 'api::product.product', { 'filters[commerce][availability][$eq]': 'out-of-stock' }),
      countFor(get, 'api::kit.kit'),
      countFor(get, 'api::collection.collection'),
      countFor(get, 'api::ingredient.ingredient'),
      countFor(get, 'api::category.category'),
      countFor(get, 'api::customer.customer'),
      countFor(get, 'api::hero-slide.hero-slide'),
      countFor(get, 'api::product.product', { status: 'draft' }),
      countFor(get, 'api::product.product', { 'filters[ingredients][$null]': 'true' }),
      countFor(get, 'api::product.product', { 'filters[usageSteps][$null]': 'true' }),
      Promise.all([
        translationGap(get, 'api::product.product'),
        translationGap(get, 'api::kit.kit'),
        translationGap(get, 'api::collection.collection'),
      ]),
      fetchRecentOrders(get),
    ]).then(([
      products,
      orders,
      pendingReviews,
      unavailableProducts,
      kits,
      collections,
      ingredients,
      categories,
      customers,
      banners,
      draftProducts,
      productsWithoutIngredients,
      productsWithoutUsage,
      translationGaps,
      ordersList,
    ]) => {
      if (!active) return;
      const knownGaps = translationGaps.filter((value): value is number => value !== null);
      setMetrics({
        products,
        orders,
        pendingReviews,
        unavailableProducts,
        kits,
        collections,
        ingredients,
        categories,
        customers,
        banners,
        draftProducts,
        productsWithoutIngredients,
        productsWithoutUsage,
        pendingTranslations: knownGaps.length === translationGaps.length
          ? knownGaps.reduce((total, value) => total + value, 0)
          : null,
      });
      setRecentOrders(ordersList);
    });
    return () => { active = false; };
  }, [get]);

  const firstName = user?.firstname?.trim() || user?.username?.trim() || 'equipa';
  const data = metrics ?? {
    products: null,
    orders: null,
    pendingReviews: null,
    unavailableProducts: null,
    kits: null,
    collections: null,
    ingredients: null,
    categories: null,
    customers: null,
    banners: null,
    draftProducts: null,
    productsWithoutIngredients: null,
    productsWithoutUsage: null,
    pendingTranslations: null,
  };
  const attentionItems = [
    { icon: ShoppingCart, title: `${formatMetric(data.orders)} encomendas aguardam confirmação`, detail: 'Confirme os produtos e avance a preparação da entrega.', href: `${contentLink('api::order.order')}?filters%5Bstatus%5D%5B%24eq%5D=pending` },
    { icon: Star, title: `${formatMetric(data.pendingReviews)} avaliações aguardam aprovação`, detail: 'Leia e escolha quais avaliações podem aparecer no site.', href: `${contentLink('api::review.review')}?filters%5BmoderationStatus%5D%5B%24eq%5D=pending` },
    { icon: WarningCircle, title: `${formatMetric(data.unavailableProducts)} produtos estão indisponíveis`, detail: 'Atualize a disponibilidade quando esses produtos voltarem ao stock.', href: contentLink('api::product.product') },
  ];

  return (
    <DashboardMain labelledBy="store-dashboard-title">
      <DashboardHeader>
        <Box>
          <DashboardTitle id="store-dashboard-title">Bom dia, {firstName}</DashboardTitle>
          <Typography textColor="neutral600">Aqui está o que precisa da sua atenção hoje.</Typography>
        </Box>
        <PrimaryLink to={`${contentLink('api::product.product')}/create`}><Plus aria-hidden /> Novo produto</PrimaryLink>
      </DashboardHeader>

      <DashboardContent>
        <MetricsGrid aria-label="Resumo da loja">
          <MetricLink to={contentLink('api::product.product')}><Typography variant="pi" textColor="neutral600">Produtos no catálogo</Typography><MetricValue>{formatMetric(data.products)}</MetricValue></MetricLink>
          <MetricLink to={contentLink('api::order.order')}><Typography variant="pi" textColor="neutral600">Novas encomendas</Typography><MetricValue>{formatMetric(data.orders)}</MetricValue></MetricLink>
          <MetricLink to={contentLink('api::review.review')}><Typography variant="pi" textColor="neutral600">Avaliações pendentes</Typography><MetricValue>{formatMetric(data.pendingReviews)}</MetricValue></MetricLink>
          <MetricLink to={contentLink('api::product.product')}><Typography variant="pi" textColor="neutral600">Produtos indisponíveis</Typography><MetricValue>{formatMetric(data.unavailableProducts)}</MetricValue></MetricLink>
        </MetricsGrid>

        <SectionHeading>
          <Box>
            <Typography tag="h2" fontWeight="semiBold">Conteúdos cadastrados</Typography>
            <Typography tag="p" variant="pi" textColor="neutral600">Resumo do conteúdo disponível para montar a loja.</Typography>
          </Box>
        </SectionHeading>
        <ContentStatsGrid aria-label="Conteúdos cadastrados">
          <ContentStatLink to={contentLink('api::kit.kit')}><Typography variant="pi" textColor="neutral600">Kits</Typography><ContentStatValue>{formatMetric(data.kits)}</ContentStatValue></ContentStatLink>
          <ContentStatLink to={contentLink('api::collection.collection')}><Typography variant="pi" textColor="neutral600">Coleções</Typography><ContentStatValue>{formatMetric(data.collections)}</ContentStatValue></ContentStatLink>
          <ContentStatLink to={contentLink('api::ingredient.ingredient')}><Typography variant="pi" textColor="neutral600">Ingredientes</Typography><ContentStatValue>{formatMetric(data.ingredients)}</ContentStatValue></ContentStatLink>
          <ContentStatLink to={contentLink('api::category.category')}><Typography variant="pi" textColor="neutral600">Categorias</Typography><ContentStatValue>{formatMetric(data.categories)}</ContentStatValue></ContentStatLink>
          <ContentStatLink to={contentLink('api::customer.customer')}><Typography variant="pi" textColor="neutral600">Clientes</Typography><ContentStatValue>{formatMetric(data.customers)}</ContentStatValue></ContentStatLink>
          <ContentStatLink to={contentLink('api::hero-slide.hero-slide')}><Typography variant="pi" textColor="neutral600">Banners</Typography><ContentStatValue>{formatMetric(data.banners)}</ContentStatValue></ContentStatLink>
        </ContentStatsGrid>

        <WorkGrid>
          <Panel>
            <PanelHeader><Typography tag="h2" fontWeight="semiBold">Precisa da sua atenção</Typography><QuietLink to={contentLink('api::order.order')}>Ver encomendas</QuietLink></PanelHeader>
            {attentionItems.map((item) => {
              const Icon = item.icon;
              return <AttentionLink key={item.title} to={item.href}><AttentionIcon><Icon aria-hidden /></AttentionIcon><Box><Typography tag="p" fontWeight="semiBold">{item.title}</Typography><Typography tag="p" variant="pi" textColor="neutral600">{item.detail}</Typography></Box></AttentionLink>;
            })}
          </Panel>

          <Panel>
            <PanelHeader><Typography tag="h2" fontWeight="semiBold">Ações rápidas</Typography></PanelHeader>
            <ActionList>
              <ActionLink to={`${contentLink('api::product.product')}/create`}><span>Adicionar produto</span><ArrowRight aria-hidden /></ActionLink>
              <ActionLink to="/content-manager/single-types/api::home-page.home-page"><span>Atualizar página inicial</span><ArrowRight aria-hidden /></ActionLink>
              <ActionLink to={contentLink('api::order.order')}><span>Gerir encomendas</span><ArrowRight aria-hidden /></ActionLink>
              <ExternalActionLink href={storefrontUrl} target="_blank" rel="noreferrer"><span>Ver o site</span><ExternalLink aria-hidden /></ExternalActionLink>
            </ActionList>
          </Panel>
        </WorkGrid>

        <WorkGrid>
          <Panel>
            <PanelHeader>
              <Box>
                <Typography tag="h2" fontWeight="semiBold">Encomendas recentes</Typography>
                <Typography tag="p" variant="pi" textColor="neutral600">As cinco encomendas mais recentes da loja.</Typography>
              </Box>
              <QuietLink to={contentLink('api::order.order')}>Ver todas</QuietLink>
            </PanelHeader>
            <OrderList>
              {recentOrders.length ? recentOrders.map((order) => {
                const identifier = order.documentId ?? order.id;
                return (
                  <OrderRow key={String(identifier ?? order.number)} to={`${contentLink('api::order.order')}/${identifier}`}>
                    <Typography fontWeight="semiBold">{order.number || 'Sem número'}</Typography>
                    <Typography variant="pi" textColor="neutral600">{order.customerName || 'Cliente não identificado'}</Typography>
                    <StatusLabel>{orderStatus[order.status ?? ''] ?? order.status ?? 'Sem estado'}</StatusLabel>
                    <Typography fontWeight="semiBold">{formatMoney(order.total, order.currency)}</Typography>
                  </OrderRow>
                );
              }) : (
                <Box padding={5}><Typography textColor="neutral600">Ainda não existem encomendas para apresentar.</Typography></Box>
              )}
            </OrderList>
          </Panel>

          <Panel>
            <PanelHeader>
              <Box>
                <Typography tag="h2" fontWeight="semiBold">Qualidade do catálogo</Typography>
                <Typography tag="p" variant="pi" textColor="neutral600">Conteúdos que podem precisar de revisão.</Typography>
              </Box>
            </PanelHeader>
            <QualityItem to={contentLink('api::product.product')}><span>Produtos em rascunho</span><QualityCount>{formatMetric(data.draftProducts)}</QualityCount></QualityItem>
            <QualityItem to={contentLink('api::product.product')}><span>Sem ingredientes associados</span><QualityCount>{formatMetric(data.productsWithoutIngredients)}</QualityCount></QualityItem>
            <QualityItem to={contentLink('api::product.product')}><span>Sem instruções de utilização</span><QualityCount>{formatMetric(data.productsWithoutUsage)}</QualityCount></QualityItem>
            <QualityItem to={contentLink('api::product.product')}><span>Traduções em francês pendentes</span><QualityCount>{formatMetric(data.pendingTranslations)}</QualityCount></QualityItem>
          </Panel>
        </WorkGrid>

        <Panel>
          <PanelHeader><Flex gap={3} alignItems="center"><CheckCircle aria-hidden /><Box><Typography tag="h2" fontWeight="semiBold">Antes de publicar</Typography><Typography tag="p" variant="pi" textColor="neutral600">Confirme as traduções, use imagens otimizadas e reveja o conteúdo no site.</Typography></Box></Flex></PanelHeader>
        </Panel>
      </DashboardContent>
    </DashboardMain>
  );
}
