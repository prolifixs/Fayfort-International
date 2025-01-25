import { createClient } from '@supabase/supabase-js'
import { Database } from '@/app/components/types/database.types'
import { TableRow } from '@/app/components/types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

type ProductMedia = TableRow<'product_media'>

export class MediaService {
  private supabase: SupabaseClient<Database>
  private readonly STORAGE_BUCKET = 'products'
  private readonly TEMP_BUCKET = 'temp-products'
  private readonly VIDEO_PATTERNS = [
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /^(https?:\/\/)?(www\.)?(vimeo\.com\/)(\d+)/
  ]

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
    console.log('🔧 MediaService initialized')
  }

  async uploadMedia(
    file: File,
    productId: string,
    isPrimary: boolean = false
  ): Promise<ProductMedia | null> {
    console.log('📤 Starting media upload process:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      productId,
      isPrimary
    })

    try {
      // Validate file type
      if (!file.type.match(/^(image\/)/)) {
        console.error('❌ Invalid file type:', file.type)
        throw new Error('Invalid file type. Only images are allowed.')
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        console.error('❌ File too large:', file.size)
        throw new Error('File too large. Maximum size is 10MB.')
      }

      // For temporary products, use uploadTempMedia
      if (productId.startsWith('temp-') || /^\d+$/.test(productId)) {
        return this.uploadTempMedia(file, productId, isPrimary)
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}/${Date.now()}.${fileExt}`
      console.log('📂 Generated filename:', fileName)

      // Upload to storage
      console.log('⏳ Uploading to storage...')
      const { error: uploadError } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      console.log('�� Getting public URL...')
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(fileName)
      console.log('✅ Public URL generated:', publicUrl)

      // Create database record
      console.log('📝 Creating database record...')
      const { data, error } = await this.supabase
        .from('product_media')
        .insert({
          product_id: productId,
          media_type: 'image',
          url: publicUrl,
          is_primary: isPrimary,
          order_index: 0
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Database insert error:', error)
        throw error
      }

      console.log('✅ Media upload complete:', data)
      return data
    } catch (error) {
      console.error('❌ Upload process failed:', error)
      throw error
    }
  }

  async validateVideoUrl(url: string): Promise<boolean> {
    return this.VIDEO_PATTERNS.some(pattern => pattern.test(url));
  }

  async getVideoThumbnail(url: string): Promise<string | null> {
    console.log('🎥 Getting thumbnail for URL:', url);
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      const thumbnailUrl = `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
      console.log('📸 Generated YouTube thumbnail URL:', thumbnailUrl);
      return thumbnailUrl;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      try {
        const response = await fetch(`https://vimeo.com/api/v2/video/${vimeoMatch[1]}.json`);
        const data = await response.json();
        return data[0]?.thumbnail_large || null;
      } catch (error) {
        console.error('Failed to fetch Vimeo thumbnail:', error);
        return null;
      }
    }

    return null;
  }

  async addVideoUrl(
    productId: string,
    url: string,
    isPrimary: boolean = false
  ): Promise<ProductMedia> {
    console.log('📹 Adding video URL:', { productId, url, isPrimary });
    
    if (!this.validateVideoUrl(url)) {
      throw new Error('Invalid video URL. Only YouTube and Vimeo URLs are supported.');
    }

    try {
      const thumbnailUrl = await this.getVideoThumbnail(url);
      
      // Always create a temporary entry first
      const mediaEntry: ProductMedia = {
        id: `temp-${Date.now()}`,
        product_id: productId,
        media_type: "video",
        url: url,
        thumbnail_url: thumbnailUrl || '',
        is_primary: isPrimary,
        order_index: 0,
        created_at: new Date().toISOString()
      };

      console.log('📼 Created temporary video entry:', mediaEntry);
      return mediaEntry;
    } catch (error) {
      console.error('❌ Failed to add video:', error);
      throw error;
    }
  }

  async reorderMedia(productId: string, mediaIds: string[]): Promise<boolean> {
    try {
      const updates = mediaIds.map((id, index) => ({
        id,
        order_index: index
      }))

      const { error } = await this.supabase
        .from('product_media')
        .upsert(updates)

      return !error
    } catch (error) {
      console.error('Error reordering media:', error)
      return false
    }
  }

  async deleteMedia(mediaId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('product_media')
        .delete()
        .eq('id', mediaId)

      return !error
    } catch (error) {
      console.error('Error deleting media:', error)
      return false
    }
  }

  async uploadTempMedia(
    file: File,
    tempId: string,
    isPrimary: boolean = false
  ): Promise<ProductMedia> {
    try {
      if (!file.type.match(/^(image\/)/)) {
        throw new Error('Invalid file type. Only images are allowed.')
      }

      const fileExt = file.name.split('.').pop()
      const timestamp = Date.now()
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await this.supabase.storage
        .from(this.TEMP_BUCKET)
        .upload(fileName, file)

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.TEMP_BUCKET)
        .getPublicUrl(fileName)

      // Return temporary media object without database insertion
      return {
        id: `temp-${timestamp}`,
        product_id: tempId,
        media_type: 'image',
        url: publicUrl,
        is_primary: isPrimary,
        order_index: 0,
        created_at: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  async moveTempMediaToPermanent(tempId: string, productId: string): Promise<void> {
    try {
      // Get the original temp media record first
      const { data: originalMedia } = await this.supabase
        .from('product_media')
        .select('is_primary')
        .eq('id', tempId)
        .single();

      const timestamp = tempId.split('-')[1];
      console.log('🔄 Start of media migration:', {
        tempId,
        productId,
        timestamp
      });

      const { data: files, error: listError } = await this.supabase.storage
        .from(this.TEMP_BUCKET)
        .list();

      if (listError) throw listError;
      console.log('📁 Available files in temp bucket:', files.map(f => f.name));
      
      const matchingFile = files.find(file => file.name.includes(timestamp));
      if (!matchingFile) {
        console.error('❌ No matching file found for timestamp:', timestamp);
        return;
      }

      const sourcePath = matchingFile.name;
      const newPath = `product-images/${productId}/${sourcePath}`;
      
      console.log('📦 Moving file:', {
        from: `${this.TEMP_BUCKET}/${sourcePath}`,
        to: `${this.STORAGE_BUCKET}/${newPath}`
      });

      // Download from temp
      const { data: fileData, error: downloadError } = await this.supabase.storage
        .from(this.TEMP_BUCKET)
        .download(sourcePath);

      if (downloadError) {
        console.error('❌ Download error:', downloadError);
        throw downloadError;
      }

      // Upload to permanent storage
      const { error: uploadError } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(newPath, fileData);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(newPath);

      console.log('🔗 Generated public URL:', publicUrl);

      // Create database record
      const { error: insertError } = await this.supabase
        .from('product_media')
        .insert({
          product_id: productId,
          url: publicUrl,
          media_type: 'image',
          is_primary: originalMedia?.is_primary || false,
          order_index: 0
        });

      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        throw insertError;
      }

      // Clean up temp file
      await this.supabase.storage
        .from(this.TEMP_BUCKET)
        .remove([sourcePath]);

      console.log('✅ Migration completed successfully');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Add a new method to handle media migration for both images and videos
  async migrateMediaToPermanent(tempId: string, permanentId: string): Promise<void> {
    try {
      const mediaItems = await this.supabase
        .from('product_media')
        .select('*')
        .eq('product_id', tempId);

      if (mediaItems.data) {
        for (const item of mediaItems.data) {
          if (item.media_type === 'image') {
            // Handle image migration (existing logic)
            await this.moveTempMediaToPermanent(item.id, permanentId);
          } else if (item.media_type === 'video') {
            // Handle video migration
            const { error } = await this.supabase
              .from('product_media')
              .insert({
                product_id: permanentId,
                media_type: 'video',
                url: item.url,
                thumbnail_url: item.thumbnail_url,
                is_primary: item.is_primary,
                order_index: item.order_index
              });
            
            if (error) throw error;
          }
        }
      }
    } catch (error) {
      console.error('Failed to migrate media:', error);
      throw error;
    }
  }
}

export const mediaService = new MediaService(createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)) 