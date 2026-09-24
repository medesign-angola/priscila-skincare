import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

type SidebarItem = {
  label: string;
  frenchLabel: string;
  href: string;
  icon: string;
  section?: string;
};

export const contentLink = (uid: string) =>
  `/content-manager/collection-types/${uid}`;
export const singleTypeLink = (uid: string) =>
  `/content-manager/single-types/${uid}`;
export const productListLink = '/store/products';
export const productCreateLink = '/store/products/new';
export const storeListLink = (resource: string) => `/store/${resource}`;
export const siteSettingsLink = '/store/site-settings';
export const homePageLink = '/store/home-page';
export const aboutPageLink = '/store/about-page';
export const iconPath = (name: string) =>
  `/priscila-admin/dashboard/${name}.svg`;

let mountedStoreLayouts = 0;
let pendingBodyCleanup: number | undefined;

const navigation: SidebarItem[] = [
  {
    label: 'Dashboard',
    frenchLabel: 'Tableau de bord',
    href: '/',
    icon: 'dashboard',
  },
  {
    label: 'Encomendas',
    frenchLabel: 'Commandes',
    href: storeListLink('orders'),
    icon: 'orders',
  },
  {
    label: 'Produtos',
    frenchLabel: 'Produits',
    href: productListLink,
    icon: 'products',
  },
  {
    label: 'Avaliações',
    frenchLabel: 'Avis',
    href: storeListLink('reviews'),
    icon: 'reviews',
  },
  {
    label: 'Clientes',
    frenchLabel: 'Clients',
    href: storeListLink('customers'),
    icon: 'customers',
  },
  {
    label: 'Kit de produtos',
    frenchLabel: 'Kits de produits',
    href: storeListLink('kits'),
    icon: 'kits',
  },
  {
    label: 'Categorias',
    frenchLabel: 'Catégories',
    href: storeListLink('categories'),
    icon: 'categories',
  },
  {
    label: 'Coleções',
    frenchLabel: 'Collections',
    href: storeListLink('collections'),
    icon: 'collections',
  },
  {
    label: 'Ingredientes',
    frenchLabel: 'Ingrédients',
    href: storeListLink('ingredients'),
    icon: 'ingredients',
  },
  {
    label: 'Tamanhos',
    frenchLabel: 'Formats',
    href: storeListLink('sizes'),
    icon: 'sizes',
  },
  {
    label: 'Banner página inicial',
    frenchLabel: "Bannière de la page d'accueil",
    href: storeListLink('banners'),
    icon: 'banners',
  },
  {
    label: 'Testemunho em vídeo',
    frenchLabel: 'Témoignage vidéo',
    href: storeListLink('testimonials'),
    icon: 'testimonials',
  },
  {
    label: 'Usuários',
    frenchLabel: 'Utilisateurs',
    href: storeListLink('users'),
    icon: 'users',
  },
  {
    label: 'Configurações do site',
    frenchLabel: 'Paramètres du site',
    href: siteSettingsLink,
    icon: 'settings',
    section: 'site',
  },
  {
    label: 'Página inicial',
    frenchLabel: "Page d'accueil",
    href: homePageLink,
    icon: 'home',
    section: 'site',
  },
  {
    label: 'Página sobre',
    frenchLabel: 'Page à propos',
    href: aboutPageLink,
    icon: 'about',
    section: 'site',
  },
];

export const StoreLayout = styled.div.attrs({
  'data-priscila-store-layout': '',
})`
  position: fixed;
  inset: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: 275px minmax(0, 1fr);
  width: 100%;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 74rem) {
    grid-template-columns: 232px minmax(0, 1fr);
  }

  @media (max-width: 56rem) {
    display: block;
  }
`;

export const StorePage = styled.div`
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  box-sizing: border-box;
  height: 100dvh;
  padding: 30px 16px;
  overflow-y: auto;
  border-right: 1px solid #ece8e1;
  background: #fafafa;
  scrollbar-width: thin;

  @media (max-width: 56rem) {
    position: static;
    display: none;
  }
`;

const SidebarLogo = styled.img`
  display: block;
  width: 74px;
  height: 56px;
  margin: 0 0 45px;
  object-fit: contain;
`;

const Navigation = styled.nav`
  display: grid;
  gap: 10px;

  & + & {
    margin-top: 45px;
  }
`;

const NavigationLink = styled(Link)<{ $active?: boolean }>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 48px;
  padding: 12px 16px;
  border-radius: 10px;
  color: ${({ $active }) => ($active ? '#7d6645' : '#8f887e')};
  background: ${({ $active }) => ($active ? 'rgba(125, 102, 69, 0.08)' : 'transparent')};
  font-size: 16px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  line-height: 1.5;
  text-decoration: none;
  transition:
    color 160ms ease,
    background-color 160ms ease;

  &:hover {
    color: #7d6645;
    background: rgba(125, 102, 69, 0.08);
  }
`;

const NavigationIcon = styled.img`
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
`;
const NavigationLabel = styled.span`
  min-width: 0;
`;
const NavigationBadge = styled.span`
  display: inline-grid;
  min-width: 25px;
  height: 25px;
  margin-left: auto;
  padding: 0 7px;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  background: #8b7048;
  font-size: 12px;
  font-weight: 750;
  line-height: 1;
`;

type CountResponse = {
  results?: unknown[];
  pagination?: { total?: number };
};

async function pendingCount(
  get: ReturnType<typeof useFetchClient>['get'],
  uid: string,
  filter: string,
) {
  const response = await get<CountResponse>(contentLink(uid), {
    params: { page: 1, pageSize: 1, [filter]: 'pending' },
  });
  return response.data.pagination?.total ?? response.data.results?.length ?? 0;
}

export function StoreSidebar({ activeHref }: { activeHref: string }) {
  const { get } = useFetchClient();
  const { locale } = useIntl();
  const isFrench = locale.toLowerCase().startsWith('fr');
  const mainNavigation = navigation.filter((item) => item.section !== 'site');
  const siteNavigation = navigation.filter((item) => item.section === 'site');
  const [pending, setPending] = useState<Record<string, number>>({});

  const loadPending = useCallback(async () => {
    const [orders, reviews] = await Promise.allSettled([
      pendingCount(
        get,
        'api::order.order',
        'filters[orderStatus][$eq]',
      ),
      pendingCount(
        get,
        'api::review.review',
        'filters[moderationStatus][$eq]',
      ),
    ]);
    setPending((current) => ({
      ...current,
      ...(orders.status === 'fulfilled' ? { orders: orders.value } : {}),
      ...(reviews.status === 'fulfilled' ? { reviews: reviews.value } : {}),
    }));
  }, [get]);

  useLayoutEffect(() => {
    mountedStoreLayouts += 1;
    if (pendingBodyCleanup !== undefined) {
      window.cancelAnimationFrame(pendingBodyCleanup);
      pendingBodyCleanup = undefined;
    }
    document.body.classList.add('priscila-dashboard-open');
    return () => {
      mountedStoreLayouts = Math.max(0, mountedStoreLayouts - 1);
      pendingBodyCleanup = window.requestAnimationFrame(() => {
        if (mountedStoreLayouts === 0) {
          document.body.classList.remove('priscila-dashboard-open');
        }
        pendingBodyCleanup = undefined;
      });
    };
  }, []);

  useEffect(() => {
    void loadPending();
    const refresh = () => void loadPending();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    window.addEventListener('priscila:workflow-updated', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('priscila:workflow-updated', refresh);
    };
  }, [loadPending]);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      document
        .querySelectorAll<HTMLDetailsElement>(
          'details[data-store-select][open], details[data-row-action-menu][open]',
        )
        .forEach((details) => {
          if (!target || !details.contains(target)) details.open = false;
        });
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      document
        .querySelectorAll<HTMLDetailsElement>(
          'details[data-store-select][open], details[data-row-action-menu][open]',
        )
        .forEach((details) => (details.open = false));
    };
    const closeAfterAction = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const action = target?.closest(
        'details[data-row-action-menu] a, details[data-row-action-menu] button',
      );
      const menu = action?.closest<HTMLDetailsElement>(
        'details[data-row-action-menu]',
      );
      if (menu) menu.open = false;
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('click', closeAfterAction);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('click', closeAfterAction);
    };
  }, []);

  const renderItems = (items: SidebarItem[]) =>
    items.map((item) => {
      const count = pending[item.icon] ?? 0;
      const label = isFrench ? item.frenchLabel : item.label;
      const pendingLabel = isFrench
        ? `${count} élément${count === 1 ? '' : 's'} en attente`
        : `${count} ${count === 1 ? 'elemento pendente' : 'elementos pendentes'}`;
      return (
        <NavigationLink
          key={item.label}
          to={item.href}
          $active={item.href === activeHref}
          aria-label={count > 0 ? `${label}: ${pendingLabel}` : label}
        >
          <NavigationIcon src={iconPath(item.icon)} alt="" aria-hidden />
          <NavigationLabel>{label}</NavigationLabel>
          {count > 0 && (
            <NavigationBadge title={pendingLabel} aria-hidden="true">
              {count > 99 ? '99+' : count}
            </NavigationBadge>
          )}
        </NavigationLink>
      );
    });

  return (
    <Sidebar>
      <SidebarLogo src={iconPath('logo')} alt="Priscila Skincare" />
      <Navigation aria-label="Navegação da loja">
        {renderItems(mainNavigation)}
      </Navigation>
      <Navigation aria-label="Páginas do site">
        {renderItems(siteNavigation)}
      </Navigation>
    </Sidebar>
  );
}
