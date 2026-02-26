export type DateFormatPreference = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

export function formatDateValue(
  isoOrDate: string | Date,
  opts?: { locale?: string; dateFormat?: DateFormatPreference; withTime?: boolean }
) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  const locale = opts?.locale ?? 'en-IE';
  const withTime = opts?.withTime ?? true;

  if (Number.isNaN(d.getTime())) return '-';

  if (opts?.dateFormat === 'YYYY-MM-DD') {
    const base = d.toISOString().slice(0, 10);
    return withTime ? `${base} ${d.toISOString().slice(11, 16)}` : base;
  }

  const dateOpts: Intl.DateTimeFormatOptions =
    opts?.dateFormat === 'MM/DD/YYYY'
      ? { month: '2-digit', day: '2-digit', year: 'numeric' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' };

  const datePart = new Intl.DateTimeFormat(locale, dateOpts).format(d);
  if (!withTime) return datePart;

  const timePart = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return `${datePart} ${timePart}`;
}
