import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { reputationLabel, reputationColor, getInitials, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { LogOut, Star, MapPin, Trophy, Settings } from 'lucide-react'
import Link from 'next/link'
import { signOutAction } from './actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const { count: haveCount } = await supabase
    .from('user_stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'have')

  const { count: needCount } = await supabase
    .from('user_stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'need')

  const { data: ratings } = await supabase
    .from('ratings')
    .select('score, comment, created_at, rater:profiles!ratings_rater_id_fkey(username, avatar_url)')
    .eq('rated_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const repLabel = reputationLabel(profile.reputation)
  const repColor = reputationColor(profile.reputation)
  const stars = Math.round(profile.reputation / 20)

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <div
        className="relative px-4 pt-10 pb-6 border-b"
        style={{ background: 'linear-gradient(180deg, #eef6fd 0%, #f8fbff 100%)', borderColor: '#e8f4fd' }}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black border-2"
              style={{ background: '#d4e9f8', borderColor: '#a9d3f1', color: '#2a5f8f' }}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-2xl object-cover" />
                : getInitials(profile.username)
              }
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <h1
              className="text-xl font-black leading-none truncate"
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

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href="/profile/edit"
              className="p-2 rounded-xl transition-colors border"
              style={{ background: 'white', borderColor: '#d4e9f8' }}
            >
              <Settings size={16} style={{ color: '#74ACDF' }} />
            </Link>
            <form action={signOutAction}>
              <button
                className="p-2 rounded-xl transition-colors border"
                style={{ background: 'white', borderColor: '#d4e9f8' }}
              >
                <LogOut size={16} style={{ color: '#9ab5cc' }} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 py-4">
        {[
          { label: 'Tengo',    value: haveCount ?? 0,           color: '#2a5f8f',  bg: '#eef6fd', border: '#a9d3f1' },
          { label: 'Me falta', value: needCount ?? 0,           color: '#d97706',  bg: '#fffbeb', border: '#fde68a' },
          { label: 'Canjes',   value: profile.trades_completed, color: '#2563eb',  bg: '#eff6ff', border: '#bfdbfe' },
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

      {/* Trophy section */}
      {profile.trades_completed >= 10 && (
        <div
          className="mx-4 mb-4 flex items-center gap-3 p-4 rounded-2xl border"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}
        >
          <Trophy size={20} className="text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-yellow-600">Coleccionista activo</p>
            <p className="text-xs" style={{ color: '#9ab5cc' }}>{profile.trades_completed} canjes completados</p>
          </div>
        </div>
      )}

      {/* Ratings */}
      <div className="px-4 pb-6">
        <h2
          className="text-sm font-bold mb-3 flex items-center gap-2"
          style={{ color: '#5b7a93' }}
        >
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          Últimas calificaciones
        </h2>

        {(!ratings || ratings.length === 0) ? (
          <p className="text-sm text-center py-6" style={{ color: '#9ab5cc' }}>
            Completá tu primer canje para recibir calificaciones
          </p>
        ) : (
          <div className="space-y-3">
            {ratings.map((r, i) => {
              const rater = (Array.isArray(r.rater) ? r.rater[0] : r.rater) as { username: string; avatar_url: string | null } | null
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
                  <p className="text-[10px]" style={{ color: '#9ab5cc' }}>{formatDate(r.created_at)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
