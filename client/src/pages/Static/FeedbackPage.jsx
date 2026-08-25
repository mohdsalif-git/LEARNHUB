import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { feedbackService } from "../../services/feedbackService";
import toast from "react-hot-toast";

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    feedbackService.getAll()
      .then((res) => setFeedbackList(res.data.feedback))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !message) {
      toast.error("Name and message are required");
      return;
    }
    setSubmitting(true);
    try {
      await feedbackService.create({ name, rating, message });
      toast.success("Thank you for your feedback!");
      setName(""); setMessage(""); setRating(5);
      feedbackService.getAll().then((res) => setFeedbackList(res.data.feedback));
    } catch (err) {
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
      <p className="mt-2 text-sm text-muted-foreground">We'd love to hear about your experience with LearnHub</p>

      <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div>
          <label className="text-sm font-medium text-foreground">Your Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Your name" />
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-foreground">Rating</label>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <button key={r} type="button" onClick={() => setRating(r)} className="p-0.5">
                <Star className={`h-6 w-6 ${r <= rating ? "fill-[color:var(--warning)] text-[color:var(--warning)]" : "text-muted"}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-foreground">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Your feedback..." />
        </div>
        <button type="submit" disabled={submitting} className="mt-4 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      {feedbackList.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground">What learners are saying</h2>
          {feedbackList.map((f) => (
            <div key={f._id} className="rounded-xl bg-muted/60 p-4">
              <p className="text-sm text-foreground">&ldquo;{f.message}&rdquo;</p>
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>&mdash; {f.name}</span>
                <span className="inline-flex items-center gap-0.5 text-[color:var(--warning)]">
                  {Array.from({ length: f.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-current" />
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
