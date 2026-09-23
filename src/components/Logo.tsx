import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  withText?: boolean;
  textColor?: string;
  badgeText?: string;
  variant?: 'full' | 'mark';
}

export const NorthLumeMark: React.FC<{ className?: string; size?: number | string }> = ({ 
  className = "w-8 h-8", 
  size 
}) => {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="NorthLume AI logo"
    >
      <defs>
        <linearGradient id="northlumeGradient" x1="160" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2A64F6" />
          <stop offset="40%" stopColor="#0077D6" />
          <stop offset="75%" stopColor="#029E9A" />
          <stop offset="100%" stopColor="#05A672" />
        </linearGradient>
      </defs>

      {/* Background container squircle */}
      <rect width="512" height="512" rx="110" fill="#F7F6F2" />

      {/* Left Pillar */}
      <rect x="64" y="64" width="96" height="384" rx="28" fill="#11141A" />

      {/* Diagonal Ribbon */}
      <polygon points="160,64 256,64 448,448 352,448" fill="url(#northlumeGradient)" />

      {/* Right Pillar */}
      <rect x="352" y="64" width="96" height="384" rx="28" fill="#11141A" />
    </svg>
  );
};

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
          <span className={`text-xl font-bold tracking-tight ${textColor} font-sans`}>
            NorthLume AI
          </span>
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
