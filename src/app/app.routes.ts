import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'ui-showcase', pathMatch: 'full' },
  {
    path: 'ui-showcase',
    loadComponent: () =>
      import('./features/ui-showcase/ui-showcase').then((m) => m.UiShowcaseComponent),
  },
];
