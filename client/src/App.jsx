import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { PageShell } from "./components/layout/PageShell";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import AdminLoginPage from "./pages/Admin/AdminLoginPage";
import AdminSetupPage from "./pages/Admin/AdminSetupPage";
import SearchPage from "./pages/Resources/SearchPage";
import ResourceDetailPage from "./pages/Resources/ResourceDetailPage";
import CategoriesPage from "./pages/Categories/CategoriesPage";
import CategoryDetailPage from "./pages/Categories/CategoryDetailPage";
import BookmarksPage from "./pages/Bookmarks/BookmarksPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import SharePage from "./pages/Resources/SharePage";
import SupportPage from "./pages/Static/SupportPage";
import DonatePage from "./pages/Static/DonatePage";
import PaymentSuccessPage from "./pages/Payments/PaymentSuccessPage";
import PaymentFailedPage from "./pages/Payments/PaymentFailedPage";
import FeedbackPage from "./pages/Static/FeedbackPage";
import ContactPage from "./pages/Static/ContactPage";
import AboutPage from "./pages/Static/AboutPage";
import TeamPage from "./pages/Static/TeamPage";
import PrivacyPage from "./pages/Static/PrivacyPage";
import TermsPage from "./pages/Static/TermsPage";
import RefundPolicyPage from "./pages/Static/RefundPolicyPage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminCategoriesPage from "./pages/Admin/AdminCategoriesPage";
import AdminPaymentsPage from "./pages/Admin/AdminPaymentsPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<PageShell><HomePage /></PageShell>} />
        <Route path="/about" element={<PageShell><AboutPage /></PageShell>} />
        <Route path="/team" element={<PageShell><TeamPage /></PageShell>} />
        <Route path="/contact" element={<PageShell><ContactPage /></PageShell>} />
        <Route path="/privacy" element={<PageShell><PrivacyPage /></PageShell>} />
        <Route path="/terms" element={<PageShell><TermsPage /></PageShell>} />
        <Route path="/refund-policy" element={<PageShell><RefundPolicyPage /></PageShell>} />
        <Route path="/categories" element={<PageShell><CategoriesPage /></PageShell>} />
        <Route path="/categories/:slug" element={<PageShell><CategoryDetailPage /></PageShell>} />
        <Route path="/search" element={<PageShell><SearchPage /></PageShell>} />
        <Route path="/resources/:id" element={<PageShell><ResourceDetailPage /></PageShell>} />
        <Route path="/share" element={<PageShell><SharePage /></PageShell>} />
        <Route path="/feedback" element={<PageShell><FeedbackPage /></PageShell>} />
        <Route path="/support" element={<PageShell><SupportPage /></PageShell>} />
        <Route path="/donate" element={<PageShell><DonatePage /></PageShell>} />
        <Route path="/payment/success" element={<PageShell><PaymentSuccessPage /></PageShell>} />
        <Route path="/payment/failed" element={<PageShell><PaymentFailedPage /></PageShell>} />

        <Route path="/login" element={<GuestRoute><PageShell><LoginPage /></PageShell></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><PageShell><RegisterPage /></PageShell></GuestRoute>} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        <Route path="/bookmarks" element={<ProtectedRoute><PageShell><BookmarksPage /></PageShell></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageShell><DashboardPage /></PageShell></ProtectedRoute>} />

        <Route path="/admin/login" element={<GuestRoute><PageShell><AdminLoginPage /></PageShell></GuestRoute>} />
        <Route path="/admin/setup" element={<ProtectedRoute><PageShell><AdminSetupPage /></PageShell></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><PageShell><AdminDashboardPage /></PageShell></AdminRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute><PageShell><AdminDashboardPage /></PageShell></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><PageShell><AdminCategoriesPage /></PageShell></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><PageShell><AdminPaymentsPage /></PageShell></AdminRoute>} />

        <Route path="*" element={<PageShell><NotFoundPage /></PageShell>} />
      </Routes>
    </>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
