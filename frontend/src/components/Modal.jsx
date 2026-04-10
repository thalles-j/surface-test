import React from 'react';
import { X } from 'lucide-react';
import { useAdminTheme } from '../context/AdminThemeContext';

const Modal = ({ isOpen, onClose, title, size = 'md', variant = 'light', footer, children }) => {
  if (!isOpen) return null;

  const sizeClass =
    size === 'sm'
      ? 'max-w-md'
      : size === 'lg'
      ? 'max-w-4xl'
      : size === 'xl'
      ? 'max-w-5xl'
      : 'max-w-2xl';

  const { isAdminThemeActive, theme } = useAdminTheme();
  const useThemeVariant = isAdminThemeActive ? theme : variant;
  const isDark = useThemeVariant === 'dark';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 ${isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/60 backdrop-blur-sm'}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeClass} p-0 rounded-xl shadow-2xl max-h-[90vh] flex flex-col ${
          isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div
            className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'
            }`}
          >
            <h3 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : ''}`}>
              {title}
            </h3>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                  : 'text-gray-400 hover:text-black hover:bg-gray-100'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'admin-scroll' : ''}`}>{children}</div>

        {footer && (
          <div
            className={`flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t ${
              isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-gray-50 border-gray-100'
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
