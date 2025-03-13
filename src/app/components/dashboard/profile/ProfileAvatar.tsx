'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'
import { AvatarService } from '@/services/AvatarService'
import { useToast } from '@/app/hooks/useToast'
import { ImageCropper } from './ImageCropper'

interface ProfileAvatarProps {
  imageUrl?: string
  userName: string
  onImageUpdate: (url: string) => void
}

export function ProfileAvatar({ imageUrl, userName, onImageUpdate }: ProfileAvatarProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const avatarService = new AvatarService()
  const { toast } = useToast()
  const [cropFile, setCropFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFile(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })
    setCropFile(null)
    setIsUploading(true)
    
    try {
      const publicUrl = await avatarService.uploadAvatar(file)
      await onImageUpdate(publicUrl)
      toast({
        message: 'Profile picture updated successfully',
        type: 'success'
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        message: 'Failed to upload profile picture',
        type: 'error'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!imageUrl) return
    
    setIsRemoving(true)
    try {
      await avatarService.removeAvatar(imageUrl)
      onImageUpdate('')
      toast({
        message: 'Profile picture removed successfully',
        type: 'success'
      })
    } catch (error) {
      console.error('Error removing avatar:', error)
      toast({
        message: 'Failed to remove profile picture',
        type: 'error'
      })
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <div 
        className="relative w-32 h-32 mx-auto mb-6"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={userName}
              fill
              className="rounded-full object-cover"
            />
            {isHovering && (
              <button
                onClick={handleRemoveAvatar}
                disabled={isRemoving}
                className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                aria-label="Remove profile picture"
              >
                <X className={`h-4 w-4 ${isRemoving ? 'animate-spin' : ''}`} />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-3xl font-medium text-gray-500">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <label 
          className={`absolute inset-0 flex items-center justify-center rounded-full cursor-pointer
            bg-black bg-opacity-50 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}
            ${isUploading || isRemoving ? 'cursor-wait' : 'cursor-pointer'}`}
        >
          <Camera className={`h-8 w-8 text-white ${isUploading ? 'animate-pulse' : ''}`} />
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading || isRemoving}
          />
        </label>
      </div>

      {cropFile && (
        <ImageCropper
          imageFile={cropFile}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
  )
} 