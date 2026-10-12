import { useEffect, useMemo, useState } from 'react';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { StoreActionButton } from '../components/StoreActionButton';
import { contentLink, StoreLayout, StorePage, StoreSidebar } from '../components/StoreSidebar';
import { StorePageHeader } from '../components/StorePageHeader';
import { cachedAdminGet } from '../utils/adminRequestCache';

type OrderEntry={id?:number;documentId?:string;placedAt?:string;createdAt?:string;currency?:string;total?:number;paymentStatus?:string;orderStatus?:string};
type Response={results?:OrderEntry[];pagination?:{page?:number;pageCount?:number}};
type DateRange={from:string;to:string};
const Shell=styled.main`min-height:100dvh;color:var(--ps-text);background:var(--ps-canvas-alt);font-family:'Priscila Inter',Inter,Arial,sans-serif;`;
const Body=styled.div`box-sizing:border-box;display:grid;gap:32px;max-width:1229px;margin:0 auto;padding:32px;@media(max-width:44rem){padding:20px}`;
const Filters=styled.form`display:flex;flex-wrap:wrap;align-items:end;gap:12px;padding:18px;border:1px solid var(--ps-border);border-radius:12px;background:var(--ps-surface);label{display:grid;gap:7px;color:var(--ps-text-muted);font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}input{box-sizing:border-box;min-height:48px;padding:11px 14px;border:1px solid var(--ps-border-strong);border-radius:10px;color:var(--ps-text);background:var(--ps-surface);font:inherit;font-size:14px;outline:none}input:focus{border-color:var(--ps-accent-alt);box-shadow:0 0 0 3px rgba(180,150,103,.16)}`;
const CurrencySection=styled.section`display:grid;gap:24px;h2{margin:0;color:var(--ps-heading);font-size:16px;font-weight:600;line-height:19px}`;
const Metrics=styled.div`display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;@media(max-width:70rem){grid-template-columns:repeat(2,1fr)}@media(max-width:38rem){grid-template-columns:1fr}`;
const Metric=styled.article`box-sizing:border-box;display:grid;gap:12px;min-height:108px;padding:24px;border:1px solid var(--ps-border);border-radius:10px;background:var(--ps-surface);span{color:var(--ps-text-muted);font-size:16px;line-height:24px}strong{color:var(--ps-text);font-size:32px;font-weight:600;line-height:40px;font-variant-numeric:tabular-nums}`;
const State=styled.div`padding:28px;border:1px solid var(--ps-border);border-radius:10px;background:var(--ps-surface);color:var(--ps-text-muted);font-size:14px;`;

const paid=(entry:OrderEntry)=>{const payment=String(entry.paymentStatus??'').toLowerCase();const order=String(entry.orderStatus??'').toLowerCase();return payment==='approved'||(payment==='pending'&&['paid','processing','shipped','delivered'].includes(order));};
const refunded=(entry:OrderEntry)=>String(entry.paymentStatus??'').toLowerCase()==='refunded'||String(entry.orderStatus??'').toLowerCase()==='refunded';
const dateOf=(entry:OrderEntry)=>new Date(entry.placedAt??entry.createdAt??0);

export default function RevenuePage(){
  const {get}=useFetchClient();const {locale}=useIntl();const french=locale.toLowerCase().startsWith('fr');
  const [orders,setOrders]=useState<OrderEntry[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
  const [draftRange,setDraftRange]=useState<DateRange>({from:'',to:''});const [appliedRange,setAppliedRange]=useState<DateRange>({from:'',to:''});
  useEffect(()=>{let active=true;(async()=>{try{const all:OrderEntry[]=[];let page=1;let pageCount=1;do{const response=await cachedAdminGet<Response>(get,contentLink('api::order.order'),{params:{page,pageSize:100,sort:'placedAt:desc'}},60_000);const payload=response.data;all.push(...(payload.results??[]));pageCount=payload.pagination?.pageCount??1;page+=1;}while(page<=pageCount);if(active)setOrders(all);}catch{if(active)setError(true);}finally{if(active)setLoading(false);}})();return()=>{active=false};},[get]);
  const filtered=useMemo(()=>orders.filter(entry=>{const value=dateOf(entry);if(Number.isNaN(value.valueOf()))return false;const start=appliedRange.from?new Date(`${appliedRange.from}T00:00:00`):null;const end=appliedRange.to?new Date(`${appliedRange.to}T23:59:59.999`):null;return(!start||value>=start)&&(!end||value<=end);}),[orders,appliedRange]);
  const applyFilters=()=>{if(draftRange.from&&draftRange.to&&draftRange.from>draftRange.to){const normalized={from:draftRange.to,to:draftRange.from};setDraftRange(normalized);setAppliedRange(normalized);return;}setAppliedRange(draftRange);};
  const showAll=()=>{const empty={from:'',to:''};setDraftRange(empty);setAppliedRange(empty);};
  const money=(value:number,currency:string)=>new Intl.NumberFormat(french?'fr-FR':'pt-AO',{style:'currency',currency,maximumFractionDigits:currency==='AOA'?0:2}).format(value);
  const summaries=['AOA','EUR'].map(currency=>{const source=filtered.filter(entry=>(entry.currency??'AOA').toUpperCase()===currency);const approved=source.filter(paid);const refunds=source.filter(refunded);const settled=source.filter(entry=>paid(entry)||refunded(entry));const gross=settled.reduce((sum,item)=>sum+Number(item.total??0),0);const returned=refunds.reduce((sum,item)=>sum+Number(item.total??0),0);return{currency,count:approved.length,gross,returned,net:gross-returned,average:approved.length?approved.reduce((sum,item)=>sum+Number(item.total??0),0)/approved.length:0};});
  return <Shell><StoreLayout><StoreSidebar activeHref="/store/revenue"/><StorePage><StorePageHeader id="revenue-page-title" title={french?'Recettes':'Receitas'} language={french?'fr':'pt'}/><Body><Filters onSubmit={event=>{event.preventDefault();applyFilters();}}><label>{french?'Du':'Desde'}<input type="date" value={draftRange.from} onChange={event=>setDraftRange(current=>({...current,from:event.target.value}))}/></label><label>{french?'Au':'Até'}<input type="date" value={draftRange.to} onChange={event=>setDraftRange(current=>({...current,to:event.target.value}))}/></label><StoreActionButton $primary type="submit">{french?'Filtrer':'Filtrar'}</StoreActionButton><StoreActionButton type="button" onClick={showAll}>{french?'Toute la période':'Todo o período'}</StoreActionButton></Filters>{loading?<State>{french?'Chargement des recettes…':'A carregar receitas…'}</State>:error?<State>{french?'Impossible de charger les données financières.':'Não foi possível carregar os dados financeiros.'}</State>:summaries.map(summary=><CurrencySection key={summary.currency}><h2>{summary.currency}</h2><Metrics><Metric><span>{french?'Montant reçu':'Total recebido'}</span><strong>{money(summary.gross,summary.currency)}</strong></Metric><Metric><span>{french?'Paiements approuvés':'Pagamentos aprovados'}</span><strong>{summary.count}</strong></Metric><Metric><span>{french?'Montant moyen':'Valor médio'}</span><strong>{money(summary.average,summary.currency)}</strong></Metric><Metric><span>{french?'Recette nette':'Receita líquida'}</span><strong>{money(summary.net,summary.currency)}</strong></Metric></Metrics></CurrencySection>)}</Body></StorePage></StoreLayout></Shell>;
}
