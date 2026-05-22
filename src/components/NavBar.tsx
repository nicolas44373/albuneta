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
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t"
      style={{
        background: 'rgba(255,255,255,0.97)',
        borderColor: '#e8f4fd',
        boxShadow: '0 -2px 12px rgba(116,172,223,0.1)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(116,172,223,0.5) 30%, rgba(245,183,0,0.5) 50%, rgba(116,172,223,0.5) 70%, transparent)' }}
      />

      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all',
                !active && 'text-[#b8d5ea] hover:text-[#74ACDF]'
              )}
              style={active ? { color: '#74ACDF' } : undefined}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                style={active ? { filter: 'drop-shadow(0 0 6px rgba(116,172,223,0.5))' } : undefined}
              />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
