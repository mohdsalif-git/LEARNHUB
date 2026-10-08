import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { Button } from "../ui/Button";

function expandRow(items, minLength = 8) {
  if (!items || items.length === 0) return [];
  let result = [...items];
  while (result.length < minLength) {
    result = [...result, ...items];
  }
  return result;
}

export function CategoryCarousel({ categories = [] }) {
  const row1WrapperRef = useRef(null);
  const row2WrapperRef = useRef(null);

  if (!categories || categories.length === 0) return null;

  // Split categories into two staggered rows
  const half = Math.ceil(categories.length / 2);
  const rawRow1 = categories.slice(0, half);
  const rawRow2 = categories.slice(half);

  const row1 = expandRow(rawRow1, 8);
  const row2 = expandRow(rawRow2, 8);

  const scrollRows = (direction) => {
    const amount = direction === "left" ? -320 : 320;
    [row1WrapperRef, row2WrapperRef].forEach((ref) => {
      if (ref.current) {
        ref.current.scrollBy({ left: amount, behavior: "smooth" });
      }
    });
  };

  return (
    <section className="py-16 sm:py-24" aria-labelledby="categories-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              EXPLORE &amp; LEARN
            </p>
            <h2 id="categories-heading" className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Learn by Category
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Curated free resources across top technical and creative disciplines.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-end">
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group mr-2"
            >
              <span>View all categories</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <div className="flex items-center gap-1.5" role="group" aria-label="Category carousel navigation">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border border-border shadow-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => scrollRows("left")}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border border-border shadow-xs hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => scrollRows("right")}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/*
        Two-row marquee strip.
        Each row is masked with overflow-hidden and animated with pure CSS infinite loop.
        Hovering pauses the animation automatically via CSS.
      */}
      <div
        className="flex flex-col gap-4 py-2"
        aria-label="Scrollable category rows"
      >
        {/* Row 1 — masked, scrolls left */}
        <div ref={row1WrapperRef} className="overflow-hidden w-full select-none">
          <div className="marquee-track flex gap-4 pl-4">
            {/* Visible originals */}
            {row1.map((cat, idx) => (
              <CategoryCard key={`${cat._id || cat.slug || idx}-${idx}`} category={cat} />
            ))}
            {/* Clones for seamless loop — hidden from AT */}
            {row1.map((cat, idx) => (
              <CategoryCard
                key={`clone-${cat._id || cat.slug || idx}-${idx}`}
                category={cat}
                aria-hidden="true"
                tabIndex={-1}
              />
            ))}
          </div>
        </div>

        {/* Row 2 — masked, scrolls right (reverse) */}
        <div ref={row2WrapperRef} className="overflow-hidden w-full select-none">
          <div className="marquee-track-reverse flex gap-4 pl-12">
            {/* Visible originals */}
            {row2.map((cat, idx) => (
              <CategoryCard key={`${cat._id || cat.slug || idx}-${idx}`} category={cat} />
            ))}
            {/* Clones for seamless loop — hidden from AT */}
            {row2.map((cat, idx) => (
              <CategoryCard
                key={`clone-${cat._id || cat.slug || idx}-${idx}`}
                category={cat}
                aria-hidden="true"
                tabIndex={-1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
