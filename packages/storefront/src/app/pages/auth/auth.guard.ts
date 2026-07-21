import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '@org/core';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/entrar']);
};
