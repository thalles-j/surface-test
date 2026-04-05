import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
  if (!isOpen) return null;
  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-zinc-900 w-full ${sizeClass} max-h-[90vh] flex flex-col rounded-xl shadow-2xl border border-zinc-800`} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between p-6 pb-4 border-b border-zinc-800 shrink-0">
          {title && <h3 className="text-lg font-bold uppercase tracking-tight text-white">{title}</h3>}
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-6 pt-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
