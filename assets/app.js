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

const now = new Date();
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

/* ─── contact wiring ────────────────────────────────────────── */
const addrLine = $("#addrLine");
if (addrLine && SITE.address) {
  addrLine.innerHTML = SITE.address.replace(/,\s*/, ",<br>");
  $(".todo")?.remove();
}
const phoneLink = $("#phoneLink");
if (phoneLink && SITE.phone) {
  phoneLink.href = "tel:" + SITE.phone;
  phoneLink.textContent = SITE.phoneLabel || SITE.phone;
}
const igLink = $("#igLink");
if (igLink && SITE.instagram) {
  igLink.href = "https://instagram.com/" + SITE.instagram;
  igLink.target = "_blank";
  igLink.rel = "noopener";
  igLink.textContent = "@" + SITE.instagram;
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
      ${photo(s.key, "r45", s.title, "")}
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
  sigGrid.innerHTML = SIGNATURE.slice(0, limit).map(i => `
    <article>
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
    return `<div class="item">
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
}

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
  lockScroll(true);
  releaseTrap?.();
  releaseTrap = trapFocus(el);
  el.querySelector(FOCUSABLE)?.focus();
};
const closeSheets = () => {
  if (!$(".sheet.on")) return;
  $$(".sheet.on").forEach(s => s.classList.remove("on"));
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
  mapCard.onclick = () => openSheet(mapSheet);
  mapCard.onkeydown = e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSheet(mapSheet); }
  };
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
  setTimeout(() => loader.remove(), 2300); // after the 1.45s hold + 0.7s wipe
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

  const textOf = el => el.textContent.toLowerCase().replace(/\s+/g, " ");
  const index = new Map([...cards, ...rows].map(el => [el, textOf(el)]));

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
  const pre = document.createElement("pre");
  pre.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:99;background:#1F2733;color:#fff;font:12px/1.5 ui-monospace,monospace;padding:12px 16px;border-radius:12px;max-height:60vh;overflow:auto";
  pre.textContent = out.join("\n") + "\n\n" + (out.every(l => l.startsWith("PASS")) ? "ALL PASS" : "FAILURES");
  document.body.appendChild(pre);
}
})();
