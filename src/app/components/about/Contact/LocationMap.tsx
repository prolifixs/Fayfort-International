'use client'

import { useEffect, useState } from 'react'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api'
import { MotionDiv } from '@/app/components/about/shared/MotionDiv'
import { Loader2 } from 'lucide-react'

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

const center = {
  lat: 25.2048, // Dubai coordinates
  lng: 55.2708
}

const options = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6c7686' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#e9e9e9' }]
    }
  ]
}

export function LocationMap() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleMapLoad = () => {
    setIsLoading(false)
  }

  const handleLoadError = () => {
    setLoadError('Failed to load the map. Please try again later.')
    setIsLoading(false)
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-xl shadow-sm"
    >
      <h2 className="text-2xl font-semibold mb-6">Our Location</h2>
      <div className="relative rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}
        
        {loadError ? (
          <div className="h-[400px] bg-gray-100 flex items-center justify-center text-gray-500 p-4 text-center">
            {loadError}
          </div>
        ) : (
          <LoadScript 
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            onError={handleLoadError}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
              options={options}
              onLoad={handleMapLoad}
            >
              <Marker
                position={center}
                title="Fayfort Enterprise"
              />
            </GoogleMap>
          </LoadScript>
        )}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        123 Business Avenue, Dubai, UAE
      </div>
    </MotionDiv>
  )
} 