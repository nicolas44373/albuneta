import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const features = [
  {
    icon: '🎯',
    title: 'Marcá tus figuritas',
    desc: 'Tengo · Me falta. Dos toques y tu álbum queda actualizado.',
  },
  {
    icon: '⚡',
    title: 'Matching automático',
    desc: 'El sistema detecta quién tiene lo que te falta y necesita lo que tenés.',
  },
  {
    icon: '💬',
    title: 'Coordiná el intercambio',
    desc: 'Chateá, acordá el punto de encuentro y completá el canje.',
  },
  {
    icon: '⭐',
    title: 'Reputación real',
    desc: 'Calificaciones honestas para evitar plantones y asegurar buenos intercambios.',
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/album')

  return (
    <main className="flex flex-col min-h-screen overflow-x-hidden bg-white">

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #eef6fd 0%, #f4f9fe 60%, white 100%)' }}
      >
        {/* Jersey stripes */}
        <div className="absolute inset-0 jersey-stripes pointer-events-none" />

        {/* Messi topo gigio */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Silueta topo Gigio de Lionel Messi argentina.jpg"
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          style={{
            objectFit: 'contain',
            objectPosition: 'center bottom',
            opacity: 0.07,
            mixBlendMode: 'multiply',
          }}
        />

        {/* Glow blob */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(116,172,223,0.2) 0%, transparent 70%)' }}
        />

        {/* 3 stars */}
        <div className="relative z-10 flex gap-3 mb-5">
          {['★', '★', '★'].map((s, i) => (
            <span key={i} className="text-2xl leading-none" style={{ color: '#F5B700', textShadow: '0 0 10px rgba(245,183,0,0.4)' }}>
              {s}
            </span>
          ))}
        </div>

        {/* Live badge */}
        <div
          className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border"
          style={{ background: '#eef6fd', borderColor: '#a9d3f1', color: '#2a5f8f' }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#74ACDF' }} />
          FIFA World Cup 2026 · Fase de grupos
        </div>

        {/* Headline */}
        <h1
          className="relative z-10 text-5xl sm:text-6xl font-black tracking-tight leading-[0.95] mb-4 max-w-sm"
          style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}
        >
          COMPLETÁ
          <br />
          <span className="italic" style={{ color: '#74ACDF' }}>TU ÁLBUM</span>
          <br />
          MUNDIALISTA
        </h1>

        <p className="relative z-10 text-base max-w-xs mb-10 leading-relaxed" style={{ color: '#5b7a93' }}>
          Cargá tus repetidas, marcá las que te faltan y encontrá con quién intercambiar en tu ciudad.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href="/auth/login"
            className="flex-1 flex items-center justify-center h-12 rounded-xl font-black text-base transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(116,172,223,0.35)',
            }}
          >
            Empezar gratis
          </Link>
          <Link
            href="/auth/login"
            className="flex-1 flex items-center justify-center h-12 rounded-xl font-semibold text-base transition-all hover:bg-[#eef6fd]"
            style={{ background: 'white', border: '2px solid #d4e9f8', color: '#2a5f8f' }}
          >
            Iniciar sesión
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 pb-12">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          {[
            { n: '980',  label: 'figuritas' },
            { n: '48',   label: 'selecciones' },
            { n: '100%', label: 'gratis' },
          ].map(({ n, label }) => (
            <div
              key={label}
              className="text-center p-4 rounded-2xl border"
              style={{ background: 'white', borderColor: '#d4e9f8', boxShadow: '0 2px 8px rgba(116,172,223,0.08)' }}
            >
              <div
                className="text-2xl font-black"
                style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#F5B700' }}
              >
                {n}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#6b8caa' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 pb-20">
        <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-2xl border"
              style={{ background: 'white', borderColor: '#d4e9f8', boxShadow: '0 2px 8px rgba(116,172,223,0.06)' }}
            >
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-bold mb-1" style={{ color: '#1a2f45' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6b8caa' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <section
        className="mt-auto px-6 py-10 text-center border-t"
        style={{ borderColor: '#e8f4fd' }}
      >
        <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#9ab5cc' }}>
          Hecho en Argentina 🇦🇷 · Tres estrellas · MÁS PASIÓN
        </p>
      </section>
    </main>
  )
}
