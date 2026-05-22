'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, CalendarDays, Zap, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/album',   label: 'Álbum',  icon: BookOpen },
  { href: '/fixture', label: 'Fixture', icon: CalendarDays },
  { href: '/matches', label: 'Matches', icon: Zap },
  { href: '/chat',    label: 'Chat',    icon: MessageCircle },
  { href: '/profile', label: 'Perfil',  icon: User },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-premium border-t transition-all duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.88)',
        borderColor: '#d4e9f8',
        boxShadow: '0 -4px 20px rgba(116, 172, 223, 0.12)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: 'linear-gradient(to right, transparent, #74ACDF 25%, #F5B700 50%, #74ACDF 75%, transparent)',
        }}
      />

      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 w-14 h-12 rounded-xl transition-all duration-300 select-none',
                active
                  ? 'scale-105 font-bold text-[#2a5f8f]'
                  : 'text-[#5b7a93] hover:text-[#2a5f8f] hover:scale-102'
              )}
            >
              {active && (
                <span
                  className="absolute -top-[2px] w-8 h-[3px] rounded-full"
                  style={{
                    background: 'linear-gradient(to right, #74ACDF, #F5B700)',
                    boxShadow: '0 1px 6px rgba(116,172,223,0.6)',
                  }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2.0}
                className="transition-transform duration-300"
                style={active ? { filter: 'drop-shadow(0 0 6px rgba(116,172,223,0.45))', color: '#74ACDF' } : undefined}
              />
              <span
                className={cn(
                  'text-[9px] tracking-wide transition-colors leading-none',
                  active ? 'font-black text-[#1a2f45]' : 'font-semibold text-[#5b7a93]'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
