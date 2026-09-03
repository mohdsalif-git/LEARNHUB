import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <XCircle className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Payment Failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong with your payment. Please try again.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/support" className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Try Again
          </Link>
          <Link to="/" className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}