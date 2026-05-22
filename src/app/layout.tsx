import type { Metadata } from 'next'
import { Baloo_2, Nunito } from 'next/font/google'
import './globals.css'

const baloo2 = Baloo_2({
  subsets: ['latin'],
  variable: '--font-baloo2',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Albuneta — Intercambiá figuritas',
  description: 'Encontrá con quién intercambiar figuritas del Mundial 2026. Cargá tus repetidas, tus faltantes y matcheá con coleccionistas cerca tuyo.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${baloo2.variable} ${nunito.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-[#1a2f45] antialiased">
        {children}
      </body>
    </html>
  )
}
