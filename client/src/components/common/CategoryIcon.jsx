import { forwardRef } from "react";
import * as Icons from "lucide-react";

const iconMap = {
  "laptop-code": Icons.Laptop,
  "code": Icons.Code2,
  "file-code": Icons.FileCode2,
  "mug-saucer": Icons.Coffee,
  "chart-simple": Icons.BarChart3,
  "brain": Icons.Brain,
  "microchip": Icons.Cpu,
  "cloud": Icons.Cloud,
  "shield-halved": Icons.Shield,
  "pen-ruler": Icons.PenTool,
  "palette": Icons.Palette,
  "bullhorn": Icons.Megaphone,
  "briefcase": Icons.Briefcase,
  "graduation-cap": Icons.GraduationCap,
  "user-tie": Icons.UserCheck,
  "certificate": Icons.Award,
  "book-open": Icons.BookOpen,
};

const CategoryIcon = forwardRef(({ icon, sizePx = 20, className = "", ...props }, ref) => {
  const LucideIcon = iconMap[icon] || Icons.BookOpen;
  return <LucideIcon ref={ref} size={sizePx} className={className} {...props} />;
});
CategoryIcon.displayName = "CategoryIcon";

export { CategoryIcon };
