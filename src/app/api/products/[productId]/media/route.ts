import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { MediaService } from '@/services/MediaService'
import { Database } from '@/app/components/types/database.types'

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  console.log('🎯 API route hit with productId:', params.productId)
  
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const mediaService = new MediaService(supabase)
    const contentType = request.headers.get('content-type') || ''
    console.log('📋 Content-Type:', contentType)

    // Handle video URL
    if (contentType.includes('application/json')) {
      const { url, isPrimary } = await request.json()
      console.log('📹 Processing video URL:', { url, productId: params.productId, isPrimary })
      
      try {
        const media = await mediaService.addVideoUrl(params.productId, url, isPrimary)
        
        if (!media) {
          return NextResponse.json({ error: 'Failed to add video' }, { status: 500 })
        }
        console.log('✅ Video added successfully:', media)
        return NextResponse.json(media)
      } catch (error: any) {
        console.error('❌ Video processing error:', error)
        return NextResponse.json(
          { error: error.message || 'Failed to add video' },
          { status: 400 }
        )
      }
    }

    // Handle image upload
    if (contentType.includes('multipart/form-data')) {
      console.log('📸 Processing image upload')
      const formData = await request.formData()
      const file = formData.get('file')
      const isPrimary = formData.get('isPrimary') === 'true'

      if (!file || !(file instanceof File)) {
        console.error('❌ Invalid or missing file in request')
        return NextResponse.json({ error: 'Invalid file provided' }, { status: 400 })
      }

      try {
        const media = await mediaService.uploadMedia(file, params.productId, isPrimary)
        console.log('✅ Upload successful:', media)
        return NextResponse.json(media)
      } catch (error: any) {
        console.error('❌ Media service upload error:', error)
        return NextResponse.json(
          { error: error.message || 'Upload failed' },
          { status: 500 }
        )
      }
    }

    console.error('❌ Invalid content type:', contentType)
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const mediaService = new MediaService(supabase)
    const { mediaIds } = await request.json()

    const success = await mediaService.reorderMedia(params.productId, mediaIds)
    if (!success) {
      throw new Error('Failed to update media order')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Media reorder error:', error)
    return NextResponse.json(
      { error: error.message || 'Reorder failed' },
      { status: 500 }
    )
  }
} 