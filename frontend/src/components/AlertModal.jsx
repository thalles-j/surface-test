import React from 'react';
import { X, CheckCircle2, XCircle, Info, AlertCircle, ShieldAlert, ServerCrash, UserX } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info', actionLabel, actionCallback }) => {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 size={48} className="text-green-500" />,
    error: <XCircle size={48} className="text-red-500" />,
    info: <Info size={48} className="text-black" />,
    warning: <AlertCircle size={48} className="text-yellow-500" />,
    access: <ShieldAlert size={48} className="text-red-600" />,
    server: <ServerCrash size={48} className="text-zinc-400" />,
    auth: <UserX size={48} className="text-zinc-800" />
  };

  const handleAction = () => {
    try {
      if (actionCallback) actionCallback();
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-white w-full max-w-sm p-10 border border-gray-200 shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-300 hover:text-black transition-colors" aria-label="Fechar">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-8 p-4 bg-gray-50 rounded-full">
            {icons[type] || icons.info}
          </div>

          <h3 className="text-2xl font-black uppercase tracking-tighter mb-3 leading-tight">
            {title}
          </h3>

          <p className="text-sm text-gray-400 font-medium leading-relaxed mb-6">
            {message}
          </p>

          <div className="w-full space-y-3">
            {actionLabel ? (
              <button onClick={handleAction} className="w-full bg-black text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg">
                {actionLabel}
              </button>
            ) : (
              <button onClick={onClose} className="w-full bg-black text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg">
                Entendido
              </button>
            )}

            <button onClick={onClose} className="w-full py-3 text-xs font-bold uppercase tracking-widest border border-gray-200 rounded">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
