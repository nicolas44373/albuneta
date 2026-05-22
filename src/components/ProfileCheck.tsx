'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

type ProfileCheckProps = {
  province: string | null
  city: string | null
  children: React.ReactNode
}

export function ProfileCheck({ province, city, children }: ProfileCheckProps) {
  const pathname = usePathname()
  const router = useRouter()
  
  const isIncomplete = !province?.trim() || !city?.trim()
  const isEditing = pathname === '/profile/edit'

  useEffect(() => {
    if (isIncomplete && !isEditing) {
      router.replace('/profile/edit?setup=true')
    }
  }, [isIncomplete, isEditing, router])

  if (isIncomplete && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#74ACDF] mb-4"></div>
        <p className="text-sm font-semibold text-[#1a2f45] animate-pulse">
          Redirigiendo para configurar tu perfil...
        </p>
      </div>
    )
  }

  return <>{children}</>
}
