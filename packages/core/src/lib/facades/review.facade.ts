import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  CustomerProductReview,
  ProductReviewPage,
  ReviewSubmission,
} from '../models/review.interface';

@Injectable({ providedIn: 'root' })
export class ReviewFacade {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  private readonly pages = signal<Record<string, ProductReviewPage>>({});
  private readonly ownReviews = signal<Record<string, CustomerProductReview | null>>({});

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorCode = signal<string | null>(null);
  readonly globalSummary = signal<{ averageRating: number; totalReviews: number } | null>(null);

  pageFor(productSku: string): ProductReviewPage | undefined {
    return this.pages()[productSku];
  }

  reviewForCustomer(productSku: string): CustomerProductReview | undefined {
    return this.ownReviews()[productSku] ?? undefined;
  }

  async load(productSku: string, authenticated: boolean, page = 1, pageSize = 4): Promise<void> {
    this.loading.set(true);
    this.errorCode.set(null);
    try {
      const publicRequest = firstValueFrom(this.http.get<ProductReviewPage>(
        `${this.config.baseUrl}/reviews/products/${encodeURIComponent(productSku)}`,
        { params: { page, pageSize } },
      ));
      const ownRequest = authenticated
        ? firstValueFrom(this.http.get<CustomerProductReview>(
            `${this.config.baseUrl}/reviews/mine/${encodeURIComponent(productSku)}`,
          )).catch((error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status === 404) return null;
            throw error;
          })
        : Promise.resolve(null);
      const [reviews, own] = await Promise.all([publicRequest, ownRequest]);
      this.pages.update((pages) => ({ ...pages, [productSku]: reviews }));
      this.ownReviews.update((items) => ({ ...items, [productSku]: own }));
    } catch (error) {
      this.errorCode.set(this.problemCode(error));
    } finally {
      this.loading.set(false);
    }
  }

  async submit(submission: ReviewSubmission): Promise<CustomerProductReview> {
    this.submitting.set(true);
    this.errorCode.set(null);
    try {
      const review = await firstValueFrom(this.http.post<CustomerProductReview>(
        `${this.config.baseUrl}/reviews`,
        submission,
      ));
      this.ownReviews.update((items) => ({ ...items, [submission.productSku]: review }));
      return review;
    } catch (error) {
      this.errorCode.set(this.problemCode(error));
      throw error;
    } finally {
      this.submitting.set(false);
    }
  }

  async loadGlobalSummary(): Promise<void> {
    try {
      this.globalSummary.set(await firstValueFrom(this.http.get<{ averageRating: number; totalReviews: number }>(
        `${this.config.baseUrl}/reviews/summary`,
      )));
    } catch {
      // A home mantém o resumo vindo do catálogo enquanto a API estiver indisponível.
    }
  }

  private problemCode(error: unknown): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.code === 'string') return error.error.code;
    return 'request_failed';
  }
}
