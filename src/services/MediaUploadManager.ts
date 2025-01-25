import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/app/components/types/database.types'
import { TableRow } from '@/app/components/types/database.types'
import { MediaService } from '@/services/MediaService'

type ProductMedia = TableRow<'product_media'>

export class MediaUploadManager {
  private supabase: SupabaseClient<Database>
  private readonly TEMP_BUCKET = 'temp-products'
  private readonly STORAGE_BUCKET = 'products'
  private mediaService: MediaService

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    this.mediaService = new MediaService(supabase)
  }

  async uploadToTemp(file: File): Promise<{ url: string; fileName: string }> {
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { error: uploadError } = await this.supabase.storage
      .from(this.TEMP_BUCKET)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = this.supabase.storage
      .from(this.TEMP_BUCKET)
      .getPublicUrl(fileName)

    return { url: publicUrl, fileName }
  }

  async commitMedia(mediaItem: ProductMedia, productId: string): Promise<void> {
    if (mediaItem.media_type === 'image') {
      await this.mediaService.moveTempMediaToPermanent(mediaItem.id, productId)
    } else if (mediaItem.media_type === 'video') {
      const { error } = await this.supabase
        .from('product_media')
        .insert({
          product_id: productId,
          media_type: 'video',
          url: mediaItem.url,
          thumbnail_url: mediaItem.thumbnail_url,
          is_primary: mediaItem.is_primary,
          order_index: mediaItem.order_index
        })
      
      if (error) throw error
    }
  }
} 