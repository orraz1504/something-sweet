# משהו מתוק 🍰

האתר של "משהו מתוק" – קונדיטוריה ביתית באלון מורה.
אתר סטטי פשוט (HTML + CSS + JavaScript), בלי שרת ובלי עלות, שמתארח בחינם ב-GitHub Pages.

---

## מה יש בתיקייה

| קובץ / תיקייה | מה זה |
|---|---|
| `index.html` | מבנה הדף |
| `styles.css` | העיצוב |
| `script.js` | בונה את הדף מהנתונים (לא צריך לגעת) |
| **`data.js`** | **כל המוצרים, המחירים והמארזים – זה הקובץ שעורכים** |
| `orders.html` | מדיניות הזמנות וביטולים |
| `privacy.html` | מדיניות פרטיות |
| `accessibility.html` | הצהרת נגישות |
| `layout.js` | תחתית העמוד והפרטים המשותפים לכל העמודים (לא צריך לגעת) |
| `icons.svg`, `fonts/`, `fonts.css` | אייקונים וגופנים (מאוחסנים באתר עצמו) |
| `favicon.png` | האייקון בלשונית הדפדפן |
| `images/logo.webp` | הלוגו (המקור נמצא ב-`images/originals/logo.jpg`) |
| `images/products/` | תמונות המוצרים |
| `images/og-image.jpg` | התמונה שמופיעה כששולחים את הקישור בוואטסאפ |
| `images/originals/` | (אופציונלי) תמונות מקוריות להמרה |
| `optimize-images.sh` | (אופציונלי) סקריפט שממיר תמונות ל-WebP |
| `reference/` | תמונות התפריט המודפס (לא מוצגות באתר) |

---

## 1. העלאה ל-GitHub (פעם אחת)

1. נכנסים ל-[github.com](https://github.com) ופותחים חשבון (חינם).
2. לוחצים על **+** למעלה ← **New repository**.
3. נותנים שם, למשל `sweet`, מסמנים **Public**, ולוחצים **Create repository**.
4. בעמוד שנפתח לוחצים על הקישור **uploading an existing file**.
5. גוררים לחלון את **כל הקבצים והתיקיות** מתוך תיקיית האתר
   (`index.html`, `styles.css`, `script.js`, `data.js`, `favicon.png`, `apple-touch-icon.png`, `.nojekyll`, ואת התיקייה `images`).
   > הקובץ `.nojekyll` מוסתר במחשב. ב-Mac לוחצים `Cmd + Shift + .` ב-Finder כדי לראות אותו.
   > אם הוא לא עלה – זה לא נורא, האתר יעבוד גם בלעדיו.
6. למטה לוחצים **Commit changes**.

## 2. הפעלת GitHub Pages

1. ב-repository לוחצים על **Settings** (למעלה).
2. בתפריט בצד: **Pages**.
3. תחת **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` ובתיקייה `/ (root)` ← **Save**
4. אחרי דקה–שתיים יופיע למעלה הקישור לאתר, בערך כך:
   `https://שם-המשתמש.github.io/sweet/`

### חשוב – תצוגה יפה בוואטסאפ
כדי שהקישור ייראה יפה כששולחים אותו (עם תמונה), פותחים את `index.html`,
ומחליפים בשתי השורות האלה את `USERNAME` ו-`REPO` בשם המשתמש ובשם ה-repository:

```html
<meta property="og:url" content="https://USERNAME.github.io/REPO/">
<meta property="og:image" content="https://USERNAME.github.io/REPO/images/og-image.jpg">
```

---

## 3. שינוי מחירים ומוצרים (`data.js`)

אפשר לערוך ישירות באתר של GitHub, בלי להתקין כלום:

1. ב-repository לוחצים על הקובץ **`data.js`**.
2. לוחצים על סמל העיפרון ✏️ (Edit) מימין למעלה.
3. מוצאים את מה שרוצים לשנות. לדוגמה, כדי לשנות את מחיר הפס של "עוגות שוות" מ-100 ל-110:
   ```js
   { name: "פס", price: 100 },
   ```
   הופך ל:
   ```js
   { name: "פס", price: 110 },
   ```
4. לוחצים **Commit changes** (הכפתור הירוק) ← שוב **Commit changes**.
5. האתר מתעדכן לבד תוך דקה–שתיים. (אם לא רואים שינוי – מרעננים את הדף.)

**כללים קטנים שחשוב לשמור עליהם:**
- טקסט תמיד בתוך מירכאות: `"כך"`.
- מחיר הוא מספר בלי מירכאות ובלי ₪: `price: 45`.
- בסוף כל שורה יש פסיק `,`.
- להוסיף שורה? מעתיקים שורה קיימת ומדביקים מתחתיה.
- למחוק שורה? מוחקים את כל השורה מ-`{` ועד `},`.

**פרטים משפטיים (`legal` ב-`data.js`):** שם בעלת העסק, מספר עוסק, פטור/מורשה, תנאי ביטול, משלוחים ועוד.
הם מופיעים בתחתית כל עמוד ובעמודי המדיניות. כל שדה שעדיין ריק מסומן באתר בצהוב "להשלמה".

**דברים נוספים שאפשר לשנות ב-`data.js`:**
- טקסט "אודות" (`about`)
- טלפון ומספר וואטסאפ (`whatsapp`, `phoneDisplay`)
- אינסטגרם (`instagram` – שם המשתמש בלי @. ריק = לא מוצג)
- שעות פעילות ואזור משלוחים (`hours`, `area`)
- טעמי הקראמבל וסוגי העוגיות (`crumblFlavors`, `cookieTypes`)
- תכולת המארזים ומחיריהם (`boxes`)

> אם אחרי שינוי האתר "נשבר" (דף ריק) – כנראה חסר פסיק או מירכאה.
> ב-GitHub אפשר לראות את הגרסה הקודמת דרך **History** ולהחזיר אותה.

---

## 4. החלפת תמונות

התמונות נמצאות ב-`images/products/`, עם שמות קבועים באנגלית:

| מוצר | שם הקובץ |
|---|---|
| טריקולד | `tricolad.webp` |
| שמרים | `shmarim.webp` |
| גבינה פירורים | `cheesecake-crumble.webp` |
| לב גבינה | `cheese-heart.webp` |
| מוס ריבת חלב | `dulce-mousse.webp` |
| קראמבל קוקיז | `crumbl-cookies.webp` |
| אמסטרדם | `amsterdam.webp` |
| פחזניות | `profiteroles.webp` |
| בראוניז | `brownies.webp` |
| אלפחורס | `alfajores.webp` |
| שוקולד צ'יפס | `chocolate-chip.webp` |
| מארזים | `boxes.webp` |
| קאפקייקס ממותגים | `branded-cupcakes.webp` |
| טארטלטים | `tartlets.webp` |
| קינוחי כוסות | `cup-desserts.webp` |
| כדורי שוקולד | `chocolate-balls.webp` |
| מארז בינוני | `box-medium.webp` |
| מארז גדול | `box-large.webp` |
| התמונה הגדולה למעלה | `hero.webp` |

**איך מחליפים:**
1. ב-GitHub נכנסים לתיקייה `images/products`.
2. **Add file** ← **Upload files** ← גוררים את התמונה **עם השם המדויק מהטבלה** ← **Commit changes**.

**טיפים:**
- תמונות ריבועיות נראות הכי טוב (הן נחתכות לריבוע).
- כל עוד אין תמונה, מופיע במקומה כרטיס ורוד עם שם המוצר – זה בסדר.
- אין לכם WebP? אפשר להעלות גם JPG – רק לעדכן את שם הקובץ ב-`data.js`
  (למשל `image: "tricolad.jpg"`). התמונה ב-`index.html` למעלה היא `hero.webp`.
- חשוב שהתמונות יהיו קלות (עד ~300KB כל אחת) – כך האתר ייטען מהר בטלפון.
  אתר חינמי להקטנה והמרה: [squoosh.app](https://squoosh.app).

### המרה אוטומטית (אופציונלי, למי שנוח עם טרמינל ב-Mac)
1. שמים את התמונות המקוריות (JPG/PNG) ב-`images/originals/` עם השמות מהטבלה (למשל `tricolad.jpg`).
2. מתקינים פעם אחת: `brew install webp`
3. מריצים: `bash optimize-images.sh`
4. התמונות המוכנות (WebP, רוחב עד 1200px) יופיעו ב-`images/products/`.

---

## בדיקה במחשב (אופציונלי)
```bash
python3 -m http.server 8000
```
ואז פותחים בדפדפן: http://localhost:8000
