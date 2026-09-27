import { createSupabaseServerClient } from '@/lib/supabase/server'
import { RequestProcessingService } from '@/app/components/lib/requests/requestProcessor'

export async function PATCH(
  req: Request,
  props: { params: Promise<{ productId: string }> }
) {
  const params = await props.params
  const supabase = await createSupabaseServerClient()
  const requestProcessor = new RequestProcessingService()

  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('requests(id, invoice_id)')
      .eq('id', params.productId)
      .single()

    if (productError) throw productError

    // Process all requests
    for (const request of product.requests) {
      const isPaid = await requestProcessor.validateInvoicePayment(request.invoice_id)
      
      if (isPaid) {
        await requestProcessor.processPaidRequest(request.id)
      } else {
        await requestProcessor.processUnpaidRequest(request.id)
      }
    }

    return new Response('Success', { status: 200 })
  } catch (error) {
    console.error('Status update error:', error)
    return new Response('Error processing requests', { status: 500 })
  }
} 