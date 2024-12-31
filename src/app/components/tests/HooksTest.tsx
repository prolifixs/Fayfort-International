'use client';
import { useProducts } from '@/app/hooks/useProducts';
import { useRequests } from '@/app/hooks/useRequests';
import { useUsers } from '@/app/hooks/useUsers';
import { useCategories } from '@/app/hooks/useCategories';

function TestSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border p-4 rounded-lg mb-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function HooksTest() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { requests, loading: requestsLoading, error: requestsError } = useRequests();
  const { users, loading: usersLoading, error: usersError } = useUsers();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hooks Testing Dashboard</h1>

      <TestSection title="Products Hook">
        {productsLoading && <div>Loading products...</div>}
        {productsError && <div className="text-red-500">Error: {productsError}</div>}
        {products && (
          <div>
            <p>Total Products: {products.length}</p>
            <pre className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(products[0], null, 2)}
            </pre>
          </div>
        )}
      </TestSection>

      <TestSection title="Requests Hook">
        {requestsLoading && <div>Loading requests...</div>}
        {requestsError && <div className="text-red-500">Error: {requestsError}</div>}
        {requests && (
          <div>
            <p>Total Requests: {requests.length}</p>
            <pre className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(requests[0], null, 2)}
            </pre>
          </div>
        )}
      </TestSection>

      <TestSection title="Users Hook">
        {usersLoading && <div>Loading users...</div>}
        {usersError && <div className="text-red-500">Error: {usersError}</div>}
        {users && (
          <div>
            <p>Total Users: {users.length}</p>
            <pre className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(users[0], null, 2)}
            </pre>
          </div>
        )}
      </TestSection>

      <TestSection title="Categories Hook">
        {categoriesLoading && <div>Loading categories...</div>}
        {categoriesError && <div className="text-red-500">Error: {categoriesError}</div>}
        {categories && (
          <div>
            <p>Total Categories: {categories.length}</p>
            <pre className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify(categories[0], null, 2)}
            </pre>
          </div>
        )}
      </TestSection>
    </div>
  );
} 