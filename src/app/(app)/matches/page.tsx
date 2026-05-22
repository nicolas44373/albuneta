import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { reputationLabel, reputationColor, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Zap, MapPin, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { startChatAction } from './actions'

type MatchRow = {
  other_user_id: string
  username: string
  avatar_url: string | null
  city: string | null
  province: string | null
  reputation: number
  trades_completed: number
  stickers_i_give: number[]
  stickers_i_receive: number[]
  match_count: number
  match_percentage: number
}

function MatchCard({ match }: { match: MatchRow }) {
  const stars = Math.round(match.reputation / 20)
  const repLabel = reputationLabel(match.reputation)
  const repColor = reputationColor(match.reputation)

  return (
    <div
      className="rounded-2xl p-4 space-y-3 border"
      style={{ background: 'white', borderColor: '#d4e9f8', boxShadow: '0 2px 8px rgba(116,172,223,0.07)' }}
    >
      {/* User info */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2"
          style={{ background: '#eef6fd', borderColor: '#a9d3f1', color: '#2a5f8f' }}
        >
          {match.avatar_url
            ? <img src={match.avatar_url} alt={match.username} className="w-full h-full rounded-full object-cover" />
            : getInitials(match.username)
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold truncate" style={{ color: '#1a2f45' }}>{match.username}</span>
            <span className={cn('text-xs font-medium shrink-0', repColor)}>{repLabel}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {(match.city || match.province) && (
              <span className="flex items-center gap-1 text-xs" style={{ color: '#9ab5cc' }}>
                <MapPin size={10} />
                {match.city && match.province
                  ? `${match.city}, ${match.province}`
                  : match.city || match.province}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs" style={{ color: '#9ab5cc' }}>
              <Star size={10} style={{ fill: '#9ab5cc' }} />
              {match.trades_completed} canjes
            </span>
          </div>
        </div>
        {/* Match % badge */}
        <div
          className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border-2"
          style={{ background: '#eef6fd', borderColor: '#a9d3f1' }}
        >
          <span className="text-lg font-black leading-none" style={{ color: '#2a5f8f' }}>{match.match_percentage}</span>
          <span className="text-[9px] font-medium" style={{ color: '#74ACDF' }}>match</span>
        </div>
      </div>

      {/* Exchange preview */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="p-2.5 rounded-xl border"
          style={{ background: '#eef6fd', borderColor: '#a9d3f1' }}
        >
          <p className="text-[10px] font-medium mb-1" style={{ color: '#2a5f8f' }}>Le doy</p>
          <p className="text-sm font-bold" style={{ color: '#5b96cc' }}>{match.stickers_i_give.length} fig.</p>
          <p className="text-[10px] truncate" style={{ color: '#9ab5cc' }}>
            {match.stickers_i_give.slice(0, 5).join(', ')}{match.stickers_i_give.length > 5 ? '…' : ''}
          </p>
        </div>
        <div
          className="p-2.5 rounded-xl border"
          style={{ background: '#fffbeb', borderColor: '#fde68a' }}
        >
          <p className="text-[10px] font-medium mb-1 text-amber-600">Me da</p>
          <p className="text-sm font-bold text-amber-500">{match.stickers_i_receive.length} fig.</p>
          <p className="text-[10px] truncate" style={{ color: '#9ab5cc' }}>
            {match.stickers_i_receive.slice(0, 5).join(', ')}{match.stickers_i_receive.length > 5 ? '…' : ''}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/profile/${match.other_user_id}`}
          className="flex-1 flex items-center justify-center h-9 rounded-xl text-sm font-medium transition-colors border"
          style={{ background: '#eef6fd', borderColor: '#d4e9f8', color: '#2a5f8f' }}
        >
          Ver perfil
        </Link>
        <form action={startChatAction} className="flex-1">
          <input type="hidden" name="otherUserId" value={match.other_user_id} />
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(116,172,223,0.3)',
            }}
          >
            Chatear <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: matches, error } = await supabase
    .rpc('find_matches', { for_user_id: user.id })

  const list = (matches as MatchRow[] | null) ?? []

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b" style={{ borderColor: '#e8f4fd' }}>
        <div className="flex items-center gap-2 mb-1">
          <Zap size={20} style={{ color: '#74ACDF' }} />
          <h1
            className="text-xl font-black"
            style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
          >
            Matches
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#6b8caa' }}>
          {list.length > 0
            ? `${list.length} personas con quienes podés intercambiar`
            : 'Cargá tus figuritas en el álbum para encontrar matches'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {error && (
          <div className="text-sm text-center py-8 space-y-1">
            <p style={{ color: '#dc2626' }}>Error cargando matches</p>
            <p className="text-xs font-mono" style={{ color: '#9ab5cc' }}>{(error as { message?: string }).message}</p>
          </div>
        )}

        {!error && list.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
            <div className="text-5xl">🔍</div>
            <div>
              <p className="font-bold" style={{ color: '#1a2f45' }}>Sin matches todavía</p>
              <p className="text-sm mt-1 max-w-xs" style={{ color: '#6b8caa' }}>
                Marcá tus repetidas y faltantes en el álbum. El sistema busca automáticamente quién tiene lo que necesitás.
              </p>
            </div>
            <Link
              href="/album"
              className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
                color: 'white',
                boxShadow: '0 2px 8px rgba(116,172,223,0.3)',
              }}
            >
              Ir al álbum
            </Link>
          </div>
        )}

        {list.map(match => (
          <MatchCard key={match.other_user_id} match={match} />
        ))}
      </div>
    </div>
  )
}
