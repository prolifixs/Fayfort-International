import { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  return <div className="relative">{children}</div>;
}

export function DropdownMenuTrigger({ children, disabled }: { children: React.ReactNode, disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <button 
      onClick={() => setIsOpen(!isOpen)} 
      disabled={disabled}
      className="p-2 hover:bg-gray-100 rounded-full"
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, align = 'end' }: { children: React.ReactNode, align?: 'start' | 'end' }) {
  return (
    <div className={`absolute ${align === 'end' ? 'right-0' : 'left-0'} mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50`}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      {children}
    </button>
  );
} 