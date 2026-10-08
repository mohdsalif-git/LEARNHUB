import { forwardRef } from "react";
import * as Icons from "lucide-react";

const iconMap = {
  // Category icons
  "laptop-code":    Icons.Laptop,
  "code":           Icons.Code2,
  "file-code":      Icons.FileCode2,
  "mug-saucer":     Icons.Coffee,
  "chart-simple":   Icons.BarChart3,
  "brain":          Icons.Brain,
  "microchip":      Icons.Cpu,
  "cloud":          Icons.Cloud,
  "shield-halved":  Icons.Shield,
  "pen-ruler":      Icons.PenTool,
  "palette":        Icons.Palette,
  "bullhorn":       Icons.Megaphone,
  "briefcase":      Icons.Briefcase,
  "graduation-cap": Icons.GraduationCap,
  "user-tie":       Icons.UserCheck,
  "certificate":    Icons.Award,
  "book-open":      Icons.BookOpen,
  "users":          Icons.Users,
  "trending-up":    Icons.TrendingUp,
  // Why card icons
  "search":         Icons.Search,
  "play":           Icons.Play,
  "share2":         Icons.Share2,
  "message-square": Icons.MessageSquare,
  "zap":            Icons.Zap,
  // Misc
  "star":           Icons.Star,
  "heart":          Icons.Heart,
  "globe":          Icons.Globe,
};

const CategoryIcon = forwardRef(({ icon, sizePx = 20, className = "", ...props }, ref) => {
  const LucideIcon = iconMap[icon] || Icons.BookOpen;
  return <LucideIcon ref={ref} size={sizePx} className={className} {...props} />;
});
CategoryIcon.displayName = "CategoryIcon";

export { CategoryIcon };

