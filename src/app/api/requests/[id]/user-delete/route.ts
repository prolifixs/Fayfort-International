import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Verify user authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify request ownership and status
    const { data: request, error: fetchError } = await supabase
      .from('requests')
      .select(`
        user_id, 
        status, 
        invoice:invoices!inner(status)
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check ownership
    if (request.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own requests' },
        { status: 403 }
      )
    }

    // Check deletion eligibility
    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be deleted' },
        { status: 400 }
      )
    }

    if (request.invoice[0]?.status === 'paid') {
      return NextResponse.json(
        { error: 'Paid requests cannot be deleted' },
        { status: 400 }
      )
    }

    // Perform deletion
    const { error: deleteError } = await supabase
      .from('requests')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Request deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
} 