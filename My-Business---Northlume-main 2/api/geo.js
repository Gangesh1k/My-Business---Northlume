// Vercel Function: the visitor's approximate location from Vercel's own edge headers (city level, no IP stored).
export default function handler(req, res) {
  const h = (k) => { const v = req.headers[k]; try { return v ? decodeURIComponent(String(v)) : ''; } catch { return String(v || ''); } };
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ country: h('x-vercel-ip-country'), region: h('x-vercel-ip-country-region'), city: h('x-vercel-ip-city') });
}
