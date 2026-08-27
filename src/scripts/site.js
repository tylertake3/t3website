import NumberFlow from 'number-flow';

/* Shared site behaviour: sticky nav, mobile menu, theme toggle.
   Runs on every page. Page-specific behaviour lives with its page. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lessMotion = function () { return reduce.matches; };

  /* ---------------- nav: solidify + logo shrink on scroll ---------------- */
  var nav = document.getElementById('siteNav');
  var navLogo = document.getElementById('navLogo');
  var navTick = false;
  function navScroll() {
    var p = Math.min(Math.max(window.scrollY / 400, 0), 1);
    var light = nav.classList.contains('navOnLight') && document.documentElement.getAttribute('data-theme') === 'light';
    nav.style.background = (light ? 'rgba(244,242,238,' : 'rgba(22,22,24,') + p.toFixed(3) + ')';
    nav.style.boxShadow = p > 0
      ? '0 1px 0 rgba(' + (light ? '0,0,0,' : '255,255,255,') + (0.12 * p).toFixed(3) + ')'
      : 'none';
    if (navLogo) {
      /* the logo shrinks as you scroll, from a smaller starting size on phones */
      var w = window.innerWidth;
      var tall = w <= 400 ? 54 : w <= 860 ? 72 : 110;
      var short = w <= 400 ? 38 : w <= 860 ? 44 : 52;
      navLogo.style.height = (tall - (tall - short) * p).toFixed(1) + 'px';
    }
    navTick = false;
  }
  if (nav) {
    var queueNavScroll = function () {
      if (!navTick) { navTick = true; window.requestAnimationFrame(navScroll); }
    };
    window.addEventListener('scroll', queueNavScroll, { passive: true });
    /* the logo's size depends on the viewport, so recompute when it changes */
    window.addEventListener('resize', queueNavScroll, { passive: true });
    window.addEventListener('orientationchange', queueNavScroll);
    navScroll();
  }

  /* ---------------- overlay menu ---------------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuBtnLabel = document.getElementById('menuBtnLabel');
  var menu = document.getElementById('menuOverlay');
  var main = document.getElementById('main');
  var footer = document.querySelector('.footer');
  var skip = document.querySelector('.skip');

  if (menuBtn && menu) {
    var menuOpen = false;
    var scrollY = 0;
    var closeTimer = null;

    /* the header stays interactive above the overlay, so only the page
       underneath is hidden from screen readers and pointer input */
    var hideBehind = function (hidden) {
      [main, footer, skip].forEach(function (el) {
        if (!el) return;
        if (hidden) {
          el.setAttribute('inert', '');
          el.setAttribute('aria-hidden', 'true');
        } else {
          el.removeAttribute('inert');
          el.removeAttribute('aria-hidden');
        }
      });
    };

    var focusables = function () {
      var all = document.querySelectorAll(
        '#siteNav a[href], #siteNav button:not([disabled]), #menuOverlay a[href]'
      );
      return Array.prototype.filter.call(all, function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
      });
    };

    var setMenu = function (open) {
      if (open === menuOpen) return;
      menuOpen = open;
      window.clearTimeout(closeTimer);

      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (menuBtnLabel) menuBtnLabel.textContent = open ? 'CLOSE' : 'MENU';
      nav.classList.toggle('is-menuOpen', open);

      if (open) {
        scrollY = window.scrollY;
        menu.hidden = false;
        /* let the browser paint the hidden state before fading in */
        window.requestAnimationFrame(function () { menu.classList.add('is-open'); });
        document.body.classList.add('menu-open');
        document.body.style.top = '-' + scrollY + 'px';
        hideBehind(true);
        menu.focus();
      } else {
        menu.classList.remove('is-open');
        document.body.classList.remove('menu-open');
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
        hideBehind(false);
        var finish = function () { if (!menuOpen) menu.hidden = true; };
        if (lessMotion()) finish();
        else closeTimer = window.setTimeout(finish, 350);
      }
    };

    menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });

    /* choosing anywhere in the menu closes it. A main menu item first plays its
       own flourish — the letters lift, the wash sweeps the word and the rest of
       the list steps back — then the page follows. */
    var menuList = menu.querySelector('.menuList');
    var picking = false;

    menu.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;

      var main = link.classList.contains('menuLink');
      var plainClick = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
      var samePage = link.getAttribute('aria-current') === 'page';

      if (!main || !plainClick || samePage || lessMotion() || link.target === '_blank') {
        setMenu(false);
        return;
      }

      if (picking) { e.preventDefault(); return; }
      picking = true;
      e.preventDefault();
      link.classList.add('is-picked');
      if (menuList) menuList.classList.add('is-picking');

      window.setTimeout(function () { window.location.href = link.href; }, 520);
    });

    document.addEventListener('keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') {
        setMenu(false);
        menuBtn.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      /* keep focus inside the header and the overlay while it is open */
      var items = focusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }


  /* ---------------- figures that count up when scrolled to ---------------- */
  (function () {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-countup]'));
    if (!els.length) return;

    /* "1,500+" -> prefix "", digits 1500, suffix "+", grouped with commas.
       Anything without a number in it is left alone. */
    var parse = function (text) {
      var match = text.match(/-?[\d][\d,.\s]*/);
      if (!match) return null;
      var raw = match[0];
      var value = parseFloat(raw.replace(/[,\s]/g, ''));
      if (!isFinite(value)) return null;
      var decimals = (raw.split('.')[1] || '').replace(/[^\d]/g, '').length;
      return {
        value: value,
        decimals: decimals,
        grouped: raw.indexOf(',') !== -1,
        prefix: text.slice(0, match.index),
        suffix: text.slice(match.index + raw.length)
      };
    };

    /* a year counting up from zero looks absurd, so it ticks the last stretch */
    var startValue = function (v, spec) {
      var isYear = spec.decimals === 0 && !spec.grouped && v >= 1900 && v <= 2100;
      return isYear ? v - 12 : 0;
    };

    var prepare = function (el, spec) {
      var flow = new NumberFlow();
      flow.numberPrefix = spec.prefix;
      flow.numberSuffix = spec.suffix;
      flow.locales = document.documentElement.lang || 'en-GB';
      flow.setAttribute('aria-hidden', 'true');
      flow.format = {
        minimumFractionDigits: spec.decimals,
        maximumFractionDigits: spec.decimals,
        useGrouping: spec.grouped
      };
      /* Paint the starting figure without motion. The next update is the one
         NumberFlow turns into its digit-by-digit transition. */
      flow.animated = false;
      flow.update(startValue(spec.value, spec));
      el.textContent = '';
      el.appendChild(flow);
      flow.animated = true;
      return flow;
    };

    var specs = [];
    els.forEach(function (el) {
      var spec = parse(el.textContent.trim());
      if (!spec) return;
      spec.original = el.textContent.trim();
      specs.push({ el: el, spec: spec });
    });
    if (!specs.length) return;

    if (lessMotion() || !('IntersectionObserver' in window) || !('customElements' in window)) return;

    /* hold the final width so the row does not reflow as digits change */
    specs.forEach(function (item) {
      item.el.style.fontVariantNumeric = 'tabular-nums';
      item.flow = prepare(item.el, item.spec);
    });

    var observer = new IntersectionObserver(function (entries) {
      var delay = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var item = specs.filter(function (s) { return s.el === entry.target; })[0];
        observer.unobserve(entry.target);
        if (!item) return;
        window.setTimeout(function () { item.flow.update(item.spec.value); }, delay);
        delay += 110;
      });
    }, { threshold: 0.6, rootMargin: '0px 0px -8% 0px' });

    specs.forEach(function (item) {
      /* screen readers always get the final figure, never a spinning one */
      item.el.setAttribute('role', 'img');
      item.el.setAttribute('aria-label', item.spec.original);
      observer.observe(item.el);
    });
  })();

  /* ---------------- theme toggle ---------------- */
  var root = document.documentElement;
  var btn = document.getElementById('themeBtn');
  if (!btn) return;
  var sun = btn.querySelector('.icoSun');
  var moon = btn.querySelector('.icoMoon');
  var meta = document.querySelector('meta[name="theme-color"]');
  var vt = null;

  function current() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function sync() {
    var dark = current() === 'dark';
    if (sun) sun.style.display = dark ? '' : 'none';
    if (moon) moon.style.display = dark ? 'none' : '';
    if (meta) meta.setAttribute('content', dark ? '#161618' : '#f4f2ee');
    var logoCells = Array.prototype.slice.call(document.querySelectorAll('.logoCell'));
    for (var i = 0; i < logoCells.length; i++) {
      var src = logoCells[i].getAttribute(dark ? 'data-dark' : 'data-light');
      if (src) logoCells[i].style.backgroundImage = 'url("' + src + '")';
    }
  }
  function apply(t) {
    root.setAttribute('data-theme', t);
    sync();
    if (nav) navScroll();
    /* pages with their own theme-sensitive bits listen for this */
    document.dispatchEvent(new CustomEvent('t3:themechange', { detail: { theme: t } }));
  }
  btn.addEventListener('click', function (e) {
    var t = current() === 'dark' ? 'light' : 'dark';
    var x = e.clientX || (window.innerWidth - 80);
    var y = e.clientY || 40;
    try { localStorage.setItem('t3-theme', t); } catch (err) {}
    if (vt) { try { vt.skipTransition(); } catch (err) {} }
    if (document.startViewTransition && !lessMotion()) {
      var v = vt = document.startViewTransition(function () {
        apply(t);
        return new Promise(function (r) { window.setTimeout(r, 50); });
      });
      v.finished.then(function () { if (vt === v) vt = null; }).catch(function () {});
      v.ready.then(function () {
        var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 800, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(function () {});
    } else {
      apply(t);
    }
  });
  sync();
})();
