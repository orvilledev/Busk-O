/**
 * Busk-O's mascot: a supremely chill capybara.
 *
 * `CapybaraBadge` is the compact logo mark used in the nav, footer, and CTA —
 * pure inline SVG (no assets, no client JS) tinted from the theme's amber
 * palette so the mascot always feels part of the app.
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
