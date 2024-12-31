import ProductsTest from '@/app/test/ProductsTest';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Fayfort Enterprise
        </h1>
        <p className="text-xl text-gray-600">
          Your trusted partner for product sourcing and catalog management
        </p>
      </section>

      {/* Test Component */}
      <ProductsTest />
    </div>
  );
} 