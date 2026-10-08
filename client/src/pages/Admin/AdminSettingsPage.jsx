import { useState, useEffect } from "react";
import {
  Globe,
  Mail,
  Lock,
  Save,
  Loader2,
  Coffee,
  Share2,
  Sparkles,
  Shield,
  FileText,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import { Switch } from "../../components/ui/Switch";
import { Skeleton } from "../../components/ui/Skeleton";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const { user: authUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Platform General Settings matching Task 1 requirements
  const [settings, setSettings] = useState({
    platformName: "LearnHub",
    platformDescription: "",
    logo: "",
    heroTitle: "Find the Best Free Learning Resources in One Place",
    heroSubtitle: "Search free videos, tutorials and courses from YouTube, Edureka, Google, freeCodeCamp and more — organized for faster learning.",
    footerText: "LearnHub is a community-driven curated directory of high quality free learning resources.",
    contactEmail: "contact@learnhub.dev",
    supportEmail: "support@learnhub.dev",
    buyMeACoffeeUrl: "https://buymeacoffee.com/learnhub",
    allowUserSubmissions: true,
    requireApprovalForSubmissions: true,
    socialLinks: {
      github: "https://github.com",
      twitter: "https://twitter.com",
      discord: "https://discord.com",
      linkedin: "https://linkedin.com",
      youtube: "https://youtube.com",
    },
  });

  // Profile Settings
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });

  // Security / Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await adminService.getSettings();
        if (res.data?.settings) {
          const s = res.data.settings;
          setSettings({
            platformName: s.platformName || "LearnHub",
            platformDescription: s.platformDescription || "",
            logo: s.logo || "",
            heroTitle: s.heroTitle || "Find the Best Free Learning Resources in One Place",
            heroSubtitle: s.heroSubtitle || "Search free videos, tutorials and courses from YouTube, Edureka, Google, freeCodeCamp and more — organized for faster learning.",
            footerText: s.footerText || "LearnHub is a community-driven curated directory of high quality free learning resources.",
            contactEmail: s.contactEmail || "contact@learnhub.dev",
            supportEmail: s.supportEmail || "support@learnhub.dev",
            buyMeACoffeeUrl: s.buyMeACoffeeUrl || "",
            allowUserSubmissions: s.allowUserSubmissions ?? true,
            requireApprovalForSubmissions: s.requireApprovalForSubmissions ?? true,
            socialLinks: {
              github: s.socialLinks?.github || "",
              twitter: s.socialLinks?.twitter || "",
              discord: s.socialLinks?.discord || "",
              linkedin: s.socialLinks?.linkedin || "",
              youtube: s.socialLinks?.youtube || "",
            },
          });
        }
      } catch {
        toast.error("Failed to load platform settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();

    if (authUser) {
      setProfileForm({
        name: authUser.name || "",
        email: authUser.email || "",
      });
    }
  }, [authUser]);

  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await adminService.updateSettings(settings);
      toast.success(res.data?.message || "Platform settings saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSavingProfile(true);
    try {
      await adminService.updateAdminProfile(profileForm);
      toast.success("Admin profile updated!");
      refreshUser?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    try {
      await adminService.changeAdminPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin &amp; Site Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage site branding, hero text, footer text, contact details, social links, and security
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Site & Platform Settings */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <form onSubmit={handleSavePlatformSettings}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Site Settings &amp; Branding</CardTitle>
                </div>
                <CardDescription>
                  Configure site name, logo, hero banner text, footer text, and contact information
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Basic Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Site Name
                    </label>
                    <Input
                      value={settings.platformName}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                      placeholder="e.g. LearnHub"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Logo URL (optional)
                    </label>
                    <Input
                      value={settings.logo}
                      onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                      placeholder="https://... or empty for gradient logo"
                    />
                  </div>
                </div>

                {/* Hero Section Texts */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Sparkles className="h-4 w-4" /> Hero Banner Text
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Hero Title Heading
                    </label>
                    <Input
                      value={settings.heroTitle}
                      onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                      placeholder="e.g. Find the Best Free Learning Resources in One Place"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Hero Subtitle / Description
                    </label>
                    <Textarea
                      value={settings.heroSubtitle}
                      onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                      rows={2}
                      placeholder="Hero descriptive paragraph..."
                    />
                  </div>
                </div>

                {/* Footer and Description */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <FileText className="h-4 w-4" /> Footer &amp; About Text
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Footer Text / Mission Statement
                    </label>
                    <Textarea
                      value={settings.footerText}
                      onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                      rows={2}
                      placeholder="Shown in the homepage footer..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Site Description / Tagline
                    </label>
                    <Input
                      value={settings.platformDescription}
                      onChange={(e) => setSettings({ ...settings, platformDescription: e.target.value })}
                      placeholder="One Search. All Knowledge. Zero Cost."
                    />
                  </div>
                </div>

                {/* Emails & Support */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Contact Email
                    </label>
                    <Input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      placeholder="contact@learnhub.dev"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Support Email
                    </label>
                    <Input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                      placeholder="support@learnhub.dev"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      <span className="flex items-center gap-1.5">
                        <Coffee className="h-3.5 w-3.5 text-[color:var(--warning)]" />
                        Buy Me a Coffee URL
                      </span>
                    </label>
                    <Input
                      value={settings.buyMeACoffeeUrl}
                      onChange={(e) => setSettings({ ...settings, buyMeACoffeeUrl: e.target.value })}
                      placeholder="https://buymeacoffee.com/..."
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Share2 className="h-4 w-4" /> Social Media Links
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        GitHub
                      </label>
                      <Input
                        value={settings.socialLinks.github}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            socialLinks: { ...settings.socialLinks, github: e.target.value },
                          })
                        }
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Twitter / X
                      </label>
                      <Input
                        value={settings.socialLinks.twitter}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            socialLinks: { ...settings.socialLinks, twitter: e.target.value },
                          })
                        }
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Discord
                      </label>
                      <Input
                        value={settings.socialLinks.discord}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            socialLinks: { ...settings.socialLinks, discord: e.target.value },
                          })
                        }
                        placeholder="https://discord.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        LinkedIn
                      </label>
                      <Input
                        value={settings.socialLinks.linkedin}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            socialLinks: { ...settings.socialLinks, linkedin: e.target.value },
                          })
                        }
                        placeholder="https://linkedin.com/..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        YouTube
                      </label>
                      <Input
                        value={settings.socialLinks.youtube}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            socialLinks: { ...settings.socialLinks, youtube: e.target.value },
                          })
                        }
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Submission Policies */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Allow User Submissions</p>
                      <p className="text-xs text-muted-foreground">
                        Permit logged-in members to submit learning resources
                      </p>
                    </div>
                    <Switch
                      checked={settings.allowUserSubmissions}
                      onCheckedChange={(val) =>
                        setSettings({ ...settings, allowUserSubmissions: val })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Require Admin Approval</p>
                      <p className="text-xs text-muted-foreground">
                        User-submitted resources must be reviewed before going live
                      </p>
                    </div>
                    <Switch
                      checked={settings.requireApprovalForSubmissions}
                      onCheckedChange={(val) =>
                        setSettings({ ...settings, requireApprovalForSubmissions: val })
                      }
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border pt-4">
                <Button type="submit" disabled={savingSettings} className="gap-2">
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Site Settings
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Profile Settings */}
        <Card>
          <form onSubmit={handleSaveProfile}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Admin Profile</CardTitle>
              </div>
              <CardDescription>Update your admin name and email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button type="submit" disabled={savingProfile} className="gap-2">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Update Profile
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security / Password */}
        <Card>
          <form onSubmit={handleChangePassword}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Change Password</CardTitle>
              </div>
              <CardDescription>Ensure your admin account is secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button type="submit" disabled={savingPassword} className="gap-2">
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Change Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
