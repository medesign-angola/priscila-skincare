import { Injectable, signal, computed, inject } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Product, ProductHomePlacement } from '../models/product.interface';
import { Kit } from '../models/kit.interface';
import { Collection } from '../models/collection.interface';
import { Category } from '../models/category.interface';
import { Size } from '../models/size.interface';
import {
  HomeIngredientsPresentation,
  Ingredient,
} from '../models/ingredient.interface';
import { HomeTestimonialsPresentation } from '../models/testimonial.interface';
import { HomePageConfiguration } from '../models/home-page.interface';
import {
  LocalizedAboutBrandPresentation,
  LocalizedAboutPagePresentation,
} from '../models/about-page.interface';
import { LocalizedSiteSettingPresentation } from '../models/site-setting.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductFacade {
  private productService = inject(ProductService);

  // States
  readonly products = signal<Product[]>([]);
  readonly kits = signal<Kit[]>([]);
  readonly featuredKits = signal<Kit[]>([]);
  readonly collections = signal<Collection[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly sizes = signal<Size[]>([]);
  readonly ingredients = signal<Ingredient[]>([]);
  readonly homeIngredientsPresentation =
    signal<HomeIngredientsPresentation | null>(null);
  readonly aboutIngredientsPresentation =
    signal<HomeIngredientsPresentation | null>(null);
  readonly homeTestimonialsPresentation =
    signal<HomeTestimonialsPresentation | null>(null);
  readonly homePageConfiguration = signal<HomePageConfiguration | null>(null);
  readonly aboutBrandPresentation =
    signal<LocalizedAboutBrandPresentation | null>(null);
  readonly aboutPagePresentation =
    signal<LocalizedAboutPagePresentation | null>(null);
  readonly siteSettingPresentation =
    signal<LocalizedSiteSettingPresentation | null>(null);
  readonly activeKitIndex = signal<number>(0);
  readonly currentLanguage = signal<'pt' | 'fr'>('pt');

  // Computed signals
  readonly activeKit = computed(() => {
    const list = this.featuredKits();
    const idx = this.activeKitIndex();
    return list.length > 0 ? list[idx] : null;
  });

  readonly localizedActiveKit = computed(() => {
    const kit = this.activeKit();
    return kit ? { ...kit, ...kit.translations[this.currentLanguage()] } : null;
  });

  readonly mappedProducts = computed(
    () => new Map(this.products().map((product) => [product.id, product])),
  );

  readonly mappedCategories = computed(
    () => new Map(this.categories().map((category) => [category.id, category])),
  );

  readonly featuredProducts = computed(() => {
    const configuredIds =
      this.homePageConfiguration()?.featuredProductIds[
        this.currentLanguage()
      ] ?? [];
    const mappedProducts = this.mappedProducts();

    if (configuredIds.length > 0) {
      return configuredIds
        .map((id) => mappedProducts.get(id))
        .filter((product): product is Product => product !== undefined);
    }

    return this.products()
      .filter((product) => product.featured)
      .sort(
        (firstProduct, secondProduct) =>
          (firstProduct.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (secondProduct.featuredOrder ?? Number.MAX_SAFE_INTEGER),
      );
  });

  readonly homeBrandPillars = computed(
    () =>
      this.homePageConfiguration()?.brandPillars[this.currentLanguage()] ??
      null,
  );

  readonly editorialCoverProducts = computed(() => {
    const language = this.currentLanguage();
    const configuration = this.homePageConfiguration()?.editorialCover[language];
    const product = configuration
      ? this.mappedProducts().get(configuration.productId)
      : undefined;

    if (configuration && product) {
      return [
        {
          product,
          placement: {
            type: 'editorial-cover' as const,
            order: 1,
            mediaType: configuration.mediaType,
            mediaUrl: configuration.mediaUrl,
            placeholderUrl: configuration.placeholderUrl,
            hasNoise: configuration.hasNoise,
          },
        },
      ];
    }

    return this.productService.useMockFallbacks
      ? this.productsWithPlacement('editorial-cover')
      : [];
  });

  readonly editorialGalleryProducts = computed(() => {
    const language = this.currentLanguage();
    const configuredId =
      this.homePageConfiguration()?.editorialGalleryProductIds[language] ??
      null;
    const product = configuredId
      ? this.mappedProducts().get(configuredId)
      : undefined;

    if (product && product.images.length >= 5) {
      return [
        {
          product,
          placement: {
            type: 'editorial-gallery' as const,
            order: 1,
            coverImage: product.images[0],
            imageIndexes: [0, 1, 2, 3, 4],
          },
        },
      ];
    }

    return this.productService.useMockFallbacks
      ? this.productsWithPlacement('editorial-gallery')
      : [];
  });

  readonly mappedIngredients = computed(
    () =>
      new Map(
        this.ingredients().map((ingredient) => [ingredient.id, ingredient]),
      ),
  );

  readonly homeIngredients = computed(() =>
    this.resolveIngredientsPresentation(this.homeIngredientsPresentation()),
  );

  readonly aboutIngredients = computed(() =>
    this.resolveIngredientsPresentation(this.aboutIngredientsPresentation()),
  );

  private resolveIngredientsPresentation(
    presentation: HomeIngredientsPresentation | null,
  ) {
    if (!presentation) return null;

    const language = this.currentLanguage();
    const mappedIngredients = this.mappedIngredients();

    return {
      ...presentation.translations[language],
      initialIngredientId: presentation.initialIngredientId,
      ingredients: presentation.ingredientIds.flatMap((id, index) => {
        const ingredient = mappedIngredients.get(id);
        if (!ingredient) return [];

        return [
          {
            id: ingredient.id,
            index: String(index + 1).padStart(2, '0'),
            name: ingredient.translations[language].name,
            thumbnailImage: ingredient.thumbnailImage,
            editorialImage: ingredient.editorialImage,
            editorialPosition: ingredient.editorialPosition ?? 'center',
          },
        ];
      }),
    };
  }

  readonly globalReviewsSummary = computed(() => {
    const language = this.currentLanguage();
    let weightedRatingTotal = 0;
    let totalReviews = 0;

    for (const product of this.products()) {
      const reviews = product.translations[language].reviews;
      if (reviews.totalReviews <= 0) continue;

      weightedRatingTotal += reviews.averageRating * reviews.totalReviews;
      totalReviews += reviews.totalReviews;
    }

    return {
      averageRating: totalReviews > 0 ? weightedRatingTotal / totalReviews : 0,
      totalReviews,
    };
  });

  readonly homeTestimonials = computed(() => {
    const presentation = this.homeTestimonialsPresentation();
    if (!presentation) return null;

    const language = this.currentLanguage();

    return {
      ...presentation.translations[language],
      testimonials: [...presentation.testimonials[language]].sort(
        (firstTestimonial, secondTestimonial) =>
          firstTestimonial.order - secondTestimonial.order,
      ),
    };
  });

  readonly collectionsWithProducts = computed(() => {
    const mappedProducts = this.mappedProducts();

    return this.collections().map((collection) => ({
      ...collection,
      products: collection.productIds
        .map((id) => mappedProducts.get(id))
        .filter((product): product is Product => product !== undefined),
    }));
  });

  readonly localizedCollectionsWithProducts = computed(() => {
    const language = this.currentLanguage();
    return this.collectionsWithProducts().map((collection) => ({
      ...collection,
      ...collection.translations[language],
    }));
  });

  readonly homeCollectionsWithProducts = computed(() => {
    const language = this.currentLanguage();

    return this.collectionsWithProducts()
      .filter((collection) => collection.home !== undefined && collection.media)
      .sort(
        (firstCollection, secondCollection) =>
          (firstCollection.home?.order ?? Number.MAX_SAFE_INTEGER) -
          (secondCollection.home?.order ?? Number.MAX_SAFE_INTEGER),
      )
      .map((collection) => ({
        id: collection.id,
        slug: collection.slug,
        thumbnailImage: collection.thumbnailImage,
        media: collection.media!,
        productCount: collection.products.length,
        ...collection.home!.translations[language],
      }));
  });

  readonly kitsWithProducts = computed(() => {
    const mappedProducts = this.mappedProducts();

    return this.kits().map((kit) => ({
      ...kit,
      products: kit.productIds
        .map((id) => mappedProducts.get(id))
        .filter((product): product is Product => product !== undefined),
    }));
  });

  readonly aboutBrand = computed(
    () =>
      this.aboutBrandPresentation()?.translations[this.currentLanguage()] ??
      null,
  );

  readonly aboutPage = computed(
    () =>
      this.aboutPagePresentation()?.translations[this.currentLanguage()] ??
      null,
  );

  readonly siteSetting = computed(
    () =>
      this.siteSettingPresentation()?.translations[this.currentLanguage()] ??
      null,
  );

  readonly featuredHomeCollectionWithProducts = computed(() => {
    const configuredId =
      this.homePageConfiguration()?.featuredCollectionIds[
        this.currentLanguage()
      ] ?? null;
    const selectedCollection = configuredId
      ? this.collectionsWithProducts().find(
          (collection) => collection.id === configuredId,
        )
      : undefined;

    if (
      selectedCollection?.home &&
      selectedCollection.media
    ) {
      return {
        id: selectedCollection.id,
        slug: selectedCollection.slug,
        thumbnailImage: selectedCollection.thumbnailImage,
        media: selectedCollection.media,
        productCount: selectedCollection.products.length,
        ...selectedCollection.home.translations[this.currentLanguage()],
      };
    }

    return this.productService.useMockFallbacks
      ? this.homeCollectionsWithProducts()[0] ?? null
      : null;
  });

  readonly mappedKitsWithProducts = computed(
    () =>
      new Map(
        this.kitsWithProducts().map((kit) => [kit.id, kit]),
      ),
  );

  readonly localizedKitsWithProducts = computed(() => {
    const language = this.currentLanguage();
    return this.kitsWithProducts().map((kit) => ({
      ...kit,
      ...kit.translations[language],
    }));
  });

  readonly localizedFeaturedKits = computed(() => {
    const language = this.currentLanguage();
    return this.featuredKits().map((kit) => ({
      ...kit,
      ...kit.translations[language],
    }));
  });

  readonly homeKitsWithProducts = computed(() =>
    this.kitsWithProducts()
      .filter((kit) => kit.home !== undefined)
      .sort(
        (firstKit, secondKit) =>
          (firstKit.home?.order ?? Number.MAX_SAFE_INTEGER) -
          (secondKit.home?.order ?? Number.MAX_SAFE_INTEGER),
      )
      .slice(0, 4),
  );

  readonly featuredHomeKitWithProducts = computed(() => {
    const configuredId =
      this.homePageConfiguration()?.featuredKitIds[
        this.currentLanguage()
      ] ?? null;

    if (configuredId) {
      const configuredKit = this.mappedKitsWithProducts().get(configuredId);
      if (configuredKit) return configuredKit;
    }

    return this.productService.useMockFallbacks
      ? this.homeKitsWithProducts()[0] ?? null
      : null;
  });

  // Maps active kit's product IDs to actual Product objects dynamically
  readonly activeKitProducts = computed<Product[]>(() => {
    const kit = this.activeKit();
    const mappedProducts = this.mappedProducts();
    if (!kit || mappedProducts.size === 0) return [];
    return kit.productIds
      .map((id) => mappedProducts.get(id))
      .filter((product): product is Product => product !== undefined);
  });

  // Automatically resolves translated product details for the current active language
  readonly activeKitProductsTranslated = computed(() => {
    const products = this.activeKitProducts();
    const lang = this.currentLanguage();
    return products.map((prod) => ({
      id: prod.id,
      categoryId: prod.categoryId,
      sizeIds: prod.sizeIds,
      images: prod.images,
      ...prod.translations[lang],
    }));
  });

  constructor() {
    this.loadAllData();
  }

  private loadAllData() {
    this.productService
      .getHomePageConfiguration()
      .subscribe((data) => this.homePageConfiguration.set(data));
    this.productService
      .getProducts()
      .subscribe((data) => this.products.set(data));
    this.productService.getKits().subscribe((data) => this.kits.set(data));
    this.productService
      .getFeaturedKits()
      .subscribe((data) => this.featuredKits.set(data));
    this.productService
      .getCollections()
      .subscribe((data) => this.collections.set(data));
    this.productService
      .getCategories()
      .subscribe((data) => this.categories.set(data));
    this.productService.getSizes().subscribe((data) => this.sizes.set(data));
    this.productService
      .getIngredients()
      .subscribe((data) => this.ingredients.set(data));
    this.productService
      .getHomeIngredients()
      .subscribe((data) => this.homeIngredientsPresentation.set(data));
    this.productService
      .getAboutIngredients()
      .subscribe((data) => this.aboutIngredientsPresentation.set(data));
    this.productService
      .getAboutBrand()
      .subscribe((data) => this.aboutBrandPresentation.set(data));
    this.productService
      .getAboutPage()
      .subscribe((data) => this.aboutPagePresentation.set(data));
    this.productService
      .getSiteSetting()
      .subscribe((data) => this.siteSettingPresentation.set(data));
    this.productService
      .getHomeTestimonials()
      .subscribe((data) => this.homeTestimonialsPresentation.set(data));
  }

  // Resolves sizes of a given product (accepts both original and translated product shape)
  getProductSizes(product: { sizeIds: string[] }): Size[] {
    const allSizes = this.sizes();
    return allSizes.filter((size) => product.sizeIds.includes(size.id));
  }

  nextSlide() {
    const list = this.featuredKits();
    if (list.length === 0) return;
    this.activeKitIndex.update((idx) => (idx + 1) % list.length);
  }

  prevSlide() {
    const list = this.featuredKits();
    if (list.length === 0) return;
    this.activeKitIndex.update((idx) => (idx - 1 + list.length) % list.length);
  }

  selectSlide(index: number) {
    this.activeKitIndex.set(index);
  }

  private productsWithPlacement<T extends ProductHomePlacement['type']>(
    type: T,
  ) {
    return this.products()
      .flatMap((product) => {
        const placement = product.homePlacements?.find(
          (
            candidate,
          ): candidate is Extract<ProductHomePlacement, { type: T }> =>
            candidate.type === type,
        );

        return placement ? [{ product, placement }] : [];
      })
      .sort(
        (firstEntry, secondEntry) =>
          firstEntry.placement.order - secondEntry.placement.order,
      );
  }
}
