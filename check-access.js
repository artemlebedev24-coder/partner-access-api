export default async function handler(req, res) {
  // ⚠️ Поменяй на свой домен Webflow (или временно поставь *)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const email = (req.body?.email || "").trim().toLowerCase();
  if (!email) return res.status(200).json({ ok: true, allowed: false });

  const baseId = process.env.BASE_ID;
  const table = process.env.TABLE_NAME;
  const token = process.env.AIRTABLE_PAT;
  const emailField = process.env.EMAIL_FIELD || "Email";

  const formula = `LOWER({${emailField}})='${email.replace(/'/g, "\\'")}'`;
  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}` +
    `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return res.status(200).json({ ok: false, allowed: false });

  const data = await r.json();
  const allowed = !!data?.records?.[0];

  return res.status(200).json({ ok: true, allowed });
}
