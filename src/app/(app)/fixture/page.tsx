'use client'

import { useState, useMemo, useEffect } from 'react'
import { FIXTURE, WC2026_GROUPS } from '@/data/wc2026'

const MONTH_LABELS: Record<string, string> = { '06': 'Jun', '07': 'Jul' }

function formatDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${parseInt(d)} ${MONTH_LABELS[m] ?? m}`
}

function MatchCard({
  team1,
  team2,
  date,
  venue,
  city,
  score1,
  score2,
  onScore1Change,
  onScore2Change
}: {
  team1: string
  team2: string
  date: string
  venue: string
  city: string
  score1: string
  score2: string
  onScore1Change: (val: string) => void
  onScore2Change: (val: string) => void
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border relative overflow-hidden"
      style={{ background: 'white', borderColor: '#d4e9f8' }}
    >
      {/* Date badge */}
      <div
        className="w-11 text-center shrink-0 rounded-lg py-1.5"
        style={{ background: '#eef6fd' }}
      >
        <p className="text-[10px] font-black uppercase tracking-wider leading-none" style={{ color: '#2a5f8f' }}>
          {formatDate(date).split(' ')[1]}
        </p>
        <p className="text-base font-black leading-none mt-0.5" style={{ color: '#1a2f45' }}>
          {formatDate(date).split(' ')[0]}
        </p>
      </div>

      {/* Teams and Inputs */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          {/* Team 1 */}
          <span className="text-xs sm:text-sm font-bold truncate flex-1 text-right text-[#1a2f45]">
            {team1}
          </span>
          
          {/* Score Inputs */}
          <div className="flex items-center gap-1 shrink-0 px-1">
            <input
              type="number"
              min="0"
              max="99"
              placeholder="-"
              value={score1}
              onChange={(e) => onScore1Change(e.target.value)}
              className="w-9 h-8 text-center text-sm font-extrabold rounded-lg border border-[#d4e9f8] focus:border-[#74ACDF] focus:ring-2 focus:ring-[#74ACDF]/20 outline-none text-[#1a2f45] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-[#f8fbff]"
            />
            <span className="text-[10px] font-black text-[#9ab5cc] px-0.5">vs</span>
            <input
              type="number"
              min="0"
              max="99"
              placeholder="-"
              value={score2}
              onChange={(e) => onScore2Change(e.target.value)}
              className="w-9 h-8 text-center text-sm font-extrabold rounded-lg border border-[#d4e9f8] focus:border-[#74ACDF] focus:ring-2 focus:ring-[#74ACDF]/20 outline-none text-[#1a2f45] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-[#f8fbff]"
            />
          </div>

          {/* Team 2 */}
          <span className="text-xs sm:text-sm font-bold truncate flex-1 text-left text-[#1a2f45]">
            {team2}
          </span>
        </div>
        
        {/* Match details */}
        <p className="text-[9px] text-center mt-1 truncate text-[#9ab5cc] font-medium">
          {venue} · {city}
        </p>
      </div>
    </div>
  )
}

export default function FixturePage() {
  const [activeGroup, setActiveGroup] = useState('A')
  const [predictions, setPredictions] = useState<Record<string, { score1: number | null; score2: number | null }>>({})
  const [hydrated, setHydrated] = useState(false)

  // Load predictions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('albuneta_fixture_predictions')
      if (stored) {
        setPredictions(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Error loading predictions:', e)
    }
    setHydrated(true)
  }, [])

  const matchesByGroup = useMemo(() => {
    const map = new Map<string, typeof FIXTURE>()
    for (const g of WC2026_GROUPS) {
      map.set(g.group, FIXTURE.filter(m => m.group === g.group))
    }
    return map
  }, [])

  const currentMatches = matchesByGroup.get(activeGroup) ?? []
  const teamsInGroup   = WC2026_GROUPS.find(g => g.group === activeGroup)?.teams ?? []

  // Update predicted score and save to localStorage
  const updateScore = (matchKey: string, index: 1 | 2, value: string) => {
    const parsed = value.trim() === '' ? null : parseInt(value)
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) return

    setPredictions(prev => {
      const current = prev[matchKey] || { score1: null, score2: null }
      const updated = {
        ...prev,
        [matchKey]: {
          score1: index === 1 ? parsed : current.score1,
          score2: index === 2 ? parsed : current.score2
        }
      }
      try {
        localStorage.setItem('albuneta_fixture_predictions', JSON.stringify(updated))
      } catch (e) {
        console.error('Error saving predictions:', e)
      }
      return updated
    })
  }

  // Reset all predictions for the active group
  const handleResetGroup = () => {
    setPredictions(prev => {
      const updated = { ...prev }
      for (const key of Object.keys(updated)) {
        if (key.startsWith(`${activeGroup}_`)) {
          delete updated[key]
        }
      }
      try {
        localStorage.setItem('albuneta_fixture_predictions', JSON.stringify(updated))
      } catch (e) {
        console.error('Error saving predictions:', e)
      }
      return updated
    })
  }

  type TeamStanding = {
    team: string
    pj: number
    g: number
    e: number
    p: number
    gf: number
    gc: number
    dg: number
    pts: number
  }

  // Calculate standings
  const standings = useMemo(() => {
    const stats: Record<string, TeamStanding> = {}
    for (const team of teamsInGroup) {
      stats[team] = {
        team,
        pj: 0,
        g: 0,
        e: 0,
        p: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0
      }
    }

    if (hydrated) {
      for (const match of currentMatches) {
        const key = `${activeGroup}_${match.team1}_vs_${match.team2}`
        const pred = predictions[key]
        if (pred && pred.score1 !== null && pred.score2 !== null) {
          const s1 = pred.score1
          const s2 = pred.score2

          const t1 = stats[match.team1]
          const t2 = stats[match.team2]

          if (t1 && t2) {
            t1.pj += 1
            t2.pj += 1
            t1.gf += s1
            t1.gc += s2
            t2.gf += s2
            t2.gc += s1
            t1.dg = t1.gf - t1.gc
            t2.dg = t2.gf - t2.gc

            if (s1 > s2) {
              t1.pts += 3
              t1.g += 1
              t2.p += 1
            } else if (s2 > s1) {
              t2.pts += 3
              t2.g += 1
              t1.p += 1
            } else {
              t1.pts += 1
              t2.pts += 1
              t1.e += 1
              t2.e += 1
            }
          }
        }
      }
    }

    return Object.values(stats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts
      if (b.dg !== a.dg) return b.dg - a.dg
      if (b.gf !== a.gf) return b.gf - a.gf
      return a.team.localeCompare(b.team)
    })
  }, [teamsInGroup, currentMatches, predictions, activeGroup, hydrated])

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

      {/* Messi topo gigio water mark */}
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
        className="relative sticky top-0 z-20 border-b px-4 pt-4 pb-3 space-y-3 bg-white/95 backdrop-blur-md"
        style={{ borderColor: '#e8f4fd', boxShadow: '0 2px 8px rgba(116,172,223,0.08)' }}
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

        {/* Standings Table Card */}
        <div
          className="rounded-2xl border overflow-hidden bg-white shadow-sm"
          style={{ borderColor: '#d4e9f8' }}
        >
          {/* Table Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ background: '#eef6fd', borderColor: '#d4e9f8' }}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#2a5f8f' }}>
                Posiciones de Grupo
              </p>
              <h2 className="text-xs font-bold text-[#5b7a93] mt-0.5">
                Simulador interactivo · Grupo {activeGroup}
              </h2>
            </div>
            {/* Reset button */}
            <button
              onClick={handleResetGroup}
              className="text-[10px] font-black px-2.5 py-1.5 rounded-lg border transition-all hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1 bg-white border-red-200 text-red-500"
            >
              <span>Reiniciar Grupo</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[9px] font-black uppercase tracking-wider text-[#6b8caa] bg-[#f8fbff]" style={{ borderColor: '#e8f4fd' }}>
                  <th className="py-2.5 pl-3 w-8 text-center">Pos</th>
                  <th className="py-2.5 px-2">Equipo</th>
                  <th className="py-2.5 px-1.5 text-center w-8">PJ</th>
                  <th className="py-2.5 px-1.5 text-center w-7 hidden sm:table-cell">G</th>
                  <th className="py-2.5 px-1.5 text-center w-7 hidden sm:table-cell">E</th>
                  <th className="py-2.5 px-1.5 text-center w-7 hidden sm:table-cell">P</th>
                  <th className="py-2.5 px-1.5 text-center w-9 hidden sm:table-cell font-mono">GF:GC</th>
                  <th className="py-2.5 px-1.5 text-center w-8">DG</th>
                  <th className="py-2.5 pr-3 text-center w-10">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8f4fd]">
                {standings.map((row, index) => {
                  const isQualifying = index < 2
                  return (
                    <tr
                      key={row.team}
                      className={`text-xs transition-colors hover:bg-slate-50/50 ${
                        isQualifying
                          ? 'border-l-4 border-l-emerald-500'
                          : 'border-l-4 border-l-transparent'
                      }`}
                    >
                      <td className="py-3 pl-3 text-center font-bold text-slate-500">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold ${
                          isQualifying ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-bold text-[#1a2f45] truncate max-w-[120px]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{row.team}</span>
                          {isQualifying && (
                            <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-emerald-100 text-emerald-700 shrink-0 tracking-wide scale-90 origin-left">
                              Q
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-1.5 text-center font-semibold text-slate-600">{row.pj}</td>
                      <td className="py-3 px-1.5 text-center text-slate-500 hidden sm:table-cell">{row.g}</td>
                      <td className="py-3 px-1.5 text-center text-slate-500 hidden sm:table-cell">{row.e}</td>
                      <td className="py-3 px-1.5 text-center text-slate-500 hidden sm:table-cell">{row.p}</td>
                      <td className="py-3 px-1.5 text-center text-slate-500 hidden sm:table-cell font-mono text-[10px]">
                        {row.gf}:{row.gc}
                      </td>
                      <td className={`py-3 px-1.5 text-center font-bold font-mono text-[10px] ${
                        row.dg > 0 ? 'text-emerald-600' : row.dg < 0 ? 'text-rose-600' : 'text-slate-400'
                      }`}>
                        {row.dg > 0 ? `+${row.dg}` : row.dg}
                      </td>
                      <td className="py-3 pr-3 text-center font-black text-sm text-[#2a5f8f] bg-[#f8fbff]/50">
                        {row.pts}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Matches list by date */}
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
              {matches.map((m, i) => {
                const matchKey = `${activeGroup}_${m.team1}_vs_${m.team2}`
                const pred = predictions[matchKey] || { score1: null, score2: null }
                return (
                  <MatchCard
                    key={i}
                    team1={m.team1}
                    team2={m.team2}
                    date={m.date}
                    venue={m.venue}
                    city={m.city}
                    score1={!hydrated || pred.score1 === null ? '' : String(pred.score1)}
                    score2={!hydrated || pred.score2 === null ? '' : String(pred.score2)}
                    onScore1Change={(val) => updateScore(matchKey, 1, val)}
                    onScore2Change={(val) => updateScore(matchKey, 2, val)}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
