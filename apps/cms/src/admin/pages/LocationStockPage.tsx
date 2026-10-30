import { CommerceWorkspace as FormWorkspace } from '../components/CommerceLayout';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { LocationStockPanel } from '../components/LocationStockPanel';
import { StoreFormPage, FormHeading, FormNotice } from '../components/StoreFormPrimitives';

export default function LocationStockPage() {
  const { id } = useParams<{ id: string }>();
  const { get } = useFetchClient();
  const { locale } = useIntl();
  const fr = locale.startsWith('fr');
  const permissions = useAuth('LocationStockPage', s => s.permissions);
  const user = useAuth('LocationStockPage.user', s => s.user);
  const canWrite = !!user?.roles?.some(r => r.code === 'strapi-super-admin') || permissions.some(p => p.action === 'admin::commerce.update');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    get<typeof locations>('/admin/commerce/locations').then(r => { if (active) setLocations(r.data); })
      .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [get]);
  const location = locations.find(l => l.id === id);
  return <StoreFormPage activeHref="/store/locations" backTo={`/store/locations?edit=${id ?? ''}`} backLabel={fr ? 'Retour au lieu' : 'Voltar à localização'} language={fr ? 'fr' : 'pt'} labelledBy="stock-title"><FormWorkspace>
    <FormHeading><h1 id="stock-title">{fr ? 'Produits et stock' : 'Produtos e stock'}</h1><p>{location?.name}</p></FormHeading>
    {loading ? <FormNotice>{fr ? 'Chargement…' : 'A carregar…'}</FormNotice> : error || !location ? <FormNotice $error role="alert">{fr ? 'Impossible de charger ce lieu.' : 'Não foi possível carregar esta localização.'}</FormNotice> : <LocationStockPanel id={location.id} locations={locations} canWrite={canWrite} french={fr}/>}
  </FormWorkspace></StoreFormPage>;
}
