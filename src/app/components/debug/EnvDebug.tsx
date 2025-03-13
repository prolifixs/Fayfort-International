'use client';

import { useEffect, useState } from 'react';

export function EnvDebug() {
  const [envVars, setEnvVars] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEnv = async () => {
      try {
        const res = await fetch('/api/debug');
        const data = await res.json();
        setEnvVars(data);
      } catch (error) {
        console.error('Failed to load env vars:', error);
      } finally {
        setLoading(false);
      }
    };

    checkEnv();
  }, []);

  if (loading) return <div>Loading environment info...</div>;

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-bold mb-4">Environment Variables Debug</h2>
      <pre className="whitespace-pre-wrap bg-white p-4 rounded border">
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  );
} 