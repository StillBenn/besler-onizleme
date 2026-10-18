/* ==========================================================================
   Beşler — the site's own parts
   --------------------------------------------------------------------------
   · the header learns whether it sits over the ivory paper or the dark, and
     turns its type to match (on the products page it is always on paper);
   · any pack can join the quote list (kept in this browser, shared by both
     pages); on the products page a tray at the foot of the screen counts it
     and opens a drawer with the list, a quantity for each, and the form;
   · a product opens large in a window of its own;
   · a static site has nowhere to post a form to: the request — the list, the
     quantities, every field — is written out as an e-mail to the company's
     own address, ready to send from the visitor's mail app;
   · a certificate opens in a viewer, every page of it.
   ========================================================================== */
(function () {
  "use strict";
  var t = function (s) { return window.KX ? window.KX.t(s) : s; };
  var html = document.documentElement;
  var hdr = document.querySelector(".hdr");

  /* ---- the header over paper or the dark ---- */
  if (!document.querySelector(".film") && hdr) {
    hdr.classList.add("is-stuck"); html.dataset.over = "paper";
  } else {
    var papers = [].slice.call(document.querySelectorAll(".paper, .quality"));
    var over = function () {
      var y = (hdr || {}).offsetHeight || 70;
      var on = papers.some(function (p) { var r = p.getBoundingClientRect(); return r.top <= y * 0.6 && r.bottom > y * 0.6; });
      html.dataset.over = on ? "paper" : "night";
    };
    addEventListener("scroll", over, { passive: true }); addEventListener("resize", over); over();
  }

  /* ---- the language menu: the code shown is the page's language; a choice, a tap outside or Esc closes it ---- */
  var lng = document.querySelector(".lng"), now = lng && lng.querySelector("[data-lang-now]");
  if (lng && now) {
    var show = function (l) { now.textContent = String(l || "tr").toUpperCase(); };
    show(window.KX ? window.KX.lang() : "tr");
    if (window.KX) window.KX.on(function (l) { show(l); lng.open = false; });
    document.addEventListener("click", function (e) { if (lng.open && !lng.contains(e.target)) lng.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && lng.open) { lng.open = false; lng.querySelector("summary").focus(); } });
  }

  /* ---- the quote list ---- */
  /* A card is one product; its packs (data-v) are what goes on the list, each on its own, by the pack's
     image stem. The card shows the pack chosen (data-sel). */
  var KEY = "bs-quote";
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  var save = function (q) { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch (e) { /* kept for this visit only */ } };
  var quote = load();
  var prods = [].slice.call(document.querySelectorAll(".prod"));
  var list = document.querySelector("[data-list]"), empty = document.querySelector("[data-empty]");
  var tray = document.querySelector("[data-qtray]"), count = document.querySelector("[data-qcount]");
  var byId = {};                                   /* pack stem -> { card, chip } */
  prods.forEach(function (p) {
    [].slice.call(p.querySelectorAll("[data-v]")).forEach(function (c) { byId[c.getAttribute("data-v")] = { card: p, chip: c }; });
  });

  function info(id) {
    var o = byId[id];
    if (!o) return null;
    var p = o.card, fam = t(p.getAttribute("data-fam")), pack = o.chip.textContent;
    return { img: "./img/urun/" + id + ".webp", brand: t(p.getAttribute("data-brand")), name: t(p.getAttribute("data-name")),
             fam: fam, pack: pack, meta: fam + " · " + pack };
  }
  var ids = function () { return Object.keys(quote).filter(function (id) { return byId[id]; }); };
  function choose(p, id) {                         /* a card shows another of its packs */
    p.setAttribute("data-sel", id);
    [].slice.call(p.querySelectorAll("button[data-v]")).forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-v") === id)); });
    [].slice.call(p.querySelectorAll("[data-for]")).forEach(function (im) { im.classList.toggle("is-on", im.getAttribute("data-for") === id); });
    paint();
  }
  function paint() {
    prods.forEach(function (p) {
      var sel = p.getAttribute("data-sel"), on = !!quote[sel];
      var b = p.querySelector("[data-add]");
      b.setAttribute("aria-pressed", String(on));
      b.querySelector("span").textContent = t(on ? "Listede" : "Teklife ekle");
      [].slice.call(p.querySelectorAll("button[data-v]")).forEach(function (c) { c.classList.toggle("is-listed", !!quote[c.getAttribute("data-v")]); });
    });
    var n = ids().length;
    if (count) count.textContent = String(n);
    if (tray) tray.classList.toggle("is-on", n > 0);
    if (pv && pv.open) paintView();
    if (!list) return;
    list.textContent = "";
    empty.hidden = n > 0;
    ids().forEach(function (id) {
      var d = info(id);
      var li = document.createElement("li"); li.className = "quote__item";
      var img = document.createElement("img"); img.src = d.img; img.alt = ""; li.appendChild(img);
      var tx = document.createElement("div"); var b = document.createElement("b"); b.textContent = d.brand + " " + d.name; tx.appendChild(b);
      var sm = document.createElement("small"); sm.textContent = d.meta; tx.appendChild(sm); li.appendChild(tx);
      var qty = document.createElement("input"); qty.className = "quote__qty"; qty.type = "number"; qty.min = "1"; qty.inputMode = "numeric";
      qty.value = quote[id]; qty.setAttribute("aria-label", t("Koli adedi"));
      qty.addEventListener("input", function () { var v = parseInt(qty.value, 10); quote[id] = isFinite(v) && v > 0 ? Math.min(v, 99999) : 1; save(quote); });
      li.appendChild(qty);
      var rm = document.createElement("button"); rm.type = "button"; rm.className = "quote__rm"; rm.textContent = "×"; rm.setAttribute("aria-label", t("Listeden çıkar"));
      rm.addEventListener("click", function () { delete quote[id]; save(quote); paint(); });
      li.appendChild(rm);
      list.appendChild(li);
    });
  }
  function toggle(id) {
    if (quote[id]) delete quote[id]; else quote[id] = 1;
    save(quote); paint();
    if (tray && quote[id]) { tray.classList.remove("is-bump"); void tray.offsetWidth; tray.classList.add("is-bump"); setTimeout(function () { tray.classList.remove("is-bump"); }, 420); }
  }
  prods.forEach(function (p) {
    p.querySelector("[data-add]").addEventListener("click", function () { toggle(p.getAttribute("data-sel")); });
    [].slice.call(p.querySelectorAll("button[data-v]")).forEach(function (c) {
      c.addEventListener("click", function () { choose(p, c.getAttribute("data-v")); });
    });
  });

  /* ---- a product, opened: the pack chosen, its other packs to switch to ---- */
  var pv = document.querySelector("[data-pview]"), pvCard = null;
  function paintView() {
    var id = pvCard.getAttribute("data-sel"), d = info(id); if (!d) return;
    pv.querySelector("[data-pv-img]").src = d.img;
    pv.querySelector("[data-pv-brand]").textContent = d.brand;
    pv.querySelector("[data-pv-name]").textContent = d.name;
    pv.querySelector("[data-pv-fam]").textContent = d.fam;
    var packs = pv.querySelector("[data-pv-pack]");
    packs.textContent = "";
    [].slice.call(pvCard.querySelectorAll("[data-v]")).forEach(function (c) {
      var v = c.getAttribute("data-v");
      var b = document.createElement("button"); b.type = "button"; b.textContent = c.textContent;
      b.setAttribute("aria-pressed", String(v === id)); if (quote[v]) b.className = "is-listed";
      b.addEventListener("click", function () { choose(pvCard, v); });
      packs.appendChild(b);
    });
    pv.querySelector("[data-pv-add]").textContent = t(quote[id] ? "Listeden çıkar" : "Teklife ekle");
  }
  if (pv && pv.showModal) {
    prods.forEach(function (p) {
      p.querySelector("[data-open]").addEventListener("click", function () { pvCard = p; paintView(); pv.showModal(); });
    });
    pv.querySelector("[data-pv-add]").addEventListener("click", function () { toggle(pvCard.getAttribute("data-sel")); paintView(); });
    pv.querySelector("[data-close]").addEventListener("click", function () { pv.close(); });
    pv.addEventListener("click", function (e) { if (e.target === pv) pv.close(); });
  }

  /* ---- the drawer: the list and the form ---- */
  var drawer = document.querySelector("[data-qdrawer]");
  if (drawer && drawer.showModal) {
    var open = function () { if (!drawer.open) { if (pv && pv.open) pv.close(); drawer.showModal(); } };
    if (tray) tray.addEventListener("click", open);
    drawer.querySelector("[data-close]").addEventListener("click", function () { drawer.close(); if (location.hash === "#teklif") history.replaceState(null, "", location.pathname); });
    drawer.addEventListener("click", function (e) { if (e.target === drawer) drawer.close(); });
    var byHash = function () { if (location.hash === "#teklif") open(); };
    addEventListener("hashchange", byHash);
    document.querySelectorAll('a[href$="#teklif"]').forEach(function (a) { a.addEventListener("click", function (e) { if (a.pathname === location.pathname) { e.preventDefault(); open(); } }); });
    byHash();
  }
  if (window.KX) window.KX.on(paint);
  paint();

  /* ---- the quote form: written out as an e-mail ---- */
  var form = document.querySelector("[data-quote]");
  if (form) {
    var hint = form.querySelector("[data-hint]"), said = "";
    var say = function (s) { said = s; hint.textContent = s ? t(s) : ""; };
    if (window.KX) window.KX.on(function () { say(said); });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var bad = null;
      ["name", "country", "email"].forEach(function (n) {
        var el = form.elements[n];
        var ok = n === "email" ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()) : el.value.trim().length > 1;
        el.setAttribute("aria-invalid", String(!ok));
        if (!ok && !bad) bad = el;
      });
      if (bad) { say("Lütfen işaretli alanları doldurun."); bad.focus(); return; }
      var lines = [t("Teklif isteği") + " — beslerpasta.com", ""];
      if (ids().length) {
        lines.push(t("Ürünler") + ":");
        ids().forEach(function (id) { var d = info(id); lines.push("· " + d.brand + " " + d.name + " (" + d.meta + ") — " + quote[id] + " " + t("koli")); });
        lines.push("");
      }
      [["name", "Ad soyad"], ["company", "Firma"], ["country", "Ülke"], ["email", "E-posta"]].forEach(function (f) {
        var v = form.elements[f[0]].value.trim(); if (v) lines.push(t(f[1]) + ": " + v);
      });
      var msg = form.elements.message.value.trim();
      if (msg) lines.push("", msg);
      var subject = t("Teklif isteği") + " — " + (form.elements.company.value.trim() || form.elements.name.value.trim());
      location.href = "mailto:besler@beslermakarna.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
      say("E-posta uygulamanız açılıyor; isteğiniz hazır, göndermeniz yeterli.");
    });
  }

  /* ---- the certificate viewer ---- */
  var dlg = document.querySelector("[data-viewer]");
  if (dlg && dlg.showModal) {
    var pages = dlg.querySelector("[data-pages]"), title = dlg.querySelector("#viewer-title");
    document.querySelectorAll("[data-doc]").forEach(function (b) {
      b.addEventListener("click", function () {
        pages.textContent = "";
        b.getAttribute("data-doc").split(",").forEach(function (src, i) {
          var img = document.createElement("img"); img.src = src; img.alt = b.getAttribute("data-title") + " — " + (i + 1); img.loading = "lazy"; pages.appendChild(img);
        });
        title.textContent = b.querySelector(".doc__name").textContent + " · " + b.querySelector(".doc__note").textContent;   /* already in the reader's language */
        dlg.showModal();
      });
    });
    dlg.querySelector("[data-close]").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* ---- pictures that take turns in one frame (a family's pack on the home stage, a card's packs) are shown
     only once they have arrived: on a slow link one still on its way drew as an empty, broken frame (the reader
     saw it, the film's packs downloading beside it); one that fails is asked for again, once ---- */
  html.classList.add("pics");
  [].slice.call(document.querySelectorAll("[data-fx-pic], .prod__stage img")).forEach(function (im) {
    var ok = function () { im.classList.add("is-ready"); };
    var again = function () {
      if (im.getAttribute("data-again")) return;
      im.setAttribute("data-again", "1");
      setTimeout(function () { im.src = im.getAttribute("src").split("?")[0] + "?again=1"; }, 700);
    };
    im.addEventListener("load", ok);
    im.addEventListener("error", again);
    if (im.complete) { if (im.naturalWidth) ok(); else if (im.getAttribute("src")) again(); }
  });

  /* ---- pictures are opened before they arrive: a big one decoded at the moment it scrolled in cost a dropped frame ---- */
  if ("IntersectionObserver" in window) {
    var early = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        early.unobserve(e.target);
        e.target.loading = "eager";
        if (e.target.decode) e.target.decode().catch(function () { /* drawn when it comes, as before */ });
      });
    }, { rootMargin: "150% 0px" });
    [].slice.call(document.querySelectorAll("img[loading=lazy]")).forEach(function (im) { early.observe(im); });
  }
})();
