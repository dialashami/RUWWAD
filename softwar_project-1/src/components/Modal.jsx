// components/Modal.jsx
import React from 'react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      <div className="relative bg-card rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}