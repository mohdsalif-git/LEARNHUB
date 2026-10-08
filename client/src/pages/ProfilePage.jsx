import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Lock,
  Coffee,
  Bookmark,
  Calendar,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { userService } from "../services/userService";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";

const DONATION_URL =
  import.meta.env.VITE_BUY_ME_A_COFFEE_URL || "https://buymeacoffee.com/learnhub";

export default function ProfilePage() {
  const { user, refreshUser, clearError } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [userStats, setUserStats] = useState({ savedCount: 0, viewedCount: 0 });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }

    userService
      .getDashboardStats()
      .then((res) => {
        if (res.data) setUserStats(res.data);
      })
      .catch(() => {});
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setUpdatingProfile(true);
    try {
      await userService.updateProfile({ name: name.trim() });
      toast.success("Profile details updated!");
      refreshUser?.();
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setUpdatingPassword(true);
    try {
      await userService.changePassword({ currentPassword, newPassword: password });
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header & Avatar */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-border bg-card shadow-sm">
        <Avatar
          className="h-20 w-20 text-xl font-bold"
          fallback={user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          size="xl"
        />
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-foreground">{user?.name || "User Profile"}</h1>
            <Badge variant="subtle" className="text-xs capitalize">
              {user?.role || "Member"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
            </span>
            <span className="flex items-center gap-1">
              <Bookmark className="h-3.5 w-3.5 text-primary" />
              {userStats.savedCount} saved resources
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Details Form */}
        <Card>
          <form onSubmit={handleUpdateProfile}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Account Details</CardTitle>
              </div>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  disabled={updatingProfile}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={true}
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be modified directly</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
                Back to Dashboard
              </Link>
              <Button type="submit" disabled={updatingProfile} size="sm">
                {updatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card>
          <form onSubmit={handleChangePassword}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-[color:var(--warning)]" />
                <CardTitle className="text-lg">Change Password</CardTitle>
              </div>
              <CardDescription>Update your account security password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? "Hide password" : "Show password"}
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-border pt-4">
              <Button type="submit" variant="outline" disabled={updatingPassword} size="sm">
                {updatingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Subtle Support Card */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="h-12 w-12 rounded-xl bg-[color:var(--warning)]/10 text-[color:var(--warning)] flex items-center justify-center shrink-0">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Enjoying LearnHub?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Help support the platform and keep free education accessible to all.
            </p>
          </div>
        </div>
        <a
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--warning)] px-4 py-2 text-xs font-semibold text-black hover:opacity-90 transition-opacity shrink-0 shadow-sm"
          aria-label="Buy us a coffee"
        >
          <Coffee className="h-4 w-4" />
          Buy us a coffee
        </a>
      </div>
    </div>
  );
}