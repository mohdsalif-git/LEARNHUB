import { useState } from "react";
import { Coffee, Heart, CreditCard, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { paymentService } from "../../services/paymentService";
import toast from "react-hot-toast";

const amounts = [100, 250, 500, 1000];

export default function SupportPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [showPublic, setShowPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  async function handleDonate(e) {
    e.preventDefault();
    if (!name || !email || !finalAmount || finalAmount < 1) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await paymentService.createOrder({
        amount: finalAmount,
        supporterName: name,
        supporterEmail: email,
        message,
        showPublicName: showPublic,
      });

      if (res.data.razorpayOrder && res.data.keyId) {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Razorpay payment gateway"));
            document.body.appendChild(script);
          });
        }

        const options = {
          key: res.data.keyId,
          amount: res.data.razorpayOrder.amount,
          currency: res.data.razorpayOrder.currency,
          name: "LearnHub",
          description: "Support LearnHub",
          order_id: res.data.razorpayOrder.id,
          handler: async function (response) {
            try {
              await paymentService.verify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: res.data.payment._id,
              });
              window.location.href = "/payment/success";
            } catch {
              window.location.href = "/payment/failed";
            }
          },
          prefill: { name, email },
          theme: { color: "#7c3aed" },
        };
        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", () => { window.location.href = "/payment/failed"; });
        rzp.open();
      } else {
        window.location.href = "/payment/success";
      }
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <span className="grid mx-auto h-16 w-16 place-items-center rounded-2xl bg-[color:var(--warning)]/20 text-[color:var(--warning)]">
          <Coffee className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Support LearnHub</h1>
        <p className="mt-2 text-sm text-muted-foreground">Help us keep this platform free and growing for everyone</p>
      </div>

      <form onSubmit={handleDonate} className="mt-8 rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-foreground">Choose an amount</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {amounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustomAmount(""); }}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                amount === a && !customAmount
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:border-primary/40"
              }`}
            >
              ₹{a}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium text-foreground">Or enter custom amount (₹)</label>
          <input
            type="number"
            min="1"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter amount"
          />
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Say something nice!" />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={showPublic} onChange={(e) => setShowPublic(e.target.checked)} className="rounded" />
            Show my name publicly as a supporter
          </label>
        </div>

        <button type="submit" disabled={loading || !finalAmount || finalAmount < 1} className="mt-6 w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform hover:-translate-y-0.5 disabled:opacity-50" style={{ background: "var(--gradient-hero)" }}>
          {loading ? "Processing..." : `Donate ₹${finalAmount || 0}`}
        </button>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Heart className="inline h-3 w-3" /> Payments are secure and processed via Razorpay
        </p>
      </form>
    </div>
  );
}
