"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { vlogPosts, vlogCategories, type VlogCategory } from "@/data/vlog";
import VlogCard from "./VlogCard";

export default function VlogGrid() {
  const t = useTranslations();
  const [active, setActive] = useState<VlogCategory | "all">("all");

  const filtered = useMemo(
    () => (active === "all" ? vlogPosts : vlogPosts.filter((p) => p.category === active)),
    [active]
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-14 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
            active === "all"
              ? "border-noir-gold bg-noir-gold/10 text-noir-gold-bright"
              : "border-noir-border text-noir-ink-soft hover:border-noir-gold/50 hover:text-noir-gold-bright"
          }`}
        >
          {t("common.all")}
        </button>

        {vlogCategories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => setActive(category.value)}
            className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
              active === category.value
                ? "border-noir-gold bg-noir-gold/10 text-noir-gold-bright"
                : "border-noir-border text-noir-ink-soft hover:border-noir-gold/50 hover:text-noir-gold-bright"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post) => (
          <VlogCard key={post.slug} post={post} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-20 text-center text-sm text-noir-ink-faint">{t("vlog.emptyCategory")}</p>
      )}
    </div>
  );
}
