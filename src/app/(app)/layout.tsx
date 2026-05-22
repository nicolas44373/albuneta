import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { RealtimeNotificationProvider } from '@/context/RealtimeNotificationContext'
import { ProfileCheck } from '@/components/ProfileCheck'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch province and city to enforce profile configuration
  const { data: profile } = await supabase
    .from('profiles')
    .select('province, city')
    .eq('id', user.id)
    .single()

  const isIncomplete = !profile?.province?.trim() || !profile?.city?.trim()

  return (
    <RealtimeNotificationProvider currentUserId={user.id}>
      <ProfileCheck province={profile?.province} city={profile?.city}>
        <div className="flex flex-col min-h-screen bg-white">
          <div className="flex-1 pb-16">
            {children}
          </div>
          {!isIncomplete && <NavBar />}
        </div>
      </ProfileCheck>
    </RealtimeNotificationProvider>
  )
}
