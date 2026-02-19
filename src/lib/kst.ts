/** KST (UTC+9) timezone utilities for daily reset at Korean midnight */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** UTC Date representing start of current KST day (KST 00:00) */
export function getKSTToday(): Date {
  const kstDayMs = Math.floor((Date.now() + KST_OFFSET_MS) / DAY_MS) * DAY_MS;
  return new Date(kstDayMs - KST_OFFSET_MS);
}

/** UTC Date representing start of next KST day (KST 00:00 + 1 day) */
export function getKSTTomorrow(): Date {
  return new Date(getKSTToday().getTime() + DAY_MS);
}

/** UTC Date representing KST Monday 00:00 of the week containing the given date */
export function getKSTMonday(base?: Date): Date {
  const ms = (base?.getTime() ?? Date.now()) + KST_OFFSET_MS;
  const kstDayMs = Math.floor(ms / DAY_MS) * DAY_MS;
  const dow = new Date(kstDayMs).getUTCDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  return new Date(kstDayMs + diff * DAY_MS - KST_OFFSET_MS);
}
