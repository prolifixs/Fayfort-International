import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/app/components/types/database.types'

export async function DELETE(
  request: Request,
  { params }: { params: { mediaId: string } }
) {
  console.log('🗑️ Delete media request received for mediaId:', params.mediaId);
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    console.log('🔍 Fetching media info before deletion...');
    const { data: media, error: fetchError } = await supabase
      .from('product_media')
      .select()
      .eq('id', params.mediaId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching media:', fetchError);
      throw fetchError;
    }
    console.log('📄 Media info retrieved:', media);

    // Delete from storage if exists
    if (media.url) {
      const fileName = media.url.split('/').pop()
      if (fileName) {
        console.log('🗑️ Deleting file from storage:', fileName);
        const { error: storageError } = await supabase.storage
          .from('products')
          .remove([fileName])
        
        if (storageError) {
          console.error('❌ Storage deletion error:', storageError);
        } else {
          console.log('✅ File deleted from storage');
        }
      }
    }

    console.log('🗑️ Deleting database record...');
    const { error } = await supabase
      .from('product_media')
      .delete()
      .eq('id', params.mediaId)

    if (error) {
      console.error('❌ Database deletion error:', error);
      throw error;
    }

    console.log('✅ Media deletion completed successfully');
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Delete operation failed:', error)
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    )
  }
} 