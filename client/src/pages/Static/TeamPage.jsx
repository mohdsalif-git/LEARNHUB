import { team } from "../../lib/data";

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Our Team</h1>
      <p className="mt-2 text-sm text-muted-foreground">Meet the people behind LearnHub</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {team.map((m) => (
          <div key={m.name} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-primary-foreground" style={{ background: `linear-gradient(135deg, ${m.color}, var(--primary-glow))` }}>
                {m.initials}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{m.name}</h3>
                <p className="text-sm text-primary">{m.role}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{m.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
