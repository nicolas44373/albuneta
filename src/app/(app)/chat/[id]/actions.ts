'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function completeTradeAction(formData: FormData) {
  const matchId = formData.get('matchId') as string
  const score   = Number(formData.get('score'))
  const comment = (formData.get('comment') as string | null)?.trim() || null

  if (!matchId || score < 1 || score > 5) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify user is part of this match
  const { data: match } = await supabase
    .from('matches')
    .select('id, user_a, user_b, status')
    .eq('id', matchId)
    .single()

  if (!match) return
  if (match.user_a !== user.id && match.user_b !== user.id) return
  if (match.status === 'completed') return

  const ratedId = match.user_a === user.id ? match.user_b : match.user_a

  // Mark match as completed
  await supabase
    .from('matches')
    .update({ status: 'completed' })
    .eq('id', matchId)

  // Insert rating (trigger updates reputation automatically)
  await supabase.from('ratings').upsert(
    { rater_id: user.id, rated_id: ratedId, match_id: matchId, score, comment },
    { onConflict: 'rater_id,match_id' }
  )

  redirect('/profile')
}
