import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-[color:var(--success)]" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Payment Successful!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Thank you for supporting LearnHub. Your contribution helps us keep the platform free for everyone.</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
