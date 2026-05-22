import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatClient } from './ChatClient'
import type { Message, Profile } from '@/lib/types'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: chatId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: chat } = await supabase
    .from('chats')
    .select(`
      id,
      match_id,
      matches (
        id,
        status,
        user_a,
        user_b,
        stickers_a_to_b,
        stickers_b_to_a,
        profile_a:profiles!matches_user_a_fkey ( id, username, avatar_url, city, reputation, trades_completed, created_at ),
        profile_b:profiles!matches_user_b_fkey ( id, username, avatar_url, city, reputation, trades_completed, created_at )
      )
    `)
    .eq('id', chatId)
    .single()

  if (!chat) notFound()

  const matchArray = chat.matches
  const matchObj = Array.isArray(matchArray) ? matchArray[0] : matchArray
  const match = matchObj as {
    id: string
    status: string
    user_a: string
    user_b: string
    stickers_a_to_b: number[]
    stickers_b_to_a: number[]
    profile_a: any
    profile_b: any
  } | null

  const profileA = match ? (Array.isArray(match.profile_a) ? match.profile_a[0] : match.profile_a) as Profile : null
  const profileB = match ? (Array.isArray(match.profile_b) ? match.profile_b[0] : match.profile_b) as Profile : null

  if (!match || !profileA || !profileB || (match.user_a !== user.id && match.user_b !== user.id)) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id, username, avatar_url, city, reputation, trades_completed, created_at)')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  console.log('--- DEBUG MESSAGES ---')
  console.log('currentUserId:', user.id)
  console.log('messages:', JSON.stringify(messages, null, 2))

  const isUserA = match.user_a === user.id
  const other = isUserA ? profileB : profileA

  // What I give and receive from this match
  const stickersIGive    = isUserA ? (match.stickers_a_to_b ?? []) : (match.stickers_b_to_a ?? [])
  const stickersIReceive = isUserA ? (match.stickers_b_to_a ?? []) : (match.stickers_a_to_b ?? [])

  return (
    <ChatClient
      chatId={chatId}
      matchId={match.id}
      matchStatus={match.status as 'pending' | 'accepted' | 'completed' | 'cancelled'}
      currentUserId={user.id}
      other={other}
      stickersIGive={stickersIGive}
      stickersIReceive={stickersIReceive}
      initialMessages={(messages ?? []) as (Message & { sender: Profile })[]}
    />
  )
}
