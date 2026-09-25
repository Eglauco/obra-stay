/** Formata um número como moeda brasileira (R$). */
export function formatarBRL(v: number | null | undefined): string {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Formata uma data ISO "YYYY-MM-DD" como "DD/MM/AAAA". */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
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
