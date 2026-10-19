/* משהו מתוק – home page: product card, basket, box builder.
   The product and box cards are written into index.html by Jekyll; this file adds the
   interactive parts, using the same data (SITE, written into the page from _includes/site-data.js). No need to edit it to change prices. */
(function () {
  "use strict";

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
  //   Product cards (rendered by Jekyll)
  // ======================================================
  document.querySelectorAll(".ph img").forEach(watchImage);

  document.querySelectorAll("[data-group][data-index]").forEach(function (btn) {
    var list = SITE.groups[+btn.getAttribute("data-group")];
    var i = +btn.getAttribute("data-index");
    if (!list || !list[i]) return;
    btn.addEventListener("click", function () { openProduct(list, i); });
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
  var pdList = SITE.groups[0] || [], pdIndex = 0;

  function showImage(p, idx) {
    pdPh.className = "ph pd-ph";
    pdPh.setAttribute("data-name", p.name);
    pdPh.textContent = "";
    var img = el("img", {
      alt: p.name + " – משהו מתוק" + (p.images.length > 1 ? " (תמונה " + (idx + 1) + " מתוך " + p.images.length + ")" : ""),
      width: 1000, height: 1000
    });
    pdPh.appendChild(img);
    img.src = p.images[idx];
    watchImage(img);
    pdThumbs.querySelectorAll("button").forEach(function (b, j) { b.setAttribute("aria-pressed", String(j === idx)); });
  }

  // the chosen size; a product with only a base price acts as one nameless option
  function currentOption(p) {
    if (!p.options || !p.options.length) return p.price != null ? { name: "", price: p.price } : null;
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
    document.getElementById("pd-add-text").textContent = !o || o.price == null
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
          el("img", { src: f, alt: "", width: 120, height: 120, loading: "lazy" })
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
        var small = (o.price != null ? shekel(o.price) : "בתיאום") + (o.note ? " · " + o.note : "");
        var c = chip("radio", "pd-option", j, (o.label ? o.label + " · " : "") + o.name, small, j === 0);
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
      price: o && o.price != null ? o.price : null,
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
  document.querySelectorAll("#box-list [data-size]").forEach(function (buildBtn) {
    buildBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openBuilder(buildBtn.getAttribute("data-size"));
    });
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

  function hasCookies(box) { return box.cookies && SITE.cookieTypes.length > 0; }

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
    var crumblCount = SITE.crumblFlavors.length ? box.crumblCount : 0;
    // a part of the box that is empty in the settings is left out of the form
    crumblWrap.closest("fieldset").hidden = !crumblCount;
    cookieWrap.closest("fieldset").hidden = !hasCookies(box);
    cakeWrap.closest("fieldset").hidden = !box.cakes.length;
    for (var k = 0; k < crumblCount; k++) {
      var sel = el("select", { "aria-label": "טעם קראמבל קוקיז " + (k + 1) });
      SITE.crumblFlavors.forEach(function (f) { sel.appendChild(el("option", { value: f, text: f })); });
      sel.value = prev[k] || SITE.crumblFlavors[k % SITE.crumblFlavors.length];
      crumblWrap.appendChild(el("label", null, [el("span", { text: "עוגייה " + (k + 1) }), sel]));
    }

    // cake options
    var prevCake = form.querySelector('input[name="cake"]:checked');
    prevCake = prevCake ? prevCake.value : null;
    cakeWrap.textContent = "";
    cakeLegend.textContent = box.cakeTitle + " לבחירה";
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
    var name = checked ? checked.value : (box.cakes[0] || {}).name;
    return box.cakes.filter(function (c) { return c.name === name; })[0] || box.cakes[0] || null;
  }

  function updateTotal() {
    var box = getBox();
    var cake = getCake(box);
    totalEl.textContent = shekel(box.price + (cake ? cake.extra : 0));
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
      crumbl.length ? "קראמבל קוקיז: " + crumbl.join(", ") : null,
      hasCookies(box) ? "עוגיות: " + (cookies.length ? cookies.join(", ") : "לבחירתך") : null,
      cake ? box.cakeTitle + ": " + cake.name + (cake.extra ? " (+" + shekel(cake.extra) + ")" : "") : null
    ].filter(Boolean);
    if (notes) details.push("ברכה / הערות: " + notes);

    addToBasket({ name: box.name, option: "", flavor: "", price: box.price + (cake ? cake.extra : 0), qty: 1, details: details });
    document.getElementById("b-notes").value = "";
    checkedCookies().forEach(function (c) { c.checked = false; });
    updateCookieLimit();
    closeBuilder();
    document.getElementById("boxes").scrollIntoView({ behavior: calm() ? "auto" : "smooth", block: "start" });
  });

  if (SITE.boxes.length) renderBoxOptions();
  updateCookieLimit();
  renderBasket();
})();
