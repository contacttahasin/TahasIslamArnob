"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import gsap from "gsap";
import { DEFAULT_LOCALE, isLocale, LOCALE_META, LOCALE_STORAGE_KEY, loadMessages, type Locale } from "@/lib/i18n";
import enMessages from "@/messages/en.json";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  isTransitioning: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // English messages are already in the initial bundle (imported directly
  // rather than lazily) so the server-rendered HTML and first client
  // paint always match — only a switch to Bangla triggers a lazy import.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Record<string, unknown>>(enMessages);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(false);

  // Restore a previously saved locale after mount — never on the server,
  // so this never causes a hydration mismatch; it's a deliberate
  // post-hydration correction, same trade-off as any client-only
  // preference that can't be known at request time.
  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored) && stored !== DEFAULT_LOCALE) {
      loadMessages(stored).then((next) => {
        setMessages(next);
        setLocaleState(stored);
        document.documentElement.lang = LOCALE_META[stored].bcp47;
      });
    }
  }, []);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale || pendingRef.current) return;
      pendingRef.current = true;
      setIsTransitioning(true);

      const finishSwitch = async () => {
        const nextMessages = await loadMessages(next);
        setMessages(nextMessages);
        setLocaleState(next);
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
        document.documentElement.lang = LOCALE_META[next].bcp47;

        // Let React paint the new text while still transparent, then fade
        // it in — otherwise the fade-in would animate over the old
        // content for a frame, producing a visible flicker/cross-fade
        // instead of a clean swap.
        requestAnimationFrame(() => {
          gsap.to(fadeRef.current, {
            opacity: 1,
            duration: 0.4,
            ease: "power2.out",
            onComplete: () => {
              pendingRef.current = false;
              setIsTransitioning(false);
            },
          });
        });
      };

      if (fadeRef.current) {
        gsap.to(fadeRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: finishSwitch,
        });
      } else {
        finishSwitch();
      }
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isTransitioning }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Dhaka">
        <div ref={fadeRef}>{children}</div>
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleSwitcher() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleSwitcher must be used within a LocaleProvider");
  }
  return ctx;
}
