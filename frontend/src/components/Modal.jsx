import React from 'react';
import { X } from 'lucide-react';
import useTheme from '../hooks/useTheme';

const Modal = ({ isOpen, onClose, title, size = 'md', variant = 'light', footer, children }) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const sizeClass =
    size === 'sm'
      ? 'max-w-md'
      : size === 'lg'
        ? 'max-w-4xl'
        : size === 'xl'
          ? 'max-w-5xl'
          : 'max-w-2xl';

  const useDarkVariant = variant === 'dark' || isDark;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: 'var(--app-modal-overlay)' }}
        onClick={onClose}
      />

      <div
        className={`relative w-full ${sizeClass} p-0 max-h-[90vh] flex flex-col admin-panel`}
        style={{
          boxShadow: 'var(--ui-shadow-md)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div
            className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b"
            style={{
              borderColor: 'var(--app-border)',
              background: 'var(--app-surface-alt)',
            }}
          >
            <h3
              className="admin-kpi-label"
              style={{ color: 'var(--app-text-secondary)' }}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className="admin-btn-ghost p-1.5"
              style={{ color: 'var(--app-muted-text)' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto p-6 ${useDarkVariant ? 'admin-scroll' : ''}`}>
          {children}
        </div>

        {footer && (
          <div
            className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t"
            style={{
              borderColor: 'var(--app-border)',
              background: 'var(--app-surface-alt)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
