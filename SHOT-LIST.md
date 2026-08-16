# Jumbo King Burger — photo shot list

Every slot on the site is already sized and waiting. Shoot these, name the files
exactly as listed, drop them in `assets/img/`, then fill in the matching line in
`assets/data.js` → `PHOTOS`. Nothing in the layout moves when you do.

---

## Setup (applies to everything)

| | |
|---|---|
| **Background** | Warm off-white or cream seamless. Matches the site's `#FDFBF6`. |
| **Light** | One large softbox at 45°, white bounce card opposite. Slight backlight for steam/gloss. |
| **Angle** | Burgers at **15–25° above the plate** — high enough to read the stack, low enough to see the char. |
| **Lens** | 50–100mm. Avoid wide — it bloats the bun. |
| **Format** | JPG, sRGB, longest edge 2000px, quality 80. Under 400 KB each. |
| **Do** | Visible grill marks. Melted cheese caught mid-drip. Sesame seeds sharp. |
| **Don't** | Props that date the shot. Heavy filters. Anything blocking the patty edge. |

---

## 1. Hero — `hero.jpg`  ·  **4:3**

The one that has to sell. Group shot: a Jumbo King Double centre, fries and a
fountain cup behind. Slight overhead tilt. Leave breathing room on all four
edges — this crops on mobile.

---

## 2. Category panels — **4:5 portrait**

These are the big split panels down the home page. Vertical composition, single
subject, plenty of clean space.

| File | Subject |
|---|---|
| `beef.jpg` | Jumbo King Double, three-quarter hero angle, cheese drip visible |
| `chicken.jpg` | Crispy Chicken, bun slightly offset so the crust shows |
| `breakfast.jpg` | Croissant sausage egg & cheese, hash browns beside it |
| `sides.jpg` | Fries, onion rings and tossed wings together — colour contrast |
| `sweets.jpg` | A shake, a sundae, a cinnamon roll. Tallest object left of centre |

---

## 3. Signature items — **1:1 square**

Nine cards on the menu page. Shoot all nine **from the same angle, same
distance, same light** — the grid only looks right if they match. Same plate or
paper, same position, one setup, nine swaps.

`jumbo-king-burger.jpg` · `jumbo-king-double.jpg` · `jumbo-loaded-king.jpg` ·
`jumbo-king-jr.jpg` · `grilled-chicken.jpg` · `crispy-chicken.jpg` ·
`spicy-chicken.jpg` · `chicken-wrap.jpg` · `fish-sandwich.jpg`

> The wrap is the odd one — shoot it cut on the diagonal, cut face toward camera.

---

## 4. Optional — `storefront.jpg` · **16:9**

Exterior in daylight, sign legible, door in frame. Not wired up yet; say the
word and it goes on the contact page.

---

## Wiring the photos in

Create `assets/img/`, drop the files in, then edit `assets/data.js`:

```js
const PHOTOS = {
  hero: "assets/img/hero.jpg",
  beef: "assets/img/beef.jpg",
  // …and so on
};
```

Any slot left as `""` keeps showing its placeholder with the filename on it, so
you can go live with a partial set and fill the rest in later.

---

## Two things still outstanding

1. **Mozzarella Planks has no price** on the printed board — it renders as `—`.
   Add it in `assets/data.js` → `BLOCKS` → `sides`.
2. **Store details** — address, phone, Instagram, and your pickup/delivery
   ordering URLs all go in `assets/data.js` → `SITE`.
