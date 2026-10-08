import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bookmark, Share2, ExternalLink, Star, Play } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getThumbnail, getPlatformBadgeStyle, getEmbedUrl } from "../../lib/thumbnails";
import toast from "react-hot-toast";
import { bookmarkService } from "../../services/bookmarkService";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";

// ─── Hover-preview hook ───────────────────────────────────────────────────────
function useHoverPreview(resource) {
  const [showPreview, setShowPreview] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const previewInfo = getEmbedUrl(resource);

  const onMouseEnter = useCallback(() => {
    if (!previewInfo.type) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 300);
  }, [previewInfo.type]);

  const onMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowPreview(false);
    setIsMediaLoaded(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  const onTouchStart = useCallback(() => {
    // On touch devices, allow tapping preview if desired without hovering
    if (!previewInfo.type) return;
    setShowPreview((prev) => !prev);
  }, [previewInfo.type]);

  useEffect(() => {
    if (showPreview && previewInfo.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [showPreview, previewInfo.type]);

  return {
    showPreview,
    isMediaLoaded,
    setIsMediaLoaded,
    previewInfo,
    videoRef,
    onMouseEnter,
    onMouseLeave,
    onTouchStart,
  };
}

// ─── ResourceCard ─────────────────────────────────────────────────────────────

export function ResourceCard({ resource, bookmarked = false, onBookmarkToggle, variant = "default" }) {
  if (!resource) return null;

  const { user } = useAuth();
  const navigate = useNavigate();
  const resourceId = resource._id || resource.id;
  const detailUrl = `/resources/${resourceId}`;
  const thumbnail = getThumbnail(resource.url, resource.thumbnail);
  const platformStyle = getPlatformBadgeStyle(resource.platform);

  const {
    showPreview,
    isMediaLoaded,
    setIsMediaLoaded,
    previewInfo,
    videoRef,
    onMouseEnter,
    onMouseLeave,
    onTouchStart,
  } = useHoverPreview(resource);

  async function handleBookmark(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to save resources");
      navigate("/login");
      return;
    }
    try {
      const res = await bookmarkService.toggle(resourceId);
      if (onBookmarkToggle) {
        onBookmarkToggle(resourceId, res.data.bookmarked);
      }
      toast.success(res.data.bookmarked ? "Bookmarked!" : "Bookmark removed");
    } catch {
      toast.error("Failed to update bookmark");
    }
  }

  function handleShare(e) {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${detailUrl}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  }

  function handleCardClick(e) {
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("iframe") || e.target.closest("video")) {
      return;
    }
    navigate(detailUrl);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && e.target === e.currentTarget) {
      navigate(detailUrl);
    }
  }

  const cardClasses = {
    default:
      "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] cursor-pointer",
    compact:
      "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md cursor-pointer",
  };

  const [imgError, setImgError] = useState(false);
  const hasPreview = Boolean(previewInfo.type && previewInfo.url);

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      className={cardClasses[variant]}
      aria-label={resource.title}
    >
      {/* Thumbnail / hover-preview zone */}
      <div
        className="relative aspect-video overflow-hidden bg-muted block"
        aria-hidden="true"
      >
        {/* Static thumbnail */}
        {thumbnail && !imgError ? (
          <img
            src={thumbnail}
            alt=""
            onError={() => setImgError(true)}
            className={cn(
              "h-full w-full object-cover transition-all duration-300",
              showPreview && isMediaLoaded ? "opacity-0" : "opacity-100 group-hover:scale-105"
            )}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 p-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border shadow-xs text-primary">
              <Play className="h-6 w-6 fill-primary" />
            </span>
          </div>
        )}

        {/* YouTube iframe preview */}
        {showPreview && previewInfo.type === "youtube" && (
          <iframe
            key={previewInfo.url}
            src={previewInfo.url}
            title={`Preview: ${resource.title}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIsMediaLoaded(true)}
            className={cn(
              "absolute inset-0 h-full w-full border-0 pointer-events-none transition-opacity duration-300",
              isMediaLoaded ? "opacity-100" : "opacity-0"
            )}
            aria-label={`Video preview for ${resource.title}`}
          />
        )}

        {/* Direct HTML5 Video preview */}
        {showPreview && previewInfo.type === "video" && (
          <video
            ref={videoRef}
            src={previewInfo.url}
            muted
            autoPlay
            loop
            playsInline
            preload="none"
            onLoadedData={() => setIsMediaLoaded(true)}
            className={cn(
              "absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300",
              isMediaLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Play badge shown when preview is available and idle */}
        {!showPreview && hasPreview && (
          <span
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
            aria-hidden="true"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white shadow-lg">
              <Play className="h-5 w-5 fill-white" />
            </span>
          </span>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] font-semibold"
            style={{
              background: platformStyle.bg,
              color: platformStyle.color,
              borderColor: platformStyle.color,
            }}
          >
            {resource.platform}
          </Badge>
          {resource.level && (
            <Badge variant="subtle" className="text-[10px] font-medium">
              {resource.level}
            </Badge>
          )}
          {resource.duration && (
            <span className="text-[10px] text-muted-foreground">{resource.duration}</span>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
          <Link
            to={detailUrl}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline focus:outline-none"
          >
            {resource.title}
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {resource.description}
        </p>

        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="subtle" className="text-[10px]">
                {tag}
              </Badge>
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
              <Badge variant="success" className="ml-1 text-[10px]">
                Verified
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBookmark}
              className={cn(
                "text-muted-foreground hover:text-primary",
                bookmarked && "text-primary"
              )}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-primary")} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors inline-flex items-center justify-center"
              aria-label="Open external resource"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}