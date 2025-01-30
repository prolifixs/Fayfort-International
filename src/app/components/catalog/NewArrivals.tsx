import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ProductCard } from '@/app/components/ProductCard/ProductCard';
import { useRouter } from 'next/navigation';
import type { Database } from '@/app/components/types/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
  category?: { id: string; name: string; created_at: string };
  media?: Array<{
    id: string;
    product_id: string;
    url: string;
    media_type: "video" | "image";
    is_primary: boolean;
    order_index: number;
    thumbnail_url?: string;
    created_at: string;
  }>;
};

export function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          media:product_media(*),
          categories!products_category_id_fkey (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching new arrivals:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">New Arrivals</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            product={product}
            onClick={() => router.push(`/catalog/${product.id}`)}
          />
        ))}
      </div>
    </div>
  );
} 