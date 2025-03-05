"use client"

import { useState, useEffect } from "react"

export function useLocalStorage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getItem = (key: string): string | null => {
    if (!isClient) return null
    return localStorage.getItem(key)
  }

  const setItem = (key: string, value: string): void => {
    if (!isClient) return
    localStorage.setItem(key, value)
  }

  const removeItem = (key: string): void => {
    if (!isClient) return
    localStorage.removeItem(key)
  }

  return { getItem, setItem, removeItem }
}

