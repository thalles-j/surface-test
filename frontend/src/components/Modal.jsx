import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, size = 'md', variant = 'light', children }) => {
  if (!isOpen) return null;
  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : size === 'xl' ? 'max-w-5xl' : 'max-w-2xl';
  const isDark = variant === 'dark';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} p-0 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'}`} role="dialog" aria-modal="true">
        {title && (
          <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${isDark ? 'bg-zinc-900/95 backdrop-blur border-zinc-800' : 'bg-white border-gray-100'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-zinc-400' : ''}`}>{title}</h3>
            <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? 'text-zinc-500 hover:text-white hover:bg-zinc-800' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}><X size={16} /></button>
          </div>
        )}
        <div className={title ? 'p-6' : 'p-6'}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
