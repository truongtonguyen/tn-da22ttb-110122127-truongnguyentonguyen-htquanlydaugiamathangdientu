import { useState, useCallback } from "react";

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, leaving: false }]);

    // Bắt đầu animation leave trước khi xóa
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => t.id === id ? { ...t, leaving: true } : t)
      );
    }, duration);

    // Xóa khỏi DOM sau khi animation xong
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration + 300);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);

  // Shorthand helpers
  const toast = {
    success: (msg, duration)  => addToast(msg, "success", duration),
    error:   (msg, duration)  => addToast(msg, "error",   duration),
    warning: (msg, duration)  => addToast(msg, "warning", duration),
    info:    (msg, duration)  => addToast(msg, "info",    duration),
  };

  return { toasts, toast, removeToast };
};