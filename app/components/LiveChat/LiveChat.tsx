"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { BotMessageSquare, Send, X } from "lucide-react";
import { useLocaleSwitcher } from "@/app/lib/LocaleProvider";
import { LOCALE_META } from "@/lib/i18n";

type Message = {
  id: number;
  text: string;
  sender: "me" | "bot";
  // Seed greeting messages are created during SSR, so they intentionally
  // have no timestamp (Date.now() would differ between server and client
  // render, causing a hydration mismatch). Only messages created purely
  // from client-side interaction get one.
  timestamp: number | null;
};

// sessionStorage (not localStorage): history should survive route changes
// and refreshes within the tab, but clear itself once the tab closes, per
// spec — sessionStorage already has exactly that lifetime for free.
const MESSAGES_STORAGE_KEY = "live-chat:messages";
const OPEN_STORAGE_KEY = "live-chat:open";

export default function LiveChat() {
  const t = useTranslations("liveChat");
  const { locale } = useLocaleSwitcher();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Lazy initializer: the greeting is only "sent" once, at mount, in
  // whatever locale is active then — same as a real chat history not
  // retroactively retranslating messages already in the transcript.
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 1,
      sender: "bot",
      text: t("greeting"),
      timestamp: null,
    },
    {
      id: 2,
      sender: "bot",
      text: t("helpPrompt"),
      timestamp: null,
    },
  ]);

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return null;
    return new Intl.DateTimeFormat(LOCALE_META[locale].bcp47, {
      hour: "numeric",
      minute: "2-digit",
    }).format(timestamp);
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Restore any conversation/open-state saved from a previous mount of this
  // component (e.g. before the last route change) once, right after mount —
  // same post-hydration reconciliation pattern ThemeProvider uses elsewhere
  // in this app. `messages`/`open`'s initial state above stays deterministic
  // for SSR and the first client render either way, so this can never cause
  // a hydration mismatch; it only ever runs client-side, after hydration.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MESSAGES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // One-time sync from sessionStorage on mount, not a derived value
          // recomputed from props/state — the recommended alternative to
          // this rule (deriving during render) doesn't apply here.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMessages(parsed);
        }
      }
    } catch {
      // Corrupt or unavailable storage — keep the default greeting.
    }

    try {
      if (sessionStorage.getItem(OPEN_STORAGE_KEY) === "true") {
        setOpen(true);
      }
    } catch {
      // Ignore — falls back to closed.
    }
  }, []);

  // Persist on every change. Each ref below skips that state's very first
  // effect run (the pre-restore value from the initial render) so it can
  // never race the restore effect above and overwrite a just-loaded
  // conversation/open-state with the stale default before React re-renders
  // with the restored value.
  const skipMessagesPersistRef = useRef(true);
  useEffect(() => {
    if (skipMessagesPersistRef.current) {
      skipMessagesPersistRef.current = false;
      return;
    }
    try {
      sessionStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage unavailable (e.g. private mode quota) — history just won't persist.
    }
  }, [messages]);

  const skipOpenPersistRef = useRef(true);
  useEffect(() => {
    if (skipOpenPersistRef.current) {
      skipOpenPersistRef.current = false;
      return;
    }
    try {
      sessionStorage.setItem(OPEN_STORAGE_KEY, String(open));
    } catch {
      // Ignore.
    }
  }, [open]);

  // Not wired to any UI (none exists to clear chat today) — available for a
  // future clear-chat control without needing further plumbing.
  const clearChat = () => {
    setMessages([
      { id: 1, sender: "bot", text: t("greeting"), timestamp: null },
      { id: 2, sender: "bot", text: t("helpPrompt"), timestamp: null },
    ]);
    try {
      sessionStorage.removeItem(MESSAGES_STORAGE_KEY);
    } catch {
      // Ignore.
    }
  };
  void clearChat;

  // Scrolls only the chat's own message list — never the document. Two
  // things matter here:
  //  1. Gated on `open`: the panel is mounted (not display:none) but
  //     transformed off-screen while closed, so there's nothing useful to
  //     scroll into view yet, and doing so anyway was what triggered the
  //     bug below.
  //  2. `container.scrollTo` targets this element's own scroll box only.
  //     The previous code used `scrollIntoView` on a sentinel node, which
  //     walks up every scrollable ancestor — including the document — to
  //     bring the target into view. While the panel was closed
  //     (opacity-0, scaled down, translated off its resting position),
  //     that walk resolved to scrolling the whole page toward the
  //     fixed-position chat widget's corner, i.e. toward the bottom of
  //     whatever page LiveChat happened to mount on. `scrollTo` on the
  //     container can't do that even if `open` gating were ever bypassed.
  useEffect(() => {
    if (!open) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, open, isSending]);

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "me",
      text: trimmed,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setMessage("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.sender === "me" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.reply) {
        throw new Error(data?.error ?? "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: data.reply as string,
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: t("errorReply"),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Chat Window */}
      <div
        className={`
        fixed
        bottom-20
        right-4
        sm:right-6
        lg:bottom-20

        w-[calc(100vw-40px)]
        sm:w-[360px]

        h-[520px]
        max-h-[75vh]

        rounded-[28px]
        overflow-hidden
        flex flex-col
        min-h-0

        bg-bg-elevated

        border border-line

        shadow-[0_25px_60px_rgba(0,0,0,.45)]

        transition-all
        duration-300

        ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-8 pointer-events-none"
        }

        z-999999
      `}
      >
        {/* Header */}
        <div className="h-20 shrink-0 bg-bg-secondary border-b border-line text-ink flex items-center justify-between px-6 z-999999">
          <div>
            <h2 className="font-bold text-lg">{t("title")}</h2>

            <div className="flex items-center gap-2 text-sm text-ink-secondary">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>

              {t("online")}
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="hover:rotate-90 transition"
          >
            <X />
          </button>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="chat-scrollbar flex-1 min-h-0 overflow-y-auto bg-bg-primary p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === "me"
                  ? "items-end"
                  : "items-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-3xl max-w-[80%] text-sm leading-6 ${
                  msg.sender === "me"
                    ? "bg-glow-blue text-ink rounded-br-md"
                    : "bg-bg-elevated text-ink border border-line rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>

              {formatTime(msg.timestamp) && (
                <span className="mt-1 px-1 text-[11px] text-ink-muted">
                  {formatTime(msg.timestamp)}
                </span>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex items-start">
              <div className="px-4 py-3 rounded-3xl rounded-bl-md bg-bg-elevated text-ink border border-line flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 shrink-0 bg-bg-secondary border-t border-line">
          <div className="flex gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={t("placeholder")}
              disabled={isSending}
              className="flex-1 h-12 rounded-full bg-bg-elevated px-5 outline-none border border-line text-ink placeholder:text-ink-muted disabled:opacity-60"
            />

            <button
              onClick={sendMessage}
              disabled={isSending || !message.trim()}
              className="w-12 h-12 rounded-full bg-glow-blue text-ink flex items-center justify-center hover:scale-110 transition disabled:opacity-60 disabled:hover:scale-100"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="
        fixed

        right-[1vw]
        bottom-[max(1.7vh,16px)]

        sm:right-[1vw]
        sm:bottom-[max(1.7vh,16px)]

        w-14
        h-14

        sm:w-16
        sm:h-16

        rounded-full

        bg-bg-elevated
        border border-line
        text-ink

        flex
        items-center
        justify-center

        shadow-[0_10px_40px_rgba(79,140,255,.25)]

        hover:scale-110
        active:scale-95

        transition-all
        duration-300

      z-999999
        "
      >
        {open ? (
          <X size={28} />
        ) : (
          <BotMessageSquare size={28} />
        )}
      </button>
    </>
  );
}
