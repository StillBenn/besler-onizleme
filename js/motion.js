/* ==========================================================================
   Beşler — things that answer the reader
   --------------------------------------------------------------------------
   · a family card and a product card lean toward the pointer, a soft light
     following it (fine pointers only, never under reduced motion);
   · the figures count up once as they come on screen;
   · the production line draws itself as the reader scrolls past it, each
     step lighting as the line reaches it; the film still drifts against it;
   · over the brand list, the pack of the brand under the pointer follows it;
   · on the products page, the family bar marks the family on screen, and a
     products page block rises once as it arrives.
   Everything that moves per frame is a transform or a custom property on the
   element itself, written in one rAF: nothing restyles the page as it scrolls.
   ========================================================================== */
(function () {
  "use strict";
  var fine = matchMedia("(pointer: fine)").matches;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var html = document.documentElement;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---- cards that lean toward the pointer ---- */
  function tilt(el, max) {
    var raf = 0, px = 0.5, py = 0.5;
    function paint() {
      raf = 0;
      el.style.setProperty("--ry", ((px - 0.5) * 2 * max).toFixed(2) + "deg");
      el.style.setProperty("--rx", (-(py - 0.5) * 2 * max).toFixed(2) + "deg");
      el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    }
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      el.classList.add("is-tilting");
      if (!raf) raf = requestAnimationFrame(paint);
    });
    el.addEventListener("pointerleave", function () {
      el.classList.remove("is-tilting"); px = 0.5; py = 0.5;
      if (!raf) raf = requestAnimationFrame(paint);
    });
  }
  if (fine && !reduced) {
    $$(".fam").forEach(function (c) { tilt(c, 5); });
    $$(".prod").forEach(function (c) { tilt(c, 4); });
  }

  /* ---- blocks rise once (the products page; the home page's are set by home.js) ---- */
  var rise = $$(".family__head, .prods, .phead > *");
  if (!document.querySelector(".film") && !reduced && "IntersectionObserver" in window && rise.length) {
    html.classList.add("rv");
    rise.forEach(function (g) {
      var parts = g.matches(".prods") ? [].slice.call(g.children) : [g];
      parts.forEach(function (el, i) { el.classList.add("rv__p"); el.style.setProperty("--i", Math.min(i % 6, 6)); });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.classList.contains("rv__p")) e.target.classList.add("is-in");
        else e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    rise.forEach(function (g) { io.observe(g); });
  }

  /* ---- figures count up ---- */
  var figs = $$("[data-count]");
  if (figs.length && "IntersectionObserver" in window && !reduced) {
    figs.forEach(function (b) {
      var small = b.querySelector("small");
      var num = document.createElement("span"); num.textContent = "0";
      b.textContent = ""; b.appendChild(num); if (small) b.appendChild(small);
      b.__num = num;
    });
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        fio.unobserve(e.target);
        var b = e.target, to = +b.getAttribute("data-count"), t0 = performance.now(), dur = 1600;
        (function step(now) {
          var u = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - u, 4);
          b.__num.textContent = Math.round(to * k).toLocaleString(html.lang === "ar" ? "ar" : "tr");
          if (u < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    figs.forEach(function (b) { fio.observe(b); });
  }

  /* ---- the production line, and the film still drifting against the page ---- */
  var chain = document.querySelector("[data-chain]"), steps = chain ? $$(".step", chain) : [];
  var plate = document.querySelector(".plate img");
  var ticking = false;
  function scrolled() {
    ticking = false;
    var vh = innerHeight;
    if (chain) {
      var r = chain.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      chain.style.setProperty("--p", p.toFixed(3));
      steps.forEach(function (s, i) { s.classList.toggle("is-on", p >= i / steps.length + 0.02); });
    }
    if (plate && !reduced) {
      var q = plate.parentElement.getBoundingClientRect();
      if (q.bottom > 0 && q.top < vh) plate.style.setProperty("--shift", ((q.top + q.height / 2 - vh / 2) / vh * -6).toFixed(2) + "%");
    }
  }
  if (chain || plate) {
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(scrolled); } }, { passive: true });
    addEventListener("resize", scrolled); scrolled();
  }

  /* ---- the brand list: the pack of the brand under the pointer follows it ---- */
  var peek = document.querySelector(".peek"), peekImg = peek && peek.querySelector("img");
  if (peek && fine && !reduced) {
    var tx = 0, ty = 0, cx = 0, cy = 0, live = false, prf = 0;
    var follow = function () {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      peek.style.setProperty("--px", cx.toFixed(1) + "px"); peek.style.setProperty("--py", cy.toFixed(1) + "px");
      prf = live || Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(follow) : 0;
    };
    $$(".brand").forEach(function (b) {
      var src = b.getAttribute("data-peek");
      b.addEventListener("pointerenter", function (e) {
        if (!src) { peek.classList.remove("is-on"); return; }
        if (peekImg.getAttribute("src") !== src) peekImg.setAttribute("src", src);
        tx = cx = e.clientX - 120; ty = cy = e.clientY - 120;
        peek.classList.add("is-on"); live = true; if (!prf) prf = requestAnimationFrame(follow);
      });
      b.addEventListener("pointermove", function (e) { tx = e.clientX + 30; ty = e.clientY - 150; });
      b.addEventListener("pointerleave", function () { peek.classList.remove("is-on"); live = false; });
    });
  }

  /* ---- the products page: the family bar follows the reader ---- */
  var spies = $$("[data-spy]");
  if (spies.length && "IntersectionObserver" in window) {
    var bar = document.querySelector(".catbar"), cur = null;
    var mark = function (k) {
      if (k === cur) return; cur = k;
      spies.forEach(function (a) {
        var on = a.getAttribute("data-spy") === k;
        a.setAttribute("aria-current", String(on));
        if (on && bar) bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" });
      });
    };
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    spies.forEach(function (a) { var s = document.getElementById(a.getAttribute("data-spy")); if (s) sio.observe(s); });
  }
})();
