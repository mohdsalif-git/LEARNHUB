import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Bookmark, Share2, ExternalLink, Star, Play, Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getThumbnail, getPlatformBadgeStyle, getEmbedUrl } from "../../lib/thumbnails";
import toast from "react-hot-toast";
import { bookmarkService } from "../../services/bookmarkService";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";

// ─── Hover-preview hook ────────────────────────────────────────────────────────
function useHoverPreview(resource) {
  const [showPreview, setShowPreview] = useState(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const previewInfo = getEmbedUrl(resource);

  const onMouseEnter = useCallback(() => {
    if (!previewInfo.type) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowPreview(true), 300);
  }, [previewInfo.type]);

  const onMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowPreview(false);
    setIsMediaLoaded(false);
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  }, []);

  const onTouchStart = useCallback(() => {
    if (!previewInfo.type) return;
    setShowPreview((prev) => !prev);
  }, [previewInfo.type]);

  useEffect(() => {
    if (showPreview && previewInfo.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => { });
    }
  }, [showPreview, previewInfo.type]);

  return { showPreview, isMediaLoaded, setIsMediaLoaded, previewInfo, videoRef, onMouseEnter, onMouseLeave, onTouchStart };
}

// ─── 3D Tilt hook (mouse-only) ─────────────────────────────────────────────────
function useTilt3D() {
  const cardRef = useRef(null);
  const rafRef = useRef(null);

  const onMouseMove = useCallback((e) => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (prefersReduced || isTouch) return;

    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / (rect.width / 2);
    const ny = (e.clientY - cy) / (rect.height / 2);
    const rx = -ny * 5;
    const ry = nx * 5;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (card) card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
  }, []);

  const onMouseLeaveCard = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const card = cardRef.current;
    if (card) card.style.transform = "";
  }, []);

  return { cardRef, onMouseMove, onMouseLeaveCard };
}

// ─── ResourceCard ──────────────────────────────────────────────────────────────
export function ResourceCard({ resource, bookmarked = false, onBookmarkToggle, variant = "default" }) {
  if (!resource) return null;

  const { user } = useAuth();
  const navigate = useNavigate();
  const resourceId = resource._id || resource.id;
  const detailUrl = `/resources/${resourceId}`;
  const thumbnail = getThumbnail(resource.url, resource.thumbnail);
  const platformStyle = getPlatformBadgeStyle(resource.platform);

  const { showPreview, isMediaLoaded, setIsMediaLoaded, previewInfo, videoRef, onMouseEnter, onMouseLeave, onTouchStart } = useHoverPreview(resource);
  const { cardRef, onMouseMove, onMouseLeaveCard } = useTilt3D();

  const [imgError, setImgError] = useState(false);
  const hasPreview = Boolean(previewInfo.type && previewInfo.url);

  async function handleBookmark(e) {
    e.preventDefault(); e.stopPropagation();
    if (!user) { toast.error("Please login to save resources"); navigate("/login"); return; }
    try {
      const res = await bookmarkService.toggle(resourceId);
      if (onBookmarkToggle) onBookmarkToggle(resourceId, res.data.bookmarked);
      toast.success(res.data.bookmarked ? "Bookmarked!" : "Bookmark removed");
    } catch { toast.error("Failed to update bookmark"); }
  }

  function handleShare(e) {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}${detailUrl}`);
    toast.success("Link copied!");
  }

  function handleCardClick(e) {
    if (e.target.closest("button") || e.target.closest("a") || e.target.closest("iframe") || e.target.closest("video")) return;
    navigate(detailUrl);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && e.target === e.currentTarget) navigate(detailUrl);
  }

  const isCompact = variant === "compact";

  return (
    <div
      ref={cardRef}
      role="article"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={(e) => { onMouseEnter(e); onMouseMove(e); }}
      onMouseMove={onMouseMove}
      onMouseLeave={(e) => { onMouseLeave(e); onMouseLeaveCard(e); }}
      onTouchStart={onTouchStart}
      className={cn(
        "group relative flex flex-col overflow-hidden cursor-pointer",
        "transition-all duration-300",
        isCompact
          ? "rounded-xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)]"
          : "rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-float)] hover:border-primary/20"
      )}
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      aria-label={resource.title}
    >
      {/* ── Thumbnail / hover-preview ────────────────────────────────────── */}
      <div className="relative aspect-video overflow-hidden bg-muted" aria-hidden="true">
        {thumbnail && !imgError ? (
          <img
            src={thumbnail}
            alt=""
            onError={() => setImgError(true)}
            className={cn(
              "h-full w-full object-cover transition-all duration-500",
              showPreview && isMediaLoaded ? "opacity-0" : "opacity-100 group-hover:scale-105"
            )}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border shadow-sm text-primary">
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
            className={cn("absolute inset-0 h-full w-full border-0 pointer-events-none transition-opacity duration-300", isMediaLoaded ? "opacity-100" : "opacity-0")}
            aria-label={`Video preview for ${resource.title}`}
          />
        )}

        {/* HTML5 video preview */}
        {showPreview && previewInfo.type === "video" && (
          <video
            ref={videoRef} src={previewInfo.url} muted autoPlay loop playsInline preload="none"
            onLoadedData={() => setIsMediaLoaded(true)}
            className={cn("absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300", isMediaLoaded ? "opacity-100" : "opacity-0")}
          />
        )}

        {/* Play badge on hover */}
        {!showPreview && hasPreview && (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" aria-hidden="true">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white shadow-lg">
              <Play className="h-5 w-5 fill-white" />
            </span>
          </span>
        )}

        {/* Bottom gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Platform badge over thumbnail */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className="text-[10px] font-bold backdrop-blur-sm border-white/30 bg-white/90 dark:bg-card/90 dark:border-border shadow-sm"
            style={{ color: platformStyle.color }}
          >
            {resource.platform}
          </Badge>
        </div>

        {/* Duration badge */}
        {resource.duration && (
          <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {resource.duration}
          </div>
        )}
      </div>

      {/* ── Card body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          {resource.level && (
            <Badge variant="subtle" className="text-[10px] font-medium">{resource.level}</Badge>
          )}
          {resource.verified && (
            <Badge variant="success" className="text-[10px]">Verified</Badge>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200" style={{ fontFamily: "var(--font-display)" }}>
          <Link to={detailUrl} onClick={(e) => e.stopPropagation()} className="hover:underline focus:outline-none">
            {resource.title}
          </Link>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {resource.description}
        </p>

        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/15">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            {resource.rating > 0 && (
              <>
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span className="text-xs font-semibold text-foreground">{resource.rating}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleBookmark}
              className={cn(
                "rounded-lg p-1.5 transition-all duration-150 hover:bg-primary/8",
                bookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-primary")} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-lg p-1.5 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground"
              aria-label="Share"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg p-1.5 text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-primary inline-flex items-center justify-center"
              aria-label="Open external resource"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Top border glow on hover */}
      <div
        className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden="true"
      />
    </div>
  );
}