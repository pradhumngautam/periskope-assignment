"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ChatLayout from "@/components/chat/chat-layout"
import { DEMO_USER } from "@/lib/constants"

export default function Home() {
  const supabase = createClientComponentClient()

  return <ChatLayout currentUser={DEMO_USER} supabase={supabase} />
}