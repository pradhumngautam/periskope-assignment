"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { Chat, User, Message } from "@/types"
import { format } from "date-fns"
import { Send, Paperclip, Smile, Clock, Image, Mic } from "lucide-react"

interface ChatWindowProps {
  currentUser: User | null
  selectedChat: Chat | null
  onChatUpdated: () => void
}

export default function ChatWindow({ currentUser, selectedChat, onChatUpdated }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch messages when selected chat changes
  useEffect(() => {
    if (!selectedChat) return

    const fetchMessages = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(*)
        `)
        .eq("chat_id", selectedChat.id)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Error fetching messages:", error)
      } else {
        setMessages(data || [])
      }

      setLoading(false)
      scrollToBottom()
    }

    fetchMessages()

    // Set up real-time subscription for new messages
    const subscription = supabase
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
          // Fetch the sender information
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
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [selectedChat])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedChat || !currentUser || !newMessage.trim()) return

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: selectedChat.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setNewMessage("")
      onChatUpdated()
    } catch (error) {
      console.error("Error sending message:", error)
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
          <p className="text-gray-500 mt-2">Choose from your existing conversations</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {selectedChat.is_group ? (
              <span className="text-xs text-gray-600">{selectedChat.name.substring(0, 2)}</span>
            ) : (
              <span className="text-xs text-gray-600">
                {selectedChat.participants?.[0]?.full_name.substring(0, 2) || "U"}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-medium">{selectedChat.name}</h2>
            <div className="text-sm text-gray-500">
              {selectedChat.participants?.map((participant, index) => (
                <span key={participant.id}>
                  {participant.full_name}
                  {index < (selectedChat.participants?.length || 0) - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <Clock size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 scrollbar-thin">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="mb-6">
            <div className="flex justify-center mb-4">
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {format(new Date(date), "MMMM d, yyyy")}
              </span>
            </div>

            {dateMessages.map((message) => {
              const isCurrentUser = message.sender_id === currentUser?.id

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
                      {isCurrentUser && <span className="ml-1 text-green-500">✓</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <button type="button" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Paperclip size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Message..."
              className="w-full pl-3 pr-20 py-2 border border-gray-300 rounded-md"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <div className="absolute right-2 top-2 flex items-center space-x-1">
              <button type="button" className="p-1 text-gray-400 hover:text-gray-600">
                <Smile size={18} />
              </button>
              <button type="button" className="p-1 text-gray-400 hover:text-gray-600">
                <Image size={18} />
              </button>
              <button type="button" className="p-1 text-gray-400 hover:text-gray-600">
                <Mic size={18} />
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
            disabled={!newMessage.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </footer>
    </div>
  )
}

