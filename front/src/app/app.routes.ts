import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'painel', pathMatch: 'full' },
  {
    path: 'auto-atendimento/:localId',
    title: 'Autoatendimento · ObraStay',
    loadComponent: () =>
      import('./features/entrada/entrada-publica/entrada-publica').then((m) => m.EntradaPublica),
  },
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
  { path: '**', redirectTo: 'painel' },
];
