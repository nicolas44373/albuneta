import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zlbijieejxdagqdmckde.supabase.co',
  'sb_publishable_W8yDwP4fJ67jBt5kgHfSQg_uayo4Ggz'
)

async function test() {
  console.log('Fetching all messages...')
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Total messages in DB: ${messages.length}`)
  messages.forEach(m => {
    console.log(`Msg ID: ${m.id} | Sender ID: ${m.sender_id} | Content: "${m.content}" | Created At: ${m.created_at}`)
  })
}

test()
