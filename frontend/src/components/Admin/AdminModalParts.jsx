import React from 'react';

export function ModalSection({ title, children, className = '' }) {
  return (
    <div className={className}>
      {title && (
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-3">{title}</h4>
      )}
      {children}
    </div>
  );
}

export function ModalField({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <div className="text-sm text-zinc-200">{children}</div>
    </div>
  );
}

export function ModalFormGroup({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// Shared class constants for admin inputs
export const inputClass = 'w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 focus:bg-zinc-800 transition-colors';
export const selectClass = 'w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white outline-none focus:border-zinc-500 focus:bg-zinc-800 transition-colors appearance-none';
export const primaryBtnClass = 'px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors';
export const secondaryBtnClass = 'px-5 py-2.5 border border-zinc-700 text-zinc-400 text-sm font-bold rounded-lg hover:text-white hover:border-zinc-500 transition-colors';
