'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ALBUM_ID, ALL_STICKERS, WC2026_GROUPS } from '@/data/wc2026'
import type { Sticker } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Search, X, Plus, Minus, Sparkles, HelpCircle, MapPin, MessageCircle, Star, ChevronLeft, ChevronRight } from 'lucide-react'

type Status = 'have' | 'need' | null
type StatusMap = Map<string, { status: Status; quantity: number }>
type IdMap    = Map<number, string>
type FilterTab = 'all' | 'have' | 'need'

// ─── Sticker Card (Large display inside selections) ───────────────────────────

function StickerCardLarge({
  label, playerName, rarity, status, quantity, pending, onClick,
}: {
  label: string; playerName: string; rarity: string
  status: Status; quantity: number; pending: boolean; onClick: () => void
}) {
  let cardClass = 'bg-white border-[#d4e9f8] text-[#74ACDF]'
  let shimmerClass = ''
  let statusBadge = null

  if (status === 'have') {
    cardClass = 'bg-[#f0fdf4] border-[#86efac] text-[#16a34a] font-black'
    statusBadge = (
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-[10px] font-bold shadow-md">
        ✓
      </span>
    )
  } else if (status === 'need') {
    cardClass = 'bg-[#fff7ed] border-[#fdba74] text-[#d97706] font-black'
    statusBadge = (
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#d97706] text-white flex items-center justify-center text-[10px] font-bold shadow-md">
        ✗
      </span>
    )
  } else {
    if (rarity === 'foil') {
      shimmerClass = 'foil-shimmer'
    } else if (rarity === 'special') {
      cardClass = 'bg-[#faf5ff] border-[#d8b4fe] text-[#9333ea]'
    }
  }

  if (rarity === 'foil' && status === 'have') {
    shimmerClass = 'foil-shimmer !border-[#4ade80]'
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={cn(
        'relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-all duration-300 select-none w-full active:scale-95 hover:scale-[1.02] shadow-sm',
        cardClass,
        pending && 'opacity-50',
        shimmerClass
      )}
      style={{ aspectRatio: '3/4' }}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#eef6fd] text-[#2a5f8f] border border-[#d4e9f8]">
          {label}
        </span>
        {status === 'have' && quantity > 1 && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#22c55e] text-white shadow-sm shrink-0">
            x{quantity}
          </span>
        )}
      </div>

      <div className="my-auto py-1 text-center flex flex-col items-center justify-center w-full">
        {rarity === 'foil' && (
          <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 mb-0.5 flex items-center gap-0.5">
            <Sparkles size={8} /> Holograma
          </span>
        )}
        {rarity === 'special' && (
          <span className="text-[8px] font-black uppercase tracking-wider text-[#9333ea] mb-0.5">
            Especial
          </span>
        )}
        <span className="text-[11px] font-extrabold leading-tight text-[#1a2f45] line-clamp-2 max-w-full break-words px-1">
          {playerName}
        </span>
      </div>

      {statusBadge}
    </button>
  )
}

// ─── Section Card (Clickable Country card on main list) ───────────────────────

function SectionCard({
  title, stickers, statusMap, onClick, filter, isFwc, isCoke,
}: {
  title: string
  stickers: { number: number; id: string; rarity: string; playerName: string }[]
  statusMap: StatusMap
  onClick: () => void
  filter: FilterTab
  isFwc?: boolean
  isCoke?: boolean
}) {
  const visibleStickers = useMemo(() => {
    if (filter === 'all') return stickers
    return stickers.filter(s => statusMap.get(s.id)?.status === filter)
  }, [stickers, statusMap, filter])

  const haveCount = useMemo(() => stickers.filter(s => statusMap.get(s.id)?.status === 'have').length, [stickers, statusMap])
  const needCount = useMemo(() => stickers.filter(s => statusMap.get(s.id)?.status === 'need').length, [stickers, statusMap])
  const total     = stickers.length
  const pct       = total > 0 ? Math.round((haveCount / total) * 100) : 0

  if (filter !== 'all' && visibleStickers.length === 0) return null

  const accent    = isFwc || isCoke ? '#F5B700' : '#74ACDF'

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between"
      style={{
        background: 'white',
        borderColor: '#d4e9f8',
        boxShadow: '0 4px 12px rgba(116,172,223,0.04)',
      }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-6 rounded-full"
            style={{ background: accent }}
          />
          <span className="font-black text-base text-[#1a2f45] tracking-tight">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {haveCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#eef6fd] text-[#2a5f8f] border border-[#d4e9f8]">
              {haveCount} ✓
            </span>
          )}
          {needCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
              {needCount} ✗
            </span>
          )}
          <span className="text-xs font-black text-[#5b7a93] ml-1">
            {pct}%
          </span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-[#f0f7fd] mt-3.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? `linear-gradient(to right, ${accent}, #F5B700)`
              : accent,
          }}
        />
      </div>
    </button>
  )
}

// ─── Group header divider ─────────────────────────────────────────────────────

function GroupHeader({ group }: { group: string }) {
  return (
    <div className="flex items-center gap-3 px-1 pt-6 pb-2">
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(116,172,223,0.3))' }} />
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0 border"
        style={{ background: '#eef6fd', borderColor: '#a9d3f1' }}
      >
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0"
          style={{ background: '#d4e9f8', color: '#2a5f8f' }}
        >
          {group}
        </span>
        <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: '#2a5f8f' }}>
          Grupo {group}
        </span>
      </div>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(116,172,223,0.3))' }} />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AlbumPage() {
  const supabase = createClient()

  const [userId, setUserId]         = useState<string | null>(null)
  const [dbStickers, setDbStickers] = useState<Sticker[]>([])
  const [statusMap, setStatusMap]   = useState<StatusMap>(new Map())
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)
  const [saveError, setSaveError]   = useState<string | null>(null)
  const [filter, setFilter]         = useState<FilterTab>('all')
  const [search, setSearch]         = useState('')
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  const [showBanner, setShowBanner]     = useState(false)

  // Touch swipe gestures for onboarding carousel
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const minDistance = 50
    if (distance > minDistance && tutorialStep < 3) {
      setTutorialStep(prev => prev + 1)
    }
    if (distance < -minDistance && tutorialStep > 0) {
      setTutorialStep(prev => prev - 1)
    }
  }

  // Load localStorage on mount to avoid hydration mismatch
  useEffect(() => {
    const dismissed = localStorage.getItem('albuneta_tutorial_banner_dismissed')
    if (!dismissed) {
      setShowBanner(true)
    }
  }, [])

  // Modals status
  const [activeSection, setActiveSection] = useState<{
    title: string
    stickers: { number: number; id: string; rarity: string; playerName: string }[]
    isFwc?: boolean
    isCoke?: boolean
  } | null>(null)

  const [detailSticker, setDetailSticker] = useState<{
    id: string
    label: string
    playerName: string
    rarity: string
    status: Status
    quantity: number
  } | null>(null)

  const idMap = useMemo<IdMap>(() => {
    const m = new Map<number, string>()
    dbStickers.forEach(s => m.set(s.number, s.id))
    return m
  }, [dbStickers])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: stickers }, { data: userStickers }] = await Promise.all([
        supabase.from('stickers').select('*').eq('album_id', ALBUM_ID).order('number'),
        supabase.from('user_stickers').select('sticker_id, status, quantity').eq('user_id', user.id),
      ])

      setDbStickers(stickers ?? [])
      const map = new Map<string, { status: Status; quantity: number }>()
      userStickers?.forEach(us => map.set(us.sticker_id, { status: us.status as Status, quantity: us.quantity }))
      setStatusMap(map)
      setLoading(false)
    }
    load()
  }, [])

  const handleUpdateState = useCallback(async (stickerId: string, nextStatus: Status, nextQuantity: number) => {
    if (!userId) return

    const current = statusMap.get(stickerId) ?? { status: null, quantity: 0 }

    // Optimistic Update local map state
    setStatusMap(prev => {
      const m = new Map(prev)
      if (nextStatus === null) {
        m.delete(stickerId)
      } else {
        m.set(stickerId, { status: nextStatus, quantity: nextQuantity })
      }
      return m
    })
    setPendingIds(prev => new Set(prev).add(stickerId))
    setSaveError(null)

    // Update detailSticker state immediately if open
    if (detailSticker && detailSticker.id === stickerId) {
      setDetailSticker(prev => prev ? { ...prev, status: nextStatus, quantity: nextQuantity } : null)
    }

    const { error: delErr } = await supabase
      .from('user_stickers')
      .delete()
      .eq('user_id', userId)
      .eq('sticker_id', stickerId)

    if (delErr) {
      console.error('[album] delete error:', delErr)
      setSaveError(delErr.message)
      // Rollback on error
      setStatusMap(prev => {
        const m = new Map(prev)
        if (current.status === null) m.delete(stickerId)
        else m.set(stickerId, current)
        return m
      })
      if (detailSticker && detailSticker.id === stickerId) {
        setDetailSticker(prev => prev ? { ...prev, status: current.status, quantity: current.quantity } : null)
      }
      setPendingIds(prev => { const s = new Set(prev); s.delete(stickerId); return s })
      return
    }

    if (nextStatus !== null) {
      const { error: insErr } = await supabase
        .from('user_stickers')
        .insert({ user_id: userId, sticker_id: stickerId, status: nextStatus, quantity: nextQuantity })

      if (insErr) {
        console.error('[album] insert error:', insErr)
        setSaveError(insErr.message)
        // Rollback
        setStatusMap(prev => {
          const m = new Map(prev)
          if (current.status === null) m.delete(stickerId)
          else m.set(stickerId, current)
          return m
        })
        if (detailSticker && detailSticker.id === stickerId) {
          setDetailSticker(prev => prev ? { ...prev, status: current.status, quantity: current.quantity } : null)
        }
      }
    }

    setPendingIds(prev => { const s = new Set(prev); s.delete(stickerId); return s })
  }, [userId, statusMap, detailSticker])

  const handleCompleteSection = useCallback(async (sectionStickers: { id: string }[]) => {
    if (!userId) return

    // Find unmarked stickers in this section (where status is null/not set)
    const unmarked = sectionStickers.filter(s => {
      const info = statusMap.get(s.id)
      return !info || info.status === null
    })
    if (unmarked.length === 0) return

    setSaveError(null)

    // Save previous state to rollback on error
    const previousMap = new Map(statusMap)

    // Optimistic Update local map state
    setStatusMap(prev => {
      const m = new Map(prev)
      unmarked.forEach(s => {
        m.set(s.id, { status: 'have', quantity: 1 })
      })
      return m
    })
    
    setPendingIds(prev => {
      const s = new Set(prev)
      unmarked.forEach(item => s.add(item.id))
      return s
    })

    const payload = unmarked.map(s => ({
      user_id: userId,
      sticker_id: s.id,
      status: 'have' as const,
      quantity: 1
    }))

    const { error } = await supabase
      .from('user_stickers')
      .insert(payload)

    if (error) {
      console.error('[album] bulk insert error:', error)
      setSaveError(error.message)
      // Rollback on error
      setStatusMap(previousMap)
    }

    setPendingIds(prev => {
      const s = new Set(prev)
      unmarked.forEach(item => s.delete(item.id))
      return s
    })
  }, [userId, statusMap, supabase])

  const sections = useMemo(() => {
    const groups = new Map<string, { number: number; id: string; rarity: string; playerName: string }[]>()
    ALL_STICKERS.forEach(entry => {
      if (!idMap.has(entry.number)) return
      const id = idMap.get(entry.number)!
      if (!groups.has(entry.section)) groups.set(entry.section, [])
      groups.get(entry.section)!.push({ number: entry.number, id, rarity: entry.rarity, playerName: entry.player_name ?? '' })
    })
    return groups
  }, [idMap])

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections
    const q = search.toLowerCase()
    return new Map([...sections.entries()].filter(([key]) => key.toLowerCase().includes(q)))
  }, [sections, search])

  const stats = useMemo(() => {
    let have = 0, need = 0
    statusMap.forEach(v => { if (v.status === 'have') have++; else if (v.status === 'need') need++ })
    return { have, need, total: dbStickers.length }
  }, [statusMap, dbStickers.length])

  const pct = stats.total > 0 ? Math.round((stats.have / stats.total) * 100) : 0

  return (
    <div className="relative flex flex-col min-h-screen bg-white">

      {/* ── Messi topo gigio ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Silueta topo Gigio de Lionel Messi argentina.jpg"
          alt=""
          className="select-none"
          style={{
            width: 'min(80vw, 460px)',
            objectFit: 'contain',
            opacity: 0.04,
            mixBlendMode: 'multiply',
            transform: 'translateY(8%)',
          }}
        />
      </div>

      {/* ── Header ── */}
      <div
        className="relative sticky top-0 z-20 border-b px-4 pt-4 pb-3 space-y-3"
        style={{ background: 'rgba(255,255,255,0.97)', borderColor: '#d4e9f8', boxShadow: '0 2px 8px rgba(116,172,223,0.08)' }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(to right, transparent, #74ACDF 30%, #F5B700 50%, #74ACDF 70%, transparent)' }}
        />

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h1
                className="text-lg font-black leading-none"
                style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
              >
                LA ALBUNETA PAPA 2026
              </h1>
              <button
                onClick={() => {
                  setTutorialStep(0)
                  setShowTutorial(true)
                }}
                className="p-1 rounded-lg text-[#2a5f8f] hover:bg-[#eef6fd] hover:text-[#74ACDF] transition-all cursor-pointer"
                title="Cómo funciona"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            <p className="text-[11px] mt-1 font-bold text-[#5b7a93]">
              Álbum Panini oficial · {stats.total} figuritas
            </p>
          </div>
          <div className="text-right">
            <span
              className="text-3xl font-black tabular-nums text-[#74ACDF]"
              style={{ fontFamily: 'var(--font-baloo2), system-ui' }}
            >
              {pct}%
            </span>
            <p className="text-[11px] font-black text-[#5b7a93]">completado</p>
          </div>
        </div>

        <div className="h-2 rounded-full bg-[#f0f7fd]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(to right, #74ACDF, #5b96cc 60%, #F5B700)',
              boxShadow: pct > 0 ? '0 0 6px rgba(116,172,223,0.4)' : 'none',
            }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {([
            { id: 'all'  as const, label: 'Todas',    count: stats.total },
            { id: 'have' as const, label: 'Tengo',    count: stats.have,  countColor: '#16a34a' },
            { id: 'need' as const, label: 'Me falta', count: stats.need,  countColor: '#d97706' },
          ]).map(({ id, label, count, countColor }) => {
            const active = filter === id
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: active ? '#eef6fd' : 'white',
                  border: `1.5px solid ${active ? '#a9d3f1' : '#e8f4fd'}`,
                  color: active ? '#1a2f45' : '#5b7a93',
                }}
              >
                <span className="font-black" style={{ color: countColor ?? (active ? '#1a2f45' : '#5b7a93') }}>
                  {count}
                </span>
                <span className="ml-1">{label}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#74ACDF]" />
          <input
            type="text"
            placeholder="Buscar selección..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl text-sm focus:outline-none transition-all font-bold"
            style={{ background: '#f8fbff', border: '1.5px solid #d4e9f8', color: '#1a2f45' }}
            onFocus={e => (e.target.style.borderColor = '#74ACDF')}
            onBlur={e  => (e.target.style.borderColor = '#d4e9f8')}
          />
        </div>
      </div>

      {/* ── Save error banner ── */}
      {saveError && (
        <div
          className="relative z-10 mx-4 mt-2 px-3 py-2 rounded-xl text-xs border font-bold"
          style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
        >
          <strong>Error al guardar:</strong> {saveError}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="relative z-10 flex items-center justify-around px-4 py-2.5 text-[10px] font-black bg-[#f8fbff] border-b border-[#eef6fd] text-[#5b7a93]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-md border-2 bg-[#f0fdf4] border-[#86efac]" />
          Tengo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-md border-2 bg-[#fff7ed] border-[#fdba74]" />
          Me falta
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-md border bg-white border-[#d4e9f8]" />
          Sin marcar
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-md border-2 bg-[#faf5ff] border-[#d8b4fe]" />
          Especial
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-md border-2 foil-shimmer border-amber-400 animate-pulse" />
          Holograma
        </span>
      </div>

      {/* ── Content (Selections cards list) ── */}
      <div className="relative z-10 flex-1 px-4 pb-24 pt-2 space-y-2">
        {/* Tutorial Banner */}
        {showBanner && !loading && (
          <div
            className="p-4 rounded-2xl border flex items-start gap-3 relative overflow-hidden mb-4 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #eef6fd 0%, #e0effc 100%)',
              borderColor: '#d4e9f8'
            }}
          >
            <div className="p-2 rounded-xl bg-white border border-[#b8daf5] text-[#2a5f8f] shrink-0">
              <HelpCircle size={20} />
            </div>
            <div className="flex-1 space-y-1 pr-6">
              <h4 className="text-sm font-black text-[#1a2f45]">¿Cómo funciona Albuneta?</h4>
              <p className="text-xs text-[#5b7a93] leading-relaxed">
                Mirá nuestra guía rápida con ejemplos interactivos de cómo marcar tus figuritas, chatear y usar el mapa.
              </p>
              <button
                onClick={() => {
                  setTutorialStep(0)
                  setShowTutorial(true)
                }}
                className="mt-1 text-xs font-black text-[#2a5f8f] hover:text-[#74ACDF] flex items-center gap-1 cursor-pointer"
              >
                Ver guía ilustrada →
              </button>
            </div>
            <button
              onClick={() => {
                setShowBanner(false)
                localStorage.setItem('albuneta_tutorial_banner_dismissed', 'true')
              }}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[#d4e9f8] text-[#5b7a93] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 h-52">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#d4e9f8', borderTopColor: '#74ACDF' }}
            />
            <span className="text-xs font-bold text-[#5b7a93]">Cargando tu álbum...</span>
          </div>
        ) : (
          <>
            {/* FWC special section */}
            {filteredSections.has('FWC') && (
              <div>
                <div className="flex items-center gap-3 px-1 pt-4 pb-2">
                  <div className="h-px flex-1" style={{ background: 'rgba(245,183,0,0.3)' }} />
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border shrink-0 bg-[#fffbeb] border-[#fde68a]"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d97706]">
                      ⚽ FWC Especiales
                    </span>
                  </div>
                  <div className="h-px flex-1" style={{ background: 'rgba(245,183,0,0.3)' }} />
                </div>
                <SectionCard
                  title="FWC"
                  stickers={filteredSections.get('FWC')!}
                  statusMap={statusMap}
                  filter={filter}
                  isFwc
                  onClick={() => setActiveSection({
                    title: 'FWC',
                    stickers: filteredSections.get('FWC')!,
                    isFwc: true
                  })}
                />
              </div>
            )}

            {/* Groups A–L */}
            {WC2026_GROUPS.map(({ group, teams }) => {
              const teamSections = teams.filter(t => filteredSections.has(t))
              if (teamSections.length === 0) return null
              return (
                <div key={group}>
                  <GroupHeader group={group} />
                  <div className="space-y-2 mt-2">
                    {teamSections.map(team => (
                      <SectionCard
                        key={team}
                        title={team}
                        stickers={filteredSections.get(team)!}
                        statusMap={statusMap}
                        filter={filter}
                        onClick={() => setActiveSection({
                          title: team,
                          stickers: filteredSections.get(team)!
                        })}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Coca-Cola */}
            {filteredSections.has('Coca-Cola') && (
              <div>
                <div className="flex items-center gap-3 px-1 pt-4 pb-2">
                  <div className="h-px flex-1" style={{ background: 'rgba(239,68,68,0.2)' }} />
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em] shrink-0 text-red-500"
                  >
                    🥤 Coca-Cola Especiales
                  </span>
                  <div className="h-px flex-1" style={{ background: 'rgba(239,68,68,0.2)' }} />
                </div>
                <SectionCard
                  title="Coca-Cola"
                  stickers={filteredSections.get('Coca-Cola')!}
                  statusMap={statusMap}
                  filter={filter}
                  isCoke
                  onClick={() => setActiveSection({
                    title: 'Coca-Cola',
                    stickers: filteredSections.get('Coca-Cola')!,
                    isCoke: true
                  })}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Selection Modal (Selección Ampliada) ── */}
      {activeSection && (
        <div className="fixed inset-0 z-[9990] bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center px-0 sm:px-4 animate-fade-in">
          <div
            className="w-full sm:max-w-md h-[90vh] sm:h-[80vh] bg-white rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border animate-sheet-in sm:animate-modal-in"
            style={{ borderColor: '#d4e9f8' }}
          >
            {/* Modal Header */}
            <div
              className="px-5 pt-5 pb-4 border-b space-y-3 shrink-0"
              style={{ background: '#f8fbff', borderColor: '#e8f4fd' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-xl font-black text-[#1a2f45]"
                      style={{ fontFamily: 'var(--font-baloo2), system-ui' }}
                    >
                      {activeSection.title}
                    </h2>
                    {!(activeSection.isFwc || activeSection.isCoke) && (
                      <span className="text-sm tracking-wider text-[#F5B700]">★★★</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#5b7a93] mt-0.5">
                    {activeSection.isFwc ? 'Sección Especial FIFA' :
                     activeSection.isCoke ? 'Edición Especial Coca-Cola' : 'Grupo de Clasificación'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveSection(null)
                    setDetailSticker(null)
                  }}
                  className="p-2 rounded-xl hover:bg-[#eef6fd] transition-colors text-gray-400 hover:text-gray-600 border border-[#d4e9f8] bg-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress bar inside Modal */}
              {(() => {
                const teamStickers = activeSection.stickers
                const haveCount = teamStickers.filter(s => statusMap.get(s.id)?.status === 'have').length
                const total = teamStickers.length
                const pct = total > 0 ? Math.round((haveCount / total) * 100) : 0
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#5b7a93]">Progreso de la selección</span>
                      <span className="text-[#2a5f8f]">{haveCount}/{total} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#e8f4fd]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? 'linear-gradient(to right, #74ACDF, #F5B700)' : '#74ACDF'
                        }}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar bg-gray-50/50">
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))'
                }}
              >
                {activeSection.stickers.map((s, i) => {
                  const label =
                    activeSection.isFwc ? String(s.number).padStart(2, '0')
                    : activeSection.isCoke ? `CC${i + 1}`
                    : String(i + 1)

                  const stateInfo = statusMap.get(s.id) ?? { status: null, quantity: 0 }

                  return (
                    <StickerCardLarge
                      key={s.id}
                      label={label}
                      playerName={s.playerName}
                      rarity={s.rarity}
                      status={stateInfo.status}
                      quantity={stateInfo.quantity}
                      pending={pendingIds.has(s.id)}
                      onClick={() => {
                        setDetailSticker({
                          id: s.id,
                          label,
                          playerName: s.playerName,
                          rarity: s.rarity,
                          status: stateInfo.status,
                          quantity: stateInfo.quantity
                        })
                      }}
                    />
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-white flex justify-between items-center shrink-0" style={{ borderColor: '#e8f4fd' }}>
              {(() => {
                const teamStickers = activeSection.stickers
                const hasUnmarked = teamStickers.some(s => {
                  const info = statusMap.get(s.id)
                  return !info || info.status === null
                })
                if (hasUnmarked) {
                  return (
                    <button
                      onClick={() => handleCompleteSection(teamStickers)}
                      className="px-4 h-11 rounded-xl text-xs font-black border transition-all active:scale-95 text-[#16a34a] border-[#86efac] bg-[#f0fdf4] hover:bg-[#e8fdf0] cursor-pointer flex items-center gap-1.5"
                    >
                      ✓ Completar restantes
                    </button>
                  )
                }
                return <div /> // Spacer
              })()}
              <button
                onClick={() => {
                  setActiveSection(null)
                  setDetailSticker(null)
                }}
                className="px-6 h-11 rounded-xl text-sm font-black bg-[#74ACDF] text-white transition-all active:scale-95 cursor-pointer"
                style={{ boxShadow: '0 2px 10px rgba(116,172,223,0.3)' }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-modal / Sheet for Sticker Details ── */}
      {detailSticker && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
          <div
            className="w-full max-w-sm rounded-3xl p-6 space-y-6 border shadow-2xl bg-white animate-modal-in"
            style={{ borderColor: '#d4e9f8' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#eef6fd] text-[#2a5f8f] border border-[#d4e9f8]">
                  Número {detailSticker.label}
                </span>
                <h3 className="text-lg font-black mt-2.5 text-[#1a2f45] leading-snug">
                  {detailSticker.playerName}
                </h3>
                <p className="text-[11px] font-bold text-[#5b7a93] mt-1">
                  Selección: {activeSection?.title} · Categoría: {
                    detailSticker.rarity === 'foil' ? 'Holograma (Foil)' :
                    detailSticker.rarity === 'special' ? 'Especial' : 'Común'
                  }
                </p>
              </div>
              <button
                onClick={() => setDetailSticker(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 border"
              >
                <X size={16} />
              </button>
            </div>

            {/* Visual Card Preview */}
            <div className="flex justify-center py-2 select-none">
              <div
                className={cn(
                  "w-32 h-44 rounded-2xl border-[3px] flex flex-col justify-between p-3.5 shadow-md transition-all duration-300 relative",
                  detailSticker.rarity === 'foil' ? 'foil-shimmer border-yellow-400' :
                  detailSticker.rarity === 'special' ? 'bg-[#faf5ff] border-purple-400 text-purple-700' : 'bg-white border-[#d4e9f8]'
                )}
              >
                <span className="text-[9px] font-black bg-white/90 border px-1.5 py-0.5 rounded-md text-gray-800 leading-none w-fit">
                  {detailSticker.label}
                </span>
                <div className="text-center font-black text-xs text-[#1a2f45] my-auto leading-tight break-words px-1">
                  {detailSticker.playerName}
                </div>
                <div className="text-[8px] font-black text-center text-[#5b7a93] uppercase tracking-wider">
                  {activeSection?.title}
                </div>
              </div>
            </div>

            {/* State Switcher */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-[#5b7a93] uppercase tracking-wider">
                Estado en tu Álbum:
              </p>
              <div className="flex gap-2 bg-[#f8fbff] p-1 rounded-xl border border-[#e8f4fd]">
                {/* Button: Sin marcar */}
                <button
                  onClick={() => handleUpdateState(detailSticker.id, null, 0)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-black transition-all",
                    detailSticker.status === null
                      ? "bg-[#eef6fd] border border-[#a9d3f1] text-[#2a5f8f] shadow-sm"
                      : "text-[#9ab5cc] hover:text-[#5b7a93]"
                  )}
                >
                  Sin marcar
                </button>

                {/* Button: Me falta */}
                <button
                  onClick={() => handleUpdateState(detailSticker.id, 'need', 1)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-black transition-all",
                    detailSticker.status === 'need'
                      ? "bg-[#fff7ed] border border-[#fdba74] text-[#d97706] shadow-sm"
                      : "text-[#9ab5cc] hover:text-[#5b7a93]"
                  )}
                >
                  Me falta
                </button>

                {/* Button: Tengo */}
                <button
                  onClick={() => handleUpdateState(detailSticker.id, 'have', 1)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-black transition-all",
                    detailSticker.status === 'have'
                      ? "bg-[#f0fdf4] border border-[#86efac] text-[#16a34a] shadow-sm"
                      : "text-[#9ab5cc] hover:text-[#5b7a93]"
                  )}
                >
                  Tengo
                </button>
              </div>
            </div>

            {/* Quantity modifier (only shown if status is 'have') */}
            {detailSticker.status === 'have' && (
              <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-3.5 flex items-center justify-between shadow-sm animate-fade-in">
                <div>
                  <p className="text-xs font-black text-[#16a34a]">¿La tenés repetida?</p>
                  <p className="text-[9px] font-bold text-[#5b7a93] mt-0.5">Indicá cuántas tenés en total</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleUpdateState(detailSticker.id, 'have', Math.max(1, detailSticker.quantity - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-[#86efac] text-[#16a34a] flex items-center justify-center font-bold active:scale-90 transition-all shadow-sm"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center text-sm font-black text-[#1a2f45]">
                    {detailSticker.quantity}
                  </span>
                  <button
                    onClick={() => handleUpdateState(detailSticker.id, 'have', detailSticker.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-[#86efac] text-[#16a34a] flex items-center justify-center font-bold active:scale-90 transition-all shadow-sm"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Onboarding / Graphic Tutorial Modal ── */}
      {showTutorial && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center px-0 sm:px-4 animate-fade-in">
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border animate-sheet-in sm:animate-modal-in max-h-[90vh]"
            style={{ borderColor: '#d4e9f8' }}
          >
            {/* Header */}
            <div
              className="px-5 pt-5 pb-4 border-b flex items-center justify-between shrink-0"
              style={{ background: '#f8fbff', borderColor: '#e8f4fd' }}
            >
              <div className="flex items-center gap-2 text-[#2a5f8f]">
                <HelpCircle size={18} />
                <h3 className="font-extrabold text-sm text-[#1a2f45]">Guía de Uso Albuneta</h3>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col justify-between select-none"
            >
              
              {/* Graphic Representation Area */}
              <div className="flex-1 min-h-[160px] max-h-[220px] bg-[#f8fbfe] border border-[#d4e9f8] rounded-2xl flex items-center justify-center p-4 relative overflow-hidden select-none">
                
                {tutorialStep === 0 && (
                  <div className="flex flex-col items-center gap-3 animate-fade-in">
                    {/* Sticker card mockup */}
                    <div className="w-24 h-32 rounded-xl border-2 border-emerald-400 bg-emerald-50/50 flex flex-col justify-between p-2 relative shadow-md">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black bg-[#eef6fd] border border-[#d4e9f8] px-1 py-0.5 rounded text-[#2a5f8f]">10</span>
                        <span className="text-[8px] font-black bg-emerald-500 text-white px-1 rounded">x3</span>
                      </div>
                      <div className="text-center text-[10px] font-black text-slate-800 leading-tight">Lionel Messi</div>
                      <div className="text-[7px] text-center font-bold text-slate-500 uppercase">Argentina</div>
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shadow">✓</span>
                    </div>
                    {/* Button mockup controls */}
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg border border-[#fdba74] bg-[#fff7ed] text-[#d97706]">Falta</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg border border-emerald-400 bg-[#f0fdf4] text-emerald-600">Tengo</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-lg border border-slate-200 bg-white text-slate-400">+ / - Repetidas</span>
                    </div>
                  </div>
                )}

                {tutorialStep === 1 && (
                  <div className="w-full max-w-[280px] space-y-3 animate-fade-in flex flex-col justify-center">
                    {/* User Profile Card Mockup */}
                    <div className="bg-white border border-[#a9d3f1] rounded-2xl p-3 flex items-center gap-3 shadow-md relative">
                      <div className="w-9 h-9 rounded-full bg-[#eef6fd] border border-[#a9d3f1] flex items-center justify-center text-xs font-black text-[#2a5f8f]">
                        JP
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-[#1a2f45] leading-none">Juan Pérez</p>
                        <p className="text-[9px] font-bold text-[#74ACDF] flex items-center gap-0.5 mt-1">
                          <MapPin size={10} />
                          <span>Rosario, Santa Fe</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 rounded-full">
                          Match 85%
                        </span>
                      </div>
                    </div>
                    {/* Info indicator */}
                    <div className="text-[9px] font-bold text-center text-[#5b7a93] bg-white border border-dashed border-slate-200 rounded-lg p-1.5">
                      📍 Filtrado automático por Provincia para canjes físicos.
                    </div>
                  </div>
                )}

                {tutorialStep === 2 && (
                  <div className="w-full max-w-[280px] space-y-2.5 animate-fade-in flex flex-col justify-center">
                    {/* Chat Bubble Mockup */}
                    <div className="space-y-1.5">
                      <div className="flex justify-start">
                        <div className="bg-[#f1f5f9] text-slate-800 text-[10px] font-semibold px-3 py-1.5 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm">
                          ¡Hola! Tengo a Di María duplicado.
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-[#74ACDF] text-white text-[10px] font-semibold px-3 py-1.5 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm">
                          ¡Qué bueno! Yo tengo a De Paul para vos.
                        </div>
                      </div>
                    </div>
                    {/* Star Rating Mockup */}
                    <div className="flex items-center justify-center gap-1.5 bg-white border border-[#d4e9f8] p-1.5 rounded-xl shadow-xs">
                      <span className="text-[9px] font-extrabold text-[#5b7a93]">Valorar:</span>
                      <div className="flex text-[#F5B700]">
                        <Star size={12} fill="#F5B700" />
                        <Star size={12} fill="#F5B700" />
                        <Star size={12} fill="#F5B700" />
                        <Star size={12} fill="#F5B700" />
                        <Star size={12} fill="#F5B700" />
                      </div>
                    </div>
                  </div>
                )}

                {tutorialStep === 3 && (
                  <div className="w-full max-w-[280px] space-y-2.5 animate-fade-in flex flex-col justify-center items-center">
                    {/* Map marker detail box */}
                    <div className="bg-white border border-[#a9d3f1] rounded-2xl p-3 shadow-md w-56 flex flex-col gap-1 text-[10px]">
                      <div className="flex items-center justify-between border-b pb-1.5 mb-1">
                        <span className="font-extrabold text-slate-800">Kiosco El Trébol 📍</span>
                        <span className="text-[9px] font-black text-[#10b981] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 rounded-full">
                          Con Stock
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Paquete de Figuritas:</span>
                        <span className="font-extrabold text-[#2a5f8f]">$1200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Álbum de Tapa Blanda:</span>
                        <span className="font-extrabold text-[#2a5f8f]">$5000</span>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-center text-[#74ACDF] bg-[#eef6fd] px-2 py-0.5 rounded border border-[#d4e9f8]">
                      🗺️ Tocá el mapa en cualquier parte para registrar un nuevo kiosco.
                    </span>
                  </div>
                )}

              </div>

              {/* Slide text details */}
              <div className="space-y-2 text-center pt-2">
                <h4 className="text-base font-black text-[#1a2f45]">
                  {tutorialStep === 0 && '1. Marcá tu Álbum'}
                  {tutorialStep === 1 && '2. Matches por Provincia'}
                  {tutorialStep === 2 && '3. Chat y Reputación'}
                  {tutorialStep === 3 && '4. Mapa de Kioscos en vivo'}
                </h4>
                <p className="text-xs text-[#5b7a93] leading-relaxed px-2 min-h-[50px]">
                  {tutorialStep === 0 && 'Marcá qué figuritas tenés o necesitás de cada país. Si te sale repetida, aumentá la cantidad con los botones (+) y (-) para habilitar el intercambio automático.'}
                  {tutorialStep === 1 && 'Para asegurar que los intercambios se puedan realizar físicamente, filtramos los matches automáticamente por tu Provincia. ¡Recordá configurar tu Provincia en tu Perfil!'}
                  {tutorialStep === 2 && 'Una vez que tengas un match de intercambio, abrí un chat privado para coordinar el encuentro. Al finalizar, calificalo para sumar estrellas de buena conducta a su reputación.'}
                  {tutorialStep === 3 && 'Consultá el mapa para ver qué kioscos cercanos tienen stock y a qué precio venden. ¿Encontraste un local que no figura? Tocá en el mapa para reportarlo y ayudar a todos.'}
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-1.5 py-1">
                {[0, 1, 2, 3].map((s) => (
                  <span
                    key={s}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      tutorialStep === s ? 'w-5 bg-[#74ACDF]' : 'w-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-4 border-t bg-white flex items-center justify-between shrink-0" style={{ borderColor: '#e8f4fd' }}>
              <button
                disabled={tutorialStep === 0}
                onClick={() => setTutorialStep((prev) => prev - 1)}
                className="flex items-center gap-1 px-4 h-10 rounded-xl text-xs font-black border transition-colors disabled:opacity-30 cursor-pointer text-[#5b7a93] border-slate-200"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>

              {tutorialStep < 3 ? (
                <button
                  onClick={() => setTutorialStep((prev) => prev + 1)}
                  className="flex items-center gap-1 px-5 h-10 rounded-xl text-xs font-black bg-[#74ACDF] text-white transition-all active:scale-95 cursor-pointer"
                  style={{ boxShadow: '0 2px 10px rgba(116,172,223,0.3)' }}
                >
                  <span>Siguiente</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setShowTutorial(false)}
                  className="px-6 h-10 rounded-xl text-xs font-black bg-emerald-500 text-white transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  ¡Empezar a cambiar!
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

