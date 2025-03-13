import { EnvDebug } from '@/app/components/debug/EnvDebug';

export default function DebugPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Environment Debug</h1>
      <EnvDebug />
    </div>
  );
} 