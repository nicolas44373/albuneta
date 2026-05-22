'use client'

import { useState, useTransition } from 'react'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { updateProfileAction } from './actions'

type ProfileData = {
  username: string
  city: string | null
  province: string | null
  avatar_url: string | null
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

export function ProfileEditClient({ profile }: { profile: ProfileData }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSetup = searchParams.get('setup') === 'true'

  const [username, setUsername] = useState(profile.username)
  const [city, setCity]         = useState(profile.city ?? '')
  const [province, setProvince] = useState(profile.province ?? '')
  const [error, setError]       = useState<string | null>(null)
  const [saved, setSaved]       = useState(false)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (!username.trim()) {
      setError('El nombre de usuario no puede estar vacío')
      return
    }
    if (username.length < 3) {
      setError('Mínimo 3 caracteres')
      return
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setError('Solo letras, números, guiones y puntos')
      return
    }
    if (!province.trim()) {
      setError('Debes seleccionar tu provincia')
      return
    }
    if (!city.trim()) {
      setError('Debes ingresar tu ciudad o localidad')
      return
    }

    startTransition(async () => {
      const form = new FormData()
      form.set('username', username.trim())
      form.set('city', city.trim())
      form.set('province', province.trim())
      const result = await updateProfileAction(form)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        router.refresh()
        if (isSetup) {
          router.replace('/album')
        }
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-6 pb-4 border-b"
        style={{ borderColor: '#e8f4fd' }}
      >
        {!isSetup && (
          <Link
            href="/profile"
            className="p-1.5 rounded-lg border transition-colors"
            style={{ background: 'white', borderColor: '#d4e9f8' }}
          >
            <ArrowLeft size={20} style={{ color: '#74ACDF' }} />
          </Link>
        )}
        <h1
          className="text-lg font-black"
          style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
        >
          Editar perfil
        </h1>
      </div>

      {isSetup && (
        <div
          className="mx-4 mt-4 p-4 rounded-xl border text-sm flex flex-col gap-1 shadow-sm animate-pulse"
          style={{ background: '#fffbeb', borderColor: '#fef3c7', color: '#b45309' }}
        >
          <span className="font-bold text-base">⚠️ Configuración Obligatoria</span>
          <span>Para usar Albuneta debes definir tu <strong>Provincia</strong> y <strong>Ciudad/Localidad</strong>. De esta manera podrás encontrar coleccionistas en tu misma zona para intercambios.</span>
        </div>
      )}

      <form onSubmit={submit} className="flex-1 px-4 py-6 space-y-5">

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-semibold" style={{ color: '#1a2f45' }}>
            Nombre de usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="tunombre"
            maxLength={30}
            className="w-full h-12 px-4 rounded-xl text-sm focus:outline-none transition-colors"
            style={{ background: '#f8fbff', border: '1.5px solid #d4e9f8', color: '#1a2f45' }}
            onFocus={e => (e.target.style.borderColor = '#74ACDF')}
            onBlur={e  => (e.target.style.borderColor = '#d4e9f8')}
          />
          <p className="text-xs" style={{ color: '#9ab5cc' }}>
            Solo letras, números, guiones y puntos. Mínimo 3 caracteres.
          </p>
        </div>

        {/* Province */}
        <div className="space-y-2">
          <label className="text-sm font-semibold" style={{ color: '#1a2f45' }}>
            Provincia <span className="text-red-500 font-bold">*</span>
          </label>
          <select
            value={province}
            onChange={e => setProvince(e.target.value)}
            className="w-full h-12 px-4 rounded-xl text-sm focus:outline-none transition-colors bg-white border border-[#d4e9f8]"
            style={{ color: '#1a2f45', background: '#f8fbff', borderColor: '#d4e9f8' }}
          >
            <option value="">Selecciona tu provincia...</option>
            {ARG_PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <p className="text-xs" style={{ color: '#9ab5cc' }}>
            Te emparejaremos solo con coleccionistas de tu misma provincia.
          </p>
        </div>

        {/* City */}
        <div className="space-y-2">
          <label className="text-sm font-semibold" style={{ color: '#1a2f45' }}>
            Ciudad / Localidad <span className="text-red-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="San Miguel de Tucumán, Yerba Buena, Tafí Viejo..."
            maxLength={50}
            className="w-full h-12 px-4 rounded-xl text-sm focus:outline-none transition-colors"
            style={{ background: '#f8fbff', border: '1.5px solid #d4e9f8', color: '#1a2f45' }}
            onFocus={e => (e.target.style.borderColor = '#74ACDF')}
            onBlur={e  => (e.target.style.borderColor = '#d4e9f8')}
          />
          <p className="text-xs" style={{ color: '#9ab5cc' }}>
            Tu localidad ayuda a encontrar coleccionistas cerca tuyo para intercambiar.
          </p>
        </div>

        {/* Error / Success */}
        {error && (
          <p
            className="text-sm rounded-xl px-3 py-2 border"
            style={{ color: '#dc2626', background: '#fef2f2', borderColor: '#fecaca' }}
          >
            {error}
          </p>
        )}
        {saved && (
          <p
            className="flex items-center gap-2 text-sm rounded-xl px-3 py-2 border"
            style={{ color: '#16a34a', background: '#f0fdf4', borderColor: '#86efac' }}
          >
            <Check size={14} />
            Perfil actualizado
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl font-bold transition-all disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
            color: 'white',
            boxShadow: '0 2px 10px rgba(116,172,223,0.3)',
          }}
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
