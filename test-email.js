/**
 * One-off test — sends seat reminder to a single email only.
 * Delete this file after testing.
 */
const fetch = require("node-fetch");

const EMAILJS_PUBLIC_KEY  = "lKZ5jIxav3mK6JvZa";
const EMAILJS_SERVICE_ID  = "service_599tber";
const EMAILJS_TEMPLATE_ID = "template_2vey8lc";
const EMAILJS_PRIVATE_KEY = "EifNTrtZrqGKxVfcx7ZjX";
const SHEETDB              = "https://sheetdb.io/api/v1/bb81jmylk3aer";
const TEST_EMAIL           = "damimmanuel7@gmail.com";

async function main() {
  console.log("⟳  Fetching registrants to get real seat number…");
  const res = await fetch(SHEETDB);
  const all = await res.json();

  const map = new Map();
  for (const rec of all) {
    const key = rec.Email.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, rec);
    } else {
      if (new Date(rec.Timestamp) < new Date(map.get(key).Timestamp)) {
        map.set(key, rec);
      }
    }
  }

  const list = Array.from(map.values())
    .sort((a, b) => new Date(a.Timestamp) - new Date(b.Timestamp))
    .map((rec, i) => ({ ...rec, _seat: i + 1 }));

  const person = list.find(r => r.Email.trim().toLowerCase() === TEST_EMAIL.toLowerCase());
  if (!person) {
    console.error("✗  Email not found in registrants:", TEST_EMAIL);
    process.exit(1);
  }

  const seat = String(person._seat).padStart(3, "0");
  console.log(`✓  Found: ${person.Name} — Seat ${seat} — ${person.Email}`);
  console.log("⟳  Sending test email…");

  const sendRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({
      service_id  : EMAILJS_SERVICE_ID,
      template_id : EMAILJS_TEMPLATE_ID,
      user_id     : EMAILJS_PUBLIC_KEY,
      accessToken : EMAILJS_PRIVATE_KEY,
      template_params: {
        to_name     : person.Name,
        to_email    : person.Email,
        seat_number : seat,
        serial      : person.Serial,
        from_name   : "NGWS Team",
      },
    }),
  });

  if (sendRes.ok) {
    console.log(`✓  Email sent to ${person.Email} — check your inbox!`);
  } else {
    const body = await sendRes.text();
    console.error(`✗  Failed: ${sendRes.status} — ${body}`);
  }
}

main().catch(err => { console.error("Error:", err); process.exit(1); });
