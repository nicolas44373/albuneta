'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Plus,
  MapPin,
  X,
  HelpCircle,
  Loader2,
  Store,
  Coins,
  BookOpen,
  Navigation,
  Search,
  Compass
} from 'lucide-react'
import Link from 'next/link'

type Kiosk = {
  id: string
  name: string
  address: string
  province: string
  city: string
  lat: number
  lng: number
  packet_price: number | null
  album_price: number | null
  has_stock: boolean
  created_by: string | null
}

const ARG_PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
]

// Province capital coordinates mapping to auto-center if GPS is blocked
const PROVINCE_CAPITALS: Record<string, { lat: number; lng: number }> = {
  'CABA': { lat: -34.6037, lng: -58.3816 },
  'Buenos Aires': { lat: -34.9212, lng: -57.9544 },
  'Catamarca': { lat: -28.4690, lng: -65.7792 },
  'Chaco': { lat: -27.4514, lng: -58.9866 },
  'Chubut': { lat: -43.3002, lng: -65.1023 },
  'Córdoba': { lat: -31.4137, lng: -64.1811 },
  'Corrientes': { lat: -27.4692, lng: -58.8306 },
  'Entre Ríos': { lat: -31.7331, lng: -60.5298 },
  'Formosa': { lat: -26.1849, lng: -58.1731 },
  'Jujuy': { lat: -24.1858, lng: -65.3045 },
  'La Pampa': { lat: -36.6203, lng: -64.2912 },
  'La Rioja': { lat: -29.4131, lng: -66.8558 },
  'Mendoza': { lat: -32.8894, lng: -68.8441 },
  'Misiones': { lat: -27.3671, lng: -55.8961 },
  'Neuquén': { lat: -38.9516, lng: -68.0591 },
  'Río Negro': { lat: -40.8135, lng: -62.9967 },
  'Salta': { lat: -24.7892, lng: -65.4103 },
  'San Juan': { lat: -31.5375, lng: -68.5251 },
  'San Luis': { lat: -33.3015, lng: -66.3379 },
  'Santa Cruz': { lat: -51.6226, lng: -69.2181 },
  'Santa Fe': { lat: -32.9468, lng: -60.6393 },
  'Santiago del Estero': { lat: -27.7877, lng: -64.2589 },
  'Tierra del Fuego': { lat: -54.8064, lng: -68.3030 },
  'Tucumán': { lat: -26.8272, lng: -65.2038 },
}

const supabase = createClient()

export default function MapClient() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)

  const [loading, setLoading] = useState(true)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [profileProvince, setProfileProvince] = useState<string | null>(null)
  const [kiosks, setKiosks] = useState<Kiosk[]>([])

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'has_stock' | 'no_stock'>('all')

  // Selected Kiosk for Bottom Sheet Detail Panel
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk | null>(null)
  const selectedKioskRef = useRef<Kiosk | null>(null)

  // Modal Report State
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [reportName, setReportName] = useState('')
  const [reportAddress, setReportAddress] = useState('')
  const [reportProvince, setReportProvince] = useState('')
  const [reportCity, setReportCity] = useState('')
  const [reportPacketPrice, setReportPacketPrice] = useState('')
  const [reportAlbumPrice, setReportAlbumPrice] = useState('')
  const [reportHasStock, setReportHasStock] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Sync ref with selectedKiosk state to prevent stale closure in Leaflet event handlers
  useEffect(() => {
    selectedKioskRef.current = selectedKiosk
  }, [selectedKiosk])

  // 1. Fetch user profile (province) & kiosks
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('province, city').eq('id', user.id).single()
          if (profile?.province) {
            setProfileProvince(profile.province)
            if (profile.city) {
              setReportCity(profile.city)
            }
            setReportProvince(profile.province)
          }
        }

        const { data: kiosksData, error } = await supabase
          .from('sale_points')
          .select('*')
        
        if (error) throw error
        setKiosks(kiosksData || [])
      } catch (err) {
        console.error('Error cargando datos del mapa:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (loading) return
    if (!mapContainerRef.current) return
    if (mapRef.current) return

    // Set default initial center coordinate
    let centerCoords = { lat: -34.6037, lng: -58.3816 } // Obelisco CABA
    if (profileProvince && PROVINCE_CAPITALS[profileProvince]) {
      centerCoords = PROVINCE_CAPITALS[profileProvince]
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([centerCoords.lat, centerCoords.lng], 13)

    // Put zoom controls on top right, slightly moved down if needed
    L.control.zoom({ position: 'topright' }).addTo(map)

    // CartoDB Voyager Tile Layer - modern, light vector-style map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map)

    mapRef.current = map

    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer

    // Try to get initial geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserCoords(coords)
          map.setView([coords.lat, coords.lng], 14)

          // Add blue user marker
          const userIcon = createUserIcon()
          const userMarker = L.marker([coords.lat, coords.lng], { icon: userIcon })
            .bindPopup('<p style="font-size:11px;font-weight:bold;margin:0;font-family:system-ui;">Estás acá</p>')
            .addTo(map)
          userMarkerRef.current = userMarker
        },
        (err) => {
          console.warn('Geolocalización denegada/fallida:', err)
        },
        { enableHighAccuracy: true }
      )
    }

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      // Verify if clicked marker
      const clickedOnMarker = (e.originalEvent.target as HTMLElement).closest('.leaflet-marker-icon')
      if (clickedOnMarker) return

      // If a kiosk details panel is open, close it first
      if (selectedKioskRef.current) {
        setSelectedKiosk(null)
      } else {
        // Otherwise trigger reporting a new kiosk
        setSelectedCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
        setShowReportModal(true)
      }
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [loading, profileProvince])

  // 3. Memoized Filtered Kiosks list
  const filteredKiosks = useMemo(() => {
    return kiosks.filter(kiosk => {
      // Stock filter
      if (stockFilter === 'has_stock' && !kiosk.has_stock) return false
      if (stockFilter === 'no_stock' && kiosk.has_stock) return false

      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchesName = kiosk.name.toLowerCase().includes(query)
        const matchesAddress = kiosk.address.toLowerCase().includes(query)
        const matchesCity = kiosk.city.toLowerCase().includes(query)
        if (!matchesName && !matchesAddress && !matchesCity) return false
      }

      return true
    })
  }, [kiosks, stockFilter, searchQuery])

  // 4. Render Kiosk Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return

    const markersLayer = markersLayerRef.current
    markersLayer.clearLayers()

    filteredKiosks.forEach((kiosk) => {
      const kioskIcon = createKioskIcon(kiosk.has_stock)

      const marker = L.marker([kiosk.lat, kiosk.lng], { icon: kioskIcon })
        .addTo(markersLayer)

      marker.on('click', () => {
        setSelectedKiosk(kiosk)
        if (mapRef.current) {
          mapRef.current.setView([kiosk.lat, kiosk.lng], 15, { animate: true })
        }
      })
    })
  }, [filteredKiosks])

  // Custom marker generator (Leaflet divIcon) - Vector Pin
  const createKioskIcon = (hasStock: boolean) => {
    const pulseColor = hasStock ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
    const gradientStart = hasStock ? '#34d399' : '#f87171'
    const gradientEnd = hasStock ? '#059669' : '#dc2626'
    
    const iconHtml = `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radial wave -->
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: ${pulseColor};
          animation: kiosk-pulse 2s infinite ease-in-out;
          pointer-events: none;
        "></div>
        
        <!-- Pin Shape -->
        <div style="
          position: relative;
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          background: linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%);
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          border: 1.5px solid white;
        ">
          <!-- Icon (rotated back by 45deg) -->
          <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 20a1 1 0 0 0 1-1V8.414a1 1 0 0 0-.293-.707l-3-3A1 1 0 0 0 17 4.414V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v.414a1 1 0 0 0-.707.293l-3 3A1 1 0 0 0 3 8.414V19a1 1 0 0 0 1 1h16Z"/>
              <path d="M3 9h18"/>
              <path d="M9 20v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/>
            </svg>
          </div>
        </div>
      </div>
      <style>
        @keyframes kiosk-pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      </style>
    `
    return L.divIcon({
      html: iconHtml,
      className: 'custom-kiosk-marker',
      iconSize: [42, 42],
      iconAnchor: [21, 35],
    })
  }

  // User location marker
  const createUserIcon = () => {
    const iconHtml = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2.5px solid #3b82f6;
          background-color: rgba(59, 130, 246, 0.15);
          animation: user-pulse-anim 2s infinite ease-out;
          pointer-events: none;
        "></div>
        <div style="
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
        "></div>
      </div>
      <style>
        @keyframes user-pulse-anim {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `
    return L.divIcon({
      html: iconHtml,
      className: 'custom-user-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    })
  }

  // Handle active geolocation on click
  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserCoords(coords)
          if (mapRef.current) {
            mapRef.current.setView([coords.lat, coords.lng], 15, { animate: true })
          }

          // Add or update marker
          if (mapRef.current) {
            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([coords.lat, coords.lng])
            } else {
              const userIcon = createUserIcon()
              const userMarker = L.marker([coords.lat, coords.lng], { icon: userIcon })
                .bindPopup('<p style="font-size:11px;font-weight:bold;margin:0;font-family:system-ui;">Estás acá</p>')
                .addTo(mapRef.current)
              userMarkerRef.current = userMarker
            }
          }
          showToast('Ubicación actualizada 📍')
        },
        (err) => {
          console.warn('Geolocalización fallida:', err)
          showToast('No pudimos acceder a tu ubicación. Verificá tus permisos.')
        },
        { enableHighAccuracy: true }
      )
    } else {
      showToast('Tu navegador no soporta geolocalización')
    }
  }

  // Handle stock toggle directly from Bottom Sheet details panel
  const handleToggleStock = async (kiosk: Kiosk) => {
    try {
      const { error } = await supabase
        .from('sale_points')
        .update({ has_stock: !kiosk.has_stock })
        .eq('id', kiosk.id)
      
      if (error) throw error

      // Update local state lists
      setKiosks(prev => prev.map(k => k.id === kiosk.id ? { ...k, has_stock: !k.has_stock } : k))
      setSelectedKiosk(prev => prev && prev.id === kiosk.id ? { ...prev, has_stock: !prev.has_stock } : prev)
      showToast('Stock de local actualizado con éxito!')
    } catch (err) {
      console.error('Error al actualizar stock del local:', err)
      showToast('Error al actualizar stock. Intentá nuevamente.')
    }
  }

  // Handle report submission
  const handleReportKiosk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCoords) return

    if (!reportName.trim()) {
      showToast('Por favor, ingresá el nombre del kiosco')
      return
    }
    if (!reportAddress.trim()) {
      showToast('Por favor, ingresá la dirección')
      return
    }
    if (!reportProvince) {
      showToast('Por favor, seleccioná la provincia')
      return
    }
    if (!reportCity.trim()) {
      showToast('Por favor, ingresá la ciudad')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const newKiosk = {
        name: reportName.trim(),
        address: reportAddress.trim(),
        province: reportProvince,
        city: reportCity.trim(),
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        packet_price: reportPacketPrice ? parseFloat(reportPacketPrice) : null,
        album_price: reportAlbumPrice ? parseFloat(reportAlbumPrice) : null,
        has_stock: reportHasStock,
        created_by: user?.id || null,
      }

      const { data, error } = await supabase
        .from('sale_points')
        .insert(newKiosk)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setKiosks((prev) => [...prev, data as Kiosk])
        showToast('Kiosco reportado con éxito 📍')
        // Reset form
        setReportName('')
        setReportAddress('')
        setReportPacketPrice('')
        setReportAlbumPrice('')
        setReportHasStock(true)
        setShowReportModal(false)
        setSelectedCoords(null)
      }
    } catch (err) {
      console.error('Error reportando kiosco:', err)
      showToast('Error al registrar kiosco. Reintentá.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white relative overflow-hidden select-none">
      {/* Dynamic animations injection */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 border-b shrink-0 z-40 bg-white"
        style={{ borderColor: '#e8f4fd' }}
      >
        <div>
          <h1
            className="text-lg font-black leading-tight"
            style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
          >
            Puntos de Venta
          </h1>
          <p className="text-[11px] text-[#5b7a93] font-medium leading-none mt-1">
            Locales y stock en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-3 bg-[#f8fbff] border border-[#d4e9f8] px-2.5 py-1 rounded-xl text-[10px] font-bold text-[#1a2f45]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span>Con Stock</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
              <span>Sin Stock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#74ACDF] border-t-transparent"></div>
          <p className="mt-3 text-xs font-bold text-[#5b7a93]">Cargando mapa interactivo...</p>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 w-full h-full z-10" ref={mapContainerRef} />

      {/* Floating Filters and Search Panel */}
      <div className="absolute top-4 inset-x-4 z-30 flex flex-col gap-2.5 pointer-events-none">
        {/* Search Input Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-[#e8f4fd] p-2.5 flex items-center gap-2 pointer-events-auto max-w-md mx-auto w-full transition-all focus-within:ring-2 focus-within:ring-[#74ACDF]/20">
          <Search size={16} className="text-[#5b7a93] shrink-0 ml-1.5" />
          <input
            type="text"
            placeholder="Buscar por kiosco, dirección o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs focus:outline-none text-[#1a2f45] placeholder-[#9ab5cc] font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-[#5b7a93] hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-1.5 pointer-events-auto overflow-x-auto pb-1.5 max-w-md mx-auto w-full no-scrollbar">
          {/* Pill: All */}
          <button
            onClick={() => setStockFilter('all')}
            className={`h-8 px-3.5 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0 ${
              stockFilter === 'all'
                ? 'bg-[#1a2f45] text-white ring-2 ring-slate-700/20'
                : 'bg-white/95 text-[#5b7a93] hover:bg-slate-50 border border-slate-100'
            }`}
          >
            <span>📍 Todos</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              stockFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-[#5b7a93]'
            }`}>
              {kiosks.length}
            </span>
          </button>

          {/* Pill: With Stock */}
          <button
            onClick={() => setStockFilter('has_stock')}
            className={`h-8 px-3.5 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0 ${
              stockFilter === 'has_stock'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-700/20'
                : 'bg-white/95 text-emerald-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Con Stock</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              stockFilter === 'has_stock' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {kiosks.filter(k => k.has_stock).length}
            </span>
          </button>

          {/* Pill: Without Stock */}
          <button
            onClick={() => setStockFilter('no_stock')}
            className={`h-8 px-3.5 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0 ${
              stockFilter === 'no_stock'
                ? 'bg-rose-600 text-white ring-2 ring-rose-700/20'
                : 'bg-white/95 text-rose-600 hover:bg-rose-50 border border-rose-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Sin Stock</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              stockFilter === 'no_stock' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'
            }`}>
              {kiosks.filter(k => !k.has_stock).length}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Locate Button */}
      {!selectedKiosk && (
        <button
          onClick={handleGeolocate}
          className="absolute bottom-[4.5rem] right-4 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-white text-[#1a2f45] shadow-lg border border-[#d4e9f8] transition-all hover:scale-105 active:scale-95 active:bg-slate-50"
          style={{
            boxShadow: '0 4px 14px rgba(116, 172, 223, 0.25)',
          }}
          title="Centrar en mi ubicación"
        >
          <Compass size={20} className="text-[#74ACDF]" />
        </button>
      )}

      {/* Floating Add Kiosk Button */}
      {!selectedKiosk && (
        <button
          onClick={() => {
            showToast('Tocá cualquier punto del mapa para ubicar el local')
          }}
          className="absolute bottom-5 right-4 z-30 flex items-center justify-center gap-2 h-11 px-4.5 rounded-full font-extrabold text-xs shadow-lg transition-all hover:scale-105 active:scale-95 text-white"
          style={{
            background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
            boxShadow: '0 4px 14px rgba(116,172,223,0.4)',
          }}
        >
          <Plus size={16} />
          <span>Agregar Kiosco</span>
        </button>
      )}

      {/* Bottom Sheet for Selected Kiosk Details */}
      {selectedKiosk && (
        <div className="absolute bottom-5 inset-x-4 sm:left-4 sm:right-auto sm:w-96 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#d4e9f8] p-5 animate-slide-up flex flex-col gap-4">
          {/* Drag handle line (aesthetic) */}
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto -mt-2 mb-1" />

          {/* Close button */}
          <button
            onClick={() => setSelectedKiosk(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Kiosk Name & Stock Badge */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Store size={18} className="text-[#74ACDF] shrink-0" />
              <h3 className="font-extrabold text-base text-[#1a2f45] leading-tight pr-6">
                {selectedKiosk.name}
              </h3>
            </div>
            
            {/* Address with MapPin */}
            <div className="flex items-start gap-1 text-xs text-[#5b7a93] font-semibold mb-3">
              <MapPin size={14} className="shrink-0 mt-0.5 text-[#5b7a93]" />
              <span>{selectedKiosk.address}, {selectedKiosk.city}, {selectedKiosk.province}</span>
            </div>

            {/* Stock Status Badge */}
            <div className="flex">
              {selectedKiosk.has_stock ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Con Stock de Figus
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Sin Stock Figus
                </span>
              )}
            </div>
          </div>

          {/* Prices Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Packet Price Card */}
            <div className="bg-[#f8fbff] border border-[#e8f4fd] p-3 rounded-xl flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[9px] text-[#5b7a93] font-bold uppercase tracking-wider">
                <Coins size={12} className="text-[#74ACDF]" />
                <span>Precio Paquete</span>
              </div>
              <div className="text-lg font-black text-[#1a2f45]">
                {selectedKiosk.packet_price ? `$${selectedKiosk.packet_price}` : (
                  <span className="text-xs font-semibold text-slate-400 italic">No reportado</span>
                )}
              </div>
            </div>

            {/* Album Price Card */}
            <div className="bg-[#f8fbff] border border-[#e8f4fd] p-3 rounded-xl flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[9px] text-[#5b7a93] font-bold uppercase tracking-wider">
                <BookOpen size={12} className="text-[#74ACDF]" />
                <span>Precio Álbum</span>
              </div>
              <div className="text-lg font-black text-[#1a2f45]">
                {selectedKiosk.album_price ? `$${selectedKiosk.album_price}` : (
                  <span className="text-xs font-semibold text-slate-400 italic">No reportado</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            {/* Toggle Stock button */}
            <button
              onClick={() => handleToggleStock(selectedKiosk)}
              className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                selectedKiosk.has_stock
                  ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                  : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              {selectedKiosk.has_stock ? 'Marcar Sin Stock' : 'Marcar Con Stock'}
            </button>

            {/* "Cómo llegar" button */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedKiosk.lat},${selectedKiosk.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-100"
              style={{
                background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
              }}
            >
              <Navigation size={14} className="fill-current" />
              <span>Cómo llegar</span>
            </a>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 flex justify-center pointer-events-none animate-modal-in">
          <div className="bg-slate-900/90 backdrop-blur text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 pointer-events-auto">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Report Kiosk Modal */}
      {showReportModal && selectedCoords && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div
            className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border max-h-[85vh] overflow-y-auto animate-slide-up"
            style={{ borderColor: '#d4e9f8' }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: '#eef6fd' }}>
              <div className="flex items-center gap-2">
                <MapPin size={18} style={{ color: '#74ACDF' }} />
                <h3 className="font-black text-sm text-[#1a2f45]" style={{ fontFamily: 'var(--font-baloo2), system-ui' }}>Agregar Kiosco</h3>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setSelectedCoords(null)
                }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportKiosk} className="space-y-4">
              <p className="text-[10px] text-[#5b7a93] leading-relaxed font-semibold">
                Punto marcado: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}</span>
              </p>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#1a2f45]">Nombre del Kiosco/Local</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Kiosco Belgrano, Puesto de Revistas"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all text-[#1a2f45] placeholder-[#9ab5cc] font-medium"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#1a2f45]">Dirección</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. Colón 450"
                  value={reportAddress}
                  onChange={(e) => setReportAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all text-[#1a2f45] placeholder-[#9ab5cc] font-medium"
                />
              </div>

              {/* Province & City Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a2f45]">Provincia</label>
                  <select
                    value={reportProvince}
                    onChange={(e) => setReportProvince(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-white focus:ring-2 focus:ring-[#74ACDF]/20 transition-all text-[#1a2f45] font-bold"
                  >
                    <option value="">Seleccionar...</option>
                    {ARG_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a2f45]">Ciudad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: San Miguel de Tucumán"
                    value={reportCity}
                    onChange={(e) => setReportCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all text-[#1a2f45] placeholder-[#9ab5cc] font-medium"
                  />
                </div>
              </div>

              {/* Prices (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a2f45]">Precio Paquete ($) <span className="font-normal text-[#9ab5cc]">(opcional)</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 1200"
                    value={reportPacketPrice}
                    onChange={(e) => setReportPacketPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all text-[#1a2f45] placeholder-[#9ab5cc] font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a2f45]">Precio Álbum ($) <span className="font-normal text-[#9ab5cc]">(opcional)</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 5000"
                    value={reportAlbumPrice}
                    onChange={(e) => setReportAlbumPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff] focus:ring-2 focus:ring-[#74ACDF]/20 transition-all text-[#1a2f45] placeholder-[#9ab5cc] font-medium"
                  />
                </div>
              </div>

              {/* Stock Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="hasStockCheckbox"
                  checked={reportHasStock}
                  onChange={(e) => setReportHasStock(e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#74ACDF] border-[#d4e9f8] rounded cursor-pointer"
                />
                <label htmlFor="hasStockCheckbox" className="text-xs font-bold text-[#1a2f45] select-none cursor-pointer">
                  ¿Tiene stock disponible ahora?
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false)
                    setSelectedCoords(null)
                  }}
                  className="flex-1 h-11 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-50 text-[#5b7a93] border-[#d4e9f8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-xs font-bold transition-all disabled:opacity-50 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
                    boxShadow: '0 2px 8px rgba(116,172,223,0.3)',
                  }}
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Confirmar Local'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
