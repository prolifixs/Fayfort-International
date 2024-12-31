import Image from 'next/image'

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

      <section className="grid md:grid-cols-3 gap-8">
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Browse Catalog</h2>
          <p className="text-gray-600">Explore our extensive product catalog across various categories.</p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Submit Request</h2>
          <p className="text-gray-600">Easy submission process for your product requests.</p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Track Orders</h2>
          <p className="text-gray-600">Monitor your requests and order status in real-time.</p>
        </div>
      </section>
    </div>
  )
} 