import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

/**
 * Shared Wingly Logo component.
 *
 * Requirements:
 * - Plain <img> only: alt="Wingly", width/height attributes set, draggable={false}
 * - Light: /brand/wingly-logo.png, Dark: /brand/wingly-logo-dark.png (switched with dark:hidden / hidden dark:block)
 * - Under 360px wide: switches to /brand/wingly-mark.png if compact/responsive
 * - Wrapped in <Link to="/">
 * - No background, padding plate, ring, border, shadow or blend-mode tricks
 */
export function Logo({
  className,
  priority = false,
  to = "/",
  markOnly = false,
  showMarkOnSmall = true,
  imgClassName,
}) {
  const content = (
    <span className={cn("inline-flex items-center", className)}>
      {markOnly ? (
        <img
          src="/brand/wingly-mark.png"
          alt="Wingly"
          width={512}
          height={512}
          draggable={false}
          fetchPriority={priority ? "high" : "auto"}
          className={cn("h-8 w-8 object-contain select-none", imgClassName)}
        />
      ) : (
        <>
          {/* On screens under 360px: optional compact mark to avoid crowding navbar */}
          {showMarkOnSmall && (
            <img
              src="/brand/wingly-mark.png"
              alt="Wingly"
              width={512}
              height={512}
              draggable={false}
              fetchPriority={priority ? "high" : "auto"}
              className={cn("max-[359px]:block min-[360px]:hidden h-8 w-8 object-contain select-none", imgClassName)}
            />
          )}

          {/* Full Logo: Light mode */}
          <img
            src="/brand/wingly-logo.png"
            alt="Wingly"
            width={1200}
            height={447}
            draggable={false}
            fetchPriority={priority ? "high" : "auto"}
            className={cn(
              "h-9 md:h-11 w-auto object-contain select-none dark:hidden",
              showMarkOnSmall ? "max-[359px]:hidden min-[360px]:block" : "block",
              imgClassName
            )}
          />

          {/* Full Logo: Dark mode */}
          <img
            src="/brand/wingly-logo-dark.png"
            alt="Wingly"
            width={1200}
            height={447}
            draggable={false}
            fetchPriority={priority ? "high" : "auto"}
            className={cn(
              "h-9 md:h-11 w-auto object-contain select-none hidden dark:block",
              showMarkOnSmall ? "max-[359px]:hidden min-[360px]:dark:block" : "dark:block",
              imgClassName
            )}
          />
        </>
      )}
    </span>
  );

  if (!to) {
    return content;
  }

  return (
    <Link
      to={to}
      className="inline-flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
      aria-label="Wingly Home"
    >
      {content}
    </Link>
  );
}

export default Logo;
