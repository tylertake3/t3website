import test from 'node:test';
import assert from 'node:assert/strict';
import { countdownParts, countdownText, launchMoment } from '../src/lib/countdown.js';

/* noon London time on 17 September 2026 is British Summer Time: 11:00 UTC */
const LAUNCH = launchMoment('2026-09-17T12:00:00+01:00');

test('the launch moment resolves through its offset', () => {
  assert.equal(new Date(LAUNCH).toISOString(), '2026-09-17T11:00:00.000Z');
});

test('days roll over and the last second reads as one', () => {
  assert.equal(countdownText(LAUNCH, LAUNCH - 86400000), '01:00:00:00');
  assert.equal(countdownText(LAUNCH, LAUNCH - 1000), '00:00:00:01');
});

test('it clamps to zero at and after the moment', () => {
  assert.equal(countdownText(LAUNCH, LAUNCH), '00:00:00:00');
  assert.equal(countdownText(LAUNCH, LAUNCH + 100000), '00:00:00:00');
  assert.equal(countdownParts(LAUNCH, LAUNCH + 5).done, true);
});

test('a two-digit slate caps the days at 99', () => {
  assert.equal(countdownText(LAUNCH, LAUNCH - 150 * 86400000).slice(0, 2), '99');
});
