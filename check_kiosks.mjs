import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zlbijieejxdagqdmckde.supabase.co',
  'sb_publishable_W8yDwP4fJ67jBt5kgHfSQg_uayo4Ggz'
)

async function checkKiosks() {
  const { data, error } = await supabase
    .from('sale_points')
    .select('*')
  
  if (error) {
    console.error('Error fetching kiosks:', error)
    return
  }
  
  console.log(`Fetched ${data.length} kiosks:`)
  data.forEach(k => {
    if (k.province === 'Tucumán') {
      console.log(`- [${k.name}]: lat=${k.lat}, lng=${k.lng}, Address=${k.address}, City=${k.city}`)
    }
  })
}

checkKiosks()
