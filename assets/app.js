/* ══════════════════════════════════════════════════════════════════
   Jumbo King Burger — shared behavior for all three pages.
   Every block is guarded, so each page only runs what it contains.
   ══════════════════════════════════════════════════════════════════ */
(() => {
"use strict";

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const money = n => "$" + n.toFixed(2);
const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── photo slots ────────────────────────────────────────────────
   Renders a real <img> when PHOTOS has a path, otherwise a sized
   placeholder that names the file and ratio it is waiting for.
   ─────────────────────────────────────────────────────────────── */
const RATIOS = { r43:"4:3", r45:"4:5", r11:"1:1", r169:"16:9" };
const DIMS   = { r43:[1200,900], r45:[1000,1250], r11:[1000,1000], r169:[1600,900] };

/* Intrinsic width/height are always emitted so the browser reserves the exact
   box before the image arrives — the placeholder already holds that space via
   aspect-ratio, and matching it keeps CLS at zero when photos drop in.
   AVIF/WebP siblings are used automatically if they sit next to the .jpg. */
function photo(key, ratio, alt, ghost, opts = {}) {
  const src = PHOTOS[key];
  const [w, h] = DIMS[ratio] || DIMS.r43;
  if (!src) {
    return `<div class="ph ${ratio}">${ghost || ""}<span class="tag">${RATIOS[ratio]} · ${key}.jpg</span></div>`;
  }
  const base = src.replace(/\.(jpe?g|png)$/i, "");
  const eager = opts.priority === true;
  return `<div class="ph ${ratio}"><picture>
    <source srcset="${base}.avif" type="image/avif">
    <source srcset="${base}.webp" type="image/webp">
    <img src="${src}" alt="${alt}" width="${w}" height="${h}"
         loading="${eager ? "eager" : "lazy"}" decoding="async"
         ${eager ? 'fetchpriority="high"' : ""}>
  </picture></div>`;
}

/* ─── hours ──────────────────────────────────────────────────────
   Returns {open, until}. `until` is the active window's close in
   minutes from midnight. A window that runs past midnight is caught
   by also testing yesterday's window shifted back a day.
   ─────────────────────────────────────────────────────────────── */
function openState(date, hours = HOURS) {
  const mins = date.getHours() * 60 + date.getMinutes();
  const today = hours[date.getDay()];
  const yday = hours[(date.getDay() + 6) % 7];
  if (mins >= today.open && mins < today.close) return { open:true, until:today.close };
  if (yday.close > 1440 && mins < yday.close - 1440) return { open:true, until:yday.close - 1440 };
  return { open:false, until:null };
}
window.openState = openState; // exposed so the self-check is runnable from the console

const fmt = m => {
  if (m % 1440 === 0 && m > 0) return "Midnight";
  const h24 = Math.floor(m / 60) % 24, mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return h12 + (mm ? ":" + String(mm).padStart(2, "0") : "") + (h24 < 12 ? " AM" : " PM");
};

/* Next opening from `date`, skipping days that never open and today's
   opening if it has already passed. Returns null if nothing is ever open. */
function nextOpen(date, hours = HOURS) {
  const mins = date.getHours() * 60 + date.getMinutes();
  for (let i = 0; i < 8; i++) {
    const d = (date.getDay() + i) % 7;
    const h = hours[d];
    if (h.open >= h.close) continue;      // closed all day
    if (i === 0 && mins >= h.open) continue; // today's opening already gone
    return { dayIdx: d, at: h.open, daysAhead: i };
  }
  return null;
}
window.nextOpen = nextOpen;

/* ─── the shop's clock, not the visitor's ─────────────────────────
   "Open now" must be answered in Paterson time. Using the browser's
   local Date means a visitor in Karachi gets the shop's hours judged
   against Karachi's clock, which is wrong by 9-10 hours. Intl resolves
   the shop's wall-clock natively, DST included, with no library. */
const SHOP_TZ = "America/New_York";
const DAY_IDX = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };

function shopClock(d = new Date()) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TZ, weekday: "short", hour: "numeric", minute: "numeric", hour12: false
  }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
  const hour = Number(p.hour) % 24;   // hour12:false can report "24"
  return {
    getDay: () => DAY_IDX[p.weekday],
    getHours: () => hour,
    getMinutes: () => Number(p.minute),
    getFullYear: () => d.getFullYear(),
    toLocaleDateString: (...a) => d.toLocaleDateString(...a)
  };
}
window.shopClock = shopClock;

const now = shopClock();
const state = openState(now);

const statusEl = $("#status");
if (statusEl) {
  statusEl.classList.toggle("open", state.open);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  let label;
  if (state.open) {
    const left = state.until - nowMins;
    // a closing time you can still act on is worth more than "till 11 PM"
    label = left > 0 && left <= 60
      ? `Closing in ${left} min`
      : "Open now · till " + fmt(state.until);
    statusEl.classList.toggle("closing", left > 0 && left <= 60);
  } else {
    const nx = nextOpen(now);
    label = !nx ? "Closed"
      : nx.daysAhead === 0 ? "Closed · opens " + fmt(nx.at)
      : nx.daysAhead === 1 ? "Closed · opens tomorrow " + fmt(nx.at)
      : `Closed · opens ${HOURS[nx.dayIdx].day} ${fmt(nx.at)}`;
  }
  $("#statusText").textContent = label;
}

const hoursList = $("#hoursList");
if (hoursList) {
  hoursList.innerHTML = HOURS.map((h, i) =>
    `<div class="${i === now.getDay() ? "today" : ""}"><span>${h.day}</span><span>${fmt(h.open)} – ${fmt(h.close)}</span></div>`
  ).join("");
}

$$("[data-year]").forEach(el => el.textContent = String(now.getFullYear()));
$$("[data-year-full]").forEach(el =>
  el.textContent = now.toLocaleDateString("en-US", { month: "long", year: "numeric" }));

/* ─── contact wiring ────────────────────────────────────────── */
const addrLine = $("#addrLine");
if (addrLine && SITE.address) {
  addrLine.innerHTML = SITE.address.replace(/,\s*/, ",<br>");
}
const phoneLink = $("#phoneLink");
if (phoneLink && SITE.phone) {
  phoneLink.href = "tel:" + SITE.phone;
  // .phone-cta carries an icon <svg> before the label — replace only the
  // text, not the whole node, or textContent would delete the icon too.
  const label = phoneLink.querySelector("span") || phoneLink;
  label.textContent = SITE.phoneLabel || SITE.phone;
}
const igLink = $("#igLink");
if (igLink) {
  if (SITE.instagram) {
    igLink.href = "https://instagram.com/" + SITE.instagram;
    igLink.target = "_blank";
    igLink.rel = "noopener";
    igLink.textContent = "@" + SITE.instagram;
  } else {
    igLink.remove(); // no handle yet — a dead "#" link reading "Add your Instagram" is worse than nothing
  }
}

/* ─── page rendering ────────────────────────────────────────── */
/* hero slot is static markup so it paints without waiting for JS; swap in
   the real photo (eager + high priority — it's the LCP element) once set */
const heroSlot = $(".hero .ph");
if (heroSlot && PHOTOS.hero) {
  heroSlot.outerHTML = photo("hero", "r43", "Flame-grilled burger, fries and a drink", "", { priority: true });
}

const showcase = $("#showcase");
if (showcase) {
  showcase.innerHTML = SHOWCASE.map(s => `
    <article class="show reveal">
      ${photo(s.key, "r45", s.alt, "")}
      <div class="copy">
        <span class="kicker">Jumbo King</span>
        <h2>${s.title}</h2>
        <p>${s.body}</p>
        <a class="btn btn-ghost" href="${s.href}">${s.cta}</a>
      </div>
    </article>`).join("");
}

const sigGrid = $("#sigGrid");
if (sigGrid) {
  const limit = Number(sigGrid.dataset.limit) || SIGNATURE.length;
  const searchable = s => s.replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").trim();
  sigGrid.innerHTML = SIGNATURE.slice(0, limit).map(i => `
    <article data-search="${searchable(i.name)}">
      ${photo(i.key, "r11", i.name, i.icon ? WRAP_ART : stack(i.art))}
      <div class="meta"><h3>${i.name}</h3><span class="no">${String(i.n).padStart(2, "0")}</span></div>
      <div class="cost">
        <div><span>Single</span> <b>${money(i.single)}</b></div>
        <div class="vm"><span>Value meal</span> <b>${money(i.vm)}</b></div>
      </div>
    </article>`).join("");
}

const menuRoot = $("#menuRoot");
if (menuRoot) {
  const renderItem = it => {
    const val = it.multi
      ? `<div class="multi">${it.multi.map(([l, v]) => `<span><i>${l}</i>${money(v)}</span>`).join("")}</div>`
      : (it.price == null
          ? `<span class="tbd" title="Ask in store — price not listed on the menu board">—</span>`
          : money(it.price));
    const search = `${it.name} ${it.note || ""}`
      .replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ")
      .replace(/^\s*\d+\.\s*/, "").replace(/\s+/g, " ").trim();
    return `<div class="item" data-search="${search.replace(/"/g, "&quot;")}">
      <div class="nm">${it.name}${it.note ? `<em>${it.note}</em>` : ""}</div>
      <div class="dots"></div>
      <div class="val">${val}</div></div>`;
  };
  menuRoot.innerHTML = BLOCKS.map(b => `
    <section class="mblock reveal" id="${b.id}">
      <h3>${b.title}</h3>
      ${b.lede ? `<div class="lede">${b.lede}</div>` : ""}
      <div class="cols">${b.items.map(renderItem).join("")}</div>
      ${b.note ? `<div class="note">${b.note}</div>` : ""}
    </section>`).join("");
}

const rail = $("#rail");
if (rail) {
  rail.innerHTML = REVIEWS.map(r =>
    `<figure class="quote"><p>${r.text}</p><figcaption class="who">${r.who}</figcaption></figure>`).join("");
  const step = () => rail.querySelector(".quote").offsetWidth + 16;
  $("#railNext").onclick = () => rail.scrollBy({ left: step(), behavior:"smooth" });
  $("#railPrev").onclick = () => rail.scrollBy({ left: -step(), behavior:"smooth" });

  /* A horizontal scroller with no position indicator gives the reader no idea
     how much is left, and no way through it from the keyboard. */
  const dots = document.createElement("div");
  dots.className = "rail-dots";
  dots.setAttribute("role", "tablist");
  dots.setAttribute("aria-label", "Reviews");
  REVIEWS.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Review ${i + 1} of ${REVIEWS.length}`);
    b.onclick = () => rail.scrollTo({ left: i * step(), behavior: prefersReduced ? "auto" : "smooth" });
    dots.appendChild(b);
  });
  rail.after(dots);

  const syncDots = () => {
    const i = Math.round(rail.scrollLeft / step());
    [...dots.children].forEach((d, n) => d.setAttribute("aria-current", String(n === i)));
  };
  rail.addEventListener("scroll", syncDots, { passive: true });
  syncDots();

  rail.tabIndex = 0;
  rail.setAttribute("aria-label", "Customer reviews, use arrow keys to browse");
  rail.addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    rail.scrollBy({ left: e.key === "ArrowRight" ? step() : -step(), behavior:"smooth" });
  });
}

/* ─── highlight the section that is being served right now ────────
   Breakfast before 11, and today's deals the rest of the day. Small
   thing, but it answers "can I still get breakfast?" without reading. */
(() => {
  const blocks = $$(".mblock");
  if (!blocks.length) return;
  const h = now.getHours();
  const target = h < 11 ? "breakfast" : "deals";
  document.getElementById(target)?.classList.add("is-now");
})();

/* ─── back to the category nav from the foot of a long section ─── */
(() => {
  const nav = $(".menu-nav");
  if (!nav) return;
  $$(".mblock").forEach(b => {
    const a = document.createElement("a");
    a.className = "to-menu-top";
    a.href = "#" + (nav.querySelector("a")?.getAttribute("href")?.slice(1) || "sides");
    a.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>Back to menu sections`;
    a.addEventListener("click", e => {
      e.preventDefault();
      nav.scrollIntoView({ block: "start", behavior: prefersReduced ? "auto" : "smooth" });
    });
    b.appendChild(a);
  });
})();

/* ─── header / drawer ───────────────────────────────────────── */
const body = document.body;
const onScroll = () => body.classList.toggle("scrolled", scrollY > 40);
addEventListener("scroll", onScroll, { passive:true });
onScroll();

const navToggle = $("#navToggle");
const drawerEl = $("#drawer");
let releaseNavTrap = null;
const closeNav = () => {
  if (!body.classList.contains("nav-open")) return;
  body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Open menu");
  releaseNavTrap?.(); releaseNavTrap = null;
  drawerEl?.setAttribute("inert", "");
  if (!body.classList.contains("sheet-open")) lockScroll(false);
  navToggle?.focus();
};
if (navToggle) {
  drawerEl?.setAttribute("inert", "");
  navToggle.onclick = () => {
    const open = !body.classList.contains("nav-open");
    if (!open) return closeNav();
    body.classList.add("nav-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    drawerEl?.removeAttribute("inert");
    lockScroll(true);
    releaseNavTrap = drawerEl ? trapFocus(drawerEl) : null;
    drawerEl?.querySelector(FOCUSABLE)?.focus();
  };
}
$$("#drawer a").forEach(a => a.addEventListener("click", closeNav));

/* ─── bottom sheets ─────────────────────────────────────────── */
/* ─── overlay plumbing: scroll lock + focus trap ──────────────────
   Without the lock the page scrolls behind an open drawer on touch;
   without the trap, Tab walks straight out of the dialog into content
   the user cannot see. Both are required for the overlay to be usable. */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
let scrollLockY = 0;

function lockScroll(on) {
  if (on) {
    scrollLockY = scrollY;
    body.style.top = `-${scrollLockY}px`;
    body.classList.add("locked");
  } else if (body.classList.contains("locked")) {
    body.classList.remove("locked");
    body.style.top = "";
    scrollTo(0, scrollLockY);
  }
}

let releaseTrap = null;
function trapFocus(container) {
  const onKey = e => {
    if (e.key !== "Tab") return;
    const items = [...container.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}

let lastFocus = null;
const openSheet = el => {
  lastFocus = document.activeElement;
  closeNav();
  body.classList.add("sheet-open");
  el.classList.add("on");
  el.removeAttribute("inert"); // closed sheets are off-screen via transform only, not display:none — inert is what actually keeps them out of Tab order while hidden
  lockScroll(true);
  releaseTrap?.();
  releaseTrap = trapFocus(el);
  el.querySelector(FOCUSABLE)?.focus();
};
const closeSheets = () => {
  if (!$(".sheet.on")) return;
  $$(".sheet.on").forEach(s => { s.classList.remove("on"); s.setAttribute("inert", ""); });
  body.classList.remove("sheet-open");
  releaseTrap?.(); releaseTrap = null;
  if (!body.classList.contains("nav-open")) lockScroll(false);
  lastFocus?.focus();
};
$("#scrim")?.addEventListener("click", () => { closeNav(); closeSheets(); });
$$("[data-close]").forEach(b => b.addEventListener("click", closeSheets));
addEventListener("keydown", e => { if (e.key === "Escape") { closeNav(); closeSheets(); } });

const q = encodeURIComponent(SITE.address || "Jumbo King Burger");
const MAP_URLS = {
  apple:  "https://maps.apple.com/?q=" + q,
  google: "https://www.google.com/maps/search/?api=1&query=" + q,
  waze:   "https://waze.com/ul?q=" + q
};
$$("[data-map]").forEach(a => {
  a.href = MAP_URLS[a.dataset.map];
  a.target = "_blank";
  a.rel = "noopener";
  a.addEventListener("click", closeSheets);
});

const mapCard = $("#mapCard");
const mapSheet = $("#mapSheet");
if (mapCard && mapSheet) {
  // Real embedded map built from the same SITE.address as the maps-app
  // links, so there is one source of truth. Keyless "output=embed" endpoint —
  // no API key, no billing, and it plots the address text directly rather
  // than resolving through a third-party place index (unlike OSM, whose
  // record for this address currently carries an unrelated business name).
  const ph = $("#mapPlaceholder");
  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    const iframe = document.createElement("iframe");
    iframe.src = "https://maps.google.com/maps?q=" + q + "&output=embed";
    iframe.loading = "lazy";
    iframe.title = "Map showing our location";
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    ph?.replaceWith(iframe);
  }, { rootMargin: "200px" });
  io.observe(mapCard);

  $("#mapDirections")?.addEventListener("click", () => openSheet(mapSheet));
}

const orderSheet = $("#orderSheet");
if (orderSheet) {
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-order]");
    if (!btn) return;
    e.preventDefault();
    const kind = btn.dataset.order;
    const opts = kind === "pickup"
      ? [["Order online", SITE.orderPickup], ["Call the store", SITE.phone ? "tel:" + SITE.phone : ""]]
      : Object.entries(SITE.orderDelivery);
    $("#orderTitle").textContent = kind === "pickup" ? "Order for pickup" : "Order for delivery";
    $("#orderOptions").innerHTML = opts
      .map(([l, h]) => `<a href="${h || "#"}"${h ? ' target="_blank" rel="noopener"' : ""}>${l}${h ? "" : " — add link"}</a>`)
      .join("");
    $$("#orderOptions a").forEach(a => a.addEventListener("click", closeSheets));
    openSheet(orderSheet);
  });
}

/* ─── delivery partner cards (contact page) ─────────────────── */
const partners = $("#partners");
if (partners) {
  partners.innerHTML = Object.entries(SITE.orderDelivery).map(([name, href]) => `
    <a class="partner" href="${href || "#"}"${href ? ' target="_blank" rel="noopener"' : ""}>
      <b>${name}</b><span>${href ? "Order now" : "Add link in data.js"}</span>
    </a>`).join("");
}

/* ─── reveal on scroll ──────────────────────────────────────── */
const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { rootMargin:"-5% 0px -5% 0px" });
$$(".reveal").forEach(el => io.observe(el));

/* ─── in-page nav scroll-spy (menu page) ────────────────────── */
const spyLinks = $$(".menu-nav a");
if (spyLinks.length) {
  const spy = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      spyLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin:"-25% 0px -60% 0px" });
  spyLinks.forEach(a => {
    const el = document.getElementById(a.getAttribute("href").slice(1));
    if (el) spy.observe(el);
  });
}

/* ─── scroll-scrubbed burger build (home page) ──────────────── */
const grillSec = $("#grill");
if (grillSec) {
  const layers = $$("[data-layer]");
  const steps = $$("#steps li");
  const FROM = [[0,170],[-270,50],[270,50],[-210,-60],[210,-90],[0,-280]]; // fly-in offsets
  const scrub = () => {
    if (innerWidth <= 900 || prefersReduced) {
      layers.forEach(g => { g.style.transform = ""; g.style.opacity = ""; });
      steps.forEach(s => s.classList.add("on"));
      return;
    }
    const span = grillSec.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -grillSec.getBoundingClientRect().top / span));
    layers.forEach((g, i) => {
      const t = Math.min(1, Math.max(0, (p - i * 0.13) / 0.24));
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const [fx, fy] = FROM[i];
      g.style.transform = `translate(${fx * (1 - e)}px,${fy * (1 - e)}px)`;
      g.style.opacity = String(Math.min(1, e * 2.2));
      steps[i]?.classList.toggle("on", t > 0.35);
    });
  };
  let ticking = false;
  const requestScrub = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { scrub(); ticking = false; });
  };
  addEventListener("scroll", requestScrub, { passive:true });
  addEventListener("resize", requestScrub);
  scrub();
}

/* ══════════════════════════════════════════════════════════════════
   POLISH
   ══════════════════════════════════════════════════════════════════ */

/* ─── loader ──────────────────────────────────────────────────────
   The fade-out is a pure CSS animation, so the loader clears itself
   even if this script never runs. JS only records the visit and
   removes the dead node afterwards.
   ─────────────────────────────────────────────────────────────── */
const loader = $("#loader");
if (loader) {
  try { sessionStorage.setItem("jkb-seen", "1"); } catch (e) { /* private mode */ }
  setTimeout(() => loader.remove(), 1450); // after the .9s hold + .5s wipe
}

/* ─── scroll progress bar ───────────────────────────────────── */
const prog = $("#progress");
if (prog) {
  const drawProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener("scroll", drawProgress, { passive: true });
  addEventListener("resize", drawProgress);
  drawProgress();
}

/* ─── back to top ───────────────────────────────────────────── */
const toTop = $("#toTop");
if (toTop) {
  const toggleTop = () => toTop.classList.toggle("on", scrollY > 600);
  addEventListener("scroll", toggleTop, { passive: true });
  toggleTop();
  toTop.onclick = () => scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
}

/* ─── toast ─────────────────────────────────────────────────── */
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("on"), 2200);
}

/* ─── copy address ──────────────────────────────────────────── */
const copyBtn = $("#copyAddr");
if (copyBtn) {
  if (!SITE.address) copyBtn.remove();
  else copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(SITE.address);
      toast("Address copied");
    } catch (e) {
      toast("Couldn't copy — select it manually");
    }
  };
}

/* ─── staggered container reveals ───────────────────────────── */
const stagger = new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    [...e.target.children].forEach((c, i) => c.style.setProperty("--d", i * 70 + "ms"));
    e.target.classList.add("in");
    stagger.unobserve(e.target);
  });
}, { rootMargin: "-6% 0px -6% 0px" });
$$("[data-stagger]").forEach(el => stagger.observe(el));

/* ─── count-up is owned by motion.js (anime) ─────────────────────
   Only the reduced-motion / no-module fallback lives here: show the
   final value immediately so the number is never left reading zero. */
$$("[data-count]").forEach(el => {
  const decimals = (el.dataset.count.split(".")[1] || "").length;
  el.textContent = (el.dataset.countPrefix || "") + parseFloat(el.dataset.count).toFixed(decimals);
});

/* ─── button ripple ─────────────────────────────────────────── */
if (!prefersReduced) {
  document.addEventListener("pointerdown", e => {
    const b = e.target.closest(".btn");
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty("--rx", e.clientX - r.left + "px");
    b.style.setProperty("--ry", e.clientY - r.top + "px");
    b.classList.remove("rip");
    void b.offsetWidth; // restart the animation
    b.classList.add("rip");
  });
}

/* ─── card tilt ─────────────────────────────────────────────── */
if (!prefersReduced && matchMedia("(hover:hover) and (pointer:fine)").matches) {
  $$(".sig article, .partner").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(700px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg) translateY(-4px)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

/* ─── image blur-up + per-slot skeleton ─────────────────────── */
$$(".ph img").forEach(img => {
  const slot = img.closest(".ph");
  const done = () => { img.classList.add("ready"); slot?.classList.remove("loading"); };
  if (img.complete && img.naturalWidth) return done();
  slot?.classList.add("loading");
  img.addEventListener("load", done, { once: true });
  img.addEventListener("error", () => slot?.classList.remove("loading"), { once: true });
});

/* ─── tab-away title ────────────────────────────────────────── */
const realTitle = document.title;
document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? "🍔 Come back hungry…" : realTitle;
});

/* ─── menu search ─────────────────────────────────────────────── */
const filterInput = $("#menuFilter");
if (filterInput) {
  const wrap = $("#msearch");
  const countEl = $("#menuFilterCount");
  const sigSection = $("#signature");
  const cards = $$("#sigGrid article");
  const rows = $$(".mblock .item");
  const blocks = $$(".mblock");

  // Index the item NAME only, taken from the source data at render time.
  // Scraping textContent pulled in price labels, the prices themselves and the
  // placeholder filename tag, so "9" matched every $x.99 and "single" matched
  // every card that had a Single price.
  const index = new Map([...cards, ...rows].map(el =>
    [el, (el.dataset.search || "").toLowerCase()]));

  let empty = $("#noResults");
  if (!empty) {
    empty = document.createElement("div");
    empty.id = "noResults";
    empty.className = "no-results is-filtered-out";
    empty.innerHTML = `<h3>Nothing matched</h3><p>Try a shorter word, or browse the full menu below.</p>`;
    $("#menuRoot")?.prepend(empty);
  }

  const apply = () => {
    const q = filterInput.value.trim().toLowerCase();
    wrap.classList.toggle("has-value", q.length > 0);

    if (!q) {
      index.forEach((_, el) => el.classList.remove("is-filtered-out"));
      blocks.forEach(b => b.classList.remove("is-empty"));
      sigSection?.classList.remove("is-empty");
      empty.classList.add("is-filtered-out");
      countEl.textContent = "";
      return;
    }

    let hits = 0;
    index.forEach((text, el) => {
      const match = text.includes(q);
      el.classList.toggle("is-filtered-out", !match);
      if (match) hits++;
    });
    // hide a section once every child is filtered out
    blocks.forEach(b => b.classList.toggle("is-empty",
      ![...b.querySelectorAll(".item")].some(i => !i.classList.contains("is-filtered-out"))));
    sigSection?.classList.toggle("is-empty",
      !cards.some(c => !c.classList.contains("is-filtered-out")));

    empty.classList.toggle("is-filtered-out", hits > 0);
    countEl.textContent = hits === 0
      ? `No matches for “${filterInput.value.trim()}”`
      : `${hits} item${hits === 1 ? "" : "s"} matching “${filterInput.value.trim()}”`;
  };

  filterInput.addEventListener("input", apply);
  filterInput.addEventListener("keydown", e => { if (e.key === "Escape") { filterInput.value = ""; apply(); } });
  $("#menuFilterClear")?.addEventListener("click", () => { filterInput.value = ""; apply(); filterInput.focus(); });
}

/* ─── back-to-top yields to the footer ────────────────────────── */
if (toTop) {
  const foot = document.querySelector("footer");
  if (foot) {
    const fo = new IntersectionObserver(es => toTop.classList.toggle("at-footer", es[0].isIntersecting));
    fo.observe(foot);
  }
}

/* ─── order sheet remembers the last choice ───────────────────── */
try {
  const last = localStorage.getItem("jkb-order");
  if (last) $$(`[data-order="${last}"]`).forEach(b => b.dataset.preferred = "1");
} catch (e) { /* private mode */ }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-order]");
  if (!b) return;
  try { localStorage.setItem("jkb-order", b.dataset.order); } catch (err) { /* private mode */ }
});

/* ═══════════════════════════════════════════════════════════════
   Micro-interactions — the kind you only notice when they're missing
   ═══════════════════════════════════════════════════════════════ */

/* ─── drawer close button ─────────────────────────────────────── */
$("#drawerClose")?.addEventListener("click", closeNav);

/* ─── prefetch internal pages on intent ───────────────────────────
   Hovering a link for 65ms, or touching it, is a strong signal the
   navigation is coming. Warming the cache then makes the click feel
   instant without costing anything to people who never hover. */
(() => {
  if (navigator.connection?.saveData) return;
  const done = new Set();
  const warm = href => {
    if (!href || done.has(href)) return;
    done.add(href);
    const l = document.createElement("link");
    l.rel = "prefetch";
    l.href = href;
    document.head.appendChild(l);
  };
  const internal = a => {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return null;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return null;
    if (url.pathname === location.pathname) return null;
    return url.pathname;
  };
  let timer;
  document.addEventListener("pointerover", e => {
    const a = e.target.closest("a[href]");
    const path = internal(a);
    if (!path) return;
    clearTimeout(timer);
    timer = setTimeout(() => warm(path), 65);
  });
  document.addEventListener("pointerout", () => clearTimeout(timer));
  document.addEventListener("touchstart", e => {
    const path = internal(e.target.closest("a[href]"));
    if (path) warm(path);
  }, { passive: true });
})();

/* ─── page exit fade ──────────────────────────────────────────────
   Browsers with cross-document View Transitions handle this natively
   (see @view-transition in the stylesheet); this is the fallback for
   everything else. Modifier-clicks and new tabs are left alone. */
(() => {
  if (prefersReduced) return;
  if (document.startViewTransition) return; // native path already covers it
  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return; // same page, it's an anchor
    e.preventDefault();
    document.body.classList.add("is-leaving");
    setTimeout(() => { location.href = a.href; }, 180);
  });
  // coming back via bfcache must not leave the page faded out
  addEventListener("pageshow", () => document.body.classList.remove("is-leaving"));
})();

/* ─── tap the phone number to copy it ─────────────────────────── */
(() => {
  const el = $("#phoneLink");
  if (!el || !SITE.phone) return;
  // on a phone the tel: link is the right behaviour; on desktop it is not
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
    el.addEventListener("click", async e => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(SITE.phoneLabel || SITE.phone);
        toast("Phone number copied");
      } catch { toast("Could not copy — select it manually"); }
    });
    el.title = "Click to copy";
  }
})();

/* ─── enquiry form ────────────────────────────────────────────────
   Client-side checks mirror the Worker's validate()/rateLimited() logic,
   but on the production (Netlify) deploy this form posts straight to
   Netlify Forms via action="/" — the Worker is never in that request path.
   These checks exist to save the customer a round trip, not as the real
   gate; Netlify's own honeypot + spam heuristics are what actually guards
   the production submission. */
const enquiryForm = $("#enquiryForm");
if (enquiryForm) {
  const statusEl = $("#enquiryStatus");
  const submitBtn = $("#enquirySubmit");
  const startedAt = $("#startedAt");
  if (startedAt) startedAt.value = String(Date.now());

  const showErrors = errors => {
    $$("#enquiryForm .err").forEach(el => {
      const field = el.dataset.err;
      const msg = errors?.[field];
      el.textContent = msg || "";
      el.classList.toggle("on", Boolean(msg));
      const input = enquiryForm.querySelector(`[name="${field}"]`);
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    });
    const first = enquiryForm.querySelector('[aria-invalid="true"]');
    first?.focus();
  };

  const setStatus = (msg, kind) => {
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (msg ? ` on ${kind}` : "");
  };

  // cheap local mirror so obvious mistakes never cost a round trip
  const localCheck = fd => {
    const e = {};
    if (String(fd.get("name") || "").trim().length < 2) e.name = "Please give us a name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(fd.get("email") || "").trim())) e.email = "Check the email address.";
    if (String(fd.get("message") || "").trim().length < 5) e.message = "Tell us a little about what you need.";
    return e;
  };

  enquiryForm.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(enquiryForm);

    const local = localCheck(fd);
    if (Object.keys(local).length) {
      showErrors(local);
      setStatus("Please fix the highlighted fields.", "bad");
      return;
    }
    showErrors({});

    submitBtn.classList.add("is-loading");
    submitBtn.disabled = true;
    setStatus("", "");

    try {
      // urlencoded so the same request shape works for Netlify Forms, the
      // Cloudflare Worker and the local dev server
      const res = await fetch(enquiryForm.getAttribute("action") || "/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(fd)
      });
      // Netlify Forms answers 200 with HTML, not JSON
      const data = await res.json().catch(() => (res.ok ? { ok: true } : {}));

      if (res.ok && data.ok) {
        enquiryForm.reset();
        if (startedAt) startedAt.value = String(Date.now());
        setStatus("Thanks — we've got it. We'll reply by email shortly.", "ok");
      } else if (res.status === 422 && data.errors) {
        showErrors(data.errors);
        setStatus("Please fix the highlighted fields.", "bad");
      } else {
        setStatus(data.error || "Something went wrong sending that. Please call the store instead.", "bad");
      }
    } catch (err) {
      // offline, blocked, or the endpoint isn't deployed yet
      setStatus("Could not reach us just now. Please check your connection, or call the store.", "bad");
    } finally {
      submitBtn.classList.remove("is-loading");
      submitBtn.disabled = false;
    }
  });
}

/* ─── structured data ─────────────────────────────────────────────
   Generated from HOURS / SIGNATURE / BLOCKS so prices and opening
   times can never drift from what the page renders. Fields backed by
   an empty SITE value are omitted entirely — publishing a blank
   address or phone to search engines is worse than publishing none.
   ─────────────────────────────────────────────────────────────── */
function buildStructuredData() {
  const hhmm = m => {
    // a window closing at midnight is 23:59, not 00:00 — 00:00 is read as the
    // start of the day and would describe a business that never opens
    if (m % 1440 === 0 && m > 0) return "23:59";
    return String(Math.floor(m / 60) % 24).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  };
  const abs = path => (SITE.url || "") + path;

  const restaurant = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Jumbo King Burger",
    slogan: "The one. The only.",
    description: "Flame-grilled burgers, chicken, breakfast and shakes.",
    servesCuisine: ["Burgers", "American", "Fast Food"],
    priceRange: "$",
    url: abs("/"),
    hasMenu: abs("/menu"),
    openingHoursSpecification: HOURS
      .filter(h => h.open < h.close)
      .map(h => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${h.day}`,
        opens: hhmm(h.open),
        closes: hhmm(h.close)
      }))
  };

  if (PHOTOS.hero) restaurant.image = abs("/" + PHOTOS.hero.replace(/^\//, ""));
  if (SITE.phone) restaurant.telephone = SITE.phone;
  if (SITE.instagram) restaurant.sameAs = ["https://instagram.com/" + SITE.instagram];
  if (SITE.address) {
    restaurant.address = {
      "@type": "PostalAddress",
      streetAddress: SITE.address.split(",")[0].trim(),
      ...(SITE.locality && { addressLocality: SITE.locality }),
      ...(SITE.region && { addressRegion: SITE.region }),
      ...(SITE.postalCode && { postalCode: SITE.postalCode }),
      addressCountry: "US"
    };
  }
  if (SITE.orderPickup || Object.values(SITE.orderDelivery).some(Boolean)) {
    restaurant.potentialAction = [
      ...(SITE.orderPickup ? [{ "@type": "OrderAction", target: SITE.orderPickup, deliveryMethod: "http://purl.org/goodrelations/v1#PickUp" }] : []),
      ...Object.entries(SITE.orderDelivery).filter(([, u]) => u)
        .map(([, u]) => ({ "@type": "OrderAction", target: u, deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet" }))
    ];
  }

  const item = (name, price, multi) => ({
    "@type": "MenuItem",
    name: name.replace(/&amp;/g, "&").replace(/^\d+\.\s*/, ""),
    // sized items (Sm/Md/Lg etc.) get one Offer per size instead of just the
    // cheapest tier, so structured data doesn't quote a lower price than what's
    // actually charged for the size most people order
    ...(multi ? { offers: multi.map(([label, p]) => ({ "@type": "Offer", name: label, price: p.toFixed(2), priceCurrency: "USD" })) }
      : price != null ? { offers: { "@type": "Offer", price: price.toFixed(2), priceCurrency: "USD" } } : {})
  });

  const menu = {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Jumbo King Burger menu",
    url: abs("/menu"),
    hasMenuSection: [
      {
        "@type": "MenuSection",
        name: "Signature Burgers & Sandwiches",
        hasMenuItem: SIGNATURE.map(s => item(s.name, s.single))
      },
      ...BLOCKS.map(b => ({
        "@type": "MenuSection",
        name: b.title.replace(/&amp;/g, "&"),
        hasMenuItem: b.items.map(i => item(i.name, i.price, i.multi))
      }))
    ]
  };

  return [restaurant, menu];
}

/* Breadcrumbs tell search engines the site's shape; only inner pages have one. */
function buildBreadcrumb(path) {
  const NAMES = { "/menu": "Menu", "/contact": "Contact", "/privacy": "Privacy" };
  if (!NAMES[path]) return null;
  const abs = p => (SITE.url || "") + p;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
      { "@type": "ListItem", position: 2, name: NAMES[path], item: abs(path) }
    ]
  };
}

(() => {
  const path = location.pathname.replace(/\/$/, "") || "/";
  const blocks = buildStructuredData();
  // menu graph only where it belongs; every page carries the Restaurant
  const payload = path === "/menu" ? blocks : [blocks[0]];
  const crumb = buildBreadcrumb(path);
  if (crumb) payload.push(crumb);
  payload.forEach(obj => {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  });
})();

/* ─── self-check: append ?selftest or #selftest to any page ──── */
if (location.search.includes("selftest") || location.hash.includes("selftest")) {
  const out = [];
  const check = (n, got, want) => out.push((got === want ? "PASS " : "FAIL ") + n + "  got=" + got + " want=" + want);
  const H = [ // Sun–Thu close 11 PM; Fri/Sat close 1 AM the next day
    {open:420,close:1380},{open:420,close:1380},{open:420,close:1380},{open:420,close:1380},
    {open:420,close:1380},{open:420,close:1500},{open:420,close:1500}];
  const at = (d, h, m = 0) => openState(new Date(2026, 7, 2 + d, h, m), H); // Aug 2 2026 is a Sunday
  check("Sun 06:00 closed",            at(0, 6).open, false);
  check("Sun 12:00 open",              at(0, 12).open, true);
  check("Sun 23:30 closed",            at(0, 23, 30).open, false);
  check("Sat 00:30 open (Fri spill)",  at(6, 0, 30).open, true);
  check("Sat 01:30 closed",            at(6, 1, 30).open, false);
  check("Sun 00:30 open (Sat spill)",  at(7, 0, 30).open, true);
  check("Mon 00:30 closed (no spill)", at(1, 0, 30).open, false);
  check("Mon until = 11 PM",           at(1, 12).until, 1380);
  check("Fri until = 1 AM next day",   at(5, 23).until, 1500);

  // nextOpen: what we tell a customer when the door is shut
  const nx = (d, h, m = 0) => nextOpen(new Date(2026, 7, 2 + d, h, m), H);
  check("before open -> today",        nx(0, 6).daysAhead, 0);
  check("after close -> tomorrow",     nx(0, 23, 30).daysAhead, 1);
  check("tomorrow's opening time",     nx(0, 23, 30).at, 420);
  check("Sat night -> Sunday",         nx(6, 23, 30).dayIdx, 0);
  const allClosed = H.map(() => ({ open: 600, close: 600 }));
  check("never open -> null",          nextOpen(new Date(2026, 7, 2, 12), allClosed), null);
  // --- new logic added after the original suite ---------------------
  // midnight must never serialise as 00:00 (schema.org reads it as the START
  // of the day, describing a shop that never opens)
  const specs = buildStructuredData()[0].openingHoursSpecification;
  check("no spec closes at 00:00", specs.every(s => s.closes !== "00:00"), true);
  check("midnight close -> 23:59",
        specs.some(s => s.closes === "23:59") || HOURS.every(h => h.close % 1440 !== 0), true);

  // the shop clock must track America/New_York, not the visitor
  const sc = shopClock(new Date("2026-08-04T22:00:00Z"));   // 22:00 UTC = 18:00 EDT
  check("shopClock resolves ET hour", sc.getHours(), 18);
  const winter = shopClock(new Date("2026-01-15T22:00:00Z")); // EST, one hour back
  check("shopClock honours DST", winter.getHours(), 17);
  check("shopClock day matches", sc.getDay(), 2);           // Tuesday

  // fmt must not print a bare "12 AM" for a midnight close
  check("midnight reads as Midnight", fmt(1440), "Midnight");
  check("noon still reads 12 PM", fmt(720), "12 PM");

  const pre = document.createElement("pre");
  pre.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:99;background:#1F2733;color:#fff;font:12px/1.5 ui-monospace,monospace;padding:12px 16px;border-radius:12px;max-height:60vh;overflow:auto";
  pre.textContent = out.join("\n") + "\n\n" + (out.every(l => l.startsWith("PASS")) ? "ALL PASS" : "FAILURES");
  document.body.appendChild(pre);
}
})();
