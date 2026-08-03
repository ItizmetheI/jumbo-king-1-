/* ══════════════════════════════════════════════════════════════════
   Motion layer — anime.js v4

   Loaded as a module, so it runs after data.js/app.js and is purely
   additive. If this file (or anime) fails to load, nothing is left
   hidden: every element it animates starts visible in CSS, and this
   module is what hides it immediately before animating it in.

   anime is used only where CSS genuinely can't do the job — number
   interpolation, choreographed stagger, spring physics. Marquee,
   flames, ripple, skeleton shimmer, progress bar and the sheet/drawer
   slides stay on CSS: they're single-property transitions or infinite
   linear loops, and a JS engine would be strictly more expensive.
   ══════════════════════════════════════════════════════════════════ */
import { animate, createTimeline, stagger, utils } from "./vendor/anime.esm.min.js";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) throw new Error("reduced-motion: motion layer disabled");

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ─── split text into word spans, preserving <br> and <em> ─────── */
function splitWords(root) {
  const words = [];
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) {
        if (!n.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (!part.trim()) return frag.appendChild(document.createTextNode(part));
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
          words.push(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== "BR") {
        walk(n);
      }
    });
  };
  walk(root);
  return words;
}

/* the loader keeps its CSS animation as the fail-safe; content waits for it */
const loaderDelay = () => ($("#loader") && !document.documentElement.classList.contains("loaded-before")) ? 1450 : 0;

/* ─── loader: flame flare-in + a graceful exit ─────────────────────
   The badge's own pop-in and the progress bar fill stay on CSS — cheap,
   and already fine as the no-JS fallback. anime only adds two things CSS
   doesn't do gracefully here: a staggered flare so the flames feel lit
   rather than just present, and an exit that moves the content before
   the panel wipes rather than cutting it off mid-frame.

   The continuous flicker on .fl-a/.fl-b/.fl-c stays on CSS (infinite,
   basically free) — so this animates opacity only. Scale is already
   owned by that CSS keyframe, and a CSS animation always wins the
   property it's actively animating over an inline style, so touching
   transform here would just be silently overwritten every frame. */
const loaderEl = $("#loader");
if (loaderEl && !document.documentElement.classList.contains("loaded-before")) {
  const flames = $$("#loader .lflame path");
  if (flames.length) {
    utils.set(flames, { opacity: 0 });
    animate(flames, { opacity: [0, 1], duration: 480, ease: "out(2)", delay: stagger(90, { start: 150 }) });
  }

  // A pop-in that then sits frozen for another second reads as a static
  // image, not something alive — this keeps the badge visibly breathing
  // through the hold. Starts after the CSS pop-in (lpop, .55s) finishes,
  // so there is no window where both are animating transform at once.
  const logoEl = $("#loader .llogo");
  const breathe = logoEl && animate(logoEl, {
    scale: [1, 1.035], duration: 900, ease: "inOut(2)", loop: true, alternate: true, delay: 650
  });

  setTimeout(() => {
    breathe?.pause();
    const box = $("#loader .lbox");
    if (box) animate(box, { opacity: 0, scale: 0.94, y: -14, duration: 620, ease: "in(2)" });
  }, 900); // matches the CSS #loader wipe delay, so the content leaves with the panel
}

/* ─── enter-viewport helper ───────────────────────────────────────
   A plain "fire on isIntersecting" observer has a real hole: if the
   viewport jumps past an element between two frames — anchor link,
   deep link with a hash, fast trackpad flick, restored scroll position
   — isIntersecting is never true at any sampled frame, and whatever we
   hid stays hidden forever. So also watch for the element having gone
   fully above the viewport and snap it to its final state instead.
   `run(true)` animates; `run(false)` means "you missed it, just show it".
   ─────────────────────────────────────────────────────────────── */
function onEnter(el, run, rootMargin = "-6% 0px") {
  const obs = new IntersectionObserver(entries => {
    const e = entries[entries.length - 1];
    if (e.isIntersecting) { obs.disconnect(); run(true); }
    else if (e.boundingClientRect.bottom <= 0) { obs.disconnect(); run(false); }
  }, { rootMargin });
  obs.observe(el);
}

/* ─── hero entrance ────────────────────────────────────────────── */
const hero = $(".hero, .page-hero");
if (hero) {
  const h1 = hero.querySelector("h1");
  const words = h1 ? splitWords(h1) : [];
  const rest = [
    hero.querySelector(".tagline"),
    hero.querySelector("p"),
    ...$$(".hero .pick a"),
    $(".hero .ph")
  ].filter(Boolean);

  utils.set(words, { opacity: 0, y: "0.5em" });
  utils.set(rest, { opacity: 0, y: 18 });
  const status = hero.querySelector(".status");
  if (status) utils.set(status, { opacity: 0, scale: 0.9 });

  const tl = createTimeline({ defaults: { ease: "out(3)" }, delay: loaderDelay() });
  if (status) tl.add(status, { opacity: 1, scale: 1, duration: 420 }, 0);
  tl.add(words, { opacity: 1, y: 0, duration: 720, delay: stagger(48) }, 120)
    .add(rest, { opacity: 1, y: 0, duration: 620, delay: stagger(70) }, "-=420");
}

/* ─── number count-up (anime owns this; app.js no longer does) ─── */
$$("[data-count]").forEach(el => {
  const target = parseFloat(el.dataset.count);
  const decimals = (el.dataset.count.split(".")[1] || "").length;
  const prefix = el.dataset.countPrefix || "";
  el.textContent = prefix + (0).toFixed(decimals);
  onEnter(el, play => {
    if (!play) return void (el.textContent = prefix + target.toFixed(decimals));
    const box = { n: 0 };
    animate(box, {
      n: target, duration: 1100, ease: "out(4)",
      onUpdate: () => { el.textContent = prefix + box.n.toFixed(decimals); }
    });
  }, "-10% 0px");
});

/* ─── section headings: word stagger on enter ──────────────────── */
$$(".sec-head h2, .msec-head h2, .show h2").forEach(h => {
  const words = splitWords(h);
  if (!words.length) return;
  utils.set(words, { opacity: 0, y: "0.45em" });
  onEnter(h, play => play
    ? animate(words, { opacity: 1, y: 0, duration: 700, ease: "out(3)", delay: stagger(42) })
    : utils.set(words, { opacity: 1, y: 0 }), "-8% 0px -12% 0px");
});

/* ─── signature cards: stagger from the grid's top-left ────────── */
const sig = $("#sigGrid");
if (sig) {
  const cards = [...sig.children];
  utils.set(cards, { opacity: 0, y: 30 });
  sig.classList.add("motion-owned"); // tells CSS to stop managing [data-stagger]
  onEnter(sig, play => play
    ? animate(cards, {
        opacity: 1, y: 0, duration: 780, ease: "out(3)",
        delay: stagger(80, { grid: [Math.min(3, cards.length), Math.ceil(cards.length / 3)], from: "first" })
      })
    : utils.set(cards, { opacity: 1, y: 0 }));
}

/* ─── delivery partners ────────────────────────────────────────── */
const partners = $("#partners");
if (partners) {
  const cards = [...partners.children];
  utils.set(cards, { opacity: 0, y: 24 });
  partners.classList.add("motion-owned");
  onEnter(partners, play => play
    ? animate(cards, { opacity: 1, y: 0, duration: 700, ease: "out(3)", delay: stagger(70) })
    : utils.set(cards, { opacity: 1, y: 0 }));
}

/* ─── menu rows: stagger per block ─────────────────────────────── */
$$(".mblock").forEach(block => {
  const rows = [...block.querySelectorAll(".item")];
  if (!rows.length) return;
  utils.set(rows, { opacity: 0, y: 14 });
  onEnter(block, play => play
    ? animate(rows, { opacity: 1, y: 0, duration: 520, ease: "out(3)", delay: stagger(26) })
    : utils.set(rows, { opacity: 1, y: 0 }), "-5% 0px -10% 0px");
});

/* ─── showcase panels: copy rises, image settles ───────────────── */
$$(".show").forEach(panel => {
  const copy = panel.querySelector(".copy");
  const ph = panel.querySelector(".ph");
  if (!copy) return;
  const bits = [...copy.children].filter(el => !el.matches("h2"));
  utils.set(bits, { opacity: 0, y: 20 });
  if (ph) utils.set(ph, { opacity: 0, scale: 1.04 });
  onEnter(panel, play => {
    if (!play) {
      if (ph) utils.set(ph, { opacity: 1, scale: 1 });
      return utils.set(bits, { opacity: 1, y: 0 });
    }
    if (ph) animate(ph, { opacity: 1, scale: 1, duration: 900, ease: "out(4)" });
    animate(bits, { opacity: 1, y: 0, duration: 640, ease: "out(3)", delay: stagger(60, { start: 160 }) });
  }, "-8% 0px -10% 0px");
});

/* ─── back to top: pop in with a little spring ─────────────────── */
const toTop = $("#toTop");
if (toTop) {
  let shown = false;
  const sync = () => {
    const should = scrollY > 600;
    if (should === shown) return;
    shown = should;
    animate(toTop, {
      opacity: should ? 1 : 0,
      scale: should ? 1 : 0.8,
      y: should ? 0 : 14,
      duration: should ? 620 : 260,
      ease: should ? "outBack(1.7)" : "out(2)"
    });
  };
  utils.set(toTop, { opacity: 0, scale: 0.8, y: 14 });
  toTop.classList.add("motion-owned");
  addEventListener("scroll", sync, { passive: true });
  sync();
}

/* ─── toast ────────────────────────────────────────────────────── */
const toastEl = $("#toast");
if (toastEl) {
  toastEl.classList.add("motion-owned");
  utils.set(toastEl, { opacity: 0, y: 20 });
  const mo = new MutationObserver(() => {
    const on = toastEl.classList.contains("on");
    animate(toastEl, {
      opacity: on ? 1 : 0,
      y: on ? 0 : 20,
      duration: on ? 460 : 240,
      ease: on ? "outBack(2)" : "out(2)"
    });
  });
  mo.observe(toastEl, { attributes: true, attributeFilter: ["class"] });
}

/* ─── drawer links stagger in ──────────────────────────────────── */
const drawer = $("#drawer");
if (drawer) {
  const links = [...drawer.children];
  const mo = new MutationObserver(() => {
    if (!document.body.classList.contains("nav-open")) return;
    utils.set(links, { opacity: 0, x: 26 });
    animate(links, { opacity: 1, x: 0, duration: 520, ease: "out(3)", delay: stagger(45, { start: 90 }) });
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
}

document.documentElement.classList.add("motion-ready");
