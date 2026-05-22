'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import { getInitials } from '@/lib/utils'
import { X } from 'lucide-react'

type ToastData = {
  id: string
  senderName: string
  avatarUrl: string | null
  content: string
  chatId: string
}

type RealtimeNotificationContextType = {
  unreadChatIds: string[]
  markAsRead: (chatId: string) => void
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType | undefined>(undefined)

export function useRealtimeNotifications() {
  const context = useContext(RealtimeNotificationContext)
  if (!context) {
    throw new Error('useRealtimeNotifications must be used within a RealtimeNotificationProvider')
  }
  return context
}

const supabase = createClient()

export function RealtimeNotificationProvider({
  children,
  currentUserId,
}: {
  children: React.ReactNode
  currentUserId: string
}) {
  const [unreadChatIds, setUnreadChatIds] = useState<string[]>([])
  const [activeChats, setActiveChats] = useState<Map<string, { otherName: string; otherAvatar: string | null }>>(new Map())
  const [toast, setToast] = useState<ToastData | null>(null)
  
  const pathname = usePathname()
  const router = useRouter()

  // 1. Fetch user's chats and determine which are unread
  const loadChats = async () => {
    if (!currentUserId) return

    const { data: rows, error } = await supabase
      .from('chats')
      .select(`
        id,
        matches (
          user_a,
          user_b,
          profile_a:profiles!matches_user_a_fkey ( id, username, avatar_url ),
          profile_b:profiles!matches_user_b_fkey ( id, username, avatar_url )
        )
      `)

    if (error) {
      console.error('[notifications] Error loading chats:', error)
      return
    }

    const chatMap = new Map<string, { otherName: string; otherAvatar: string | null }>()
    
    rows?.forEach((row: any) => {
      const match = Array.isArray(row.matches) ? row.matches[0] : row.matches
      if (!match) return
      
      if (match.user_a === currentUserId || match.user_b === currentUserId) {
        const profileA = Array.isArray(match.profile_a) ? match.profile_a[0] : match.profile_a
        const profileB = Array.isArray(match.profile_b) ? match.profile_b[0] : match.profile_b
        const other = match.user_a === currentUserId ? profileB : profileA
        
        if (other) {
          chatMap.set(row.id, {
            otherName: other.username,
            otherAvatar: other.avatar_url,
          })
        }
      }
    })

    setActiveChats(chatMap)
  }

  useEffect(() => {
    loadChats()
  }, [currentUserId])

  // 2. Clear unread messages when user enters a specific chat
  useEffect(() => {
    // pathname format: /chat/[chatId]
    const match = pathname.match(/^\/chat\/([a-f0-9-]+)$/i)
    if (match) {
      const currentChatId = match[1]
      setUnreadChatIds(prev => prev.filter(id => id !== currentChatId))
      
      // If the current toast is for this chat, close it
      if (toast && toast.chatId === currentChatId) {
        setToast(null)
      }
    }
  }, [pathname, toast])

  // 3. Realtime subscription to messages
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('global-realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const newMsg = payload.new as { id: string; chat_id: string; sender_id: string; content: string }
          
          // Skip if message is ours
          if (newMsg.sender_id === currentUserId) return

          // Check if we are currently looking at this chat
          const chatMatch = pathname.match(/^\/chat\/([a-f0-9-]+)$/i)
          const isViewingThisChat = chatMatch ? chatMatch[1] === newMsg.chat_id : false
          if (isViewingThisChat) return

          // Resolve sender info
          let senderInfo = activeChats.get(newMsg.chat_id)

          // If chat not cached yet (e.g. newly created chat), fetch it from Supabase
          if (!senderInfo) {
            const { data: chatData } = await supabase
              .from('chats')
              .select(`
                id,
                matches (
                  user_a,
                  user_b,
                  profile_a:profiles!matches_user_a_fkey ( id, username, avatar_url ),
                  profile_b:profiles!matches_user_b_fkey ( id, username, avatar_url )
                )
              `)
              .eq('id', newMsg.chat_id)
              .maybeSingle()

            const match = chatData?.matches ? (Array.isArray(chatData.matches) ? chatData.matches[0] : chatData.matches) : null
            if (match && (match.user_a === currentUserId || match.user_b === currentUserId)) {
              const profileA = Array.isArray(match.profile_a) ? match.profile_a[0] : match.profile_a
              const profileB = Array.isArray(match.profile_b) ? match.profile_b[0] : match.profile_b
              const other = match.user_a === currentUserId ? profileB : profileA
              if (other) {
                senderInfo = { otherName: other.username, otherAvatar: other.avatar_url }
                setActiveChats(prev => {
                  const m = new Map(prev)
                  m.set(newMsg.chat_id, senderInfo!)
                  return m
                })
              }
            }
          }

          // If the message is for a chat we participate in
          if (senderInfo) {
            // Update unread state
            setUnreadChatIds(prev => {
              if (prev.includes(newMsg.chat_id)) return prev
              return [...prev, newMsg.chat_id]
            })

            // Trigger visual toast banner
            setToast({
              id: newMsg.id,
              senderName: senderInfo.otherName,
              avatarUrl: senderInfo.otherAvatar,
              content: newMsg.content,
              chatId: newMsg.chat_id,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, activeChats, pathname])

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      setToast(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [toast])

  function markAsRead(chatId: string) {
    setUnreadChatIds(prev => prev.filter(id => id !== chatId))
  }

  return (
    <RealtimeNotificationContext.Provider value={{ unreadChatIds, markAsRead }}>
      {children}

      {/* Floating In-App Toast Banner */}
      {toast && (
        <div className="fixed top-4 inset-x-4 z-50 flex justify-center pointer-events-none animate-modal-in">
          <div
            onClick={() => {
              router.push(`/chat/${toast.chatId}`)
              setToast(null)
            }}
            className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border shadow-xl cursor-pointer pointer-events-auto active:scale-98 transition-transform select-none"
            style={{
              borderColor: '#a9d3f1',
              boxShadow: '0 8px 30px rgba(116,172,223,0.22)',
            }}
          >
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 overflow-hidden"
              style={{ background: '#eef6fd', borderColor: '#a9d3f1', color: '#2a5f8f' }}
            >
              {toast.avatarUrl ? (
                <img src={toast.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                getInitials(toast.senderName)
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#1a2f45] leading-tight flex items-center gap-1.5">
                <span>{toast.senderName}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#74ACDF]" />
                <span className="text-[10px] font-medium text-[#9ab5cc]">Mensaje nuevo</span>
              </p>
              <p className="text-xs text-[#5b7a93] truncate mt-0.5 leading-snug">
                {toast.content}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setToast(null)
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </RealtimeNotificationContext.Provider>
  )
}
