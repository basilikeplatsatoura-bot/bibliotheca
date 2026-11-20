import React from 'react';
import type { ToastMessage } from '../types';
import { CheckIcon, CloseIcon } from './Icons';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
        >
          {toast.type === 'error' ? <CloseIcon size={15} /> : <CheckIcon size={15} />}
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );
};
