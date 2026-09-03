import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { useAuth as useAuthHook } from "./context/AuthContext";
import { PageShell } from "./components/layout/PageShell";
import { AuthProvider } from "./context/AuthContext";
import { AdminLayout } from "./components/layout/AdminLayout";
import { Skeleton } from "./components/ui/Skeleton";

// Lazy load pages for code splitting
const HomePage = lazy(() => import("./pages/HomePage"));
const AuthPage = lazy(() => import("./pages/Auth/AuthPage"));
const AdminLoginPage = lazy(() => import("./pages/Admin/AdminLoginPage"));
const AdminSetupPage = lazy(() => import("./pages/Admin/AdminSetupPage"));
const SearchPage = lazy(() => import("./pages/Resources/SearchPage"));
const ResourceDetailPage = lazy(() => import("./pages/Resources/ResourceDetailPage"));
const CategoriesPage = lazy(() => import("./pages/Categories/CategoriesPage"));
const CategoryDetailPage = lazy(() => import("./pages/Categories/CategoryDetailPage"));
const BookmarksPage = lazy(() => import("./pages/Bookmarks/BookmarksPage"));
const DashboardPage = lazy(() => import("./pages/Dashboard/DashboardPage"));
const SharePage = lazy(() => import("./pages/Resources/SharePage"));
const SupportPage = lazy(() => import("./pages/Static/SupportPage"));
const DonatePage = lazy(() => import("./pages/Static/DonatePage"));
const PaymentSuccessPage = lazy(() => import("./pages/Payments/PaymentSuccessPage"));
const PaymentFailedPage = lazy(() => import("./pages/Payments/PaymentFailedPage"));
const FeedbackPage = lazy(() => import("./pages/Static/FeedbackPage"));
const ContactPage = lazy(() => import("./pages/Static/ContactPage"));
const AboutPage = lazy(() => import("./pages/Static/AboutPage"));
const TeamPage = lazy(() => import("./pages/Static/TeamPage"));
const PrivacyPage = lazy(() => import("./pages/Static/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/Static/TermsPage"));
const RefundPolicyPage = lazy(() => import("./pages/Static/RefundPolicyPage"));
const AdminDashboardPage = lazy(() => import("./pages/Admin/AdminDashboardPage"));
const AdminCategoriesPage = lazy(() => import("./pages/Admin/AdminCategoriesPage"));
const AdminPaymentsPage = lazy(() => import("./pages/Admin/AdminPaymentsPage"));
const AdminMembersPage = lazy(() => import("./pages/Admin/AdminMembersPage"));
const AdminFeedbackPage = lazy(() => import("./pages/Admin/AdminFeedbackPage"));
const AdminResourcesPage = lazy(() => import("./pages/Admin/AdminResourcesPage"));

function LoadingFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    </div>
  );
}

function PageWithSuspense({ children }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthHook();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuthHook();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading, isAdmin } = useAuthHook();
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PageShell><PageWithSuspense><HomePage /></PageWithSuspense></PageShell>} />
      <Route path="/about" element={<PageShell><PageWithSuspense><AboutPage /></PageWithSuspense></PageShell>} />
      <Route path="/team" element={<PageShell><PageWithSuspense><TeamPage /></PageWithSuspense></PageShell>} />
      <Route path="/contact" element={<PageShell><PageWithSuspense><ContactPage /></PageWithSuspense></PageShell>} />
      <Route path="/privacy" element={<PageShell><PageWithSuspense><PrivacyPage /></PageWithSuspense></PageShell>} />
      <Route path="/terms" element={<PageShell><PageWithSuspense><TermsPage /></PageWithSuspense></PageShell>} />
      <Route path="/refund-policy" element={<PageShell><PageWithSuspense><RefundPolicyPage /></PageWithSuspense></PageShell>} />
      <Route path="/categories" element={<PageShell><PageWithSuspense><CategoriesPage /></PageWithSuspense></PageShell>} />
      <Route path="/categories/:slug" element={<PageShell><PageWithSuspense><CategoryDetailPage /></PageWithSuspense></PageShell>} />
      <Route path="/search" element={<PageShell><PageWithSuspense><SearchPage /></PageWithSuspense></PageShell>} />
      <Route path="/resources/:id" element={<PageShell><PageWithSuspense><ResourceDetailPage /></PageWithSuspense></PageShell>} />
      <Route path="/share" element={<PageShell><PageWithSuspense><SharePage /></PageWithSuspense></PageShell>} />
      <Route path="/feedback" element={<PageShell><PageWithSuspense><FeedbackPage /></PageWithSuspense></PageShell>} />
      <Route path="/support" element={<PageShell><PageWithSuspense><SupportPage /></PageWithSuspense></PageShell>} />
      <Route path="/donate" element={<PageShell><PageWithSuspense><DonatePage /></PageWithSuspense></PageShell>} />
      <Route path="/payment/success" element={<PageShell><PageWithSuspense><PaymentSuccessPage /></PageWithSuspense></PageShell>} />
      <Route path="/payment/failed" element={<PageShell><PageWithSuspense><PaymentFailedPage /></PageWithSuspense></PageShell>} />

      <Route path="/login" element={<GuestRoute><PageShell><PageWithSuspense><AuthPage /></PageWithSuspense></PageShell></GuestRoute>} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />

      <Route path="/bookmarks" element={<ProtectedRoute><PageShell><PageWithSuspense><BookmarksPage /></PageWithSuspense></PageShell></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><PageShell><PageWithSuspense><DashboardPage /></PageWithSuspense></PageShell></ProtectedRoute>} />

      {/* Admin public / setup routes */}
      <Route path="/admin/login" element={<GuestRoute><PageShell><PageWithSuspense><AdminLoginPage /></PageWithSuspense></PageShell></GuestRoute>} />
      <Route path="/admin/setup" element={<ProtectedRoute><PageShell><PageWithSuspense><AdminSetupPage /></PageWithSuspense></PageShell></ProtectedRoute>} />

      {/* Admin protected management routes with dedicated layout */}
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<PageWithSuspense><AdminDashboardPage /></PageWithSuspense>} />
        <Route path="/admin/members" element={<PageWithSuspense><AdminMembersPage /></PageWithSuspense>} />
        <Route path="/admin/resources" element={<PageWithSuspense><AdminResourcesPage /></PageWithSuspense>} />
        <Route path="/admin/categories" element={<PageWithSuspense><AdminCategoriesPage /></PageWithSuspense>} />
        <Route path="/admin/feedback" element={<PageWithSuspense><AdminFeedbackPage /></PageWithSuspense>} />
        <Route path="/admin/payments" element={<PageWithSuspense><AdminPaymentsPage /></PageWithSuspense>} />
      </Route>

      <Route path="*" element={<PageShell><NotFoundPage /></PageShell>} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <AppRoutes />
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