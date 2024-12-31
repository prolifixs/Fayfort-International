interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting';
}

export default function ConnectionStatusIndicator({ status }: ConnectionStatusProps) {
  const statusColors = {
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-red-100 text-red-800',
    connecting: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status]}`}>
      {status === 'connected' && 'Connected'}
      {status === 'disconnected' && 'Disconnected'}
      {status === 'connecting' && 'Connecting...'}
    </div>
  );
} 