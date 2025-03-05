import { createServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import ChatLayout from "@/components/chat/chat-layout"

export default async function ChatPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Fetch current user
  const { data: currentUser } = await supabase.from("users").select("*").eq("id", session.user.id).single()

  if (!currentUser) {
    redirect("/login")
  }

  return <ChatLayout currentUser={currentUser} />
}

