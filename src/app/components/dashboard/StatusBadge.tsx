export function StatusBadge({ status }: { status: string }) {
  const badges = {
    request: {
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Pending'
    },
    processing: {
      color: 'bg-blue-100 text-blue-800',
      label: 'Processing'
    },
    completed: {
      color: 'bg-green-100 text-green-800',
      label: 'Completed'
    }
  }

  const badge = badges[status as keyof typeof badges]

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  )
} 