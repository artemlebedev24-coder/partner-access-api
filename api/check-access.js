export default async function handler(req, res) {
  // CORS: лучше поставить твой домен, но для теста можно *
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const emailRaw = req.body?.email || "";
  const email = String(emailRaw).trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(200).json({ ok: true, allowed: false, reason: "invalid_email" });
  }

  const baseId = process.env.BASE_ID;
  const table = process.env.TABLE_NAME;
  const token = process.env.AIRTABLE_PAT;
  const emailField = process.env.EMAIL_FIELD || "Email"; // точное имя поля в Airtable

  const listUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
  const formula = `LOWER({${emailField}})='${email.replace(/'/g, "\\'")}'`;

  // 1) search
  const searchRes = await fetch(`${listUrl}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    return res.status(200).json({ ok: false, allowed: false, reason: "airtable_search_failed" });
  }

  const searchData = await searchRes.json();
  const existing = searchData?.records?.[0];

  if (existing) {
    return res.status(200).json({ ok: true, allowed: true, created: false });
  }

  // 2) create if not exists
  const createRes = await fetch(listUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      records: [
        { fields: { [emailField]: email } }
      ]
    })
  });

  if (!createRes.ok) {
    return res.status(200).json({ ok: false, allowed: false, reason: "airtable_create_failed" });
  }

  return res.status(200).json({ ok: true, allowed: true, created: true });
}
