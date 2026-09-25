import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rotas com parâmetro: renderizadas sob demanda no servidor (sem prerender).
  { path: 'colaboradores/:id/editar', renderMode: RenderMode.Server },
  { path: 'funcoes/:id/editar', renderMode: RenderMode.Server },
  { path: 'epcs/:id/editar', renderMode: RenderMode.Server },
  { path: 'empresas/:id/editar', renderMode: RenderMode.Server },
  { path: 'gestoes/:id/editar', renderMode: RenderMode.Server },
  { path: 'locais/:id/editar', renderMode: RenderMode.Server },
  { path: 'locadoras/:id/editar', renderMode: RenderMode.Server },
  { path: 'hospedagens/local/:id', renderMode: RenderMode.Server },
  { path: 'hospedagens/local/:id/entrada', renderMode: RenderMode.Server },
  { path: 'contratos/local/:id', renderMode: RenderMode.Server },
  { path: 'contratos/local/:id/novo', renderMode: RenderMode.Server },
  { path: 'contratos/editar/:id', renderMode: RenderMode.Server },
  { path: 'gastos/local/:id', renderMode: RenderMode.Server },
  { path: 'gastos/local/:id/novo', renderMode: RenderMode.Server },
  { path: 'gastos/editar/:id', renderMode: RenderMode.Server },
  // Demais rotas (estáticas) continuam pré-renderizadas.
  { path: '**', renderMode: RenderMode.Prerender },
];
