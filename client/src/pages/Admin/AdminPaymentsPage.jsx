import { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getPayments()
      .then((res) => setPayments(res.data.payments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    if (payments.length === 0) return;
    const headers = ["Name", "Email", "Amount", "Currency", "Status", "Date"];
    const rows = payments.map((p) => [p.supporterName, p.supporterEmail, p.amount, p.currency, p.status, new Date(p.createdAt).toLocaleDateString()]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments.csv";
    a.click();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Payment Records</h1>
        <button onClick={exportCSV} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          Export CSV
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No payment records yet</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{p.supporterName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.supporterEmail}</td>
                    <td className="px-4 py-3 text-foreground">₹{p.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "successful" ? "bg-[color:var(--success)]/10 text-[color:var(--success)]" :
                        p.status === "failed" ? "bg-destructive/10 text-destructive" :
                        "bg-[color:var(--warning)]/10 text-[color:var(--warning)]"
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
