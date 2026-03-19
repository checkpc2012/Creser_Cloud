import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Normaliza un texto para búsquedas:
 * - Minúsculas (case-insensitive)
 * - Elimina puntos, guiones, espacios (útil para cédulas de identidad)
 */
export function normalizeSearch(text: string | null | undefined): string {
  if (!text) return '';
  return text.toString()
    .toLowerCase()
    .trim()
    .replace(/[.\-]/g, '');
}

/**
 * Sanatiza un nombre eliminando prefijos de legado, basura de puntuación
 * y restos de limpieza mecánica.
 */
export function sanitizeName(rawName: string | null | undefined): string {
  if (!rawName) return '';

  let name = rawName.trim();

  // 1. Known Legacy Markers
  // We match 200, 2OO, 20O, 2O0, C4, PF, C5 as word-start markers
  name = name.replace(/\b(C4|2[0O]{2}|PF|C5)\b/gi, '');
  name = name.replace(/\*\*/g, '');

  // 2. Junk markers with parentheses - Expanded and more flexible
  name = name.replace(/\(\s*(LC|C|PF|DTA\.?\s*IVA|IVA|CONTADO|CREDITO|NO DTA\.?\s*IVA|DTA|S\.?A|LTDA|V|SI|NO|PA|GAR|JOVEN|GARANT|GARA|FALLECIO|TREINTA Y TRES)\s*\)/gi, '');
  
  // Rule for complex warnings in parentheses
  name = name.replace(/\(\s*(VER MEMO|NO DAR|OJO|VER).*?\)/gi, '');

  // 3. Parentheses containing only numbers/phones
  name = name.replace(/\((TEL|CEL|TELF|T|P)?\.?\s*[\d\s\-\/,]+\)/gi, '');

  // 4. Empty or near-empty parentheses
  name = name.replace(/\(\s*\)/g, '');

  // 5. Slash-based junk tails
  name = name.replace(/\/\/.*$/g, '');

  // 6. Stuck commas
  name = name.replace(/,([^\s])/g, ', $1');

  // 7. Trailing lines with phone patterns
  name = name.replace(/\s+\b(TEL|CEL|TELF|T|P)\.?\s*[\d\s\-\/]{7,}$/gi, '');

  // 8. Trailing standalone long numbers
  name = name.replace(/[\s\-\/,]{1,}\d{7,}[-\s]?\d*$/g, '');

  // 9. Remove specific strings EVEN if not in parentheses at start/end
  name = name.replace(/^\b(GAR|JOVEN|PA)\b\s+/gi, '');
  
  // 10. Junk fragments at the end
  name = name.replace(/[\(\s-]+\b(GARANT|GAR|NO DAR|VER MEMO|FALLECIO)\b\s*\)?$/gi, '');

  // 11. Orphan punctuation at ends
  name = name.replace(/[(\-\/, ]+$/g, '');
  name = name.replace(/^[)\-\/, ]+/g, '');

  // 12. Repeated punctuation at end
  name = name.replace(/[.\-\/,]{2,}$/, '');
  
  // 13. Final trim and collapsing spaces
  name = name.replace(/\s+/g, ' ').trim();
  
  // 14. Removing all trailing dots
  name = name.replace(/\.+$/g, '');

  return name.trim();
}

export function normalizeDocument(doc: string | null | undefined): string {
  if (!doc) return '';
  return doc.toString().replace(/\D/g, '');
}

export function formatDocument(doc: string | null | undefined): string {
  if (!doc) return '';
  const clean = normalizeDocument(doc);
  if (clean.length < 7) return clean;
  let formatted = clean.slice(0, -1) + '-' + clean.slice(-1);
  const parts = formatted.split('-');
  const main = parts[0];
  const last = parts[1];
  let withDots = '';
  let count = 0;
  for (let i = main.length - 1; i >= 0; i--) {
    withDots = main[i] + withDots;
    count++;
    if (count % 3 === 0 && i !== 0) {
      withDots = '.' + withDots;
    }
  }
  return withDots + '-' + last;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function roundAmount(amount: number, decimals = 0): number {
  if (amount === 0) return 0;
  const factor = Math.pow(10, decimals);
  const abs = Math.abs(amount);
  const val = abs * factor;
  const integral = Math.floor(val);
  const fraction = val - integral;
  const res = (fraction > 0.5000001) ? (integral + 1) : integral;
  const result = res / factor;
  return amount < 0 ? -result : result;
}

export function formatCurrency(amount: number | string, locale = 'es-UY', currency = 'UYU') {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const rounded = roundAmount(numAmount || 0, 0);
  const safeCurrency = (currency && currency.length === 3) ? currency : 'UYU';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rounded);
  } catch (e) {
    return `${safeCurrency} ${rounded}`;
  }
}

export function formatDate(date: string | Date, locale = 'es-ES') {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return date.toString(); // Fallback
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Parsea fechas en formato DD/MM/YYYY o YYYY-MM-DD
 */
export function parseStagingDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  
  // Try DD/MM/YYYY
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try YYYY-MM-DD
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  return new Date();
}
