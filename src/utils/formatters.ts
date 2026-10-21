// Monetary utility functions for exact Kobo accounting

export function formatNaira(koboAmount: number, showKoboDecimals = true): string {
  const naira = koboAmount / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: showKoboDecimals ? 2 : 0,
    maximumFractionDigits: showKoboDecimals ? 2 : 0,
  }).format(naira).replace('NGN', '₦').trim();
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export function generateReference(
  prefix: 'DEP' | 'WTH' | 'INV' | 'REF' | 'BIL' | 'TOP' | 'AUTOPAY' | 'BEP'
): string {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone || '080***';
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
