export interface User {
  id: string
  username: string
  email: string
  isOnline: boolean
  lastSeen: Date
}

export interface Message {
  id: string
  content: string
  senderId: string
  senderUsername: string
  roomId?: string
  recipientId?: string
  timestamp: Date
  type: "public" | "private"
}

export interface Room {
  id: string
  name: string
  description?: string
  participants: string[]
  createdAt: Date
  isPrivate: boolean
}

export interface ChatState {
  currentUser: User | null
  messages: Message[]
  rooms: Room[]
  activeRoom: string | null
  onlineUsers: User[]
  privateChats: { [userId: string]: Message[] }
  typingUsers: string[]
  allPrivateMessages: Message[]
}

export interface SocketEvents {
  // Client to Server
  "join-room": (roomId: string) => void
  "leave-room": (roomId: string) => void
  "send-message": (message: Omit<Message, "id" | "timestamp">) => void
  "start-private-chat": (userId: string) => void
  "load-private-messages": (userId: string) => void
  typing: (data: { roomId?: string; recipientId?: string }) => void
  "stop-typing": (data: { roomId?: string; recipientId?: string }) => void

  // Server to Client
  "message-received": (message: Message) => void
  "historical-messages": (messages: Message[]) => void
  "private-messages-loaded": (data: { userId: string; messages: Message[] }) => void
  "user-joined": (user: User) => void
  "user-left": (userId: string) => void
  "room-updated": (room: Room) => void
  "users-online": (users: User[]) => void
  "user-typing": (data: { userId: string; username: string }) => void
  "user-stopped-typing": (userId: string) => void
  error: (error: string) => void
}
