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
    path: 'social/session/:sessionId',
    renderMode: RenderMode.Client,
  },
  {
    // Angular's route matcher treats `@:username` literally, so a param
    // segment is used here to flag any `/profile/<handle>` URL as client-only
    // (the client route uses a custom matcher that requires the `@` prefix).
    path: 'profile/:username',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
