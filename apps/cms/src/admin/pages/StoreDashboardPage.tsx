import { useEffect, useMemo, useState } from 'react';
import { Main } from '@strapi/design-system';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  contentLink,
  iconPath,
  productCreateLink,
  productListLink,
  storeListLink,
  StoreLayout,
  StorePage,
  StoreSidebar,
} from '../components/StoreSidebar';

interface CollectionResponse {
  pagination?: { total?: number };
  results?: Array<Record<string, unknown>>;
}

interface DashboardMetrics {
  products: number | null;
  orders: number | null;
  pendingReviews: number | null;
  unavailableProducts: number | null;
  kits: number | null;
  collections: number | null;
  ingredients: number | null;
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
  orderStatus?: string;
  timeline?: unknown;
}

interface OrdersResponse extends CollectionResponse {
  results?: OrderEntry[];
}

const storefrontUrl =
  import.meta.env.STRAPI_ADMIN_STOREFRONT_URL || 'http://localhost:4300';

const frenchCopy: Record<string, string> = {
  Dashboard: 'Tableau de bord',
  Encomendas: 'Commandes',
  Produtos: 'Produits',
  Avaliações: 'Avis',
  Clientes: 'Clients',
  'Kit de produtos': 'Kits de produits',
  Categorias: 'Catégories',
  Coleções: 'Collections',
  Ingredientes: 'Ingrédients',
  Tamanhos: 'Formats',
  'Banner página inicial': "Bannière de la page d'accueil",
  'Testemunho em vídeo': 'Témoignage vidéo',
  Usuários: 'Utilisateurs',
  'Configurações do site': 'Paramètres du site',
  'Página inicial': "Page d'accueil",
  'Página sobre': 'Page à propos',
  'Aqui está o que precisa da sua atenção hoje.':
    "Voici ce qui requiert votre attention aujourd'hui.",
  'Alterar idioma e moeda': 'Modifier la langue et la devise',
  Pesquisar: 'Rechercher',
  'Pesquisar no painel': 'Rechercher dans le tableau de bord',
  'Novo produto': 'Nouveau produit',
  'Resumo da loja': 'Résumé de la boutique',
  'Produtos no catálogo': 'Produits au catalogue',
  'Novas encomendas': 'Nouvelles commandes',
  'Avaliações pendentes': 'Avis en attente',
  'Produtos indisponíveis': 'Produits indisponibles',
  'Conteúdos cadastrados': 'Contenus enregistrés',
  Kits: 'Kits',
  Banners: 'Bannières',
  'Encomendas recentes': 'Commandes récentes',
  'Ver todas': 'Voir toutes',
  Preço: 'Prix',
  Estado: 'Statut',
  'Sem número': 'Sans numéro',
  'Cliente não identificado': 'Client non identifié',
  'Sem estado': 'Sans statut',
  'Ainda não existem encomendas para apresentar.':
    "Il n'y a pas encore de commandes à afficher.",
  'Qualidade do catálogo': 'Qualité du catalogue',
  'Produtos em rascunho': 'Produits en brouillon',
  'Sem ingredientes associados': 'Sans ingrédients associés',
  'Sem instruções de utilização': "Sans instructions d'utilisation",
  'Traduções em francês pendentes': 'Traductions françaises en attente',
  'Ações rápidas': 'Actions rapides',
  'Adicionar produto': 'Ajouter un produit',
  'Atualizar página inicial': "Mettre à jour la page d'accueil",
  'Gerir encomendas': 'Gérer les commandes',
  'Ver o site': 'Voir le site',
  Pendente: 'En attente',
  Confirmada: 'Confirmée',
  Paga: 'Payée',
  'Em preparação': 'En préparation',
  Enviada: 'Expédiée',
  Entregue: 'Livrée',
  Cancelada: 'Annulée',
  'Pagamento não aprovado': 'Paiement refusé',
  Reembolsada: 'Remboursée',
  Registada: 'Enregistrée',
  Rascunho: 'Brouillon',
};

const Shell = styled(Main)`
  min-height: 100vh;
  color: #1a1917;
  background: #f7f5f2;
  font-family: 'Priscila Inter', Inter, Arial, sans-serif;
`;

const Header = styled.header`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 93px;
  padding: 16px 24px;
  border-bottom: 1px solid #ece8e1;
  background: #fafafa;

  @media (max-width: 44rem) {
    align-items: flex-start;
    padding: 20px;
    flex-direction: column;
  }
`;

const Greeting = styled.div`
  display: grid;
  gap: 8px;
`;

const GreetingTitle = styled.h1`
  margin: 0;
  color: #2f303a;
  font-size: 24px;
  font-weight: 600;
  line-height: 29px;
`;

const GreetingText = styled.p`
  margin: 0;
  color: #6d675f;
  font-size: 16px;
  line-height: 24px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;

  @media (max-width: 32rem) {
    width: 100%;
    justify-content: space-between;
  }
`;

const LanguageLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  color: #1a1917;
  font-size: 14px;
  font-weight: 700;
  line-height: 21px;
  letter-spacing: 0.28px;
  text-decoration: none;
  text-transform: uppercase;

  img {
    width: 24px;
    height: 24px;
  }
`;

const ProfileLink = styled(Link)`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 55px;
  padding: 7px;
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
  flex: 0 0 40px;
  place-items: center;
  border-radius: 10px;
  color: #fff;
  background: #7d6645;
  font-size: 14px;
  font-weight: 700;
`;

const ProfileCopy = styled.span`
  display: grid;
  min-width: 112px;

  strong {
    font-size: 16px;
    font-weight: 400;
    line-height: 24px;
  }
  small {
    color: #6d675f;
    font-size: 12px;
    line-height: 18px;
  }

  @media (max-width: 32rem) {
    display: none;
  }
`;

const Chevron = styled.span`
  width: 8px;
  height: 8px;
  margin: 0 6px 4px 2px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
`;

const Content = styled.div`
  box-sizing: border-box;
  display: grid;
  gap: 32px;
  max-width: 1229px;
  margin: 0 auto;
  padding: 32px;

  @media (max-width: 44rem) {
    padding: 20px;
  }
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: center;

  @media (max-width: 36rem) {
    grid-template-columns: 1fr;
  }
`;

const SearchBox = styled.label`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 50px;
  padding: 8px 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: #fff;

  svg {
    width: 24px;
    height: 24px;
    color: #7d6645;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  color: #1a1917;
  background: transparent;
  font: inherit;
  font-size: 14px;

  &::placeholder {
    color: #8f887e;
    opacity: 1;
  }
`;

const PrimaryAction = styled(Link)`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 12px;
  border: 1px solid #7d6645;
  border-radius: 10px;
  color: #fff;
  background: #7d6645;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  text-decoration: none;
  transition: background-color 160ms ease;

  &:hover {
    background: #5f4d35;
  }
  svg {
    width: 24px;
    height: 24px;
  }
`;

const MetricsGrid = styled.section<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: repeat(
    ${({ $compact }) => ($compact ? 5 : 4)},
    minmax(0, 1fr)
  );
  gap: 18px;

  @media (max-width: 70rem) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 36rem) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled(Link)`
  box-sizing: border-box;
  display: grid;
  gap: 12px;
  min-height: 108px;
  padding: 24px;
  border: 1px solid #ece8e1;
  border-radius: 10px;
  color: #1a1917;
  background: #fff;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: #b49667;
    transform: translateY(-2px);
  }
`;

const MetricTop = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #6d675f;
  font-size: 16px;
  line-height: 24px;
`;

const MetricArrow = styled.span`
  color: #b49667;
  font-size: 24px;
  line-height: 1;
`;

const MetricValue = styled.strong`
  font-size: 32px;
  font-weight: 600;
  line-height: 40px;
`;

const Section = styled.section`
  display: grid;
  gap: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: #2f303a;
  font-size: 16px;
  font-weight: 600;
  line-height: 19px;
`;

const QuietLink = styled(Link)`
  color: #7d6645;
  font-size: 16px;
  font-weight: 600;
  line-height: 19px;
  text-decoration: underline;
  text-underline-offset: 3px;
`;

const Table = styled.div`
  overflow: hidden;
  border: 1px solid #ece8e1;
  border-radius: 10px;
  background: #fff;
`;

const TableRow = styled(Link)<{ $header?: boolean }>`
  display: grid;
  grid-template-columns:
    minmax(12rem, 1.1fr) minmax(13rem, 1fr) minmax(8rem, 0.95fr)
    minmax(8rem, 0.7fr);
  min-height: 56px;
  align-items: center;
  border-bottom: 1px solid #ece8e1;
  color: ${({ $header }) => ($header ? '#1a1917' : '#6d675f')};
  background: #fff;
  font-size: 16px;
  font-weight: ${({ $header }) => ($header ? 600 : 400)};
  text-decoration: none;

  &:last-child {
    border-bottom: 0;
  }
  &:not([data-header='true']):hover {
    background: rgba(125, 102, 69, 0.04);
  }
  > span {
    padding: 15px;
  }

  @media (max-width: 48rem) {
    grid-template-columns: 1fr auto;
    > span:nth-child(2) {
      grid-column: 1;
    }
    > span:nth-child(3) {
      display: none;
    }
    > span:nth-child(4) {
      grid-column: 2;
      grid-row: 1 / span 2;
    }
  }
`;

const EmptyRow = styled.div`
  padding: 28px 15px;
  color: #6d675f;
  font-size: 16px;
`;

const dashboardStatusColors: Record<
  string,
  { background: string; border: string; color: string }
> = {
  pending: { background: '#fff7e6', border: '#f0c36a', color: '#75530b' },
  confirmed: { background: '#eef6ff', border: '#93c5fd', color: '#1e4f86' },
  paid: { background: '#dcfce7', border: '#7bf1a8', color: '#166534' },
  processing: { background: '#f7f2e9', border: '#d6c19a', color: '#6b522d' },
  shipped: { background: '#f1f0ff', border: '#b9b4f6', color: '#47408f' },
  delivered: { background: '#dcfce7', border: '#7bf1a8', color: '#166534' },
  cancelled: { background: '#fff1f2', border: '#fda4af', color: '#9f1239' },
  paymentfailed: {
    background: '#fff1f2',
    border: '#fda4af',
    color: '#9f1239',
  },
  refunded: { background: '#f5f5f4', border: '#d6d3d1', color: '#57534e' },
};

const Status = styled.span<{ $status: string }>`
  justify-self: start;
  padding: 5px 14px !important;
  border: 1px solid
    ${({ $status }) =>
      (dashboardStatusColors[$status] ?? dashboardStatusColors.cancelled)
        .border};
  border-radius: 999px;
  color: ${({ $status }) =>
    (dashboardStatusColors[$status] ?? dashboardStatusColors.cancelled).color};
  background: ${({ $status }) =>
    (dashboardStatusColors[$status] ?? dashboardStatusColors.cancelled)
      .background};
  font-size: 14px;
  line-height: 17px;
`;

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;

  @media (max-width: 52rem) {
    grid-template-columns: 1fr;
  }
`;

const List = styled.div`
  overflow: hidden;
  border: 1px solid #ece8e1;
  border-radius: 10px;
  background: #fff;
`;

const listItemStyles = `
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 11px 15px;
  border-bottom: 1px solid #ece8e1;
  color: #1a1917;
  font-size: 16px;
  line-height: 24px;
  text-decoration: none;

  &:last-child { border-bottom: 0; }
  &:hover { background: rgba(125, 102, 69, 0.04); }
`;

const ListLink = styled(Link)`
  ${listItemStyles}
`;

const ExternalListLink = styled.a`
  ${listItemStyles}
`;

const ListValue = styled.span`
  color: #6d675f;
`;

const ListArrow = styled.span`
  color: #b49667;
  font-size: 28px;
  line-height: 1;
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
    return (
      response.data.pagination?.total ?? response.data.results?.length ?? 0
    );
  } catch {
    return null;
  }
}

async function entriesFor(
  get: ReturnType<typeof useFetchClient>['get'],
  uid: string,
  params: Record<string, string> = {},
): Promise<Array<Record<string, unknown>> | null> {
  try {
    const first = await get<CollectionResponse>(contentLink(uid), {
      params: { page: 1, pageSize: 100, ...params },
    });
    const entries = [...(first.data.results ?? [])];
    const total = first.data.pagination?.total ?? entries.length;
    for (let page = 2; entries.length < total; page += 1) {
      const response = await get<CollectionResponse>(contentLink(uid), {
        params: { page, pageSize: 100, ...params },
      });
      const next = response.data.results ?? [];
      if (!next.length) break;
      entries.push(...next);
    }
    return entries;
  } catch {
    return null;
  }
}

async function countDraftProducts(
  get: ReturnType<typeof useFetchClient>['get'],
): Promise<number | null> {
  const entries = await entriesFor(get, 'api::product.product', {
    locale: 'pt',
  });
  if (!entries) return null;
  return entries.filter((entry) => {
    const status =
      typeof entry.status === 'string' ? entry.status.toLowerCase() : '';
    return status === 'draft' || (!status && entry.publishedAt === null);
  }).length;
}

function formatMetric(value: number | null): string {
  return value === null ? '—' : new Intl.NumberFormat('pt-AO').format(value);
}

async function translationGap(
  get: ReturnType<typeof useFetchClient>['get'],
  uid: string,
) {
  const [portuguese, french] = await Promise.all([
    entriesFor(get, uid, { locale: 'pt' }),
    entriesFor(get, uid, { locale: 'fr' }),
  ]);
  if (portuguese === null || french === null) return null;
  const frenchDocuments = new Set(
    french.map((entry) => String(entry.documentId ?? '')).filter(Boolean),
  );
  return portuguese.filter((entry) => {
    const documentId = String(entry.documentId ?? '');
    return documentId && !frenchDocuments.has(documentId);
  }).length;
}

async function fetchRecentOrders(
  get: ReturnType<typeof useFetchClient>['get'],
): Promise<OrderEntry[]> {
  try {
    const response = await get<OrdersResponse>(
      contentLink('api::order.order'),
      {
        params: { page: 1, pageSize: 5, sort: 'placedAt:DESC' },
      },
    );
    return response.data.results ?? [];
  } catch {
    return [];
  }
}

const orderStatus: Record<string, string> = {
  published: 'Registada',
  draft: 'Rascunho',
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

function getOrderBusinessStatus(order: OrderEntry) {
  if (order.orderStatus) {
    const status = order.orderStatus.toLowerCase();
    if (status === 'paid' || status === 'paymentfailed') return 'confirmed';
    if (status === 'refunded') return 'cancelled';
    return status;
  }
  let timeline = order.timeline;
  if (typeof timeline === 'string') {
    try {
      timeline = JSON.parse(timeline);
    } catch {
      timeline = [];
    }
  }
  if (Array.isArray(timeline)) {
    const latest = [...timeline]
      .reverse()
      .find((item) => item && typeof item === 'object' && 'status' in item);
    if (latest && typeof latest === 'object' && 'status' in latest) {
      return String(latest.status).toLowerCase();
    }
  }
  return '';
}

function formatMoney(value?: number | string, currency = 'AOA'): string {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'AOA' ? 0 : 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function initials(firstname?: string, lastname?: string) {
  return `${firstname?.[0] ?? ''}${lastname?.[0] ?? ''}`.toUpperCase() || 'PS';
}

export default function StoreDashboardPage() {
  const { get } = useFetchClient();
  const { locale } = useIntl();
  const user = useAuth('StoreDashboardPage', (state) => state.user);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderEntry[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      countFor(get, 'api::product.product'),
      countFor(get, 'api::order.order', {
        'filters[orderStatus][$eq]': 'pending',
      }),
      countFor(get, 'api::review.review', {
        'filters[moderationStatus][$eq]': 'pending',
      }),
      countFor(get, 'api::product.product', {
        'filters[commerce][availability][$eq]': 'out-of-stock',
      }),
      countFor(get, 'api::kit.kit'),
      countFor(get, 'api::collection.collection'),
      countFor(get, 'api::ingredient.ingredient'),
      countFor(get, 'api::customer.customer'),
      countFor(get, 'api::hero-slide.hero-slide'),
      countDraftProducts(get),
      countFor(get, 'api::product.product', {
        'filters[ingredients][$null]': 'true',
      }),
      countFor(get, 'api::product.product', {
        'filters[usageSteps][$null]': 'true',
      }),
      Promise.all([
        translationGap(get, 'api::product.product'),
        translationGap(get, 'api::kit.kit'),
        translationGap(get, 'api::collection.collection'),
      ]),
      fetchRecentOrders(get),
    ]).then(
      ([
        products,
        orders,
        pendingReviews,
        unavailableProducts,
        kits,
        collections,
        ingredients,
        customers,
        banners,
        draftProducts,
        productsWithoutIngredients,
        productsWithoutUsage,
        translationGaps,
        ordersList,
      ]) => {
        if (!active) return;
        const knownGaps = translationGaps.filter(
          (value): value is number => value !== null,
        );
        setMetrics({
          products,
          orders,
          pendingReviews,
          unavailableProducts,
          kits,
          collections,
          ingredients,
          customers,
          banners,
          draftProducts,
          productsWithoutIngredients,
          productsWithoutUsage,
          pendingTranslations:
            knownGaps.length === translationGaps.length
              ? knownGaps.reduce((total, value) => total + value, 0)
              : null,
        });
        setRecentOrders(ordersList);
      },
    );
    return () => {
      active = false;
    };
  }, [get]);

  const firstName =
    user?.firstname?.trim() || user?.username?.trim() || 'equipa';
  const isFrench = locale.toLowerCase().startsWith('fr');
  const t = (text: string) => (isFrench ? (frenchCopy[text] ?? text) : text);
  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    'Utilizador';
  const roleName = user?.roles?.[0]?.name || 'Admin';
  const data = metrics ?? {
    products: null,
    orders: null,
    pendingReviews: null,
    unavailableProducts: null,
    kits: null,
    collections: null,
    ingredients: null,
    customers: null,
    banners: null,
    draftProducts: null,
    productsWithoutIngredients: null,
    productsWithoutUsage: null,
    pendingTranslations: null,
  };

  const primaryMetrics = useMemo(
    () =>
      [
        [t('Produtos no catálogo'), data.products, productListLink],
        [t('Novas encomendas'), data.orders, storeListLink('orders')],
        [
          t('Avaliações pendentes'),
          data.pendingReviews,
          storeListLink('reviews'),
        ],
        [
          t('Produtos indisponíveis'),
          data.unavailableProducts,
          productListLink,
        ],
      ] as const,
    [data, isFrench],
  );

  const contentMetrics = useMemo(
    () =>
      [
        [t('Kits'), data.kits, storeListLink('kits')],
        [t('Coleções'), data.collections, storeListLink('collections')],
        [t('Ingredientes'), data.ingredients, storeListLink('ingredients')],
        [t('Clientes'), data.customers, storeListLink('customers')],
        [t('Banners'), data.banners, storeListLink('banners')],
      ] as const,
    [data, isFrench],
  );

  return (
    <Shell labelledBy="store-dashboard-title">
      <StoreLayout>
        <StoreSidebar activeHref="/" />
        <StorePage>
          <Header>
            <Greeting>
              <GreetingTitle id="store-dashboard-title">
                {isFrench ? `Bonjour, ${firstName}` : `Bom dia, ${firstName}`}
              </GreetingTitle>
              <GreetingText>
                {t('Aqui está o que precisa da sua atenção hoje.')}
              </GreetingText>
            </Greeting>
            <HeaderActions>
              <LanguageLink to="/store/profile" aria-label={t('Alterar idioma e moeda')}>
                <span>{isFrench ? 'FR / €' : 'PT / €'}</span>
                <img src={iconPath('language')} alt="" aria-hidden />
              </LanguageLink>
              <ProfileLink to="/store/profile">
                <Avatar>{initials(user?.firstname, user?.lastname)}</Avatar>
                <ProfileCopy>
                  <strong>{fullName}</strong>
                  <small>{roleName}</small>
                </ProfileCopy>
                <Chevron aria-hidden />
              </ProfileLink>
            </HeaderActions>
          </Header>

          <Content>
            <Toolbar>
              <SearchBox>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="m16.5 16.5 4 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <SearchInput
                  type="search"
                  placeholder={t('Pesquisar')}
                  aria-label={t('Pesquisar no painel')}
                />
              </SearchBox>
              <PrimaryAction to={productCreateLink}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                {t('Novo produto')}
              </PrimaryAction>
            </Toolbar>

            <MetricsGrid aria-label={t('Resumo da loja')}>
              {primaryMetrics.map(([label, value, href]) => (
                <MetricCard key={label} to={href}>
                  <MetricTop>
                    <span>{label}</span>
                    <MetricArrow aria-hidden>↗</MetricArrow>
                  </MetricTop>
                  <MetricValue>{formatMetric(value)}</MetricValue>
                </MetricCard>
              ))}
            </MetricsGrid>

            <Section>
              <SectionHeader>
                <SectionTitle>{t('Conteúdos cadastrados')}</SectionTitle>
              </SectionHeader>
              <MetricsGrid $compact aria-label={t('Conteúdos cadastrados')}>
                {contentMetrics.map(([label, value, href]) => (
                  <MetricCard key={label} to={href}>
                    <MetricTop>
                      <span>{label}</span>
                      <MetricArrow aria-hidden>↗</MetricArrow>
                    </MetricTop>
                    <MetricValue>{formatMetric(value)}</MetricValue>
                  </MetricCard>
                ))}
              </MetricsGrid>
            </Section>

            <Section>
              <SectionHeader>
                <SectionTitle>{t('Encomendas recentes')}</SectionTitle>
                <QuietLink to={storeListLink('orders')}>
                  {t('Ver todas')}
                </QuietLink>
              </SectionHeader>
              <Table>
                <TableRow as="div" to="" $header data-header="true">
                  <span>ID</span>
                  <span>{t('Clientes')}</span>
                  <span>{t('Preço')}</span>
                  <span>{t('Estado')}</span>
                </TableRow>
                {recentOrders.length ? (
                  recentOrders.map((order) => {
                    const identifier = order.documentId ?? order.id;
                    const businessStatus = getOrderBusinessStatus(order);
                    return (
                      <TableRow
                        key={String(identifier ?? order.number)}
                        to={`/store/orders/${identifier}`}
                      >
                        <span>{order.number || t('Sem número')}</span>
                        <span>
                          {order.customerName || t('Cliente não identificado')}
                        </span>
                        <span>{formatMoney(order.total, order.currency)}</span>
                        <Status $status={businessStatus}>
                          {t(orderStatus[businessStatus] ?? 'Sem estado')}
                        </Status>
                      </TableRow>
                    );
                  })
                ) : (
                  <EmptyRow>
                    {t('Ainda não existem encomendas para apresentar.')}
                  </EmptyRow>
                )}
              </Table>
            </Section>

            <TwoColumns>
              <Section>
                <SectionHeader>
                  <SectionTitle>{t('Qualidade do catálogo')}</SectionTitle>
                </SectionHeader>
                <List>
                  <ListLink to={productListLink}>
                    <span>{t('Produtos em rascunho')}</span>
                    <ListValue>{formatMetric(data.draftProducts)}</ListValue>
                  </ListLink>
                  <ListLink to={productListLink}>
                    <span>{t('Sem ingredientes associados')}</span>
                    <ListValue>
                      {formatMetric(data.productsWithoutIngredients)}
                    </ListValue>
                  </ListLink>
                  <ListLink to={productListLink}>
                    <span>{t('Sem instruções de utilização')}</span>
                    <ListValue>
                      {formatMetric(data.productsWithoutUsage)}
                    </ListValue>
                  </ListLink>
                  <ListLink to={productListLink}>
                    <span>{t('Traduções em francês pendentes')}</span>
                    <ListValue>
                      {formatMetric(data.pendingTranslations)}
                    </ListValue>
                  </ListLink>
                </List>
              </Section>
              <Section>
                <SectionHeader>
                  <SectionTitle>{t('Ações rápidas')}</SectionTitle>
                </SectionHeader>
                <List>
                  <ListLink to={productCreateLink}>
                    <span>{t('Adicionar produto')}</span>
                    <ListArrow aria-hidden>→</ListArrow>
                  </ListLink>
                  <ListLink to="/store/home-page">
                    <span>{t('Atualizar página inicial')}</span>
                    <ListArrow aria-hidden>→</ListArrow>
                  </ListLink>
                  <ListLink to={storeListLink('orders')}>
                    <span>{t('Gerir encomendas')}</span>
                    <ListArrow aria-hidden>→</ListArrow>
                  </ListLink>
                  <ExternalListLink
                    href={storefrontUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{t('Ver o site')}</span>
                    <ListArrow aria-hidden>◎</ListArrow>
                  </ExternalListLink>
                </List>
              </Section>
            </TwoColumns>
          </Content>
        </StorePage>
      </StoreLayout>
    </Shell>
  );
}
