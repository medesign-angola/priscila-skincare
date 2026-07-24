import type { Core } from '@strapi/strapi';

type FieldPresentation = {
  label: string;
  description?: string;
  placeholder?: string;
};

type ModelPresentation = Record<string, FieldPresentation>;

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
    media: field('Imagem ou vídeo de apresentação', 'Conteúdo principal utilizado para apresentar a coleção.'),
    products: field('Produtos da coleção', 'Selecione todos os produtos que pertencem a esta coleção.'),
    seo: field('Pesquisa e partilha'),
  },
  'api::kit.kit': {
    name: field('Nome do kit'),
    slug: field('Endereço do kit', 'Gerado a partir do nome.'),
    description: field('Descrição do kit'),
    commerce: field('Preço, disponibilidade e stock'),
    thumbnailImage: field('Imagem de miniatura', 'Utilizada nos menus e listas compactas.'),
    media: field('Imagem ou vídeo de apresentação'),
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
    name: field('Nome interno do banner', 'Ajuda a identificar o banner no painel; não é apresentado ao público.'),
    label: field('Etiqueta'),
    headline: field('Título principal'),
    description: field('Descrição'),
    media: field('Imagem ou vídeo do banner', 'Defina também a versão mobile e o ponto de foco da imagem.'),
    cta: field('Botão de ação'),
    order: field('Posição', 'Use 1 para o primeiro banner, 2 para o segundo e assim sucessivamente.'),
  },
  'api::home-page.home-page': {
    heroSlides: field('Banners principais', 'Selecione e ordene os banners apresentados no início da página.'),
    featuredProducts: field('Produtos destacados', 'Produtos apresentados na seção de destaques. Não repita produtos usados nas áreas editoriais.'),
    editorialCover: field('Produto editorial com vídeo ou imagem', 'Produto apresentado na área editorial de capa.'),
    editorialGallery: field('Produto da galeria editorial', 'Produto apresentado na segunda área editorial.'),
    featuredKit: field('Kit em destaque'),
    featuredCollection: field('Coleção em destaque'),
    ingredients: field('Ingredientes em destaque'),
    testimonials: field('Testemunhos em vídeo'),
    seo: field('Pesquisa e partilha'),
  },
  'api::about-page.about-page': {
    heroLabel: field('Etiqueta da apresentação'),
    heroHeadline: field('Título principal'),
    heroDescription: field('Descrição da apresentação'),
    heroMedia: field('Imagem principal'),
    brandTimeline: field('História e números da marca', 'Adicione os principais marcos e dados estatísticos.'),
    founderName: field('Nome da fundadora'),
    founderBiography: field('Biografia da fundadora'),
    founderMedia: field('Imagem da fundadora'),
    ingredients: field('Ingredientes em destaque'),
    seo: field('Pesquisa e partilha'),
  },
  'api::review.review': {
    name: field('Nome do cliente'),
    comment: field('Comentário'),
    rating: field('Classificação', 'Valor de 1 a 5 estrelas.'),
    reviewDate: field('Data da avaliação'),
    product: field('Produto avaliado'),
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
  'commerce.badge': {
    type: field('Tipo de selo', 'Desconto, novidade ou produto disponível em breve.'),
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
    product: field('Produto'),
    media: field('Imagem ou vídeo de apresentação'),
    galleryImageIndexes: field('Imagens da galeria a utilizar', 'Informe as posições das imagens do produto que devem aparecer nesta área.'),
  },
  'home.product-slot': {
    order: field('Posição'),
    product: field('Produto destacado'),
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

  return {
    settings: configuration.settings,
    metadatas,
    layouts: configuration.layouts,
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
      withPortuguesePresentation(configuration, presentation),
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
