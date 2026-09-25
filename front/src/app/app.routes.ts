import { Routes } from '@angular/router';

export const routes: Routes = [
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
  { path: '**', redirectTo: 'painel' },
];
