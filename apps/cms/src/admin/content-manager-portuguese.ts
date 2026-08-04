import type { Core } from '@strapi/strapi';

type FieldPresentation = {
  label: string;
  description?: string;
  placeholder?: string;
};

type ModelPresentation = Record<string, FieldPresentation>;

const hiddenFieldsByContentType: Record<string, string[]> = {
  'api::kit.kit': ['commerce'],
  'api::about-page.about-page': [
    'brandTimeline',
    'founderName',
    'founderBiography',
    'founderMedia',
  ],
};

const readOnlyFieldsByContentType: Record<string, string[]> = {
  'api::review.review': [
    'externalReviewId', 'customerId', 'name', 'productSku', 'title', 'comment',
    'rating', 'recommends', 'reviewDate', 'submittedAt', 'sourceUpdatedAt',
    'product', 'customer',
  ],
  'api::customer.customer': [
    'externalCustomerId', 'name', 'email', 'phone', 'acceptsMarketing',
    'isActive', 'registeredAt', 'sourceUpdatedAt', 'reviews',
  ],
};

const field = (
  label: string,
  description?: string,
  placeholder?: string,
): FieldPresentation => ({ label, description, placeholder });

const contentTypes: Record<string, ModelPresentation> = {
  'api::product.product': {
    name: field('Nome do produto', 'Nome apresentado aos clientes.'),
    slug: field('Endereço do produto', 'Gerado a partir do nome e utilizado no endereço da página.'),
    description: field('Descrição breve', 'Resumo apresentado junto ao nome e ao preço.'),
    additionalDescription: field('Mais detalhes sobre o produto', 'Texto complementar apresentado na página de detalhes.'),
    sku: field('Código interno (SKU)', 'Código único utilizado para identificar o produto no stock.'),
    commerce: field('Preço, disponibilidade e stock', 'Defina os preços, o estado de venda, o stock e o selo do produto.'),
    images: field('Galeria principal', 'Adicione no mínimo cinco imagens. A primeira será a imagem inicial do produto.'),
    thumbnailImage: field('Imagem de miniatura', 'Imagem pequena utilizada nos menus e listas compactas.'),
    featuredImage: field('Imagem principal de destaque', 'Imagem utilizada nos cards e nas áreas de destaque.'),
    category: field('Categoria', 'Selecione a categoria principal do produto.'),
    sizes: field('Tamanhos disponíveis', 'Selecione todas as apresentações que podem ser compradas.'),
    ingredients: field('Ingredientes', 'Relacione os principais ingredientes da fórmula.'),
    collections: field('Coleções', 'Selecione as coleções às quais este produto pertence.'),
    kits: field('Kits', 'Kits que incluem este produto.'),
    highlights: field('Principais características', 'Lista curta de benefícios e características apresentada no topo da página.'),
    benefits: field('Benefícios detalhados', 'Crie os blocos que explicam os benefícios do produto.'),
    benefitsMainMedia: field('Imagem ou vídeo principal dos benefícios', 'Conteúdo visual de destaque da seção de benefícios.'),
    editorial: field('Conteúdo editorial', 'Título, descrição e nota da apresentação editorial.'),
    galleryEditorial: field('Galeria editorial', 'Imagens adicionais usadas na apresentação editorial do produto.'),
    usageSteps: field('Como utilizar o produto', 'Adicione os passos na ordem em que devem ser realizados.'),
    usageMedia: field('Imagem ou vídeo do modo de utilização', 'Conteúdo visual apresentado junto às instruções de uso.'),
    results: field('Resultados do produto', 'Dados percentuais e comparação visual de antes e depois.'),
    reviews: field('Avaliações dos clientes', 'Avaliações associadas a este produto.'),
    seo: field('Pesquisa e partilha', 'Título, descrição e imagem utilizados por motores de pesquisa e redes sociais.'),
  },
  'api::collection.collection': {
    name: field('Nome da coleção'),
    slug: field('Endereço da coleção', 'Gerado a partir do nome.'),
    description: field('Descrição', 'Apresente o conceito e o objetivo desta coleção.'),
    thumbnailImage: field('Imagem de miniatura', 'Utilizada no menu de coleções.'),
    media: field(
      'Imagem ou vídeo para destaque na página inicial',
      'Preencha somente quando esta coleção for utilizada como destaque na página inicial.',
    ),
    homePresentation: field(
      'Apresentação na página inicial',
      'Bloco opcional necessário quando a coleção for escolhida como destaque da Home.',
    ),
    products: field('Produtos da coleção', 'Selecione todos os produtos que pertencem a esta coleção.'),
    seo: field('Pesquisa e partilha'),
  },
  'api::kit.kit': {
    name: field('Nome do kit'),
    slug: field('Endereço do kit', 'Gerado a partir do nome.'),
    description: field('Descrição do kit'),
    commerce: field('Dados comerciais antigos do kit'),
    prices: field(
      'Preço apresentado para o kit',
      'Informe apenas os valores mostrados nos banners e nas apresentações do kit.',
    ),
    thumbnailImage: field('Imagem de miniatura', 'Utilizada nos menus e listas compactas.'),
    media: field(
      'Imagem ou vídeo para destaque na página inicial',
      'Preencha somente se este kit for utilizado como destaque principal da página inicial. Para a lista Encontrar, basta a imagem de miniatura.',
    ),
    homePresentation: field(
      'Apresentação na página inicial',
      'Preencha este bloco para apresentar o kit na área editorial e na lista Encontrar.',
    ),
    products: field('Produtos incluídos', 'Selecione os produtos que compõem este kit.'),
    seo: field('Pesquisa e partilha'),
  },
  'api::category.category': {
    name: field('Nome da categoria'),
    slug: field('Endereço da categoria', 'Gerado a partir do nome.'),
    description: field('Descrição'),
    products: field('Produtos desta categoria'),
    seo: field('Pesquisa e partilha'),
  },
  'api::ingredient.ingredient': {
    name: field('Nome do ingrediente'),
    slug: field('Endereço do ingrediente', 'Gerado a partir do nome.'),
    description: field('Descrição e propriedades', 'Explique a origem e os benefícios do ingrediente.'),
    thumbnailImage: field('Imagem de miniatura'),
    editorialMedia: field('Imagem principal do ingrediente', 'Imagem apresentada quando o ingrediente é selecionado.'),
    products: field('Produtos que utilizam este ingrediente'),
  },
  'api::hero-slide.hero-slide': {
    presentation: field(
      'Apresentação do banner',
      'Escolha imagem dividida à direita ou imagem em tela inteira.',
    ),
    name: field('Nome interno do banner', 'Ajuda a identificar o banner no painel; não é apresentado ao público.'),
    label: field('Etiqueta'),
    headline: field('Título principal'),
    description: field('Descrição'),
    media: field('Imagem ou vídeo do banner', 'Defina também a versão mobile e o ponto de foco da imagem.'),
    cta: field(
      'Ação do botão',
      'Escolha um único destino. O endereço e, quando aplicável, o preço serão obtidos automaticamente.',
    ),
    order: field('Posição', 'Use 1 para o primeiro banner, 2 para o segundo e assim sucessivamente.'),
  },
  'api::home-page.home-page': {
    heroSlides: field('Banners principais', 'Selecione e ordene os banners apresentados no início da página.'),
    featuredProducts: field('Produtos destacados', 'Selecione no máximo quatro produtos com preços e imagem prontos para esta seção. Não repita produtos usados nas áreas editoriais.'),
    editorialCover: field('Produto editorial com vídeo ou imagem', 'O seletor apresenta somente produtos com o bloco Conteúdo editorial preenchido.'),
    editorialGallery: field('Produto da galeria editorial', 'O seletor apresenta somente produtos com o bloco Galeria editorial preenchido. As imagens são obtidas automaticamente da galeria principal do produto.'),
    featuredKit: field('Kit em destaque', 'Somente kits completos para a apresentação na Home ficam disponíveis.'),
    featuredCollection: field('Coleção em destaque', 'Somente coleções completas para a apresentação na Home ficam disponíveis.'),
    ingredients: field('Apresentação dos ingredientes', 'Defina os textos e selecione os ingredientes apresentados na página inicial.'),
    testimonials: field(
      'Secção de testemunhos em vídeo',
      'Defina os textos e escolha os vídeos apresentados na página inicial.',
    ),
    seo: field('Pesquisa e partilha'),
  },
  'api::about-page.about-page': {
    heroLabel: field('Etiqueta da apresentação'),
    heroHeadline: field('Título principal'),
    heroDescription: field('Descrição da apresentação'),
    heroMedia: field('Imagem principal'),
    brand: field(
      'História e números da marca',
      'Defina a imagem, os números animados e os textos apresentados nesta secção.',
    ),
    pillars: field('Pilares da marca'),
    brandTimeline: field('História e números da marca', 'Adicione os principais marcos e dados estatísticos.'),
    founderName: field('Nome da fundadora'),
    founderBiography: field('Biografia da fundadora'),
    founderMedia: field('Imagem da fundadora'),
    founder: field('Apresentação da fundadora'),
    locations: field('Locais e presença da marca'),
    ingredients: field('Apresentação dos ingredientes', 'Defina os textos e selecione os ingredientes apresentados na página Sobre.'),
    seo: field('Pesquisa e partilha'),
  },
  'api::review.review': {
    externalReviewId: field('Identificador interno', 'Gerado automaticamente pela aplicação. Não altere este valor.'),
    customerId: field('Identificador do cliente'),
    name: field('Nome do cliente'),
    productSku: field('Código do produto (SKU)'),
    title: field('Título da avaliação'),
    comment: field('Comentário'),
    rating: field('Classificação', 'Valor de 1 a 5 estrelas.'),
    recommends: field('Recomenda o produto'),
    moderationStatus: field('Estado da moderação', 'Pendente, publicada ou rejeitada.'),
    reviewDate: field('Data da avaliação'),
    submittedAt: field('Enviada em'),
    sourceUpdatedAt: field('Última alteração do cliente'),
    product: field('Produto avaliado'),
    customer: field('Cliente', 'Cliente autenticado que enviou a avaliação.'),
  },
  'api::customer.customer': {
    externalCustomerId: field('Identificador interno', 'Gerado automaticamente pela aplicação.'),
    name: field('Nome do cliente'),
    email: field('E-mail'),
    phone: field('Telefone'),
    acceptsMarketing: field('Aceitou receber comunicações'),
    isActive: field('Conta ativa'),
    registeredAt: field('Cliente desde'),
    sourceUpdatedAt: field('Última atualização na aplicação'),
    reviews: field('Avaliações enviadas'),
  },
  'api::testimonial.testimonial': {
    name: field('Nome da pessoa'),
    message: field('Testemunho'),
    rating: field('Classificação', 'Valor de 1 a 5 estrelas.'),
    video: field('Vídeo do testemunho', 'Utilize um vídeo otimizado para reprodução na web.'),
    poster: field('Imagem de capa do vídeo', 'Imagem apresentada antes do vídeo começar.'),
    order: field('Posição'),
  },
  'api::size.size': {
    label: field('Nome apresentado', 'Exemplo: 50 ml.'),
    value: field('Código interno', 'Exemplo: 50ML. Deve ser único.'),
    order: field('Posição'),
    products: field('Produtos com este tamanho'),
  },
  'api::site-setting.site-setting': {
    siteName: field('Nome do site'),
    contactEmail: field('E-mail de contacto'),
    socialLinks: field('Redes sociais'),
    newsletterHeadline: field('Mensagem da newsletter'),
    defaultCurrency: field('Moeda predefinida'),
    logo: field('Logótipo'),
  },
};

const components: Record<string, ModelPresentation> = {
  'about.brand-section': {
    label: field('Etiqueta da secção'),
    media: field('Imagem da história da marca'),
    metrics: field(
      'Números da marca',
      'Adicione o número, o complemento, o destaque opcional e a descrição.',
    ),
    footerTitle: field('Título do texto final'),
    footerDescription: field('Descrição do texto final'),
  },
  'about.brand-metric': {
    order: field('Posição'),
    value: field('Número', 'Informe apenas o número. Exemplo: 73.'),
    suffix: field(
      'Complemento do número',
      'Opcional. Exemplos: +, K+ ou %.',
    ),
    label: field(
      'Destaque',
      'Opcional. Este texto aparece em negrito antes da descrição; os dois-pontos são adicionados automaticamente.',
    ),
    description: field('Descrição'),
  },
  'about.pillars-section': {
    title: field('Título da secção'),
    items: field(
      'Pilares apresentados',
      'Adicione e ordene os pilares apresentados na página Sobre.',
    ),
  },
  'about.founder-section': {
    label: field('Etiqueta da secção', 'Exemplo: Fundadora.'),
    name: field('Nome da fundadora'),
    paragraphs: field(
      'Textos da biografia',
      'Adicione os parágrafos e defina a ordem em que serão apresentados.',
    ),
    media: field(
      'Imagem da fundadora',
      'Defina a imagem para computador, a versão para telemóvel e o ponto de foco.',
    ),
    ctaLabel: field('Texto do botão', 'Exemplo: Comprar produtos.'),
  },
  'about.paragraph': {
    order: field(
      'Posição',
      'Use 1 para o primeiro parágrafo, 2 para o segundo e assim sucessivamente.',
    ),
    text: field('Texto do parágrafo'),
  },
  'about.locations-section': {
    label: field('Etiqueta da secção', 'Exemplo: Contacto.'),
    headline: field('Título principal'),
    description: field('Descrição introdutória'),
    items: field(
      'Locais e formas de atendimento',
      'Adicione locais, canais de compra ou modalidades de entrega.',
    ),
    media: field(
      'Imagem da secção',
      'Defina a imagem para computador, a versão para telemóvel e o ponto de foco.',
    ),
  },
  'about.location': {
    order: field('Posição', 'Define a ordem em que o item será apresentado.'),
    title: field('Nome do local ou serviço'),
    description: field('Morada ou descrição'),
  },
  'commerce.badge': {
    type: field('Tipo de selo', 'Escolha nenhum selo, desconto, novidade ou produto disponível em breve.'),
    percentage: field('Percentagem de desconto', 'Preencha apenas quando o tipo for desconto.'),
  },
  'commerce.prices': {
    aoa: field('Preço em kwanzas (Kz)'),
    eur: field('Preço em euros (€)'),
  },
  'commerce.product-commerce': {
    prices: field('Preços'),
    availability: field('Disponibilidade', 'Indique se está disponível, sem stock ou disponível em breve.'),
    stock: field('Quantidade em stock'),
    badge: field('Selo apresentado no produto'),
  },
  'home.editorial-product': {
    product: field('Produto', 'Apenas produtos com Conteúdo editorial preenchido ficam disponíveis.'),
    media: field('Imagem ou vídeo de apresentação'),
  },
  'home.editorial-gallery-product': {
    product: field('Produto', 'Apenas produtos com Galeria editorial preenchida ficam disponíveis. As imagens serão obtidas da galeria principal do produto.'),
  },
  'home.ingredients-presentation': {
    headline: field('Título da seção'),
    description: field('Descrição introdutória'),
    footnote: field('Texto complementar'),
    ingredients: field('Ingredientes apresentados', 'Selecione e ordene os ingredientes. O primeiro será apresentado inicialmente.'),
  },
  'home.testimonials-presentation': {
    title: field(
      'Título da secção',
      'Título apresentado ao lado dos vídeos de testemunhos.',
    ),
    description: field(
      'Texto sobre as avaliações',
      'Explique brevemente o significado das avaliações dos clientes.',
    ),
    testimonials: field(
      'Vídeos apresentados',
      'Selecione e ordene os testemunhos publicados que aparecerão na página inicial.',
    ),
  },
  'home.product-slot': {
    order: field('Posição'),
    product: field('Produto destacado'),
  },
  'home.kit-presentation': {
    order: field(
      'Posição na área Encontrar',
      'Defina a ordem do kit na lista apresentada abaixo da área editorial.',
    ),
    editorialTitle: field(
      'Título da apresentação editorial',
      'Se ficar vazio, será utilizado o nome do kit.',
    ),
    editorialDescription: field(
      'Descrição da apresentação editorial',
      'Se ficar vazia, será utilizada a descrição principal do kit.',
    ),
    editorialFootnote: field(
      'Nota abaixo do botão',
      'Texto complementar apresentado abaixo do botão Ver produtos.',
    ),
    finderDescription: field(
      'Texto apresentado na área Encontrar',
      'Descrição curta exibida junto à miniatura do kit.',
    ),
  },
  'home.collection-presentation': {
    order: field('Posição', 'Utilizada caso mais de uma coleção seja configurada no futuro.'),
    title: field('Título da apresentação', 'Se ficar vazio, será utilizado o nome da coleção.'),
    description: field('Descrição da apresentação', 'Se ficar vazia, será utilizada a descrição principal da coleção.'),
    footnote: field('Nota abaixo do botão'),
  },
  'product.before-after': {
    before: field('Imagem de antes'),
    after: field('Imagem de depois'),
    beforeLabel: field('Texto da imagem de antes'),
    afterLabel: field('Texto da imagem de depois'),
  },
  'product.benefit': {
    order: field('Posição'),
    title: field('Título do benefício'),
    description: field('Descrição do benefício'),
    images: field('Imagens do benefício'),
  },
  'product.editorial-copy': {
    headline: field('Título editorial'),
    description: field('Descrição editorial'),
    footnote: field('Nota complementar', 'Pequeno texto apresentado no final da área editorial.'),
  },
  'product.result-stat': {
    percentage: field('Percentagem'),
    description: field('Descrição do resultado'),
  },
  'product.results': {
    description: field('Descrição geral dos resultados'),
    statistics: field('Dados estatísticos'),
    comparison: field('Comparação antes e depois'),
  },
  'product.usage-step': {
    order: field('Número do passo'),
    name: field('Título do passo'),
    description: field('Instrução'),
  },
  'shared.link': {
    label: field('Texto do botão'),
    url: field('Endereço de destino'),
    openInNewTab: field('Abrir numa nova janela'),
  },
  'action.product': {
    label: field(
      'Texto do botão',
      'Texto apresentado antes do preço do produto.',
    ),
    product: field(
      'Produto de destino',
      'Selecione o produto que será aberto ao clicar no botão.',
    ),
  },
  'action.kit': {
    label: field(
      'Texto do botão',
      'Texto apresentado antes do preço do kit.',
    ),
    kit: field(
      'Kit de destino',
      'Selecione o kit que será aberto ao clicar no botão.',
    ),
  },
  'action.collection': {
    label: field('Texto do botão'),
    collection: field(
      'Coleção de destino',
      'Selecione a coleção cujos produtos serão apresentados.',
    ),
  },
  'action.category': {
    label: field('Texto do botão'),
    category: field(
      'Categoria de destino',
      'Selecione a categoria cujos produtos serão apresentados.',
    ),
  },
  'action.internal-page': {
    label: field('Texto do botão'),
    page: field(
      'Página de destino',
      'Escolha uma página existente da loja; não é necessário escrever o endereço.',
    ),
  },
  'action.external-link': {
    label: field('Texto do botão'),
    url: field(
      'Endereço externo',
      'Informe o endereço completo, começando por https://.',
      'https://exemplo.com',
    ),
    openInNewTab: field('Abrir numa nova janela'),
  },
  'shared.media-presentation': {
    desktopImage: field('Imagem para computador'),
    mobileImage: field('Imagem para telemóvel', 'Caso não seja preenchida, será utilizada a imagem para computador.'),
    video: field('Vídeo', 'Quando preenchido, o vídeo tem prioridade sobre as imagens.'),
    placeholder: field('Imagem de espera do vídeo', 'Apresentada enquanto o vídeo está a carregar.'),
    alt: field('Descrição acessível da imagem', 'Descreva objetivamente o conteúdo visual.'),
    focalPointX: field('Foco horizontal da imagem', '0 posiciona à esquerda, 50 ao centro e 100 à direita.'),
    focalPointY: field('Foco vertical da imagem', '0 posiciona no topo, 50 ao centro e 100 em baixo.'),
    objectFit: field('Ajuste da imagem', 'Escolha entre preencher toda a área ou mostrar a imagem completa.'),
    hasNoise: field('Aplicar textura visual'),
  },
  'shared.seo': {
    metaTitle: field('Título para pesquisa', 'Recomendado: até 60 caracteres.'),
    metaDescription: field('Descrição para pesquisa', 'Recomendado: até 160 caracteres.'),
    shareImage: field('Imagem de partilha', 'Utilizada ao partilhar a página nas redes sociais.'),
  },
  'shared.text-item': {
    order: field('Posição'),
    title: field('Título'),
    description: field('Descrição'),
  },
};

type ConfigurationService = {
  findContentType?: (uid: string) => unknown;
  findComponent?: (uid: string) => unknown;
  findConfiguration: (model: unknown) => Promise<ContentManagerConfiguration>;
  updateConfiguration: (
    model: unknown,
    configuration: ContentManagerConfiguration,
  ) => Promise<unknown>;
};

type ContentManagerConfiguration = {
  settings: Record<string, unknown>;
  metadatas: Record<
    string,
    {
      edit?: Record<string, unknown>;
      list?: Record<string, unknown>;
    }
  >;
  layouts: Record<string, unknown>;
  options?: Record<string, unknown>;
};

function withPortuguesePresentation(
  configuration: ContentManagerConfiguration,
  presentation: ModelPresentation,
  hiddenFields: string[] = [],
  readOnlyFields: string[] = [],
): ContentManagerConfiguration {
  const metadatas = { ...configuration.metadatas };

  for (const [attribute, copy] of Object.entries(presentation)) {
    const current = metadatas[attribute];
    if (!current) continue;

    metadatas[attribute] = {
      ...current,
      edit: {
        ...current.edit,
        label: copy.label,
        ...(copy.description ? { description: copy.description } : {}),
        ...(copy.placeholder ? { placeholder: copy.placeholder } : {}),
      },
      list: {
        ...current.list,
        label: copy.label,
      },
    };
  }

  for (const attribute of hiddenFields) {
    const current = metadatas[attribute];
    if (!current) continue;
    metadatas[attribute] = {
      ...current,
      edit: {
        ...current.edit,
        visible: false,
      },
    };
  }

  for (const attribute of readOnlyFields) {
    const current = metadatas[attribute];
    if (!current) continue;
    metadatas[attribute] = {
      ...current,
      edit: {
        ...current.edit,
        editable: false,
      },
    };
  }

  const hideFromEditLayout = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      return node
        .map(hideFromEditLayout)
        .filter((item) => item !== null);
    }

    if (!node || typeof node !== 'object') return node;
    const record = node as Record<string, unknown>;
    if (typeof record.name === 'string' && hiddenFields.includes(record.name)) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, value]) => [
        key,
        hideFromEditLayout(value),
      ]),
    );
  };

  return {
    settings: configuration.settings,
    metadatas,
    layouts: {
      ...configuration.layouts,
      ...(configuration.layouts.edit
        ? { edit: hideFromEditLayout(configuration.layouts.edit) }
        : {}),
    },
    ...(configuration.options ? { options: configuration.options } : {}),
  };
}

export async function applyPortugueseContentManager(
  strapi: Core.Strapi,
): Promise<void> {
  const contentTypeService = strapi
    .plugin('content-manager')
    .service('content-types') as ConfigurationService;
  const componentService = strapi
    .plugin('content-manager')
    .service('components') as ConfigurationService;

  for (const [uid, presentation] of Object.entries(contentTypes)) {
    const model = contentTypeService.findContentType?.(uid);
    if (!model) continue;

    const configuration = await contentTypeService.findConfiguration(model);
    await contentTypeService.updateConfiguration(
      model,
      withPortuguesePresentation(
        configuration,
        presentation,
        hiddenFieldsByContentType[uid] ?? [],
        readOnlyFieldsByContentType[uid] ?? [],
      ),
    );
  }

  for (const [uid, presentation] of Object.entries(components)) {
    const model = componentService.findComponent?.(uid);
    if (!model) continue;

    const configuration = await componentService.findConfiguration(model);
    await componentService.updateConfiguration(
      model,
      withPortuguesePresentation(configuration, presentation),
    );
  }
}
