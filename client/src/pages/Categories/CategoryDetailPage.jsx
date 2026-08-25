import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { resourceService } from "../../services/resourceService";
import { categories } from "../../lib/data";

export default function CategoryDetailPage() {
  const { slug } = useParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    setLoading(true);
    resourceService.getAll({ category: slug })
      .then((res) => setResources(res.data.resources))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/categories" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All Categories
      </Link>

      {category && (
        <div className="mb-8 flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${category.color} 14%, transparent)`, color: category.color }}>
            <CategoryIcon icon={category.icon} sizePx={28} />
          </span>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : resources.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-foreground">No resources in this category yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to contribute!</p>
          <Link to="/share" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Share a resource</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => <ResourceCard key={r._id} resource={r} />)}
        </div>
      )}
    </div>
  );
}
