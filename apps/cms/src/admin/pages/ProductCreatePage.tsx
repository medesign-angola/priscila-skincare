import {
  Component,
  ErrorInfo,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { AdminProfileMenu } from '../components/AdminProfileMenu';
import {
  contentLink,
  iconPath,
  productListLink,
  StoreLayout,
  StorePage,
  StoreSidebar,
} from '../components/StoreSidebar';
import { StoreSelect, StoreSelectShell } from '../components/StoreSelect';
import { OptionalRelationField } from '../components/OptionalRelationField';
import {
  ProductMarketingResources,
  type MarketingAsset,
  type MarketingResourceValues,
} from '../components/ProductMarketingResources';

type Step = 1 | 2 | 3 | 4 | 5;
type UploadKind =
  | 'gallery'
  | 'thumbnail'
  | 'featured'
  | 'editorial'
  | 'benefits-main'
  | 'usage-main'
  | 'result-before'
  | 'result-after';

type RelationEntry = {
  id?: number;
  documentId?: string;
  name?: string;
  title?: string;
  label?: string;
  locale?: string;
};

type Asset = MarketingAsset;
type PendingUpload = {
  id: string;
  scope: string;
  name: string;
  previewUrl: string | null;
  progress: number;
};

type ImagePickerProps = {
  children: ReactNode;
  className?: string;
  multiple?: boolean;
  title?: string;
  onFiles: (files: FileList | null) => void;
};

function ImagePicker({
  children,
  className,
  multiple,
  title,
  onFiles,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    if (!inputRef.current) return;
    inputRef.current.value = '';
    inputRef.current.click();
  };
  return (
    <div className={className}>
      <button type="button" title={title} onClick={openPicker}>
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => onFiles(event.currentTarget.files)}
      />
    </div>
  );
}

type ProductRecord = Record<string, any> & {
  documentId?: string;
  locale?: string;
};

type ProductResponse = {
  data?: ProductRecord;
};

type RelationResponse = {
  results?: RelationEntry[];
};

type Benefit = { title: string; description: string; images: Asset[] };
type UsageStep = { name: string; description: string };
type ResultStatistic = { percentage: string; description: string };

type ProductForm = {
  name: string;
  category: string;
  slug: string;
  description: string;
  additionalDescription: string;
  sku: string;
  priceAoa: string;
  priceEur: string;
  availability: string;
  stock: string;
  badge: string;
  discount: string;
  sizes: string[];
  ingredients: string[];
  collections: string[];
  kits: string[];
  linkSizes: boolean;
  linkIngredients: boolean;
  linkCollections: boolean;
  linkKits: boolean;
  highlights: string[];
  benefits: Benefit[];
  editorialEnabled: boolean;
  editorialHeadline: string;
  editorialDescription: string;
  editorialFootnote: string;
  galleryEditorialEnabled: boolean;
  galleryHeadline: string;
  galleryDescription: string;
  usageSteps: UsageStep[];
  resultsDescription: string;
  resultStatistics: ResultStatistic[];
  beforeLabel: string;
  afterLabel: string;
};

const initialForm: ProductForm = {
  name: '',
  category: '',
  slug: '',
  description: '',
  additionalDescription: '',
  sku: '',
  priceAoa: '',
  priceEur: '',
  availability: 'in-stock',
  stock: '0',
  badge: 'none',
  discount: '',
  sizes: [],
  ingredients: [],
  collections: [],
  kits: [],
  linkSizes: false,
  linkIngredients: false,
  linkCollections: false,
  linkKits: false,
  highlights: [''],
  benefits: [{ title: '', description: '', images: [] }],
  editorialEnabled: false,
  editorialHeadline: '',
  editorialDescription: '',
  editorialFootnote: '',
  galleryEditorialEnabled: false,
  galleryHeadline: '',
  galleryDescription: '',
  usageSteps: [{ name: '', description: '' }],
  resultsDescription: '',
  resultStatistics: [{ percentage: '', description: '' }],
  beforeLabel: 'Antes',
  afterLabel: 'Depois',
};

const labels = {
  pt: {
    title: 'Novo produto',
    back: 'Produtos',
    product: 'Produto',
    images: 'Imagens',
    benefits: 'Benefícios',
    content: 'Detalhes e marketing',
    summary: 'Resumo',
    previous: 'Voltar',
    next: 'Avançar',
    draft: 'Guardar como rascunho',
    publish: 'Publicar produto',
    required: 'Preencha os campos obrigatórios antes de avançar.',
    imageRequired:
      'Adicione pelo menos cinco imagens à galeria e uma miniatura.',
    comparisonRequired:
      'Para criar a comparação, adicione as imagens de antes e de depois.',
    benefitImageLimit: 'Cada benefício pode ter no máximo 3 imagens.',
    saveError:
      'Não foi possível guardar o produto. Reveja os dados e tente novamente.',
    uploadError: 'Não foi possível enviar esta imagem. Tente novamente.',
    saved: 'Produto guardado.',
    editTitle: 'Editar produto',
    update: 'Guardar alterações',
    updating: 'A guardar…',
    loadError:
      'Não foi possível carregar este produto. Volte à lista e tente novamente.',
    loading: 'A carregar o produto…',
  },
  fr: {
    title: 'Nouveau produit',
    back: 'Produits',
    product: 'Produit',
    images: 'Images',
    benefits: 'Bénéfices',
    content: 'Détails et marketing',
    summary: 'Résumé',
    previous: 'Retour',
    next: 'Continuer',
    draft: 'Enregistrer le brouillon',
    publish: 'Publier le produit',
    required: 'Renseignez les champs obligatoires avant de continuer.',
    imageRequired:
      'Ajoutez au moins cinq images à la galerie et une miniature.',
    comparisonRequired:
      'Pour créer la comparaison, ajoutez les images avant et après.',
    benefitImageLimit: 'Chaque bénéfice peut contenir au maximum 3 images.',
    saveError:
      "Impossible d'enregistrer le produit. Vérifiez les données et réessayez.",
    uploadError: "Impossible d'envoyer cette image. Réessayez.",
    saved: 'Produit enregistré.',
    editTitle: 'Modifier le produit',
    update: 'Enregistrer les modifications',
    updating: 'Enregistrement…',
    loadError:
      'Impossible de charger ce produit. Revenez à la liste et réessayez.',
    loading: 'Chargement du produit…',
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
const Language = styled(Link)`
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
  align-items: center;
  margin: 0 0 32px;
  padding: 0;
  list-style: none;
  @media (max-width: 62rem) {
    overflow-x: auto;
    padding-bottom: 8px;
  }
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
  min-height: 640px;
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
  gap: 22px;
  padding-bottom: 28px;
  border-bottom: 1px solid #ece8e1;
  &:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
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
  > select,
  > textarea,
  > details,
  > button,
  > label,
  > div {
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
  ${inputCss}min-height:112px;
  resize: vertical;
  line-height: 1.55;
`;
const Inline = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  @media (max-width: 38rem) {
    grid-template-columns: 1fr;
  }
`;
const SmallButton = styled.button`
  justify-self: start;
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid #8b7048;
  border-radius: 9px;
  color: #7d6645;
  background: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: #f7f3ed;
  }
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
const DropZone = styled(ImagePicker)`
  button {
    display: grid;
    width: 100%;
    min-height: 260px;
    place-items: center;
    padding: 28px;
    border: 2px dashed #e4ddd3;
    border-radius: 8px;
    color: inherit;
    background: #fff;
    text-align: center;
    font: inherit;
    cursor: pointer;
  }
  input {
    display: none;
  }
  button:hover {
    border-color: #b49667;
    background: #fffdf9;
  }
  button:focus-visible {
    outline: 3px solid rgba(180, 150, 103, 0.3);
    outline-offset: 2px;
  }
`;
const EmptyUpload = styled.span`
  display: grid;
  gap: 18px;
  place-items: center;
  color: #817b72;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  span:first-child {
    display: grid;
    width: 64px;
    height: 64px;
    place-items: center;
    border-radius: 50%;
    background: #f7f3ed;
    color: #8b7048;
    font-size: 26px;
  }
  b {
    padding: 9px 16px;
    border: 1px solid #8b7048;
    border-radius: 9px;
    color: #7d6645;
    background: #fff;
    font-size: 14px;
  }
`;
const AssetList = styled.div`
  display: grid;
  gap: 10px;
`;
const AssetRow = styled.div`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
  img {
    width: 64px;
    height: 64px;
    border-radius: 9px;
    object-fit: cover;
  }
  strong {
    display: block;
    overflow: hidden;
    color: #1a1917;
    font-size: 15px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    display: block;
    margin-top: 5px;
    color: #6d675f;
    font-size: 13px;
  }
`;
const PendingAssetRow = styled.div`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border: 1px solid #eee9e2;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(47, 48, 58, 0.04);
  img {
    width: 64px;
    height: 64px;
    border-radius: 9px;
    object-fit: cover;
    opacity: 0.72;
  }
  strong {
    display: block;
    overflow: hidden;
    color: #1a1917;
    font-size: 15px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
const PendingAssetPreview = styled.div`
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  overflow: hidden;
  border-radius: 9px;
  color: #8b7048;
  background: #f3efe9;
  font-size: 22px;
  img {
    width: 100%;
    height: 100%;
    border-radius: inherit;
    object-fit: cover;
    opacity: 0.72;
  }
`;
const PendingAssetContent = styled.div`
  min-width: 0;
`;
const UploadProgressLine = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
  span {
    color: #1a1917;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`;
const UploadProgressTrack = styled.div`
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1eee9;
`;
const UploadProgressValue = styled.div<{ $progress: number }>`
  width: ${({ $progress }) => $progress}%;
  height: 100%;
  border-radius: inherit;
  background: #8b7048;
  transition: width 180ms ease;
`;
const UploadFallback = styled.div`
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #eee9e2;
  border-radius: 10px;
  color: #1a1917;
  background: #fff;
  font-size: 14px;
  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  span {
    flex: 0 0 auto;
    color: #7d6645;
    font-weight: 700;
  }
`;
const AssetActions = styled.div`
  display: flex;
  gap: 8px;
  > button {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 0;
    border-radius: 7px;
    color: #7d6645;
    background: #f7f3ed;
    font-size: 18px;
    cursor: pointer;
  }
`;
const ReplaceAsset = styled(ImagePicker)`
  button {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 0;
    border-radius: 7px;
    color: #7d6645;
    background: #f7f3ed;
    font-size: 18px;
    cursor: pointer;
  }
  input {
    display: none;
  }
`;
const AddAsset = styled(ImagePicker)`
  button {
    display: flex;
    width: 100%;
    min-height: 46px;
    align-items: center;
    justify-content: center;
    border: 1px dashed #b49667;
    border-radius: 9px;
    color: #7d6645;
    background: #fff;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  input {
    display: none;
  }
  button:hover {
    background: #fffdf9;
  }
`;
const Repeatable = styled.div`
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid #ece8e1;
  border-radius: 10px;
  background: #fcfbf9;
`;
const RepeatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  strong {
    font-size: 15px;
  }
  button {
    border: 0;
    color: #991b1b;
    background: transparent;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
`;
const SummaryGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  overflow: hidden;
  border: 1px solid #ece8e1;
  border-radius: 10px;
  background: #ece8e1;
  @media (max-width: 42rem) {
    grid-template-columns: 1fr;
  }
  div {
    padding: 18px;
    background: #fff;
  }
  dt {
    color: #8f887e;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  dd {
    margin: 7px 0 0;
    color: #1a1917;
    font-size: 15px;
    line-height: 1.45;
  }
`;

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';
}
function displayName(entry: RelationEntry) {
  return (
    entry.name ||
    entry.title ||
    entry.label ||
    `Registo ${entry.documentId || entry.id}`
  );
}
function relationValue(entry: RelationEntry) {
  return String(entry.documentId ?? entry.id ?? '');
}
function connection(value: string, entries: RelationEntry[]) {
  const entry = entries.find((item) => relationValue(item) === value);
  return entry
    ? {
        documentId: entry.documentId ?? String(entry.id),
        locale: entry.locale ?? 'pt',
      }
    : null;
}
function optionalCopy(headline: string, description: string) {
  return headline.trim() && description.trim()
    ? { headline: headline.trim(), description: description.trim() }
    : null;
}
function asText(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}
function asAsset(value: unknown): Asset | null {
  if (!value || typeof value !== 'object') return null;
  const asset = value as Record<string, unknown>;
  const id = Number(asset.id);
  const url = typeof asset.url === 'string' ? asset.url : '';
  if (!Number.isFinite(id) || !url) return null;
  return {
    id,
    url,
    name: typeof asset.name === 'string' ? asset.name : `Imagem ${id}`,
    alternativeText:
      typeof asset.alternativeText === 'string' ? asset.alternativeText : null,
  };
}
function asAssets(value: unknown): Asset[] {
  return (Array.isArray(value) ? value : [])
    .map(asAsset)
    .filter((asset): asset is Asset => Boolean(asset));
}
function relationValues(value: unknown): string[] {
  return (Array.isArray(value) ? value : [])
    .map((entry) => relationValue(entry as RelationEntry))
    .filter(Boolean);
}
function relationEntries(value: unknown): RelationEntry[] {
  if (Array.isArray(value))
    return value.filter((entry): entry is RelationEntry =>
      Boolean(entry && typeof entry === 'object'),
    );
  if (
    value &&
    typeof value === 'object' &&
    relationValue(value as RelationEntry)
  )
    return [value as RelationEntry];
  return [];
}
function mergeRelationEntries(
  current: RelationEntry[],
  incoming: RelationEntry[],
) {
  const merged = [...current];
  for (const entry of incoming) {
    if (!merged.some((item) => relationValue(item) === relationValue(entry)))
      merged.push(entry);
  }
  return merged;
}
function firstAsset(value: unknown): Asset[] {
  const asset = asAsset(value);
  return asset ? [asset] : [];
}
function mediaAsset(value: unknown): Asset[] {
  return firstAsset((value as Record<string, unknown> | null)?.desktopImage);
}
function mediaId(value: unknown) {
  const entry = value as Record<string, unknown> | null;
  const id = Number(entry?.id);
  return Number.isFinite(id) ? id : null;
}
function preservedMediaPayload(
  original: unknown,
  desktop: Asset | undefined,
  alt: string,
) {
  if (!desktop) return null;
  const media = (
    original && typeof original === 'object' ? original : {}
  ) as Record<string, unknown>;
  return {
    desktopImage: desktop.id,
    mobileImage: mediaId(media.mobileImage),
    video: mediaId(media.video),
    placeholder: mediaId(media.placeholder),
    alt: asText(media.alt) || alt,
    focalPointX: Number(media.focalPointX ?? 50),
    focalPointY: Number(media.focalPointY ?? 50),
    objectFit: asText(media.objectFit) || 'cover',
    hasNoise: Boolean(media.hasNoise),
  };
}

function Required() {
  return <span className="required">*</span>;
}

class UploadCardBoundary extends Component<
  { name: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `Não foi possível renderizar a pré-visualização de ${this.props.name}.`,
      error,
      info,
    );
  }
  render() {
    return this.state.failed ? (
      <UploadFallback role="status">
        <strong>{this.props.name}</strong>
        <span>A enviar…</span>
      </UploadFallback>
    ) : (
      this.props.children
    );
  }
}

function MultiSelect({
  label,
  values,
  options,
  onChange,
  help,
  loadError,
}: {
  label: string;
  values: string[];
  options: RelationEntry[];
  onChange: (values: string[]) => void;
  help?: string;
  loadError?: boolean;
}) {
  const selectedNames = options
    .filter((item) => values.includes(relationValue(item)))
    .map(displayName);
  return (
    <Field as="div">
      <span>{label}</span>
      <StoreSelectShell>
        <summary>
          {selectedNames.length
            ? selectedNames.join(', ')
            : `Selecione ${label.toLowerCase()}`}
          <span>⌄</span>
        </summary>
        <div role="listbox">
          {loadError ? (
            <label>
              Não foi possível carregar os dados. Atualize a página.
            </label>
          ) : options.length ? (
            options.map((option) => {
              const value = relationValue(option);
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
                  {displayName(option)}
                </label>
              );
            })
          ) : (
            <label>Nenhuma opção cadastrada</label>
          )}
        </div>
      </StoreSelectShell>
      {help && <small>{help}</small>}
    </Field>
  );
}

function UploadArea({
  title,
  required,
  multiple,
  maxAssets,
  assets,
  pending,
  onFiles,
  onRemove,
  onReplace,
  help,
}: {
  title: string;
  required?: boolean;
  multiple?: boolean;
  maxAssets?: number;
  assets: Asset[];
  pending: PendingUpload[];
  onFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  onReplace: (index: number, files: FileList | null) => void;
  help: string;
}) {
  const hasCards = assets.length > 0 || pending.length > 0;
  const canAddMore =
    multiple && (!maxAssets || assets.length + pending.length < maxAssets);
  return (
    <Field as="div">
      <span>
        {title} {required && <Required />}
      </span>
      {!hasCards ? (
        <DropZone multiple={multiple} onFiles={onFiles}>
          <EmptyUpload>
            <span>▧</span>
            <span>
              Nenhuma imagem adicionada.
              <br />
              Adicione {multiple ? 'imagens' : 'uma imagem'} aqui.
            </span>
            <b>Adicionar</b>
          </EmptyUpload>
        </DropZone>
      ) : (
        <>
          <AssetList>
            {assets.map((asset, index) => (
              <AssetRow key={`${asset.id}-${index}`}>
                <img
                  src={asset.url}
                  alt={asset.alternativeText || asset.name}
                />
                <span>
                  <strong>{asset.name}</strong>
                  <small>ID: {asset.id}</small>
                </span>
                <AssetActions>
                  <ReplaceAsset
                    title="Substituir imagem"
                    onFiles={(files) => onReplace(index, files)}
                  >
                    ✎
                  </ReplaceAsset>
                  <button
                    type="button"
                    title="Remover imagem"
                    onClick={() => onRemove(index)}
                  >
                    ⌫
                  </button>
                </AssetActions>
              </AssetRow>
            ))}
            {pending.map((item) => (
              <UploadCardBoundary key={item.id} name={item.name}>
                <PendingAssetRow aria-busy="true">
                  <PendingAssetPreview>
                    {item.previewUrl ? (
                      <img src={item.previewUrl} alt="" />
                    ) : (
                      <span aria-hidden>▧</span>
                    )}
                  </PendingAssetPreview>
                  <PendingAssetContent>
                    <strong>{item.name}</strong>
                    <UploadProgressLine>
                      <UploadProgressTrack
                        role="progressbar"
                        aria-label={`A enviar ${item.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={item.progress}
                      >
                        <UploadProgressValue $progress={item.progress} />
                      </UploadProgressTrack>
                      <span>{item.progress}%</span>
                    </UploadProgressLine>
                  </PendingAssetContent>
                </PendingAssetRow>
              </UploadCardBoundary>
            ))}
          </AssetList>
          {canAddMore && (
            <AddAsset multiple onFiles={onFiles}>
              + Adicionar outras imagens
            </AddAsset>
          )}
        </>
      )}
      <small>{help}</small>
    </Field>
  );
}

export default function ProductCreatePage() {
  const { get, post, put } = useFetchClient();
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const { locale } = useIntl();
  const user = useAuth('ProductCreatePage', (state) => state.user);
  const language = locale.toLowerCase().startsWith('fr') ? 'fr' : 'pt';
  const copy = labels[language];
  const editing = Boolean(documentId);
  const contentLocale =
    searchParams.get('locale') ||
    searchParams.get('plugins[i18n][locale]') ||
    'pt';
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [relations, setRelations] = useState<Record<string, RelationEntry[]>>({
    categories: [],
    sizes: [],
    ingredients: [],
    collections: [],
    kits: [],
  });
  const [relationErrors, setRelationErrors] = useState<string[]>([]);
  const [gallery, setGallery] = useState<Asset[]>([]);
  const [thumbnail, setThumbnail] = useState<Asset[]>([]);
  const [featured, setFeatured] = useState<Asset[]>([]);
  const [editorialMedia, setEditorialMedia] = useState<Asset[]>([]);
  const [benefitsMainMedia, setBenefitsMainMedia] = useState<Asset[]>([]);
  const [usageMainMedia, setUsageMainMedia] = useState<Asset[]>([]);
  const [resultBefore, setResultBefore] = useState<Asset[]>([]);
  const [resultAfter, setResultAfter] = useState<Asset[]>([]);
  const [originalProduct, setOriginalProduct] = useState<ProductRecord | null>(
    null,
  );
  const [originalRelations, setOriginalRelations] = useState<
    Record<string, string[]>
  >({ category: [], sizes: [], ingredients: [], collections: [], kits: [] });
  const [loadingProduct, setLoadingProduct] = useState(editing);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  const setField = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) => setForm((current) => ({ ...current, [key]: value }));
  const relationSources = useMemo(
    () =>
      [
        ['categories', 'api::category.category', true],
        ['sizes', 'api::size.size', false],
        ['ingredients', 'api::ingredient.ingredient', true],
        ['collections', 'api::collection.collection', true],
        ['kits', 'api::kit.kit', true],
      ] as const,
    [],
  );

  useEffect(() => {
    let active = true;
    void Promise.all(
      relationSources.map(async ([key, uid, localized]) => {
        try {
          const params: Record<string, string | number> = {
            page: 1,
            pageSize: 100,
            sort: 'id:ASC',
          };
          if (localized) params.locale = contentLocale;
          const response = await get<{ results?: RelationEntry[] }>(
            contentLink(uid),
            { params },
          );
          return { key, items: response.data.results ?? [], failed: false };
        } catch {
          return { key, items: [], failed: true };
        }
      }),
    ).then((entries) => {
      if (!active) return;
      setRelations(
        Object.fromEntries(entries.map(({ key, items }) => [key, items])),
      );
      setRelationErrors(
        entries.filter(({ failed }) => failed).map(({ key }) => key),
      );
    });
    return () => {
      active = false;
    };
  }, [contentLocale, get, relationSources]);
  useEffect(() => {
    if (!documentId) {
      setLoadingProduct(false);
      return;
    }
    let active = true;
    setLoadingProduct(true);
    setMessage(null);
    void get<ProductResponse>(
      `${contentLink('api::product.product')}/${documentId}`,
      { params: { locale: contentLocale, status: 'draft' } },
    )
      .then(async (response) => {
        if (!active) return;
        const record = response.data.data;
        if (!record || !Object.keys(record).length)
          throw new Error(copy.loadError);
        const relationFields = [
          'category',
          'sizes',
          'ingredients',
          'collections',
          'kits',
        ] as const;
        const existingRelationEntries = Object.fromEntries(
          await Promise.all(
            relationFields.map(async (field) => {
              try {
                const relationResponse = await get<RelationResponse>(
                  `/content-manager/relations/api::product.product/${documentId}/${field}`,
                  {
                    params: {
                      locale: contentLocale,
                      status: 'draft',
                      page: 1,
                      pageSize: 100,
                    },
                  },
                );
                return [field, relationResponse.data.results ?? []] as const;
              } catch {
                return [field, relationEntries(record[field])] as const;
              }
            }),
          ),
        ) as Record<(typeof relationFields)[number], RelationEntry[]>;
        if (!active) return;
        const commerce = record.commerce ?? {};
        const prices = commerce.prices ?? {};
        const badge = commerce.badge ?? {};
        const editorial = record.editorial ?? {};
        const galleryEditorial = record.galleryEditorial ?? {};
        const results = record.results ?? {};
        const comparison = results.comparison ?? {};
        const categoryValue = existingRelationEntries.category[0]
          ? relationValue(existingRelationEntries.category[0])
          : '';
        const relationSnapshot = {
          category: categoryValue ? [categoryValue] : [],
          sizes: relationValues(existingRelationEntries.sizes),
          ingredients: relationValues(existingRelationEntries.ingredients),
          collections: relationValues(existingRelationEntries.collections),
          kits: relationValues(existingRelationEntries.kits),
        };
        setOriginalProduct(record);
        setOriginalRelations(relationSnapshot);
        setRelations((current) => ({
          ...current,
          categories: mergeRelationEntries(
            current.categories,
            existingRelationEntries.category,
          ),
          sizes: mergeRelationEntries(
            current.sizes,
            existingRelationEntries.sizes,
          ),
          ingredients: mergeRelationEntries(
            current.ingredients,
            existingRelationEntries.ingredients,
          ),
          collections: mergeRelationEntries(
            current.collections,
            existingRelationEntries.collections,
          ),
          kits: mergeRelationEntries(
            current.kits,
            existingRelationEntries.kits,
          ),
        }));
        setForm({
          name: asText(record.name),
          category: categoryValue,
          slug: asText(record.slug),
          description: asText(record.description),
          additionalDescription: asText(record.additionalDescription),
          sku: asText(record.sku),
          priceAoa: asText(prices.aoa),
          priceEur: asText(prices.eur),
          availability: asText(commerce.availability) || 'in-stock',
          stock: asText(commerce.stock ?? 0),
          badge: asText(badge.type) || 'none',
          discount: asText(badge.percentage),
          sizes: relationSnapshot.sizes,
          ingredients: relationSnapshot.ingredients,
          collections: relationSnapshot.collections,
          kits: relationSnapshot.kits,
          linkSizes: relationSnapshot.sizes.length > 0,
          linkIngredients: relationSnapshot.ingredients.length > 0,
          linkCollections: relationSnapshot.collections.length > 0,
          linkKits: relationSnapshot.kits.length > 0,
          highlights: (Array.isArray(record.highlights)
            ? record.highlights
            : []
          )
            .map((item: Record<string, unknown>) => asText(item.title))
            .filter(Boolean).length
            ? (record.highlights as Record<string, unknown>[]).map((item) =>
                asText(item.title),
              )
            : [''],
          benefits: (Array.isArray(record.benefits) ? record.benefits : [])
            .length
            ? (record.benefits as Record<string, unknown>[]).map((item) => ({
                title: asText(item.title),
                description: asText(item.description),
                images: asAssets(item.images).slice(0, 3),
              }))
            : [{ title: '', description: '', images: [] }],
          editorialEnabled: record.editorialEnabled !== false,
          editorialHeadline: asText(editorial.headline),
          editorialDescription: asText(editorial.description),
          editorialFootnote: asText(editorial.footnote),
          galleryEditorialEnabled: record.galleryEditorialEnabled !== false,
          galleryHeadline: asText(galleryEditorial.headline),
          galleryDescription: asText(galleryEditorial.description),
          usageSteps: (Array.isArray(record.usageSteps)
            ? record.usageSteps
            : []
          ).length
            ? (record.usageSteps as Record<string, unknown>[]).map((item) => ({
                name: asText(item.name),
                description: asText(item.description),
              }))
            : [{ name: '', description: '' }],
          resultsDescription: asText(results.description),
          resultStatistics: (Array.isArray(results.statistics)
            ? results.statistics
            : []
          ).length
            ? (results.statistics as Record<string, unknown>[]).map((item) => ({
                percentage: asText(item.percentage),
                description: asText(item.description),
              }))
            : [{ percentage: '', description: '' }],
          beforeLabel: asText(comparison.beforeLabel) || 'Antes',
          afterLabel: asText(comparison.afterLabel) || 'Depois',
        });
        setGallery(asAssets(record.images));
        setThumbnail(firstAsset(record.thumbnailImage));
        setFeatured(firstAsset(record.featuredImage));
        setEditorialMedia(mediaAsset(record.editorialMedia));
        setBenefitsMainMedia(mediaAsset(record.benefitsMainMedia));
        setUsageMainMedia(mediaAsset(record.usageMedia));
        setResultBefore(firstAsset(comparison.before));
        setResultAfter(firstAsset(comparison.after));
      })
      .catch((error: any) => {
        if (!active) return;
        setMessage({
          text: error?.response?.data?.error?.message || copy.loadError,
          error: true,
        });
      })
      .finally(() => {
        if (active) setLoadingProduct(false);
      });
    return () => {
      active = false;
    };
  }, [contentLocale, copy.loadError, documentId, get]);
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const updateName = (value: string) =>
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        current.slug && current.slug !== slugify(current.name)
          ? current.slug
          : slugify(value),
    }));
  const pendingFor = (scope: string) =>
    pendingUploads.filter((item) => item.scope === scope);
  const upload = async (files: FileList | File[] | null, scope: string) => {
    if (!files?.length || uploading) return [];
    const selected = Array.from(files);
    const batch = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const pending = selected.map((file, index) => {
      let previewUrl: string | null = null;
      try {
        previewUrl = URL.createObjectURL(file);
      } catch {
        previewUrl = null;
      }
      return {
        id: `${batch}-${index}`,
        scope,
        name: file.name,
        previewUrl,
        progress: 0,
      };
    });
    const pendingIds = new Set(pending.map((item) => item.id));
    setPendingUploads((current) => [...current, ...pending]);
    setUploading(true);
    setMessage(null);
    try {
      const data = new FormData();
      selected.forEach((file) => data.append('files', file));
      const response = await post<Asset[]>('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event: { loaded: number; total?: number }) => {
          const calculated =
            event.total && event.total > 0
              ? Math.round((event.loaded / event.total) * 100)
              : 45;
          const progress = Number.isFinite(calculated)
            ? Math.max(0, Math.min(95, calculated))
            : 0;
          setPendingUploads((current) =>
            current.map((item) =>
              pendingIds.has(item.id) ? { ...item, progress } : item,
            ),
          );
        },
      });
      const uploaded = Array.isArray(response.data) ? response.data : [];
      if (!uploaded.length)
        throw new Error('A resposta do upload não contém imagens.');
      setPendingUploads((current) =>
        current.map((item) =>
          pendingIds.has(item.id) ? { ...item, progress: 100 } : item,
        ),
      );
      await new Promise((resolve) => setTimeout(resolve, 180));
      return uploaded;
    } catch {
      setMessage({ text: copy.uploadError, error: true });
      return [];
    } finally {
      pending.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setPendingUploads((current) =>
        current.filter((item) => !pendingIds.has(item.id)),
      );
      setUploading(false);
    }
  };
  const assetSetter = (kind: UploadKind) =>
    kind === 'gallery'
      ? setGallery
      : kind === 'thumbnail'
        ? setThumbnail
        : kind === 'featured'
          ? setFeatured
          : kind === 'editorial'
            ? setEditorialMedia
            : kind === 'benefits-main'
              ? setBenefitsMainMedia
              : kind === 'usage-main'
                ? setUsageMainMedia
                : kind === 'result-before'
                  ? setResultBefore
                  : setResultAfter;
  const addAssets = async (kind: UploadKind, files: FileList | null) => {
    const uploaded = await upload(files, kind);
    if (!uploaded.length) return;
    const setter = assetSetter(kind);
    setter((current) =>
      kind === 'gallery' ? [...current, ...uploaded] : uploaded.slice(0, 1),
    );
  };
  const replaceAsset = async (
    kind: UploadKind,
    index: number,
    files: FileList | null,
  ) => {
    const uploaded = await upload(files, kind);
    if (!uploaded.length) return;
    const setter = assetSetter(kind);
    setter((current) =>
      current.map((asset, assetIndex) =>
        assetIndex === index ? uploaded[0] : asset,
      ),
    );
  };
  const removeAsset = (kind: UploadKind, index: number) => {
    const setter = assetSetter(kind);
    setter((current) =>
      current.filter((_, assetIndex) => assetIndex !== index),
    );
  };
  const addBenefitImages = async (index: number, files: FileList | null) => {
    const remaining = Math.max(0, 3 - form.benefits[index].images.length);
    if (!remaining) {
      setMessage({ text: copy.benefitImageLimit, error: true });
      return;
    }
    const selected = Array.from(files ?? []);
    const exceedsLimit = selected.length > remaining;
    const uploaded = await upload(
      selected.slice(0, remaining),
      `benefit-${index}`,
    );
    if (!uploaded.length) return;
    setField(
      'benefits',
      form.benefits.map((benefit, itemIndex) =>
        itemIndex === index
          ? { ...benefit, images: [...benefit.images, ...uploaded].slice(0, 3) }
          : benefit,
      ),
    );
    if (exceedsLimit) setMessage({ text: copy.benefitImageLimit, error: true });
  };
  const replaceBenefitImage = async (
    benefitIndex: number,
    imageIndex: number,
    files: FileList | null,
  ) => {
    const uploaded = await upload(files, `benefit-${benefitIndex}`);
    if (!uploaded.length) return;
    setField(
      'benefits',
      form.benefits.map((benefit, itemIndex) =>
        itemIndex === benefitIndex
          ? {
              ...benefit,
              images: benefit.images.map((image, currentImageIndex) =>
                currentImageIndex === imageIndex ? uploaded[0] : image,
              ),
            }
          : benefit,
      ),
    );
  };
  const removeBenefitImage = (benefitIndex: number, imageIndex: number) =>
    setField(
      'benefits',
      form.benefits.map((benefit, itemIndex) =>
        itemIndex === benefitIndex
          ? {
              ...benefit,
              images: benefit.images.filter(
                (_, currentImageIndex) => currentImageIndex !== imageIndex,
              ),
            }
          : benefit,
      ),
    );

  const validateStep = (target: Step) => {
    if (
      target === 1 &&
      (!form.name.trim() ||
        !form.category ||
        !form.slug.trim() ||
        !form.description.trim() ||
        !form.sku.trim() ||
        form.priceAoa === '' ||
        form.priceEur === '' ||
        !form.availability)
    ) {
      setMessage({ text: copy.required, error: true });
      return false;
    }
    if (target === 2 && (gallery.length < 5 || thumbnail.length === 0)) {
      setMessage({ text: copy.imageRequired, error: true });
      return false;
    }
    if (target === 4 && resultBefore.length > 0 !== resultAfter.length > 0) {
      setMessage({ text: copy.comparisonRequired, error: true });
      return false;
    }
    setMessage(null);
    return true;
  };
  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(5, current + 1) as Step);
  };
  const goTo = (target: Step) => {
    for (let current = 1; current < target; current += 1) {
      if (!validateStep(current as Step)) return;
    }
    setStep(target);
  };

  const relationPayload = (
    key: string,
    values: string[],
    source: RelationEntry[],
  ) => {
    const previous = originalRelations[key] ?? [];
    return {
      connect: values
        .filter((value) => !previous.includes(value))
        .map((value) => connection(value, source))
        .filter(Boolean),
      disconnect: previous
        .filter((value) => !values.includes(value))
        .map((value) => connection(value, source))
        .filter(Boolean),
    };
  };
  const buildPayload = () => {
    const category = connection(form.category, relations.categories);
    const previousCategory = originalRelations.category[0];
    const payload: Record<string, unknown> = {
      locale: contentLocale,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      additionalDescription: form.additionalDescription.trim() || null,
      sku: form.sku.trim(),
      commerce: {
        prices: { aoa: Number(form.priceAoa), eur: Number(form.priceEur) },
        availability: form.availability,
        stock: Number(form.stock || 0),
        badge: {
          type: form.badge,
          percentage:
            form.badge === 'discount' ? Number(form.discount || 0) : null,
        },
      },
      images: gallery.map((asset) => asset.id),
      thumbnailImage: thumbnail[0]?.id,
      featuredImage: featured[0]?.id ?? null,
      category: {
        connect:
          category && form.category !== previousCategory ? [category] : [],
        disconnect:
          previousCategory && previousCategory !== form.category
            ? [connection(previousCategory, relations.categories)].filter(
                Boolean,
              )
            : [],
      },
      sizes: relationPayload(
        'sizes',
        form.linkSizes ? form.sizes : [],
        relations.sizes,
      ),
      ingredients: relationPayload(
        'ingredients',
        form.linkIngredients ? form.ingredients : [],
        relations.ingredients,
      ),
      collections: relationPayload(
        'collections',
        form.linkCollections ? form.collections : [],
        relations.collections,
      ),
      kits: relationPayload(
        'kits',
        form.linkKits ? form.kits : [],
        relations.kits,
      ),
      highlights: form.highlights
        .filter((text) => text.trim())
        .map((text, index) => ({ order: index, title: text.trim() })),
      benefits: form.benefits
        .filter((item) => item.title.trim() && item.description.trim())
        .map((item, index) => ({
          order: index,
          title: item.title.trim(),
          description: item.description.trim(),
          images: item.images.slice(0, 3).map((image) => image.id),
        })),
      benefitsMainMedia: preservedMediaPayload(
        originalProduct?.benefitsMainMedia,
        benefitsMainMedia[0],
        `Benefícios de ${form.name.trim()}`,
      ),
      editorialEnabled: form.editorialEnabled,
      editorial:
        form.editorialHeadline.trim() && form.editorialDescription.trim()
          ? {
              headline: form.editorialHeadline.trim(),
              description: form.editorialDescription.trim(),
              footnote: form.editorialFootnote.trim() || null,
            }
          : null,
      editorialMedia: preservedMediaPayload(
        originalProduct?.editorialMedia,
        editorialMedia[0],
        form.name.trim(),
      ),
      galleryEditorialEnabled: form.galleryEditorialEnabled,
      galleryEditorial: optionalCopy(
        form.galleryHeadline,
        form.galleryDescription,
      ),
      usageSteps: form.usageSteps
        .filter((item) => item.name.trim() && item.description.trim())
        .map((item, index) => ({
          order: index + 1,
          name: item.name.trim(),
          description: item.description.trim(),
        })),
      usageMedia: preservedMediaPayload(
        originalProduct?.usageMedia,
        usageMainMedia[0],
        `Como utilizar ${form.name.trim()}`,
      ),
      results:
        form.resultsDescription.trim() ||
        form.resultStatistics.some(
          (item) => item.percentage !== '' && item.description.trim(),
        ) ||
        resultBefore.length ||
        resultAfter.length
          ? {
              description: form.resultsDescription.trim() || null,
              statistics: form.resultStatistics
                .filter(
                  (item) => item.percentage !== '' && item.description.trim(),
                )
                .map((item) => ({
                  percentage: Number(item.percentage),
                  description: item.description.trim(),
                })),
              comparison:
                resultBefore[0] && resultAfter[0]
                  ? {
                      before: resultBefore[0].id,
                      after: resultAfter[0].id,
                      beforeLabel: form.beforeLabel.trim() || 'Antes',
                      afterLabel: form.afterLabel.trim() || 'Depois',
                    }
                  : null,
            }
          : null,
    };
    return payload;
  };
  const save = async (status: 'draft' | 'published') => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) return;
    setSaving(true);
    setMessage(null);
    try {
      const base = contentLink('api::product.product');
      const payload = { ...buildPayload(), status };
      const response =
        editing && documentId
          ? status === 'published'
            ? await post<ProductResponse>(
                `${base}/${documentId}/actions/publish`,
                payload,
              )
            : await put<ProductResponse>(`${base}/${documentId}`, payload)
          : status === 'published'
            ? await post<ProductResponse>(`${base}/actions/publish`, payload)
            : await post<ProductResponse>(base, payload);
      const savedDocumentId = response.data?.data?.documentId ?? documentId;
      if (editing) {
        setOriginalRelations({
          category: form.category ? [form.category] : [],
          sizes: [...form.sizes],
          ingredients: [...form.ingredients],
          collections: [...form.collections],
          kits: [...form.kits],
        });
        if (response.data?.data) setOriginalProduct(response.data.data);
      }
      setMessage({ text: copy.saved, error: false });
      if (!editing && savedDocumentId)
        navigate(
          `/store/products/${savedDocumentId}/edit?locale=${contentLocale}`,
          { replace: true },
        );
    } catch (error: any) {
      const detail = error?.response?.data?.error?.message || copy.saveError;
      setMessage({ text: detail, error: true });
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    'Utilizador';
  const role = user?.roles?.[0]?.name || 'Admin';
  const steps = [
    copy.product,
    copy.images,
    copy.benefits,
    copy.content,
    copy.summary,
  ];

  const productStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Informações do produto</h2>
          <p>
            Tudo o que define o que é o produto e como ele é comercializado.
          </p>
        </SectionTitle>
        <Field>
          Nome do produto <Required />
          <Input
            value={form.name}
            onChange={(e) => updateName(e.target.value)}
            placeholder="Insira o nome do produto"
            autoFocus
          />
        </Field>
        <Field as="div">
          Categoria do produto <Required />
          <StoreSelect
            value={form.category}
            onChange={(value) => setField('category', value)}
            placeholder="Selecione a categoria principal"
            loadError={relationErrors.includes('categories')}
            options={relations.categories.map((item) => ({
              value: relationValue(item),
              label: displayName(item),
            }))}
          />
          <small>Selecione a categoria principal do produto.</small>
        </Field>
        <Field>
          Endereço da página do produto <Required />
          <Input
            value={form.slug}
            onChange={(e) => setField('slug', slugify(e.target.value))}
            placeholder="ex.: creme-hidratante"
          />
          <small>
            Gerado automaticamente a partir do nome e utilizado no endereço da
            página. Pode ser ajustado manualmente.
          </small>
        </Field>
        <Field>
          Descrição breve <Required />
          <Textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Descreva o produto de forma clara e breve"
          />
        </Field>
        <Field>
          Mais detalhes sobre o produto
          <Textarea
            value={form.additionalDescription}
            onChange={(e) => setField('additionalDescription', e.target.value)}
            placeholder="Adicione informações complementares"
          />
          <small>Resumo apresentado junto ao nome e ao preço.</small>
        </Field>
        <Field>
          Código interno (SKU) <Required />
          <Input
            value={form.sku}
            disabled={editing}
            onChange={(e) => setField('sku', e.target.value.toUpperCase())}
            placeholder="ex.: REF223-394-2342"
          />
          <small>
            {editing
              ? 'Este código identifica o produto e não pode ser alterado depois do cadastro.'
              : 'Código único utilizado para identificar o produto no stock.'}
          </small>
        </Field>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Preço e disponibilidade</h2>
        </SectionTitle>
        <Inline>
          <Field>
            Preço em kwanzas <Required />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.priceAoa}
              onChange={(e) => setField('priceAoa', e.target.value)}
              placeholder="Kz 0,00"
            />
          </Field>
          <Field>
            Preço em euros <Required />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.priceEur}
              onChange={(e) => setField('priceEur', e.target.value)}
              placeholder="€ 0,00"
            />
          </Field>
        </Inline>
        <Field as="div">
          Disponibilidade <Required />
          <StoreSelect
            value={form.availability}
            onChange={(value) => setField('availability', value)}
            placeholder="Selecione a disponibilidade"
            options={[
              { value: 'in-stock', label: 'Disponível para compra' },
              { value: 'coming-soon', label: 'Disponível em breve' },
              { value: 'out-of-stock', label: 'Indisponível' },
            ]}
          />
        </Field>
        <Field>
          Quantidade em stock
          <Input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setField('stock', e.target.value)}
          />
        </Field>
        <Field as="div">
          Etiqueta apresentada no produto
          <StoreSelect
            value={form.badge}
            onChange={(value) => setField('badge', value)}
            placeholder="Selecione a etiqueta"
            options={[
              { value: 'none', label: 'Sem etiqueta' },
              { value: 'discount', label: 'Produto com desconto' },
              { value: 'new', label: 'Novo produto' },
              { value: 'coming-soon', label: 'Disponível em breve' },
            ]}
          />
        </Field>
        {form.badge === 'discount' && (
          <Field>
            Percentagem de desconto
            <Input
              type="number"
              min="0"
              max="100"
              value={form.discount}
              onChange={(e) => setField('discount', e.target.value)}
              placeholder="% 0"
            />
            <small>Percentagem apresentada aos clientes.</small>
          </Field>
        )}
      </Section>
      <Section>
        <SectionTitle>
          <h2>Características do produto</h2>
        </SectionTitle>
        <OptionalRelationField
          checked={form.linkSizes}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              linkSizes: checked,
              sizes: checked ? current.sizes : [],
            }))
          }
          title="Adicionar tamanhos agora?"
          help="Pode publicar o produto e configurar os tamanhos mais tarde."
        >
          <MultiSelect
            label="Tamanhos disponíveis"
            values={form.sizes}
            options={relations.sizes}
            loadError={relationErrors.includes('sizes')}
            onChange={(value) => setField('sizes', value)}
            help="Selecione todas as apresentações que podem ser compradas."
          />
        </OptionalRelationField>
        <OptionalRelationField
          checked={form.linkIngredients}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              linkIngredients: checked,
              ingredients: checked ? current.ingredients : [],
            }))
          }
          title="Adicionar ingredientes agora?"
          help="Pode completar a composição do produto noutra altura."
        >
          <MultiSelect
            label="Ingredientes principais"
            values={form.ingredients}
            options={relations.ingredients}
            loadError={relationErrors.includes('ingredients')}
            onChange={(value) => setField('ingredients', value)}
            help="Relacione os principais ingredientes da fórmula."
          />
        </OptionalRelationField>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Organização</h2>
        </SectionTitle>
        <OptionalRelationField
          checked={form.linkCollections}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              linkCollections: checked,
              collections: checked ? current.collections : [],
            }))
          }
          title="Vincular a coleções agora?"
          help="Ative se este produto já fizer parte de alguma coleção."
        >
          <MultiSelect
            label="Coleções"
            values={form.collections}
            options={relations.collections}
            loadError={relationErrors.includes('collections')}
            onChange={(value) => setField('collections', value)}
            help="Selecione as coleções às quais este produto pertence."
          />
        </OptionalRelationField>
        <OptionalRelationField
          checked={form.linkKits}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              linkKits: checked,
              kits: checked ? current.kits : [],
            }))
          }
          title="Vincular a kits agora?"
          help="Ative se este produto já fizer parte de algum kit."
        >
          <MultiSelect
            label="Kits de produtos"
            values={form.kits}
            options={relations.kits}
            loadError={relationErrors.includes('kits')}
            onChange={(value) => setField('kits', value)}
            help="Selecione os kits que incluem este produto."
          />
        </OptionalRelationField>
      </Section>
    </FormColumn>
  );

  const imagesStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Imagens principais</h2>
        </SectionTitle>
        <UploadArea
          title={`Imagens principais (${gallery.length})`}
          required
          multiple
          assets={gallery}
          pending={pendingFor('gallery')}
          onFiles={(files) => void addAssets('gallery', files)}
          onRemove={(index) => removeAsset('gallery', index)}
          onReplace={(index, files) =>
            void replaceAsset('gallery', index, files)
          }
          help="Adicione no mínimo cinco imagens. A primeira será a imagem inicial do produto."
        />
      </Section>
      <Section>
        <SectionTitle>
          <h2>Miniatura</h2>
        </SectionTitle>
        <UploadArea
          title="Imagem de miniatura"
          required
          assets={thumbnail}
          pending={pendingFor('thumbnail')}
          onFiles={(files) => void addAssets('thumbnail', files)}
          onRemove={(index) => removeAsset('thumbnail', index)}
          onReplace={(index, files) =>
            void replaceAsset('thumbnail', index, files)
          }
          help="Imagem pequena utilizada nos menus e listas compactas."
        />
      </Section>
      <Section>
        <SectionTitle>
          <h2>Destaques</h2>
        </SectionTitle>
        <UploadArea
          title="Imagem principal de destaque"
          assets={featured}
          pending={pendingFor('featured')}
          onFiles={(files) => void addAssets('featured', files)}
          onRemove={(index) => removeAsset('featured', index)}
          onReplace={(index, files) =>
            void replaceAsset('featured', index, files)
          }
          help="Imagem utilizada nos cards e nas áreas de destaque."
        />
      </Section>
    </FormColumn>
  );

  const benefitsStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Principais características</h2>
          <p>
            Apresente os pontos essenciais que ajudam o cliente a compreender o
            produto.
          </p>
        </SectionTitle>
        {form.highlights.map((value, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Característica {index + 1}</strong>
              {form.highlights.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'highlights',
                      form.highlights.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remover
                </button>
              )}
            </RepeatHeader>
            <Field>
              Texto
              <Input
                value={value}
                onChange={(e) =>
                  setField(
                    'highlights',
                    form.highlights.map((item, itemIndex) =>
                      itemIndex === index ? e.target.value : item,
                    ),
                  )
                }
                placeholder="Ex.: Hidratação intensa"
              />
            </Field>
          </Repeatable>
        ))}
        <SmallButton
          type="button"
          onClick={() => setField('highlights', [...form.highlights, ''])}
        >
          + Adicionar característica
        </SmallButton>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Apresentação dos benefícios</h2>
          <p>
            Esta é a imagem principal apresentada na seção de benefícios da
            página do produto.
          </p>
        </SectionTitle>
        <UploadArea
          title="Imagem principal dos benefícios"
          assets={benefitsMainMedia}
          pending={pendingFor('benefits-main')}
          onFiles={(files) => void addAssets('benefits-main', files)}
          onRemove={(index) => removeAsset('benefits-main', index)}
          onReplace={(index, files) =>
            void replaceAsset('benefits-main', index, files)
          }
          help="Utilize uma imagem que represente o resultado geral ou a aplicação do produto."
        />
      </Section>
      <Section>
        <SectionTitle>
          <h2>Benefícios do produto</h2>
          <p>
            Explique o que o cliente pode esperar e, quando necessário, adicione
            imagens próprias de cada benefício.
          </p>
        </SectionTitle>
        {form.benefits.map((benefit, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Benefício {index + 1}</strong>
              {form.benefits.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'benefits',
                      form.benefits.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remover
                </button>
              )}
            </RepeatHeader>
            <Field>
              Título
              <Input
                value={benefit.title}
                onChange={(e) =>
                  setField(
                    'benefits',
                    form.benefits.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, title: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Nome do benefício"
              />
            </Field>
            <Field>
              Descrição
              <Textarea
                value={benefit.description}
                onChange={(e) =>
                  setField(
                    'benefits',
                    form.benefits.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, description: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Explique o benefício para o cliente"
              />
            </Field>
            <UploadArea
              title={`Imagens deste benefício (${benefit.images.length}/3)`}
              multiple
              maxAssets={3}
              assets={benefit.images}
              pending={pendingFor(`benefit-${index}`)}
              onFiles={(files) => void addBenefitImages(index, files)}
              onRemove={(imageIndex) => removeBenefitImage(index, imageIndex)}
              onReplace={(imageIndex, files) =>
                void replaceBenefitImage(index, imageIndex, files)
              }
              help="Opcional. Adicione até 3 imagens para este benefício."
            />
          </Repeatable>
        ))}
        <SmallButton
          type="button"
          onClick={() =>
            setField('benefits', [
              ...form.benefits,
              { title: '', description: '', images: [] },
            ])
          }
        >
          + Adicionar benefício
        </SmallButton>
      </Section>
    </FormColumn>
  );

  const marketingValues: MarketingResourceValues = {
    name: form.name,
    priceAoa: form.priceAoa,
    editorialEnabled: form.editorialEnabled,
    editorialHeadline: form.editorialHeadline,
    editorialDescription: form.editorialDescription,
    editorialFootnote: form.editorialFootnote,
    galleryEditorialEnabled: form.galleryEditorialEnabled,
    galleryHeadline: form.galleryHeadline,
    galleryDescription: form.galleryDescription,
  };
  const updateMarketing = <K extends keyof MarketingResourceValues>(
    key: K,
    value: MarketingResourceValues[K],
  ) => {
    if (key === 'name' || key === 'priceAoa') return;
    setField(key as keyof ProductForm, value as ProductForm[keyof ProductForm]);
  };
  const contentStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Recursos de marketing</h2>
          <p>
            Configure apenas as apresentações que pretende utilizar para
            promover este produto no site.
          </p>
        </SectionTitle>
        <ProductMarketingResources
          values={marketingValues}
          productImages={gallery}
          editorialMedia={editorialMedia}
          pendingEditorialMedia={pendingFor('editorial')}
          uploading={uploading}
          onChange={updateMarketing}
          onEditorialMedia={(files) => void addAssets('editorial', files)}
          onRemoveEditorialMedia={() => removeAsset('editorial', 0)}
        />
      </Section>
      <Section>
        <SectionTitle>
          <h2>Como usar</h2>
          <p>Estas informações pertencem à página de detalhes do produto.</p>
        </SectionTitle>
        <UploadArea
          title="Imagem principal de como usar"
          assets={usageMainMedia}
          pending={pendingFor('usage-main')}
          onFiles={(files) => void addAssets('usage-main', files)}
          onRemove={(index) => removeAsset('usage-main', index)}
          onReplace={(index, files) =>
            void replaceAsset('usage-main', index, files)
          }
          help="Imagem apresentada ao centro da seção, junto aos passos de utilização."
        />
        {form.usageSteps.map((item, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Passo {index + 1}</strong>
              {form.usageSteps.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'usageSteps',
                      form.usageSteps.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remover
                </button>
              )}
            </RepeatHeader>
            <Field>
              Nome do passo
              <Input
                value={item.name}
                onChange={(e) =>
                  setField(
                    'usageSteps',
                    form.usageSteps.map((stepItem, itemIndex) =>
                      itemIndex === index
                        ? { ...stepItem, name: e.target.value }
                        : stepItem,
                    ),
                  )
                }
                placeholder="Ex.: Aplicar"
              />
            </Field>
            <Field>
              Instrução
              <Textarea
                value={item.description}
                onChange={(e) =>
                  setField(
                    'usageSteps',
                    form.usageSteps.map((stepItem, itemIndex) =>
                      itemIndex === index
                        ? { ...stepItem, description: e.target.value }
                        : stepItem,
                    ),
                  )
                }
                placeholder="Explique como realizar este passo"
              />
            </Field>
          </Repeatable>
        ))}
        <SmallButton
          type="button"
          onClick={() =>
            setField('usageSteps', [
              ...form.usageSteps,
              { name: '', description: '' },
            ])
          }
        >
          + Adicionar passo
        </SmallButton>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Resultados</h2>
          <p>
            Apresente a explicação, os números observados e a comparação visual
            do antes e depois.
          </p>
        </SectionTitle>
        <Field>
          Descrição geral dos resultados
          <Textarea
            value={form.resultsDescription}
            onChange={(e) => setField('resultsDescription', e.target.value)}
            placeholder="Descreva os resultados esperados ou observados"
          />
        </Field>
        {form.resultStatistics.map((statistic, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Dado estatístico {index + 1}</strong>
              {form.resultStatistics.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'resultStatistics',
                      form.resultStatistics.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remover
                </button>
              )}
            </RepeatHeader>
            <Field>
              Percentagem observada
              <Input
                type="number"
                min="0"
                max="100"
                value={statistic.percentage}
                onChange={(e) =>
                  setField(
                    'resultStatistics',
                    form.resultStatistics.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, percentage: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Ex.: 95"
              />
              <small>Insira apenas o número, entre 0 e 100.</small>
            </Field>
            <Field>
              Descrição do número
              <Textarea
                value={statistic.description}
                onChange={(e) =>
                  setField(
                    'resultStatistics',
                    form.resultStatistics.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, description: e.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Ex.: das pessoas sentiram a pele mais hidratada"
              />
            </Field>
          </Repeatable>
        ))}
        <SmallButton
          type="button"
          onClick={() =>
            setField('resultStatistics', [
              ...form.resultStatistics,
              { percentage: '', description: '' },
            ])
          }
        >
          + Adicionar dado estatístico
        </SmallButton>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Comparação antes e depois</h2>
          <p>
            As duas imagens são necessárias para apresentar a comparação no
            site.
          </p>
        </SectionTitle>
        <Inline>
          <Field>
            Texto da imagem de antes
            <Input
              value={form.beforeLabel}
              onChange={(e) => setField('beforeLabel', e.target.value)}
              placeholder="Antes"
            />
          </Field>
          <Field>
            Texto da imagem de depois
            <Input
              value={form.afterLabel}
              onChange={(e) => setField('afterLabel', e.target.value)}
              placeholder="Depois"
            />
          </Field>
        </Inline>
        <UploadArea
          title="Imagem de antes"
          assets={resultBefore}
          pending={pendingFor('result-before')}
          onFiles={(files) => void addAssets('result-before', files)}
          onRemove={(index) => removeAsset('result-before', index)}
          onReplace={(index, files) =>
            void replaceAsset('result-before', index, files)
          }
          help="Imagem captada antes da utilização do produto."
        />
        <UploadArea
          title="Imagem de depois"
          assets={resultAfter}
          pending={pendingFor('result-after')}
          onFiles={(files) => void addAssets('result-after', files)}
          onRemove={(index) => removeAsset('result-after', index)}
          onReplace={(index, files) =>
            void replaceAsset('result-after', index, files)
          }
          help="Imagem captada depois da utilização do produto."
        />
      </Section>
    </FormColumn>
  );

  const summaryStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Confirme os dados do produto</h2>
          <p>Reveja as informações antes de guardar ou publicar.</p>
        </SectionTitle>
        <SummaryGrid>
          <div>
            <dt>Produto</dt>
            <dd>{form.name || 'Não informado'}</dd>
          </div>
          <div>
            <dt>SKU</dt>
            <dd>{form.sku || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Endereço</dt>
            <dd>/{form.slug || 'não-informado'}</dd>
          </div>
          <div>
            <dt>Preço</dt>
            <dd>
              {Number(form.priceAoa || 0).toLocaleString('pt-AO')} Kz · €{' '}
              {Number(form.priceEur || 0).toFixed(2)}
            </dd>
          </div>
          <div>
            <dt>Imagens</dt>
            <dd>
              {gallery.length} na galeria ·{' '}
              {thumbnail.length ? 'Miniatura definida' : 'Sem miniatura'}
            </dd>
          </div>
          <div>
            <dt>Página de detalhes</dt>
            <dd>
              {form.benefits.filter((item) => item.title.trim()).length}{' '}
              benefícios ·{' '}
              {form.usageSteps.filter((item) => item.name.trim()).length} passos
            </dd>
          </div>
          <div>
            <dt>Recursos de marketing</dt>
            <dd>
              {form.editorialEnabled
                ? 'Apresentação editorial ativa'
                : 'Apresentação editorial inativa'}{' '}
              ·{' '}
              {form.galleryEditorialEnabled
                ? 'Galeria editorial ativa'
                : 'Galeria editorial inativa'}
            </dd>
          </div>
        </SummaryGrid>
      </Section>
      <Inline>
        <NavButton
          type="button"
          disabled={saving || uploading}
          onClick={() => void save('draft')}
        >
          {saving ? copy.updating : editing ? copy.update : copy.draft}
          <span>↗</span>
        </NavButton>
        <NavButton
          type="button"
          $primary
          disabled={saving || uploading}
          onClick={() => void save('published')}
        >
          {saving ? 'A publicar…' : copy.publish}
          <span>→</span>
        </NavButton>
      </Inline>
    </FormColumn>
  );

  const contents: Record<Step, ReactNode> = {
    1: productStep,
    2: imagesStep,
    3: benefitsStep,
    4: contentStep,
    5: summaryStep,
  };
  const productUnavailable = editing && !loadingProduct && !originalProduct;
  return (
    <Shell labelledBy="product-form-title">
      <StoreLayout>
        <StoreSidebar activeHref={productListLink} />
        <StorePage>
          <Topbar>
            <BackLink to={productListLink}>
              <span aria-hidden>←</span>
              {copy.back}
            </BackLink>
            <TopActions>
              <Language to="/store/profile">
                <span>{language === 'fr' ? 'FR / €' : 'PT / €'}</span>
                <img src={iconPath('language')} alt="" aria-hidden />
              </Language>
              <AdminProfileMenu />
            </TopActions>
          </Topbar>
          <Workspace>
            <Title id="product-form-title">
              {editing ? copy.editTitle : copy.title}
            </Title>
            <Stepper aria-label="Etapas do formulário">
              {steps.map((label, index) => {
                const number = (index + 1) as Step;
                return (
                  <StepItem key={label}>
                    <StepButton
                      type="button"
                      disabled={loadingProduct || productUnavailable}
                      $active={step === number}
                      $done={step > number}
                      onClick={() => goTo(number)}
                    >
                      <span>{step > number ? '✓' : number}</span>
                      {label}
                    </StepButton>
                  </StepItem>
                );
              })}
            </Stepper>
            {message && (
              <Notice
                $error={message.error}
                role={message.error ? 'alert' : 'status'}
              >
                {message.text}
              </Notice>
            )}
            <Card ref={cardRef}>
              {loadingProduct ? (
                <Notice>{copy.loading}</Notice>
              ) : productUnavailable ? null : (
                <>{contents[step]}</>
              )}
            </Card>
            {!productUnavailable && (
              <Footer>
                <NavButton
                  type="button"
                  disabled={step === 1 || saving || loadingProduct}
                  onClick={() =>
                    setStep((current) => Math.max(1, current - 1) as Step)
                  }
                >
                  <span>←</span>
                  {copy.previous}
                </NavButton>
                {step < 5 ? (
                  <NavButton
                    type="button"
                    $primary
                    disabled={uploading || loadingProduct}
                    onClick={goNext}
                  >
                    {copy.next}
                    <span>→</span>
                  </NavButton>
                ) : (
                  <NavButton
                    type="button"
                    $primary
                    disabled={saving || uploading || loadingProduct}
                    onClick={() => void save('published')}
                  >
                    {saving ? 'A publicar…' : copy.publish}
                    <span>→</span>
                  </NavButton>
                )}
              </Footer>
            )}
          </Workspace>
        </StorePage>
      </StoreLayout>
    </Shell>
  );
}
