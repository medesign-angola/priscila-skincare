import { Injectable, signal, computed, inject } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.interface';
import { Kit } from '../models/kit.interface';
import { Collection } from '../models/collection.interface';
import { Category } from '../models/category.interface';
import { Size } from '../models/size.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductFacade {
  private productService = inject(ProductService);

  // States
  readonly products = signal<Product[]>([]);
  readonly featuredKits = signal<Kit[]>([]);
  readonly collections = signal<Collection[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly sizes = signal<Size[]>([]);
  readonly activeKitIndex = signal<number>(0);
  readonly currentLanguage = signal<'pt' | 'fr'>('pt');

  // Computed signals
  readonly activeKit = computed(() => {
    const list = this.featuredKits();
    const idx = this.activeKitIndex();
    return list.length > 0 ? list[idx] : null;
  });

  readonly mappedProducts = computed(
    () => new Map(this.products().map((product) => [product.id, product])),
  );

  readonly featuredProducts = computed(() =>
    this.products()
      .filter((product) => product.featured)
      .sort(
        (firstProduct, secondProduct) =>
          (firstProduct.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (secondProduct.featuredOrder ?? Number.MAX_SAFE_INTEGER),
      ),
  );

  readonly collectionsWithProducts = computed(() => {
    const mappedProducts = this.mappedProducts();

    return this.collections().map((collection) => ({
      ...collection,
      products: collection.productIds
        .map((id) => mappedProducts.get(id))
        .filter((product): product is Product => product !== undefined),
    }));
  });

  readonly kitsWithProducts = computed(() => {
    const mappedProducts = this.mappedProducts();

    return this.featuredKits().map((kit) => ({
      ...kit,
      products: kit.productIds
        .map((id) => mappedProducts.get(id))
        .filter((product): product is Product => product !== undefined),
    }));
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
      .getProducts()
      .subscribe((data) => this.products.set(data));
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
}
