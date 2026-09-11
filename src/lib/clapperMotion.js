/* The stick's rest angle. It is not only a look: the raised tip is what the
   layout has to reserve room for above the board, and at 18 degrees that
   reserve was a third of the assembly's height, which held the board low in the
   frame. 15 still reads unmistakably as an open clapper. */
export const CLAPPER_OPEN_ANGLE = (15 * Math.PI) / 180;

/** How long the sticks stay together after they meet, in seconds. */
export const CLAPPER_HOLD = 0.9;

const CLOSE_SNAP = (0.18 * Math.PI) / 180;
const OPEN_SNAP = (0.08 * Math.PI) / 180;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Motion state for the one transform that belongs to the hinge. Keeping this
 * separate from scroll pose makes it impossible for a page turn to overwrite
 * the stick's open/closed target.
 */
export const createClapperMotion = (openAngle = CLAPPER_OPEN_ANGLE) => ({
  angle: openAngle,
  target: openAngle,
  openAngle,
  impactArmed: false,
  /** Seconds left on the hold, once the sticks have met. */
  hold: 0,
});

/** Toggle the destination without changing the current angle. */
export const toggleClapperMotion = (motion) => {
  const closing = motion.target > motion.openAngle / 2;
  motion.target = closing ? 0 : motion.openAngle;
  motion.impactArmed = closing;
  motion.hold = 0;
  return closing ? 'closing' : 'opening';
};

/**
 * One clap: the sticks come together, stay together for a beat, then lift.
 * Called again while the sticks are down it lifts them straight away, so the
 * gesture stays reversible rather than locking the board out for a second.
 */
export const clapClapperMotion = (motion, hold = CLAPPER_HOLD) => {
  const down = motion.target === 0;
  if (down) {
    /* Still on the way down: the clap is committed. A second click before the
       sticks have met is ignored rather than restarting or reversing it, so a
       double-click can never fire two production changes or cut one short. */
    if (motion.impactArmed) return 'closing';
    motion.hold = 0;
    motion.holdFor = 0;
    motion.target = motion.openAngle;
    motion.impactArmed = false;
    return 'opening';
  }
  motion.target = 0;
  motion.impactArmed = true;
  motion.holdFor = hold;
  motion.hold = 0;
  return 'closing';
};

/**
 * Advance the hinge towards its destination. Exponential damping is stable at
 * different refresh rates and reverses immediately if the target is toggled.
 */
export const stepClapperMotion = (motion, elapsedSeconds, reducedMotion = false) => {
  const dt = clamp(elapsedSeconds, 0, 0.05);

  /* the beat the sticks spend together, then they lift on their own */
  if (motion.hold > 0) {
    motion.hold = Math.max(0, motion.hold - dt);
    if (motion.hold === 0) motion.target = motion.openAngle;
  }

  const closing = motion.target === 0;

  if (reducedMotion) {
    motion.angle = motion.target;
  } else {
    const rate = closing ? 26 : 8.5;
    const amount = 1 - Math.exp(-rate * dt);
    motion.angle += (motion.target - motion.angle) * amount;
  }

  let impact = false;
  if (closing && motion.angle <= CLOSE_SNAP) {
    motion.angle = 0;
    if (motion.impactArmed) {
      motion.impactArmed = false;
      impact = true;
      /* the hold only starts once they have actually met, so a slow frame
         cannot shorten it */
      motion.hold = motion.holdFor ?? 0;
      motion.holdFor = 0;
    }
  } else if (!closing && motion.openAngle - motion.angle <= OPEN_SNAP) {
    motion.angle = motion.openAngle;
  }

  return { angle: motion.angle, impact };
};

const clamp01 = (value) => clamp(value, 0, 1);
const easeInOutCubic = (value) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;

/* The beats of the hero, as fractions of the way down its travel:

     rest    the slate stands on the studio floor, bottom edge in contact
     lift    it rises clear of the floor, before any real rotation
     turn    half a rotation onto its back, hovering
     settle  the nod eases out and the record arrives
     hold    the record stationary, then the pin releases and it scrolls away

   The lift comes first on purpose: a board that rotates while still touching
   the floor reads as clipping through it. Nothing here fades anything out — at
   the end of the travel the pinned stage simply releases and the whole thing
   scrolls up out of frame.

   Against a hero of 225svh (so ~125svh of travel):

     rest/lift  0 → 0.20   ~25svh
     turn       0.20 → 0.70  ~62.5svh
     settle     0.70 → 0.85  ~18.75svh
     hold       0.85 → 1     ~18.75svh, then it scrolls away */
const BEATS = {
  liftTo: 0.2,
  turnFrom: 0.2,
  turnTo: 0.7,
  settleTo: 0.85,
};

const window_ = (value, from, to) => clamp01((value - from) / (to - from));
const smooth = (value, from, to) => {
  const t = window_(value, from, to);
  return t * t * (3 - 2 * t);
};

/**
 * The only pose driven by scroll. Nothing here touches the hinge, and nothing
 * here is stateful — so scrolling back up runs the sequence in reverse for
 * free, and a clap taken at any point in it changes none of these values.
 */
export const clapperScrollPose = (heroProgress) => {
  /* Off the floor first, and fully clear of it before the turn begins. */
  const lift = smooth(heroProgress, 0, BEATS.liftTo);
  const turn = window_(heroProgress, BEATS.turnFrom, BEATS.turnTo);
  const swing = easeInOutCubic(turn);
  /* the nod eases back out after the turn, so the rear view is square on */
  const settle = smooth(heroProgress, BEATS.turnTo, BEATS.settleTo);

  /* The figures are keyed to the turn, not to a beat of their own: keyed
     separately the board landed flat-on and completely blank for a moment,
     then filled. They are all on the card slightly before it comes to rest. */
  const read = smooth(turn, 0.45, 0.92);

  /* Change captions on either side of the edge-on pose. Sequential fades
     prevent the outgoing paragraph being painted over the incoming heading. */
  const frontCopy = 1 - smooth(turn, 0.28, 0.48);
  const backCopy = smooth(turn, 0.52, 0.72);
  const swap = smooth(turn, 0.4, 0.6);

  return {
    lift,
    turn,
    read,
    settle,
    rotationY: swing * Math.PI,
    /* Keep the rotation centre at the same distance from the camera. */
    depth: 0,
    /* A slight nod as it goes over, eased back out as it settles. Kept small
       on purpose: a bigger nod swings the lower corner further down than the
       lift raises it, and the board reads as dipping into the floor as it
       passes edge-on. */
    tilt: -0.062 + 0.028 * Math.sin(turn * Math.PI) + 0.062 * settle,
    /* how settled it is: 1 facing us and still, 0 mid-turn */
    settled: 1 - turn,
    frontCopy,
    backCopy,
    /* they pass each other, rather than sitting on the same line at half
       strength through the crossover */
    frontShift: -26 * swap,
    backShift: 26 * (1 - swap),
  };
};

/** Convert wall-clock time to the eight digits painted on a production slate. */
export const formatClapperTimecode = (date, framesPerSecond = 24) => {
  const fps = Math.max(1, Math.round(framesPerSecond));
  const frame = Math.min(fps - 1, Math.floor((date.getMilliseconds() / 1000) * fps));
  const pairs = [date.getHours(), date.getMinutes(), date.getSeconds(), frame]
    .map((value) => String(value).padStart(2, '0'));

  return {
    digits: pairs.join(''),
    label: pairs.join(':'),
  };
};

/**
 * A clap holds the exact impact frame. Releasing always samples wall time again,
 * so reopening never resumes from the old held value.
 */
export const createClapperClock = () => ({ held: false, value: null });

export const readClapperClock = (clock, date, framesPerSecond = 24) => {
  if (!clock.held || !clock.value) {
    clock.value = formatClapperTimecode(date, framesPerSecond);
  }
  return clock.value;
};

export const holdClapperClock = (clock, date, framesPerSecond = 24) => {
  clock.value = formatClapperTimecode(date, framesPerSecond);
  clock.held = true;
  return clock.value;
};

export const releaseClapperClock = (clock, date, framesPerSecond = 24) => {
  clock.held = false;
  clock.value = formatClapperTimecode(date, framesPerSecond);
  return clock.value;
};
