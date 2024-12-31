export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
        <p className="text-gray-600">
          You don&apos;t have permission to access this page. Please contact your administrator if you think this is a mistake.
        </p>
      </div>
    </div>
  );
} 