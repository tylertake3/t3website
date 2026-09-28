/* Takes a booking form from an event page, checks it, and sends the visitor
   to Stripe to pay. Every rule the page enforces is checked again here, since
   the page is static and anyone can post to this address directly.

   On any problem the visitor is sent back to the event page with ?error=…,
   which the page turns into a plain sentence. */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  bookingState,
  codeMatches,
  formatEventDate,
  formatEventTime,
  parseQuantity,
  placesLeft,
  toPence,
} from '../../lib/events';
import { countPaidPlaces, createCheckoutSession, memberCode, stripeConfigured } from '../../lib/stripe';
import copy from '../../content/pages/events.json';

export const prerender = false;

const back = (origin: string, slug: string, error?: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: `${origin}/events/${slug}${error ? `?error=${error}` : ''}#book` },
  });

export const POST: APIRoute = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const form = await request.formData();

  const slug = String(form.get('event') ?? '')
    .trim()
    .replace(/[^a-z0-9-]/g, '');
  if (!slug) return new Response('Missing event', { status: 400 });

  const events = await getCollection('events', ({ data }) => !data.draft);
  const event = events.find((entry) => entry.id === slug);
  if (!event) return new Response('Unknown event', { status: 404 });

  if (!stripeConfigured()) return back(origin, slug, 'config');

  const quantity = parseQuantity(form.get('quantity'));
  if (!quantity) return back(origin, slug, 'quantity');

  if (event.data.membersOnly && !codeMatches(form.get('code'), memberCode())) {
    return back(origin, slug, 'code');
  }

  try {
    const booked = await countPaidPlaces(slug);
    const state = bookingState(event.data, booked);
    if (state !== 'open') return back(origin, slug, 'full');
    if (placesLeft(event.data.capacity, booked) < quantity) return back(origin, slug, 'full');

    const session = await createCheckoutSession({
      eventSlug: slug,
      eventTitle: event.data.title,
      eventDescription: `${formatEventDate(event.data.date)}, ${formatEventTime(event.data.date, event.data.endTime)} · ${event.data.location}`,
      imageUrl: event.data.image && origin.startsWith('https://') && !/localhost|127\.0\.0\.1/.test(origin) ? new URL(event.data.image, origin).href : undefined,
      submitMessage: copy.event.checkoutNote,
      unitAmountPence: toPence(event.data.price),
      quantity,
      email: String(form.get('email') ?? '').trim() || undefined,
      attendee: String(form.get('attendee') ?? '').trim().slice(0, 120) || undefined,
      origin,
    });

    if (!session.url) return back(origin, slug, 'stripe');
    return new Response(null, { status: 303, headers: { Location: session.url } });
  } catch (error) {
    console.error('[events] booking failed', error);
    return back(origin, slug, 'stripe');
  }
};
