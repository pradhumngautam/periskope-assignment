"use client"

import { useState } from "react"
import type { Chat, User } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { Search, Filter, Plus, Home, MessageSquare, BarChart2, Users, Settings, Bell, Menu } from "lucide-react"

interface SidebarProps {
  currentUser: User | null
  chats: Chat[]
  selectedChat: Chat | null
  onSelectChat: (chat: Chat) => void
}

export default function Sidebar({ currentUser, chats, selectedChat, onSelectChat }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Get all unique labels from chats
  const allLabels = Array.from(new Set(chats.flatMap((chat) => chat.labels?.map((label) => label.name) || [])))

  // Filter chats based on search term and selected labels
  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      searchTerm === "" ||
      chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.last_message?.content.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLabels =
      selectedLabels.length === 0 || chat.labels?.some((label) => selectedLabels.includes(label.name))

    return matchesSearch && matchesLabels
  })

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]))
  }

  return (
    <aside className="w-80 border-r border-gray-200 flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">P</span>
          </div>
          <span className="text-gray-500 font-medium">chats</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Bell size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <button
            className={`flex items-center px-3 py-1.5 rounded-md text-sm ${
              showFilters ? "bg-green-500 text-white" : "border border-gray-300 text-gray-700"
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-2" />
            Custom filter
          </button>
          <button className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700">Save</button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 border border-gray-300 rounded-md text-gray-700">
            <Filter size={16} />
          </button>
          <button className="p-2 border border-gray-300 rounded-md text-gray-700">
            <Plus size={16} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allLabels.map((label) => (
              <span
                key={label}
                className={`px-2 py-1 text-xs rounded-md cursor-pointer ${
                  selectedLabels.includes(label)
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
                }`}
                onClick={() => toggleLabel(label)}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-y-auto flex-1 scrollbar-thin">
        <ul className="divide-y divide-gray-100">
          {filteredChats.map((chat) => {
            const isSelected = selectedChat?.id === chat.id
            const lastMessageTime = chat.last_message?.created_at
              ? formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true })
              : ""

            return (
              <li
                key={chat.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${isSelected ? "bg-gray-50" : ""}`}
                onClick={() => onSelectChat(chat)}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {chat.is_group ? (
                      <span className="text-xs text-gray-600">{chat.name.substring(0, 2)}</span>
                    ) : (
                      <span className="text-xs text-gray-600">
                        {chat.participants?.[0]?.full_name.substring(0, 2) || "U"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-500">{lastMessageTime}</span>
                    </div>

                    <p className="text-sm text-gray-500 truncate">{chat.last_message?.content || "No messages yet"}</p>

                    <div className="flex items-center mt-1 space-x-2">
                      {chat.participants?.[0]?.phone && (
                        <span className="text-xs text-gray-400">{chat.participants[0].phone}</span>
                      )}

                      {chat.labels?.map((label) => (
                        <span
                          key={label.id}
                          className="px-2 py-0.5 text-xs rounded-md"
                          style={{
                            backgroundColor: label.color,
                            color: "rgba(0, 0, 0, 0.7)",
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="border-t border-gray-200 p-2">
        <div className="grid grid-cols-5 gap-1">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
            <Home size={20} />
          </button>
          <button className="p-2 bg-gray-100 text-gray-700 rounded-md">
            <MessageSquare size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
            <BarChart2 size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
            <Users size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </aside>
  )
}

