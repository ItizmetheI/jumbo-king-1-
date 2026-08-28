/**
 * Jumbo King Burger — Cloudflare Worker
 *
 * Serves the static site and handles one POST endpoint (contact / franchise
 * enquiries). Everything degrades: no KV binding means no rate limiting and no
 * stored copy, no RESEND_API_KEY means no email — the endpoint still validates
 * and still tells the customer the truth about what happened.
 */

const ORIGIN_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // Inline scripts are hashed rather than nonce'd so the site stays static and
  // cacheable. style-src keeps 'unsafe-inline' because the markup uses style=""
  // attributes; that is a far smaller risk surface than inline script.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'sha256-snn76VxYj4st78Oq1MEE8S9HRmQStQCwWJXzAw158Mk=' 'sha256-Du+OJKJSbdUgz5nrHeWWINvez6XKDDU/tyj/5c2uvwo='",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "frame-src https://www.google.com https://maps.google.com",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join("; ")
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...ORIGIN_HEADERS }
  });

/* ─── validation ──────────────────────────────────────────────────
   Every field is checked here as well as in the browser. Client-side
   validation is a convenience for the customer; this is the real gate. */
const MAX = { name: 80, email: 160, phone: 32, message: 2000, location: 120, capital: 60, experience: 60 };

function validate(form) {
  const errors = {};
  const clean = {};

  const name = String(form.get("name") || "").trim();
  if (name.length < 2) errors.name = "Please give us a name.";
  else if (name.length > MAX.name) errors.name = "That name is too long.";
  else clean.name = name;

  const email = String(form.get("email") || "").trim();
  // deliberately permissive: the only authority on a deliverable address is a
  // delivery attempt, so reject the clearly-broken and accept the rest
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Check the email address.";
  else if (email.length > MAX.email) errors.email = "That email is too long.";
  else clean.email = email;

  const phone = String(form.get("phone") || "").trim();
  if (phone && !/^[\d\s()+.-]{7,}$/.test(phone)) errors.phone = "Check the phone number.";
  else if (phone.length > MAX.phone) errors.phone = "That phone number is too long.";
  else clean.phone = phone;

  const message = String(form.get("message") || "").trim();
  if (message.length < 5) errors.message = "Tell us a little about what you need.";
  else if (message.length > MAX.message) errors.message = "Please keep it under 2000 characters.";
  else clean.message = message;

  // franchise enquiry only — optional passthrough
  const location = String(form.get("location") || "").trim().slice(0, MAX.location);
  if (location) clean.location = location;
  const capital = String(form.get("capital") || "").trim().slice(0, MAX.capital);
  if (capital) clean.capital = capital;
  const experience = String(form.get("experience") || "").trim().slice(0, MAX.experience);
  if (experience) clean.experience = experience;

  clean.kind = String(form.get("form-name") || "").trim() === "franchise" ? "franchise" : "contact";

  return { errors, clean, ok: Object.keys(errors).length === 0 };
}

/* Two cheap bot filters that cost a real customer nothing: a field no human
   can see, and a form submitted faster than a human could have typed it. */
function looksAutomated(form) {
  if (String(form.get("company") || "").trim()) return "honeypot";
  const startedRaw = form.get("startedAt");
  // a missing field must NOT be treated as timing data — Number(null) and
  // Number("") both coerce to 0, which reads as "6 hours stale" and would
  // silently drop every submission that omits this field
  if (startedRaw) {
    const started = Number(startedRaw);
    if (Number.isFinite(started) && started > 0) {
      const elapsed = Date.now() - started;
      if (elapsed < 3000) return "too-fast";
      if (elapsed > 1000 * 60 * 60 * 6) return "stale";
    }
  }
  return null;
}

async function rateLimited(env, ip) {
  if (!env.ENQUIRIES) return false; // no KV bound — fail open, don't block customers
  const key = `rl:${ip}`;
  const count = Number((await env.ENQUIRIES.get(key)) || 0);
  if (count >= 5) return true;
  await env.ENQUIRIES.put(key, String(count + 1), { expirationTtl: 3600 });
  return false;
}

async function sendEmail(env, data) {
  if (!env.RESEND_API_KEY || !env.ENQUIRY_TO) return { sent: false, reason: "not-configured" };
  const lines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    data.location ? `Location: ${data.location}` : null,
    data.capital ? `Liquid capital: ${data.capital}` : null,
    data.experience ? `Experience: ${data.experience}` : null,
    "",
    data.message
  ].filter(Boolean);

  const subjectPrefix = data.kind === "franchise" ? "License enquiry" : "Contact enquiry";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.ENQUIRY_FROM || "Jumbo King Burger <enquiries@jumbokingburgers.com>",
      to: [env.ENQUIRY_TO],
      reply_to: data.email,
      subject: `${subjectPrefix} — ${data.name}`,
      text: lines.join("\n")
    })
  });
  if (res.ok) return { sent: true, reason: null };
  // Resend explains refusals in the body (unverified domain, bad key, bad
  // from-address). Surfacing it in the log is the difference between a
  // fixable error and a silent "could not send".
  const detail = await res.text().catch(() => "");
  console.error("resend send failed", res.status, detail);
  return { sent: false, reason: `resend-${res.status}`, detail };
}

async function handleEnquiry(request, env, ctx) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  if (await rateLimited(env, ip)) {
    return json({ ok: false, error: "Too many enquiries from this connection. Try again later, or call us." }, 429);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Could not read that submission." }, 400);
  }

  // Bots get the same success shape as humans — telling them which filter
  // caught them just helps them tune around it.
  const bot = looksAutomated(form);
  if (bot) return json({ ok: true, queued: true });

  const { errors, clean, ok } = validate(form);
  if (!ok) return json({ ok: false, errors }, 422);

  const record = { ...clean, ip, at: new Date().toISOString() };

  let stored = false;
  if (env.ENQUIRIES) {
    // Keep a copy regardless of whether email is wired up, so an enquiry is
    // never silently lost because a key expired.
    await env.ENQUIRIES.put(`enquiry:${record.at}:${crypto.randomUUID()}`, JSON.stringify(record), {
      expirationTtl: 60 * 60 * 24 * 180
    });
    stored = true;
  }

  const mail = await sendEmail(env, clean);

  if (!stored && !mail.sent) {
    return json({
      ok: false,
      error: "We could not record that enquiry. Please call the store instead."
    }, 503);
  }

  return json({ ok: true, emailed: mail.sent, stored });
}

function withHeaders(res, url) {
  const out = new Response(res.body, res);
  Object.entries(ORIGIN_HEADERS).forEach(([k, v]) => out.headers.set(k, v));
  // Fingerprinted assets could be immutable; these are not, so revalidate.
  if (url.pathname.startsWith("/assets/")) {
    out.headers.set("Cache-Control", "public, max-age=3600, must-revalidate");
  } else if (/\.(html?)$|^\/(menu|contact)?$/.test(url.pathname)) {
    out.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }
  return out;
}

/* The Worker answers on its *.workers.dev subdomain as well as the custom
   domain, so Google indexed that subdomain as a SECOND, separate site — and
   labelled it "Cloudflare", since workers.dev is a Cloudflare-owned domain.
   Canonical tags alone don't retire it while the URL still serves a live 200,
   so send a permanent redirect: it consolidates ranking signals onto the real
   hostname and tells search to drop the duplicate. */
const CANONICAL_HOST = "jumbokingburgers.com";

/* Search Console can only remove a URL from a property you've verified, and
   verifying the workers.dev subdomain needs it to serve a proof file — which
   the blanket redirect below would otherwise swallow. Let just that one file
   through, so the subdomain can be claimed and its stale result removed. It
   exposes nothing: the file's only content is a verification token. */
const GOOGLE_VERIFY = /^\/google[0-9a-z]+\.html$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Anything that isn't the canonical host (the workers.dev subdomain, www)
    // is a duplicate of the same site. Collapse them all onto one hostname so
    // search never has two copies to choose between. The !== check also makes
    // a redirect loop impossible: the canonical host never redirects itself.
    if (url.hostname !== CANONICAL_HOST && !GOOGLE_VERIFY.test(url.pathname)) {
      return Response.redirect(
        `https://${CANONICAL_HOST}${url.pathname}${url.search}`,
        301
      );
    }

    if (url.pathname === "/api/enquiry") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "Method not allowed" }, 405);
      }
      return handleEnquiry(request, env, ctx);
    }

    const res = await env.ASSETS.fetch(request);
    return withHeaders(res, url);
  }
};
