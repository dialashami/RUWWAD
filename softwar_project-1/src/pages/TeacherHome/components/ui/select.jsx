import React, { useState } from 'react';

export const Select = ({ value, onValueChange, children, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { value, onValueChange, isOpen, setIsOpen })
      )}
    </div>
  );
};

export const SelectTrigger = ({ children, isOpen, setIsOpen, ...props }) => {
  return (
    <button 
      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:border-gray-400"
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
    </button>
  );
};

export const SelectValue = ({ placeholder, value, ...props }) => {
  return (
    <span {...props}>
      {value || placeholder}
    </span>
  );
};

export const SelectContent = ({ children, isOpen, ...props }) => {
  if (!isOpen) return null;
  
  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border border-gray-300 bg-white shadow-lg" {...props}>
      {children}
    </div>
  );
};

export const SelectItem = ({ children, value, onValueChange, setIsOpen, ...props }) => {
  return (
    <div 
      className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
      onClick={() => {
        onValueChange?.(value);
        setIsOpen?.(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
};