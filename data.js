---
---
{%- include catalog.html -%}
{%- assign S = site.data.settings -%}
{%- assign BB = site.data.box_builder -%}
/*
 * משהו מתוק – הנתונים של החלק האינטראקטיבי (כרטיס מוצר, סל, הרכבת מארז).
 * הקובץ נבנה אוטומטית מתוכן האתר (_products, _boxes, _data) – לא עורכים אותו.
 * את התוכן משנים ב-Pages CMS (ראו מדריך-עריכה.md).
 */
const SITE = {
  business: {
    name: {{ S.business.name | jsonify }},
    whatsapp: {{ site.data.contact.whatsapp | strip | jsonify }}
  },

  // one list per category, in the same order as on the page
  groups: [
    {%- for list in catalog_lists %}
    [
      {%- for p in list %}
      {%- include product-images.html product=p %}
      {%- comment %} photos of a size / flavour join the list, so choosing it can show its photo {% endcomment %}
      {%- assign p_extra = "" | split: "" %}
      {%- if p.variations %}{% assign p_extra = p_extra | concat: p.variations %}{% endif %}
      {%- if p.flavors %}{% assign p_extra = p_extra | concat: p.flavors %}{% endif %}
      {%- for x in p_extra %}
      {%- capture x_img %}{% include src.html src=x.image %}{% endcapture %}
      {%- if x_img != "" %}{% unless pimgs contains x_img %}{% assign pimgs = pimgs | push: x_img %}{% endunless %}{% endif %}
      {%- endfor %}
      {%- if p.flavors_from_crumbl %}{% assign p_flavors = BB.crumbl_flavors %}{% else %}{% assign p_flavors = p.flavors | map: "name" | compact %}{% endif %}
      {
        name: {{ p.name | jsonify }},
        images: {{ pimgs | jsonify }},
        price: {% if p.price != nil and p.price != "" %}{{ p.price | plus: 0 }}{% else %}null{% endif %},
        options: [
          {%- for o in p.variations %}
          {%- capture o_img %}{% include src.html src=o.image %}{% endcapture %}
          { name: {{ o.name | default: "" | jsonify }}, price: {% if o.price != nil and o.price != "" %}{{ o.price | plus: 0 }}{% else %}null{% endif %}, label: {{ o.label | default: "" | jsonify }}, note: {{ o.note | default: "" | jsonify }}, image: {{ o_img | jsonify }} }{% unless forloop.last %},{% endunless %}
          {%- endfor %}
        ],
        flavorsTitle: {{ p.flavors_title | default: "טעם" | jsonify }},
        flavors: {% if p_flavors.size > 0 %}{{ p_flavors | jsonify }}{% else %}null{% endif %},
        flavorImages: {
          {%- for f in p.flavors %}{% if f.image != nil and f.image != "" %}
          {%- capture f_img %}{% include src.html src=f.image %}{% endcapture %}
          {{ f.name | jsonify }}: {{ f_img | jsonify }},
          {%- endif %}{% endfor %}
        },
        note: {{ p.description | default: "" | jsonify }},
        box: {% if p.box_card %}true{% else %}false{% endif %}
      }{% unless forloop.last %},{% endunless %}
      {%- endfor %}
    ]{% unless forloop.last %},{% endunless %}
    {%- endfor %}
  ],

  // "הרכיבו מארז"
  crumblFlavors: {% if BB.crumbl_flavors %}{{ BB.crumbl_flavors | jsonify }}{% else %}[]{% endif %},
  cookieTypes: {% if BB.cookie_types %}{{ BB.cookie_types | jsonify }}{% else %}[]{% endif %},
  maxCookies: {{ BB.max_cookies | default: 0 | plus: 0 }},
  boxes: [
    {%- for box in catalog_boxes %}
    {
      id: {{ box.slug | jsonify }},
      name: {{ box.name | jsonify }},
      price: {{ box.price | default: 0 | plus: 0 }},
      crumblCount: {{ box.crumbl_count | default: 0 | plus: 0 }},
      cookies: {% if box.cookie_choice == false %}false{% else %}true{% endif %},
      cakeTitle: {{ box.cake_title | default: "עוגה" | jsonify }},
      cakes: [
        {%- for c in box.cakes %}
        { name: {{ c.name | jsonify }}, extra: {{ c.extra | default: 0 | plus: 0 }} }{% unless forloop.last %},{% endunless %}
        {%- endfor %}
      ]
    }{% unless forloop.last %},{% endunless %}
    {%- endfor %}
  ]
};
