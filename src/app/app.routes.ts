import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },

  // public routes
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login')
        .then(m => m.Login),
    canActivate: [guestGuard]
  },

  // protected routes
  {
    path: 'guides',
    loadComponent: () =>
      import('./features/guide/components/guide-list/guide-list')
        .then(m => m.GuideList),
    canActivate: [authGuard]
  },

  // not found
  {
    path: '404',
    loadComponent: () =>
      import('./shared/components/not-found/not-found')
        .then(m => m.NotFound)
  },
  { 
    path: '**', 
    redirectTo: '/404' 
  }

];
