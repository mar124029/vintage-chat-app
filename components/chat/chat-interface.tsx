"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Terminal, TerminalLine } from "@/components/ui/terminal"
import { useChat } from "@/hooks/useChat"
import { Send, ArrowDown, Users, MessageCircle, Settings, Wifi, WifiOff, LogOut } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { EmojiPicker } from "./emoji-picker"
import { EmojiButton } from "./emoji-button"

interface ChatInterfaceProps {
  token: string
  onLogout: () => void
}

export function ChatInterface({ token, onLogout }: ChatInterfaceProps) {
  const { messages, privateChats, currentUser, onlineUsers, sendMessage, isConnected, activeRoom, loadPrivateMessages, getPrivateMessages } = useChat(token)
  const [message, setMessage] = useState("")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [emojiCount, setEmojiCount] = useState(0)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentMessages = selectedUser && currentUser
    ? getPrivateMessages(currentUser.id, selectedUser)
    : messages

  // Mensajes únicos por id para evitar duplicados visuales
  const uniqueMessages = Array.from(
    new Map(currentMessages.map(m => [m.id, m])).values()
  )

  const handleUserSelect = (userId: string) => {
    const newSelectedUser = selectedUser === userId ? null : userId
    setSelectedUser(newSelectedUser)

    // Cargar mensajes privados si se selecciona un usuario
    if (newSelectedUser) {
      loadPrivateMessages(newSelectedUser)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !isConnected) return

    console.log("Sending message:", { message, selectedUser, isPrivate: !!selectedUser })

    // Ya no agrego el mensaje localmente, confío en el evento message-received
    sendMessage(message, selectedUser || undefined)
    setMessage("")
    setEmojiCount(0)
    setIsEmojiPickerOpen(false)

    // Vintage keyboard sound effect
    const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT")
    audio.play().catch(() => { })
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setEmojiCount(prev => prev + 1)
  }

  const handleEmojiPickerToggle = () => {
    setIsEmojiPickerOpen(!isEmojiPickerOpen)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Scroll automático cuando llegan nuevos mensajes
  useEffect(() => {
    const messagesContainer = messagesEndRef.current?.parentElement
    if (messagesContainer) {
      const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 10
      if (isAtBottom) {
        scrollToBottom()
        setHasNewMessages(false)
      } else {
        setHasNewMessages(true)
      }
    }
  }, [messages, privateChats, selectedUser])

  // Scroll automático cuando se selecciona un usuario diferente
  useEffect(() => {
    scrollToBottom()
    setHasNewMessages(false)
  }, [selectedUser])

  // Escuchar el evento para agregar el mensaje privado localmente (ya no es necesario)
  // useEffect(() => {
  //   function handleAddPrivateMessageLocal(e: any) {
  //     const { userId, message } = e.detail
  //     if (userId && message) {
  //       // @ts-ignore (dispatch está en el hook)
  //       window.__dispatchChat && window.__dispatchChat({ type: "ADD_PRIVATE_MESSAGE", payload: { userId, message } })
  //     }
  //   }
  //   window.addEventListener("add-private-message-local", handleAddPrivateMessageLocal)
  //   return () => window.removeEventListener("add-private-message-local", handleAddPrivateMessageLocal)
  // }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen">
        {/* Sidebar - Users Online */}
        <div className="lg:col-span-1">
          <Terminal title="USERS_ONLINE" className="h-full">
            <div className="p-4 space-y-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/30">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm font-mono">
                  {isConnected ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>

              {/* Current User Info */}
              {currentUser && (
                <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30">
                  <TerminalLine prefix="$" type="system" className="text-blue-400">
                    Current User: {currentUser.username}
                  </TerminalLine>
                  <TerminalLine prefix="$" type="system" className="text-blue-400">
                    Room: {activeRoom || "general"}
                  </TerminalLine>
                </div>
              )}

              {/* Online Users */}
              <div className="space-y-2">
                <TerminalLine prefix="$" type="system" className="text-yellow-400 font-bold">
                  Online Users ({onlineUsers.length})
                </TerminalLine>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {onlineUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className={`w-full p-2 rounded-lg transition-all duration-300 text-left group ${selectedUser === user.id
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50"
                        : "bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/30 hover:border-purple-500/50 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10"
                        }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${user.id === currentUser?.id ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`}></div>
                        <span className="font-mono text-sm">
                          {user.username}
                          {user.id === currentUser?.id && " (YOU)"}
                        </span>
                      </div>
                      {selectedUser === user.id && (
                        <div className="mt-1 text-xs text-purple-400">
                          ← Private chat active
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 pt-4 border-t border-slate-600/30">
                <TerminalLine prefix="$" type="system" className="text-cyan-400 font-bold">
                  Quick Actions
                </TerminalLine>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setSelectedUser(null)}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                  >
                    <MessageCircle className="w-3 h-3 mr-1" />
                    General
                  </Button>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <Button
                  onClick={onLogout}
                  variant="outline"
                  size="sm"
                  className="w-full bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </Terminal>
        </div>

        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Terminal
            title={
              selectedUser
                ? `PRIVATE_CHAT_${onlineUsers.find((u) => u.id === selectedUser)?.username}`
                : "GENERAL_CHAT"
            }
            className="h-full flex flex-col"
          >
            {/* Chat Header */}
            <div className="border-b border-green-500/30 p-4 bg-gradient-to-r from-green-500/5 to-blue-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-mono font-bold text-green-400">
                    {selectedUser
                      ? `Private Chat with ${onlineUsers.find((u) => u.id === selectedUser)?.username}`
                      : "General Chat Room"
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-slate-400">
                    Messages: {currentMessages.length}
                  </span>
                  <span className="text-slate-400">
                    {formatDistanceToNow(new Date(), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="space-y-1">
                {uniqueMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">💬</div>
                    <TerminalLine prefix="$" type="system" className="text-green-400/60 text-lg">
                      No messages yet. Start the conversation!
                    </TerminalLine>
                    <TerminalLine prefix="$" type="system" className="text-slate-500 text-sm">
                      Type a message below to begin chatting
                    </TerminalLine>
                  </div>
                ) : (
                  <>
                    {currentMessages.length > 20 && (
                      <TerminalLine prefix="$" type="system" className="text-yellow-400 text-xs bg-yellow-500/10 p-2 rounded-lg">
                        📜 Scroll to see more messages ({currentMessages.length} total)
                      </TerminalLine>
                    )}
                    {uniqueMessages.map((msg, index) => (
                      <div
                        key={msg.id + '-' + index}
                        className={`mb-3 hover:bg-green-500/5 rounded-lg p-3 transition-all duration-300 ${index === uniqueMessages.length - 1 && hasNewMessages
                          ? "bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30"
                          : "bg-gradient-to-r from-slate-800/30 to-slate-700/30 border border-slate-600/20"
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${msg.senderId === currentUser?.id
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                            : "bg-gradient-to-r from-green-500 to-teal-500 text-white"
                            }`}>
                            {msg.senderUsername.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-mono font-bold text-yellow-400">
                                {msg.senderUsername}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                              </span>
                              {msg.senderId === currentUser?.id && (
                                <span className="text-blue-400 text-xs">(YOU)</span>
                              )}
                            </div>
                            <TerminalLine
                              prefix={msg.senderId === currentUser?.id ? ">" : "<"}
                              type={msg.senderId === currentUser?.id ? "input" : "output"}
                              className="text-green-300 text-base"
                            >
                              {msg.content}
                            </TerminalLine>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button */}
              {(currentMessages.length > 10 || hasNewMessages) && (
                <Button
                  onClick={() => {
                    scrollToBottom()
                    setHasNewMessages(false)
                  }}
                  className={`fixed bottom-20 right-8 p-3 rounded-full shadow-lg z-50 transition-all duration-300 ${hasNewMessages
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black animate-pulse"
                    : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                    }`}
                  size="sm"
                >
                  <ArrowDown className="w-5 h-5" />
                  {hasNewMessages && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                      !
                    </span>
                  )}
                </Button>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-green-500/30 p-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex space-x-3 relative">
                <div className="flex-1 relative">
                  <div className="relative">
                    <TerminalLine prefix=">" type="input" className="mb-0">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={selectedUser ? "Type private message..." : "Type your message here..."}
                        className="bg-transparent border-none text-green-400 font-mono p-0 focus:ring-0 focus:outline-none pr-12 text-base"
                        disabled={!isConnected}
                      />
                    </TerminalLine>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <EmojiButton
                        onClick={handleEmojiPickerToggle}
                        isOpen={isEmojiPickerOpen}
                        emojiCount={emojiCount}
                      />
                    </div>
                  </div>
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    isOpen={isEmojiPickerOpen}
                    onToggle={handleEmojiPickerToggle}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!isConnected || !message.trim()}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-mono font-bold px-6 py-2 flex items-center space-x-2 flex-shrink-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>SEND</span>
                </Button>
              </form>
            </div>
          </Terminal>
        </div>
      </div>
    </div>
  )
}
