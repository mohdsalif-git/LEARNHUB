export function extractYouTubeId(url) {
  if (!url) return null;
  const str = String(url).trim();
  const match = str.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([^&?#\s]+)/i);
  return match && match[1] ? match[1] : null;
}

export function getYouTubeThumbnail(url) {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
}

/**
 * Returns a YouTube embed URL suitable for preview or full playback
 */
export function getYouTubeEmbedUrl(url, { autoplay = 1, mute = 1, controls = 0 } = {}) {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    const params = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      mute: mute ? "1" : "0",
      controls: controls ? "1" : "0",
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
      loop: autoplay ? "1" : "0",
      playlist: videoId,
      enablejsapi: "1",
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  }
  return null;
}

/**
 * Returns preview configuration for a resource:
 * - { type: 'youtube', url: '...' }
 * - { type: 'video', url: '...' }
 * - { type: null, url: null }
 */
export function getEmbedUrl(resource, options = {}) {
  if (!resource) return { type: null, url: null, videoId: null };
  const targetUrl = typeof resource === "string" ? resource : resource.url || resource.videoUrl || "";
  if (!targetUrl) return { type: null, url: null, videoId: null };

  const videoId = extractYouTubeId(targetUrl);
  if (videoId) {
    return {
      type: "youtube",
      videoId,
      url: getYouTubeEmbedUrl(targetUrl, options),
    };
  }

  // Check for direct video file extensions or patterns
  const isVideoFile = /\.(mp4|webm|ogg|m4v|mov)(\?.*)?$/i.test(targetUrl) ||
    /cloudinary\.com\/.*\/video\/upload/i.test(targetUrl);

  if (isVideoFile) {
    return { type: "video", videoId: null, url: targetUrl };
  }

  return { type: null, url: null, videoId: null };
}

export function getThumbnail(url, thumbnail) {
  if (thumbnail && typeof thumbnail === "string" && thumbnail.trim() !== "") {
    return thumbnail;
  }
  return getYouTubeThumbnail(url) || null;
}

export function getCategoryGradient(color) {
  if (!color) return "linear-gradient(135deg, oklch(0.55 0.22 285), oklch(0.68 0.19 290))";
  return `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 60%, oklch(0.68 0.19 290)))`;
}

export function getPlatformBadgeStyle(platform) {
  const styles = {
    YouTube: { bg: "rgba(255, 0, 0, 0.1)", color: "#ff0000" },
    freeCodeCamp: { bg: "rgba(10, 10, 35, 0.1)", color: "#0a0a23" },
    Edureka: { bg: "rgba(0, 122, 255, 0.1)", color: "#007aff" },
    Google: { bg: "rgba(66, 133, 244, 0.1)", color: "#4285f4" },
    MDN: { bg: "rgba(0, 0, 0, 0.1)", color: "#333" },
    Coursera: { bg: "rgba(0, 86, 210, 0.1)", color: "#0056d2" },
    "Khan Academy": { bg: "rgba(20, 191, 150, 0.1)", color: "#14bf96" },
    GitHub: { bg: "rgba(0, 0, 0, 0.1)", color: "#24292f" },
  };
  return styles[platform] || { bg: "rgba(128, 128, 128, 0.1)", color: "#666" };
}
