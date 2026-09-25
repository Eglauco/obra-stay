/**
 * Ambiente de PRODUÇÃO.
 *
 * Substitui automaticamente o environment.ts no build de produção
 * (angular.json → configurations.production.fileReplacements).
 * Para trocar a API (outro ambiente/demo), altere apenas o apiBase abaixo.
 */
export const environment = {
  apiBase: 'https://obra-stay-api-production.up.railway.app/api',
};
