import React from 'react';
import { X, CheckCircle2, XCircle, Info, AlertCircle, ShieldAlert, ServerCrash, UserX } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info', actionLabel, actionCallback }) => {
  if (!isOpen) return null;

  const iconColors = {
    success: 'var(--app-success)',
    error: 'var(--app-danger)',
    info: 'var(--app-text)',
    warning: 'var(--app-text-secondary)',
    access: 'var(--app-danger)',
    server: 'var(--app-muted-text)',
    auth: 'var(--app-text)',
  };

  const icons = {
    success: <CheckCircle2 size={48} style={{ color: iconColors.success }} />,
    error: <XCircle size={48} style={{ color: iconColors.error }} />,
    info: <Info size={48} style={{ color: iconColors.info }} />,
    warning: <AlertCircle size={48} style={{ color: iconColors.warning }} />,
    access: <ShieldAlert size={48} style={{ color: iconColors.access }} />,
    server: <ServerCrash size={48} style={{ color: iconColors.server }} />,
    auth: <UserX size={48} style={{ color: iconColors.auth }} />
  };

  const handleAction = () => {
    try {
      if (actionCallback) actionCallback();
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-md transition-opacity"
        style={{ background: 'var(--app-overlay-strong)' }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-sm p-10 shadow-2xl animate-in zoom-in-95 duration-200 admin-panel"
        style={{ color: "var(--app-text)", boxShadow: "var(--ui-shadow-md)" }}
      >
        <button onClick={onClose} className="admin-btn-ghost absolute top-5 right-5" style={{ color: "var(--app-muted-text)" }} aria-label="Fechar">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-8 p-4 rounded-full" style={{ background: "var(--app-surface-alt)" }}>
            {icons[type] || icons.info}
          </div>

          <h3 className="text-2xl font-black uppercase tracking-tighter mb-3 leading-tight">
            {title}
          </h3>

          <p className="text-sm font-medium leading-relaxed mb-6" style={{ color: "var(--app-muted-text)" }}>
            {message}
          </p>

          <div className="w-full space-y-3">
            {actionLabel ? (
              <button onClick={handleAction} className="admin-btn-primary w-full py-3 text-xs font-black uppercase tracking-widest active:scale-[0.98]">
                {actionLabel}
              </button>
            ) : (
              <button onClick={onClose} className="admin-btn-primary w-full py-3 text-xs font-black uppercase tracking-widest active:scale-[0.98]">
                Entendido
              </button>
            )}

            <button onClick={onClose} className="admin-btn-secondary w-full py-3 text-xs font-bold uppercase tracking-widest">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
