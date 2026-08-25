import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";

export default function AdminSetupPage() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleClaim() {
    setLoading(true);
    try {
      await adminService.claimAdmin();
      toast.success("Admin role claimed! Please login again.");
      navigate("/admin/login");
    } catch (err) {
      toast.error(err.message || "Failed to claim admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold text-foreground">Admin Setup</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Claim the first admin role for your account ({user?.email}). This is only available when no admin exists.
          </p>
          <button
            onClick={handleClaim}
            disabled={loading}
            className="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Claiming..." : "Claim Admin Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
