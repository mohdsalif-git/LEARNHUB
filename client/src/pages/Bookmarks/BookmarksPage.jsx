import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Trash2 } from "lucide-react";
import { bookmarkService } from "../../services/bookmarkService";
import { ResourceCard } from "../../components/resources/ResourceCard";
import toast from "react-hot-toast";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    try {
      const res = await bookmarkService.getAll();
      setBookmarks(res.data.bookmarks);
    } catch {
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(resourceId) {
    setBookmarks((prev) => prev.filter((b) => (b.resource?._id || b.resource) !== resourceId));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Saved Resources</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your bookmarked learning resources</p>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="py-16 text-center">
            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold text-foreground">No bookmarks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start exploring and save resources you love</p>
            <Link to="/search" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Explore Resources
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.map((b) => (
              <ResourceCard
                key={b._id}
                resource={b.resource}
                bookmarked={true}
                onBookmarkToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
