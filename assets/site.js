/* PyPath website: het beetje JavaScript dat er is. Alles werkt ook zonder.
   - elementen rustig laten verschijnen bij scrollen (niet bij "beperk beweging");
   - tabbladen bij de codevoorbeelden;
   - mobiel menu sluiten na een klik, met Escape of buiten het menu;
   - in gidsen de inhoudsopgave laten meelopen;
   - de demofilm: bij "beperk beweging" alleen het posterbeeld, buiten beeld gepauzeerd. */
(function () {
  "use strict";
  window.ppKlaar = true;
  var rustig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Verschijnen bij scrollen
  var teTonen = document.querySelectorAll(".verschijn, .verschijn-groep");
  if (!("IntersectionObserver" in window) || rustig) {
    teTonen.forEach(function (el) { el.classList.add("zichtbaar"); });
  } else {
    var kijker = new IntersectionObserver(function (items) {
      items.forEach(function (item) {
        if (item.isIntersecting) {
          item.target.classList.add("zichtbaar");
          kijker.unobserve(item.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    teTonen.forEach(function (el) { kijker.observe(el); });
  }

  // Tabbladen
  document.querySelectorAll("[data-tabs]").forEach(function (groep) {
    var lijst = groep.querySelector("[role=tablist]");
    var knoppen = Array.prototype.slice.call(groep.querySelectorAll("[role=tab]"));
    var panelen = knoppen.map(function (k) { return document.getElementById(k.getAttribute("aria-controls")); });
    if (!lijst || !knoppen.length) return;
    lijst.hidden = false;
    function kies(i, focus) {
      knoppen.forEach(function (k, j) {
        var actief = i === j;
        k.setAttribute("aria-selected", actief ? "true" : "false");
        k.tabIndex = actief ? 0 : -1;
        if (panelen[j]) panelen[j].hidden = !actief;
      });
      if (focus) knoppen[i].focus();
    }
    knoppen.forEach(function (k, i) {
      k.addEventListener("click", function () { kies(i, false); });
      k.addEventListener("keydown", function (e) {
        var n = knoppen.length, doel = null;
        if (e.key === "ArrowRight") doel = (i + 1) % n;
        if (e.key === "ArrowLeft") doel = (i - 1 + n) % n;
        if (e.key === "Home") doel = 0;
        if (e.key === "End") doel = n - 1;
        if (doel !== null) { e.preventDefault(); kies(doel, true); }
      });
    });
    kies(0, false);
    groep.classList.add("klaar");
  });

  // Kopieerknop bij codeblokken (alleen als het klembord beschikbaar is)
  if (navigator.clipboard && window.isSecureContext !== false) {
    var en = (document.documentElement.lang || "nl").indexOf("en") === 0;
    document.querySelectorAll(".code-venster:not(.code-uitvoer)").forEach(function (fig) {
      var kop = fig.querySelector(".code-kop");
      var code = fig.querySelector("code");
      if (!kop || !code || code.classList.contains("language-tekst")) return;
      var knop = document.createElement("button");
      knop.type = "button";
      knop.className = "kopieer";
      knop.textContent = en ? "Copy" : "Kopieer";
      knop.setAttribute("aria-label", en ? "Copy code" : "Kopieer de code");
      knop.addEventListener("click", function () {
        navigator.clipboard.writeText(code.textContent).then(function () {
          knop.textContent = en ? "Copied" : "Gekopieerd";
          setTimeout(function () { knop.textContent = en ? "Copy" : "Kopieer"; }, 1800);
        });
      });
      kop.appendChild(knop);
    });
  }

  // Rekenvoorbeeld (Voor bedrijven): alles in de browser, niets opslaan of versturen.
  document.querySelectorAll("form[data-calculator]").forEach(function (form) {
    var taal = (document.documentElement.lang || "nl").indexOf("en") === 0 ? "en-IE" : "nl-NL";
    var euro = new Intl.NumberFormat(taal, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
    var getal = function (naam) {
      var veld = form.elements[naam];
      var v = parseFloat(String(veld.value).replace(",", "."));
      return isFinite(v) && v >= 0 ? v : 0;
    };
    var zet = function (naam, tekst) { var el = form.querySelector('[data-uit="' + naam + '"]'); if (el) el.textContent = tekst; };
    var reken = function () {
      var mensen = getal("mensen"), uren = getal("uren"), tarief = getal("tarief");
      var leertijd = getal("leertijd"), prijs = getal("prijs"), weken = getal("weken");
      var investering = mensen * (prijs + leertijd * tarief);
      var perWeek = mensen * uren * tarief;
      var besparing = perWeek * weken;
      var eersteJaar = perWeek * Math.max(0, weken - 12) - investering;
      zet("investering", euro.format(investering));
      zet("besparing", euro.format(besparing));
      zet("netto", euro.format(eersteJaar));
      zet("terug", perWeek > 0
        ? form.getAttribute("data-weken").replace("{n}", Math.max(1, Math.round(investering / perWeek)))
        : form.getAttribute("data-nooit"));
    };
    form.hidden = false;
    form.addEventListener("input", reken);
    form.addEventListener("change", reken);
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    reken();
  });

  // Brief kopiëren
  document.querySelectorAll("[data-kopieer]").forEach(function (knop) {
    var doel = document.querySelector(knop.getAttribute("data-kopieer"));
    if (!doel || !navigator.clipboard) return;
    knop.hidden = false;
    var label = knop.textContent;
    knop.addEventListener("click", function () {
      navigator.clipboard.writeText(doel.innerText.trim()).then(function () {
        knop.textContent = knop.getAttribute("data-gekopieerd") || label;
        setTimeout(function () { knop.textContent = label; }, 1800);
      });
    });
  });

  // Printknop (printversie van de brief)
  document.querySelectorAll("[data-print]").forEach(function (knop) {
    knop.addEventListener("click", function () { window.print(); });
  });

  // Mobiel menu
  var menu = document.querySelector("details.menu");
  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
    });
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
  }

  // Inhoudsopgave in gidsen: open op brede schermen, actieve kop markeren
  var toc = document.querySelector(".toc");
  if (toc) {
    var details = toc.querySelector("details");
    var smal = window.matchMedia("(max-width: 960px)");
    var zetOpen = function () { if (details) details.open = !smal.matches; };
    zetOpen();
    if (smal.addEventListener) smal.addEventListener("change", zetOpen);
    var links = Array.prototype.slice.call(toc.querySelectorAll("a[href^='#']"));
    var koppen = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    if ("IntersectionObserver" in window && koppen.length) {
      var zichtbaar = new Map();
      var spion = new IntersectionObserver(function (items) {
        items.forEach(function (it) { zichtbaar.set(it.target.id, it.isIntersecting); });
        var actief = null;
        for (var i = 0; i < koppen.length; i++) {
          if (!koppen[i]) continue;
          if (koppen[i].getBoundingClientRect().top < window.innerHeight * 0.35) actief = koppen[i].id;
        }
        links.forEach(function (a) {
          if (a.getAttribute("href") === "#" + actief) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      }, { rootMargin: "0px 0px -60% 0px" });
      koppen.forEach(function (k) { if (k) spion.observe(k); });
    }
  }

  // Demofilm (stil, loopt rond). Bij "beperk beweging" kiest de browser geen bron (media op <source>);
  // oudere browsers vangen we hier op. Buiten beeld pauzeren we hem (bespaart batterij). Lukt
  // automatisch afspelen niet (bijv. energiebesparing), dan krijgt de film gewone knoppen.
  document.querySelectorAll("video.demofilm-video").forEach(function (film) {
    if (rustig) {
      film.pause();
      film.removeAttribute("autoplay");
      film.querySelectorAll("source").forEach(function (s) { s.remove(); });
      film.load();
      return;
    }
    function speel() {
      var p = film.play();
      if (p && p.catch) p.catch(function () { film.controls = true; });
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (items) {
        items.forEach(function (it) { if (it.isIntersecting) speel(); else film.pause(); });
      }, { threshold: 0.2 }).observe(film);
    }
  });
})();
