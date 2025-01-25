import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/app/components/types/database.types'
import { MediaService } from '@/services/MediaService'

export async function POST(request: Request) {
  console.log('🎯 Media migration route hit')
  try {
    const { tempId, productId } = await request.json()
    console.log('🔄 Migration request for:', { tempId, productId })

    if (!tempId || !productId) {
      console.error('❌ Missing required parameters')
      return NextResponse.json(
        { error: 'Both tempId and productId are required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient<Database>({ cookies })
    const mediaService = new MediaService(supabase)

    // Move files from temp to permanent storage
    console.log('📦 Moving files to permanent storage...')
    await mediaService.moveTempMediaToPermanent(tempId, productId)

    // Get the newly created media record
    const { data: mediaRecords, error: fetchError } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError) {
      console.error('❌ Error fetching media record:', fetchError)
      throw fetchError
    }

    console.log('✅ Migration completed successfully')
    return NextResponse.json({ success: true, media: mediaRecords })
  } catch (error: any) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    )
  }
} 