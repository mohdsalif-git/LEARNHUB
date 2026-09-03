import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { resourceService } from "../../services/resourceService";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { categories } from "../../lib/data";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { Button } from "../../components/ui/Button";
import { EmptyState, LoadingState } from "../../components/ui/StateComponents";
import { SectionHeader } from "../../components/common/SectionHeader";

export default function CategoryDetailPage() {
  const { slug } = useParams();
  const [resources, setResources] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    resourceService.getAll({ category: slug })
      .then((res) => {
        setResources(res.data.resources);
        const localCategory = categories.find((c) => c.slug === slug);
        if (localCategory) {
          setCategory(localCategory);
        } else {
          setCategory({ slug, name: slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) });
        }
      })
      .catch(() => {
        const localCategory = categories.find((c) => c.slug === slug);
        if (localCategory) {
          setCategory(localCategory);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const categoryColor = category?.color || "oklch(0.55 0.22 285)";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/categories" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All Categories
      </Link>

      {category && (
        <div className="mb-8 flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${categoryColor} 14%, transparent)`, color: categoryColor }}>
            <CategoryIcon icon={category?.icon || "book-open"} sizePx={28} />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{category.name || "Category"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{category.description || "Learning resources in this category"}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading resources">
          {[1, 2, 3].map((i) => <LoadingState key={i} type="spinner" size="lg" />)}
        </div>
      ) : resources.length === 0 ? (
        <EmptyState type="resources" action={{ label: "Share a resource", variant: "primary", href: "/share" }} />
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">{resources.length} resource{resources.length !== 1 ? "s" : ""} found</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => <ResourceCard key={r._id} resource={r} />)}
          </div>
        </>
      )}
    </div>
  );
}