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
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) throw new Error("reduced-motion: motion layer disabled");

// Dynamic + gated behind the check above: reduced-motion visitors never pay
// the download/parse cost of the vendor bundle at all, not just the
// animations themselves (top-level await is fine — this file is a module).
const { animate, createTimeline, stagger, svg, utils } = await import("./vendor/anime.esm.min.js");

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

/* Used to be a ~1.45s delay so the hero wouldn't visibly "pop in" right after
   the loader cleared. That was solving the wrong problem: the hero sits
   behind the opaque #loader (z-index 9999) the whole time it's covering the
   screen, so there is nothing to see either way. Starting the reveal at 0
   instead means it finishes settling (~1.3s) *before* the loader's own 1.4s
   wipe exposes it — same "arrives already in place" result, but the hero
   (the page's actual LCP element) is no longer sitting at opacity:0 for an
   extra second-plus after the loader is gone. */
const loaderDelay = () => 0;

/* ─── loader: the logo assembles itself, piece by piece ────────────
   Previously this was an <img src="logo.svg"> — opaque raster-ish content
   anime can only pop or fade as one flat unit, which is exactly what read
   as "just a picture." The markup is now the real inline SVG (see
   index.html/menu.html/contact.html), so each part — badge outline,
   wordmark, burger, banner — is its own DOM node anime can drive on its
   own schedule. The CSS pop-in on .llogo (lpop) stays as the no-JS
   fallback: it fades/settles the whole lockup as one piece, which is a
   perfectly reasonable "quieter" loader if this script never runs.

   Sequence (fits inside the .9s hold before the exit fires):
     0ms    badge outline draws on         (svg.createDrawable)
     150ms  flames flare in underneath     (existing, unchanged)
     180ms  wordmark cascades line by line (shadow+front move as a pair,
                                             or the drop-shadow look breaks)
     280ms  burger stacks top to bottom
     560ms  banner seals it
     900ms  exit — panel and content leave together                     */
const loaderEl = $("#loader");
if (loaderEl && !document.documentElement.classList.contains("loaded-before")) {
  const outline = $("#loader #badge-outline");
  if (outline) {
    const [drawable] = svg.createDrawable(outline);
    animate(drawable, { draw: ["0 0", "0 1"], duration: 380, ease: "out(2)" });
  }

  const flames = $$("#loader .lflame path");
  if (flames.length) {
    utils.set(flames, { opacity: 0 });
    animate(flames, { opacity: [0, 1], duration: 480, ease: "out(2)", delay: stagger(90, { start: 150 }) });
  }

  // Shadow and front text must move as matched pairs — staggering them
  // independently would slide the drop-shadow out of register mid-flight.
  // NOTE: anime writes the plain `y` shorthand onto an element's native SVG
  // attribute when it has one (<text>'s y, <rect>'s y, ...) instead of a CSS
  // transform — that clobbers the real baseline/position with the -16..0
  // offset itself. `translateY` forces a CSS transform on every tag, so the
  // original SVG geometry stays intact underneath.
  const wordmark = $("#loader #wordmark");
  if (wordmark) {
    const [shadowLines, frontLines] = [...wordmark.children].map(g => [...g.children]);
    const pairs = shadowLines.map((line, i) => [line, frontLines[i]]);
    utils.set(pairs.flat(), { opacity: 0, translateY: -16 });
    pairs.forEach((pair, i) => {
      animate(pair, { opacity: 1, translateY: 0, duration: 200, ease: "out(3)", delay: 180 + i * 70 });
    });
  }

  const burgerPieces = [...($("#loader #burger")?.children || [])];
  if (burgerPieces.length) {
    utils.set(burgerPieces, { opacity: 0, translateY: 10, scale: 0.9 });
    animate(burgerPieces, {
      opacity: 1, translateY: 0, scale: 1, duration: 130, ease: "out(3)",
      delay: stagger(22, { start: 280 })
    });
  }

  const banner = $("#loader #banner");
  if (banner) {
    utils.set(banner, { opacity: 0, translateY: 10 });
    animate(banner, { opacity: 1, translateY: 0, duration: 240, ease: "outBack(1.8)", delay: 560 });
  }

  setTimeout(() => {
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
