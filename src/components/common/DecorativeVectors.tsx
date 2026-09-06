import React from 'react';

export interface VectorProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/** Vector 1: Serpentine S-path with nodes & terminal directional arrow */
export const Vector1: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} {...props}>
    <circle cx="16" cy="80" r="4.5" fill="currentColor" />
    <path
      d="M 16 80 L 64 80 C 78 80 82 52 64 52 L 36 52 C 18 52 22 22 40 22 L 80 22"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="50" cy="52" r="4" fill="currentColor" />
    <circle cx="20" cy="28" r="4.5" fill="currentColor" />
    <path d="M 76 16 L 86 22 L 76 28 Z" fill="currentColor" />
  </svg>
);

/** Vector 2: Constellation network graph cluster */
export const Vector2: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 110 100" fill="none" className={className} {...props}>
    <path
      d="M 20 54 Q 38 40 42 26 M 20 54 Q 32 72 44 84 M 42 26 Q 50 38 62 48 M 44 84 Q 52 66 62 48 M 62 48 Q 76 35 90 22 M 62 48 Q 78 60 90 74 M 90 22 Q 78 48 90 74"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="54" r="4.5" fill="currentColor" />
    <circle cx="42" cy="26" r="4.5" fill="currentColor" />
    <circle cx="44" cy="84" r="6.5" fill="currentColor" />
    <circle cx="62" cy="48" r="7.5" fill="currentColor" />
    <circle cx="90" cy="22" r="4.5" fill="currentColor" />
    <circle cx="90" cy="74" r="4.5" fill="currentColor" />
  </svg>
);

/** Vector 3: Targeting path, crosshairs & map pin */
export const Vector3: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} {...props}>
    <path d="M 18 24 A 6 6 0 0 1 24 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="27" cy="24" r="1.5" fill="currentColor" />
    <path d="M 22 70 C 22 48 44 48 54 44 C 64 40 70 30 70 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 70 12 L 70 16 M 70 24 L 70 28 M 62 20 L 66 20 M 74 20 L 78 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M 22 62 L 22 66 M 22 74 L 22 78 M 14 70 L 18 70 M 26 70 L 30 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M 78 54 C 74.5 54 72 56.5 72 60 C 72 64.5 78 72 78 72 C 78 72 84 64.5 84 60 C 84 56.5 81.5 54 78 54 Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="78" cy="60" r="2" fill="currentColor" />
  </svg>
);

/** Vector 4: Radar pulse waves with focal target node */
export const Vector4: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 110 90" fill="none" className={className} {...props}>
    <circle cx="28" cy="24" r="1.5" fill="currentColor" />
    <circle cx="34" cy="27" r="2.2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <path d="M 12 62 L 34 62 C 46 62 48 48 54 40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 50 44 L 56 38 L 57 46 Z" fill="currentColor" />
    <circle cx="60" cy="36" r="6" fill="currentColor" />
    <path d="M 68 20 A 18 18 0 0 1 76 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M 72 13 A 28 28 0 0 1 88 52" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M 78 8 A 38 38 0 0 1 98 58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="98" cy="58" r="2.5" fill="currentColor" />
  </svg>
);

/** Vector 5: Elevation / trend line chart with vertical drop lines */
export const Vector5: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 115 85" fill="none" className={className} {...props}>
    <line x1="28" y1="46" x2="28" y2="72" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="56" y1="56" x2="56" y2="72" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="86" y1="20" x2="86" y2="72" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path
      d="M 8 64 C 18 56 22 46 28 46 C 36 46 48 56 56 56 C 68 56 78 20 86 20 C 94 20 100 28 108 34"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="28" cy="46" r="4.5" fill="currentColor" />
    <circle cx="56" cy="56" r="4.5" fill="currentColor" />
    <circle cx="86" cy="20" r="5" fill="currentColor" />
  </svg>
);

/** Vector 6: Rising wave line with nodes and directional arrow */
export const Vector6: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 115 80" fill="none" className={className} {...props}>
    <path
      d="M 10 64 C 18 64 26 30 46 30 C 58 30 62 58 74 58 C 84 58 92 36 102 20"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="10" cy="64" r="4.5" fill="currentColor" />
    <circle cx="46" cy="30" r="4.5" fill="currentColor" />
    <circle cx="74" cy="58" r="4.5" fill="currentColor" />
    <path d="M 96 16 L 106 18 L 102 28 Z" fill="currentColor" />
  </svg>
);

/** Vector 7: Crossroads / 3-way branching arrows */
export const Vector7: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 110 90" fill="none" className={className} {...props}>
    <path d="M 10 68 L 38 68 C 50 68 54 56 54 50" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 54 50 L 54 22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 50 24 L 54 16 L 58 24 Z" fill="currentColor" />
    <path d="M 54 50 Q 56 36 72 36 L 96 36" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 94 32 L 102 36 L 94 40 Z" fill="currentColor" />
    <path d="M 54 50 Q 56 60 74 60 L 74 72" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 70 70 L 74 78 L 78 70 Z" fill="currentColor" />
    <circle cx="54" cy="50" r="5" fill="currentColor" />
  </svg>
);

/** Vector 8: Smooth gentle wave connector with nodes */
export const Vector8: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 110 80" fill="none" className={className} {...props}>
    <path
      d="M 12 56 C 24 64 36 64 48 58 C 60 52 70 42 82 42 C 90 42 94 48 98 48"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="58" cy="53" r="4.5" fill="currentColor" />
    <circle cx="98" cy="48" r="5.5" fill="currentColor" />
  </svg>
);

/** Vector 9: 4-node progressive wave line */
export const Vector9: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 110 90" fill="none" className={className} {...props}>
    <path
      d="M 12 74 C 22 74 28 50 42 50 C 56 50 60 70 74 70 C 86 70 90 48 98 42"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <circle cx="12" cy="74" r="4.5" fill="currentColor" />
    <circle cx="42" cy="50" r="4.5" fill="currentColor" />
    <circle cx="74" cy="70" r="4.5" fill="currentColor" />
    <circle cx="98" cy="42" r="5.5" fill="currentColor" />
  </svg>
);

/** Vector 10: Diverging curved paths with ambient celestial particles */
export const Vector10: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 90 85" fill="none" className={className} {...props}>
    <circle cx="16" cy="30" r="4.5" fill="currentColor" />
    <circle cx="70" cy="65" r="4.5" fill="currentColor" />
    <path d="M 16 30 C 42 26 58 46 70 65" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 16 30 C 30 52 50 68 70 65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="48" cy="42" r="2.2" fill="currentColor" />
    <circle cx="62" cy="24" r="1.5" fill="currentColor" />
    <circle cx="46" cy="74" r="1.5" fill="currentColor" />
    <circle cx="28" cy="20" r="1" fill="currentColor" />
  </svg>
);

/** Vector 11: Focused focal arc & data connector */
export const Vector11: React.FC<VectorProps> = ({ className = 'w-16 h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 110 80" fill="none" className={className} {...props}>
    <path d="M 12 60 C 26 60 38 36 56 36 C 72 36 80 54 96 54" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="12" cy="60" r="4" fill="currentColor" />
    <circle cx="56" cy="36" r="6" fill="currentColor" />
    <circle cx="96" cy="54" r="4.5" fill="currentColor" />
    <circle cx="56" cy="36" r="10" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" fill="none" />
  </svg>
);

/** Vector 12: Panoramic civic journey with branching resolution forks */
export const Vector12: React.FC<VectorProps> = ({ className = 'w-full h-16 text-[#2F6F8F]', ...props }) => (
  <svg viewBox="0 0 290 85" fill="none" className={className} {...props}>
    <path
      d="M 8 68 C 24 68 34 34 52 34 C 70 34 84 46 102 46 C 120 46 128 68 142 68 C 158 68 178 40 198 40"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M 198 40 C 218 40 226 20 244 20 C 256 20 268 14 278 12"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path d="M 272 6 L 284 11 L 275 19 Z" fill="currentColor" />
    <path d="M 206 38 C 218 48 234 52 248 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M 226 26 L 230 22 M 256 56 L 260 52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="52" cy="34" r="4.5" fill="currentColor" />
    <circle cx="102" cy="46" r="4.5" fill="currentColor" />
    <circle cx="142" cy="68" r="6.5" fill="currentColor" />
    <circle cx="198" cy="40" r="4.5" fill="currentColor" />
    <circle cx="244" cy="20" r="4.5" fill="currentColor" />
  </svg>
);

/** Flexible component to render any vector by index (1-12) */
export const DecorativeVector: React.FC<{ name: number; className?: string }> = ({ name, className }) => {
  switch (name) {
    case 1: return <Vector1 className={className} />;
    case 2: return <Vector2 className={className} />;
    case 3: return <Vector3 className={className} />;
    case 4: return <Vector4 className={className} />;
    case 5: return <Vector5 className={className} />;
    case 6: return <Vector6 className={className} />;
    case 7: return <Vector7 className={className} />;
    case 8: return <Vector8 className={className} />;
    case 9: return <Vector9 className={className} />;
    case 10: return <Vector10 className={className} />;
    case 11: return <Vector11 className={className} />;
    case 12: return <Vector12 className={className} />;
    default: return null;
  }
};
