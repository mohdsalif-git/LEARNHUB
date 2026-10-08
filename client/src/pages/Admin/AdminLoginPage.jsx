import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res?.data?.user?.role === "admin") {
        toast.success("Welcome Admin!");
        navigate("/admin/dashboard", { replace: true });
      } else {
        toast.error("You are not an admin");
      }
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Access the admin dashboard</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="text-sm font-medium text-foreground">Email</label>
              <input id="admin-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="admin@learnhub.com" required />
            </div>
            <div>
              <label htmlFor="admin-password" className="text-sm font-medium text-foreground">Password</label>
              <input id="admin-password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Admin password" required />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in as Admin"}
            </button>
          </form>

          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Demo credentials:</p>
            <p className="text-xs text-muted-foreground">admin@learnhub.com / Admin@12345</p>
          </div>
        </div>
      </div>
    </div>
  );
}
