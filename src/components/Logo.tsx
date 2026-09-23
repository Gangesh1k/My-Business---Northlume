import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  withText?: boolean;
  textColor?: string;
  badgeText?: string;
  variant?: 'full' | 'mark';
}

/** NorthLume AI mark — "Flow N": the letter N drawn as one workflow line through process nodes, ending in a point of light. */
export const NorthLumeMark: React.FC<{ className?: string; size?: number | string; tile?: boolean }> = ({
  className = "w-8 h-8",
  size,
  tile = true,
}) => {
  const uid = React.useId().replace(/:/g, '');
  const node = tile ? '#0B1220' : '#FFFFFF';
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label="NorthLume AI logo"
    >
      <defs>
        <linearGradient id={`nlBeam${uid}`} x1="120" y1="400" x2="400" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2A5CF6" />
          <stop offset=".55" stopColor="#0FB5A6" />
          <stop offset="1" stopColor="#34E0B0" />
        </linearGradient>
        <radialGradient id={`nlHalo${uid}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(364 132) scale(110)">
          <stop offset="0" stopColor="#34E0B0" stopOpacity=".55" />
          <stop offset="1" stopColor="#34E0B0" stopOpacity="0" />
        </radialGradient>
      </defs>
      {tile && <rect width="512" height="512" rx="116" fill="#0B1220" />}
      <circle cx="364" cy="132" r="110" fill={`url(#nlHalo${uid})`} />
      <path d="M148 384 V150 L364 364 V168" stroke={`url(#nlBeam${uid})`} strokeWidth="50" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="148" cy="384" r="13" fill={node} />
      <circle cx="148" cy="150" r="13" fill={node} />
      <circle cx="364" cy="364" r="13" fill={node} />
      <circle cx="364" cy="132" r="40" fill="#34E0B0" />
      <circle cx="364" cy="132" r="17" fill="#FFFFFF" />
    </svg>
  );
};

/** Wordmark: "NorthLume" + teal "AI". */
export const NorthLumeWordmark: React.FC<{ className?: string; dark?: boolean }> = ({ className = 'text-xl', dark = false }) => (
  <span className={`font-extrabold tracking-tight font-sans ${dark ? 'text-white' : 'text-slate-900'} ${className}`}>
    NorthLume <span className={dark ? 'text-emerald-300' : 'text-teal-600'}>AI</span>
  </span>
);

export const NorthLumeLogo: React.FC<LogoProps> = ({
  className = "h-8",
  size,
  withText = true,
  textColor = "text-slate-900",
  badgeText = "Automation"
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <NorthLumeMark size={size || 32} className="shrink-0 rounded-lg shadow-2xs" />
      {withText && (
        <div className="flex items-center gap-2">
          <NorthLumeWordmark className={`text-xl ${textColor}`} />
          {badgeText && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-100 rounded-full">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
