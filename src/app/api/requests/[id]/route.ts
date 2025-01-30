import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SafeDeletionService } from '@/app/components/lib/deletion/safeDeletion'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const deletionService = new SafeDeletionService()

  try {
    // 1. Verify deletion safety
    const isSafe = await deletionService.checkDeletionSafety(params.id)
    if (!isSafe) {
      return new Response('Cannot delete: Notification not sent', { status: 400 })
    }

    // 2. Get product ID before deletion
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('product_id')
      .eq('id', params.id)
      .single()

    if (requestError) throw requestError

    // 3. Process deletion
    await deletionService.processDelete(params.id)

    // 4. Verify product can be deleted
    const canDeleteProduct = await deletionService.verifyRequestCount(request.product_id)
    
    return new Response(JSON.stringify({ 
      success: true,
      canDeleteProduct
    }), { status: 200 })

  } catch (error) {
    console.error('Deletion error:', error)
    return new Response('Error processing deletion', { status: 500 })
  }
} 