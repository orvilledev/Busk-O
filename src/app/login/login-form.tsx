"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Mode = "password" | "magic";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("password");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth"
      ? "That confirmation link is invalid or expired. Please sign up again or request a new link."
      : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();

    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage("Check your email for a magic sign-in link.");
        return;
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage("Account created. Check your email to confirm, then log in.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/songs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
        autoComplete="email"
      />

      {mode === "password" && (
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={6}
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-accent">{message}</p>}

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === "magic" ? (
          <>
            <Mail className="h-4 w-4" /> Send magic link
          </>
        ) : isSignUp ? (
          "Create account"
        ) : (
          "Log in"
        )}
      </Button>

      <div className="mt-2 flex flex-col gap-2 text-center text-sm text-muted">
        {mode === "password" ? (
          <>
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => setIsSignUp((v) => !v)}
            >
              {isSignUp
                ? "Have an account? Log in"
                : "Need an account? Sign up"}
            </button>
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => setMode("magic")}
            >
              Use a magic link instead
            </button>
          </>
        ) : (
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => setMode("password")}
          >
            Use a password instead
          </button>
        )}
      </div>
    </form>
  );
}
