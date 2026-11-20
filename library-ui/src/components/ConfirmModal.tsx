import React from 'react';
import { CloseIcon } from './Icons';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Διαγραφή',
  submitting = false,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button type="button" className="btn btn-icon" onClick={onCancel} aria-label="Κλείσιμο">
            <CloseIcon />
          </button>
        </div>

        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.94rem' }}>{message}</p>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={submitting}>
            Ακύρωση
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Διαγραφή...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
