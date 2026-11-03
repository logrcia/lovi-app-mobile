/**
 * The database stores `birthday date` and every age label is derived from it. This module is
 * the only place that converts between the stored date and what the UI shows, in both
 * directions: `YYYY-MM-DD` → `'3 años'` and a typed birth date → `YYYY-MM-DD`.
 */

const BIRTHDAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/** Age is derived from `birthday`; the database never stores "3 años". */
export function formatAge(birthday: string | null): string {
  if (!birthday) return '';
  const born = parseDateOnly(birthday);
  const now = new Date();

  let months =
    (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (now.getDate() < born.getDate()) months -= 1;
  if (months < 0) return '';

  if (months < 12) return months <= 1 ? '1 mes' : `${months} meses`;

  const years = Math.floor(months / 12);
  return years === 1 ? '1 año' : `${years} años`;
}

/**
 * `'2019-05-14'` → `'2019-05-14'`.
 *
 * Only the unambiguous `YYYY-MM-DD` form is accepted, so `02/11` and `11/02` can never be read
 * as each other. Returns `null` when the format does not match, when the components do not form
 * a real calendar date (`2019-02-30`), or when the date is in the future — the caller asks again
 * instead of storing an invented birthday.
 */
export function parseBirthday(input: string, now: Date = new Date()): string | null {
  const match = BIRTHDAY_PATTERN.exec(input.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // `new Date(2019, 1, 30)` silently rolls over to March 2nd, so the only reliable check is
  // building the date and reading the numbers back.
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  // Local midnight today: a birthday entered today is valid, tomorrow is not.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (parsed.getTime() > today.getTime()) return null;

  return `${year}-${pad(month)}-${pad(day)}`;
}
