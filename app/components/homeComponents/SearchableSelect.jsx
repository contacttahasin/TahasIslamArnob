"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ChevronDown } from "lucide-react";

/**
 * Generic searchable dropdown. Not native <select> markup — needed so we can
 * render flags/rich labels and filter a long list by typing, neither of
 * which a native <select> can do reliably across browsers.
 */
export default function SearchableSelect({
  items,
  value,
  onChange,
  getKey,
  renderTrigger,
  renderOption,
  getSearchText,
  searchPlaceholder = "Search...",
  triggerClassName = "",
  panelClassName = "",
  emptyLabel = "No results",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getSearchText(item).toLowerCase().includes(q));
  }, [items, query, getSearchText]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* eslint-disable react-hooks/set-state-in-effect --
   * resets search UI state on open; nothing to compute during render for it. */
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlighted(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectItem = (item) => {
    onChange(item);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlighted];
      if (item) selectItem(item);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center justify-between gap-2 rounded-xl border border-line bg-white/5 px-4 py-3 text-ink outline-none transition-all duration-300 focus:border-noir-gold ${
          open ? "border-noir-gold" : ""
        } ${triggerClassName}`}
      >
        {renderTrigger(value)}
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-muted transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 mt-2 max-h-72 overflow-hidden rounded-xl border border-line bg-bg-elevated/95 backdrop-blur-xl shadow-[0_20px_45px_-15px_rgba(0,0,0,0.65)] ${panelClassName}`}
          >
            <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
              <Search size={15} className="shrink-0 text-ink-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
            </div>

            <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink-muted">{emptyLabel}</li>
              )}

              {filtered.map((item, i) => {
                const isSelected = value && getKey(item) === getKey(value);
                const isHighlighted = i === highlighted;
                return (
                  <li key={getKey(item)} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                        isSelected
                          ? "text-noir-gold-bright"
                          : isHighlighted
                          ? "bg-white/5 text-ink"
                          : "text-ink"
                      }`}
                    >
                      {renderOption(item)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
