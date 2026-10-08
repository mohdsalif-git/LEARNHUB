import { useState, useEffect } from "react";
import { team as defaultTeam } from "../../lib/data";
import { contentService } from "../../services/contentService";
import { Skeleton } from "../../components/ui/Skeleton";
import { SectionHeader } from "../../components/common/SectionHeader";
import { Github, Twitter, Linkedin, Globe } from "lucide-react";

export default function TeamPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await contentService.getTeam();
        if (res.data?.members && res.data.members.length > 0) {
          setMembers(res.data.members);
        } else {
          setMembers(defaultTeam);
        }
      } catch {
        setMembers(defaultTeam);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 animate-fade-in">
      <SectionHeader
        eyebrow="PEOPLE BEHIND LEARNHUB"
        title="Our Team"
        description="Meet the creators, curators, and developers building LearnHub."
      />

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {members.map((m) => {
            const initials =
              m.initials ||
              m.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ||
              "LH";
            const color = m.color || "oklch(0.55 0.22 285)";

            return (
              <div
                key={m._id || m.name}
                className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="h-16 w-16 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div
                      className="grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-primary-foreground shadow-xs"
                      style={{
                        background: `linear-gradient(135deg, ${color}, var(--primary-glow))`,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{m.name}</h3>
                    <p className="text-sm font-medium text-primary">{m.role}</p>
                  </div>
                </div>
                {m.bio && (
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{m.bio}</p>
                )}
                {m.socialLinks && (
                  <div className="mt-4 flex items-center gap-3 text-muted-foreground">
                    {m.socialLinks.github && (
                      <a
                        href={m.socialLinks.github}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                        aria-label={`${m.name}'s GitHub`}
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {m.socialLinks.twitter && (
                      <a
                        href={m.socialLinks.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                        aria-label={`${m.name}'s Twitter`}
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                    {m.socialLinks.linkedin && (
                      <a
                        href={m.socialLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                        aria-label={`${m.name}'s LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {m.socialLinks.website && (
                      <a
                        href={m.socialLinks.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                        aria-label={`${m.name}'s Website`}
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
