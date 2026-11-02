import { CommerceSelect as Select } from "../components/CommerceSelect";
import { CommerceWorkspace as FormWorkspace } from '../components/CommerceLayout';
import { useEffect, useState } from 'react';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CommerceGrid as FormGrid, CommerceStack, CommerceActions, CommerceRow } from '../components/CommerceLayout';
import { StoreFormPage, FormHeading, FormCard, FormSection, Field, Input, Textarea, CheckRow, FormNotice, FormFooter, FormButton, Required } from '../components/StoreFormPrimitives';

import countries from '../../../../../packages/core/src/lib/utils/countries.json';

const defaultInstructions = 'Aguarde a confirmação de que a encomenda está pronta e apresente o número da encomenda no levantamento.';

type Location = { id: string; version: string; name: string; isWarehouse: boolean; isActive: boolean; pickupEnabled: boolean; country?: string; city?: string; address?: string; phone?: string; pickupInstructions?: string; pickupHours?: string };
export default function LocationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { get, post, put } = useFetchClient();
  const { locale } = useIntl(); const fr = locale.startsWith('fr');
  const permissions = useAuth('LocationsPage', state => state.permissions);
  const user = useAuth('LocationsPage.user', state => state.user);
  const canWrite = !!user?.roles?.some(role => role.code === 'strapi-super-admin') || permissions.some(p => p.action === 'admin::commerce.update');
  const [rows, setRows] = useState<Location[]>([]); const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Location | null>(null); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  useEffect(() => { let active = true; get<Location[]>('/admin/commerce/locations').then(r => { if (active) setRows(r.data); }).catch(() => { if (active) setError(fr ? 'Impossible de charger les magasins. Vérifiez vos permissions.' : 'Não foi possível carregar as lojas. Verifique as suas permissões.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [get, fr]);
  useEffect(() => { const row = rows.find(row => row.id === searchParams.get('edit')); if (row) setDraft({ ...row, pickupInstructions: row.pickupInstructions || defaultInstructions }); }, [rows, searchParams]);
  const edit = (value: Location) => { setDraft({ ...value, pickupInstructions: value.pickupInstructions || defaultInstructions }); setError(''); setSaved(false); };
  const change = (value: Partial<Location>) => setDraft(current => current ? { ...current, ...value } : current);
  const save = async () => {
    if (!draft || saving) return; setSaving(true); setError(''); setSaved(false);
    try {
      const response = draft.id ? await put<Location>(`/admin/commerce/locations/${draft.id}`, draft) : await post<Location>('/admin/commerce/locations', { name: draft.name, isWarehouse: draft.isWarehouse });
      const value = response.data;
      setRows(current => [...current.filter(row => row.id !== value.id), value].sort((a, b) => a.name.localeCompare(b.name)));
      setDraft({ ...value, pickupInstructions: value.pickupInstructions || defaultInstructions }); setSaved(true);
    } catch (e: any) { setError(e?.response?.data?.error?.message ?? (fr ? 'Impossible de sauvegarder.' : 'Não foi possível guardar.')); }
    finally { setSaving(false); }
  };
  return <StoreFormPage activeHref="/store/locations" backTo="/" backLabel="Dashboard" language={fr ? 'fr' : 'pt'} labelledBy="locations-title"><FormWorkspace>
    <FormHeading><h1 id="locations-title">{fr ? 'Magasins et entrepôts' : 'Lojas e armazéns'}</h1><p>{fr ? 'Configurez les lieux et les informations de retrait.' : 'Configure as localizações e os dados para levantamento.'}</p></FormHeading>
    <FormNotice>{fr ? 'Le retrait au checkout dépend aussi de la disponibilité du stock. Les entrepôts ne proposent pas de retrait.' : 'O levantamento no checkout depende também da disponibilidade de stock. Os armazéns não permitem levantamento.'}</FormNotice>
    {error && <FormNotice $error role="alert">{error}</FormNotice>}
    {saved && <FormNotice $success role="status">{fr ? 'Enregistré.' : 'Guardado.'}</FormNotice>}
    {draft ? <form onSubmit={e => { e.preventDefault(); void save(); }}><FormCard><FormSection><FormGrid>
      <Field><span>{fr ? 'Nom' : 'Nome'} <Required aria-hidden="true">*</Required></span><Input required maxLength={160} value={draft.name} disabled={!canWrite || saving} onChange={e => change({ name: e.target.value })}/></Field>
      </FormGrid>
      {!draft.id ? <CheckRow><input type="checkbox" disabled={!canWrite || saving} checked={draft.isWarehouse} onChange={e => change({ isWarehouse: e.target.checked })}/><strong>{fr ? 'Entrepôt (sans retrait)' : 'Armazém (sem levantamento)'}</strong></CheckRow> : <><FormGrid>
        <Field as="div"><span>{fr ? 'Pays' : 'País'} {draft.pickupEnabled && <Required aria-hidden="true">*</Required>}</span><Select required={draft.pickupEnabled} value={draft.country ?? ''} disabled={!canWrite || saving} onChange={e => change({ country: e.target.value })}><option value="">{fr ? 'Sélectionner un pays' : 'Seleccionar país'}</option>{draft.country && !countries.some(c => c.country === draft.country) && <option value={draft.country}>{draft.country}</option>}{countries.map(c => <option key={c.iso} value={c.country}>{fr ? c.fr : c.country}</option>)}</Select></Field>
        {(['city', 'address', 'phone'] as const).map((key, i) => <Field key={key}><span>{(fr ? ['Ville', 'Adresse', 'Téléphone'] : ['Cidade', 'Morada', 'Telefone'])[i]} {draft.pickupEnabled && <Required aria-hidden="true">*</Required>}</span><Input required={draft.pickupEnabled} type={key === 'phone' ? 'tel' : 'text'} placeholder={key === 'phone' ? '+244 923 456 789' : undefined} disabled={!canWrite || saving} maxLength={[100, 500, 40][i]} value={draft[key] ?? ''} onChange={e => change({ [key]: e.target.value })}/></Field>)}
        </FormGrid>
        <Field><span>{fr ? 'Horaires de retrait' : 'Horário de levantamento'} {draft.pickupEnabled && <Required aria-hidden="true">*</Required>}</span><Textarea placeholder={fr ? 'Ex. : Lundi–vendredi : 8h–15h\nSamedi : 8h–12h\nDimanche : fermé' : 'Ex.: Segunda a sexta: 8h–15h\nSábado: 8h–12h\nDomingo: encerrado'} required={draft.pickupEnabled} disabled={!canWrite || saving} maxLength={500} value={draft.pickupHours ?? ''} onChange={e => change({ pickupHours: e.target.value })}/><small>{fr ? 'Indiquez les jours et les heures réels de ce magasin. Obligatoire pour activer le retrait.' : 'Indique os dias e os horários reais desta loja. Obrigatório para activar o levantamento.'}</small></Field>
        <Field><span>{fr ? 'Instructions de retrait' : 'Instruções de levantamento'} {draft.pickupEnabled && <Required aria-hidden="true">*</Required>}</span><Textarea placeholder={fr ? 'Ex. : Présentez le numéro de commande à l’accueil après confirmation du retrait.' : 'Ex.: Apresente o número da encomenda no balcão depois de receber a confirmação de levantamento.'} required={draft.pickupEnabled} disabled={!canWrite || saving} maxLength={1000} value={draft.pickupInstructions ?? ''} onChange={e => change({ pickupInstructions: e.target.value })}/><small>{fr ? 'Modifiez ce texte selon les consignes du magasin. Le texte existant a été conservé.' : 'Ajuste o texto às instruções da loja. O conteúdo anteriormente registado foi preservado.'}</small></Field>
        <CheckRow><input type="checkbox" disabled={!canWrite || saving} checked={draft.isActive} onChange={e => change({ isActive: e.target.checked, pickupEnabled: e.target.checked && draft.pickupEnabled })}/>{fr ? 'Actif' : 'Activo'}</CheckRow>
        {!draft.isWarehouse && <CheckRow><input type="checkbox" disabled={!canWrite || saving || !draft.isActive} checked={draft.pickupEnabled} onChange={e => change({ pickupEnabled: e.target.checked })}/>{fr ? 'Autoriser le retrait' : 'Permitir levantamento'}</CheckRow>}
      </>}
    </FormSection></FormCard><FormFooter><FormButton type="button" disabled={saving} onClick={() => { setDraft(null); setSearchParams({}); setSaved(false); }}>{fr ? 'Retour' : 'Voltar'}</FormButton>{canWrite && <FormButton $primary type="submit" disabled={saving}>{saving ? (fr ? 'Enregistrement…' : 'A guardar…') : (fr ? 'Enregistrer' : 'Guardar')}</FormButton>}</FormFooter></form> : <>
      <CommerceActions>{canWrite && <FormButton $primary type="button" onClick={() => edit({ id: '', version: '', name: '', isWarehouse: false, isActive: true, pickupEnabled: false })}>{fr ? 'Ajouter un lieu' : 'Adicionar localização'}</FormButton>}</CommerceActions>
      <CommerceStack>{loading ? <FormNotice>{fr ? 'Chargement…' : 'A carregar…'}</FormNotice> : rows.length ? rows.map(row => <CommerceRow key={row.id}><div><h2>{row.name}</h2><p>{row.isWarehouse ? (fr ? 'Entrepôt' : 'Armazém') : (fr ? 'Magasin' : 'Loja')} · {row.isActive ? (fr ? 'Actif' : 'Activo') : (fr ? 'Inactif' : 'Inactivo')}</p><p>{[row.city, row.country].filter(Boolean).join(' · ')}</p></div><div className="location-actions"><FormButton type="button" onClick={() => edit(row)}>{fr ? 'Voir les détails' : 'Ver detalhes'}</FormButton><FormButton type="button" onClick={() => navigate(`/store/locations/${row.id}/stock`)}>{fr ? 'Voir les produits' : 'Ver produtos'}</FormButton></div></CommerceRow>) : <FormNotice>{fr ? 'Aucun lieu enregistré.' : 'Sem localizações registadas.'}</FormNotice>}</CommerceStack>
    </>}
  </FormWorkspace></StoreFormPage>;
}
