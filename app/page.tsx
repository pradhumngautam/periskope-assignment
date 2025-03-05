"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Sidebar from "@/components/Sidebar"
import ChatWindow from "@/components/ChatWindow"
import type { User, Chat } from "@/types"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch current user
    const fetchCurrentUser = async () => {
      // For demo purposes, we'll use a hardcoded user
      // In a real app, you would use Supabase Auth
      const { data, error } = await supabase.from("users").select("*").limit(1).single()

      if (error) {
        console.error("Error fetching user:", error)
        return
      }

      setCurrentUser(data)
    }

    fetchCurrentUser()
  }, [])

  useEffect(() => {
    // Fetch chats
    const fetchChats = async () => {
      if (!currentUser) return

      const { data, error } = await supabase
        .from("chat_participants")
        .select(`
          chat_id,
          chats:chat_id (
            id,
            name,
            is_group,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", currentUser.id)

      if (error) {
        console.error("Error fetching chats:", error)
        return
      }

      // Get the chat IDs
      const chatIds = data.map((item) => item.chat_id)

      // Fetch the last message for each chat
      const chatsWithLastMessage = await Promise.all(
        data.map(async (item) => {
          const { data: messagesData, error: messagesError } = await supabase
            .from("messages")
            .select(`
              id,
              content,
              created_at,
              sender_id,
              users:sender_id (
                full_name,
                phone
              )
            `)
            .eq("chat_id", item.chat_id)
            .order("created_at", { ascending: false })
            .limit(1)

          if (messagesError) {
            console.error("Error fetching messages:", messagesError)
            return item.chats
          }

          // Fetch participants for this chat
          const { data: participantsData, error: participantsError } = await supabase
            .from("chat_participants")
            .select(`
              users:user_id (
                id,
                full_name,
                phone,
                avatar_url
              )
            `)
            .eq("chat_id", item.chat_id)

          if (participantsError) {
            console.error("Error fetching participants:", participantsError)
            return {
              ...item.chats,
              last_message: messagesData?.[0] || null,
            }
          }

          // Fetch labels for this chat
          const { data: labelsData, error: labelsError } = await supabase
            .from("chat_labels")
            .select(`
              labels:label_id (
                id,
                name,
                color
              )
            `)
            .eq("chat_id", item.chat_id)

          if (labelsError) {
            console.error("Error fetching labels:", labelsError)
            return {
              ...item.chats,
              last_message: messagesData?.[0] || null,
              participants: participantsData?.map((p) => p.users) || [],
            }
          }

          return {
            ...item.chats,
            last_message: messagesData?.[0] || null,
            participants: participantsData?.map((p) => p.users) || [],
            labels: labelsData?.map((l) => l.labels) || [],
          }
        }),
      )

      setChats(chatsWithLastMessage)
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      fetchChats()
    }
  }, [currentUser])

  const fetchChats = async () => {
    if (!currentUser) return

    const { data, error } = await supabase
      .from("chat_participants")
      .select(`
        chat_id,
        chats:chat_id (
          id,
          name,
          is_group,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", currentUser.id)

    if (error) {
      console.error("Error fetching chats:", error)
      return
    }

    // Fetch the last message for each chat
    const chatsWithLastMessage = await Promise.all(
      data.map(async (item) => {
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(`
            id,
            content,
            created_at,
            sender_id,
            users:sender_id (
              full_name,
              phone
            )
          `)
          .eq("chat_id", item.chat_id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (messagesError) {
          console.error("Error fetching messages:", messagesError)
          return item.chats
        }

        // Fetch participants for this chat
        const { data: participantsData, error: participantsError } = await supabase
          .from("chat_participants")
          .select(`
            users:user_id (
              id,
              full_name,
              phone,
              avatar_url
            )
          `)
          .eq("chat_id", item.chat_id)

        if (participantsError) {
          console.error("Error fetching participants:", participantsError)
          return {
            ...item.chats,
            last_message: messagesData?.[0] || null,
          }
        }

        // Fetch labels for this chat
        const { data: labelsData, error: labelsError } = await supabase
          .from("chat_labels")
          .select(`
            labels:label_id (
              id,
              name,
              color
            )
          `)
          .eq("chat_id", item.chat_id)

        if (labelsError) {
          console.error("Error fetching labels:", labelsError)
          return {
            ...item.chats,
            last_message: messagesData?.[0] || null,
            participants: participantsData?.map((p) => p.users) || [],
          }
        }

        return {
          ...item.chats,
          last_message: messagesData?.[0] || null,
          participants: participantsData?.map((p) => p.users) || [],
          labels: labelsData?.map((l) => l.labels) || [],
        }
      }),
    )

    setChats(chatsWithLastMessage)
    setLoading(false)
  }

  // Set up real-time subscription for new messages
  useEffect(() => {
    const subscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Update the chats list with the new message
          const newMessage = payload.new as any

          // Fetch the sender information
          supabase
            .from("users")
            .select("*")
            .eq("id", newMessage.sender_id)
            .single()
            .then(({ data: senderData }) => {
              const updatedMessage = {
                ...newMessage,
                sender: senderData,
              }

              // Update the chat with the new message
              setChats((prevChats) =>
                prevChats.map((chat) => {
                  if (chat.id === newMessage.chat_id) {
                    return {
                      ...chat,
                      last_message: updatedMessage,
                    }
                  }
                  return chat
                }),
              )

              // If this message is for the selected chat, update the chat window
              if (selectedChat?.id === newMessage.chat_id) {
                // This will be handled by the ChatWindow component
              }
            })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [selectedChat])

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <main className="flex h-screen">
      <Sidebar currentUser={currentUser} chats={chats} selectedChat={selectedChat} onSelectChat={handleSelectChat} />
      <ChatWindow currentUser={currentUser} selectedChat={selectedChat} onChatUpdated={fetchChats} />
    </main>
  )
}

