/* ============================================================================
   PLACEHOLDER DATA — NOT TRUE, NOT CLEARED FOR PUBLICATION

   The disciplines this module returns are INVENTED. They are produced by
   hashing a title's slug and indexing into a fixed list. They say nothing about
   what Take 3 actually supplied to any production, and they are wrong far more
   often than they are right.

   They exist because the credits wall was designed around a "what we supplied"
   line under each title, and no real per-title assignment exists yet (see
   docs/credits-content-gaps.md §1). Tyler asked on 8 September 2026 for the
   generated values to stand in so the design can be seen working.

   BEFORE THIS PAGE GOES LIVE, one of these must happen:
     · real assignments are added to src/data/credit-detail.json, per title, or
     · PLACEHOLDER_DISCIPLINES is set to false.

   Either way the page keeps working: a real assignment always wins over this
   module, and with it switched off a card simply shows its poster and title.
   ============================================================================ */

/** The single switch. Set to false and no invented discipline reaches the page. */
export const PLACEHOLDER_DISCIPLINES = true;

/* The five the site has performer pages for. Deliberately not exported: nothing
   should treat this as the canonical discipline vocabulary. */
const POOL = ['Spacts', 'Dancers', 'Stand-Ins', 'Models', 'Stunts'];

/* A fixed hash, so a title keeps the same invented detail on every build — the
   wall must not reshuffle itself between the server render and the client. */
const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

/**
 * Invented disciplines for a title. Roughly half get a second one, so the
 * filters have overlapping sets to work against rather than four tidy quarters.
 */
export const placeholderDisciplinesFor = (slug: string): string[] => {
  if (!PLACEHOLDER_DISCIPLINES) return [];
  const h = hash(slug);
  const first = POOL[h % POOL.length];
  const second = POOL[(h >> 3) % POOL.length];
  return second === first || h % 5 < 2 ? [first] : [first, second];
};
