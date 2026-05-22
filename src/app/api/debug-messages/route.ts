import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Fetch all chats
  const { data: chats, error: chatsError } = await supabase
    .from('chats')
    .select('*, matches(*)')

  if (chatsError) {
    return NextResponse.json({ error: chatsError.message })
  }

  // For each chat, fetch messages
  const debugData = []
  for (const chat of chats ?? []) {
    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })

    debugData.push({
      chat_id: chat.id,
      match: chat.matches,
      messages: messages ?? []
    })
  }

  return NextResponse.json({
    currentUser: {
      id: user.id,
      email: user.email
    },
    chats: debugData
  })
}
