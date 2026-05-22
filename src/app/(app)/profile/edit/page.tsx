import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditClient } from './ProfileEditClient'

export default async function ProfileEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, city, avatar_url')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  return <ProfileEditClient profile={profile} />
}
