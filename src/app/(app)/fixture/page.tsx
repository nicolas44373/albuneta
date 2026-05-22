'use client'

import { useState, useMemo } from 'react'
import { FIXTURE, WC2026_GROUPS } from '@/data/wc2026'

const MONTH_LABELS: Record<string, string> = { '06': 'Jun', '07': 'Jul' }

function formatDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${MONTH_LABELS[m] ?? m}`
}

function MatchCard({ team1, team2, date, venue, city }: {
  team1: string; team2: string; date: string; venue: string; city: string
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
      style={{ background: 'white', borderColor: '#d4e9f8' }}
    >
      {/* Date */}
      <div
        className="w-11 text-center shrink-0 rounded-lg py-1"
        style={{ background: '#eef6fd' }}
      >
        <p className="text-xs font-black leading-none" style={{ color: '#2a5f8f' }}>
          {formatDate(date)}
        </p>
      </div>

      {/* Teams */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold truncate flex-1 text-right" style={{ color: '#1a2f45' }}>
            {team1}
          </span>
          <span
            className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0"
            style={{ background: '#fffbeb', color: '#d97706' }}
          >
            vs
          </span>
          <span className="text-sm font-bold truncate flex-1" style={{ color: '#1a2f45' }}>
            {team2}
          </span>
        </div>
        <p className="text-[10px] text-center mt-0.5 truncate" style={{ color: '#9ab5cc' }}>
          {venue} · {city}
        </p>
      </div>
    </div>
  )
}

export default function FixturePage() {
  const [activeGroup, setActiveGroup] = useState('A')

  const matchesByGroup = useMemo(() => {
    const map = new Map<string, typeof FIXTURE>()
    for (const g of WC2026_GROUPS) {
      map.set(g.group, FIXTURE.filter(m => m.group === g.group))
    }
    return map
  }, [])

  const currentMatches = matchesByGroup.get(activeGroup) ?? []
  const teamsInGroup   = WC2026_GROUPS.find(g => g.group === activeGroup)?.teams ?? []

  const byDate = useMemo(() => {
    const map = new Map<string, typeof FIXTURE>()
    for (const m of currentMatches) {
      if (!map.has(m.date)) map.set(m.date, [])
      map.get(m.date)!.push(m)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [currentMatches])

  return (
    <div className="relative flex flex-col min-h-screen bg-white">

      {/* Messi topo gigio */}
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

        <div>
          <div className="flex items-center gap-2">
            <h1
              className="text-lg font-black leading-none"
              style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
            >
              Fixture
            </h1>
            <span className="text-sm" style={{ color: '#F5B700' }}>★★★</span>
          </div>
          <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#6b8caa' }}>
            FIFA World Cup 2026 · Fase de grupos
          </p>
        </div>

        {/* Group tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {WC2026_GROUPS.map(({ group }) => {
            const active = activeGroup === group
            return (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className="shrink-0 w-9 h-9 rounded-xl text-sm font-black transition-all"
                style={
                  active
                    ? { background: '#74ACDF', color: 'white', boxShadow: '0 2px 8px rgba(116,172,223,0.35)' }
                    : { background: '#eef6fd', color: '#5b7a93', border: '1px solid #d4e9f8' }
                }
              >
                {group}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 px-3 py-3 space-y-4 pb-24">

        {/* Teams in group */}
        <div
          className="rounded-2xl px-4 py-3 border"
          style={{ background: '#eef6fd', borderColor: '#a9d3f1', borderLeft: '3px solid #74ACDF' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: '#6b8caa' }}>
            Grupo {activeGroup}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {teamsInGroup.map((team, i) => (
              <div key={team} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{ background: '#d4e9f8', color: '#2a5f8f' }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium truncate" style={{ color: '#1a2f45' }}>{team}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Matches by date */}
        <div className="space-y-4">
          {byDate.map(([date, matches]) => (
            <div key={date} className="space-y-1.5">
              {/* Date separator */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: 'rgba(116,172,223,0.2)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em] px-2"
                  style={{ color: '#5b96cc' }}
                >
                  {formatDate(date)}
                </span>
                <div className="h-px flex-1" style={{ background: 'rgba(116,172,223,0.2)' }} />
              </div>
              {matches.map((m, i) => (
                <MatchCard
                  key={i}
                  team1={m.team1}
                  team2={m.team2}
                  date={m.date}
                  venue={m.venue}
                  city={m.city}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
