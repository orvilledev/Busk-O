/**
 * Busk-O's mascot: a supremely chill capybara. Two forms:
 * - `CapybaraBadge`  — a compact, self-contained amber badge (nav, footer, CTA).
 * - `CapybaraHero`   — a friendly full illustration for the landing hero.
 *
 * Both are pure inline SVG (no assets, no client JS) and lean on the theme's
 * amber palette so the mascot always feels part of the app.
 */

/** Small square logo mark — dark capybara face on an amber tile. */
export function CapybaraBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      role="img"
      aria-label="Busk-O capybara"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="12" fill="var(--accent)" />
      {/* face + ears */}
      <g fill="var(--accent-foreground)">
        <ellipse cx="12.5" cy="12" rx="3.7" ry="4" />
        <ellipse cx="27.5" cy="12" rx="3.7" ry="4" />
        <rect x="6.5" y="11" width="27" height="23" rx="11.5" />
      </g>
      {/* eyes + nostrils cut back to the amber tile */}
      <g fill="var(--accent)">
        <circle cx="15" cy="20" r="2" />
        <circle cx="25" cy="20" r="2" />
        <ellipse cx="16.6" cy="27" rx="1.6" ry="2" />
        <ellipse cx="23.4" cy="27" rx="1.6" ry="2" />
      </g>
    </svg>
  );
}

/** Large, warm capybara illustration with a couple of floating notes. */
export function CapybaraHero({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 250"
      className={className}
      role="img"
      aria-label="A calm capybara humming a tune"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="capyBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="capyHead" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="1" stopColor="#c2740f" />
        </linearGradient>
      </defs>

      {/* ground shadow (stays put while the capybara gently breathes) */}
      <ellipse cx="130" cy="233" rx="94" ry="12" fill="#000" opacity="0.28" />

      <g className="animate-busk-float">
        {/* body + legs */}
        <ellipse cx="130" cy="158" rx="92" ry="66" fill="url(#capyBody)" />
        <rect x="94" y="196" width="26" height="42" rx="13" fill="url(#capyBody)" />
        <rect x="140" y="196" width="26" height="42" rx="13" fill="url(#capyBody)" />
        <g stroke="#7c3d0a" strokeWidth="2.5" strokeLinecap="round">
          <line x1="102" y1="230" x2="102" y2="237" />
          <line x1="112" y1="230" x2="112" y2="237" />
          <line x1="148" y1="230" x2="148" y2="237" />
          <line x1="158" y1="230" x2="158" y2="237" />
        </g>

        {/* ears (behind the head) */}
        <ellipse cx="80" cy="50" rx="16" ry="18" fill="#b45309" />
        <ellipse cx="180" cy="50" rx="16" ry="18" fill="#b45309" />
        <ellipse cx="80" cy="53" rx="8" ry="10" fill="#7c3d0a" />
        <ellipse cx="180" cy="53" rx="8" ry="10" fill="#7c3d0a" />

        {/* head */}
        <ellipse cx="130" cy="98" rx="73" ry="61" fill="url(#capyHead)" />

        {/* soft muzzle + rosy cheeks */}
        <ellipse cx="130" cy="132" rx="52" ry="34" fill="#000" opacity="0.06" />
        <ellipse cx="74" cy="118" rx="13" ry="8" fill="#fb7185" opacity="0.16" />
        <ellipse cx="186" cy="118" rx="13" ry="8" fill="#fb7185" opacity="0.16" />

        {/* eyes */}
        <ellipse cx="98" cy="96" rx="8" ry="9" fill="#2a1a06" />
        <ellipse cx="162" cy="96" rx="8" ry="9" fill="#2a1a06" />
        <circle cx="95" cy="92" r="2.4" fill="#fff" opacity="0.9" />
        <circle cx="159" cy="92" r="2.4" fill="#fff" opacity="0.9" />

        {/* nose + a content little smile */}
        <ellipse cx="116" cy="124" rx="4.5" ry="5.5" fill="#3d2708" />
        <ellipse cx="144" cy="124" rx="4.5" ry="5.5" fill="#3d2708" />
        <path
          d="M116 143 Q130 154 144 143"
          fill="none"
          stroke="#3d2708"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* humming a couple of notes */}
      <g className="animate-busk-float-2" fill="var(--accent)">
        <ellipse cx="212" cy="62" rx="8" ry="6" transform="rotate(-20 212 62)" />
        <rect x="218" y="26" width="3.4" height="36" rx="1.7" />
        <path d="M221.4 26 C234 30 233 43 225 47 L221.4 41 Z" />
        <ellipse cx="236" cy="44" rx="5.5" ry="4.2" transform="rotate(-20 236 44)" />
        <rect x="240" y="18" width="2.6" height="26" rx="1.3" />
      </g>
    </svg>
  );
}
