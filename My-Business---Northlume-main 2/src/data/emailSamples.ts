import type { Cell } from '../lib/emailInsights';

export interface SampleEmail {
  id: string;
  from: string;
  subject: string;
  received: string;
  preview: string;          // plain-text body shown in the inbox preview
  html?: string;            // HTML body (tables inside the email)
  attachment?: { name: string; size: string; grid: Cell[][] };
  sourceLabel: string;
}

// deterministic pseudo-random so the demo always shows the same numbers
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const between = (a: number, b: number) => a + (b - a) * rnd();

// 1) Excel attachment with a title block — daily branch MIS
const branchGrid: Cell[][] = [['Daily Branch Sales MIS — September 2026'], ['Prepared by: Regional Ops'], [],
  ['Date', 'Branch', 'Revenue (INR)', 'Target (INR)', 'Orders']];
const branches: [string, number, number][] = [['Jaipur', 182000, 175000], ['Delhi', 240000, 250000], ['Mumbai', 265000, 255000], ['Pune', 120000, 150000], ['Ahmedabad', 98000, 100000]];
for (let d = 0; d < 21; d++) {
  for (const [b, base, tgt] of branches) {
    let rev = Math.round(base * (1 + 0.004 * d) * between(0.9, 1.1));
    if (b === 'Pune' && d === 17) rev = 410000;
    branchGrid.push([`${String(d + 1).padStart(2, '0')}/09/2026`, b, rev, tgt, Math.round(between(40, 120))]);
  }
}

// 2) CSV attachment — AP invoice ageing
const vendors = ['Blue Dart', 'Delhivery', 'Ecom Express', 'DTDC', 'Gati', 'Xpressbees', 'Shadowfax'];
const statuses = ['Paid', 'Paid', 'Pending', 'Overdue', 'Paid', 'Disputed', 'Overdue'];
const apGrid: Cell[][] = [['Invoice No', 'Vendor', 'Invoice Date', 'Amount', 'Days Outstanding', 'Status']];
for (let i = 0; i < 40; i++) {
  const d = new Date(2026, 6, 1 + Math.floor(between(0, 75)));
  apGrid.push([`INV-${5100 + i}`, vendors[Math.floor(between(0, 7))], `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/2026`,
    `₹${(Math.round(between(18, 260)) * 1000).toLocaleString('en-IN')}`, Math.round(between(3, 95)), statuses[Math.floor(between(0, 7))]]);
}

// 3) HTML table in the email body — shift productivity
const agents: (string | number)[][] = [['Shift A', 'Priya', 312, 280, 6.1, 6.5], ['Shift A', 'Rahul', 298, 280, 6.4, 6.5], ['Shift A', 'Neha', 241, 280, 7.9, 6.5],
  ['Shift B', 'Arjun', 305, 280, 6.2, 6.5], ['Shift B', 'Kavya', 226, 280, 8.4, 6.5], ['Shift B', 'Imran', 287, 280, 6.6, 6.5],
  ['Shift C', 'Sneha', 318, 280, 5.9, 6.5], ['Shift C', 'Vikram', 219, 280, 8.8, 6.5], ['Shift C', 'Anita', 276, 280, 6.9, 6.5]];
const shiftHtml = `<p>Hi Gangesh,</p><p><b>Urgent:</b> yesterday's productivity dropped on a few seats. Numbers below.</p>
<table><tr><th>Shift</th><th>Agent</th><th>Tickets Closed</th><th>Target Tickets</th><th>Actual AHT (min)</th><th>AHT Target (min)</th></tr>
${agents.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table><p>Please advise.<br>— Team Lead, Service Desk</p>`;

// 4) Pasted text table in a plain email
const stockText = `Hi,

Weekly stock position below:

| SKU    | Product         | Warehouse | Stock Qty | Reorder Level |
|--------|-----------------|-----------|-----------|---------------|
| SK-101 | Steel Bottle 1L | Jaipur    | 1240      | 500           |
| SK-102 | Lunch Box       | Jaipur    | 310       | 400           |
| SK-103 | Flask 500ml     | Delhi     | 95        | 300           |
| SK-104 | Water Jug       | Delhi     | 860       | 350           |
| SK-105 | Tiffin Set      | Mumbai    | 1510      | 600           |
| SK-106 | Kids Sipper     | Mumbai    | 180       | 250           |

Regards,
Warehouse Team`;

export const sampleEmails: SampleEmail[] = [
  {
    id: 'excel', from: 'Regional Ops <regional.ops@acme-retail.demo>', subject: 'Daily Branch Sales MIS - 21 Sep', received: '08:06',
    preview: 'Hi team,\n\nPlease find attached the daily branch sales MIS up to 21 Sep.\n\nRegards,\nRegional Ops',
    attachment: { name: 'Branch_Sales_MIS_Sep.xlsx', size: '14 KB', grid: branchGrid }, sourceLabel: 'Excel attachment',
  },
  {
    id: 'csv', from: 'AP Desk <ap.desk@acme-retail.demo>', subject: 'Vendor invoice aging report', received: '08:07',
    preview: "Hello,\n\nAttached is this week's AP aging. Please review overdue items.\n\nThanks",
    attachment: { name: 'AP_Aging_Week38.csv', size: '2 KB', grid: apGrid }, sourceLabel: 'CSV attachment',
  },
  {
    id: 'html', from: 'Service Desk TL <tl.servicedesk@acme-bpo.demo>', subject: 'URGENT: Shift productivity 21-Sep', received: '08:08',
    preview: "Hi Gangesh,\n\nUrgent: yesterday's productivity dropped on a few seats. Numbers below.", html: shiftHtml, sourceLabel: 'Table in email body',
  },
  {
    id: 'text', from: 'Warehouse <wh.team@acme-retail.demo>', subject: 'Weekly stock position', received: '08:09',
    preview: stockText, sourceLabel: 'Pasted text table',
  },
];
