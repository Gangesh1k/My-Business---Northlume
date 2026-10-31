// SAP bank reconciliation engine: G/L bank account line items (FBL3N / ACDOCA) ↔ bank statement (MT940 / CSV).
// Pure functions — used by the live demo and by "use my SAP files" (runs in the browser only).
import type { Cell } from './emailInsights';

export interface GlItem { id: string; doc: string; type: string; date: string; amt: number; ref: string; text: string; assign: string }
export interface BankLine { id: string; line: string; date: string; amt: number; code: string; ref: string; narr: string; hint?: string }
export type RuleKey = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
export interface MatchGroup { rule: RuleKey; bank: BankLine; gl: GlItem[]; diff: number; conf: number }
export type ExSev = 'high' | 'med' | 'low';
export type Adj = 'bank' | 'book' | 'book-fee' | 'book-err';
export interface ReconException {
  key: string; side: 'bank' | 'gl' | 'matched'; item?: GlItem | BankLine; amt: number; adj: Adj; sev: ExSev;
  title: string; why: string; act: string; je?: [string, string, number][]; ai?: string;
}
export interface ReconResult {
  groups: MatchGroup[]; exceptions: ReconException[]; unmatchedBank: BankLine[]; unmatchedGl: GlItem[];
  opening: number; bankClose: number; bookClose: number; adjBank: number; adjBook: number; periodEnd: string;
}
export interface ReconData { gl: GlItem[]; bank: BankLine[]; opening: number; bankClosing?: number; scope: { company: string; houseBank: string; glAccount: string; statement: string; period: string; currency: string } }

export const RULES: { k: RuleKey; name: string; desc: string }[] = [
  { k: 'R1', name: 'Reference + amount', desc: 'Bank reference equals SAP reference, same amount' },
  { k: 'R2', name: 'Reference + bank charge', desc: 'Same reference, difference within charge tolerance' },
  { k: 'R3', name: 'Invoice no. in narrative', desc: 'SAP reference found in the :86: text, same amount' },
  { k: 'R4', name: 'Payment run / lockbox (1:n)', desc: 'Bank total equals the sum of grouped SAP items' },
  { k: 'R5', name: 'Amount + value-date window', desc: 'Unique same-amount item within the date window' },
];

export const r2 = (n: number) => Math.round(n * 100) / 100;
const sumAmt = (a: { amt: number }[]) => r2(a.reduce((s, x) => s + x.amt, 0));
const dayNo = (iso: string) => Math.round(Date.parse(iso + 'T00:00:00Z') / 864e5);
const gap = (a: string, b: string) => Math.abs(dayNo(a) - dayNo(b));
export const money = (n: number) => (n < 0 ? '-' : '') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ------------------------------------------------------------------ sample data (synthetic, deterministic)
export function sampleData(): ReconData {
  const pad = (n: number) => `2026-10-${String(n).padStart(2, '0')}`;
  const gl: GlItem[] = [], bank: BankLine[] = [];
  const no: Record<string, number> = { DZ: 1400004210, KZ: 1500002330, ZP: 2000000810 };
  const G = (type: string, day: number, amt: number, ref: string, text: string, assign?: string) =>
    gl.push({ id: 'G' + gl.length, doc: String(no[type]++), type, date: pad(day), amt: r2(amt), ref, text, assign: assign ?? ref });
  const B = (day: number, amt: number, code: string, ref: string, narr: string, hint?: string) =>
    bank.push({ id: 'B' + bank.length, line: '', date: pad(day), amt: r2(amt), code, ref, narr, hint });

  ([['Halvorsen Retail Ltd', 2, 18450, '90001812'], ['Brightwater Foods', 3, 7325.6, '90001820'], ['Kestrel Logistics', 6, 12980, '90001833'], ['Meridian Health Supplies', 8, 4410.25, '90001841'],
    ['Oakline Hardware', 10, 9875, '90001850'], ['Sundara Textiles', 14, 23600, '90001862'], ['Pinecrest Pharma', 17, 15240.8, '90001871'], ['Atlas Auto Parts', 21, 6080, '90001884']] as const)
    .forEach(([p, d, a, r]) => { G('DZ', d, a, r, 'Incoming pmt ' + p); B(d, a, 'NTRF', r, `/ORDP/${p.toUpperCase()} /REMI/${r}`); });
  ([['Rexford Steel Co', 4, 32150, 'RS-55102'], ['Greenfield Utilities', 7, 2845.37, 'GU-OCT-0931'], ['Cobalt IT Services', 15, 11200, 'CIT-7781'], ['Tidewater Chemicals', 22, 8930.4, 'TC-24019']] as const)
    .forEach(([p, d, a, r]) => { G('KZ', d, -a, r, 'Outgoing pmt ' + p); B(d, -a, 'NTRF', r, `/BENM/${p.toUpperCase()} /REMI/${r}`); });
  ([['Northgate Electronics', 9, 5615, 2, '90001846'], ['Vellum Packaging', 16, 3290.45, 1, '90001866']] as const)
    .forEach(([p, d, a, lag, r]) => { G('DZ', d, a, r, 'Incoming pmt ' + p); B(d + lag, a, 'NTRF', 'NONREF', `/ORDP/${p.toUpperCase()} PAYMENT`); });
  ([['Apex Freight Lines', 18, 4720, 2, 'AFL-3302'], ['Lumen Office Supply', 23, 1186.9, 3, 'LOS-1187']] as const)
    .forEach(([p, d, a, lag, r]) => { G('KZ', d, -a, r, 'Outgoing pmt ' + p); B(d + lag, -a, 'NTRF', 'NONREF', `/BENM/${p.toUpperCase()}`); });
  G('DZ', 12, 8140, '90001845', 'Incoming pmt Brightwater Foods'); B(12, 8140, 'NTRF', 'NONREF', 'PAYMT FOR INV.90001845 BRIGHTWATER FOODS');
  G('DZ', 24, 2675.5, '90001893', 'Incoming pmt Kestrel Logistics'); B(25, 2675.5, 'NTRF', 'NONREF', 'KESTREL LOG INV 90001893 THANK YOU');
  G('KZ', 20, -6400, 'GF-1120', 'Outgoing pmt Granite Facilities Mgmt'); B(20, -6400, 'NTRF', 'NONREF', 'GRANITE FAC MGMT INV GF-1120');
  G('DZ', 11, 14500, '90001858', 'Incoming pmt Sundara Textiles'); B(11, 14475, 'NTRF', '90001858', '/ORDP/SUNDARA TEXTILES /REMI/90001858 /CHGS/USD25,00');
  G('DZ', 27, 9800, '90001902', 'Incoming pmt Pinecrest Pharma'); B(27, 9787.5, 'NTRF', '90001902', '/ORDP/PINECREST PHARMA /REMI/90001902 /CHGS/USD12,50');
  G('KZ', 13, -5250, 'SIB-0412', 'Outgoing pmt Summit Insurance Brokers'); B(13, -5265, 'NTRF', 'SIB-0412', '/BENM/SUMMIT INSURANCE /REMI/SIB-0412 /CHGS/USD15,00');
  ([['Rexford Steel Co', 12400], ['Apex Freight Lines', 3870.25], ['Cobalt IT Services', 5600], ['Lumen Office Supply', 940.75]] as const)
    .forEach(([p, a], i) => G('ZP', 20, -a, `PR-20261020-${i + 1}`, 'Pmt run F110 ' + p, 'PR-20261020'));
  B(21, -22811, 'NTRF', 'PR-20261020', 'BATCH PAYMENT PR-20261020 4 ITEMS');
  ([['Halvorsen Retail Ltd', 6200, '90001880'], ['Oakline Hardware', 3145.2, '90001889'], ['Atlas Auto Parts', 1888.8, '90001897']] as const)
    .forEach(([p, a, r]) => G('DZ', 28, a, r, 'Lockbox ' + p, 'LBX-1028'));
  B(28, 11234, 'NTRF', 'LBX-1028', 'LOCKBOX DEPOSIT LBX-1028 3 ITEMS');
  B(19, 2750, 'NTRF', 'NONREF', '/ORDP/H RETAIL PAYMENT', '86% likely Halvorsen Retail Ltd — open invoice 90001877 for 2,750.00 (FBL5N, due 18 Oct). Payer name "H RETAIL" matches a known alias.');
  B(25, -1180, 'NDDT', '44-1902', 'SEPA DD SUMMIT INSURANCE POLICY 44-1902', 'Policy 44-1902 debits 1,180.00 on the 25th every month — suggest a recurring entry (FBD1).');
  B(31, -45, 'NCHG', 'NONREF', 'ACCOUNT MAINTENANCE FEE OCT 2026');
  B(31, 312.4, 'NINT', 'NONREF', 'CREDIT INTEREST OCT 2026');
  G('KZ', 3, -1530, 'CHK 100471', 'Cheque Lumen Office Supply');
  G('KZ', 29, -3450, 'CHK 100482', 'Cheque Rexford Steel Co');
  G('KZ', 30, -728.6, 'CHK 100483', 'Cheque Greenfield Utilities');
  G('DZ', 31, 4975, '90001911', 'Incoming pmt Meridian Health Supplies');
  G('KZ', 15, -11200, 'CIT-7781', 'Outgoing pmt Cobalt IT Services');
  gl.sort((a, b) => a.date.localeCompare(b.date) || a.doc.localeCompare(b.doc));
  bank.sort((a, b) => a.date.localeCompare(b.date));
  bank.forEach((b, i) => (b.line = String(i + 1).padStart(3, '0')));
  return {
    gl, bank, opening: 1284560.18,
    scope: { company: '1000 · NorthStar Mfg Inc.', houseBank: 'CITI1 / 0001', glAccount: '113100 Citibank Main', statement: 'MT940 · 00045/001', period: '01–31 Oct 2026', currency: 'USD' },
  };
}

// ------------------------------------------------------------------ matching engine
export function reconcile(data: ReconData, tolDays: number, tolFee: number): ReconResult {
  const { gl: GL, bank: BK } = data;
  const usedG = new Set<string>(), usedB = new Set<string>(), groups: MatchGroup[] = [];
  const freeG = () => GL.filter(g => !usedG.has(g.id)), freeB = () => BK.filter(b => !usedB.has(b.id));
  const add = (rule: RuleKey, b: BankLine, gs: GlItem[], conf: number) => {
    usedB.add(b.id); gs.forEach(g => usedG.add(g.id));
    groups.push({ rule, bank: b, gl: gs, diff: r2(b.amt - sumAmt(gs)), conf });
  };
  const hasRef = (b: BankLine) => !!b.ref && !/^NONREF$/i.test(b.ref);
  const win = Math.max(tolDays, 1);

  freeB().forEach(b => { if (!hasRef(b)) return; const g = freeG().find(g => g.ref === b.ref && g.amt === b.amt); if (g) add('R1', b, [g], 100); });
  freeB().forEach(b => {
    if (!hasRef(b)) return;
    const g = freeG().find(g => g.ref === b.ref && Math.sign(g.amt) === Math.sign(b.amt) && Math.abs(b.amt - g.amt) > 0 && Math.abs(b.amt - g.amt) <= tolFee + 1e-9);
    if (g) add('R2', b, [g], 97);
  });
  freeB().forEach(b => {
    const t = b.narr.toUpperCase();
    const g = freeG().find(g => g.ref.length >= 4 && g.amt === b.amt && t.includes(g.ref.toUpperCase()) && gap(b.date, g.date) <= win);
    if (g) add('R3', b, [g], 95);
  });
  const byAssign: Record<string, GlItem[]> = {};
  freeG().forEach(g => { if (g.assign && g.assign !== g.ref) (byAssign[g.assign] ||= []).push(g); });
  freeB().forEach(b => {
    const t = (b.narr + ' ' + b.ref).toUpperCase();
    for (const key in byAssign) {
      const gs = byAssign[key].filter(g => !usedG.has(g.id));
      if (gs.length > 1 && t.includes(key.toUpperCase()) && sumAmt(gs) === b.amt && gap(b.date, gs[0].date) <= win) { add('R4', b, gs, 99); break; }
    }
  });
  freeB().forEach(b => {
    const c = freeG().filter(g => g.amt === b.amt && gap(b.date, g.date) <= tolDays);
    if (c.length === 1) add('R5', b, c, Math.max(80, 92 - gap(b.date, c[0].date) * 3));
  });

  const unmatchedBank = freeB(), unmatchedGl = freeG();
  const all = [...GL.map(g => g.date), ...BK.map(b => b.date)].sort();
  const periodEnd = all[all.length - 1] ?? '';
  const exc: ReconException[] = [];
  const matchedRefs = new Set(groups.flatMap(x => x.gl.map(g => g.ref + '|' + g.amt)));

  unmatchedBank.forEach(b => {
    const base = { key: b.id, side: 'bank' as const, item: b, amt: b.amt, adj: 'book' as Adj, ai: b.hint };
    const narr = b.narr.toUpperCase();
    if (b.code === 'NCHG' || (b.amt < 0 && /CHARGE|FEE|COMMISSION|GST/.test(narr)))
      exc.push({ ...base, sev: 'med', title: 'Bank charge not booked', why: 'Fee debited by the bank with no matching SAP posting.', act: 'Post via FEBAN · bank-charges rule', je: [['Dr', '479000 Bank charges', -b.amt], ['Cr', `${data.scope.glAccount.split(' ')[0]} Bank`, -b.amt]] });
    else if (b.code === 'NINT' || (b.amt > 0 && /INTEREST/.test(narr)))
      exc.push({ ...base, sev: 'med', title: 'Interest credit not booked', why: 'Interest credited by the bank, not yet in SAP.', act: 'Post via FEBAN · interest rule', je: [['Dr', `${data.scope.glAccount.split(' ')[0]} Bank`, b.amt], ['Cr', '711000 Interest income', b.amt]] });
    else if (b.code === 'NDDT' || /DIRECT DEBIT|SEPA DD|\bDD\b|NACH|ECS/.test(narr))
      exc.push({ ...base, sev: 'high', title: 'Direct debit not booked', why: 'Amount collected by direct debit with no invoice or payment in SAP.', act: 'Book invoice and clear via FB05', je: [['Dr', 'Vendor account', -b.amt], ['Cr', `${data.scope.glAccount.split(' ')[0]} Bank`, -b.amt]] });
    else if (b.amt > 0 && !hasRef(b))
      exc.push({ ...base, sev: 'high', title: 'Unidentified receipt', why: 'Customer payment without remittance details.', act: 'Identify customer, clear via F-28', je: [['Dr', `${data.scope.glAccount.split(' ')[0]} Bank`, b.amt], ['Cr', 'Customer / suspense', b.amt]] });
    else
      exc.push({ ...base, sev: 'med', title: b.amt > 0 ? 'Bank credit not found in SAP' : 'Bank debit not found in SAP', why: 'No SAP item met the current tolerances. Widen the window or charge tolerance, or investigate.', act: 'Investigate' });
  });
  unmatchedGl.forEach(g => {
    const base = { key: g.id, side: 'gl' as const, item: g, amt: g.amt, adj: 'bank' as Adj };
    const age = periodEnd ? dayNo(periodEnd) - dayNo(g.date) : 0;
    const cheque = /^(CHK|CHQ|CHEQUE|CHECK)\b/i.test(g.ref) || /cheque|check/i.test(g.text);
    if (matchedRefs.has(g.ref + '|' + g.amt))
      exc.push({ ...base, adj: 'book-err', sev: 'high', title: 'Possible duplicate posting', why: `Same reference ${g.ref} and amount are already matched to a bank line.`, act: 'Reverse via FB08', je: [['Rev', 'Reverse doc ' + g.doc, -g.amt]] });
    else if (g.amt < 0 && cheque && age > 20)
      exc.push({ ...base, sev: 'med', title: 'Stale outstanding cheque', why: `Cheque issued ${g.date}, not presented after ${age} days.`, act: 'Contact payee / void' });
    else if (g.amt < 0 && age <= 5)
      exc.push({ ...base, sev: 'low', title: cheque ? 'Outstanding cheque' : 'Payment not yet debited', why: 'Issued at period-end and not yet on the statement. Timing difference.', act: 'No action · carry forward' });
    else if (g.amt > 0 && age <= 2)
      exc.push({ ...base, sev: 'low', title: 'Deposit in transit', why: 'Booked at period-end; bank credit expected next business day.', act: 'No action · carry forward' });
    else
      exc.push({ ...base, sev: 'med', title: g.amt > 0 ? 'SAP receipt not on bank' : 'SAP payment not on bank', why: 'No bank line met the current tolerances. Widen the window or charge tolerance, or investigate.', act: 'Investigate' });
  });
  const fees = groups.filter(x => x.diff !== 0);
  if (fees.length) {
    const t = r2(fees.reduce((s, x) => s + x.diff, 0));
    exc.push({ key: 'FEES', side: 'matched', amt: t, adj: 'book-fee', sev: 'med', title: 'Charges deducted on matched items', why: `${fees.length} matched payments differ by bank charges (${fees.map(f => f.bank.ref).join(', ')}).`, act: 'Post via FEBAN · bank-charges rule', je: [['Dr', '479000 Bank charges', -t], ['Cr', `${data.scope.glAccount.split(' ')[0]} Bank`, -t]] });
  }
  const rank = { high: 0, med: 1, low: 2 };
  exc.sort((a, b) => rank[a.sev] - rank[b.sev]);

  const opening = data.opening;
  const bankClose = data.bankClosing ?? r2(opening + sumAmt(BK));
  const bookClose = r2(opening + sumAmt(GL));
  const s = (adj: Adj) => r2(exc.filter(e => e.adj === adj).reduce((t, e) => t + e.amt, 0));
  const adjBank = r2(bankClose + s('bank'));
  const adjBook = r2(bookClose + s('book') + s('book-fee') - s('book-err'));
  return { groups, exceptions: exc, unmatchedBank, unmatchedGl, opening, bankClose, bookClose, adjBank, adjBook, periodEnd };
}

// ------------------------------------------------------------------ file parsing ("use my SAP files")
/** Parses SAP-style numbers: 1,234.56  1.234,56  1,234.56-  (1,234.56) */
export function sapNumber(v: Cell): number | null {
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (v == null) return null;
  let s = String(v).trim().replace(/[^\d.,\-()]/g, '');
  if (!s || !/\d/.test(s)) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.endsWith('-')) { neg = true; s = s.slice(0, -1); }
  if (s.startsWith('-')) { neg = !neg; s = s.slice(1); }
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > ld) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, '');
  const n = parseFloat(s);
  return isFinite(n) ? (neg ? -n : n) : null;
}
/** Dates: Date objects, 2026-10-31, 31.10.2026, 31/10/2026, 20261031 → ISO (day-first by default). */
export function sapDate(v: Cell): string | null {
  if (v instanceof Date && !isNaN(+v)) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())).toISOString().slice(0, 10);
  if (v == null) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{4})(\d{2})(\d{2})$/); if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (m) { let d = +m[1], mo = +m[2]; const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; if (mo > 12 && d <= 12) [d, mo] = [mo, d]; return iso(y, mo, d); }
  return null;
}
const iso = (y: number, m: number, d: number) => (m >= 1 && m <= 12 && d >= 1 && d <= 31 ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null);

function findHeader(grid: Cell[][], must: RegExp[]) {
  for (let i = 0; i < Math.min(25, grid.length); i++) {
    const row = grid[i].map(c => String(c ?? '').trim());
    if (must.every(rx => row.some(c => rx.test(c)))) return { i, row };
  }
  return null;
}
const col = (row: string[], rx: RegExp, not?: RegExp) => row.findIndex(c => rx.test(c) && !(not && not.test(c)));

/** FBL3N / ACDOCA export (xlsx or csv) → G/L items. */
export function parseGl(grid: Cell[][]): GlItem[] {
  const h = findHeader(grid, [/doc|beleg|document|journal/i, /amount|amt|betrag|debit|credit/i]);
  if (!h) throw new Error('SAP file: could not find the header row. Expected columns like "Document Number", "Posting Date", "Amount in local currency", "Reference".');
  const r = h.row;
  const cDoc = col(r, /doc(ument)?\.?\s*(no|number|nr)|^document$|belegnr|journal entry/i);
  const cDate = col(r, /pstng|posting|buchungs/i) >= 0 ? col(r, /pstng|posting|buchungs/i) : col(r, /date|datum/i);
  const cAmt = col(r, /amount|amt|betrag/i, /^(local\s*)?curr(ency)?\.?$|^l?crcy$|^lcurr$/i);
  const cDr = col(r, /^debit|soll/i), cCr = col(r, /^credit|haben/i);
  const cRef = col(r, /^ref|reference|referenz/i, /key/i);
  const cText = col(r, /^text$|item text|line item text|description/i);
  const cAssign = col(r, /assign|zuordnung/i);
  const cType = col(r, /doc\.?\s*type|document type|^type$|belegart/i);
  const cDc = col(r, /d\/c|debit\/credit|s\/h|shkzg/i);
  if (cDoc < 0 || cDate < 0 || (cAmt < 0 && cDr < 0)) throw new Error('SAP file: needs Document Number, Posting Date and Amount (or Debit / Credit) columns.');
  const out: GlItem[] = [];
  grid.slice(h.i + 1).forEach(row => {
    const doc = String(row[cDoc] ?? '').trim(), date = sapDate(row[cDate]);
    if (!doc || !date || /total|^\*/i.test(doc)) return;
    let amt = cAmt >= 0 ? sapNumber(row[cAmt]) : (sapNumber(row[cDr]) ?? 0) - Math.abs(sapNumber(row[cCr]) ?? 0);
    if (amt == null || amt === 0) return;
    if (cDc >= 0 && /^(H|C|credit)/i.test(String(row[cDc] ?? '')) && amt > 0) amt = -amt;
    const ref = cRef >= 0 ? String(row[cRef] ?? '').trim() : '';
    out.push({ id: 'G' + out.length, doc, type: cType >= 0 ? String(row[cType] ?? '').trim() : '', date, amt: r2(amt), ref: ref || doc,
      text: cText >= 0 ? String(row[cText] ?? '').trim() : '', assign: cAssign >= 0 ? String(row[cAssign] ?? '').trim() || ref || doc : ref || doc });
  });
  if (!out.length) throw new Error('SAP file: no line items found under the header row.');
  return out;
}

/** MT940 text → bank lines + balances. */
export function parseMt940(text: string): { bank: BankLine[]; opening?: number; closing?: number; account?: string; statement?: string } {
  const t = text.replace(/\r/g, '');
  const mtAmt = (s: string) => parseFloat(s.replace(',', '.'));
  const bal = (tag: string) => { const m = t.match(new RegExp(`:${tag}:([CD])\\d{6}[A-Z]{3}([\\d,]+)`)); return m ? (m[1] === 'D' ? -1 : 1) * mtAmt(m[2]) : undefined; };
  const bank: BankLine[] = [];
  const parts = t.split(/\n(?=:\d{2}[A-Z]?:)/);
  parts.forEach((p, i) => {
    const m = p.match(/^:61:(\d{2})(\d{2})(\d{2})(\d{4})?(R?[CD])[A-Z]?([\d,]+)([NSF][A-Z0-9]{3})([^/\n]*)(?:\/\/([^\n]*))?/);
    if (!m) return;
    const sign = m[5].endsWith('D') !== m[5].startsWith('R') ? -1 : 1;
    const next = parts[i + 1]?.startsWith(':86:') ? parts[i + 1].slice(4).replace(/\n/g, ' ').trim() : '';
    bank.push({ id: 'B' + bank.length, line: String(bank.length + 1).padStart(3, '0'), date: `20${m[1]}-${m[2]}-${m[3]}`, amt: r2(sign * mtAmt(m[6])),
      code: m[7], ref: (m[8] || '').trim() || 'NONREF', narr: next || (m[9] ?? '') });
  });
  if (!bank.length) throw new Error('MT940 file: no :61: transaction lines found.');
  return { bank, opening: bal('60F') ?? bal('60M'), closing: bal('62F') ?? bal('62M'), account: t.match(/:25:([^\n]+)/)?.[1]?.trim(), statement: t.match(/:28C?:([^\n]+)/)?.[1]?.trim() };
}

/** Bank statement CSV / xlsx → bank lines. */
export function parseBankGrid(grid: Cell[][]): BankLine[] {
  const h = findHeader(grid, [/date|datum/i, /amount|credit|debit|deposit|withdraw|betrag/i]);
  if (!h) throw new Error('Bank file: could not find the header row. Expected columns like "Value Date", "Description", "Amount" (or "Debit" / "Credit").');
  const r = h.row;
  const cDate = col(r, /value/i) >= 0 ? col(r, /value/i) : col(r, /date|datum/i);
  const cNarr = col(r, /narr|desc|particular|details|remark|text|verwendung/i);
  const cAmt = col(r, /^amount|^amt|betrag/i);
  const cCr = col(r, /credit|deposit/i), cDr = col(r, /debit|withdraw/i);
  const cRef = col(r, /ref|cheque|chq/i);
  const cCode = col(r, /code|type/i);
  const out: BankLine[] = [];
  grid.slice(h.i + 1).forEach(row => {
    const date = sapDate(row[cDate]); if (!date) return;
    const amt = cAmt >= 0 ? sapNumber(row[cAmt]) : (sapNumber(row[cCr]) ?? 0) - Math.abs(sapNumber(row[cDr]) ?? 0);
    if (amt == null || amt === 0) return;
    out.push({ id: 'B' + out.length, line: String(out.length + 1).padStart(3, '0'), date, amt: r2(amt), code: cCode >= 0 ? String(row[cCode] ?? '').trim() : '',
      ref: (cRef >= 0 ? String(row[cRef] ?? '').trim() : '') || 'NONREF', narr: cNarr >= 0 ? String(row[cNarr] ?? '').trim() : '' });
  });
  if (!out.length) throw new Error('Bank file: no transactions found under the header row.');
  return out;
}

/** First lines of the sample as an MT940 file, for display. */
export function toMt940(data: ReconData, max = 8) {
  const a = (n: number) => Math.abs(n).toFixed(2).replace('.', ',');
  const y = (d: string) => d.slice(2).replace(/-/g, '');
  const close = data.bankClosing ?? r2(data.opening + sumAmt(data.bank));
  let s = `:20:STMT2026103100045\n:25:CITIUS33/0001-4471902\n:28C:00045/001\n:60F:C260930USD${a(data.opening)}\n`;
  data.bank.slice(0, max).forEach(b => { s += `:61:${y(b.date)}${y(b.date).slice(2)}${b.amt < 0 ? 'D' : 'C'}${a(b.amt)}${b.code}${b.ref}//CITI${b.line}\n:86:${b.narr}\n`; });
  return s + `…\n:62F:C261031USD${a(close)}`;
}
