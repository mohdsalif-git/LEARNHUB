import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
      <p className="mt-2 text-sm text-muted-foreground">Have questions or feedback? We'd love to hear from you.</p>
      <div className="mt-8 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)] text-center">
        <Mail className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">Get in touch</h2>
        <p className="mt-2 text-sm text-muted-foreground">Email us at</p>
        <a href="mailto:hello@learnhub.dev" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
          hello@learnhub.dev
        </a>
      </div>
    </div>
  );
}
