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
