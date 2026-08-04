import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, Observable, of, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.interface';
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
import { MOCK_PRODUCTS } from '../mocks/products.mock';
import { MOCK_KITS } from '../mocks/kits.mock';
import { MOCK_COLLECTIONS } from '../mocks/collections.mock';
import { MOCK_CATEGORIES } from '../mocks/categories.mock';
import { MOCK_SIZES } from '../mocks/sizes.mock';
import {
  MOCK_HOME_INGREDIENTS,
  MOCK_INGREDIENTS,
} from '../mocks/ingredients.mock';
import { MOCK_HOME_TESTIMONIALS } from '../mocks/testimonials.mock';
import { CmsService } from './cms.service';
import {
  mapCmsCategories,
  mapCmsCollection,
  mapCmsKit,
  mapCmsFeaturedCollectionId,
  mapCmsHomeBrandPillars,
  mapCmsFeaturedKitId,
  mapCmsFeaturedProductIds,
  mapCmsEditorialCover,
  mapCmsEditorialGalleryProductId,
  mapCmsIngredients,
  mapCmsIngredientsPresentation,
  mapCmsTestimonialsPresentation,
  mapCmsAboutBrand,
  mapCmsAboutPage,
  mapCmsSiteSetting,
  mapCmsProduct,
  mapCmsSizes,
  mergeCmsCategories,
  mergeCmsCollections,
  mergeCmsKits,
  mergeCmsProducts,
} from '../mappers/cms.mapper';
import {
  LocalizedAboutBrandPresentation,
  LocalizedAboutPagePresentation,
} from '../models/about-page.interface';
import {
  CmsAboutPage,
  CmsCategory,
  CmsHomePage,
  CmsIngredient,
  CmsKit,
  CmsProductCollection,
  CmsProduct,
  CmsSiteSetting,
} from '../models/cms.interface';
import { LocalizedSiteSettingPresentation } from '../models/site-setting.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly cms = inject(CmsService);
  readonly useMockFallbacks = this.cms.useMockFallbacks;
  private readonly localizedHomePages$ = forkJoin({
    pt: this.cms
      .getHomePage('pt')
      .pipe(catchError(() => of(null as CmsHomePage | null))),
    fr: this.cms
      .getHomePage('fr')
      .pipe(catchError(() => of(null as CmsHomePage | null))),
  }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  private readonly localizedAboutPages$ = forkJoin({
    pt: this.cms
      .getAboutPage('pt')
      .pipe(catchError(() => of(null as CmsAboutPage | null))),
    fr: this.cms
      .getAboutPage('fr')
      .pipe(catchError(() => of(null as CmsAboutPage | null))),
  }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  private readonly localizedSiteSettings$ = forkJoin({
    pt: this.cms
      .getSiteSetting('pt')
      .pipe(catchError(() => of(null as CmsSiteSetting | null))),
    fr: this.cms
      .getSiteSetting('fr')
      .pipe(catchError(() => of(null as CmsSiteSetting | null))),
  }).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  getProducts(): Observable<Product[]> {
    return forkJoin({
      pt: this.cms
        .getProducts('pt')
        .pipe(catchError(() => of([] as CmsProduct[]))),
      fr: this.cms
        .getProducts('fr')
        .pipe(catchError(() => of([] as CmsProduct[]))),
    }).pipe(
      map(({ pt, fr }) => {
        if (pt.length === 0) {
          return this.useMockFallbacks ? MOCK_PRODUCTS : [];
        }
        const frenchByDocumentId = new Map(
          fr.map((product) => [product.documentId, product]),
        );
        const cmsProducts = pt.map((product) =>
          mapCmsProduct(
            product,
            frenchByDocumentId.get(product.documentId),
            this.cms.baseUrl,
          ),
        );
        return this.useMockFallbacks
          ? mergeCmsProducts(cmsProducts, MOCK_PRODUCTS)
          : cmsProducts;
      }),
    );
  }

  getKits(): Observable<Kit[]> {
    return forkJoin({
      pt: this.cms
        .getKits('pt')
        .pipe(catchError(() => of([] as CmsKit[]))),
      fr: this.cms
        .getKits('fr')
        .pipe(catchError(() => of([] as CmsKit[]))),
    }).pipe(
      map(({ pt, fr }) => {
        if (pt.length === 0) {
          return this.useMockFallbacks ? MOCK_KITS : [];
        }
        const frenchByDocumentId = new Map(
          fr.map((kit) => [kit.documentId, kit]),
        );
        const cmsKits = pt.map((kit) =>
          mapCmsKit(
            kit,
            frenchByDocumentId.get(kit.documentId),
            this.cms.baseUrl,
          ),
        );
        return this.useMockFallbacks
          ? mergeCmsKits(cmsKits, MOCK_KITS)
          : cmsKits;
      }),
    );
  }

  getHomePageConfiguration(): Observable<HomePageConfiguration | null> {
    return this.localizedHomePages$.pipe(
      map(({ pt, fr }) => {
        if (!pt) return null;
        const portugueseFeaturedProductIds =
          mapCmsFeaturedProductIds(pt);
        const frenchFeaturedProductIds = fr
          ? mapCmsFeaturedProductIds(fr)
          : portugueseFeaturedProductIds;
        const portugueseEditorialCover = mapCmsEditorialCover(
          pt,
          this.cms.baseUrl,
        );
        const frenchEditorialCover = fr
          ? mapCmsEditorialCover(fr, this.cms.baseUrl)
          : portugueseEditorialCover;
        const portugueseEditorialGalleryProductId =
          mapCmsEditorialGalleryProductId(pt);
        const frenchEditorialGalleryProductId = fr
          ? mapCmsEditorialGalleryProductId(fr)
          : portugueseEditorialGalleryProductId;
        const portugueseFeaturedKitId = mapCmsFeaturedKitId(pt);
        const frenchFeaturedKitId = fr
          ? mapCmsFeaturedKitId(fr)
          : portugueseFeaturedKitId;
        const portugueseFeaturedCollectionId =
          mapCmsFeaturedCollectionId(pt);
        const frenchFeaturedCollectionId = fr
          ? mapCmsFeaturedCollectionId(fr)
          : portugueseFeaturedCollectionId;
        const portugueseBrandPillars = mapCmsHomeBrandPillars(
          pt.brandPillars,
        );
        const frenchBrandPillars = mapCmsHomeBrandPillars(
          fr?.brandPillars,
          pt.brandPillars,
        );

        return {
          featuredProductIds: {
            pt: portugueseFeaturedProductIds,
            fr:
              frenchFeaturedProductIds.length > 0
                ? frenchFeaturedProductIds
                : portugueseFeaturedProductIds,
          },
          editorialCover: {
            pt: portugueseEditorialCover,
            fr: frenchEditorialCover ?? portugueseEditorialCover,
          },
          editorialGalleryProductIds: {
            pt: portugueseEditorialGalleryProductId,
            fr:
              frenchEditorialGalleryProductId ??
              portugueseEditorialGalleryProductId,
          },
          featuredKitIds: {
            pt: portugueseFeaturedKitId,
            fr: frenchFeaturedKitId ?? portugueseFeaturedKitId,
          },
          featuredCollectionIds: {
            pt: portugueseFeaturedCollectionId,
            fr:
              frenchFeaturedCollectionId ??
              portugueseFeaturedCollectionId,
          },
          brandPillars: {
            pt: portugueseBrandPillars,
            fr: frenchBrandPillars ?? portugueseBrandPillars,
          },
        };
      }),
    );
  }

  // Returns only featured kits (featured: true) for the Hero slider
  getFeaturedKits(): Observable<Kit[]> {
    return this.getKits().pipe(
      map((kits) => kits.filter((kit) => kit.featured)),
    );
  }

  getCollections(): Observable<Collection[]> {
    return forkJoin({
      pt: this.cms
        .getCollections('pt')
        .pipe(catchError(() => of([] as CmsProductCollection[]))),
      fr: this.cms
        .getCollections('fr')
        .pipe(catchError(() => of([] as CmsProductCollection[]))),
    }).pipe(
      map(({ pt, fr }) => {
        if (pt.length === 0) {
          return this.useMockFallbacks ? MOCK_COLLECTIONS : [];
        }
        const frenchByDocumentId = new Map(
          fr.map((collection) => [collection.documentId, collection]),
        );
        const cmsCollections = pt.map((collection) =>
          mapCmsCollection(
            collection,
            frenchByDocumentId.get(collection.documentId),
            this.cms.baseUrl,
          ),
        );
        return this.useMockFallbacks
          ? mergeCmsCollections(cmsCollections, MOCK_COLLECTIONS)
          : cmsCollections;
      }),
    );
  }

  getCategories(): Observable<Category[]> {
    return forkJoin({
      pt: this.cms
        .getCategories('pt')
        .pipe(catchError(() => of([] as CmsCategory[]))),
      fr: this.cms
        .getCategories('fr')
        .pipe(catchError(() => of([] as CmsCategory[]))),
    }).pipe(
      map(({ pt, fr }) =>
        pt.length > 0
          ? this.useMockFallbacks
            ? mergeCmsCategories(mapCmsCategories(pt, fr), MOCK_CATEGORIES)
            : mapCmsCategories(pt, fr)
          : this.useMockFallbacks
            ? MOCK_CATEGORIES
            : [],
      ),
    );
  }

  getSizes(): Observable<Size[]> {
    return this.cms.getSizes().pipe(
      map((sizes) => {
        const cmsSizes = mapCmsSizes(sizes);
        const cmsValues = new Set(
          cmsSizes.map((size) => size.value.toLocaleLowerCase()),
        );
        return this.useMockFallbacks
          ? [
              ...cmsSizes,
              ...MOCK_SIZES.filter(
                (size) => !cmsValues.has(size.value.toLocaleLowerCase()),
              ),
            ]
          : cmsSizes;
      }),
      catchError(() => of(this.useMockFallbacks ? MOCK_SIZES : [])),
    );
  }

  getIngredients(): Observable<Ingredient[]> {
    return forkJoin({
      pt: this.cms
        .getIngredients('pt')
        .pipe(catchError(() => of([] as CmsIngredient[]))),
      fr: this.cms
        .getIngredients('fr')
        .pipe(catchError(() => of([] as CmsIngredient[]))),
    }).pipe(
      map(({ pt, fr }) => {
        if (pt.length === 0) {
          return this.useMockFallbacks ? MOCK_INGREDIENTS : [];
        }
        return mapCmsIngredients(pt, fr, this.cms.baseUrl);
      }),
    );
  }

  getHomeIngredients(): Observable<HomeIngredientsPresentation | null> {
    return this.localizedHomePages$.pipe(
      map(({ pt, fr }) =>
        mapCmsIngredientsPresentation(pt?.ingredients, fr?.ingredients) ??
        (this.useMockFallbacks ? MOCK_HOME_INGREDIENTS : null),
      ),
    );
  }

  getAboutIngredients(): Observable<HomeIngredientsPresentation | null> {
    return this.localizedAboutPages$.pipe(
      map(({ pt, fr }) =>
        mapCmsIngredientsPresentation(pt?.ingredients, fr?.ingredients) ??
        (this.useMockFallbacks ? MOCK_HOME_INGREDIENTS : null),
      ),
    );
  }

  getAboutBrand(): Observable<LocalizedAboutBrandPresentation | null> {
    return this.localizedAboutPages$.pipe(
      map(({ pt, fr }) => mapCmsAboutBrand(pt, fr, this.cms.baseUrl)),
    );
  }

  getAboutPage(): Observable<LocalizedAboutPagePresentation | null> {
    return this.localizedAboutPages$.pipe(
      map(({ pt, fr }) => mapCmsAboutPage(pt, fr, this.cms.baseUrl)),
    );
  }

  getSiteSetting(): Observable<LocalizedSiteSettingPresentation | null> {
    return this.localizedSiteSettings$.pipe(
      map(({ pt, fr }) => mapCmsSiteSetting(pt, fr, this.cms.baseUrl)),
    );
  }

  getHomeTestimonials(): Observable<HomeTestimonialsPresentation | null> {
    return this.localizedHomePages$.pipe(
      map(
        ({ pt, fr }) =>
          mapCmsTestimonialsPresentation(
            pt?.testimonials,
            fr?.testimonials,
            this.cms.baseUrl,
          ) ?? (this.useMockFallbacks ? MOCK_HOME_TESTIMONIALS : null),
      ),
    );
  }
}
