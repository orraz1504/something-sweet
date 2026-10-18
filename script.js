/* משהו מתוק – builds the page from data.js. No need to edit this file to change prices. */
(function () {
  "use strict";

  var B = SITE.business;
  var IMG_DIR = "images/products/";
  var el = Sweet.el, svgUse = Sweet.svgUse, waLink = Sweet.waLink, shekel = Sweet.shekel;

  // Shows the photo if it loads, otherwise keeps the pink placeholder (no broken image).
  function watchImage(img) {
    var holder = img.parentNode;
    function ok() { holder.classList.add("has-img"); }
    function fail() { img.remove(); }
    if (img.complete) {
      if (img.naturalWidth > 0) ok(); else fail();
    } else {
      img.addEventListener("load", ok, { once: true });
      img.addEventListener("error", fail, { once: true });
    }
  }

  function photo(name, file, alt, w, h) {
    var holder = el("div", { class: "ph", "data-name": name });
    var img = el("img", {
      alt: alt,
      width: w || 600,
      height: h || w || 600,
      loading: "lazy",
      decoding: "async"
    });
    img.addEventListener("load", function () { holder.classList.add("has-img"); }, { once: true });
    img.addEventListener("error", function () { img.remove(); }, { once: true });
    img.src = IMG_DIR + file;
    holder.appendChild(img);
    return holder;
  }

  // hero image fallback
  document.querySelectorAll(".hero img").forEach(watchImage);

  // ---------- About ----------
  var aboutBox = document.getElementById("about-text");
  B.about.forEach(function (p) { aboutBox.appendChild(el("p", { text: p })); });

  // ---------- Gallery ----------
  var ROT = [-2, 1.5, -1, 2, 1, -1.5, 2, -2, 1.5, -1, -2, 1, 2, -1.5, 1, -1];
  var gallery = document.getElementById("gallery");

  SITE.products.forEach(function (p, i) {
    var deco = null;
    if (i % 5 === 1) deco = el("span", { class: "tape", "aria-hidden": "true" });
    else if (i % 7 === 5) deco = el("span", { class: "pin", "aria-hidden": "true" });

    var card = el("div", { class: "polaroid" }, [
      deco,
      photo(p.name, p.image, p.name + " – משהו מתוק"),
      el("span", { class: "polaroid-label", text: p.name })
    ]);
    var btn = el("button", {
      type: "button",
      class: "gallery-btn",
      style: "--rot:" + ROT[i % ROT.length] + "deg",
      "aria-label": "הגדלת התמונה: " + p.name
    }, [card]);
    btn.addEventListener("click", function () { openLightbox(i); });
    gallery.appendChild(el("li", { class: "reveal" }, [btn]));
  });

  // ---------- Lightbox ----------
  var lb = document.getElementById("lightbox");
  var lbPh = lb.querySelector(".lb-ph");
  var lbName = lb.querySelector(".lb-name");
  var lbOrder = lb.querySelector(".lb-order");
  var current = 0;

  function showSlide(i) {
    var n = SITE.products.length;
    current = (i + n) % n;
    var p = SITE.products[current];
    lbPh.className = "ph lb-ph";
    lbPh.setAttribute("data-name", p.name);
    lbPh.textContent = "";
    var img = el("img", { alt: p.name + " – משהו מתוק", width: 1200, height: 1200 });
    lbPh.appendChild(img);
    img.src = IMG_DIR + p.image;
    watchImage(img);
    lbName.textContent = p.name;
    lbOrder.href = waLink("היי! אשמח לשמוע על " + p.name + " 🍰");
  }

  function openLightbox(i) {
    showSlide(i);
    if (typeof lb.showModal === "function") lb.showModal();
    else lb.setAttribute("open", "");
  }
  function closeLightbox() {
    if (typeof lb.close === "function") lb.close();
    else lb.removeAttribute("open");
  }

  lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lb.querySelector(".lb-prev").addEventListener("click", function () { showSlide(current - 1); });
  lb.querySelector(".lb-next").addEventListener("click", function () { showSlide(current + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  lb.addEventListener("keydown", function (e) {
    // RTL: left arrow = next, right arrow = previous
    if (e.key === "ArrowLeft") showSlide(current + 1);
    if (e.key === "ArrowRight") showSlide(current - 1);
  });
  var touchX = null;
  lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showSlide(current + (dx > 0 ? 1 : -1));
    touchX = null;
  });

  // ---------- Price list ----------
  var board = document.getElementById("price-board");
  var cols = [el("div", { class: "price-col" }), el("div", { class: "price-col" })];
  cols.forEach(function (c) { board.appendChild(c); });

  function priceRow(item) {
    if (item.heading) return el("p", { class: "pc-heading", text: item.name });
    if (item.note != null) {
      return el("p", { class: "pc-note" }, [
        item.tag ? el("span", { class: "pc-tag", text: item.tag }) : null,
        item.note
      ]);
    }
    var name = el("span", { class: "name" }, [
      item.label ? el("span", { class: "pc-label", text: item.label }) : null,
      el("span", { text: item.name })
    ]);
    return el("div", { class: "pc-row" }, [name, el("span", { class: "price", text: shekel(item.price) })]);
  }

  SITE.priceCards.forEach(function (card, i) {
    var note = el("article", { class: "note price-card reveal", style: "order:" + i });
    if (card.deco === "pin") note.appendChild(el("span", { class: "pin", "aria-hidden": "true" }));
    if (card.deco === "tape") note.appendChild(el("span", { class: "tape", "aria-hidden": "true" }));

    card.groups.forEach(function (g) {
      var group = el("div", { class: "pc-group" });
      if (g.title) {
        group.appendChild(el(g.big ? "h3" : "h4", { class: "pc-title" + (g.big ? " big" : ""), text: g.title }));
      }
      if (g.subtitle) group.appendChild(el("p", { class: "pc-subtitle", text: g.subtitle }));
      if (g.items) group.appendChild(el("div", { class: "pc-items" }, g.items.map(priceRow)));
      if (g.footnote) group.appendChild(el("p", { class: "pc-footnote", text: g.footnote }));
      note.appendChild(group);
    });
    cols[card.column === 2 ? 1 : 0].appendChild(note);
  });

  // "by ordering you agree to the order policy" line, shown next to order buttons
  function termsNote() {
    return el("p", { class: "terms-note" }, [
      "בהזמנה את/ה מסכים/ה ל",
      el("a", { href: "orders.html", text: "מדיניות ההזמנות והביטולים" })
    ]);
  }

  // ---------- Boxes ----------
  var boxList = document.getElementById("box-list");

  function callout(c) {
    var title = el("h4");
    if (c.highlight && c.title.indexOf(c.highlight) > -1) {
      var parts = c.title.split(c.highlight);
      title.appendChild(document.createTextNode(parts[0]));
      title.appendChild(el("em", { text: c.highlight }));
      title.appendChild(document.createTextNode(parts.slice(1).join(c.highlight)));
    } else {
      title.textContent = c.title;
    }
    return el("div", { class: "callout" }, [title, el("p", { text: c.text }), svgUse("arrow", "arrow")]);
  }

  SITE.boxes.forEach(function (box, i) {
    var titleId = "box-title-" + box.id;
    var label = el("figcaption", { class: "polaroid-label" }, [
      el("h3", { class: "box-name", id: titleId, text: box.name }),
      el("span", { class: "price", text: shekel(box.price) })
    ]);
    var fig = el("figure", { class: "box-photo" + (box.imageShape === "tall" ? " tall" : ""), style: "--rot:" + (i % 2 ? 1.5 : -1.5) + "deg" }, [
      el("div", { class: "polaroid" }, [
        i % 2 ? null : el("span", { class: "tape", "aria-hidden": "true" }),
        photo(box.name, box.image, box.name + " – " + box.contents.map(function (c) { return c.title; }).join(", "),
          box.imageShape === "tall" ? 900 : 1000, box.imageShape === "tall" ? 1200 : 1000),
        label
      ])
    ]);

    // first item on the left of the photo, the rest on the right (like the printed menu)
    var info = el("div", { class: "box-info" }, [
      el("div", { class: "box-side box-side-left" }, [callout(box.contents[0])]),
      el("div", { class: "box-side box-side-right" }, box.contents.slice(1).map(callout))
    ]);

    var orderBtn = el("a", {
      class: "btn btn-whatsapp btn-lg",
      href: waLink("היי! אשמח להזמין " + box.name + " (" + shekel(box.price) + ") 🎁"),
      target: "_blank",
      rel: "noopener",
      "aria-describedby": titleId
    }, [svgUse("i-whatsapp"), "להזמין את המארז"]);
    var buildBtn = el("a", {
      class: "btn btn-outline", href: "#builder", "data-size": box.id,
      "aria-controls": "builder", "aria-expanded": "false", "aria-describedby": titleId
    }, ["להרכבת המארז ", el("span", { "aria-hidden": "true", text: "←" })]);
    buildBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openBuilder(box.id);
    });

    boxList.appendChild(el("article", {
      class: "box-card box-" + box.id + " reveal",
      "aria-labelledby": titleId
    }, [fig, info, el("div", { class: "box-actions" }, [orderBtn, " ", buildBtn, termsNote()])]));
  });

  // ---------- Build your box ----------
  var form = document.getElementById("builder");
  var sizeWrap = document.getElementById("b-size");
  var crumblWrap = document.getElementById("b-crumbl");
  var crumblHint = document.getElementById("b-crumbl-hint");
  var cookieWrap = document.getElementById("b-cookies");
  var cakeWrap = document.getElementById("b-cake");
  var cakeLegend = document.getElementById("b-cake-legend");
  var totalEl = document.getElementById("b-total");

  function chip(type, name, value, text, small, checked) {
    var input = el("input", { type: type, name: name, value: value });
    input.checked = !!checked;
    return el("label", { class: "chip" }, [
      input,
      el("span", null, [text, small ? el("small", { text: small }) : null])
    ]);
  }

  SITE.boxes.forEach(function (box, i) {
    sizeWrap.appendChild(chip("radio", "size", box.id, box.name, shekel(box.price), i === 0));
  });
  SITE.cookieTypes.forEach(function (c) {
    cookieWrap.appendChild(chip("checkbox", "cookies", c, c));
  });

  function getBox() {
    var checked = form.querySelector('input[name="size"]:checked');
    var id = checked ? checked.value : SITE.boxes[0].id;
    return SITE.boxes.filter(function (b) { return b.id === id; })[0];
  }

  function renderBoxOptions() {
    var box = getBox();

    // crumbl cookie selects – keep previous choices where possible
    var prev = Array.prototype.map.call(crumblWrap.querySelectorAll("select"), function (s) { return s.value; });
    crumblWrap.textContent = "";
    crumblHint.textContent = "(" + box.crumblCount + " יחידות)";
    for (var k = 0; k < box.crumblCount; k++) {
      var sel = el("select", { "aria-label": "טעם קראמבל קוקיז " + (k + 1) });
      SITE.crumblFlavors.forEach(function (f) { sel.appendChild(el("option", { value: f, text: f })); });
      sel.value = prev[k] || SITE.crumblFlavors[k % SITE.crumblFlavors.length];
      crumblWrap.appendChild(el("label", null, [el("span", { text: "עוגייה " + (k + 1) }), sel]));
    }

    // cake options
    var prevCake = form.querySelector('input[name="cake"]:checked');
    prevCake = prevCake ? prevCake.value : null;
    cakeWrap.textContent = "";
    cakeLegend.textContent = box.id === "large" ? "עוגה משפחתית לבחירה" : "עוגה אישית לבחירה";
    var hasPrev = box.cakes.some(function (c) { return c.name === prevCake; });
    box.cakes.forEach(function (c, i) {
      cakeWrap.appendChild(chip("radio", "cake", c.name, c.name,
        c.extra ? "+" + shekel(c.extra) : null,
        hasPrev ? c.name === prevCake : i === 0));
    });
    updateTotal();
  }

  function getCake(box) {
    var checked = form.querySelector('input[name="cake"]:checked');
    var name = checked ? checked.value : box.cakes[0].name;
    return box.cakes.filter(function (c) { return c.name === name; })[0] || box.cakes[0];
  }

  function updateTotal() {
    var box = getBox();
    totalEl.textContent = shekel(box.price + getCake(box).extra);
  }

  // The builder stays hidden until a "להרכבת המארז" button is pressed.
  function openBuilder(id) {
    form.hidden = false;
    selectSize(id);
    document.querySelectorAll('[aria-controls="builder"]').forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    var calm = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("a11y-nomotion");
    form.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    form.querySelector('input[name="size"]:checked').focus({ preventScroll: true });
  }

  form.querySelector(".builder-close").addEventListener("click", function () {
    form.hidden = true;
    document.querySelectorAll('[aria-controls="builder"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    document.getElementById("boxes").scrollIntoView({ block: "start" });
  });

  function selectSize(id) {
    var input = form.querySelector('input[name="size"][value="' + id + '"]');
    if (input) { input.checked = true; renderBoxOptions(); }
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "size") renderBoxOptions();
    else updateTotal();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var box = getBox();
    var cake = getCake(box);
    var crumbl = Array.prototype.map.call(crumblWrap.querySelectorAll("select"), function (s) { return s.value; });
    var cookies = Array.prototype.map.call(form.querySelectorAll('input[name="cookies"]:checked'), function (c) { return c.value; });
    var name = document.getElementById("b-name").value.trim();
    var date = document.getElementById("b-date").value;
    var notes = document.getElementById("b-notes").value.trim();

    var lines = [
      "היי! אשמח להזמין " + box.name + " 🎁",
      "",
      "• קראמבל קוקיז: " + crumbl.join(", "),
      "• עוגיות: " + (cookies.length ? cookies.join(", ") : "לבחירתך"),
      "• " + (box.id === "large" ? "עוגה משפחתית" : "עוגה אישית") + ": " + cake.name +
        (cake.extra ? " (+" + shekel(cake.extra) + ")" : ""),
      "",
      "סה״כ: " + shekel(box.price + cake.extra)
    ];
    if (name) lines.push("שם: " + name);
    if (date) {
      var d = date.split("-");
      lines.push("לתאריך: " + d[2] + "/" + d[1] + "/" + d[0]);
    }
    if (notes) lines.push("הערות: " + notes);

    window.open(waLink(lines.join("\n")), "_blank", "noopener");
  });

  renderBoxOptions();

  document.getElementById("area-text").textContent = B.area;
})();
