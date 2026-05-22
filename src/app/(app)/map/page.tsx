'use client'

import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#f8fbfe]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#74ACDF] border-t-transparent"></div>
      <p className="mt-4 text-sm font-semibold text-[#5b7a93] animate-pulse">
        Cargando mapa interactivo...
      </p>
    </div>
  ),
})

export default function MapPage() {
  return <MapClient />
}
