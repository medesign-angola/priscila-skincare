import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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
import { StoreSelect, StoreSelectShell } from '../components/StoreSelect';
import { MediaFocalPointPicker } from '../components/MediaFocalPointPicker';
import { OptionalRelationField } from '../components/OptionalRelationField';

type Kind = 'kit' | 'collection' | 'ingredient';
type Asset = {
  id: number;
  url: string;
  name: string;
  mime?: string;
  alternativeText?: string | null;
};
type PendingUpload = {
  id: string;
  scope: string;
  name: string;
  previewUrl: string | null;
  progress: number;
};
type RelationEntry = {
  id?: number;
  documentId?: string;
  name?: string;
  title?: string;
  label?: string;
  locale?: string;
};
type EntryRecord = Record<string, any> & { documentId?: string };
type EntryResponse = { data?: EntryRecord };
type RelationResponse = { results?: RelationEntry[] };
type UsageStep = { name: string; description: string };
type Statistic = { percentage: string; description: string };
type FormValues = {
  name: string;
  slug: string;
  description: string;
  products: string[];
  relatedProducts: string[];
  linkProducts: boolean;
  linkRelatedProducts: boolean;
  includePrices: boolean;
  priceAoa: string;
  priceEur: string;
  homeEnabled: boolean;
  homeOrder: string;
  homeTitle: string;
  homeDescription: string;
  homeFootnote: string;
  finderDescription: string;
  heroAlt: string;
  heroMediaMode: 'image' | 'video';
  heroFocalX: string;
  heroFocalY: string;
  heroObjectFit: string;
  heroNoise: boolean;
  usageAlt: string;
  usageMediaMode: 'image' | 'video';
  usageFocalX: string;
  usageFocalY: string;
  usageObjectFit: string;
  usageNoise: boolean;
  usageSteps: UsageStep[];
  resultsDescription: string;
  statistics: Statistic[];
  beforeLabel: string;
  afterLabel: string;
};

const initialForm: FormValues = {
  name: '',
  slug: '',
  description: '',
  products: [],
  relatedProducts: [],
  linkProducts: false,
  linkRelatedProducts: false,
  includePrices: false,
  priceAoa: '',
  priceEur: '',
  homeEnabled: false,
  homeOrder: '1',
  homeTitle: '',
  homeDescription: '',
  homeFootnote: '',
  finderDescription: '',
  heroAlt: '',
  heroMediaMode: 'image',
  heroFocalX: '50',
  heroFocalY: '50',
  heroObjectFit: 'cover',
  heroNoise: false,
  usageAlt: '',
  usageMediaMode: 'image',
  usageFocalX: '50',
  usageFocalY: '50',
  usageObjectFit: 'cover',
  usageNoise: false,
  usageSteps: [{ name: '', description: '' }],
  resultsDescription: '',
  statistics: [{ percentage: '', description: '' }],
  beforeLabel: 'Antes',
  afterLabel: 'Depois',
};

const kindConfig = {
  kit: {
    resource: 'kits',
    uid: 'api::kit.kit',
    singular: 'kit',
    title: 'Novo kit de produtos',
    editTitle: 'Editar kit de produtos',
    back: 'Kit de produtos',
    create: 'Criar kit de produtos',
  },
  collection: {
    resource: 'collections',
    uid: 'api::collection.collection',
    singular: 'coleção',
    title: 'Nova coleção',
    editTitle: 'Editar coleção',
    back: 'Coleções',
    create: 'Criar coleção',
  },
  ingredient: {
    resource: 'ingredients',
    uid: 'api::ingredient.ingredient',
    singular: 'ingrediente',
    title: 'Novo ingrediente',
    editTitle: 'Editar ingrediente',
    back: 'Ingredientes',
    create: 'Criar ingrediente',
  },
} as const;

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
  > textarea,
  > details,
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
const inputCss = `box-sizing:border-box;width:100%;min-height:48px;padding:11px 12px;border:1px solid rgba(0,0,0,.12);border-radius:10px;color:#1a1917;background:#f7f7f7;font:inherit;font-size:14px;outline:0;transition:border-color 160ms ease,box-shadow 160ms ease;&:focus{border-color:#8b7048;box-shadow:0 0 0 3px rgba(139,112,72,.12);}&::placeholder{color:#97928a;}`;
const Input = styled.input`
  ${inputCss}
`;
const Textarea = styled.textarea`
  ${inputCss}min-height:124px;
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
  &:hover {
    background: ${({ $primary }) => ($primary ? '#6f593d' : '#e5ded4')};
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
const InfoCallout = styled.div`
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid #dfd0b9;
  border-radius: 10px;
  color: #5f4d35;
  background: #fbf7f0;
  font-size: 14px;
  line-height: 1.55;
  strong {
    color: #3f3425;
    font-size: 15px;
  }
  p {
    margin: 0;
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
const AddButton = styled.button`
  justify-self: start;
  min-height: 40px;
  padding: 8px 14px;
  border: 1px solid #8b7048;
  border-radius: 9px;
  color: #7d6645;
  background: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;
const Summary = styled.dl`
  display: grid;
  gap: 0;
  margin: 0;
  div {
    display: grid;
    grid-template-columns: minmax(180px, 0.9fr) minmax(0, 1.2fr);
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
const RadioGroup = styled.div`
  display: flex;
  gap: 20px;
  label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-weight: 400;
  }
  input {
    accent-color: #8b7048;
  }
`;
const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 18px;
  border: 1px solid #e5ded4;
  border-radius: 10px;
  color: #2f303a;
  background: #faf9f7;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  span {
    display: grid;
    gap: 3px;
  }
  small {
    color: #8f887e;
    font-size: 12px;
    font-weight: 400;
  }
  input {
    width: 42px;
    height: 23px;
    appearance: none;
    border-radius: 999px;
    background: #d8d1c7;
    cursor: pointer;
    transition: background 180ms ease;
  }
  input::before {
    display: block;
    width: 17px;
    height: 17px;
    margin: 3px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    content: '';
    transition: transform 180ms ease;
  }
  input:checked {
    background: #8b7048;
  }
  input:checked::before {
    transform: translateX(19px);
  }
  input:focus-visible {
    outline: 3px solid rgba(139, 112, 72, 0.2);
    outline-offset: 2px;
  }
`;
const DropZone = styled.div`
  button {
    display: grid;
    width: 100%;
    min-height: 220px;
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
`;
const EmptyUpload = styled.span`
  display: grid;
  gap: 16px;
  place-items: center;
  color: #817b72;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  span:first-child {
    display: grid;
    width: 58px;
    height: 58px;
    place-items: center;
    border-radius: 50%;
    background: #f7f3ed;
    color: #8b7048;
    font-size: 24px;
  }
  b {
    padding: 8px 15px;
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
  border: 1px solid #eee9e2;
  border-radius: 10px;
  background: #fff;
  img,
  video {
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
  button {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 0;
    border-radius: 7px;
    color: #991b1b;
    background: #fef2f2;
    font: inherit;
    cursor: pointer;
  }
`;
const PendingRow = styled(AssetRow)`
  grid-template-columns: 64px minmax(0, 1fr);
  img {
    opacity: 0.7;
  }
`;
const Progress = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  span {
    font-size: 12px;
  }
`;
const Track = styled.div`
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1eee9;
`;
const Value = styled.div<{ $progress: number }>`
  width: ${({ $progress }) => $progress}%;
  height: 100%;
  border-radius: inherit;
  background: #8b7048;
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
function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';
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
function asAsset(value: unknown): Asset | null {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  const id = Number(entry.id);
  const url = typeof entry.url === 'string' ? entry.url : '';
  if (!Number.isFinite(id) || !url) return null;
  return {
    id,
    url,
    name: typeof entry.name === 'string' ? entry.name : `Ficheiro ${id}`,
    mime: typeof entry.mime === 'string' ? entry.mime : undefined,
    alternativeText:
      typeof entry.alternativeText === 'string' ? entry.alternativeText : null,
  };
}
function asAssets(value: unknown) {
  return (Array.isArray(value) ? value : [])
    .map(asAsset)
    .filter((asset): asset is Asset => Boolean(asset));
}
function firstAsset(value: unknown) {
  const asset = asAsset(value);
  return asset ? [asset] : [];
}
function mediaAssets(media: unknown, key: string) {
  return firstAsset((media as Record<string, unknown> | null)?.[key]);
}
function mediaPayload(
  assets: {
    desktop: Asset[];
    mobile: Asset[];
    video: Asset[];
    placeholder: Asset[];
  },
  form: { alt: string; x: string; y: string; fit: string; noise: boolean },
) {
  if (
    !assets.desktop[0] &&
    !assets.mobile[0] &&
    !assets.video[0] &&
    !assets.placeholder[0]
  )
    return null;
  return {
    desktopImage: assets.desktop[0]?.id ?? null,
    mobileImage: assets.mobile[0]?.id ?? null,
    video: assets.video[0]?.id ?? null,
    placeholder: assets.placeholder[0]?.id ?? null,
    alt: form.alt.trim() || null,
    focalPointX: Number(form.x || 50),
    focalPointY: Number(form.y || 50),
    objectFit: form.fit,
    hasNoise: form.noise,
  };
}

function FilePicker({
  children,
  multiple,
  accept = 'image/*',
  onFiles,
}: {
  children: ReactNode;
  multiple?: boolean;
  accept?: string;
  onFiles: (files: FileList | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <DropZone>
      <button
        type="button"
        onClick={() => {
          if (ref.current) {
            ref.current.value = '';
            ref.current.click();
          }
        }}
      >
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        aria-hidden
        onChange={(event) => onFiles(event.currentTarget.files)}
      />
    </DropZone>
  );
}

function MultiSelect({
  values,
  options,
  onChange,
  placeholder,
  loadError,
}: {
  values: string[];
  options: RelationEntry[];
  onChange: (values: string[]) => void;
  placeholder: string;
  loadError: boolean;
}) {
  const selected = options
    .filter((item) => values.includes(relationValue(item)))
    .map(displayName);
  return (
    <StoreSelectShell>
      <summary>
        {selected.length ? selected.join(', ') : placeholder}
        <span aria-hidden>⌄</span>
      </summary>
      <div role="listbox">
        {loadError ? (
          <label>
            Não foi possível carregar os produtos. Atualize a página.
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
          <label>Nenhum produto cadastrado</label>
        )}
      </div>
    </StoreSelectShell>
  );
}

function UploadField({
  title,
  required,
  assets,
  pending,
  multiple,
  accept,
  help,
  onFiles,
  onRemove,
}: {
  title: string;
  required?: boolean;
  assets: Asset[];
  pending: PendingUpload[];
  multiple?: boolean;
  accept?: string;
  help?: string;
  onFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Field as="div">
      <span>
        {title} {required && <Required />}
      </span>
      {assets.length || pending.length ? (
        <AssetList>
          {assets.map((asset, index) => (
            <AssetRow key={`${asset.id}-${index}`}>
              {asset.mime?.startsWith('video') ? (
                <video src={asset.url} />
              ) : (
                <img
                  src={asset.url}
                  alt={asset.alternativeText || asset.name}
                />
              )}
              <span>
                <strong>{asset.name}</strong>
                <small>ID: {asset.id}</small>
              </span>
              <button
                type="button"
                aria-label={`Remover ${asset.name}`}
                onClick={() => onRemove(index)}
              >
                ×
              </button>
            </AssetRow>
          ))}
          {pending.map((item) => (
            <PendingRow key={item.id} aria-busy="true">
              {item.previewUrl ? (
                <img src={item.previewUrl} alt="" />
              ) : (
                <span>▧</span>
              )}
              <span>
                <strong>{item.name}</strong>
                <Progress>
                  <Track>
                    <Value $progress={item.progress} />
                  </Track>
                  <span>{item.progress}%</span>
                </Progress>
              </span>
            </PendingRow>
          ))}
          {multiple && (
            <FilePicker multiple accept={accept} onFiles={onFiles}>
              <b>+ Adicionar outros ficheiros</b>
            </FilePicker>
          )}
        </AssetList>
      ) : (
        <FilePicker multiple={multiple} accept={accept} onFiles={onFiles}>
          <EmptyUpload>
            <span aria-hidden>{accept?.includes('video') ? '▣' : '▧'}</span>
            <span>Nenhum ficheiro adicionado.</span>
            <b>Adicionar</b>
          </EmptyUpload>
        </FilePicker>
      )}
      {help && <small>{help}</small>}
    </Field>
  );
}

export default function RichCatalogFormPage({ kind }: { kind: Kind }) {
  const config = kindConfig[kind];
  const bundle = kind !== 'ingredient';
  const steps = bundle
    ? ['Dados', 'Imagens', 'Conteúdo', 'Página inicial', 'Resumo']
    : ['Dados', 'Imagem', 'Resumo'];
  const { get, post, put } = useFetchClient();
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const { locale } = useIntl();
  const user = useAuth('RichCatalogFormPage', (state) => state.user);
  const language = locale.toLowerCase().startsWith('fr') ? 'fr' : 'pt';
  const contentLocale =
    searchParams.get('locale') ||
    searchParams.get('plugins[i18n][locale]') ||
    'pt';
  const editing = Boolean(documentId);
  const listLink = storeListLink(config.resource);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormValues>({
    ...initialForm,
    includePrices: kind === 'kit',
  });
  const [products, setProducts] = useState<RelationEntry[]>([]);
  const [originalRelations, setOriginalRelations] = useState({
    products: [] as string[],
    relatedProducts: [] as string[],
  });
  const [relationFailed, setRelationFailed] = useState(false);
  const [thumbnail, setThumbnail] = useState<Asset[]>([]);
  const [heroDesktop, setHeroDesktop] = useState<Asset[]>([]);
  const [heroMobile, setHeroMobile] = useState<Asset[]>([]);
  const [heroVideo, setHeroVideo] = useState<Asset[]>([]);
  const [heroPlaceholder, setHeroPlaceholder] = useState<Asset[]>([]);
  const [gallery, setGallery] = useState<Asset[]>([]);
  const [usageDesktop, setUsageDesktop] = useState<Asset[]>([]);
  const [usageMobile, setUsageMobile] = useState<Asset[]>([]);
  const [usageVideo, setUsageVideo] = useState<Asset[]>([]);
  const [usagePlaceholder, setUsagePlaceholder] = useState<Asset[]>([]);
  const [before, setBefore] = useState<Asset[]>([]);
  const [after, setAfter] = useState<Asset[]>([]);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const setters = useMemo(
    () => ({
      thumbnail: setThumbnail,
      heroDesktop: setHeroDesktop,
      heroMobile: setHeroMobile,
      heroVideo: setHeroVideo,
      heroPlaceholder: setHeroPlaceholder,
      gallery: setGallery,
      usageDesktop: setUsageDesktop,
      usageMobile: setUsageMobile,
      usageVideo: setUsageVideo,
      usagePlaceholder: setUsagePlaceholder,
      before: setBefore,
      after: setAfter,
    }),
    [],
  );
  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
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
    pending.filter((item) => item.scope === scope);

  useEffect(() => {
    let active = true;
    void get<RelationResponse>(contentLink('api::product.product'), {
      params: {
        page: 1,
        pageSize: 200,
        sort: 'name:ASC',
        locale: contentLocale,
      },
    })
      .then((response) => {
        if (active) {
          setProducts(response.data.results ?? []);
          setRelationFailed(false);
        }
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
    void get<EntryResponse>(`${contentLink(config.uid)}/${documentId}`, {
      params: { locale: contentLocale, status: 'draft' },
    })
      .then(async (response) => {
        const record = response.data.data;
        if (!record) throw new Error('Não foi possível carregar este registo.');
        const relationFields = bundle
          ? (['products', 'relatedProducts'] as const)
          : (['products'] as const);
        const loadedRelations = Object.fromEntries(
          await Promise.all(
            relationFields.map(async (field) => {
              try {
                const result = await get<RelationResponse>(
                  `/content-manager/relations/${config.uid}/${documentId}/${field}`,
                  {
                    params: {
                      locale: contentLocale,
                      status: 'draft',
                      page: 1,
                      pageSize: 200,
                    },
                  },
                );
                return [field, result.data.results ?? []];
              } catch {
                return [field, relationEntries(record[field])];
              }
            }),
          ),
        ) as Record<string, RelationEntry[]>;
        if (!active) return;
        const productValues = (loadedRelations.products ?? [])
          .map(relationValue)
          .filter(Boolean);
        const relatedValues = (loadedRelations.relatedProducts ?? [])
          .map(relationValue)
          .filter(Boolean);
        setProducts((current) =>
          mergeEntries(
            mergeEntries(current, loadedRelations.products ?? []),
            loadedRelations.relatedProducts ?? [],
          ),
        );
        setOriginalRelations({
          products: productValues,
          relatedProducts: relatedValues,
        });
        const home = record.homePresentation ?? {};
        const media =
          kind === 'ingredient' ? record.editorialMedia : record.media;
        const details = record.details ?? {};
        const usageMedia = details.usageMedia ?? {};
        const results = details.results ?? {};
        const comparison = results.comparison ?? {};
        setForm({
          name: String(record.name ?? ''),
          slug: String(record.slug ?? ''),
          description: String(record.description ?? ''),
          products: productValues,
          relatedProducts: relatedValues,
          linkProducts: productValues.length > 0,
          linkRelatedProducts: relatedValues.length > 0,
          includePrices: kind === 'kit' || Boolean(record.prices),
          priceAoa: String(record.prices?.aoa ?? ''),
          priceEur: String(record.prices?.eur ?? ''),
          homeEnabled: Boolean(record.homePresentation),
          homeOrder: String(home.order ?? 1),
          homeTitle: String(home.editorialTitle ?? home.title ?? ''),
          homeDescription: String(
            home.editorialDescription ?? home.description ?? '',
          ),
          homeFootnote: String(home.editorialFootnote ?? home.footnote ?? ''),
          finderDescription: String(home.finderDescription ?? ''),
          heroAlt: String(media?.alt ?? ''),
          heroMediaMode: media?.video ? 'video' : 'image',
          heroFocalX: String(media?.focalPointX ?? 50),
          heroFocalY: String(media?.focalPointY ?? 50),
          heroObjectFit: String(media?.objectFit ?? 'cover'),
          heroNoise: Boolean(media?.hasNoise),
          usageAlt: String(usageMedia?.alt ?? ''),
          usageMediaMode: usageMedia?.video ? 'video' : 'image',
          usageFocalX: String(usageMedia?.focalPointX ?? 50),
          usageFocalY: String(usageMedia?.focalPointY ?? 50),
          usageObjectFit: String(usageMedia?.objectFit ?? 'cover'),
          usageNoise: Boolean(usageMedia?.hasNoise),
          usageSteps:
            Array.isArray(details.usageSteps) && details.usageSteps.length
              ? details.usageSteps.map((item: Record<string, unknown>) => ({
                  name: String(item.name ?? ''),
                  description: String(item.description ?? ''),
                }))
              : [{ name: '', description: '' }],
          resultsDescription: String(results.description ?? ''),
          statistics:
            Array.isArray(results.statistics) && results.statistics.length
              ? results.statistics.map((item: Record<string, unknown>) => ({
                  percentage: String(item.percentage ?? ''),
                  description: String(item.description ?? ''),
                }))
              : [{ percentage: '', description: '' }],
          beforeLabel: String(comparison.beforeLabel ?? 'Antes'),
          afterLabel: String(comparison.afterLabel ?? 'Depois'),
        });
        setThumbnail(firstAsset(record.thumbnailImage));
        setHeroDesktop(mediaAssets(media, 'desktopImage'));
        setHeroMobile(mediaAssets(media, 'mobileImage'));
        setHeroVideo(mediaAssets(media, 'video'));
        setHeroPlaceholder(mediaAssets(media, 'placeholder'));
        setGallery(asAssets(details.images));
        setUsageDesktop(mediaAssets(usageMedia, 'desktopImage'));
        setUsageMobile(mediaAssets(usageMedia, 'mobileImage'));
        setUsageVideo(mediaAssets(usageMedia, 'video'));
        setUsagePlaceholder(mediaAssets(usageMedia, 'placeholder'));
        setBefore(firstAsset(comparison.before));
        setAfter(firstAsset(comparison.after));
      })
      .catch((error: any) => {
        if (active)
          setMessage({
            text:
              error?.response?.data?.error?.message ||
              'Não foi possível carregar este registo.',
            error: true,
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bundle, config.uid, contentLocale, documentId, get, kind]);

  const upload = async (
    files: FileList | null,
    scope: keyof typeof setters,
    multiple = false,
  ) => {
    if (!files?.length || uploading) return;
    const selected = Array.from(files);
    const batch = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queued = selected.map((file, index) => ({
      id: `${batch}-${index}`,
      scope,
      name: file.name,
      previewUrl: file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : null,
      progress: 0,
    }));
    const ids = new Set(queued.map((item) => item.id));
    setPending((current) => [...current, ...queued]);
    setUploading(true);
    try {
      const body = new FormData();
      selected.forEach((file) => body.append('files', file));
      const response = await post<Asset[]>('/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event: { loaded: number; total?: number }) => {
          const progress = event.total
            ? Math.min(95, Math.round((event.loaded / event.total) * 100))
            : 45;
          setPending((current) =>
            current.map((item) =>
              ids.has(item.id) ? { ...item, progress } : item,
            ),
          );
        },
      });
      const uploaded = Array.isArray(response.data) ? response.data : [];
      (setters[scope] as React.Dispatch<React.SetStateAction<Asset[]>>)(
        (current) =>
          multiple ? [...current, ...uploaded] : uploaded.slice(0, 1),
      );
    } catch {
      setMessage({
        text: 'Não foi possível enviar este ficheiro. Tente novamente.',
        error: true,
      });
    } finally {
      queued.forEach(
        (item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl),
      );
      setPending((current) => current.filter((item) => !ids.has(item.id)));
      setUploading(false);
    }
  };
  const remove = (scope: keyof typeof setters, index: number) =>
    (setters[scope] as React.Dispatch<React.SetStateAction<Asset[]>>)(
      (current) => current.filter((_, itemIndex) => itemIndex !== index),
    );

  const validStep = (target: number) => {
    const completePrice = form.priceAoa !== '' && form.priceEur !== '';
    const validPrice = !form.includePrices || completePrice;
    const valid =
      target === 1
        ? bundle
          ? Boolean(
              form.name.trim() &&
              form.slug.trim() &&
              form.description.trim() &&
              validPrice,
            )
          : Boolean(
              form.name.trim() && form.slug.trim() && form.description.trim(),
            )
        : target === 2
          ? thumbnail.length > 0
          : target === 3
            ? gallery.length > 0
            : target === 4 && form.homeEnabled
              ? Boolean(
                  Number(form.homeOrder) >= 1 &&
                    form.homeTitle.trim() &&
                    form.homeDescription.trim() &&
                    (kind !== 'kit' || form.finderDescription.trim()),
                )
            : true;
    if (!valid)
      setMessage({
        text:
          target === 2
            ? 'Adicione a imagem de miniatura antes de avançar.'
            : target === 3
              ? 'Adicione pelo menos uma imagem à galeria.'
              : target === 4
                ? 'Preencha os campos obrigatórios da apresentação na página inicial ou desative este recurso.'
              : kind === 'collection' && form.includePrices
                ? 'Preencha os dois preços ou deixe ambos vazios.'
                : 'Preencha todos os campos obrigatórios antes de avançar.',
        error: true,
      });
    else setMessage(null);
    return valid;
  };
  const goTo = (target: number) => {
    for (let current = 1; current < target; current += 1) {
      if (!validStep(current)) return;
    }
    setStep(target);
  };
  const goNext = () => {
    if (validStep(step))
      setStep((current) => Math.min(steps.length, current + 1));
  };

  const relationPayload = (
    key: 'products' | 'relatedProducts',
    values: string[],
  ) => ({
    connect: values
      .filter((value) => !originalRelations[key].includes(value))
      .map((value) => {
        const entry = products.find((item) => relationValue(item) === value);
        return entry
          ? {
              documentId: entry.documentId ?? String(entry.id),
              locale: entry.locale ?? contentLocale,
            }
          : null;
      })
      .filter(Boolean),
    disconnect: originalRelations[key]
      .filter((value) => !values.includes(value))
      .map((value) => {
        const entry = products.find((item) => relationValue(item) === value);
        return entry
          ? {
              documentId: entry.documentId ?? String(entry.id),
              locale: entry.locale ?? contentLocale,
            }
          : null;
      })
      .filter(Boolean),
  });
  const buildPayload = () => {
    if (kind === 'ingredient')
      return {
        locale: contentLocale,
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        products: relationPayload(
          'products',
          form.linkProducts ? form.products : [],
        ),
        thumbnailImage: thumbnail[0]?.id,
        editorialMedia: mediaPayload(
          {
            desktop: heroDesktop,
            mobile: heroMobile,
            video: heroVideo,
            placeholder: heroPlaceholder,
          },
          {
            alt: form.heroAlt,
            x: form.heroFocalX,
            y: form.heroFocalY,
            fit: form.heroObjectFit,
            noise: form.heroNoise,
          },
        ),
        status: 'published',
      };
    const homePresentation = !form.homeEnabled
      ? null
      : kind === 'kit'
        ? {
            order: Number(form.homeOrder),
            editorialTitle: form.homeTitle.trim() || null,
            editorialDescription: form.homeDescription.trim() || null,
            editorialFootnote: form.homeFootnote.trim() || null,
            finderDescription: form.finderDescription.trim() || null,
          }
        : {
            order: Number(form.homeOrder),
            title: form.homeTitle.trim() || null,
            description: form.homeDescription.trim() || null,
            footnote: form.homeFootnote.trim() || null,
          };
    const hasResults =
      form.resultsDescription.trim() ||
      form.statistics.some(
        (item) => item.percentage !== '' && item.description.trim(),
      ) ||
      before[0] ||
      after[0];
    const prices = form.includePrices
      ? { aoa: Number(form.priceAoa), eur: Number(form.priceEur) }
      : null;
    return {
      locale: contentLocale,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      prices,
      products: relationPayload(
        'products',
        form.linkProducts ? form.products : [],
      ),
      relatedProducts: relationPayload(
        'relatedProducts',
        form.linkRelatedProducts ? form.relatedProducts : [],
      ),
      thumbnailImage: thumbnail[0]?.id,
      media: mediaPayload(
        {
          desktop: heroDesktop,
          mobile: heroMobile,
          video: heroVideo,
          placeholder: heroPlaceholder,
        },
        {
          alt: form.heroAlt,
          x: form.heroFocalX,
          y: form.heroFocalY,
          fit: form.heroObjectFit,
          noise: form.heroNoise,
        },
      ),
      homePresentation,
      details: {
        images: gallery.map((asset) => asset.id),
        usageSteps: form.usageSteps
          .filter((item) => item.name.trim() && item.description.trim())
          .map((item, index) => ({
            order: index + 1,
            name: item.name.trim(),
            description: item.description.trim(),
          })),
        usageMedia: mediaPayload(
          {
            desktop: usageDesktop,
            mobile: usageMobile,
            video: usageVideo,
            placeholder: usagePlaceholder,
          },
          {
            alt: form.usageAlt,
            x: form.usageFocalX,
            y: form.usageFocalY,
            fit: form.usageObjectFit,
            noise: form.usageNoise,
          },
        ),
        results: hasResults
          ? {
              description: form.resultsDescription.trim() || null,
              statistics: form.statistics
                .filter(
                  (item) => item.percentage !== '' && item.description.trim(),
                )
                .map((item) => ({
                  percentage: Number(item.percentage),
                  description: item.description.trim(),
                })),
              comparison:
                before[0] && after[0]
                  ? {
                      before: before[0].id,
                      after: after[0].id,
                      beforeLabel: form.beforeLabel.trim() || 'Antes',
                      afterLabel: form.afterLabel.trim() || 'Depois',
                    }
                  : null,
            }
          : null,
      },
      status: 'published',
    };
  };
  const save = async () => {
    for (let current = 1; current < steps.length; current += 1) {
      if (!validStep(current)) {
        setStep(current);
        return;
      }
    }
    if (before.length > 0 !== after.length > 0) {
      setMessage({
        text: 'Adicione as duas imagens da comparação: antes e depois.',
        error: true,
      });
      setStep(3);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const base = contentLink(config.uid);
      const payload = buildPayload();
      if (editing && documentId)
        await post(`${base}/${documentId}/actions/publish`, payload);
      else await post(`${base}/actions/publish`, payload);
      navigate(listLink, { replace: true });
    } catch (error: any) {
      setMessage({
        text:
          error?.response?.data?.error?.message ||
          `Não foi possível guardar este ${config.singular}.`,
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const mediaFields = (prefix: 'hero' | 'usage') => {
    const isHero = prefix === 'hero';
    const desktop = isHero ? heroDesktop : usageDesktop;
    const mobile = isHero ? heroMobile : usageMobile;
    const video = isHero ? heroVideo : usageVideo;
    const placeholder = isHero ? heroPlaceholder : usagePlaceholder;
    const mode = isHero ? form.heroMediaMode : form.usageMediaMode;
    const preview = desktop[0] ?? mobile[0];
    const key = (suffix: string) =>
      `${prefix}${suffix}` as keyof typeof setters;
    return (
      <>
        <Field as="div">
          Formato principal
          <StoreSelect
            value={mode}
            onChange={(value) => {
              const next = value === 'video' ? 'video' : 'image';
              setField(isHero ? 'heroMediaMode' : 'usageMediaMode', next);
              if (next === 'video') {
                (
                  setters[key('Desktop')] as React.Dispatch<
                    React.SetStateAction<Asset[]>
                  >
                )([]);
                (
                  setters[key('Mobile')] as React.Dispatch<
                    React.SetStateAction<Asset[]>
                  >
                )([]);
              } else {
                (
                  setters[key('Video')] as React.Dispatch<
                    React.SetStateAction<Asset[]>
                  >
                )([]);
                (
                  setters[key('Placeholder')] as React.Dispatch<
                    React.SetStateAction<Asset[]>
                  >
                )([]);
              }
            }}
            placeholder="Escolha o formato"
            options={[
              { value: 'image', label: 'Imagem' },
              { value: 'video', label: 'Vídeo' },
            ]}
          />
        </Field>
        {mode === 'image' ? (
          <>
            <UploadField
              title="Imagem para computador"
              assets={desktop}
              pending={pendingFor(key('Desktop'))}
              onFiles={(files) => void upload(files, key('Desktop'))}
              onRemove={(index) => remove(key('Desktop'), index)}
            />
            <UploadField
              title="Imagem para telemóvel"
              assets={mobile}
              pending={pendingFor(key('Mobile'))}
              onFiles={(files) => void upload(files, key('Mobile'))}
              onRemove={(index) => remove(key('Mobile'), index)}
              help="Se não for preenchida, será utilizada a imagem para computador."
            />
          </>
        ) : (
          <>
            <UploadField
              title="Vídeo"
              assets={video}
              pending={pendingFor(key('Video'))}
              accept="video/*"
              onFiles={(files) => void upload(files, key('Video'))}
              onRemove={(index) => remove(key('Video'), index)}
              help="Quando preenchido, o vídeo tem prioridade sobre as imagens."
            />
            <UploadField
              title="Imagem de espera do vídeo"
              assets={placeholder}
              pending={pendingFor(key('Placeholder'))}
              onFiles={(files) => void upload(files, key('Placeholder'))}
              onRemove={(index) => remove(key('Placeholder'), index)}
              help="Apresentada enquanto o vídeo está a carregar."
            />
          </>
        )}
        <Field>
          Descrição acessível da imagem
          <Input
            value={isHero ? form.heroAlt : form.usageAlt}
            onChange={(event) =>
              setField(isHero ? 'heroAlt' : 'usageAlt', event.target.value)
            }
            placeholder="Descreva objetivamente o conteúdo visual"
          />
        </Field>
        {mode === 'image' && preview && (
          <Field as="div">
            Enquadramento da imagem
            <MediaFocalPointPicker
              src={preview.url}
              x={Number(isHero ? form.heroFocalX : form.usageFocalX)}
              y={Number(isHero ? form.heroFocalY : form.usageFocalY)}
              fit={isHero ? form.heroObjectFit : form.usageObjectFit}
              onChange={(x, y) => {
                setField(isHero ? 'heroFocalX' : 'usageFocalX', String(x));
                setField(isHero ? 'heroFocalY' : 'usageFocalY', String(y));
              }}
            />
          </Field>
        )}
        <Field as="div">
          Preenchimento da imagem <Required />
          <StoreSelect
            value={isHero ? form.heroObjectFit : form.usageObjectFit}
            onChange={(value) =>
              setField(isHero ? 'heroObjectFit' : 'usageObjectFit', value)
            }
            placeholder="Selecione"
            options={[
              { value: 'cover', label: 'Preencher toda a área' },
              { value: 'contain', label: 'Mostrar a imagem completa' },
            ]}
          />
        </Field>
        <Field as="div">
          Aplicar textura visual?
          <RadioGroup>
            <label>
              <input
                type="radio"
                checked={isHero ? form.heroNoise : form.usageNoise}
                onChange={() =>
                  setField(isHero ? 'heroNoise' : 'usageNoise', true)
                }
              />
              Sim
            </label>
            <label>
              <input
                type="radio"
                checked={!(isHero ? form.heroNoise : form.usageNoise)}
                onChange={() =>
                  setField(isHero ? 'heroNoise' : 'usageNoise', false)
                }
              />
              Não
            </label>
          </RadioGroup>
        </Field>
      </>
    );
  };

  const selectedNames = (values: string[]) =>
    products
      .filter((entry) => values.includes(relationValue(entry)))
      .map(displayName)
      .join(', ') || 'Nenhum produto selecionado';
  const dataStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Dados do {config.singular}</h2>
        </SectionTitle>
        <Field>
          Nome do {config.singular} <Required />
          <Input
            value={form.name}
            onChange={(event) => updateName(event.target.value)}
            placeholder={`Insira o nome do ${config.singular}`}
            autoFocus
          />
        </Field>
        {bundle && (
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
            help={`Pode criar este ${config.singular} e adicionar os produtos mais tarde.`}
          >
            <Field as="div">
              Produtos incluídos
              <MultiSelect
                values={form.products}
                options={products}
                onChange={(value) => setField('products', value)}
                placeholder="Selecione os produtos"
                loadError={relationFailed}
              />
            </Field>
          </OptionalRelationField>
        )}
        <Field>
          Endereço do {config.singular} <Required />
          <Input
            value={form.slug}
            onChange={(event) => setField('slug', slugify(event.target.value))}
            placeholder={`ex.: ${kind === 'ingredient' ? 'acido-hialuronico' : 'rotina-radiante'}`}
          />
          <small>
            Gerado automaticamente a partir do nome. Pode ser ajustado
            manualmente.
          </small>
        </Field>
        <Field>
          {kind === 'ingredient'
            ? 'Descrição e propriedades'
            : `Descrição do ${config.singular}`}{' '}
          <Required />
          <Textarea
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="Insira a descrição"
          />
        </Field>
        {!bundle && (
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
            help="Pode criar o ingrediente primeiro e associar os produtos mais tarde."
          >
            <Field as="div">
              Produtos que utilizam o ingrediente
              <MultiSelect
                values={form.products}
                options={products}
                onChange={(value) => setField('products', value)}
                placeholder="Selecione os produtos"
                loadError={relationFailed}
              />
            </Field>
          </OptionalRelationField>
        )}
      </Section>
      {bundle && (
        <>
          <Section>
            <SectionTitle>
              <h2>Preço apresentado para o {config.singular}</h2>
              {kind === 'collection' && (
                <p>Decida se esta coleção terá um preço próprio.</p>
              )}
            </SectionTitle>
            {kind === 'collection' && (
              <ToggleRow>
                <span>
                  Adicionar preço à coleção
                  <small>
                    Ative apenas quando a coleção puder ser comprada por um
                    valor próprio.
                  </small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  checked={form.includePrices}
                  onChange={(event) =>
                    setField('includePrices', event.target.checked)
                  }
                />
              </ToggleRow>
            )}
            {form.includePrices && (
              <>
                <Field>
                  Preço em kwanzas {kind === 'kit' && <Required />}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.priceAoa}
                    onChange={(event) =>
                      setField('priceAoa', event.target.value)
                    }
                    placeholder="0,00"
                  />
                </Field>
                <Field>
                  Preço em euros {kind === 'kit' && <Required />}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.priceEur}
                    onChange={(event) =>
                      setField('priceEur', event.target.value)
                    }
                    placeholder="0,00"
                  />
                </Field>
              </>
            )}
          </Section>
        </>
      )}
    </FormColumn>
  );

  const imageStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Miniatura</h2>
        </SectionTitle>
        <UploadField
          title="Imagem de miniatura"
          required
          assets={thumbnail}
          pending={pendingFor('thumbnail')}
          onFiles={(files) => void upload(files, 'thumbnail')}
          onRemove={(index) => remove('thumbnail', index)}
          help="Imagem pequena utilizada nos menus e listas compactas."
        />
      </Section>
      <Section>
        <SectionTitle>
          <h2>
            {kind === 'ingredient'
              ? 'Imagem principal do ingrediente'
              : 'Imagem ou vídeo principal'}
          </h2>
          {bundle && (
            <p>
              Utilizada na página de detalhes e, quando ativada, também na
              apresentação da página inicial.
            </p>
          )}
        </SectionTitle>
        {mediaFields('hero')}
      </Section>
    </FormColumn>
  );

  const contentStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Conteúdo da página de detalhes</h2>
        </SectionTitle>
        <UploadField
          title="Galeria de imagens"
          required
          multiple
          assets={gallery}
          pending={pendingFor('gallery')}
          onFiles={(files) => void upload(files, 'gallery', true)}
          onRemove={(index) => remove('gallery', index)}
          help="Adicione as imagens apresentadas no topo da página."
        />
      </Section>
      <Section>
        <SectionTitle>
          <h2>Modo de utilização</h2>
        </SectionTitle>
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
              Título do passo
              <Input
                value={item.name}
                onChange={(event) =>
                  setField(
                    'usageSteps',
                    form.usageSteps.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, name: event.target.value }
                        : current,
                    ),
                  )
                }
              />
            </Field>
            <Field>
              Instrução
              <Textarea
                value={item.description}
                onChange={(event) =>
                  setField(
                    'usageSteps',
                    form.usageSteps.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, description: event.target.value }
                        : current,
                    ),
                  )
                }
              />
            </Field>
          </Repeatable>
        ))}
        <AddButton
          type="button"
          onClick={() =>
            setField('usageSteps', [
              ...form.usageSteps,
              { name: '', description: '' },
            ])
          }
        >
          + Adicionar passo
        </AddButton>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Imagem ou vídeo de utilização</h2>
        </SectionTitle>
        {mediaFields('usage')}
      </Section>
      <Section>
        <SectionTitle>
          <h2>Resultados dos produtos</h2>
        </SectionTitle>
        <Field>
          Descrição geral dos resultados
          <Textarea
            value={form.resultsDescription}
            onChange={(event) =>
              setField('resultsDescription', event.target.value)
            }
            placeholder="Insira a descrição"
          />
        </Field>
        {form.statistics.map((item, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Dado estatístico {index + 1}</strong>
              {form.statistics.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'statistics',
                      form.statistics.filter(
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
              Percentagem
              <Input
                type="number"
                min="0"
                max="100"
                value={item.percentage}
                onChange={(event) =>
                  setField(
                    'statistics',
                    form.statistics.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, percentage: event.target.value }
                        : current,
                    ),
                  )
                }
              />
            </Field>
            <Field>
              Descrição
              <Textarea
                value={item.description}
                onChange={(event) =>
                  setField(
                    'statistics',
                    form.statistics.map((current, itemIndex) =>
                      itemIndex === index
                        ? { ...current, description: event.target.value }
                        : current,
                    ),
                  )
                }
              />
            </Field>
          </Repeatable>
        ))}
        <AddButton
          type="button"
          onClick={() =>
            setField('statistics', [
              ...form.statistics,
              { percentage: '', description: '' },
            ])
          }
        >
          + Adicionar dado estatístico
        </AddButton>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Comparação antes e depois</h2>
        </SectionTitle>
        <UploadField
          title="Imagem de antes"
          assets={before}
          pending={pendingFor('before')}
          onFiles={(files) => void upload(files, 'before')}
          onRemove={(index) => remove('before', index)}
        />
        <Field>
          Título da imagem de antes
          <Input
            value={form.beforeLabel}
            onChange={(event) => setField('beforeLabel', event.target.value)}
          />
        </Field>
        <UploadField
          title="Imagem de depois"
          assets={after}
          pending={pendingFor('after')}
          onFiles={(files) => void upload(files, 'after')}
          onRemove={(index) => remove('after', index)}
        />
        <Field>
          Título da imagem de depois
          <Input
            value={form.afterLabel}
            onChange={(event) => setField('afterLabel', event.target.value)}
          />
        </Field>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Produtos relacionados</h2>
          <p>Produtos recomendados no final da página.</p>
        </SectionTitle>
        <OptionalRelationField
          checked={form.linkRelatedProducts}
          onChange={(checked) =>
            setForm((current) => ({
              ...current,
              linkRelatedProducts: checked,
              relatedProducts: checked ? current.relatedProducts : [],
            }))
          }
          title="Adicionar produtos relacionados?"
          help="Ative apenas se quiser recomendar outros produtos nesta página."
        >
          <Field as="div">
            Produtos relacionados
            <MultiSelect
              values={form.relatedProducts}
              options={products}
              onChange={(value) => setField('relatedProducts', value)}
              placeholder="Selecione os produtos relacionados"
              loadError={relationFailed}
            />
          </Field>
        </OptionalRelationField>
      </Section>
    </FormColumn>
  );

  const homeStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Apresentação na página inicial</h2>
          <p>
            Esta configuração é opcional e serve apenas para destacar este{' '}
            {config.singular} na página inicial.
          </p>
        </SectionTitle>
        <InfoCallout>
          <strong>Como funciona</strong>
          <p>
            Ative esta opção e preencha todos os campos para que o{' '}
            {config.singular} fique disponível no seletor da Página Inicial.
            Se permanecer desativada, o {config.singular} continua disponível
            no catálogo, mas não poderá ser escolhido para estas áreas de
            destaque.
          </p>
        </InfoCallout>
        <ToggleRow>
          <span>
            Preparar para a página inicial
            <small>
              Pode ativar agora ou concluir esta apresentação mais tarde.
            </small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={form.homeEnabled}
            onChange={(event) =>
              setField('homeEnabled', event.target.checked)
            }
          />
        </ToggleRow>
      </Section>
      {form.homeEnabled && (
        <Section>
          <SectionTitle>
            <h2>Conteúdo editorial</h2>
            <p>
              A imagem ou o vídeo principal configurado na etapa Imagens será
              utilizado nesta apresentação.
            </p>
          </SectionTitle>
          <Field>
            Título da apresentação editorial <Required />
            <Input
              value={form.homeTitle}
              onChange={(event) => setField('homeTitle', event.target.value)}
              placeholder="Insira o título da apresentação editorial"
            />
          </Field>
          <Field>
            Descrição da apresentação editorial <Required />
            <Textarea
              value={form.homeDescription}
              onChange={(event) =>
                setField('homeDescription', event.target.value)
              }
              placeholder="Insira a descrição"
            />
          </Field>
          <Field>
            Nota abaixo do botão
            <Input
              value={form.homeFootnote}
              onChange={(event) =>
                setField('homeFootnote', event.target.value)
              }
              placeholder="Insira uma nota opcional"
            />
          </Field>
          {kind === 'collection' && (
            <Field>
              Posição na apresentação <Required />
              <Input
                type="number"
                min="1"
                value={form.homeOrder}
                onChange={(event) => setField('homeOrder', event.target.value)}
              />
            </Field>
          )}
        </Section>
      )}
      {form.homeEnabled && kind === 'kit' && (
        <Section>
          <SectionTitle>
            <h2>Área Encontrar</h2>
            <p>
              Configure como este kit será apresentado na lista horizontal da
              página inicial.
            </p>
          </SectionTitle>
          <Field>
            Posição na área Encontrar <Required />
            <Input
              type="number"
              min="1"
              value={form.homeOrder}
              onChange={(event) => setField('homeOrder', event.target.value)}
            />
          </Field>
          <Field>
            Texto apresentado na área Encontrar <Required />
            <Input
              value={form.finderDescription}
              onChange={(event) =>
                setField('finderDescription', event.target.value)
              }
              placeholder="Insira a descrição curta"
            />
          </Field>
        </Section>
      )}
    </FormColumn>
  );

  const summaryRows = bundle
    ? [
        ['Nome', form.name],
        ['Produtos incluídos', selectedNames(form.products)],
        ['Endereço', `/${form.slug}`],
        ['Descrição', form.description],
        [
          'Preço em kwanzas',
          form.includePrices && form.priceAoa !== ''
            ? `${Number(form.priceAoa).toLocaleString('pt-AO')} Kz`
            : 'Não definido',
        ],
        [
          'Preço em euros',
          form.includePrices && form.priceEur !== ''
            ? `€ ${Number(form.priceEur).toFixed(2)}`
            : 'Não definido',
        ],
        [
          'Apresentação na página inicial',
          form.homeEnabled ? 'Preparada para destaque' : 'Não configurada',
        ],
        ['Miniatura', thumbnail[0]?.name || 'Não adicionada'],
        [
          'Mídia principal',
          heroVideo[0]?.name || heroDesktop[0]?.name || 'Não adicionada',
        ],
        ['Galeria', `${gallery.length} imagem(ns)`],
        [
          'Modo de utilização',
          `${form.usageSteps.filter((item) => item.name.trim()).length} passo(s)`,
        ],
        [
          'Resultados',
          `${form.statistics.filter((item) => item.percentage !== '').length} dado(s) estatístico(s)`,
        ],
        ['Produtos relacionados', selectedNames(form.relatedProducts)],
      ]
    : [
        ['Nome do ingrediente', form.name],
        ['Endereço', `/${form.slug}`],
        ['Descrição e propriedades', form.description],
        ['Produtos que utilizam o ingrediente', selectedNames(form.products)],
        ['Miniatura', thumbnail[0]?.name || 'Não adicionada'],
        ['Mídia principal', heroVideo[0]?.name || 'Não adicionada'],
      ];
  const summaryStep = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Confirme os dados do {config.singular}</h2>
          <p>Reveja as informações antes de guardar.</p>
        </SectionTitle>
        <Summary>
          {summaryRows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </Summary>
      </Section>
    </FormColumn>
  );
  const contents = bundle
    ? [dataStep, imageStep, contentStep, homeStep, summaryStep]
    : [dataStep, imageStep, summaryStep];
  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    'Utilizador';
  const role = user?.roles?.[0]?.name || 'Admin';

  return (
    <Shell labelledBy="rich-catalog-form-title">
      <StoreLayout>
        <StoreSidebar activeHref={listLink} />
        <StorePage>
          <Topbar>
            <BackLink to={listLink}>
              <span aria-hidden>←</span>
              {config.back}
            </BackLink>
            <TopActions>
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
            </TopActions>
          </Topbar>
          <Workspace>
            <Title id="rich-catalog-form-title">
              {editing ? config.editTitle : config.title}
            </Title>
            <Stepper aria-label="Etapas do formulário">
              {steps.map((label, index) => {
                const number = index + 1;
                return (
                  <StepItem key={label}>
                    <StepButton
                      type="button"
                      disabled={loading}
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
            <Card>
              {loading ? (
                <Notice>A carregar os dados…</Notice>
              ) : (
                contents[step - 1]
              )}
            </Card>
            {step === 1 ? (
              <FooterSingle>
                <NavButton
                  type="button"
                  $primary
                  disabled={loading || uploading}
                  onClick={goNext}
                >
                  Avançar<span aria-hidden>→</span>
                </NavButton>
              </FooterSingle>
            ) : (
              <Footer>
                <NavButton
                  type="button"
                  disabled={saving || uploading}
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                >
                  <span aria-hidden>←</span>Voltar
                </NavButton>
                {step < steps.length ? (
                  <NavButton
                    type="button"
                    $primary
                    disabled={saving || uploading}
                    onClick={goNext}
                  >
                    Avançar<span aria-hidden>→</span>
                  </NavButton>
                ) : (
                  <NavButton
                    type="button"
                    $primary
                    disabled={saving || uploading}
                    onClick={() => void save()}
                  >
                    {saving
                      ? 'A guardar…'
                      : editing
                        ? 'Guardar alterações'
                        : config.create}
                    <span aria-hidden>→</span>
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

export const KitFormPage = () => <RichCatalogFormPage kind="kit" />;
export const CollectionFormPage = () => (
  <RichCatalogFormPage kind="collection" />
);
export const IngredientFormPage = () => (
  <RichCatalogFormPage kind="ingredient" />
);
