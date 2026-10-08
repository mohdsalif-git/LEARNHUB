import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Loader2 } from "lucide-react";
import { categoryService } from "../../services/categoryService";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { Button } from "../../components/ui/Button";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  name: "",
  slug: "",
  description: "",
  icon: "book-open",
  color: "oklch(0.55 0.22 285)",
  courseCount: 0,
  type: "main",
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation dialog state
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await categoryService.getAll();
      setCategories(res.data?.categories || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
    }));
  }

  function startEdit(cat) {
    setForm({
      name: cat.name || "",
      slug: cat.slug || "",
      description: cat.description || "",
      icon: cat.icon || "book-open",
      color: cat.color || "oklch(0.55 0.22 285)",
      courseCount: cat.courseCount || 0,
      type: cat.type || "main",
    });
    setEditingId(cat._id);
    setShowForm(true);
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await categoryService.update(editingId, form);
        toast.success("Category updated");
      } else {
        await categoryService.create(form);
        toast.success("Category created");
      }
      resetForm();
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await categoryService.delete(categoryToDelete._id);
      toast.success("Category deleted");
      setCategoryToDelete(null);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage learning categories, icons, colors, and course counts
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit Category" : "New Category"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Web Development"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Slug *</label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                placeholder="e.g. web-development"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="main">Main</option>
                <option value="sub">Sub</option>
                <option value="topic">Topic</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Icon Name</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
                  placeholder="e.g. laptop-code, code, brain"
                  className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border"
                  style={{
                    background: `color-mix(in oklab, ${form.color || "var(--primary)"} 15%, transparent)`,
                    color: form.color || "var(--primary)",
                  }}
                >
                  <CategoryIcon icon={form.icon} sizePx={18} />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Color (CSS / OKLCH)</label>
              <input
                name="color"
                value={form.color}
                onChange={handleChange}
                placeholder="oklch(0.55 0.22 285) or #6366f1"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Course Count (N+ courses)</label>
              <input
                name="courseCount"
                type="number"
                min="0"
                value={form.courseCount}
                onChange={handleChange}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                placeholder="Brief category overview..."
                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editingId ? "Update Category" : "Create Category"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Course Count</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                          style={{
                            background: `color-mix(in oklab, ${cat.color || "var(--primary)"} 15%, transparent)`,
                            color: cat.color || "var(--primary)",
                          }}
                        >
                          <CategoryIcon icon={cat.icon} sizePx={18} />
                        </span>
                        <div>
                          <p className="font-semibold">{cat.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3 text-foreground font-semibold">
                      {cat.courseCount ? `${cat.courseCount}+` : "0"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground uppercase">
                        {cat.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(cat)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground mr-1"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCategoryToDelete(cat)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${cat.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal before Deleting Category */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mt-4 text-lg font-bold text-foreground">Delete Category</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete the category{" "}
              <strong className="text-foreground">"{categoryToDelete.name}"</strong>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Category
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
