/* Shared rules for /events: which events are live, how a date and a price are
   spelled, and how a booking request is checked. Anything a page and the
   booking route both need lives here so the two can never disagree.

   Kept free of Astro imports so the node tests can load it directly. */

export interface EventData {
  title: string;
  date: Date;
  endTime: string;
  location: string;
  price: number;
  capacity: number;
  membersOnly: boolean;
  closed: boolean;
  summary: string;
  image: string;
  imageAlt: string;
  draft: boolean;
  metaTitle: string;
  metaDescription: string;
}

/** The most places one booking may take. Big groups go through the desk. */
export const MAX_PLACES_PER_BOOKING = 4;

/** An event counts as over from the start of the following day (UK time), so a
    morning session is still bookable on the day itself. */
export function isPast(date: Date, now: Date = new Date()): boolean {
  const dayAfter = new Date(date.getTime());
  dayAfter.setUTCHours(0, 0, 0, 0);
  dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
  return now.getTime() >= dayAfter.getTime();
}

/** Soonest first. */
export function sortByDate<T extends { data: { date: Date } }>(events: T[]): T[] {
  return [...events].sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

export function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  });
}

export function formatEventTime(date: Date, endTime = ''): string {
  const start = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  return endTime ? `${start} – ${endTime}` : start;
}

/** A Google Maps search for the venue as written, so the reader can open it
    in whichever maps app their phone hands the link to. */
export function mapUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function isoDateTime(date: Date): string {
  return date.toISOString();
}

/** £45, £12.50, or "Free". Whole pounds drop the pence. */
export function formatPrice(pounds: number, freeLabel = 'Free'): string {
  if (pounds <= 0) return freeLabel;
  const whole = Number.isInteger(pounds);
  return `£${whole ? pounds : pounds.toFixed(2)}`;
}

/** Stripe takes amounts in the smallest unit. */
export function toPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function placesLeft(capacity: number, booked: number): number {
  return Math.max(0, capacity - booked);
}

export function parseQuantity(raw: unknown): number | null {
  const n = Number.parseInt(String(raw ?? '1'), 10);
  if (!Number.isFinite(n) || n < 1 || n > MAX_PLACES_PER_BOOKING) return null;
  return n;
}

/** Compares two codes without leaking where they differ, case- and
    whitespace-insensitive so a code typed from a phone still works. */
export function codeMatches(given: unknown, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = String(given ?? '').trim().toUpperCase();
  const b = expected.trim().toUpperCase();
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type BookingState = 'open' | 'free' | 'soldOut' | 'closed' | 'past';

/** What the booking panel should show for an event, given the live count. */
export function bookingState(event: EventData, booked: number, now: Date = new Date()): BookingState {
  if (isPast(event.date, now)) return 'past';
  if (event.closed) return 'closed';
  if (placesLeft(event.capacity, booked) <= 0) return 'soldOut';
  return event.price <= 0 ? 'free' : 'open';
}
