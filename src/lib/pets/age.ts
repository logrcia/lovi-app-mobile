/**
 * The add-pet sheet asks for age as free text ("4 meses", "2 años"), but the database
 * stores `birthday date` and every age label is derived from it. This is the only place
 * that translation happens.
 */

const AGE_PATTERN = /^\s*(\d{1,3})\s*(días?|dias?|semanas?|mes(?:es)?|años?|anos?)\s*$/i;

const pad = (value: number) => String(value).padStart(2, '0');

function toDateOnly(date: Date): string {
  // Local calendar date, not UTC: `toISOString()` would shift the day across timezones.
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * `'3 años'` → `'2023-10-28'`.
 *
 * Returns `null` when the text is not an age this app understands, so the caller can
 * ask again instead of silently storing a wrong date.
 */
export function parseAgeToBirthday(input: string, now: Date = new Date()): string | null {
  const match = AGE_PATTERN.exec(input);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return null;

  const unit = match[2].toLowerCase();
  const birthday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (unit.startsWith('dí') || unit.startsWith('di')) {
    birthday.setDate(birthday.getDate() - amount);
  } else if (unit.startsWith('semana')) {
    birthday.setDate(birthday.getDate() - amount * 7);
  } else if (unit.startsWith('mes')) {
    birthday.setMonth(birthday.getMonth() - amount);
  } else {
    birthday.setMonth(birthday.getMonth() - amount * 12);
  }

  return toDateOnly(birthday);
}
