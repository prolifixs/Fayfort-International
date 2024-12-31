'use client';
import { useParams, useRouter } from 'next/navigation';
import { products } from '../../components/data/dummy';
import Link from 'next/link';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link href="/catalog" className="text-blue-600 hover:underline">
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link href="/catalog" className="text-blue-600 hover:underline mb-6 block">
        ← Back to Catalog
      </Link>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-200 aspect-square rounded-lg"></div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>
          
          <div className="border-t pt-4 mt-4">
            <p className="font-medium">Price Range</p>
            <p className="text-2xl font-bold text-blue-600">{product.price_range}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm ${
              product.availability 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {product.availability ? 'In Stock' : 'Out of Stock'}
            </span>
            <span className="text-sm text-gray-600">Category: {product.category}</span>
          </div>

          <button 
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 mt-6"
            onClick={() => router.push(`/request?product=${product.id}`)}
          >
            Request This Product
          </button>
        </div>
      </div>
    </div>
  );
} 