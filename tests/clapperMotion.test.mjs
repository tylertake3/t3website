import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAPPER_OPEN_ANGLE,
  clapClapperMotion,
  clapperScrollPose,
  createClapperClock,
  createClapperMotion,
  holdClapperClock,
  readClapperClock,
  releaseClapperClock,
  stepClapperMotion,
  toggleClapperMotion,
} from '../src/lib/clapperMotion.js';

const settle = (motion, frames = 240) => {
  let impacts = 0;
  for (let i = 0; i < frames; i += 1) {
    if (stepClapperMotion(motion, 1 / 60).impact) impacts += 1;
  }
  return impacts;
};

test('starts open at its rest angle and closes to the exact contact angle', () => {
  const motion = createClapperMotion();
  assert.equal(motion.angle, CLAPPER_OPEN_ANGLE);
  assert.equal(toggleClapperMotion(motion), 'closing');
  assert.equal(settle(motion), 1);
  assert.equal(motion.angle, 0);
});

test('reopens from closed and does not create a second impact', () => {
  const motion = createClapperMotion();
  toggleClapperMotion(motion);
  settle(motion);
  assert.equal(toggleClapperMotion(motion), 'opening');
  assert.equal(settle(motion), 0);
  assert.equal(motion.angle, CLAPPER_OPEN_ANGLE);
});

test('a repeated click reverses from the current angle', () => {
  const motion = createClapperMotion();
  toggleClapperMotion(motion);
  stepClapperMotion(motion, 1 / 30);
  const halfway = motion.angle;

  assert.ok(halfway > 0 && halfway < CLAPPER_OPEN_ANGLE);
  assert.equal(toggleClapperMotion(motion), 'opening');
  stepClapperMotion(motion, 1 / 30);
  assert.ok(motion.angle > halfway);
});

test('scroll pose is independent of hinge motion', () => {
  const motion = createClapperMotion();
  const before = clapperScrollPose(0.42);
  toggleClapperMotion(motion);
  stepClapperMotion(motion, 1 / 60);
  const after = clapperScrollPose(0.42);

  assert.deepEqual(after, before);
  assert.ok(motion.angle < CLAPPER_OPEN_ANGLE);
});

test('scroll reaches a rear view without changing the hinge target', () => {
  const motion = createClapperMotion();
  const pose = clapperScrollPose(1);

  assert.equal(pose.rotationY, Math.PI);
  assert.equal(motion.target, CLAPPER_OPEN_ANGLE);
});

test('timecode runs while open, holds the clap frame, then jumps to live time', () => {
  const clock = createClapperClock();
  const before = new Date(2026, 8, 7, 12, 34, 56, 250);
  const impact = new Date(2026, 8, 7, 12, 34, 57, 500);
  const whileClosed = new Date(2026, 8, 7, 12, 35, 3, 750);
  const reopened = new Date(2026, 8, 7, 12, 35, 4, 125);

  assert.equal(readClapperClock(clock, before, 24).label, '12:34:56:06');
  assert.equal(holdClapperClock(clock, impact, 24).label, '12:34:57:12');
  assert.equal(readClapperClock(clock, whileClosed, 24).label, '12:34:57:12');
  assert.equal(releaseClapperClock(clock, reopened, 24).label, '12:35:04:03');
});

test('timecode honours the active production frame rate', () => {
  const clock = createClapperClock();
  const date = new Date(2026, 8, 7, 9, 8, 7, 960);

  assert.equal(readClapperClock(clock, date, 25).label, '09:08:07:24');
});

test('a clap shuts, holds the sticks together for a beat, then lifts on its own', () => {
  const motion = createClapperMotion();
  assert.equal(clapClapperMotion(motion, 0.9), 'closing');

  /* the sticks come together inside a third of a second */
  let impacts = 0;
  const run = (frames) => {
    for (let i = 0; i < frames; i += 1) {
      if (stepClapperMotion(motion, 1 / 60).impact) impacts += 1;
    }
  };

  run(20);
  assert.equal(impacts, 1);
  assert.equal(motion.angle, 0);

  /* and are still together a third of a second after that */
  run(20);
  assert.equal(motion.angle, 0, 'the sticks should still be together');

  /* then lift on their own, with no second click and no second impact */
  run(240);
  assert.equal(impacts, 1);
  assert.equal(motion.angle, CLAPPER_OPEN_ANGLE);
});

test('clapping again while the sticks are down lifts them immediately', () => {
  const motion = createClapperMotion();
  clapClapperMotion(motion, 0.9);
  for (let i = 0; i < 60; i += 1) stepClapperMotion(motion, 1 / 60);
  assert.equal(motion.angle, 0);

  assert.equal(clapClapperMotion(motion, 0.9), 'opening');
  assert.equal(motion.hold, 0);
  stepClapperMotion(motion, 1 / 30);
  assert.ok(motion.angle > 0, 'the stick should already be lifting');
});


test('the board clears the floor before rotating and holds its camera distance', () => {
  const lifted = clapperScrollPose(0.2);
  assert.equal(lifted.lift, 1);
  assert.equal(lifted.rotationY, 0);
  for (let i = 0; i <= 100; i++) {
    const pose = clapperScrollPose(i / 100);
    assert.equal(pose.depth, 0, 'the turn must not move away from the camera');
    if (pose.rotationY > 0) assert.equal(pose.lift, 1);
  }
});

test('reverse scrolling restores the grounded pose after clapping during a turn', () => {
  const motion = createClapperMotion();
  const start = clapperScrollPose(0);
  for (let i = 0; i <= 100; i++) {
    if (i % 12 === 0) clapClapperMotion(motion);
    stepClapperMotion(motion, 1 / 60);
    clapperScrollPose(i / 100);
  }
  for (let i = 100; i >= 0; i--) clapperScrollPose(i / 100);
  assert.deepEqual(clapperScrollPose(0), start);
  assert.equal(start.lift, 0);
  assert.equal(start.rotationY, 0);
  assert.equal(clapperScrollPose(0.85).read, 1);
  assert.equal(clapperScrollPose(0.85).backCopy, 1);
});


test('outgoing and incoming captions never overlap during the turn', () => {
  for (let i = 0; i <= 200; i++) {
    const pose = clapperScrollPose(i / 200);
    assert.ok(pose.frontCopy === 0 || pose.backCopy === 0);
  }
});


test('a click during the closing swing is ignored: one impact, one production change', () => {
  const motion = createClapperMotion();
  assert.equal(clapClapperMotion(motion, 0.9), 'closing');
  stepClapperMotion(motion, 1 / 60);
  assert.ok(motion.angle > 0 && motion.angle < CLAPPER_OPEN_ANGLE);

  /* the second click lands before contact and changes nothing */
  assert.equal(clapClapperMotion(motion, 0.9), 'closing');
  assert.equal(motion.target, 0);
  assert.equal(motion.impactArmed, true);

  let impacts = 0;
  for (let i = 0; i < 300; i += 1) {
    if (stepClapperMotion(motion, 1 / 60).impact) impacts += 1;
  }
  assert.equal(impacts, 1);
  assert.equal(motion.angle, CLAPPER_OPEN_ANGLE, 'and it still lifts again on its own');
});
