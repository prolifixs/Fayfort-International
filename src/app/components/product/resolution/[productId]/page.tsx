'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ResolutionView } from '@/app/components/product/resolution/ResolutionView'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Product } from '@/app/components/ProductTable/types'
import { toast } from 'react-hot-toast'

export default function ResolutionPage() {
  const supabase = createClientComponentClient()
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            media:product_media(*),
            category:categories(*),
            requests(
              *,
              user:users(*)
            )
          `)
          .eq('id', params.productId)
          .single()

        if (error) throw error
        setProduct(data)
      } catch (error) {
        console.error('Error fetching product:', error)
        router.push('/admin/catalog')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.productId, supabase, router])

  const handleStatusChange = async (productId: string, newStatus: 'active' | 'inactive') => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error

      // Update local state
      setProduct(prev => prev ? {
        ...prev,
        status: newStatus
      } : null)

      toast.success(`Product status updated to ${newStatus}`)
    } catch (error) {
      console.error('Status change error:', error)
      toast.error('Failed to update product status')
      throw error
    }
  }

  if (loading) return <div>Loading...</div>
  if (!product) return <div>Product not found</div>

  return <ResolutionView product={product} onStatusChange={handleStatusChange} />
} 