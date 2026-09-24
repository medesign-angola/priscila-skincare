import { useEffect, useMemo, useState } from 'react';
import { Main } from '@strapi/design-system';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import styled from 'styled-components';
import {
  contentLink,
  iconPath,
  StoreLayout,
  StorePage,
  StoreSidebar,
  storeListLink,
} from '../components/StoreSidebar';
import { StoreSelectShell } from '../components/StoreSelect';
import { OptionalRelationField } from '../components/OptionalRelationField';

type Language = 'pt' | 'fr';
type FormKind = 'category' | 'size';
type Step = 1 | 2;

type RelationEntry = {
  id?: number;
  documentId?: string;
  name?: string;
  title?: string;
  label?: string;
  locale?: string;
};

type EntryRecord = Record<string, unknown> & {
  documentId?: string;
  products?: RelationEntry[];
};

type EntryResponse = { data?: EntryRecord };
type RelationResponse = { results?: RelationEntry[] };

type FormValues = {
  name: string;
  slug: string;
  description: string;
  label: string;
  value: string;
  order: string;
  products: string[];
  linkProducts: boolean;
};

const initialForm: FormValues = {
  name: '',
  slug: '',
  description: '',
  label: '',
  value: '',
  order: '0',
  products: [],
  linkProducts: false,
};

const copy = {
  pt: {
    category: {
      createTitle: 'Nova categoria',
      editTitle: 'Editar categoria',
      back: 'Categorias',
      dataTitle: 'Dados da categoria',
      create: 'Criar categoria',
      save: 'Guardar alterações',
      saved: 'Categoria guardada com sucesso.',
      summaryTitle: 'Confirme os dados da categoria',
      summaryHelp: 'Reveja as informações antes de guardar a categoria.',
    },
    size: {
      createTitle: 'Novo tamanho',
      editTitle: 'Editar tamanho',
      back: 'Tamanhos',
      dataTitle: 'Dados do tamanho',
      create: 'Criar tamanho',
      save: 'Guardar alterações',
      saved: 'Tamanho guardado com sucesso.',
      summaryTitle: 'Confirme os dados do tamanho',
      summaryHelp: 'Reveja as informações antes de guardar o tamanho.',
    },
    data: 'Dados',
    summary: 'Resumo',
    previous: 'Voltar',
    next: 'Avançar',
    loading: 'A carregar os dados…',
    required: 'Preencha todos os campos obrigatórios antes de avançar.',
    loadError:
      'Não foi possível carregar os dados. Volte à lista e tente novamente.',
    relationError:
      'Não foi possível carregar os produtos. Atualize a página e tente novamente.',
    saveError:
      'Não foi possível guardar os dados. Reveja as informações e tente novamente.',
    saving: 'A guardar…',
    noProducts: 'Nenhum produto selecionado',
    selectProducts: 'Selecione os produtos',
    noOptions: 'Nenhum produto cadastrado',
    notInformed: 'Não informado',
  },
  fr: {
    category: {
      createTitle: 'Nouvelle catégorie',
      editTitle: 'Modifier la catégorie',
      back: 'Catégories',
      dataTitle: 'Données de la catégorie',
      create: 'Créer la catégorie',
      save: 'Enregistrer les modifications',
      saved: 'Catégorie enregistrée.',
      summaryTitle: 'Confirmez les données de la catégorie',
      summaryHelp:
        "Vérifiez les informations avant d'enregistrer la catégorie.",
    },
    size: {
      createTitle: 'Nouveau format',
      editTitle: 'Modifier le format',
      back: 'Formats',
      dataTitle: 'Données du format',
      create: 'Créer le format',
      save: 'Enregistrer les modifications',
      saved: 'Format enregistré.',
      summaryTitle: 'Confirmez les données du format',
      summaryHelp: "Vérifiez les informations avant d'enregistrer le format.",
    },
    data: 'Données',
    summary: 'Résumé',
    previous: 'Retour',
    next: 'Continuer',
    loading: 'Chargement des données…',
    required: 'Renseignez tous les champs obligatoires avant de continuer.',
    loadError:
      'Impossible de charger les données. Revenez à la liste et réessayez.',
    relationError:
      'Impossible de charger les produits. Actualisez la page et réessayez.',
    saveError:
      "Impossible d'enregistrer les données. Vérifiez les informations et réessayez.",
    saving: 'Enregistrement…',
    noProducts: 'Aucun produit sélectionné',
    selectProducts: 'Sélectionnez les produits',
    noOptions: 'Aucun produit enregistré',
    notInformed: 'Non renseigné',
  },
};

const Shell = styled(Main)`
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #2f303a;
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
const BackLink = styled(Link)`
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
const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;
`;
const LanguageLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1a1917;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  text-transform: uppercase;
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
  width: min(100%, 1220px);
  margin: 0 auto;
  padding: 34px 32px 48px;
  @media (max-width: 48rem) {
    padding: 24px 18px 36px;
  }
`;
const Title = styled.h1`
  margin: 0 0 28px;
  color: #2f303a;
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.5px;
`;
const Stepper = styled.ol`
  display: flex;
  width: min(100%, 400px);
  align-items: center;
  margin: 0 auto 32px;
  padding: 0;
  list-style: none;
`;
const StepItem = styled.li`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  &:not(:last-child)::after {
    height: 1px;
    min-width: 28px;
    flex: 1;
    margin: 0 8px;
    background: #ddd5c9;
    content: '';
  }
`;
const StepButton = styled.button<{ $active: boolean; $done: boolean }>`
  display: inline-flex;
  min-width: max-content;
  min-height: 48px;
  align-items: center;
  gap: 11px;
  padding: 11px 16px;
  border: 1px solid ${({ $done }) => ($done ? '#7d6645' : 'transparent')};
  border-radius: 10px;
  color: ${({ $active, $done }) => ($active ? '#fff' : $done ? '#7d6645' : '#806b4b')};
  background: ${({ $active }) => ($active ? '#8b7048' : '#eeeae4')};
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    transform 180ms ease;
  &:active {
    transform: scale(0.98);
  }
  &:focus-visible {
    outline: 3px solid rgba(180, 150, 103, 0.3);
    outline-offset: 2px;
  }
`;
const Card = styled.section`
  box-sizing: border-box;
  min-height: 600px;
  padding: 64px 32px 72px;
  border-radius: 10px;
  background: #fff;
  @media (max-width: 48rem) {
    padding: 36px 18px 48px;
  }
`;
const FormColumn = styled.div`
  display: grid;
  gap: 30px;
  width: min(100%, 560px);
  margin: 0 auto;
`;
const Section = styled.section`
  display: grid;
  gap: 24px;
`;
const SectionTitle = styled.div`
  display: grid;
  gap: 6px;
  h2 {
    margin: 0;
    color: #2f303a;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.35;
  }
  p {
    margin: 0;
    color: #6d675f;
    font-size: 14px;
    line-height: 1.5;
  }
`;
const Field = styled.label`
  display: block;
  color: #2f303a;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  > input,
  > textarea,
  > details {
    margin-top: 8px;
  }
  small {
    display: block;
    margin-top: 8px;
    color: #8f887e;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
  }
  .required {
    display: inline;
    margin-left: 2px;
    color: #e15454;
  }
`;
const inputCss = `box-sizing:border-box;width:100%;min-height:48px;padding:11px 12px;border:1px solid rgba(0,0,0,.12);border-radius:10px;color:#1a1917;background:#f7f7f7;font:inherit;font-size:14px;outline:0;transition:border-color 160ms ease,box-shadow 160ms ease;&:focus{border-color:#8b7048;box-shadow:0 0 0 3px rgba(139,112,72,.12);}&:disabled{cursor:not-allowed;color:#746f67;background:#ece9e4;}&::placeholder{color:#97928a;}`;
const Input = styled.input`
  ${inputCss}
`;
const Textarea = styled.textarea`
  ${inputCss}min-height:144px;
  resize: vertical;
  line-height: 1.55;
`;
const Footer = styled.footer`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 30px;
  padding: 24px;
  background: #fff;
  @media (max-width: 38rem) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;
const FooterSingle = styled(Footer)`
  grid-template-columns: minmax(0, 560px);
  justify-content: center;
`;
const NavButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 22px;
  border: 0;
  border-radius: 10px;
  color: ${({ $primary }) => ($primary ? '#fff' : '#7d6645')};
  background: ${({ $primary }) => ($primary ? '#8b7048' : '#eeeae4')};
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    transform 180ms ease;
  &:hover {
    background: ${({ $primary }) => ($primary ? '#6f593d' : '#e5ded4')};
  }
  &:active {
    transform: scale(0.99);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;
const Notice = styled.div<{ $error?: boolean }>`
  margin-bottom: 20px;
  padding: 13px 16px;
  border: 1px solid ${({ $error }) => ($error ? '#fecaca' : '#bbf7d0')};
  border-radius: 9px;
  color: ${({ $error }) => ($error ? '#991b1b' : '#166534')};
  background: ${({ $error }) => ($error ? '#fef2f2' : '#f0fdf4')};
  font-size: 14px;
`;
const Summary = styled.dl`
  display: grid;
  gap: 0;
  margin: 0;
  div {
    display: grid;
    grid-template-columns: minmax(170px, 0.9fr) minmax(0, 1.2fr);
    gap: 32px;
    padding: 17px 0;
    border-bottom: 1px solid #ece8e1;
    &:last-child {
      border-bottom: 0;
    }
  }
  dt {
    color: #777168;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  dd {
    margin: 0;
    color: #1a1917;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  @media (max-width: 38rem) {
    div {
      grid-template-columns: 1fr;
      gap: 7px;
    }
  }
`;

function Required() {
  return <span className="required">*</span>;
}
function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
function codeify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '');
}
function relationValue(entry: RelationEntry) {
  return String(entry.documentId ?? entry.id ?? '');
}
function displayName(entry: RelationEntry) {
  return (
    entry.name ||
    entry.title ||
    entry.label ||
    `Produto ${entry.documentId ?? entry.id ?? ''}`
  );
}
function relationEntries(value: unknown): RelationEntry[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is RelationEntry =>
        Boolean(entry && typeof entry === 'object'),
      )
    : [];
}
function mergeEntries(current: RelationEntry[], incoming: RelationEntry[]) {
  const merged = [...current];
  for (const entry of incoming) {
    if (!merged.some((item) => relationValue(item) === relationValue(entry)))
      merged.push(entry);
  }
  return merged;
}
function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';
}

function ProductMultiSelect({
  values,
  options,
  onChange,
  placeholder,
  empty,
  loadError,
}: {
  values: string[];
  options: RelationEntry[];
  onChange: (values: string[]) => void;
  placeholder: string;
  empty: string;
  loadError?: string;
}) {
  const selected = options
    .filter((entry) => values.includes(relationValue(entry)))
    .map(displayName);
  return (
    <StoreSelectShell>
      <summary>
        {selected.length ? selected.join(', ') : placeholder}
        <span aria-hidden>⌄</span>
      </summary>
      <div role="listbox">
        {loadError ? (
          <label>{loadError}</label>
        ) : options.length ? (
          options.map((entry) => {
            const value = relationValue(entry);
            return (
              <label key={value}>
                <input
                  type="checkbox"
                  checked={values.includes(value)}
                  onChange={() =>
                    onChange(
                      values.includes(value)
                        ? values.filter((item) => item !== value)
                        : [...values, value],
                    )
                  }
                />
                <span>{displayName(entry)}</span>
              </label>
            );
          })
        ) : (
          <label>{empty}</label>
        )}
      </div>
    </StoreSelectShell>
  );
}

export default function CatalogEntryFormPage({ kind }: { kind: FormKind }) {
  const { get, post, put } = useFetchClient();
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const { locale } = useIntl();
  const user = useAuth('CatalogEntryFormPage', (state) => state.user);
  const language: Language = locale.toLowerCase().startsWith('fr')
    ? 'fr'
    : 'pt';
  const labels = copy[language];
  const entityCopy = labels[kind];
  const editing = Boolean(documentId);
  const localized = kind === 'category';
  const contentLocale =
    searchParams.get('locale') ||
    searchParams.get('plugins[i18n][locale]') ||
    'pt';
  const resource = kind === 'category' ? 'categories' : 'sizes';
  const uid = kind === 'category' ? 'api::category.category' : 'api::size.size';
  const listLink = storeListLink(resource);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormValues>(initialForm);
  const [products, setProducts] = useState<RelationEntry[]>([]);
  const [originalProducts, setOriginalProducts] = useState<string[]>([]);
  const [relationFailed, setRelationFailed] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const selectedProductNames = useMemo(
    () =>
      products
        .filter((entry) => form.products.includes(relationValue(entry)))
        .map(displayName),
    [form.products, products],
  );

  useEffect(() => {
    let active = true;
    const params: Record<string, string | number> = {
      page: 1,
      pageSize: 200,
      sort: 'name:ASC',
    };
    params.locale = contentLocale;
    void get<RelationResponse>(contentLink('api::product.product'), { params })
      .then((response) => {
        if (!active) return;
        setProducts(response.data.results ?? []);
        setRelationFailed(false);
      })
      .catch(() => {
        if (active) setRelationFailed(true);
      });
    return () => {
      active = false;
    };
  }, [contentLocale, get]);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    const params: Record<string, string> = {};
    if (localized) {
      params.locale = contentLocale;
      params.status = 'draft';
    }
    void get<EntryResponse>(`${contentLink(uid)}/${documentId}`, { params })
      .then(async (response) => {
        if (!active) return;
        const record = response.data.data;
        if (!record) throw new Error(labels.loadError);
        let currentProducts = relationEntries(record.products);
        try {
          const relationParams: Record<string, string | number> = {
            page: 1,
            pageSize: 200,
          };
          if (localized) {
            relationParams.locale = contentLocale;
            relationParams.status = 'draft';
          }
          const relationResponse = await get<RelationResponse>(
            `/content-manager/relations/${uid}/${documentId}/products`,
            { params: relationParams },
          );
          currentProducts = relationResponse.data.results ?? currentProducts;
        } catch {
          /* A resposta principal continua a ser uma alternativa válida. */
        }
        if (!active) return;
        const productValues = currentProducts
          .map(relationValue)
          .filter(Boolean);
        setProducts((current) => mergeEntries(current, currentProducts));
        setOriginalProducts(productValues);
        setForm({
          name: String(record.name ?? ''),
          slug: String(record.slug ?? ''),
          description: String(record.description ?? ''),
          label: String(record.label ?? ''),
          value: String(record.value ?? ''),
          order: String(record.order ?? 0),
          products: productValues,
          linkProducts: productValues.length > 0,
        });
      })
      .catch((error: any) => {
        if (active)
          setMessage({
            text: error?.response?.data?.error?.message || labels.loadError,
            error: true,
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contentLocale, documentId, get, labels.loadError, localized, uid]);

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const updateCategoryName = (value: string) =>
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        current.slug && current.slug !== slugify(current.name)
          ? current.slug
          : slugify(value),
    }));
  const valid =
    kind === 'category'
      ? Boolean(form.name.trim() && form.slug.trim() && form.description.trim())
      : Boolean(
          form.label.trim() && form.value.trim() && Number(form.order) >= 0,
        );
  const goToSummary = () => {
    if (!valid) {
      setMessage({ text: labels.required, error: true });
      return;
    }
    setMessage(null);
    setStep(2);
  };

  const connection = (value: string) => {
    const product = products.find((entry) => relationValue(entry) === value);
    return product
      ? {
          documentId: product.documentId ?? String(product.id),
          locale: product.locale ?? contentLocale,
        }
      : null;
  };
  const selectedProducts = form.linkProducts ? form.products : [];
  const productsPayload = {
    connect: selectedProducts
      .filter((value) => !originalProducts.includes(value))
      .map(connection)
      .filter(Boolean),
    disconnect: originalProducts
      .filter((value) => !selectedProducts.includes(value))
      .map(connection)
      .filter(Boolean),
  };

  const save = async () => {
    if (!valid) {
      setMessage({ text: labels.required, error: true });
      setStep(1);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const base = contentLink(uid);
      const payload: Record<string, unknown> =
        kind === 'category'
          ? {
              locale: contentLocale,
              name: form.name.trim(),
              slug: form.slug.trim(),
              description: form.description.trim(),
              products: productsPayload,
              status: 'published',
            }
          : {
              label: form.label.trim(),
              value: form.value.trim(),
              order: Number(form.order || 0),
              products: productsPayload,
            };
      if (editing && documentId) {
        if (localized)
          await post(`${base}/${documentId}/actions/publish`, payload);
        else await put(`${base}/${documentId}`, payload);
      } else if (localized) await post(`${base}/actions/publish`, payload);
      else await post(base, payload);
      setMessage({ text: entityCopy.saved, error: false });
      navigate(listLink, { replace: true });
    } catch (error: any) {
      setMessage({
        text: error?.response?.data?.error?.message || labels.saveError,
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

  const categoryFields = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>{entityCopy.dataTitle}</h2>
        </SectionTitle>
        <Field>
          Nome da categoria <Required />
          <Input
            value={form.name}
            onChange={(event) => updateCategoryName(event.target.value)}
            placeholder="Insira o nome da categoria"
            autoFocus
          />
        </Field>
        <Field>
          Endereço da categoria <Required />
          <Input
            value={form.slug}
            onChange={(event) => setField('slug', slugify(event.target.value))}
            placeholder="ex.: cuidados-do-rosto"
          />
          <small>
            Gerado automaticamente a partir do nome. Pode ser ajustado
            manualmente.
          </small>
        </Field>
        <OptionalRelationField
          checked={form.linkProducts}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              linkProducts: checked,
              products: checked ? current.products : [],
            }))
          }
          title="Vincular produtos agora?"
          help="Pode criar a categoria sem produtos e fazer a vinculação mais tarde."
        >
          <Field as="div">
            Produtos da categoria
            <ProductMultiSelect
              values={form.products}
              options={products}
              onChange={(value) => setField('products', value)}
              placeholder={labels.selectProducts}
              empty={labels.noOptions}
              loadError={relationFailed ? labels.relationError : undefined}
            />
          </Field>
        </OptionalRelationField>
        <Field>
          Descrição da categoria <Required />
          <Textarea
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="Insira a descrição"
          />
        </Field>
      </Section>
    </FormColumn>
  );

  const sizeFields = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>{entityCopy.dataTitle}</h2>
        </SectionTitle>
        <Field>
          Nome apresentado <Required />
          <Input
            value={form.label}
            onChange={(event) => setField('label', event.target.value)}
            placeholder="Insira o nome do tamanho"
            autoFocus
          />
          <small>Exemplo: 50 ml.</small>
        </Field>
        <Field>
          Código interno <Required />
          <Input
            value={form.value}
            disabled={editing}
            onChange={(event) => setField('value', codeify(event.target.value))}
            placeholder="Ex.: 50ML"
          />
          <small>
            {editing
              ? 'Este identificador é permanente e não pode ser alterado.'
              : 'Exemplo: 50ML. Deve ser único.'}
          </small>
        </Field>
        <Field>
          Posição
          <Input
            type="number"
            min="0"
            value={form.order}
            onChange={(event) => setField('order', event.target.value)}
          />
        </Field>
        <OptionalRelationField
          checked={form.linkProducts}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              linkProducts: checked,
              products: checked ? current.products : [],
            }))
          }
          title="Vincular produtos agora?"
          help="Pode criar o tamanho sem produtos e associá-los mais tarde."
        >
          <Field as="div">
            Produtos com este tamanho
            <ProductMultiSelect
              values={form.products}
              options={products}
              onChange={(value) => setField('products', value)}
              placeholder={labels.selectProducts}
              empty={labels.noOptions}
              loadError={relationFailed ? labels.relationError : undefined}
            />
          </Field>
        </OptionalRelationField>
      </Section>
    </FormColumn>
  );

  const summaryRows =
    kind === 'category'
      ? [
          ['Nome da categoria', form.name],
          ['Endereço da categoria', `/${form.slug}`],
          [
            'Produtos da categoria',
            selectedProductNames.join(', ') || labels.noProducts,
          ],
          ['Descrição da categoria', form.description],
        ]
      : [
          ['Nome apresentado', form.label],
          ['Código interno', form.value],
          ['Posição', form.order || '0'],
          [
            'Produtos com este tamanho',
            selectedProductNames.join(', ') || labels.noProducts,
          ],
        ];

  return (
    <Shell labelledBy="catalog-entry-form-title">
      <StoreLayout>
        <StoreSidebar activeHref={listLink} />
        <StorePage>
          <Topbar>
            <BackLink to={listLink}>
              <span aria-hidden>←</span>
              {entityCopy.back}
            </BackLink>
            <TopActions>
              <LanguageLink to="/store/profile">
                <span>{language === 'fr' ? 'FR / €' : 'PT / €'}</span>
                <img src={iconPath('language')} alt="" aria-hidden />
              </LanguageLink>
              <Profile to="/store/profile">
                <Avatar>{initials(user?.firstname, user?.lastname)}</Avatar>
                <ProfileText>
                  <strong>{fullName}</strong>
                  <small>{role}</small>
                </ProfileText>
                <span aria-hidden>⌄</span>
              </Profile>
            </TopActions>
          </Topbar>
          <Workspace>
            <Title id="catalog-entry-form-title">
              {editing ? entityCopy.editTitle : entityCopy.createTitle}
            </Title>
            <Stepper aria-label="Etapas do formulário">
              <StepItem>
                <StepButton
                  type="button"
                  $active={step === 1}
                  $done={step > 1}
                  onClick={() => setStep(1)}
                >
                  <span>{step > 1 ? '✓' : '1'}</span>
                  {labels.data}
                </StepButton>
              </StepItem>
              <StepItem>
                <StepButton
                  type="button"
                  $active={step === 2}
                  $done={false}
                  onClick={goToSummary}
                >
                  <span>2</span>
                  {labels.summary}
                </StepButton>
              </StepItem>
            </Stepper>
            {message && (
              <Notice
                $error={message.error}
                role={message.error ? 'alert' : 'status'}
              >
                {message.text}
              </Notice>
            )}
            <Card>
              {loading ? (
                <Notice>{labels.loading}</Notice>
              ) : step === 1 ? (
                kind === 'category' ? (
                  categoryFields
                ) : (
                  sizeFields
                )
              ) : (
                <FormColumn>
                  <Section>
                    <SectionTitle>
                      <h2>{entityCopy.summaryTitle}</h2>
                      <p>{entityCopy.summaryHelp}</p>
                    </SectionTitle>
                    <Summary>
                      {summaryRows.map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value || labels.notInformed}</dd>
                        </div>
                      ))}
                    </Summary>
                  </Section>
                </FormColumn>
              )}
            </Card>
            {step === 1 ? (
              <FooterSingle>
                <NavButton
                  type="button"
                  $primary
                  disabled={loading}
                  onClick={goToSummary}
                >
                  {labels.next}
                  <span aria-hidden>→</span>
                </NavButton>
              </FooterSingle>
            ) : (
              <Footer>
                <NavButton
                  type="button"
                  disabled={saving}
                  onClick={() => setStep(1)}
                >
                  <span aria-hidden>←</span>
                  {labels.previous}
                </NavButton>
                <NavButton
                  type="button"
                  $primary
                  disabled={saving}
                  onClick={() => void save()}
                >
                  {saving
                    ? labels.saving
                    : editing
                      ? entityCopy.save
                      : entityCopy.create}
                  <span aria-hidden>→</span>
                </NavButton>
              </Footer>
            )}
          </Workspace>
        </StorePage>
      </StoreLayout>
    </Shell>
  );
}

export const CategoryFormPage = () => <CatalogEntryFormPage kind="category" />;
export const SizeFormPage = () => <CatalogEntryFormPage kind="size" />;
