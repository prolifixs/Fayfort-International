import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SafeDeletionService } from '@/app/components/lib/deletion/safeDeletion'

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const deletionService = new SafeDeletionService()

  try {
    console.log('Starting deletion process for product:', params.productId)

    // First check product exists and get its current state
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select(`
        id,
        requests (id),
        media:product_media (id, url)
      `)
      .eq('id', params.productId)
      .single()

    if (fetchError) throw fetchError
    console.log('Product data:', product)

    // Check for blocking relationships
    if (product.requests?.length > 0) {
      return new Response(JSON.stringify({
        message: 'Cannot delete: Product has pending requests'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Delete associated media and storage files
    if (product.media?.length > 0) {
      console.log('Deleting associated media and storage files...')
      for (const media of product.media) {
        // Delete storage file if URL exists
        if (media.url) {
          const fileName = media.url.split('/').pop()
          if (fileName) {
            console.log('Deleting storage file:', fileName)
            const { error: storageError } = await supabase.storage
              .from('products')
              .remove([fileName])
            
            if (storageError) {
              console.error('Storage deletion error:', storageError)
              throw storageError
            }
          }
        }

        // Delete media record
        const { error: mediaError } = await supabase
          .from('product_media')
          .delete()
          .eq('id', media.id)
        
        if (mediaError) throw mediaError
      }
    }

    // Now delete the product
    console.log('Deleting product...')
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', params.productId)

    if (deleteError) throw deleteError

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Product deletion error:', error)
    return new Response(JSON.stringify({ 
      message: error instanceof Error ? error.message : 'Failed to delete product'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}