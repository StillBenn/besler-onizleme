/* ==========================================================================
   Beşler — the page's own parts
   --------------------------------------------------------------------------
   · the header learns whether it sits over ivory paper or the navy, and
     turns its type to match;
   · the catalogue filters by family; any pack can join the quote list, which
     the form below shows with a quantity for each (kept in this browser);
   · a static site has nowhere to post a form to: the request — the list, the
     quantities, every field — is written out as an e-mail to the company's
     own address, ready to send from the visitor's mail app;
   · a certificate opens in a viewer, every page of it.
   ========================================================================== */
(function () {
  "use strict";
  var t = function (s) { return window.KX ? window.KX.t(s) : s; };
  var html = document.documentElement;

  /* ---- the header over paper or navy ---- */
  var papers = [].slice.call(document.querySelectorAll(".paper"));
  function over() {
    var y = (document.querySelector(".hdr") || {}).offsetHeight || 70;
    var on = papers.some(function (p) { var r = p.getBoundingClientRect(); return r.top <= y * 0.6 && r.bottom > y * 0.6; });
    html.dataset.over = on ? "paper" : "navy";
  }
  addEventListener("scroll", over, { passive: true }); addEventListener("resize", over); over();

  /* ---- the catalogue ---- */
  var cats = [].slice.call(document.querySelectorAll(".cat"));
  var prods = [].slice.call(document.querySelectorAll(".prod"));
  cats.forEach(function (b) {
    b.addEventListener("click", function () {
      var c = b.getAttribute("data-cat");
      cats.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      prods.forEach(function (p) { p.hidden = c !== "all" && p.getAttribute("data-cat") !== c; });
    });
  });

  /* ---- the quote list ---- */
  var KEY = "bs-quote";
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  var save = function (q) { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch (e) { /* kept for this visit only */ } };
  var quote = load();
  var list = document.querySelector("[data-list]"), empty = document.querySelector("[data-empty]");
  var byId = {};
  prods.forEach(function (p) { byId[p.getAttribute("data-id")] = p; });

  function info(id) {
    var p = byId[id];
    if (!p) return null;
    return { img: p.querySelector("img").getAttribute("src"), brand: p.querySelector(".prod__brand").textContent, name: p.querySelector(".prod__name").textContent, meta: p.querySelector(".prod__meta").textContent };
  }
  function paint() {
    prods.forEach(function (p) {
      var on = !!quote[p.getAttribute("data-id")];
      var b = p.querySelector("[data-add]");
      b.setAttribute("aria-pressed", String(on));
      b.textContent = t(on ? "Listede" : "Teklife ekle");
    });
    if (!list) return;
    list.textContent = "";
    var ids = Object.keys(quote).filter(function (id) { return byId[id]; });
    empty.hidden = ids.length > 0;
    ids.forEach(function (id) {
      var d = info(id);
      var li = document.createElement("li"); li.className = "quote__item";
      var img = document.createElement("img"); img.src = d.img; img.alt = ""; li.appendChild(img);
      var tx = document.createElement("div"); var b = document.createElement("b"); b.textContent = d.brand + " " + d.name; tx.appendChild(b);
      var sm = document.createElement("small"); sm.textContent = d.meta; tx.appendChild(sm); li.appendChild(tx);
      var qty = document.createElement("input"); qty.className = "quote__qty"; qty.type = "number"; qty.min = "1"; qty.inputMode = "numeric";
      qty.value = quote[id]; qty.setAttribute("aria-label", t("Koli adedi"));
      qty.addEventListener("input", function () { var v = parseInt(qty.value, 10); quote[id] = isFinite(v) && v > 0 ? Math.min(v, 99999) : 1; save(quote); });
      var wrap = document.createElement("div"); wrap.className = "field"; wrap.appendChild(qty); li.appendChild(wrap);
      var rm = document.createElement("button"); rm.type = "button"; rm.className = "quote__rm"; rm.textContent = "×"; rm.setAttribute("aria-label", t("Listeden çıkar"));
      rm.addEventListener("click", function () { delete quote[id]; save(quote); paint(); });
      li.appendChild(rm);
      list.appendChild(li);
    });
  }
  prods.forEach(function (p) {
    p.querySelector("[data-add]").addEventListener("click", function () {
      var id = p.getAttribute("data-id");
      if (quote[id]) delete quote[id]; else quote[id] = 1;
      save(quote); paint();
    });
  });
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
      var ids = Object.keys(quote).filter(function (id) { return byId[id]; });
      if (ids.length) {
        lines.push(t("Ürünler") + ":");
        ids.forEach(function (id) { var d = info(id); lines.push("· " + d.brand + " " + d.name + " (" + d.meta + ") — " + quote[id] + " " + t("koli")); });
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
})();
