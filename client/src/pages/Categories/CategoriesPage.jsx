import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { categoryService } from "../../services/categoryService";
import { categories as fallbackCategories } from "../../lib/data";

export default function CategoriesPage() {
  const [categoryList, setCategoryList] = useState(fallbackCategories);

  useEffect(() => {
    categoryService.getAll()
      .then((res) => {
        if (res.data?.categories && res.data.categories.length > 0) {
          setCategoryList(res.data.categories);
        }
      })
      .catch(() => {
        // Keep fallback categories
      });
  }, []);

  const allCategories = categoryList && categoryList.length > 0 ? categoryList : fallbackCategories;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">All Categories</h1>
      <p className="mt-2 text-sm text-muted-foreground">Browse our curated learning tracks across various topics</p>

      <div className="mt-8">
        {/* Show hierarchy: main categories first, then sub and topic */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Main categories */}
          {allCategories
            .filter((c) => c.type === "main" || !c.type)
            .slice(0, 8)
            .map((c) => (
              <Link
                key={c.slug}
                to={`/categories/${c.slug}`}
                className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}>
                  <CategoryIcon icon={c.icon} sizePx={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
              </Link>
            ))}
        </div>

        {/* Sub categories - show under main */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCategories
            .filter((c) => c.type === "sub")
            .slice(0, 12)
            .map((c) => (
              <Link
                key={c.slug}
                to={`/categories/${c.slug}`}
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}>
                  <CategoryIcon icon={c.icon} sizePx={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
              </Link>
            ))}
        </div>

        {/* Topic categories - show under sub */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCategories
            .filter((c) => c.type === "topic")
            .slice(0, 12)
            .map((c) => (
              <Link
                key={c.slug}
                to={`/categories/${c.slug}`}
                className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}>
                  <CategoryIcon icon={c.icon} sizePx={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}