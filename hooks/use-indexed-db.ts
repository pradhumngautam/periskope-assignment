"use client"

import { useState, useEffect } from "react"
import type { Chat, Message } from "@/types"

const DB_NAME = "chat_app_db"
const DB_VERSION = 1
const MESSAGES_STORE = "messages"
const CHATS_STORE = "chats"

export function useIndexedDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create messages store
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: "id" })
        messagesStore.createIndex("chat_id", "chat_id", { unique: false })
        messagesStore.createIndex("created_at", "created_at", { unique: false })
      }

      // Create chats store
      if (!db.objectStoreNames.contains(CHATS_STORE)) {
        const chatsStore = db.createObjectStore(CHATS_STORE, { keyPath: "id" })
        chatsStore.createIndex("updatedAt", "updatedAt", { unique: false })
      }
    }

    request.onsuccess = (event) => {
      setDb((event.target as IDBOpenDBRequest).result)
      setIsReady(true)
    }

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error)
    }

    return () => {
      if (db) {
        db.close()
      }
    }
  }, [db])

  const storeMessages = async (messages: Message[]): Promise<void> => {
    if (!db || !isReady) return

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, "readwrite")
      const store = transaction.objectStore(MESSAGES_STORE)

      messages.forEach((message) => {
        store.put(message)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  const getMessages = async (chatId: string): Promise<Message[]> => {
    if (!db || !isReady) return []

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, "readonly")
      const store = transaction.objectStore(MESSAGES_STORE)
      const index = store.index("chat_id")
      const request = index.getAll(IDBKeyRange.only(chatId))

      request.onsuccess = () => {
        const messages = request.result as Message[]
        resolve(messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
      }

      request.onerror = () => reject(request.error)
    })
  }

  const storeChats = async (chats: Chat[]): Promise<void> => {
    if (!db || !isReady) return

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHATS_STORE, "readwrite")
      const store = transaction.objectStore(CHATS_STORE)

      chats.forEach((chat) => {
        store.put(chat)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  const getChats = async (): Promise<Chat[]> => {
    if (!db || !isReady) return []

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHATS_STORE, "readonly")
      const store = transaction.objectStore(CHATS_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        const chats = request.result as Chat[]
        resolve(chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
      }

      request.onerror = () => reject(request.error)
    })
  }

  return {
    storeMessages,
    getMessages,
    storeChats,
    getChats,
    isReady,
  }
}

