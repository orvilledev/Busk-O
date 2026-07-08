/**
 * An artistic acoustic guitar for the landing hero — warm amber wood, a
 * decorative rosette, glossy highlights, and a couple of notes drifting up.
 * Pure inline SVG (no assets, no client JS); tinted from the theme's palette.
 */
export function GuitarArt({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 300 340"
      className={className}
      style={style}
      role="img"
      aria-label="An acoustic guitar"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gtrWood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="0.5" stopColor="#e08e1e" />
          <stop offset="1" stopColor="#8a4d10" />
        </linearGradient>
        <linearGradient id="gtrNeck" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2410" />
          <stop offset="0.5" stopColor="#2b1a0d" />
          <stop offset="1" stopColor="#3a2410" />
        </linearGradient>
        <radialGradient id="gtrGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="gtrShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="12"
            floodColor="#000"
            floodOpacity="0.45"
          />
        </filter>
      </defs>

      {/* warm halo */}
      <ellipse cx="150" cy="185" rx="150" ry="150" fill="url(#gtrGlow)" />

      <g transform="rotate(-16 150 180)" filter="url(#gtrShadow)">
        <g className="animate-busk-float">
          {/* headstock + tuners */}
          <rect x="126" y="22" width="48" height="36" rx="9" fill="#33200f" />
          <g fill="#e9c979" stroke="#a9782a" strokeWidth="1">
            <circle cx="118" cy="31" r="4.5" />
            <circle cx="118" cy="43" r="4.5" />
            <circle cx="118" cy="55" r="4.5" />
            <circle cx="182" cy="31" r="4.5" />
            <circle cx="182" cy="43" r="4.5" />
            <circle cx="182" cy="55" r="4.5" />
          </g>
          <g fill="#c9a87e">
            <circle cx="139" cy="31" r="2" />
            <circle cx="139" cy="43" r="2" />
            <circle cx="139" cy="55" r="2" />
            <circle cx="161" cy="31" r="2" />
            <circle cx="161" cy="43" r="2" />
            <circle cx="161" cy="55" r="2" />
          </g>

          {/* neck + fretboard */}
          <rect x="136" y="56" width="28" height="98" fill="url(#gtrNeck)" />
          <g stroke="#b28a58" strokeWidth="2">
            <line x1="136" y1="72" x2="164" y2="72" />
            <line x1="136" y1="86" x2="164" y2="86" />
            <line x1="136" y1="100" x2="164" y2="100" />
            <line x1="136" y1="114" x2="164" y2="114" />
            <line x1="136" y1="128" x2="164" y2="128" />
            <line x1="136" y1="142" x2="164" y2="142" />
          </g>
          <g fill="#d9b98a">
            <circle cx="150" cy="93" r="3" />
            <circle cx="150" cy="121" r="3" />
          </g>
          {/* nut */}
          <rect x="135" y="55" width="30" height="4" rx="2" fill="#efe3c6" />

          {/* body */}
          <path
            d="M150 150 C185 150 208 165 208 188 C208 205 200 214 196 226
               C192 238 222 245 222 272 C222 296 188 306 150 306
               C112 306 78 296 78 272 C78 245 108 238 104 226
               C100 214 92 205 92 188 C92 165 115 150 150 150 Z"
            fill="url(#gtrWood)"
            stroke="#7c3d0a"
            strokeWidth="3"
          />
          <path
            d="M150 150 C185 150 208 165 208 188 C208 205 200 214 196 226
               C192 238 222 245 222 272 C222 296 188 306 150 306
               C112 306 78 296 78 272 C78 245 108 238 104 226
               C100 214 92 205 92 188 C92 165 115 150 150 150 Z"
            fill="none"
            stroke="#f3e0b8"
            strokeWidth="1.4"
          />

          {/* glossy highlight */}
          <ellipse
            cx="118"
            cy="250"
            rx="24"
            ry="42"
            fill="#fff"
            opacity="0.1"
            transform="rotate(-14 118 250)"
          />

          {/* pickguard */}
          <path
            d="M173 202 C192 208 193 230 177 240 C167 233 165 214 173 202 Z"
            fill="#4a2d10"
            opacity="0.8"
          />

          {/* rosette + sound hole */}
          <circle cx="150" cy="198" r="32" fill="none" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="150" cy="198" r="28" fill="none" stroke="#7c3d0a" strokeWidth="2" />
          <circle cx="150" cy="198" r="25" fill="#1c1005" />

          {/* bridge + pins */}
          <rect x="118" y="250" width="64" height="15" rx="4" fill="#2b1a0d" />
          <rect x="120" y="250" width="60" height="3" rx="1.5" fill="#e7d6b0" />
          <g fill="#e7d6b0">
            <circle cx="127" cy="258" r="1.8" />
            <circle cx="136" cy="258" r="1.8" />
            <circle cx="145" cy="258" r="1.8" />
            <circle cx="155" cy="258" r="1.8" />
            <circle cx="164" cy="258" r="1.8" />
            <circle cx="173" cy="258" r="1.8" />
          </g>

          {/* strings */}
          <g stroke="#efe7d0" strokeWidth="1" opacity="0.6">
            <line x1="139" y1="58" x2="127" y2="252" />
            <line x1="143.6" y1="58" x2="136" y2="252" />
            <line x1="148.2" y1="58" x2="145" y2="252" />
            <line x1="152.8" y1="58" x2="155" y2="252" />
            <line x1="157.4" y1="58" x2="164" y2="252" />
            <line x1="162" y1="58" x2="173" y2="252" />
          </g>
        </g>
      </g>

      {/* notes drifting up from the sound hole */}
      <g className="animate-busk-float-2" fill="var(--accent)">
        <ellipse cx="250" cy="94" rx="8" ry="6" transform="rotate(-20 250 94)" />
        <rect x="256" y="58" width="3.4" height="38" rx="1.7" />
        <path d="M259.4 58 C273 62 271 76 262 80 L259.4 72 Z" />
        <ellipse cx="278" cy="76" rx="6" ry="4.6" transform="rotate(-20 278 76)" />
        <rect x="282" y="46" width="2.8" height="32" rx="1.4" />
      </g>
    </svg>
  );
}
