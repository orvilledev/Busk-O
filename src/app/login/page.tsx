import { Suspense } from "react";
import { Music } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Music className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Busk-O</h1>
          <p className="mt-1 text-sm text-muted">
            Chords, lyrics &amp; setlists for the stage.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
