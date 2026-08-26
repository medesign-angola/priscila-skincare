import { useEffect, useState } from 'react';
import { Box, Flex, Typography } from '@strapi/design-system';
import { Widget, useFetchClient } from '@strapi/strapi/admin';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

interface CollectionResponse {
  pagination?: { total?: number };
  results?: unknown[];
}

interface Metric {
  label: string;
  value: number | null;
  href: string;
}

const MetricLink = styled(Link)`
  display: flex;
  min-height: 6.5rem;
  flex: 1 1 9rem;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 0.25rem;
  color: ${({ theme }) => theme.colors.neutral800};
  background: ${({ theme }) => theme.colors.neutral0};
  text-decoration: none;
  transition: border-color 180ms ease, transform 180ms ease, background 180ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary500};
    background: ${({ theme }) => theme.colors.primary100};
    transform: translateY(-0.125rem);
  }

  &:focus-visible {
    outline: 0.125rem solid ${({ theme }) => theme.colors.primary500};
    outline-offset: 0.125rem;
  }
`;

async function totalFor(
  get: ReturnType<typeof useFetchClient>['get'],
  uid: string,
  filters?: Record<string, string>,
): Promise<number | null> {
  try {
    const response = await get<CollectionResponse>(
      `/content-manager/collection-types/${uid}`,
      { params: { page: 1, pageSize: 1, ...filters } },
    );
    return response.data.pagination?.total ?? response.data.results?.length ?? 0;
  } catch {
    return null;
  }
}

export default function StoreOverviewWidget() {
  const { get } = useFetchClient();
  const [metrics, setMetrics] = useState<Metric[] | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      totalFor(get, 'api::product.product'),
      totalFor(get, 'api::kit.kit'),
      totalFor(get, 'api::collection.collection'),
      totalFor(get, 'api::order.order'),
      totalFor(get, 'api::review.review', { 'filters[status][$eq]': 'pending' }),
    ]).then(([products, kits, collections, orders, reviews]) => {
      if (!active) return;
      setMetrics([
        { label: 'Produtos', value: products, href: '/content-manager/collection-types/api::product.product' },
        { label: 'Kits', value: kits, href: '/content-manager/collection-types/api::kit.kit' },
        { label: 'Coleções', value: collections, href: '/content-manager/collection-types/api::collection.collection' },
        { label: 'Encomendas', value: orders, href: '/content-manager/collection-types/api::order.order' },
        { label: 'Avaliações pendentes', value: reviews, href: '/content-manager/collection-types/api::review.review?filters%5Bstatus%5D%5B%24eq%5D=pending' },
      ]);
    });
    return () => { active = false; };
  }, [get]);

  if (!metrics) return <Widget.Loading>A carregar os dados da loja…</Widget.Loading>;
  if (metrics.every((metric) => metric.value === null)) {
    return <Widget.Error>Não foi possível consultar os dados da loja.</Widget.Error>;
  }

  return (
    <Box padding={1}>
      <Flex alignItems="stretch" wrap="wrap" gap={3}>
        {metrics.map((metric) => (
          <MetricLink key={metric.label} to={metric.href}>
            <Typography variant="pi" textColor="neutral600">{metric.label}</Typography>
            <Typography tag="strong" variant="alpha">
              {metric.value === null ? '—' : new Intl.NumberFormat('pt-AO').format(metric.value)}
            </Typography>
          </MetricLink>
        ))}
      </Flex>
    </Box>
  );
}
