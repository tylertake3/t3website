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
    if (navLogo) navLogo.style.height = (110 - 58 * p).toFixed(1) + 'px';
    navTick = false;
  }
  if (nav) {
    window.addEventListener('scroll', function () {
      if (!navTick) { navTick = true; window.requestAnimationFrame(navScroll); }
    }, { passive: true });
    navScroll();
  }

  /* ---------------- mobile nav panel ---------------- */
  var navToggle = document.getElementById('navToggle');
  var navPanel = document.getElementById('navPanel');
  if (navToggle && navPanel) {
    var setPanel = function (open) {
      navPanel.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    navToggle.addEventListener('click', function () {
      setPanel(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    navPanel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setPanel(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        setPanel(false);
        navToggle.focus();
      }
    });
  }

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
