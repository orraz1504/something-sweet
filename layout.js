/* משהו מתוק – shared by every page: footer, business details, WhatsApp links, menu.
   All details come from data.js – no need to edit this file. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var B = SITE.business;
  var L = SITE.legal;

  // ---------- helpers (also used by script.js) ----------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "style") node.setAttribute("style", v);
        else node.setAttribute(k, v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function svgUse(id, cls) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", cls || "icon");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var use = document.createElementNS(ns, "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  }

  function waLink(message) {
    return "https://wa.me/" + B.whatsapp + "?text=" + encodeURIComponent(message);
  }

  function shekel(n) { return n + " ₪"; }

  // Yellow "to fill in" marker for details that are still empty in data.js
  function todo(label) {
    return el("mark", { class: "todo", text: "להשלמה: " + label });
  }

  window.Sweet = { el: el, svgUse: svgUse, waLink: waLink, shekel: shekel, todo: todo };

  // ---------- details from data.js ----------
  var FIELDS = {
    businessName: [B.name, "שם העסק"],
    ownerName: [L.ownerName, "שם בעלת העסק"],
    osekNumber: [L.osekNumber, "מספר עוסק"],
    osekStatus: [L.osekStatus ? "עוסק " + L.osekStatus : "", "עוסק פטור / מורשה"],
    location: [B.location, "יישוב"],
    phone: [B.phoneDisplay, "טלפון"],
    orderLeadTime: [L.orderLeadTime, "כמה זמן מראש להזמין"],
    delivery: [L.delivery, "תנאי איסוף ומשלוח"],
    deliveryFee: [L.deliveryFee, "עלות משלוח"],
    pickupAccessibility: [L.pickupAccessibility, "נגישות מקום האיסוף"],
    policyDate: [L.policyDate, "תאריך עדכון"]
  };

  document.querySelectorAll("[data-field]").forEach(function (node) {
    var f = FIELDS[node.getAttribute("data-field")];
    if (!f) return;
    node.textContent = "";
    node.appendChild(f[0] ? document.createTextNode(f[0]) : todo(f[1]));
  });

  // phone links
  document.querySelectorAll("[data-tel]").forEach(function (a) {
    a.href = "tel:+" + B.whatsapp;
  });

  // email: shown only when filled in
  document.querySelectorAll("[data-email]").forEach(function (node) {
    if (L.email) {
      node.textContent = "";
      node.appendChild(el("a", { href: "mailto:" + L.email, text: L.email }));
    } else {
      node.closest("[data-email-wrap]") ? node.closest("[data-email-wrap]").remove() : node.remove();
    }
  });

  // VAT note – only for עוסק מורשה
  document.querySelectorAll("[data-vat-note]").forEach(function (node) {
    node.textContent = "";
    if (L.osekStatus === "מורשה") node.textContent = "כל המחירים כוללים מע״מ.";
    else if (!L.osekStatus) node.appendChild(todo("עוסק פטור / מורשה – במורשה יופיע כאן \"כל המחירים כוללים מע״מ\""));
    else node.remove();
  });

  // cancellation terms list
  document.querySelectorAll("[data-cancellation]").forEach(function (list) {
    list.textContent = "";
    if (L.cancellation && L.cancellation.length) {
      L.cancellation.forEach(function (line) { list.appendChild(el("li", { text: line })); });
    } else {
      list.appendChild(el("li", null, [todo("תנאי הביטול")]));
    }
  });

  // pickup location links – hidden when there is no map link in data.js
  document.querySelectorAll("[data-map]").forEach(function (a) {
    if (B.pickupMap) a.href = B.pickupMap;
    else (a.closest("[data-map-wrap]") || a).remove();
  });

  // WhatsApp links written in the HTML
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-wa"));
  });

  // ---------- Footer ----------
  var contact = document.getElementById("contact-list");
  if (contact) {
    var item = function (icon, content) { contact.appendChild(el("li", null, [svgUse(icon), content])); };
    item("i-whatsapp", el("a", { href: waLink("היי! 🍰"), target: "_blank", rel: "noopener", text: "וואטסאפ: " + B.phoneDisplay }));
    item("i-phone", el("a", { href: "tel:+" + B.whatsapp, text: "טלפון: " + B.phoneDisplay }));
    if (L.email) item("i-mail", el("a", { href: "mailto:" + L.email, text: L.email }));
    if (B.instagram) {
      item("i-insta", el("a", { href: "https://instagram.com/" + B.instagram, target: "_blank", rel: "noopener", text: "אינסטגרם: @" + B.instagram }));
    }
    item("i-pin", el("span", { text: "איסוף ומשלוחים: " + B.area }));
    if (B.pickupMap) item("i-pin", el("a", { href: B.pickupMap, target: "_blank", rel: "noopener", text: "מיקום לאיסוף במפה" }));
    item("i-clock", el("span", { text: B.hours }));
  }

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Mobile nav ----------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "סגירת תפריט" : "פתיחת תפריט");
    };
    toggle.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { setNav(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("open") && !e.target.closest(".site-header")) setNav(false);
    });
  }

  // ---------- Accessibility menu (built in, no outside service) ----------
  var A11Y_KEY = "sweet-a11y";
  var SIZES = [100, 115, 130, 150];
  var a11y = { size: 0, contrast: false, links: false, motion: false, font: false };
  try { Object.assign(a11y, JSON.parse(localStorage.getItem(A11Y_KEY)) || {}); } catch (e) { /* storage blocked */ }

  function applyA11y() {
    var root = document.documentElement;
    a11y.size = Math.max(0, Math.min(SIZES.length - 1, a11y.size | 0));
    root.style.fontSize = a11y.size ? SIZES[a11y.size] + "%" : "";
    root.classList.toggle("a11y-contrast", !!a11y.contrast);
    root.classList.toggle("a11y-links", !!a11y.links);
    root.classList.toggle("a11y-nomotion", !!a11y.motion);
    root.classList.toggle("a11y-font", !!a11y.font);
    try { localStorage.setItem(A11Y_KEY, JSON.stringify(a11y)); } catch (e) { /* storage blocked */ }
  }
  applyA11y();

  function buildA11yMenu() {
    var host = document.querySelector(".site-footer") || document.body;
    var toggleBtn = el("button", {
      type: "button", class: "a11y-toggle", "aria-expanded": "false",
      "aria-controls": "a11y-panel", "aria-label": "תפריט נגישות"
    }, [svgUse("i-access")]);

    var sizeLabel = el("span", { class: "a11y-size-value", "aria-live": "polite" });
    function sizeText() { sizeLabel.textContent = SIZES[a11y.size] + "%"; }

    function switchBtn(key, text) {
      var b = el("button", { type: "button", class: "a11y-option", "aria-pressed": String(!!a11y[key]) }, [
        el("span", { class: "a11y-check", "aria-hidden": "true" }), text
      ]);
      b.addEventListener("click", function () {
        a11y[key] = !a11y[key];
        b.setAttribute("aria-pressed", String(a11y[key]));
        applyA11y();
      });
      return b;
    }

    var smaller = el("button", { type: "button", class: "a11y-step", "aria-label": "הקטנת טקסט" }, ["א-"]);
    var bigger = el("button", { type: "button", class: "a11y-step", "aria-label": "הגדלת טקסט" }, ["א+"]);
    smaller.addEventListener("click", function () { a11y.size--; applyA11y(); sizeText(); });
    bigger.addEventListener("click", function () { a11y.size++; applyA11y(); sizeText(); });
    sizeText();

    var options = [
      switchBtn("contrast", "ניגודיות גבוהה"),
      switchBtn("links", "הדגשת קישורים"),
      switchBtn("motion", "עצירת אנימציות"),
      switchBtn("font", "גופן קריא")
    ];

    var reset = el("button", { type: "button", class: "a11y-reset" }, ["איפוס הגדרות"]);
    reset.addEventListener("click", function () {
      a11y = { size: 0, contrast: false, links: false, motion: false, font: false };
      applyA11y(); sizeText();
      options.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
    });

    var panel = el("div", { class: "a11y-panel", id: "a11y-panel", role: "region", "aria-labelledby": "a11y-title", hidden: "" }, [
      el("div", { class: "a11y-head" }, [
        el("h2", { id: "a11y-title", text: "תפריט נגישות" }),
        el("button", { type: "button", class: "a11y-close", "aria-label": "סגירת תפריט הנגישות" }, ["×"])
      ]),
      el("div", { class: "a11y-size", role: "group", "aria-label": "גודל טקסט" }, [
        el("span", { text: "גודל טקסט" }), smaller, sizeLabel, bigger
      ]),
      el("div", { class: "a11y-options" }, options),
      reset,
      el("a", { class: "a11y-statement", href: "accessibility.html", text: "הצהרת נגישות" })
    ]);

    function setOpen(open) {
      panel.hidden = !open;
      toggleBtn.setAttribute("aria-expanded", String(open));
      if (open) panel.querySelector("button, a").focus();
    }
    toggleBtn.addEventListener("click", function () { setOpen(panel.hidden); });
    panel.querySelector(".a11y-close").addEventListener("click", function () { setOpen(false); toggleBtn.focus(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggleBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!panel.hidden && !e.target.closest(".a11y-panel, .a11y-toggle")) setOpen(false);
    });

    host.appendChild(toggleBtn);
    host.appendChild(panel);
  }
  buildA11yMenu();

  // ---------- after the page script has run ----------
  document.addEventListener("DOMContentLoaded", function () {
    // tell screen-reader users which links open WhatsApp / a new tab
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      if (a.querySelector(".sr-only")) return;
      var label = a.getAttribute("aria-label");
      if (label) { a.setAttribute("aria-label", label + " (נפתח בחלון חדש)"); return; }
      a.appendChild(el("span", { class: "sr-only", text: " (נפתח בחלון חדש)" }));
    });

    // gentle fade-in on scroll
    var items = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -40px 0px", threshold: 0.08 });
      items.forEach(function (n) { io.observe(n); });
    } else {
      items.forEach(function (n) { n.classList.add("visible"); });
    }
  });
})();
