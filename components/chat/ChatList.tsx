"use client";

import { useState } from "react";
import { Search, Filter, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import type { User, Chat } from "@/types";

interface ChatListProps {
  currentUser: User;
  chats: Chat[];
  selectedChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  loading: boolean;
}

export default function ChatList({
  currentUser,
  chats,
  selectedChat,
  onSelectChat,
  loading,
}: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      searchTerm === "" ||
      chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.lastMessage &&
        chat.lastMessage.content
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesLabels =
      selectedLabels.length === 0 ||
      chat.labels.some((label) => selectedLabels.includes(label.name));

    return matchesSearch && matchesLabels;
  });

  const allLabels = Array.from(
    new Set(chats.flatMap((chat) => chat.labels.map((label) => label.name)))
  );

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <aside className="w-80 border-r border-gray-200 flex flex-col bg-white flex-shrink-0">
      <header className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 bg-green-500">
            <span className="text-white text-xs">P</span>
          </Avatar>
          <span className="text-gray-500 font-medium">chats</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Custom filter
          </Button>
          <Button variant="outline" size="sm">
            Save
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allLabels.map((label) => (
              <Badge
                key={label}
                variant={selectedLabels.includes(label) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleLabel(label)}
              >
                {label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <nav className="overflow-y-auto flex-1">
        <ul className="divide-y divide-gray-100">
          {loading
            ? Array(5)
                .fill(0)
                .map((_, i) => (
                  <li key={i} className="p-4">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-3 w-10" />
                    </div>
                  </li>
                ))
            : filteredChats.map((chat) => (
                <li
                  key={chat.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedChat?.id === chat.id ? "bg-gray-50" : ""
                  }`}
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      {chat.isGroup ? (
                        <span className="text-xs">
                          {chat.name.substring(0, 2)}
                        </span>
                      ) : (
                        <span className="text-xs">
                          {chat.participants[0]?.full_name.substring(0, 2) ||
                            "U"}
                        </span>
                      )}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">
                          {chat.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {chat.updatedAt &&
                            formatDistanceToNow(new Date(chat.updatedAt), {
                              addSuffix: true,
                            })}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage?.content || "No messages yet"}
                      </p>

                      <div className="flex items-center mt-1 space-x-2">
                        {chat.participants[0]?.phone && (
                          <span className="text-xs text-gray-400">
                            {chat.participants[0].phone}
                          </span>
                        )}

                        {chat.labels.map((label) => (
                          <Badge
                            key={label.id}
                            variant="outline"
                            style={{
                              backgroundColor: label.color,
                              borderColor: label.color,
                            }}
                            className="text-xs py-0 h-5"
                          >
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
        </ul>
      </nav>
    </aside>
  );
}
