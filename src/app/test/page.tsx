'use client';

import APITest from '@/app/components/tests/APITest';
import { Suspense } from 'react';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading test dashboard...</p>
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<LoadingFallback />}>
          <APITest />
        </Suspense>
      </div>
    </div>
  );
} 