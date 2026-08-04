import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

export interface AuthenticationResponse {
  customerId: string;
  accessToken: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthSessionStore {
  readonly accessToken = signal<string | null>(null);
  readonly expiresAt = signal<number>(0);

  save(response: AuthenticationResponse): void {
    this.accessToken.set(response.accessToken);
    this.expiresAt.set(Date.parse(response.expiresAt));
  }

  clear(): void {
    this.accessToken.set(null);
    this.expiresAt.set(0);
  }

  hasUsableAccessToken(): boolean {
    return !!this.accessToken() && this.expiresAt() > Date.now() + 15_000;
  }
}

@Injectable({ providedIn: 'root' })
export class SessionRefreshService {
  private readonly config = inject(API_CONFIG);
  private readonly session = inject(AuthSessionStore);
  private readonly http = new HttpClient(inject(HttpBackend));
  private inFlight?: Observable<AuthenticationResponse>;

  refresh(): Observable<AuthenticationResponse> {
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.http
      .post<AuthenticationResponse>(`${this.config.baseUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        tap((response) => this.session.save(response)),
        catchError((error) => {
          this.session.clear();
          return throwError(() => error);
        }),
        finalize(() => { this.inFlight = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.inFlight;
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(API_CONFIG);
  const session = inject(AuthSessionStore);
  const refresher = inject(SessionRefreshService);
  const isApiRequest = request.url.startsWith(config.baseUrl);
  const isRefreshRequest = request.url.endsWith('/auth/refresh');
  const token = session.accessToken();
  const authenticatedRequest = isApiRequest
    ? request.clone({
        withCredentials: true,
        setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !isApiRequest || isRefreshRequest) {
        return throwError(() => error);
      }

      return refresher.refresh().pipe(
        switchMap((response) => next(request.clone({
          withCredentials: true,
          setHeaders: { Authorization: `Bearer ${response.accessToken}` },
        }))),
      );
    }),
  );
};
