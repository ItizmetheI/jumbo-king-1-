/* ══════════════════════════════════════════════════════════════════
   Jumbo King Burger — all editable content lives in this one file.
   Change a price here and it updates on every page.
   ══════════════════════════════════════════════════════════════════ */

/* ─── 1. YOUR DETAILS ─────────────────────────────────────────── */
const SITE = {
  url: "https://jumbo-king-1.ahmedbarkat1067.workers.dev", // canonical origin, no trailing slash
  address: "12-14 Spruce St, Paterson, NJ 07501",
  locality: "Paterson",
  region: "NJ",
  postalCode: "07501",
  phone: "+19732471113",
  phoneLabel: "(973) 247-1113",
  instagram: "",               // "jumbokingburger"
  orderPickup: "https://order.toasttab.com/online/jumbo-king-burger-paterson",
  orderDelivery: { "Uber Eats": "", "DoorDash": "", "Grubhub": "" }
};

/* ─── 2. PHOTOS ───────────────────────────────────────────────────
   Drop image paths in after the shoot. Every empty value renders a
   sized placeholder showing the filename and ratio it expects, so
   nothing shifts when the real photos land. See SHOT-LIST.md.
   ─────────────────────────────────────────────────────────────── */
const PHOTOS = {
  hero: "/assets/img/hero.jpg",            // 4:3  — group shot: burger, fries, drink
  beef: "/assets/img/beef.jpg",            // 4:5  — Jumbo King Double, hero angle
  chicken: "/assets/img/chicken.jpg",         // 4:5  — Crispy Chicken, three-quarter
  breakfast: "/assets/img/breakfast.jpg",       // 4:5  — croissant sandwich + hash browns
  sides: "/assets/img/sides.jpg",           // 4:5  — fries, rings and wings together
  sweets: "/assets/img/sweets.jpg",          // 4:5  — shake + sundae + cinnamon roll
  storefront: "",      // 16:9 — exterior, daylight
  // Signature items — all 1:1 square
  "jumbo-king-burger": "/assets/img/jumbo-king-burger.jpg",
  "jumbo-king-double": "/assets/img/jumbo-king-double.jpg",
  "jumbo-loaded-king": "/assets/img/jumbo-loaded-king.jpg",
  "jumbo-king-jr": "/assets/img/jumbo-king-jr.jpg",
  "grilled-chicken": "/assets/img/grilled-chicken.jpg",
  "crispy-chicken": "/assets/img/crispy-chicken.jpg",
  "spicy-chicken": "/assets/img/spicy-chicken.jpg",
  "chicken-wrap": "/assets/img/chicken-wrap.jpg",
  "fish-sandwich": "/assets/img/fish-sandwich.jpg"
};

/* ─── 3. HOURS ────────────────────────────────────────────────────
   Minutes from midnight. A close value over 1440 runs past midnight,
   e.g. 25*60 = closes at 1 AM the next day.
   ─────────────────────────────────────────────────────────────── */
const HOURS = [
  { day: "Sunday",    open: 7 * 60, close: 24 * 60 },
  { day: "Monday",    open: 7 * 60, close: 24 * 60 },
  { day: "Tuesday",   open: 7 * 60, close: 24 * 60 },
  { day: "Wednesday", open: 7 * 60, close: 24 * 60 },
  { day: "Thursday",  open: 7 * 60, close: 24 * 60 },
  { day: "Friday",    open: 7 * 60, close: 24 * 60 },
  { day: "Saturday",  open: 7 * 60, close: 24 * 60 }
];

/* ─── 4. MENU ─────────────────────────────────────────────────── */
const SIGNATURE = [
  { n:1, key:"jumbo-king-burger", name:"Jumbo King Burger", single:7.99, vm:10.99,
    desc:"Sesame bun, mayonnaise, shredded lettuce, tomato, onions, pickle, ketchup and a 5.3 oz flame-grilled patty.",
    art:["bunTop","lettuce","tomato","onion","cheese","patty","bunBot"] },
  { n:2, key:"jumbo-king-double", name:"Jumbo King Double", single:9.99, vm:12.99,
    desc:"Sesame bun, mayonnaise, shredded lettuce, tomato, onion, pickle, ketchup and two 5.3 oz flame-grilled patties.",
    art:["bunTop","lettuce","tomato","onion","cheese","patty","cheese","patty","bunBot"] },
  { n:3, key:"jumbo-loaded-king", name:"Jumbo Loaded King", single:9.99, vm:12.99,
    desc:"Sesame bun, mayonnaise, shredded lettuce, tomato, onions, pickle, ketchup, a 5.3 oz patty, bacon and cheese.",
    art:["bunTop","onionRing","bacon","cheese","patty","cheese","patty","bunBot"] },
  { n:4, key:"jumbo-king-jr",     name:"Jumbo King Jr.",    single:3.99, vm:8.99,
    desc:"Sesame bun, a 2 oz flame-grilled patty, pickle and ketchup.",
    art:["bunTopPlain","cheese","pattyJr","bunBot"] },
  { n:5, key:"grilled-chicken",   name:"Grilled Chicken",   single:6.99, vm:10.99,
    desc:"Potato bun, grilled chicken breast, mayonnaise, lettuce and tomato.",
    art:["bunTop","lettuce","tomato","chkGrill","bunBot"] },
  { n:6, key:"crispy-chicken",    name:"Crispy Chicken",    single:6.99, vm:10.99,
    desc:"Potato bun, crispy chicken fillet, mayonnaise, shredded lettuce and tomato.",
    art:["bunTop","lettuce","chkCrisp","bunBot"] },
  { n:7, key:"spicy-chicken",     name:"Spicy Chicken",     single:6.99, vm:10.99,
    desc:"Potato bun, hot spicy sauce, lettuce, tomato and a 4.2 oz crispy chicken fillet.",
    art:["bunTop","lettuce","chkSpicy","bunBot"] },
  { n:8, key:"chicken-wrap",      name:"Chicken Wrap Sandwich", single:6.99, vm:10.99, icon:"wrap",
    desc:"Large tortilla, chopped crispy chicken, shredded lettuce, two slices of tomato and ranch dressing." },
  { n:9, key:"fish-sandwich",     name:"Fish Sandwich",     single:6.29, vm:9.99,
    desc:"Potato bun, tartar sauce, lettuce and a crispy fish fillet.",
    art:["bunTopPlain","lettuce","cheese","fish","bunBot"] }
];

const SHOWCASE = [
  { key:"beef", title:"Beef",
    body:"From the Jumbo King Burger to the Loaded King — quarter-pound patties, flame-grilled to order, stacked as high as you want them.",
    alt:"Flame-grilled beef burgers including the Jumbo King Burger and Loaded King",
    cta:"See the burgers", href:"/menu#signature" },
  { key:"chicken", title:"Chicken",
    body:"Grilled, crispy or spicy. Plus the wrap sandwich for when you want the same thing with one hand free.",
    alt:"Grilled and crispy chicken sandwiches with a chicken wrap",
    cta:"See the chicken", href:"/menu#signature" },
  { key:"breakfast", title:"Breakfast",
    body:"Croissants, biscuits, burritos and pancakes. Sausage, bacon or ham — every morning, no shortcuts.",
    alt:"Breakfast croissants, biscuits, burritos and pancakes with sausage, bacon or ham",
    cta:"See breakfast", href:"/menu#breakfast" },
  { key:"sides", title:"Sides",
    body:"Fries and onion rings in three sizes, nuggets, mozzarella planks, and wings tossed in four sauces.",
    alt:"Fries, onion rings, chicken nuggets, mozzarella planks and sauced wings",
    cta:"See the sides", href:"/menu#sides" },
  { key:"sweets", title:"Shakes &amp; sweets",
    body:"Ice cream shakes in five flavors, sundaes, cones, cookies and cinnamon rolls fresh out.",
    alt:"Ice cream shakes, sundaes, cones, cookies and cinnamon rolls",
    cta:"See desserts", href:"/menu#desserts" }
];

const BLOCKS = [
  { id:"sides", title:"Sides", items:[
    { name:"Nuggets", multi:[["4 pc",1.99],["10 pc",4.99]] },
    { name:"Mozzarella Planks", price:2.99 },
    { name:"Fries", multi:[["Sm",2.99],["Md",3.49],["Lg",3.99]] },
    { name:"Onion Rings", multi:[["Sm",2.99],["Md",3.49],["Lg",3.99]] },
    { name:"Tossed Wings", note:"BBQ · Buffalo · Nashville Hot · Honey Mustard",
      multi:[["Boneless 8 pc",5.99],["Bone-in 5 pc",7.99]] }
  ], note:"Wing sauces: BBQ, Buffalo, Nashville Hot, Honey Mustard." },

  { id:"deals", title:"Daily deals", lede:"Everyday value", items:[
    { name:"Hamburger", note:"Pickles &amp; ketchup", price:1.99 },
    { name:"Cheeseburger", note:"Pickles &amp; ketchup", price:2.29 },
    { name:"Bacon Cheeseburger", price:2.49 },
    { name:"Crispy Jr.", price:2.49 },
    { name:"Spicy Crispy Jr.", price:2.49 },
    { name:"Hot Dog", price:1.99 }
  ]},

  { id:"kids", title:"Kids meals", lede:"Choice of apple juice, orange juice or milk", items:[
    { name:"Hamburger", note:"Pickles &amp; ketchup", price:4.49 },
    { name:"Cheeseburger", note:"Pickles &amp; ketchup", price:4.99 },
    { name:"Mac &amp; Cheese", price:5.99 },
    { name:"Chicken Nuggets", multi:[["4 pc",2.29],["8 pc",3.79]] }
  ]},

  { id:"drinks", title:"Beverages", items:[
    { name:"Fountain Drink", multi:[["Sm",2.99],["Md",3.49],["Lg",3.99]] },
    { name:"Slushie", multi:[["Sm",1.99],["Md",2.49],["Lg",2.99]] },
    { name:"Iced Coffee", note:"Plain · Mocha · Vanilla", multi:[["Sm",1.99],["Md",2.49],["Lg",2.99]] },
    { name:"Ice Cream Shakes", note:"Vanilla · Chocolate · Strawberry · Oreo · KitKat",
      multi:[["Sm",3.99],["Md",4.49],["Lg",4.99]] },
    { name:"Hot Coffee / Tea", multi:[["Sm",1.29],["Md",1.99],["Lg",2.29]] },
    { name:"Orange Juice", price:2.49 },
    { name:"Apple Juice", price:1.99 },
    { name:"Bottled Water", price:1.99 }
  ]},

  { id:"desserts", title:"Desserts &amp; sweets", items:[
    { name:"Cone / Cup", price:1.99 },
    { name:"Sundae", note:"Strawberry · Chocolate · KitKat · Oreo", price:2.99 },
    { name:"Cookie", price:1.00 },
    { name:"Cinnamon Roll", multi:[["1 pc",2.49],["2 pc",3.99]] }
  ]},

  { id:"breakfast", title:"Breakfast", lede:"Single or with combo", items:[
    { name:"1. Croissant Sausage, Egg &amp; Cheese", multi:[["Single",4.49],["Combo",7.99]] },
    { name:"2. Croissant Bacon, Egg &amp; Cheese or Ham", multi:[["Single",5.49],["Combo",7.99]] },
    { name:"3. Biscuit Sausage, Egg &amp; Cheese", multi:[["Single",5.49],["Combo",7.99]] },
    { name:"4. Biscuit Bacon, Egg &amp; Cheese or Ham", multi:[["Single",5.49],["Combo",7.99]] },
    { name:"5. Breakfast Burrito", note:"Sausage or bacon", multi:[["Single",5.49],["Combo",7.99]] },
    { name:"6. Pancakes", note:"Sausage, Bacon or Ham", multi:[["Single",4.99],["Combo",7.99]] }
  ]},

  { id:"bvalue", title:"Breakfast value items", items:[
    { name:"Hash Browns", price:1.99 },
    { name:"Cinnamon Roll", price:2.49 },
    { name:"Plain Pancakes", price:1.99 },
    { name:"Croissant Egg &amp; Cheese", price:2.49 },
    { name:"Biscuit Egg &amp; Cheese", price:2.49 }
  ]}
];

/* ─── 4b. LIST THUMBNAILS ─────────────────────────────────────────
   Small square beside each priced line. Keyed by block id, then by the
   item name exactly as written above. Leave a name out and that line
   simply renders without a picture — nothing else shifts.
   ─────────────────────────────────────────────────────────────── */
const THUMBS = {
  sides: {
    "Nuggets":"side-nuggets", "Mozzarella Planks":"side-mozzarella",
    "Fries":"side-fries-rings", "Onion Rings":"side-fries-rings", "Tossed Wings":"side-wings"
  },
  deals: {
    "Hamburger":"deal-hamburger", "Cheeseburger":"deal-cheeseburger",
    "Bacon Cheeseburger":"deal-bacon-cheeseburger", "Crispy Jr.":"deal-crispy-jr",
    "Spicy Crispy Jr.":"deal-spicy-crispy-jr", "Hot Dog":"deal-hot-dog"
  },
  kids: {
    "Hamburger":"kids-hamburger", "Cheeseburger":"kids-cheeseburger",
    "Mac &amp; Cheese":"kids-mac-cheese", "Chicken Nuggets":"kids-nuggets"
  },
  drinks: {
    "Fountain Drink":"drink-fountain", "Slushie":"drink-slushie", "Iced Coffee":"drink-iced-coffee",
    "Ice Cream Shakes":"drink-shake", "Hot Coffee / Tea":"drink-hot-coffee",
    "Orange Juice":"drink-orange-juice", "Apple Juice":"drink-apple-juice", "Bottled Water":"drink-water"
  },
  desserts: {
    "Cone / Cup":"sweet-cone-cup", "Sundae":"sweet-sundae",
    "Cookie":"sweet-cookie", "Cinnamon Roll":"sweet-cinnamon-roll"
  },
  breakfast: {
    "1. Croissant Sausage, Egg &amp; Cheese":"bk-1-croissant-sausage",
    "2. Croissant Bacon, Egg &amp; Cheese or Ham":"bk-2-croissant-bacon",
    "3. Biscuit Sausage, Egg &amp; Cheese":"bk-3-biscuit-sausage",
    "4. Biscuit Bacon, Egg &amp; Cheese or Ham":"bk-4-biscuit-bacon",
    "5. Breakfast Burrito":"bk-5-burrito", "6. Pancakes":"bk-6-pancakes"
  },
  bvalue: {
    "Hash Browns":"bv-hash-browns", "Cinnamon Roll":"bv-cinnamon-roll",
    "Plain Pancakes":"bv-plain-pancakes", "Croissant Egg &amp; Cheese":"bv-croissant-ec",
    "Biscuit Egg &amp; Cheese":"bv-biscuit-ec"
  }
};
BLOCKS.forEach(b => b.items.forEach(it => {
  const file = (THUMBS[b.id] || {})[it.name];
  if (file) it.img = `/assets/img/thumbs/${file}.jpg`;
}));

const REVIEWS = [
  { text:"You can actually taste the flame on the patty. The Loaded King is a two-hands-and-a-napkin situation.", who:"Placeholder review" },
  { text:"Value meal for $3.79 more is the move. Fries were hot and the fountain drink was bottomless.", who:"Placeholder review" },
  { text:"Came for breakfast, stayed for the KitKat shake. The breakfast burrito is genuinely huge.", who:"Placeholder review" },
  { text:"Daily deals are unbeatable. Cheeseburger for $2.29 and it's a real burger, not a slider.", who:"Placeholder review" },
  { text:"Nashville hot tossed wings and mozzarella planks. Ordered for the office and everyone asked where it was from.", who:"Placeholder review" }
];

/* ─── 5. PLACEHOLDER ART ──────────────────────────────────────────
   Sandwiches are composed from stacked ingredient layers, so a new
   item is a list of ingredients rather than a new drawing. These only
   show until a real photo lands in PHOTOS above.
   ─────────────────────────────────────────────────────────────── */
const grillMarks = y => {
  let d = "";
  for (let i = 0; i < 4; i++) d += `M${52 + i * 42} ${y + 6}l20 9`;
  return `<g stroke="#331B0F" stroke-width="4" stroke-linecap="round" opacity=".55"><path d="${d}"/></g>`;
};
const sesame = y => `<g fill="#FBF2DF">
  <ellipse cx="82" cy="${y+26}" rx="7" ry="3.8" transform="rotate(-18 82 ${y+26})"/>
  <ellipse cx="120" cy="${y+16}" rx="7.4" ry="3.8"/>
  <ellipse cx="158" cy="${y+27}" rx="7" ry="3.8" transform="rotate(17 158 ${y+27})"/>
  <ellipse cx="100" cy="${y+38}" rx="6" ry="3.4" transform="rotate(-8 100 ${y+38})"/>
  <ellipse cx="142" cy="${y+37}" rx="6" ry="3.4" transform="rotate(9 142 ${y+37})"/></g>`;

const LAYER = {
  bunTop:      { h:48, r:y=>`<path d="M18 ${y+48}c0-29 36-46 102-46s102 17 102 46z" fill="#E8A24B"/>${sesame(y)}` },
  bunTopPlain: { h:46, r:y=>`<path d="M18 ${y+46}c0-28 36-44 102-44s102 16 102 44z" fill="#E8A24B"/>` },
  bunBot:      { h:30, r:y=>`<path d="M24 ${y}h192c0 19-33 29-96 29s-96-10-96-29z" fill="#E8A24B"/><path d="M24 ${y}h192c0 6-3 10-8 13H32c-5-3-8-7-8-13z" fill="#D08C3B"/>` },
  patty:       { h:24, r:y=>`<rect x="16" y="${y}" width="208" height="24" rx="12" fill="#5B3520"/><rect x="16" y="${y}" width="208" height="8" rx="4" fill="#7A472B"/>${grillMarks(y+8)}` },
  pattyJr:     { h:18, r:y=>`<rect x="30" y="${y}" width="180" height="18" rx="9" fill="#5B3520"/><rect x="30" y="${y}" width="180" height="6" rx="3" fill="#7A472B"/>` },
  chkGrill:    { h:26, r:y=>`<path d="M26 ${y+4}c14-8 40-4 60-4h56c22 0 44-4 58 4 8 6 6 20-4 22-30 6-136 6-166 0-10-2-12-16-4-22z" fill="#D9A05C"/>${grillMarks(y+6)}` },
  chkCrisp:    { h:30, r:y=>`<path d="M22 ${y+8}c10-10 22-6 32-10s20 2 30-4 22 4 32-2 22 6 32 0 20 4 28 10c8 8 6 20-4 24-16 6-130 6-146 0-10-4-14-14-4-18z" fill="#C97B2E"/><g fill="#E09A45"><circle cx="60" cy="${y+16}" r="5"/><circle cx="94" cy="${y+11}" r="5.5"/><circle cx="128" cy="${y+18}" r="5"/><circle cx="162" cy="${y+12}" r="5"/><circle cx="190" cy="${y+18}" r="4.5"/></g>` },
  chkSpicy:    { h:30, r:y=>`<path d="M22 ${y+8}c10-10 22-6 32-10s20 2 30-4 22 4 32-2 22 6 32 0 20 4 28 10c8 8 6 20-4 24-16 6-130 6-146 0-10-4-14-14-4-18z" fill="#C2451B"/><g fill="#E2622C"><circle cx="60" cy="${y+16}" r="5"/><circle cx="94" cy="${y+11}" r="5.5"/><circle cx="128" cy="${y+18}" r="5"/><circle cx="162" cy="${y+12}" r="5"/><circle cx="190" cy="${y+18}" r="4.5"/></g>` },
  fish:        { h:26, r:y=>`<rect x="26" y="${y}" width="188" height="26" rx="7" fill="#D8A44E"/><g fill="#E9BC73"><circle cx="60" cy="${y+9}" r="3.5"/><circle cx="96" cy="${y+16}" r="3.5"/><circle cx="134" cy="${y+8}" r="3.5"/><circle cx="172" cy="${y+16}" r="3.5"/></g>` },
  cheese:      { h:15, r:y=>`<path d="M18 ${y}h204v9c0 4-4 6-8 6H26c-4 0-8-2-8-6z" fill="#F2A93B"/><path d="M48 ${y+15}c0 9-2 15-6 15s-6-6-6-15zM126 ${y+15}c0 11-2 18-6 18s-6-7-6-18zM198 ${y+15}c0 9-2 15-6 15s-6-6-6-15z" fill="#F2A93B"/>` },
  lettuce:     { h:13, r:y=>`<path d="M10 ${y+3}c12-11 22 7 34-2s20 8 32-2 22 10 34-1 22 8 34-2 22 10 34 0c6 5 8 9 8 13H8c0-3 0-5 2-6z" fill="#7FB04E"/>` },
  tomato:      { h:13, r:y=>`<rect x="24" y="${y}" width="192" height="13" rx="6.5" fill="#D93A26"/><rect x="24" y="${y}" width="192" height="5" rx="2.5" fill="#E8604A"/>` },
  onion:       { h:11, r:y=>`<g fill="none" stroke="#C9A7D6" stroke-width="3"><path d="M34 ${y+6}h56M100 ${y+6}h50M160 ${y+6}h46"/></g>` },
  onionRing:   { h:16, r:y=>`<g fill="none" stroke="#D79A44" stroke-width="6"><ellipse cx="82" cy="${y+8}" rx="26" ry="7"/><ellipse cx="156" cy="${y+8}" rx="26" ry="7"/></g>` },
  bacon:       { h:14, r:y=>`<path d="M24 ${y+3}c22-6 44 6 66 0s44 6 66 0 44 6 60 2v9c-16 5-38-5-60 1s-44-6-66 0-44-6-66 0z" fill="#B4442A"/>` }
};

function stack(layers) {
  let y = 0, out = "";
  for (const k of layers) {
    const L = LAYER[k];
    if (!L) continue;
    out += L.r(y);
    y += L.h;
  }
  return `<svg class="ghost" viewBox="0 0 240 ${y + 20}" aria-hidden="true">${out}</svg>`;
}

const WRAP_ART = `<svg class="ghost" viewBox="0 0 240 150" aria-hidden="true">
  <path d="M40 118c0-8 10-14 22-22l88-62c14-10 30-8 38 2s6 26-8 36l-88 62c-12 8-24 10-34 4-10-6-18-12-18-20z" fill="#E9C79A"/>
  <path d="M56 104l70-50c10 8 24 10 34 4l-70 50c-12 8-24 4-34-4z" fill="#C2451B" opacity=".85"/>
  <g fill="#7FB04E"><ellipse cx="96" cy="98" rx="12" ry="5" transform="rotate(-35 96 98)"/><ellipse cx="126" cy="76" rx="12" ry="5" transform="rotate(-35 126 76)"/></g></svg>`;
