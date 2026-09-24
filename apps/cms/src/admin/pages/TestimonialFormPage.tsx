import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import styled from 'styled-components';
import { contentLink, storeListLink } from '../components/StoreSidebar';
import {
  Field,
  FormButton,
  FormCard,
  FormFooter,
  FormGrid,
  FormHeading,
  FormNotice,
  FormSection,
  FormWorkspace,
  Input,
  Required,
  SectionHeading,
  Select,
  StoreFormPage,
  SummaryList,
  Textarea,
} from '../components/StoreFormPrimitives';

type Asset = {
  id: number | string;
  name?: string;
  url?: string;
  mime?: string;
  alternativeText?: string;
};

type TestimonialEntry = {
  name?: string;
  message?: string;
  rating?: number;
  order?: number;
  video?: Asset | Asset[];
  poster?: Asset | Asset[];
};

type EntryResponse = { data?: TestimonialEntry };
type UploadResponse = Asset[];
type MediaKey = 'video' | 'poster';

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 48rem) {
    grid-template-columns: 1fr;
  }
`;

const UploadBox = styled.label`
  position: relative;
  display: grid;
  min-height: 190px;
  place-items: center;
  padding: 24px;
  border: 1px dashed #bca98f;
  border-radius: 12px;
  text-align: center;
  background: #fbfaf8;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease;

  &:hover {
    border-color: #8f7048;
    background: #f8f3ec;
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  strong,
  small {
    display: block;
  }

  strong {
    color: #755a36;
    font-size: 15px;
  }

  small {
    margin-top: 7px;
    color: #817a70;
    font-size: 13px;
    line-height: 1.45;
  }
`;

const MediaCard = styled.article`
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  min-height: 120px;
  padding: 14px;
  border: 1px solid #e4ddd3;
  border-radius: 12px;
  background: #fbfaf8;

  img,
  video,
  .file {
    width: 112px;
    height: 90px;
    border-radius: 9px;
    object-fit: cover;
    background: #e9e4dd;
  }

  .file {
    display: grid;
    place-items: center;
    color: #755a36;
    font-size: 13px;
    font-weight: 750;
  }

  strong,
  small {
    display: block;
  }

  strong {
    overflow-wrap: anywhere;
    color: #292824;
    font-size: 14px;
  }

  small {
    margin-top: 5px;
    color: #817a70;
    font-size: 13px;
  }

  button {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;
    border: 1px solid #decfc0;
    border-radius: 8px;
    color: #8b3340;
    background: #fff;
    font-size: 21px;
    cursor: pointer;
  }
`;

const Progress = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  margin-top: 10px;

  div {
    height: 7px;
    overflow: hidden;
    border-radius: 99px;
    background: #ebe7e1;
  }

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #92754d;
  }

  span {
    color: #625c54;
    font-size: 12px;
    font-weight: 650;
  }
`;

const firstAsset = (value: unknown): Asset | null =>
  Array.isArray(value)
    ? ((value[0] as Asset | undefined) ?? null)
    : value && typeof value === 'object'
      ? (value as Asset)
      : null;

export default function TestimonialFormPage() {
  const { get, post } = useFetchClient();
  const { locale } = useIntl();
  const navigate = useNavigate();
  const { documentId } = useParams<{ documentId: string }>();
  const [searchParams] = useSearchParams();
  const language = locale.toLowerCase().startsWith('fr') ? 'fr' : 'pt';
  const contentLocale = searchParams.get('locale') || 'pt';
  const editing = Boolean(documentId);
  const listLink = storeListLink('testimonials');
  const [form, setForm] = useState({
    name: '',
    message: '',
    rating: '5',
    order: '0',
  });
  const [media, setMedia] = useState<Record<MediaKey, Asset | null>>({
    video: null,
    poster: null,
  });
  const [pending, setPending] = useState<
    Partial<Record<MediaKey, { name: string; progress: number; preview?: string }>>
  >({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!editing || !documentId) return;
    let active = true;
    setLoading(true);
    void get<EntryResponse>(
      `${contentLink('api::testimonial.testimonial')}/${documentId}`,
      { params: { locale: contentLocale, status: 'draft' } },
    )
      .then((response) => {
        if (!active || !response.data.data) return;
        const entry = response.data.data;
        setForm({
          name: String(entry.name ?? ''),
          message: String(entry.message ?? ''),
          rating: String(entry.rating ?? 5),
          order: String(entry.order ?? 0),
        });
        setMedia({
          video: firstAsset(entry.video),
          poster: firstAsset(entry.poster),
        });
      })
      .catch(() =>
        active &&
        setMessage({
          text: 'Não foi possível carregar este testemunho.',
          error: true,
        }),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [contentLocale, documentId, editing, get]);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const upload = async (key: MediaKey, files: FileList | null) => {
    const file = files?.[0];
    if (!file || uploading) return;
    const preview = file.type.startsWith('image/')
      ? URL.createObjectURL(file)
      : undefined;
    setUploading(true);
    setPending((current) => ({
      ...current,
      [key]: { name: file.name, progress: 0, preview },
    }));
    try {
      const body = new FormData();
      body.append('files', file);
      const response = await post<UploadResponse>('/upload', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event: { loaded: number; total?: number }) => {
          const progress = event.total
            ? Math.min(95, Math.round((event.loaded / event.total) * 100))
            : 45;
          setPending((current) => ({
            ...current,
            [key]: current[key]
              ? { ...current[key]!, progress }
              : undefined,
          }));
        },
      });
      if (response.data[0]) {
        setMedia((current) => ({ ...current, [key]: response.data[0] }));
      }
    } catch {
      setMessage({
        text: 'Não foi possível enviar o ficheiro. Tente novamente.',
        error: true,
      });
    } finally {
      if (preview) URL.revokeObjectURL(preview);
      setPending((current) => ({ ...current, [key]: undefined }));
      setUploading(false);
    }
  };

  const mediaField = (
    key: MediaKey,
    title: string,
    help: string,
    accept: string,
  ) => {
    const asset = media[key];
    const progress = pending[key];
    return (
      <Field as="div">
        <span>
          {title} {key === 'video' && <Required>*</Required>}
        </span>
        {asset ? (
          <MediaCard>
            {asset.mime?.startsWith('video') ? (
              <video src={asset.url} preload="metadata" />
            ) : asset.url ? (
              <img
                src={asset.url}
                alt={asset.alternativeText || asset.name || title}
              />
            ) : (
              <span className="file">Ficheiro</span>
            )}
            <span>
              <strong>{asset.name || title}</strong>
              <small>Ficheiro carregado</small>
            </span>
            <button
              type="button"
              onClick={() =>
                setMedia((current) => ({ ...current, [key]: null }))
              }
              aria-label={`Remover ${title.toLowerCase()}`}
            >
              ×
            </button>
          </MediaCard>
        ) : progress ? (
          <MediaCard>
            {progress.preview ? (
              <img src={progress.preview} alt="Pré-visualização do ficheiro" />
            ) : (
              <span className="file">A enviar</span>
            )}
            <span>
              <strong>{progress.name}</strong>
              <Progress>
                <div>
                  <i style={{ width: `${progress.progress}%` }} />
                </div>
                <span>{progress.progress}%</span>
              </Progress>
            </span>
            <span />
          </MediaCard>
        ) : (
          <UploadBox>
            <input
              type="file"
              accept={accept}
              onChange={(event) => void upload(key, event.target.files)}
            />
            <span>
              <strong>Selecionar {title.toLowerCase()}</strong>
              <small>{help}</small>
            </span>
          </UploadBox>
        )}
      </Field>
    );
  };

  const save = async () => {
    if (!form.name.trim() || !media.video) {
      setMessage({
        text: 'Informe o nome da cliente e adicione o vídeo do testemunho.',
        error: true,
      });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const base = contentLink('api::testimonial.testimonial');
      await post(
        editing
          ? `${base}/${documentId}/actions/publish`
          : `${base}/actions/publish`,
        {
          locale: contentLocale,
          name: form.name.trim(),
          message: form.message.trim() || null,
          rating: Number(form.rating),
          order: Number(form.order || 0),
          video: media.video.id,
          poster: media.poster?.id ?? null,
          status: 'published',
        },
      );
      navigate(listLink, { replace: true });
    } catch (error: any) {
      setMessage({
        text:
          error?.response?.data?.error?.message ||
          'Não foi possível guardar o testemunho.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <StoreFormPage
      activeHref={listLink}
      backTo={listLink}
      backLabel="Testemunhos em vídeo"
      language={language}
      labelledBy="testimonial-form-title"
    >
      <FormWorkspace>
        <FormHeading>
          <h1 id="testimonial-form-title">
            {editing ? 'Editar testemunho' : 'Novo testemunho em vídeo'}
          </h1>
          <p>
            Organize o vídeo, a imagem de capa e as informações apresentadas na
            secção de testemunhos do site.
          </p>
        </FormHeading>
        {message && (
          <FormNotice $error={message.error} role={message.error ? 'alert' : 'status'}>
            {message.text}
          </FormNotice>
        )}
        <FormCard>
          {loading ? (
            <FormSection>
              <FormNotice>A carregar os dados…</FormNotice>
            </FormSection>
          ) : (
            <>
              <FormSection>
                <SectionHeading>
                  <h2>Informações do testemunho</h2>
                  <p>
                    Estes dados ajudam a identificar e ordenar o testemunho no
                    site.
                  </p>
                </SectionHeading>
                <FormGrid>
                  <Field>
                    <span>
                      Nome da cliente <Required>*</Required>
                    </span>
                    <Input
                      value={form.name}
                      onChange={(event) => setField('name', event.target.value)}
                      placeholder="Insira o nome apresentado no site"
                      autoFocus
                    />
                  </Field>
                  <Field>
                    Classificação
                    <Select
                      value={form.rating}
                      onChange={(event) => setField('rating', event.target.value)}
                    >
                      <option value="5">5 estrelas</option>
                      <option value="4">4 estrelas</option>
                      <option value="3">3 estrelas</option>
                      <option value="2">2 estrelas</option>
                      <option value="1">1 estrela</option>
                    </Select>
                  </Field>
                </FormGrid>
                <Field>
                  Mensagem apresentada
                  <Textarea
                    value={form.message}
                    onChange={(event) => setField('message', event.target.value)}
                    placeholder="Escreva uma frase curta que acompanha o vídeo"
                  />
                </Field>
                <Field>
                  Posição na lista
                  <Input
                    type="number"
                    min="0"
                    value={form.order}
                    onChange={(event) => setField('order', event.target.value)}
                  />
                  <small>Os números menores aparecem primeiro.</small>
                </Field>
              </FormSection>
              <FormSection>
                <SectionHeading>
                  <h2>Vídeo e imagem de capa</h2>
                  <p>
                    O vídeo é obrigatório. A imagem de capa melhora a apresentação
                    enquanto o vídeo ainda não começou.
                  </p>
                </SectionHeading>
                <MediaGrid>
                  {mediaField(
                    'video',
                    'Vídeo do testemunho',
                    'Escolha um vídeo do computador.',
                    'video/*',
                  )}
                  {mediaField(
                    'poster',
                    'Imagem de capa',
                    'Escolha a imagem mostrada antes da reprodução.',
                    'image/*',
                  )}
                </MediaGrid>
              </FormSection>
              <FormSection>
                <SectionHeading>
                  <h2>Resumo</h2>
                  <p>Confirme as informações antes de guardar.</p>
                </SectionHeading>
                <SummaryList>
                  <div>
                    <dt>Cliente</dt>
                    <dd>{form.name || 'Não informado'}</dd>
                  </div>
                  <div>
                    <dt>Classificação</dt>
                    <dd>{form.rating} de 5 estrelas</dd>
                  </div>
                  <div>
                    <dt>Vídeo</dt>
                    <dd>{media.video?.name || 'Não adicionado'}</dd>
                  </div>
                  <div>
                    <dt>Imagem de capa</dt>
                    <dd>{media.poster?.name || 'Não adicionada'}</dd>
                  </div>
                </SummaryList>
              </FormSection>
              <FormFooter>
                <FormButton type="button" onClick={() => navigate(listLink)}>
                  Cancelar
                </FormButton>
                <FormButton
                  type="button"
                  $primary
                  disabled={saving || uploading}
                  onClick={() => void save()}
                >
                  {saving
                    ? 'A guardar…'
                    : editing
                      ? 'Guardar alterações'
                      : 'Publicar testemunho'}
                </FormButton>
              </FormFooter>
            </>
          )}
        </FormCard>
      </FormWorkspace>
    </StoreFormPage>
  );
}
