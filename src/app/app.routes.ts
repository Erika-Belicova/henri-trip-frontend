import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './core/guards/auth.guard';

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

  // admin routes
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/components/dashboard/dashboard')
            .then(m => m.Dashboard)
      },
      {
        path: 'guides',
        loadComponent: () =>
          import('./features/admin/components/guides/guide-list-admin/guide-list-admin')
            .then(m => m.GuideListAdmin)
      }
    ]
  },

  // user routes
  {
    path: 'guides',
    loadComponent: () =>
      import('./features/user/components/guide-list/guide-list')
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