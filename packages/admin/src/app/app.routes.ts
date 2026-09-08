import { Route } from '@angular/router';
import { Login } from './pages/login';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: Login },
  { path: '**', redirectTo: 'login' },
];
