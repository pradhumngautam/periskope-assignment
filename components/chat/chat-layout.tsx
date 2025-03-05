"use client"

import { useState, useEffect } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Sidebar } from "./sidebar"
import { ChatWindow } from "./chat-window"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useIndexedDB } from "@/hooks/use-indexed-db"
import { toast } from "sonner"
import type { User, Chat, Message } from "@/types"

interface ChatLayoutProps {
  currentUser: User
}

export default function ChatLayout({ currentUser }: ChatLayoutProps) {
  const supabase = useSupabaseClient()
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const { getItem, setItem } = useLocalStorage()
  const { storeMessages, getMessages, storeChats, getChats } = useIndexedDB()

  // Load chats from IndexedDB first, then from Supabase
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Try to load from IndexedDB first
        const cachedChats = await getChats()
        if (cachedChats && cachedChats.length > 0) {
          setChats(cachedChats)

          // Try to restore selected chat from localStorage
          const savedChatId = getItem("selectedChatId")
          if (savedChatId) {
            const savedChat = cachedChats.find((chat) => chat.id === savedChatId)
            if (savedChat) {
              setSelectedChat(savedChat)
            }
          }
        }

        // Then fetch from Supabase
        const { data, error } = await supabase
          .from("chats")
          .select(`
            *,
            chat_participants!inner(user_id),
            chat_labels(
              *,
              labels(*)
            )
          `)
          .eq("chat_participants.user_id", currentUser.id)
          .order("updated_at", { ascending: false })

        if (error) {
          throw error
        }

        if (data) {
          // Process the data to match our Chat type
          const processedChats = await Promise.all(
            data.map(async (chat) => {
              // Fetch the last message for each chat
              const { data: lastMessageData } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", chat.id)
                .order("created_at", { ascending: false })

              // Fetch participants for each chat
              const { data: participantsData } = await supabase
                .from("chat_participants")
                .select(`
                  *,
                  users(*)
                `)
                .eq("chat_id", chat.id)

              // Extract labels
              const labels = chat.chat_labels ? chat.chat_labels.map((cl: any) => cl.labels) : []

              return {
                id: chat.id,
                name: chat.name,
                isGroup: chat.is_group,
                lastMessage: lastMessageData || null,
                participants: participantsData?.map((p: any) => p.users) || [],
                labels,
                createdAt: chat.created_at,
                updatedAt: chat.updated_at,
              }
            }),
          )

          setChats(processedChats)

          // Store in IndexedDB for offline access
          await storeChats(processedChats)

          // If we have a selected chat ID in localStorage, select that chat
          const savedChatId = getItem("selectedChatId")
          if (savedChatId) {
            const savedChat = processedChats.find((chat) => chat.id === savedChatId)
            if (savedChat) {
              setSelectedChat(savedChat)
            }
          }
        }
      } catch (error: any) {
        toast.error(`Error loading chats: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadChats()

    // Set up real-time subscription for new messages
    const messagesSubscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          // When a new message comes in, update the chats list
          const newMessage = payload.new as Message

          // Store the new message in IndexedDB
          await storeMessages([newMessage])

          // Update the chats list
          setChats((prevChats) => {
            return prevChats
              .map((chat) => {
                if (chat.id === newMessage.chat_id) {
                  return {
                    ...chat,
                    lastMessage: newMessage,
                    updatedAt: newMessage.created_at,
                  }
                }
                return chat
              })
              .sort((a, b) => {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              })
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSubscription)
    }
  }, [currentUser.id, supabase, getItem, storeChats, getChats, storeMessages])

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat)
    setItem("selectedChatId", chat.id)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentUser={currentUser}
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={handleSelectChat}
        loading={loading}
      />
      <ChatWindow
        currentUser={currentUser}
        selectedChat={selectedChat}
        supabase={supabase}
        getMessages={getMessages}
        storeMessages={storeMessages}
      />
    </div>
  )
}

