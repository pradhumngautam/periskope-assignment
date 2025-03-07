"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { User, Chat } from "@/types"

interface CreateChatModalProps {
  isOpen: boolean
  onClose: () => void
  onChatCreated: (chat: Chat) => void
  currentUser: User
  supabase: SupabaseClient
}

export function CreateChatModal({
  isOpen,
  onClose,
  onChatCreated,
  currentUser,
  supabase,
}: CreateChatModalProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    console.log("Form submitted")

    try {
      console.log("Checking for user:", email)
      // Check if user exists and is not the current user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .neq("id", currentUser.id)
        .single()

      console.log("User data:", userData)
      console.log("User error:", userError)

      if (userError || !userData) {
        toast.error("User not found on the platform")
        setLoading(false)
        return
      }

      // Check if chat already exists between these users
      const { data: existingChats, error: existingChatsError } = await supabase
        .from("chat_participants")
        .select(`
          chat_id,
          chats:chat_id (
            id,
            name,
            is_group,
            created_at,
            updated_at,
            chat_participants (
              users:user_id (*)
            )
          )
        `)
        .eq("user_id", currentUser.id)

      if (existingChatsError) throw existingChatsError

      const existingChat = existingChats?.find(chat => 
        chat.chats.chat_participants.some(
          (p: any) => p.users.id === userData.id
        )
      )

      if (existingChat) {
        const processedExistingChat: Chat = {
          id: existingChat.chats.id,
          name: existingChat.chats.name,
          isGroup: existingChat.chats.is_group,
          participants: existingChat.chats.chat_participants.map((p: any) => p.users),
          labels: [],
          createdAt: existingChat.chats.created_at,
          updatedAt: existingChat.chats.updated_at,
          lastMessage: null,
        }
        onChatCreated(processedExistingChat)
        toast.info("Chat already exists with this user")
        onClose()
        setLoading(false)
        return
      }

      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({
          name: `${currentUser.full_name}, ${userData.full_name}`,
          is_group: false,
        })
        .select()
        .single()

      if (chatError) throw chatError

      // Add participants
      const participantResults = await Promise.all([
        supabase
          .from("chat_participants")
          .insert({ chat_id: newChat.id, user_id: currentUser.id })
          .select(),
        supabase
          .from("chat_participants")
          .insert({ chat_id: newChat.id, user_id: userData.id })
          .select()
      ])

      const [participant1, participant2] = participantResults
      
      if (participant1.error || participant2.error) {
        console.error("Participant 1 error:", participant1.error)
        console.error("Participant 2 error:", participant2.error)
        throw new Error("Failed to add participants")
      }

      // Fetch complete chat data with proper joins
      const { data: completeChat, error: completeChatError } = await supabase
        .from("chats")
        .select(`
          *,
          chat_participants!inner (
            users:user_id (
              id,
              full_name,
              email,
              avatar_url
            )
          )
        `)
        .eq("id", newChat.id)
        .single()

      if (completeChatError) throw completeChatError

      const processedChat: Chat = {
        id: completeChat.id,
        name: completeChat.name,
        isGroup: completeChat.is_group,
        participants: completeChat.chat_participants.map((p: any) => p.users),
        labels: [],
        createdAt: completeChat.created_at,
        updatedAt: completeChat.updated_at,
        lastMessage: null,
      }

      onChatCreated(processedChat)
      toast.success("Chat created successfully")
      setEmail("")
      onClose()
    } catch (error: any) {
      console.error("Chat creation error:", error)
      toast.error(`Error creating chat: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">User Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user email"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Chat"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}