'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ALBUM_ID, ALL_STICKERS, WC2026_GROUPS } from '@/data/wc2026'
import type { Sticker } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronDown, Search } from 'lucide-react'

type Status = 'have' | 'need' | null
type StatusMap = Map<string, Status>
type IdMap    = Map<number, string>
type FilterTab = 'all' | 'have' | 'need'

// ─── Sticker button ──────────────────────────────────────────────────────────

function StickerBtn({
  label, playerName, rarity, status, pending, onClick,
}: {
  label: string; playerName: string; rarity: string
  status: Status; pending: boolean; onClick: () => void
}) {
  const short = playerName.length > 9 ? playerName.slice(0, 9) : playerName

  let btnStyle: React.CSSProperties = {
    background: '#f8fbff',
    color: '#a9d3f1',
    borderColor: '#d4e9f8',
  }
  let dotColor = ''

  if (rarity === 'foil' && status === null) {
    btnStyle = {
      background: '#fefce8',
      color: '#d97706',
      borderColor: '#fbbf24',
      boxShadow: '0 0 6px rgba(245,183,0,0.2)',
    }
  } else if (rarity === 'special' && status === null) {
    btnStyle = { background: '#faf5ff', color: '#9333ea', borderColor: '#d8b4fe' }
  }

  if (status === 'have') {
    btnStyle = { background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac' }
    dotColor = '#16a34a'
  } else if (status === 'need') {
    btnStyle = { background: '#fff7ed', color: '#d97706', borderColor: '#fdba74' }
    dotColor = '#d97706'
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border-2 transition-all select-none w-full',
        pending && 'opacity-50',
      )}
      style={{ ...btnStyle, aspectRatio: '3/4' }}
    >
      <span className="text-sm font-black leading-none">{label}</span>
      <span className="text-[10px] leading-none mt-1 w-full text-center px-1 truncate opacity-65">
        {short}
      </span>
      {dotColor && (
        <span
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
          style={{ background: dotColor }}
        />
      )}
    </button>
  )
}

// ─── Section accordion (one team) ────────────────────────────────────────────

function SectionAccordion({
  title, stickers, statusMap, pendingIds, onTap, filter, isFwc, isCoke,
}: {
  title: string
  stickers: { number: number; id: string; rarity: string; playerName: string }[]
  statusMap: StatusMap
  pendingIds: Set<string>
  onTap: (id: string) => void
  filter: FilterTab
  isFwc?: boolean
  isCoke?: boolean
}) {
  const [open, setOpen] = useState(false)

  const visible = useMemo(() => {
    if (filter === 'all') return stickers
    return stickers.filter(s => statusMap.get(s.id) === filter)
  }, [stickers, statusMap, filter])

  const haveCount = stickers.filter(s => statusMap.get(s.id) === 'have').length
  const needCount = stickers.filter(s => statusMap.get(s.id) === 'need').length
  const total     = stickers.length
  const pct       = total > 0 ? Math.round((haveCount / total) * 100) : 0

  if (filter !== 'all' && visible.length === 0) return null

  const accent    = isFwc || isCoke ? '#F5B700' : '#74ACDF'
  const accentDim = isFwc || isCoke ? '#fffbeb'  : '#f8fbff'

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: accentDim,
        border: '1px solid #e8f4fd',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      {/* ── Tap area ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 pt-3 pb-2 transition-colors"
      >
        {/* Row 1: name + count + chevron */}
        <div className="flex items-center justify-between gap-3">
          <span className="font-black text-base truncate leading-none" style={{ color: '#1a2f45' }}>
            {title}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {haveCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: '#d4e9f8', color: '#2a5f8f' }}
              >
                {haveCount} ✓
              </span>
            )}
            {needCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: '#fef3c7', color: '#d97706' }}
              >
                {needCount} ✗
              </span>
            )}
            <ChevronDown
              size={16}
              className={cn('transition-transform duration-200', open && 'rotate-180')}
              style={{ color: accent, opacity: 0.8 }}
            />
          </div>
        </div>

        {/* Row 2: progress bar + percentage */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: '#e8f4fd' }}>
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
          <span
            className="shrink-0 text-[10px] font-semibold tabular-nums w-10 text-right"
            style={{ color: pct > 0 ? accent : '#b8d5ea' }}
          >
            {haveCount}/{total}
          </span>
        </div>
      </button>

      {/* ── Sticker grid ── */}
      {open && (
        <div
          className="px-3 pb-3 pt-1"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: '8px',
            borderTop: '1px solid #e8f4fd',
            background: '#f8fbff',
          }}
        >
          {visible.map((s, i) => {
            const label =
              isFwc   ? String(s.number).padStart(2, '0')
              : isCoke ? `CC${i + 1}`
              : String(i + 1)
            return (
              <StickerBtn
                key={s.id}
                label={label}
                playerName={s.playerName}
                rarity={s.rarity}
                status={statusMap.get(s.id) ?? null}
                pending={pendingIds.has(s.id)}
                onClick={() => onTap(s.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Group header divider ─────────────────────────────────────────────────────

function GroupHeader({ group }: { group: string }) {
  return (
    <div className="flex items-center gap-3 px-1 pt-5 pb-2">
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
        <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: '#2a5f8f' }}>
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
  const [filter, setFilter]         = useState<FilterTab>('all')
  const [search, setSearch]         = useState('')

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
        supabase.from('user_stickers').select('sticker_id, status').eq('user_id', user.id),
      ])

      setDbStickers(stickers ?? [])
      const map = new Map<string, Status>()
      userStickers?.forEach(us => map.set(us.sticker_id, us.status as Status))
      setStatusMap(map)
      setLoading(false)
    }
    load()
  }, [])

  const handleTap = useCallback(async (stickerId: string) => {
    if (!userId) return
    const current = statusMap.get(stickerId) ?? null
    const next: Status = current === null ? 'have' : current === 'have' ? 'need' : null

    setStatusMap(prev => { const m = new Map(prev); m.set(stickerId, next); return m })
    setPendingIds(prev => new Set(prev).add(stickerId))

    try {
      await supabase.from('user_stickers').delete().eq('user_id', userId).eq('sticker_id', stickerId)
      if (next !== null) {
        await supabase.from('user_stickers').insert({ user_id: userId, sticker_id: stickerId, status: next, quantity: 1 })
      }
    } catch {
      setStatusMap(prev => { const m = new Map(prev); m.set(stickerId, current); return m })
    } finally {
      setPendingIds(prev => { const s = new Set(prev); s.delete(stickerId); return s })
    }
  }, [userId, statusMap])

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
    statusMap.forEach(v => { if (v === 'have') have++; else if (v === 'need') need++ })
    return { have, need, total: dbStickers.length }
  }, [statusMap, dbStickers.length])

  const pct = stats.total > 0 ? Math.round((stats.have / 980) * 100) : 0

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
            opacity: 0.05,
            mixBlendMode: 'multiply',
            transform: 'translateY(8%)',
          }}
        />
      </div>

      {/* ── Header ── */}
      <div
        className="relative sticky top-0 z-20 border-b px-4 pt-4 pb-3 space-y-3"
        style={{ background: 'rgba(255,255,255,0.97)', borderColor: '#e8f4fd', boxShadow: '0 2px 8px rgba(116,172,223,0.08)' }}
      >
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(to right, transparent, #74ACDF 30%, #F5B700 50%, #74ACDF 70%, transparent)' }}
        />

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-black leading-none"
                style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
              >
                FIFA World Cup 2026
              </h1>
              <span className="text-sm tracking-wider" style={{ color: '#F5B700' }}>★★★</span>
            </div>
            <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#6b8caa' }}>
              Álbum Panini oficial · {stats.total} figuritas
            </p>
          </div>
          <div className="text-right">
            <span
              className="text-3xl font-black tabular-nums"
              style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#74ACDF' }}
            >
              {pct}%
            </span>
            <p className="text-[11px]" style={{ color: '#6b8caa' }}>completado</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full" style={{ background: '#e8f4fd' }}>
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
            { id: 'have' as const, label: 'Tengo',    count: stats.have,  countColor: '#2a5f8f' },
            { id: 'need' as const, label: 'Me falta', count: stats.need,  countColor: '#d97706' },
          ]).map(({ id, label, count, countColor }) => {
            const active = filter === id
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? '#eef6fd' : 'white',
                  border: `1px solid ${active ? '#a9d3f1' : '#e8f4fd'}`,
                  color: active ? '#1a2f45' : '#9ab5cc',
                }}
              >
                <span className="font-black" style={{ color: countColor ?? (active ? '#1a2f45' : '#9ab5cc') }}>
                  {count}
                </span>
                <span className="ml-1">{label}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#a9d3f1' }} />
          <input
            type="text"
            placeholder="Buscar selección..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: '#f8fbff', border: '1.5px solid #d4e9f8', color: '#1a2f45' }}
            onFocus={e => (e.target.style.borderColor = '#74ACDF')}
            onBlur={e  => (e.target.style.borderColor = '#d4e9f8')}
          />
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="relative z-10 flex items-center gap-4 px-4 py-2 text-[10px]" style={{ color: '#9ab5cc' }}>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded border-2" style={{ background: '#f0fdf4', borderColor: '#86efac' }} />
          Tengo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded border-2" style={{ background: '#fff7ed', borderColor: '#fdba74' }} />
          Me falta
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded border" style={{ background: '#f8fbff', borderColor: '#d4e9f8' }} />
          Sin marcar
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded border-2" style={{ background: '#fefce8', borderColor: '#fbbf24' }} />
          Foil
        </span>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 px-3 pb-24 space-y-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 h-52">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#d4e9f8', borderTopColor: '#74ACDF' }}
            />
            <span className="text-xs" style={{ color: '#6b8caa' }}>Cargando álbum...</span>
          </div>
        ) : (
          <>
            {/* FWC special section */}
            {filteredSections.has('FWC') && (
              <div>
                <div className="flex items-center gap-3 px-1 pt-4 pb-1">
                  <div className="h-px flex-1" style={{ background: 'rgba(245,183,0,0.3)' }} />
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full border shrink-0"
                    style={{ background: '#fffbeb', borderColor: '#fde68a' }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#d97706' }}>
                      ⚽ FWC Especiales
                    </span>
                  </div>
                  <div className="h-px flex-1" style={{ background: 'rgba(245,183,0,0.3)' }} />
                </div>
                <SectionAccordion
                  title="FWC"
                  stickers={filteredSections.get('FWC')!}
                  statusMap={statusMap}
                  pendingIds={pendingIds}
                  onTap={handleTap}
                  filter={filter}
                  isFwc
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
                  <div className="space-y-1 mt-1">
                    {teamSections.map(team => (
                      <SectionAccordion
                        key={team}
                        title={team}
                        stickers={filteredSections.get(team)!}
                        statusMap={statusMap}
                        pendingIds={pendingIds}
                        onTap={handleTap}
                        filter={filter}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Coca-Cola */}
            {filteredSections.has('Coca-Cola') && (
              <div>
                <div className="flex items-center gap-3 px-1 pt-4 pb-1">
                  <div className="h-px flex-1" style={{ background: 'rgba(239,68,68,0.2)' }} />
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.2em] shrink-0"
                    style={{ color: 'rgba(239,68,68,0.7)' }}
                  >
                    🥤 Coca-Cola
                  </span>
                  <div className="h-px flex-1" style={{ background: 'rgba(239,68,68,0.2)' }} />
                </div>
                <SectionAccordion
                  title="Coca-Cola"
                  stickers={filteredSections.get('Coca-Cola')!}
                  statusMap={statusMap}
                  pendingIds={pendingIds}
                  onTap={handleTap}
                  filter={filter}
                  isCoke
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
