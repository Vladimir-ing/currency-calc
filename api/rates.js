const CODES = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'TRY', 'AED', 'KZT', 'BYN', 'GEL', 'THB'];

function readTag(block, name) {
  const match = block.match(new RegExp(`<${name}>([^<]+)</${name}>`));
  return match ? match[1].trim() : '';
}

function parseRates(xml) {
  const dateText = xml.match(/<ValCurs\b[^>]*\bDate="(\d{2})\.(\d{2})\.(\d{4})"/);
  if (!dateText) throw new Error('Дата курса не найдена');
  const rates = { RUB: 1 };
  for (const match of xml.matchAll(/<Valute\b[^>]*>([\s\S]*?)<\/Valute>/g)) {
    const code = readTag(match[1], 'CharCode');
    if (!CODES.includes(code)) continue;
    const nominal = Number(readTag(match[1], 'Nominal'));
    const value = Number(readTag(match[1], 'Value').replace(',', '.'));
    if (!Number.isFinite(nominal) || nominal <= 0 || !Number.isFinite(value) || value <= 0) throw new Error(`Неверный курс ${code}`);
    rates[code] = value / nominal;
  }
  if (CODES.some(code => !Number.isFinite(rates[code]))) throw new Error('Не все валюты найдены в ответе ЦБ РФ');
  return { result: 'success', date: `${dateText[3]}-${dateText[2]}-${dateText[1]}`, rates };
}

async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  try {
    const upstream = await fetch('https://www.cbr.ru/scripts/XML_daily.asp', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!upstream.ok) throw new Error(`ЦБ РФ: HTTP ${upstream.status}`);
    const xml = new TextDecoder('windows-1251').decode(await upstream.arrayBuffer());
    return response.status(200).json(parseRates(xml));
  } catch (error) {
    console.error('Не удалось получить курс ЦБ РФ:', error);
    return response.status(502).json({ error: 'Rates unavailable' });
  }
}

module.exports = handler;
module.exports.parseRates = parseRates;
