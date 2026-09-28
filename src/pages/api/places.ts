/* The live number of places left on an event, for the static event page to
   fill in after it loads. Cached for a minute at the edge so a busy page does
   not hammer Stripe. */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { bookingState, placesLeft } from '../../lib/events';
import { countPaidPlaces, stripeConfigured } from '../../lib/stripe';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
    },
  });

export const GET: APIRoute = async ({ url }) => {
  const slug = (url.searchParams.get('event') ?? '').replace(/[^a-z0-9-]/g, '');
  const events = await getCollection('events', ({ data }) => !data.draft);
  const event = events.find((entry) => entry.id === slug);
  if (!event) return json({ error: 'unknown event' }, 404);

  if (!stripeConfigured()) return json({ configured: false, state: 'config' });

  try {
    const booked = await countPaidPlaces(slug);
    return json({
      configured: true,
      capacity: event.data.capacity,
      booked,
      left: placesLeft(event.data.capacity, booked),
      state: bookingState(event.data, booked),
    });
  } catch (error) {
    console.error('[events] places lookup failed', error);
    return json({ error: 'lookup failed' }, 502);
  }
};
