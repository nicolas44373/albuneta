import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const corrections = [
  { name: 'Kiosco Plaza Independencia Tucumán', lat: -26.8298, lng: -65.2030 },
  { name: 'Sucursal Central / El Bajo', lat: -26.8165, lng: -65.1956 },
  { name: 'Sucursal Microcentro', lat: -26.8266, lng: -65.2083 },
  { name: 'Sucursal Sur', lat: -26.8345, lng: -65.2215 },
  { name: 'Sucursal Terminal', lat: -26.8306, lng: -65.1932 },
  { name: 'Sucursal Yerba Buena (Isla)', lat: -26.8216, lng: -65.2673 },
  { name: 'Estación Terminal Tucumán', lat: -26.8312, lng: -65.1950 },
  { name: 'Kiosco de la Suipacha', lat: -26.8185, lng: -65.2152 },
  { name: 'Puesto Peatonal Mendoza', lat: -26.8272, lng: -65.2075 },
  { name: 'Kiosco Av. Mate de Luna', lat: -26.8257, lng: -65.2290 },
  { name: 'Kiosco Barrio Sur', lat: -26.8340, lng: -65.2120 },
  { name: 'Kiosco Plaza Urquiza', lat: -26.8175, lng: -65.2044 },
  { name: 'Maxi Kiosco Av. Avellaneda', lat: -26.8252, lng: -65.1945 },
  { name: 'Kiosco Plaza San Martín (Tuc)', lat: -26.8389, lng: -65.2100 },
  { name: 'Kiosco Shopping Portal Tucumán', lat: -26.8216, lng: -65.2673 },
  { name: 'Kiosco Av. Aconquija 1200', lat: -26.8145, lng: -65.2885 },
  { name: 'Kiosco Plaza Marcos Paz', lat: -26.8119, lng: -65.2944 },
  { name: 'Kiosco Centro Tafí Viejo', lat: -26.7303, lng: -65.2586 },
  { name: 'Kiosco Plaza Mitre Concepción', lat: -27.3270, lng: -65.5940 },
  { name: 'Kiosco Plaza Belgrano BRS', lat: -26.8400, lng: -65.1616 },
  { name: 'Kiosco Plaza 9 de Julio Lules', lat: -26.9222, lng: -65.3378 }
]

export async function GET() {
  const supabase = await createClient()
  
  // Verify auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({
      success: false,
      message: 'Debe iniciar sesión en la aplicación antes de ejecutar esta actualización.',
      error: authError?.message || 'No autenticado'
    }, { status: 401 })
  }

  const results = []
  for (const correction of corrections) {
    const { data, error } = await supabase
      .from('sale_points')
      .update({ lat: correction.lat, lng: correction.lng })
      .eq('name', correction.name)
      .select()

    if (error) {
      results.push({ name: correction.name, success: false, error: error.message })
    } else {
      results.push({ name: correction.name, success: true, updated: data })
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Coordenadas de kioscos actualizadas correctamente.',
    user: user.email,
    results
  })
}
