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
function photo(key, ratio, alt, ghost) {
  const src = PHOTOS[key];
  if (src) return `<div class="ph ${ratio}"><img src="${src}" alt="${alt}" loading="lazy"></div>`;
  return `<div class="ph ${ratio}">${ghost || ""}<span class="tag">${RATIOS[ratio]} · ${key}.jpg</span></div>`;
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

const now = new Date();
const state = openState(now);

const statusEl = $("#status");
if (statusEl) {
  statusEl.classList.toggle("open", state.open);
  $("#statusText").textContent = state.open
    ? "Open now · till " + fmt(state.until)
    : "Closed · opens " + fmt(HOURS[now.getDay()].open);
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
      : (it.price == null ? "—" : money(it.price));
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
const closeNav = () => {
  body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
};
if (navToggle) {
  navToggle.onclick = () => {
    const open = !body.classList.contains("nav-open");
    body.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  };
}
$$("#drawer a").forEach(a => a.addEventListener("click", closeNav));

/* ─── bottom sheets ─────────────────────────────────────────── */
let lastFocus = null;
const openSheet = el => {
  lastFocus = document.activeElement;
  closeNav();
  body.classList.add("sheet-open");
  el.classList.add("on");
  el.querySelector("a,button")?.focus();
};
const closeSheets = () => {
  $$(".sheet.on").forEach(s => s.classList.remove("on"));
  body.classList.remove("sheet-open");
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

/* ─── count-up ──────────────────────────────────────────────── */
$$("[data-count]").forEach(el => {
  const target = parseFloat(el.dataset.count);
  const decimals = (el.dataset.count.split(".")[1] || "").length;
  if (prefersReduced) { el.textContent = target.toFixed(decimals); return; }
  el.textContent = (0).toFixed(decimals);
  const co = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / 900);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    co.disconnect();
  }, { rootMargin: "-10% 0px" });
  co.observe(el);
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

/* ─── image blur-up ─────────────────────────────────────────── */
$$(".ph img").forEach(img => {
  if (img.complete) img.classList.add("ready");
  else img.addEventListener("load", () => img.classList.add("ready"), { once: true });
});

/* ─── tab-away title ────────────────────────────────────────── */
const realTitle = document.title;
document.addEventListener("visibilitychange", () => {
  document.title = document.hidden ? "🍔 Come back hungry…" : realTitle;
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
  const pre = document.createElement("pre");
  pre.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:99;background:#1F2733;color:#fff;font:12px/1.5 ui-monospace,monospace;padding:12px 16px;border-radius:12px;max-height:60vh;overflow:auto";
  pre.textContent = out.join("\n") + "\n\n" + (out.every(l => l.startsWith("PASS")) ? "ALL PASS" : "FAILURES");
  document.body.appendChild(pre);
}
})();
