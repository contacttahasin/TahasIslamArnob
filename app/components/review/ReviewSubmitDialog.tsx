"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Star, PenLine, LogOut } from "lucide-react";
import { toast } from "sonner";

import { submitReview } from "@/app/(site)/lib/review-actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** Site tokens rather than the shadcn light-mode defaults — this dialog is
 *  mounted on the public site, which has no light mode. */
const FIELD = "border-line bg-white/[0.03] text-ink placeholder:text-ink-muted";

type Identity = { name: string; avatar: string | null };

/**
 * Visitor-facing review form.
 *
 * The visitor fills in two things: a star rating and their review. Who they
 * are comes from signing in with Google — that is the only way to get a
 * real name and a real profile picture, since no API turns an email address
 * into someone's Google photo. The server reads both off the session rather
 * than trusting anything this form sends, so a review cannot be posted
 * under someone else's name.
 *
 * What gets submitted lands as `pending` and stays invisible on the site
 * until the owner approves it in the admin panel.
 */
export default function ReviewSubmitDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  /**
   * Keeps the dialog in step with the Supabase session — an external system,
   * which is what an effect is for. Reads whoever is signed in now, then
   * subscribes so signing in (which returns from Google as a fresh page
   * load) or out updates the form without a reload.
   */
  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const readMetadata = (user: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) return null;
      const meta = user.user_metadata ?? {};
      const pick = (...keys: string[]) => {
        for (const key of keys) {
          const value = meta[key];
          if (typeof value === "string" && value.trim()) return value.trim();
        }
        return null;
      };
      return {
        name: pick("full_name", "name") ?? user.email?.split("@")[0] ?? "You",
        avatar: pick("avatar_url", "picture"),
      };
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setIdentity(readMetadata(data.user));
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setIdentity(readMetadata(session?.user ?? null));
      setCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Comes back to the exchange route, which sets the cookie and then
        // returns the visitor to the page they were reading.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          window.location.pathname
        )}`,
      },
    });
    if (error) toast.error("Could not open Google sign-in.");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIdentity(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitReview({ text, rating });

      if (!result.ok) {
        // Shown inside the dialog as well as in a toast: the toast is easy
        // to miss, and a submit that silently does nothing is the worst
        // possible outcome here.
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setText("");
      setRating(null);
      setOpen(false);
      toast.success("Thanks — your review was sent to Tahasin for approval.");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-10 inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-all hover:-translate-y-0.5 hover:border-noir-gold-bright/60 hover:text-noir-gold-bright"
      >
        <PenLine className="size-3.5" />
        Leave a review
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-bg-elevated text-ink sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a review</DialogTitle>
            <DialogDescription className="text-ink-secondary">
              It goes to Tahasin for approval before it appears on the site.
            </DialogDescription>
          </DialogHeader>

          {checkingSession ? (
            <div className="flex items-center justify-center py-10 text-ink-muted">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : !identity ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-ink-secondary">
                Sign in with Google so your name and picture appear on the review. Nothing
                is posted until you write it and press send.
              </p>

              <button
                type="button"
                onClick={signIn}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white/[0.04] px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-noir-gold-bright/60"
              >
                <GoogleMark />
                Continue with Google
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.03] p-3">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-line bg-white/5">
                  {identity.avatar ? (
                    <Image
                      src={identity.avatar}
                      alt={identity.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs font-semibold text-noir-gold-bright">
                      {identity.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{identity.name}</p>
                  <p className="text-xs text-ink-muted">Posting as your Google account</p>
                </div>

                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Sign out"
                  className="shrink-0 rounded-full p-2 text-ink-muted transition-colors hover:text-ink"
                >
                  <LogOut className="size-4" />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-ink">Rating</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      aria-pressed={rating === n}
                      onClick={() => setRating(rating === n ? null : n)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={
                          rating !== null && n <= rating
                            ? "size-6 fill-amber-400 text-amber-400"
                            : "size-6 text-ink-muted"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="rv-text" className="text-sm font-medium text-ink">
                  Your review
                </label>
                <Textarea
                  id="rv-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  required
                  minLength={20}
                  maxLength={1000}
                  placeholder="What was it like working together?"
                  className={FIELD}
                />
                <p className="text-right text-xs text-ink-muted">{text.length}/1000</p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300"
                >
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-ink-secondary hover:bg-white/5 hover:text-ink"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Send review
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Google's mark, inlined so the button needs no network request. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.18-2 3.44-4.96 3.44-8.55Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.02-6.45-4.74H1.7v2.98A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.55 14.68a7.2 7.2 0 0 1 0-4.6V7.1H1.7a12 12 0 0 0 0 10.56l3.85-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.2 15.1 0 12 0 7.4 0 3.42 2.64 1.7 6.48l3.85 2.98C6.46 6.77 9 4.75 12 4.75Z"
      />
    </svg>
  );
}
