const currencyFormatters = new Map<string, Intl.NumberFormat>();
const compactCurrencyFormatters = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string, compact: boolean) {
  const key = `${currency}-${compact ? "compact" : "standard"}`;
  const cache = compact ? compactCurrencyFormatters : currencyFormatters;
  if (!cache.has(key)) {
    cache.set(
      key,
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        notation: compact ? "compact" : undefined,
        maximumFractionDigits: compact ? 1 : 2,
      })
    );
  }
  return cache.get(key)!;
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(
  value: number,
  { compact = false, currency = "USD" }: { compact?: boolean; currency?: string } = {}
): string {
  if (Number.isNaN(value) || value === Infinity || value === -Infinity) {
    return "—";
  }
  return getCurrencyFormatter(currency, compact).format(value);
}

export function formatNumber(value: number, { compact = false } = {}): string {
  if (Number.isNaN(value) || value === Infinity || value === -Infinity) {
    return "—";
  }
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return numberFormatter.format(value);
}

export function formatPercent(value: number): string {
  if (Number.isNaN(value)) {
    return "—";
  }
  return percentFormatter.format(value / 100);
}

export function formatDate(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
