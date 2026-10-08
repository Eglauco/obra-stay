/** Formata um número como moeda brasileira (R$). */
export function formatarBRL(v: number | null | undefined): string {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Formata uma data ISO ("YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm...") como "DD/MM/AAAA". */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/** Mantém apenas os dígitos de um CPF, limitado a 11. */
export function apenasDigitosCpf(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '').slice(0, 11);
}

/** Formata um CPF (dígitos) como "000.000.000-00" progressivamente. */
export function formatarCpf(v: string | null | undefined): string {
  const d = apenasDigitosCpf(v);
  let out = d.slice(0, 3);
  if (d.length > 3) out += '.' + d.slice(3, 6);
  if (d.length > 6) out += '.' + d.slice(6, 9);
  if (d.length > 9) out += '-' + d.slice(9, 11);
  return out;
}

/**
 * Converte um ISO datetime vindo do backend em um instante absoluto.
 * O backend grava tudo em UTC e envia sem fuso ("YYYY-MM-DDTHH:mm:ss"); por isso um valor
 * "naive" é interpretado como UTC. Se já vier com fuso (Z ou ±hh:mm), ele é respeitado.
 */
function paraInstante(iso: string): Date | null {
  const temFuso = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso);
  const d = new Date(temFuso ? iso : iso + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * Formata um ISO datetime (UTC) como "DD/MM/AAAA HH:mm" NO FUSO DO NAVEGADOR do usuário.
 * Assim quem está em SP (UTC-3) e em MS (UTC-4) vê cada um o seu horário local.
 */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const inst = paraInstante(iso);
  if (!inst) return iso;
  return `${pad2(inst.getDate())}/${pad2(inst.getMonth() + 1)}/${inst.getFullYear()} `
    + `${pad2(inst.getHours())}:${pad2(inst.getMinutes())}`;
}

/**
 * Formata um ISO datetime (UTC) como "DD/MM/AAAA" (só a data) NO FUSO DO NAVEGADOR.
 * Use para datas derivadas de um instante (ex.: confirmação do auto check-in), onde a data
 * do dia depende do fuso do usuário. Para campos LocalDate puros (sem hora), use formatarData.
 */
export function formatarDataLocal(iso: string | null | undefined): string {
  if (!iso) return '—';
  const inst = paraInstante(iso);
  if (!inst) return iso;
  return `${pad2(inst.getDate())}/${pad2(inst.getMonth() + 1)}/${inst.getFullYear()}`;
}

/**
 * Converte o valor de um input datetime-local (no fuso do navegador) para ISO UTC "naive"
 * ("YYYY-MM-DDTHH:mm:ss") para enviar ao backend. Garante que tudo é gravado em UTC.
 */
export function inputLocalParaUtc(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const d = new Date(valor); // "YYYY-MM-DDTHH:mm" é interpretado no fuso local do navegador
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19);
}

/**
 * Converte um ISO datetime (UTC, do backend) para o valor de um input datetime-local
 * ("YYYY-MM-DDTHH:mm") no fuso do navegador — para pré-preencher/validar campos de data-hora.
 */
export function utcParaInputLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const inst = paraInstante(iso);
  if (!inst) return '';
  return `${inst.getFullYear()}-${pad2(inst.getMonth() + 1)}-${pad2(inst.getDate())}`
    + `T${pad2(inst.getHours())}:${pad2(inst.getMinutes())}`;
}

/**
 * Fuso IANA do navegador (ex.: "America/Sao_Paulo", "America/Campo_Grande"). Enviado ao backend
 * nos filtros por data e nas exportações, para que os limites de dia e o Excel saiam no fuso do
 * usuário (SP = UTC-3, MS = UTC-4). Cai no fuso de Brasília se o navegador não informar.
 */
export function fusoNavegador(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

/** Dias inteiros decorridos entre um ISO datetime (UTC) e agora (nunca negativo). */
export function diasDesde(iso: string | null | undefined): number {
  if (!iso) return 0;
  const inst = paraInstante(iso);
  if (!inst) return 0;
  return Math.max(0, Math.floor((Date.now() - inst.getTime()) / 86_400_000));
}

/** Mantém apenas os dígitos de um telefone, limitado a 11. */
export function apenasDigitosTelefone(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '').slice(0, 11);
}

/** Formata telefone (dígitos) como "(00) 0000-0000" (fixo) ou "(00) 00000-0000" (celular). */
export function formatarTelefone(v: string | null | undefined): string {
  const d = apenasDigitosTelefone(v);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  if (resto.length <= 4) return `(${ddd}) ${resto}`;
  if (resto.length <= 8) {
    return `(${ddd}) ${resto.slice(0, resto.length - 4)}-${resto.slice(resto.length - 4)}`;
  }
  return `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`;
}

/** Telefone válido: 10 dígitos (fixo) ou 11 (celular). */
export function telefoneValido(v: string | null | undefined): boolean {
  const d = apenasDigitosTelefone(v);
  return d.length === 10 || d.length === 11;
}

/** Valida um CPF (dígitos verificadores; rejeita sequências repetidas). */
export function cpfValido(v: string | null | undefined): boolean {
  const cpf = apenasDigitosCpf(v);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const dv = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = 11 - (soma % 11);
    return resto >= 10 ? 0 : resto;
  };
  const d1 = dv(cpf.slice(0, 9), 10);
  const d2 = dv(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}
