import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { categoryService } from "../../services/categoryService";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/StateComponents";

export default function CategoriesPage() {
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getAll({ status: "active" })
      .then((res) => {
        setCategoryList(res.data?.categories || []);
      })
      .catch(() => {
        setCategoryList([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const allCategories = categoryList || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">All Categories</h1>
      <p className="mt-2 text-sm text-muted-foreground">Browse our curated learning tracks across various topics</p>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 animate-pulse">
              <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : allCategories.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            type="categories"
            title="No categories available yet"
            description="Categories will appear here once configured by administrators."
          />
        </div>
      ) : (
        <div className="mt-8">
          {/* Show hierarchy: main categories first, then sub and topic */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
            {/* Main categories */}
            {allCategories
              .filter((c) => c.type === "main" || !c.type)
              .map((c) => (
              <Link
                key={c.slug}
                to={`/categories/${c.slug}`}
                className="group relative flex h-full min-h-40 items-start gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}>
                  <CategoryIcon icon={c.icon} sizePx={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-3 break-words">{c.description}</p>
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
      )}
    </div>
  );
}