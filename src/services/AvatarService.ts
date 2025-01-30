'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/app/components/types/database.types'

export class AvatarService {
  private supabase
  private readonly AVATAR_BUCKET = 'avatars'

  constructor() {
    this.supabase = createClientComponentClient<Database>()
  }

  async uploadAvatar(file: File): Promise<string> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file')
      }

      // Validate file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB')
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload file
      const { error: uploadError } = await this.supabase.storage
        .from(this.AVATAR_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('Storage is not properly configured. Please contact support.')
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.AVATAR_BUCKET)
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Avatar upload failed:', error)
      throw error
    }
  }

  async removeAvatar(url: string): Promise<void> {
    try {
      const fileName = url.split('/').pop()
      if (!fileName) throw new Error('Invalid avatar URL')

      const { error } = await this.supabase.storage
        .from(this.AVATAR_BUCKET)
        .remove([fileName])

      if (error) throw error
    } catch (error) {
      console.error('Avatar removal failed:', error)
      throw error
    }
  }
} 