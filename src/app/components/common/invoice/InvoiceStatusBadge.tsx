interface InvoiceStatusBadgeProps {
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
} 