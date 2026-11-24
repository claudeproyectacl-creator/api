import type { Category, FindiDataStore, Transaction } from '../types/finance';

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatEUR(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return currencyFormatter.format(safe);
}

export function formatDecimalES(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return numberFormatter.format(safe);
}

export function formatPercentES(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${percentFormatter.format(safe)} %`;
}

export function parseSpanishAmount(raw: string): number {
  const cleaned = raw.trim().replace(/€/g, '').replace(/\s+/g, '');
  if (!cleaned) return Number.NaN;

  let normalized = cleaned;
  // Handle European format like "1.234,56" vs standard "1234.56" or "12,50"
  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    normalized = cleaned.replace(',', '.');
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return Number.NaN;
  return Math.round(parsed * 100) / 100;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(): string {
  return getTodayISO().slice(0, 7);
}

export function isValidISODate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function formatDateES(isoDate: string): string {
  if (!isValidISODate(isoDate)) return isoDate;
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export function getMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yStr, mStr] = monthKey.split('-');
  const y = Number(yStr);
  const m = Number(mStr) - 1;
  const dt = new Date(y, m + delta, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function formatMonthLabel(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const mIdx = Number(mStr) - 1;
  if (mIdx < 0 || mIdx > 11) return monthKey;
  return `${MONTHS_ES[mIdx]} ${yStr}`;
}

function escapeCsvCell(value: string): string {
  const neutralized = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

export function buildTransactionsCSV(
  transactions: Transaction[],
  categories: Category[]
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const header = ['Fecha', 'Tipo', 'Categoría', 'Importe (€)', 'Nota', 'ID'].join(';');
  const rows = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((tx) => {
      const catName = categoryMap.get(tx.categoryId) ?? 'Otros';
      return [
        escapeCsvCell(formatDateES(tx.date)),
        escapeCsvCell(tx.type === 'gasto' ? 'Gasto' : 'Ingreso'),
        escapeCsvCell(catName),
        escapeCsvCell(formatDecimalES(tx.amount)),
        escapeCsvCell(tx.note || ''),
        escapeCsvCell(tx.id),
      ].join(';');
    });

  return '\uFEFF' + [header, ...rows].join('\n');
}

export function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportStoreAsJSON(store: FindiDataStore): void {
  const payload = JSON.stringify(store, null, 2);
  triggerDownload(`findi-datos-${getTodayISO()}.json`, payload, 'application/json;charset=utf-8');
}

export function exportTransactionsAsCSV(store: FindiDataStore): void {
  const csv = buildTransactionsCSV(store.transactions, store.categories);
  triggerDownload(`findi-movimientos-${getTodayISO()}.csv`, csv, 'text/csv;charset=utf-8');
}
