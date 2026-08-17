import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CMS_CONFIG } from '../config/cms.config';
import {
  CmsAboutPage,
  CmsCollectionResponse,
  CmsCategory,
  CmsIngredient,
  CmsProductCollection,
  CmsHeroSlide,
  CmsHomePage,
  CmsKit,
  CmsLocale,
  CmsProduct,
  CmsSingleResponse,
  CmsSize,
  CmsSiteSetting,
} from '../models/cms.interface';
import { HeroSlide } from '../models/hero-slide.interface';
import { mapCmsHeroSlide } from '../mappers/cms.mapper';

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CMS_CONFIG);

  readonly baseUrl = this.config.baseUrl;
  readonly useMockFallbacks = this.config.useMockFallbacks ?? false;

  getHeroSlides(locale: CmsLocale): Observable<HeroSlide[]> {
    return this.http
      .get<CmsCollectionResponse<CmsHeroSlide>>(
        `${this.baseUrl}/api/hero-slides`,
        { params: this.heroSlideParams(locale) },
      )
      .pipe(
        map((response) =>
          response.data
            .map((slide) => mapCmsHeroSlide(slide, this.baseUrl))
            .filter((slide): slide is HeroSlide => slide !== null)
            .sort((first, second) => first.order - second.order),
        ),
      );
  }

  getProducts(locale: CmsLocale): Observable<CmsProduct[]> {
    return this.http
      .get<CmsCollectionResponse<CmsProduct>>(
        `${this.baseUrl}/api/products`,
        { params: this.productParams(locale) },
      )
      .pipe(map((response) => response.data));
  }

  getKits(locale: CmsLocale): Observable<CmsKit[]> {
    return this.http
      .get<CmsCollectionResponse<CmsKit>>(`${this.baseUrl}/api/kits`, {
        params: this.kitParams(locale),
      })
      .pipe(map((response) => response.data));
  }

  getCollections(locale: CmsLocale): Observable<CmsProductCollection[]> {
    return this.http
      .get<CmsCollectionResponse<CmsProductCollection>>(
        `${this.baseUrl}/api/collections`,
        { params: this.collectionParams(locale) },
      )
      .pipe(map((response) => response.data));
  }

  getHomePage(locale: CmsLocale): Observable<CmsHomePage | null> {
    return this.http
      .get<CmsSingleResponse<CmsHomePage>>(
        `${this.baseUrl}/api/home-page`,
        {
          params: new HttpParams()
            .set('locale', locale)
            .set(
              'populate[featuredProducts][populate][product]',
              'true',
            )
            .set('populate[editorialCover][populate][product]', 'true')
            .set(
              'populate[editorialCover][populate][media][populate][desktopImage]',
              'true',
            )
            .set(
              'populate[editorialCover][populate][media][populate][video]',
              'true',
            )
            .set(
              'populate[editorialCover][populate][media][populate][placeholder]',
              'true',
            )
            .set('populate[editorialGallery][populate][product]', 'true')
            .set('populate[featuredKit]', 'true')
            .set('populate[featuredCollection]', 'true')
            .set(
              'populate[ingredients][populate][ingredients][populate][thumbnailImage]',
              'true',
            )
            .set(
              'populate[ingredients][populate][ingredients][populate][editorialMedia][populate][desktopImage]',
              'true',
            )
            .set(
              'populate[ingredients][populate][ingredients][populate][editorialMedia][populate][mobileImage]',
              'true',
            )
            .set(
              'populate[testimonials][populate][testimonials][populate][video]',
              'true',
            )
            .set(
              'populate[testimonials][populate][testimonials][populate][poster]',
              'true',
            )
            .set('populate[brandPillars][populate][items]', 'true'),
        },
      )
      .pipe(map((response) => response.data));
  }

  getAboutPage(locale: CmsLocale): Observable<CmsAboutPage | null> {
    return this.http
      .get<CmsSingleResponse<CmsAboutPage>>(
        `${this.baseUrl}/api/about-page`,
        {
          params: new HttpParams()
            .set('locale', locale)
            .set('populate[heroMedia][populate][desktopImage]', 'true')
            .set('populate[heroMedia][populate][mobileImage]', 'true')
            .set('populate[heroMedia][populate][placeholder]', 'true')
            .set('populate[brand][populate][metrics]', 'true')
            .set(
              'populate[brand][populate][media][populate][desktopImage]',
              'true',
            )
            .set(
              'populate[brand][populate][media][populate][mobileImage]',
              'true',
            )
            .set(
              'populate[brand][populate][media][populate][placeholder]',
              'true',
            )
            .set('populate[pillars][populate][items]', 'true')
            .set('populate[founder][populate][paragraphs]', 'true')
            .set(
              'populate[founder][populate][media][populate][desktopImage]',
              'true',
            )
            .set(
              'populate[founder][populate][media][populate][mobileImage]',
              'true',
            )
            .set('populate[locations][populate][items]', 'true')
            .set(
              'populate[locations][populate][media][populate][desktopImage]',
              'true',
            )
            .set(
              'populate[locations][populate][media][populate][mobileImage]',
              'true',
            )
            .set(
              'populate[ingredients][populate][ingredients][populate][thumbnailImage]',
              'true',
            )
            .set(
              'populate[ingredients][populate][ingredients][populate][editorialMedia][populate][desktopImage]',
              'true',
            )
            .set(
              'populate[ingredients][populate][ingredients][populate][editorialMedia][populate][mobileImage]',
              'true',
            ),
        },
      )
      .pipe(map((response) => response.data));
  }

  getSiteSetting(locale: CmsLocale): Observable<CmsSiteSetting | null> {
    return this.http
      .get<CmsSingleResponse<CmsSiteSetting>>(
        `${this.baseUrl}/api/site-setting`,
        {
          params: new HttpParams()
            .set('locale', locale)
            .set('populate[socialLinks]', 'true')
            .set('populate[footerBackground]', 'true')
            .set('populate[logo]', 'true'),
        },
      )
      .pipe(map((response) => response.data));
  }

  getIngredients(locale: CmsLocale): Observable<CmsIngredient[]> {
    return this.http
      .get<CmsCollectionResponse<CmsIngredient>>(
        `${this.baseUrl}/api/ingredients`,
        {
          params: new HttpParams()
            .set('locale', locale)
            .set('sort[0]', 'name:asc')
            .set('pagination[pageSize]', '100')
            .set('populate[thumbnailImage]', 'true')
            .set('populate[editorialMedia][populate][desktopImage]', 'true')
            .set('populate[editorialMedia][populate][mobileImage]', 'true'),
        },
      )
      .pipe(map((response) => response.data));
  }

  getCategories(locale: CmsLocale): Observable<CmsCategory[]> {
    return this.http
      .get<CmsCollectionResponse<CmsCategory>>(
        `${this.baseUrl}/api/categories`,
        {
          params: new HttpParams()
            .set('locale', locale)
            .set('sort[0]', 'name:asc')
            .set('pagination[pageSize]', '100'),
        },
      )
      .pipe(map((response) => response.data));
  }

  getSizes(): Observable<CmsSize[]> {
    return this.http
      .get<CmsCollectionResponse<CmsSize>>(`${this.baseUrl}/api/sizes`, {
        params: new HttpParams()
          .set('sort[0]', 'order:asc')
          .set('pagination[pageSize]', '100'),
      })
      .pipe(map((response) => response.data));
  }

  private heroSlideParams(locale: CmsLocale): HttpParams {
    let params = new HttpParams()
      .set('locale', locale)
      .set('sort[0]', 'order:asc')
      .set('pagination[pageSize]', '20');

    for (const field of [
      'desktopImage',
      'mobileImage',
      'video',
      'placeholder',
    ]) {
      params = params.set(`populate[media][populate][${field}]`, 'true');
    }

    params = params
      .set(
        'populate[cta][on][action.product][populate][product][populate][commerce][populate][prices]',
        'true',
      )
      .set(
        'populate[cta][on][action.kit][populate][kit][populate][commerce][populate][prices]',
        'true',
      )
      .set(
        'populate[cta][on][action.kit][populate][kit][populate][prices]',
        'true',
      )
      .set(
        'populate[cta][on][action.collection][populate][collection]',
        'true',
      )
      .set(
        'populate[cta][on][action.category][populate][category]',
        'true',
      )
      .set('populate[cta][on][action.internal-page]', 'true')
      .set('populate[cta][on][action.external-link]', 'true');

    return params;
  }

  private productParams(locale: CmsLocale): HttpParams {
    let params = new HttpParams()
      .set('locale', locale)
      .set('sort[0]', 'name:asc')
      .set('pagination[pageSize]', '100')
      .set('populate[commerce][populate][prices]', 'true')
      .set('populate[commerce][populate][badge]', 'true');

    for (const field of [
      'images',
      'thumbnailImage',
      'featuredImage',
      'category',
      'sizes',
      'highlights',
      'editorial',
      'galleryEditorial',
      'usageSteps',
      'reviews',
    ]) {
      params = params.set(`populate[${field}]`, 'true');
    }

    params = params
      .set('populate[benefits][populate][images]', 'true')
      .set(
        'populate[benefitsMainMedia][populate][desktopImage]',
        'true',
      )
      .set('populate[benefitsMainMedia][populate][video]', 'true')
      .set('populate[usageMedia][populate][desktopImage]', 'true')
      .set('populate[usageMedia][populate][video]', 'true')
      .set('populate[ingredients][populate][thumbnailImage]', 'true')
      .set(
        'populate[ingredients][populate][editorialMedia][populate][desktopImage]',
        'true',
      )
      .set(
        'populate[ingredients][populate][editorialMedia][populate][video]',
        'true',
      )
      .set('populate[results][populate][statistics]', 'true')
      .set(
        'populate[results][populate][comparison][populate][before]',
        'true',
      )
      .set(
        'populate[results][populate][comparison][populate][after]',
        'true',
      );

    return params;
  }

  private kitParams(locale: CmsLocale): HttpParams {
    return new HttpParams()
      .set('locale', locale)
      .set('sort[0]', 'name:asc')
      .set('pagination[pageSize]', '100')
      .set('populate[commerce][populate][prices]', 'true')
      .set('populate[commerce][populate][badge]', 'true')
      .set('populate[prices]', 'true')
      .set('populate[thumbnailImage]', 'true')
      .set('populate[media][populate][desktopImage]', 'true')
      .set('populate[media][populate][mobileImage]', 'true')
      .set('populate[media][populate][video]', 'true')
      .set('populate[media][populate][placeholder]', 'true')
      .set('populate[homePresentation]', 'true')
      .set('populate[products]', 'true')
      .set('populate[relatedProducts]', 'true')
      .set('populate[details][populate][images]', 'true')
      .set('populate[details][populate][usageSteps]', 'true')
      .set('populate[details][populate][usageMedia][populate][desktopImage]', 'true')
      .set('populate[details][populate][results][populate][statistics]', 'true')
      .set('populate[details][populate][results][populate][comparison][populate][before]', 'true')
      .set('populate[details][populate][results][populate][comparison][populate][after]', 'true');
  }

  private collectionParams(locale: CmsLocale): HttpParams {
    return new HttpParams()
      .set('locale', locale)
      .set('sort[0]', 'name:asc')
      .set('pagination[pageSize]', '100')
      .set('populate[prices]', 'true')
      .set('populate[thumbnailImage]', 'true')
      .set('populate[media][populate][desktopImage]', 'true')
      .set('populate[media][populate][mobileImage]', 'true')
      .set('populate[media][populate][video]', 'true')
      .set('populate[media][populate][placeholder]', 'true')
      .set('populate[homePresentation]', 'true')
      .set('populate[products]', 'true')
      .set('populate[relatedProducts]', 'true')
      .set('populate[details][populate][images]', 'true')
      .set('populate[details][populate][usageSteps]', 'true')
      .set('populate[details][populate][usageMedia][populate][desktopImage]', 'true')
      .set('populate[details][populate][results][populate][statistics]', 'true')
      .set('populate[details][populate][results][populate][comparison][populate][before]', 'true')
      .set('populate[details][populate][results][populate][comparison][populate][after]', 'true');
  }
}
