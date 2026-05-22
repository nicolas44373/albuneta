import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zlbijieejxdagqdmckde.supabase.co',
  'sb_publishable_W8yDwP4fJ67jBt5kgHfSQg_uayo4Ggz'
)

async function test() {
  console.log('Fetching chats...')

  const { data: chats, error: cError } = await supabase
    .from('chats')
    .select(`
      id,
      match_id
    `)
  
  if (cError) {
    console.error('Error fetching chats:', cError)
    return
  }
  
  console.log('\n--- CHATS ---')
  console.log(chats)
}

test()
