import React from 'react';

export function ModalSection({ title, children, className = '' }) {
  return (
    <div className={className}>
      {title && (
        <h4 className="admin-kpi-label mb-3">{title}</h4>
      )}
      {children}
    </div>
  );
}

export function ModalField({ label, children }) {
  return (
    <div>
      <p className="admin-kpi-label mb-1">{label}</p>
      <div className="text-sm" style={{ color: 'var(--app-text)' }}>{children}</div>
    </div>
  );
}

export function ModalFormGroup({ label, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="admin-kpi-label block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// Shared class constants for admin inputs
export const inputClass = 'admin-input text-sm';
export const selectClass = 'admin-select text-sm appearance-none';
export const primaryBtnClass = 'admin-btn-primary px-5 py-2.5 text-sm';
export const secondaryBtnClass = 'admin-btn-secondary px-5 py-2.5 text-sm';
