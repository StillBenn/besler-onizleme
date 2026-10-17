/* ==========================================================================
   The page around the film: the loader, the header, words that arrive
   --------------------------------------------------------------------------
   The loader is a curtain the film lifts (js/film.js calls FilmIntro): its bar
   is the opening's frames actually arriving, not a timer. The header gets a
   ground of its own only over the page, never over the film. Each block of
   the page rises into place once as it comes on screen (off under reduced
   motion; without JS nothing is hidden: html.rv is set here).
   ========================================================================== */
(function () {
  "use strict";
  var html = document.documentElement;
  var bar = document.querySelector(".loader__bar");
  var shown = 0, lifted = false, t0 = performance.now();
  var MIN_MS = 700;                  /* a cached visit still sees the curtain, not a flash of it */

  function paint(p) {
    shown = Math.max(shown, Math.min(1, p));
    if (bar) bar.style.setProperty("--p", shown.toFixed(3));
  }
  function lift() {
    if (lifted) return;
    lifted = true;
    paint(1);
    setTimeout(function () {
      html.classList.remove("is-loading");
      dispatchEvent(new Event("intro:done"));
      setTimeout(function () { html.classList.add("is-written"); }, 1800);
    }, Math.max(0, MIN_MS - (performance.now() - t0)));
  }
  window.FilmIntro = { progress: paint, done: lift };
  setTimeout(lift, 16000);           /* never trapped behind the curtain (the film waits up to 14 s for its opening's sharp frames) */

  /* arriving at index.html#part: the browser scrolls to the part before the film has grown to its real
     length (that needs its manifest), and the part is pushed far down — follow it until the reader moves */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  var hashEl = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (hashEl) {
    var moved = false;
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (t) { addEventListener(t, function () { moved = true; }, { once: true, passive: true }); });
    var settle = function () { if (!moved) window.scrollTo(0, hashEl.getBoundingClientRect().top + scrollY); };
    addEventListener("film:layout", function (e) { if (e.detail && e.detail.id === "main") settle(); });
    addEventListener("load", settle);
    setTimeout(function () { moved = true; }, 6000);
  }

  /* the reader has taken over */
  addEventListener("scroll", function once() {
    if (scrollY > 12) { html.classList.add("has-scrolled"); removeEventListener("scroll", once); }
  }, { passive: true });

  /* the header: its own ground over the page, transparent over the film */
  var hdr = document.querySelector(".hdr");
  function stuck() {
    if (!hdr) return;
    var onFilm = html.dataset.film === "dark" || html.dataset.film === "light";
    hdr.classList.toggle("is-stuck", !onFilm && scrollY > 10);
  }
  addEventListener("scroll", stuck, { passive: true });
  new MutationObserver(stuck).observe(html, { attributes: true, attributeFilter: ["data-film"] });
  stuck();

  /* words arrive, part after part */
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var groups = [].slice.call(document.querySelectorAll(".sec-head > div, .sec-head > .sec-lead, .story__text, .figs, .fxs__intro, .fxs__list, .fxs__stage, .fxs__all, .brands, .chain, .plate, .docs, .export__grid > div, .export__map"));
  if (!reduced && "IntersectionObserver" in window && groups.length) {
    html.classList.add("rv");
    groups.forEach(function (g) {
      /* an image, a picture's stage or one step rises as one; a block rises child after child */
      var parts = g.matches(".plate, .sec-lead, .export__map, .fxs__stage, .fxs__all") ? [g] : [].slice.call(g.children);
      parts.forEach(function (el, i) { el.classList.add("rv__p"); el.style.setProperty("--i", Math.min(i, 8)); });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.01 });
    groups.forEach(function (g) { io.observe(g); });
  }

  /* "Skip the film": its ring fills with the film behind you */
  var skip = document.querySelector(".film__skip"), filmEl = skip && skip.closest(".film");
  if (skip && filmEl) {
    var ring = function () {
      var r = filmEl.getBoundingClientRect(), len = r.height - innerHeight;
      skip.style.setProperty("--skip-p", (len > 0 ? Math.min(1, Math.max(0, -r.top / len)) : 0).toFixed(3));
    };
    addEventListener("scroll", ring, { passive: true });
    addEventListener("resize", ring);
    ring();
  }
})();
