import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
import { MOCK_PRODUCTS } from '../mocks/products.mock';
import { MOCK_KITS } from '../mocks/kits.mock';
import { MOCK_COLLECTIONS } from '../mocks/collections.mock';
import { MOCK_CATEGORIES } from '../mocks/categories.mock';
import { MOCK_SIZES } from '../mocks/sizes.mock';
import {
  MOCK_HOME_INGREDIENTS,
  MOCK_INGREDIENTS,
} from '../mocks/ingredients.mock';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  getProducts(): Observable<Product[]> {
    return of(MOCK_PRODUCTS);
  }

  getKits(): Observable<Kit[]> {
    return of(MOCK_KITS);
  }

  // Returns only featured kits (featured: true) for the Hero slider
  getFeaturedKits(): Observable<Kit[]> {
    return this.getKits().pipe(
      map((kits) => kits.filter((kit) => kit.featured)),
    );
  }

  getCollections(): Observable<Collection[]> {
    return of(MOCK_COLLECTIONS);
  }

  getCategories(): Observable<Category[]> {
    return of(MOCK_CATEGORIES);
  }

  getSizes(): Observable<Size[]> {
    return of(MOCK_SIZES);
  }

  getIngredients(): Observable<Ingredient[]> {
    return of(MOCK_INGREDIENTS);
  }

  getHomeIngredients(): Observable<HomeIngredientsPresentation> {
    return of(MOCK_HOME_INGREDIENTS);
  }
}
