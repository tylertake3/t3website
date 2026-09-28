/* The site's few dealings with Stripe, over its plain HTTPS API so no extra
   package is needed. Needs STRIPE_SECRET_KEY on the host; without it every call
   here reports "not configured" and the pages say so instead of failing. */

const API = 'https://api.stripe.com/v1';
/* Pinned per request, so the account's own default (which may be years old
   and predate search) never decides what these calls can do. */
const API_VERSION = '2024-06-20';

export function stripeSecretKey(): string | undefined {
  return import.meta.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;
}

export function memberCode(): string | undefined {
  return import.meta.env.EVENTS_MEMBER_CODE ?? process.env.EVENTS_MEMBER_CODE;
}

export function stripeConfigured(): boolean {
  return Boolean(stripeSecretKey());
}

export class StripeError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Params = Record<string, string | number | boolean | undefined>;

async function call<T>(method: 'GET' | 'POST', path: string, params: Params = {}): Promise<T> {
  const key = stripeSecretKey();
  if (!key) throw new StripeError('Stripe is not configured', 0);

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) body.set(k, String(v));
  }

  const url = method === 'GET' && body.size > 0 ? `${API}${path}?${body}` : `${API}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Stripe-Version': API_VERSION,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'POST' ? body : undefined,
  });

  const json = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new StripeError(json.error?.message ?? `Stripe returned ${response.status}`, response.status);
  }
  return json;
}

interface CheckoutSession {
  id: string;
  url: string | null;
  status: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string>;
  customer_details: { email: string | null; name: string | null } | null;
  custom_fields?: { key: string; text?: { value: string | null } }[];
  line_items?: { data: { quantity: number | null; description: string }[] };
}

export interface CheckoutRequest {
  eventSlug: string;
  eventTitle: string;
  eventDescription: string;
  /* Public https address of the event photo, shown beside the summary. */
  imageUrl?: string;
  /* A line above the pay button: what happens once they have paid. */
  submitMessage?: string;
  unitAmountPence: number;
  quantity: number;
  email?: string;
  attendee?: string;
  origin: string;
}

/** Opens a Stripe Checkout page for a number of places, tagging the payment
    with the event so bookings can be counted and found later. */
export async function createCheckoutSession(req: CheckoutRequest): Promise<CheckoutSession> {
  const params: Params = {
    mode: 'payment',
    'line_items[0][quantity]': req.quantity,
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][unit_amount]': req.unitAmountPence,
    'line_items[0][price_data][product_data][name]': req.eventTitle,
    'line_items[0][price_data][product_data][description]': req.eventDescription,
    'line_items[0][price_data][product_data][images][0]': req.imageUrl || undefined,
    /* The button reads "Book" rather than "Pay". */
    submit_type: 'book',
    'custom_text[submit][message]': req.submitMessage || undefined,
    'metadata[event]': req.eventSlug,
    'metadata[places]': req.quantity,
    'payment_intent_data[metadata][event]': req.eventSlug,
    'payment_intent_data[metadata][places]': req.quantity,
    'payment_intent_data[description]': `${req.eventTitle} × ${req.quantity}`,
    success_url: `${req.origin}/events/booked?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.origin}/events/${req.eventSlug}`,
    customer_email: req.email || undefined,
    'custom_fields[0][key]': 'attendee',
    'custom_fields[0][label][type]': 'custom',
    'custom_fields[0][label][custom]': 'Name for the register',
    'custom_fields[0][type]': 'text',
    'custom_fields[0][text][default_value]': req.attendee || undefined,
    billing_address_collection: 'auto',
    /* Card sessions expire after half an hour, so an abandoned checkout does
       not hold a place for long. */
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  };
  if (req.attendee) params['payment_intent_data[metadata][attendee]'] = req.attendee;
  return call<CheckoutSession>('POST', '/checkout/sessions', params);
}

export async function retrieveCheckoutSession(id: string): Promise<CheckoutSession> {
  return call<CheckoutSession>('GET', `/checkout/sessions/${encodeURIComponent(id)}`, {
    'expand[0]': 'line_items',
  });
}

interface PaymentIntentSearch {
  data: { metadata: Record<string, string> }[];
  has_more: boolean;
  next_page: string | null;
}

/** How many places have been paid for on an event, read from the payments
    tagged with it. Stripe indexes payments for search within a minute or so,
    so this is the count the booking route relies on, with the small window
    accepted rather than a database added for it. */
export async function countPaidPlaces(eventSlug: string): Promise<number> {
  let total = 0;
  let page: string | undefined;
  const slug = eventSlug.replace(/'/g, '');
  do {
    const result = await call<PaymentIntentSearch>('GET', '/payment_intents/search', {
      query: `metadata['event']:'${slug}' AND status:'succeeded'`,
      limit: 100,
      page,
    });
    for (const intent of result.data) {
      const places = Number.parseInt(intent.metadata.places ?? '1', 10);
      total += Number.isFinite(places) && places > 0 ? places : 1;
    }
    page = result.has_more && result.next_page ? result.next_page : undefined;
  } while (page);
  return total;
}
