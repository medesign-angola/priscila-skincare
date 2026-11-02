import { CommerceSelect as Select } from "./CommerceSelect";
import { useEffect, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { Field, Input, FormCard, FormSection, SectionHeading, FormNotice, FormButton } from './StoreFormPrimitives';
import { CommerceGrid as FormGrid, CommerceStack, CommerceRow, CommerceActions, StockTable, MovementCard } from './CommerceLayout';
import { StoreSelect } from './StoreSelect';

type Stock = { sku: string; onHand: number; reserved: number; available: number };
type Transfer = { id: string; sku: string; quantity: number; destinationLocationId: string; sourceLocationId: string };
export function LocationStockPanel({ id, locations, canWrite, french }: { id: string; locations: { id: string; name: string }[]; canWrite: boolean; french: boolean }) {
  const { get, post } = useFetchClient(); const [stock, setStock] = useState<Stock[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [sku, setSku] = useState(''); const [quantity, setQuantity] = useState(1); const [reason, setReason] = useState(''); const [source, setSource] = useState('');
  const [operationId, setOperationId] = useState(() => crypto.randomUUID());
  const [refresh, setRefresh] = useState(0);
  const [products, setProducts] = useState<{ sku: string; name: string }[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsFailed, setProductsFailed] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [success, setSuccess] = useState('');
  useEffect(() => {
    let active = true;
    const load = async () => {
      const all = new Map<string, { sku: string; name: string }>();
      let page = 1;
      while (active) {
        const response = await get<{ results: { sku?: string; name?: string }[]; pagination?: { pageCount: number } }>('/content-manager/collection-types/api::product.product', { params: { page, pageSize: 100, sort: 'name:ASC', locale: french ? 'fr' : 'pt' } });
        for (const p of response.data.results ?? []) if (p.sku) all.set(p.sku, { sku: p.sku, name: p.name || p.sku });
        if (page >= (response.data.pagination?.pageCount ?? 1)) break;
        page++;
      }
      if (active) setProducts([...all.values()]);
    };
    setProductsLoading(true); setProductsFailed(false);
    void load().catch(() => { if (active) setProductsFailed(true); }).finally(() => { if (active) setProductsLoading(false); });
    return () => { active = false; };
  }, [get, french]);
  const productName = (reference: string) => products.find(p => p.sku === reference)?.name ?? reference;
  useEffect(() => { let active = true; setLoading(true); get<Stock[]>(`/admin/commerce/locations/${id}/stock`).then(r => { if (active) setStock(r.data); }).catch(() => { if (active) setError(french ? 'Impossible de charger le stock.' : 'Não foi possível carregar o stock.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [get, id, refresh, french]);
  const resetOperation = () => setOperationId(crypto.randomUUID());
  useEffect(() => { let active=true; get<Transfer[]>(`/admin/commerce/locations/${id}/transfers`).then(r=>{if(active)setTransfers(r.data);}).catch(()=>{if(active)setError(french?'Impossible de charger les transferts.':'Não foi possível carregar as transferências.');});return()=>{active=false;};},[get,id,refresh,french]);
  const receive = async (operationId: string) => {
    if(saving)return;setSaving(true);setError('');
    try{await post(`/admin/commerce/locations/${id}/transfers`,{operationId});setRefresh(x=>x+1);setSuccess(french ? 'Réception confirmée. Le stock sera actualisé.' : 'Recepção confirmada. O stock será actualizado.');}
    catch{setError(french?'Impossible de confirmer la réception.':'Não foi possível confirmar a recepção.');}
    finally{setSaving(false);}
  };
  const save = async () => {
    if (saving || !sku.trim() || !reason.trim() || !Number.isInteger(quantity) || quantity < 1) return;
    setSaving(true); setError('');
    try { await post(`/admin/commerce/locations/${id}/stock`, { operationId, sku, quantity, reason, sourceLocationId: source || null }); resetOperation(); setReason(''); setShowMovement(false); setSuccess(source ? (french ? 'Transfert enregistré. Confirmez la réception à destination après l’arrivée des produits.' : 'Transferência registada. Confirme a recepção no destino depois da chegada dos produtos.') : (french ? 'Entrée enregistrée.' : 'Entrada registada.')); setRefresh(x => x + 1); }
    catch (e: any) { setError(e?.response?.data?.error?.message ?? (french ? 'Impossible de modifier le stock.' : 'Não foi possível actualizar o stock.')); }
    finally { setSaving(false); }
  };
  return <CommerceStack><FormCard><FormSection><SectionHeading><h2>{french ? 'Stock actuel' : 'Stock actual'}</h2><p>{french ? 'Physique : unités présentes. Réservé : unités affectées aux commandes. Disponible : physique moins réservé.' : 'Físico: unidades nesta localização. Reservado: unidades destinadas a encomendas. Disponível: físico menos reservado.'}</p></SectionHeading>
    {error && <FormNotice $error role="alert">{error}</FormNotice>}
    {success && <FormNotice $success role="status">{success}</FormNotice>}
    {productsFailed && <FormNotice $error role="alert">{french ? 'Impossible de charger les noms des produits. Vérifiez votre accès au catalogue et rechargez la page.' : 'Não foi possível carregar os nomes dos produtos. Verifique o acesso ao catálogo e recarregue a página.'}</FormNotice>}
    {loading ? <p role="status">{french ? 'Chargement…' : 'A carregar…'}</p> : stock.length ? <StockTable><table><thead><tr><th>{french ? 'Produit' : 'Produto'}</th><th>{french ? 'Physique' : 'Físico'}</th><th>{french ? 'Réservé' : 'Reservado'}</th><th>{french ? 'Disponible' : 'Disponível'}</th></tr></thead><tbody>{stock.map(row => <tr key={row.sku}><td>{productName(row.sku)}<small>{row.sku}</small></td><td>{row.onHand}</td><td>{row.reserved}</td><td><strong>{row.available}</strong></td></tr>)}</tbody></table></StockTable> : <FormNotice>{french ? 'Aucun stock enregistré. Enregistrez une entrée ou un transfert pour ajouter des produits.' : 'Sem stock registado. Registe uma entrada ou transferência para adicionar produtos.'}</FormNotice>}
    {canWrite && <CommerceActions><FormButton type="button" $primary disabled={saving} aria-expanded={showMovement} onClick={() => { setShowMovement(v => !v); setSuccess(''); }}>{showMovement ? (french ? 'Fermer le mouvement' : 'Fechar movimento') : (french ? 'Enregistrer un mouvement' : 'Registar movimento')}</FormButton></CommerceActions>}
  </FormSection></FormCard>
    {canWrite && showMovement && <MovementCard><FormSection><SectionHeading><h2>{french ? 'Entrée de stock' : 'Entrada de stock'}</h2><p>{french ? 'Choisissez un nouvel arrivage ou un transfert depuis un autre lieu. Les unités réservées ne peuvent pas être transférées.' : 'Escolha uma nova entrada ou uma transferência de outra localização. Unidades reservadas não podem ser transferidas.'}</p></SectionHeading><FormGrid>
      <Field as="div"><span id="stock-product-label">{french ? 'Produit' : 'Produto'}</span>{saving || productsLoading ? <Input aria-labelledby="stock-product-label" disabled value={saving ? productName(sku) : (french ? 'Chargement…' : 'A carregar…')}/> : <StoreSelect value={sku} options={products.map(p => ({ value: p.sku, label: `${p.name} · ${p.sku}` }))} placeholder={french ? 'Sélectionner un produit' : 'Seleccionar produto'} loadError={productsFailed} onChange={value => { setSku(value); resetOperation(); }}/>}</Field>
      <Field>{french ? 'Quantité' : 'Quantidade'}<Input type="number" min={1} step={1} value={quantity} disabled={saving} onChange={e => { setQuantity(Number(e.target.value)); resetOperation(); }}/></Field>
      <Field as="div">{french ? 'Origine' : 'Origem'}<Select value={source} disabled={saving} onChange={e => { setSource(e.target.value); resetOperation(); }}><option value="">{french ? 'Nouvel arrivage' : 'Nova entrada de mercadoria'}</option>{locations.filter(l => l.id !== id).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
      <Field>{french ? 'Motif' : 'Motivo'}<Input maxLength={500} value={reason} disabled={saving} onChange={e => { setReason(e.target.value); resetOperation(); }}/></Field>
    </FormGrid><CommerceActions><FormButton type="button" $primary disabled={saving || productsFailed || productsLoading || !reason.trim() || !sku.trim() || !Number.isInteger(quantity) || quantity < 1} onClick={() => void save()}>{saving ? (french ? 'Enregistrement…' : 'A guardar…') : (french ? 'Enregistrer le mouvement' : 'Registar movimento')}</FormButton></CommerceActions></FormSection></MovementCard>}
    {transfers.length > 0 && <FormCard><FormSection><SectionHeading><h2>{french ? 'Transferts en transit' : 'Transferências em trânsito'}</h2><p>{french ? 'Ces unités ne sont pas disponibles à destination. Confirmez uniquement après leur réception physique.' : 'Estas unidades ainda não estão disponíveis no destino. Confirme apenas depois de receber fisicamente a mercadoria.'}</p></SectionHeading>{transfers.map(t => <CommerceRow key={t.id}><div><h3>{productName(t.sku)}</h3><p>{t.quantity} {french ? 'unités en transit' : 'unidades em trânsito'} · {t.sku}</p><p>{french ? 'Origine' : 'Origem'}: {locations.find(l => l.id === t.sourceLocationId)?.name ?? '—'}</p><p>{french ? 'Destination' : 'Destino'}: {locations.find(l => l.id === t.destinationLocationId)?.name ?? '—'}</p></div>{canWrite && t.destinationLocationId === id ? <FormButton type="button" disabled={saving} onClick={() => void receive(t.id)}>{french ? 'Confirmer la réception' : 'Confirmar recepção'}</FormButton> : <p>{french ? 'En attente de réception à destination' : 'A aguardar recepção no destino'}</p>}</CommerceRow>)}</FormSection></FormCard>}
  </CommerceStack>;
}
