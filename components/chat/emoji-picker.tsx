"use client"

import React, { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Search } from "lucide-react"

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void
    isOpen: boolean
    onToggle: () => void
}

const EMOJI_CATEGORIES = {
    "😀": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚"],
    "🐱": ["🐱", "🐶", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆"],
    "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️"],
    "👍": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👌"],
    "🎉": ["🎉", "🎊", "🎈", "🎂", "🎁", "🎄", "🎃", "🎗️", "🎟️", "🎫", "🎠", "🎡", "🎢", "🎪", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼"],
    "⚡": ["⚡", "🔥", "💥", "💫", "⭐", "🌟", "✨", "💎", "💍", "💐", "🌷", "🌹", "🥀", "🌺", "🌻", "🌼", "🌸", "🌼", "🌻", "🌺"]
}

export function EmojiPicker({ onEmojiSelect, isOpen, onToggle }: EmojiPickerProps) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState("😀")
    const pickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onToggle()
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen, onToggle])

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onToggle()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen, onToggle])

    const filteredEmojis = React.useMemo(() => {
        if (!searchTerm) {
            return EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || []
        }

        const allEmojis = Object.values(EMOJI_CATEGORIES).flat()
        return allEmojis.filter(emoji =>
            emoji.includes(searchTerm) ||
            emoji.charCodeAt(0).toString(16).includes(searchTerm.toLowerCase())
        )
    }, [searchTerm, selectedCategory])

    if (!isOpen) return null

    return (
        <div className="absolute bottom-full right-0 mb-2 z-50">
            <div
                ref={pickerRef}
                className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-green-500/50 rounded-xl shadow-2xl p-4 w-80 max-h-96 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-green-400 font-mono font-bold text-sm">EMOJI_PICKER</h3>
                    <Button
                        onClick={onToggle}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-red-400 p-1"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search emojis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-green-400 font-mono text-sm focus:outline-none focus:border-green-500"
                    />
                </div>

                {/* Categories */}
                {!searchTerm && (
                    <div className="flex space-x-2 mb-4 overflow-x-auto">
                        {Object.keys(EMOJI_CATEGORIES).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${selectedCategory === category
                                    ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/50"
                                    : "bg-slate-700/50 border border-slate-600/30 hover:border-green-500/50"
                                    }`}
                            >
                                <span className="text-lg">{category}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Emojis Grid */}
                <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                    {filteredEmojis.map((emoji, index) => (
                        <button
                            key={`${emoji}-${index}`}
                            type="button"
                            onClick={() => onEmojiSelect(emoji)}
                            className="p-2 rounded-lg hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 hover:border hover:border-green-500/30 transition-all duration-300 text-2xl hover:scale-110"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-600/30">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Press ESC to close</span>
                        <span>{filteredEmojis.length} emojis</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function EmojiButton({ onClick, isOpen, emojiCount = 0 }: { onClick: () => void; isOpen: boolean; emojiCount?: number }) {
    return (
        <Button
            type="button"
            onClick={onClick}
            variant="outline"
            size="sm"
            className={`p-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-black font-mono relative ${isOpen ? "bg-green-500 text-black" : "bg-transparent"
                }`}
        >
            <Smile className="w-4 h-4" />
            {emojiCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {emojiCount}
                </span>
            )}
        </Button>
    )
} 