const Airtable = require('airtable');

// Инициализация Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

module.exports = async (req, res) => {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'Invalid email address' });
    }

    const emailLower = email.trim().toLowerCase();
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Emails'; // Имя таблицы в Airtable
    const emailFieldName = process.env.AIRTABLE_EMAIL_FIELD || 'Email'; // Имя поля с email

    // Ищем email в таблице
    const records = await base(tableName)
      .select({
        filterByFormula: `LOWER({${emailFieldName}}) = "${emailLower}"`,
        maxRecords: 1
      })
      .firstPage();

    let emailExists = records.length > 0;

    // Если email не найден, добавляем его
    if (!emailExists) {
      try {
        await base(tableName).create([
          {
            fields: {
              [emailFieldName]: emailLower,
              // Можно добавить дополнительные поля, например дату
              ...(process.env.AIRTABLE_DATE_FIELD && {
                [process.env.AIRTABLE_DATE_FIELD]: new Date().toISOString()
              })
            }
          }
        ]);
        emailExists = true; // После добавления считаем, что доступ открыт
      } catch (createError) {
        console.error('Error creating record:', createError);
        // Если ошибка создания, но это не критично - все равно даем доступ
        // (возможно, email уже был добавлен параллельным запросом)
      }
    }

    // Возвращаем успешный ответ с доступом
    return res.status(200).json({
      ok: true,
      allowed: true,
      exists: emailExists
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
