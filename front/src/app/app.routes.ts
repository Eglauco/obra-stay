import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissaoGuard } from './core/guards/permissao.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Entrar · ObraStay',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'auto-atendimento/:localId',
    title: 'Autoatendimento · ObraStay',
    loadComponent: () =>
      import('./features/entrada/entrada-publica/entrada-publica').then((m) => m.EntradaPublica),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [permissaoGuard],
    children: [
      { path: '', redirectTo: 'painel', pathMatch: 'full' },
      {
        path: 'painel',
    title: 'Painel · ObraStay',
    loadComponent: () => import('./features/painel/painel').then((m) => m.Painel),
  },
  {
    path: 'colaboradores',
    title: 'Colaboradores · ObraStay',
    loadComponent: () =>
      import('./features/colaboradores/colaborador-pesquisa/colaborador-pesquisa').then(
        (m) => m.ColaboradorPesquisa,
      ),
  },
  {
    path: 'colaboradores/novo',
    title: 'Novo colaborador · ObraStay',
    loadComponent: () =>
      import('./features/colaboradores/colaborador-cadastro/colaborador-cadastro').then(
        (m) => m.ColaboradorCadastro,
      ),
  },
  {
    path: 'colaboradores/:id/editar',
    title: 'Editar colaborador · ObraStay',
    loadComponent: () =>
      import('./features/colaboradores/colaborador-cadastro/colaborador-cadastro').then(
        (m) => m.ColaboradorCadastro,
      ),
  },
  {
    path: 'funcoes',
    title: 'Funções · ObraStay',
    loadComponent: () =>
      import('./features/funcoes/funcao-pesquisa/funcao-pesquisa').then(
        (m) => m.FuncaoPesquisa,
      ),
  },
  {
    path: 'funcoes/novo',
    title: 'Nova função · ObraStay',
    loadComponent: () =>
      import('./features/funcoes/funcao-cadastro/funcao-cadastro').then(
        (m) => m.FuncaoCadastro,
      ),
  },
  {
    path: 'funcoes/:id/editar',
    title: 'Editar função · ObraStay',
    loadComponent: () =>
      import('./features/funcoes/funcao-cadastro/funcao-cadastro').then(
        (m) => m.FuncaoCadastro,
      ),
  },
  {
    path: 'epcs',
    title: 'EPC · ObraStay',
    loadComponent: () =>
      import('./features/epc/epc-pesquisa/epc-pesquisa').then((m) => m.EpcPesquisa),
  },
  {
    path: 'epcs/novo',
    title: 'Novo EPC · ObraStay',
    loadComponent: () =>
      import('./features/epc/epc-cadastro/epc-cadastro').then((m) => m.EpcCadastro),
  },
  {
    path: 'epcs/:id/editar',
    title: 'Editar EPC · ObraStay',
    loadComponent: () =>
      import('./features/epc/epc-cadastro/epc-cadastro').then((m) => m.EpcCadastro),
  },
  {
    path: 'empresas',
    title: 'Empresas · ObraStay',
    loadComponent: () =>
      import('./features/empresas/empresa-pesquisa/empresa-pesquisa').then(
        (m) => m.EmpresaPesquisa,
      ),
  },
  {
    path: 'empresas/novo',
    title: 'Nova empresa · ObraStay',
    loadComponent: () =>
      import('./features/empresas/empresa-cadastro/empresa-cadastro').then(
        (m) => m.EmpresaCadastro,
      ),
  },
  {
    path: 'empresas/:id/editar',
    title: 'Editar empresa · ObraStay',
    loadComponent: () =>
      import('./features/empresas/empresa-cadastro/empresa-cadastro').then(
        (m) => m.EmpresaCadastro,
      ),
  },
  {
    path: 'gestoes',
    title: 'Gestão · ObraStay',
    loadComponent: () =>
      import('./features/gestoes/gestao-pesquisa/gestao-pesquisa').then(
        (m) => m.GestaoPesquisa,
      ),
  },
  {
    path: 'gestoes/novo',
    title: 'Nova gestão · ObraStay',
    loadComponent: () =>
      import('./features/gestoes/gestao-cadastro/gestao-cadastro').then(
        (m) => m.GestaoCadastro,
      ),
  },
  {
    path: 'gestoes/:id/editar',
    title: 'Editar gestão · ObraStay',
    loadComponent: () =>
      import('./features/gestoes/gestao-cadastro/gestao-cadastro').then(
        (m) => m.GestaoCadastro,
      ),
  },
  {
    path: 'locais',
    title: 'Locais · ObraStay',
    loadComponent: () =>
      import('./features/locais/local-pesquisa/local-pesquisa').then(
        (m) => m.LocalPesquisa,
      ),
  },
  {
    path: 'locais/novo',
    title: 'Novo local · ObraStay',
    loadComponent: () =>
      import('./features/locais/local-cadastro/local-cadastro').then(
        (m) => m.LocalCadastro,
      ),
  },
  {
    path: 'locais/:id/editar',
    title: 'Editar local · ObraStay',
    loadComponent: () =>
      import('./features/locais/local-cadastro/local-cadastro').then(
        (m) => m.LocalCadastro,
      ),
  },
  {
    path: 'locadoras',
    title: 'Locadoras · ObraStay',
    loadComponent: () =>
      import('./features/locadoras/locadora-pesquisa/locadora-pesquisa').then(
        (m) => m.LocadoraPesquisa,
      ),
  },
  {
    path: 'locadoras/novo',
    title: 'Nova locadora · ObraStay',
    loadComponent: () =>
      import('./features/locadoras/locadora-cadastro/locadora-cadastro').then(
        (m) => m.LocadoraCadastro,
      ),
  },
  {
    path: 'locadoras/:id/editar',
    title: 'Editar locadora · ObraStay',
    loadComponent: () =>
      import('./features/locadoras/locadora-cadastro/locadora-cadastro').then(
        (m) => m.LocadoraCadastro,
      ),
  },
  {
    path: 'tipos-solicitacao',
    title: 'Tipos de Solicitação · ObraStay',
    loadComponent: () =>
      import(
        './features/tipos-solicitacao/tipo-solicitacao-pesquisa/tipo-solicitacao-pesquisa'
      ).then((m) => m.TipoSolicitacaoPesquisa),
  },
  {
    path: 'tipos-solicitacao/novo',
    title: 'Novo tipo de solicitação · ObraStay',
    loadComponent: () =>
      import(
        './features/tipos-solicitacao/tipo-solicitacao-cadastro/tipo-solicitacao-cadastro'
      ).then((m) => m.TipoSolicitacaoCadastro),
  },
  {
    path: 'tipos-solicitacao/:id/editar',
    title: 'Editar tipo de solicitação · ObraStay',
    loadComponent: () =>
      import(
        './features/tipos-solicitacao/tipo-solicitacao-cadastro/tipo-solicitacao-cadastro'
      ).then((m) => m.TipoSolicitacaoCadastro),
  },
  {
    path: 'hospedagens',
    title: 'Hospedagens · ObraStay',
    loadComponent: () =>
      import('./features/hospedagens/hospedagem-locais/hospedagem-locais').then(
        (m) => m.HospedagemLocais,
      ),
  },
  {
    path: 'hospedagens/local/:id',
    title: 'Hospedagem do local · ObraStay',
    loadComponent: () =>
      import('./features/hospedagens/hospedagem-local/hospedagem-local').then(
        (m) => m.HospedagemLocal,
      ),
  },
  {
    path: 'hospedagens/local/:id/entrada',
    title: 'Dar entrada · ObraStay',
    loadComponent: () =>
      import('./features/hospedagens/hospedagem-entrada/hospedagem-entrada').then(
        (m) => m.HospedagemEntrada,
      ),
  },
  {
    path: 'contratos',
    title: 'Contratos · ObraStay',
    loadComponent: () =>
      import('./features/contratos/contrato-locais/contrato-locais').then(
        (m) => m.ContratoLocais,
      ),
  },
  {
    path: 'contratos/local/:id',
    title: 'Contratos do local · ObraStay',
    loadComponent: () =>
      import('./features/contratos/contrato-local/contrato-local').then((m) => m.ContratoLocal),
  },
  {
    path: 'contratos/local/:id/novo',
    title: 'Novo contrato · ObraStay',
    data: { modo: 'novo' },
    loadComponent: () =>
      import('./features/contratos/contrato-cadastro/contrato-cadastro').then(
        (m) => m.ContratoCadastro,
      ),
  },
  {
    path: 'contratos/editar/:id',
    title: 'Editar contrato · ObraStay',
    data: { modo: 'editar' },
    loadComponent: () =>
      import('./features/contratos/contrato-cadastro/contrato-cadastro').then(
        (m) => m.ContratoCadastro,
      ),
  },
  {
    path: 'gastos',
    title: 'Gastos · ObraStay',
    loadComponent: () =>
      import('./features/gastos/gasto-locais/gasto-locais').then((m) => m.GastoLocais),
  },
  {
    path: 'gastos/local/:id',
    title: 'Gastos do local · ObraStay',
    loadComponent: () =>
      import('./features/gastos/gasto-local/gasto-local').then((m) => m.GastoLocal),
  },
  {
    path: 'gastos/local/:id/novo',
    title: 'Novo gasto · ObraStay',
    data: { modo: 'novo' },
    loadComponent: () =>
      import('./features/gastos/gasto-cadastro/gasto-cadastro').then((m) => m.GastoCadastro),
  },
  {
    path: 'gastos/editar/:id',
    title: 'Editar gasto · ObraStay',
    data: { modo: 'editar' },
    loadComponent: () =>
      import('./features/gastos/gasto-cadastro/gasto-cadastro').then((m) => m.GastoCadastro),
  },
  {
    path: 'solicitacoes',
    title: 'Solicitações · ObraStay',
    loadComponent: () =>
      import('./features/solicitacoes/solicitacao-pesquisa/solicitacao-pesquisa').then(
        (m) => m.SolicitacaoPesquisa,
      ),
  },
  {
    path: 'solicitacoes/nova',
    title: 'Nova solicitação · ObraStay',
    loadComponent: () =>
      import('./features/solicitacoes/solicitacao-cadastro/solicitacao-cadastro').then(
        (m) => m.SolicitacaoCadastro,
      ),
  },
  {
    path: 'solicitacoes/:id/editar',
    title: 'Editar solicitação · ObraStay',
    loadComponent: () =>
      import('./features/solicitacoes/solicitacao-cadastro/solicitacao-cadastro').then(
        (m) => m.SolicitacaoCadastro,
      ),
  },
      {
        path: 'usuarios',
        title: 'Usuários · ObraStay',
        loadComponent: () =>
          import('./features/usuarios/usuario-pesquisa/usuario-pesquisa').then(
            (m) => m.UsuarioPesquisa,
          ),
      },
      {
        path: 'usuarios/novo',
        title: 'Novo usuário · ObraStay',
        loadComponent: () =>
          import('./features/usuarios/usuario-cadastro/usuario-cadastro').then(
            (m) => m.UsuarioCadastro,
          ),
      },
      {
        path: 'usuarios/:id/editar',
        title: 'Editar usuário · ObraStay',
        loadComponent: () =>
          import('./features/usuarios/usuario-cadastro/usuario-cadastro').then(
            (m) => m.UsuarioCadastro,
          ),
      },
      {
        path: 'perfis',
        title: 'Perfis · ObraStay',
        loadComponent: () =>
          import('./features/perfis/perfil-pesquisa/perfil-pesquisa').then(
            (m) => m.PerfilPesquisa,
          ),
      },
      {
        path: 'perfis/novo',
        title: 'Novo perfil · ObraStay',
        loadComponent: () =>
          import('./features/perfis/perfil-cadastro/perfil-cadastro').then(
            (m) => m.PerfilCadastro,
          ),
      },
      {
        path: 'perfis/:id/editar',
        title: 'Editar perfil · ObraStay',
        loadComponent: () =>
          import('./features/perfis/perfil-cadastro/perfil-cadastro').then(
            (m) => m.PerfilCadastro,
          ),
      },
      {
        path: 'logs-acesso',
        title: 'Logs de Acesso · ObraStay',
        loadComponent: () =>
          import('./features/logs-acesso/log-acesso-pesquisa/log-acesso-pesquisa').then(
            (m) => m.LogAcessoPesquisa,
          ),
      },
      {
        path: 'status-locais',
        title: 'Status dos Locais · ObraStay',
        loadComponent: () =>
          import('./features/status-locais/status-local-pesquisa/status-local-pesquisa').then(
            (m) => m.StatusLocalPesquisa,
          ),
      },
      {
        path: 'status-locais/novo',
        title: 'Novo status · ObraStay',
        loadComponent: () =>
          import('./features/status-locais/status-local-cadastro/status-local-cadastro').then(
            (m) => m.StatusLocalCadastro,
          ),
      },
      {
        path: 'status-locais/:id/editar',
        title: 'Editar status · ObraStay',
        loadComponent: () =>
          import('./features/status-locais/status-local-cadastro/status-local-cadastro').then(
            (m) => m.StatusLocalCadastro,
          ),
      },
      {
        path: 'orcamentos-mobiliario',
        title: 'Orçamentos de Mobiliário · ObraStay',
        loadComponent: () =>
          import('./features/orcamentos-mobiliario/orcamento-pesquisa/orcamento-pesquisa').then(
            (m) => m.OrcamentoPesquisa,
          ),
      },
      {
        path: 'orcamentos-mobiliario/novo',
        title: 'Novo orçamento · ObraStay',
        loadComponent: () =>
          import('./features/orcamentos-mobiliario/orcamento-cadastro/orcamento-cadastro').then(
            (m) => m.OrcamentoCadastro,
          ),
      },
      {
        path: 'orcamentos-mobiliario/:id/editar',
        title: 'Editar orçamento · ObraStay',
        loadComponent: () =>
          import('./features/orcamentos-mobiliario/orcamento-cadastro/orcamento-cadastro').then(
            (m) => m.OrcamentoCadastro,
          ),
      },
      // Modo somente-leitura (Visualizar) — acessível a quem tem a ação "Ver".
      {
        path: 'colaboradores/:id/visualizar',
        title: 'Visualizar colaborador · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/colaboradores/colaborador-cadastro/colaborador-cadastro').then(
            (m) => m.ColaboradorCadastro,
          ),
      },
      {
        path: 'funcoes/:id/visualizar',
        title: 'Visualizar função · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/funcoes/funcao-cadastro/funcao-cadastro').then((m) => m.FuncaoCadastro),
      },
      {
        path: 'epcs/:id/visualizar',
        title: 'Visualizar EPC · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/epc/epc-cadastro/epc-cadastro').then((m) => m.EpcCadastro),
      },
      {
        path: 'empresas/:id/visualizar',
        title: 'Visualizar empresa · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/empresas/empresa-cadastro/empresa-cadastro').then(
            (m) => m.EmpresaCadastro,
          ),
      },
      {
        path: 'gestoes/:id/visualizar',
        title: 'Visualizar gestão · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/gestoes/gestao-cadastro/gestao-cadastro').then((m) => m.GestaoCadastro),
      },
      {
        path: 'locais/:id/visualizar',
        title: 'Visualizar local · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/locais/local-cadastro/local-cadastro').then((m) => m.LocalCadastro),
      },
      {
        path: 'status-locais/:id/visualizar',
        title: 'Visualizar status · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/status-locais/status-local-cadastro/status-local-cadastro').then(
            (m) => m.StatusLocalCadastro,
          ),
      },
      {
        path: 'orcamentos-mobiliario/:id/visualizar',
        title: 'Visualizar orçamento · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/orcamentos-mobiliario/orcamento-cadastro/orcamento-cadastro').then(
            (m) => m.OrcamentoCadastro,
          ),
      },
      {
        path: 'locadoras/:id/visualizar',
        title: 'Visualizar locadora · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/locadoras/locadora-cadastro/locadora-cadastro').then(
            (m) => m.LocadoraCadastro,
          ),
      },
      {
        path: 'tipos-solicitacao/:id/visualizar',
        title: 'Visualizar tipo de solicitação · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import(
            './features/tipos-solicitacao/tipo-solicitacao-cadastro/tipo-solicitacao-cadastro'
          ).then((m) => m.TipoSolicitacaoCadastro),
      },
      {
        path: 'usuarios/:id/visualizar',
        title: 'Visualizar usuário · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/usuarios/usuario-cadastro/usuario-cadastro').then(
            (m) => m.UsuarioCadastro,
          ),
      },
      {
        path: 'perfis/:id/visualizar',
        title: 'Visualizar perfil · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/perfis/perfil-cadastro/perfil-cadastro').then((m) => m.PerfilCadastro),
      },
      {
        path: 'contratos/visualizar/:id',
        title: 'Visualizar contrato · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/contratos/contrato-cadastro/contrato-cadastro').then(
            (m) => m.ContratoCadastro,
          ),
      },
      {
        path: 'gastos/visualizar/:id',
        title: 'Visualizar gasto · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/gastos/gasto-cadastro/gasto-cadastro').then((m) => m.GastoCadastro),
      },
      {
        path: 'solicitacoes/:id/visualizar',
        title: 'Visualizar solicitação · ObraStay',
        data: { modo: 'visualizar' },
        loadComponent: () =>
          import('./features/solicitacoes/solicitacao-cadastro/solicitacao-cadastro').then(
            (m) => m.SolicitacaoCadastro,
          ),
      },
      { path: '**', redirectTo: 'painel' },
    ],
  },
];
