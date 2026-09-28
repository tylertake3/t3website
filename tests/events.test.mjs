import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PLACES_PER_BOOKING,
  bookingState,
  codeMatches,
  formatPrice,
  isPast,
  parseQuantity,
  placesLeft,
  sortByDate,
  toPence,
} from '../src/lib/events.ts';

const event = (over = {}) => ({
  title: 'Workshop',
  date: new Date('2026-11-14T10:00:00Z'),
  endTime: '16:00',
  location: 'London',
  price: 45,
  capacity: 16,
  membersOnly: true,
  closed: false,
  summary: '',
  image: '',
  imageAlt: '',
  draft: false,
  metaTitle: '',
  metaDescription: '',
  ...over,
});

test('an event is still bookable on the day and over from the next morning', () => {
  const date = new Date('2026-11-14T10:00:00Z');
  assert.equal(isPast(date, new Date('2026-11-14T18:00:00Z')), false);
  assert.equal(isPast(date, new Date('2026-11-15T00:00:00Z')), true);
});

test('prices are spelled in pounds, whole where they can be', () => {
  assert.equal(formatPrice(45), '£45');
  assert.equal(formatPrice(12.5), '£12.50');
  assert.equal(formatPrice(0), 'Free');
  assert.equal(toPence(12.5), 1250);
});

test('quantities are whole numbers between one and the cap', () => {
  assert.equal(parseQuantity('2'), 2);
  assert.equal(parseQuantity(undefined), 1);
  assert.equal(parseQuantity('0'), null);
  assert.equal(parseQuantity(String(MAX_PLACES_PER_BOOKING + 1)), null);
  assert.equal(parseQuantity('two'), null);
});

test('the access code ignores case and stray spaces but nothing else', () => {
  assert.equal(codeMatches(' roster-2026 ', 'ROSTER-2026'), true);
  assert.equal(codeMatches('roster-2027', 'ROSTER-2026'), false);
  assert.equal(codeMatches('', 'ROSTER-2026'), false);
  assert.equal(codeMatches('ROSTER-2026', undefined), false);
});

test('the booking panel state follows the count, the switch and the date', () => {
  const now = new Date('2026-10-01T09:00:00Z');
  assert.equal(bookingState(event(), 0, now), 'open');
  assert.equal(bookingState(event(), 16, now), 'soldOut');
  assert.equal(bookingState(event({ closed: true }), 0, now), 'closed');
  assert.equal(bookingState(event({ price: 0 }), 0, now), 'free');
  assert.equal(bookingState(event(), 0, new Date('2027-01-01T00:00:00Z')), 'past');
  assert.equal(placesLeft(16, 20), 0);
});

test('events list soonest first', () => {
  const later = { data: { date: new Date('2026-12-01T10:00:00Z') } };
  const sooner = { data: { date: new Date('2026-11-01T10:00:00Z') } };
  assert.deepEqual(sortByDate([later, sooner]), [sooner, later]);
});
