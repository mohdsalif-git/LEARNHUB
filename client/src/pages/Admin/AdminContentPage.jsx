import { useState, useEffect } from "react";
import {
  Users,
  Sparkles,
  ListOrdered,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { CategoryIcon } from "../../components/common/CategoryIcon";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import toast from "react-hot-toast";

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState("team"); // 'team' | 'why' | 'how'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Content &amp; Sections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit Our Team, "Why LearnHub" marquee cards, and "How It Works" steps
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "team"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" /> Our Team
        </button>
        <button
          onClick={() => setActiveTab("why")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "why"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" /> "Why LearnHub" Cards
        </button>
        <button
          onClick={() => setActiveTab("how")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === "how"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListOrdered className="h-4 w-4" /> "How It Works" Steps
        </button>
      </div>

      {activeTab === "team" && <TeamManager />}
      {activeTab === "why" && <WhyCardsManager />}
      {activeTab === "how" && <HowStepsManager />}
    </div>
  );
}

// ─── Team Manager ────────────────────────────────────────────────────────────
function TeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const initialForm = {
    name: "",
    role: "",
    bio: "",
    photo: "",
    initials: "",
    color: "oklch(0.55 0.22 285)",
    displayOrder: 0,
    github: "",
    twitter: "",
    linkedin: "",
    website: "",
  };
  const [form, setForm] = useState(initialForm);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await adminService.getTeam();
      setMembers(res.data?.members || []);
    } catch {
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const startEdit = (m) => {
    setForm({
      name: m.name || "",
      role: m.role || "",
      bio: m.bio || "",
      photo: m.photo || "",
      initials: m.initials || "",
      color: m.color || "oklch(0.55 0.22 285)",
      displayOrder: m.displayOrder ?? 0,
      github: m.socialLinks?.github || "",
      twitter: m.socialLinks?.twitter || "",
      linkedin: m.socialLinks?.linkedin || "",
      website: m.socialLinks?.website || "",
    });
    setEditingId(m._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) {
      toast.error("Name and Role are required");
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      role: form.role.trim(),
      bio: form.bio.trim(),
      photo: form.photo.trim(),
      initials: form.initials.trim(),
      color: form.color.trim(),
      displayOrder: Number(form.displayOrder) || 0,
      socialLinks: {
        github: form.github.trim(),
        twitter: form.twitter.trim(),
        linkedin: form.linkedin.trim(),
        website: form.website.trim(),
      },
    };

    try {
      if (editingId) {
        await adminService.updateTeamMember(editingId, payload);
        toast.success("Team member updated");
      } else {
        await adminService.createTeamMember(payload);
        toast.success("Team member created");
      }
      resetForm();
      loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save team member");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteTeamMember(deleteTarget._id);
      toast.success("Team member deleted");
      setDeleteTarget(null);
      loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete team member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Our Team ({members.length})</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">{editingId ? "Edit Team Member" : "New Team Member"}</h3>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Full Name"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role *</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
                placeholder="e.g. Lead Designer"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Photo URL (optional)</label>
              <input
                value={form.photo}
                onChange={(e) => setForm({ ...form, photo: e.target.value })}
                placeholder="https://..."
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Initials / Badge</label>
              <input
                value={form.initials}
                onChange={(e) => setForm({ ...form, initials: e.target.value })}
                placeholder="e.g. AS"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Color (OKLCH or Hex)</label>
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="oklch(0.55 0.22 285)"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={2}
                placeholder="Short bio..."
                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">GitHub URL</label>
              <input
                value={form.github}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
                placeholder="https://github.com/..."
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Twitter URL</label>
              <input
                value={form.twitter}
                onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                placeholder="https://twitter.com/..."
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">LinkedIn URL</label>
              <input
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingId ? "Update Member" : "Create Member"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Member</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Social</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} className="h-9 w-9 rounded-full object-cover border border-border" />
                      ) : (
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white shadow-xs"
                          style={{ background: m.color || "oklch(0.55 0.22 285)" }}
                        >
                          {m.initials || m.name?.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{m.bio}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.role}</td>
                  <td className="px-4 py-3 text-foreground font-mono">{m.displayOrder ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {Object.values(m.socialLinks || {}).filter(Boolean).length} links
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(m)} className="h-8 w-8 mr-1">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(m)} className="h-8 w-8 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteModal
          title="Delete Team Member"
          description={`Are you sure you want to remove "${deleteTarget.name}" from the team?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Why Cards Manager ───────────────────────────────────────────────────────
function WhyCardsManager() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const initialForm = {
    icon: "zap",
    title: "",
    description: "",
    displayOrder: 0,
  };
  const [form, setForm] = useState(initialForm);

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await adminService.getWhyCardsAdmin();
      setCards(res.data?.cards || []);
    } catch {
      toast.error("Failed to load Why LearnHub cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const startEdit = (c) => {
    setForm({
      icon: c.icon || "zap",
      title: c.title || "",
      description: c.description || "",
      displayOrder: c.displayOrder ?? 0,
    });
    setEditingId(c._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and Description are required");
      return;
    }

    setSubmitting(true);
    const payload = {
      icon: form.icon.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      displayOrder: Number(form.displayOrder) || 0,
    };

    try {
      if (editingId) {
        await adminService.updateWhyCard(editingId, payload);
        toast.success("Card updated");
      } else {
        await adminService.createWhyCard(payload);
        toast.success("Card created");
      }
      resetForm();
      loadCards();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save card");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteWhyCard(deleteTarget._id);
      toast.success("Card deleted");
      setDeleteTarget(null);
      loadCards();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete card");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Why LearnHub Cards ({cards.length})</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Card
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">{editingId ? "Edit Card" : "New Card"}</h3>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Icon Name</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="e.g. search, play, zap, book-open"
                  className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <CategoryIcon icon={form.icon} sizePx={18} />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Card Title"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={2}
                placeholder="Card description displayed in marquee..."
                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingId ? "Update Card" : "Create Card"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Card</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Icon</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <CategoryIcon icon={c.icon} sizePx={18} />
                      </div>
                      <div>
                        <p className="font-semibold">{c.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.icon}</td>
                  <td className="px-4 py-3 text-foreground font-mono">{c.displayOrder ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(c)} className="h-8 w-8 mr-1">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)} className="h-8 w-8 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteModal
          title="Delete Why LearnHub Card"
          description={`Are you sure you want to delete "${deleteTarget.title}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── How Steps Manager ───────────────────────────────────────────────────────
function HowStepsManager() {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const initialForm = {
    number: "01",
    title: "",
    description: "",
    displayOrder: 0,
  };
  const [form, setForm] = useState(initialForm);

  const loadSteps = async () => {
    setLoading(true);
    try {
      const res = await adminService.getHowStepsAdmin();
      setSteps(res.data?.steps || []);
    } catch {
      toast.error("Failed to load How It Works steps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSteps();
  }, []);

  const startEdit = (s) => {
    setForm({
      number: s.number || "01",
      title: s.title || "",
      description: s.description || "",
      displayOrder: s.displayOrder ?? 0,
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and Description are required");
      return;
    }

    setSubmitting(true);
    const payload = {
      number: form.number.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      displayOrder: Number(form.displayOrder) || 0,
    };

    try {
      if (editingId) {
        await adminService.updateHowStep(editingId, payload);
        toast.success("Step updated");
      } else {
        await adminService.createHowStep(payload);
        toast.success("Step created");
      }
      resetForm();
      loadSteps();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save step");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteHowStep(deleteTarget._id);
      toast.success("Step deleted");
      setDeleteTarget(null);
      loadSteps();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete step");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">How It Works Steps ({steps.length})</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Step
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">{editingId ? "Edit Step" : "New Step"}</h3>
            <button type="button" onClick={resetForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Step Number</label>
              <input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="e.g. 01, 02"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Step Title"
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Display Order</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                rows={2}
                placeholder="Step instructions..."
                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingId ? "Update Step" : "Create Step"}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Number</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Step Details</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => (
                <tr key={s._id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                      {s.number || "01"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground font-mono">{s.displayOrder ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(s)} className="h-8 w-8 mr-1">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)} className="h-8 w-8 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <DeleteModal
          title="Delete How Step"
          description={`Are you sure you want to delete step "${deleteTarget.title}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Reusable Delete Modal ───────────────────────────────────────────────────
function DeleteModal({ title, description, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="inline-flex items-center gap-1.5">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
