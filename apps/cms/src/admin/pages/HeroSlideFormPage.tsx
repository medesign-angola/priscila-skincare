import { CSSProperties, useEffect, useMemo, useState } from 'react';
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
import { StoreSelect } from '../components/StoreSelect';
import { MediaFocalPointPicker } from '../components/MediaFocalPointPicker';

type Asset = {
  id: number;
  name: string;
  url: string;
  mime?: string;
  alternativeText?: string | null;
};
type RelationEntry = {
  id?: number;
  documentId?: string;
  name?: string;
  title?: string;
  label?: string;
  locale?: string;
};
type Pending = {
  id: string;
  name: string;
  preview: string | null;
  progress: number;
};
type EntryResponse = { data?: Record<string, any> };
type RelationResponse = { results?: RelationEntry[] };
type MediaSlot = 'desktop' | 'mobile' | 'video' | 'placeholder';
type ActionType =
  'none' | 'product' | 'kit' | 'collection' | 'category' | 'page' | 'external';

const initial = {
  name: '',
  label: '',
  headline: '',
  description: '',
  presentation: 'split-right',
  order: '0',
  mediaMode: 'image' as 'image' | 'video',
  alt: '',
  focalX: '50',
  focalY: '50',
  objectFit: 'cover',
  noise: false,
  actionType: 'none' as ActionType,
  actionLabel: '',
  actionTarget: '',
  externalUrl: '',
  openInNewTab: true,
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
`;
const Title = styled.h1`
  margin: 0 0 28px;
  color: #2f303a;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.5px;
`;
const Stepper = styled.ol`
  display: flex;
  width: min(100%, 620px);
  align-items: center;
  margin: 0 auto 32px;
  padding: 0;
  list-style: none;
`;
const Step = styled.li`
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
  &:focus-visible {
    outline: 3px solid rgba(139, 112, 72, 0.2);
  }
`;
const Card = styled.section`
  box-sizing: border-box;
  min-height: 600px;
  padding: 64px 32px 72px;
  border-radius: 10px;
  background: #fff;
`;
const Column = styled.div`
  display: grid;
  gap: 30px;
  width: min(100%, 620px);
  margin: 0 auto;
`;
const Section = styled.section`
  display: grid;
  gap: 22px;
`;
const SectionTitle = styled.div`
  display: grid;
  gap: 6px;
  h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.35;
  }
  p {
    max-width: 65ch;
    margin: 0;
    color: #6d675f;
    font-size: 14px;
    line-height: 1.55;
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
  > div,
  > details {
    margin-top: 8px;
  }
  small {
    display: block;
    margin-top: 8px;
    color: #8f887e;
    font-size: 12px;
    font-weight: 400;
  }
  .required {
    margin-left: 2px;
    color: #e15454;
  }
`;
const inputCss = `box-sizing:border-box;width:100%;min-height:52px;padding:12px 14px;border:1px solid rgba(0,0,0,.12);border-radius:10px;color:#1a1917;background:#f7f7f7;font:inherit;font-size:14px;outline:0;&:focus{border-color:#8b7048;box-shadow:0 0 0 3px rgba(139,112,72,.12);}&::placeholder{color:#97928a;}`;
const Input = styled.input`
  ${inputCss}
`;
const Textarea = styled.textarea`
  ${inputCss}min-height:130px;
  resize: vertical;
  line-height: 1.55;
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  @media (max-width: 42rem) {
    grid-template-columns: 1fr;
  }
`;
const Radio = styled.div`
  display: flex;
  gap: 22px;
  margin-top: 10px !important;
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
  input {
    accent-color: #7d6645;
  }
`;
const Upload = styled.label`
  display: grid;
  min-height: 132px;
  place-content: center;
  justify-items: center;
  gap: 10px;
  padding: 22px;
  border: 1px dashed #b9aa95;
  border-radius: 12px;
  color: #7d6645;
  background: #faf9f7;
  cursor: pointer;
  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  strong {
    font-size: 14px;
  }
  small {
    color: #8f887e;
    font-weight: 400;
  }
`;
const AssetCard = styled.div`
  display: grid;
  grid-template-columns: 88px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border: 1px solid #ece8e1;
  border-radius: 12px;
  background: #fafafa;
  img,
  video {
    width: 88px;
    height: 72px;
    border-radius: 8px;
    object-fit: cover;
  }
  strong {
    display: block;
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  button {
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 8px;
    color: #7d6645;
    background: #eeeae4;
    font-size: 20px;
    cursor: pointer;
  }
`;
const Progress = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 500;
`;
const Track = styled.span`
  height: 8px;
  overflow: hidden;
  border-radius: 8px;
  background: #ece8e1;
`;
const Fill = styled.span<{ $value: number }>`
  display: block;
  width: ${({ $value }) => $value}%;
  height: 100%;
  border-radius: inherit;
  background: #8b7048;
  transition: width 180ms ease;
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
const Footer = styled.footer`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-top: 30px;
  padding: 24px;
  background: #fff;
`;
const FooterSingle = styled(Footer)`
  grid-template-columns: minmax(0, 620px);
  justify-content: center;
`;
const Button = styled.button<{ $primary?: boolean }>`
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
const Summary = styled.dl`
  margin: 0;
  div {
    display: grid;
    grid-template-columns: minmax(180px, 0.9fr) minmax(0, 1.2fr);
    gap: 28px;
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
    overflow-wrap: anywhere;
  }
`;
const BannerPreview = styled.div<{ $presentation: string; $image?: string }>`
  position: relative;
  display: grid;
  grid-template-columns: ${({ $presentation }) =>
    $presentation === 'cover' ? '1fr' : 'minmax(0, 1fr) minmax(220px, .9fr)'};
  min-height: 270px;
  overflow: hidden;
  border: 1px solid #ded7cd;
  border-radius: 12px;
  background: #ede8e0;
  &::after {
    display: ${({ $presentation }) =>
      $presentation === 'cover' ? 'block' : 'none'};
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.58),
      rgba(0, 0, 0, 0.08)
    );
    content: '';
  }
  .copy {
    z-index: 1;
    display: grid;
    align-content: center;
    gap: 10px;
    padding: 34px;
    color: ${({ $presentation }) =>
      $presentation === 'cover' ? '#fff' : '#252421'};
  }
  small {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h3 {
    max-width: 15ch;
    margin: 0;
    font-family: Georgia, serif;
    font-size: 30px;
    line-height: 1.05;
  }
  p {
    max-width: 40ch;
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }
  .media {
    position: ${({ $presentation }) =>
      $presentation === 'cover' ? 'absolute' : 'relative'};
    inset: 0;
    min-height: 270px;
    background: ${({ $image }) => ($image ? `url("${$image}")` : '#ded7cd')};
    background-position: var(--focal-x) var(--focal-y);
    background-size: var(--object-fit);
    background-repeat: no-repeat;
  }
  .copy + .media {
    order: 2;
  }
`;

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PS';
}
function relationValue(entry: RelationEntry) {
  return String(entry.documentId ?? entry.id ?? '');
}
function relationLabel(entry: RelationEntry) {
  return (
    entry.name || entry.title || entry.label || `Item ${relationValue(entry)}`
  );
}
function assets(value: unknown): Asset[] {
  if (Array.isArray(value)) return value.filter(Boolean) as Asset[];
  return value && typeof value === 'object' ? [value as Asset] : [];
}
function relation(value: unknown): RelationEntry | undefined {
  return Array.isArray(value)
    ? (value[0] as RelationEntry | undefined)
    : value && typeof value === 'object'
      ? (value as RelationEntry)
      : undefined;
}

export default function HeroSlideFormPage() {
  const { get, post } = useFetchClient();
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const { locale } = useIntl();
  const user = useAuth('HeroSlideFormPage', (state) => state.user);
  const language = locale.toLowerCase().startsWith('fr') ? 'fr' : 'pt';
  const contentLocale =
    searchParams.get('locale') ||
    searchParams.get('plugins[i18n][locale]') ||
    'pt';
  const editing = Boolean(documentId);
  const listLink = storeListLink('banners');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [media, setMedia] = useState<Record<MediaSlot, Asset[]>>({
    desktop: [],
    mobile: [],
    video: [],
    placeholder: [],
  });
  const [options, setOptions] = useState<Record<string, RelationEntry[]>>({
    product: [],
    kit: [],
    collection: [],
    category: [],
  });
  const [pending, setPending] = useState<Record<MediaSlot, Pending[]>>({
    desktop: [],
    mobile: [],
    video: [],
    placeholder: [],
  });
  const [loading, setLoading] = useState(editing);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const setField = (key: keyof typeof initial, value: any) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;
    void Promise.all(
      [
        ['product', 'api::product.product'],
        ['kit', 'api::kit.kit'],
        ['collection', 'api::collection.collection'],
        ['category', 'api::category.category'],
      ].map(async ([key, uid]) => {
        try {
          const response = await get<RelationResponse>(contentLink(uid), {
            params: {
              page: 1,
              pageSize: 200,
              locale: contentLocale,
              sort: 'id:ASC',
            },
          });
          return [key, response.data.results ?? []] as const;
        } catch {
          return [key, []] as const;
        }
      }),
    ).then((values) => {
      if (active) setOptions(Object.fromEntries(values));
    });
    return () => {
      active = false;
    };
  }, [contentLocale, get]);

  useEffect(() => {
    if (!editing || !documentId) return;
    let active = true;
    setLoading(true);
    void get<EntryResponse>(
      `${contentLink('api::hero-slide.hero-slide')}/${documentId}`,
      { params: { locale: contentLocale, status: 'draft' } },
    )
      .then((response) => {
        const data = response.data.data;
        if (!data || !active) return;
        const action = Array.isArray(data.cta) ? data.cta[0] : undefined;
        const component = String(action?.__component ?? '');
        let actionType: ActionType = 'none';
        let actionTarget = '';
        if (component.startsWith('action.')) {
          const suffix = component.slice(7);
          actionType = (
            suffix === 'internal-page'
              ? 'page'
              : suffix === 'external-link'
                ? 'external'
                : suffix
          ) as ActionType;
          const field =
            actionType === 'page'
              ? 'page'
              : actionType === 'external'
                ? 'url'
                : actionType;
          const target = action?.[field];
          actionTarget =
            actionType === 'page' || actionType === 'external'
              ? String(target ?? '')
              : relationValue(relation(target) ?? {});
        }
        setForm({
          ...initial,
          name: String(data.name ?? ''),
          label: String(data.label ?? ''),
          headline: String(data.headline ?? ''),
          description: String(data.description ?? ''),
          presentation: String(data.presentation ?? 'split-right'),
          order: String(data.order ?? 0),
          mediaMode: data.media?.video ? 'video' : 'image',
          alt: String(data.media?.alt ?? ''),
          focalX: String(data.media?.focalPointX ?? 50),
          focalY: String(data.media?.focalPointY ?? 50),
          objectFit: String(data.media?.objectFit ?? 'cover'),
          noise: Boolean(data.media?.hasNoise),
          actionType,
          actionLabel: String(action?.label ?? ''),
          actionTarget: actionType === 'external' ? '' : actionTarget,
          externalUrl: actionType === 'external' ? actionTarget : '',
          openInNewTab: Boolean(action?.openInNewTab ?? true),
        });
        setMedia({
          desktop: assets(data.media?.desktopImage),
          mobile: assets(data.media?.mobileImage),
          video: assets(data.media?.video),
          placeholder: assets(data.media?.placeholder),
        });
      })
      .catch(() => {
        if (active)
          setMessage({
            text: 'Não foi possível carregar este banner.',
            error: true,
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contentLocale, documentId, editing, get]);

  const upload = async (slot: MediaSlot, files: FileList | null) => {
    const file = files?.[0];
    if (!file || uploading) return;
    const id = `${Date.now()}-${slot}`;
    const preview = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : null;
    setPending((current) => ({
      ...current,
      [slot]: [{ id, name: file.name, preview, progress: 0 }],
    }));
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
          setPending((current) => ({
            ...current,
            [slot]: current[slot].map((item) => ({ ...item, progress })),
          }));
        },
      });
      if (response.data?.[0])
        setMedia((current) => ({ ...current, [slot]: [response.data[0]] }));
    } catch {
      setMessage({ text: 'Não foi possível enviar o ficheiro.', error: true });
    } finally {
      if (preview) URL.revokeObjectURL(preview);
      setPending((current) => ({ ...current, [slot]: [] }));
      setUploading(false);
    }
  };
  const remove = (slot: MediaSlot) =>
    setMedia((current) => ({ ...current, [slot]: [] }));
  const mediaField = (slot: MediaSlot, title: string, accept = 'image/*') => (
    <Field as="div">
      {title}
      {media[slot][0] ? (
        <AssetCard>
          {media[slot][0].mime?.startsWith('video') ? (
            <video src={media[slot][0].url} />
          ) : (
            <img
              src={media[slot][0].url}
              alt={media[slot][0].alternativeText || media[slot][0].name}
            />
          )}
          <span>
            <strong>{media[slot][0].name}</strong>
            <small>Ficheiro carregado</small>
          </span>
          <button
            type="button"
            onClick={() => remove(slot)}
            aria-label={`Remover ${title}`}
          >
            ×
          </button>
        </AssetCard>
      ) : pending[slot][0] ? (
        <AssetCard>
          {pending[slot][0].preview ? (
            <img
              src={pending[slot][0].preview}
              alt="Pré-visualização do ficheiro"
            />
          ) : (
            <span />
          )}
          <span>
            <strong>{pending[slot][0].name}</strong>
            <Progress>
              <Track>
                <Fill $value={pending[slot][0].progress} />
              </Track>
              <span>{pending[slot][0].progress}%</span>
            </Progress>
          </span>
          <span />
        </AssetCard>
      ) : (
        <Upload>
          <input
            type="file"
            accept={accept}
            onChange={(event) => void upload(slot, event.target.files)}
          />
          <strong>Adicionar {title.toLowerCase()}</strong>
          <small>Escolha um ficheiro do computador</small>
        </Upload>
      )}
    </Field>
  );

  const targetOptions = useMemo(
    () =>
      form.actionType === 'page'
        ? [
            { value: 'produtos', label: 'Página de produtos' },
            { value: 'sobre', label: 'Página Sobre' },
            { value: 'perfil', label: 'Perfil do cliente' },
            { value: 'encomendas', label: 'Encomendas do cliente' },
          ]
        : (options[form.actionType] ?? []).map((item) => ({
            value: relationValue(item),
            label: relationLabel(item),
          })),
    [form.actionType, options],
  );
  const actionPayload = () => {
    if (form.actionType === 'none') return [];
    if (form.actionType === 'external')
      return [
        {
          __component: 'action.external-link',
          label: form.actionLabel.trim(),
          url: form.externalUrl.trim(),
          openInNewTab: form.openInNewTab,
        },
      ];
    if (form.actionType === 'page')
      return [
        {
          __component: 'action.internal-page',
          label: form.actionLabel.trim(),
          page: form.actionTarget,
        },
      ];
    const selected = options[form.actionType].find(
      (item) => relationValue(item) === form.actionTarget,
    );
    return [
      {
        __component: `action.${form.actionType}`,
        label: form.actionLabel.trim(),
        [form.actionType]: {
          set: selected
            ? [
                {
                  documentId: selected.documentId ?? String(selected.id),
                  locale: selected.locale ?? contentLocale,
                },
              ]
            : [],
        },
      },
    ];
  };
  const validStep = (target: number) => {
    const contentValid = Boolean(
      form.name.trim() &&
      form.label.trim() &&
      form.headline.trim() &&
      form.presentation &&
      form.order !== '',
    );
    const mediaValid = Boolean(media.desktop[0] || media.video[0]);
    const actionValid =
      form.actionType === 'none' ||
      Boolean(
        form.actionLabel.trim() &&
        (form.actionType === 'external'
          ? /^https?:\/\//.test(form.externalUrl)
          : form.actionTarget),
      );
    const valid =
      target === 1
        ? contentValid
        : target === 2
          ? mediaValid && actionValid
          : true;
    if (!valid)
      setMessage({
        text:
          target === 1
            ? 'Preencha os campos obrigatórios do banner.'
            : !mediaValid
              ? 'Adicione uma imagem para computador ou um vídeo.'
              : 'Complete o texto e o destino do botão.',
        error: true,
      });
    else setMessage(null);
    return valid;
  };
  const goTo = (target: number) => {
    for (let current = 1; current < target; current += 1)
      if (!validStep(current)) return;
    setStep(target);
  };
  const save = async () => {
    if (!validStep(1)) {
      setStep(1);
      return;
    }
    if (!validStep(2)) {
      setStep(2);
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        locale: contentLocale,
        name: form.name.trim(),
        label: form.label.trim(),
        headline: form.headline.trim(),
        description: form.description.trim() || null,
        presentation: form.presentation,
        order: Number(form.order),
        media: {
          desktopImage: media.desktop[0]?.id ?? null,
          mobileImage: media.mobile[0]?.id ?? null,
          video: media.video[0]?.id ?? null,
          placeholder: media.placeholder[0]?.id ?? null,
          alt: form.alt.trim() || null,
          focalPointX: Number(form.focalX),
          focalPointY: Number(form.focalY),
          objectFit: form.objectFit,
          hasNoise: form.noise,
        },
        cta: actionPayload(),
        status: 'published',
      };
      const base = contentLink('api::hero-slide.hero-slide');
      await post(
        editing
          ? `${base}/${documentId}/actions/publish`
          : `${base}/actions/publish`,
        payload,
      );
      navigate(listLink, { replace: true });
    } catch (error: any) {
      setMessage({
        text:
          error?.response?.data?.error?.message ||
          'Não foi possível guardar o banner.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <Column>
      <Section>
        <SectionTitle>
          <h2>Conteúdo do banner</h2>
          <p>Defina o texto e a posição deste banner na página inicial.</p>
        </SectionTitle>
        <Field>
          Nome interno <span className="required">*</span>
          <Input
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Ex.: Campanha de verão"
            autoFocus
          />
        </Field>
        <Field>
          Texto de apoio <span className="required">*</span>
          <Input
            value={form.label}
            onChange={(e) => setField('label', e.target.value)}
            placeholder="Ex.: Nova coleção"
          />
        </Field>
        <Field>
          Título principal <span className="required">*</span>
          <Input
            value={form.headline}
            onChange={(e) => setField('headline', e.target.value)}
            placeholder="Insira o título apresentado no site"
          />
        </Field>
        <Field>
          Descrição
          <Textarea
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Explique brevemente a campanha ou destaque"
          />
        </Field>
        <Field as="div">
          Apresentação <span className="required">*</span>
          <StoreSelect
            value={form.presentation}
            onChange={(value) => setField('presentation', value)}
            placeholder="Selecione a apresentação"
            options={[
              {
                value: 'split-right',
                label: 'Conteúdo à esquerda e imagem à direita',
              },
              {
                value: 'cover',
                label: 'Imagem em tela inteira com conteúdo sobreposto',
              },
            ]}
          />
        </Field>
        <Field>
          Ordem de apresentação <span className="required">*</span>
          <Input
            type="number"
            min="0"
            value={form.order}
            onChange={(e) => setField('order', e.target.value)}
          />
          <small>O número menor aparece primeiro.</small>
        </Field>
      </Section>
    </Column>
  );
  const mediaAndAction = (
    <Column>
      <Section>
        <SectionTitle>
          <h2>Imagem ou vídeo</h2>
          <p>Adicione recursos adaptados ao computador e ao telemóvel.</p>
        </SectionTitle>
        <Field as="div">
          Formato principal
          <StoreSelect
            value={form.mediaMode}
            onChange={(value) => {
              const mode = value === 'video' ? 'video' : 'image';
              setField('mediaMode', mode);
              setMedia((current) =>
                mode === 'video'
                  ? { ...current, desktop: [], mobile: [] }
                  : { ...current, video: [], placeholder: [] },
              );
            }}
            placeholder="Escolha o formato"
            options={[
              { value: 'image', label: 'Imagem' },
              { value: 'video', label: 'Vídeo' },
            ]}
          />
        </Field>
        {form.mediaMode === 'image' ? (
          <>
            {mediaField('desktop', 'Imagem para computador')}
            {mediaField('mobile', 'Imagem para telemóvel')}
          </>
        ) : (
          <>
            {mediaField('video', 'Vídeo', 'video/*')}
            {mediaField('placeholder', 'Imagem de espera do vídeo')}
          </>
        )}
        <Field>
          Descrição acessível da imagem
          <Input
            value={form.alt}
            onChange={(e) => setField('alt', e.target.value)}
            placeholder="Descreva o que aparece na imagem"
          />
        </Field>
        {form.mediaMode === 'image' &&
          (media.desktop[0] || media.mobile[0]) && (
            <Field as="div">
              Enquadramento da imagem
              <MediaFocalPointPicker
                src={(media.desktop[0] ?? media.mobile[0]).url}
                x={Number(form.focalX)}
                y={Number(form.focalY)}
                fit={form.objectFit}
                onChange={(x, y) =>
                  setForm((current) => ({
                    ...current,
                    focalX: String(x),
                    focalY: String(y),
                  }))
                }
              />
            </Field>
          )}
        <Field as="div">
          Preenchimento
          <StoreSelect
            value={form.objectFit}
            onChange={(value) => setField('objectFit', value)}
            placeholder="Selecione"
            options={[
              { value: 'cover', label: 'Preencher toda a área' },
              { value: 'contain', label: 'Mostrar a imagem completa' },
            ]}
          />
        </Field>
        <Field as="div">
          Aplicar textura?
          <Radio>
            <label>
              <input
                type="radio"
                checked={form.noise}
                onChange={() => setField('noise', true)}
              />
              Sim
            </label>
            <label>
              <input
                type="radio"
                checked={!form.noise}
                onChange={() => setField('noise', false)}
              />
              Não
            </label>
          </Radio>
        </Field>
      </Section>
      <Section>
        <SectionTitle>
          <h2>Botão do banner</h2>
          <p>Opcional. Defina para onde o cliente será levado ao clicar.</p>
        </SectionTitle>
        <Field as="div">
          Tipo de destino
          <StoreSelect
            value={form.actionType}
            onChange={(value) => {
              setField('actionType', value as ActionType);
              setField('actionTarget', '');
            }}
            placeholder="Sem botão"
            options={[
              { value: 'none', label: 'Sem botão' },
              { value: 'product', label: 'Produto' },
              { value: 'kit', label: 'Kit de produtos' },
              { value: 'collection', label: 'Coleção' },
              { value: 'category', label: 'Categoria' },
              { value: 'page', label: 'Página do site' },
              { value: 'external', label: 'Endereço externo' },
            ]}
          />
        </Field>
        {form.actionType !== 'none' && (
          <>
            <Field>
              Texto do botão <span className="required">*</span>
              <Input
                value={form.actionLabel}
                onChange={(e) => setField('actionLabel', e.target.value)}
                placeholder="Ex.: Comprar agora"
              />
            </Field>
            {form.actionType === 'external' ? (
              <>
                <Field>
                  Endereço externo <span className="required">*</span>
                  <Input
                    type="url"
                    value={form.externalUrl}
                    onChange={(e) => setField('externalUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </Field>
                <Field as="div">
                  Abrir numa nova aba?
                  <Radio>
                    <label>
                      <input
                        type="radio"
                        checked={form.openInNewTab}
                        onChange={() => setField('openInNewTab', true)}
                      />
                      Sim
                    </label>
                    <label>
                      <input
                        type="radio"
                        checked={!form.openInNewTab}
                        onChange={() => setField('openInNewTab', false)}
                      />
                      Não
                    </label>
                  </Radio>
                </Field>
              </>
            ) : (
              <Field as="div">
                Destino <span className="required">*</span>
                <StoreSelect
                  value={form.actionTarget}
                  onChange={(value) => setField('actionTarget', value)}
                  placeholder="Selecione o destino"
                  options={targetOptions}
                />
              </Field>
            )}
          </>
        )}
      </Section>
    </Column>
  );
  const summary = (
    <Column>
      <Section>
        <SectionTitle>
          <h2>Confirme os dados do banner</h2>
          <p>Reveja as informações antes de publicar.</p>
        </SectionTitle>
        <BannerPreview
          $presentation={form.presentation}
          $image={
            (media.desktop[0] ?? media.mobile[0] ?? media.placeholder[0])?.url
          }
          style={
            {
              '--focal-x': `${form.focalX}%`,
              '--focal-y': `${form.focalY}%`,
              '--object-fit':
                form.objectFit === 'contain' ? 'contain' : 'cover',
            } as CSSProperties
          }
        >
          <div className="copy">
            <small>{form.label || 'Texto de apoio'}</small>
            <h3>{form.headline || 'Título do banner'}</h3>
            {form.description && <p>{form.description}</p>}
          </div>
          <div
            className="media"
            aria-label="Pré-visualização da mídia do banner"
          />
        </BannerPreview>
        <Summary>
          {[
            ['Nome interno', form.name],
            ['Texto de apoio', form.label],
            ['Título', form.headline],
            [
              'Apresentação',
              form.presentation === 'cover'
                ? 'Imagem em tela inteira'
                : 'Imagem dividida à direita',
            ],
            ['Ordem', form.order],
            [
              'Imagem para computador',
              media.desktop[0]?.name || 'Não adicionada',
            ],
            ['Vídeo', media.video[0]?.name || 'Não adicionado'],
            [
              'Botão',
              form.actionType === 'none' ? 'Sem botão' : form.actionLabel,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </Summary>
      </Section>
    </Column>
  );
  const pages = [content, mediaAndAction, summary];
  const steps = ['Conteúdo', 'Mídia e ação', 'Resumo'];
  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    'Utilizador';
  const role = user?.roles?.[0]?.name || 'Admin';
  return (
    <Shell labelledBy="banner-title">
      <StoreLayout>
        <StoreSidebar activeHref={listLink} />
        <StorePage>
          <Topbar>
            <Back to={listLink}>
              <span aria-hidden>←</span>Banners
            </Back>
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
            <Title id="banner-title">
              {editing ? 'Editar banner' : 'Novo banner'}
            </Title>
            <Stepper>
              {steps.map((label, index) => {
                const number = index + 1;
                return (
                  <Step key={label}>
                    <StepButton
                      type="button"
                      $active={step === number}
                      $done={step > number}
                      disabled={loading}
                      onClick={() => goTo(number)}
                    >
                      <span>{step > number ? '✓' : number}</span>
                      {label}
                    </StepButton>
                  </Step>
                );
              })}
            </Stepper>
            {message && <Notice $error={message.error}>{message.text}</Notice>}
            <Card>
              {loading ? (
                <Notice>A carregar os dados…</Notice>
              ) : (
                pages[step - 1]
              )}
            </Card>
            {step === 1 ? (
              <FooterSingle>
                <Button
                  type="button"
                  $primary
                  disabled={loading || uploading}
                  onClick={() => {
                    if (validStep(1)) setStep(2);
                  }}
                >
                  Avançar<span>→</span>
                </Button>
              </FooterSingle>
            ) : (
              <Footer>
                <Button
                  type="button"
                  disabled={saving || uploading}
                  onClick={() => setStep((value) => value - 1)}
                >
                  <span>←</span>Voltar
                </Button>
                {step < 3 ? (
                  <Button
                    type="button"
                    $primary
                    disabled={saving || uploading}
                    onClick={() => {
                      if (validStep(2)) setStep(3);
                    }}
                  >
                    Avançar<span>→</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    $primary
                    disabled={saving || uploading}
                    onClick={() => void save()}
                  >
                    {saving
                      ? 'A publicar…'
                      : editing
                        ? 'Guardar alterações'
                        : 'Publicar banner'}
                    <span>→</span>
                  </Button>
                )}
              </Footer>
            )}
          </Workspace>
        </StorePage>
      </StoreLayout>
    </Shell>
  );
}
