import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate, getInitials } from '@/lib/utils'
import { MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default async function ChatListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: rows, error } = await supabase
    .from('chats')
    .select(`
      id,
      match_id,
      created_at,
      matches (
        id,
        status,
        user_a,
        user_b,
        profile_a:profiles!matches_user_a_fkey ( id, username, avatar_url ),
        profile_b:profiles!matches_user_b_fkey ( id, username, avatar_url )
      ),
      messages ( content, created_at, sender_id )
    `)

  if (error) {
    console.error('[chat] Error fetching chats:', error)
  }

  const chats = (rows ?? []).filter((row: any) => {
    const matchArray = row.matches
    const match = (Array.isArray(matchArray) ? matchArray[0] : matchArray) as { user_a: string; user_b: string } | null
    return match && (match.user_a === user.id || match.user_b === user.id)
  })

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b" style={{ borderColor: '#e8f4fd' }}>
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle size={20} style={{ color: '#74ACDF' }} />
          <h1
            className="text-xl font-black"
            style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
          >
            Chats
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#6b8caa' }}>
          {chats.length} conversaciones activas
        </p>
      </div>

      <div className="flex-1 divide-y" style={{ borderColor: '#eef6fd' }}>
        {chats.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 space-y-4 px-6">
            <div className="text-5xl">💬</div>
            <div>
              <p className="font-bold" style={{ color: '#1a2f45' }}>Sin chats todavía</p>
              <p className="text-sm mt-1" style={{ color: '#6b8caa' }}>
                Cuando encuentres un match y quieras coordinar el intercambio, el chat aparece acá.
              </p>
            </div>
            <Link
              href="/matches"
              className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(116,172,223,0.3)',
              }}
            >
              Ver mis matches
            </Link>
          </div>
        )}

        {chats.map((row: any) => {
          const matchArray = row.matches
          const match = (Array.isArray(matchArray) ? matchArray[0] : matchArray) as {
            user_a: string; user_b: string
            profile_a: any
            profile_b: any
          } | null
          if (!match) return null

          const profileA = Array.isArray(match.profile_a) ? match.profile_a[0] : match.profile_a
          const profileB = Array.isArray(match.profile_b) ? match.profile_b[0] : match.profile_b
          if (!profileA || !profileB) return null

          const other = match.user_a === user.id ? profileB : profileA

          const messages = (row.messages as { content: string; created_at: string; sender_id: string }[]) ?? []
          const lastMsg = messages.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]

          return (
            <Link
              key={row.id}
              href={`/chat/${row.id}`}
              className="flex items-center gap-3 px-4 py-4 transition-colors border-b hover:bg-[#f8fbff]"
              style={{ borderColor: '#eef6fd' }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2"
                style={{ background: '#eef6fd', borderColor: '#a9d3f1', color: '#2a5f8f' }}
              >
                {other.avatar_url
                  ? <img src={other.avatar_url} alt={other.username} className="w-full h-full rounded-full object-cover" />
                  : getInitials(other.username)
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-sm" style={{ color: '#1a2f45' }}>{other.username}</span>
                  {lastMsg && (
                    <span className="text-[10px] shrink-0 ml-2" style={{ color: '#9ab5cc' }}>
                      {formatDate(lastMsg.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: '#6b8caa' }}>
                  {lastMsg
                    ? (lastMsg.sender_id === user.id ? 'Vos: ' : '') + lastMsg.content
                    : 'Sin mensajes todavía'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
