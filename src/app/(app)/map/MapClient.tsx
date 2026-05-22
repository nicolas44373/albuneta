'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, MapPin, X, HelpCircle, Loader2 } from 'lucide-react'
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
  'Santa Fe': { lat: -32.9468, lng: -60.6393 }, // Rosario coordinates (largest node) or Santa Fe Capital
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

    L.control.zoom({ position: 'topright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)

    mapRef.current = map

    const markersLayer = L.layerGroup().addTo(map)
    markersLayerRef.current = markersLayer

    // Try to get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserCoords(coords)
          map.setView([coords.lat, coords.lng], 14)

          // Add blue user marker
          const userIcon = createUserIcon()
          const userMarker = L.marker([coords.lat, coords.lng], { icon: userIcon })
            .bindPopup('<p style="font-size:11px;font-weight:bold;margin:0;">Estás acá</p>')
            .addTo(map)
          userMarkerRef.current = userMarker
        },
        (err) => {
          console.warn('Geolocalización denegada/fallida:', err)
        },
        { enableHighAccuracy: true }
      )
    }

    // Map click handler to report a new kiosk
    map.on('click', (e: L.LeafletMouseEvent) => {
      // Small delay to verify if user clicked a marker (markers handle their own popups)
      const clickedOnMarker = (e.originalEvent.target as HTMLElement).closest('.leaflet-marker-icon')
      if (clickedOnMarker) return

      setSelectedCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
      setShowReportModal(true)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [loading, profileProvince])

  // 3. Render Kiosk Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return

    const markersLayer = markersLayerRef.current
    markersLayer.clearLayers()

    kiosks.forEach((kiosk) => {
      const kioskIcon = createKioskIcon(kiosk.has_stock)
      const priceText = []
      if (kiosk.packet_price) priceText.push(`Paquete: <b>$${kiosk.packet_price}</b>`)
      if (kiosk.album_price) priceText.push(`Álbum: <b>$${kiosk.album_price}</b>`)

      const popupContent = `
        <div style="font-family: system-ui; width: 180px; font-size:12px; color:#1a2f45;">
          <h3 style="font-weight: 800; font-size: 13px; margin: 0 0 3px 0; color:#1a2f45;">${kiosk.name}</h3>
          <p style="margin: 0 0 5px 0; color: #5b7a93; font-size: 11px;">${kiosk.address}, ${kiosk.city}</p>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px;">
            ${priceText.length > 0 ? priceText.map(t => `<span style="background:#eef6fd; border:1px solid #d4e9f8; border-radius:6px; padding: 2px 5px; font-size:10px;">${t}</span>`).join('') : '<span style="color:#9ab5cc; font-style:italic;">Precios no reportados</span>'}
          </div>
          <div style="display: flex; items-center; justify-content: space-between; border-t: 1px solid #eef6fd; pt: 4px; margin-top: 4px;">
            <span style="
              font-weight: bold;
              font-size: 10px;
              color: ${kiosk.has_stock ? '#10b981' : '#ef4444'};
              background: ${kiosk.has_stock ? '#ecfdf5' : '#fef2f2'};
              border: 1px solid ${kiosk.has_stock ? '#a7f3d0' : '#fecaca'};
              border-radius: 9999px;
              padding: 1px 6px;
            ">
              ${kiosk.has_stock ? 'Con Stock' : 'Sin Stock'}
            </span>
          </div>
        </div>
      `

      L.marker([kiosk.lat, kiosk.lng], { icon: kioskIcon })
        .bindPopup(popupContent)
        .addTo(markersLayer)
    })
  }, [kiosks])

  // Custom marker generator (Leaflet divIcon)
  const createKioskIcon = (hasStock: boolean) => {
    const color = hasStock ? '#10b981' : '#ef4444' // Green or Red
    const pulseColor = hasStock ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
    const iconHtml = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${pulseColor};
          animation: marker-pulse 1.8s infinite ease-in-out;
        "></div>
        <div style="
          position: relative;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      </div>
      <style>
        @keyframes marker-pulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `
    return L.divIcon({
      html: iconHtml,
      className: 'custom-kiosk-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -10],
    })
  }

  // User marker
  const createUserIcon = () => {
    const iconHtml = `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #2563eb;
          background-color: rgba(37, 99, 235, 0.15);
          animation: user-pulse-anim 2s infinite ease-out;
        "></div>
        <div style="
          position: relative;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #2563eb;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
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
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })
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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white relative">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-3 border-b shrink-0 z-40 bg-white"
        style={{ borderColor: '#e8f4fd' }}
      >
        <div>
          <h1
            className="text-lg font-black leading-tight"
            style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
          >
            Mapa de Kioscos
          </h1>
          <p className="text-[11px] text-[#5b7a93] font-medium leading-none mt-1">
            Encontrá figuritas cerca tuyo y reportá stock
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

      {/* Helper Banner at Top */}
      <div className="bg-[#eef6fd] border-b border-[#a9d3f1] px-4 py-2 text-[11px] text-[#2a5f8f] font-semibold text-center z-40 flex items-center justify-center gap-1.5 shadow-sm">
        <HelpCircle size={14} className="shrink-0" />
        <span>¿Querés agregar un local? Tocá cualquier parte del mapa para marcarlo.</span>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#74ACDF] border-t-transparent"></div>
          <p className="mt-3 text-xs font-bold text-[#5b7a93]">Cargando mapa...</p>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 w-full h-full z-10" ref={mapContainerRef} />

      {/* Custom Button to Trigger Manual Marker Placement Instruction */}
      <button
        onClick={() => {
          showToast('Tocá el mapa en la ubicación del kiosco')
        }}
        className="absolute bottom-5 right-4 z-40 flex items-center justify-center gap-1.5 h-11 px-4 rounded-full font-bold text-xs shadow-lg transition-transform active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
          color: 'white',
          boxShadow: '0 4px 14px rgba(116,172,223,0.4)',
        }}
      >
        <Plus size={16} />
        <span>Agregar Kiosco</span>
      </button>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 flex justify-center pointer-events-none animate-modal-in">
          <div className="bg-slate-900/90 backdrop-blur text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg border border-slate-800">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Report Kiosk Modal */}
      {showReportModal && selectedCoords && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border max-h-[85vh] overflow-y-auto"
            style={{ borderColor: '#d4e9f8' }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: '#eef6fd' }}>
              <div className="flex items-center gap-2">
                <MapPin size={18} style={{ color: '#74ACDF' }} />
                <h3 className="font-extrabold text-sm text-[#1a2f45]">Agregar Punto de Venta</h3>
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
              <p className="text-[11px] text-[#5b7a93] leading-relaxed">
                Coordenadas marcadas: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}</span>
              </p>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1a2f45]">Nombre del Kiosco/Local</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Kiosco Don Pepe, Puesto de Revistas"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff]"
                  style={{ color: '#1a2f45' }}
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1a2f45]">Dirección</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. Cabildo 1500"
                  value={reportAddress}
                  onChange={(e) => setReportAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff]"
                  style={{ color: '#1a2f45' }}
                />
              </div>

              {/* Province & City Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1a2f45]">Provincia</label>
                  <select
                    value={reportProvince}
                    onChange={(e) => setReportProvince(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-white"
                    style={{ color: '#1a2f45' }}
                  >
                    <option value="">Seleccionar...</option>
                    {ARG_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1a2f45]">Ciudad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Belgrano, Rosario"
                    value={reportCity}
                    onChange={(e) => setReportCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff]"
                    style={{ color: '#1a2f45' }}
                  />
                </div>
              </div>

              {/* Prices (Optional) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1a2f45]">Precio Paquete ($) <span className="font-normal text-[#9ab5cc]">(opcional)</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 1200"
                    value={reportPacketPrice}
                    onChange={(e) => setReportPacketPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff]"
                    style={{ color: '#1a2f45' }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1a2f45]">Precio Álbum ($) <span className="font-normal text-[#9ab5cc]">(opcional)</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 5000"
                    value={reportAlbumPrice}
                    onChange={(e) => setReportAlbumPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs focus:outline-none border border-[#d4e9f8] bg-[#f8fbff]"
                    style={{ color: '#1a2f45' }}
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
                  className="w-4.5 h-4.5 accent-[#74ACDF] border-[#d4e9f8] rounded"
                />
                <label htmlFor="hasStockCheckbox" className="text-xs font-bold text-[#1a2f45] select-none cursor-pointer">
                  ¿Tiene stock disponible de figuritas ahora?
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
                  className="flex-1 h-11 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-50"
                  style={{ color: '#5b7a93', borderColor: '#d4e9f8' }}
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
                    'Confirmar Kiosco'
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
