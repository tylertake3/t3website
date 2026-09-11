/* A launch countdown for the slate's readout: DAYS : HOURS : MINUTES : SECONDS,
   read from the device clock on every frame and clamped to zero at the moment
   itself, so nothing about the page — a clap, a theme change, a reload — can
   start it again or hold it. */

/** The launch moment as epoch milliseconds, from an ISO string with its offset. */
export const launchMoment = (iso) => Date.parse(iso);

export function countdownParts(targetMs, nowMs = Date.now()) {
  const remaining = Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
  return {
    days: Math.floor(remaining / 86400),
    hours: Math.floor(remaining / 3600) % 24,
    minutes: Math.floor(remaining / 60) % 60,
    seconds: remaining % 60,
    done: remaining === 0,
  };
}

/** The eight digits the readout can show. Days cap at 99 on a two-digit slate. */
export function countdownText(targetMs, nowMs = Date.now()) {
  const p = countdownParts(targetMs, nowMs);
  return [Math.min(99, p.days), p.hours, p.minutes, p.seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}
