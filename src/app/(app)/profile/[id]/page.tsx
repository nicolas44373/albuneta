import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { reputationLabel, reputationColor, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ArrowLeft, Star, MapPin, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { startChatFromProfileAction } from './actions'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (profileId === user.id) redirect('/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (!profile) notFound()

  const { count: haveCount } = await supabase
    .from('user_stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profileId)
    .eq('status', 'have')

  const { count: needCount } = await supabase
    .from('user_stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profileId)
    .eq('status', 'need')

  const { data: ratings } = await supabase
    .from('ratings')
    .select('score, comment, created_at, rater:profiles!ratings_rater_id_fkey(username)')
    .eq('rated_id', profileId)
    .order('created_at', { ascending: false })
    .limit(3)

  const repLabel = reputationLabel(profile.reputation)
  const repColor = reputationColor(profile.reputation)
  const stars = Math.round(profile.reputation / 20)

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <div
        className="px-4 pt-4 pb-6 border-b"
        style={{ background: 'linear-gradient(180deg, #eef6fd 0%, #f8fbff 100%)', borderColor: '#e8f4fd' }}
      >
        <Link
          href="/matches"
          className="flex items-center gap-1 text-sm mb-5 transition-colors w-fit"
          style={{ color: '#74ACDF' }}
        >
          <ArrowLeft size={16} />
          Volver
        </Link>

        <div className="flex items-start gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black border-2 shrink-0"
            style={{ background: '#d4e9f8', borderColor: '#a9d3f1', color: '#2a5f8f' }}
          >
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-2xl object-cover" />
              : getInitials(profile.username)
            }
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h1
              className="text-xl font-black truncate"
              style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
            >
              {profile.username}
            </h1>
            <div className={cn('flex items-center gap-1 mt-1.5', repColor)}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={cn(i < stars ? 'fill-current' : '')}
                  style={i >= stars ? { fill: '#d4e9f8', color: '#d4e9f8' } : undefined}
                />
              ))}
              <span className="text-xs ml-1">{repLabel}</span>
            </div>
            {(profile.city || profile.province) && (
              <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: '#9ab5cc' }}>
                <MapPin size={11} />
                {profile.city && profile.province
                  ? `${profile.city}, ${profile.province}`
                  : profile.city || profile.province}
              </div>
            )}
          </div>
        </div>

        {/* Chat button */}
        <form action={startChatFromProfileAction} className="mt-4">
          <input type="hidden" name="otherUserId" value={profileId} />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
              color: 'white',
              boxShadow: '0 2px 10px rgba(116,172,223,0.3)',
            }}
          >
            <MessageCircle size={16} />
            Iniciar chat
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {[
          { label: 'Tengo',    value: haveCount ?? 0,           color: '#2a5f8f', bg: '#eef6fd', border: '#a9d3f1' },
          { label: 'Me falta', value: needCount ?? 0,           color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Canjes',   value: profile.trades_completed, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
        ].map(({ label, value, color, bg, border }) => (
          <div
            key={label}
            className="flex flex-col items-center p-3 rounded-2xl border"
            style={{ background: bg, borderColor: border }}
          >
            <span
              className="text-2xl font-black"
              style={{ fontFamily: 'var(--font-baloo2), system-ui', color }}
            >
              {value}
            </span>
            <span className="text-xs mt-0.5" style={{ color: '#9ab5cc' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Ratings */}
      {ratings && ratings.length > 0 && (
        <div className="px-4 pb-6">
          <h2
            className="text-sm font-bold mb-3 flex items-center gap-2"
            style={{ color: '#5b7a93' }}
          >
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            Calificaciones
          </h2>
          <div className="space-y-3">
            {ratings.map((r, i) => {
              const rater = (Array.isArray(r.rater) ? r.rater[0] : r.rater) as { username: string } | null
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl border space-y-1.5"
                  style={{ background: 'white', borderColor: '#d4e9f8' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#1a2f45' }}>
                      {rater?.username ?? 'Anónimo'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          size={12}
                          className={cn(si < r.score ? 'fill-yellow-400 text-yellow-400' : '')}
                          style={si >= r.score ? { fill: '#d4e9f8', color: '#d4e9f8' } : undefined}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-xs" style={{ color: '#6b8caa' }}>"{r.comment}"</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
