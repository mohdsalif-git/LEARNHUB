import { useState, useCallback, createContext, useContext, useEffect } from "react";
import { cn } from "../../lib/utils";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext(null);

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

const toastColors = {
  success: "border-success bg-success/10 text-success",
  error: "border-destructive bg-destructive/10 text-destructive",
  warning: "border-warning bg-warning/10 text-warning",
  info: "border-info bg-info/10 text-info",
  default: "border-border bg-card text-foreground",
};

function Toast({ id, title, description, type = "default", onClose, duration = 5000 }) {
  const [visible, setVisible] = useState(true);
  const Icon = toastIcons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(id), 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose, type]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-4 shadow-[var(--shadow-elevated)] animate-slide-up",
        toastColors[type]
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-medium">{title}</h4>}
        {description && <p className="mt-0.5 text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose?.(id), 200);
        }}
        className="flex-shrink-0 rounded p-1 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((options) => {
    const id = Date.now().toString();
    const toast = { id, ...options };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, description) => addToast({ title, description, type: "success" }),
    error: (title, description) => addToast({ title, description, type: "error" }),
    warning: (title, description) => addToast({ title, description, type: "warning" }),
    info: (title, description) => addToast({ title, description, type: "info" }),
    default: (title, description) => addToast({ title, description, type: "default" }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        id="toast-portal"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm sm:max-w-md"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <Toast key={t.id} id={t.id} onClose={removeToast} {...t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}