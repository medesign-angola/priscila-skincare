import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Main } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  contentLink,
  StoreLayout,
  StorePage,
  StoreSidebar,
  storeListLink,
} from '../components/StoreSidebar';

type Entry = Record<string, unknown> & {
  id?: number;
  documentId?: string;
  locale?: string;
  publishedAt?: string | null;
  status?: string;
  orderStatus?: string;
  paymentStatus?: string;
  moderationStatus?: string;
};

interface CollectionResponse {
  results?: Entry[];
  pagination?: {
    page?: number;
    pageCount?: number;
    total?: number;
  };
}

interface CollectionEnvelope {
  data?: CollectionResponse;
}

type Language = 'pt' | 'fr';
type FilterOption = { value: string; pt: string; fr: string };
type Column = {
  key: string;
  pt: string;
  fr: string;
  width: string;
  primary?: boolean;
  value: (entry: Entry, language: Language) => string;
};

type PageConfig = {
  resource: string;
  uid: string;
  endpoint?: string;
  createLink?: string | ((contentLocale: Language) => string);
  editLink?: (entry: Entry) => string;
  title: Record<Language, string>;
  createLabel: Record<Language, string>;
  columns: Column[];
  localized?: boolean;
  filterField?: string;
  filterOptions?: FilterOption[];
  defaultSort?: string;
  minWidth?: number;
  emptyIcon?: string;
  emptyMessage?: Record<Language, string>;
  emptyActionLabel?: Record<Language, string>;
  canCreate?: boolean;
  canDelete?: boolean;
};

const asset = (name: string) => `/admin/admin/products/${name}.svg`;
const text = (entry: Entry, field: string) => {
  const value = entry[field];
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '—';
};

const localizedValue = (_entry: Entry, language: Language) =>
  language === 'fr' ? 'Français (fr)' : 'Português (pt)';

const adminUserName = (entry: Entry) => {
  const fullName = [entry.firstname, entry.lastname]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ');
  return fullName || text(entry, 'username');
};

const adminUserRole = (entry: Entry) => {
  if (!Array.isArray(entry.roles)) return '—';
  const names = entry.roles
    .map((role) =>
      role && typeof role === 'object' && 'name' in role
        ? String(role.name)
        : '',
    )
    .filter(Boolean);
  return names.length ? names.join(', ') : '—';
};

const adminUserState = (entry: Entry, language: Language) => {
  const active = entry.isActive !== false && entry.blocked !== true;
  if (language === 'fr') return active ? 'Actif' : 'Inactif';
  return active ? 'Ativo' : 'Inativo';
};

const getOrderStatus = (entry: Entry) => {
  if (typeof entry.orderStatus === 'string') {
    const status = entry.orderStatus.toLowerCase();
    if (status === 'paid' || status === 'paymentfailed') return 'confirmed';
    if (status === 'refunded') return 'cancelled';
    return status;
  }
  let timeline = entry.timeline;
  if (typeof timeline === 'string') {
    try {
      timeline = JSON.parse(timeline);
    } catch {
      timeline = [];
    }
  }
  if (Array.isArray(timeline)) {
    const latestStatus = [...timeline]
      .reverse()
      .find((item) => item && typeof item === 'object' && 'status' in item);
    if (
      latestStatus &&
      typeof latestStatus === 'object' &&
      'status' in latestStatus
    ) {
      return String(latestStatus.status).toLowerCase();
    }
  }
  return '';
};

const orderState = (entry: Entry, language: Language) => {
  const states: Record<string, Record<Language, string>> = {
    pending: { pt: 'Pendente', fr: 'En attente' },
    confirmed: { pt: 'Confirmada', fr: 'Confirmée' },
    paid: { pt: 'Paga', fr: 'Payée' },
    processing: { pt: 'Em preparação', fr: 'En préparation' },
    shipped: { pt: 'Enviada', fr: 'Expédiée' },
    delivered: { pt: 'Entregue', fr: 'Livrée' },
    cancelled: { pt: 'Cancelada', fr: 'Annulée' },
    paymentfailed: { pt: 'Pagamento não aprovado', fr: 'Paiement refusé' },
    refunded: { pt: 'Reembolsada', fr: 'Remboursée' },
  };
  const status = getOrderStatus(entry);
  return (
    states[status]?.[language] ??
    (language === 'fr' ? 'Statut non disponible' : 'Estado não disponível')
  );
};

const getPaymentStatus = (entry: Entry) => {
  const legacyOrderStatus = String(entry.orderStatus ?? '').toLowerCase();
  const storedStatus = String(entry.paymentStatus ?? 'pending').toLowerCase();
  return storedStatus === 'pending' && legacyOrderStatus === 'paid'
    ? 'approved'
    : storedStatus === 'pending' && legacyOrderStatus === 'paymentfailed'
      ? 'rejected'
      : storedStatus === 'pending' && legacyOrderStatus === 'refunded'
        ? 'refunded'
        : storedStatus;
};

const paymentState = (entry: Entry, language: Language) => {
  const states: Record<string, Record<Language, string>> = {
    pending: { pt: 'Pendente', fr: 'En attente' },
    approved: { pt: 'Aprovado', fr: 'Approuvé' },
    rejected: { pt: 'Não aprovado', fr: 'Refusé' },
    cancelled: { pt: 'Cancelado', fr: 'Annulé' },
    refunded: { pt: 'Reembolsado', fr: 'Remboursé' },
  };
  const status = getPaymentStatus(entry);
  return states[status]?.[language] ?? states.pending[language];
};

const isPendingWorkflowEntry = (resource: string, entry: Entry) => {
  if (resource === 'orders') return getOrderStatus(entry) === 'pending';
  if (resource === 'reviews') {
    return String(entry.moderationStatus ?? '').toLowerCase() === 'pending';
  }
  return false;
};

const isDraftEntry = (entry: Entry) => {
  const status =
    typeof entry.status === 'string' ? entry.status.toLowerCase() : undefined;
  if (status === 'published') return false;
  if (status === 'draft') return true;
  return entry.publishedAt === null;
};

const configs: Record<string, PageConfig> = {
  orders: {
    resource: 'orders',
    uid: 'api::order.order',
    title: { pt: 'Encomendas', fr: 'Commandes' },
    createLabel: { pt: 'Nova encomenda', fr: 'Nouvelle commande' },
    defaultSort: 'placedAt:DESC',
    minWidth: 950,
    canCreate: false,
    editLink: (entry) => `/store/orders/${entry.documentId ?? entry.id}`,
    filterField: 'orderStatus',
    filterOptions: [
      { value: 'pending', pt: 'Pendente', fr: 'En attente' },
      { value: 'confirmed', pt: 'Confirmada', fr: 'Confirmée' },
      { value: 'paid', pt: 'Paga', fr: 'Payée' },
      { value: 'processing', pt: 'Em preparação', fr: 'En préparation' },
      { value: 'shipped', pt: 'Enviada', fr: 'Expédiée' },
      { value: 'delivered', pt: 'Entregue', fr: 'Livrée' },
      { value: 'cancelled', pt: 'Cancelada', fr: 'Annulée' },
      {
        value: 'paymentfailed',
        pt: 'Pagamento não aprovado',
        fr: 'Paiement refusé',
      },
      { value: 'refunded', pt: 'Reembolsada', fr: 'Remboursée' },
    ],
    columns: [
      {
        key: 'number',
        pt: 'Número da encomenda',
        fr: 'Numéro de commande',
        width: 'minmax(220px, 1fr)',
        primary: true,
        value: (entry) => text(entry, 'number'),
      },
      {
        key: 'customerName',
        pt: 'Cliente',
        fr: 'Client',
        width: 'minmax(220px, 1fr)',
        value: (entry) => text(entry, 'customerName'),
      },
      {
        key: 'orderStatus',
        pt: 'Estado da encomenda',
        fr: 'Statut de la commande',
        width: 'minmax(220px, 1fr)',
        value: orderState,
      },
      {
        key: 'paymentStatus',
        pt: 'Pagamento',
        fr: 'Paiement',
        width: 'minmax(180px, .8fr)',
        value: paymentState,
      },
    ],
  },
  reviews: {
    resource: 'reviews',
    uid: 'api::review.review',
    title: { pt: 'Avaliações', fr: 'Avis' },
    createLabel: { pt: 'Nova avaliação', fr: 'Nouvel avis' },
    defaultSort: 'submittedAt:DESC',
    canCreate: false,
    editLink: (entry) => `/store/reviews/${entry.documentId ?? entry.id}`,
    filterField: 'moderationStatus',
    filterOptions: [
      {
        value: 'pending',
        pt: 'Aguarda aprovação',
        fr: "En attente d'approbation",
      },
      { value: 'published', pt: 'Publicada', fr: 'Publié' },
      { value: 'rejected', pt: 'Rejeitada', fr: 'Rejeté' },
    ],
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome do cliente',
        fr: 'Nom du client',
        width: 'minmax(210px, 1fr)',
        primary: true,
        value: (entry) => text(entry, 'name'),
      },
      {
        key: 'comment',
        pt: 'Comentário',
        fr: 'Commentaire',
        width: 'minmax(260px, 1.15fr)',
        value: (entry) => text(entry, 'comment'),
      },
      {
        key: 'rating',
        pt: 'Classificação',
        fr: 'Note',
        width: 'minmax(160px, .75fr)',
        value: (entry) => text(entry, 'rating'),
      },
    ],
  },
  customers: {
    resource: 'customers',
    uid: 'api::customer.customer',
    title: { pt: 'Clientes', fr: 'Clients' },
    createLabel: { pt: 'Novo cliente', fr: 'Nouveau client' },
    defaultSort: 'registeredAt:DESC',
    canCreate: false,
    editLink: (entry) => `/store/customers/${entry.documentId ?? entry.id}`,
    filterField: 'isActive',
    filterOptions: [
      { value: 'true', pt: 'Clientes ativos', fr: 'Clients actifs' },
      { value: 'false', pt: 'Clientes inativos', fr: 'Clients inactifs' },
    ],
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome do cliente',
        fr: 'Nom du client',
        width: 'minmax(230px, 1fr)',
        primary: true,
        value: (entry) => text(entry, 'name'),
      },
      {
        key: 'email',
        pt: 'E-mail',
        fr: 'E-mail',
        width: 'minmax(250px, 1fr)',
        value: (entry) => text(entry, 'email'),
      },
      {
        key: 'phone',
        pt: 'Telefone',
        fr: 'Téléphone',
        width: 'minmax(180px, .8fr)',
        value: (entry) => text(entry, 'phone'),
      },
    ],
  },
  kits: {
    resource: 'kits',
    uid: 'api::kit.kit',
    createLink: (contentLocale) => `/store/kits/new?locale=${contentLocale}`,
    editLink: (entry) =>
      `/store/kits/${entry.documentId ?? entry.id}/edit?locale=${entry.locale ?? 'pt'}`,
    title: { pt: 'Kit de produtos', fr: 'Kits de produits' },
    createLabel: { pt: 'Novo kit de produtos', fr: 'Nouveau kit de produits' },
    localized: true,
    canDelete: true,
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome do kit',
        fr: 'Nom du kit',
        width: 'minmax(190px, .9fr)',
        primary: true,
        value: (entry) => text(entry, 'name'),
      },
      {
        key: 'description',
        pt: 'Descrição do kit',
        fr: 'Description du kit',
        width: 'minmax(230px, 1.1fr)',
        value: (entry) => text(entry, 'description'),
      },
      {
        key: 'locale',
        pt: 'Idioma do conteúdo',
        fr: 'Langue du contenu',
        width: 'minmax(180px, .8fr)',
        value: localizedValue,
      },
    ],
  },
  categories: {
    resource: 'categories',
    uid: 'api::category.category',
    createLink: (contentLocale) =>
      `/store/categories/new?locale=${contentLocale}`,
    editLink: (entry) =>
      `/store/categories/${entry.documentId ?? entry.id}/edit?locale=${entry.locale ?? 'pt'}`,
    title: { pt: 'Categorias', fr: 'Catégories' },
    createLabel: { pt: 'Nova categoria', fr: 'Nouvelle catégorie' },
    localized: true,
    canDelete: true,
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome da categoria',
        fr: 'Nom de la catégorie',
        width: 'minmax(200px, .9fr)',
        primary: true,
        value: (entry) => text(entry, 'name'),
      },
      {
        key: 'description',
        pt: 'Descrição',
        fr: 'Description',
        width: 'minmax(230px, 1.1fr)',
        value: (entry) => text(entry, 'description'),
      },
      {
        key: 'locale',
        pt: 'Idioma do conteúdo',
        fr: 'Langue du contenu',
        width: 'minmax(180px, .8fr)',
        value: localizedValue,
      },
    ],
  },
  collections: {
    resource: 'collections',
    uid: 'api::collection.collection',
    createLink: (contentLocale) =>
      `/store/collections/new?locale=${contentLocale}`,
    editLink: (entry) =>
      `/store/collections/${entry.documentId ?? entry.id}/edit?locale=${entry.locale ?? 'pt'}`,
    title: { pt: 'Coleções', fr: 'Collections' },
    createLabel: { pt: 'Nova coleção', fr: 'Nouvelle collection' },
    localized: true,
    canDelete: true,
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome da coleção',
        fr: 'Nom de la collection',
        width: 'minmax(200px, .9fr)',
        primary: true,
        value: (entry) => text(entry, 'name'),
      },
      {
        key: 'description',
        pt: 'Descrição',
        fr: 'Description',
        width: 'minmax(230px, 1.1fr)',
        value: (entry) => text(entry, 'description'),
      },
      {
        key: 'locale',
        pt: 'Idioma do conteúdo',
        fr: 'Langue du contenu',
        width: 'minmax(180px, .8fr)',
        value: localizedValue,
      },
    ],
  },
  ingredients: {
    resource: 'ingredients',
    uid: 'api::ingredient.ingredient',
    createLink: (contentLocale) =>
      `/store/ingredients/new?locale=${contentLocale}`,
    editLink: (entry) =>
      `/store/ingredients/${entry.documentId ?? entry.id}/edit?locale=${entry.locale ?? 'pt'}`,
    title: { pt: 'Ingredientes', fr: 'Ingrédients' },
    createLabel: { pt: 'Novo ingrediente', fr: 'Nouvel ingrédient' },
    localized: true,
    canDelete: true,
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome do ingrediente',
        fr: "Nom de l'ingrédient",
        width: 'minmax(210px, .95fr)',
        primary: true,
        value: (entry) => text(entry, 'name'),
      },
      {
        key: 'description',
        pt: 'Descrição e propriedades',
        fr: 'Description et propriétés',
        width: 'minmax(250px, 1.15fr)',
        value: (entry) => text(entry, 'description'),
      },
      {
        key: 'locale',
        pt: 'Idioma do conteúdo',
        fr: 'Langue du contenu',
        width: 'minmax(180px, .8fr)',
        value: localizedValue,
      },
    ],
  },
  sizes: {
    resource: 'sizes',
    uid: 'api::size.size',
    createLink: '/store/sizes/new',
    editLink: (entry) => `/store/sizes/${entry.documentId ?? entry.id}/edit`,
    title: { pt: 'Tamanhos', fr: 'Formats' },
    createLabel: { pt: 'Novo tamanho', fr: 'Nouveau format' },
    canDelete: true,
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'label',
        pt: 'Nome apresentado ao cliente',
        fr: 'Nom présenté au client',
        width: 'minmax(260px, 1fr)',
        primary: true,
        value: (entry) => text(entry, 'label'),
      },
      {
        key: 'value',
        pt: 'Valor usado na loja',
        fr: 'Valeur utilisée dans la boutique',
        width: 'minmax(230px, 1fr)',
        value: (entry) => text(entry, 'value'),
      },
      {
        key: 'order',
        pt: 'Ordem de apresentação',
        fr: "Ordre d'affichage",
        width: 'minmax(190px, .75fr)',
        value: (entry) => text(entry, 'order'),
      },
    ],
  },
  banners: {
    resource: 'banners',
    uid: 'api::hero-slide.hero-slide',
    title: { pt: 'Banner página inicial', fr: "Bannière de la page d'accueil" },
    createLabel: { pt: 'Novo banner', fr: 'Nouvelle bannière' },
    createLink: (contentLocale) => `/store/banners/new?locale=${contentLocale}`,
    editLink: (entry) =>
      `/store/banners/${entry.documentId ?? entry.id}/edit?locale=${entry.locale ?? 'pt'}`,
    localized: true,
    canDelete: true,
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome interno do banner',
        fr: 'Nom interne de la bannière',
        width: 'minmax(230px, 1fr)',
        primary: true,
        value: (entry) => text(entry, 'name'),
      },
      {
        key: 'headline',
        pt: 'Título principal',
        fr: 'Titre principal',
        width: 'minmax(250px, 1.1fr)',
        value: (entry) => text(entry, 'headline'),
      },
      {
        key: 'locale',
        pt: 'Idioma do conteúdo',
        fr: 'Langue du contenu',
        width: 'minmax(180px, .8fr)',
        value: localizedValue,
      },
    ],
  },
  testimonials: {
    resource: 'testimonials',
    uid: 'api::testimonial.testimonial',
    createLink: (contentLocale) =>
      `/store/testimonials/new?locale=${contentLocale}`,
    editLink: (entry) =>
      `/store/testimonials/${entry.documentId ?? entry.id}/edit?locale=${entry.locale ?? 'pt'}`,
    title: { pt: 'Testemunhos em vídeo', fr: 'Témoignages vidéo' },
    createLabel: { pt: 'Novo testemunho', fr: 'Nouveau témoignage' },
    localized: true,
    canDelete: true,
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome da cliente',
        fr: 'Nom de la cliente',
        width: 'minmax(210px, .9fr)',
        primary: true,
        value: (entry) => text(entry, 'name'),
      },
      {
        key: 'message',
        pt: 'Mensagem do testemunho',
        fr: 'Message du témoignage',
        width: 'minmax(260px, 1.15fr)',
        value: (entry) => text(entry, 'message'),
      },
      {
        key: 'rating',
        pt: 'Classificação',
        fr: 'Note',
        width: 'minmax(150px, .65fr)',
        value: (entry) => text(entry, 'rating'),
      },
      {
        key: 'locale',
        pt: 'Idioma',
        fr: 'Langue',
        width: 'minmax(150px, .65fr)',
        value: localizedValue,
      },
    ],
  },
  users: {
    resource: 'users',
    uid: 'admin::user',
    endpoint: '/admin/users',
    createLink: '/store/users/new',
    editLink: (entry) => `/store/users/${entry.id}`,
    title: { pt: 'Usuários', fr: 'Utilisateurs' },
    createLabel: { pt: 'Novo usuário', fr: 'Nouvel utilisateur' },
    emptyActionLabel: {
      pt: 'Adicionar primeiro usuário',
      fr: 'Ajouter le premier utilisateur',
    },
    emptyMessage: {
      pt: 'Nenhum usuário encontrado',
      fr: 'Aucun utilisateur trouvé',
    },
    emptyIcon: '/admin/admin/users/empty.svg',
    defaultSort: 'firstname',
    filterField: 'isActive',
    filterOptions: [
      { value: 'true', pt: 'Usuários ativos', fr: 'Utilisateurs actifs' },
      { value: 'false', pt: 'Usuários inativos', fr: 'Utilisateurs inactifs' },
    ],
    columns: [
      {
        key: 'id',
        pt: 'ID',
        fr: 'ID',
        width: '70px',
        value: (entry) => text(entry, 'id'),
      },
      {
        key: 'name',
        pt: 'Nome do usuário',
        fr: "Nom de l'utilisateur",
        width: 'minmax(220px, 1fr)',
        primary: true,
        value: adminUserName,
      },
      {
        key: 'email',
        pt: 'E-mail',
        fr: 'E-mail',
        width: 'minmax(250px, 1.1fr)',
        value: (entry) => text(entry, 'email'),
      },
      {
        key: 'role',
        pt: 'Função',
        fr: 'Rôle',
        width: 'minmax(180px, .75fr)',
        value: adminUserRole,
      },
      {
        key: 'state',
        pt: 'Estado',
        fr: 'Statut',
        width: 'minmax(140px, .6fr)',
        value: adminUserState,
      },
    ],
  },
};

const ui = {
  pt: {
    search: 'Pesquisar',
    filters: 'Filtros',
    state: 'Estado',
    all: 'Todos',
    published: 'Publicado',
    draft: 'Rascunho',
    language: 'Idioma do conteúdo',
    portuguese: 'Português',
    french: 'Francês',
    previous: 'Anterior',
    next: 'Seguinte',
    loadError: 'Não foi possível carregar os dados. Tente novamente.',
    empty: 'Nenhuma entrada corresponde à pesquisa ou aos filtros.',
    edit: 'Abrir detalhes',
    select: 'Selecionar item',
    deselect: 'Remover da seleção',
    clearSelection: 'Limpar seleção',
    delete: 'Eliminar',
    deleting: 'A eliminar…',
    publish: 'Publicar no site',
    publishing: 'A publicar…',
    publishSuccess: 'Conteúdo publicado no site.',
    publishError: 'Não foi possível publicar o conteúdo. Tente novamente.',
    publishConfirm: 'Publicar este conteúdo no site agora?',
    unpublish: 'Ocultar do site',
    unpublishing: 'A ocultar…',
    unpublishSuccess:
      'Conteúdo ocultado do site. Os dados continuam guardados como rascunho.',
    unpublishError:
      'Não foi possível ocultar o conteúdo do site. Tente novamente.',
    unpublishConfirm:
      'Ocultar este conteúdo do site? Ele deixará de aparecer para os clientes, mas todos os dados serão mantidos como rascunho.',
    pendingAttention: 'Pendente',
    deleteSuccess: (count: number) =>
      `${count} ${count === 1 ? 'elemento eliminado' : 'elementos eliminados'} com sucesso.`,
    deleteError:
      'Não foi possível eliminar. Verifique se o elemento está associado a outros conteúdos e tente novamente.',
    deleteConfirm: (count: number) =>
      `Tem a certeza de que deseja eliminar ${count === 1 ? 'este elemento' : `estes ${count} elementos`}? Esta ação não pode ser desfeita.`,
    entries: (count: number) =>
      `${count} ${count === 1 ? 'entrada encontrada' : 'entradas encontradas'}`,
    selected: (count: number) =>
      `${count} selecionado${count === 1 ? '' : 's'}`,
    page: (page: number, total: number) => `Página ${page} de ${total}`,
  },
  fr: {
    search: 'Rechercher',
    filters: 'Filtres',
    state: 'Statut',
    all: 'Tous',
    published: 'Publié',
    draft: 'Brouillon',
    language: 'Langue du contenu',
    portuguese: 'Portugais',
    french: 'Français',
    previous: 'Précédente',
    next: 'Suivante',
    loadError: 'Impossible de charger les données. Veuillez réessayer.',
    empty: 'Aucune entrée ne correspond à la recherche ou aux filtres.',
    edit: 'Ouvrir les détails',
    select: "Sélectionner l'élément",
    deselect: 'Retirer de la sélection',
    clearSelection: 'Effacer la sélection',
    delete: 'Supprimer',
    deleting: 'Suppression…',
    publish: 'Publier sur le site',
    publishing: 'Publication…',
    publishSuccess: 'Contenu publié sur le site.',
    publishError: 'Impossible de publier le contenu. Veuillez réessayer.',
    publishConfirm: 'Publier ce contenu sur le site maintenant ?',
    unpublish: 'Dépublier',
    unpublishing: 'Dépublication…',
    unpublishSuccess:
      "Contenu dépublié. Il est maintenant en brouillon et n'apparaît plus sur le site.",
    unpublishError:
      'Impossible de dépublier le contenu. Veuillez réessayer.',
    unpublishConfirm:
      "Dépublier ce contenu ? Il n'apparaîtra plus sur le site, mais toutes les données seront conservées en brouillon.",
    pendingAttention: 'En attente',
    deleteSuccess: (count: number) =>
      `${count} ${count === 1 ? 'élément supprimé' : 'éléments supprimés'} avec succès.`,
    deleteError:
      "Impossible de supprimer. Vérifiez si l'élément est lié à d'autres contenus et réessayez.",
    deleteConfirm: (count: number) =>
      `Voulez-vous vraiment supprimer ${count === 1 ? 'cet élément' : `ces ${count} éléments`} ? Cette action est irréversible.`,
    entries: (count: number) =>
      `${count} ${count === 1 ? 'entrée trouvée' : 'entrées trouvées'}`,
    selected: (count: number) =>
      `${count} sélectionné${count === 1 ? '' : 's'}`,
    page: (page: number, total: number) => `Page ${page} sur ${total}`,
  },
};

const PageMain = styled(Main)`
  min-height: 100vh;
  color: #1a1917;
  background: #f7f5f2;
  font-family: 'Priscila Inter', Inter, Arial, sans-serif;
`;
const Content = styled.div`
  box-sizing: border-box;
  display: grid;
  gap: 32px;
  max-width: 1229px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px;
  @media (max-width: 48rem) {
    padding: 24px 20px;
  }
`;
const PageHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
`;
const Title = styled.h1`
  margin: 0;
  color: #2f303a;
  font-size: 32px;
  font-weight: 600;
  line-height: normal;
`;
const PrimaryAction = styled(Link)`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 12px;
  border: 1px solid #7d6645;
  border-radius: 10px;
  color: #fff;
  background: #7d6645;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  text-decoration: none;
  &:hover {
    background: #5f4d35;
  }
  img {
    width: 24px;
    height: 24px;
  }
`;
const Tools = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
`;
const SearchForm = styled.form`
  box-sizing: border-box;
  display: flex;
  height: 50px;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  background: #fff;
  img {
    width: 24px;
    height: 24px;
  }
`;
const SearchInput = styled.input`
  width: 100%;
  border: 0;
  outline: 0;
  color: #1a1917;
  background: transparent;
  font: inherit;
  font-size: 14px;
  &::placeholder {
    color: #8f887e;
    opacity: 1;
  }
`;
const FilterButton = styled.button<{ $active?: boolean }>`
  box-sizing: border-box;
  display: inline-flex;
  height: 50px;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border: 1px solid ${({ $active }) => ($active ? '#b49667' : 'rgba(0,0,0,.1)')};
  border-radius: 12px;
  color: #7d6645;
  background: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  img {
    width: 24px;
    height: 24px;
  }
`;
const FilterPanel = styled.div`
  position: absolute;
  z-index: 5;
  top: 58px;
  right: 0;
  display: grid;
  gap: 18px;
  width: 280px;
  padding: 20px;
  border: 1px solid #ece8e1;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 14px 35px rgba(47, 48, 58, 0.12);
`;
const FilterGroup = styled.fieldset`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
  legend {
    margin-bottom: 8px;
    color: #1a1917;
    font-size: 14px;
    font-weight: 600;
  }
  label {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #6d675f;
    font-size: 14px;
    cursor: pointer;
  }
  input {
    accent-color: #7d6645;
  }
`;
const Results = styled.section`
  display: grid;
  gap: 24px;
`;
const ResultSummary = styled.p`
  margin: 0;
  color: #6d675f;
  font-size: 16px;
  line-height: 24px;
`;
const SelectionBar = styled.div`
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 16px;
  border: 1px solid #d7c9b4;
  border-radius: 10px;
  color: #5f4d35;
  background: #f3eee6;
  font-size: 14px;
  font-weight: 600;
  div {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  a,
  button {
    padding: 8px 12px;
    border: 0;
    border-radius: 8px;
    color: #6f593d;
    background: #fff;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }
  a:hover,
  button:hover {
    background: #e8dfd2;
  }
  button.danger {
    color: #9f1239;
  }
  button:disabled {
    cursor: wait;
    opacity: 0.55;
  }
`;
const ActionNotice = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: 12px 14px;
  border: 1px solid ${({ $error }) => ($error ? '#fecaca' : '#bbf7d0')};
  border-radius: 9px;
  color: ${({ $error }) => ($error ? '#991b1b' : '#166534')};
  background: ${({ $error }) => ($error ? '#fef2f2' : '#f0fdf4')};
  font-size: 14px;
`;
const TableScroll = styled.div`
  overflow-x: auto;
  border: 1px solid #ece8e1;
  border-radius: 10px;
  background: #fff;
`;
const Table = styled.div<{ $minWidth: number }>`
  min-width: ${({ $minWidth }) => $minWidth}px;
`;
const Row = styled.div<{ $selected?: boolean; $pending?: boolean }>`
  display: grid;
  min-height: 56px;
  align-items: center;
  border-bottom: 1px solid #ece8e1;
  color: #6d675f;
  background: ${({ $selected, $pending }) =>
    $selected ? '#f7f2ea' : $pending ? '#fffbf3' : '#fff'};
  box-shadow: ${({ $pending }) => ($pending ? 'inset 3px 0 0 #b38d52' : 'none')};
  font-size: 16px;
  transition: background-color 160ms ease;
  &:last-child {
    border-bottom: 0;
  }
  > * {
    min-width: 0;
    padding: 11px 15px;
  }
`;
const HeaderRow = styled(Row)`
  color: #1a1917;
  font-weight: 600;
`;
const CellText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const EntryLink = styled(Link)`
  overflow: hidden;
  color: #6d675f;
  text-overflow: ellipsis;
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    color: #7d6645;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
`;
const PrimaryCell = styled.div`
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  ${EntryLink} {
    min-width: 0;
  }
`;
const AttentionBadge = styled.span`
  flex: 0 0 auto;
  padding: 3px 9px;
  border: 1px solid #dfbf88;
  border-radius: 999px;
  color: #75530b;
  background: #fff4dc;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  letter-spacing: 0.01em;
  white-space: nowrap;
`;
const CheckCell = styled.label`
  display: grid;
  place-items: center;
  input {
    width: 16px;
    height: 16px;
    accent-color: #7d6645;
    cursor: pointer;
  }
`;
const Status = styled.span<{ $draft?: boolean }>`
  justify-self: start;
  padding: 4px 16px !important;
  border: 1px solid ${({ $draft }) => ($draft ? '#d6d3d1' : '#7bf1a8')};
  border-radius: 32px;
  color: #1a1917;
  background: ${({ $draft }) => ($draft ? '#f5f5f4' : '#dcfce7')};
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
`;
const orderBadgeColors: Record<
  string,
  { background: string; border: string; color: string }
> = {
  pending: { background: '#fff7e6', border: '#f0c36a', color: '#75530b' },
  approved: { background: '#dcfce7', border: '#7bf1a8', color: '#166534' },
  rejected: { background: '#fff1f2', border: '#fda4af', color: '#9f1239' },
  confirmed: { background: '#eef6ff', border: '#93c5fd', color: '#1e4f86' },
  paid: { background: '#ecfdf3', border: '#86efac', color: '#166534' },
  processing: { background: '#f7f2e9', border: '#d6c19a', color: '#6b522d' },
  shipped: { background: '#f1f0ff', border: '#b9b4f6', color: '#47408f' },
  delivered: { background: '#dcfce7', border: '#7bf1a8', color: '#166534' },
  cancelled: { background: '#fff1f2', border: '#fda4af', color: '#9f1239' },
  paymentfailed: { background: '#fff1f2', border: '#fda4af', color: '#9f1239' },
  refunded: { background: '#f5f5f4', border: '#d6d3d1', color: '#57534e' },
};
const OrderStatusBadge = styled.span<{ $status: string }>`
  justify-self: start;
  padding: 4px 14px !important;
  border: 1px solid
    ${({ $status }) => (orderBadgeColors[$status] ?? orderBadgeColors.refunded).border};
  border-radius: 32px;
  color: ${({ $status }) => (orderBadgeColors[$status] ?? orderBadgeColors.refunded).color};
  background: ${({ $status }) => (orderBadgeColors[$status] ?? orderBadgeColors.refunded).background};
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
`;
const RowMenu = styled.details.attrs({
  'data-row-action-menu': '',
})`
  position: relative;
  justify-self: center;
  padding: 0 !important;
  summary {
    display: grid;
    width: 32px;
    height: 32px;
    padding: 4px;
    place-items: center;
    border-radius: 5px;
    background: #f7f5f1;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    background: #ece8e1;
  }
  summary img {
    width: 24px;
    height: 24px;
  }
  &[open] summary {
    background: #ece8e1;
  }
`;
const RowMenuPanel = styled.div`
  position: absolute;
  z-index: 8;
  top: 38px;
  right: 0;
  display: grid;
  width: 190px;
  padding: 7px;
  border: 1px solid #e5ded4;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 14px 32px rgba(47, 48, 58, 0.14);
  a,
  button {
    display: flex;
    min-height: 40px;
    align-items: center;
    padding: 8px 11px;
    border: 0;
    border-radius: 7px;
    color: #4f4a43;
    background: transparent;
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  a:hover,
  button:hover {
    color: #6f593d;
    background: #f3eee6;
  }
  button.danger {
    color: #9f1239;
  }
  button:disabled {
    cursor: wait;
    opacity: 0.55;
  }
`;
const EmptyState = styled.div`
  padding: 40px 24px;
  color: #6d675f;
  font-size: 16px;
  text-align: center;
`;
const ErrorState = styled(EmptyState)`
  color: #991b1b;
`;
const RichEmptyState = styled.div`
  display: grid;
  min-height: 280px;
  place-content: center;
  justify-items: center;
  gap: 22px;
  padding: 32px;
  color: #1a1917;
  text-align: center;
  strong {
    font-size: 16px;
    font-weight: 600;
  }
`;
const EmptyIconCircle = styled.span`
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 50%;
  background: #f7f5f1;
  img {
    width: 24px;
    height: 24px;
  }
`;
const EmptyAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  color: #fff;
  background: #7d6645;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  img {
    width: 24px;
    height: 24px;
  }
`;
const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  color: #6d675f;
  font-size: 14px;
`;
const PageButton = styled.button`
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid #ece8e1;
  border-radius: 8px;
  color: #7d6645;
  background: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

function StoreCollectionListPage({ config }: { config: PageConfig }) {
  const { get, post, del } = useFetchClient();
  const { locale } = useIntl();
  const language: Language = locale.toLowerCase().startsWith('fr')
    ? 'fr'
    : 'pt';
  const labels = ui[language];
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageCount: 1,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [contentLocale, setContentLocale] = useState<Language>('pt');
  const [filterValue, setFilterValue] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unpublishing, setUnpublishing] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    const params: Record<string, string | number> = {
      page,
      pageSize: 10,
      sort: config.defaultSort ?? 'id:ASC',
    };
    if (submittedQuery) params._q = submittedQuery;
    if (config.localized) {
      params.locale = contentLocale;
      if (filterValue !== 'all') params.status = filterValue;
    } else if (config.filterField && filterValue !== 'all') {
      params[`filters[${config.filterField}][$eq]`] = filterValue;
    }

    void get<CollectionResponse | CollectionEnvelope>(
      config.endpoint ?? contentLink(config.uid),
      { params },
    )
      .then((response) => {
        if (!active) return;
        const responseBody = response.data;
        const payload =
          'data' in responseBody && responseBody.data
            ? responseBody.data
            : responseBody;
        const nextEntries = payload.results ?? [];
        const nextPagination = payload.pagination;
        setEntries(nextEntries);
        setPagination({
          page: nextPagination?.page ?? page,
          pageCount: Math.max(1, nextPagination?.pageCount ?? 1),
          total: nextPagination?.total ?? nextEntries.length,
        });
        setSelected([]);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [config, contentLocale, filterValue, get, page, refreshKey, submittedQuery]);

  const orderedEntries = useMemo(() => {
    if (config.resource !== 'orders' && config.resource !== 'reviews') {
      return entries;
    }
    return entries
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => {
        const pendingDifference =
          Number(isPendingWorkflowEntry(config.resource, right.entry)) -
          Number(isPendingWorkflowEntry(config.resource, left.entry));
        return pendingDifference || left.index - right.index;
      })
      .map(({ entry }) => entry);
  }, [config.resource, entries]);
  const identifiers = useMemo(
    () => orderedEntries.map((entry) => String(entry.documentId ?? entry.id)),
    [orderedEntries],
  );
  const allSelected =
    identifiers.length > 0 &&
    identifiers.every((identifier) => selected.includes(identifier));
  const grid = `50px ${config.columns.map((column) => column.width).join(' ')}${config.localized ? ' 140px' : ''} 58px`;
  const filtersActive =
    filterValue !== 'all' || (config.localized && contentLocale !== 'pt');
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSubmittedQuery(query.trim());
  };
  const toggleAll = () => setSelected(allSelected ? [] : identifiers);
  const toggleOne = (identifier: string) =>
    setSelected((current) =>
      current.includes(identifier)
        ? current.filter((value) => value !== identifier)
        : [...current, identifier],
    );

  const setFilter = (value: string) => {
    setFilterValue(value);
    setPage(1);
  };
  const removeEntries = async (entryIds: string[]) => {
    if (!config.canDelete || !entryIds.length || deleting) return;
    if (!window.confirm(labels.deleteConfirm(entryIds.length))) return;
    setDeleting(true);
    setActionMessage(null);
    try {
      for (const identifier of entryIds) {
        await del(`${contentLink(config.uid)}/${identifier}`, {
          params: config.localized ? { locale: contentLocale } : undefined,
        });
      }
      setSelected([]);
      setActionMessage({
        text: labels.deleteSuccess(entryIds.length),
        error: false,
      });
      if (entryIds.length >= entries.length && page > 1)
        setPage((current) => current - 1);
      else setRefreshKey((current) => current + 1);
    } catch {
      setActionMessage({ text: labels.deleteError, error: true });
    } finally {
      setDeleting(false);
    }
  };
  const unpublishEntry = async (entry: Entry) => {
    const identifier = String(entry.documentId ?? entry.id);
    if (
      !config.localized ||
      unpublishing ||
      !window.confirm(labels.unpublishConfirm)
    )
      return;
    setUnpublishing(identifier);
    setActionMessage(null);
    try {
      await post(
        `${contentLink(config.uid)}/${identifier}/actions/unpublish`,
        {
          locale: entry.locale ?? contentLocale,
          discardDraft: false,
        },
      );
      setActionMessage({ text: labels.unpublishSuccess, error: false });
      setRefreshKey((current) => current + 1);
    } catch {
      setActionMessage({ text: labels.unpublishError, error: true });
    } finally {
      setUnpublishing(null);
    }
  };
  const publishEntry = async (entry: Entry) => {
    const identifier = String(entry.documentId ?? entry.id);
    if (
      !config.localized ||
      publishing ||
      !window.confirm(labels.publishConfirm)
    )
      return;
    setPublishing(identifier);
    setActionMessage(null);
    try {
      await post(
        `${contentLink(config.uid)}/${identifier}/actions/publish`,
        { locale: entry.locale ?? contentLocale },
      );
      setActionMessage({ text: labels.publishSuccess, error: false });
      setRefreshKey((current) => current + 1);
    } catch {
      setActionMessage({ text: labels.publishError, error: true });
    } finally {
      setPublishing(null);
    }
  };
  const createLink =
    typeof config.createLink === 'function'
      ? config.createLink(contentLocale)
      : (config.createLink ??
        `${contentLink(config.uid)}/create${config.localized ? `?plugins[i18n][locale]=${contentLocale}` : ''}`);

  return (
    <PageMain labelledBy={`${config.resource}-page-title`}>
      <StoreLayout>
        <StoreSidebar activeHref={storeListLink(config.resource)} />
        <StorePage>
          <Content>
            <PageHeader>
              <Title id={`${config.resource}-page-title`}>
                {config.title[language]}
              </Title>
              {config.canCreate !== false && (
                <PrimaryAction to={createLink}>
                  <img src={asset('add')} alt="" aria-hidden />
                  {config.createLabel[language]}
                </PrimaryAction>
              )}
            </PageHeader>
            <Tools>
              <SearchForm onSubmit={submitSearch}>
                <img src={asset('search')} alt="" aria-hidden />
                <SearchInput
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={labels.search}
                  aria-label={labels.search}
                />
              </SearchForm>
              <FilterButton
                type="button"
                $active={filtersActive}
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <img src={asset('filter')} alt="" aria-hidden />
                {labels.filters}
              </FilterButton>
              {filtersOpen && (
                <FilterPanel>
                  <FilterGroup>
                    <legend>{labels.state}</legend>
                    <label>
                      <input
                        type="radio"
                        name={`${config.resource}-filter`}
                        checked={filterValue === 'all'}
                        onChange={() => setFilter('all')}
                      />
                      {labels.all}
                    </label>
                    {config.localized ? (
                      <>
                        <label>
                          <input
                            type="radio"
                            name={`${config.resource}-filter`}
                            checked={filterValue === 'published'}
                            onChange={() => setFilter('published')}
                          />
                          {labels.published}
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`${config.resource}-filter`}
                            checked={filterValue === 'draft'}
                            onChange={() => setFilter('draft')}
                          />
                          {labels.draft}
                        </label>
                      </>
                    ) : (
                      config.filterOptions?.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name={`${config.resource}-filter`}
                            checked={filterValue === option.value}
                            onChange={() => setFilter(option.value)}
                          />
                          {option[language]}
                        </label>
                      ))
                    )}
                  </FilterGroup>
                  {config.localized && (
                    <FilterGroup>
                      <legend>{labels.language}</legend>
                      <label>
                        <input
                          type="radio"
                          name={`${config.resource}-locale`}
                          checked={contentLocale === 'pt'}
                          onChange={() => {
                            setContentLocale('pt');
                            setPage(1);
                          }}
                        />
                        {labels.portuguese}
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`${config.resource}-locale`}
                          checked={contentLocale === 'fr'}
                          onChange={() => {
                            setContentLocale('fr');
                            setPage(1);
                          }}
                        />
                        {labels.french}
                      </label>
                    </FilterGroup>
                  )}
                </FilterPanel>
              )}
            </Tools>
            <Results>
              {actionMessage && (
                <ActionNotice $error={actionMessage.error} role="status">
                  {actionMessage.text}
                </ActionNotice>
              )}
              {selected.length ? (
                <SelectionBar>
                  <strong>{labels.selected(selected.length)}</strong>
                  <div>
                    {selected.length === 1 &&
                      (() => {
                        const selectedEntry = entries.find(
                          (entry) =>
                            String(entry.documentId ?? entry.id) ===
                            selected[0],
                        );
                        if (!selectedEntry) return null;
                        const selectedLink =
                          config.editLink?.(selectedEntry) ??
                          `${contentLink(config.uid)}/${selected[0]}${config.localized ? `?plugins[i18n][locale]=${contentLocale}` : ''}`;
                        return <Link to={selectedLink}>{labels.edit}</Link>;
                      })()}
                    {config.canDelete && (
                      <button
                        className="danger"
                        type="button"
                        disabled={deleting}
                        onClick={() => void removeEntries(selected)}
                      >
                        {deleting ? labels.deleting : labels.delete}
                      </button>
                    )}
                    <button type="button" onClick={() => setSelected([])}>
                      {labels.clearSelection}
                    </button>
                  </div>
                </SelectionBar>
              ) : (
                <ResultSummary>
                  {labels.entries(pagination.total)}
                </ResultSummary>
              )}
              <TableScroll>
                <Table
                  $minWidth={config.minWidth ?? 920}
                  role="table"
                  aria-label={config.title[language]}
                >
                  <HeaderRow role="row" style={{ gridTemplateColumns: grid }}>
                    <CheckCell>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label={labels.selected(identifiers.length)}
                      />
                    </CheckCell>
                    {config.columns.map((column) => (
                      <span key={column.key}>{column[language]}</span>
                    ))}
                    {config.localized && <span>{labels.state}</span>}
                    <span />
                  </HeaderRow>
                  {loading ? (
                    <EmptyState>…</EmptyState>
                  ) : error ? (
                    <ErrorState>{labels.loadError}</ErrorState>
                  ) : orderedEntries.length ? (
                    orderedEntries.map((entry) => {
                      const identifier = String(entry.documentId ?? entry.id);
                      const suffix = config.localized
                        ? `?plugins[i18n][locale]=${contentLocale}`
                        : '';
                      const editLink =
                        config.editLink?.(entry) ??
                        `${contentLink(config.uid)}/${identifier}${suffix}`;
                      const isDraft = config.localized && isDraftEntry(entry);
                      const isPending = isPendingWorkflowEntry(
                        config.resource,
                        entry,
                      );
                      return (
                        <Row
                          key={identifier}
                          role="row"
                          $selected={selected.includes(identifier)}
                          $pending={isPending}
                          style={{ gridTemplateColumns: grid }}
                        >
                          <CheckCell>
                            <input
                              type="checkbox"
                              checked={selected.includes(identifier)}
                              onChange={() => toggleOne(identifier)}
                              aria-label={identifier}
                            />
                          </CheckCell>
                          {config.columns.map((column) => {
                            const value = column.value(entry, contentLocale);
                            if (
                              config.resource === 'orders' &&
                              (column.key === 'orderStatus' ||
                                column.key === 'paymentStatus')
                            ) {
                              const status =
                                column.key === 'paymentStatus'
                                  ? getPaymentStatus(entry)
                                  : getOrderStatus(entry);
                              return (
                                <OrderStatusBadge
                                  key={column.key}
                                  $status={status}
                                >
                                  {value}
                                </OrderStatusBadge>
                              );
                            }
                            return column.primary ? (
                              <PrimaryCell key={column.key}>
                                <EntryLink to={editLink}>{value}</EntryLink>
                                {isPending && (
                                  <AttentionBadge>
                                    {labels.pendingAttention}
                                  </AttentionBadge>
                                )}
                              </PrimaryCell>
                            ) : (
                              <CellText key={column.key} title={value}>
                                {value}
                              </CellText>
                            );
                          })}
                          {config.localized && (
                            <Status $draft={isDraft}>
                              {isDraft ? labels.draft : labels.published}
                            </Status>
                          )}
                          <RowMenu>
                            <summary aria-label={labels.edit}>
                              <img src={asset('menu')} alt="" aria-hidden />
                            </summary>
                            <RowMenuPanel>
                              <Link to={editLink}>{labels.edit}</Link>
                              {config.localized && isDraft && (
                                <button
                                  type="button"
                                  disabled={Boolean(publishing)}
                                  onClick={() => void publishEntry(entry)}
                                >
                                  {publishing === identifier
                                    ? labels.publishing
                                    : labels.publish}
                                </button>
                              )}
                              {config.localized && !isDraft && (
                                <button
                                  type="button"
                                  disabled={Boolean(unpublishing)}
                                  onClick={() => void unpublishEntry(entry)}
                                >
                                  {unpublishing === identifier
                                    ? labels.unpublishing
                                    : labels.unpublish}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleOne(identifier)}
                              >
                                {selected.includes(identifier)
                                  ? labels.deselect
                                  : labels.select}
                              </button>
                              {config.canDelete && (
                                <button
                                  className="danger"
                                  type="button"
                                  disabled={deleting}
                                  onClick={() => void removeEntries([identifier])}
                                >
                                  {deleting ? labels.deleting : labels.delete}
                                </button>
                              )}
                            </RowMenuPanel>
                          </RowMenu>
                        </Row>
                      );
                    })
                  ) : config.emptyIcon ? (
                    <RichEmptyState>
                      <EmptyIconCircle>
                        <img src={config.emptyIcon} alt="" aria-hidden />
                      </EmptyIconCircle>
                      <strong>
                        {config.emptyMessage?.[language] ?? labels.empty}
                      </strong>
                      <EmptyAction to={createLink}>
                        <img src={asset('add')} alt="" aria-hidden />
                        {config.emptyActionLabel?.[language] ??
                          config.createLabel[language]}
                      </EmptyAction>
                    </RichEmptyState>
                  ) : (
                    <EmptyState>{labels.empty}</EmptyState>
                  )}
                </Table>
              </TableScroll>
              {pagination.pageCount > 1 && (
                <Pagination>
                  <PageButton
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    {labels.previous}
                  </PageButton>
                  <span>
                    {labels.page(pagination.page, pagination.pageCount)}
                  </span>
                  <PageButton
                    type="button"
                    disabled={page >= pagination.pageCount}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    {labels.next}
                  </PageButton>
                </Pagination>
              )}
            </Results>
          </Content>
        </StorePage>
      </StoreLayout>
    </PageMain>
  );
}

export const OrdersListPage = () => (
  <StoreCollectionListPage config={configs.orders} />
);
export const ReviewsListPage = () => (
  <StoreCollectionListPage config={configs.reviews} />
);
export const CustomersListPage = () => (
  <StoreCollectionListPage config={configs.customers} />
);
export const KitsListPage = () => (
  <StoreCollectionListPage config={configs.kits} />
);
export const CategoriesListPage = () => (
  <StoreCollectionListPage config={configs.categories} />
);
export const CollectionsListPage = () => (
  <StoreCollectionListPage config={configs.collections} />
);
export const IngredientsListPage = () => (
  <StoreCollectionListPage config={configs.ingredients} />
);
export const SizesListPage = () => (
  <StoreCollectionListPage config={configs.sizes} />
);
export const BannersListPage = () => (
  <StoreCollectionListPage config={configs.banners} />
);
export const UsersListPage = () => (
  <StoreCollectionListPage config={configs.users} />
);
export const TestimonialsListPage = () => (
  <StoreCollectionListPage config={configs.testimonials} />
);
