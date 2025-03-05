export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Chat {
  id: string
  name: string
  is_group: boolean
  created_at: string
  updated_at: string
  participants?: User[]
  last_message?: Message
  labels?: Label[]
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
  sender?: User
}

export interface Label {
  id: string
  name: string
  color: string
  created_at: string
}

export interface ChatParticipant {
  id: string
  chat_id: string
  user_id: string
  created_at: string
  user?: User
}

export interface ChatLabel {
  id: string
  chat_id: string
  label_id: string
  created_at: string
  label?: Label
}

