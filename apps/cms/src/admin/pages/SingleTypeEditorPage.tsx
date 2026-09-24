import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Main } from '@strapi/design-system';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  contentLink,
  iconPath,
  singleTypeLink,
  StoreLayout,
  StorePage,
  StoreSidebar,
} from '../components/StoreSidebar';
import { StoreSelect, StoreSelectShell } from '../components/StoreSelect';
import { MediaFocalPointPicker } from '../components/MediaFocalPointPicker';

type Kind = 'site' | 'home' | 'about';
type Asset = {
  id: number;
  url: string;
  name: string;
  mime?: string;
  alternativeText?: string | null;
};
type RelationEntry = {
  id?: number;
  documentId?: string;
  name?: string;
  title?: string;
  label?: string;
  headline?: string;
  locale?: string;
};
type MediaValue = {
  desktop: Asset[];
  mobile: Asset[];
  video: Asset[];
  placeholder: Asset[];
  alt: string;
  x: string;
  y: string;
  fit: string;
  noise: boolean;
};
type Pending = {
  id: string;
  scope: string;
  name: string;
  preview: string | null;
  progress: number;
};
type RelationResponse = { results?: RelationEntry[] };
type EntryResponse = { data?: Record<string, any> };
type Item = { title: string; description: string };
type Metric = {
  value: string;
  suffix: string;
  label: string;
  description: string;
};
type Paragraph = { text: string };
type Location = { title: string; description: string };
type SocialLink = { label: string; url: string; openInNewTab: boolean };

const configs = {
  site: {
    uid: 'api::site-setting.site-setting',
    href: '/store/site-settings',
    title: 'Configurações do site',
    steps: ['Dados gerais', 'Rodapé e ligações', 'Resumo'],
  },
  home: {
    uid: 'api::home-page.home-page',
    href: '/store/home-page',
    title: 'Página inicial',
    steps: ['Destaques', 'Seções', 'Resumo'],
  },
  about: {
    uid: 'api::about-page.about-page',
    href: '/store/about-page',
    title: 'Página Sobre',
    steps: ['Apresentação', 'Conteúdo', 'Resumo'],
  },
} as const;

const blankMedia = (): MediaValue => ({
  desktop: [],
  mobile: [],
  video: [],
  placeholder: [],
  alt: '',
  x: '50',
  y: '50',
  fit: 'cover',
  noise: false,
});
const initialForm: Record<string, any> = {
  siteName: '',
  contactEmail: '',
  newsletterHeadline: '',
  termsUrl: '',
  privacyUrl: '',
  defaultCurrency: 'AOA',
  socialLinks: [{ label: '', url: '', openInNewTab: false }] as SocialLink[],
  heroSlides: [],
  featuredProducts: [''],
  editorialCoverProduct: '',
  editorialGalleryProduct: '',
  featuredKit: '',
  featuredCollection: '',
  ingredientsHeadline: '',
  ingredientsDescription: '',
  ingredientsFootnote: '',
  ingredients: [],
  testimonialsTitle: '',
  testimonialsDescription: '',
  testimonials: [],
  pillarsTitle: '',
  pillarItems: [{ title: '', description: '' }] as Item[],
  heroLabel: '',
  heroHeadline: '',
  heroDescription: '',
  brandLabel: '',
  brandMetrics: [
    { value: '', suffix: '', label: '', description: '' },
  ] as Metric[],
  brandFooterTitle: '',
  brandFooterDescription: '',
  founderLabel: '',
  founderName: '',
  founderParagraphs: [{ text: '' }] as Paragraph[],
  founderCta: '',
  locationsLabel: '',
  locationsHeadline: '',
  locationsDescription: '',
  locationsItems: [{ title: '', description: '' }] as Location[],
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
  width: min(100%, 620px);
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
const inputCss = `box-sizing:border-box;width:100%;min-height:48px;padding:11px 12px;border:1px solid rgba(0,0,0,.12);border-radius:10px;color:#1a1917;background:#f7f7f7;font:inherit;font-size:14px;outline:0;&:focus{border-color:#8b7048;box-shadow:0 0 0 3px rgba(139,112,72,.12);}&::placeholder{color:#97928a;}`;
const Input = styled.input`
  ${inputCss}
`;
const Textarea = styled.textarea`
  ${inputCss}min-height:118px;
  resize: vertical;
  line-height: 1.55;
`;
const Inline = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  @media (max-width: 40rem) {
    grid-template-columns: 1fr;
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
  grid-template-columns: minmax(0, 620px);
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
const Guidance = styled.div`
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
const Summary = styled.dl`
  display: grid;
  margin: 0;
  div {
    display: grid;
    grid-template-columns: minmax(190px, 0.9fr) minmax(0, 1.2fr);
    gap: 30px;
    padding: 17px 0;
    border-bottom: 1px solid #ece8e1;
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
  }
  @media (max-width: 40rem) {
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
const Picker = styled.div`
  button {
    display: grid;
    width: 100%;
    min-height: 170px;
    place-items: center;
    padding: 24px;
    border: 2px dashed #e4ddd3;
    border-radius: 8px;
    color: #7d6645;
    background: #fff;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  input {
    display: none;
  }
`;
const AssetCard = styled.div`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  button {
    border: 0;
    color: #991b1b;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
`;
const Progress = styled.div`
  height: 8px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1eee9;
  span {
    display: block;
    height: 100%;
    background: #8b7048;
  }
`;

function Required() {
  return <span className="required">*</span>;
}
function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';
}
function relationValue(entry: RelationEntry) {
  return String(entry.documentId ?? entry.id ?? '');
}
function relationLabel(entry: RelationEntry) {
  return (
    entry.name ||
    entry.title ||
    entry.label ||
    entry.headline ||
    `Registo ${entry.id ?? ''}`
  );
}
function relations(value: unknown): RelationEntry[] {
  if (Array.isArray(value))
    return value.filter((item): item is RelationEntry =>
      Boolean(item && typeof item === 'object'),
    );
  if (value && typeof value === 'object') return [value as RelationEntry];
  return [];
}
function relationFrom(value: unknown): string {
  return relations(value)[0] ? relationValue(relations(value)[0]) : '';
}
function mergeEntries(current: RelationEntry[], incoming: RelationEntry[]) {
  const result = [...current];
  for (const item of incoming) {
    if (!result.some((entry) => relationValue(entry) === relationValue(item)))
      result.push(item);
  }
  return result;
}
function asAsset(value: unknown): Asset | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const id = Number(item.id);
  const url = typeof item.url === 'string' ? item.url : '';
  if (!Number.isFinite(id) || !url) return null;
  return {
    id,
    url,
    name: typeof item.name === 'string' ? item.name : `Ficheiro ${id}`,
    mime: typeof item.mime === 'string' ? item.mime : undefined,
    alternativeText:
      typeof item.alternativeText === 'string' ? item.alternativeText : null,
  };
}
function firstAsset(value: unknown) {
  const asset = asAsset(value);
  return asset ? [asset] : [];
}
function mediaFrom(value: unknown): MediaValue {
  const item =
    value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  return {
    desktop: firstAsset(item.desktopImage),
    mobile: firstAsset(item.mobileImage),
    video: firstAsset(item.video),
    placeholder: firstAsset(item.placeholder),
    alt: String(item.alt ?? ''),
    x: String(item.focalPointX ?? 50),
    y: String(item.focalPointY ?? 50),
    fit: String(item.objectFit ?? 'cover'),
    noise: Boolean(item.hasNoise),
  };
}
function mediaPayload(value: MediaValue) {
  if (
    !value.desktop[0] &&
    !value.mobile[0] &&
    !value.video[0] &&
    !value.placeholder[0]
  )
    return null;
  return {
    desktopImage: value.desktop[0]?.id ?? null,
    mobileImage: value.mobile[0]?.id ?? null,
    video: value.video[0]?.id ?? null,
    placeholder: value.placeholder[0]?.id ?? null,
    alt: value.alt.trim() || null,
    focalPointX: Number(value.x || 50),
    focalPointY: Number(value.y || 50),
    objectFit: value.fit,
    hasNoise: value.noise,
  };
}

function FilePicker({
  accept = 'image/*',
  children,
  onFiles,
}: {
  accept?: string;
  children: ReactNode;
  onFiles: (files: FileList | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Picker>
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
        tabIndex={-1}
        aria-hidden
        onChange={(event) => onFiles(event.currentTarget.files)}
      />
    </Picker>
  );
}
function MultiSelect({
  values,
  options,
  onChange,
  placeholder,
}: {
  values: string[];
  options: RelationEntry[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const selected = options
    .filter((item) => values.includes(relationValue(item)))
    .map(relationLabel);
  return (
    <StoreSelectShell>
      <summary>
        {selected.length ? selected.join(', ') : placeholder}
        <span aria-hidden>⌄</span>
      </summary>
      <div role="listbox">
        {options.length ? (
          options.map((item) => {
            const value = relationValue(item);
            return (
              <label key={value}>
                <input
                  type="checkbox"
                  checked={values.includes(value)}
                  onChange={() =>
                    onChange(
                      values.includes(value)
                        ? values.filter((current) => current !== value)
                        : [...values, value],
                    )
                  }
                />
                {relationLabel(item)}
              </label>
            );
          })
        ) : (
          <label>Nenhuma opção cadastrada</label>
        )}
      </div>
    </StoreSelectShell>
  );
}

export default function SingleTypeEditorPage({ kind }: { kind: Kind }) {
  const config = configs[kind];
  const { get, post } = useFetchClient();
  const [searchParams] = useSearchParams();
  const { locale } = useIntl();
  const user = useAuth('SingleTypeEditorPage', (state) => state.user);
  const language = locale.toLowerCase().startsWith('fr') ? 'fr' : 'pt';
  const contentLocale = searchParams.get('locale') || 'pt';
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Record<string, any>>(initialForm);
  const [options, setOptions] = useState<Record<string, RelationEntry[]>>({
    heroSlides: [],
    products: [],
    featuredProductOptions: [],
    editorialProducts: [],
    galleryProducts: [],
    kits: [],
    collections: [],
    ingredients: [],
    testimonials: [],
  });
  const [media, setMedia] = useState<Record<string, MediaValue>>({
    logo: blankMedia(),
    footer: blankMedia(),
    homeEditorial: blankMedia(),
    aboutHero: blankMedia(),
    aboutBrand: blankMedia(),
    aboutFounder: blankMedia(),
    aboutLocations: blankMedia(),
  });
  const [mediaModes, setMediaModes] = useState<
    Record<string, 'image' | 'video'>
  >({});
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const sources = useMemo(
    () =>
      kind === 'home'
        ? [
            ['heroSlides', 'api::hero-slide.hero-slide'],
            ['products', 'api::product.product'],
            ['ingredients', 'api::ingredient.ingredient'],
            ['testimonials', 'api::testimonial.testimonial'],
          ]
        : kind === 'about'
          ? [['ingredients', 'api::ingredient.ingredient']]
          : [],
    [kind],
  );
  const setField = (key: string, value: any) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setMediaValue = (key: string, value: MediaValue) =>
    setMedia((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;
    void Promise.all(
      sources.map(async ([key, uid]) => {
        try {
          const response = await get<RelationResponse>(contentLink(uid), {
            params: {
              page: 1,
              pageSize: 200,
              sort: 'id:ASC',
              locale: contentLocale,
            },
          });
          return [key, response.data.results ?? []] as const;
        } catch {
          return [key, []] as const;
        }
      }),
    ).then((entries) => {
      if (active)
        setOptions((current) => ({
          ...current,
          ...Object.fromEntries(entries),
        }));
    });
    return () => {
      active = false;
    };
  }, [contentLocale, get, sources]);
  useEffect(() => {
    if (kind !== 'home') return;
    let active = true;
    const params = {
      page: 1,
      pageSize: 200,
      locale: contentLocale,
    };
    void Promise.all([
      get<RelationResponse>(
        '/content-manager/relations/home.product-slot/product',
        { params },
      ),
      get<RelationResponse>(
        '/content-manager/relations/home.editorial-product/product',
        { params },
      ),
      get<RelationResponse>(
        '/content-manager/relations/home.editorial-gallery-product/product',
        { params },
      ),
      get<RelationResponse>(
        '/content-manager/relations/api::home-page.home-page/featuredKit',
        { params },
      ),
      get<RelationResponse>(
        '/content-manager/relations/api::home-page.home-page/featuredCollection',
        { params },
      ),
    ])
      .then(([featured, editorial, gallery, kits, collections]) => {
        if (!active) return;
        setOptions((current) => ({
          ...current,
          featuredProductOptions: featured.data.results ?? [],
          editorialProducts: editorial.data.results ?? [],
          galleryProducts: gallery.data.results ?? [],
          kits: mergeEntries(kits.data.results ?? [], current.kits),
          collections: mergeEntries(
            collections.data.results ?? [],
            current.collections,
          ),
        }));
      })
      .catch(() => {
        if (!active) return;
        setOptions((current) => ({
          ...current,
          featuredProductOptions: [],
          editorialProducts: [],
          galleryProducts: [],
        }));
      });
    return () => {
      active = false;
    };
  }, [contentLocale, get, kind]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void get<EntryResponse>(singleTypeLink(config.uid), {
      params: { locale: contentLocale, status: 'draft' },
    })
      .then((response) => {
        const data = response.data.data ?? {};
        if (!active) return;
        if (kind === 'site') {
          setForm((current) => ({
            ...current,
            siteName: String(data.siteName ?? ''),
            contactEmail: String(data.contactEmail ?? ''),
            newsletterHeadline: String(data.newsletterHeadline ?? ''),
            termsUrl: String(data.termsUrl ?? ''),
            privacyUrl: String(data.privacyUrl ?? ''),
            defaultCurrency: String(data.defaultCurrency ?? 'AOA'),
            socialLinks:
              Array.isArray(data.socialLinks) && data.socialLinks.length
                ? data.socialLinks.map((item: Record<string, unknown>) => ({
                    label: String(item.label ?? ''),
                    url: String(item.url ?? ''),
                    openInNewTab: Boolean(item.openInNewTab),
                  }))
                : [{ label: '', url: '', openInNewTab: false }],
          }));
          setMedia((current) => ({
            ...current,
            logo: { ...blankMedia(), desktop: firstAsset(data.logo) },
            footer: {
              ...blankMedia(),
              desktop: firstAsset(data.footerBackground),
            },
          }));
        }
        if (kind === 'home') {
          const featured = Array.isArray(data.featuredProducts)
            ? data.featuredProducts
                .map((item: Record<string, unknown>) =>
                  relationFrom(item.product),
                )
                .filter(Boolean)
            : [];
          const ingredients = relations(data.ingredients?.ingredients);
          const testimonials = relations(data.testimonials?.testimonials);
          const hero = relations(data.heroSlides);
          const products = [
            ...relations(data.editorialCover?.product),
            ...relations(data.editorialGallery?.product),
            ...featured.map((value: string) => ({ documentId: value })),
          ];
          setOptions((current) => ({
            ...current,
            heroSlides: mergeEntries(current.heroSlides, hero),
            products: mergeEntries(current.products, products),
            kits: mergeEntries(current.kits, relations(data.featuredKit)),
            collections: mergeEntries(
              current.collections,
              relations(data.featuredCollection),
            ),
            ingredients: mergeEntries(current.ingredients, ingredients),
            testimonials: mergeEntries(current.testimonials, testimonials),
          }));
          setForm((current) => ({
            ...current,
            heroSlides: hero.map(relationValue),
            featuredProducts: featured.length ? featured : [''],
            editorialCoverProduct: relationFrom(data.editorialCover?.product),
            editorialGalleryProduct: relationFrom(
              data.editorialGallery?.product,
            ),
            featuredKit: relationFrom(data.featuredKit),
            featuredCollection: relationFrom(data.featuredCollection),
            ingredientsHeadline: String(data.ingredients?.headline ?? ''),
            ingredientsDescription: String(data.ingredients?.description ?? ''),
            ingredientsFootnote: String(data.ingredients?.footnote ?? ''),
            ingredients: ingredients.map(relationValue),
            testimonialsTitle: String(data.testimonials?.title ?? ''),
            testimonialsDescription: String(
              data.testimonials?.description ?? '',
            ),
            testimonials: testimonials.map(relationValue),
            pillarsTitle: String(data.brandPillars?.title ?? ''),
            pillarItems:
              Array.isArray(data.brandPillars?.items) &&
              data.brandPillars.items.length
                ? data.brandPillars.items.map(
                    (item: Record<string, unknown>) => ({
                      title: String(item.title ?? ''),
                      description: String(item.description ?? ''),
                    }),
                  )
                : [{ title: '', description: '' }],
          }));
          setMedia((current) => ({
            ...current,
            homeEditorial: mediaFrom(data.editorialCover?.media),
          }));
          setMediaModes((current) => ({
            ...current,
            homeEditorial: data.editorialCover?.media?.video
              ? 'video'
              : 'image',
          }));
        }
        if (kind === 'about') {
          const ingredientEntries = relations(data.ingredients?.ingredients);
          setOptions((current) => ({
            ...current,
            ingredients: mergeEntries(current.ingredients, ingredientEntries),
          }));
          setForm((current) => ({
            ...current,
            heroLabel: String(data.heroLabel ?? ''),
            heroHeadline: String(data.heroHeadline ?? ''),
            heroDescription: String(data.heroDescription ?? ''),
            brandLabel: String(data.brand?.label ?? ''),
            brandMetrics:
              Array.isArray(data.brand?.metrics) && data.brand.metrics.length
                ? data.brand.metrics.map((item: Record<string, unknown>) => ({
                    value: String(item.value ?? ''),
                    suffix: String(item.suffix ?? ''),
                    label: String(item.label ?? ''),
                    description: String(item.description ?? ''),
                  }))
                : [{ value: '', suffix: '', label: '', description: '' }],
            brandFooterTitle: String(data.brand?.footerTitle ?? ''),
            brandFooterDescription: String(data.brand?.footerDescription ?? ''),
            pillarsTitle: String(data.pillars?.title ?? ''),
            pillarItems:
              Array.isArray(data.pillars?.items) && data.pillars.items.length
                ? data.pillars.items.map((item: Record<string, unknown>) => ({
                    title: String(item.title ?? ''),
                    description: String(item.description ?? ''),
                  }))
                : [{ title: '', description: '' }],
            founderLabel: String(data.founder?.label ?? ''),
            founderName: String(data.founder?.name ?? ''),
            founderParagraphs:
              Array.isArray(data.founder?.paragraphs) &&
              data.founder.paragraphs.length
                ? data.founder.paragraphs.map(
                    (item: Record<string, unknown>) => ({
                      text: String(item.text ?? ''),
                    }),
                  )
                : [{ text: '' }],
            founderCta: String(data.founder?.ctaLabel ?? ''),
            locationsLabel: String(data.locations?.label ?? ''),
            locationsHeadline: String(data.locations?.headline ?? ''),
            locationsDescription: String(data.locations?.description ?? ''),
            locationsItems:
              Array.isArray(data.locations?.items) &&
              data.locations.items.length
                ? data.locations.items.map((item: Record<string, unknown>) => ({
                    title: String(item.title ?? ''),
                    description: String(item.description ?? ''),
                  }))
                : [{ title: '', description: '' }],
            ingredientsHeadline: String(data.ingredients?.headline ?? ''),
            ingredientsDescription: String(data.ingredients?.description ?? ''),
            ingredientsFootnote: String(data.ingredients?.footnote ?? ''),
            ingredients: ingredientEntries.map(relationValue),
          }));
          setMedia((current) => ({
            ...current,
            aboutHero: mediaFrom(data.heroMedia),
            aboutBrand: mediaFrom(data.brand?.media),
            aboutFounder: mediaFrom(data.founder?.media),
            aboutLocations: mediaFrom(data.locations?.media),
          }));
          setMediaModes((current) => ({
            ...current,
            aboutHero: data.heroMedia?.video ? 'video' : 'image',
            aboutBrand: data.brand?.media?.video ? 'video' : 'image',
            aboutFounder: data.founder?.media?.video ? 'video' : 'image',
            aboutLocations: data.locations?.media?.video ? 'video' : 'image',
          }));
        }
      })
      .catch(() => {
        if (active)
          setMessage({
            text: 'Não foi possível carregar esta página. Atualize e tente novamente.',
            error: true,
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [config.uid, contentLocale, get, kind]);

  const upload = async (
    key: string,
    slot: keyof Pick<
      MediaValue,
      'desktop' | 'mobile' | 'video' | 'placeholder'
    >,
    files: FileList | null,
  ) => {
    if (!files?.[0] || uploading) return;
    const file = files[0];
    const id = `${Date.now()}-${Math.random()}`;
    const preview = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null;
    setPending((current) => [
      ...current,
      { id, scope: `${key}.${slot}`, name: file.name, preview, progress: 0 },
    ]);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('files', file);
      const response = await post<Asset[]>('/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event: { loaded: number; total?: number }) => {
          const progress = event.total
            ? Math.min(95, Math.round((event.loaded / event.total) * 100))
            : 45;
          setPending((current) =>
            current.map((item) =>
              item.id === id ? { ...item, progress } : item,
            ),
          );
        },
      });
      const asset = response.data?.[0];
      if (asset)
        setMedia((current) => ({
          ...current,
          [key]: { ...current[key], [slot]: [asset] },
        }));
    } catch {
      setMessage({
        text: 'Não foi possível enviar o ficheiro. Tente novamente.',
        error: true,
      });
    } finally {
      if (preview) URL.revokeObjectURL(preview);
      setPending((current) => current.filter((item) => item.id !== id));
      setUploading(false);
    }
  };
  const relationSet = (values: string[], source: RelationEntry[]) => ({
    set: values
      .map((value) => {
        const item = source.find((entry) => relationValue(entry) === value);
        return item
          ? {
              documentId: item.documentId ?? String(item.id),
              locale: item.locale ?? contentLocale,
            }
          : null;
      })
      .filter(Boolean),
  });
  const oneRelation = (value: string, source: RelationEntry[]) =>
    relationSet(value ? [value] : [], source);
  const sectionItems = (items: Item[]) =>
    items
      .filter((item) => item.title.trim())
      .map((item, index) => ({
        order: index,
        title: item.title.trim(),
        description: item.description.trim() || null,
      }));
  const buildPayload = () => {
    if (kind === 'site')
      return {
        locale: contentLocale,
        siteName: form.siteName.trim(),
        contactEmail: form.contactEmail.trim() || null,
        newsletterHeadline: form.newsletterHeadline.trim() || null,
        termsUrl: form.termsUrl.trim() || null,
        privacyUrl: form.privacyUrl.trim() || null,
        defaultCurrency: form.defaultCurrency,
        socialLinks: (form.socialLinks as SocialLink[])
          .filter((item) => item.label.trim() && item.url.trim())
          .map((item) => ({
            ...item,
            label: item.label.trim(),
            url: item.url.trim(),
          })),
        logo: media.logo.desktop[0]?.id ?? null,
        footerBackground: media.footer.desktop[0]?.id ?? null,
        status: 'published',
      };
    if (kind === 'home')
      return {
        locale: contentLocale,
        heroSlides: relationSet(form.heroSlides, options.heroSlides),
        featuredProducts: (form.featuredProducts as string[])
          .filter(Boolean)
          .map((value, index) => ({
            order: index,
            product: oneRelation(value, options.featuredProductOptions),
          })),
        editorialCover: form.editorialCoverProduct
          ? {
              product: oneRelation(
                form.editorialCoverProduct,
                options.editorialProducts,
              ),
              media: mediaPayload(media.homeEditorial),
            }
          : null,
        editorialGallery: form.editorialGalleryProduct
          ? {
              product: oneRelation(
                form.editorialGalleryProduct,
                options.galleryProducts,
              ),
            }
          : null,
        featuredKit: oneRelation(form.featuredKit, options.kits),
        featuredCollection: oneRelation(
          form.featuredCollection,
          options.collections,
        ),
        ingredients:
          form.ingredientsHeadline.trim() &&
          form.ingredientsDescription.trim() &&
          form.ingredientsFootnote.trim()
            ? {
                headline: form.ingredientsHeadline.trim(),
                description: form.ingredientsDescription.trim(),
                footnote: form.ingredientsFootnote.trim(),
                ingredients: relationSet(form.ingredients, options.ingredients),
              }
            : null,
        testimonials:
          form.testimonialsTitle.trim() && form.testimonialsDescription.trim()
            ? {
                title: form.testimonialsTitle.trim(),
                description: form.testimonialsDescription.trim(),
                testimonials: relationSet(
                  form.testimonials,
                  options.testimonials,
                ),
              }
            : null,
        brandPillars: form.pillarsTitle.trim()
          ? {
              title: form.pillarsTitle.trim(),
              items: sectionItems(form.pillarItems),
            }
          : null,
        status: 'published',
      };
    return {
      locale: contentLocale,
      heroLabel: form.heroLabel.trim() || null,
      heroHeadline: form.heroHeadline.trim(),
      heroDescription: form.heroDescription.trim() || null,
      heroMedia: mediaPayload(media.aboutHero),
      brand: form.brandLabel.trim()
        ? {
            label: form.brandLabel.trim(),
            media: mediaPayload(media.aboutBrand),
            metrics: (form.brandMetrics as Metric[])
              .filter((item) => item.value !== '' && item.description.trim())
              .map((item, index) => ({
                order: index + 1,
                value: Number(item.value),
                suffix: item.suffix.trim() || null,
                label: item.label.trim() || null,
                description: item.description.trim(),
              })),
            footerTitle: form.brandFooterTitle.trim(),
            footerDescription: form.brandFooterDescription.trim(),
          }
        : null,
      pillars: form.pillarsTitle.trim()
        ? {
            title: form.pillarsTitle.trim(),
            items: sectionItems(form.pillarItems),
          }
        : null,
      founder: form.founderName.trim()
        ? {
            label: form.founderLabel.trim(),
            name: form.founderName.trim(),
            paragraphs: (form.founderParagraphs as Paragraph[])
              .filter((item) => item.text.trim())
              .map((item, index) => ({
                order: index + 1,
                text: item.text.trim(),
              })),
            media: mediaPayload(media.aboutFounder),
            ctaLabel: form.founderCta.trim(),
          }
        : null,
      locations: form.locationsHeadline.trim()
        ? {
            label: form.locationsLabel.trim(),
            headline: form.locationsHeadline.trim(),
            description: form.locationsDescription.trim(),
            items: (form.locationsItems as Location[])
              .filter((item) => item.title.trim() && item.description.trim())
              .map((item, index) => ({
                order: index + 1,
                title: item.title.trim(),
                description: item.description.trim(),
              })),
            media: mediaPayload(media.aboutLocations),
          }
        : null,
      ingredients:
        form.ingredientsHeadline.trim() &&
        form.ingredientsDescription.trim() &&
        form.ingredientsFootnote.trim()
          ? {
              headline: form.ingredientsHeadline.trim(),
              description: form.ingredientsDescription.trim(),
              footnote: form.ingredientsFootnote.trim(),
              ingredients: relationSet(form.ingredients, options.ingredients),
            }
          : null,
      status: 'published',
    };
  };
  const valid = () => {
    if (kind === 'site' && !form.siteName.trim())
      return 'Informe o nome do site.';
    if (
      kind === 'about' &&
      (!form.heroHeadline.trim() ||
        (!media.aboutHero.desktop[0] &&
          !media.aboutHero.mobile[0] &&
          !media.aboutHero.video[0]))
    )
      return 'Informe o título e adicione uma imagem ao hero.';
    return '';
  };
  const save = async () => {
    const error = valid();
    if (error) {
      setMessage({ text: error, error: true });
      setStep(1);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await post(
        `${singleTypeLink(config.uid)}/actions/publish`,
        buildPayload(),
      );
      setMessage({ text: 'Alterações publicadas com sucesso.', error: false });
    } catch (requestError: any) {
      setMessage({
        text:
          requestError?.response?.data?.error?.message ||
          'Não foi possível publicar as alterações.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const renderPending = (scope: string) => {
    const item = pending.find((current) => current.scope === scope);
    return item ? (
      <AssetCard aria-busy="true">
        {item.preview ? <img src={item.preview} alt="" /> : <span>▧</span>}
        <span>
          <strong>{item.name}</strong>
          <Progress>
            <span style={{ width: `${item.progress}%` }} />
          </Progress>
        </span>
        <span>{item.progress}%</span>
      </AssetCard>
    ) : null;
  };
  const AssetField = ({
    mediaKey,
    slot = 'desktop',
    title,
    accept = 'image/*',
    required,
    help,
  }: {
    mediaKey: string;
    slot?: keyof Pick<
      MediaValue,
      'desktop' | 'mobile' | 'video' | 'placeholder'
    >;
    title: string;
    accept?: string;
    required?: boolean;
    help?: string;
  }) => {
    const asset = media[mediaKey][slot][0];
    return (
      <Field as="div">
        <span>
          {title} {required && <Required />}
        </span>
        {asset ? (
          <AssetCard>
            {asset.mime?.startsWith('video') ? (
              <video src={asset.url} />
            ) : (
              <img src={asset.url} alt={asset.alternativeText || asset.name} />
            )}
            <strong>{asset.name}</strong>
            <button
              type="button"
              onClick={() =>
                setMediaValue(mediaKey, { ...media[mediaKey], [slot]: [] })
              }
            >
              Remover
            </button>
          </AssetCard>
        ) : (
          renderPending(`${mediaKey}.${slot}`) || (
            <FilePicker
              accept={accept}
              onFiles={(files) => void upload(mediaKey, slot, files)}
            >
              Adicionar {accept.includes('video') ? 'vídeo' : 'imagem'}
            </FilePicker>
          )
        )}
        {help && <small>{help}</small>}
      </Field>
    );
  };
  const MediaEditor = ({
    mediaKey,
    title,
    required,
  }: {
    mediaKey: string;
    title: string;
    required?: boolean;
  }) => {
    const mode =
      mediaModes[mediaKey] ?? (media[mediaKey].video[0] ? 'video' : 'image');
    const preview = media[mediaKey].desktop[0] ?? media[mediaKey].mobile[0];
    const changeMode = (value: string) => {
      const next = value === 'video' ? 'video' : 'image';
      setMediaModes((current) => ({ ...current, [mediaKey]: next }));
      setMediaValue(
        mediaKey,
        next === 'video'
          ? { ...media[mediaKey], desktop: [], mobile: [] }
          : { ...media[mediaKey], video: [], placeholder: [] },
      );
    };
    return (
      <Section>
        <SectionTitle>
          <h2>{title}</h2>
        </SectionTitle>
        <Field as="div">
          Formato principal
          <StoreSelect
            value={mode}
            onChange={changeMode}
            placeholder="Escolha o formato"
            options={[
              { value: 'image', label: 'Imagem' },
              { value: 'video', label: 'Vídeo' },
            ]}
          />
        </Field>
        {mode === 'image' ? (
          <>
            <AssetField
              mediaKey={mediaKey}
              title="Imagem para computador"
              required={required}
            />
            <AssetField
              mediaKey={mediaKey}
              slot="mobile"
              title="Imagem para telemóvel"
              help="Se ficar vazia, será utilizada a imagem para computador."
            />
          </>
        ) : (
          <>
            <AssetField
              mediaKey={mediaKey}
              slot="video"
              title="Vídeo"
              accept="video/*"
            />
            <AssetField
              mediaKey={mediaKey}
              slot="placeholder"
              title="Imagem de espera do vídeo"
            />
          </>
        )}
        <Field>
          Descrição acessível
          <Input
            value={media[mediaKey].alt}
            onChange={(event) =>
              setMediaValue(mediaKey, {
                ...media[mediaKey],
                alt: event.target.value,
              })
            }
          />
        </Field>
        {mode === 'image' && preview && (
          <Field as="div">
            Enquadramento da imagem
            <MediaFocalPointPicker
              src={preview.url}
              x={Number(media[mediaKey].x)}
              y={Number(media[mediaKey].y)}
              fit={media[mediaKey].fit}
              onChange={(x, y) =>
                setMediaValue(mediaKey, {
                  ...media[mediaKey],
                  x: String(x),
                  y: String(y),
                })
              }
            />
          </Field>
        )}
        <Field as="div">
          Preenchimento
          <StoreSelect
            value={media[mediaKey].fit}
            onChange={(value) =>
              setMediaValue(mediaKey, { ...media[mediaKey], fit: value })
            }
            placeholder="Selecione"
            options={[
              { value: 'cover', label: 'Preencher toda a área' },
              { value: 'contain', label: 'Mostrar a imagem completa' },
            ]}
          />
        </Field>
        <Field as="div">
          Aplicar textura?
          <RadioGroup>
            <label>
              <input
                type="radio"
                checked={media[mediaKey].noise}
                onChange={() =>
                  setMediaValue(mediaKey, { ...media[mediaKey], noise: true })
                }
              />
              Sim
            </label>
            <label>
              <input
                type="radio"
                checked={!media[mediaKey].noise}
                onChange={() =>
                  setMediaValue(mediaKey, { ...media[mediaKey], noise: false })
                }
              />
              Não
            </label>
          </RadioGroup>
        </Field>
      </Section>
    );
  };
  const Repeater = ({
    title,
    items,
    keyName = 'title',
    render,
    onAdd,
    onRemove,
  }: {
    title: string;
    items: any[];
    keyName?: string;
    render: (item: any, index: number) => ReactNode;
    onAdd: () => void;
    onRemove: (index: number) => void;
  }) => (
    <Section>
      <SectionTitle>
        <h2>{title}</h2>
      </SectionTitle>
      {items.map((item, index) => (
        <Repeatable key={index}>
          <RepeatHeader>
            <strong>{item[keyName] || `${title} ${index + 1}`}</strong>
            {items.length > 1 && (
              <button type="button" onClick={() => onRemove(index)}>
                Remover
              </button>
            )}
          </RepeatHeader>
          {render(item, index)}
        </Repeatable>
      ))}
      <AddButton type="button" onClick={onAdd}>
        + Adicionar
      </AddButton>
    </Section>
  );

  const siteSteps = [
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Identidade e contacto</h2>
        </SectionTitle>
        <Field>
          Nome do site <Required />
          <Input
            value={form.siteName}
            onChange={(e) => setField('siteName', e.target.value)}
          />
        </Field>
        <Field>
          E-mail de contacto
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setField('contactEmail', e.target.value)}
          />
        </Field>
        <Field>
          Moeda padrão
          <StoreSelect
            value={form.defaultCurrency}
            onChange={(value) => setField('defaultCurrency', value)}
            placeholder="Selecione"
            options={[
              { value: 'AOA', label: 'Kwanza angolano (AOA)' },
              { value: 'EUR', label: 'Euro (EUR)' },
            ]}
          />
        </Field>
        <AssetField mediaKey="logo" title="Logotipo" />
      </Section>
      <Repeater
        title="Redes sociais"
        items={form.socialLinks}
        keyName="label"
        onAdd={() =>
          setField('socialLinks', [
            ...form.socialLinks,
            { label: '', url: '', openInNewTab: false },
          ])
        }
        onRemove={(index) =>
          setField(
            'socialLinks',
            form.socialLinks.filter(
              (_: unknown, itemIndex: number) => itemIndex !== index,
            ),
          )
        }
        render={(item: SocialLink, index) => (
          <>
            <Field>
              Nome
              <Input
                value={item.label}
                onChange={(e) =>
                  setField(
                    'socialLinks',
                    form.socialLinks.map(
                      (current: SocialLink, itemIndex: number) =>
                        itemIndex === index
                          ? { ...current, label: e.target.value }
                          : current,
                    ),
                  )
                }
              />
            </Field>
            <Field>
              Endereço
              <Input
                value={item.url}
                onChange={(e) =>
                  setField(
                    'socialLinks',
                    form.socialLinks.map(
                      (current: SocialLink, itemIndex: number) =>
                        itemIndex === index
                          ? { ...current, url: e.target.value }
                          : current,
                    ),
                  )
                }
              />
            </Field>
            <label>
              <input
                type="checkbox"
                checked={item.openInNewTab}
                onChange={(e) =>
                  setField(
                    'socialLinks',
                    form.socialLinks.map(
                      (current: SocialLink, itemIndex: number) =>
                        itemIndex === index
                          ? { ...current, openInNewTab: e.target.checked }
                          : current,
                    ),
                  )
                }
              />{' '}
              Abrir numa nova janela
            </label>
          </>
        )}
      />
    </FormColumn>,
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Rodapé e informações legais</h2>
        </SectionTitle>
        <Field>
          Título da newsletter
          <Input
            value={form.newsletterHeadline}
            onChange={(e) => setField('newsletterHeadline', e.target.value)}
          />
        </Field>
        <Field>
          Endereço dos termos de serviço
          <Input
            value={form.termsUrl}
            onChange={(e) => setField('termsUrl', e.target.value)}
          />
        </Field>
        <Field>
          Endereço da política de privacidade
          <Input
            value={form.privacyUrl}
            onChange={(e) => setField('privacyUrl', e.target.value)}
          />
        </Field>
        <AssetField mediaKey="footer" title="Imagem de fundo do rodapé" />
      </Section>
    </FormColumn>,
  ];
  const homeSteps = [
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Conteúdos principais</h2>
          <p>
            Selecione os conteúdos já cadastrados que aparecem nas áreas de
            destaque.
          </p>
        </SectionTitle>
        <Guidance>
          <strong>Antes de selecionar um kit ou uma coleção</strong>
          <p>
            Prepare primeiro o conteúdo na tab Página inicial do respetivo kit
            ou coleção. Apenas itens com a apresentação editorial completa
            ficam disponíveis abaixo. O cadastro normal do catálogo não coloca
            automaticamente um item na página inicial.
          </p>
        </Guidance>
        <Field as="div">
          Banners do hero
          <MultiSelect
            values={form.heroSlides}
            options={options.heroSlides}
            onChange={(value) => setField('heroSlides', value)}
            placeholder="Selecione os banners"
          />
        </Field>
        {(form.featuredProducts as string[]).map((value, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Produto destacado {index + 1}</strong>
              {form.featuredProducts.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'featuredProducts',
                      form.featuredProducts.filter(
                        (_: string, itemIndex: number) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remover
                </button>
              )}
            </RepeatHeader>
            <StoreSelect
              value={value}
              onChange={(next) =>
                setField(
                  'featuredProducts',
                  form.featuredProducts.map(
                    (current: string, itemIndex: number) =>
                      itemIndex === index ? next : current,
                  ),
                )
              }
              placeholder="Selecione o produto"
              options={options.featuredProductOptions
                .filter((item) => {
                  const optionValue = relationValue(item);
                  return (
                    optionValue === value ||
                    !(form.featuredProducts as string[]).includes(optionValue)
                  );
                })
                .map((item) => ({
                  value: relationValue(item),
                  label: relationLabel(item),
                }))}
            />
          </Repeatable>
        ))}
        {form.featuredProducts.length < 3 && (
          <AddButton
            type="button"
            onClick={() =>
              setField('featuredProducts', [...form.featuredProducts, ''])
            }
          >
            + Adicionar produto destacado
          </AddButton>
        )}
        <Field as="div">
          Produto editorial principal
          <StoreSelect
            value={form.editorialCoverProduct}
            onChange={(value) => setField('editorialCoverProduct', value)}
            placeholder="Selecione o produto"
            options={options.editorialProducts.map((item) => ({
              value: relationValue(item),
              label: relationLabel(item),
            }))}
          />
        </Field>
        <Field as="div">
          Produto da galeria editorial
          <StoreSelect
            value={form.editorialGalleryProduct}
            onChange={(value) => setField('editorialGalleryProduct', value)}
            placeholder="Selecione o produto"
            options={options.galleryProducts.map((item) => ({
              value: relationValue(item),
              label: relationLabel(item),
            }))}
          />
        </Field>
        <Field as="div">
          Kit em destaque
          <StoreSelect
            value={form.featuredKit}
            onChange={(value) => setField('featuredKit', value)}
            placeholder="Selecione o kit"
            options={options.kits.map((item) => ({
              value: relationValue(item),
              label: relationLabel(item),
            }))}
          />
          <small>
            São apresentados apenas kits preparados para a página inicial.
          </small>
        </Field>
        <Field as="div">
          Coleção em destaque
          <StoreSelect
            value={form.featuredCollection}
            onChange={(value) => setField('featuredCollection', value)}
            placeholder="Selecione a coleção"
            options={options.collections.map((item) => ({
              value: relationValue(item),
              label: relationLabel(item),
            }))}
          />
          <small>
            São apresentadas apenas coleções com o conteúdo editorial completo.
          </small>
        </Field>
      </Section>
      <MediaEditor mediaKey="homeEditorial" title="Mídia editorial opcional" />
    </FormColumn>,
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Seção de ingredientes</h2>
        </SectionTitle>
        <Field>
          Título
          <Input
            value={form.ingredientsHeadline}
            onChange={(e) => setField('ingredientsHeadline', e.target.value)}
          />
        </Field>
        <Field>
          Descrição
          <Textarea
            value={form.ingredientsDescription}
            onChange={(e) => setField('ingredientsDescription', e.target.value)}
          />
        </Field>
        <Field>
          Nota inferior
          <Textarea
            value={form.ingredientsFootnote}
            onChange={(e) => setField('ingredientsFootnote', e.target.value)}
          />
        </Field>
        <Field as="div">
          Ingredientes
          <MultiSelect
            values={form.ingredients}
            options={options.ingredients}
            onChange={(value) => setField('ingredients', value)}
            placeholder="Selecione os ingredientes"
          />
        </Field>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Seção de testemunhos</h2>
        </SectionTitle>
        <Field>
          Título
          <Input
            value={form.testimonialsTitle}
            onChange={(e) => setField('testimonialsTitle', e.target.value)}
          />
        </Field>
        <Field>
          Descrição
          <Textarea
            value={form.testimonialsDescription}
            onChange={(e) =>
              setField('testimonialsDescription', e.target.value)
            }
          />
        </Field>
        <Field as="div">
          Testemunhos em vídeo
          <MultiSelect
            values={form.testimonials}
            options={options.testimonials}
            onChange={(value) => setField('testimonials', value)}
            placeholder="Selecione os testemunhos"
          />
        </Field>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Pilares da marca</h2>
        </SectionTitle>
        <Field>
          Título
          <Input
            value={form.pillarsTitle}
            onChange={(e) => setField('pillarsTitle', e.target.value)}
          />
        </Field>
        {(form.pillarItems as Item[]).map((item, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Pilar {index + 1}</strong>
              {form.pillarItems.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'pillarItems',
                      form.pillarItems.filter(
                        (_: Item, itemIndex: number) => itemIndex !== index,
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
                value={item.title}
                onChange={(e) =>
                  setField(
                    'pillarItems',
                    form.pillarItems.map((current: Item, itemIndex: number) =>
                      itemIndex === index
                        ? { ...current, title: e.target.value }
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
                onChange={(e) =>
                  setField(
                    'pillarItems',
                    form.pillarItems.map((current: Item, itemIndex: number) =>
                      itemIndex === index
                        ? { ...current, description: e.target.value }
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
            setField('pillarItems', [
              ...form.pillarItems,
              { title: '', description: '' },
            ])
          }
        >
          + Adicionar pilar
        </AddButton>
      </Section>
    </FormColumn>,
  ];
  const aboutSteps = [
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Apresentação da página</h2>
        </SectionTitle>
        <Field>
          Etiqueta do hero
          <Input
            value={form.heroLabel}
            onChange={(e) => setField('heroLabel', e.target.value)}
          />
        </Field>
        <Field>
          Título principal <Required />
          <Input
            value={form.heroHeadline}
            onChange={(e) => setField('heroHeadline', e.target.value)}
          />
        </Field>
        <Field>
          Descrição
          <Textarea
            value={form.heroDescription}
            onChange={(e) => setField('heroDescription', e.target.value)}
          />
        </Field>
      </Section>
      <MediaEditor
        mediaKey="aboutHero"
        title="Imagem ou vídeo do hero"
        required
      />
      <Section>
        <SectionTitle>
          <h2>História e números da marca</h2>
        </SectionTitle>
        <Field>
          Etiqueta
          <Input
            value={form.brandLabel}
            onChange={(e) => setField('brandLabel', e.target.value)}
          />
        </Field>
        {(form.brandMetrics as Metric[]).map((item, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Número {index + 1}</strong>
              {form.brandMetrics.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'brandMetrics',
                      form.brandMetrics.filter(
                        (_: Metric, itemIndex: number) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remover
                </button>
              )}
            </RepeatHeader>
            <Inline>
              <Field>
                Número
                <Input
                  type="number"
                  min="0"
                  value={item.value}
                  onChange={(e) =>
                    setField(
                      'brandMetrics',
                      form.brandMetrics.map(
                        (current: Metric, itemIndex: number) =>
                          itemIndex === index
                            ? { ...current, value: e.target.value }
                            : current,
                      ),
                    )
                  }
                />
              </Field>
              <Field>
                Complemento
                <Input
                  value={item.suffix}
                  onChange={(e) =>
                    setField(
                      'brandMetrics',
                      form.brandMetrics.map(
                        (current: Metric, itemIndex: number) =>
                          itemIndex === index
                            ? { ...current, suffix: e.target.value }
                            : current,
                      ),
                    )
                  }
                  placeholder="Ex.: + ou %"
                />
              </Field>
            </Inline>
            <Field>
              Destaque
              <Input
                value={item.label}
                onChange={(e) =>
                  setField(
                    'brandMetrics',
                    form.brandMetrics.map(
                      (current: Metric, itemIndex: number) =>
                        itemIndex === index
                          ? { ...current, label: e.target.value }
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
                onChange={(e) =>
                  setField(
                    'brandMetrics',
                    form.brandMetrics.map(
                      (current: Metric, itemIndex: number) =>
                        itemIndex === index
                          ? { ...current, description: e.target.value }
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
            setField('brandMetrics', [
              ...form.brandMetrics,
              { value: '', suffix: '', label: '', description: '' },
            ])
          }
        >
          + Adicionar número
        </AddButton>
        <Field>
          Título final
          <Input
            value={form.brandFooterTitle}
            onChange={(e) => setField('brandFooterTitle', e.target.value)}
          />
        </Field>
        <Field>
          Descrição final
          <Textarea
            value={form.brandFooterDescription}
            onChange={(e) => setField('brandFooterDescription', e.target.value)}
          />
        </Field>
      </Section>
      <MediaEditor mediaKey="aboutBrand" title="Imagem da história da marca" />
    </FormColumn>,
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Pilares da marca</h2>
        </SectionTitle>
        <Field>
          Título
          <Input
            value={form.pillarsTitle}
            onChange={(e) => setField('pillarsTitle', e.target.value)}
          />
        </Field>
        {(form.pillarItems as Item[]).map((item, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Pilar {index + 1}</strong>
              {form.pillarItems.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'pillarItems',
                      form.pillarItems.filter(
                        (_: Item, itemIndex: number) => itemIndex !== index,
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
                value={item.title}
                onChange={(e) =>
                  setField(
                    'pillarItems',
                    form.pillarItems.map((current: Item, itemIndex: number) =>
                      itemIndex === index
                        ? { ...current, title: e.target.value }
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
                onChange={(e) =>
                  setField(
                    'pillarItems',
                    form.pillarItems.map((current: Item, itemIndex: number) =>
                      itemIndex === index
                        ? { ...current, description: e.target.value }
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
            setField('pillarItems', [
              ...form.pillarItems,
              { title: '', description: '' },
            ])
          }
        >
          + Adicionar pilar
        </AddButton>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Apresentação da fundadora</h2>
        </SectionTitle>
        <Field>
          Etiqueta
          <Input
            value={form.founderLabel}
            onChange={(e) => setField('founderLabel', e.target.value)}
          />
        </Field>
        <Field>
          Nome
          <Input
            value={form.founderName}
            onChange={(e) => setField('founderName', e.target.value)}
          />
        </Field>
        {(form.founderParagraphs as Paragraph[]).map((item, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Parágrafo {index + 1}</strong>
              {form.founderParagraphs.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'founderParagraphs',
                      form.founderParagraphs.filter(
                        (_: Paragraph, itemIndex: number) =>
                          itemIndex !== index,
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
              <Textarea
                value={item.text}
                onChange={(e) =>
                  setField(
                    'founderParagraphs',
                    form.founderParagraphs.map(
                      (current: Paragraph, itemIndex: number) =>
                        itemIndex === index
                          ? { text: e.target.value }
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
            setField('founderParagraphs', [
              ...form.founderParagraphs,
              { text: '' },
            ])
          }
        >
          + Adicionar parágrafo
        </AddButton>
        <Field>
          Texto do botão
          <Input
            value={form.founderCta}
            onChange={(e) => setField('founderCta', e.target.value)}
          />
        </Field>
      </Section>
      <MediaEditor mediaKey="aboutFounder" title="Imagem da fundadora" />
      <Section>
        <SectionTitle>
          <h2>Locais e presença da marca</h2>
        </SectionTitle>
        <Field>
          Etiqueta
          <Input
            value={form.locationsLabel}
            onChange={(e) => setField('locationsLabel', e.target.value)}
          />
        </Field>
        <Field>
          Título
          <Input
            value={form.locationsHeadline}
            onChange={(e) => setField('locationsHeadline', e.target.value)}
          />
        </Field>
        <Field>
          Descrição
          <Textarea
            value={form.locationsDescription}
            onChange={(e) => setField('locationsDescription', e.target.value)}
          />
        </Field>
        {(form.locationsItems as Location[]).map((item, index) => (
          <Repeatable key={index}>
            <RepeatHeader>
              <strong>Local {index + 1}</strong>
              {form.locationsItems.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setField(
                      'locationsItems',
                      form.locationsItems.filter(
                        (_: Location, itemIndex: number) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Remover
                </button>
              )}
            </RepeatHeader>
            <Field>
              Nome do local
              <Input
                value={item.title}
                onChange={(e) =>
                  setField(
                    'locationsItems',
                    form.locationsItems.map(
                      (current: Location, itemIndex: number) =>
                        itemIndex === index
                          ? { ...current, title: e.target.value }
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
                onChange={(e) =>
                  setField(
                    'locationsItems',
                    form.locationsItems.map(
                      (current: Location, itemIndex: number) =>
                        itemIndex === index
                          ? { ...current, description: e.target.value }
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
            setField('locationsItems', [
              ...form.locationsItems,
              { title: '', description: '' },
            ])
          }
        >
          + Adicionar local
        </AddButton>
      </Section>
      <MediaEditor mediaKey="aboutLocations" title="Imagem dos locais" />
      <Section>
        <SectionTitle>
          <h2>Ingredientes em destaque</h2>
        </SectionTitle>
        <Field>
          Título
          <Input
            value={form.ingredientsHeadline}
            onChange={(e) => setField('ingredientsHeadline', e.target.value)}
          />
        </Field>
        <Field>
          Descrição
          <Textarea
            value={form.ingredientsDescription}
            onChange={(e) => setField('ingredientsDescription', e.target.value)}
          />
        </Field>
        <Field>
          Nota inferior
          <Textarea
            value={form.ingredientsFootnote}
            onChange={(e) => setField('ingredientsFootnote', e.target.value)}
          />
        </Field>
        <Field as="div">
          Ingredientes
          <MultiSelect
            values={form.ingredients}
            options={options.ingredients}
            onChange={(value) => setField('ingredients', value)}
            placeholder="Selecione os ingredientes"
          />
        </Field>
      </Section>
    </FormColumn>,
  ];
  const summaryRows =
    kind === 'site'
      ? [
          ['Nome do site', form.siteName],
          ['E-mail', form.contactEmail || 'Não informado'],
          ['Moeda padrão', form.defaultCurrency],
          [
            'Redes sociais',
            String(
              (form.socialLinks as SocialLink[]).filter((item) =>
                item.label.trim(),
              ).length,
            ),
          ],
          ['Logotipo', media.logo.desktop[0]?.name || 'Não adicionado'],
          [
            'Imagem do rodapé',
            media.footer.desktop[0]?.name || 'Não adicionada',
          ],
        ]
      : kind === 'home'
        ? [
            ['Banners', String(form.heroSlides.length)],
            [
              'Produtos destacados',
              String(
                (form.featuredProducts as string[]).filter(Boolean).length,
              ),
            ],
            [
              'Produto editorial',
              form.editorialCoverProduct ? 'Selecionado' : 'Não selecionado',
            ],
            [
              'Galeria editorial',
              form.editorialGalleryProduct ? 'Selecionada' : 'Não selecionada',
            ],
            [
              'Kit em destaque',
              form.featuredKit ? 'Selecionado' : 'Não selecionado',
            ],
            [
              'Coleção em destaque',
              form.featuredCollection ? 'Selecionada' : 'Não selecionada',
            ],
            ['Ingredientes', String(form.ingredients.length)],
            ['Testemunhos', String(form.testimonials.length)],
            ['Pilares', String(sectionItems(form.pillarItems).length)],
          ]
        : [
            ['Título principal', form.heroHeadline],
            [
              'Imagem do hero',
              media.aboutHero.desktop[0]?.name ||
                media.aboutHero.mobile[0]?.name ||
                media.aboutHero.video[0]?.name ||
                'Não adicionada',
            ],
            [
              'Números da marca',
              String(
                (form.brandMetrics as Metric[]).filter(
                  (item) => item.value !== '',
                ).length,
              ),
            ],
            ['Pilares', String(sectionItems(form.pillarItems).length)],
            ['Fundadora', form.founderName || 'Não preenchida'],
            [
              'Locais',
              String(
                (form.locationsItems as Location[]).filter((item) =>
                  item.title.trim(),
                ).length,
              ),
            ],
            ['Ingredientes', String(form.ingredients.length)],
          ];
  const summary = (
    <FormColumn>
      <Section>
        <SectionTitle>
          <h2>Confirme as alterações</h2>
          <p>
            Os metadados de pesquisa e partilha serão gerados automaticamente.
          </p>
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
  const pageSteps =
    kind === 'site'
      ? [...siteSteps, summary]
      : kind === 'home'
        ? [...homeSteps, summary]
        : [...aboutSteps, summary];
  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    'Utilizador';
  const role = user?.roles?.[0]?.name || 'Admin';
  return (
    <Shell labelledBy="single-type-title">
      <StoreLayout>
        <StoreSidebar activeHref={config.href} />
        <StorePage>
          <Topbar>
            <BackLink to="/">
              <span aria-hidden>←</span>Dashboard
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
            <Title id="single-type-title">{config.title}</Title>
            <Stepper>
              {config.steps.map((label, index) => {
                const number = index + 1;
                return (
                  <StepItem key={label}>
                    <StepButton
                      type="button"
                      disabled={loading}
                      $active={step === number}
                      $done={step > number}
                      onClick={() => setStep(number)}
                    >
                      <span>{step > number ? '✓' : number}</span>
                      {label}
                    </StepButton>
                  </StepItem>
                );
              })}
            </Stepper>
            {message && <Notice $error={message.error}>{message.text}</Notice>}
            <Card>
              {loading ? (
                <Notice>A carregar os dados…</Notice>
              ) : (
                pageSteps[step - 1]
              )}
            </Card>
            {step === 1 ? (
              <FooterSingle>
                <NavButton
                  type="button"
                  $primary
                  disabled={loading || uploading}
                  onClick={() => setStep(2)}
                >
                  Avançar<span>→</span>
                </NavButton>
              </FooterSingle>
            ) : (
              <Footer>
                <NavButton
                  type="button"
                  disabled={saving || uploading}
                  onClick={() => setStep((current) => Math.max(1, current - 1))}
                >
                  <span>←</span>Voltar
                </NavButton>
                {step < config.steps.length ? (
                  <NavButton
                    type="button"
                    $primary
                    disabled={saving || uploading}
                    onClick={() => setStep((current) => current + 1)}
                  >
                    Avançar<span>→</span>
                  </NavButton>
                ) : (
                  <NavButton
                    type="button"
                    $primary
                    disabled={saving || uploading}
                    onClick={() => void save()}
                  >
                    {saving ? 'A publicar…' : 'Publicar alterações'}
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

export const SiteSettingsPage = () => <SingleTypeEditorPage kind="site" />;
export const HomePageEditor = () => <SingleTypeEditorPage kind="home" />;
export const AboutPageEditor = () => <SingleTypeEditorPage kind="about" />;
