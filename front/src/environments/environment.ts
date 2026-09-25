/**
 * Configuração de ambiente do front.
 *
 * `apiBase` aponta para a API. Em dev fica em localhost; no build de produção
 * o Dockerfile sobrescreve este arquivo a partir do ARG/variável API_URL
 * (ex.: API_URL=https://sua-api.up.railway.app/api).
 */
export const environment = {
  apiBase: 'http://localhost:8080/api',
};
