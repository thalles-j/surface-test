import React from 'react';
import { X, CheckCircle2, XCircle, Info, AlertCircle, ShieldAlert, ServerCrash, UserX } from 'lucide-react';
import { useAdminTheme } from '../context/AdminThemeContext';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info', actionLabel, actionCallback }) => {
  if (!isOpen) return null;
  const { isAdminThemeActive, theme } = useAdminTheme();
  const isAdminLight = isAdminThemeActive && theme === 'light';
  const isAdminDark = isAdminThemeActive && theme === 'dark';

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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 transition-opacity ${isAdminDark ? 'bg-black/80 backdrop-blur-md' : 'bg-black/65 backdrop-blur-sm'}`}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-sm p-10 border shadow-2xl animate-in zoom-in-95 duration-200 ${
          isAdminThemeActive
            ? isAdminLight
              ? 'bg-white border-zinc-200 text-zinc-900'
              : 'bg-zinc-900 border-zinc-700 text-zinc-100'
            : 'bg-white border-gray-200'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 transition-colors ${
            isAdminThemeActive
              ? isAdminLight
                ? 'text-zinc-400 hover:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-100'
              : 'text-gray-300 hover:text-black'
          }`}
          aria-label="Fechar"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`mb-8 p-4 rounded-full ${isAdminThemeActive && !isAdminLight ? 'bg-zinc-800' : 'bg-gray-50'}`}>
            {icons[type] || icons.info}
          </div>

          <h3 className="text-2xl font-black uppercase tracking-tighter mb-3 leading-tight">
            {title}
          </h3>

          <p className={`text-sm font-medium leading-relaxed mb-6 ${isAdminThemeActive && !isAdminLight ? 'text-zinc-400' : 'text-gray-400'}`}>
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

            <button
              onClick={onClose}
              className={`w-full py-3 text-xs font-bold uppercase tracking-widest border rounded ${
                isAdminThemeActive
                  ? isAdminLight
                    ? 'border-zinc-200 text-zinc-700'
                    : 'border-zinc-700 text-zinc-300'
                  : 'border-gray-200'
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
