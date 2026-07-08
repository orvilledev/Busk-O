import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  ListMusic,
  Music,
  Play,
  Sparkles,
  Type,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapybaraBadge } from "@/components/brand/capybara";

const features = [
  {
    icon: Check,
    title: "Accurate chords and lyrics",
    body: "Every chord sits above the exact word you sing.",
  },
  {
    icon: ArrowUpDown,
    title: "Transpose to your key",
    body: "Shift any song to fit your voice, capo-friendly.",
  },
  {
    icon: Play,
    title: "Auto scroll while playing",
    body: "Follow along hands-free during the performance.",
  },
  {
    icon: Sparkles,
    title: "Simple and easy to use design",
    body: "No clutter, just your chords and lyrics on stage.",
  },
];

/** Marketing landing shown at `/` to signed-out visitors. */
export function Landing({ configured }: { configured: boolean }) {
  const primaryHref = configured ? "/login" : "/try";
  const primaryLabel = configured ? "Get started" : "Try it now";

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      {/* ambient warmth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-48 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-accent/20 blur-[130px]" />
        <div className="absolute top-1/3 -right-40 h-[360px] w-[360px] rounded-full bg-accent/10 blur-[110px]" />
      </div>

      {/* NAV */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <CapybaraBadge className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight">Busk-O</span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link href="/try">
            <Button variant="ghost" size="sm">
              Playground
            </Button>
          </Link>
          {configured && (
            <Link href="/login">
              <Button size="sm">Log in</Button>
            </Link>
          )}
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-6 lg:grid-cols-2 lg:gap-8 lg:pt-14">
        <div className="flex flex-col items-start">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Every chord and lyric,{" "}
            <span
              className="text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(100deg,#fcd34d,#f59e0b,#fb923c)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ready for the stage.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
            Pull up any song, drop it into your key, and play — chords and lyrics
            laid out for the stage.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={primaryHref}>
              <Button size="lg">
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/try">
              <Button variant="secondary" size="lg">
                See it live
              </Button>
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {["Free to try", "No install needed"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-accent" /> {t}
              </li>
            ))}
          </ul>
        </div>

      </section>

      {/* FEATURES */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 mt-auto border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <CapybaraBadge className="h-7 w-7" />
            <span className="font-semibold">Busk-O</span>
            <span className="hidden text-sm text-muted sm:inline">
              · Chords, lyrics &amp; setlists
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted">
            <Link href="/try" className="transition-colors hover:text-foreground">
              Playground
            </Link>
            {configured && (
              <Link
                href="/login"
                className="transition-colors hover:text-foreground"
              >
                Log in
              </Link>
            )}
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
