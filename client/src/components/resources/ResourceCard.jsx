import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Share2, ExternalLink, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getThumbnail, getPlatformBadgeStyle } from "../../lib/thumbnails";
import toast from "react-hot-toast";
import { bookmarkService } from "../../services/bookmarkService";

export function ResourceCard({ resource, bookmarked = false, onBookmarkToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const thumbnail = getThumbnail(resource.url, resource.thumbnail);
  const platformStyle = getPlatformBadgeStyle(resource.platform);

  async function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save resources");
      navigate("/login");
      return;
    }
    try {
      const res = await bookmarkService.toggle(resource._id || resource.id);
      if (onBookmarkToggle) {
        onBookmarkToggle(resource._id || resource.id, res.data.bookmarked);
      }
      toast.success(res.data.bookmarked ? "Bookmarked!" : "Bookmark removed");
    } catch {
      toast.error("Failed to update bookmark");
    }
  }

  function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/resources/${resource._id || resource.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  }

  return (
    <Link
      to={`/resources/${resource._id || resource.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
    >
      {thumbnail && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={thumbnail}
            alt={resource.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: platformStyle.bg, color: platformStyle.color }}
          >
            {resource.platform}
          </span>
          {resource.level && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {resource.level}
            </span>
          )}
          {resource.duration && (
            <span className="text-[10px] text-muted-foreground">{resource.duration}</span>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
          {resource.title}
        </h3>

        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {resource.description}
        </p>

        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-1">
            {resource.rating > 0 && (
              <>
                <Star className="h-3 w-3 fill-[color:var(--warning)] text-[color:var(--warning)]" />
                <span className="text-xs font-medium">{resource.rating}</span>
              </>
            )}
            {resource.verified && (
              <span className="ml-1 text-[10px] font-medium text-[color:var(--success)]">Verified</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleBookmark}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
              title="Bookmark"
            >
              <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-primary text-primary" : ""}`} />
            </button>
            <button
              onClick={handleShare}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
              title="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
              title="Open resource"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Link>
  );
}
