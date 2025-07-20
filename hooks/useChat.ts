"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"
import type { ChatState, Message, Room, User } from "@/types/chat"

type ChatAction =
  | { type: "SET_USER"; payload: User }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "SET_ROOMS"; payload: Room[] }
  | { type: "SET_ACTIVE_ROOM"; payload: string | null }
  | { type: "SET_ONLINE_USERS"; payload: User[] }
  | { type: "ADD_PRIVATE_MESSAGE"; payload: { userId: string; message: Message } }
  | { type: "USER_JOINED"; payload: User }
  | { type: "USER_LEFT"; payload: string }
  | { type: "SET_PRIVATE_MESSAGES"; payload: { userId: string; messages: Message[] } }

const initialState: ChatState = {
  currentUser: null,
  messages: [],
  rooms: [],
  activeRoom: null,
  onlineUsers: [],
  privateChats: {},
  typingUsers: [],
  allPrivateMessages: [],
}

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, currentUser: action.payload }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] }
    case "SET_MESSAGES":
      return { ...state, messages: action.payload }
    case "SET_ROOMS":
      return { ...state, rooms: action.payload }
    case "SET_ACTIVE_ROOM":
      return { ...state, activeRoom: action.payload }
    case "SET_ONLINE_USERS":
      return { ...state, onlineUsers: action.payload }
    case "ADD_PRIVATE_MESSAGE":
      return {
        ...state,
        allPrivateMessages: [...state.allPrivateMessages, action.payload.message],
      }
    case "USER_JOINED":
      return {
        ...state,
        onlineUsers: [...state.onlineUsers.filter((u) => u.id !== action.payload.id), action.payload],
      }
    case "USER_LEFT":
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter((u) => u.id !== action.payload),
      }
    case "SET_PRIVATE_MESSAGES": {
      const allMessages = [...state.allPrivateMessages, ...action.payload.messages]
      const uniqueMessages = Array.from(
        new Map(allMessages.map(m => [m.id, m])).values()
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      return {
        ...state,
        allPrivateMessages: uniqueMessages,
      }
    }
    default:
      return state
  }
}

// Configuración de la API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vintage-chat-backend.pokecraftmod.workers.dev'

export function useChat(token: string | null) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Exponer dispatch globalmente para mensajes privados locales
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.__dispatchChat = dispatch
  }

  // Extraer información del usuario del token
  useEffect(() => {
    if (!token) return

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentUser: User = {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        isOnline: true,
        lastSeen: new Date(),
      }
      dispatch({ type: "SET_USER", payload: currentUser })
    } catch (error) {
      console.error("Error parsing token:", error)
    }
  }, [token])

  // Configurar Server-Sent Events para mensajes en tiempo real
  useEffect(() => {
    if (!token) return

    // Crear EventSource para recibir mensajes en tiempo real
    // Nota: EventSource no soporta headers personalizados, usaremos polling como fallback
    const eventSource = new EventSource(`${API_BASE_URL}/api/chat/stream`)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new-message') {
          dispatch({ type: "ADD_MESSAGE", payload: data.message })
        } else if (data.type === 'user-joined') {
          dispatch({ type: "USER_JOINED", payload: data.user })
        } else if (data.type === 'user-left') {
          dispatch({ type: "USER_LEFT", payload: data.userId })
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error)
    }

    eventSourceRef.current = eventSource

    // Polling para obtener mensajes y usuarios (fallback)
    const pollMessages = async () => {
      try {
        const [messagesResponse, usersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/chat/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/api/chat/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        if (messagesResponse.ok) {
          const messages = await messagesResponse.json()
          dispatch({ type: "SET_MESSAGES", payload: messages })
        }

        if (usersResponse.ok) {
          const users = await usersResponse.json()
          dispatch({ type: "SET_ONLINE_USERS", payload: users })
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Polling cada 10 segundos
    pollingIntervalRef.current = setInterval(pollMessages, 10000)
    pollMessages() // Poll inicial

    return () => {
      eventSource.close()
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [token])

  const sendMessage = useCallback(
    async (content: string, recipientId?: string) => {
      if (!state.currentUser) return

      const messageData = {
        content,
        senderId: state.currentUser.id,
        senderUsername: state.currentUser.username,
        roomId: recipientId ? undefined : (state.activeRoom || undefined),
        recipientId,
        type: recipientId ? ("private" as const) : ("public" as const),
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(messageData)
        })

        if (response.ok) {
          const newMessage = await response.json()
          if (recipientId) {
            dispatch({ type: "ADD_PRIVATE_MESSAGE", payload: { userId: recipientId, message: newMessage } })
          } else {
            dispatch({ type: "ADD_MESSAGE", payload: newMessage })
          }
        }
      } catch (error) {
        console.error('Error sending message:', error)
      }
    },
    [state.currentUser, state.activeRoom, token],
  )

  const sendTypingIndicator = useCallback(
    async (isTyping: boolean, recipientId?: string) => {
      // Implementar si es necesario
      console.log('Typing indicator:', isTyping, recipientId)
    },
    [],
  )

  const joinRoom = useCallback(
    (roomId: string) => {
      dispatch({ type: "SET_ACTIVE_ROOM", payload: roomId })
    },
    [],
  )

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (state.activeRoom === roomId) {
        dispatch({ type: "SET_ACTIVE_ROOM", payload: null })
      }
    },
    [state.activeRoom],
  )

  const loadPrivateMessages = useCallback(
    async (userId: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/messages?recipientId=${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const messages = await response.json()
          dispatch({ type: "SET_PRIVATE_MESSAGES", payload: { userId, messages } })
        }
      } catch (error) {
        console.error('Error loading private messages:', error)
      }
    },
    [token],
  )

  return {
    ...state,
    isConnected: !!eventSourceRef.current,
    sendMessage,
    sendTypingIndicator,
    joinRoom,
    leaveRoom,
    loadPrivateMessages,
    dispatch,
    getPrivateMessages: (currentUserId: string, selectedUserId: string) =>
      state.allPrivateMessages.filter(
        (msg) =>
          (msg.senderId === currentUserId && msg.recipientId === selectedUserId) ||
          (msg.senderId === selectedUserId && msg.recipientId === currentUserId)
      ),
  }
}
