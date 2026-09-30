import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateChildFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Mapeia o primeiro segmento da URL para a chave da tela (RBAC). */
const BASE_PARA_TELA: Record<string, string> = {
  colaboradores: 'colaboradores',
  funcoes: 'funcoes',
  epcs: 'epc',
  empresas: 'empresas',
  gestoes: 'gestoes',
  locais: 'locais',
  'status-locais': 'status-locais',
  'orcamentos-mobiliario': 'orcamentos-mobiliario',
  locadoras: 'locadoras',
  'tipos-solicitacao': 'tipos-solicitacao',
  hospedagens: 'hospedagens',
  contratos: 'contratos',
  gastos: 'gastos',
  solicitacoes: 'solicitacoes',
  usuarios: 'usuarios',
  perfis: 'perfis',
  'logs-acesso': 'logs-acesso',
};

/** Descobre a tela e a ação exigida a partir da URL da rota. */
function telaEAcao(url: string): { tela: string | null; acao: string } {
  const caminho = url.split('?')[0].split('#')[0];
  const segmentos = caminho.split('/').filter((s) => s.length > 0);
  const base = segmentos[0] ?? '';
  const tela = BASE_PARA_TELA[base] ?? null;

  let acao = 'VER';
  if (base === 'hospedagens' && caminho.endsWith('/entrada')) {
    acao = 'DAR_ENTRADA';
  } else if (caminho.includes('/editar')) {
    acao = 'EDITAR';
  } else if (caminho.endsWith('/novo') || caminho.endsWith('/nova')) {
    acao = 'CRIAR';
  }
  return { tela, acao };
}

/**
 * Bloqueia rotas para quem não tem a permissão da tela/ação. No SSR deixa passar
 * (o navegador revalida). Sem sessão vai para /login; sem permissão vai para /painel.
 */
export const permissaoGuard: CanActivateChildFn = (_route, state: RouterStateSnapshot) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticado()) {
    return router.createUrlTree(['/login']);
  }

  const { tela, acao } = telaEAcao(state.url);
  if (!tela) {
    return true; // Painel e rotas sem tela mapeada.
  }
  return auth.pode(tela, acao) ? true : router.createUrlTree(['/painel']);
};
