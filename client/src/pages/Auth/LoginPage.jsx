import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/Card";
import { toast } from "react-hot-toast";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";
import { Logo } from "../../components/common/Logo";
import { AuthLayout } from "../../components/auth/AuthLayout";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
    } catch {
      // Error notification is handled by AuthContext
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <AuthLayout>
      <div className="animate-fade-up">
        <Card className="rounded-3xl p-0 sm:p-0">
          <CardHeader className="text-center px-6 pt-6 sm:px-8 sm:pt-8">
            <div className="flex justify-center pb-2">
              <Logo imgClassName="h-12 w-auto" to={null} showMarkOnSmall={false} />
            </div>
            <CardTitle className="text-2xl">
              Welcome back
            </CardTitle>
            <CardDescription>
              Sign in to your Wingly account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="login-email"
                name="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                leftIcon={<Mail className="h-4 w-4 text-muted-foreground" />}
              />

              <Input
                id="login-password"
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
                minLength={6}
                leftIcon={<Lock className="h-4 w-4 text-muted-foreground" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
                size="lg"
              >
                Sign in
              </Button>
            </form>

            <GoogleAuthButton mode="login" />
          </CardContent>

          <CardFooter className="flex flex-col gap-3 px-6 pb-6 sm:px-8 sm:pb-8">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
            <Link
              to="/"
              className="text-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </AuthLayout>
  );
}