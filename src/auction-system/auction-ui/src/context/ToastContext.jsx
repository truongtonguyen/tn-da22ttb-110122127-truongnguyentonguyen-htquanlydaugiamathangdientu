import React, { createContext, useContext } from "react";
import { useToast } from "../utils/useToast";
import { ToastContainer } from "../components/Toast";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const { toasts, toast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook để dùng trong bất kỳ component nào
export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext phải dùng trong ToastProvider");
  return ctx;
};