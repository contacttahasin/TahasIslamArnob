import type { VlogPost } from "@/data/vlog";
import { vlogCategories } from "@/data/vlog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VlogCard({ post }: { post: VlogPost }) {
  const categoryLabel = vlogCategories.find((c) => c.value === post.category)?.label ?? post.category;

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-noir-border bg-noir-surface/40 p-8 transition-colors duration-300 hover:border-noir-gold/50">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-noir-ink-faint">
        <span className="wrap-break-word rounded-full border border-noir-border px-3 py-1 text-noir-gold-bright">
          {categoryLabel}
        </span>
        <span className="whitespace-nowrap">{post.readTime} read</span>
      </div>

      <h3 className="wrap-break-word font-jakarta-sans text-xl font-bold text-noir-ink transition-colors duration-300 group-hover:text-noir-gold-bright sm:text-2xl">
        {post.title}
      </h3>

      <p className="mt-4 flex-1 wrap-break-word text-sm leading-relaxed text-noir-ink-soft">{post.excerpt}</p>

      <time dateTime={post.date} className="mt-6 text-xs text-noir-ink-faint">
        {formatDate(post.date)}
      </time>
    </article>
  );
}
