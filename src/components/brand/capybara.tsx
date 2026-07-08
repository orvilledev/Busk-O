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
      aria-label="A calm capybara strumming an acoustic guitar"
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
        <linearGradient id="capyGtr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e2b3" />
          <stop offset="1" stopColor="#e6c485" />
        </linearGradient>
      </defs>

      {/* ground shadow (stays put while the capybara gently breathes) */}
      <ellipse cx="130" cy="233" rx="94" ry="12" fill="#000" opacity="0.28" />

      <g className="animate-busk-float">
        {/* body */}
        <ellipse cx="130" cy="158" rx="92" ry="66" fill="url(#capyBody)" />

        {/* little feet peeking out below the guitar */}
        <ellipse cx="116" cy="230" rx="15" ry="12" fill="url(#capyBody)" />
        <ellipse cx="172" cy="230" rx="15" ry="12" fill="url(#capyBody)" />
        <g stroke="#7c3d0a" strokeWidth="2.5" strokeLinecap="round">
          <line x1="110" y1="234" x2="110" y2="240" />
          <line x1="116" y1="235" x2="116" y2="241" />
          <line x1="122" y1="234" x2="122" y2="240" />
          <line x1="166" y1="234" x2="166" y2="240" />
          <line x1="172" y1="235" x2="172" y2="241" />
          <line x1="178" y1="234" x2="178" y2="240" />
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

        {/* acoustic guitar, held across the lap */}
        <g>
          {/* headstock + tuning pegs */}
          <ellipse
            cx="50"
            cy="156"
            rx="11"
            ry="8"
            fill="#5b3a1a"
            transform="rotate(16 50 156)"
          />
          <circle cx="44" cy="151" r="1.7" fill="#d9c39a" />
          <circle cx="47" cy="161" r="1.7" fill="#d9c39a" />
          {/* neck */}
          <line
            x1="104"
            y1="173"
            x2="54"
            y2="158"
            stroke="#6b4423"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* frets */}
          <g stroke="#d9c39a" strokeWidth="1.8" strokeLinecap="round">
            <line x1="93" y1="163" x2="89" y2="175" />
            <line x1="80" y1="160" x2="76" y2="171" />
            <line x1="67" y1="156" x2="63" y2="168" />
          </g>
          {/* body (spruce top) */}
          <circle cx="118" cy="178" r="25" fill="url(#capyGtr)" />
          <circle cx="164" cy="188" r="33" fill="url(#capyGtr)" />
          {/* sound hole with an amber rosette */}
          <circle
            cx="140"
            cy="183"
            r="11"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
          />
          <circle cx="140" cy="183" r="8" fill="#2a1a06" />
          {/* strings running up the neck */}
          <g stroke="#efe7d0" strokeWidth="1" opacity="0.5">
            <line x1="158" y1="199" x2="52" y2="160" />
            <line x1="163" y1="196" x2="53" y2="156" />
            <line x1="168" y1="193" x2="54" y2="152" />
          </g>
          {/* bridge */}
          <rect x="156" y="196" width="18" height="6" rx="2" fill="#5b3a1a" />
        </g>

        {/* arms reaching from the body down onto the guitar */}
        <g stroke="url(#capyBody)" strokeWidth="21" strokeLinecap="round">
          <line x1="104" y1="151" x2="80" y2="169" />
          <line x1="153" y1="152" x2="161" y2="197" />
        </g>
        {/* paws holding it */}
        <ellipse cx="78" cy="171" rx="13" ry="11" fill="url(#capyBody)" />
        <ellipse cx="162" cy="199" rx="13" ry="11" fill="url(#capyBody)" />
        <g stroke="#7c3d0a" strokeWidth="2" strokeLinecap="round">
          <line x1="72" y1="176" x2="71" y2="181" />
          <line x1="79" y1="177" x2="78" y2="182" />
          <line x1="157" y1="204" x2="156" y2="209" />
          <line x1="164" y1="205" x2="163" y2="210" />
        </g>
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
