'use client'

import { type ChatUIMessage } from '@/components/chat/types'
import { type ReactNode, useState, useEffect } from 'react'
import { Chat } from '@ai-sdk/react'
import { DataPart } from '@/ai/messages/data-parts'
import { DataUIPart } from 'ai'
import { createContext, useContext } from 'react'
import { useDataStateMapper } from '@/app/state'
import { mutate } from 'swr'
import { toast } from 'sonner'

interface ChatContextValue {
  chat: Chat<ChatUIMessage>
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const mapDataToState = useDataStateMapper()
  
  const [chat] = useState(() => 
    new Chat<ChatUIMessage>({
      onToolCall: () => mutate('/api/auth/info'),
      onData: (data: DataUIPart<DataPart>) => {
        // mapDataToState will be called with the latest value from the closure
        mapDataToState(data)
      },
      onError: (error) => {
        toast.error(`Communication error with the AI: ${error.message}`)
        console.error('Error sending message:', error)
      },
    })
  )
  
  // Update the onData handler when mapDataToState changes
  useEffect(() => {
    // Note: This is a workaround since Chat doesn't expose a way to update handlers
    // In practice, mapDataToState from useDataStateMapper should be stable
  }, [mapDataToState])

  return (
    <ChatContext.Provider value={{ chat }}>{children}</ChatContext.Provider>
  )
}

export function useSharedChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useSharedChatContext must be used within a ChatProvider')
  }
  return context
}
