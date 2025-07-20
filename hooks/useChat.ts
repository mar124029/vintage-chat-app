"use client"

import { useCallback, useEffect, useReducer } from "react"
import { useSocket } from "./useSocket"
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

export function useChat(token: string | null) {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const { socket, isConnected } = useSocket(token)

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

  useEffect(() => {
    if (!socket) return

    socket.on("message-received", (message) => {
      console.log("Message received:", message)
      if (message.type === "private") {
        // Agregar el mensaje tanto al chat con el sender como con el recipient
        if (message.senderId && message.recipientId) {
          dispatch({ type: "ADD_PRIVATE_MESSAGE", payload: { userId: message.senderId, message } })
          dispatch({ type: "ADD_PRIVATE_MESSAGE", payload: { userId: message.recipientId, message } })
        }
      } else {
        console.log("Adding public message to state")
        dispatch({ type: "ADD_MESSAGE", payload: message })
      }
    })

    socket.on("historical-messages", (messages) => {
      console.log("Historical messages received:", messages)
      console.log("Number of historical messages:", messages.length)
      dispatch({ type: "SET_MESSAGES", payload: messages })
    })

    socket.on("users-online", (users) => {
      console.log("Users online:", users)
      dispatch({ type: "SET_ONLINE_USERS", payload: users })
    })

    socket.on("user-joined", (user) => {
      console.log("User joined:", user)
      dispatch({ type: "USER_JOINED", payload: user })
    })

    socket.on("user-left", (userId) => {
      console.log("User left:", userId)
      dispatch({ type: "USER_LEFT", payload: userId })
    })

    socket.on("private-messages-loaded", (data) => {
      console.log("Private messages loaded:", data)
      dispatch({ type: "SET_PRIVATE_MESSAGES", payload: { userId: data.userId, messages: data.messages } })
    })

    // Unirse automáticamente a la sala general cuando se conecta
    if (isConnected && !state.activeRoom) {
      console.log("Joining general room")
      dispatch({ type: "SET_ACTIVE_ROOM", payload: "general" })
    }

    return () => {
      socket.off("message-received")
      socket.off("historical-messages")
      socket.off("users-online")
      socket.off("user-joined")
      socket.off("user-left")
      socket.off("private-messages-loaded")
    }
  }, [socket, state.currentUser?.id, isConnected, state.activeRoom])

  const sendMessage = useCallback(
    (content: string, recipientId?: string) => {
      if (!socket || !state.currentUser) return

      const messageData = {
        content,
        senderId: state.currentUser.id,
        senderUsername: state.currentUser.username,
        roomId: recipientId ? undefined : (state.activeRoom || undefined),
        recipientId,
        type: recipientId ? ("private" as const) : ("public" as const),
      }

      console.log("Sending message data:", messageData)
      socket.emit("send-message", messageData)
    },
    [socket, state.currentUser, state.activeRoom],
  )

  const sendTypingIndicator = useCallback(
    (isTyping: boolean, recipientId?: string) => {
      if (!socket) return

      if (isTyping) {
        socket.emit("typing", { recipientId, roomId: recipientId ? undefined : (state.activeRoom || undefined) })
      } else {
        socket.emit("stop-typing", { recipientId, roomId: recipientId ? undefined : (state.activeRoom || undefined) })
      }
    },
    [socket, state.activeRoom],
  )

  const joinRoom = useCallback(
    (roomId: string) => {
      if (!socket) return
      socket.emit("join-room", roomId)
      dispatch({ type: "SET_ACTIVE_ROOM", payload: roomId })
    },
    [socket],
  )

  const leaveRoom = useCallback(
    (roomId: string) => {
      if (!socket) return
      socket.emit("leave-room", roomId)
      if (state.activeRoom === roomId) {
        dispatch({ type: "SET_ACTIVE_ROOM", payload: null })
      }
    },
    [socket, state.activeRoom],
  )

  const loadPrivateMessages = useCallback(
    (userId: string) => {
      if (!socket) return
      socket.emit("load-private-messages", userId)
    },
    [socket],
  )

  return {
    ...state,
    isConnected,
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
