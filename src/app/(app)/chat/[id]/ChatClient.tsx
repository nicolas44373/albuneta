'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, Profile } from '@/lib/types'
import { getInitials, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ArrowLeft, Send, CheckCircle2, Star, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { completeTradeAction } from './actions'

type MsgWithSender = Message & { sender: Profile }

function RatingModal({
  otherUsername,
  matchId,
  onClose,
}: {
  otherUsername: string
  matchId: string
  onClose: () => void
}) {
  const [stars, setStars]     = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (stars === 0) return
    startTransition(async () => {
      const form = new FormData()
      form.set('matchId', matchId)
      form.set('score', String(stars))
      form.set('comment', comment)
      await completeTradeAction(form)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-6">
      <div
        className="w-full max-w-sm rounded-3xl p-6 space-y-5 border"
        style={{ background: 'white', borderColor: '#d4e9f8', boxShadow: '0 -4px 30px rgba(116,172,223,0.15)' }}
      >
        <div className="text-center space-y-1">
          <div className="text-3xl mb-2">🤝</div>
          <h2 className="text-lg font-black" style={{ fontFamily: 'var(--font-baloo2), system-ui', color: '#1a2f45' }}>
            ¿Completaste el canje?
          </h2>
          <p className="text-sm" style={{ color: '#6b8caa' }}>
            Calificá a <span style={{ color: '#1a2f45', fontWeight: 600 }}>{otherUsername}</span>
          </p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setStars(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                className={cn(
                  'transition-colors',
                  n <= (hovered || stars)
                    ? 'fill-yellow-400 text-yellow-400'
                    : ''
                )}
                style={n > (hovered || stars) ? { fill: '#d4e9f8', color: '#d4e9f8' } : undefined}
              />
            </button>
          ))}
        </div>
        {stars > 0 && (
          <p className="text-center text-sm" style={{ color: '#6b8caa' }}>
            {['', 'Muy mala experiencia', 'Podría mejorar', 'Normal', 'Buena experiencia', '¡Excelente! 🌟'][stars]}
          </p>
        )}

        {/* Comment */}
        <textarea
          placeholder="Comentario opcional..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl text-sm resize-none focus:outline-none"
          style={{
            background: '#f8fbff',
            border: '1.5px solid #d4e9f8',
            color: '#1a2f45',
          }}
          onFocus={e => (e.target.style.borderColor = '#74ACDF')}
          onBlur={e  => (e.target.style.borderColor = '#d4e9f8')}
        />

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl text-sm font-medium transition-colors border"
            style={{ background: '#eef6fd', borderColor: '#d4e9f8', color: '#2a5f8f' }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={stars === 0 || isPending}
            className="flex-1 h-11 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(116,172,223,0.3)',
            }}
          >
            {isPending ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const supabase = createClient()

export function ChatClient({
  chatId,
  matchId,
  matchStatus,
  currentUserId,
  other,
  stickersIGive,
  stickersIReceive,
  initialMessages,
}: {
  chatId: string
  matchId: string
  matchStatus: 'pending' | 'accepted' | 'completed' | 'cancelled'
  currentUserId: string
  other: Profile
  stickersIGive: number[]
  stickersIReceive: number[]
  initialMessages: MsgWithSender[]
}) {
  const [messages, setMessages]     = useState<MsgWithSender[]>(initialMessages)
  const [text, setText]             = useState('')
  const [sending, setSending]       = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [status, setStatus]         = useState(matchStatus)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log(`[chat] Subscribing to chat:${chatId}`)
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const newMsg = payload.new as Message
          console.log('[chat] Realtime message received:', newMsg)
          
          setMessages(prev => {
            // Evitar duplicados por ID
            if (prev.some(m => m.id === newMsg.id)) {
              return prev
            }
            
            const isMe = newMsg.sender_id === currentUserId
            
            // Si el mensaje es mío, e ingresa por realtime pero todavía tenemos el tempMsg de la inserción local
            if (isMe) {
              const hasTemp = prev.some(m => m.id.startsWith('temp-') && m.content === newMsg.content)
              if (hasTemp) {
                // Reemplazamos el temporal con el real de realtime
                return prev.map(m => m.id.startsWith('temp-') && m.content === newMsg.content ? { ...newMsg, sender: m.sender } : m)
              }
            }

            const sender = isMe ? { id: currentUserId, username: 'Vos', avatar_url: null } : other
            return [...prev, { ...newMsg, sender } as MsgWithSender]
          })
        }
      )
      .subscribe((status, err) => {
        console.log(`[chat] Realtime connection status: ${status}`, err || '')
      })

    return () => {
      console.log(`[chat] Unsubscribing from chat:${chatId}`)
      supabase.removeChannel(channel)
    }
  }, [chatId, other, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')

    // Crear un mensaje temporal para la UI optimista
    const tempId = `temp-${Date.now()}`
    const tempMsg: MsgWithSender = {
      id: tempId,
      chat_id: chatId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      sender: { id: currentUserId, username: 'Vos', avatar_url: null } as any
    }

    setMessages(prev => [...prev, tempMsg])

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, sender_id: currentUserId, content })
      .select()

    if (error) {
      console.error('[chat] Error sending message:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } else if (data && data.length > 0) {
      const realMsg = data[0]
      setMessages(prev => prev.map(m => m.id === tempId ? { ...realMsg, sender: tempMsg.sender } : m))
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: `real-${Date.now()}` } : m))
    }

    setSending(false)
  }

  const hasStickers = stickersIGive.length > 0 || stickersIReceive.length > 0
  const isCompleted = status === 'completed'

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 flex flex-col bg-white">

      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: '#e8f4fd', background: 'white' }}
      >
        <Link
          href="/chat"
          className="p-1.5 rounded-lg border transition-colors"
          style={{ background: 'white', borderColor: '#d4e9f8' }}
        >
          <ArrowLeft size={20} style={{ color: '#74ACDF' }} />
        </Link>
        <Link href={`/profile/${other.id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border-2"
            style={{ background: '#eef6fd', borderColor: '#a9d3f1', color: '#2a5f8f' }}
          >
            {other.avatar_url
              ? <img src={other.avatar_url} alt={other.username} className="w-full h-full object-cover" />
              : getInitials(other.username)
            }
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: '#1a2f45' }}>{other.username}</p>
            {other.city && <p className="text-[10px] mt-0.5" style={{ color: '#9ab5cc' }}>{other.city}</p>}
          </div>
        </Link>

        {isCompleted ? (
          <span className="flex items-center gap-1 text-xs font-medium shrink-0" style={{ color: '#16a34a' }}>
            <CheckCircle2 size={14} className="fill-current" />
            Completado
          </span>
        ) : (
          <button
            onClick={() => setShowRating(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border"
            style={{ background: '#eef6fd', borderColor: '#a9d3f1', color: '#2a5f8f' }}
          >
            <CheckCircle2 size={13} />
            Completar
          </button>
        )}
      </div>

      {/* ── Stickers banner (collapsible) ── */}
      {hasStickers && (
        <button
          onClick={() => setShowStickers(s => !s)}
          className="flex items-center justify-between px-4 py-2 border-b text-xs shrink-0"
          style={{ background: '#f8fbff', borderColor: '#e8f4fd', color: '#5b7a93' }}
        >
          <span className="font-medium">
            {stickersIGive.length} que le dás · {stickersIReceive.length} que recibís
          </span>
          {showStickers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      )}
      {hasStickers && showStickers && (
        <div
          className="px-4 py-3 border-b grid grid-cols-2 gap-3 shrink-0"
          style={{ background: '#eef6fd', borderColor: '#e8f4fd' }}
        >
          <div>
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#2a5f8f' }}>Le dás</p>
            <div className="flex flex-wrap gap-1">
              {stickersIGive.slice(0, 20).map(n => (
                <span
                  key={n}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: '#d4e9f8', color: '#2a5f8f' }}
                >
                  {n}
                </span>
              ))}
              {stickersIGive.length > 20 && (
                <span className="text-[10px]" style={{ color: '#9ab5cc' }}>+{stickersIGive.length - 20} más</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold mb-1.5 text-amber-600">Recibís</p>
            <div className="flex flex-wrap gap-1">
              {stickersIReceive.slice(0, 20).map(n => (
                <span
                  key={n}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: '#fef3c7', color: '#d97706' }}
                >
                  {n}
                </span>
              ))}
              {stickersIReceive.length > 20 && (
                <span className="text-[10px]" style={{ color: '#9ab5cc' }}>+{stickersIReceive.length - 20} más</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-10">
            <div className="text-4xl">👋</div>
            <p className="text-sm" style={{ color: '#6b8caa' }}>Saludá y coordiná el intercambio</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const senderId = msg.sender_id || (Array.isArray(msg.sender) ? msg.sender[0]?.id : msg.sender?.id)
          const isMe = !!currentUserId && !!senderId && senderId === currentUserId
          const prevMsg = messages[i - 1]
          const showTime = !prevMsg ||
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000

          return (
            <div key={msg.id} className="space-y-1.5">
              {showTime && (
                <p className="text-center text-[10px] my-3 font-semibold" style={{ color: '#9ab5cc' }}>
                  {formatDate(msg.created_at)}
                </p>
              )}
              <div className={cn('flex items-end gap-2 w-full', isMe ? 'justify-end' : 'justify-start')}>
                {!isMe && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 overflow-hidden border-2 mb-0.5"
                    style={{ background: '#eef6fd', borderColor: '#a9d3f1', color: '#2a5f8f' }}
                  >
                    {other.avatar_url ? (
                      <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(other.username)
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-all',
                    isMe
                      ? 'rounded-br-sm text-white bg-gradient-to-br from-[#74ACDF] to-[#5b96cc]'
                      : 'rounded-bl-sm text-[#1a2f45] bg-[#f0f6fa] border border-[#d4e9f8]'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      {!isCompleted ? (
        <form
          onSubmit={sendMessage}
          className="flex items-center gap-2 px-3 py-3 border-t shrink-0"
          style={{ borderColor: '#e8f4fd', background: 'white' }}
        >
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 h-10 px-4 rounded-xl text-sm focus:outline-none"
            style={{ background: '#f8fbff', border: '1.5px solid #d4e9f8', color: '#1a2f45' }}
            onFocus={e => (e.target.style.borderColor = '#74ACDF')}
            onBlur={e  => (e.target.style.borderColor = '#d4e9f8')}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #74ACDF 0%, #5b96cc 100%)',
              boxShadow: '0 2px 6px rgba(116,172,223,0.35)',
            }}
          >
            <Send size={16} className="text-white" />
          </button>
        </form>
      ) : (
        <div
          className="px-4 py-3 border-t text-center shrink-0"
          style={{ borderColor: '#e8f4fd' }}
        >
          <p className="text-xs" style={{ color: '#9ab5cc' }}>Este intercambio fue completado</p>
        </div>
      )}

      {/* ── Rating modal ── */}
      {showRating && (
        <RatingModal
          otherUsername={other.username}
          matchId={matchId}
          onClose={() => setShowRating(false)}
        />
      )}
    </div>
  )
}
