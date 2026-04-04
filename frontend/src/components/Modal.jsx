import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, size = 'md', children }) => {
  if (!isOpen) return null;
  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white w-full ${sizeClass} p-6 rounded-lg shadow-lg`} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between mb-4">
          {title && <h3 className="text-lg font-bold uppercase tracking-tight">{title}</h3>}
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={18} /></button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
