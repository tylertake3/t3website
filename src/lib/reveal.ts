/* The site's scroll-reveal pass, shared by the pages that use motion so they
   all move the same way: one easing, one duration family, and everything
   simply present when the visitor prefers reduced motion or has no script.

   Markup hooks (the styles that hide them live in global.css under
   `.is-armed`, so nothing is hidden until this has confirmed it can bring it
   back):
     data-hero-line        cover lines that rise in on load, one after another
     data-hero-figure      a cover photograph (or its frame) that is unveiled on
                           load: the plate wipes open from the top while the
                           picture settles from a touch closer
     data-reveal           a single element that rises when scrolled into view
     data-reveal-figure    a photograph (or its frame) unveiled when scrolled
                           into view, the same wipe-and-settle as the cover
     data-reveal-head      a .sectionHead whose title rises, then its rule draws
     data-reveal-group     a container whose data-reveal-item and
                           data-reveal-figure descendants arrive in DOM order
                           when the group scrolls into view; an optional value
                           (e.g. data-reveal-group="0.06") sets the gap in
                           seconds between them */
import { animate, inView, scroll, stagger } from 'motion';

export const EASE: [number, number, number, number] = [0.3, 0, 0.2, 1];
/* the settle curve for photographs: a long, even deceleration */
export const SETTLE: [number, number, number, number] = [0.2, 0, 0.1, 1];

type Els = Element[] | NodeListOf<Element> | HTMLCollection;
export type Rise = (els: Els, gap?: number, startDelay?: number, duration?: number) => void;
export type Unveil = (els: Els, gap?: number, startDelay?: number, duration?: number) => void;

const OPEN = 'inset(0 0 0% 0)';
const SHUT = 'inset(0 0 100% 0)';

export function armReveal(root: HTMLElement = document.querySelector<HTMLElement>('main') ?? document.body) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return null;
  root.classList.add('is-armed');

  const rise: Rise = (els, gap = 0.1, startDelay = 0, duration = 0.8) => {
    const list = Array.from(els) as HTMLElement[];
    if (!list.length) return;
    animate(
      list,
      { opacity: [0, 1], transform: ['translateY(16px)', 'translateY(0)'] },
      { duration, delay: stagger(gap, { startDelay }), ease: EASE },
    );
  };

  /* A photograph is unveiled rather than faded: its plate wipes open from
     the top edge while the picture inside settles from slightly closer, so
     it feels like a print being laid down rather than a file loading. */
  const unveil: Unveil = (els, gap = 0.12, startDelay = 0, duration = 1.3) => {
    (Array.from(els) as HTMLElement[]).forEach((el, i) => {
      const delay = startDelay + i * gap;
      const media = el.tagName === 'IMG' ? el : el.querySelector<HTMLElement>('img');
      animate(el, { clipPath: [SHUT, OPEN] }, { duration, delay, ease: SETTLE });
      if (media) animate(media, { scale: [1.06, 1] }, { duration: duration + 0.6, delay, ease: SETTLE });
    });
  };

  rise(root.querySelectorAll('[data-hero-line]'), 0.14, 0.15, 0.9);
  unveil(root.querySelectorAll('[data-hero-figure]'), 0.12, 0.25, 1.5);

  /* Each scroll reveal fires once, when enough of it is in view. Anything
     the reader jumps clean past (an anchor link, a fast fling to the foot of
     the page) is shown the moment it is found above the viewport, so a
     reveal can never be left waiting for a visit that already happened. */
  const pending = new Set<{ el: Element; fire: () => void }>();
  const once = (el: Element, fire: () => void, amount: number) => {
    const entry = { el, fire };
    pending.add(entry);
    inView(el, () => { if (pending.delete(entry)) fire(); }, { amount });
  };
  let ticking = false;
  const sweep = () => {
    ticking = false;
    pending.forEach((entry) => {
      if (entry.el.getBoundingClientRect().bottom < 0 && pending.delete(entry)) entry.fire();
    });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } }, { passive: true });

  root.querySelectorAll('[data-reveal]').forEach((el) => once(el, () => { rise([el]); }, 0.4));
  root.querySelectorAll('[data-reveal-figure]').forEach((el) => {
    if (el.closest('[data-reveal-group]')) return; /* the group times it */
    once(el, () => { unveil([el]); }, 0.25);
  });

  root.querySelectorAll<HTMLElement>('[data-reveal-head]').forEach((head) =>
    once(head, () => { rise(head.children, 0.08); head.classList.add('is-ruled'); }, 0.6),
  );

  root.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    const gap = parseFloat(group.dataset.revealGroup || '') || 0.09;
    once(
      group,
      () => {
        group.querySelectorAll<HTMLElement>('[data-reveal-item], [data-reveal-figure]').forEach((el, i) => {
          if (el.hasAttribute('data-reveal-figure')) unveil([el], 0, i * gap);
          else rise([el], 0, i * gap);
        });
      },
      0.15,
    );
  });

  return { rise, unveil, animate, inView, scroll };
}
