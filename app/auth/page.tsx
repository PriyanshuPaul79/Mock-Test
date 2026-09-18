"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email confirmation state for sign up
  const [signupSuccessEmail, setSignupSuccessEmail] = useState<string | null>(null);

  // Forgot password dialog
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const supabase = createClient();

  const mapSupabaseError = (err: any): string => {
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("invalid login credentials") || msg.includes("invalid_grant")) {
      return "Email or password is incorrect.";
    }
    if (msg.includes("already registered") || msg.includes("user already exists")) {
      return "An account with this email already exists.";
    }
    if (msg.includes("rate limit") || msg.includes("too many requests")) {
      return "Too many attempts. Try again in a minute.";
    }
    if (msg.includes("network") || msg.includes("fetch")) {
      return "Can't reach the server. Check your connection.";
    }
    return err?.message || "An error occurred. Please try again.";
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInErr) {
      setError(mapSupabaseError(signInErr));
    } else {
      const destination = next.startsWith("/") ? next : "/";
      router.push(destination);
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);
    if (signUpErr) {
      setError(mapSupabaseError(signUpErr));
    } else {
      if (data?.session) {
        // Direct auto-login if email confirmation is disabled
        const destination = next.startsWith("/") ? next : "/";
        router.push(destination);
        router.refresh();
      } else {
        setSignupSuccessEmail(email);
      }
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMsg(null);

    if (!forgotEmail) {
      setForgotError("Please enter your email.");
      return;
    }

    setForgotLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    setForgotLoading(false);
    if (resetErr) {
      setForgotError(mapSupabaseError(resetErr));
    } else {
      setForgotMsg(`Reset link sent to ${forgotEmail}. Check your inbox.`);
    }
  };

  // Sign up confirmation screen
  if (signupSuccessEmail) {
    return (
      <div className="mx-auto my-[8vh] md:my-[10vh] w-full max-w-[440px] rounded-md border border-line-strong bg-surface p-8 text-left">
        <div className="font-mono text-xs uppercase tracking-wide text-ink-faint mb-2">
          MOCKTEST PORTAL
        </div>
        <div className="h-0.5 w-full bg-line-strong mb-6" />

        <h1 className="font-display text-2xl font-medium text-ink mb-3">
          Check your email
        </h1>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">
          We sent a confirmation link to <strong className="text-ink font-mono">{signupSuccessEmail}</strong>. Open it to activate your account.
        </p>

        <div className="border-t border-line pt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSignupSuccessEmail(null)}
          >
            ← Back to Sign in
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              supabase.auth.resend({ type: "signup", email: signupSuccessEmail });
              alert("Confirmation email resent.");
            }}
          >
            Resend email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto my-[8vh] md:my-[10vh] w-full max-w-[440px] rounded-md border border-line-strong bg-surface p-8 text-left">
      <div className="font-mono text-xs uppercase tracking-wide text-ink-faint mb-2">
        MOCKTEST PORTAL
      </div>
      <div className="h-0.5 w-full bg-line-strong mb-6" />

      <h1 className="font-display text-2xl font-medium text-ink mb-4">
        {tab === "signin" ? "Sign in" : "Create account"}
      </h1>

      {/* Underline Tabs */}
      <div className="flex border-b border-line mb-6">
        <button
          type="button"
          onClick={() => {
            setTab("signin");
            setError(null);
          }}
          className={`pb-2 text-sm font-medium mr-6 transition-colors ${
            tab === "signin"
              ? "border-b-2 border-ink text-ink"
              : "border-b-2 border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("signup");
            setError(null);
          }}
          className={`pb-2 text-sm font-medium transition-colors ${
            tab === "signup"
              ? "border-b-2 border-ink text-ink"
              : "border-b-2 border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@example.com"
        />

        <Input
          label="Password"
          type="password"
          required
          autoComplete={tab === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          hint={tab === "signup" ? "Use at least 8 characters." : undefined}
        />

        {tab === "signup" && (
          <Input
            label="Confirm password"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        )}

        {error && (
          <div
            role="alert"
            className="rounded-sm border-l-2 border-l-wrong bg-wrong-soft px-3 py-2 text-sm text-ink font-medium"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          className="w-full mt-2"
        >
          {loading
            ? tab === "signin"
              ? "Signing in…"
              : "Creating account…"
            : tab === "signin"
            ? "Sign in"
            : "Create account"}
        </Button>
      </form>

      {tab === "signin" && (
        <div className="border-t border-line mt-6 pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setForgotEmail(email);
              setForgotError(null);
              setForgotMsg(null);
              setForgotOpen(true);
            }}
            className="text-sm text-ink-soft hover:text-ink underline underline-offset-2 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your account email to receive a password reset link.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotSubmit} className="space-y-4 py-2">
            <Input
              label="Email"
              type="email"
              required
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              placeholder="name@example.com"
            />

            {forgotError && (
              <div className="rounded-sm border-l-2 border-l-wrong bg-wrong-soft px-3 py-2 text-sm text-ink font-medium">
                {forgotError}
              </div>
            )}

            {forgotMsg && (
              <div className="rounded-sm border-l-2 border-l-correct bg-correct-soft px-3 py-2 text-sm text-ink font-medium">
                {forgotMsg}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForgotOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={forgotLoading}>
                {forgotLoading ? "Sending…" : "Send reset link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-8">
      <Suspense fallback={<div className="font-mono text-sm text-ink-faint">Loading…</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
