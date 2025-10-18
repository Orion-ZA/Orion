import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import './Toast.css';

const ToastCtx = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    const toast = { 
      id, 
      message, 
      type: opts.type || 'info', 
      timeout: opts.timeout ?? 2500,
      position: opts.position || 'top-right',
      targetElement: opts.targetElement || null
    };
    setToasts((ts) => [...ts, toast]);
    // auto-dismiss
    setTimeout(() => remove(id), toast.timeout);
    return id;
  }, [remove]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {/* Top-right positioned toasts */}
      <div className="toast-container toast-top-right" role="status" aria-live="polite" aria-atomic="true">
        {toasts.filter(t => t.position === 'top-right').map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
      {/* Share button positioned toasts */}
      <div className="toast-container toast-share-button" role="status" aria-live="polite" aria-atomic="true">
        {toasts.filter(t => t.position === 'share-button').map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
