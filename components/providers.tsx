"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { Toaster } from "sonner"
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createClientComponentClient())

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <Toaster position="top-right" />
        {children}
      </ThemeProvider>
    </SessionContextProvider>
  )
}

