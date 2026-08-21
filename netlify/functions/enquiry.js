/**
 * Jumbo King Burger — Netlify Function
 *
 * Real backend for the contact / franchise forms. This is what actually runs
 * on the live site (jumbokingburgers.com is served by Netlify) — the
 * Cloudflare Worker in worker/index.js is a separate demo deploy, not this.
 * Same validation and email contract as the Worker, ported to Netlify's
 * handler(event) signature instead of a Fetch-style Request.
 *
 * ENQUIRY_TO is hardcoded below (not a secret — it's just a destination
 * address). RESEND_API_KEY is a real secret and must be set in the Netlify
 * dashboard: Site configuration -> Environment variables. Without it the
 * function still validates the submission and says so honestly; it just
 * can't send the email.
 */

const ENQUIRY_TO = "Jethwafoods@aol.com";
const ENQUIRY_FROM = process.env.ENQUIRY_FROM || "Jumbo King Burger <enquiries@jumbokingburgers.com>";

const MAX = { name: 80, email: 160, phone: 32, message: 2000, location: 120, capital: 60, experience: 60 };

function validate(form) {
  const errors = {};
  const clean = {};

  const name = String(form.get("name") || "").trim();
  if (name.length < 2) errors.name = "Please give us a name.";
  else if (name.length > MAX.name) errors.name = "That name is too long.";
  else clean.name = name;

  const email = String(form.get("email") || "").trim();
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

  const location = String(form.get("location") || "").trim().slice(0, MAX.location);
  if (location) clean.location = location;
  const capital = String(form.get("capital") || "").trim().slice(0, MAX.capital);
  if (capital) clean.capital = capital;
  const experience = String(form.get("experience") || "").trim().slice(0, MAX.experience);
  if (experience) clean.experience = experience;

  clean.kind = String(form.get("form-name") || "").trim() === "franchise" ? "franchise" : "contact";

  return { errors, clean, ok: Object.keys(errors).length === 0 };
}

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

async function sendEmail(data) {
  if (!process.env.RESEND_API_KEY) return { sent: false, reason: "not-configured" };
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
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ENQUIRY_FROM,
      to: [ENQUIRY_TO],
      reply_to: data.email,
      subject: `${subjectPrefix} — ${data.name}`,
      text: lines.join("\n")
    })
  });
  return { sent: res.ok, reason: res.ok ? null : `resend-${res.status}` };
}

const json = (obj, statusCode = 200) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(obj)
});

exports.handler = async event => {
  if (event.httpMethod !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const form = new URLSearchParams(event.body || "");

  const bot = looksAutomated(form);
  if (bot) return json({ ok: true, queued: true });

  const { errors, clean, ok } = validate(form);
  if (!ok) return json({ ok: false, errors }, 422);

  const mail = await sendEmail(clean);

  if (!mail.sent) {
    return json({
      ok: false,
      error: "We could not send that enquiry. Please call the store instead."
    }, 503);
  }

  return json({ ok: true, emailed: true });
};
