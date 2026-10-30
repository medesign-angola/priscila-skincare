import { CommerceSelect as Select } from "../components/CommerceSelect";
import { CommerceWorkspace as FormWorkspace } from '../components/CommerceLayout';
import { useEffect, useState } from 'react';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { StoreFormPage, FormHeading, FormCard, FormSection, Field, Input, CheckRow, FormNotice, FormFooter, FormButton } from '../components/StoreFormPrimitives';
import { CommerceGrid as FormGrid, CommerceStack, CommerceActions, CommerceRow } from '../components/CommerceLayout';

import countries from '../../../../../packages/core/src/lib/utils/countries.json';

type Definition = { key: string; pt: string; fr: string; type?: 'number' | 'date'; optional?: boolean; options?: [string, string, string][] };
const currency: Definition = { key: 'currency', pt: 'Moeda', fr: 'Devise', options: [['AOA', 'AOA', 'AOA'], ['EUR', 'EUR', 'EUR']] };
const rates: Definition[] = [
  { key: 'name', pt: 'Nome da zona/tarifa', fr: 'Nom de la zone/du tarif' },
  { key: 'country', pt: 'País de entrega', fr: 'Pays de livraison', options: countries.map(c => [c.country, c.country, c.fr]) },
  { key: 'province', pt: 'Limitar a uma província/região', fr: 'Limiter à une province/région', optional: true },
  { key: 'carrier', pt: 'Transportadora', fr: 'Transporteur' }, { key: 'service', pt: 'Modalidade de entrega', fr: 'Mode de livraison' }, currency,
  { key: 'amount', pt: 'Valor da entrega', fr: 'Prix de livraison', type: 'number' },
  { key: 'minimumDays', pt: 'Prazo mínimo (dias)', fr: 'Délai minimum (jours)', type: 'number' },
  { key: 'maximumDays', pt: 'Prazo máximo (dias)', fr: 'Délai maximum (jours)', type: 'number' },
];
const promotions: Definition[] = [
  { key: 'name', pt: 'Nome da campanha', fr: 'Nom de la campagne' },
  { key: 'coupon', pt: 'Exigir cupão', fr: 'Exiger un code promo', optional: true },
  { key: 'startsAt', pt: 'Início (hora local)', fr: 'Début (heure locale)', type: 'date' },
  { key: 'endsAt', pt: 'Fim (hora local)', fr: 'Fin (heure locale)', type: 'date' }, currency,
  { key: 'benefit', pt: 'Benefício', fr: 'Avantage', options: [['0', 'Percentagem', 'Pourcentage'], ['1', 'Valor fixo', 'Montant fixe'], ['2', 'Entrega gratuita', 'Livraison offerte']] },
  { key: 'value', pt: 'Valor do desconto', fr: 'Valeur de la réduction', type: 'number' },
  { key: 'minimumSubtotal', pt: 'Compra mínima', fr: 'Montant minimum', type: 'number' },
  { key: 'maximumUses', pt: 'Limitar utilizações totais', fr: 'Limiter le nombre total', type: 'number', optional: true },
  { key: 'maximumUsesPerCustomer', pt: 'Limitar utilizações por cliente', fr: 'Limiter par client', type: 'number', optional: true },
  { key: 'itemType', pt: 'Aplicar apenas a um tipo de artigo', fr: 'Appliquer uniquement à un type d’article', optional: true, options: [['0', 'Produto', 'Produit'], ['1', 'Kit', 'Kit'], ['2', 'Coleção', 'Collection']] },
  { key: 'itemReference', pt: 'Aplicar apenas a um artigo específico', fr: 'Appliquer uniquement à un article précis', optional: true },
];
type Entry = Record<string, any>;
function localDate(value: string) { const d = new Date(value); if (Number.isNaN(d.valueOf())) return ''; return new Date(d.valueOf() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
function CommerceRulesPage({ kind }: { kind: 'delivery-rates' | 'promotions' }) {
  const { get, post } = useFetchClient(); const { locale } = useIntl(); const fr = locale.startsWith('fr');
  const permissions = useAuth('CommerceRulesPage', s => s.permissions); const user = useAuth('CommerceRulesPage.user', s => s.user);
  const canWrite = !!user?.roles?.some(r => r.code === 'strapi-super-admin') || permissions.some(p => p.action === 'admin::commerce.update');
  const [rows, setRows] = useState<Entry[]>([]); const [draft, setDraft] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState(false);
  const title = kind === 'promotions' ? (fr ? 'Promotions et codes promo' : 'Promoções e cupões') : (fr ? 'Zones et tarifs de livraison' : 'Zonas e tarifas de entrega');
  const [articles, setArticles] = useState<[string, string, string][]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articlesError, setArticlesError] = useState(false);
  const itemType = draft?.itemType;
  const referenceEnabled = draft?.itemReference != null;
  useEffect(() => {
    if (kind !== 'promotions' || itemType == null || !referenceEnabled) return;
    let active = true;
    setArticles([]); setArticlesLoading(true); setArticlesError(false);
    const entity = ['product', 'kit', 'collection'][Number(itemType)];
    const load = async () => {
      const found = new Map<string, [string, string, string]>();
      for (let page = 1; active; page++) {
        const response = await get<{ results: Entry[]; pagination?: { pageCount: number } }>(`/content-manager/collection-types/api::${entity}.${entity}`, { params: { page, pageSize: 100, sort: 'name:ASC', locale: fr ? 'fr' : 'pt' } });
        for (const entry of response.data.results ?? []) {
          const reference = entity === 'product' ? entry.sku : entry.documentId;
          if (reference) found.set(reference, [reference, entry.name || reference, entry.name || reference]);
        }
        if (page >= (response.data.pagination?.pageCount ?? 1)) break;
      }
      if (active) setArticles([...found.values()]);
    };
    void load().catch(() => { if (active) setArticlesError(true); }).finally(() => { if (active) setArticlesLoading(false); });
    return () => { active = false; };
  }, [get, kind, itemType, referenceEnabled, fr]);
  const fields = kind === 'promotions' ? promotions.map(f => f.key === 'itemReference' ? { ...f, options: articles } : f) : rates;
  useEffect(() => { let active = true; setLoading(true); get<Entry[]>(`/admin/commerce/${kind}`).then(r => { if (active) setRows(r.data); }).catch(() => { if (active) setError(fr ? 'Impossible de charger. Vérifiez vos permissions.' : 'Não foi possível carregar. Verifique as permissões.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [get, kind, fr]);
  const change = (key: string, value: unknown) => setDraft(d => d ? { ...d, [key]: value, ...(key === 'itemType' ? { itemReference: null } : {}), ...(key === 'itemReference' && value != null && d.itemType == null ? { itemType: 0 } : {}) } : d);
  const edit = (value: Entry) => { setDraft({ ...value }); setError(''); setSuccess(false); };
  const create = () => edit(kind === 'promotions' ? { name: '', isActive: false, currency: 'AOA', benefit: 0, value: 0, minimumSubtotal: 0, firstPurchaseOnly: false, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 30 * 86400000).toISOString() } : { name: '', country: '', carrier: '', service: '', currency: 'AOA', amount: 0, minimumDays: 0, maximumDays: 0, isActive: false });
  const save = async () => {
    if (!draft || saving) return;
    if (draft.itemReference != null && (articlesLoading || articlesError || !articles.some(([value]) => value === draft.itemReference))) { setError(fr ? 'Sélectionnez un article disponible dans la liste.' : 'Seleccione um artigo disponível na lista.'); return; }
    setSaving(true); setError(''); setSuccess(false);
    try { const result = await post<Entry>(`/admin/commerce/${kind}`, draft); setDraft(result.data); setRows(current => [...current.filter(r => r.id !== result.data.id), result.data]); setSuccess(true); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? (fr ? 'Impossible de sauvegarder.' : 'Não foi possível guardar.')); }
    finally { setSaving(false); }
  };
  return <StoreFormPage activeHref={`/store/${kind}`} backTo="/" backLabel="Dashboard" language={fr ? 'fr' : 'pt'} labelledBy="commercial-title"><FormWorkspace>
    <FormHeading><h1 id="commercial-title">{title}</h1></FormHeading>
    <FormNotice>{kind === 'promotions' ? (fr ? 'Les offres ne se cumulent pas : la meilleure réduction applicable est retenue. Les dates suivent votre fuseau horaire.' : 'As ofertas não acumulam: é aplicado o melhor desconto elegível. As datas seguem o fuso horário do seu dispositivo.') : (fr ? 'Saisissez uniquement les tarifs convenus avec vos transporteurs. Une ligne par zone, service et devise.' : 'Insira apenas as tarifas acordadas com as transportadoras. Uma tarifa por zona, serviço e moeda.')}</FormNotice>
    {error && <FormNotice $error role="alert">{error}</FormNotice>}{success && <FormNotice $success role="status">{fr ? 'Enregistré.' : 'Guardado.'}</FormNotice>}
    {draft ? <form onSubmit={e => { e.preventDefault(); void save(); }}><FormCard><FormSection><FormGrid>
      {fields.filter(f => !(f.key === 'value' && draft.benefit === 2)).sort((a, b) => Number(!!a.optional) - Number(!!b.optional)).map(f => {
        const enabled = draft[f.key] !== null && draft[f.key] !== undefined;
        return <div key={f.key} className={f.optional ? 'commerce-option' : undefined}>{f.optional && <CheckRow><input type="checkbox" disabled={saving || !canWrite} checked={enabled} onChange={e => change(f.key, e.target.checked ? (f.key === 'itemReference' ? '' : f.type === 'number' ? 1 : f.options ? Number(f.options[0][0]) : '') : null)}/><strong>{fr ? f.fr : f.pt}</strong></CheckRow>}
          {(!f.optional || enabled) && <Field as="div"><span>{fr ? f.fr : f.pt}</span>{f.options ? <Select required={!f.optional || enabled} disabled={saving || !canWrite || (f.key === 'itemReference' && (articlesLoading || articlesError))} value={draft[f.key] ?? ''} onChange={e => change(f.key, ['currency', 'country', 'itemReference'].includes(f.key) ? e.target.value : Number(e.target.value))}>{f.key === 'itemReference' && <option value="">{articlesLoading ? (fr ? 'Chargement…' : 'A carregar…') : (fr ? 'Sélectionner un article' : 'Seleccionar artigo')}</option>}{f.key === 'country' && <option value="">{fr ? 'Sélectionner un pays' : 'Seleccionar país'}</option>}{f.key === 'country' && draft.country && !f.options.some(([value]) => value === draft.country) && <option value={draft.country}>{draft.country}</option>}{f.options.map(([value, pt, french]) => <option key={value} value={value}>{fr ? french : pt}</option>)}</Select> : <Input placeholder={f.key === 'service' ? (fr ? 'Ex. : Express, Standard ou livraison locale' : 'Ex.: Expresso, Standard ou entrega local') : undefined} required={!f.optional || enabled} disabled={saving || !canWrite} type={f.type === 'date' ? 'datetime-local' : f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 0 : undefined} step={f.type === 'number' ? (['amount', 'value', 'minimumSubtotal'].includes(f.key) ? '0.01' : '1') : undefined} value={f.type === 'date' ? localDate(draft[f.key]) : draft[f.key] ?? ''} onChange={e => change(f.key, f.type === 'date' ? (e.target.value ? new Date(e.target.value).toISOString() : '') : f.type === 'number' ? Number(e.target.value) : e.target.value)}/>}{f.key === 'itemReference' && <small>{articlesError ? (fr ? 'Impossible de charger le catalogue. Vérifiez vos permissions.' : 'Não foi possível carregar o catálogo. Verifique as permissões.') : (fr ? 'Choisissez un seul article du type sélectionné.' : 'Escolha um único artigo do tipo seleccionado.')}</small>}{f.key === 'service' && <small>{fr ? 'Modalité proposée par le transporteur, avec son tarif et son délai.' : 'Modalidade disponibilizada pela transportadora, com o respectivo preço e prazo.'}</small>}</Field>}
        </div>;
      })}
      </FormGrid><CommerceStack>
      <CheckRow><input type="checkbox" disabled={saving || !canWrite} checked={draft.isActive} onChange={e => change('isActive', e.target.checked)}/>{fr ? 'Actif' : 'Activo'}</CheckRow>
      {kind === 'promotions' && <CheckRow><input type="checkbox" disabled={saving || !canWrite} checked={draft.firstPurchaseOnly} onChange={e => change('firstPurchaseOnly', e.target.checked)}/>{fr ? 'Première commande uniquement' : 'Apenas na primeira compra'}</CheckRow>}
    </CommerceStack></FormSection></FormCard><FormFooter><FormButton type="button" disabled={saving} onClick={() => setDraft(null)}>{fr ? 'Retour' : 'Voltar'}</FormButton>{canWrite && <FormButton $primary disabled={saving} type="submit">{saving ? (fr ? 'Enregistrement…' : 'A guardar…') : (fr ? 'Enregistrer' : 'Guardar')}</FormButton>}</FormFooter></form> : <>
      <CommerceActions>{canWrite && <FormButton $primary type="button" onClick={create}>{fr ? 'Ajouter' : 'Adicionar'}</FormButton>}</CommerceActions>
      <CommerceStack>{loading ? <FormNotice>{fr ? 'Chargement…' : 'A carregar…'}</FormNotice> : rows.length ? rows.map(r => <CommerceRow key={r.id}><div><h2>{r.name}</h2><p>{r.isActive ? (fr ? 'Actif' : 'Activo') : (fr ? 'Inactif' : 'Inactivo')} · {r.currency}</p></div><FormButton type="button" onClick={() => edit(r)}>{fr ? 'Voir les détails' : 'Ver detalhes'}</FormButton></CommerceRow>) : <FormNotice>{fr ? 'Aucun élément enregistré.' : 'Sem elementos registados.'}</FormNotice>}</CommerceStack>
    </>}
  </FormWorkspace></StoreFormPage>;
}
export function DeliveryRatesPage() { return <CommerceRulesPage kind="delivery-rates"/>; }
export function PromotionsPage() { return <CommerceRulesPage kind="promotions"/>; }
