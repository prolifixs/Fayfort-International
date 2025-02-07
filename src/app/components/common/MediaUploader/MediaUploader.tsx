'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { TableRow } from '@/app/components/types/database.types'
import Image from 'next/image'
import { SafeImage } from '../SafeImage'
import { retryFetch } from '@/utils/retryFetch'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimation,
  MeasuringStrategy,
  Over,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { VideoModal } from './VideoModal'
import { MediaUploadManager } from '@/services/MediaUploadManager'
import { supabase } from '../../lib/supabase'
import { MediaService } from '@/services/MediaService'

type ProductMedia = TableRow<'product_media'>

interface MediaUploaderProps {
  productId: string
  initialMedia?: ProductMedia[]
  onMediaChange?: (media: ProductMedia[]) => void
}

interface UploadProgress {
  [key: string]: number;
}

const VideoPreview = ({ url, thumbnailUrl }: { url: string; thumbnailUrl?: string }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!url) return (
    <div className="bg-gray-100 rounded aspect-square flex items-center justify-center">
      <span>No preview</span>
    </div>
  );

  return (
    <>
      <div 
        className="bg-gray-100 rounded aspect-square flex items-center justify-center relative overflow-hidden cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {thumbnailUrl ? (
          <>
            <SafeImage
              src={thumbnailUrl}
              alt="Video thumbnail"
              width={200}
              height={200}
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0a10 10 0 100 20 10 10 0 000-20zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
          </>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Video
          </span>
        )}
      </div>

      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoUrl={url}
      />
    </>
  );
};

function SortableItem({ item, handleDelete }: { item: ProductMedia; handleDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(item.id),
    data: item,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'move',
    touchAction: 'none' as const,
    position: 'relative' as const,
    height: '120px',
    width: '120px',
    gridColumn: 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square bg-gray-50 group rounded-lg overflow-hidden"
    >
      {item.media_type === 'image' ? (
        <SafeImage
          src={item.url}
          alt=""
          width={120}
          height={120}
          className="object-cover w-full h-full"
        />
      ) : (
        <VideoPreview url={item.url} thumbnailUrl={item.thumbnail_url} />
      )}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all">
        <button
          onClick={() => handleDelete(item.id)}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Delete
        </button>
        {item.is_primary && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
            Primary
          </span>
        )}
      </div>
    </div>
  )
}

export function MediaUploader({ productId, initialMedia = [], onMediaChange }: MediaUploaderProps) {
  const [media, setMedia] = useState<ProductMedia[]>(initialMedia)
  const [videoUrl, setVideoUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({})
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  useEffect(() => {
    if (!productId) {
      console.error('❌ MediaUploader: No productId provided')
      showError('Product ID is required')
    }
  }, [productId])

  useEffect(() => {
    console.log('Media State:', {
      mediaItems: media.map(item => ({
        id: item.id,
        type: item.media_type,
        stringId: String(item.id)
      }))
    });
  }, [media]);

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 3000)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    console.log('Drag Start:', {
      activeId: event.active.id,
      activeData: event.active.data.current,
      activeSortable: media.find(item => String(item.id) === String(event.active.id))
    });
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over?.id || active.id === over.id) return;
    
    const oldIndex = media.findIndex(item => String(item.id) === String(active.id));
    const newIndex = media.findIndex(item => String(item.id) === String(over.id));
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newMedia = arrayMove(media, oldIndex, newIndex);
      setMedia(newMedia);
      onMediaChange?.(newMedia);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    setError(null)
    
    try {
      const uploadManager = new MediaUploadManager(supabase)
      const tempUploads = await Promise.all(
        acceptedFiles.map(async (file) => {
          const { url, fileName } = await uploadManager.uploadToTemp(file)
          return {
            id: `temp-${fileName}`,
            product_id: productId,
            url,
            media_type: 'image' as const,
            is_primary: !media.length,
            order_index: 0,
            created_at: new Date().toISOString()
          }
        })
      )
      
      setMedia(prev => [...prev, ...tempUploads])
      onMediaChange?.([...media, ...tempUploads])
    } catch (error) {
      setError('Upload failed')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [media, onMediaChange])

  const handleVideoSubmit = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    
    if (!videoUrl) {
      showError('Please enter a video URL');
      return;
    }

    setIsUploading(true);

    try {
      const mediaService = new MediaService(supabase);
      const mediaEntry = await mediaService.addVideoUrl(productId, videoUrl, !media.length);
      
      setMedia(prev => {
        const newMedia = [...prev, mediaEntry];
        onMediaChange?.(newMedia);
        return newMedia;
      });
      
      setVideoUrl('');
    } catch (error: any) {
      console.error('❌ Video upload error:', error);
      showError(error.message || 'Failed to add video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      // If it's a temporary ID, just remove it from the state
      if (mediaId.startsWith('temp-')) {
        const updatedMedia = media.filter(m => m.id !== mediaId)
        setMedia(updatedMedia)
        onMediaChange?.(updatedMedia)
        return
      }

      // Otherwise, proceed with API deletion
      const response = await fetch(`/api/products/media/${mediaId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Delete failed')
      const updatedMedia = media.filter(m => m.id !== mediaId)
      setMedia(updatedMedia)
      onMediaChange?.(updatedMedia)
    } catch (error) {
      console.error('Delete error:', error)
      showError('Failed to delete media')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    multiple: true
  });

  const sortableItems = media
    .filter(item => item && item.id)
    .map(item => String(item.id));

  console.log('SortableContext Items:', sortableItems);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {/* Image Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {Object.keys(uploadProgress).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([id, progress]) => (
              <div key={id} className="w-full">
                <div className="text-sm text-gray-600 mb-1">Uploading...</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : isUploading ? (
          <p>Processing uploads...</p>
        ) : isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag & drop images here, or click to select files</p>
        )}
      </div>

      {/* Video URL Input */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter video URL (YouTube or Vimeo)"
          className="flex-1 px-3 py-2 border rounded"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        />
        <button
          type="button"
          onClick={handleVideoSubmit}
          disabled={isUploading}
          className={`px-4 py-2 rounded ${
            isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isUploading ? 'Adding Video...' : 'Add Video'}
        </button>
      </div>

      {/* Media Preview */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always
          }
        }}
      >
        <SortableContext 
          items={sortableItems}
          strategy={rectSortingStrategy}
        >
          <div className="max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 relative" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {media.map((item) => (
                <SortableItem 
                  key={String(item.id)}
                  item={item} 
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <SortableItem
              item={media.find(item => String(item.id) === activeId)!}
              handleDelete={handleDelete}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
} 