"use client";

import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ChatWindow } from "./chat-window";
import { toast } from "sonner";
import type { User, Chat } from "@/types";
import ChatList from "./ChatList";
import { DEMO_USER } from "@/lib/constants";
import { Sidebar } from "@/components/sidebar"; // Fix: Update the import path

interface ChatLayoutProps {
  supabase: SupabaseClient;
  currentUser: User;  // Add this line
}

export default function ChatLayout({ supabase, currentUser }: ChatLayoutProps) {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const { data, error } = await supabase
          .from("chats")
          .select(
            `
            *,
            chat_participants!inner(user_id),
            chat_labels(
              *,
              labels(*)
            )
          `
          )
          .order("updated_at", { ascending: false });

        if (error) throw error;

        if (data) {
          const processedChats = await Promise.all(
            data.map(async (chat) => {
              const { data: lastMessageData } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", chat.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

              const { data: participantsData } = await supabase
                .from("chat_participants")
                .select(
                  `
                  users:user_id (*)
                `
                )
                .eq("chat_id", chat.id);

              return {
                id: chat.id,
                name: chat.name,
                isGroup: chat.is_group,
                lastMessage: lastMessageData || null,
                participants: participantsData?.map((p: any) => p.users) || [],
                labels: chat.chat_labels?.map((cl: any) => cl.labels) || [],
                createdAt: chat.created_at,
                updatedAt: chat.updated_at,
              };
            })
          );

          setChats(
            processedChats.map((chat) => ({
              ...chat,
              is_group: chat.isGroup,
              created_at: chat.createdAt,
              updated_at: chat.updatedAt,
            }))
          );
          if (processedChats.length > 0) {
            setSelectedChat({
              ...processedChats[0],
              is_group: processedChats[0].isGroup,
              created_at: processedChats[0].createdAt,
              updated_at: processedChats[0].updatedAt,
            });
          }
        }
      } catch (error: any) {
        toast.error(`Error loading chats: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadChats();

    // Set up real-time subscription for new messages
    const messagesSubscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === newMessage.chat_id
                ? { ...chat, lastMessage: newMessage }
                : chat
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [supabase]);

  return (
    <div className="flex h-screen">
      <div className="flex">
        <Sidebar />
        <ChatList
          currentUser={currentUser}  // Update this line
          chats={chats}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          loading={loading}
        />
      </div>
      <ChatWindow
        currentUser={currentUser}  // Update this line
        selectedChat={selectedChat}
        supabase={supabase}
      />
    </div>
  );
}
