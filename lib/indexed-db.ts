export function initIndexedDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("ChatApp", 1)

    request.onerror = () => {
      reject("Error opening IndexedDB")
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = request.result

      // Create messages store
      if (!db.objectStoreNames.contains("messages")) {
        const messagesStore = db.createObjectStore("messages", { keyPath: "id" })
        messagesStore.createIndex("chat_id", "chat_id", { unique: false })
        messagesStore.createIndex("created_at", "created_at", { unique: false })
      }

      // Create chats store
      if (!db.objectStoreNames.contains("chats")) {
        const chatsStore = db.createObjectStore("chats", { keyPath: "id" })
        chatsStore.createIndex("updated_at", "updated_at", { unique: false })
      }
    }
  })
}

export async function storeMessages(db: IDBDatabase, messages: any[]) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("messages", "readwrite")
    const store = transaction.objectStore("messages")

    messages.forEach((message) => {
      store.put(message)
    })

    transaction.oncomplete = () => {
      resolve()
    }

    transaction.onerror = () => {
      reject("Error storing messages")
    }
  })
}

export async function getMessages(db: IDBDatabase, chatId: string) {
  return new Promise<any[]>((resolve, reject) => {
    const transaction = db.transaction("messages", "readonly")
    const store = transaction.objectStore("messages")
    const index = store.index("chat_id")
    const request = index.getAll(IDBKeyRange.only(chatId))

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject("Error getting messages")
    }
  })
}

export async function storeChats(db: IDBDatabase, chats: any[]) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("chats", "readwrite")
    const store = transaction.objectStore("chats")

    chats.forEach((chat) => {
      store.put(chat)
    })

    transaction.oncomplete = () => {
      resolve()
    }

    transaction.onerror = () => {
      reject("Error storing chats")
    }
  })
}

export async function getChats(db: IDBDatabase) {
  return new Promise<any[]>((resolve, reject) => {
    const transaction = db.transaction("chats", "readonly")
    const store = transaction.objectStore("chats")
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject("Error getting chats")
    }
  })
}

