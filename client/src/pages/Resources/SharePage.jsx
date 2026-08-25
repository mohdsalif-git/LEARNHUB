import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { resourceService } from "../../services/resourceService";
import { categories } from "../../lib/data";
import toast from "react-hot-toast";

export default function SharePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    category: "",
    platform: "YouTube",
    level: "Beginner",
    duration: "",
    tags: "",
    submitterName: user?.name || "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.url || !form.description || !form.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      await resourceService.submit({
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <CheckCircle className="mx-auto h-12 w-12 text-[color:var(--success)]" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Resource Submitted!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Thank you for contributing. Your resource will be reviewed by our team.</p>
          <button onClick={() => navigate("/")} className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Share a Resource</h1>
      <p className="mt-2 text-sm text-muted-foreground">Help other learners by sharing free educational resources you've found useful.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <div>
          <label className="text-sm font-medium text-foreground">Resource Title *</label>
          <input name="title" value={form.title} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. React Crash Course" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">URL *</label>
          <input name="url" value={form.url} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="https://..." />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Brief description of the resource" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Category *</label>
            <select name="category" value={form.category} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Platform</label>
            <select name="platform" value={form.platform} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              {["YouTube", "freeCodeCamp", "Edureka", "Google", "MDN", "Coursera", "Khan Academy", "GitHub", "Other"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Level</label>
            <select name="level" value={form.level} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Duration</label>
            <input name="duration" value={form.duration} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="e.g. 3h" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
          <input name="tags" value={form.tags} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="react, javascript, frontend" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Your Name</label>
          <input name="submitterName" value={form.submitterName} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Your name" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {loading ? "Submitting..." : "Submit Resource"}
        </button>
      </form>
    </div>
  );
}
