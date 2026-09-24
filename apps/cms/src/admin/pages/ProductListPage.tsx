import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Main } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { StorePageHeader } from '../components/StorePageHeader';
import {
  contentLink,
  productCreateLink,
  productListLink,
  StoreLayout,
  StorePage,
  StoreSidebar,
} from '../components/StoreSidebar';

interface ProductEntry {
  id?: number;
  documentId?: string;
  name?: string;
  slug?: string;
  description?: string;
  locale?: string;
  status?: string;
  publishedAt?: string | null;
  commerce?: {
    availability?: string;
    stock?: number | null;
  } | null;
}

interface ProductResponse {
  results?: ProductEntry[];
  pagination?: {
    page?: number;
    pageCount?: number;
    pageSize?: number;
    total?: number;
  };
}

const productAsset = (name: string) =>
  `/priscila-admin/products/${name}.svg`;

const copy = {
  pt: {
    title: 'Produtos',
    newProduct: 'Novo produto',
    search: 'Pesquisar',
    searchLabel: 'Pesquisar produtos',
    filters: 'Filtros',
    entries: (count: number) => `${count} ${count === 1 ? 'entrada encontrada' : 'entradas encontradas'}`,
    productName: 'Nome do produto',
    description: 'Descrição breve',
    availability: 'Disponibilidade',
    state: 'Estado',
    available: 'Disponível',
    comingSoon: 'Disponível em breve',
    unavailable: 'Indisponível',
    published: 'Publicado',
    draft: 'Rascunho',
    edit: 'Editar produto',
    publish: 'Publicar no site',
    publishing: 'A publicar…',
    publishSuccess: 'Produto publicado no site.',
    publishError: 'Não foi possível publicar o produto. Tente novamente.',
    publishConfirm: 'Publicar este produto no site agora?',
    unpublish: 'Ocultar do site',
    unpublishing: 'A ocultar…',
    unpublishSuccess:
      'Produto ocultado do site. Os dados continuam guardados como rascunho.',
    unpublishError:
      'Não foi possível ocultar o produto do site. Tente novamente.',
    unpublishConfirm:
      'Ocultar este produto do site? Ele deixará de aparecer para os clientes, mas todos os dados serão mantidos como rascunho.',
    allStates: 'Todos os estados',
    publishedOnly: 'Apenas publicados',
    draftsOnly: 'Apenas rascunhos',
    contentLanguage: 'Idioma do conteúdo',
    portuguese: 'Português',
    french: 'Francês',
    noProducts: 'Nenhum produto corresponde à pesquisa ou aos filtros.',
    previous: 'Anterior',
    next: 'Seguinte',
    page: (page: number, count: number) => `Página ${page} de ${count}`,
    loadError: 'Não foi possível carregar os produtos. Tente novamente.',
    selected: (count: number) => `${count} selecionado${count === 1 ? '' : 's'}`,
    clearSelection: 'Limpar seleção',
    delete: 'Eliminar',
    deleting: 'A eliminar…',
    deleteSuccess: (count: number) =>
      `${count} ${count === 1 ? 'produto eliminado' : 'produtos eliminados'} com sucesso.`,
    deleteError:
      'Não foi possível eliminar. Verifique se o produto está associado a encomendas, avaliações, kits ou coleções.',
    deleteConfirm: (count: number) =>
      `Tem a certeza de que deseja eliminar ${count === 1 ? 'este produto' : `estes ${count} produtos`}? Esta ação não pode ser desfeita.`,
  },
  fr: {
    title: 'Produits',
    newProduct: 'Nouveau produit',
    search: 'Rechercher',
    searchLabel: 'Rechercher des produits',
    filters: 'Filtres',
    entries: (count: number) => `${count} ${count === 1 ? 'entrée trouvée' : 'entrées trouvées'}`,
    productName: 'Nom du produit',
    description: 'Description courte',
    availability: 'Disponibilité',
    state: 'Statut',
    available: 'Disponible',
    comingSoon: 'Bientôt disponible',
    unavailable: 'Indisponible',
    published: 'Publié',
    draft: 'Brouillon',
    edit: 'Modifier le produit',
    publish: 'Publier sur le site',
    publishing: 'Publication…',
    publishSuccess: 'Produit publié sur le site.',
    publishError: 'Impossible de publier le produit. Veuillez réessayer.',
    publishConfirm: 'Publier ce produit sur le site maintenant ?',
    unpublish: 'Dépublier',
    unpublishing: 'Dépublication…',
    unpublishSuccess:
      "Produit dépublié. Il est maintenant en brouillon et n'apparaît plus sur le site.",
    unpublishError:
      'Impossible de dépublier le produit. Veuillez réessayer.',
    unpublishConfirm:
      "Dépublier ce produit ? Il n'apparaîtra plus sur le site, mais toutes les données seront conservées en brouillon.",
    allStates: 'Tous les statuts',
    publishedOnly: 'Produits publiés',
    draftsOnly: 'Brouillons uniquement',
    contentLanguage: 'Langue du contenu',
    portuguese: 'Portugais',
    french: 'Français',
    noProducts: 'Aucun produit ne correspond à la recherche ou aux filtres.',
    previous: 'Précédente',
    next: 'Suivante',
    page: (page: number, count: number) => `Page ${page} sur ${count}`,
    loadError: 'Impossible de charger les produits. Veuillez réessayer.',
    selected: (count: number) => `${count} sélectionné${count === 1 ? '' : 's'}`,
    clearSelection: 'Effacer la sélection',
    delete: 'Supprimer',
    deleting: 'Suppression…',
    deleteSuccess: (count: number) =>
      `${count} ${count === 1 ? 'produit supprimé' : 'produits supprimés'} avec succès.`,
    deleteError:
      "Impossible de supprimer. Vérifiez si le produit est lié à des commandes, avis, kits ou collections.",
    deleteConfirm: (count: number) =>
      `Voulez-vous vraiment supprimer ${count === 1 ? 'ce produit' : `ces ${count} produits`} ? Cette action est irréversible.`,
  },
};

const PageMain = styled(Main)`
  min-height: 100vh;
  color: #1a1917;
  background: #f7f5f2;
  font-family: 'Priscila Inter', Inter, Arial, sans-serif;
`;

const Content = styled.div`
  box-sizing: border-box;
  display: grid;
  align-content: start;
  gap: 32px;
  max-width: 1229px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px;

  @media (max-width: 48rem) { padding: 24px 20px; }
`;

const PrimaryAction = styled(Link)`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
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

  &:hover { background: #5f4d35; }
  img { width: 24px; height: 24px; }
`;

const Tools = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
`;

const SearchForm = styled.form`
  box-sizing: border-box;
  display: flex;
  height: 50px;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: #fff;

  img { width: 24px; height: 24px; }
`;

const SearchInput = styled.input`
  width: 100%;
  border: 0;
  outline: 0;
  color: #1a1917;
  background: transparent;
  font: inherit;
  font-size: 14px;

  &::placeholder { color: #8f887e; opacity: 1; }
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  box-sizing: border-box;
  display: inline-flex;
  height: 50px;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border: 1px solid ${({ $active }) => ($active ? '#b49667' : 'rgba(0, 0, 0, 0.1)')};
  border-radius: 12px;
  color: #7d6645;
  background: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  img { width: 24px; height: 24px; }
`;

const FilterPanel = styled.div`
  position: absolute;
  z-index: 5;
  top: 58px;
  right: 0;
  display: grid;
  gap: 18px;
  width: 280px;
  padding: 20px;
  border: 1px solid #ece8e1;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 14px 35px rgba(47, 48, 58, 0.12);
`;

const FilterGroup = styled.fieldset`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;

  legend {
    margin-bottom: 8px;
    color: #1a1917;
    font-size: 14px;
    font-weight: 600;
  }

  label {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #6d675f;
    font-size: 14px;
    cursor: pointer;
  }

  input { accent-color: #7d6645; }
`;

const Results = styled.section`
  display: grid;
  gap: 24px;
`;

const ResultSummary = styled.p`
  margin: 0;
  color: #6d675f;
  font-size: 16px;
  line-height: 24px;
`;
const SelectionBar = styled.div`
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 16px;
  border: 1px solid #d7c9b4;
  border-radius: 10px;
  color: #5f4d35;
  background: #f3eee6;
  font-size: 14px;
  font-weight: 600;
  div {
    display: flex;
    gap: 10px;
  }
  button {
    padding: 8px 12px;
    border: 0;
    border-radius: 8px;
    color: #6f593d;
    background: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  button.danger {
    color: #9f1239;
  }
  button:disabled {
    cursor: wait;
    opacity: 0.55;
  }
`;
const ActionNotice = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: 12px 14px;
  border: 1px solid ${({ $error }) => ($error ? '#fecaca' : '#bbf7d0')};
  border-radius: 9px;
  color: ${({ $error }) => ($error ? '#991b1b' : '#166534')};
  background: ${({ $error }) => ($error ? '#fef2f2' : '#f0fdf4')};
  font-size: 14px;
`;

const TableScroll = styled.div`
  overflow-x: auto;
  border: 1px solid #ece8e1;
  border-radius: 10px;
  background: #fff;
`;

const Table = styled.div`
  min-width: 920px;
`;

const Row = styled.div<{ $selected?: boolean }>`
  display: grid;
  grid-template-columns: 50px 70px minmax(170px, 1fr) minmax(190px, 1.1fr) minmax(160px, 0.95fr) 140px 58px;
  min-height: 56px;
  align-items: center;
  border-bottom: 1px solid #ece8e1;
  color: #6d675f;
  background: ${({ $selected }) => ($selected ? '#f7f2ea' : '#fff')};
  font-size: 16px;

  &:last-child { border-bottom: 0; }
  > * { min-width: 0; padding: 11px 15px; }
`;

const HeaderRow = styled(Row)`
  color: #1a1917;
  font-weight: 600;
`;

const CellText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductLink = styled(Link)`
  overflow: hidden;
  color: #6d675f;
  text-overflow: ellipsis;
  text-decoration: none;
  white-space: nowrap;

  &:hover { color: #7d6645; text-decoration: underline; text-underline-offset: 3px; }
`;

const CheckCell = styled.label`
  display: grid;
  place-items: center;

  input {
    width: 16px;
    height: 16px;
    accent-color: #7d6645;
    cursor: pointer;
  }
`;

const Status = styled.span<{ $draft?: boolean }>`
  justify-self: start;
  padding: 4px 16px !important;
  border: 1px solid ${({ $draft }) => ($draft ? '#d6d3d1' : '#7bf1a8')};
  border-radius: 32px;
  color: #1a1917;
  background: ${({ $draft }) => ($draft ? '#f5f5f4' : '#dcfce7')};
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
`;

const RowMenu = styled.details.attrs({
  'data-row-action-menu': '',
})`
  position: relative;
  justify-self: center;
  padding: 0 !important;
  summary {
    display: grid;
    width: 32px;
    height: 32px;
    padding: 4px;
    place-items: center;
    border-radius: 5px;
    background: #f7f5f1;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker { display: none; }
  summary:hover,
  &[open] summary { background: #ece8e1; }
  img { width: 24px; height: 24px; }
`;
const RowMenuPanel = styled.div`
  position: absolute;
  z-index: 8;
  top: 38px;
  right: 0;
  display: grid;
  width: 190px;
  padding: 7px;
  border: 1px solid #e5ded4;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(47, 48, 58, 0.14);
  a,
  button {
    min-height: 40px;
    padding: 8px 11px;
    border: 0;
    border-radius: 7px;
    color: #4f4a43;
    background: transparent;
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  button.danger { color: #9f1239; }
  a:hover,
  button:hover { background: #f3eee6; }
  button:disabled { cursor: wait; opacity: 0.55; }
`;

const EmptyState = styled.div`
  padding: 40px 24px;
  color: #6d675f;
  font-size: 16px;
  text-align: center;
`;

const ErrorState = styled(EmptyState)`
  color: #991b1b;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  color: #6d675f;
  font-size: 14px;
`;

const PageButton = styled.button`
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid #ece8e1;
  border-radius: 8px;
  color: #7d6645;
  background: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:disabled { cursor: not-allowed; opacity: 0.45; }
`;

function availabilityLabel(value: string | undefined, labels: typeof copy.pt) {
  if (value === 'coming-soon') return labels.comingSoon;
  if (value === 'out-of-stock') return labels.unavailable;
  return labels.available;
}

function isDraftEntry(entry: ProductEntry) {
  const status = entry.status?.toLowerCase();
  if (status === 'published') return false;
  if (status === 'draft') return true;
  return entry.publishedAt === null;
}

export default function ProductListPage() {
  const { get, post, del } = useFetchClient();
  const { locale: interfaceLocale } = useIntl();
  const labels = interfaceLocale.toLowerCase().startsWith('fr') ? copy.fr : copy.pt;
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageCount: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [publicationState, setPublicationState] = useState<'all' | 'published' | 'draft'>('all');
  const [contentLocale, setContentLocale] = useState<'pt' | 'fr'>('pt');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unpublishing, setUnpublishing] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionMessage, setActionMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    const params: Record<string, string | number> = {
      page,
      pageSize: 10,
      sort: 'id:ASC',
      locale: contentLocale,
      'populate[commerce]': 'true',
    };
    if (submittedQuery) params._q = submittedQuery;
    if (publicationState !== 'all') params.status = publicationState;

    void get<ProductResponse>(contentLink('api::product.product'), { params })
      .then((response) => {
        if (!active) return;
        const nextProducts = response.data.results ?? [];
        const nextPagination = response.data.pagination;
        setProducts(nextProducts);
        setPagination({
          page: nextPagination?.page ?? page,
          pageCount: Math.max(1, nextPagination?.pageCount ?? 1),
          total: nextPagination?.total ?? nextProducts.length,
        });
        setSelected([]);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [contentLocale, get, page, publicationState, refreshKey, submittedQuery]);

  const identifiers = useMemo(
    () => products.map((product) => String(product.documentId ?? product.id)),
    [products],
  );
  const allSelected = identifiers.length > 0 && identifiers.every((identifier) => selected.includes(identifier));
  const filtersActive = publicationState !== 'all' || contentLocale !== 'pt';

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSubmittedQuery(query.trim());
  };

  const toggleAll = () => setSelected(allSelected ? [] : identifiers);
  const toggleOne = (identifier: string) => setSelected((current) => (
    current.includes(identifier)
      ? current.filter((value) => value !== identifier)
      : [...current, identifier]
  ));
  const removeProducts = async (productIds: string[]) => {
    if (!productIds.length || deleting) return;
    if (!window.confirm(labels.deleteConfirm(productIds.length))) return;
    setDeleting(true);
    setActionMessage(null);
    try {
      for (const identifier of productIds) {
        await del(`${contentLink('api::product.product')}/${identifier}`, {
          params: { locale: contentLocale },
        });
      }
      setSelected([]);
      setActionMessage({ text: labels.deleteSuccess(productIds.length), error: false });
      if (productIds.length >= products.length && page > 1)
        setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
    } catch {
      setActionMessage({ text: labels.deleteError, error: true });
    } finally {
      setDeleting(false);
    }
  };
  const unpublishProduct = async (identifier: string) => {
    if (unpublishing || !window.confirm(labels.unpublishConfirm)) return;
    setUnpublishing(identifier);
    setActionMessage(null);
    try {
      await post(
        `${contentLink('api::product.product')}/${identifier}/actions/unpublish`,
        { locale: contentLocale, discardDraft: false },
      );
      setActionMessage({ text: labels.unpublishSuccess, error: false });
      setRefreshKey((current) => current + 1);
    } catch {
      setActionMessage({ text: labels.unpublishError, error: true });
    } finally {
      setUnpublishing(null);
    }
  };
  const publishProduct = async (identifier: string) => {
    if (publishing || !window.confirm(labels.publishConfirm)) return;
    setPublishing(identifier);
    setActionMessage(null);
    try {
      await post(
        `${contentLink('api::product.product')}/${identifier}/actions/publish`,
        { locale: contentLocale },
      );
      setActionMessage({ text: labels.publishSuccess, error: false });
      setRefreshKey((current) => current + 1);
    } catch {
      setActionMessage({ text: labels.publishError, error: true });
    } finally {
      setPublishing(null);
    }
  };

  return (
    <PageMain labelledBy="products-page-title">
      <StoreLayout>
        <StoreSidebar activeHref={productListLink} />
        <StorePage>
          <StorePageHeader
            id="products-page-title"
            title={labels.title}
            language={interfaceLocale.toLowerCase().startsWith('fr') ? 'fr' : 'pt'}
            primaryAction={(
              <PrimaryAction to={productCreateLink}>
                <img src={productAsset('add')} alt="" aria-hidden />
                {labels.newProduct}
              </PrimaryAction>
            )}
          />
          <Content>
            <Tools>
              <SearchForm onSubmit={submitSearch}>
                <img src={productAsset('search')} alt="" aria-hidden />
                <SearchInput
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={labels.search}
                  aria-label={labels.searchLabel}
                />
              </SearchForm>
              <FilterButton
                type="button"
                $active={filtersActive}
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <img src={productAsset('filter')} alt="" aria-hidden />
                {labels.filters}
              </FilterButton>
              {filtersOpen && (
                <FilterPanel>
                  <FilterGroup>
                    <legend>{labels.state}</legend>
                    <label><input type="radio" name="publication" checked={publicationState === 'all'} onChange={() => { setPublicationState('all'); setPage(1); }} />{labels.allStates}</label>
                    <label><input type="radio" name="publication" checked={publicationState === 'published'} onChange={() => { setPublicationState('published'); setPage(1); }} />{labels.publishedOnly}</label>
                    <label><input type="radio" name="publication" checked={publicationState === 'draft'} onChange={() => { setPublicationState('draft'); setPage(1); }} />{labels.draftsOnly}</label>
                  </FilterGroup>
                  <FilterGroup>
                    <legend>{labels.contentLanguage}</legend>
                    <label><input type="radio" name="locale" checked={contentLocale === 'pt'} onChange={() => { setContentLocale('pt'); setPage(1); }} />{labels.portuguese}</label>
                    <label><input type="radio" name="locale" checked={contentLocale === 'fr'} onChange={() => { setContentLocale('fr'); setPage(1); }} />{labels.french}</label>
                  </FilterGroup>
                </FilterPanel>
              )}
            </Tools>

            <Results>
              {actionMessage && (
                <ActionNotice $error={actionMessage.error} role="status">
                  {actionMessage.text}
                </ActionNotice>
              )}
              {selected.length ? (
                <SelectionBar>
                  <strong>{labels.selected(selected.length)}</strong>
                  <div>
                    <button
                      className="danger"
                      type="button"
                      disabled={deleting}
                      onClick={() => void removeProducts(selected)}
                    >
                      {deleting ? labels.deleting : labels.delete}
                    </button>
                    <button type="button" onClick={() => setSelected([])}>
                      {labels.clearSelection}
                    </button>
                  </div>
                </SelectionBar>
              ) : (
                <ResultSummary>{labels.entries(pagination.total)}</ResultSummary>
              )}

              <TableScroll>
                <Table role="table" aria-label={labels.title}>
                  <HeaderRow role="row">
                    <CheckCell>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={labels.selected(identifiers.length)} />
                    </CheckCell>
                    <span>ID</span>
                    <span>{labels.productName}</span>
                    <span>{labels.description}</span>
                    <span>{labels.availability}</span>
                    <span>{labels.state}</span>
                    <span />
                  </HeaderRow>

                  {loading ? (
                    <EmptyState>…</EmptyState>
                  ) : error ? (
                    <ErrorState>{labels.loadError}</ErrorState>
                  ) : products.length ? products.map((product) => {
                    const identifier = String(product.documentId ?? product.id);
                    const editLink = `/store/products/${identifier}/edit?locale=${contentLocale}`;
                    const isDraft = isDraftEntry(product);
                    return (
                      <Row key={identifier} role="row" $selected={selected.includes(identifier)}>
                        <CheckCell>
                          <input
                            type="checkbox"
                            checked={selected.includes(identifier)}
                            onChange={() => toggleOne(identifier)}
                            aria-label={product.name || product.slug || identifier}
                          />
                        </CheckCell>
                        <CellText>{product.id ?? '—'}</CellText>
                        <ProductLink to={editLink}>{product.name || product.slug || '—'}</ProductLink>
                        <CellText title={product.description}>{product.description || '—'}</CellText>
                        <CellText>{availabilityLabel(product.commerce?.availability, labels)}</CellText>
                        <Status $draft={isDraft}>{isDraft ? labels.draft : labels.published}</Status>
                        <RowMenu>
                          <summary aria-label={labels.edit}>
                            <img src={productAsset('menu')} alt="" aria-hidden />
                          </summary>
                          <RowMenuPanel>
                            <Link to={editLink}>{labels.edit}</Link>
                            {isDraft && (
                              <button
                                type="button"
                                disabled={Boolean(publishing)}
                                onClick={() => void publishProduct(identifier)}
                              >
                                {publishing === identifier
                                  ? labels.publishing
                                  : labels.publish}
                              </button>
                            )}
                            {!isDraft && (
                              <button
                                type="button"
                                disabled={Boolean(unpublishing)}
                                onClick={() => void unpublishProduct(identifier)}
                              >
                                {unpublishing === identifier
                                  ? labels.unpublishing
                                  : labels.unpublish}
                              </button>
                            )}
                            <button
                              className="danger"
                              type="button"
                              disabled={deleting}
                              onClick={() => void removeProducts([identifier])}
                            >
                              {deleting ? labels.deleting : labels.delete}
                            </button>
                          </RowMenuPanel>
                        </RowMenu>
                      </Row>
                    );
                  }) : (
                    <EmptyState>{labels.noProducts}</EmptyState>
                  )}
                </Table>
              </TableScroll>

              {pagination.pageCount > 1 && (
                <Pagination>
                  <PageButton type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{labels.previous}</PageButton>
                  <span>{labels.page(pagination.page, pagination.pageCount)}</span>
                  <PageButton type="button" disabled={page >= pagination.pageCount} onClick={() => setPage((value) => value + 1)}>{labels.next}</PageButton>
                </Pagination>
              )}
            </Results>
          </Content>
        </StorePage>
      </StoreLayout>
    </PageMain>
  );
}
