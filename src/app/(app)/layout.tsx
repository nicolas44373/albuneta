import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/NavBar'
import { RealtimeNotificationProvider } from '@/context/RealtimeNotificationContext'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <RealtimeNotificationProvider currentUserId={user.id}>
      <div className="flex flex-col min-h-screen bg-white">
        <div className="flex-1 pb-16">
          {children}
        </div>
        <NavBar />
      </div>
    </RealtimeNotificationProvider>
  )
}
