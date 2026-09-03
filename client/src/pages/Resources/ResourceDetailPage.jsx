import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Star, Bookmark, Share2 } from "lucide-react";
import { resourceService } from "../../services/resourceService";
import { bookmarkService } from "../../services/bookmarkService";
import { useAuth } from "../../context/AuthContext";
import { getThumbnail, getPlatformBadgeStyle } from "../../lib/thumbnails";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/StateComponents";

export default function ResourceDetailPage() {
  const { id } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    resourceService.getById(id)
      .then((res) => setResource(res.data.resource))
      .catch(() => toast.error("Resource not found"))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleBookmark() {
    if (!user) {
      toast.error("Please login to bookmark");
      return;
    }
    try {
      const res = await bookmarkService.toggle(id);
      setBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? "Bookmarked!" : "Bookmark removed");
    } catch {
      toast.error("Failed to update bookmark");
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="h-64 rounded-2xl bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <EmptyState type="resources" action={{ label: "Back to Search", variant: "outline", href: "/search" }} />
      </div>
    );
  }

  const thumbnail = getThumbnail(resource.url, resource.thumbnail);
  const platformStyle = getPlatformBadgeStyle(resource.platform);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link to="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        {thumbnail && (
          <div className="aspect-video overflow-hidden bg-muted">
            <img src={thumbnail} alt={resource.title} className="h-full w-full object-cover" loading="lazy" />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" className="text-[10px] font-semibold" style={{ background: platformStyle.bg, color: platformStyle.color, borderColor: platformStyle.color }}>
              {resource.platform}
            </Badge>
            {resource.level && <Badge variant="subtle" className="text-[10px] font-medium">{resource.level}</Badge>}
            {resource.duration && <span className="text-[10px] text-muted-foreground">{resource.duration}</span>}
            {resource.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <Star className="h-3 w-3 fill-[color:var(--warning)] text-[color:var(--warning)]" /> {resource.rating}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold text-foreground">{resource.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>

          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="subtle" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              <ExternalLink className="h-4 w-4" /> Open Resource
            </a>
            <Button
              variant="outline"
              onClick={toggleBookmark}
              className="gap-2"
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-primary text-primary" : ""}`} />
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="gap-2"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}