import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function geocodeAddress(address: string, city: string, province: string): Promise<{ lat: number; lng: number } | null> {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  try {
    const params = new URLSearchParams({
      street: address,
      city: city,
      state: province,
      country: 'Argentina',
      format: 'json',
      limit: '1',
      countrycodes: 'ar',
    })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'Albuneta/1.0 (albuneta.com)' }
    })
    const data = await res.json()
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    await sleep(1100)
    // Fallback: free-form query
    const fallbackParams = new URLSearchParams({
      q: `${address}, ${city}, ${province}, Argentina`,
      format: 'json',
      limit: '1',
      countrycodes: 'ar',
    })
    const res2 = await fetch(`https://nominatim.openstreetmap.org/search?${fallbackParams}`, {
      headers: { 'User-Agent': 'Albuneta/1.0 (albuneta.com)' }
    })
    const data2 = await res2.json()
    if (data2 && data2.length > 0) {
      return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) }
    }
  } catch (err) {
    console.error('Geocoding error:', err)
  }
  return null
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({
      success: false,
      message: 'Debe iniciar sesión antes de ejecutar esta actualización.',
      error: authError?.message || 'No autenticado'
    }, { status: 401 })
  }

  const { data: kiosks, error: fetchError } = await supabase
    .from('sale_points')
    .select('id, name, address, city, province, lat, lng')

  if (fetchError || !kiosks) {
    return NextResponse.json({ success: false, error: fetchError?.message }, { status: 500 })
  }

  const results = []
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  for (const kiosk of kiosks) {
    const geocoded = await geocodeAddress(kiosk.address, kiosk.city, kiosk.province)

    if (!geocoded) {
      results.push({ id: kiosk.id, name: kiosk.name, success: false, error: 'No se pudo geocodificar' })
      await sleep(1100)
      continue
    }

    const { error } = await supabase
      .from('sale_points')
      .update({ lat: geocoded.lat, lng: geocoded.lng })
      .eq('id', kiosk.id)

    results.push({
      id: kiosk.id,
      name: kiosk.name,
      success: !error,
      prev: { lat: kiosk.lat, lng: kiosk.lng },
      new: geocoded,
      error: error?.message,
    })

    // Respect Nominatim rate limit: 1 req/sec
    await sleep(1100)
  }

  return NextResponse.json({
    success: true,
    message: `Coordenadas actualizadas para ${results.filter(r => r.success).length} de ${kiosks.length} kioscos.`,
    user: user.email,
    results,
  })
}
