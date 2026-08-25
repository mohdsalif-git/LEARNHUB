import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { resourceService } from "../../services/resourceService";
import { ResourceCard } from "../resources/ResourceCard";
import { SectionHeader } from "../common/SectionHeader";

export function CommunityPicks({ limit = 6 }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resourceService
      .getCommunity({ status: "approved" })
      .then((res) => setResources(res.data.resources.slice(0, limit)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading || resources.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeader
        eyebrow="Community"
        title="Community picks"
        description="Resources submitted and approved by our community."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <ResourceCard key={r._id} resource={r} />
        ))}
      </div>
    </section>
  );
}
