import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { Alert } from "../../ui";

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  showToast: (message: string, severity?: Severity, duration?: number) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback(
    (message: string, severity: Severity = "info", duration = 3500) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, severity }]);
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <ToastContainer>
          {toasts.map((toast) => (
            <ToastItem key={toast.id}>
              <Alert
                severity={toast.severity}
                varient="filled"
                action={
                  <CloseBtn onClick={() => removeToast(toast.id)}>✕</CloseBtn>
                }
              >
                {toast.message}
              </Alert>
            </ToastItem>
          ))}
        </ToastContainer>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(110%); }
  to   { opacity: 1; transform: translateX(0); }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  pointer-events: none;
`;

const ToastItem = styled.div`
  pointer-events: all;
  animation: ${slideIn} 0.25s ease-out;
  min-width: 280px;
  max-width: 420px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  border-radius: 8px;
  overflow: hidden;
`;

const CloseBtn = styled.button`
  background: transparent;
  border: none;
  color: inherit;
  opacity: 0.8;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0 0 0 0.5rem;
  line-height: 1;
  &:hover { opacity: 1; }
`;
