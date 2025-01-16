interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/30" onClick={() => onOpenChange?.(false)} />
      {children}
    </div>
  );
}

export function DialogContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`fixed inset-x-4 top-[50%] translate-y-[-50%] bg-white rounded-lg shadow-lg ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-between items-center p-4 border-b">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
} 