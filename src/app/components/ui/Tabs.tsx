interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return <div>{children}</div>;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return <div className={`flex gap-4 ${className}`}>{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function TabsTrigger({ value, children, onClick }: TabsTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg ${
        value === value ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

export function TabsContent({ value, children }: TabsContentProps) {
  return <div>{children}</div>;
} 