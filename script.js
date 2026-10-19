/* משהו מתוק – home page: products, product card, basket, box builder.
   Everything is built from data.js. No need to edit this file to change prices. */
(function () {
  "use strict";

  var B = SITE.business;
  var IMG_DIR = "images/products/";
  var el = Sweet.el, svgUse = Sweet.svgUse, waLink = Sweet.waLink, shekel = Sweet.shekel;
  var calm = function () {
    return matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("a11y-nomotion");
  };

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
    var img = el("img", { alt: alt, width: w || 600, height: h || w || 600, decoding: "async", loading: "lazy" });
    holder.appendChild(img);
    img.addEventListener("load", function () { holder.classList.add("has-img"); }, { once: true });
    img.addEventListener("error", function () { img.remove(); }, { once: true });
    img.src = IMG_DIR + file;
    return holder;
  }

  // "החל מ-100 ₪" / "מחיר בתיאום" / "130–230 ₪"
  function priceFrom(p) {
    if (p.box) {
      var prices = SITE.boxes.map(function (b) { return b.price; });
      return Math.min.apply(null, prices) + "–" + shekel(Math.max.apply(null, prices));
    }
    if (p.priceOnRequest || !p.options || !p.options.length) return "מחיר בתיאום";
    var min = Math.min.apply(null, p.options.map(function (o) { return o.price; }));
    return p.options.length > 1 ? "החל מ-" + shekel(min) : shekel(min);
  }

  function chip(type, name, value, text, small, checked) {
    var input = el("input", { type: type, name: name, value: value });
    input.checked = !!checked;
    return el("label", { class: "chip" }, [input, el("span", null, [text, small ? el("small", { text: small }) : null])]);
  }

  function openDialog(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  function closeDialog(d) { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }

  // ======================================================
  //   Basket (kept in this browser only, so it survives a refresh)
  // ======================================================
  var BASKET_KEY = "sweet-basket";
  var basket = [];
  try { basket = JSON.parse(localStorage.getItem(BASKET_KEY)) || []; } catch (e) { basket = []; }
  if (!Array.isArray(basket)) basket = [];

  function saveBasket() {
    try { localStorage.setItem(BASKET_KEY, JSON.stringify(basket)); } catch (e) { /* storage blocked */ }
    renderBasket();
  }

  // item: { name, option, flavor, price (per unit, or null = price on request), qty, details: [] }
  function addToBasket(item) {
    var key = JSON.stringify([item.name, item.option, item.flavor, item.details || [], item.price]);
    var same = basket.filter(function (b) { return b.key === key; })[0];
    if (same) same.qty = Math.min(99, same.qty + item.qty);
    else { item.key = key; basket.push(item); }
    saveBasket();
    bumpBasketButton();
    showToast("נוסף לסל: " + itemTitle(item));
  }

  function itemTitle(it) {
    return it.name + (it.option ? " – " + it.option : "") + (it.flavor ? " (" + it.flavor + ")" : "");
  }
  function basketCount() { return basket.length; }   // lines, not units (12 cup desserts = 1 item)
  function basketTotal() {
    return basket.reduce(function (sum, it) { return sum + (it.price != null ? it.price * it.qty : 0); }, 0);
  }
  function hasPriceOnRequest() { return basket.some(function (it) { return it.price == null; }); }
  // never show a "final" total while some prices are still to be agreed: "285 ₪ + בתיאום"
  function totalText() { return shekel(basketTotal()) + (hasPriceOnRequest() ? " + בתיאום" : ""); }

  // ---------- header button ----------
  var basketBtn = document.querySelector(".basket-btn");
  var countBadge = basketBtn.querySelector(".basket-count");
  var sumLabel = basketBtn.querySelector(".basket-sum");

  function updateBasketButton() {
    var n = basketCount();
    var total = basketTotal();
    countBadge.hidden = n === 0;
    countBadge.textContent = n;
    sumLabel.hidden = n === 0;
    sumLabel.textContent = totalText();
    basketBtn.setAttribute("aria-label", n
      ? "הסל שלי – " + n + (n === 1 ? " פריט" : " פריטים") + ", " + totalText()
      : "הסל שלי – ריק");
  }
  function bumpBasketButton() {
    if (calm()) return;
    basketBtn.classList.remove("bump");
    void basketBtn.offsetWidth;
    basketBtn.classList.add("bump");
  }

  // ---------- toast ----------
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(text) {
    document.getElementById("toast-text").textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 6000);
  }
  document.getElementById("toast-open").addEventListener("click", function () { toast.hidden = true; openBasket(); });

  // ---------- basket dialog ----------
  var basketDlg = document.getElementById("basket");
  var itemsList = document.getElementById("basket-items");

  function openBasket() { renderBasket(); openDialog(basketDlg); }
  basketBtn.addEventListener("click", openBasket);
  basketDlg.querySelector(".dlg-close").addEventListener("click", function () { closeDialog(basketDlg); });
  basketDlg.addEventListener("click", function (e) { if (e.target === basketDlg) closeDialog(basketDlg); });
  basketDlg.querySelectorAll("[data-close-basket]").forEach(function (a) {
    a.addEventListener("click", function () { closeDialog(basketDlg); });
  });

  function focusRow(idx, selector) {
    var row = itemsList.children[idx];
    var b = row && row.querySelector(selector);
    if (b) b.focus();
  }

  function renderBasket() {
    updateBasketButton();
    var empty = basket.length === 0;
    document.getElementById("basket-empty").hidden = !empty;
    document.getElementById("basket-full").hidden = empty;
    itemsList.textContent = "";

    basket.forEach(function (it, idx) {
      var title = itemTitle(it);
      var minus = el("button", { type: "button", class: "qty-btn qty-minus", "aria-label": "הפחתת כמות: " + title }, ["−"]);
      var plus = el("button", { type: "button", class: "qty-btn qty-plus", "aria-label": "הוספת כמות: " + title }, ["+"]);
      var remove = el("button", { type: "button", class: "basket-remove", "aria-label": "הסרה מהסל: " + title }, ["הסרה"]);
      minus.disabled = it.qty <= 1;
      minus.addEventListener("click", function () {
        if (it.qty > 1) { it.qty--; saveBasket(); focusRow(idx, it.qty > 1 ? ".qty-minus" : ".qty-plus"); }
      });
      plus.addEventListener("click", function () {
        if (it.qty < 99) { it.qty++; saveBasket(); focusRow(idx, ".qty-plus"); }
      });
      remove.addEventListener("click", function () {
        basket.splice(idx, 1);
        saveBasket();
        var rest = itemsList.querySelectorAll(".basket-remove");
        (rest[Math.min(idx, rest.length - 1)] || basketDlg.querySelector(".dlg-close")).focus();
      });

      itemsList.appendChild(el("li", { class: "basket-item" }, [
        el("div", { class: "bi-main" }, [
          el("p", { class: "bi-title", text: title }),
          it.details && it.details.length
            ? el("ul", { class: "bi-details" }, it.details.map(function (d) { return el("li", { text: d }); }))
            : null,
          el("p", { class: "bi-price", text: it.price != null ? shekel(it.price * it.qty) : "מחיר בתיאום" })
        ]),
        el("div", { class: "bi-actions" }, [
          el("div", { class: "qty", role: "group", "aria-label": "כמות: " + title }, [
            minus, el("span", { class: "qty-value", text: String(it.qty) }), plus
          ]),
          remove
        ])
      ]));
    });

    document.getElementById("basket-total").textContent = totalText();
    document.getElementById("basket-total-note").textContent = hasPriceOnRequest()
      ? "המחיר של פריטים \"בתיאום\" ייקבע לפי הכמות. המחיר הסופי יאושר בסיכום שתקבלו לפני ההכנה."
      : "המחיר הסופי יאושר בסיכום שתקבלו לפני ההכנה.";
  }

  document.getElementById("basket-clear").addEventListener("click", function () {
    if (!confirm("לרוקן את הסל?")) return;
    basket = [];
    saveBasket();
    basketDlg.querySelector(".dlg-close").focus();
  });

  // delivery address only when "משלוח" is chosen
  var basketForm = document.getElementById("basket-form");
  var addressWrap = document.getElementById("o-address-wrap");
  basketForm.addEventListener("change", function (e) {
    if (e.target.name === "o-delivery") addressWrap.hidden = e.target.value !== "משלוח";
  });

  // ---------- the WhatsApp message ----------
  function orderMessage() {
    var lines = ["היי! אשמח להזמין 🍰", "", "*ההזמנה שלי:*"];
    basket.forEach(function (it, i) {
      lines.push((i + 1) + ". " + itemTitle(it));
      (it.details || []).forEach(function (d) { lines.push("   • " + d); });
      lines.push("   כמות: " + it.qty + " · " + (it.price != null ? shekel(it.price * it.qty) : "מחיר בתיאום"));
    });
    lines.push("");
    lines.push("*סה״כ: " + totalText() + "*");
    if (hasPriceOnRequest()) lines.push("(המחיר של הפריטים בתיאום ייקבע יחד)");
    lines.push("");

    var name = document.getElementById("o-name").value.trim();
    var date = document.getElementById("o-date").value;
    var delivery = basketForm.querySelector('input[name="o-delivery"]:checked').value;
    var address = document.getElementById("o-address").value.trim();
    var notes = document.getElementById("o-notes").value.trim();
    if (name) lines.push("שם: " + name);
    if (date) { var d = date.split("-"); lines.push("לתאריך: " + d[2] + "/" + d[1] + "/" + d[0]); }
    lines.push("איסוף / משלוח: " + delivery + (delivery === "משלוח" && address ? " – " + address : ""));
    if (notes) lines.push("הערות: " + notes);
    return lines.join("\n");
  }

  basketForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!basket.length) return;
    window.open(waLink(orderMessage()), "_blank", "noopener");
  });

  // ======================================================
  //   Products gallery
  // ======================================================
  var ROT = [-2, 1.5, -1, 2, 1, -1.5, 2, -2, 1.5, -1, -2, 1, 2, -1.5, 1, -1];
  var gallery = document.getElementById("gallery");

  SITE.products.forEach(function (p, i) {
    var deco = null;
    if (i % 5 === 1) deco = el("span", { class: "tape", "aria-hidden": "true" });
    else if (i % 7 === 5) deco = el("span", { class: "pin", "aria-hidden": "true" });

    // the photo is part of the button, whose text already names the product -> alt=""
    var card = el("span", { class: "polaroid" }, [
      deco,
      photo(p.name, p.images[0], ""),
      el("span", { class: "polaroid-label" }, [
        el("span", { class: "pl-name", text: p.name }),
        el("span", { class: "pl-price", text: priceFrom(p) })
      ])
    ]);
    var btn = el("button", {
      type: "button",
      class: "gallery-btn",
      style: "--rot:" + ROT[i % ROT.length] + "deg",
      "aria-haspopup": "dialog"
    }, [card, el("span", { class: "sr-only", text: " – לפרטים ולהוספה לסל" })]);
    btn.addEventListener("click", function () { openProduct(SITE.products, i); });
    gallery.appendChild(el("li", { class: "reveal" }, [btn]));
  });

  // items without a photo
  var extrasList = document.getElementById("extras");
  SITE.extras.forEach(function (p, i) {
    var btn = el("button", { type: "button", class: "extra-btn", "aria-haspopup": "dialog" }, [
      el("span", { class: "extra-name", text: p.name }),
      p.flavors ? el("span", { class: "extra-sub", text: p.flavors.join(" · ") }) : null,
      el("span", { class: "extra-price", text: priceFrom(p) }),
      el("span", { class: "sr-only", text: " – לפרטים ולהוספה לסל" })
    ]);
    btn.addEventListener("click", function () { openProduct(SITE.extras, i); });
    extrasList.appendChild(el("li", { class: "reveal" }, [btn]));
  });

  // ======================================================
  //   Product card (dialog)
  // ======================================================
  var pd = document.getElementById("product");
  var pdForm = document.getElementById("pd-form");
  var pdMedia = pd.querySelector(".pd-media");
  var pdPh = pd.querySelector(".pd-ph");
  var pdThumbs = pd.querySelector(".pd-thumbs");
  var pdQty = document.getElementById("pd-qty");
  var pdList = SITE.products, pdIndex = 0;

  function showImage(p, idx) {
    pdPh.className = "ph pd-ph";
    pdPh.setAttribute("data-name", p.name);
    pdPh.textContent = "";
    var img = el("img", {
      alt: p.name + " – משהו מתוק" + (p.images.length > 1 ? " (תמונה " + (idx + 1) + " מתוך " + p.images.length + ")" : ""),
      width: 1000, height: 1000
    });
    pdPh.appendChild(img);
    img.src = IMG_DIR + p.images[idx];
    watchImage(img);
    pdThumbs.querySelectorAll("button").forEach(function (b, j) { b.setAttribute("aria-pressed", String(j === idx)); });
  }

  function currentOption(p) {
    if (!p.options || !p.options.length) return null;
    var c = pdForm.querySelector('input[name="pd-option"]:checked');
    return p.options[c ? +c.value : 0];
  }

  // the photo follows the chosen size / flavour (e.g. heart cheesecake, chocolate pie)
  function syncImage() {
    var p = pdList[pdIndex];
    if (!p.images || p.images.length < 2) return;
    var file = null;
    var o = currentOption(p);
    if (p.options && p.options.some(function (x) { return x.image; })) file = (o && o.image) || p.images[0];
    var fl = pdForm.querySelector('input[name="pd-flavor"]:checked');
    if (fl && p.flavorImages && p.flavorImages[fl.value]) file = p.flavorImages[fl.value];
    var idx = file ? p.images.indexOf(file) : -1;
    if (idx > -1) showImage(p, idx);
  }

  function qtyValue() { return Math.max(1, Math.min(99, parseInt(pdQty.value, 10) || 1)); }

  function updateAddButton() {
    var p = pdList[pdIndex];
    if (p.box) return;
    var o = currentOption(p);
    document.getElementById("pd-add-text").textContent = p.priceOnRequest || !o
      ? "הוספה לסל (מחיר בתיאום)"
      : "הוספה לסל · " + shekel(o.price * qtyValue());
  }

  function showProduct(list, i) {
    pdList = list;
    pdIndex = (i + list.length) % list.length;
    var p = list[pdIndex];
    var hasImages = !!(p.images && p.images.length);

    document.getElementById("pd-name").textContent = p.name;
    var note = document.getElementById("pd-note");
    note.textContent = p.box ? "בוחרים גודל, ובשלב הבא את התכולה." : (p.note || "");
    note.hidden = !note.textContent;

    // photos
    pdMedia.hidden = !hasImages;
    pdThumbs.textContent = "";
    pdThumbs.hidden = !(hasImages && p.images.length > 1);
    if (hasImages && p.images.length > 1) {
      p.images.forEach(function (f, j) {
        var t = el("button", { type: "button", class: "pd-thumb", "aria-label": "תמונה " + (j + 1) }, [
          el("img", { src: IMG_DIR + f, alt: "", width: 120, height: 120 })
        ]);
        t.addEventListener("click", function () { showImage(p, j); });
        pdThumbs.appendChild(t);
      });
    }
    if (hasImages) showImage(p, 0);
    pd.querySelectorAll(".lb-nav").forEach(function (b) { b.hidden = list.length < 2; });

    // options (sizes / quantities)
    var optWrap = document.getElementById("pd-options");
    optWrap.textContent = "";
    var hasOptions = !!(p.options && p.options.length);
    document.getElementById("pd-options-wrap").hidden = !hasOptions;
    if (hasOptions) {
      p.options.forEach(function (o, j) {
        var c = chip("radio", "pd-option", j, (o.label ? o.label + " · " : "") + o.name, shekel(o.price), j === 0);
        if (o.label) c.classList.add("chip-deal");
        optWrap.appendChild(c);
      });
    }

    // flavours
    var flWrap = document.getElementById("pd-flavors");
    flWrap.textContent = "";
    document.getElementById("pd-flavors-wrap").hidden = !p.flavors;
    if (p.flavors) {
      document.getElementById("pd-flavors-title").textContent = p.flavorsTitle || "טעם";
      p.flavors.forEach(function (f, j) { flWrap.appendChild(chip("radio", "pd-flavor", f, f, null, j === 0)); });
    }

    // boxes: pick a size, then build it below
    var boxesWrap = document.getElementById("pd-boxes");
    boxesWrap.textContent = "";
    boxesWrap.hidden = !p.box;
    document.getElementById("pd-qty-wrap").hidden = !!p.box;
    document.getElementById("pd-add").hidden = !!p.box;
    if (p.box) {
      SITE.boxes.forEach(function (box) {
        var b = el("button", { type: "button", class: "btn btn-primary" }, ["להרכבת " + box.name + " · " + shekel(box.price)]);
        b.addEventListener("click", function () { closeDialog(pd); openBuilder(box.id); });
        boxesWrap.appendChild(b);
      });
    }

    pdQty.value = 1;
    syncImage();
    updateAddButton();
  }

  function openProduct(list, i) {
    showProduct(list, i);
    openDialog(pd);
  }

  pdForm.addEventListener("change", function (e) {
    if (e.target.name === "pd-option" || e.target.name === "pd-flavor") syncImage();
    updateAddButton();
  });
  pdQty.addEventListener("input", updateAddButton);
  pdQty.addEventListener("blur", function () { pdQty.value = qtyValue(); updateAddButton(); });
  pdForm.querySelectorAll(".qty-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      pdQty.value = Math.max(1, Math.min(99, qtyValue() + (+b.getAttribute("data-step"))));
      updateAddButton();
    });
  });

  pdForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var p = pdList[pdIndex];
    if (p.box) return;
    var o = currentOption(p);
    var fl = pdForm.querySelector('input[name="pd-flavor"]:checked');
    addToBasket({
      name: p.name,
      option: o ? (o.label ? o.label + " " : "") + o.name : "",
      flavor: fl ? fl.value : "",
      price: p.priceOnRequest || !o ? null : o.price,
      qty: qtyValue(),
      details: []
    });
    closeDialog(pd);
  });

  pd.querySelector(".pd-close").addEventListener("click", function () { closeDialog(pd); });
  pd.querySelector(".lb-prev").addEventListener("click", function () { showProduct(pdList, pdIndex - 1); });
  pd.querySelector(".lb-next").addEventListener("click", function () { showProduct(pdList, pdIndex + 1); });
  pd.addEventListener("click", function (e) { if (e.target === pd) closeDialog(pd); });
  var touchX = null;
  pdMedia.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  pdMedia.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showProduct(pdList, pdIndex + (dx > 0 ? 1 : -1));   // RTL: swipe right = next
    touchX = null;
  });

  // ======================================================
  //   Boxes + builder
  // ======================================================
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

    var buildBtn = el("a", {
      class: "btn btn-primary btn-lg", href: "#builder", "data-size": box.id,
      "aria-controls": "builder", "aria-expanded": "false", "aria-describedby": titleId
    }, [svgUse("i-basket"), "בחירת תכולה והוספה לסל"]);
    buildBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openBuilder(box.id);
    });

    boxList.appendChild(el("article", {
      class: "box-card box-" + box.id + " reveal",
      "aria-labelledby": titleId
    }, [fig, info, el("div", { class: "box-actions" }, [buildBtn])]));
  });

  var form = document.getElementById("builder");
  var sizeWrap = document.getElementById("b-size");
  var crumblWrap = document.getElementById("b-crumbl");
  var crumblHint = document.getElementById("b-crumbl-hint");
  var cookieWrap = document.getElementById("b-cookies");
  var cakeWrap = document.getElementById("b-cake");
  var cakeLegend = document.getElementById("b-cake-legend");
  var totalEl = document.getElementById("b-total");

  SITE.boxes.forEach(function (box, i) {
    sizeWrap.appendChild(chip("radio", "size", box.id, box.name, shekel(box.price), i === 0));
  });
  var MAX_COOKIES = SITE.maxCookies || SITE.cookieTypes.length;
  var cookieHint = document.getElementById("b-cookies-hint");
  SITE.cookieTypes.forEach(function (c) {
    cookieWrap.appendChild(chip("checkbox", "cookies", c, c));
  });

  // at most MAX_COOKIES kinds: once the limit is reached the rest are greyed out
  function checkedCookies() {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="cookies"]:checked'));
  }
  function updateCookieLimit() {
    var n = checkedCookies().length;
    var full = n >= MAX_COOKIES;
    form.querySelectorAll('input[name="cookies"]').forEach(function (c) {
      c.disabled = full && !c.checked;
      c.closest(".chip").classList.toggle("chip-off", c.disabled);
    });
    cookieHint.textContent = full
      ? "(בחרתם " + n + " מתוך " + MAX_COOKIES + ")"
      : "(עד " + MAX_COOKIES + " סוגים)";
  }

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

  // The builder stays hidden until a box is chosen.
  function openBuilder(id) {
    form.hidden = false;
    selectSize(id);
    document.querySelectorAll('[aria-controls="builder"]').forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    form.scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
    form.querySelector('input[name="size"]:checked').focus({ preventScroll: true });
  }

  function closeBuilder() {
    form.hidden = true;
    document.querySelectorAll('[aria-controls="builder"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
  }

  form.querySelector(".builder-close").addEventListener("click", function () {
    closeBuilder();
    document.getElementById("boxes").scrollIntoView({ block: "start" });
  });

  function selectSize(id) {
    var input = form.querySelector('input[name="size"][value="' + id + '"]');
    if (input) { input.checked = true; renderBoxOptions(); }
  }

  form.addEventListener("change", function (e) {
    if (e.target.name === "size") renderBoxOptions();
    else if (e.target.name === "cookies") updateCookieLimit();
    else updateTotal();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var box = getBox();
    var cake = getCake(box);
    var crumbl = Array.prototype.map.call(crumblWrap.querySelectorAll("select"), function (s) { return s.value; });
    var cookies = checkedCookies().slice(0, MAX_COOKIES).map(function (c) { return c.value; });
    var notes = document.getElementById("b-notes").value.trim();

    var details = [
      "קראמבל קוקיז: " + crumbl.join(", "),
      "עוגיות: " + (cookies.length ? cookies.join(", ") : "לבחירתך"),
      (box.id === "large" ? "עוגה משפחתית" : "עוגה אישית") + ": " + cake.name + (cake.extra ? " (+" + shekel(cake.extra) + ")" : "")
    ];
    if (notes) details.push("ברכה / הערות: " + notes);

    addToBasket({ name: box.name, option: "", flavor: "", price: box.price + cake.extra, qty: 1, details: details });
    document.getElementById("b-notes").value = "";
    checkedCookies().forEach(function (c) { c.checked = false; });
    updateCookieLimit();
    closeBuilder();
    document.getElementById("boxes").scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
  });

  renderBoxOptions();
  updateCookieLimit();
  renderBasket();

  // ---------- About ----------
  var aboutBox = document.getElementById("about-text");
  B.about.forEach(function (text) { aboutBox.appendChild(el("p", { text: text })); });

  document.getElementById("area-text").textContent = B.area;
})();
