import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  ListMusic,
  Music,
  ScanLine,
  Sparkles,
  Users,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapybaraBadge, CapybaraHero } from "@/components/brand/capybara";

const features = [
  {
    icon: Music,
    title: "Chords over lyrics",
    body: "Clean ChordPro charts with every chord locked above the right word.",
  },
  {
    icon: ListMusic,
    title: "Setlists for the stage",
    body: "Line up your songs, reorder in a tap, and launch a distraction-free Play mode.",
  },
  {
    icon: ArrowUpDown,
    title: "Transpose instantly",
    body: "Shift to any key on the fly — capo-friendly and ready for whoever's singing.",
  },
  {
    icon: ScanLine,
    title: "Paste a screenshot",
    body: "OCR reads a photo of a chart straight into your editor. No retyping.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    body: "Installable PWA — your charts load on any stage, signal or not.",
  },
  {
    icon: Users,
    title: "Bring the team",
    body: "Roles for admins and members keep everyone on the same page.",
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> For worship teams &amp;
            buskers
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
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
            Busk-O keeps your charts clean, your setlists tight, and your key one
            tap away — online or off.
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
            {["Works offline", "Free to try", "No install needed"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-accent" /> {t}
              </li>
            ))}
          </ul>
        </div>

        {/* hero visual: capybara + a live-looking chart card + drifting chords */}
        <div className="relative mx-auto flex h-80 w-full max-w-sm items-center justify-center sm:h-96 lg:h-[26rem]">
          <div className="absolute h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <CapybaraHero className="relative z-10 w-64 max-w-full sm:w-72 lg:w-80" />

          <div
            style={{ "--busk-bob-rotate": "rotate(-3deg)" } as React.CSSProperties}
            className="absolute -bottom-2 -left-1 z-20 w-52 rounded-2xl border border-border bg-surface/90 p-4 shadow-2xl backdrop-blur animate-busk-bob sm:-left-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-xs font-medium text-muted">It Is Well</span>
              <span className="ml-auto rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                Key C
              </span>
            </div>
            <div className="border-l-2 border-accent/60 pl-3">
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
                Chorus
              </div>
              <div className="space-y-1.5 font-mono text-[11px] leading-tight">
                <div>
                  <span className="font-semibold text-chord">C</span> It is well
                </div>
                <div>
                  <span className="font-semibold text-chord">G7</span> with my{" "}
                  <span className="font-semibold text-chord">C</span> soul
                </div>
              </div>
            </div>
          </div>

          <span className="absolute right-1 top-6 z-20 rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-sm font-semibold text-chord shadow-lg animate-busk-float">
            G
          </span>
          <span className="absolute -right-1 top-28 z-20 rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-sm font-semibold text-chord shadow-lg animate-busk-float-2">
            Em
          </span>
          <span className="absolute left-3 top-2 z-20 rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-sm font-semibold text-chord shadow-lg animate-busk-bob">
            D
          </span>
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

      {/* CTA */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-56 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-accent/15 blur-[90px]"
          />
          <div className="relative">
            <CapybaraBadge className="mx-auto h-12 w-12" />
            <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
              Ready when you are.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted">
              Load up your first set and let the capybara hold the words.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href={primaryHref}>
                <Button size="lg">
                  {primaryLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
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
