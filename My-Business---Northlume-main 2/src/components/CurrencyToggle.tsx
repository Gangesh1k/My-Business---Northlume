import React from 'react';
import type { Currency } from '../lib/payments';

export const CurrencyToggle: React.FC<{ value: Currency; onChange: (c: Currency) => void; dark?: boolean }> = ({ value, onChange, dark }) => (
  <div className={`inline-flex p-1 rounded-full border text-xs font-bold ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} role="group" aria-label="Currency">
    {(['INR', 'USD'] as Currency[]).map(c => (
      <button key={c} type="button" onClick={() => onChange(c)} aria-pressed={value === c}
        className={`px-3.5 py-1.5 rounded-full transition-all ${value === c ? 'bg-teal-600 text-white shadow-xs' : dark ? 'text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}>
        {c === 'INR' ? '₹ INR' : '$ USD'}
      </button>
    ))}
  </div>
);
