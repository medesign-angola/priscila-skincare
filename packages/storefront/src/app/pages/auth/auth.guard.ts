import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '@org/core';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  return await auth.ensureSession()
    ? true
    : router.createUrlTree(['/entrar'], { queryParams: { returnUrl: state.url } });
};
