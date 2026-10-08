import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../components/ui/Card";
import { toast } from "react-hot-toast";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.focus();
    }
  }, [isLogin]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isLogin) {
      if (!email || !password) {
        toast.error("All fields are required");
        return;
      }
      setLoading(true);
      try {
        await login(email, password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } catch (err) {
        toast.error(err.message || "Login failed");
      } finally {
        setLoading(false);
      }
    } else {
      if (!name || !email || !password) {
        toast.error("All fields are required");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      setLoading(true);
      try {
        await register(name, email, password);
        toast.success("Account created!");
        navigate("/dashboard");
      } catch (err) {
        toast.error(err.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    }
  }

  function toggleMode() {
    setIsLogin((prev) => !prev);
    setEmail("");
    setPassword("");
    setName("");
    setShowPassword(false);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-up">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your LearnHub account"
                : "Join LearnHub and start learning for free"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
              {!isLogin && (
                <Input
                  label="Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  disabled={loading}
                />
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={loading}
                leftIcon={<Mail className="h-4 w-4 text-muted-foreground" />}
              />

              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "Your password" : "Min 6 characters"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                minLength={isLogin ? undefined : 6}
                disabled={loading}
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
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  isLogin ? "Sign in" : "Create account"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-primary hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
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
    </div>
  );
}