import type { CSSProperties } from 'react'

export function MessiSilhouette({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 220 420"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {/* Head */}
      <ellipse cx="110" cy="38" rx="26" ry="30" />

      {/* Neck */}
      <rect x="102" y="65" width="16" height="18" rx="4" />

      {/* Torso — jersey */}
      <path d="M72 82 C80 78 100 75 110 75 C120 75 140 78 148 82 L155 155 L65 155 Z" />

      {/* Shorts */}
      <path d="M65 155 L155 155 L150 200 L115 200 L112 175 L108 175 L105 200 L70 200 Z" />

      {/* Left leg */}
      <rect x="70" y="198" width="36" height="90" rx="8" />
      {/* Left shin / sock */}
      <rect x="72" y="270" width="32" height="40" rx="6" />
      {/* Left boot */}
      <ellipse cx="84" cy="312" rx="22" ry="10" />
      <path d="M62 308 Q84 320 106 308 L108 316 Q84 330 62 316 Z" />

      {/* Right leg */}
      <rect x="114" y="198" width="36" height="90" rx="8" />
      {/* Right shin / sock */}
      <rect x="116" y="270" width="32" height="40" rx="6" />
      {/* Right boot */}
      <ellipse cx="136" cy="312" rx="22" ry="10" />
      <path d="M114 308 Q136 320 158 308 L160 316 Q136 330 114 316 Z" />

      {/* ── TOPO GIGIO ARMS ── */}
      {/* Left upper arm: shoulder out to the left then down to elbow */}
      <path d="M74 90 C55 88 38 92 30 110 L26 140 C36 145 50 142 55 130 L62 108 C66 100 70 95 74 90 Z" />
      {/* Left forearm: elbow straight UP */}
      <path d="M26 140 C20 130 16 115 18 98 L22 60 C28 54 40 52 44 60 L46 98 C46 112 40 128 30 138 Z" />
      {/* Left hand */}
      <ellipse cx="33" cy="52" rx="11" ry="13" />
      {/* Left fingers */}
      <line x1="24" y1="46" x2="20" y2="32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="30" y1="40" x2="28" y2="26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="36" y1="40" x2="36" y2="26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="42" y1="43" x2="44" y2="30" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />

      {/* Right upper arm: shoulder out to the right then down to elbow */}
      <path d="M146 90 C165 88 182 92 190 110 L194 140 C184 145 170 142 165 130 L158 108 C154 100 150 95 146 90 Z" />
      {/* Right forearm: elbow straight UP */}
      <path d="M194 140 C200 130 204 115 202 98 L198 60 C192 54 180 52 176 60 L174 98 C174 112 180 128 190 138 Z" />
      {/* Right hand */}
      <ellipse cx="187" cy="52" rx="11" ry="13" />
      {/* Right fingers */}
      <line x1="178" y1="46" x2="176" y2="32" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="184" y1="40" x2="184" y2="26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="190" y1="40" x2="192" y2="26" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="196" y1="43" x2="200" y2="30" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}
