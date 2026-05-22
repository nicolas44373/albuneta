'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function startChatFromProfileAction(formData: FormData) {
  const otherUserId = formData.get('otherUserId') as string
  if (!otherUserId) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: existingMatch } = await supabase
    .from('matches')
    .select('id')
    .or(
      `and(user_a.eq.${user.id},user_b.eq.${otherUserId}),` +
      `and(user_a.eq.${otherUserId},user_b.eq.${user.id})`
    )
    .maybeSingle()

  let matchId = existingMatch?.id

  if (!matchId) {
    const { data: newMatch } = await supabase
      .from('matches')
      .insert({ user_a: user.id, user_b: otherUserId, status: 'accepted' })
      .select('id')
      .single()
    matchId = newMatch?.id
  } else {
    await supabase.from('matches').update({ status: 'accepted' }).eq('id', matchId)
  }

  if (!matchId) return

  const { data: existingChat } = await supabase
    .from('chats')
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle()

  let chatId = existingChat?.id

  if (!chatId) {
    const { data: newChat } = await supabase
      .from('chats')
      .insert({ match_id: matchId })
      .select('id')
      .single()
    chatId = newChat?.id
  }

  if (!chatId) return
  redirect(`/chat/${chatId}`)
}
