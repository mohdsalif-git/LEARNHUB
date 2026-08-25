export function getYouTubeThumbnail(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?#]+)/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return null;
}

export function getThumbnail(url, thumbnail) {
  if (thumbnail) return thumbnail;
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
