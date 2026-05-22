const SUPABASE_URL = 'https://zlbijieejxdagqdmckde.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_W8yDwP4fJ67jBt5kgHfSQg_uayo4Ggz'

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchKiosks() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/sale_points?select=id,name,address,city,province,lat,lng`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      }
    }
  )
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${await res.text()}`)
  return res.json()
}

async function geocode(address, city, province) {
  const structured = new URLSearchParams({ street: address, city, state: province, country: 'Argentina', format: 'json', limit: '1', countrycodes: 'ar' })
  const r1 = await fetch(`https://nominatim.openstreetmap.org/search?${structured}`, {
    headers: { 'User-Agent': 'Albuneta/1.0 (albuneta.com)' }
  })
  const d1 = await r1.json()
  if (d1.length > 0) return { lat: parseFloat(d1[0].lat), lng: parseFloat(d1[0].lon) }

  await sleep(1100)

  const freeform = new URLSearchParams({ q: `${address}, ${city}, ${province}, Argentina`, format: 'json', limit: '1', countrycodes: 'ar' })
  const r2 = await fetch(`https://nominatim.openstreetmap.org/search?${freeform}`, {
    headers: { 'User-Agent': 'Albuneta/1.0 (albuneta.com)' }
  })
  const d2 = await r2.json()
  if (d2.length > 0) return { lat: parseFloat(d2[0].lat), lng: parseFloat(d2[0].lon) }

  return null
}

async function main() {
  console.log('Obteniendo kioscos de Supabase...')
  const kiosks = await fetchKiosks()
  console.log(`Total: ${kiosks.length} kioscos\n`)

  const sqls = []
  const failed = []

  for (let i = 0; i < kiosks.length; i++) {
    const k = kiosks[i]
    process.stdout.write(`[${i+1}/${kiosks.length}] ${k.name} (${k.address}, ${k.city})... `)

    const coords = await geocode(k.address, k.city, k.province)

    if (coords) {
      const distLat = Math.abs(coords.lat - k.lat)
      const distLng = Math.abs(coords.lng - k.lng)
      const changed = distLat > 0.001 || distLng > 0.001
      console.log(`OK ${changed ? `[CAMBIO: ${k.lat.toFixed(5)},${k.lng.toFixed(5)} → ${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}]` : '(sin cambio significativo)'}`)
      sqls.push(`UPDATE sale_points SET lat=${coords.lat}, lng=${coords.lng} WHERE id='${k.id}'; -- ${k.name}`)
    } else {
      console.log('NO ENCONTRADO')
      failed.push(`${k.name} | ${k.address}, ${k.city}, ${k.province}`)
    }

    await sleep(1100)
  }

  console.log('\n========== SQL PARA EJECUTAR EN SUPABASE ==========\n')
  console.log(sqls.join('\n'))

  if (failed.length > 0) {
    console.log('\n========== NO GEOCODIFICADOS ==========')
    failed.forEach(f => console.log(' -', f))
  }
}

main().catch(console.error)
