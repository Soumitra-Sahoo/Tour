export function formatINR(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  const wholeStr = whole.toLocaleString('en-IN');
  const str = `₹${wholeStr}.${cents.toString().padStart(2, '0')}`;
  return negative ? `-${str}` : str;
}

export function formatINRNoSymbol(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  const wholeStr = whole.toLocaleString('en-IN');
  const str = `${wholeStr}.${cents.toString().padStart(2, '0')}`;
  return negative ? `-${str}` : str;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return `Today, ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
