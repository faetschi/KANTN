import {RenderMode, ServerRoute} from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'workout/:planId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'plans/edit/:planId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'history/:sessionId',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
