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
    use.setAttribute("href", "icons.svg#" + id);
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
    dataRetention: [L.dataRetention, "כמה זמן נשמרות התכתבויות"],
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
