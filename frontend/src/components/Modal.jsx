import React from 'react';
import { X } from 'lucide-react';
import { useAdminTheme } from '../context/AdminThemeContext';

const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
  if (!isOpen) return null;
  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl';
  const { isAdminThemeActive, isLight } = useAdminTheme();
  const isAdminLight = isAdminThemeActive && isLight;
  const isAdminDark = isAdminThemeActive && !isLight;

  const panelClasses = isAdminThemeActive
    ? isAdminLight
      ? 'bg-white text-zinc-900 border border-zinc-200 shadow-[0_20px_60px_rgba(15,23,42,0.12)]'
      : 'bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-[0_20px_60px_rgba(0,0,0,0.45)]'
    : 'bg-white';

  const closeClasses = isAdminThemeActive
    ? isAdminLight
      ? 'text-zinc-500 hover:text-zinc-900'
      : 'text-zinc-400 hover:text-zinc-100'
    : 'text-gray-400 hover:text-black';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 ${isAdminDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/50'}`}
        onClick={onClose}
      />
      <div className={`relative w-full ${sizeClass} p-6 rounded-lg ${panelClasses}`} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between mb-4">
          {title && <h3 className="text-lg font-bold uppercase tracking-tight">{title}</h3>}
          <button onClick={onClose} className={closeClasses}><X size={18} /></button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
