'use client'

import { useFormStatus } from 'react-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { startChatAction } from './actions'

type ChatButtonProps = {
  otherUserId: string
}

export function ChatButton({ otherUserId }: ChatButtonProps) {
  const { pending } = useFormStatus()

  return (
    <form action={startChatAction} className="flex-1">
      <input type="hidden" name="otherUserId" value={otherUserId} />
      <button
        type="submit"
        disabled={pending}
        className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-bold transition-all disabled:opacity-75 select-none cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(116,172,223,0.3)',
        }}
      >
        {pending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Cargando...</span>
          </>
        ) : (
          <>
            <span>Chatear</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  )
}
