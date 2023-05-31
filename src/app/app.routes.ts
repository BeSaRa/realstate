import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', loadComponent: () => import('./pages/landing-page/landing-page.component') },
  {
    path: 'news',
    loadComponent: () => import('./pages/news-page/news-page.component'),
  },
  {
    path: 'news/:id',
    loadComponent: () => import('./pages/news-item-details-page/news-item-details-page.component'),
  },
];
