import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Alert, AlertDescription } from "../ui/Alert";
import { toast } from "react-hot-toast";

function GoogleIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  mode = "login",
  showDivider = true,
  onSuccess,
  onError,
  className = "",
}) {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMountedRef = useRef(true);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleCredentialSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      const msg = "No credential received from Google";
      setAuthError(msg);
      toast.error(msg);
      onError?.(new Error(msg));
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success(
        mode === "signup"
          ? "Welcome to LearnHub! Account created."
          : "Welcome back!"
      );

      const dest =
        location.state?.dest || location.state?.from?.pathname || "/dashboard";
      navigate(dest, { replace: true });
      onSuccess?.();
    } catch (err) {
      const message = err.message || "Google sign-in failed. Please try again.";
      if (isMountedRef.current) {
        setAuthError(message);
      }
      onError?.(err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCredentialError = () => {
    const msg = "Google sign-in was cancelled or encountered an error.";
    if (isMountedRef.current) {
      setAuthError(msg);
    }
    toast.error(msg);
    onError?.(new Error(msg));
  };

  const handleMissingClientId = () => {
    const msg =
      "Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.";
    toast.error(msg);
    setAuthError(msg);
  };

  return (
    <div className={`w-full ${className}`}>
      {showDivider && (
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          loading={true}
          disabled
        >
          Verifying with Google...
        </Button>
      ) : !googleClientId ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full flex items-center justify-center gap-2 hover:bg-accent/50"
          onClick={handleMissingClientId}
        >
          <GoogleIcon className="h-4 w-4" />
          <span>
            {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
          </span>
        </Button>
      ) : (
        <div className="w-full flex justify-center [&>div]:!w-full [&_iframe]:!w-full">
          <GoogleLogin
            onSuccess={handleCredentialSuccess}
            onError={handleCredentialError}
            text={mode === "signup" ? "signup_with" : "signin_with"}
            shape="rectangular"
            theme="outline"
            size="large"
            width="100%"
          />
        </div>
      )}

      {authError && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription className="text-xs">{authError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default GoogleAuthButton;
