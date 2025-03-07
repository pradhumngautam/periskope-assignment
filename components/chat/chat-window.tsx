"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Send, Paperclip, Smile, Clock, Image, Mic, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { format } from "date-fns"
import { toast } from "sonner"
import type { User, Chat, Message } from "@/types"

interface ChatWindowProps {
  currentUser: User
  selectedChat: Chat | null
  supabase: SupabaseClient
}

export function ChatWindow({ currentUser, selectedChat, supabase }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch messages when selected chat changes
  useEffect(() => {
    if (!selectedChat) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("messages")
          .select(`
            *,
            users:sender_id(*)
          `)
          .eq("chat_id", selectedChat.id)
          .order("created_at", { ascending: true })

        if (error) {
          throw error
        }

        if (data) {
          const processedMessages = data.map((message: any) => ({
            id: message.id,
            chat_id: message.chat_id,
            sender_id: message.sender_id,
            content: message.content,
            is_read: message.is_read,
            created_at: message.created_at,
            updated_at: message.updated_at,
            sender: message.users,
          }))

          setMessages(processedMessages)
        }
      } catch (error: any) {
        toast.error(`Error loading messages: ${error.message}`)
      } finally {
        setLoading(false)
        scrollToBottom()
      }
    }

    fetchMessages()

    const messagesSubscription = supabase
      .channel(`messages:${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          supabase
            .from("users")
            .select("*")
            .eq("id", payload.new.sender_id)
            .single()
            .then(({ data: senderData }) => {
              const newMessage = {
                ...payload.new,
                sender: senderData,
              } as Message

              setMessages((prev) => [...prev, newMessage])
              scrollToBottom()
            })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSubscription)
    }
  }, [selectedChat, supabase])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChat || !newMessage.trim()) return
  
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_id: selectedChat.id,
          sender_id: currentUser.id, // This will now be a valid UUID
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
  
      if (error) {
        console.error("Send message error details:", error)
        throw error
      }
      setNewMessage("")
    } catch (error: any) {
      console.error("Send message error:", error)
      toast.error(`Error sending message: ${error.message}`)
    }
  }

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {}
  messages.forEach((message) => {
    const date = new Date(message.created_at).toDateString()
    if (!groupedMessages[date]) {
      groupedMessages[date] = []
    }
    groupedMessages[date].push(message)
  })

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-700">Select a chat to start messaging</h2>
          <p className="text-gray-500 mt-2">Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            {selectedChat.isGroup ? (
              <span className="text-xs">{selectedChat.name.substring(0, 2)}</span>
            ) : (
              <span className="text-xs">{selectedChat.participants[0]?.full_name.substring(0, 2) || "U"}</span>
            )}
          </Avatar>
          <div>
            <h2 className="font-medium">{selectedChat.name}</h2>
            <div className="flex items-center text-sm text-gray-500 space-x-1">
              {selectedChat.participants
                .filter((participant): participant is User => participant !== null)
                .map((participant, index) => (
                  <span key={participant.id}>
                    {participant?.full_name || 'Unknown User'}
                    {index < selectedChat.participants.length - 1 && ", "}
                  </span>
                ))}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Clock className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="mb-6">
            <div className="flex justify-center mb-4">
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {format(new Date(date), "MMMM d, yyyy")}
              </span>
            </div>

            {dateMessages.map((message) => {
              const isCurrentUser = message.sender_id === currentUser.id

              return (
                <div key={message.id} className={`mb-4 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${isCurrentUser ? "order-2" : "order-1"}`}>
                    {!isCurrentUser && (
                      <div className="flex items-center mb-1 space-x-2">
                        <span className="text-sm font-medium text-green-600">
                          {message.sender?.full_name || "Unknown"}
                        </span>
                        {message.sender?.phone && <span className="text-xs text-gray-500">{message.sender.phone}</span>}
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-lg ${
                        isCurrentUser ? "bg-green-100 text-green-800" : "bg-white border border-gray-200"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>

                    <div
                      className={`flex items-center mt-1 text-xs text-gray-500 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <span>{format(new Date(message.created_at), "HH:mm")}</span>
                      {isCurrentUser && (
                        <span className="ml-1">
                          <Check className="h-3 w-3 text-green-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Button type="button" variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="pr-20"
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
                <Smile className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
                <Image className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button type="submit" size="icon" className="bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  )
}

